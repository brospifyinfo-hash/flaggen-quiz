// Kreditfall: ein Haushalt, seine Zahlen, eine Entscheidung. Erst rechnet man die Rate aus,
// die zum Wunschkredit gehört, dann beurteilt man, ob der Haushalt sie trägt.
// Alle Fälle sind erfunden – es geht um das Prinzip, nicht um echte Konditionen.
import { useState } from 'react'
import type { KreditItem, RundenErgebnis } from '../../typen'
import { Erklaerung, Rueckmeldung, Rundenpunkte, rueckmeldung, useEinmal, type MechanikProps } from '../gemeinsam'

const euro = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
const URTEIL = [
  { id: 0, titel: 'Nicht tragbar', emoji: '🚫' },
  { id: 1, titel: 'Knapp', emoji: '⚠️' },
  { id: 2, titel: 'Tragbar', emoji: '✅' },
] as const

export function Kredit({ items, seed, onFertig }: MechanikProps<KreditItem>) {
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
    <div className="lw-spiel lw-kredit">
      <Rundenpunkte gesamt={items.length} ergebnisse={ergebnisse.map((e) => e.punkte)} aktuell={runde} />
      <KreditRunde key={item.id + seed} item={item} onFertig={weiter} />
    </div>
  )
}

function KreditRunde({ item, onFertig }: { item: KreditItem; onFertig: (e: RundenErgebnis) => void }) {
  const [rate, setRate] = useState<number | null>(null)
  const [urteil, setUrteil] = useState<number | null>(null)
  const ausgabenSumme = item.ausgaben.reduce((s, [, n]) => s + n, 0)

  const waehleRate = (r: number) => {
    if (rate !== null) return
    setRate(r)
    if (Math.abs(r - item.rate) < 0.51) rueckmeldung.richtig()
    else rueckmeldung.falsch()
  }

  const waehleUrteil = (u: number) => {
    if (urteil !== null) return
    setUrteil(u)
    if (u === item.urteil) rueckmeldung.richtig()
    else rueckmeldung.falsch()
  }

  const rateOk = rate !== null && Math.abs(rate - item.rate) < 0.51
  const urteilOk = urteil === item.urteil
  const punkte = urteil === null ? 0 : (rateOk ? 0.4 : 0) + (urteilOk ? 0.6 : 0)

  return (
    <>
      <div className="lw-kunde">
        <span className="lw-kunde-emoji" aria-hidden="true">
          {item.kunde.emoji}
        </span>
        <div>
          <strong>{item.kunde.name}</strong>
          <small>{item.kunde.beruf}</small>
        </div>
        <p className="lw-wunsch">
          {euro(item.betrag)} über {item.monate} Monate · {item.zins.toLocaleString('de-DE', { minimumFractionDigits: 1 })} % p. a.
        </p>
      </div>

      <dl className="lw-haushalt">
        <div className="is-plus">
          <dt>Netto im Monat</dt>
          <dd>{euro(item.netto)}</dd>
        </div>
        {item.ausgaben.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>−{euro(v)}</dd>
          </div>
        ))}
        {item.raten > 0 && (
          <div>
            <dt>Laufende Raten</dt>
            <dd>−{euro(item.raten)}</dd>
          </div>
        )}
        <div className="is-summe">
          <dt>Bleibt im Monat</dt>
          <dd>{euro(item.netto - ausgabenSumme - item.raten)}</dd>
        </div>
      </dl>

      <p className="lw-aufgabe">Welche Monatsrate gehört zu diesem Kredit?</p>
      <div className="options lw-optionen">
        {item.rateOptionen.map((r) => {
          const ist = Math.abs(r - item.rate) < 0.51
          const zustand = rate === null ? '' : ist ? ' is-correct' : r === rate ? ' is-wrong' : ' is-dim'
          return (
            <button key={r} className={`option lw-option${zustand}`} aria-disabled={rate !== null} onClick={() => waehleRate(r)}>
              <span>{euro(r)}</span>
            </button>
          )
        })}
      </div>

      {rate !== null && (
        <>
          <p className="lw-aufgabe">
            Nach der Rate bleiben {euro(item.ueberschuss)} übrig. Wie beurteilst du den Kredit?
          </p>
          <div className="options lw-optionen lw-urteile">
            {URTEIL.map((u) => {
              const zustand = urteil === null ? '' : u.id === item.urteil ? ' is-correct' : u.id === urteil ? ' is-wrong' : ' is-dim'
              return (
                <button key={u.id} className={`option lw-option${zustand}`} aria-disabled={urteil !== null} onClick={() => waehleUrteil(u.id)}>
                  <span>
                    <span aria-hidden="true">{u.emoji}</span> {u.titel}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {urteil !== null && (
        <Rueckmeldung
          gut={punkte >= 0.7}
          titel={punkte === 1 ? '✓ Sauber gerechnet und beurteilt' : urteilOk ? '✓ Richtig beurteilt – die Rate lag daneben' : 'Das war zu optimistisch'}
          weiter={() => onFertig({ id: item.id, ziel: item.ziel, stufe: item.stufe, punkte })}
        >
          <p className="lw-loesung">
            Rate {euro(item.rate)} · übrig {euro(item.ueberschuss)} · {URTEIL[item.urteil].titel}
          </p>
          {item.risiko && <p className="lw-warum-falsch">{item.risiko}</p>}
          <Erklaerung text={item.erklaerung} mehr={item.mehr} />
        </Rueckmeldung>
      )}
    </>
  )
}
