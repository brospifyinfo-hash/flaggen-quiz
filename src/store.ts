// Der gesamte Fortschritt liegt als JSON im localStorage dieses Geräts.
// Jede Änderung wird sofort und synchron geschrieben – ohne Server, ohne Konto, auch offline.
import { useSyncExternalStore } from 'react'
import { CONTINENTS } from './data/countries'
import { isContinentId, isCountry, sessionKey } from './quiz'
import { isRoute } from './routes'
import type {
  CountryStat,
  MathRunnerStats,
  Mistake,
  Mode,
  ModeProgress,
  ModeQuestion,
  QuestionInput,
  QuestionOption,
  RoundResult,
  Run,
  RunResult,
  SaveData,
  Session,
} from './types'

const KEY = 'flaggen-quiz:v1'
const BACKUP_PREFIX = `${KEY}:unlesbar:`

export function createFresh(): SaveData {
  return {
    version: 2,
    stats: {},
    progress: {},
    sessions: {},
    lastResult: null,
    xp: 0,
    modes: {},
    achievements: {},
    run: null,
    lastRun: null,
    route: { name: 'home' },
    settings: { haptics: true, sound: true },
    updatedAt: Date.now(),
  }
}

// ---------- Prüfung geladener Daten ----------
// Alles hier sind Funktionsdeklarationen: Der Stand wird schon beim Laden des Moduls gelesen.

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
}

function isMode(value: unknown): value is Mode {
  return value === 'practice' || value === 'test'
}

function isCodeList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isCountry)
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function isMistakes(value: unknown): value is Mistake[] {
  return Array.isArray(value) && value.every((m) => isObject(m) && isCountry(m.code) && isCountry(m.picked))
}

function isSession(value: unknown): value is Session {
  if (!isObject(value) || !isMode(value.mode) || !isContinentId(value.continent)) return false
  const question = value.current
  return (
    isCodeList(value.round) &&
    value.round.length > 0 &&
    isCodeList(value.queue) &&
    isCodeList(value.done) &&
    isMistakes(value.mistakes) &&
    isObject(question) &&
    isCountry(question.code) &&
    isCodeList(question.options) &&
    question.options.length === 4 &&
    question.options.includes(question.code) &&
    (question.picked === null || (isCountry(question.picked) && question.options.includes(question.picked))) &&
    typeof value.answered === 'number' &&
    typeof value.testWasUnlocked === 'boolean' &&
    typeof value.startedAt === 'number' &&
    typeof value.updatedAt === 'number'
  )
}

function isResult(value: unknown): value is RoundResult {
  return (
    isObject(value) &&
    isMode(value.mode) &&
    isContinentId(value.continent) &&
    typeof value.total === 'number' &&
    typeof value.correct === 'number' &&
    isMistakes(value.mistakes) &&
    typeof value.testUnlocked === 'boolean' &&
    typeof value.passed === 'boolean' &&
    (value.unlockedContinent === null || isContinentId(value.unlockedContinent)) &&
    typeof value.finishedAt === 'number'
  )
}

function isOptions(value: unknown): value is QuestionOption[] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    value.every((option) => isObject(option) && typeof option.id === 'string' && typeof option.label === 'string')
  )
}

function isInput(value: unknown): value is QuestionInput {
  if (!isObject(value)) return false
  if (value.kind === 'timeline') return typeof value.min === 'number' && typeof value.max === 'number'
  return value.kind === 'map' && typeof value.view === 'string'
}

function isModeQuestion(value: unknown): value is ModeQuestion {
  if (!isObject(value) || typeof value.modeId !== 'string' || typeof value.key !== 'string') return false
  if (typeof value.prompt !== 'string' || !isObject(value.data)) return false
  if (!Object.values(value.data).every((entry) => typeof entry === 'string')) return false
  if (typeof value.correctId !== 'string') return false
  if (value.input !== undefined && !isInput(value.input)) return false
  if (isInput(value.input)) return Array.isArray(value.options) && value.options.length === 0
  return isOptions(value.options) && value.options.some((option) => option.id === value.correctId)
}

