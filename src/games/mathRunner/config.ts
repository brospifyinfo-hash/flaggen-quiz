// Alle Stellschrauben des Math Runners an einem Ort: Schwierigkeit, Punkte, XP, Farben.
// Wer das Spiel abstimmen will, ändert nur diese Datei.

import type { MathRunnerStats } from '../../types'

export type Op = '+' | '−' | '×' | '÷'

/** Startwerte, solange noch nie gespielt wurde */
export const EMPTY_MATH_STATS: MathRunnerStats = {
  highScore: 0,
  bestCombo: 0,
  bestTime: 0,
  bestStage: 0,
  runs: 0,
  correct: 0,
  wrong: 0,
}

export interface Stage {
  id: string
  /** Anzeige im Spiel */
  name: string
  /** ab diesem Fortschritt – der Wert zählt wie Sekunden, siehe progressOf */
  from: number
  ops: Op[]
  /** beide Summanden von … bis */
  add: [number, number]
  /** die größere Zahl beim Minus von … bis */
  sub: [number, number]
  /** Faktoren: erster bis, zweiter bis */
  mul: [number, number]
  /** Division: Teiler bis, Ergebnis bis */
  div: [number, number]
  reward: number
  penalty: number
  xp: number
  /** Sekunden, die ein Tor von oben bis zur Figur braucht – das ist die Bedenkzeit */
  travel: number
  /** Tempo des Hintergrunds */
  flow: number
  /** Farben des Abschnitts */
  sky: [string, string]
  accent: string
}

export const STAGES: Stage[] = [
  {
    id: 'easy',
    name: 'EASY',
    from: 0,
    ops: ['+', '−'],
    add: [2, 9],
    sub: [4, 12],
    mul: [2, 5],
    div: [2, 5],
    reward: 10,
    penalty: 15,
    xp: 10,
    travel: 4.2,
    flow: 0.55,
    sky: ['#12d8a0', '#0b7fa8'],
    accent: '#ffe14d',
  },
  {
    id: 'medium',
    name: 'MEDIUM',
    from: 20,
    ops: ['+', '−', '×', '÷'],
    add: [11, 59],
    sub: [20, 70],
    mul: [2, 9],
    div: [2, 9],
    reward: 20,
    penalty: 20,
    xp: 20,
    travel: 4,
    flow: 0.7,
    sky: ['#3b6ef0', '#7b2ff7'],
    accent: '#ffd23f',
  },
  {
    id: 'hard',
    name: 'HARD',
    from: 45,
    ops: ['×', '÷', '+', '−'],
    add: [60, 299],
    sub: [120, 520],
    mul: [12, 9],
    div: [9, 12],
    reward: 35,
    penalty: 30,
    xp: 35,
    travel: 3.8,
    flow: 0.85,
    sky: ['#a626d4', '#ff2d95'],
    accent: '#59ffd2',
  },
  {
    id: 'expert',
    name: 'EXPERT',
    from: 75,
    ops: ['×', '÷', '+', '−'],
    add: [120, 599],
    sub: [260, 900],
    mul: [19, 14],
    div: [12, 24],
    reward: 50,
    penalty: 40,
    xp: 50,
    travel: 3.6,
    flow: 1,
    sky: ['#ff6a00', '#ee0979'],
    accent: '#ffe600',
  },
  {
    id: 'master',
    name: 'MASTER',
    from: 120,
    ops: ['×', '÷', '+', '−'],
    add: [300, 1999],
    sub: [600, 2400],
    mul: [25, 25],
    div: [25, 40],
    reward: 70,
    penalty: 50,
    xp: 70,
    travel: 3.4,
    flow: 1.15,
    sky: ['#ff1e56', '#7b0fff'],
    accent: '#00ffd5',
  },
]

/** Punktestand zu Beginn – bei 0 ist Schluss */
export const START_SCORE = 100

/** Combo-Stufen: ab dieser Combo gilt dieser Punktefaktor */
const COMBO_STEPS: { from: number; factor: number }[] = [
  { from: 21, factor: 2 },
  { from: 11, factor: 1.5 },
  { from: 7, factor: 1.25 },
  { from: 4, factor: 1.1 },
  { from: 0, factor: 1 },
]

export const comboFactor = (combo: number): number =>
  COMBO_STEPS.find((step) => combo >= step.from)?.factor ?? 1

/** Extra-XP für jede volle Zehner-Combo */
export const XP_COMBO_BONUS = 100
/** Extra-XP für einen neuen Rekord */
export const XP_HIGHSCORE_BONUS = 250

/**
 * Die Schwierigkeit hängt nicht nur an der Uhr: Wer viel richtig hat und gut steht,
 * rückt schneller vor. Der Wert wird in Sekunden gerechnet.
 */
export const progressOf = (time: number, correct: number, score: number): number =>
  time + correct * 2.5 + Math.max(0, score - START_SCORE) / 25

export function stageFor(progress: number): number {
  let index = 0
  for (let i = 0; i < STAGES.length; i++) {
    if (progress >= STAGES[i].from) index = i
  }
  return index
}

export const stageAt = (index: number): Stage => STAGES[Math.min(STAGES.length - 1, Math.max(0, index))]

/** Farben der Tore – bunt, aber nie ein Hinweis auf richtig oder falsch */
export const GATE_COLORS = ['#ff3fa4', '#00d9ff', '#ffd23f', '#7bff3f', '#ff7a1a', '#b06bff']
