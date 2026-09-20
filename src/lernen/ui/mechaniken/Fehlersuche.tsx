// Fehlersuche: Sprachdetektiv, Lektorat und Code-Debugger. Man tippt die fehlerhafte Stelle an
// und wählt dann die richtige Fassung. Mit einer Fehlerstelle ist es ein schneller Fall, mit
// mehreren ein ganzer Text, der vor dem Versand geprüft wird.
import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { FehlerItem, FehlerStelle, RundenErgebnis } from '../../typen'
import { ableiten, mische, zufall } from '../../zufall'
import { Erklaerung, Rueckmeldung, Rundenpunkte, rueckmeldung, useEinmal, type MechanikProps } from '../gemeinsam'

interface Token {
  text: string
  stelle: number | null
  klick: boolean
}

const WORT = /[\p{L}\p{N}][\p{L}\p{N}'’\-/]*|\s+|./gsu
const CODE = /[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|"[^"\n]*"|'[^'\n]*'|\s+|./gs

const zerlege = (text: string, code: boolean): string[] => text.match(code ? CODE : WORT) ?? []
const leer = (text: string) => /^\s+$/.test(text)

function zerlegeItem(item: FehlerItem): { tokens: Token[]; stellen: FehlerStelle[] } {
  const stellen: FehlerStelle[] = []
  const tokens: Token[] = []
  for (const teil of item.teile) {
    if (typeof teil === 'string') {
      for (const t of zerlege(teil, !!item.code)) {
        tokens.push({ text: t, stelle: null, klick: !leer(t) && (!!item.code || /[\p{L}\p{N}]/u.test(t)) })
      }
    } else {
      const nr = stellen.length
      stellen.push(teil)
      for (const t of zerlege(teil.zeige, !!item.code)) tokens.push({ text: t, stelle: nr, klick: !leer(t) })
    }
  }
  return { tokens, stellen }
}

type StellenStand = 'richtig' | 'falsch' | 'aufgedeckt'

export function Fehlersuche({ items, spiel, stufe, seed, onFertig }: MechanikProps<FehlerItem>) {
  const fertig = useEinmal(onFertig)
  const [runde, setRunde] = useState(0)
  const [ergebnisse, setErgebnisse] = useState<RundenErgebnis[]>([])
  const item = items[runde]
  // Steckt ein fehlerfreier Satz in der Runde, braucht jede Runde den Knopf „Kein Fehler“ –
  // sonst verriete er, welcher Satz stimmt
  const mitFehlerfrei = items.some((it) => it.teile.every((t) => typeof t === 'string'))

  const weiter = (ergebnis: RundenErgebnis) => {
    const alle = [...ergebnisse, ergebnis]
    setErgebnisse(alle)
    if (runde + 1 < items.length) setRunde(runde + 1)
    else fertig({ punkte: alle.reduce((s, e) => s + e.punkte, 0) / alle.length, runden: alle })
  }

  return (
    <div className="lw-spiel lw-fehler">
      <Rundenpunkte gesamt={items.length} ergebnisse={ergebnisse.map((e) => e.punkte)} aktuell={runde} />
      <FehlerRunde
        key={item.id}
        item={item}
        seed={ableiten(seed, runde)}
        keinFehlerKnopf={spiel.runden > 1 && (stufe >= 3 || mitFehlerfrei)}
        onFertig={weiter}
      />
    </div>
  )
}

function FehlerRunde({
  item,
  seed,
  keinFehlerKnopf,
  onFertig,
}: {
  item: FehlerItem
  seed: number
  keinFehlerKnopf: boolean
  onFertig: (e: RundenErgebnis) => void
}) {
  const { tokens, stellen } = useMemo(() => zerlegeItem(item), [item])
  const mehrere = stellen.length > 1
  const [stand, setStand] = useState<Record<number, StellenStand>>({})
  const [aktiv, setAktiv] = useState<number | null>(null)
  const [fehlklicks, setFehlklicks] = useState(0)
  const [findePunkte, setFindePunkte] = useState(0)
  const [wackel, setWackel] = useState<number | null>(null)
  const [fertig, setFertig] = useState(false)
  const [keinFehlerRichtig, setKeinFehlerRichtig] = useState<boolean | null>(null)
  const [gewaehlt, setGewaehlt] = useState<string | null>(null)

  const optionen = useMemo(
    () => stellen.map((s, i) => mische(zufall(ableiten(seed, i + 1)), [s.richtig, ...s.falsch])),
    [stellen, seed],
  )

  const offen = stellen.map((_, i) => i).filter((i) => stand[i] === undefined)

  const tippe = (index: number) => {
    if (fertig || aktiv !== null) return
    const token = tokens[index]
    if (!token.klick) return
    if (token.stelle !== null && stand[token.stelle] === undefined) {
      rueckmeldung.wahl()
      if (!mehrere) setFindePunkte(fehlklicks === 0 ? 0.4 : 0.25)
      setAktiv(token.stelle)
      setGewaehlt(null)
      return
    }
    if (token.stelle !== null) return
    rueckmeldung.falsch()
    setWackel(index)
    window.setTimeout(() => setWackel((w) => (w === index ? null : w)), 450)
    const neu = fehlklicks + 1
    setFehlklicks(neu)
    // Beim einzelnen Fehler: nach zwei Fehlgriffen zeigen wir die Stelle
    if (!mehrere && neu >= 2 && stellen.length > 0) {
      setFindePunkte(0)
      setAktiv(0)
    }
    // Ein fehlerfreier Satz: nach zwei Fehlgriffen lösen wir auf
    if (stellen.length === 0 && neu >= 2) {
      setKeinFehlerRichtig(false)
      setFertig(true)
    }
  }

  const waehle = (text: string) => {
    if (aktiv === null) return
    const stelle = stellen[aktiv]
    const richtig = text === stelle.richtig
    if (richtig) rueckmeldung.richtig()
    else rueckmeldung.falsch()
    setGewaehlt(text)
    const neuerStand = { ...stand, [aktiv]: richtig ? ('richtig' as const) : ('falsch' as const) }
    setStand(neuerStand)
    if (!mehrere) {
      setFertig(true)
      return
    }
    // Im Lektorat geht es nach einer kurzen Pause mit dem Text weiter
    window.setTimeout(() => {
      setAktiv(null)
      setGewaehlt(null)
      if (stellen.every((_, i) => neuerStand[i] !== undefined)) setFertig(true)
    }, 900)
  }

  const keinFehler = () => {
    if (fertig || aktiv !== null) return
    if (stellen.length === 0) {
      rueckmeldung.richtig()
      setKeinFehlerRichtig(true)
      setFertig(true)
    } else {
      rueckmeldung.falsch()
      setKeinFehlerRichtig(false)
      setFindePunkte(0)
      setAktiv(0)
    }
  }

  const freigeben = () => {
    const alles = { ...stand }
    for (const i of offen) alles[i] = 'aufgedeckt'
    setStand(alles)
    setAktiv(null)
    setFertig(true)
    rueckmeldung.wahl()
  }

  // ---------- Wertung ----------
  const punkte = (() => {
    if (stellen.length === 0) return keinFehlerRichtig ? 1 : 0
    if (!mehrere) return findePunkte + (stand[0] === 'richtig' ? 0.6 : 0)
    const summe = stellen.reduce((s, _, i) => s + (stand[i] === 'richtig' ? 1 : stand[i] === 'falsch' ? 0.5 : 0), 0)
    return Math.max(0, summe / stellen.length - 0.08 * fehlklicks)
  })()

  // ---------- Darstellung ----------
  const tastatur = (event: KeyboardEvent, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      tippe(index)
    }
  }

  const zeigeToken = (token: Token, index: number) => {
    const s = token.stelle
    const zustand = s !== null ? stand[s] : undefined
    const klasse = [
      'lw-wort',
      token.klick ? 'is-klick' : '',
      wackel === index ? 'is-wackel' : '',
      s !== null && aktiv === s ? 'is-aktiv' : '',
      s !== null && zustand ? `is-${zustand}` : '',
    ]
      .filter(Boolean)
      .join(' ')
    if (!token.klick) return <span key={index} className={klasse}>{token.text}</span>
    return (
      <span
        key={index}
        className={klasse}
        role="button"
        tabIndex={fertig ? -1 : 0}
        onClick={() => tippe(index)}
        onKeyDown={(e) => tastatur(e, index)}
      >
        {token.text}
      </span>
    )
  }

  /** Aufeinanderfolgende Tokens einer Fehlerstelle als Gruppe – nach dem Verbessern mit neuem Text */
  const inhalt = () => {
    const teile: ReactNode[] = []
    let i = 0
    while (i < tokens.length) {
      const s = tokens[i].stelle
      if (s === null || stand[s] === undefined) {
        teile.push(zeigeToken(tokens[i], i))
        i++
        continue
      }
      let j = i
      while (j < tokens.length && tokens[j].stelle === s) j++
      const stelle = stellen[s]
      const zustand = stand[s]
      teile.push(
        <span key={`s${i}`} className={`lw-stelle is-${zustand}`}>
          {zustand !== 'richtig' && <del>{stelle.zeige}</del>}
          <ins>{stelle.richtig}</ins>
        </span>,
      )
      i = j
    }
    return teile
  }

  const zeilen = () => {
    // Code: nach Zeilen aufteilen, damit Zeilennummern daneben stehen
    const alle = inhalt()
    return <pre className="lw-code-text">{alle}</pre>
  }

  const skin = item.code ? 'is-code' : item.kopf ? 'is-mail' : 'is-papier'
  const aktivStelle = aktiv !== null ? stellen[aktiv] : null
  const gefunden = stellen.filter((_, i) => stand[i] !== undefined).length

  return (
    <>
      {item.kontext && <p className="lw-etikett">{item.kontext}</p>}
      <div className={`lw-blatt ${skin}`}>
        {item.kopf && (
          <dl className="lw-kopfzeilen">
            {item.kopf.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {item.titel && <p className="lw-blatt-titel">{item.titel}</p>}
        {item.code ? zeilen() : <p className="lw-text">{inhalt()}</p>}
      </div>

      {mehrere && !fertig && (
        <div className="lw-leiste">
          <span>
            🔎 {gefunden} von {stellen.length} Fehlern{fehlklicks > 0 ? ` · ${fehlklicks} Fehlalarm${fehlklicks > 1 ? 'e' : ''}` : ''}
          </span>
          {aktiv === null && (
            <button className="btn btn-secondary lw-klein" onClick={freigeben}>
              Text freigeben
            </button>
          )}
        </div>
      )}

      {!mehrere && !fertig && aktiv === null && (
        <p className="lw-hinweis">
          {fehlklicks === 0 ? 'Wo steckt der Fehler?' : 'Nicht ganz – schau noch einmal genau hin.'}
        </p>
      )}

      {keinFehlerKnopf && !mehrere && !fertig && aktiv === null && (
        <button className="btn btn-secondary lw-kein-fehler" onClick={keinFehler}>
          ✓ Kein Fehler
        </button>
      )}

      {aktivStelle && !fertig && (
        <div className="lw-verbessern" role="group" aria-label="Richtige Fassung wählen">
          <p className="lw-verbessern-frage">
            {findePunkte === 0 && !mehrere ? 'Hier steckt der Fehler. ' : ''}Was ist richtig?
          </p>
          <div className="lw-optionen">
            {optionen[aktiv!].map((text) => {
              const ist = gewaehlt === text
              const zustand = gewaehlt === null ? '' : text === aktivStelle.richtig ? ' is-correct' : ist ? ' is-wrong' : ' is-dim'
              return (
                <button key={text} className={`option lw-option${zustand}`} aria-disabled={gewaehlt !== null} onClick={() => gewaehlt === null && waehle(text)}>
                  <span>{text}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {fertig && (
        <Rueckmeldung
          gut={punkte >= 0.7}
          titel={
            stellen.length === 0
              ? keinFehlerRichtig
                ? '✓ Richtig – der Satz ist fehlerfrei'
                : 'Der Satz war fehlerfrei'
              : mehrere
                ? `${stellen.filter((_, i) => stand[i] === 'richtig').length} von ${stellen.length} verbessert`
                : stand[0] === 'richtig'
                  ? findePunkte >= 0.4
                    ? '✓ Gefunden und verbessert'
                    : '✓ Verbessert'
                  : 'Richtig wäre:'
          }
          weiter={() => onFertig({ id: item.id, ziel: item.ziel, stufe: item.stufe, punkte: Math.max(0, Math.min(1, punkte)) })}
        >
          {!mehrere && stellen[0] && stand[0] !== 'richtig' && <p className="lw-loesung">{stellen[0].richtig}</p>}
          {mehrere ? (
            <ul className="lw-liste">
              {stellen.map((s, i) => (
                <li key={i} className={`is-${stand[i]}`}>
                  <span>
                    <del>{s.zeige}</del> → <strong>{s.richtig}</strong>
                  </span>
                  {s.warum && <small>{s.warum}</small>}
                </li>
              ))}
            </ul>
          ) : (
            <Erklaerung text={stellen[0]?.warum ?? item.erklaerung} mehr={item.mehr} />
          )}
          {mehrere && <Erklaerung text={item.erklaerung} mehr={item.mehr} />}
        </Rueckmeldung>
      )}
    </>
  )
}
