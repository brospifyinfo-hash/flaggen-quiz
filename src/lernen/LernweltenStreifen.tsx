// Die Kurse als Karten auf Startseite und im Specific Mode. Klein gehalten: Die eigentlichen
// Kursseiten und Spiele laden erst, wenn man eine Karte antippt.
import { haptic } from '../haptics'
import { navigate } from '../router'
import type { SaveData } from '../types'
import { kursStand } from './fortschritt'
import { KURSE, ladeKurs } from './kurse'
import { bandVon, kursWert } from './meisterschaft'

export function LernweltenStreifen({ data, titel = 'Lernwelten' }: { data: SaveData; titel?: string }) {
  return (
    <section className="lw-streifen" aria-label={titel}>
      <h2 className="section-title">🧠 {titel}</h2>
      <div className="lw-kurs-karten">
        {KURSE.map((kurs) => {
          const stand = kursStand(data, kurs.id)
          const wert = kursWert(kurs, stand)
          const begonnen = (stand?.aktivitaeten ?? 0) > 0
          return (
            <button
              key={kurs.id}
              className={`lw-kurs-karte ${kurs.thema}`}
              onPointerDown={() => void ladeKurs(kurs.id).catch(() => undefined)}
              onClick={() => {
                haptic('soft')
                navigate({ name: 'kurs', id: kurs.id })
              }}
            >
              <span className="lw-kurs-emoji" aria-hidden="true">
                {kurs.emoji}
              </span>
              <strong>{kurs.titel}</strong>
              <small>{begonnen ? `${Math.round(wert * 100)} % · ${bandVon(wert).name}` : 'Neu · jetzt starten'}</small>
              <span className="bar">
                <span style={{ width: `${Math.round(wert * 100)}%` }} />
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
