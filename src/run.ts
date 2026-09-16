// Run-Engine: endlose Runden für Random Mode und für einzelne Modi.
import { getMode, pickRandomMode } from './modes/registry'
import { checkAchievements, modeProgress, overallMastery, xpForAnswer } from './progression'
import type { ModeProgress, ModeQuestion, Run, RunResult, SaveData } from './types'

/** Modus-ID des Random Mode */
export const RANDOM = 'random'

const RECENT_KEYS = 14
const RECENT_MODES = 4

const masteryOf = (data: SaveData, mode: string) =>
  mode === RANDOM ? overallMastery(data) : (getMode(mode)?.mastery(data) ?? 0)

function makeQuestion(data: SaveData, mode: string, recentKeys: string[], recentModes: string[]): ModeQuestion | null {
  const chosen = mode === RANDOM ? pickRandomMode(data, recentModes) : getMode(mode)
  return chosen?.nextQuestion(data, recentKeys) ?? null
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
    earned: [],
  }
  return { ...data, run }
}

export function answerRun(data: SaveData, optionId: string, now = Date.now()): SaveData {
  const run = data.run
  if (!run || run.current.picked !== null || !run.current.options.some((option) => option.id === optionId)) return data

  const question = run.current
  const correct = optionId === question.correctId
  const combo = correct ? run.combo + 1 : 0
  const gained = correct ? xpForAnswer(run.combo) : 0

  // Lernstand des Modus (z. B. Flaggen) mitschreiben
  let next = getMode(question.modeId)?.recordAnswer?.(data, question, optionId, correct, now) ?? data

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
    current: { ...question, picked: optionId },
    answered: run.answered + 1,
    correct: run.correct + (correct ? 1 : 0),
    xp: run.xp + gained,
    combo,
    bestCombo: Math.max(run.bestCombo, combo),
    updatedAt: now,
  }

  next = {
    ...next,
    xp: next.xp + gained,
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

  return { ...data, run: { ...run, current: { ...question, picked: null }, recentKeys, recentModes, updatedAt: now } }
}

/** Beendet den Run und schreibt Rekorde, Statistiken und Achievements fort */
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

  const result: RunResult = {
    mode: run.mode,
    answered: run.answered,
    correct: run.correct,
    xp: run.xp,
    bestCombo: run.bestCombo,
    masteryDelta: masteryOf(data, run.mode) - run.masteryStart,
    achievements: run.earned,
    records,
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
