// Auswahl: Wort im Kontext, Stil-Upgrade, Umformung, natürliche Antworten, Produktberatung.
// Die Frage steht nie nackt da – je nach Inhalt als Lückensatz, als Ausgangssatz mit Ziel,
// als Sprechblase oder als Steckbrief. Falsche Antworten erklären, warum sie nicht passen.
import { useMemo, useState } from 'react'
import type { RundenErgebnis, WahlItem, WahlOption } from '../../typen'
import { ableiten, mische, zufall } from '../../zufall'
import { Erklaerung, Rueckmeldung, Rundenpunkte, rueckmeldung, useEinmal, Vorlesen, type MechanikProps } from '../gemeinsam'

export function Auswahl({ items, seed, onFertig }: MechanikProps<WahlItem>) {
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
    <div className="lw-spiel lw-wahl">
      <Rundenpunkte gesamt={items.length} ergebnisse={ergebnisse.map((e) => e.punkte)} aktuell={runde} />
      <WahlRunde key={item.id} item={item} seed={ableiten(seed, runde)} onFertig={weiter} />
    </div>
  )
}

const wertVon = (o: WahlOption | undefined) => (!o ? 0 : o.richtig ? 1 : Math.max(0, Math.min(1, o.teil ?? 0)))

/** Satz mit Lücke: nach der Antwort steht das gewählte Wort darin */
function Lueckensatz({ satz, einsatz, gut }: { satz: string; einsatz: string | null; gut: boolean | null }) {
  const teile = satz.split('___')
  return (
    <p className="lw-luecken">
      {teile.map((teil, i) => (
        <span key={i}>
          {teil}
          {i < teile.length - 1 && (
            <span className={`lw-luecke${einsatz ? (gut ? ' is-gut' : ' is-schlecht') : ''}`}>{einsatz ?? '   '}</span>
          )}
        </span>
      ))}
    </p>
  )
}

function WahlRunde({ item, seed, onFertig }: { item: WahlItem; seed: number; onFertig: (e: RundenErgebnis) => void }) {
  const optionen = useMemo(() => mische(zufall(seed), item.optionen), [item, seed])
  const gruende = useMemo(() => (item.begruendung ? mische(zufall(ableiten(seed, 7)), item.begruendung.optionen) : []), [item, seed])
  const [gewaehlt, setGewaehlt] = useState<WahlOption | null>(null)
  const [grund, setGrund] = useState<WahlOption | null>(null)
  const richtige = item.optionen.find((o) => o.richtig)

  const waehle = (o: WahlOption) => {
    if (gewaehlt) return
    setGewaehlt(o)
    if (o.richtig) rueckmeldung.richtig()
    else if ((o.teil ?? 0) > 0) rueckmeldung.wahl()
    else rueckmeldung.falsch()
  }

  const begruende = (o: WahlOption) => {
    if (grund) return
    setGrund(o)
    if (o.richtig) rueckmeldung.richtig()
    else rueckmeldung.falsch()
  }

  const brauchtGrund = !!item.begruendung
  const fertig = gewaehlt && (!brauchtGrund || grund)
  const punkte = !gewaehlt ? 0 : brauchtGrund ? wertVon(gewaehlt) * 0.6 + wertVon(grund ?? undefined) * 0.4 : wertVon(gewaehlt)
  const imSatz = gewaehlt ? (item.satz ? gewaehlt.text : null) : null

  const knoepfe = (liste: WahlOption[], wahl: WahlOption | null, tippen: (o: WahlOption) => void) => (
    <div className="options lw-optionen">
      {liste.map((o) => {
        const zustand = !wahl ? '' : o.richtig ? ' is-correct' : o === wahl ? ((o.teil ?? 0) > 0 ? ' is-teil' : ' is-wrong') : ' is-dim'
        return (
          <button key={o.text} className={`option lw-option${zustand}`} aria-disabled={wahl !== null} onClick={() => tippen(o)}>
            <span>
              {o.text}
              {o.laut && wahl && <small className="lw-laut-hilfe">≈ {o.laut}</small>}
            </span>
          </button>
        )
      })}
    </div>
  )

  return (
    <>
      {item.kontext && <p className="lw-etikett">{item.kontext}</p>}
      {item.aufgabe && <p className="lw-aufgabe">{item.aufgabe}</p>}

      {item.karte && (
        <div className="lw-karte">
          <p className="lw-karte-titel">
            {item.karte.emoji && <span aria-hidden="true">{item.karte.emoji}</span>} {item.karte.titel}
          </p>
          <dl>
            {item.karte.zeilen.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {item.sprecher && (
        <div className="lw-sprecher">
          <span className="lw-sprecher-emoji" aria-hidden="true">
            {item.sprecher.emoji}
          </span>
          <div className="lw-blase">
            <small>{item.sprecher.name}</small>
            <p>{item.sprecher.text}</p>
            {item.sprecher.laut && <small className="lw-laut-hilfe">≈ {item.sprecher.laut}</small>}
            {item.sprecher.de && gewaehlt && <small className="lw-uebersetzung">{item.sprecher.de}</small>}
            <Vorlesen text={item.sprecher.text} sprache={item.sprache} klein />
          </div>
        </div>
      )}

      {item.quelle && (
        <div className="lw-quelle">
          <p>{item.quelle}</p>
          {item.richtung && <span className="lw-richtung">→ {item.richtung}</span>}
        </div>
      )}

      {item.satz && <Lueckensatz satz={item.satz} einsatz={imSatz} gut={gewaehlt ? wertVon(gewaehlt) >= 0.7 : null} />}

      {knoepfe(optionen, gewaehlt, waehle)}

      {gewaehlt && brauchtGrund && (
        <div className="lw-begruendung">
          <p className="lw-verbessern-frage">{item.begruendung!.frage}</p>
          {knoepfe(gruende, grund, begruende)}
        </div>
      )}

      {fertig && (
        <Rueckmeldung
          gut={punkte >= 0.7}
          titel={gewaehlt.richtig ? (brauchtGrund && !grund?.richtig ? '✓ Richtig gewählt – die Begründung sitzt noch nicht' : '✓ Genau') : (gewaehlt.teil ?? 0) > 0 ? 'Geht – aber es gibt Besseres' : 'Nicht ganz'}
          weiter={() => onFertig({ id: item.id, ziel: item.ziel, stufe: item.stufe, punkte })}
        >
          {!gewaehlt.richtig && richtige && (
            <p className="lw-loesung">
              {richtige.text}
              {richtige.laut && <small className="lw-laut-hilfe">≈ {richtige.laut}</small>}
            </p>
          )}
          {gewaehlt.warum && !gewaehlt.richtig && <p className="lw-warum-falsch">{gewaehlt.warum}</p>}
          <Erklaerung text={richtige?.warum ?? item.erklaerung} mehr={item.mehr ?? (richtige?.warum ? item.erklaerung : undefined)} />
        </Rueckmeldung>
      )}
    </>
  )
}
