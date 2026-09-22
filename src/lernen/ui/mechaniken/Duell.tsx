// Duell: zwei fast gleiche Sätze, nur einer stimmt. Schnell hintereinander, ab Stufe 3 mit
// Zeitdruck. Nach der Antwort leuchtet der Unterschied auf – so sieht man, worauf es ankam.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { DuellItem, RundenErgebnis } from '../../typen'
import { ableiten, zufall } from '../../zufall'
import { Erklaerung, Rueckmeldung, Rundenpunkte, rueckmeldung, useEinmal, Vorlesen, type MechanikProps } from '../gemeinsam'

/** Wörter, die sich zwischen zwei Sätzen unterscheiden (über die längste gemeinsame Teilfolge) */
function unterschiede(a: string, b: string): { a: Set<number>; b: Set<number> } {
  const wa = a.split(/(\s+)/)
  const wb = b.split(/(\s+)/)
  const n = wa.length
  const m = wb.length
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) lcs[i][j] = wa[i] === wb[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
  }
  const inA = new Set<number>()
  const inB = new Set<number>()
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (wa[i] === wb[j]) {
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) inA.add(i++)
    else inB.add(j++)
  }
  while (i < n) inA.add(i++)
  while (j < m) inB.add(j++)
  return { a: inA, b: inB }
}

function Markiert({ text, anders }: { text: string; anders: Set<number> | null }) {
  const woerter = text.split(/(\s+)/)
  return (
    <>
      {woerter.map((w, i) =>
        anders?.has(i) && w.trim() ? (
          <mark key={i} className="lw-anders">
            {w}
          </mark>
        ) : (
          <span key={i}>{w}</span>
        ),
      )}
    </>
  )
}

export function Duell({ items, stufe, seed, onFertig }: MechanikProps<DuellItem>) {
  const fertig = useEinmal(onFertig)
  const [runde, setRunde] = useState(0)
  const [ergebnisse, setErgebnisse] = useState<RundenErgebnis[]>([])
  const item = items[runde]
  const zeit = stufe >= 5 ? 8 : stufe >= 3 ? 11 : 0

  const weiter = (e: RundenErgebnis) => {
    const alle = [...ergebnisse, e]
    setErgebnisse(alle)
    if (runde + 1 < items.length) setRunde(runde + 1)
    else fertig({ punkte: alle.reduce((s, x) => s + x.punkte, 0) / alle.length, runden: alle })
  }

  return (
    <div className="lw-spiel lw-duell">
      <Rundenpunkte gesamt={items.length} ergebnisse={ergebnisse.map((e) => e.punkte)} aktuell={runde} />
      <DuellRunde key={item.id} item={item} seed={ableiten(seed, runde)} zeit={zeit} onFertig={weiter} />
    </div>
  )
}

function DuellRunde({ item, seed, zeit, onFertig }: { item: DuellItem; seed: number; zeit: number; onFertig: (e: RundenErgebnis) => void }) {
  // Position zufällig – sonst merkt man sich „oben ist richtig“
  const vertauscht = useMemo(() => zufall(seed)() < 0.5, [seed])
  const karten = vertauscht ? (['b', 'a'] as const) : (['a', 'b'] as const)
  const [wahl, setWahl] = useState<'a' | 'b' | 'zeit' | null>(null)
  const [rest, setRest] = useState(zeit)
  const diff = useMemo(() => unterschiede(item.a, item.b), [item])
  const auto = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!zeit || wahl) return
    if (rest <= 0) {
      setWahl('zeit')
      rueckmeldung.falsch()
      return
    }
    const t = window.setTimeout(() => setRest((r) => Math.round((r - 0.1) * 10) / 10), 100)
    return () => window.clearTimeout(t)
  }, [rest, zeit, wahl])

  useEffect(() => () => window.clearTimeout(auto.current), [])

  const waehle = (seite: 'a' | 'b') => {
    if (wahl) return
    setWahl(seite)
    if (seite === item.richtig) rueckmeldung.richtig()
    else rueckmeldung.falsch()
  }

  const richtig = wahl === item.richtig
  const punkte = richtig ? 1 : 0

  return (
    <>
      {item.kontext && <p className="lw-etikett">{item.kontext}</p>}
      <p className="lw-aufgabe">{item.frage ?? 'Welcher Satz ist korrekt?'}</p>
      {zeit > 0 && !wahl && (
        <div className="lw-uhr" aria-hidden="true">
          <span style={{ width: `${(rest / zeit) * 100}%` }} />
        </div>
      )}
      <div className="lw-duell-karten">
        {karten.map((seite, i) => {
          const text = item[seite]
          const zustand = !wahl ? '' : seite === item.richtig ? ' is-correct' : seite === wahl ? ' is-wrong' : ' is-dim'
          return (
            <button key={seite} className={`lw-duell-karte${zustand}`} aria-disabled={wahl !== null} onClick={() => waehle(seite)}>
              <span className="lw-duell-marke">{i === 0 ? 'A' : 'B'}</span>
              <span className="lw-duell-text">
                <Markiert text={text} anders={wahl ? diff[seite] : null} />
              </span>
            </button>
          )
        })}
      </div>
      {wahl && (
        <Rueckmeldung
          gut={richtig}
          auto={richtig ? 1500 : undefined}
          titel={richtig ? '✓ Richtig' : wahl === 'zeit' ? '⏱ Zeit abgelaufen' : 'Der andere Satz stimmt'}
          weiter={() => onFertig({ id: item.id, ziel: item.ziel, stufe: item.stufe, punkte })}
        >
          <Vorlesen text={item[item.richtig]} sprache={item.sprache} klein />
          <Erklaerung text={item.warum} mehr={item.mehr} />
        </Rueckmeldung>
      )}
    </>
  )
}
