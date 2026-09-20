// Hören: ein Satz wird gesprochen, danach die Frage dazu. Wer mag, hört langsam noch einmal.
// Ohne passende Stimme auf dem Gerät steht der Satz da – dann wird daraus eine Leseübung.
import { useEffect, useMemo, useState } from 'react'
import { beiStimmen, hatStimme, kannSprechen, sprich } from '../../sprache'
import type { HoerItem, RundenErgebnis, WahlOption } from '../../typen'
import { ableiten, mische, zufall } from '../../zufall'
import { Erklaerung, Rueckmeldung, Rundenpunkte, rueckmeldung, useEinmal, type MechanikProps } from '../gemeinsam'

export function Hoeren({ items, seed, onFertig }: MechanikProps<HoerItem>) {
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
    <div className="lw-spiel lw-hoeren">
      <Rundenpunkte gesamt={items.length} ergebnisse={ergebnisse.map((e) => e.punkte)} aktuell={runde} />
      <HoerRunde key={item.id} item={item} seed={ableiten(seed, runde)} onFertig={weiter} />
    </div>
  )
}

function HoerRunde({ item, seed, onFertig }: { item: HoerItem; seed: number; onFertig: (e: RundenErgebnis) => void }) {
  const optionen = useMemo(() => mische(zufall(seed), item.optionen), [item, seed])
  const [gewaehlt, setGewaehlt] = useState<WahlOption | null>(null)
  const [stimme, setStimme] = useState(() => kannSprechen() && hatStimme(item.sprache))
  const [gehoert, setGehoert] = useState(0)

  useEffect(() => beiStimmen(() => setStimme(kannSprechen() && hatStimme(item.sprache))), [item.sprache])

  // Einmal von selbst vorlesen, sobald die Runde beginnt
  useEffect(() => {
    if (!stimme) return
    const t = window.setTimeout(() => {
      sprich(item.text, item.sprache)
      setGehoert((n) => n + 1)
    }, 350)
    return () => window.clearTimeout(t)
  }, [item, stimme])

  const hoeren = (langsam: boolean) => {
    sprich(item.text, item.sprache, { langsam })
    setGehoert((n) => n + 1)
    rueckmeldung.tipp()
  }

  const waehle = (o: WahlOption) => {
    if (gewaehlt) return
    setGewaehlt(o)
    if (o.richtig) rueckmeldung.richtig()
    else rueckmeldung.falsch()
  }

  const punkte = !gewaehlt ? 0 : gewaehlt.richtig ? 1 : Math.max(0, Math.min(1, gewaehlt.teil ?? 0))
  const richtige = item.optionen.find((o) => o.richtig)

  return (
    <>
      {item.kontext && <p className="lw-etikett">{item.kontext}</p>}
      <div className="lw-hoerfeld">
        {stimme ? (
          <>
            <button className="lw-hoerknopf" onClick={() => hoeren(false)} aria-label="Anhören">
              🔊
            </button>
            <button className="lw-hoerknopf is-klein" onClick={() => hoeren(true)} aria-label="Langsam anhören">
              🐢
            </button>
            <small>{gehoert > 0 ? `${gehoert}× gehört` : 'wird abgespielt …'}</small>
          </>
        ) : (
          <div className="lw-kein-ton">
            <p>{item.text}</p>
            <small>Dein Gerät hat keine passende Stimme – hier steht der Satz.</small>
          </div>
        )}
      </div>

      <p className="lw-aufgabe">{item.frage}</p>

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
          titel={gewaehlt.richtig ? '✓ Richtig gehört' : 'Nicht ganz'}
          weiter={() => onFertig({ id: item.id, ziel: item.ziel, stufe: item.stufe, punkte })}
        >
          <p className="lw-loesung">
            „{item.text}“
            {item.de && <small className="lw-uebersetzung">{item.de}</small>}
          </p>
          {!gewaehlt.richtig && richtige && <p className="lw-warum-falsch">Richtig wäre: {richtige.text}</p>}
          <Erklaerung text={richtige?.warum ?? item.erklaerung} mehr={item.mehr} />
        </Rueckmeldung>
      )}
    </>
  )
}
