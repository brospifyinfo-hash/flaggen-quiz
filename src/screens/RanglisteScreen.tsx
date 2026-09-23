// Die fünf größten Städte. Nicht auf der Startseite, sondern hinter einem eigenen Knopf.
import { useEffect, useState } from 'react'
import type { RanglisteEintrag } from '../admin'
import { IconBack } from '../components/Icons'
import { Rangliste } from '../components/Rangliste'
import { ladeRangliste } from '../konto'
import { goBack } from '../router'

export function RanglisteScreen() {
  const [spieler, setSpieler] = useState<RanglisteEintrag[] | null>(null)
  const [fehler, setFehler] = useState(false)

  useEffect(() => {
    let weg = false
    ladeRangliste()
      .then((liste) => {
        if (!weg) setSpieler(liste)
      })
      .catch(() => {
        if (!weg) {
          setSpieler([])
          setFehler(true)
        }
      })
    return () => {
      weg = true
    }
  }, [])

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Zurück" onClick={() => goBack({ name: 'home' })}>
          <IconBack />
        </button>
        <h1>Rangliste</h1>
      </header>

      <p className="verwaltung-hinweis">Die fünf Städte mit den meisten Einwohnern. Die Schattenkasse zählt hier nicht mit.</p>

      {spieler === null && <p className="verwaltung-hinweis">Lädt …</p>}
      {spieler && spieler.length > 0 && <Rangliste spieler={spieler} />}
      {spieler && spieler.length === 0 && (
        <p className="verwaltung-hinweis">
          {fehler ? 'Die Rangliste ist gerade nicht erreichbar.' : 'Sobald Städte wachsen, stehen hier die fünf größten.'}
        </p>
      )}
    </main>
  )
}
