// Die Bilanz einer Session: Combo, XP, Münzen, Wissen, was sich verbessert hat – und was das
// für die Stadt bedeutet. Wurde ein Gebäude frei, geht es mit einem Tipp direkt ans Bauen.
import { useEffect } from 'react'
import { buildingDef, unlockInfo } from '../../city/catalog'
import { merkeBau } from '../../city/vormerkung'
import { Confetti } from '../../components/Confetti'
import { levels } from '../../knowledge'
import { achievementById } from '../../progression'
import { navigate } from '../../router'
import { setState } from '../../store'
import type { SaveData } from '../../types'
import { naechstesStadtZiel } from '../belohnung'
import { lernen } from '../fortschritt'
import { inhaltVon, kursById, spielById, zielById } from '../kurse'
import { starteSitzung } from '../sitzung'
import { breite, prozent, rueckmeldung } from './gemeinsam'
import './lernen.css'

export function ErgebnisScreen({ data }: { data: SaveData }) {
  const b = lernen(data).letzte
  const kurs = b ? kursById(b.kurs) : undefined

  useEffect(() => {
    if (b?.perfekt || (b?.freigeschaltet.length ?? 0) > 0) rueckmeldung.geschafft()
    // nur beim Öffnen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!b || !kurs) return null
  const stadt = naechstesStadtZiel(data, kurs)
  const verbessert = b.ziele.filter((z) => z.nachher - z.vorher > 0.001).slice(0, 4)
  const geschafft = b.aktivitaeten.filter((a) => a.punkte >= 0.7).length

  const nochmal = () => {
    rueckmeldung.wahl()
    if (inhaltVon(kurs.id)) {
      setState((d) => starteSitzung(d, kurs.id, b.laenge))
      navigate({ name: 'kursSitzung' }, { replace: true })
    } else {
      navigate({ name: 'kurs', id: kurs.id }, { replace: true })
    }
  }

  const bauen = (id: string) => {
    rueckmeldung.wahl()
    merkeBau(id)
    navigate({ name: 'city' })
  }

  return (
    <main className={`screen lern-welt ${kurs.thema} lw-bilanz`}>
      {(b.perfekt || b.freigeschaltet.length > 0) && <Confetti />}
      <section className="lw-bilanz-held">
        <span className="lw-bilanz-emoji" aria-hidden="true">
          {b.perfekt ? '🏆' : geschafft >= b.aktivitaeten.length / 2 ? '🎉' : '🌱'}
        </span>
        <p className="eyebrow">
          {kurs.emoji} {kurs.titel}
        </p>
        <h1>{b.perfekt ? 'Perfekte Session!' : 'Session geschafft'}</h1>
        <p className="lw-bilanz-unter">
          {geschafft} von {b.aktivitaeten.length} Challenges gemeistert
          {b.bestCombo > 1 ? ` · 🔥 ${b.bestCombo}er-Combo` : ''}
        </p>
      </section>

      <div className="lw-beute">
        <span>
          <strong>⭐ +{b.xp.toLocaleString('de-DE')}</strong>
          <small>XP{b.bonus > 0 ? ` (inkl. +${b.bonus} Bonus)` : ''}</small>
        </span>
        <span>
          <strong>🪙 +{b.muenzen.toLocaleString('de-DE')}</strong>
          <small>{data.city ? 'Münzen' : 'Münzen, sobald du eine Stadt hast'}</small>
        </span>
        <span>
          <strong>🧱 +{b.material}</strong>
          <small>Material</small>
        </span>
        <span>
          <strong>🧠 +{b.wissen.toLocaleString('de-DE')}</strong>
          <small>{kurs.wissen}</small>
        </span>
      </div>

      <h2 className="section-title">Deine Challenges</h2>
      <ul className="lw-bilanz-liste">
        {b.aktivitaeten.map((a, i) => {
          const spiel = spielById(a.spiel)
          return (
            <li key={i} className={a.punkte >= 0.7 ? 'is-gut' : a.punkte >= 0.4 ? 'is-halb' : 'is-schlecht'}>
              <span aria-hidden="true">{spiel?.emoji}</span>
              <span>
                <strong>{spiel?.name}</strong>
                <small>{zielById(kurs, a.ziel)?.titel}</small>
              </span>
              <span className="lw-bilanz-wert">{prozent(a.punkte)}</span>
            </li>
          )
        })}
      </ul>

      {verbessert.length > 0 && (
        <>
          <h2 className="section-title">Das hat sich verbessert</h2>
          <ul className="lw-besser">
            {verbessert.map((z) => (
              <li key={z.id}>
                <span>{zielById(kurs, z.id)?.titel ?? z.id}</span>
                <span className="bar lw-bar">
                  <span style={{ width: breite(z.nachher) }} />
                </span>
                <strong>+{Math.max(1, Math.round((z.nachher - z.vorher) * 100))} %</strong>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="section-title">Deine Stadt</h2>
      {b.freigeschaltet.map((id) => {
        const def = buildingDef(id)
        if (!def) return null
        return (
          <div key={id} className="lw-frei">
            <span className="lw-frei-emoji" aria-hidden="true">
              {def.emoji}
            </span>
            <span className="lw-frei-text">
              <small>🔓 Neues Gebäude</small>
              <strong>{def.name}</strong>
              <span>{def.note}</span>
            </span>
            {!data.city ? (
              <p className="lw-frei-hinweis">Gründe deine Stadt – dann kannst du es bauen.</p>
            ) : unlockInfo(def, data.city.level, levels(data)).ok ? (
              <button className="btn btn-good" onClick={() => bauen(id)}>
                Jetzt bauen
              </button>
            ) : (
              <p className="lw-frei-hinweis">
                Dein Wissen reicht – es fehlt noch: {unlockInfo(def, data.city.level, levels(data)).missing.join(', ')}
              </p>
            )}
          </div>
        )
      })}
      {stadt ? (
        <div className="lw-stadt is-statisch">
          <span className="lw-stadt-emoji" aria-hidden="true">
            {stadt.def.emoji}
          </span>
          <span className="lw-stadt-text">
            <small>Dein Wissen lässt die Stadt wachsen</small>
            <strong>{stadt.def.name}</strong>
            <span className="bar lw-bar">
              <span style={{ width: breite(stadt.anteil) }} />
            </span>
            <small>{prozent(stadt.anteil)} · noch {stadt.fehlen.toLocaleString('de-DE')} Wissen</small>
          </span>
        </div>
      ) : (
        b.freigeschaltet.length === 0 && <p className="lw-stadt-fertig">🏙️ Dein Wissen hat alle {kurs.titel}-Gebäude freigeschaltet.</p>
      )}

      {b.erfolge.length > 0 && (
        <>
          <h2 className="section-title">Neue Erfolge</h2>
          <ul className="lw-erfolge">
            {b.erfolge.map((id) => {
              const e = achievementById(id)
              return e ? (
                <li key={id} className="is-erreicht">
                  <span aria-hidden="true">{e.emoji}</span>
                  <span>
                    <strong>{e.title}</strong>
                    <small>{e.text}</small>
                  </span>
                </li>
              ) : null
            })}
          </ul>
        </>
      )}

      <div className="lw-bilanz-knoepfe">
        <button className="btn btn-primary" onClick={nochmal}>
          🎲 Weiter lernen
        </button>
        <button className="btn btn-secondary" onClick={() => navigate({ name: 'city' })}>
          🏙️ Zur Stadt
        </button>
        <button className="btn btn-ghost" onClick={() => navigate({ name: 'kurs', id: kurs.id }, { replace: true })}>
          Zur Kursseite
        </button>
      </div>
    </main>
  )
}
