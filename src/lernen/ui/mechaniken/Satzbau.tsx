// Satzbau: Aus Bausteinen wird ein Satz. Antippen setzt einen Baustein ans Ende, Antippen im
// Satz nimmt ihn zurück. Wer lieber schiebt, zieht gesetzte Bausteine an eine andere Stelle.
import { useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import type { BauItem, RundenErgebnis, Sprache } from '../../typen'
import { ableiten, mische, zufall } from '../../zufall'
import { Erklaerung, Rueckmeldung, Rundenpunkte, rueckmeldung, useEinmal, Vorlesen, type MechanikProps } from '../gemeinsam'

/**
 * Bausteine zu einem Satz fügen. Vor Satzzeichen steht kein Leerzeichen – außer im
 * Französischen: dort gehört vor ? ! : ; ein schmales geschütztes Leerzeichen.
 */
function satzAus(teile: readonly string[], sprache?: Sprache): string {
  const satz = teile.join(' ').replace(/\s+([,.;:!?])/g, '$1')
  return sprache === 'fr-FR' ? satz.replace(/([;:!?])/g, ' $1') : satz
}

interface Stein {
  id: number
  text: string
}

export function Satzbau({ items, seed, onFertig }: MechanikProps<BauItem>) {
  const fertig = useEinmal(onFertig)
  const [runde, setRunde] = useState(0)
  const [ergebnisse, setErgebnisse] = useState<RundenErgebnis[]>([])
  const item = items[runde]

  const weiter = (e: RundenErgebnis) => {
    const alle = [...ergebnisse, e]
    setErgebnisse(alle)
    if (runde + 1 < items.length) setRunde(runde + 1)
    else fertig({ punkte: alle.reduce((s, x) => s + x.punkte, 0) / alle.length, runden: alle })
  }

  return (
    <div className="lw-spiel lw-bau">
      <Rundenpunkte gesamt={items.length} ergebnisse={ergebnisse.map((e) => e.punkte)} aktuell={runde} />
      <BauRunde key={item.id} item={item} seed={ableiten(seed, runde)} onFertig={weiter} />
    </div>
  )
}

const gleich = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((t, i) => t === b[i])

function BauRunde({ item, seed, onFertig }: { item: BauItem; seed: number; onFertig: (e: RundenErgebnis) => void }) {
  const fest = Math.min(item.fest ?? 0, item.teile.length - 1)
  const start = useMemo(() => {
    const alle: Stein[] = [...item.teile.slice(fest), ...(item.extra ?? [])].map((text, i) => ({ id: i, text }))
    const rng = zufall(seed)
    let gemischt = mische(rng, alle)
    // Nie schon fertig gemischt anbieten
    for (let v = 0; v < 4 && gleich(gemischt.map((s) => s.text), item.teile.slice(fest)); v++) gemischt = mische(rng, alle)
    return gemischt
  }, [item, seed, fest])

  const [gesetzt, setGesetzt] = useState<Stein[]>([])
  const [versuch, setVersuch] = useState(0)
  const [falschAb, setFalschAb] = useState<number | null>(null)
  const [ende, setEnde] = useState<null | { punkte: number }>(null)
  const [zug, setZug] = useState<{ id: number; x: number; y: number; ziel: number } | null>(null)
  const satzRef = useRef<HTMLDivElement>(null)
  const druck = useRef<{ id: number; x: number; y: number; zieht: boolean } | null>(null)

  const vorrat = start.filter((s) => !gesetzt.some((g) => g.id === s.id))
  const noetig = item.teile.length - fest
  const festeTeile = item.teile.slice(0, fest)

  const setze = (stein: Stein) => {
    if (ende) return
    rueckmeldung.tipp()
    setFalschAb(null)
    setGesetzt([...gesetzt, stein])
  }

  const nimm = (stein: Stein) => {
    if (ende) return
    rueckmeldung.tipp()
    setFalschAb(null)
    setGesetzt(gesetzt.filter((g) => g.id !== stein.id))
  }

  const pruefe = () => {
    const satz = [...festeTeile, ...gesetzt.map((g) => g.text)]
    const richtig = gleich(satz, item.teile) || (item.alternativen ?? []).some((alt) => gleich(satz, alt))
    if (richtig) {
      rueckmeldung.richtig()
      setEnde({ punkte: versuch === 0 ? 1 : 0.5 })
      return
    }
    rueckmeldung.falsch()
    if (versuch === 0) {
      // Erste Stelle zeigen, an der es abweicht – dann darf man nachbessern
      let ab = 0
      while (ab < gesetzt.length && gesetzt[ab].text === item.teile[fest + ab]) ab++
      setFalschAb(ab)
      setVersuch(1)
      return
    }
    setEnde({ punkte: 0 })
  }

  // ---------- Ziehen im Satz ----------
  const zielIndex = (x: number, y: number): number => {
    const box = satzRef.current
    if (!box) return gesetzt.length
    const steine = [...box.querySelectorAll<HTMLElement>('[data-stein]')]
    let beste = steine.length
    let abstand = Infinity
    steine.forEach((el, i) => {
      const r = el.getBoundingClientRect()
      const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2))
      if (d < abstand) {
        abstand = d
        beste = x < r.left + r.width / 2 ? i : i + 1
      }
    })
    return beste
  }

  const runter = (event: RPointerEvent, stein: Stein) => {
    if (ende) return
    druck.current = { id: stein.id, x: event.clientX, y: event.clientY, zieht: false }
    ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  }

  const bewegen = (event: RPointerEvent) => {
    const d = druck.current
    if (!d) return
    if (!d.zieht && Math.hypot(event.clientX - d.x, event.clientY - d.y) > 8) d.zieht = true
    if (d.zieht) setZug({ id: d.id, x: event.clientX, y: event.clientY, ziel: zielIndex(event.clientX, event.clientY) })
  }

  const hoch = (stein: Stein) => {
    const d = druck.current
    druck.current = null
    if (!d) return
    if (!d.zieht) {
      nimm(stein)
      return
    }
    const z = zug
    setZug(null)
    if (!z) return
    const ohne = gesetzt.filter((g) => g.id !== stein.id)
    const alt = gesetzt.findIndex((g) => g.id === stein.id)
    const ziel = z.ziel > alt ? z.ziel - 1 : z.ziel
    ohne.splice(Math.max(0, Math.min(ohne.length, ziel)), 0, stein)
    setGesetzt(ohne)
    setFalschAb(null)
    rueckmeldung.tipp()
  }

  return (
    <>
      {item.kontext && <p className="lw-etikett">{item.kontext}</p>}
      {item.aufgabe && <p className="lw-aufgabe">{item.aufgabe}</p>}
      {item.bedeutung && <p className="lw-bedeutung">„{item.bedeutung}“</p>}

      <div className={`lw-satz${ende ? (ende.punkte > 0 ? ' is-gut' : ' is-schlecht') : ''}`} ref={satzRef} aria-label="Dein Satz">
        {festeTeile.map((text, i) => (
          <span key={`f${i}`} className="lw-stein is-fest">
            {text}
          </span>
        ))}
        {gesetzt.map((stein, i) => (
          <span key={stein.id} className="lw-stein-platz">
            {zug && zug.ziel === i && zug.id !== stein.id && <span className="lw-einfuege" aria-hidden="true" />}
            <button
              data-stein
              className={`lw-stein is-gesetzt${falschAb !== null && i >= falschAb ? ' is-falsch' : ''}${zug?.id === stein.id ? ' is-zieht' : ''}`}
              onPointerDown={(e) => runter(e, stein)}
              onPointerMove={bewegen}
              onPointerUp={() => hoch(stein)}
              onPointerCancel={() => {
                druck.current = null
                setZug(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  nimm(stein)
                }
              }}
            >
              {stein.text}
            </button>
          </span>
        ))}
        {zug && zug.ziel >= gesetzt.length && <span className="lw-einfuege" aria-hidden="true" />}
        {gesetzt.length === 0 && festeTeile.length === 0 && <span className="lw-satz-leer">Tippe unten die Bausteine an …</span>}
      </div>

      {!ende && (
        <>
          <div className="lw-vorrat" aria-label="Bausteine">
            {vorrat.map((stein) => (
              <button key={stein.id} className="lw-stein" onClick={() => setze(stein)}>
                {stein.text}
              </button>
            ))}
          </div>
          {falschAb !== null && <p className="lw-hinweis">Ab dem markierten Baustein stimmt die Reihenfolge noch nicht.</p>}
          {(item.extra?.length ?? 0) > 0 && versuch === 0 && falschAb === null && (
            <p className="lw-hinweis">Achtung: Nicht jeder Baustein gehört hinein.</p>
          )}
          <button className="btn btn-primary lw-pruefen" disabled={gesetzt.length < noetig} onClick={pruefe}>
            {versuch === 0 ? 'Prüfen' : 'Noch einmal prüfen'}
          </button>
        </>
      )}

      {ende && (
        <Rueckmeldung
          gut={ende.punkte > 0}
          titel={ende.punkte === 1 ? '✓ Perfekt gebaut' : ende.punkte > 0 ? '✓ Im zweiten Anlauf' : 'So wäre es richtig:'}
          weiter={() => onFertig({ id: item.id, ziel: item.ziel, stufe: item.stufe, punkte: ende.punkte })}
        >
          <p className="lw-loesung">
            {satzAus(item.teile, item.sprache)}
            <Vorlesen text={item.teile.join(' ')} sprache={item.sprache} klein />
          </p>
          <Erklaerung text={item.erklaerung} mehr={item.mehr} />
        </Rueckmeldung>
      )}
    </>
  )
}
