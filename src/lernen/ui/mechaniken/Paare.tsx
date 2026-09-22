// Zuordnen: Wort und Bedeutung, Begriff und Erklärung, Satz und Übersetzung. Erst links tippen,
// dann rechts – oder umgekehrt. Am Ende steht jedes Paar noch einmal mit Beispiel da.
import { useMemo, useState } from 'react'
import type { PaarItem } from '../../typen'
import { ableiten, mische, zufall } from '../../zufall'
import { Rueckmeldung, rueckmeldung, useEinmal, Vorlesen, type MechanikProps } from '../gemeinsam'

export function Paare({ items, spiel, seed, onFertig }: MechanikProps<PaarItem>) {
  const fertig = useEinmal(onFertig)
  const links = useMemo(() => mische(zufall(seed), items), [items, seed])
  const rechts = useMemo(() => mische(zufall(ableiten(seed, 1)), items), [items, seed])
  const [wahlLinks, setWahlLinks] = useState<string | null>(null)
  const [wahlRechts, setWahlRechts] = useState<string | null>(null)
  // Links und rechts getrennt: Haben zwei Paare dieselbe Bedeutung, passt jede der beiden
  const [linksFertig, setLinksFertig] = useState<string[]>([])
  const [rechtsFertig, setRechtsFertig] = useState<string[]>([])
  const [fehler, setFehler] = useState<Record<string, number>>({})
  const [wackel, setWackel] = useState<string[]>([])
  const alleGeloest = linksFertig.length === items.length

  const nach = (id: string) => items.find((item) => item.id === id)!

  const pruefe = (l: string, r: string) => {
    const a = nach(l)
    const b = nach(r)
    if (l === r || a.rechts === b.rechts || a.links === b.links) {
      rueckmeldung.richtig()
      setLinksFertig((g) => [...g, l])
      setRechtsFertig((g) => [...g, r])
    } else {
      rueckmeldung.falsch()
      setFehler((f) => ({ ...f, [l]: (f[l] ?? 0) + 1, [r]: (f[r] ?? 0) + 1 }))
      setWackel([`l:${l}`, `r:${r}`])
      window.setTimeout(() => setWackel([]), 450)
    }
    setWahlLinks(null)
    setWahlRechts(null)
  }

  const tippeLinks = (id: string) => {
    if (linksFertig.includes(id)) return
    rueckmeldung.tipp()
    if (wahlRechts) pruefe(id, wahlRechts)
    else setWahlLinks(wahlLinks === id ? null : id)
  }

  const tippeRechts = (id: string) => {
    if (rechtsFertig.includes(id)) return
    rueckmeldung.tipp()
    if (wahlLinks) pruefe(wahlLinks, id)
    else setWahlRechts(wahlRechts === id ? null : id)
  }

  const punkteVon = (id: string) => {
    const f = fehler[id] ?? 0
    return f === 0 ? 1 : f === 1 ? 0.5 : 0
  }
  const gesamt = items.reduce((s, item) => s + punkteVon(item.id), 0) / Math.max(1, items.length)
  const [spalteL, spalteR] = spiel.spalten ?? ['', '']

  return (
    <div className="lw-spiel lw-paare">
      <div className="lw-paare-spalten">
        <div className="lw-paare-spalte" aria-label={spalteL || 'links'}>
          {spalteL && <p className="lw-spalte-titel">{spalteL}</p>}
          {links.map((item) => (
            <button
              key={item.id}
              className={`lw-paar${linksFertig.includes(item.id) ? ' is-geloest' : ''}${wahlLinks === item.id ? ' is-gewaehlt' : ''}${wackel.includes(`l:${item.id}`) ? ' is-wackel' : ''}`}
              aria-disabled={linksFertig.includes(item.id)}
              onClick={() => tippeLinks(item.id)}
            >
              {item.links}
            </button>
          ))}
        </div>
        <div className="lw-paare-spalte" aria-label={spalteR || 'rechts'}>
          {spalteR && <p className="lw-spalte-titel">{spalteR}</p>}
          {rechts.map((item) => (
            <button
              key={item.id}
              className={`lw-paar is-rechts${rechtsFertig.includes(item.id) ? ' is-geloest' : ''}${wahlRechts === item.id ? ' is-gewaehlt' : ''}${wackel.includes(`r:${item.id}`) ? ' is-wackel' : ''}`}
              aria-disabled={rechtsFertig.includes(item.id)}
              onClick={() => tippeRechts(item.id)}
            >
              {item.rechts}
            </button>
          ))}
        </div>
      </div>

      {alleGeloest && (
        <Rueckmeldung
          gut={gesamt >= 0.7}
          titel={gesamt >= 0.99 ? '✓ Alle Paare auf Anhieb' : '✓ Alle Paare gefunden'}
          knopf="Fertig"
          weiter={() =>
            fertig({
              punkte: gesamt,
              runden: items.map((item) => ({ id: item.id, ziel: item.ziel, stufe: item.stufe, punkte: punkteVon(item.id) })),
            })
          }
        >
          <ul className="lw-liste lw-paar-liste">
            {items.map((item) => (
              <li key={item.id} className={punkteVon(item.id) === 1 ? 'is-richtig' : 'is-falsch'}>
                <span>
                  <strong>{item.links}</strong> – {item.rechts}
                  <Vorlesen text={item.links} sprache={item.sprache} klein />
                </span>
                {item.erklaerung && <small>{item.erklaerung}</small>}
              </li>
            ))}
          </ul>
        </Rueckmeldung>
      )}
    </div>
  )
}
