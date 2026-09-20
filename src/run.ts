// Run-Engine: endlose Runden für Random Mode und für einzelne Modi.
import { getMode, pickRandomMode } from './modes/registry'
import { checkAchievements, creditXp, modeProgress, overallMastery, rankFor, xpForAnswer } from './progression'
import type { Judgement, ModeProgress, ModeQuestion, Run, RunResult, SaveData } from './types'

/** Modus-ID des Random Mode */
export const RANDOM = 'random'

const RECENT_KEYS = 14
const RECENT_MODES = 4

const masteryOf = (data: SaveData, mode: string) =>
  mode === RANDOM ? overallMastery(data) : (getMode(mode)?.mastery(data) ?? 0)

function makeQuestion(data: SaveData, mode: string, recentKeys: string[], recentModes: string[]): ModeQuestion | null {
  if (mode !== RANDOM) return getMode(mode)?.nextQuestion(data, recentKeys) ?? null
  // Ein Modus kann gerade nichts liefern (etwa weil Kursinhalte noch laden) – dann ein anderer
  const versucht: string[] = []
  for (let i = 0; i < 6; i++) {
    const chosen = pickRandomMode(data, recentModes, versucht)
    if (!chosen) return null
    const question = chosen.nextQuestion(data, recentKeys)
    if (question) return question
    versucht.push(chosen.id)
  }
  return null
}

/** Prüft, ob die Antwort zur Frage passt – Knopf oder freie Eingabe wie der Zeitstrahl */
function isValidAnswer(question: ModeQuestion, answer: string): boolean {
  const input = question.input
  if (input?.kind === 'timeline') {
    const value = Number(answer)
    return Number.isFinite(value) && value >= input.min && value <= input.max
  }
  // Karte: der Code des angetippten Landes
  if (input?.kind === 'map') return /^[a-z]{2}$/.test(answer)
  // Lernwelten: das Ergebnis einer ganzen Aktivität als JSON
  if (input?.kind === 'aktivitaet') {
    try {
      const ergebnis = JSON.parse(answer) as { punkte?: unknown }
      return typeof ergebnis.punkte === 'number' && ergebnis.punkte >= 0 && ergebnis.punkte <= 1
    } catch {
      return false
    }
  }
  return question.options.some((option) => option.id === answer)
}

export function startRun(data: SaveData, mode: string, now = Date.now()): SaveData {
  const question = makeQuestion(data, mode, [], [])
  if (!question) return data
  const best = modeProgress(data, mode)
  const run: Run = {
    mode,
    // Bestwerte beim Start festhalten: währenddessen wachsen sie mit, Rekorde misst man am Startwert
    startRecords: {
      combo: best.bestCombo,
      xp: best.bestXp,
      questions: best.bestQuestions,
      accuracy: best.bestAccuracy,
    },
    xpStart: data.xp,
    startedAt: now,
    updatedAt: now,
    answered: 0,
    correct: 0,
    xp: 0,
    combo: 0,
    bestCombo: 0,
    recentKeys: [],
    recentModes: [],
    masteryStart: masteryOf(data, mode),
    current: { ...question, picked: null },
    judged: null,
    earned: [],
  }
  return { ...data, run }
}

