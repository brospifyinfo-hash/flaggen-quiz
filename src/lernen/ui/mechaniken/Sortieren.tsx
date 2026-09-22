// Sortieren: Karte für Karte in das richtige Fach – förmlich oder salopp, normal oder verdächtig,
// erlauben oder blockieren. Schnell per Knopf, bei zwei Fächern auch per Wischen.
import { useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import type { KarteItem, RundenErgebnis } from '../../typen'
import { Erklaerung, Rueckmeldung, Rundenpunkte, rueckmeldung, useEinmal, type MechanikProps } from '../gemeinsam'

export function Sortieren({ items, spiel, onFertig }: MechanikProps<KarteItem>) {
  const fertig = useEinmal(onFertig)
  const faecher = spiel.faecher ?? [
    { name: 'Ja', emoji: '👍' },
    { name: 'Nein', emoji: '👎' },
  ]
  const [runde, setRunde] = useState(0)
  const [ergebnisse, setErgebnisse] = useState<RundenErgebnis[]>([])
  const [wahl, setWahl] = useState<number | null>(null)
  const [wisch, setWisch] = useState(0)
  const start = useRef<{ x: number; y: number } | null>(null)
  const auto = useRef<number | undefined>(undefined)
  const item = items[runde]
  const richtig = wahl !== null && wahl === item.fach

  const naechste = (punkte: number) => {
    window.clearTimeout(auto.current)
    const alle = [...ergebnisse, { id: item.id, ziel: item.ziel, stufe: item.stufe, punkte }]
    setErgebnisse(alle)
    setWahl(null)
    setWisch(0)
    if (runde + 1 < items.length) setRunde(runde + 1)
    else fertig({ punkte: alle.reduce((s, x) => s + x.punkte, 0) / alle.length, runden: alle })
  }

  const lege = (fach: number) => {
    if (wahl !== null) return
    setWahl(fach)
    if (fach === item.fach) rueckmeldung.richtig()
    else rueckmeldung.falsch()
  }

  // Wischen: links = erstes Fach, rechts = letztes Fach
  const runter = (e: RPointerEvent) => {
    if (wahl !== null || faecher.length > 3) return
    start.current = { x: e.clientX, y: e.clientY }
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const bewegen = (e: RPointerEvent) => {
    if (!start.current) return
    setWisch(e.clientX - start.current.x)
  }
  const hoch = () => {
    if (!start.current) return
    start.current = null
    if (wisch < -70) lege(0)
    else if (wisch > 70) lege(faecher.length - 1)
    setWisch(0)
  }

  return (
    <div className="lw-spiel lw-sortieren">
      <Rundenpunkte gesamt={items.length} ergebnisse={ergebnisse.map((e) => e.punkte)} aktuell={runde} />
      <div className="lw-stapel">
        <div
          key={item.id}
          className={`lw-sortkarte${wahl === null ? '' : richtig ? ' is-gut' : ' is-schlecht'}`}
          style={wisch ? { transform: `translateX(${wisch}px) rotate(${wisch / 18}deg)` } : undefined}
          onPointerDown={runter}
          onPointerMove={bewegen}
          onPointerUp={hoch}
          onPointerCancel={() => {
            start.current = null
            setWisch(0)
          }}
        >
          {item.kontext && <p className="lw-etikett">{item.kontext}</p>}
          <p className="lw-sortkarte-text">{item.text}</p>
          {item.detail && <p className="lw-sortkarte-detail">{item.detail}</p>}
          {faecher.length <= 3 && wahl === null && (
            <p className="lw-wisch-hinweis" aria-hidden="true">
              ← {faecher[0].name} · {faecher[faecher.length - 1].name} →
            </p>
          )}
        </div>
      </div>

      <div className={`lw-faecher is-${faecher.length}`}>
        {faecher.map((fach, i) => {
          const zustand = wahl === null ? '' : i === item.fach ? ' is-correct' : i === wahl ? ' is-wrong' : ' is-dim'
          return (
            <button key={fach.name} className={`lw-fach${zustand}`} aria-disabled={wahl !== null} onClick={() => lege(i)}>
              <span aria-hidden="true">{fach.emoji}</span>
              {fach.name}
            </button>
          )
        })}
      </div>

      {wahl !== null && (
        <Rueckmeldung
          key={item.id}
          gut={richtig}
          auto={richtig ? 1300 : undefined}
          titel={richtig ? `✓ ${faecher[item.fach].name}` : `Eher: ${faecher[item.fach].emoji} ${faecher[item.fach].name}`}
          weiter={() => naechste(richtig ? 1 : 0)}
          knopf={runde + 1 < items.length ? 'Nächste Karte' : 'Fertig'}
        >
          <Erklaerung text={item.warum} mehr={item.mehr} />
        </Rueckmeldung>
      )}
    </div>
  )
}
