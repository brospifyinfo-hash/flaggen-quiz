// Eine Kurs-Aktivität mitten im Random Mode: gleiche Mechanik wie in der Session, nur kürzer.
// Ist sie schon beantwortet (etwa nach dem Neuladen), steht hier nur noch das Ergebnis.
import { useMemo } from 'react'
import { spielById } from '../kurse'
import type { Aktivitaet, AktivitaetsErgebnis } from '../typen'
import { AktivitaetSpieler } from './AktivitaetSpieler'

export default function AktivitaetImRun({
  daten,
  picked,
  onFertig,
}: {
  daten: string
  picked: string | null
  onFertig: (e: AktivitaetsErgebnis) => void
}) {
  const akt = useMemo(() => {
    try {
      return JSON.parse(daten) as Aktivitaet
    } catch {
      return null
    }
  }, [daten])
  if (!akt) return null
  if (picked !== null) {
    const spiel = spielById(akt.spiel)
    return (
      <div className="lw-im-run-fertig">
        <span aria-hidden="true">{spiel?.emoji}</span> {spiel?.name} abgeschlossen
      </div>
    )
  }
  return (
    <div className="lw-im-run">
      <AktivitaetSpieler akt={akt} onFertig={onFertig} />
    </div>
  )
}
