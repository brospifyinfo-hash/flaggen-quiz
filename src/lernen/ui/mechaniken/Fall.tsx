// Fall: Jemand kommt mit einem Anliegen. Erst sammelt man Befunde – jede Prüfung kostet
// einen Tipp und zeigt, was dabei herauskommt –, dann stellt man die Diagnose und sagt,
// was als Nächstes zu tun ist. Wer ohne die wichtigen Befunde rät, verliert Punkte.
import { useState } from 'react'
import type { FallItem, RundenErgebnis, WahlOption } from '../../typen'
import { ableiten, mische, zufall } from '../../zufall'
import { Erklaerung, Rueckmeldung, Rundenpunkte, rueckmeldung, useEinmal, type MechanikProps } from '../gemeinsam'

export function Fall({ items, seed, onFertig }: MechanikProps<FallItem>) {
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
    <div className="lw-spiel lw-fall">
      <Rundenpunkte gesamt={items.length} ergebnisse={ergebnisse.map((e) => e.punkte)} aktuell={runde} />
      <FallRunde key={item.id} item={item} seed={ableiten(seed, runde)} onFertig={weiter} />
    </div>
  )
}

function FallRunde({ item, seed, onFertig }: { item: FallItem; seed: number; onFertig: (e: RundenErgebnis) => void }) {
  const [offen, setOffen] = useState<number[]>([])
  const [diagnose, setDiagnose] = useState<WahlOption | null>(null)
  const [schritt, setSchritt] = useState<WahlOption[]>([])
  const [fertig, setFertig] = useState(false)
  const diagnosen = mische(zufall(seed), item.diagnose.optionen)
  const zweite = item.schritt2 ? mische(zufall(ableiten(seed, 3)), item.schritt2.optionen) : []
  const mehrfach = item.schritt2?.mehrfach ?? false

  const pruefe = (i: number) => {
    if (offen.includes(i) || diagnose) return
    rueckmeldung.tipp()
    setOffen((o) => [...o, i])
  }

  const waehleDiagnose = (o: WahlOption) => {
    if (diagnose) return
    setDiagnose(o)
    if (o.richtig) rueckmeldung.richtig()
    else rueckmeldung.falsch()
    if (!item.schritt2) setFertig(true)
  }

  const waehleSchritt = (o: WahlOption) => {
    if (fertig) return
    if (mehrfach) {
      rueckmeldung.wahl()
      setSchritt((s) => (s.includes(o) ? s.filter((x) => x !== o) : [...s, o]))
      return
    }
    setSchritt([o])
    setFertig(true)
    if (o.richtig) rueckmeldung.richtig()
    else rueckmeldung.falsch()
  }

  const abschliessen = () => {
    if (fertig || schritt.length === 0) return
    setFertig(true)
    if (schritt.every((o) => o.richtig) && schritt.length === zweite.filter((o) => o.richtig).length) rueckmeldung.richtig()
    else rueckmeldung.falsch()
  }

  const wichtige = item.pruefungen.map((p, i) => (p.wichtig ? i : -1)).filter((i) => i >= 0)
  const wichtigeGesehen = wichtige.every((i) => offen.includes(i))
  const diagnoseOk = diagnose?.richtig ?? false
  const richtigeZweite = zweite.filter((o) => o.richtig)
  const zweiteOk = !item.schritt2
    ? true
    : mehrfach
      ? schritt.length === richtigeZweite.length && schritt.every((o) => o.richtig)
      : (schritt[0]?.richtig ?? false)
  const punkte = !fertig
    ? 0
    : Math.max(
        0,
        Math.min(1, (diagnoseOk ? (item.schritt2 ? 0.6 : 1) : diagnose?.teil ? diagnose.teil * 0.6 : 0) + (item.schritt2 && zweiteOk ? 0.4 : 0) - (wichtigeGesehen ? 0 : 0.15)),
      )

  return (
    <>
      <div className="lw-kunde">
        <span className="lw-kunde-emoji" aria-hidden="true">
          {item.person.emoji}
        </span>
        <div>
          <strong>{item.person.name}</strong>
          <small>{item.person.rolle}</small>
        </div>
        <p className="lw-wunsch">„{item.anliegen}“</p>
      </div>

      <p className="lw-aufgabe">Was prüfst du?</p>
      <ul className="lw-pruefungen">
        {item.pruefungen.map((p, i) => (
          <li key={p.frage} className={offen.includes(i) ? 'is-offen' : ''}>
            {offen.includes(i) ? (
              <>
                <strong>{p.frage}</strong>
                <span>{p.befund}</span>
              </>
            ) : (
              <button onClick={() => pruefe(i)} aria-disabled={diagnose !== null}>
                {p.frage}
              </button>
            )}
          </li>
        ))}
      </ul>

      {offen.length > 0 && (
        <>
          <p className="lw-aufgabe">{item.diagnose.frage}</p>
          <div className="options lw-optionen">
            {diagnosen.map((o) => {
              const zustand = !diagnose ? '' : o.richtig ? ' is-correct' : o === diagnose ? ' is-wrong' : ' is-dim'
              return (
                <button key={o.text} className={`option lw-option${zustand}`} aria-disabled={diagnose !== null} onClick={() => waehleDiagnose(o)}>
                  <span>{o.text}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {diagnose && item.schritt2 && (
        <>
          <p className="lw-aufgabe">{item.schritt2.frage}</p>
          <div className="options lw-optionen">
            {zweite.map((o) => {
              const gewaehlt = schritt.includes(o)
              const zustand = !fertig ? (gewaehlt ? ' is-gewaehlt' : '') : o.richtig ? ' is-correct' : gewaehlt ? ' is-wrong' : ' is-dim'
              return (
                <button key={o.text} className={`option lw-option${zustand}`} aria-disabled={fertig} onClick={() => waehleSchritt(o)}>
                  <span>{o.text}</span>
                </button>
              )
            })}
          </div>
          {mehrfach && !fertig && (
            <button className="btn btn-primary lw-pruefen" disabled={schritt.length === 0} onClick={abschliessen}>
              Fertig
            </button>
          )}
        </>
      )}

      {fertig && (
        <Rueckmeldung
          gut={punkte >= 0.7}
          titel={punkte >= 0.99 ? '✓ Fall gelöst' : punkte >= 0.6 ? '✓ Im Kern richtig' : 'Da fehlte etwas'}
          weiter={() => onFertig({ id: item.id, ziel: item.ziel, stufe: item.stufe, punkte })}
        >
          {!diagnoseOk && <p className="lw-loesung">{item.diagnose.optionen.find((o) => o.richtig)?.text}</p>}
          {!wichtigeGesehen && <p className="lw-warum-falsch">Ungeprüft geblieben: {wichtige.filter((i) => !offen.includes(i)).map((i) => item.pruefungen[i].frage).join(' · ')}</p>}
          <Erklaerung text={diagnosen.find((o) => o.richtig)?.warum ?? item.erklaerung} mehr={item.mehr} />
        </Rueckmeldung>
      )}
    </>
  )
}