function isRun(value: unknown): value is Run {
  if (!isObject(value) || typeof value.mode !== 'string') return false
  const question = value.current
  if (!isModeQuestion(question)) return false
  const records = value.startRecords
  if (!isObject(records)) return false
  if (['combo', 'xp', 'questions', 'accuracy'].some((field) => typeof records[field] !== 'number')) return false
  const picked = (question as ModeQuestion & { picked?: unknown }).picked
  const pickedOk =
    picked === null ||
    (typeof picked === 'string' && (question.input ? true : question.options.some((option) => option.id === picked)))
  const judged = value.judged
  const judgedOk =
    judged === null ||
    (isObject(judged) &&
      typeof judged.correct === 'boolean' &&
      typeof judged.xp === 'number' &&
      typeof judged.headline === 'string')
  return (
    pickedOk &&
    judgedOk &&
    typeof value.xpStart === 'number' &&
    typeof value.answered === 'number' &&
    typeof value.correct === 'number' &&
    typeof value.xp === 'number' &&
    typeof value.combo === 'number' &&
    typeof value.bestCombo === 'number' &&
    isStringList(value.recentKeys) &&
    isStringList(value.recentModes) &&
    typeof value.masteryStart === 'number' &&
    isStringList(value.earned) &&
    typeof value.startedAt === 'number' &&
    typeof value.updatedAt === 'number'
  )
}

function isRunResult(value: unknown): value is RunResult {
  return (
    isObject(value) &&
    typeof value.mode === 'string' &&
    typeof value.answered === 'number' &&
    typeof value.correct === 'number' &&
    typeof value.xp === 'number' &&
    typeof value.bestCombo === 'number' &&
    typeof value.masteryDelta === 'number' &&
    isStringList(value.achievements) &&
    isStringList(value.records) &&
    typeof value.finishedAt === 'number'
  )
}

function readModeProgress(value: unknown): ModeProgress | null {
  if (!isObject(value)) return null
  const extra: Record<string, number> = {}
  if (isObject(value.extra)) {
    for (const [key, entry] of Object.entries(value.extra)) {
      if (typeof entry === 'number' && Number.isFinite(entry)) extra[key] = entry
    }
  }
  return {
    ...(Object.keys(extra).length > 0 ? { extra } : {}),
    answered: count(value.answered),
    correct: count(value.correct),
    runs: count(value.runs),
    bestCombo: count(value.bestCombo),
    bestXp: count(value.bestXp),
    bestQuestions: count(value.bestQuestions),
    bestAccuracy: Math.min(1, count(value.bestAccuracy)),
    lastPlayed: count(value.lastPlayed),
  }
}

function readMath(value: unknown): MathRunnerStats | undefined {
  if (!isObject(value)) return undefined
  return {
    highScore: count(value.highScore),
    bestCombo: count(value.bestCombo),
    bestTime: count(value.bestTime),
    bestStage: count(value.bestStage),
    runs: count(value.runs),
    correct: count(value.correct),
    wrong: count(value.wrong),
  }
}

