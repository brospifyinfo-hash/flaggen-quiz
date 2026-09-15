import { IconChevron, IconPlay, IconSettings } from '../components/Icons'
import { allModes, getMode } from '../modes/registry'
import { ACHIEVEMENTS, bestComboOverall, levelFor, overallMastery, totalAnswered } from '../progression'
import { navigate } from '../router'
import { RANDOM, endRun, startRun } from '../run'
import { setState } from '../store'
import type { SaveData } from '../types'

export function HomeScreen({ data }: { data: SaveData }) {
  const level = levelFor(data.xp)
  const run = data.run
  const runMode = run ? (run.mode === RANDOM ? null : getMode(run.mode)) : null

  const begin = (mode: string) => {
    setState((current) => startRun(endRun(current), mode))
    navigate({ name: 'run' })
  }

  return (
    <main className="screen">
      <header className="home-head">
        <div>
          <p className="eyebrow">Weltwissen</p>
          <h1>Was möchtest du spielen?</h1>
        </div>
        <button className="icon-btn" aria-label="Einstellungen" onClick={() => navigate({ name: 'settings' })}>
          <IconSettings />
        </button>
      </header>

      <section className="level-card">
        <span className="level-badge">
          Lv<strong>{level.level}</strong>
        </span>
        <span className="level-body">
          <span className="level-row">
            <strong>{data.xp.toLocaleString('de-DE')} XP</strong>
            <span>noch {(level.needed - level.into).toLocaleString('de-DE')} bis Level {level.level + 1}</span>
          </span>
          <span className="bar">
            <span style={{ width: `${(level.into / level.needed) * 100}%` }} />
          </span>
        </span>
      </section>

      {run && (
        <button className="resume" onClick={() => navigate({ name: 'run' })}>
          <span className="resume-icon">
            <IconPlay />
          </span>
          <span className="resume-text">
            <small>Run läuft</small>
            <strong>{runMode ? `${runMode.emoji} ${runMode.name}` : '🎲 Random Mode'}</strong>
          </span>
          <span className="resume-count">{run.answered}</span>
        </button>
      )}

      <div className="start-grid">
        <button className="start-card start-random" onClick={() => begin(RANDOM)}>
          <span className="start-emoji" aria-hidden="true">
            🎲
          </span>
          <span className="start-title">Random</span>
          <span className="start-sub">Überrasche mich</span>
        </button>
        <button className="start-card start-specific" onClick={() => navigate({ name: 'specific' })}>
          <span className="start-emoji" aria-hidden="true">
            🎯
          </span>
          <span className="start-title">Specific</span>
          <span className="start-sub">Ich wähle</span>
        </button>
      </div>

      <h2 className="section-title">Dein Stand</h2>
      <div className="stats stats-2">
        <div className="stat">
          <strong>{totalAnswered(data).toLocaleString('de-DE')}</strong>
          <span>Fragen</span>
        </div>
        <div className="stat">
          <strong>{bestComboOverall(data)}</strong>
          <span>Beste Combo</span>
        </div>
        <div className="stat">
          <strong>{Math.round(overallMastery(data) * 100)} %</strong>
          <span>Mastery</span>
        </div>
        <div className="stat">
          <strong>
            {Object.keys(data.achievements).length}
            <small>/{ACHIEVEMENTS.length}</small>
          </strong>
          <span>Achievements</span>
        </div>
      </div>

      <h2 className="section-title">Modi</h2>
      <ul className="mode-strip">
        {allModes().map((mode) => (
          <li key={mode.id}>
            <button className="mode-chip" onClick={() => navigate({ name: 'mode', id: mode.id })}>
              <span className="mode-chip-emoji" aria-hidden="true">
                {mode.emoji}
              </span>
              <span className="mode-chip-body">
                <strong>{mode.name}</strong>
                <span>Mastery {Math.round(mode.mastery(data) * 100)} %</span>
              </span>
              <IconChevron className="continent-arrow" />
            </button>
          </li>
        ))}
      </ul>

      <p className="footnote">Dein Fortschritt wird automatisch auf diesem Gerät gespeichert – ohne Konto und auch offline.</p>
    </main>
  )
}
