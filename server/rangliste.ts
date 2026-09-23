/// <reference types="node" />
/**
 * Alle Konten und die öffentliche Rangliste.
 * Oben steht, wer die meisten Einwohner hat. Wer die Schattenkasse benutzt hat, fehlt dort.
 */
import { ADMIN_EMAIL } from '../src/admin'
import { gabenAuffuellen, leseGaben, type Gaben } from './gaben'
import { Abgelehnt, normEmail, pruefeToken } from './konto'
import { rohSchummelt } from './schummel'
import { KonfliktFehler, speicher } from './speicher'

const RAENGE: { id: string; from: number }[] = [
  { id: 'holz', from: 0 },
  { id: 'bronze', from: 750 },
  { id: 'silber', from: 3000 },
  { id: 'gold', from: 10000 },
  { id: 'platin', from: 25000 },
  { id: 'diamant', from: 60000 },
  { id: 'champion', from: 150000 },
]

export interface RanglisteEintrag {
  name: string
  rangId: string
  level: number
  stadt: string
  stadtLevel: number
  einwohner: number
}

export interface KontoZeile extends RanglisteEintrag {
  email: string
  xp: number
  muenzen: number
  ziegel: number
  gebaeude: number
  schummel: boolean
  stand: number
}

const levelAus = (xp: number): number => {
  let level = 1
  let needed = 100
  let rest = Math.max(0, Math.floor(xp))
  while (rest >= needed) {
    rest -= needed
    level += 1
    needed += 100
  }
  return level
}

const rangAus = (xp: number): string => {
  let id = RAENGE[0].id
  for (const rang of RAENGE) if (xp >= rang.from) id = rang.id
  return id
}

const zahl = (wert: unknown): number => (typeof wert === 'number' && Number.isFinite(wert) ? wert : 0)

function zeileAus(email: string, name: string, stand: number, daten: unknown): KontoZeile {
  const roh = daten && typeof daten === 'object' ? (daten as Record<string, unknown>) : {}
  const stadt = roh.city && typeof roh.city === 'object' ? (roh.city as Record<string, unknown>) : null
  const xp = Math.max(0, Math.floor(zahl(roh.xp)))
  const kasse = roh.stadtkasse && typeof roh.stadtkasse === 'object' ? (roh.stadtkasse as Record<string, unknown>) : null
  const muenzen = stadt ? Math.max(0, Math.floor(zahl(stadt.coins))) : Math.max(0, Math.floor(zahl(kasse?.coins)))
  const ziegel = stadt ? Math.max(0, Math.floor(zahl(stadt.materials))) : Math.max(0, Math.floor(zahl(kasse?.materials)))
  const schummel = rohSchummelt(roh)
  const stadtName = stadt && typeof stadt.name === 'string' ? stadt.name : ''
  const spieler = name.trim() || stadtName || 'Unbekannt'
  return {
    name: spieler.slice(0, 30),
    email,
    rangId: rangAus(xp),
    level: levelAus(xp),
    stadt: stadtName,
    stadtLevel: stadt ? Math.max(1, Math.floor(zahl(stadt.level))) : 0,
    einwohner: stadt ? Math.max(0, Math.floor(zahl(stadt.population))) : 0,
    xp,
    muenzen,
    ziegel,
    gebaeude: stadt && Array.isArray(stadt.buildings) ? stadt.buildings.length : 0,
    schummel,
    stand,
  }
}