/** null, wenn es kein bekannter Spielstand ist. Version 1 (nur Flaggen) wird mitübernommen. */
function sanitize(input: unknown): SaveData | null {
  if (!isObject(input)) return null
  if (input.version !== 1 && input.version !== 2) return null

  const stats: Record<string, CountryStat> = {}
  if (isObject(input.stats)) {
    for (const [code, stat] of Object.entries(input.stats)) {
      if (!isCountry(code) || !isObject(stat)) continue
      stats[code] = {
        seen: count(stat.seen),
        right: count(stat.right),
        wrong: count(stat.wrong),
        streak: count(stat.streak),
        lastWrong: stat.lastWrong === true,
        lastSeen: count(stat.lastSeen),
      }
    }
  }

  const progress: SaveData['progress'] = {}
  if (isObject(input.progress)) {
    for (const { id } of CONTINENTS) {
      const entry = input.progress[id]
      if (!isObject(entry)) continue
      progress[id] = {
        rounds: count(entry.rounds),
        tests: count(entry.tests),
        bestTest: count(entry.bestTest),
        passed: entry.passed === true,
        passedAt: typeof entry.passedAt === 'number' ? entry.passedAt : null,
      }
    }
  }

  const sessions: SaveData['sessions'] = {}
  if (isObject(input.sessions)) {
    for (const session of Object.values(input.sessions)) {
      if (isSession(session)) sessions[sessionKey(session.continent, session.mode)] = session
    }
  }

  const modes: Record<string, ModeProgress> = {}
  if (isObject(input.modes)) {
    for (const [id, entry] of Object.entries(input.modes)) {
      const progressEntry = readModeProgress(entry)
      if (progressEntry) modes[id] = progressEntry
    }
  }

  const achievements: Record<string, number> = {}
  if (isObject(input.achievements)) {
    for (const [id, at] of Object.entries(input.achievements)) {
      if (typeof at === 'number') achievements[id] = at
    }
  }

  const learn: SaveData['learn'] = {}
  if (isObject(input.learn)) {
    for (const [modeId, subjects] of Object.entries(input.learn)) {
      if (!isObject(subjects)) continue
      const entries: Record<string, CountryStat> = {}
      for (const [subject, stat] of Object.entries(subjects)) {
        if (!isObject(stat)) continue
        entries[subject] = {
          seen: count(stat.seen),
          right: count(stat.right),
          wrong: count(stat.wrong),
          streak: count(stat.streak),
          lastWrong: stat.lastWrong === true,
          lastSeen: count(stat.lastSeen),
        }
      }
      if (Object.keys(entries).length > 0) learn[modeId] = entries
    }
  }

  const mathRunner = readMath(input.mathRunner)

  return {
    version: 2,
    stats,
    progress,
    sessions,
    lastResult: isResult(input.lastResult) ? input.lastResult : null,
    xp: count(input.xp),
    modes,
    achievements,
    learn,
    ...(mathRunner ? { mathRunner } : {}),
    run: isRun(input.run) ? input.run : null,
    lastRun: isRunResult(input.lastRun) ? input.lastRun : null,
    route: isRoute(input.route) ? input.route : { name: 'home' },
    settings: {
      haptics: !(isObject(input.settings) && input.settings.haptics === false),
      sound: !(isObject(input.settings) && input.settings.sound === false),
    },
    updatedAt: count(input.updatedAt),
  }
}

/** Holt einen beiseitegelegten Stand zurück, ohne Antworten doppelt zu zählen */
function mergeSaves(current: SaveData, older: SaveData): SaveData {
  const stats = { ...older.stats }
  for (const [code, stat] of Object.entries(current.stats)) {
    const old = stats[code]
    const recent = !old || stat.lastSeen >= old.lastSeen ? stat : old
    stats[code] = {
      ...recent,
      seen: Math.max(stat.seen, old?.seen ?? 0),
      right: Math.max(stat.right, old?.right ?? 0),
      wrong: Math.max(stat.wrong, old?.wrong ?? 0),
    }
  }

  const progress = { ...older.progress, ...current.progress }
  for (const { id } of CONTINENTS) {
    const a = current.progress[id]
    const b = older.progress[id]
    if (!a || !b) continue
    progress[id] = {
      rounds: Math.max(a.rounds, b.rounds),
      tests: Math.max(a.tests, b.tests),
      bestTest: Math.max(a.bestTest, b.bestTest),
      passed: a.passed || b.passed,
      passedAt: a.passedAt ?? b.passedAt,
    }
  }

  const modes = { ...older.modes }
  for (const [id, entry] of Object.entries(current.modes)) {
    const old = modes[id]
    modes[id] = old
      ? {
          extra: mergeExtra(entry.extra, old.extra),
          answered: Math.max(entry.answered, old.answered),
          correct: Math.max(entry.correct, old.correct),
          runs: Math.max(entry.runs, old.runs),
          bestCombo: Math.max(entry.bestCombo, old.bestCombo),
          bestXp: Math.max(entry.bestXp, old.bestXp),
          bestQuestions: Math.max(entry.bestQuestions, old.bestQuestions),
          bestAccuracy: Math.max(entry.bestAccuracy, old.bestAccuracy),
          lastPlayed: Math.max(entry.lastPlayed, old.lastPlayed),
        }
      : entry
  }

  const achievements = { ...older.achievements }
  for (const [id, at] of Object.entries(current.achievements)) {
    achievements[id] = Math.min(at, achievements[id] ?? at)
  }

  const learn: SaveData['learn'] = { ...older.learn }
  for (const [modeId, subjects] of Object.entries(current.learn ?? {})) {
    const old = learn[modeId] ?? {}
    const merged: Record<string, CountryStat> = { ...old }
    for (const [subject, stat] of Object.entries(subjects)) {
      const previous = old[subject]
      const recent = !previous || stat.lastSeen >= previous.lastSeen ? stat : previous
      merged[subject] = {
        ...recent,
        seen: Math.max(stat.seen, previous?.seen ?? 0),
        right: Math.max(stat.right, previous?.right ?? 0),
        wrong: Math.max(stat.wrong, previous?.wrong ?? 0),
      }
    }
    learn[modeId] = merged
  }

  const mathRunner = mergeMath(current.mathRunner, older.mathRunner)

  return {
    ...current,
    stats,
    progress,
    modes,
    achievements,
    learn,
    ...(mathRunner ? { mathRunner } : {}),
    xp: Math.max(current.xp, older.xp),
    sessions: Object.keys(current.sessions).length > 0 ? current.sessions : older.sessions,
    lastResult: current.lastResult ?? older.lastResult,
    run: current.run ?? older.run,
    lastRun: current.lastRun ?? older.lastRun,
  }
}

