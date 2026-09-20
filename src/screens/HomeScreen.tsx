import { cityTitle, statsOf } from '../city/state'
import { IconChevron, IconPlay, IconSettings } from '../components/Icons'
import { haptic } from '../haptics'
import { RankCrest } from '../components/RankCrest'
import { LernweltenStreifen } from '../lernen/LernweltenStreifen'
import { getMode, quizModes } from '../modes/registry'
import { ACHIEVEMENTS, bestComboOverall, levelFor, overallMastery, rankFor, totalAnswered } from '../progression'
import { kursById, ladeAlle } from '../lernen/kurse'
import { navigate } from '../router'
import { RANDOM, endRun, startRun } from '../run'
import { setState } from '../store'
import type { SaveData } from '../types'

export function HomeScreen({ data }: { data: SaveData }) {
  const level = levelFor(data.xp)
  const { rank, next, into, needed } = rankFor(data.xp)
  const run = data.run
  const runMode = run ? (run.mode === RANDOM ? null : getMode(run.mode)) : null
  const kursLaeuft = data.lernen?.sitzung

  const begin = (mode: string) => {
    haptic('soft')
    // Der Random Mode mischt Kurs-Aktivitäten ein – deren Inhalte laden jetzt im Hintergrund
    if (mode === RANDOM) void ladeAlle()
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

      <section className="rank-card">
        <RankCrest rank={rank} />
        <span className="rank-text">
          <span className="rank-name">
            {rank.name}
            <small>Level {level.level}</small>
          </span>
          <span className="rank-meta">{data.xp.toLocaleString('de-DE')} XP gesammelt</span>
          <span className="bar">
            <span style={{ width: `${next ? (into / needed) * 100 : 100}%` }} />
          </span>
          <span className="rank-meta">
            {next
              ? `noch ${(needed - into).toLocaleString('de-DE')} XP bis ${next.name}`
              : 'Höchster Rang erreicht'}
          </span>
        </span>
      </section>

      <button
        className="city-launch"
        onClick={() => {
          haptic('soft')
          navigate({ name: 'city' })
        }}
      >
        <span className="city-launch-emblem" aria-hidden="true">
          {data.city?.emblem ?? '🏙️'}
        </span>
        <span className="city-launch-body">
          <strong>{data.city ? data.city.name : 'Deine Stadt'}</strong>
          <span>
            {data.city
              ? `${cityTitle(data.city.level)} · Stufe ${data.city.level} · 👥 ${statsOf(data.city).population.toLocaleString('de-DE')}`
              : 'Gründen und aus jedem Spiel aufbauen'}
          </span>
        </span>
        <span className="city-launch-go">
          {data.city ? `🪙 ${data.city.coins.toLocaleString('de-DE')}` : 'NEU'}
        </span>
      </button>

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

      {kursLaeuft && (
        <button className="resume" onClick={() => navigate({ name: 'kursSitzung' })}>
          <span className="resume-icon">
            <IconPlay />
          </span>
          <span className="resume-text">
            <small>Session läuft</small>
            <strong>{kursById(kursLaeuft.kurs)?.emoji} {kursById(kursLaeuft.kurs)?.titel}</strong>
          </span>
          <span className="resume-count">
            {Math.min(kursLaeuft.index + 1, kursLaeuft.laenge)}/{kursLaeuft.laenge}
          </span>
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

      <LernweltenStreifen data={data} />

      <button
        className="mr-launch"
        onClick={() => {
          haptic('soft')
          navigate({ name: 'mathRunner' })
        }}
      >
        <span className="mr-launch-emoji" aria-hidden="true">
          🧮
        </span>
        <span className="mr-launch-body">
          <strong>MATH RUNNER</strong>
          <span>Kopfrechnen im Renntempo</span>
        </span>
        <span className="mr-launch-score">
          {(data.mathRunner?.highScore ?? 0).toLocaleString('de-DE')}
          <small>HIGHSCORE</small>
        </span>
      </button>

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
        {quizModes().map((mode) => (
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
