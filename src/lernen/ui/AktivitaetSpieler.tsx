// Spielt eine Aktivität: Inhalte auflösen, die passende Mechanik wählen, das Ergebnis melden.
// Dieselbe Komponente läuft in Sessions, im Random Mode und bei Bitten aus der Stadt.
import { kursById, spielById, useKursInhalt, aufloesen } from '../kurse'
import type { Aktivitaet, AktivitaetsErgebnis, Inhalt } from '../typen'
import { ART_FUER, MECHANIKEN } from './mechaniken'
import './lernen.css'

export function AktivitaetSpieler({ akt, onFertig }: { akt: Aktivitaet; onFertig: (e: AktivitaetsErgebnis) => void }) {
  const inhalt = useKursInhalt(akt.kurs)
  const kurs = kursById(akt.kurs)
  const spiel = spielById(akt.spiel)
  if (!kurs || !spiel) return <p className="lern-laedt">Dieses Spiel gibt es nicht mehr.</p>

  // Erzeugte Inhalte stecken in der Aktivität selbst; gespeicherte brauchen den geladenen Kurs
  const brauchtLaden = akt.items.some((ref) => typeof ref === 'string')
  if (brauchtLaden && !inhalt) return <p className="lern-laedt">Lädt …</p>

  const art = ART_FUER[spiel.mechanik]
  const items = akt.items
    .map((ref) => aufloesen(akt.kurs, ref))
    .filter((item): item is Inhalt => item !== null && item.art === art)
  const Mechanik = MECHANIKEN[spiel.mechanik]
  if (!Mechanik || items.length === 0) {
    return (
      <div className="lw-leer">
        <p>Für diese Aufgabe fehlen gerade die Inhalte.</p>
        <button className="btn btn-secondary" onClick={() => onFertig({ punkte: 0, runden: [], uebersprungen: true })}>
          Überspringen
        </button>
      </div>
    )
  }
  return (
    <div className={`lern-welt ${kurs.thema}`}>
      <Mechanik kurs={kurs} spiel={spiel} items={items} stufe={akt.stufe} seed={akt.seed} onFertig={onFertig} />
    </div>
  )
}
