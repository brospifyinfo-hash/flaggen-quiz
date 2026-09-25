// Die Spiele liegen nicht auf einer eigenen Route: unten rechts steht „Spielen“,
// daraus fährt das Blatt nach oben.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Flag } from './Flag'
import { FlagStack } from './FlagStack'
import { IconBack, IconClose, IconPlay } from './Icons'
import { SpielZeichen, type PlakatArt } from './SpielPlakat'
import { CONTINENTS } from '../data/countries'
import { haptic } from '../haptics'
import { ladeAlle } from '../lernen/kurse'
import { WAS_IST_DAS, WAS_KATEGORIEN, kategorieTitel } from '../modes/wasIstDas'
import { navigate } from '../router'
import { RANDOM, endRun, startRun } from '../run'
import { setState } from '../store'

type Seite = 'spiele' | 'was' | 'flaggen' | 'stufe'

const SPIELE: { art: PlakatArt; kicker: string; name: string; text: string; breit?: boolean; ziel: string }[] = [
  { art: 'was', kicker: 'Erkennen', name: 'Was ist das', text: 'Kategorie oder Zufall', breit: true, ziel: 'was' },
  { art: 'online', kicker: 'Zu zweit', name: 'Online', text: 'Lobby mit Code', breit: true, ziel: 'online' },
  { art: 'higher', kicker: 'Zahlen', name: 'Higher or Lower', text: 'Welches Land ist größer?', ziel: 'higher-lower' },
  { art: 'geschichte', kicker: 'Zeit', name: 'Geschichte', text: 'Jahre und Reihenfolgen', ziel: 'geschichte' },
  { art: 'karte', kicker: 'Orte', name: 'Weltkarte', text: 'Länder auf der Karte', ziel: 'weltkarte' },
  { art: 'gemischt', kicker: 'Alles', name: 'Gemischt', text: 'Modi durcheinander', ziel: 'random' },
  { art: 'mathe', kicker: 'Tempo', name: 'Mathe-Lauf', text: 'Kopfrechnen im Rennen', ziel: 'math' },
]

const FLAGGEN = ['de', 'jp', 'br']

