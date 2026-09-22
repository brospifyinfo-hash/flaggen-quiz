// Erzeugt die Rechenaufgaben. Alles ganzzahlig, nie negativ, Division geht immer auf.
import { stageAt, type Op } from './config'

export interface MathQuestion {
  /** fertig gesetzte Aufgabe, z. B. „7 × 8“ */
  text: string
  answer: number
  /** plausibles falsches Ergebnis für das zweite Tor */
  wrong: number
  op: Op
  stage: number
}

const int = (min: number, max: number, rnd: () => number) =>
  min + Math.floor(rnd() * (Math.max(min, max) - min + 1))

const pick = <T>(list: readonly T[], rnd: () => number): T => list[Math.floor(rnd() * list.length)]

/**
 * So weit darf ein falsches Ergebnis höchstens danebenliegen. Bei kleinen Zahlen
 * zählt der feste Mindestabstand, bei großen der Anteil – sonst stünde neben der 8
 * plötzlich eine 4, und das sieht niemand als Rechenfehler an.
 */
export const plausibleRoom = (answer: number): number => Math.max(2, Math.round(Math.abs(answer) * 0.3))

export const isPlausible = (answer: number, wrong: number): boolean =>
  Math.abs(wrong - answer) <= plausibleRoom(answer)

/**
 * Falsche Ergebnisse sollen wie echte Rechenfehler aussehen: ein Schritt daneben,
 * eine Zehnerstelle verrutscht, eine Reihe zu weit im Einmaleins.
 */
function wrongAnswers(op: Op, a: number, b: number, answer: number): number[] {
  const list: number[] = []
  const add = (value: number) => {
    if (Number.isFinite(value) && Number.isInteger(value) && value >= 0 && value !== answer) list.push(value)
  }

  add(answer + 1)
  add(answer - 1)
  add(answer + 2)
  add(answer - 2)

  if (op === '+' || op === '−') {
    add(answer + 10)
    add(answer - 10)
    add(answer + 9)
    add(answer - 9)
    add(answer + 11)
    add(answer + 100)
    add(answer - 100)
  }
  if (op === '×') {
    // eine Reihe daneben ist der häufigste Fehler im Einmaleins
    add(answer + a)
    add(answer - a)
    add(answer + b)
    add(answer - b)
    add(answer + 10)
    add(answer - 10)
  }
  if (op === '÷') {
    add(answer + 3)
    add(answer - 3)
    add(Math.round(answer / 2))
    add(answer * 2)
  }

  // nur was nah genug dran ist, wirkt wie ein Rechenfehler
  return [...new Set(list)].filter((value) => isPlausible(answer, value))
}

export function makeQuestion(stageIndex: number, rnd: () => number = Math.random): MathQuestion {
  const stage = stageAt(stageIndex)
  const op = pick(stage.ops, rnd)

  let a = 0
  let b = 0
  let answer = 0

  if (op === '+') {
    a = int(stage.add[0], stage.add[1], rnd)
    b = int(stage.add[0], stage.add[1], rnd)
    answer = a + b
  } else if (op === '−') {
    a = int(Math.max(2, stage.sub[0]), stage.sub[1], rnd)
    b = int(1, a - 1, rnd)
    answer = a - b
  } else if (op === '×') {
    a = int(2, stage.mul[0], rnd)
    b = int(2, stage.mul[1], rnd)
    answer = a * b
  } else {
    // Division rückwärts bauen, dann geht sie immer auf
    b = int(2, stage.div[0], rnd)
    answer = int(2, stage.div[1], rnd)
    a = b * answer
  }

  const candidates = wrongAnswers(op, a, b, answer)
  const wrong = candidates.length > 0 ? pick(candidates, rnd) : answer + 1

  return { text: `${a} ${op} ${b}`, answer, wrong, op, stage: stageIndex }
}
