// Gespräch: ein echtes Hin und Her. Das Gegenüber antwortet auf das, was man sagt, und merkt
// sich, was man bestellt oder erzählt hat. Unpassende Antworten führen nicht zum Abbruch –
// das Gegenüber stutzt, und man versucht es noch einmal.
import { useEffect, useRef, useState } from 'react'
import { sprich, spracheAn } from '../../sprache'
import type { DialogAntwort, DialogItem, DialogSchritt } from '../../typen'
import { Rueckmeldung, rueckmeldung, useEinmal, Vorlesen, type MechanikProps } from '../gemeinsam'

interface Blase {
  wer: 'npc' | 'ich'
  text: string
  de?: string
  laut?: string
  note?: string
  guete?: 0 | 1 | 2
}

/** {getraenk} aus dem Gedächtnis des Gesprächs einsetzen */
const fuelle = (text: string, merk: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (ganz, name) => merk[name] ?? ganz)

export function Dialog({ items, spiel, onFertig }: MechanikProps<DialogItem>) {
  const fertig = useEinmal(onFertig)
  const item = items[0]
  const [blasen, setBlasen] = useState<Blase[]>([])
  const [schrittNr, setSchrittNr] = useState(0)
  const [merk, setMerk] = useState<Record<string, string>>({})
  const [versuche, setVersuche] = useState(0)
  const [punkte, setPunkte] = useState<number[]>([])
  const [ende, setEnde] = useState(false)
  const [tippt, setTippt] = useState(true)
  const [uebersetzt, setUebersetzt] = useState(false)
  const [verbraucht, setVerbraucht] = useState<string[]>([])
  const unten = useRef<HTMLDivElement>(null)

  const schritt: DialogSchritt | undefined = item.schritte[schrittNr]

  // Die Person sagt etwas – erst tippt sie kurz
  useEffect(() => {
    if (!schritt || ende) return
    setTippt(true)
    const t = window.setTimeout(() => {
      setTippt(false)
      const text = fuelle(schritt.npc, merk)
      setBlasen((b) => [...b, { wer: 'npc', text, de: schritt.de ? fuelle(schritt.de, merk) : undefined, laut: schritt.laut }])
      if (spracheAn()) sprich(text, item.sprache)
    }, 650)
    return () => window.clearTimeout(t)
    // merk absichtlich nicht als Abhängigkeit: der Schritt bringt seinen Stand mit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schrittNr, ende])

  useEffect(() => {
    unten.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [blasen, tippt])

  const waehle = (antwort: DialogAntwort) => {
    if (!schritt) return
    const text = fuelle(antwort.text, merk)
    const neueBlasen: Blase[] = [
      { wer: 'ich', text, de: antwort.de ? fuelle(antwort.de, merk) : undefined, laut: antwort.laut, note: antwort.feedback, guete: antwort.guete },
    ]
    if (antwort.guete === 2) rueckmeldung.richtig()
    else if (antwort.guete === 1) rueckmeldung.wahl()
    else rueckmeldung.falsch()

    const merkNeu = antwort.setze ? { ...merk, ...antwort.setze } : merk
    if (antwort.setze) setMerk(merkNeu)
    if (antwort.reaktion) {
      const reaktion = fuelle(antwort.reaktion, merkNeu)
      neueBlasen.push({ wer: 'npc', text: reaktion, de: antwort.reaktionDe ? fuelle(antwort.reaktionDe, merkNeu) : undefined })
      if (spracheAn()) window.setTimeout(() => sprich(reaktion, item.sprache), 500)
    }
    setBlasen((b) => [...b, ...neueBlasen])

    if (antwort.guete === 0) {
      // Noch einmal versuchen – dieselbe Stelle, ohne die missglückte Antwort
      setVerbraucht((v) => [...v, antwort.text])
      setVersuche((n) => n + 1)
      return
    }
    const wert = antwort.guete === 2 ? (versuche === 0 ? 1 : 0.5) : versuche === 0 ? 0.6 : 0.3
    setPunkte((p) => [...p, wert])
    setVersuche(0)
    setVerbraucht([])
    const ziel = antwort.weiter ? item.schritte.findIndex((s) => s.id === antwort.weiter) : schrittNr + 1
    const naechster = ziel >= 0 ? ziel : schrittNr + 1
    if (naechster >= item.schritte.length) {
      if (item.abschluss) {
        setBlasen((b) => [...b, { wer: 'npc', text: fuelle(item.abschluss!, merkNeu), de: item.abschlussDe ? fuelle(item.abschlussDe, merkNeu) : undefined }])
        if (spracheAn()) window.setTimeout(() => sprich(fuelle(item.abschluss!, merkNeu), item.sprache), 900)
      }
      window.setTimeout(() => setEnde(true), 500)
      return
    }
    setSchrittNr(naechster)
  }

  const gesamt = punkte.length > 0 ? punkte.reduce((a, b) => a + b, 0) / punkte.length : 0
  const offen = (schritt?.antworten ?? []).filter((a) => !verbraucht.includes(a.text))
  const hinweise = blasen.filter((b) => b.wer === 'ich' && b.note && b.guete !== 2)

  return (
    <div className="lw-spiel lw-dialog">
      <div className="lw-ort">
        <span aria-hidden="true">{item.ortEmoji}</span>
        <span>
          <strong>{item.ort}</strong>
          <small>🎯 {item.auftrag}</small>
        </span>
        <button
          className={`lw-uebersetzen${uebersetzt ? ' is-an' : ''}`}
          aria-pressed={uebersetzt}
          onClick={() => {
            setUebersetzt((u) => !u)
            rueckmeldung.tipp()
          }}
        >
          🇩🇪
        </button>
      </div>

      <div className="lw-chat">
        {blasen.map((b, i) => (
          <div key={i} className={`lw-chat-zeile is-${b.wer}${b.guete !== undefined && b.guete < 2 ? ' is-holprig' : ''}`}>
            {b.wer === 'npc' && (
              <span className="lw-chat-emoji" aria-hidden="true">
                {item.person.emoji}
              </span>
            )}
            <div className="lw-chat-blase">
              <p>{b.text}</p>
              {b.laut && <small className="lw-laut-hilfe">≈ {b.laut}</small>}
              {uebersetzt && b.de && <small className="lw-uebersetzung">{b.de}</small>}
              {b.wer === 'npc' && <Vorlesen text={b.text} sprache={item.sprache} klein />}
              {b.note && b.guete !== 2 && <small className="lw-chat-note">{b.note}</small>}
            </div>
          </div>
        ))}
        {tippt && !ende && (
          <div className="lw-chat-zeile is-npc">
            <span className="lw-chat-emoji" aria-hidden="true">
              {item.person.emoji}
            </span>
            <div className="lw-chat-blase lw-tippt" aria-label="schreibt">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={unten} />
      </div>

      {!ende && !tippt && schritt && (
        <div className="lw-antworten">
          {offen.map((antwort) => (
            <button key={antwort.text} className="lw-antwort" onClick={() => waehle(antwort)}>
              <span>{fuelle(antwort.text, merk)}</span>
              {uebersetzt && antwort.de && <small>{fuelle(antwort.de, merk)}</small>}
              {antwort.laut && <small className="lw-laut-hilfe">≈ {antwort.laut}</small>}
            </button>
          ))}
        </div>
      )}

      {ende && (
        <Rueckmeldung
          gut={gesamt >= 0.7}
          titel={gesamt >= 0.9 ? '✓ Ziel erreicht – klang natürlich' : gesamt >= 0.6 ? '✓ Ziel erreicht' : 'Geschafft – aber es ging holpriger'}
          knopf="Fertig"
          weiter={() => fertig({ punkte: gesamt, runden: [{ id: item.id, ziel: item.ziel, stufe: item.stufe, punkte: gesamt }] })}
        >
          <p className="lw-ziel-erfuellt">🎯 {item.auftrag}</p>
          {hinweise.length > 0 && (
            <ul className="lw-liste">
              {hinweise.map((h, i) => (
                <li key={i} className={h.guete === 0 ? 'is-falsch' : 'is-halb'}>
                  <span>„{h.text}“</span>
                  <small>{h.note}</small>
                </li>
              ))}
            </ul>
          )}
          {item.erklaerung && <p className="lw-erklaerung">{item.erklaerung}</p>}
          {spiel.mechanik === 'dialog' && <p className="lw-hinweis">Tipp: 🔊 spricht den Satz noch einmal, 🇩🇪 zeigt die Übersetzung.</p>}
        </Rueckmeldung>
      )}
    </div>
  )
}