async function alleZeilen(): Promise<KontoZeile[]> {
  const ablage = speicher()
  if (!ablage) throw new Abgelehnt(503, 'Auf dem Server ist noch kein Speicher für Konten eingerichtet.')
  const dateien = await ablage.liste('konten')
  const zeilen: KontoZeile[] = []
  for (const datei of dateien) {
    if (!datei.endsWith('.json')) continue
    const kontoDatei = await ablage.lesen(`konten/${datei}`)
    if (!kontoDatei) continue
    let konto: { id?: string; email?: string; name?: string }
    try {
      konto = JSON.parse(kontoDatei.inhalt) as { id?: string; email?: string; name?: string }
    } catch {
      continue
    }
    if (!konto.id || !konto.email) continue
    const datenDatei = await ablage.lesen(`daten/${konto.id}.json`)
    let stand = 0
    let daten: unknown = null
    if (datenDatei) {
      try {
        const abgelegt = JSON.parse(datenDatei.inhalt) as { stand?: number; daten?: unknown }
        stand = zahl(abgelegt.stand)
        daten = abgelegt.daten ?? null
      } catch {
        daten = null
      }
    }
    zeilen.push(zeileAus(konto.email, typeof konto.name === 'string' ? konto.name : '', stand, daten))
  }
  zeilen.sort((a, b) => b.einwohner - a.einwohner || b.stadtLevel - a.stadtLevel || b.xp - a.xp || a.name.localeCompare(b.name, 'de'))
  return zeilen
}

let cache: { bis: number; zeilen: KontoZeile[] } | null = null
const CACHE_MS = 20_000

async function zeilen(frisch: boolean): Promise<KontoZeile[]> {
  if (!frisch && cache && cache.bis > Date.now()) return cache.zeilen
  const zeilen = await alleZeilen()
  cache = { bis: Date.now() + CACHE_MS, zeilen }
  return zeilen
}

const oeffentlich = (zeile: KontoZeile): RanglisteEintrag => ({
  name: zeile.name,
  rangId: zeile.rangId,
  level: zeile.level,
  stadt: zeile.stadt,
  stadtLevel: zeile.stadtLevel,
  einwohner: zeile.einwohner,
})

/** Die fünf Städte mit den meisten Einwohnern, ohne Schattenkasse */
export async function rangliste(_eingabe?: Record<string, unknown>): Promise<{ spieler: RanglisteEintrag[] }> {
  const alle = await zeilen(false)
  return { spieler: alle.filter((zeile) => !zeile.schummel && zeile.stadtLevel > 0).slice(0, 5).map(oeffentlich) }
}

async function adminVon(token: unknown): Promise<void> {
  const id = pruefeToken(token)
  const ablage = speicher()
  if (!ablage) throw new Abgelehnt(503, 'Auf dem Server ist noch kein Speicher für Konten eingerichtet.')
  const dateien = await ablage.liste('konten')
  for (const datei of dateien) {
    const gelesen = await ablage.lesen(`konten/${datei}`)
    if (!gelesen) continue
    try {
      const konto = JSON.parse(gelesen.inhalt) as { id?: string; email?: string }
      if (konto.id === id) {
        if (normEmail(konto.email ?? '') !== ADMIN_EMAIL) throw new Abgelehnt(403, 'Dieser Bereich ist nur für die Verwaltung.')
        return
      }
    } catch (fehler) {
      if (fehler instanceof Abgelehnt) throw fehler
    }
  }
  throw new Abgelehnt(403, 'Dieser Bereich ist nur für die Verwaltung.')
}

const DECKEL = Number.MAX_SAFE_INTEGER

function betrag(wert: unknown, name: string): number {
  if (wert === undefined || wert === null || wert === '') return 0
  const n = typeof wert === 'number' ? wert : typeof wert === 'string' ? Number(wert.trim()) : NaN
  if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
    throw new Abgelehnt(400, `${name} muss eine ganze Zahl ab 0 sein.`)
  }
  if (n > DECKEL) throw new Abgelehnt(400, `${name} ist zu groß.`)
  return n
}

async function kontoZuEmail(email: string): Promise<{ id: string; name: string } | null> {
  const ablage = speicher()
  if (!ablage) throw new Abgelehnt(503, 'Auf dem Server ist noch kein Speicher für Konten eingerichtet.')
  const ziel = normEmail(email)
  const dateien = await ablage.liste('konten')
  for (const datei of dateien) {
    const gelesen = await ablage.lesen(`konten/${datei}`)
    if (!gelesen) continue
    try {
      const konto = JSON.parse(gelesen.inhalt) as { id?: string; email?: string; name?: string }
      if (konto.id && normEmail(konto.email ?? '') === ziel) {
        return { id: konto.id, name: typeof konto.name === 'string' && konto.name.trim() ? konto.name.trim() : ziel }
      }
    } catch {
      continue
    }
  }
  return null
}

