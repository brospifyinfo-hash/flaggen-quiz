/// <reference types="node" />
/**
 * Alle Konten und die öffentliche Rangliste.
 * Oben steht, wer die meisten Einwohner hat. Wer die Schattenkasse benutzt hat, fehlt dort.
 */
import { ADMIN_EMAIL } from '../src/admin'
import { Abgelehnt, normEmail, pruefeToken } from './konto'
import { speicher } from './speicher'

/** Dieselben Schwellen wie CHEAT_MUENZEN und CHEAT_MATERIAL in src/city/state.ts */
const CHEAT_MUENZEN = 100_000_000
const CHEAT_MATERIAL = 5_000_000

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
  const muenzen = stadt ? Math.max(0, Math.floor(zahl(stadt.coins))) : 0
  const ziegel = stadt ? Math.max(0, Math.floor(zahl(stadt.materials))) : 0
  const schummel = roh.schummel === true || stadt?.schummel === true || muenzen >= CHEAT_MUENZEN || ziegel >= CHEAT_MATERIAL
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

/** Alle Konten mit ihrem Spielstand – nur für das Verwaltungskonto */
export async function verwaltung(eingabe: Record<string, unknown>): Promise<{ konten: KontoZeile[]; spieler: RanglisteEintrag[] }> {
  await adminVon(eingabe.token)
  const konten = await zeilen(true)
  return {
    konten,
    spieler: konten.filter((zeile) => !zeile.schummel && zeile.stadtLevel > 0).slice(0, 5).map(oeffentlich),
  }
}
