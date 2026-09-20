// Rechnen: Zinsen, Raten, Renditen. Eingetippt wird über ein eigenes Zahlenfeld – ohne
// Systemtastatur, die auf dem Handy die halbe Aufgabe verdeckt. Nach der Antwort steht der
// Rechenweg Schritt für Schritt da; wer danebenliegt, sieht, wo es abgebogen ist.
import { useState } from 'react'
import type { RechenItem, RundenErgebnis } from '../../typen'
import { Erklaerung, Rueckmeldung, Rundenpunkte, rueckmeldung, useEinmal, type MechanikProps } from '../gemeinsam'

const TASTEN = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫']

/** „1234.5“ → „1.234,50“ */
function zeige(n: number, nachkomma: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: nachkomma, maximumFractionDigits: nachkomma })
}

export function Rechnen({ items, seed, onFertig }: MechanikProps<RechenItem>) {
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
    <div className="lw-spiel lw-rechnen">
      <Rundenpunkte gesamt={items.length} ergebnisse={ergebnisse.map((e) => e.punkte)} aktuell={runde} />
      <RechenRunde key={item.id + seed} item={item} onFertig={weiter} />
    </div>
  )
}

function RechenRunde({ item, onFertig }: { item: RechenItem; onFertig: (e: RundenErgebnis) => void }) {
  const [eingabe, setEingabe] = useState('')
  const [geprueft, setGeprueft] = useState<number | null>(null)
  const nachkomma = item.nachkomma ?? 2

  const tippe = (t: string) => {
    if (geprueft !== null) return
    rueckmeldung.tipp()
    if (t === '⌫') return setEingabe((e) => e.slice(0, -1))
    if (t === ',' && (eingabe.includes(',') || eingabe === '')) return
    if (eingabe.replace(/[^0-9]/g, '').length >= 9) return
    const [, nach] = eingabe.split(',')
    if (nach !== undefined && nach.length >= nachkomma && t !== ',') return
    setEingabe((e) => e + t)
  }

  const zahl = Number(eingabe.replace(',', '.'))
  const pruefe = () => {
    if (!eingabe || geprueft !== null) return
    setGeprueft(zahl)
    if (Math.abs(zahl - item.loesung) <= item.toleranz) rueckmeldung.richtig()
    else rueckmeldung.falsch()
  }

  const genau = geprueft !== null && Math.abs(geprueft - item.loesung) <= item.toleranz
  // Knapp daneben gibt Teilpunkte: Der Weg stimmte, gerundet wurde anders
  const knapp = geprueft !== null && !genau && Math.abs(geprueft - item.loesung) <= Math.max(item.toleranz * 10, item.loesung * 0.02)
  const punkte = genau ? 1 : knapp ? 0.5 : 0

  return (
    <>
      {item.kontext && <p className="lw-etikett">{item.kontext}</p>}
      <p className="lw-aufgabe">{item.aufgabe}</p>

      {item.daten && item.daten.length > 0 && (
        <dl className="lw-daten">
          {item.daten.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className={`lw-anzeige${geprueft === null ? '' : genau ? ' is-gut' : ' is-schlecht'}`}>
        <span className="lw-anzeige-zahl">{eingabe || '0'}</span>
        {item.einheit && <span className="lw-anzeige-einheit">{item.einheit}</span>}
      </div>

      {geprueft === null && (
        <>
          <div className="lw-tasten">
            {TASTEN.map((t) => (
              <button key={t} className={`lw-taste${t === '⌫' ? ' is-weg' : ''}`} onClick={() => tippe(t)}>
                {t}
              </button>
            ))}
          </div>
          <button className="btn btn-primary lw-pruefen" disabled={!eingabe} onClick={pruefe}>
            Prüfen
          </button>
        </>
      )}

      {geprueft !== null && (
        <Rueckmeldung
          gut={punkte >= 0.7}
          titel={genau ? '✓ Stimmt' : knapp ? 'Fast – nur anders gerundet' : 'So geht die Rechnung:'}
          weiter={() => onFertig({ id: item.id, ziel: item.ziel, stufe: item.stufe, punkte })}
        >
          <p className="lw-loesung">
            {zeige(item.loesung, nachkomma)} {item.einheit ?? ''}
          </p>
          <ol className="lw-rechenweg">
            {item.rechenweg.map((schritt, i) => (
              <li key={i}>{schritt}</li>
            ))}
          </ol>
          <Erklaerung text={item.erklaerung} mehr={item.mehr} />
        </Rueckmeldung>
      )}
    </>
  )
}
