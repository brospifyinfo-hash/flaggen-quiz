import { IconBack, IconPlay } from '../components/Icons'
import { getMode } from '../modes/registry'
import { modeProgress } from '../progression'
import { goBack, navigate } from '../router'
import { endRun, startRun } from '../run'
import { setState } from '../store'
import type { SaveData } from '../types'

export function ModeScreen({ data, id }: { data: SaveData; id: string }) {
  const mode = getMode(id)
  if (!mode) return null
  const progress = modeProgress(data, id)
  const running = data.run?.mode === id
  const mastery = Math.round(mode.mastery(data) * 100)

  const begin = () => {
    setState((current) => startRun(endRun(current), id))
    navigate({ name: 'run' })
  }

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Zurück" onClick={() => goBack({ name: 'specific' })}>
          <IconBack />
        </button>
      </header>

      <section className="hero">
        <div className="mode-hero-emoji" aria-hidden="true">
          {mode.emoji}
        </div>
        <h1>{mode.name}</h1>
        <p>{mode.tagline}</p>
        <span className="bar bar-wide">
          <span style={{ width: `${mastery}%` }} />
        </span>
        <p className="mode-mastery">Mastery {mastery} %</p>
      </section>

      <div className="stats stats-2">
        {mode.summary(data).map((line) => (
          <div key={line.label} className="stat">
            <strong>{line.value}</strong>
            <span>{line.label}</span>
          </div>
        ))}
      </div>

      {running ? (
        <button className="btn btn-primary run-start" onClick={() => navigate({ name: 'run' })}>
          <IconPlay /> Run fortsetzen · {data.run?.answered} Fragen
        </button>
      ) : (
        <button className="btn btn-primary run-start" onClick={begin}>
          <IconPlay /> Run starten
        </button>
      )}
      <p className="mode-note">Endlos spielbar – du beendest den Run, wann du willst.</p>

      <h2 className="section-title">Bestwerte</h2>
      <ul className="records">
        <li>
          <span>Beste Combo</span>
          <strong>{progress.bestCombo}</strong>
        </li>
        <li>
          <span>Meiste XP in einem Run</span>
          <strong>{progress.bestXp.toLocaleString('de-DE')}</strong>
        </li>
        <li>
          <span>Längster Run</span>
          <strong>{progress.bestQuestions} Fragen</strong>
        </li>
        <li>
          <span>Beste Trefferquote</span>
          <strong>{progress.bestAccuracy > 0 ? `${Math.round(progress.bestAccuracy * 100)} %` : '–'}</strong>
        </li>
        <li>
          <span>Runs gespielt</span>
          <strong>{progress.runs}</strong>
        </li>
      </ul>

      {mode.renderExtra?.(data)}
    </main>
  )
}
