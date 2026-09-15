import { IconBack, IconChevron } from '../components/Icons'
import { allModes } from '../modes/registry'
import { goBack, navigate } from '../router'
import type { SaveData } from '../types'

export function SpecificScreen({ data }: { data: SaveData }) {
  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Zurück" onClick={() => goBack({ name: 'home' })}>
          <IconBack />
        </button>
        <h1>Was willst du trainieren?</h1>
      </header>

      <ul className="mode-list">
        {allModes().map((mode) => {
          const mastery = Math.round(mode.mastery(data) * 100)
          const facts = mode.summary(data).slice(0, 2)
          return (
            <li key={mode.id}>
              <button className="mode-card" onClick={() => navigate({ name: 'mode', id: mode.id })}>
                <span className="mode-emoji" aria-hidden="true">
                  {mode.emoji}
                </span>
                <span className="mode-body">
                  <span className="mode-title">{mode.name}</span>
                  <span className="mode-tagline">{mode.tagline}</span>
                  <span className="mode-facts">
                    {facts.map((fact) => `${fact.label}: ${fact.value}`).join(' · ')}
                  </span>
                  <span className="bar">
                    <span style={{ width: `${mastery}%` }} />
                  </span>
                  <span className="mode-mastery">Mastery {mastery} %</span>
                </span>
                <IconChevron className="continent-arrow" />
              </button>
            </li>
          )
        })}
      </ul>

      <p className="footnote">Weitere Kategorien kommen dazu und tauchen dann automatisch hier und im Random Mode auf.</p>
    </main>
  )
}
