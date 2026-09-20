// Zufall mit Samen: Jede Session hat eine Zahl, aus der alles Weitere folgt. So lässt sich
// jede Auswahl nachstellen, wenn etwas seltsam aussieht – und Tests sind wiederholbar.
import type { Rng } from './typen'

/** mulberry32 – klein, schnell und gut genug für Spiele */
export function zufall(samen: number): Rng {
  let a = samen >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Ein frischer Samen – aus Zeit und Zufall */
export const neuerSamen = (): number => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0

/** Ein abgeleiteter Samen, z. B. für die dritte Aktivität einer Session */
export function ableiten(samen: number, nr: number): number {
  let h = (samen ^ Math.imul(nr + 1, 0x9e3779b1)) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
  return (h ^ (h >>> 16)) >>> 0
}

export function waehle<T>(rng: Rng, liste: readonly T[]): T {
  return liste[Math.min(liste.length - 1, Math.floor(rng() * liste.length))]
}

/** Gewichtete Auswahl; null, wenn alle Gewichte 0 sind */
export function gewichtet<T>(rng: Rng, liste: readonly T[], gewichte: readonly number[]): T | null {
  let summe = 0
  for (const g of gewichte) summe += Math.max(0, g)
  if (summe <= 0) return null
  let los = rng() * summe
  for (let i = 0; i < liste.length; i++) {
    los -= Math.max(0, gewichte[i])
    if (los <= 0 && gewichte[i] > 0) return liste[i]
  }
  for (let i = liste.length - 1; i >= 0; i--) if (gewichte[i] > 0) return liste[i]
  return null
}

export function mische<T>(rng: Rng, liste: readonly T[]): T[] {
  const kopie = [...liste]
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[kopie[i], kopie[j]] = [kopie[j], kopie[i]]
  }
  return kopie
}

/** Ganze Zahl von bis (beide eingeschlossen) */
export const zwischen = (rng: Rng, von: number, bis: number): number => von + Math.floor(rng() * (bis - von + 1))
