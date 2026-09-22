// Kasse: Geld auszahlen, Einzahlungen zählen, den verfügbaren Betrag bestimmen.
// Beim Auszahlen legt man Scheine und Münzen einzeln hin – genau wie am Schalter, inklusive
// Kundenwünschen („bitte keine Fünfhunderter“). Beim Zählen tippt man die Summe ein.
import { useState } from 'react'
import type { KassenItem, RundenErgebnis } from '../../typen'
import { Erklaerung, Rueckmeldung, Rundenpunkte, rueckmeldung, useEinmal, type MechanikProps } from '../gemeinsam'

const SCHEINE = [500, 200, 100, 50, 20, 10, 5]
const MUENZEN = [2, 1, 0.5, 0.2, 0.1]

const euro = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
const stueck = (n: number) => (n >= 5 ? `${n} €` : n >= 1 ? `${n} €` : `${Math.round(n * 100)} ct`)

export function Kasse({ items, seed, onFertig }: MechanikProps<KassenItem>) {
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
    <div className="lw-spiel lw-kasse">
      <Rundenpunkte gesamt={items.length} ergebnisse={ergebnisse.map((e) => e.punkte)} aktuell={runde} />
      <KassenRunde key={item.id + seed} item={item} onFertig={weiter} />
    </div>
  )
}

function KassenRunde({ item, onFertig }: { item: KassenItem; onFertig: (e: RundenErgebnis) => void }) {
  const [gelegt, setGelegt] = useState<number[]>([])
  const [eingabe, setEingabe] = useState('')
  const [fertig, setFertig] = useState(false)
  const auszahlung = item.typ === 'auszahlung'

  const summe = gelegt.reduce((s, n) => s + n, 0)
  const gerundet = Math.round(summe * 100) / 100

  const lege = (wert: number) => {
    if (fertig) return
    rueckmeldung.tipp()
    setGelegt((g) => [...g, wert])
  }

  const zurueck = (i: number) => {
    if (fertig) return
    rueckmeldung.tipp()
    setGelegt((g) => g.filter((_, k) => k !== i))
  }

  const tippe = (t: string) => {
    if (fertig) return
    rueckmeldung.tipp()
    if (t === '⌫') return setEingabe((e) => e.slice(0, -1))
    if (t === ',' && (eingabe.includes(',') || eingabe === '')) return
    const [, nach] = eingabe.split(',')
    if (nach !== undefined && nach.length >= 2 && t !== ',') return
    if (eingabe.replace(/[^0-9]/g, '').length >= 8) return
    setEingabe((e) => e + t)
  }

  const zahl = auszahlung ? gerundet : Math.round(Number(eingabe.replace(',', '.')) * 100) / 100
  const verboten = auszahlung ? gelegt.filter((w) => item.ohne?.includes(w)) : []
  const richtig = Math.abs(zahl - item.loesung) < 0.005 && verboten.length === 0
  const punkte = !fertig ? 0 : richtig ? 1 : Math.abs(zahl - item.loesung) < 0.005 ? 0.5 : 0

  const pruefe = () => {
    if (fertig) return
    setFertig(true)
    if (richtig) rueckmeldung.richtig()
    else rueckmeldung.falsch()
  }

  return (
    <>
      <div className="lw-schalter">
        <span className="lw-schalter-emoji" aria-hidden="true">
          {item.kunde.emoji}
        </span>
        <div>
          <small>{item.kunde.name}</small>
          <p>{item.text}</p>
        </div>
      </div>

      {(item.kontostand !== undefined || item.betrag !== undefined) && (
        <dl className="lw-daten">
          {item.kontostand !== undefined && (
            <div>
              <dt>Kontostand</dt>
              <dd>{euro(item.kontostand)}</dd>
            </div>
          )}
          {item.dispo !== undefined && (
            <div>
              <dt>Dispo</dt>
              <dd>{euro(item.dispo)}</dd>
            </div>
          )}
          {item.betrag !== undefined && auszahlung && (
            <div>
              <dt>Auszuzahlen</dt>
              <dd>{euro(item.betrag)}</dd>
            </div>
          )}
        </dl>
      )}

      {item.buendel && item.buendel.length > 0 && (
        <div className="lw-buendel" aria-label="Eingezahlte Scheine">
          {item.buendel.map((w, i) => (
            <span key={i} className="lw-schein is-klein">
              {stueck(w)}
            </span>
          ))}
        </div>
      )}

      {auszahlung ? (
        <>
          <div className={`lw-kassenfeld${fertig ? (richtig ? ' is-gut' : ' is-schlecht') : ''}`}>
            {gelegt.length === 0 && <p className="lw-leer">Noch nichts ausgezahlt</p>}
            <div className="lw-gelegt">
              {gelegt.map((w, i) => (
                <button key={i} className={`lw-schein${item.ohne?.includes(w) ? ' is-unerwuenscht' : ''}`} onClick={() => zurueck(i)}>
                  {stueck(w)}
                </button>
              ))}
            </div>
            {item.summe && (
              <p className="lw-kassensumme">
                {euro(gerundet)}
                {item.betrag !== undefined && <small> von {euro(item.betrag)}</small>}
              </p>
            )}
          </div>

          {!fertig && (
            <>
              <div className="lw-geldbrett">
                {SCHEINE.map((w) => (
                  <button key={w} className="lw-geld" onClick={() => lege(w)}>
                    {stueck(w)}
                  </button>
                ))}
                {MUENZEN.map((w) => (
                  <button key={w} className="lw-geld is-muenze" onClick={() => lege(w)}>
                    {stueck(w)}
                  </button>
                ))}
              </div>
              <button className="btn btn-primary lw-pruefen" disabled={gelegt.length === 0} onClick={pruefe}>
                Auszahlen
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <div className={`lw-anzeige${!fertig ? '' : richtig ? ' is-gut' : ' is-schlecht'}`}>
            <span className="lw-anzeige-zahl">{eingabe || '0'}</span>
            <span className="lw-anzeige-einheit">€</span>
          </div>
          {!fertig && (
            <>
              <div className="lw-tasten">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'].map((t) => (
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
        </>
      )}

      {fertig && (
        <Rueckmeldung
          gut={punkte >= 0.7}
          titel={richtig ? '✓ Stimmt' : verboten.length > 0 ? 'Der Betrag stimmt – die Scheine nicht' : 'Nicht ganz'}
          weiter={() => onFertig({ id: item.id, ziel: item.ziel, stufe: item.stufe, punkte })}
        >
          <p className="lw-loesung">{euro(item.loesung)}</p>
          {verboten.length > 0 && (
            <p className="lw-warum-falsch">
              Nicht gewünscht: {verboten.map(stueck).join(', ')}
            </p>
          )}
          <Erklaerung text={item.erklaerung} mehr={item.mehr} />
        </Rueckmeldung>
      )}
    </>
  )
}
