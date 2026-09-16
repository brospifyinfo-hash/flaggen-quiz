import type { ContinentId } from './data/countries'

// ---------- Flaggen-Reise (Kontinente, Übungsrunden, Abschlusstests) ----------

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
  round: string[]
  current: Question
  queue: string[]
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

// ---------- Spielmodi und Runs ----------

export interface QuestionOption {
  id: string
  label: string
}

/** Eingabe statt fester Antworten, z. B. der Zeitstrahl bei Geschichte */
export interface QuestionInput {
  kind: 'timeline'
  min: number
  max: number
}

/** Eine Frage aus einem beliebigen Spielmodus – muss als JSON speicherbar sein */
export interface ModeQuestion {
  modeId: string
  /** identifiziert die Frage für den Wiederholungsschutz, z. B. "flaggen:de" */
  key: string
  prompt: string
  /** Anzeigedaten des Modus, z. B. { code: 'de' } */
  data: Record<string, string>
  /** leer, wenn die Antwort über input kommt */
  options: QuestionOption[]
  correctId: string
  input?: QuestionInput
  /** true: nach einer richtigen Antwort direkt weiter (z. B. Higher or Lower) */
  quickNext?: boolean
}

/** Bewertung einer Antwort – Modi können eigene Punkte vergeben (Zeitstrahl) */
export interface Judgement {
  /** zählt als richtig für Combo, Trefferquote und Statistik */
  correct: boolean
  xp: number
  /** Überschrift in der Auflösung, z. B. „Volltreffer“ */
  headline: string
}

/** Ein laufender, endloser Run – entweder Random oder ein bestimmter Modus */
export interface Run {
  /** Modus-ID oder 'random' */
  mode: string
  /** Bestwerte des Modus beim Start – daran werden neue Rekorde gemessen */
  startRecords: RunRecords
  /** XP-Stand beim Start – daran wird ein Rangaufstieg gemessen */
  xpStart: number
  startedAt: number
  updatedAt: number
  answered: number
  correct: number
  xp: number
  combo: number
  bestCombo: number
  /** zuletzt gestellte Fragen und Modi, neueste zuerst */
  recentKeys: string[]
  recentModes: string[]
  masteryStart: number
  current: ModeQuestion & { picked: string | null }
  /** Bewertung der aktuellen Antwort, solange die Auflösung zu sehen ist */
  judged: Judgement | null
  /** in diesem Run freigeschaltete Achievements */
  earned: string[]
}

export interface RunRecords {
  combo: number
  xp: number
  questions: number
  accuracy: number
}

export interface RunResult {
  mode: string
  answered: number
  correct: number
  xp: number
  bestCombo: number
  masteryDelta: number
  achievements: string[]
  /** neue Rekorde: 'combo' | 'xp' | 'questions' | 'accuracy' */
  records: string[]
  /** ID des neuen Rangs, falls in diesem Run aufgestiegen */
  rankUp: string | null
  finishedAt: number
}

export interface ModeProgress {
  answered: number
  correct: number
  runs: number
  bestCombo: number
  bestXp: number
  bestQuestions: number
  /** nur ab 10 Fragen im Run */
  bestAccuracy: number
  lastPlayed: number
  /** modus-eigene Zusatzwerte, z. B. die Jahresabweichung bei Geschichte */
  extra?: Record<string, number>
}

// ---------- Navigation und Speicherstand ----------

export type Route =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'specific' }
  | { name: 'mode'; id: string }
  | { name: 'run' }
  | { name: 'runResult' }
  | { name: 'continent'; id: ContinentId }
  | { name: 'quiz'; id: ContinentId; mode: Mode }
  | { name: 'result'; id: ContinentId; mode: Mode }

export interface SaveData {
  version: 2
  /** Flaggen-Lernstand je Land */
  stats: Record<string, CountryStat>
  /** Kontinent-Reise der Flaggen */
  progress: Partial<Record<ContinentId, ContinentProgress>>
  sessions: Partial<Record<string, Session>>
  lastResult: RoundResult | null
  /** modusübergreifend */
  xp: number
  /** Statistiken je Modus, zusätzlich 'random' für die Random-Rekorde */
  modes: Record<string, ModeProgress>
  /** Achievement-ID → Zeitpunkt */
  achievements: Record<string, number>
  /** Lernstand je Modus und Thema, z. B. je Person */
  learn?: Record<string, Record<string, CountryStat>>
  run: Run | null
  lastRun: RunResult | null
  route: Route
  settings: { haptics: boolean }
  updatedAt: number
}
