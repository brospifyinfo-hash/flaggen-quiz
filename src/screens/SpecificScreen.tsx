// Schnelles Spiel: kurze Quizrunden. Random mischt alles, die einzelnen Modi üben gezielt.
// Alle Karten sind gleich gebaut – und zeigen, was ein fehlerfreier Lauf einbringt.
import { IconBack, IconChevron } from '../components/Icons'
import { haptic } from '../haptics'
import { ladeAlle } from '../lernen/kurse'
import { quizModes } from '../modes/registry'
import { PERFEKT_LOHN, PERFEKTLAUF } from '../progression'
import { goBack, navigate } from '../router'
import { RANDOM, endRun, startRun } from '../run'
import { setState } from '../store'
import type { SaveData } from '../types'

const zahl = (n: number) => n.toLocaleString('de-DE')

export function SpecificScreen({ data }: { data: SaveData }) {
  const lohn = `🪙 ${zahl(PERFEKT_LOHN.coins)} · 🧱 ${zahl(PERFEKT_LOHN.materials)} bei ${PERFEKTLAUF} fehlerfreien Fragen`

  const starteRandom = () => {
    haptic('soft')
    void ladeAlle()
    setState((current) => startRun(endRun(current), RANDOM))
    navigate({ name: 'run' })
  }

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Zurück" onClick={() => goBack({ name: 'home' })}>
          <IconBack />
        </button>
        <h1>Schnelles Spiel</h1>
      </header>

      <ul className="quiz-liste">
        <li>
          <button className="quiz-karte is-random" onClick={starteRandom}>
            <span className="quiz-emoji" aria-hidden="true">
              🎲
            </span>
            <span className="quiz-text">
              <strong>Random</strong>
              <small>Alles gemischt – auch Aufgaben aus den Lernkursen</small>
              <span className="quiz-lohn">{lohn}</span>
            </span>
            <IconChevron className="continent-arrow" />
          </button>
        </li>

        {quizModes().map((mode) => {
          const mastery = Math.round(mode.mastery(data) * 100)
          const fakten = mode.summary(data).slice(0, 2)
          return (
            <li key={mode.id}>
              <button className="quiz-karte" onClick={() => navigate({ name: 'mode', id: mode.id })}>
                <span className="quiz-emoji" aria-hidden="true">
                  {mode.emoji}
                </span>
                <span className="quiz-text">
                  <strong>{mode.name}</strong>
                  <small>{mode.tagline}</small>
                  <span className="bar quiz-bar">
                    <span style={{ width: `${mastery}%` }} />
                  </span>
                  <small className="quiz-fakten">
                    Mastery {mastery} %
                    {fakten.length ? ` · ${fakten.map((fakt) => `${fakt.label}: ${fakt.value}`).join(' · ')}` : ''}
                  </small>
                  <span className="quiz-lohn">{lohn}</span>
                </span>
                <IconChevron className="continent-arrow" />
              </button>
            </li>
          )
        })}

        <li>
          <button
            className="quiz-karte is-mathrunner"
            onClick={() => {
              haptic('soft')
              navigate({ name: 'mathRunner' })
            }}
          >
            <span className="quiz-emoji" aria-hidden="true">
              🧮
            </span>
            <span className="quiz-text">
              <strong>Math Runner</strong>
              <small>Kopfrechnen im Renntempo</small>
              <span className="quiz-lohn">
                🏁 Highscore {zahl(data.mathRunner?.highScore ?? 0)} · XP für jeden Lauf
              </span>
            </span>
            <IconChevron className="continent-arrow" />
          </button>
        </li>
      </ul>

      <p className="footnote">
        Ein Lauf endet, wann du willst. Die ersten {PERFEKTLAUF} Fragen ohne Fehler bringen den Jackpot für deine Stadt –
        einmal pro Lauf.
      </p>
    </main>
  )
}
