import { useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Flag } from '../components/Flag'
import { FlagStack } from '../components/FlagStack'
import { IconBack, IconBook, IconFlag, IconLock, IconPlay, IconTrophy } from '../components/Icons'
import type { ContinentId } from '../data/countries'
import {
  ROUND_SIZE,
  continentStats,
  countriesOf,
  discardSession,
  flagState,
  getContinent,
  nextContinent,
  progressOf,
  sessionKey,
  startSession,
} from '../quiz'
import { goBack, navigate } from '../router'
import { setState } from '../store'
import type { Mode, SaveData } from '../types'

export function ContinentScreen({ data, id }: { data: SaveData; id: ContinentId }) {
  const [confirmRestart, setConfirmRestart] = useState<Mode | null>(null)
  const continent = getContinent(id)
  const stats = continentStats(data, id)
  const progress = progressOf(data, id)
  const practice = data.sessions[sessionKey(id, 'practice')]
  const test = data.sessions[sessionKey(id, 'test')]
  const next = nextContinent(id)
  const countries = countriesOf(id).toSorted((a, b) => a.name.localeCompare(b.name, 'de'))
  const missing = stats.total - stats.seen

  const start = (mode: Mode) => {
    setState((current) => startSession(discardSession(current, id, mode), id, mode))
    navigate({ name: 'quiz', id, mode })
  }

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Zurück" onClick={() => goBack({ name: 'home' })}>
          <IconBack />
        </button>
      </header>

      <section className="hero">
        <FlagStack codes={continent.showcase} large />
        <h1>{continent.name}</h1>
        <p>
          {stats.total} Länder{continent.note ? ` · ${continent.note}` : ''}
        </p>
      </section>

      <div className="stats">
        <div className="stat">
          <strong>
            {stats.seen}
            <small>/{stats.total}</small>
          </strong>
          <span>entdeckt</span>
        </div>
        <div className="stat">
          <strong>
            {stats.solid}
            <small>/{stats.total}</small>
          </strong>
          <span>sicher</span>
        </div>
        <div className="stat">
          <strong>
            {progress.tests > 0 ? progress.bestTest : '–'}
            {progress.tests > 0 && <small>/{stats.total}</small>}
          </strong>
          <span>bester Test</span>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <span className="card-icon">
            <IconBook />
          </span>
          <div>
            <h2>Übungsrunde</h2>
            <p className="card-sub">
              {practice
                ? `Läuft · ${practice.done.length} von ${practice.round.length} geschafft`
                : `${Math.min(ROUND_SIZE, stats.total)} Flaggen pro Runde`}
            </p>
          </div>
        </div>
        <p className="card-text">
          {missing > 0
            ? `Lerne alle Flaggen kennen – noch ${missing} neue. Was du falsch hast, kommt öfter dran.`
            : 'Du kennst jede Flagge schon einmal. Flaggen, die du falsch hattest, kommen öfter dran.'}
        </p>
        {practice ? (
          <>
            <button className="btn btn-primary" onClick={() => navigate({ name: 'quiz', id, mode: 'practice' })}>
              <IconPlay /> Weiterspielen
            </button>
            <button className="btn btn-ghost" onClick={() => setConfirmRestart('practice')}>
              Neue Runde starten
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={() => start('practice')}>
            {progress.rounds > 0 ? 'Nächste Runde starten' : 'Erste Runde starten'}
          </button>
        )}
      </section>

      <section className={`card${stats.testUnlocked ? '' : ' is-locked'}`}>
        <div className="card-head">
          <span className="card-icon card-icon-test">
            {progress.passed ? <IconTrophy /> : stats.testUnlocked ? <IconFlag /> : <IconLock />}
          </span>
          <div>
            <h2>Abschlusstest</h2>
            <p className="card-sub">{progress.passed ? 'Bestanden' : `Alle ${stats.total} Flaggen am Stück`}</p>
          </div>
        </div>
        {!stats.testUnlocked ? (
          <>
            <p className="card-text">Wird freigeschaltet, sobald du in der Übung jede Flagge einmal hattest.</p>
            <div className="lock-note">
              <IconLock /> Noch {missing} {missing === 1 ? 'Flagge' : 'Flaggen'} bis zum Test
            </div>
          </>
        ) : (
          <>
            <p className="card-text">
              {progress.passed
                ? 'Du kannst den Test jederzeit wiederholen.'
                : `Beantworte alle ${stats.total} Flaggen in einem Durchlauf richtig${
                    next ? `, um ${next.name} freizuschalten.` : ' und du hast das ganze Quiz gemeistert.'
                  }`}
            </p>
            {test ? (
              <>
                <button className="btn btn-test" onClick={() => navigate({ name: 'quiz', id, mode: 'test' })}>
                  <IconPlay /> Test fortsetzen · {test.answered}/{test.round.length}
                </button>
                <button className="btn btn-ghost" onClick={() => setConfirmRestart('test')}>
                  Test neu starten
                </button>
              </>
            ) : (
              <button className="btn btn-test" onClick={() => start('test')}>
                {progress.tests > 0 ? 'Test wiederholen' : 'Test starten'}
              </button>
            )}
          </>
        )}
      </section>

      <h2 className="section-title">Deine Flaggen</h2>
      <div className="legend">
        <span>
          <i className="dot dot-solid" /> sicher
        </span>
        <span>
          <i className="dot dot-learning" /> am Lernen
        </span>
        <span>
          <i className="dot dot-wrong" /> zuletzt falsch
        </span>
      </div>
      <ul className="flag-grid">
        {countries.map((country) => {
          const state = flagState(data.stats[country.code])
          return (
            <li key={country.code} className={`tile tile-${state}`}>
              <span className="tile-flag">
                {state === 'new' ? <span className="tile-unknown">?</span> : <Flag code={country.code} />}
              </span>
              <span className="tile-name">{state === 'new' ? 'Unentdeckt' : country.name}</span>
              {state !== 'new' && <i className={`dot dot-${state}`} />}
            </li>
          )
        })}
      </ul>

      {confirmRestart && (
        <ConfirmDialog
          title={confirmRestart === 'test' ? 'Test neu starten?' : 'Neue Runde starten?'}
          text={
            confirmRestart === 'test'
              ? 'Der aktuelle Testlauf wird abgebrochen. Was du über die Flaggen gelernt hast, bleibt gespeichert.'
              : 'Die aktuelle Runde wird abgebrochen. Was du über die Flaggen gelernt hast, bleibt gespeichert.'
          }
          confirmLabel={confirmRestart === 'test' ? 'Test neu starten' : 'Neue Runde'}
          onCancel={() => setConfirmRestart(null)}
          onConfirm={() => {
            const mode = confirmRestart
            setConfirmRestart(null)
            start(mode)
          }}
        />
      )}
    </main>
  )
}
