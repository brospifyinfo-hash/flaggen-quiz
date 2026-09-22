// Bausteine, die alle Spiele teilen: Rückmeldung (Haptik und Ton aus den zentralen Diensten),
// Erklärungen mit „Warum?“, Rundenpunkte, der Weiter-Knopf und die Sprachausgabe.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { playCue } from '../../games/mathRunner/sound'
import { haptic } from '../../haptics'
import { hatStimme, kannSprechen, sprich } from '../sprache'
import type { AktivitaetsErgebnis, Inhalt, KursDef, SpielDef, Sprache, Stufe } from '../typen'

export interface MechanikProps<T extends Inhalt = Inhalt> {
  kurs: KursDef
  spiel: SpielDef
  items: T[]
  stufe: Stufe
  seed: number
  onFertig: (ergebnis: AktivitaetsErgebnis) => void
}

/** Fühlbares und hörbares Feedback – über die vorhandenen Dienste, nicht über eigene */
export const rueckmeldung = {
  tipp: () => haptic('tick'),
  wahl: () => haptic('soft'),
  richtig: () => {
    haptic('success')
    playCue('correct')
  },
  falsch: () => {
    haptic('error')
    playCue('wrong')
  },
  combo: () => {
    haptic('strong')
    playCue('combo')
  },
  geschafft: () => {
    haptic('celebrate')
    playCue('level')
  },
}

/** Ruft onFertig genau einmal auf – auch wenn ein Knopf doppelt getippt wird */
export function useEinmal(onFertig: (e: AktivitaetsErgebnis) => void) {
  const schon = useRef(false)
  return (e: AktivitaetsErgebnis) => {
    if (schon.current) return
    schon.current = true
    onFertig(e)
  }
}

/** Punkte für die Runden: gelöst, halb, daneben, offen */
export function Rundenpunkte({ gesamt, ergebnisse, aktuell }: { gesamt: number; ergebnisse: number[]; aktuell: number }) {
  if (gesamt <= 1) return null
  return (
    <ol className="lw-punkte" aria-label={`Runde ${Math.min(aktuell + 1, gesamt)} von ${gesamt}`}>
      {Array.from({ length: gesamt }, (_, i) => {
        const p = ergebnisse[i]
        const zustand = p === undefined ? (i === aktuell ? 'is-jetzt' : '') : p >= 0.7 ? 'is-gut' : p >= 0.4 ? 'is-halb' : 'is-schlecht'
        return <li key={i} className={zustand} />
      })}
    </ol>
  )
}

/** Erklärung nach einer Antwort – kurz, mit ausklappbarem „Warum?“ */
export function Erklaerung({ text, mehr, zusatz }: { text?: string; mehr?: string; zusatz?: ReactNode }) {
  const [offen, setOffen] = useState(false)
  if (!text && !mehr && !zusatz) return null
  return (
    <div className="lw-erklaerung">
      {zusatz}
      {text && <p>{text}</p>}
      {mehr && !offen && (
        <button
          className="lw-warum"
          onClick={() => {
            setOffen(true)
            rueckmeldung.tipp()
          }}
        >
          Warum?
        </button>
      )}
      {mehr && offen && <p className="lw-mehr">{mehr}</p>}
    </div>
  )
}

/**
 * Unterer Rückmeldebereich mit Weiter-Knopf – schützt vor versehentlichem Doppeltippen.
 * Mit „auto“ geht es nach so vielen Millisekunden von selbst weiter (schnelle Spiele nach
 * einer richtigen Antwort); ein Tipp ist trotzdem jederzeit möglich, aber nie doppelt.
 */
export function Rueckmeldung({
  gut,
  titel,
  children,
  weiter,
  knopf = 'Weiter',
  auto,
}: {
  gut: boolean | null
  titel: ReactNode
  children?: ReactNode
  weiter: () => void
  knopf?: string
  auto?: number
}) {
  const seit = useRef(performance.now())
  const ref = useRef<HTMLButtonElement>(null)
  const erledigt = useRef(false)
  const [angehalten, setAngehalten] = useState(false)
  const einmal = useRef(weiter)
  einmal.current = weiter
  useEffect(() => {
    seit.current = performance.now()
    ref.current?.focus({ preventScroll: true })
    ref.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
    if (!auto || angehalten) return
    const t = window.setTimeout(() => {
      if (erledigt.current) return
      erledigt.current = true
      einmal.current()
    }, auto)
    return () => window.clearTimeout(t)
  }, [auto, angehalten])
  return (
    <div
      className={`lw-rueck ${gut === null ? '' : gut ? 'is-gut' : 'is-schlecht'}${auto && !angehalten ? ' is-auto' : ''}`}
      role="status"
      aria-live="polite"
      onPointerDown={(event) => {
        // Wer in die Erklärung tippt (etwa auf „Warum?“), will lesen – dann nicht weiterschicken
        if (auto && event.target !== ref.current) setAngehalten(true)
      }}
    >
      <p className="lw-rueck-titel">{titel}</p>
      {children}
      <button
        ref={ref}
        className={`btn ${gut === false ? 'btn-bad' : 'btn-good'}`}
        style={auto && !angehalten ? ({ '--auto': `${auto}ms` } as CSSProperties) : undefined}
        onClick={() => {
          if (performance.now() - seit.current < 350 || erledigt.current) return
          erledigt.current = true
          rueckmeldung.tipp()
          weiter()
        }}
      >
        {knopf}
      </button>
    </div>
  )
}

/** Lautsprecher-Knopf: spricht den Text in der Zielsprache */
export function Vorlesen({ text, sprache, klein = false }: { text: string; sprache?: Sprache; klein?: boolean }) {
  if (!sprache || sprache === 'de-DE' || !kannSprechen()) return null
  const stimme = hatStimme(sprache)
  return (
    <span className={`lw-vorlesen${klein ? ' is-klein' : ''}`}>
      <button
        className="lw-laut"
        aria-label="Anhören"
        onClick={() => {
          sprich(text, sprache)
          rueckmeldung.tipp()
        }}
      >
        🔊
      </button>
      {!klein && (
        <button
          className="lw-laut lw-langsam"
          aria-label="Langsam anhören"
          onClick={() => {
            sprich(text, sprache, { langsam: true })
            rueckmeldung.tipp()
          }}
        >
          🐢
        </button>
      )}
      {!stimme && !klein && <small className="lw-stimme-fehlt">Keine passende Stimme auf diesem Gerät</small>}
    </span>
  )
}

/** Anteil als ganze Prozent */
export const prozent = (wert: number) => `${Math.round(Math.max(0, Math.min(1, wert)) * 100)} %`

/** Breite für Balken – als CSS-Wert ohne Leerzeichen */
export const breite = (wert: number) => `${Math.round(Math.max(0, Math.min(1, wert)) * 1000) / 10}%`
