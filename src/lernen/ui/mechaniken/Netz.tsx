// Netzwerk: Ein Gerät kommt nicht ins Netz. Man sieht alle Geräte mit ihren Adressen,
// tippt eines an, um die Details zu lesen, und entscheidet dann, woran es liegt.
// Die Zahlen sind echt lesbar – wer Subnetze versteht, sieht den Fehler sofort.
import { useMemo, useState } from 'react'
import type { NetzItem, RundenErgebnis, WahlOption } from '../../typen'
import { ableiten, mische, zufall } from '../../zufall'
import { Erklaerung, Rueckmeldung, Rundenpunkte, rueckmeldung, useEinmal, type MechanikProps } from '../gemeinsam'

export function Netz({ items, seed, onFertig }: MechanikProps<NetzItem>) {
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
    <div className="lw-spiel lw-netz">
      <Rundenpunkte gesamt={items.length} ergebnisse={ergebnisse.map((e) => e.punkte)} aktuell={runde} />
      <NetzRunde key={item.id} item={item} seed={ableiten(seed, runde)} onFertig={weiter} />
    </div>
  )
}

function NetzRunde({ item, seed, onFertig }: { item: NetzItem; seed: number; onFertig: (e: RundenErgebnis) => void }) {
  const optionen = useMemo(() => mische(zufall(seed), item.optionen), [item, seed])
  const [offen, setOffen] = useState<string | null>(item.betroffen)
  const [gewaehlt, setGewaehlt] = useState<WahlOption | null>(null)
  const geraet = item.geraete.find((g) => g.id === offen)

  const waehle = (o: WahlOption) => {
    if (gewaehlt) return
    setGewaehlt(o)
    if (o.richtig) rueckmeldung.richtig()
    else rueckmeldung.falsch()
  }

  const punkte = !gewaehlt ? 0 : gewaehlt.richtig ? 1 : Math.max(0, Math.min(1, gewaehlt.teil ?? 0))

  return (
    <>
      <div className="lw-symptom">
        <span aria-hidden="true">⚠️</span>
        <p>{item.symptom}</p>
      </div>

      <div className="lw-netzplan">
        <div className="lw-router">
          <span aria-hidden="true">📡</span>
          <strong>Router</strong>
          <small>{item.router.ip}</small>
          <small>{item.router.dhcp ? 'DHCP an' : 'DHCP aus'} · {item.router.internet ? 'online' : 'offline'}</small>
        </div>
        <ul className="lw-geraete">
          {item.geraete.map((g) => (
            <li key={g.id}>
              <button
                className={`lw-geraet${g.id === item.betroffen ? ' is-betroffen' : ''}${g.id === offen ? ' is-offen' : ''}`}
                onClick={() => {
                  setOffen(g.id)
                  rueckmeldung.tipp()
                }}
              >
                <span aria-hidden="true">{g.emoji}</span>
                <strong>{g.name}</strong>
                <small>{g.kabel ? g.ip : 'kein Kabel'}</small>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {geraet && (
        <dl className="lw-daten lw-geraetedaten">
          <div>
            <dt>Gerät</dt>
            <dd>{geraet.name}</dd>
          </div>
          <div>
            <dt>IP</dt>
            <dd>{geraet.ip}</dd>
          </div>
          <div>
            <dt>Subnetzmaske</dt>
            <dd>{geraet.maske}</dd>
          </div>
          <div>
            <dt>Gateway</dt>
            <dd>{geraet.gateway}</dd>
          </div>
          <div>
            <dt>DNS</dt>
            <dd>{geraet.dns}</dd>
          </div>
          <div>
            <dt>Verbindung</dt>
            <dd>{geraet.kabel ? (geraet.dhcp ? 'DHCP' : 'feste IP') : 'kein Kabel'}</dd>
          </div>
        </dl>
      )}

      <p className="lw-aufgabe">Woran liegt es?</p>
      <div className="options lw-optionen">
        {optionen.map((o) => {
          const zustand = !gewaehlt ? '' : o.richtig ? ' is-correct' : o === gewaehlt ? ' is-wrong' : ' is-dim'
          return (
            <button key={o.text} className={`option lw-option${zustand}`} aria-disabled={gewaehlt !== null} onClick={() => waehle(o)}>
              <span>{o.text}</span>
            </button>
          )
        })}
      </div>

      {gewaehlt && (
        <Rueckmeldung
          gut={punkte >= 0.7}
          titel={gewaehlt.richtig ? '✓ Gefunden' : 'Das war es nicht'}
          weiter={() => onFertig({ id: item.id, ziel: item.ziel, stufe: item.stufe, punkte })}
        >
          {!gewaehlt.richtig && <p className="lw-loesung">{item.optionen.find((o) => o.richtig)?.text}</p>}
          <Erklaerung text={item.optionen.find((o) => o.richtig)?.warum ?? item.erklaerung} mehr={item.mehr} />
        </Rueckmeldung>
      )}
    </>
  )
}