/** Bestleistungen des Math Runners: immer der bessere Wert gewinnt, Summen werden addiert */
function mergeMath(a?: MathRunnerStats, b?: MathRunnerStats): MathRunnerStats | undefined {
  if (!a || !b) return a ?? b
  return {
    highScore: Math.max(a.highScore, b.highScore),
    bestCombo: Math.max(a.bestCombo, b.bestCombo),
    bestTime: Math.max(a.bestTime, b.bestTime),
    bestStage: Math.max(a.bestStage, b.bestStage),
    runs: Math.max(a.runs, b.runs),
    correct: Math.max(a.correct, b.correct),
    wrong: Math.max(a.wrong, b.wrong),
  }
}

function mergeExtra(a?: Record<string, number>, b?: Record<string, number>) {
  if (!a && !b) return undefined
  const merged: Record<string, number> = { ...(b ?? {}) }
  for (const [key, value] of Object.entries(a ?? {})) merged[key] = Math.max(value, merged[key] ?? 0)
  return merged
}

function backupKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(BACKUP_PREFIX)) keys.push(key)
  }
  return keys
}

function readStorage(): SaveData {
  let raw: string | null
  let backups: string[]
  try {
    raw = localStorage.getItem(KEY)
    backups = backupKeys()
  } catch {
    return createFresh()
  }

  let data = createFresh()
  if (raw) {
    try {
      data = sanitize(JSON.parse(raw)) ?? data
    } catch {
      // Unlesbare Daten nicht wegwerfen, sondern beiseitelegen
      try {
        localStorage.setItem(`${BACKUP_PREFIX}${Date.now()}`, raw)
        localStorage.removeItem(KEY)
      } catch {
        // Speicher voll oder gesperrt – dann bleibt nur ein frischer Stand
      }
      return data
    }
  }

  // Beiseitegelegte Stände, die wieder lesbar sind, zurückholen
  for (const key of backups) {
    try {
      const restored = sanitize(JSON.parse(localStorage.getItem(key) ?? ''))
      if (!restored) continue
      data = mergeSaves(data, restored)
      localStorage.setItem(KEY, JSON.stringify(data))
      localStorage.removeItem(key)
    } catch {
      // bleibt als Sicherung liegen
    }
  }
  return data
}

// ---------- Zustand ----------

let state = readStorage()
let storageWorks = true
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

function write(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
    storageWorks = true
  } catch {
    storageWorks = false
  }
}

export const getState = () => state
export const isStorageWorking = () => storageWorks

export function setState(update: (data: SaveData) => SaveData) {
  const next = update(state)
  if (next === state) return
  state = { ...next, updatedAt: Date.now() }
  write(state)
  notify()
}

/** Löscht den Fortschritt – nur über „Fortschritt zurücksetzen“ aufrufen */
export function resetProgress() {
  const { settings } = state
  try {
    for (const key of backupKeys()) localStorage.removeItem(key)
  } catch {
    // ohne Speicherzugriff gibt es auch keine Sicherungen
  }
  setState(() => ({ ...createFresh(), settings }))
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const useSaveData = () => useSyncExternalStore(subscribe, getState, getState)

// Spielt jemand in zwei Tabs, gewinnt immer der zuletzt gespeicherte Stand
window.addEventListener('storage', (event) => {
  if (event.key !== KEY && event.key !== null) return
  state = readStorage()
  notify()
})
