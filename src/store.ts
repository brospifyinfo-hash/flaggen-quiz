// Der gesamte Fortschritt liegt als JSON im localStorage dieses Geräts.
// Jede Änderung wird sofort und synchron geschrieben – ohne Server, ohne Konto, auch offline.
import { useSyncExternalStore } from 'react'
import { CONTINENTS } from './data/countries'
import { isContinentId, isCountry, sessionKey } from './quiz'
import { isRoute } from './routes'
import type { CountryStat, Mistake, Mode, RoundResult, SaveData, Session } from './types'

const KEY = 'flaggen-quiz:v1'

export function createFresh(): SaveData {
  return {
    version: 1,
    stats: {},
    progress: {},
    sessions: {},
    lastResult: null,
    route: { name: 'home' },
    settings: { haptics: true },
    updatedAt: Date.now(),
  }
}

function readStorage(): SaveData {
  let raw: string | null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    return createFresh()
  }
  if (!raw) return createFresh()
  try {
    return sanitize(JSON.parse(raw))
  } catch {
    // Unlesbare Daten nicht einfach überschreiben, sondern beiseitelegen
    try {
      localStorage.setItem(`${KEY}:unlesbar:${Date.now()}`, raw)
    } catch {
      // Speicher voll oder gesperrt – dann bleibt nur ein frischer Stand
    }
    return createFresh()
  }
}

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

// ---------- Prüfung geladener Daten ----------

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const count = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0)
const isMode = (value: unknown): value is Mode => value === 'practice' || value === 'test'
const isCodeList = (value: unknown): value is string[] => Array.isArray(value) && value.every(isCountry)
const isMistakes = (value: unknown): value is Mistake[] =>
  Array.isArray(value) && value.every((m) => isObject(m) && isCountry(m.code) && isCountry(m.picked))

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

function sanitize(input: unknown): SaveData {
  const fresh = createFresh()
  if (!isObject(input) || input.version !== 1) return fresh

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

  return {
    version: 1,
    stats,
    progress,
    sessions,
    lastResult: isResult(input.lastResult) ? input.lastResult : null,
    route: isRoute(input.route) ? input.route : fresh.route,
    settings: { haptics: !(isObject(input.settings) && input.settings.haptics === false) },
    updatedAt: count(input.updatedAt),
  }
}
