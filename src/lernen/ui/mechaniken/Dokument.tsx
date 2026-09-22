// Dokument prüfen: eine Überweisung, ein Kontoauszug, ein Formular. Irgendwo stimmt etwas
// nicht. Man tippt die verdächtige Zeile an und wählt, was dort stehen müsste.
import { useMemo, useState } from 'react'
import type { DokumentItem } from '../../typen'
import { mische, zufall } from '../../zufall'
import { Erklaerung, Rueckmeldung, rueckmeldung, useEinmal, type MechanikProps } from '../gemeinsam'

export function Dokument({ items, seed, onFertig }: MechanikProps<DokumentItem>) {
  const fertig = useEinmal(onFertig)
  const item = items[0]
  const [gewaehlt, setGewaehlt] = useState<number | null>(null)
  const [antwort, setAntwort] = useState<string | null>(null)
  const [versuche, setVersuche] = useState(0)
  const [ende, setEnde] = useState(false)

  const fehlerZeile = item.zeilen.findIndex((z) => z.fehler)
  const zeile = gewaehlt !== null ? item.zeilen[gewaehlt] : null
  const auswahl = useMemo(
    () => (zeile?.fehler ? mische(zufall(seed), [zeile.fehler.richtig, ...zeile.fehler.falsch]) : []),
    [zeile, seed],
  )

  const tippe = (i: number) => {
    if (ende || gewaehlt !== null) return
    if (item.zeilen[i].fehler) {
      rueckmeldung.wahl()
      setGewaehlt(i)
      return
    }
    // Danebengetippt: Das kostet, beendet den Fall aber nicht
    rueckmeldung.falsch()
    setVersuche((v) => v + 1)
  }

  const waehle = (wert: string) => {
    if (antwort) return
    setAntwort(wert)
    setEnde(true)
    if (wert === zeile?.fehler?.richtig) rueckmeldung.richtig()
    else rueckmeldung.falsch()
  }

  const korrekt = antwort !== null && antwort === zeile?.fehler?.richtig
  const punkte = !ende ? 0 : korrekt ? Math.max(0.4, 1 - versuche * 0.25) : 0

  return (
    <div className="lw-spiel lw-dokument">
      <p className="lw-aufgabe">{item.auftrag}</p>

      <div className="lw-beleg">
        <p className="lw-beleg-titel">
          {item.titel}
          {item.untertitel && <small>{item.untertitel}</small>}
        </p>
        <dl>
          {item.zeilen.map((z, i) => {
            const getroffen = gewaehlt === i
            const zeigen = ende && i === fehlerZeile
            // Nach der Antwort steht in der Zeile entweder die Korrektur oder der alte Fehler
            const zustand = zeigen ? (korrekt ? ' is-korrigiert' : ' is-fehler') : ''
            return (
              <div key={z.label} className={`${getroffen ? 'is-gewaehlt' : ''}${zustand}`}>
                <dt>{z.label}</dt>
                <dd>
                  <button onClick={() => tippe(i)} aria-disabled={gewaehlt !== null}>
                    {ende && i === fehlerZeile && korrekt ? z.fehler!.richtig : z.wert}
                  </button>
                </dd>
              </div>
            )
          })}
        </dl>
        {versuche > 0 && !ende && <p className="lw-hinweis">Hier stimmt alles – schau weiter.</p>}
      </div>

      {zeile?.fehler && !ende && (
        <>
          <p className="lw-aufgabe">Was müsste dort stehen?</p>
          <div className="options lw-optionen">
            {auswahl.map((w) => (
              <button key={w} className="option lw-option" onClick={() => waehle(w)}>
                <span>{w}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {ende && (
        <Rueckmeldung
          gut={punkte >= 0.7}
          titel={korrekt ? (versuche === 0 ? '✓ Sofort gefunden' : '✓ Gefunden') : 'Der Fehler lag woanders'}
          weiter={() => fertig({ punkte, runden: [{ id: item.id, ziel: item.ziel, stufe: item.stufe, punkte }] })}
        >
          <p className="lw-loesung">
            {item.zeilen[fehlerZeile]?.label}: {item.zeilen[fehlerZeile]?.fehler?.richtig}
          </p>
          <Erklaerung text={item.zeilen[fehlerZeile]?.fehler?.warum} mehr={item.mehr ?? item.erklaerung} />
        </Rueckmeldung>
      )}
    </div>
  )
}
