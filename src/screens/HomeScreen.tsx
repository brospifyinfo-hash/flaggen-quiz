// Die Startseite ist der Blick über die eigene Stadt: Sie läuft als Kulisse im Hintergrund,
// davor steht, wie weit man ist – und die drei Wege weiter: in die Stadt, ins schnelle Spiel,
// in die Lernkurse.
import { useMemo } from 'react'
import { StadtKulisse } from '../city/StadtKulisse'
import { cityTitle, createCity, statsOf } from '../city/state'
import { istAdmin } from '../admin'
import { IconList, IconMail, IconPlay, IconSettings, IconTrophy } from '../components/Icons'
import { ungelesen } from '../postfach'
import { haptic } from '../haptics'
import { bilanz } from '../herausforderungen'
import { RankCrest } from '../components/RankCrest'
import { kursById } from '../lernen/kurse'
import { ACHIEVEMENTS, bestComboOverall, levelFor, overallMastery, PERFEKT_ZEIT, PERFEKT_ZEIT_KURS, rankFor, totalAnswered } from '../progression'
import { Tagesuhr, useTageszeit } from '../components/Tagesuhr'
import { phaseInfo, zeitText } from '../city/zeit'
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
  // Wer noch keine Stadt hat, sieht trotzdem eine: die Siedlung, mit der jede Stadt beginnt
  const beispiel = useMemo(() => createCity('Deine Stadt', '', '🏙️', 0), [])
  const kulisse = stadt ?? beispiel
  const einwohner = stadt ? statsOf(stadt).population : 0
  const tag = useTageszeit(stadt)
  const hf = bilanz(data)
  const neuePost = ungelesen(data).length

  const gehe = (ziel: Parameters<typeof navigate>[0]) => {
    haptic('soft')
    navigate(ziel)
  }

  return (
    <main className={`home${stadt ? '' : ' ohne-stadt'}`}>
      <StadtKulisse city={kulisse} />
      <div className="home-schleier" aria-hidden="true" />

      <div className="home-inhalt">
        <header className="home-kopf">
          <div className="glas home-stadt">
            <span className="home-wappen" aria-hidden="true">
              {kulisse.emblem}
            </span>
            <span className="home-stadt-text">
              <strong>{stadt ? stadt.name : 'Deine Stadt'}</strong>
              <small>
                {stadt && tag
                  ? `${phaseInfo(tag.phase).name} · ${cityTitle(stadt.level)} · Stufe ${stadt.level}`
                  : 'Noch nicht gegründet'}
              </small>
            </span>
            {tag && <Tagesuhr zeit={tag} size={38} className="home-uhr" />}
          </div>
          <button className="glas home-zahnrad home-pokal" aria-label="Rangliste" onClick={() => gehe({ name: 'rangliste' })}>
            <IconTrophy />
          </button>
          <button
            className={`glas home-zahnrad home-post${neuePost > 0 ? ' hat-neues' : ''}`}
            aria-label={neuePost > 0 ? `Postfach, ${neuePost} neue Nachrichten` : 'Postfach'}
            onClick={() => gehe({ name: 'postfach' })}
          >
            <IconMail />
            {neuePost > 0 && <span className="home-post-zahl">{neuePost}</span>}
          </button>
          {istAdmin(data.konto?.email) && (
            <button className="glas home-zahnrad" aria-label="Verwaltung" onClick={() => gehe({ name: 'verwaltung' })}>
              <IconList />
            </button>
          )}
          <button className="glas home-zahnrad" aria-label="Einstellungen" onClick={() => gehe({ name: 'settings' })}>
            <IconSettings />
          </button>
        </header>

        <section className="glas home-rang">
          <RankCrest rank={rank} size={58} />
          <div className="home-rang-text">
            <strong>{rank.name}</strong>
            <span className="home-rang-zeile">
              Level {level.level} · {zahl(data.xp)} XP
            </span>
            <span className="bar home-bar">
              <span style={{ width: `${next ? (into / needed) * 100 : 100}%` }} />
            </span>
            <small>{next ? `noch ${zahl(needed - into)} XP bis ${next.name}` : 'Höchster Rang erreicht'}</small>
          </div>
        </section>

        <section className="glas home-stand">
          <dl className="home-werte">
            <div>
              <dt>👥 Einwohner</dt>
              <dd>{zahl(einwohner)}</dd>
            </div>
            <div>
              <dt>🪙 Münzen</dt>
              <dd>{zahl(stadt?.coins ?? 0)}</dd>
            </div>
            <div>
              <dt>🧱 Steine</dt>
              <dd>{zahl(stadt?.materials ?? 0)}</dd>
            </div>
          </dl>
          <ul className="home-marken">
            <li>
              <b>{zahl(totalAnswered(data))}</b> Fragen
            </li>
            <li>
              <b>{bestComboOverall(data)}</b> Combo
            </li>
            <li>
              <b>{Math.round(overallMastery(data) * 100)} %</b> Mastery
            </li>
            <li>
              <b>
                {Object.keys(data.achievements).length}/{ACHIEVEMENTS.length}
              </b>{' '}
              Erfolge
            </li>
          </ul>
        </section>

        <div className="home-luft" />

        <div className="home-wege">
          {run && (
            <button className="glas home-weiter" onClick={() => gehe({ name: 'run' })}>
              <span className="home-weiter-icon">
                <IconPlay />
              </span>
              <span className="home-weiter-text">
                <small>Run läuft</small>
                <strong>{runMode ? `${runMode.emoji} ${runMode.name}` : '🎲 Random Mode'}</strong>
              </span>
              <span className="home-weiter-zahl">{run.answered}</span>
            </button>
          )}

          {kursLaeuft && (
            <button className="glas home-weiter" onClick={() => gehe({ name: 'kursSitzung' })}>
              <span className="home-weiter-icon">
                <IconPlay />
              </span>
              <span className="home-weiter-text">
                <small>Session läuft</small>
                <strong>
                  {kursById(kursLaeuft.kurs)?.emoji} {kursById(kursLaeuft.kurs)?.titel}
                </strong>
              </span>
              <span className="home-weiter-zahl">
                {Math.min(kursLaeuft.index + 1, kursLaeuft.laenge)}/{kursLaeuft.laenge}
              </span>
            </button>
          )}

          <button className="home-tor" onClick={() => gehe({ name: 'city' })}>
            <span className="home-tor-emoji" aria-hidden="true">
              🏙️
            </span>
            <span>{stadt ? 'Stadt betreten' : 'Stadt gründen'}</span>
          </button>

          <button className="glas home-weiter home-hf" onClick={() => gehe({ name: 'herausforderungen' })}>
            <span className="home-weiter-icon" aria-hidden="true">
              🎯
            </span>
            <span className="home-weiter-text">
              <small>Herausforderungen · {hf.geschafft}/{hf.gesamt}</small>
              <strong>
                Noch offen: 🪙 {zahl(hf.offen.coins)} · 🧱 {zahl(hf.offen.materials)}
              </strong>
            </span>
          </button>

          <div className="home-paar">
            <button className="glas home-weg is-spiel" onClick={() => gehe({ name: 'specific' })}>
              <span className="home-weg-emoji" aria-hidden="true">
                ⚡
              </span>
              <strong>Schnelles Spiel</strong>
              <small>⏩ {zeitText(PERFEKT_ZEIT)} Vorsprung</small>
              <em>bei 100 %</em>
            </button>
            <button className="glas home-weg is-lernen" onClick={() => gehe({ name: 'kurse' })}>
              <span className="home-weg-emoji" aria-hidden="true">
                🧠
              </span>
              <strong>Lernen</strong>
              <small>⏩ {zeitText(PERFEKT_ZEIT_KURS)} Vorsprung</small>
              <em>bei 100 %</em>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