export function SpieleBlatt() {
  const [auf, setAuf] = useState(false)
  const [offen, setOffen] = useState(false)
  const [seite, setSeite] = useState<Seite>('spiele')
  const [ziel, setZiel] = useState(WAS_IST_DAS)
  const [herkunft, setHerkunft] = useState<Seite>('was')
  const zu = useRef<number | undefined>(undefined)
  const lauf = useRef(0)

  const oeffnen = () => {
    const ticket = ++lauf.current
    window.clearTimeout(zu.current)
    haptic('soft')
    setSeite('spiele')
    setHerkunft('was')
    setAuf(true)
    setOffen(false)
    requestAnimationFrame(() => {
      if (lauf.current === ticket) setOffen(true)
    })
  }

  const schliessen = () => {
    lauf.current += 1
    setOffen(false)
    window.clearTimeout(zu.current)
    const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    zu.current = window.setTimeout(() => setAuf(false), ruhig ? 0 : 460)
  }

  useEffect(() => () => window.clearTimeout(zu.current), [])

  useEffect(() => {
    if (!auf) return
    const taste = (event: KeyboardEvent) => {
      if (event.key === 'Escape') schliessen()
    }
    document.addEventListener('keydown', taste)
    return () => document.removeEventListener('keydown', taste)
  }, [auf])

  const starte = (mode: string) => {
    haptic('soft')
    if (mode === RANDOM) void ladeAlle()
    setState((current) => startRun(endRun(current), mode))
    navigate({ name: 'run' })
  }

  const waehle = (ziel: string) => {
    haptic('soft')
    if (ziel === 'was') {
      setSeite('was')
      return
    }
    if (ziel === 'online') {
      navigate({ name: 'online' })
      return
    }
    if (ziel === 'math') {
      navigate({ name: 'mathRunner' })
      return
    }
    if (ziel === 'random') {
      starte(RANDOM)
      return
    }
    starte(ziel)
  }

  return createPortal(
    <>
      {!offen && (
        <button className="spiele-ecke" onClick={oeffnen} aria-expanded={auf} aria-controls="spiele-blatt">
          <IconPlay />
          Spielen
        </button>
      )}
      {auf && (
        <>
          <button className={`spiele-schleier${offen ? ' is-offen' : ''}`} aria-label="Spiele schließen" onClick={schliessen} />
          <section
            id="spiele-blatt"
            className={`spiele-blatt${offen ? ' is-offen' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={seite === 'was' ? 'Was ist das' : seite === 'flaggen' ? 'Flaggen' : seite === 'stufe' ? 'Schwierigkeit' : 'Spielen'}
          >
            <div className="spiele-griff" />
            <header className="spiele-kopf">
              {seite === 'spiele' ? (
                <span className="spiele-kopf-platz" />
              ) : (
                <button
                  className="icon-btn"
                  aria-label={seite === 'flaggen' ? 'Zurück zu den Kategorien' : seite === 'stufe' ? 'Zurück' : 'Zurück zu den Spielen'}
                  onClick={() => setSeite(seite === 'flaggen' ? 'was' : seite === 'stufe' ? herkunft : 'spiele')}
                >
                  <IconBack />
                </button>
              )}
              <h2>{seite === 'was' ? 'Was ist das' : seite === 'flaggen' ? 'Flaggen' : seite === 'stufe' ? 'Wie schwer?' : 'Spielen'}</h2>
              <button className="icon-btn" aria-label="Schließen" onClick={schliessen}>
                <IconClose />
              </button>
            </header>
            <div className="spiele-inhalt">
              {seite === 'spiele' ? (
                <div className="spiel-gitter">
                  {SPIELE.map((spiel) => (
                    <button
                      key={spiel.name}
                      className={`spiel-karte ton-${spiel.art}${spiel.breit ? ' is-breit' : ''}`}
                      onClick={() => waehle(spiel.ziel)}
                    >
                      <span className="spiel-zeichen">
                        <SpielZeichen art={spiel.art} />
                      </span>
                      <span className="spiel-text">
                        <strong>{spiel.name}</strong>
                        <em>{spiel.text}</em>
                      </span>
                    </button>
                  ))}
                </div>
              ) : seite === 'was' ? (
                <div className="spiel-gitter">
                  {WAS_KATEGORIEN.map((kategorie) =>
                    kategorie.id === 'flaggen' ? (
                      <button
                        key={kategorie.id}
                        className="spiel-karte ton-flaggen"
                        onClick={() => {
                          haptic('soft')
                          setSeite('flaggen')
                        }}
                      >
                        <span className="spiel-zeichen">
                          <span className="marke-flaggen">
                            {FLAGGEN.map((code) => (
                              <Flag key={code} code={code} />
                            ))}
                          </span>
                        </span>
                        <span className="spiel-text">
                          <strong>{kategorie.name}</strong>
                          <em>Kontinent wählen</em>
                        </span>
                      </button>
                    ) : (
                      <button
                        key={kategorie.id}
                        className={`spiel-karte ton-${kategorie.id}${kategorie.id === 'zufall' ? ' is-breit' : ''}`}
                        onClick={() => {
                          haptic('soft')
                          setZiel(kategorie.id === 'zufall' ? WAS_IST_DAS : `${WAS_IST_DAS}:${kategorie.id}`)
                          setHerkunft('was')
                          setSeite('stufe')
                        }}
                      >
                        <span className="spiel-zeichen">
                          <KategorieBild id={kategorie.id} />
                        </span>
                        <span className="spiel-text">
                          <strong>{kategorie.name}</strong>
                          <em>{kategorie.text}</em>
                        </span>
                      </button>
                    ),
                  )}
                </div>
              ) : seite === 'flaggen' ? (
                <div className="flaggen-wahl">
                  <button
                    className="spiel-karte is-breit ton-flaggen"
                    onClick={() => {
                      haptic('soft')
                      setZiel(`${WAS_IST_DAS}:flaggen`)
                      setHerkunft('flaggen')
                      setSeite('stufe')
                    }}
                  >
                    <span className="spiel-zeichen">
                      <span className="marke-flaggen">
                        {FLAGGEN.map((code) => (
                          <Flag key={code} code={code} />
                        ))}
                      </span>
                    </span>
                    <span className="spiel-text">
                      <strong>Alle Flaggen</strong>
                      <em>Die ganze Welt, gemischt</em>
                    </span>
                  </button>
                  {CONTINENTS.map((kontinent) => (
                    <button
                      key={kontinent.id}
                      className="flaggen-kontinent"
                      onClick={() => {
                        haptic('soft')
                        setZiel(`${WAS_IST_DAS}:flaggen:${kontinent.id}`)
                        setHerkunft('flaggen')
                        setSeite('stufe')
                      }}
                    >
                      <FlagStack codes={kontinent.showcase} />
                      <span className="spiel-text">
                        <strong>{kontinent.name}</strong>
                        <em>{kontinent.note ?? 'Nur diese Länder'}</em>
                      </span>
                    </button>
                  ))}
                  <button
                    className="flaggen-reise"
                    onClick={() => {
                      haptic('soft')
                      navigate({ name: 'mode', id: 'flaggen' })
                    }}
                  >
                    <strong>Kontinent-Reise</strong>
                    <em>Übungsrunden und Abschlusstest, Kontinent für Kontinent</em>
                  </button>
                </div>
              ) : (
                <div className="stufe-wahl">
                  <p className="stufe-lead">{kategorieTitel(ziel) ?? '🔎 Was ist das'}</p>
                  <button className="stufe-karte" onClick={() => starte(`${ziel}:easy`)}>
                    <strong>Leicht</strong>
                    <em>Die Antworten stehen da. Dafür gibt es nur 1 XP, ohne Combo und ohne Perfektlauf.</em>
                  </button>
                  <button className="stufe-karte stufe-schwer" onClick={() => starte(`${ziel}:hard`)}>
                    <strong>Schwer</strong>
                    <em>Du tippst die Antwort selbst. Kleine Tippfehler zählen noch, die XP sind voll.</em>
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>,
    document.body,
  )
}

function KategorieBild({ id }: { id: string }) {
  const art: PlakatArt =
    id === 'autos' || id === 'marken' || id === 'orte' || id === 'natur' || id === 'rap' || id === 'personen' || id === 'zufall'
      ? id
      : 'was'
  return <SpielZeichen art={art} />
}
