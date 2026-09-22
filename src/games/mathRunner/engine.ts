// Die Spiellogik des Math Runners – ohne React, ohne Zeichnen, ohne Browser.
// Dadurch lässt sich der komplette Spielverlauf in der Simulation durchrechnen.
import {
  DANGER_LEFT,
  RISK_SHARE,
  SPEED_RAMP,
  SPEED_RAMP_TIME,
  START_SCORE,
  XP_COMBO_BONUS,
  comboFactor,
  progressOf,
  stageAt,
  stageFor,
} from './config'
import { makeQuestion, type MathQuestion } from './questions'

export type Side = 'left' | 'right'

export interface Pair {
  id: number
  question: MathQuestion
  left: number
  right: number
  /** auf welcher Seite das richtige Ergebnis steht */
  correctSide: Side
  /** 0 = gerade oben erschienen, 1 = auf Höhe der Figur */
  progress: number
}

export type GameEvent =
  | { type: 'correct'; gained: number; combo: number; side: Side }
  | { type: 'wrong'; lost: number; side: Side }
  | { type: 'stage'; stage: number }
  | { type: 'celebrate'; combo: number }
  | { type: 'danger' }
  | { type: 'over' }

export interface Game {
  phase: 'ready' | 'running' | 'paused' | 'over'
  /** Spielzeit in Sekunden */
  time: number
  score: number
  /** höchster Punktestand des Laufs – das ist das Ergebnis, denn am Ende steht immer 0 */
  peak: number
  combo: number
  bestCombo: number
  correct: number
  wrong: number
  stage: number
  /** höchste erreichte Stufe */
  maxStage: number
  /** in diesem Lauf verdiente XP */
  xp: number
  /** gewählte Spur: -1 links, 1 rechts */
  lane: -1 | 1
  /** sichtbare Position der Figur, gleitet zur Spur */
  x: number
  pair: Pair | null
  nextId: number
  /** läuft für den Hintergrund mit */
  scroll: number
  /** true, wenn zwei Fehler das Spiel beenden würden */
  danger: boolean
}

/** Was ein Fehler gerade kostet: Grundwert der Stufe plus ein Anteil des Vorsprungs */
export function penaltyFor(game: Game): number {
  return stageAt(game.stage).penalty + Math.round(Math.max(0, game.score - START_SCORE) * RISK_SHARE)
}

/** Reicht der Punktestand noch für mehr als zwei Fehler? */
export const inDanger = (game: Game): boolean =>
  game.score > 0 && game.score <= penaltyFor(game) * DANGER_LEFT

/** Ein einzelner Schritt darf nie größer sein – sonst springt das Spiel nach einem Tab-Wechsel */
const MAX_STEP = 0.05
/** Wie schnell die Figur zur gewählten Spur gleitet */
const GLIDE = 14

export function createGame(): Game {
  return {
    phase: 'ready',
    time: 0,
    score: START_SCORE,
    peak: START_SCORE,
    combo: 0,
    bestCombo: 0,
    correct: 0,
    wrong: 0,
    stage: 0,
    maxStage: 0,
    xp: 0,
    lane: -1,
    x: -1,
    pair: null,
    nextId: 1,
    scroll: 0,
    danger: false,
  }
}

export function startGame(game: Game): void {
  game.phase = 'running'
  if (!game.pair) spawn(game)
}

/** Lenken. Gibt zurück, ob sich die Spur dadurch geändert hat. */
export function steer(game: Game, direction: -1 | 1): boolean {
  if (game.phase !== 'running' || game.lane === direction) return false
  game.lane = direction
  return true
}

function spawn(game: Game): void {
  const question = makeQuestion(game.stage)
  const correctSide: Side = Math.random() < 0.5 ? 'left' : 'right'
  game.pair = {
    id: game.nextId++,
    question,
    left: correctSide === 'left' ? question.answer : question.wrong,
    right: correctSide === 'right' ? question.answer : question.wrong,
    correctSide,
    progress: 0,
  }
}

function resolve(game: Game, pair: Pair, events: GameEvent[]): void {
  // Entscheidend ist die gewählte Spur, nicht die Zwischenposition der Animation –
  // so zählt auch ein Wechsel kurz vor dem Tor noch sauber.
  const side: Side = game.lane < 0 ? 'left' : 'right'
  const stage = stageAt(game.stage)

  if (side === pair.correctSide) {
    game.combo += 1
    game.bestCombo = Math.max(game.bestCombo, game.combo)
    game.correct += 1
    const gained = Math.round(stage.reward * comboFactor(game.combo))
    game.score += gained
    game.peak = Math.max(game.peak, game.score)
    game.xp += stage.xp + (game.combo % 10 === 0 ? XP_COMBO_BONUS : 0)
    events.push({ type: 'correct', gained, combo: game.combo, side })
    if (game.combo === 5 || (game.combo >= 10 && game.combo % 10 === 0)) {
      events.push({ type: 'celebrate', combo: game.combo })
    }
  } else {
    game.combo = 0
    game.wrong += 1
    const lost = Math.min(game.score, penaltyFor(game))
    game.score -= lost
    events.push({ type: 'wrong', lost, side })
    if (game.score <= 0) {
      game.score = 0
      game.pair = null
      game.phase = 'over'
      events.push({ type: 'over' })
      return
    }
  }

  // Wird es jetzt eng? Dann einmal Alarm schlagen, nicht bei jeder Antwort erneut.
  const tight = inDanger(game)
  if (tight && !game.danger) events.push({ type: 'danger' })
  game.danger = tight

  game.pair = null
  spawn(game)
}

export function step(game: Game, dt: number, events: GameEvent[]): void {
  if (game.phase !== 'running') return
  const delta = Math.min(Math.max(dt, 0), MAX_STEP)
  const stage = stageAt(game.stage)

  game.time += delta
  game.scroll += delta * stage.flow
  game.x += (game.lane - game.x) * Math.min(1, delta * GLIDE)

  if (!game.pair) spawn(game)
  const pair = game.pair
  if (pair) {
    // Je länger der Lauf, desto knapper die Bedenkzeit
    const travel = stage.travel * (1 - Math.min(SPEED_RAMP, game.time / SPEED_RAMP_TIME))
    pair.progress += delta / travel
    if (pair.progress >= 1) resolve(game, pair, events)
  }

  const next = stageFor(progressOf(game.time, game.correct, game.score))
  if (next > game.stage) {
    game.stage = next
    game.maxStage = Math.max(game.maxStage, next)
    events.push({ type: 'stage', stage: next })
  }
}

export function pauseGame(game: Game): void {
  if (game.phase === 'running') game.phase = 'paused'
}

export function resumeGame(game: Game): void {
  if (game.phase === 'paused') game.phase = 'running'
}

export function endGame(game: Game): void {
  game.phase = 'over'
  game.pair = null
}
