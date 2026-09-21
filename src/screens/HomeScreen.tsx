import { cityTitle, statsOf } from '../city/state'
import { IconPlay, IconSettings } from '../components/Icons'
import { haptic } from '../haptics'
import { RankCrest } from '../components/RankCrest'
import { KURSE, kursById } from '../lernen/kurse'
import { ACHIEVEMENTS, bestComboOverall, levelFor, overallMastery, PERFEKT_LOHN, PERFEKT_LOHN_KURS, rankFor, totalAnswered } from '../progression'
import { navigate } from '../router'
import { getMode } from '../modes/registry'
import { RANDOM } from '../run'
import type { SaveData } from '../types'

const zahl = (n: number) => n.toLocaleString('de-DE')

export function HomeScreen({ data }: { data: SaveData }) {
  const level = levelFor(data.xp)
  const { rank, next, into, needed } = rankFor(data.xp)
  const run = data.run
  const runMode = run ? (run.mode === RANDOM ? null : getMode(run.mode)) : null
  const kursLaeuft = data.lernen?.sitzung
  const stadt = data.city
  const einwohner = stadt ? statsOf(stadt).population : 0

  return (
    <main className="screen home">
      <header className="home-head">
        <div>
          <p className="eyebrow">Weltwissen</p>
          <h1>{stadt ? 'Schön, dass du da bist' : 'Was möchtest du spielen?'}</h1>
        </div>
        <button className="icon-btn" aria-label="Einstellungen" onClick={() => navigate({ name: 'settings' })}>
          <IconSettings />
        </button>
      </header>

      {/* Der Rang steht groß oben – darunter alles, was den eigenen Stand ausmacht */}
      <section className="held">
        <div className="held-rang">
          <RankCrest rank={rank} />
          <div className="held-text">
            <strong className="held-name">{rank.name}</strong>
            <span className="held-level">Level {level.level}</span>
            <span className="held-xp">{zahl(data.xp)} XP</span>
          </div>
        </div>
        <div className="held-bar">
          <span className="bar held-fortschritt">
            <span style={{ width: `${next ? (into / needed) * 100 : 100}%` }} />
          </span>
          <small>{next ? `noch ${zahl(needed - into)} XP bis ${next.name}` : 'Höchster Rang erreicht'}</small>
        </div>
        <dl className="held-zahlen">
          <div>
            <dt>Fragen</dt>
            <dd>{zahl(totalAnswered(data))}</dd>
          </div>
          <div>
            <dt>Beste Combo</dt>
            <dd>{bestComboOverall(data)}</dd>
          </div>
          <div>
            <dt>Mastery</dt>
            <dd>{Math.round(overallMastery(data) * 100)} %</dd>
          </div>
          <div>
            <dt>Erfolge</dt>
            <dd>
              {Object.keys(data.achievements).length}
              <small>/{ACHIEVEMENTS.length}</small>
            </dd>
          </div>
        </dl>
      </section>

      {/* Die Stadt: Name, Motto, Kasse, Einwohner – und der Weg hinein */}
      <section className={`stadtkarte${stadt ? '' : ' is-neu'}`}>
        <span className="stadtkarte-emblem" aria-hidden="true">
          {stadt?.emblem ?? '🏙️'}
        </span>
        <div className="stadtkarte-kopf">
          <strong>{stadt ? stadt.name : 'Deine Stadt'}</strong>
          <span className="stadtkarte-motto">
            {stadt ? stadt.motto || `${cityTitle(stadt.level)} · Stufe ${stadt.level}` : 'Gründen und aus jedem Spiel aufbauen'}
          </span>
        </div>
        {stadt && (
          <dl className="stadtkarte-zahlen">
            <div>
              <dt>Münzen</dt>
              <dd>🪙 {zahl(stadt.coins)}</dd>
            </div>
            <div>
              <dt>Steine</dt>
              <dd>🧱 {zahl(stadt.materials)}</dd>
            </div>
            <div>
              <dt>Einwohner</dt>
              <dd>👥 {zahl(einwohner)}</dd>
            </div>
          </dl>
        )}
        <button
          className="btn btn-primary stadtkarte-knopf"
          onClick={() => {
            haptic('soft')
            navigate({ name: 'city' })
          }}
        >
          {stadt ? '🏙️ Stadt betreten' : '🏙️ Stadt gründen'}
        </button>
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

      {kursLaeuft && (
        <button className="resume" onClick={() => navigate({ name: 'kursSitzung' })}>
          <span className="resume-icon">
            <IconPlay />
          </span>
          <span className="resume-text">
            <small>Session läuft</small>
            <strong>
              {kursById(kursLaeuft.kurs)?.emoji} {kursById(kursLaeuft.kurs)?.titel}
            </strong>
          </span>
          <span className="resume-count">
            {Math.min(kursLaeuft.index + 1, kursLaeuft.laenge)}/{kursLaeuft.laenge}
          </span>
        </button>
      )}

      {/* Zwei Wege ins Spiel: kurz und schnell – oder ein Kurs mit vielen Spielen */}
      <h2 className="section-title">Spielen</h2>
      <div className="wege">
        <button className="weg weg-schnell" onClick={() => navigate({ name: 'specific' })}>
          <span className="weg-emoji" aria-hidden="true">
            ⚡
          </span>
          <strong>Schnelles Spiel</strong>
          <span className="weg-text">Quizrunden, so lange du willst</span>
          <span className="weg-lohn">
            🪙 {zahl(PERFEKT_LOHN.coins)} · 🧱 {zahl(PERFEKT_LOHN.materials)} bei 100 %
          </span>
        </button>
        <button className="weg weg-lernen" onClick={() => navigate({ name: 'kurse' })}>
          <span className="weg-emoji" aria-hidden="true">
            🧠
          </span>
          <strong>Lernkurse</strong>
          <span className="weg-text">{KURSE.length} Kurse, viele Spielarten</span>
          <span className="weg-lohn">
            🪙 {zahl(PERFEKT_LOHN_KURS.coins)} · 🧱 {zahl(PERFEKT_LOHN_KURS.materials)} bei 100 %
          </span>
        </button>
      </div>

      <p className="footnote">Dein Fortschritt wird automatisch auf diesem Gerät gespeichert – ohne Konto und auch offline.</p>
    </main>
  )
}
