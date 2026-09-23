/// <reference types="node" />
/**
 * Dieselben Schwellen wie SCHUMMEL_MUENZEN und SCHUMMEL_MATERIAL in src/city/state.ts.
 * Wer die Schattenkasse öffnet, liegt danach weit darüber – auch wenn schon etwas ausgegeben wurde.
 */
const SCHUMMEL_MUENZEN = 10_000_000
const SCHUMMEL_MATERIAL = 500_000

function stadtVon(daten: unknown): Record<string, unknown> | null {
  if (!daten || typeof daten !== 'object') return null
  const stadt = (daten as Record<string, unknown>).city
  return stadt && typeof stadt === 'object' ? (stadt as Record<string, unknown>) : null
}

const zahl = (wert: unknown): number => (typeof wert === 'number' && Number.isFinite(wert) ? wert : 0)

/** Rohdaten, wie sie im Konto liegen – ohne sie noch einmal durch den Client zu schicken */
export function rohSchummelt(daten: unknown): boolean {
  if (!daten || typeof daten !== 'object') return false
  const roh = daten as Record<string, unknown>
  const stadt = stadtVon(daten)
  if (roh.schummel === true || stadt?.schummel === true) return true
  return zahl(stadt?.coins) >= SCHUMMEL_MUENZEN || zahl(stadt?.materials) >= SCHUMMEL_MATERIAL
}

/**
 * Einmal Schattenkasse, immer Schattenkasse: der nächste Stand vom Gerät
 * kann die Markierung nicht wieder löschen.
 */
export function schummelSichern(daten: unknown, bisher: unknown): unknown {
  if (!rohSchummelt(daten) && !rohSchummelt(bisher)) return daten
  if (!daten || typeof daten !== 'object') return daten
  const obj: Record<string, unknown> = { ...(daten as Record<string, unknown>), schummel: true }
  const stadt = stadtVon(obj)
  if (stadt) obj.city = { ...stadt, schummel: true }
  return obj
}
