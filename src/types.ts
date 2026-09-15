import type { ContinentId } from './data/countries'

export type Mode = 'practice' | 'test'

/** Lernstand einer einzelnen Flagge */
export interface CountryStat {
  seen: number
  right: number
  wrong: number
  /** richtige Antworten in Folge */
  streak: number
  lastWrong: boolean
  lastSeen: number
}

export interface Question {
  code: string
  /** vier Ländercodes in Anzeige-Reihenfolge – bleiben beim Neuladen gleich */
  options: string[]
  picked: string | null
}

export interface Mistake {
  code: string
  picked: string
}

/** Eine laufende Übungsrunde oder ein laufender Abschlusstest */
export interface Session {
  mode: Mode
  continent: ContinentId
  /** alle Länder dieser Runde */
  round: string[]
  current: Question
  /** offene Fragen nach der aktuellen */
  queue: string[]
  /** Länder, die in dieser Runde schon richtig beantwortet wurden */
  done: string[]
  mistakes: Mistake[]
  answered: number
  testWasUnlocked: boolean
  startedAt: number
  updatedAt: number
}

export interface ContinentProgress {
  rounds: number
  tests: number
  bestTest: number
  passed: boolean
  passedAt: number | null
}

export interface RoundResult {
  mode: Mode
  continent: ContinentId
  total: number
  /** Übung: beim ersten Versuch richtig · Test: richtig beantwortet */
  correct: number
  mistakes: Mistake[]
  testUnlocked: boolean
  passed: boolean
  unlockedContinent: ContinentId | null
  finishedAt: number
}

export type Route =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'continent'; id: ContinentId }
  | { name: 'quiz'; id: ContinentId; mode: Mode }
  | { name: 'result'; id: ContinentId; mode: Mode }

export interface SaveData {
  version: 1
  stats: Record<string, CountryStat>
  progress: Partial<Record<ContinentId, ContinentProgress>>
  /** Schlüssel: `${kontinent}:${modus}` */
  sessions: Partial<Record<string, Session>>
  lastResult: RoundResult | null
  route: Route
  settings: { haptics: boolean }
  updatedAt: number
}
