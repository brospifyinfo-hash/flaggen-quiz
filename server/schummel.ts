/// <reference types="node" />
/**
 * Dieselben Schwellen wie SCHUMMEL_MUENZEN und SCHUMMEL_MATERIAL in src/city/state.ts.
 * Wer die Schattenkasse öffnet, liegt danach weit darüber – auch wenn schon etwas ausgegeben wurde.
 */
import { leseGaben } from './gaben'

const SCHUMMEL_MUENZEN = 10_000_000
const SCHUMMEL_MATERIAL = 500_000

function stadtVon(daten: unknown): Record<string, unknown> | null {
  if (!daten || typeof daten !== 'object') return null
  const stadt = (daten as Record<string, unknown>).city
  return stadt && typeof stadt === 'object' ? (stadt as Record<string, unknown>) : null
}

const zahl = (wert: unknown): number => (typeof wert === 'number' && Number.isFinite(wert) ? wert : 0)

function flag(daten: unknown): boolean {
  if (!daten || typeof daten !== 'object') return false
  const roh = daten as Record<string, unknown>
  const stadt = stadtVon(daten)
  return roh.schummel === true || stadt?.schummel === true
}

/** Eigene Kasse, ohne das, was die Verwaltung gutgeschrieben hat */
function saldo(daten: unknown): boolean {
  const stadt = stadtVon(daten)
  if (!stadt || !daten || typeof daten !== 'object') return false
  const gaben = leseGaben((daten as Record<string, unknown>).gaben)
  const muenzen = Math.max(0, zahl(stadt.coins) - gaben.muenzen)
  const ziegel = Math.max(0, zahl(stadt.materials) - gaben.ziegel)
  return muenzen >= SCHUMMEL_MUENZEN || ziegel >= SCHUMMEL_MATERIAL
}

/** Rohdaten, wie sie im Konto liegen – ohne sie noch einmal durch den Client zu schicken */
export function rohSchummelt(daten: unknown): boolean {
  return saldo(daten) || flag(daten)
}

function markierungWeg(daten: unknown): unknown {
  if (!daten || typeof daten !== 'object') return daten
  const obj: Record<string, unknown> = { ...(daten as Record<string, unknown>) }
  delete obj.schummel
  const stadt = stadtVon(obj)
  if (stadt) {
    const ohne = { ...stadt }
    delete ohne.schummel
    obj.city = ohne
  }
  return obj
}

/**
 * Einmal Schattenkasse, immer Schattenkasse: der nächste Stand vom Gerät
 * kann die Markierung nicht wieder löschen. Eine Gutschrift der Verwaltung setzt sie nicht.
 */
export function schummelSichern(daten: unknown, bisher: unknown): unknown {
  const bleibt = saldo(daten) || saldo(bisher) || flag(bisher)
  if (!bleibt) return markierungWeg(daten)
  if (!daten || typeof daten !== 'object') return daten
  const obj: Record<string, unknown> = { ...(daten as Record<string, unknown>), schummel: true }
  const stadt = stadtVon(obj)
  if (stadt) obj.city = { ...stadt, schummel: true }
  return obj
}
