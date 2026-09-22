// Baukasten: einen Rechner zusammenstellen – oder eine fertige Konfiguration prüfen.
// Die Teile passen nur zusammen, wenn Sockel, Speichertyp, Formfaktor, Länge und Watt
// stimmen. Nach der Antwort steht da, welches Teil gehakt hat und warum.
import { useState } from 'react'
import type { BaukastenItem, Bauteil, RundenErgebnis } from '../../typen'
import { Erklaerung, Rueckmeldung, Rundenpunkte, rueckmeldung, useEinmal, type MechanikProps } from '../gemeinsam'

const TYP_NAME: Record<Bauteil['typ'], string> = {
  cpu: 'Prozessor',
  board: 'Mainboard',
  ram: 'Arbeitsspeicher',
  gpu: 'Grafikkarte',
  netzteil: 'Netzteil',
  gehaeuse: 'Gehäuse',
}

/** Alle Regeln an einer Stelle: Was passt nicht zusammen? */
function pruefe(teile: Bauteil[], braucht: { grafik: boolean }): string | null {
  const von = (t: Bauteil['typ']) => teile.find((x) => x.typ === t)
  const cpu = von('cpu')
  const board = von('board')
  const ram = von('ram')
  const gpu = von('gpu')
  const netzteil = von('netzteil')
  const gehaeuse = von('gehaeuse')
  if (cpu && board && cpu.sockel !== board.sockel) return `${cpu.name} passt nicht auf ${board.name}: Sockel ${cpu.sockel} gegen ${board.sockel}.`
  if (ram && board && ram.ram !== board.ram) return `${ram.name} passt nicht: Das Board nimmt ${board.ram}, der Riegel ist ${ram.ram}.`
  if (board && gehaeuse && board.formfaktor && gehaeuse.passt && !gehaeuse.passt.includes(board.formfaktor))
    return `${board.name} (${board.formfaktor}) passt nicht in ${gehaeuse.name}.`
  if (gpu && gehaeuse && gpu.laenge && gehaeuse.maxLaenge && gpu.laenge > gehaeuse.maxLaenge)
    return `${gpu.name} ist mit ${gpu.laenge} mm zu lang für ${gehaeuse.name} (max. ${gehaeuse.maxLaenge} mm).`
  const watt = teile.reduce((s, t) => s + (t.typ === 'netzteil' ? 0 : (t.watt ?? 0)), 0)
  if (netzteil && netzteil.watt && watt > netzteil.watt)
    return `Das Netzteil ist zu schwach: ${watt} W gebraucht, ${netzteil.watt} W vorhanden.`
  if (braucht.grafik && !gpu && cpu && !cpu.grafik) return `${cpu.name} hat keine Grafikeinheit – ohne Grafikkarte kommt kein Bild.`
  return null
}

export function Baukasten({ items, seed, onFertig }: MechanikProps<BaukastenItem>) {
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
    <div className="lw-spiel lw-baukasten">
      <Rundenpunkte gesamt={items.length} ergebnisse={ergebnisse.map((e) => e.punkte)} aktuell={runde} />
      <BauRunde key={item.id + seed} item={item} onFertig={weiter} />
    </div>
  )
}

function BauRunde({ item, onFertig }: { item: BaukastenItem; onFertig: (e: RundenErgebnis) => void }) {
  const [wahl, setWahl] = useState<number[]>(item.plaetze.map((p) => p.gesetzt ?? -1))
  const [verdacht, setVerdacht] = useState<Bauteil['typ'] | null>(null)
  const [ende, setEnde] = useState(false)
  const bauen = item.modus === 'bauen'

  const gesetzt = wahl.map((i, k) => (i >= 0 ? item.plaetze[k].optionen[i] : null)).filter((t): t is Bauteil => !!t)
  const problem = pruefe(gesetzt, item.braucht)

  const setze = (platz: number, i: number) => {
    if (ende) return
    rueckmeldung.tipp()
    setWahl((w) => w.map((alt, k) => (k === platz ? i : alt)))
  }

  const fertigBauen = () => {
    if (ende || gesetzt.length < item.plaetze.length) return
    setEnde(true)
    if (!problem) rueckmeldung.richtig()
    else rueckmeldung.falsch()
  }

  const tippeVerdacht = (typ: Bauteil['typ']) => {
    if (ende) return
    setVerdacht(typ)
    setEnde(true)
    if (typ === item.problem?.typ) rueckmeldung.richtig()
    else rueckmeldung.falsch()
  }

  const richtig = bauen ? !problem : verdacht === item.problem?.typ
  const punkte = !ende ? 0 : richtig ? 1 : 0

  return (
    <>
      <p className="lw-aufgabe">{bauen ? `Stell einen Rechner zusammen: ${item.zweck}` : `Diese Konfiguration läuft nicht – welches Teil passt nicht? (${item.zweck})`}</p>

      <div className="lw-plaetze">
        {item.plaetze.map((platz, k) => {
          const teil = wahl[k] >= 0 ? platz.optionen[wahl[k]] : null
          const markiert = !bauen && (verdacht === platz.typ || (ende && item.problem?.typ === platz.typ))
          const zustand = !ende ? '' : item.problem?.typ === platz.typ ? ' is-schuld' : verdacht === platz.typ ? ' is-wrong' : ''
          return (
            <div key={platz.typ} className={`lw-platz${markiert ? ' is-markiert' : ''}${zustand}`}>
              <span className="lw-platz-typ">{TYP_NAME[platz.typ]}</span>
              {bauen ? (
                <div className="lw-teile">
                  {platz.optionen.map((t, i) => (
                    <button key={t.id} className={`lw-teil${wahl[k] === i ? ' is-an' : ''}`} onClick={() => setze(k, i)} aria-pressed={wahl[k] === i}>
                      <strong>{t.name}</strong>
                      <small>{t.info}</small>
                    </button>
                  ))}
                </div>
              ) : (
                <button className="lw-teil is-fest" onClick={() => tippeVerdacht(platz.typ)} aria-disabled={ende}>
                  <strong>{teil?.name}</strong>
                  <small>{teil?.info}</small>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {bauen && !ende && (
        <button className="btn btn-primary lw-pruefen" disabled={gesetzt.length < item.plaetze.length} onClick={fertigBauen}>
          Zusammenbauen
        </button>
      )}

      {ende && (
        <Rueckmeldung
          gut={punkte === 1}
          titel={richtig ? (bauen ? '✓ Läuft' : '✓ Das war der Übeltäter') : bauen ? 'So läuft das nicht' : 'Daran lag es nicht'}
          weiter={() => onFertig({ id: item.id, ziel: item.ziel, stufe: item.stufe, punkte })}
        >
          {bauen && problem && <p className="lw-warum-falsch">{problem}</p>}
          {!bauen && <p className="lw-loesung">{TYP_NAME[item.problem!.typ]}: {item.problem!.grund}</p>}
          <Erklaerung text={item.erklaerung} mehr={item.mehr} />
        </Rueckmeldung>
      )}
    </>
  )
}
