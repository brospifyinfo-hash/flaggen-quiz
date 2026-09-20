// Die Kursseite: Fortschritt, Wissen, der große Würfel-Knopf und die Karte durch den Lehrplan.
// Man muss kein Spiel wählen – der Planer stellt die Session zusammen.
import { useState, type CSSProperties } from 'react'
import { IconBack } from '../../components/Icons'
import { haptic } from '../../haptics'
import { knowledgeLevel, pointsOf } from '../../knowledge'
import { goBack, navigate } from '../../router'
import { setState } from '../../store'
import type { SaveData } from '../../types'
import { naechstesStadtZiel } from '../belohnung'
import { erfolgeVon } from '../erfolge'
import { kursStand, lernen } from '../fortschritt'
import { kursById, useKursInhalt } from '../kurse'
import {
  aktuellesModul,
  bandVon,
  FREI_AB,
  kursStufe,
  kursWert,
  MEISTER_AB,
  modulWert,
  offeneModule,
  zieleDesModuls,
  zielWert,
} from '../meisterschaft'
import { spielOffen } from '../planer'
import { beende, LAENGEN, starteSitzung } from '../sitzung'
import { STUFE_NAME } from '../typen'
import { breite, prozent } from './gemeinsam'
import './lernen.css'

export function KursScreen({ data, id }: { data: SaveData; id: string }) {
  const kurs = kursById(id)
  const inhalt = useKursInhalt(id)
  const [laenge, setLaenge] = useState(5)
  const [offenesModul, setOffenesModul] = useState<string | null>(null)
  if (!kurs) return null

  const stand = kursStand(data, id)
  const wert = kursWert(kurs, stand)
  const band = bandVon(wert)
  const stufe = kursStufe(kurs, stand)
  const offen = offeneModule(kurs, stand)
  const aktuell = aktuellesModul(kurs, stand)
  const punkte = pointsOf(data, kurs.domain)
  const wissen = knowledgeLevel(punkte)
  const stadt = naechstesStadtZiel(data, kurs)
  const laufend = lernen(data).sitzung
  const laeuftHier = laufend?.kurs === id
  const erfolge = erfolgeVon(id)

  const starte = (modul: string | null) => {
    if (!inhalt) return
    haptic('soft')
    // Eine laufende Session eines anderen Kurses wird ordentlich abgeschlossen
    setState((d) => starteSitzung(beende(d), id, laenge, { modul }))
    navigate({ name: 'kursSitzung' })
  }

  return (
    <main className={`screen lern-welt ${kurs.thema}`}>
      <header className="topbar">
        <button className="icon-btn" aria-label="Zurück" onClick={() => goBack({ name: 'home' })}>
          <IconBack />
        </button>
      </header>

      <section className="lw-held">
        <span className="lw-held-emoji" aria-hidden="true">
          {kurs.emoji}
        </span>
        <h1>{kurs.titel}</h1>
        <p className="lw-claim">{kurs.claim}</p>
        <div className="lw-held-stand">
          <span className="bar bar-wide lw-bar">
            <span style={{ width: breite(wert) }} />
          </span>
          <span className="lw-held-zahlen">
            <strong>{prozent(wert)}</strong> · {band.name} · Stufe {STUFE_NAME[stufe]}
          </span>
        </div>
        <div className="lw-held-chips">
          <span className="lw-chip">
            🧠 {punkte.toLocaleString('de-DE')} {kurs.wissen}
          </span>
          <span className="lw-chip">📚 Wissensstufe {wissen.level}</span>
          {stand?.serie && stand.serie > 1 && <span className="lw-chip">🔥 {stand.serie} Tage</span>}
        </div>
      </section>

      {laeuftHier ? (
        <button className="btn btn-primary lw-start" onClick={() => navigate({ name: 'kursSitzung' })}>
          ▶ Session fortsetzen · {Math.min(laufend!.index + 1, laufend!.laenge)}/{laufend!.laenge}
        </button>
      ) : (
        <>
          <div className="lw-laengen" role="radiogroup" aria-label="Länge der Session">
            {LAENGEN.map((l) => (
              <button
                key={l.id}
                role="radio"
                aria-checked={laenge === l.anzahl}
                className={`lw-laenge${laenge === l.anzahl ? ' is-an' : ''}`}
                onClick={() => {
                  setLaenge(l.anzahl)
                  haptic('tick')
                }}
              >
                <strong>{l.name}</strong>
                <small>{l.anzahl} Challenges</small>
              </button>
            ))}
          </div>
          <button className="btn btn-primary lw-start" disabled={!inhalt} onClick={() => starte(null)}>
            {inhalt ? '🎲 START' : 'Lädt …'}
          </button>
          <p className="lw-start-hinweis">Verschiedene Spiele, ein Ziel – was als Nächstes kommt, bleibt eine Überraschung.</p>
          {laufend && !laeuftHier && (
            <p className="lw-start-hinweis">Eine Session in {kursById(laufend.kurs)?.titel} läuft noch – sie wird beendet, wenn du hier startest.</p>
          )}
        </>
      )}

      {stadt ? (
        <button className="lw-stadt" onClick={() => navigate({ name: 'city' })}>
          <span className="lw-stadt-emoji" aria-hidden="true">
            {stadt.def.emoji}
          </span>
          <span className="lw-stadt-text">
            <small>Deine Stadt wartet auf</small>
            <strong>{stadt.def.name}</strong>
            <span className="bar lw-bar">
              <span style={{ width: breite(stadt.anteil) }} />
            </span>
            <small>
              ab {kurs.titel}-Stufe {stadt.stufe} · noch {stadt.fehlen.toLocaleString('de-DE')} Wissen
            </small>
          </span>
        </button>
      ) : (
        <p className="lw-stadt-fertig">🏙️ Alle Gebäude für {kurs.titel} sind freigeschaltet.</p>
      )}

      <h2 className="section-title">Dein Weg</h2>
      <ol className="lw-karte-weg">
        {kurs.module.map((modul, i) => {
          const ist = offen.includes(modul.id)
          const w = modulWert(kurs, stand, modul.id)
          const zuklappen = offenesModul === modul.id
          const letztes = i === kurs.module.length - 1 && kurs.module.length > 2
          return (
            <li key={modul.id} className={`lw-station${ist ? '' : ' is-zu'}${modul.id === aktuell ? ' is-aktuell' : ''}${w >= 0.95 ? ' is-meister' : ''}`}>
              <button
                className="lw-station-kopf"
                aria-expanded={zuklappen}
                onClick={() => {
                  setOffenesModul(zuklappen ? null : modul.id)
                  haptic('tick')
                }}
              >
                <span className="lw-station-punkt" aria-hidden="true">
                  {ist ? modul.emoji : '🔒'}
                </span>
                <span className="lw-station-text">
                  <strong>{modul.titel}</strong>
                  <small>
                    {ist
                      ? modul.id === aktuell
                        ? `Aktuell · ${prozent(w)}`
                        : prozent(w)
                      : letztes
                        ? `Öffnet sich, wenn alle Module ${prozent(MEISTER_AB)} erreichen`
                        : `Öffnet sich bei ${prozent(FREI_AB)} in „${kurs.module[i - 1]?.titel}“`}
                  </small>
                </span>
                <span className="lw-station-ring" style={{ '--wert': w } as CSSProperties} aria-hidden="true" />
              </button>
              {zuklappen && (
                <div className="lw-station-inhalt">
                  <p>{modul.text}</p>
                  <ul className="lw-ziele">
                    {zieleDesModuls(kurs, modul.id).map((ziel) => {
                      const t = zielWert(stand, ziel.id)
                      return (
                        <li key={ziel.id}>
                          <span>{ziel.titel}</span>
                          <span className="bar lw-bar">
                            <span style={{ width: breite(t) }} />
                          </span>
                          <small>{prozent(t)}</small>
                        </li>
                      )
                    })}
                  </ul>
                  {ist && !laeuftHier && (
                    <button className="btn btn-secondary" disabled={!inhalt} onClick={() => starte(modul.id)}>
                      🎯 Gezielt dieses Modul üben
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <h2 className="section-title">Die Spiele</h2>
      <ul className="lw-spiele">
        {kurs.spiele.map((spiel) => {
          const s = stand?.spiele[spiel.id]
          const frei = spielOffen(spiel, stufe)
          return (
            <li key={spiel.id} className={frei ? '' : 'is-zu'}>
              <span className="lw-spiel-emoji" aria-hidden="true">
                {frei ? spiel.emoji : '🔒'}
              </span>
              <span className="lw-spiel-text">
                <strong>{spiel.name}</strong>
                <small>{frei ? spiel.kurz : `ab Stufe ${STUFE_NAME[spiel.ab!]}`}</small>
              </span>
              {s && s.n > 0 && (
                <span className="lw-spiel-zahl">
                  {s.n}× · {prozent(s.summe / s.n)}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      <h2 className="section-title">Erfolge</h2>
      <ul className="lw-erfolge">
        {erfolge.map((e) => {
          const erreicht = !!data.achievements[e.id]
          return (
            <li key={e.id} className={erreicht ? 'is-erreicht' : ''}>
              <span aria-hidden="true">{erreicht ? e.emoji : '🔒'}</span>
              <span>
                <strong>{e.title}</strong>
                <small>{e.text}</small>
              </span>
            </li>
          )
        })}
      </ul>

      {kurs.hinweis && <p className="footnote">{kurs.hinweis}</p>}
      <p className="footnote">
        Der Fortschritt zeigt, wie weit du durch den Stoff bist – nicht, wie begabt du bist. Alles bleibt auf diesem Gerät, auch offline.
      </p>
    </main>
  )
}