export function answerRun(data: SaveData, answer: string, now = Date.now()): SaveData {
  const run = data.run
  if (!run || run.current.picked !== null) return data
  const question = run.current
  if (!isValidAnswer(question, answer)) return data

  const mode = getMode(question.modeId)
  const right = answer === question.correctId
  const judged: Judgement = mode?.judge?.(question, answer, run.combo) ?? {
    correct: right,
    xp: right ? xpForAnswer(run.combo) : 0,
    headline: right ? 'Richtig!' : 'Leider falsch',
  }
  const correct = judged.correct
  const gained = Math.max(0, Math.round(judged.xp))
  const combo = correct ? run.combo + 1 : 0

  // Lernstand des Modus (z. B. Flaggen oder Jahresabweichung) mitschreiben
  let next = mode?.recordAnswer?.(data, question, answer, correct, now) ?? data

  const before = modeProgress(next, question.modeId)
  const progress: ModeProgress = {
    ...before,
    answered: before.answered + 1,
    correct: before.correct + (correct ? 1 : 0),
    bestCombo: Math.max(before.bestCombo, combo),
    lastPlayed: now,
  }

  const updated: Run = {
    ...run,
    current: { ...question, picked: answer },
    judged,
    answered: run.answered + 1,
    correct: run.correct + (correct ? 1 : 0),
    xp: run.xp + gained,
    combo,
    bestCombo: Math.max(run.bestCombo, combo),
    updatedAt: now,
  }

  next = {
    ...creditXp(next, gained, question.modeId),
    modes: { ...next.modes, [question.modeId]: progress },
    run: updated,
  }

  const checked = checkAchievements(next, now)
  if (checked.unlocked.length === 0) return next
  return { ...checked.data, run: { ...updated, earned: [...updated.earned, ...checked.unlocked] } }
}

export function nextRunQuestion(data: SaveData, now = Date.now()): SaveData {
  const run = data.run
  if (!run || run.current.picked === null) return data

  const recentKeys = [run.current.key, ...run.recentKeys].slice(0, RECENT_KEYS)
  const recentModes = [run.current.modeId, ...run.recentModes].slice(0, RECENT_MODES)
  const question = makeQuestion(data, run.mode, recentKeys, recentModes)
  if (!question) return endRun(data, now)

  return {
    ...data,
    run: { ...run, current: { ...question, picked: null }, judged: null, recentKeys, recentModes, updatedAt: now },
  }
}

/** Beendet den Run und schreibt Rekorde, Statistiken, Rang und Achievements fort */
export function endRun(data: SaveData, now = Date.now()): SaveData {
  const run = data.run
  if (!run) return data
  if (run.answered === 0) return { ...data, run: null }

  const accuracy = run.correct / run.answered
  const start = run.startRecords
  const records: string[] = []
  if (run.bestCombo > start.combo) records.push('combo')
  if (run.xp > start.xp) records.push('xp')
  if (run.answered > start.questions) records.push('questions')
  if (run.answered >= 10 && accuracy > start.accuracy) records.push('accuracy')

  const before = modeProgress(data, run.mode)
  const progress: ModeProgress = {
    ...before,
    // Bei Random zählen die Fragen zusätzlich auf das Random-Konto,
    // bei einzelnen Modi sind sie schon pro Frage gezählt.
    answered: run.mode === RANDOM ? before.answered + run.answered : before.answered,
    correct: run.mode === RANDOM ? before.correct + run.correct : before.correct,
    runs: before.runs + 1,
    bestCombo: Math.max(before.bestCombo, run.bestCombo),
    bestXp: Math.max(before.bestXp, run.xp),
    bestQuestions: Math.max(before.bestQuestions, run.answered),
    bestAccuracy: run.answered >= 10 ? Math.max(before.bestAccuracy, accuracy) : before.bestAccuracy,
    lastPlayed: now,
  }

  const rankBefore = rankFor(run.xpStart).rank.id
  const rankAfter = rankFor(data.xp).rank.id

  const result: RunResult = {
    mode: run.mode,
    answered: run.answered,
    correct: run.correct,
    xp: run.xp,
    bestCombo: run.bestCombo,
    masteryDelta: masteryOf(data, run.mode) - run.masteryStart,
    achievements: run.earned,
    records,
    rankUp: rankAfter !== rankBefore ? rankAfter : null,
    finishedAt: now,
  }

  const next: SaveData = {
    ...data,
    modes: { ...data.modes, [run.mode]: progress },
    run: null,
    lastRun: result,
  }
  const checked = checkAchievements(next, now)
  if (checked.unlocked.length === 0) return next
  return {
    ...checked.data,
    lastRun: { ...result, achievements: [...result.achievements, ...checked.unlocked] },
  }
}

/** Run ohne Ergebnisbildschirm verwerfen (z. B. direkt nach dem Start abgebrochen) */
export function discardRun(data: SaveData): SaveData {
  return data.run ? { ...data, run: null } : data
}
