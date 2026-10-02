// Ampeln. Nur an Kreuzungen doppelspuriger Straßen, nicht an jeder Kurve und nicht
// an schmalen Straßen. Sie schaltet nach einer festen Uhr: erst hat die
// Nord-Süd-Richtung Grün, dann kurz Gelb, dann Ost-West. Jede Kreuzung hat ihren
// eigenen Versatz, damit nicht alle im Gleichtakt springen.
import { roadDef } from './catalog'
import { tileNoise } from './iso'
import { roadAt } from './state'
import type { CityState } from './types'

export type AmpelFarbe = 'gruen' | 'gelb' | 'rot'

/** Sekunden je vollem Umlauf */
export const AMPEL_TAKT = 16
const GRUEN = 6.6
const GELB = 1.1
const RAEUMEN = 0.3

/** Wo ein wartendes Auto auf dem Weg in die Kreuzung anhält: Anteil der Strecke bis zur Kachelmitte */
export const HALTELINIE = 0.24

const fahrbahn = (city: CityState, x: number, y: number): boolean => {
  const art = roadAt(city, x, y)
  return !!art && art !== 'weg'
}

/** Anzahl der Straßenarme an dieser Kachel */
export function arme(city: CityState, x: number, y: number): { n: boolean; o: boolean; s: boolean; w: boolean; zahl: number } {
  const n = fahrbahn(city, x, y - 1)
  const o = fahrbahn(city, x + 1, y)
  const s = fahrbahn(city, x, y + 1)
  const w = fahrbahn(city, x - 1, y)
  return { n, o, s, w, zahl: +n + +o + +s + +w }
}

const doppelspurig = (city: CityState, x: number, y: number): boolean => (roadDef(roadAt(city, x, y) ?? '')?.spuren ?? 1) >= 2

/** Steht hier eine Ampel? Nur eine doppelspurige Kreuzung, keine Kurve und keine schmale Straße. */
export function istKreuzung(city: CityState, x: number, y: number): boolean {
  if (!doppelspurig(city, x, y)) return false
  return arme(city, x, y).zahl >= 3
}

/** Schaltbild einer Kreuzung zur Uhrzeit `uhr` (Sekunden) */
export function ampelPhase(x: number, y: number, uhr: number): { ns: AmpelFarbe; ow: AmpelFarbe } {
  const versatz = tileNoise(x * 7 + 3, y * 13 + 5) * AMPEL_TAKT
  const t = (((uhr + versatz) % AMPEL_TAKT) + AMPEL_TAKT) % AMPEL_TAKT
  const halb = AMPEL_TAKT / 2
  const phase = (u: number): AmpelFarbe => (u < GRUEN ? 'gruen' : u < GRUEN + GELB ? 'gelb' : 'rot')
  if (t < halb) return { ns: phase(t), ow: 'rot' }
  return { ns: 'rot', ow: phase(t - halb) }
}

/** Die Farbe, die ein Fahrzeug mit dieser Fahrtrichtung an der Kreuzung sieht */
export function ampelFuer(x: number, y: number, rx: number, ry: number, uhr: number): AmpelFarbe {
  const p = ampelPhase(x, y, uhr)
  return Math.abs(rx) > Math.abs(ry) ? p.ow : p.ns
}

export { RAEUMEN }
