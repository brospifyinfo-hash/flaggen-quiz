import { CONTINENTS, COUNTRIES, type Continent, type ContinentId, type Country } from './data/countries'
import { lookalikesOf } from './data/lookalikes'
import type { ContinentProgress, CountryStat, Mode, Question, RoundResult, SaveData, Session } from './types'

export const ROUND_SIZE = 20
/** Eine falsch beantwortete Flagge kommt in der Übung nach so vielen anderen Fragen noch einmal */
const REPEAT_AFTER = 3
/** Solange es unbekannte Flaggen gibt, bekommen unsichere Flaggen höchstens so viele Plätze pro Runde */
const MAX_REPEATS_WHILE_NEW = 5

const BY_CODE = new Map(COUNTRIES.map((country) => [country.code, country]))
const BY_CONTINENT = new Map(
  CONTINENTS.map(({ id }) => [id, COUNTRIES.filter((country) => country.continent === id)]),
)

export const isCountry = (code: unknown): code is string => typeof code === 'string' && BY_CODE.has(code)
export const isContinentId = (id: unknown): id is ContinentId => CONTINENTS.some((c) => c.id === id)
export const countryName = (code: string) => BY_CODE.get(code)?.name ?? code
export const getContinent = (id: ContinentId) => CONTINENTS.find((c) => c.id === id) as Continent
export const countriesOf = (id: ContinentId): Country[] => BY_CONTINENT.get(id) ?? []
export const codesOf = (id: ContinentId) => countriesOf(id).map((country) => country.code)
export const sessionKey = (id: ContinentId, mode: Mode) => `${id}:${mode}`

export function nextContinent(id: ContinentId): Continent | null {
  return CONTINENTS[CONTINENTS.findIndex((c) => c.id === id) + 1] ?? null
}

