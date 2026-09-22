// Belohnungen der Lernwelten – ausschließlich über die zentrale Kette in progression.ts:
// creditXp vergibt XP für den Rang, Münzen und Material für die Stadt und Wissen für das Fach.
// Hier wird nur ausgerechnet, wie viel, und gemessen, was wirklich ankam.
import { BUILDINGS, unlockInfo, type BuildingDef } from '../city/catalog'
import { knowledgeLevel, levels, pointsOf } from '../knowledge'
import { creditXp } from '../progression'
import type { SaveData } from '../types'
import type { KursDef, Stufe } from './typen'

/** XP einer Aktivität bei voller Punktzahl auf Stufe 2 */
export const XP_AKTIVITAET = 60
/** Bonus für eine perfekte Session */
export const PERFEKT_BONUS = 60
/** Ab so vielen Punkten zählt eine Aktivität als geschafft (Combo) */
export const GESCHAFFT_AB = 0.7

export const modusVon = (kurs: string) => `kurs:${kurs}`

/**
 * XP einer Aktivität: Punkte mal Schwierigkeit, dazu ein kleiner Combo-Bonus.
 * „umfang“ ist der Anteil der gespielten Runden an den üblichen – eine kurze Aktivität
 * (im Random Mode oder wenn wenig Stoff offen ist) bringt entsprechend weniger.
 */
export function xpFuer(punkte: number, stufe: Stufe, combo: number, umfang = 1): number {
  const p = Math.max(0, Math.min(1, punkte))
  if (p <= 0) return 0
  const anteil = Math.max(0.4, Math.min(1, umfang))
  const basis = XP_AKTIVITAET * (0.8 + 0.1 * stufe) * p * anteil
  const bonus = p >= GESCHAFFT_AB ? Math.min(combo, 5) * 5 * anteil : 0
  return Math.round(basis + bonus)
}

export interface Wertung {
  titel: string
  emoji: string
  geschafft: boolean
}

/** Wie sich ein Ergebnis anfühlen soll – nie strafend */
export function wertung(punkte: number): Wertung {
  if (punkte >= 0.99) return { titel: 'Perfekt!', emoji: '🌟', geschafft: true }
  if (punkte >= 0.85) return { titel: 'Stark!', emoji: '💪', geschafft: true }
  if (punkte >= GESCHAFFT_AB) return { titel: 'Geschafft', emoji: '✅', geschafft: true }
  if (punkte >= 0.4) return { titel: 'Knapp daneben', emoji: '🙂', geschafft: false }
  return { titel: 'Das üben wir noch', emoji: '🌱', geschafft: false }
}

export interface Gutschrift {
  data: SaveData
  xp: number
  muenzen: number
  material: number
  wissen: number
}

/** XP über die zentrale Kette gutschreiben und messen, was davon in Stadt und Fach ankam */
export function gutschreiben(data: SaveData, xp: number, kurs: KursDef): Gutschrift {
  const menge = Math.max(0, Math.round(xp))
  if (menge === 0) return { data, xp: 0, muenzen: 0, material: 0, wissen: 0 }
  const vorher = { muenzen: data.city?.coins ?? 0, material: data.city?.materials ?? 0, wissen: pointsOf(data, kurs.domain) }
  const nachher = creditXp(data, menge, modusVon(kurs.id))
  return {
    data: nachher,
    xp: menge,
    muenzen: data.city ? (nachher.city?.coins ?? 0) - vorher.muenzen : 0,
    material: data.city ? (nachher.city?.materials ?? 0) - vorher.material : 0,
    wissen: pointsOf(nachher, kurs.domain) - vorher.wissen,
  }
}

/** Gebäude, die ein Wissensgebiet braucht – nach benötigter Stufe sortiert */
export function gebaeudeFuer(domain: string): { def: BuildingDef; stufe: number }[] {
  return BUILDINGS.flatMap((def) => {
    const need = def.needs?.find((n) => n.domain === domain)
    return need ? [{ def, stufe: need.level }] : []
  }).sort((a, b) => a.stufe - b.stufe)
}

/** Punkte, die man für eine Wissensstufe insgesamt braucht */
export function punkteFuerStufe(stufe: number): number {
  let summe = 0
  let need = 40
  for (let i = 0; i < stufe; i++) {
    summe += need
    need = Math.round(need * 1.4)
  }
  return summe
}

export interface StadtZiel {
  def: BuildingDef
  /** benötigte Wissensstufe */
  stufe: number
  /** 0 bis 1 */
  anteil: number
  fehlen: number
}

/** Das nächste Gebäude, auf das dieses Fach hinarbeitet */
export function naechstesStadtZiel(data: SaveData, kurs: KursDef): StadtZiel | null {
  const punkte = pointsOf(data, kurs.domain)
  const jetzt = knowledgeLevel(punkte).level
  const naechstes = gebaeudeFuer(kurs.domain).find((g) => g.stufe > jetzt)
  if (!naechstes) return null
  const ziel = punkteFuerStufe(naechstes.stufe)
  return { def: naechstes.def, stufe: naechstes.stufe, anteil: Math.min(1, punkte / ziel), fehlen: Math.max(0, ziel - punkte) }
}

/** Welche Gebäude durch neues Wissen frei geworden sind (Stadtstufe zählt hier nicht) */
export function neuFreigeschaltet(vorherPunkte: Record<string, number>, data: SaveData): string[] {
  const nachher = levels(data)
  const vorher: Record<string, number> = {}
  for (const [domain, punkte] of Object.entries(vorherPunkte)) vorher[domain] = knowledgeLevel(punkte).level
  const alle = { ...nachher, ...vorher }
  return BUILDINGS.filter((def) => {
    if (!def.needs?.length) return false
    const jetztOk = unlockInfo(def, 999, nachher).ok
    const frueherOk = unlockInfo(def, 999, alle).ok
    return jetztOk && !frueherOk
  }).map((def) => def.id)
}
