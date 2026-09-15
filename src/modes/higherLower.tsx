import { Flag } from '../components/Flag'
import { POPULATION, formatPopulation } from '../data/population'
import { accuracyOf, modeProgress } from '../progression'
import { countryName } from '../quiz'
import type { SaveData } from '../types'
import type { QuizMode } from './registry'

export const HIGHER_LOWER_MODE_ID = 'higher-lower'

/** So viel muss sich ein Paar mindestens unterscheiden, damit die Frage eindeutig ist */
const MIN_RATIO = 1.25

const CODES = Object.keys(POPULATION)

/** Große Länder etwas häufiger – kleine Inselstaaten kennt kaum jemand */
const weightOf = (code: string) => Math.max(0.5, Math.log10(POPULATION[code]) - 4)

function pickCode(pool: readonly string[]): string {
  const total = pool.reduce((sum, code) => sum + weightOf(code), 0)
  let ticket = Math.random() * total
  for (const code of pool) {
    ticket -= weightOf(code)
    if (ticket <= 0) return code
  }
  return pool[pool.length - 1]
}

export const pairKey = (a: string, b: string) => `${HIGHER_LOWER_MODE_ID}:${[a, b].sort().join('-')}`

export const higherLowerMode: QuizMode = {
  id: HIGHER_LOWER_MODE_ID,
  name: 'Higher or Lower',
  emoji: '📈',
  tagline: 'Vergleiche die Einwohnerzahlen',

  nextQuestion(_data, recentKeys) {
    const recentCodes = new Set(
      recentKeys
        .filter((key) => key.startsWith(`${HIGHER_LOWER_MODE_ID}:`))
        .flatMap((key) => key.slice(HIGHER_LOWER_MODE_ID.length + 1).split('-')),
    )
    const fresh = CODES.filter((code) => !recentCodes.has(code))
    const pool = fresh.length > 8 ? fresh : CODES

    let a = pickCode(pool)
    let b = pickCode(pool.filter((code) => code !== a))
    for (let attempt = 0; attempt < 40; attempt++) {
      const ratio = Math.max(POPULATION[a], POPULATION[b]) / Math.min(POPULATION[a], POPULATION[b])
      if (ratio >= MIN_RATIO && !recentKeys.includes(pairKey(a, b))) break
      a = pickCode(pool)
      b = pickCode(pool.filter((code) => code !== a))
    }

    return {
      modeId: HIGHER_LOWER_MODE_ID,
      key: pairKey(a, b),
      prompt: 'Welches Land hat mehr Einwohner?',
      data: { a, b },
      options: [
        { id: a, label: countryName(a) },
        { id: b, label: countryName(b) },
      ],
      correctId: POPULATION[a] >= POPULATION[b] ? a : b,
      quickNext: true,
    }
  },

  mastery(data) {
    const progress = modeProgress(data, HIGHER_LOWER_MODE_ID)
    const comboPart = Math.min(1, progress.bestCombo / 40)
    const accuracyPart = progress.answered >= 10 ? accuracyOf(progress) : 0
    return comboPart * 0.5 + accuracyPart * 0.5
  },

  summary(data) {
    const progress = modeProgress(data, HIGHER_LOWER_MODE_ID)
    return [
      { label: 'Beste Combo', value: `${progress.bestCombo}` },
      { label: 'Längster Run', value: progress.bestQuestions > 0 ? `${progress.bestQuestions} Fragen` : '–' },
      { label: 'Fragen', value: `${progress.answered}` },
      { label: 'Trefferquote', value: progress.answered > 0 ? `${Math.round(accuracyOf(progress) * 100)} %` : '–' },
    ]
  },

  renderQuestion: (question, picked) => (
    <div className="versus">
      <Side code={question.data.a} revealed={picked !== null} />
      <span className="versus-vs" aria-hidden="true">
        VS
      </span>
      <Side code={question.data.b} revealed={picked !== null} />
    </div>
  ),

  renderFeedback: (question) => (
    <p className="sheet-hint">
      {countryName(question.data.a)} {formatPopulation(POPULATION[question.data.a])} · {countryName(question.data.b)}{' '}
      {formatPopulation(POPULATION[question.data.b])}
    </p>
  ),
}

function Side({ code, revealed }: { code: string; revealed: boolean }) {
  return (
    <span className="versus-side">
      <span className="versus-flag">
        <Flag code={code} />
      </span>
      <span className="versus-name">{countryName(code)}</span>
      <span className={`versus-value${revealed ? '' : ' is-hidden'}`}>
        {revealed ? formatPopulation(POPULATION[code]) : '?'}
      </span>
    </span>
  )
}

export function populationOf(code: string): number | undefined {
  return POPULATION[code]
}

export type { SaveData }
