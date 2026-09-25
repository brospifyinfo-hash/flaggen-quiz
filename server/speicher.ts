/// <reference types="node" />
/**
 * Wo Konten und Spielstände liegen. Zwei Ablagen:
 *  - GitHub: ein privates Repository, angesprochen über die Contents-API
 *    (KONTO_GITHUB_TOKEN und KONTO_GITHUB_REPO, z. B. „name/weltwissen-konten“)
 *  - Datei: ein Ordner auf der Platte – nur für die Entwicklung (KONTO_ORDNER, sonst .konto-daten)
 *
 * Jede Ablage speichert Text unter einem Pfad. Eine „Marke“ (bei GitHub der Blob-SHA)
 * schützt davor, einen zwischenzeitlich geänderten Stand blind zu überschreiben.
 */
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, normalize } from 'node:path'

export interface Gelesen {
  inhalt: string
  marke?: string
}

export interface Speicher {
  art: 'github' | 'datei'
  lesen(pfad: string): Promise<Gelesen | null>
  /** Schreibt und liefert die neue Marke */
  schreiben(pfad: string, inhalt: string, marke?: string): Promise<string | undefined>
  /** Dateinamen in einem Ordner, ohne den Ordner selbst zu verlassen */
  liste(ordner: string): Promise<string[]>
  /** Entfernt eine Datei. Fehlt sie schon, ist das in Ordnung. */
  loeschen(pfad: string, marke?: string): Promise<void>
}

export class KonfliktFehler extends Error {
  constructor() {
    super('Die Datei wurde zwischenzeitlich geändert.')
  }
}

function pruefePfad(pfad: string): string {
  const sauber = normalize(pfad).replace(/\\/g, '/')
  if (sauber.startsWith('/') || sauber.includes('..')) throw new Error(`Ungültiger Pfad: ${pfad}`)
  return sauber
}

// ---------- GitHub ----------

function githubSpeicher(token: string, repo: string): Speicher {
  const basis = `https://api.github.com/repos/${repo}/contents/`
  const kopf = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'weltwissen-konten',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  return {
    art: 'github',
    async lesen(pfad) {
      const antwort = await fetch(basis + pruefePfad(pfad), { headers: kopf, cache: 'no-store' })
      if (antwort.status === 404) return null
      if (!antwort.ok) throw new Error(`GitHub lesen: ${antwort.status}`)
      const json = (await antwort.json()) as { content?: string; sha?: string; encoding?: string }
      if (typeof json.content !== 'string') throw new Error('GitHub lesen: kein Inhalt')
      const inhalt = Buffer.from(json.content.replace(/\n/g, ''), 'base64').toString('utf8')
      return { inhalt, marke: json.sha }
    },
    async schreiben(pfad, inhalt, marke) {
      const sauber = pruefePfad(pfad)
      const versuch = async (sha?: string) =>
        fetch(basis + sauber, {
          method: 'PUT',
          headers: { ...kopf, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Stand ${sauber}`,
            content: Buffer.from(inhalt, 'utf8').toString('base64'),
            ...(sha ? { sha } : {}),
          }),
        })
      let antwort = await versuch(marke)
      if (antwort.status === 409 || antwort.status === 422) {
        // Jemand war schneller – die aktuelle Marke holen und noch einmal
        const jetzt = await this.lesen(sauber)
        if (jetzt && jetzt.marke !== marke) throw new KonfliktFehler()
        antwort = await versuch(jetzt?.marke)
      }
      if (!antwort.ok) throw new Error(`GitHub schreiben: ${antwort.status} ${(await antwort.text()).slice(0, 200)}`)
      const json = (await antwort.json()) as { content?: { sha?: string } }
      return json.content?.sha
    },
    async liste(ordner) {
      const antwort = await fetch(basis + pruefePfad(ordner), { headers: kopf, cache: 'no-store' })
      if (antwort.status === 404) return []
      if (!antwort.ok) throw new Error(`GitHub auflisten: ${antwort.status}`)
      const json = (await antwort.json()) as { name?: string; type?: string }[] | { message?: string }
      if (!Array.isArray(json)) return []
      return json.filter((eintrag) => eintrag.type === 'file' && typeof eintrag.name === 'string').map((eintrag) => eintrag.name as string)
    },
    async loeschen(pfad, marke) {
      const sauber = pruefePfad(pfad)
      let sha = marke
      if (!sha) {
        const da = await this.lesen(sauber)
        if (!da?.marke) return
        sha = da.marke
      }
      const antwort = await fetch(basis + sauber, {
        method: 'DELETE',
        headers: { ...kopf, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Schließen ${sauber}`, sha }),
      })
      if (antwort.status === 404) return
      if (antwort.status === 409 || antwort.status === 422) throw new KonfliktFehler()
      if (!antwort.ok) throw new Error(`GitHub löschen: ${antwort.status}`)
    },
  }
}

// ---------- Datei ----------

function dateiSpeicher(ordner: string): Speicher {
  return {
    art: 'datei',
    async lesen(pfad) {
      try {
        const inhalt = await readFile(join(ordner, pruefePfad(pfad)), 'utf8')
        return { inhalt }
      } catch (fehler) {
        if ((fehler as NodeJS.ErrnoException).code === 'ENOENT') return null
        throw fehler
      }
    },
    async schreiben(pfad, inhalt) {
      const ziel = join(ordner, pruefePfad(pfad))
      await mkdir(dirname(ziel), { recursive: true })
      await writeFile(ziel, inhalt, 'utf8')
      return undefined
    },
    async liste(ordnerName) {
      try {
        const namen = await readdir(join(ordner, pruefePfad(ordnerName)))
        return namen.filter((name) => name.endsWith('.json'))
      } catch (fehler) {
        if ((fehler as NodeJS.ErrnoException).code === 'ENOENT') return []
        throw fehler
      }
    },
    async loeschen(pfad) {
      try {
        await unlink(join(ordner, pruefePfad(pfad)))
      } catch (fehler) {
        if ((fehler as NodeJS.ErrnoException).code !== 'ENOENT') throw fehler
      }
    },
  }
}

// ---------- Auswahl ----------

let gewaehlt: Speicher | null | undefined

/** Die eingerichtete Ablage – null, wenn keine da ist */
export function speicher(): Speicher | null {
  if (gewaehlt !== undefined) return gewaehlt
  const token = process.env.KONTO_GITHUB_TOKEN
  const repo = process.env.KONTO_GITHUB_REPO
  if (token && repo) gewaehlt = githubSpeicher(token, repo)
  else if (process.env.KONTO_ORDNER || process.env.NODE_ENV !== 'production') {
    gewaehlt = dateiSpeicher(process.env.KONTO_ORDNER ?? join(process.cwd(), '.konto-daten'))
  } else gewaehlt = null
  return gewaehlt
}
