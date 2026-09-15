import { Confetti } from '../components/Confetti'
import { getMode } from '../modes/registry'
import { achievementById, modeProgress } from '../progression'
import { goBack, navigate } from '../router'
import { RANDOM, startRun } from '../run'
import { setState } from '../store'
import type { RunResult, SaveData } from '../types'

const RECORD_LABEL: Record<string, string> = {
  combo: 'beste Combo',
  xp: 'meiste XP',
  questions: 'längster Run',
  accuracy: 'beste Trefferquote',
}

export function RunResultScreen({ data, result }: { data: SaveData; result: RunResult }) {
  const mode = result.mode === RANDOM ? null : getMode(result.mode)
  const accuracy = result.answered > 0 ? result.correct / result.answered : 0
  const best = modeProgress(data, result.mode)
  const records = result.records.map((record) => RECORD_LABEL[record] ?? record)
  const achievements = result.achievements.map(achievementById).filter((entry) => entry !== undefined)

  const again = () => {
    setState((current) => startRun(current, result.mode))
    navigate({ name: 'run' }, { replace: true })
  }

  return (
    <main className="screen result">
      {records.length > 0 && <Confetti />}

      <section className="result-hero">
        <div className="result-emoji" aria-hidden="true">
          {records.length > 0 ? '🏆' : accuracy >= 0.8 ? '🎉' : '💪'}
        </div>
        <h1>Run beendet</h1>
        <p>{mode ? `${mode.emoji} ${mode.name}` : '🎲 Random Mode'}</p>
      </section>

      {records.length > 0 && (
        <div className="record-banner">
          <span aria-hidden="true">🏆</span>
          <span>
            Neuer Rekord: <strong>{records.join(', ')}</strong>
          </span>
        </div>
      )}

      <ul className="result-grid">
        <li>
          <strong>{result.answered}</strong>
          <span>Fragen</span>
        </li>
        <li>
          <strong>{result.correct}</strong>
          <span>Richtig</span>
        </li>
        <li>
          <strong>{Math.round(accuracy * 100)} %</strong>
          <span>Trefferquote</span>
        </li>
        <li>
          <strong>{result.bestCombo}</strong>
          <span>Beste Combo</span>
        </li>
        <li>
          <strong>+{result.xp.toLocaleString('de-DE')}</strong>
          <span>XP</span>
        </li>
        <li>
          <strong>
            {result.masteryDelta > 0.0005
              ? `+${(result.masteryDelta * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 })} %`
              : '±0 %'}
          </strong>
          <span>Mastery</span>
        </li>
      </ul>

      {achievements.length > 0 && (
        <>
          <h2 className="section-title">Neue Achievements</h2>
          <ul className="achievements">
            {achievements.map((achievement) => (
              <li key={achievement.id} className="achievement">
                <span className="achievement-emoji" aria-hidden="true">
                  {achievement.emoji}
                </span>
                <span>
                  <strong>{achievement.title}</strong>
                  <span>{achievement.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="section-title">{mode ? `Bestwerte ${mode.name}` : 'Random Best'}</h2>
      <ul className="records">
        <li>
          <span>Beste Combo</span>
          <strong>{best.bestCombo}</strong>
        </li>
        <li>
          <span>Meiste XP in einem Run</span>
          <strong>{best.bestXp.toLocaleString('de-DE')}</strong>
        </li>
        <li>
          <span>Längster Run</span>
          <strong>{best.bestQuestions} Fragen</strong>
        </li>
        <li>
          <span>Beste Trefferquote</span>
          <strong>{best.bestAccuracy > 0 ? `${Math.round(best.bestAccuracy * 100)} %` : '–'}</strong>
        </li>
      </ul>

      <div className="actions">
        <button className="btn btn-primary" onClick={again}>
          Nochmal spielen
        </button>
        <button className="btn btn-ghost" onClick={() => goBack({ name: 'home' })}>
          Zur Startseite
        </button>
      </div>
    </main>
  )
}
