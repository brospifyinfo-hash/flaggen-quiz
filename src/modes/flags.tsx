import { Flag } from '../components/Flag'
import { FlagStack } from '../components/FlagStack'
import { IconCheck, IconChevron, IconLock } from '../components/Icons'
import { CONTINENTS, COUNTRIES } from '../data/countries'
import { accuracyOf, modeProgress } from '../progression'
import {
  continentOfCode,
  continentStats,
  countryName,
  flagState,
  isContinentUnlocked,
  makeQuestion,
  pickCountryForRun,
  progressOf,
} from '../quiz'
import { navigate } from '../router'
import type { ModeQuestion, SaveData } from '../types'
import type { QuizMode } from './registry'

export const FLAGS_MODE_ID = 'flaggen'

const solidCount = (data: SaveData) =>
  COUNTRIES.filter((country) => flagState(data.stats[country.code]) === 'solid').length

const seenCount = (data: SaveData) => COUNTRIES.filter((country) => (data.stats[country.code]?.seen ?? 0) > 0).length

export const flagsMode: QuizMode = {
  id: FLAGS_MODE_ID,
  name: 'Flaggen',
  emoji: '🌍',
  tagline: 'Erkenne Länder anhand ihrer Flaggen',

  nextQuestion(data, recentKeys) {
    const recentCodes = recentKeys
      .filter((key) => key.startsWith(`${FLAGS_MODE_ID}:`))
      .map((key) => key.slice(FLAGS_MODE_ID.length + 1))
    const code = pickCountryForRun(data, recentCodes)
    const continent = code ? continentOfCode(code) : null
    if (!code || !continent) return null
    const question = makeQuestion(code, continent)
    return {
      modeId: FLAGS_MODE_ID,
      key: `${FLAGS_MODE_ID}:${code}`,
      prompt: 'Welches Land ist das?',
      data: { code },
      options: question.options.map((option) => ({ id: option, label: countryName(option) })),
      correctId: code,
    }
  },

  // Der Lernstand je Flagge ist derselbe wie in der Kontinent-Reise
  recordAnswer(data, question, correct, now) {
    const code = question.data.code
    const prev = data.stats[code]
    return {
      ...data,
      stats: {
        ...data.stats,
        [code]: {
          seen: (prev?.seen ?? 0) + 1,
          right: (prev?.right ?? 0) + (correct ? 1 : 0),
          wrong: (prev?.wrong ?? 0) + (correct ? 0 : 1),
          streak: correct ? (prev?.streak ?? 0) + 1 : 0,
          lastWrong: !correct,
          lastSeen: now,
        },
      },
    }
  },

  // Teilwissen zählt mit: einmal richtig zählt anteilig, ab zweimal in Folge fast voll
  mastery: (data) =>
    COUNTRIES.reduce((sum, country) => {
      const stat = data.stats[country.code]
      if (!stat?.seen) return sum
      if (stat.lastWrong) return sum + 0.25
      return sum + (stat.streak >= 3 ? 1 : stat.streak >= 2 ? 0.85 : 0.6)
    }, 0) / COUNTRIES.length,

  summary(data) {
    const progress = modeProgress(data, FLAGS_MODE_ID)
    return [
      { label: 'Flaggen gesehen', value: `${seenCount(data)} / ${COUNTRIES.length}` },
      { label: 'Sicher', value: `${solidCount(data)}` },
      { label: 'Beste Combo', value: `${progress.bestCombo}` },
      { label: 'Trefferquote', value: progress.answered > 0 ? `${Math.round(accuracyOf(progress) * 100)} %` : '–' },
    ]
  },

  renderQuestion: (question) => (
    <div className="stage" role="img" aria-label="Flagge">
      <Flag code={question.data.code} />
    </div>
  ),

  renderFeedback: (question, picked) =>
    picked === question.correctId ? null : (
      <div className="sheet-compare">
        <span className="sheet-compare-flag">
          <Flag code={picked} />
        </span>
        <span>
          So sieht <strong>{countryName(picked)}</strong> aus.
        </span>
      </div>
    ),

  renderExtra: (data) => <FlagJourney data={data} />,
}

/** Die Kontinent-Reise: Übungsrunden und Abschlusstests, Kontinent für Kontinent */
function FlagJourney({ data }: { data: SaveData }) {
  return (
    <>
      <h2 className="section-title">Kontinent-Reise</h2>
      <p className="mode-note">
        Lerne Kontinent für Kontinent: Übungsrunden mit 20 Flaggen, dann der Abschlusstest. Erst ein fehlerfreier Test
        öffnet den nächsten Kontinent.
      </p>
      <ol className="continents">
        {CONTINENTS.map((continent, index) => {
          const unlocked = isContinentUnlocked(data, continent.id)
          const stats = continentStats(data, continent.id)
          const { passed } = progressOf(data, continent.id)
          const tone = passed ? 'good' : stats.testUnlocked ? 'warn' : 'primary'
          const sub = !unlocked
            ? `Schließe zuerst ${CONTINENTS[index - 1].name} ab`
            : passed
              ? `${stats.total} Länder · Test bestanden`
              : stats.testUnlocked
                ? `${stats.total} Länder · Abschlusstest bereit`
                : `${stats.seen} von ${stats.total} Flaggen entdeckt`

          return (
            <li key={continent.id}>
              <button
                className={`continent${unlocked ? '' : ' is-locked'}`}
                aria-disabled={!unlocked}
                onClick={() => unlocked && navigate({ name: 'continent', id: continent.id })}
              >
                <FlagStack codes={continent.showcase} />
                <span className="continent-body">
                  <span className="continent-title">
                    {continent.name}
                    {passed && (
                      <span className="badge badge-good">
                        <IconCheck /> Gemeistert
                      </span>
                    )}
                  </span>
                  <span className="continent-sub">{sub}</span>
                  {unlocked && (
                    <span className={`bar bar-${tone}`}>
                      <span style={{ width: `${(stats.seen / stats.total) * 100}%` }} />
                    </span>
                  )}
                </span>
                {unlocked ? <IconChevron className="continent-arrow" /> : <IconLock className="continent-arrow" />}
              </button>
            </li>
          )
        })}
      </ol>
    </>
  )
}

export type { ModeQuestion }
