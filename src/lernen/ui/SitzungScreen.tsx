// Eine Session als Folge kleiner Spiele: Würfeln, Plan, Challenge für Challenge mit kurzer
// Ansage, Ergebnis, Combo – und am Ende die Bilanz. Kein Neuladen zwischen den Spielen.
import { useEffect, useMemo, useRef, useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { IconClose } from '../../components/Icons'
import { goBack, navigate } from '../../router'
import { getState, setState } from '../../store'
import type { SaveData } from '../../types'
import { wertung } from '../belohnung'
import { kursStand, lernen } from '../fortschritt'
import { kursById, spielById, useKursInhalt, zielById } from '../kurse'
import { beende, merkeVorliebe, naechste, schliesseAb } from '../sitzung'
import { STUFE_NAME, type AktivitaetsErgebnis } from '../typen'
import { AktivitaetSpieler } from './AktivitaetSpieler'
import { prozent, rueckmeldung } from './gemeinsam'
import './lernen.css'

type Phase = 'bau' | 'plan' | 'ansage' | 'spiel'

const flammen = (combo: number) => (combo >= 5 ? '🔥🔥🔥' : combo >= 3 ? '🔥🔥' : '🔥')

export function SitzungScreen({ data }: { data: SaveData }) {
  const s = lernen(data).sitzung
  const kurs = s ? kursById(s.kurs) : undefined
  useKursInhalt(s?.kurs ?? null)
  const frisch = !!s && s.index === 0 && s.bilanz.length === 0 && !s.fertig
  const [phase, setPhase] = useState<Phase>(frisch ? 'bau' : 'ansage')
  const [fragen, setFragen] = useState(false)
  const [mag, setMag] = useState<-1 | 0 | 1>(0)
  const comboVorher = useRef(s?.combo ?? 0)

  useEffect(() => {
    if (phase !== 'bau') return
    const t = window.setTimeout(() => setPhase('plan'), 1300)
    return () => window.clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'ansage') return
    const t = window.setTimeout(() => setPhase('spiel'), 2600)
    return () => window.clearTimeout(t)
  }, [phase, s?.index])

  const vielfalt = useMemo(() => new Set(s?.plan.map((p) => p.spiel) ?? []).size, [s?.plan])
  const fokus = useMemo(() => {
    if (!s || !kurs) return []
    const zaehler = new Map<string, number>()
    for (const p of s.plan) zaehler.set(p.ziel, (zaehler.get(p.ziel) ?? 0) + 1)
    return [...zaehler.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id]) => zielById(kurs, id)?.titel ?? id)
  }, [s, kurs])

  if (!s || !kurs) return null
  const akt = s.aktuell
  const spiel = akt ? spielById(akt.spiel) : undefined
  const letzte = s.bilanz[s.bilanz.length - 1]
  const istLetzte = s.index >= s.laenge - 1

  const fertig = (e: AktivitaetsErgebnis) => {
    comboVorher.current = s.combo
    setState((d) => schliesseAb(d, e))
    const nach = getState().lernen?.sitzung
    if (nach && nach.combo >= 2 && nach.combo > comboVorher.current) rueckmeldung.combo()
    else if (e.punkte >= 0.7) rueckmeldung.geschafft()
    setMag(0)
  }

  const weiter = () => {
    rueckmeldung.tipp()
    if (mag !== 0 && letzte) setState((d) => merkeVorliebe(d, s.kurs, letzte.spiel, mag))
    setState((d) => naechste(d))
    if (!getState().lernen?.sitzung) {
      navigate({ name: 'kursErgebnis' }, { replace: true })
      return
    }
    setPhase('ansage')
  }

  const aufhoeren = () => {
    setFragen(false)
    const hatteWas = s.bilanz.length > 0
    setState((d) => beende(d))
    if (hatteWas) navigate({ name: 'kursErgebnis' }, { replace: true })
    else goBack({ name: 'kurs', id: s.kurs })
  }

  const kacheln = s.plan.map((p, i) => {
    const b = s.bilanz[i]
    const sp = spielById(p.spiel)
    const zeigen = b || (i === s.index && phase !== 'bau' && phase !== 'plan')
    const zustand = b ? (b.punkte >= 0.7 ? 'is-gut' : b.punkte >= 0.4 ? 'is-halb' : 'is-schlecht') : i === s.index ? 'is-jetzt' : ''
    return (
      <li key={i} className={zustand} title={zeigen ? sp?.name : 'Überraschung'}>
        {zeigen ? sp?.emoji : '?'}
      </li>
    )
  })

  return (
    <main className={`lw-sitzung lern-welt ${kurs.thema}`}>
      <header className="lw-hud">
        <button className="icon-btn" aria-label="Session beenden" onClick={() => setFragen(true)}>
          <IconClose />
        </button>
        <ol className="lw-kacheln" aria-label="Challenges">
          {kacheln}
        </ol>
        <span className="lw-hud-werte">
          {s.combo > 0 && (
            <span className="lw-combo" key={s.combo}>
              {flammen(s.combo)} {s.combo}
            </span>
          )}
          <span>⭐ {s.xp}</span>
        </span>
      </header>

      {phase === 'bau' && (
        <section className="lw-wuerfel" aria-live="polite">
          <div className="lw-wuerfel-reihe" aria-hidden="true">
            {kurs.spiele.slice(0, 6).map((sp, i) => (
              <span key={sp.id} style={{ animationDelay: `${i * 90}ms` }}>
                {sp.emoji}
              </span>
            ))}
          </div>
          <p className="lw-wuerfel-text">🎲 Deine Session wird gebaut …</p>
        </section>
      )}

      {phase === 'plan' && (
        <section className="lw-plan">
          <p className="eyebrow">
            {kurs.emoji} {kurs.titel}
          </p>
          <h1>Deine Session</h1>
          <div className="lw-plan-zahlen">
            <span>
              <strong>{s.laenge}</strong> Challenges
            </span>
            <span>
              <strong>{vielfalt}</strong> verschiedene Spiele
            </span>
          </div>
          {fokus.length > 0 && <p className="lw-plan-fokus">Fokus: {fokus.join(' + ')}</p>}
          <p className="lw-plan-claim">Verschiedene Spiele. Ein Ziel.</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              rueckmeldung.wahl()
              setPhase('ansage')
            }}
          >
            Los geht&apos;s
          </button>
        </section>
      )}

      {phase === 'ansage' && !s.fertig && akt && spiel && (
        <button className="lw-ansage" key={s.index} onClick={() => setPhase('spiel')}>
          <small>
            Challenge {s.index + 1} von {s.laenge}
            {akt.finale && s.laenge > 1 ? ' · Finale' : ''}
          </small>
          <span className="lw-ansage-emoji" aria-hidden="true">
            {spiel.emoji}
          </span>
          <strong>{spiel.name}</strong>
          <span className="lw-ansage-text">{spiel.anleitung}</span>
          <span className="lw-ansage-meta">
            {zielById(kurs, akt.ziel)?.titel} · {STUFE_NAME[akt.stufe]}
          </span>
          <span className="lw-ansage-los">Antippen zum Starten</span>
        </button>
      )}

      {phase === 'spiel' && !s.fertig && akt && (
        <section className="lw-buehne" key={`${s.index}-${akt.seed}`}>
          <p className="lw-buehne-titel">
            <span aria-hidden="true">{spiel?.emoji}</span> {spiel?.name}
          </p>
          <AktivitaetSpieler akt={akt} onFertig={fertig} />
        </section>
      )}

      {s.fertig && letzte && (
        <section className="lw-zwischen" aria-live="polite">
          <span className="lw-zwischen-emoji" aria-hidden="true">
            {wertung(letzte.punkte).emoji}
          </span>
          <h2>{wertung(letzte.punkte).titel}</h2>
          <div className="lw-zwischen-zahlen">
            <span>
              <strong>{prozent(letzte.punkte)}</strong>
              <small>Treffer</small>
            </span>
            <span>
              <strong>+{letzte.xp}</strong>
              <small>XP</small>
            </span>
            <span>
              <strong>{s.combo > 0 ? `${flammen(s.combo)} ${s.combo}` : '–'}</strong>
              <small>Combo</small>
            </span>
          </div>
          <p className="lw-zwischen-ziel">
            {zielById(kurs, letzte.ziel)?.titel}: {prozent(kursStand(data, s.kurs)?.ziele[letzte.ziel]?.t ?? 0)}
          </p>
          <div className="lw-mag" role="group" aria-label={`Wie oft möchtest du ${spielById(letzte.spiel)?.name} spielen?`}>
            <button className={mag === 1 ? 'is-an' : ''} onClick={() => setMag(mag === 1 ? 0 : 1)}>
              👍 Mehr davon
            </button>
            <button className={mag === -1 ? 'is-an' : ''} onClick={() => setMag(mag === -1 ? 0 : -1)}>
              👎 Weniger
            </button>
          </div>
          <button className="btn btn-primary" onClick={weiter}>
            {istLetzte ? 'Zur Bilanz' : 'Nächste Challenge'}
          </button>
        </section>
      )}

      {fragen && (
        <ConfirmDialog
          title="Session beenden?"
          text="Was du schon gespielt hast, bleibt dir – XP, Münzen und Wissen sind gutgeschrieben."
          confirmLabel="Beenden"
          onConfirm={aufhoeren}
          onCancel={() => setFragen(false)}
        />
      )}
    </main>
  )
}