/** Münzen und Steine auf ein Konto oder auf alle. Die Schattenkasse bleibt davon unberührt. */
export async function gutschrift(
  eingabe: Record<string, unknown>,
): Promise<{ anzahl: number; muenzen: number; ziegel: number; name?: string }> {
  await adminVon(eingabe.token)
  const muenzen = betrag(eingabe.muenzen, 'Münzen')
  const ziegel = betrag(eingabe.ziegel, 'Steine')
  if (muenzen === 0 && ziegel === 0) throw new Abgelehnt(400, 'Gib an, wie viele Münzen oder Steine dazukommen.')

  const ablage = speicher()
  if (!ablage) throw new Abgelehnt(503, 'Auf dem Server ist noch kein Speicher für Konten eingerichtet.')

  if (typeof eingabe.email === 'string' && eingabe.email.trim()) {
    const konto = await kontoZuEmail(eingabe.email)
    if (!konto) throw new Abgelehnt(404, 'Dieses Konto gibt es nicht.')
    await gutschriftAuf(konto.id, { muenzen, ziegel })
    cache = null
    return { anzahl: 1, muenzen, ziegel, name: konto.name }
  }

  const dateien = await ablage.liste('konten')
  let anzahl = 0
  for (const datei of dateien) {
    if (!datei.endsWith('.json')) continue
    const kontoDatei = await ablage.lesen(`konten/${datei}`)
    if (!kontoDatei) continue
    let id = ''
    try {
      id = (JSON.parse(kontoDatei.inhalt) as { id?: string }).id ?? ''
    } catch {
      continue
    }
    if (!id) continue
    await gutschriftAuf(id, { muenzen, ziegel })
    anzahl += 1
  }
  cache = null
  return { anzahl, muenzen, ziegel }
}

async function gutschriftAuf(id: string, dazu: Gaben): Promise<void> {
  const ablage = speicher()
  if (!ablage) throw new Abgelehnt(503, 'Auf dem Server ist noch kein Speicher für Konten eingerichtet.')
  for (let versuch = 0; versuch < 2; versuch++) {
    const gelesen = await ablage.lesen(`daten/${id}.json`)
    let stand = 0
    let daten: unknown = { version: 2 }
    let bisher: Gaben = { muenzen: 0, ziegel: 0 }
    if (gelesen) {
      try {
        const roh = JSON.parse(gelesen.inhalt) as { stand?: number; daten?: unknown; gaben?: unknown }
        stand = zahl(roh.stand)
        daten = roh.daten && typeof roh.daten === 'object' ? roh.daten : { version: 2 }
        bisher = leseGaben(roh.gaben ?? (daten as { gaben?: unknown }).gaben)
      } catch {
        daten = { version: 2 }
      }
    }
    const soll: Gaben = {
      muenzen: Math.min(DECKEL, bisher.muenzen + dazu.muenzen),
      ziegel: Math.min(DECKEL, bisher.ziegel + dazu.ziegel),
    }
    const neu = gabenAuffuellen(daten, soll)
    const inhalt = {
      stand: Math.max(Date.now(), stand + 1),
      gespeichert: Date.now(),
      daten: neu,
      gaben: soll,
    }
    try {
      await ablage.schreiben(`daten/${id}.json`, JSON.stringify(inhalt), gelesen?.marke)
      return
    } catch (fehler) {
      if (!(fehler instanceof KonfliktFehler) || versuch === 1) throw fehler
    }
  }
}

/** Alle Konten mit ihrem Spielstand – nur für das Verwaltungskonto */
export async function verwaltung(eingabe: Record<string, unknown>): Promise<{ konten: KontoZeile[]; spieler: RanglisteEintrag[] }> {
  await adminVon(eingabe.token)
  const konten = await zeilen(true)
  return {
    konten,
    spieler: konten.filter((zeile) => !zeile.schummel && zeile.stadtLevel > 0).slice(0, 5).map(oeffentlich),
  }
}
