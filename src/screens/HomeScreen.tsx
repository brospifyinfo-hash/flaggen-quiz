import { FlagStack } from '../components/FlagStack'
import { IconCheck, IconChevron, IconLock, IconPlay, IconSettings } from '../components/Icons'
import { ProgressRing } from '../components/ProgressRing'
import { CONTINENTS, COUNTRIES } from '../data/countries'
import { continentStats, getContinent, isContinentUnlocked, latestSession, progressOf } from '../quiz'
import { navigate } from '../router'
import type { SaveData } from '../types'

export function HomeScreen({ data }: { data: SaveData }) {
  const seen = COUNTRIES.filter((country) => (data.stats[country.code]?.seen ?? 0) > 0).length
  const mastered = CONTINENTS.filter((continent) => progressOf(data, continent.id).passed).length
  const resume = latestSession(data)

  return (
    <main className="screen">
      <header className="home-head">
        <div>
          <p className="eyebrow">Flaggen-Quiz</p>
          <h1>Alle Flaggen der Welt</h1>
        </div>
        <button className="icon-btn" aria-label="Einstellungen" onClick={() => navigate({ name: 'settings' })}>
          <IconSettings />
        </button>
      </header>

      <section className="summary">
        <ProgressRing value={seen / COUNTRIES.length}>{Math.round((seen / COUNTRIES.length) * 100)}%</ProgressRing>
        <div className="summary-text">
          <strong>
            {seen} von {COUNTRIES.length} Flaggen entdeckt
          </strong>
          <span>
            {mastered} von {CONTINENTS.length} Kontinenten gemeistert
          </span>
        </div>
      </section>

      {resume && (
        <button
          className="resume"
          onClick={() => navigate({ name: 'quiz', id: resume.continent, mode: resume.mode })}
        >
          <span className="resume-icon">
            <IconPlay />
          </span>
          <span className="resume-text">
            <small>Weiterspielen</small>
            <strong>
              {getContinent(resume.continent).name} · {resume.mode === 'test' ? 'Abschlusstest' : 'Übungsrunde'}
            </strong>
          </span>
          <span className="resume-count">
            {resume.mode === 'test' ? resume.answered : resume.done.length}/{resume.round.length}
          </span>
        </button>
      )}

      <h2 className="section-title">Kontinente</h2>
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

      <p className="footnote">Dein Fortschritt wird automatisch auf diesem Gerät gespeichert – ohne Konto und auch offline.</p>
    </main>
  )
}
