// Wissensgebiete: Jedes Spiel zahlt auf ein Fach ein. Aus den Fächern entstehen
// Freischaltungen in der Stadt – wer viel Geschichte spielt, bekommt ein Museum.
import type { SaveData } from './types'

export interface Domain {
  id: string
  name: string
  emoji: string
  /** Spielmodi, die auf dieses Fach einzahlen */
  modes: string[]
  color: string
}

export const DOMAINS: Domain[] = [
  { id: 'geografie', name: 'Geografie', emoji: '🌍', modes: ['flaggen', 'weltkarte'], color: '#2f9e5c' },
  { id: 'geschichte', name: 'Geschichte', emoji: '🏛️', modes: ['geschichte'], color: '#b9773f' },
  { id: 'menschen', name: 'Menschen', emoji: '👤', modes: ['personen'], color: '#a763c4' },
  { id: 'mathe', name: 'Zahlen', emoji: '🧮', modes: ['mathRunner', 'higher-lower'], color: '#3f8fd0' },
]

const BY_MODE = new Map<string, Domain>()
for (const domain of DOMAINS) {
  for (const mode of domain.modes) BY_MODE.set(mode, domain)
}

export const domainOfMode = (modeId: string): Domain | undefined => BY_MODE.get(modeId)
export const domainById = (id: string): Domain | undefined => DOMAINS.find((entry) => entry.id === id)

/** Stufe 1 ab 40 Punkten, danach kostet jede Stufe 40 Prozent mehr */
export function knowledgeLevel(points: number): { level: number; into: number; need: number } {
  let level = 0
  let need = 40
  let rest = Math.max(0, Math.floor(points))
  while (rest >= need && level < 40) {
    rest -= need
    level += 1
    need = Math.round(need * 1.4)
  }
  return { level, into: rest, need }
}

export const pointsOf = (data: SaveData, domainId: string): number => data.knowledge?.[domainId] ?? 0
export const levelOf = (data: SaveData, domainId: string): number => knowledgeLevel(pointsOf(data, domainId)).level

/** Alle Stufen auf einen Blick – so brauchen Prüfungen nur eine Karte */
export function levels(data: SaveData): Record<string, number> {
  const map: Record<string, number> = {}
  for (const domain of DOMAINS) map[domain.id] = levelOf(data, domain.id)
  return map
}

/** Wissen aus einer richtigen Antwort. Der Modus bestimmt das Fach. */
export function addKnowledge(data: SaveData, modeId: string | undefined, xp: number): SaveData {
  if (!modeId) return data
  const domain = domainOfMode(modeId)
  if (!domain) return data
  const gain = Math.max(1, Math.round(xp / 3))
  return {
    ...data,
    knowledge: { ...data.knowledge, [domain.id]: pointsOf(data, domain.id) + gain },
  }
}

/** Das Fach, in dem am meisten gelernt wurde – prägt den Charakter der Stadt */
export function strongest(data: SaveData): Domain | null {
  let best: Domain | null = null
  let most = 0
  for (const domain of DOMAINS) {
    const points = pointsOf(data, domain.id)
    if (points > most) {
      most = points
      best = domain
    }
  }
  return best
}