export function shuffle<T>(items: readonly T[]): T[] {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Gewichtete Zufallsauswahl ohne Zurücklegen */
function weightedSample<T>(items: readonly T[], count: number, weight: (item: T) => number): T[] {
  return items
    .map((item) => ({ item, key: Math.random() ** (1 / weight(item)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, count)
    .map(({ item }) => item)
}

const isShaky = (stat: CountryStat | undefined) => !!stat && stat.wrong > 0 && (stat.lastWrong || stat.streak < 2)

/** Wie dringend eine Flagge wieder drankommen sollte – falsch beantwortete deutlich öfter */
function urgency(stat: CountryStat | undefined): number {
  if (!stat?.seen) return 3
  if (stat.lastWrong) return 16
  const fading = [6, 3, 1.5, 1, 0.6][Math.min(stat.streak, 4)]
  return fading * (1 + Math.min(stat.wrong, 6) * 0.5)
}

// ---------- Auswertung ----------

const EMPTY_PROGRESS: ContinentProgress = { rounds: 0, tests: 0, bestTest: 0, passed: false, passedAt: null }

export const progressOf = (data: SaveData, id: ContinentId) => data.progress[id] ?? EMPTY_PROGRESS

export type FlagState = 'new' | 'wrong' | 'learning' | 'solid'

export function flagState(stat: CountryStat | undefined): FlagState {
  if (!stat?.seen) return 'new'
  if (stat.lastWrong) return 'wrong'
  return stat.streak >= 2 ? 'solid' : 'learning'
}

export function continentStats(data: SaveData, id: ContinentId) {
  const states = codesOf(id).map((code) => flagState(data.stats[code]))
  const seen = states.filter((state) => state !== 'new').length
  return {
    total: states.length,
    seen,
    solid: states.filter((state) => state === 'solid').length,
    testUnlocked: seen === states.length,
  }
}

/** Der Abschlusstest wird frei, sobald jede Flagge des Kontinents einmal dran war */
export const isTestUnlocked = (data: SaveData, id: ContinentId) =>
  codesOf(id).every((code) => (data.stats[code]?.seen ?? 0) > 0)

/** Ein Kontinent wird frei, wenn der vorherige Abschlusstest fehlerfrei bestanden wurde */
export function isContinentUnlocked(data: SaveData, id: ContinentId): boolean {
  const index = CONTINENTS.findIndex((c) => c.id === id)
  return index === 0 || (index > 0 && progressOf(data, CONTINENTS[index - 1].id).passed)
}

export function latestSession(data: SaveData): Session | null {
  let latest: Session | null = null
  for (const session of Object.values(data.sessions)) {
    if (session && (!latest || session.updatedAt > latest.updatedAt)) latest = session
  }
  return latest
}

// ---------- Runden zusammenstellen ----------

function buildPracticeRound(data: SaveData, id: ContinentId): string[] {
  const codes = codesOf(id)
  const size = Math.min(ROUND_SIZE, codes.length)
  const stat = (code: string) => data.stats[code]

  const unseen = shuffle(codes.filter((code) => !stat(code)?.seen))
  // Unsicher: schon einmal falsch und seitdem noch nicht zweimal in Folge richtig – zuletzt falsche zuerst
  const shaky = shuffle(codes.filter((code) => isShaky(stat(code)))).sort(
    (a, b) =>
      Number(stat(b)?.lastWrong) - Number(stat(a)?.lastWrong) || (stat(b)?.wrong ?? 0) - (stat(a)?.wrong ?? 0),
  )

  // Erst alle Flaggen kennenlernen – unsichere laufen aber immer mit
  const picked =
    unseen.length > 0 ? [...shaky.slice(0, MAX_REPEATS_WHILE_NEW), ...unseen].slice(0, size) : shaky.slice(0, size)

  if (picked.length < size) {
    const rest = codes.filter((code) => !picked.includes(code))
    picked.push(...weightedSample(rest, size - picked.length, (code) => urgency(stat(code))))
  }
  return shuffle(picked)
}

/** Vier Antworten: die Lösung plus bevorzugt ähnliche Flaggen desselben Kontinents */
export function makeQuestion(code: string, id: ContinentId): Question {
  const pool = codesOf(id).filter((other) => other !== code)
  const distractors: string[] = []
  for (const similar of shuffle(lookalikesOf(code).filter((other) => pool.includes(other)))) {
    if (distractors.length === 2) break
    if (Math.random() < 0.7) distractors.push(similar)
  }
  for (const other of shuffle(pool)) {
    if (distractors.length === 3) break
    if (!distractors.includes(other)) distractors.push(other)
  }
  return { code, options: shuffle([code, ...distractors]), picked: null }
}

/** Kontinent eines Landes */
export const continentOfCode = (code: string): ContinentId | null => BY_CODE.get(code)?.continent ?? null

/** Wählt für einen endlosen Run eine Flagge aus der ganzen Welt – unsichere kommen häufiger */
export function pickCountryForRun(data: SaveData, recent: readonly string[]): string | null {
  const all = COUNTRIES.map((country) => country.code)
  const pool = all.filter((code) => !recent.includes(code))
  return weightedSample(pool.length > 0 ? pool : all, 1, (code) => urgency(data.stats[code]))[0] ?? null
}

// ---------- Aktionen (geben neue SaveData zurück) ----------

export function startSession(data: SaveData, id: ContinentId, mode: Mode, now = Date.now()): SaveData {
  const testUnlocked = isTestUnlocked(data, id)
  if (!isContinentUnlocked(data, id) || (mode === 'test' && !testUnlocked)) return data

  const round = mode === 'test' ? shuffle(codesOf(id)) : buildPracticeRound(data, id)
  const [first, ...queue] = round
  const session: Session = {
    mode,
    continent: id,
    round,
    current: makeQuestion(first, id),
    queue,
    done: [],
    mistakes: [],
    answered: 0,
    testWasUnlocked: testUnlocked,
    startedAt: now,
    updatedAt: now,
  }
  return { ...data, sessions: { ...data.sessions, [sessionKey(id, mode)]: session } }
}

export function answerQuestion(data: SaveData, id: ContinentId, mode: Mode, picked: string, now = Date.now()): SaveData {
  const key = sessionKey(id, mode)
  const session = data.sessions[key]
  if (!session || session.current.picked !== null || !session.current.options.includes(picked)) return data

  const { code } = session.current
  const correct = picked === code
  const prev = data.stats[code]
  const stat: CountryStat = {
    seen: (prev?.seen ?? 0) + 1,
    right: (prev?.right ?? 0) + (correct ? 1 : 0),
    wrong: (prev?.wrong ?? 0) + (correct ? 0 : 1),
    streak: correct ? (prev?.streak ?? 0) + 1 : 0,
    lastWrong: !correct,
    lastSeen: now,
  }

  let queue = session.queue
  if (!correct && mode === 'practice') {
    const at = Math.min(REPEAT_AFTER, queue.length)
    queue = [...queue.slice(0, at), code, ...queue.slice(at)]
  }

  const next: Session = {
    ...session,
    current: { ...session.current, picked },
    queue,
    done: correct && !session.done.includes(code) ? [...session.done, code] : session.done,
    mistakes: correct ? session.mistakes : [...session.mistakes, { code, picked }],
    answered: session.answered + 1,
    updatedAt: now,
  }
  return { ...data, stats: { ...data.stats, [code]: stat }, sessions: { ...data.sessions, [key]: next } }
}

export function nextQuestion(data: SaveData, id: ContinentId, mode: Mode, now = Date.now()): SaveData {
  const key = sessionKey(id, mode)
  const session = data.sessions[key]
  if (!session || session.current.picked === null) return data

  if (session.queue.length > 0) {
    const [code, ...queue] = session.queue
    const next: Session = { ...session, current: makeQuestion(code, id), queue, updatedAt: now }
    return { ...data, sessions: { ...data.sessions, [key]: next } }
  }
  return finishSession(data, session, now)
}

function finishSession(data: SaveData, session: Session, now: number): SaveData {
  const { continent: id, mode } = session
  const before = progressOf(data, id)
  const failed = new Set(session.mistakes.map((mistake) => mistake.code))
  const correct = session.round.length - failed.size
  const passed = mode === 'test' && failed.size === 0

  const progress: ContinentProgress =
    mode === 'test'
      ? {
          ...before,
          tests: before.tests + 1,
          bestTest: Math.max(before.bestTest, correct),
          passed: before.passed || passed,
          passedAt: before.passedAt ?? (passed ? now : null),
        }
      : { ...before, rounds: before.rounds + 1 }

  const result: RoundResult = {
    mode,
    continent: id,
    total: session.round.length,
    correct,
    mistakes: session.mistakes,
    testUnlocked: mode === 'practice' && !session.testWasUnlocked && isTestUnlocked(data, id),
    passed,
    unlockedContinent: passed && !before.passed ? (nextContinent(id)?.id ?? null) : null,
    finishedAt: now,
  }

  const sessions = { ...data.sessions }
  delete sessions[sessionKey(id, mode)]
  return { ...data, progress: { ...data.progress, [id]: progress }, sessions, lastResult: result }
}

export function discardSession(data: SaveData, id: ContinentId, mode: Mode): SaveData {
  const key = sessionKey(id, mode)
  if (!data.sessions[key]) return data
  const sessions = { ...data.sessions }
  delete sessions[key]
  return { ...data, sessions }
}
