import type { CityState } from './city/types'
import type { ContinentId } from './data/countries'
import type { LernStand } from './lernen/typen'

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

/** Zeitstrahl: die Antwort ist eine Jahreszahl zwischen min und max */
export interface TimelineInput {
  kind: 'timeline'
  min: number
  max: number
}

/** Karte: die Antwort ist ein Punkt. view ist der Ausschnitt als SVG-viewBox. */
export interface MapInput {
  kind: 'map'
  view: string
}

/** Lernwelten: eine ganze Mini-Aktivität (Aktivitaet als JSON). Antwort ist das Ergebnis als JSON. */
export interface ActivityInput {
  kind: 'aktivitaet'
  daten: string
}

/** Eingabe statt fester Antworten, z. B. der Zeitstrahl bei Geschichte */
export type QuestionInput = TimelineInput | MapInput | ActivityInput

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
  /** Der Perfektlauf-Jackpot wurde in diesem Run schon ausgezahlt */
  perfekt?: boolean
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
  /** Perfektlauf geschafft: Münzen und Material aus dem Jackpot */
  perfekt?: { coins: number; materials: number }
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

// ---------- Math Runner ----------

/** Bestleistungen des Math Runners – bleiben auf dem Gerät */
export interface MathRunnerStats {
  /** höchster Punktestand, der je erreicht wurde */
  highScore: number
  bestCombo: number
  /** längster Lauf in Sekunden */
  bestTime: number
  /** höchste erreichte Schwierigkeitsstufe */
  bestStage: number
  runs: number
  correct: number
  wrong: number
}

// ---------- Navigation und Speicherstand ----------

export type Route =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'mathRunner' }
  | { name: 'city' }
  | { name: 'specific' }
  | { name: 'kurse' }
  | { name: 'mode'; id: string }
  | { name: 'run' }
  | { name: 'runResult' }
  | { name: 'continent'; id: ContinentId }
  | { name: 'quiz'; id: ContinentId; mode: Mode }
  | { name: 'result'; id: ContinentId; mode: Mode }
  | { name: 'kurs'; id: string }
  | { name: 'kursSitzung' }
  | { name: 'kursErgebnis' }
  | { name: 'bitte' }

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
  /** Bestleistungen des Math Runners */
  mathRunner?: MathRunnerStats
  /** Die Stadt – eigener Versionsstand, siehe src/city/types.ts */
  city?: CityState
  /** Wissenspunkte je Fach, siehe src/knowledge.ts */
  knowledge?: Record<string, number>
  /** Lernwelten: Kurse, Lernstand je Lernziel, laufende Session – siehe src/lernen */
  lernen?: LernStand
  run: Run | null
  lastRun: RunResult | null
  route: Route
  /** stimme: Sprachausgabe in den Sprachkursen · langsam: ruhigeres Sprechtempo */
  settings: { haptics: boolean; sound: boolean; stimme?: boolean; langsam?: boolean }
  updatedAt: number
}
