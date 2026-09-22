// Roboter: ein Programm schreiben, nicht einen Weg klicken. Die Befehle kommen in eine
// Liste, „wdh“ wiederholt den nächsten Befehl, „f“ ruft die kleine Funktion auf, und die
// Bedingungen fragen, ob der Weg frei ist. Wer mit wenigen Befehlen auskommt, bekommt mehr.
import { useEffect, useRef, useState } from 'react'
import type { RoboterBefehl, RoboterItem, RundenErgebnis } from '../../typen'
import { Erklaerung, Rueckmeldung, Rundenpunkte, rueckmeldung, useEinmal, type MechanikProps } from '../gemeinsam'

const ZEICHEN: Record<RoboterBefehl, string> = {
  vor: '⬆︎',
  links: '⟲',
  rechts: '⟳',
  f: 'F',
  wdh: '×2',
  wennFrei: 'wenn frei',
  wennWandRechts: 'wenn rechts Wand',
  wennWandLinks: 'wenn links Wand',
}

const NAME: Record<RoboterBefehl, string> = {
  vor: 'vor',
  links: 'links drehen',
  rechts: 'rechts drehen',
  f: 'Funktion F',
  wdh: 'nächsten Befehl doppelt',
  wennFrei: 'nur wenn der Weg frei ist',
  wennWandRechts: 'nur wenn rechts eine Wand ist',
  wennWandLinks: 'nur wenn links eine Wand ist',
}

const RICHTUNG = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const

interface Lage {
  x: number
  y: number
  r: number
  muenzen: string[]
}

export function Roboter({ items, seed, onFertig }: MechanikProps<RoboterItem>) {
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
    <div className="lw-spiel lw-roboter">
      <Rundenpunkte gesamt={items.length} ergebnisse={ergebnisse.map((e) => e.punkte)} aktuell={runde} />
      <RoboterRunde key={item.id + seed} item={item} onFertig={weiter} />
    </div>
  )
}

function RoboterRunde({ item, onFertig }: { item: RoboterItem; onFertig: (e: RundenErgebnis) => void }) {
  const [haupt, setHaupt] = useState<RoboterBefehl[]>([])
  const [funktion, setFunktion] = useState<RoboterBefehl[]>([])
  const [ziel, setZiel] = useState<'haupt' | 'f'>('haupt')
  const [lage, setLage] = useState<Lage>({ x: item.start[0], y: item.start[1], r: item.start[2], muenzen: [] })
  const [laeuft, setLaeuft] = useState(false)
  const [ende, setEnde] = useState<null | { gut: boolean; grund: string }>(null)
  const [versuche, setVersuche] = useState(0)
  const [aufgegeben, setAufgegeben] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const wand = (x: number, y: number) => item.waende.some(([wx, wy]) => wx === x && wy === y)
  const draussen = (x: number, y: number) => x < 0 || y < 0 || x >= item.breite || y >= item.hoehe
  const frei = (l: Lage) => {
    const [dx, dy] = RICHTUNG[l.r]
    return !draussen(l.x + dx, l.y + dy) && !wand(l.x + dx, l.y + dy)
  }
  const wandSeite = (l: Lage, seite: 1 | 3) => {
    const [dx, dy] = RICHTUNG[(l.r + seite) % 4]
    return draussen(l.x + dx, l.y + dy) || wand(l.x + dx, l.y + dy)
  }

  /** Das Programm zu einer flachen Liste auflösen – mit Funktion, Wiederholung und Bedingungen */
  const schritte = (): RoboterBefehl[] => {
    const aus: RoboterBefehl[] = []
    const fuege = (liste: RoboterBefehl[], tiefe: number) => {
      for (let i = 0; i < liste.length; i++) {
        const b = liste[i]
        if (b === 'f') {
          if (tiefe < 3) fuege(funktion, tiefe + 1)
          continue
        }
        if (b === 'wdh') {
          const naechster = liste[i + 1]
          if (naechster && naechster !== 'wdh') {
            fuege([naechster], tiefe)
            fuege([naechster], tiefe)
            i++
          }
          continue
        }
        aus.push(b)
      }
    }
    fuege(haupt, 0)
    return aus
  }

  const start = () => {
    if (laeuft || ende || haupt.length === 0) return
    setLaeuft(true)
    setVersuche((v) => v + 1)
    const folge = schritte()
    let l: Lage = { x: item.start[0], y: item.start[1], r: item.start[2], muenzen: [] }
    setLage(l)
    let i = 0
    let bedingung: RoboterBefehl | null = null
    const tick = () => {
      if (i >= folge.length) {
        setLaeuft(false)
        const geschafft = l.x === item.zielfeld[0] && l.y === item.zielfeld[1] && l.muenzen.length === (item.muenzen?.length ?? 0)
        setEnde({
          gut: geschafft,
          grund: geschafft ? '' : l.muenzen.length < (item.muenzen?.length ?? 0) ? 'Es fehlen noch Münzen.' : 'Der Roboter steht nicht auf dem Ziel.',
        })
        if (geschafft) rueckmeldung.richtig()
        else rueckmeldung.falsch()
        return
      }
      const b = folge[i++]
      if (b === 'wennFrei' || b === 'wennWandRechts' || b === 'wennWandLinks') {
        bedingung = b
        timer.current = window.setTimeout(tick, 120)
        return
      }
      const erlaubt =
        bedingung === null
          ? true
          : bedingung === 'wennFrei'
            ? frei(l)
            : bedingung === 'wennWandRechts'
              ? wandSeite(l, 1)
              : wandSeite(l, 3)
      bedingung = null
      if (erlaubt) {
        if (b === 'links') l = { ...l, r: (l.r + 3) % 4 }
        else if (b === 'rechts') l = { ...l, r: (l.r + 1) % 4 }
        else if (b === 'vor') {
          const [dx, dy] = RICHTUNG[l.r]
          const nx = l.x + dx
          const ny = l.y + dy
          if (draussen(nx, ny) || wand(nx, ny)) {
            setLaeuft(false)
            setEnde({ gut: false, grund: 'Der Roboter ist gegen eine Wand gefahren.' })
            rueckmeldung.falsch()
            return
          }
          l = { ...l, x: nx, y: ny }
          const treffer = (item.muenzen ?? []).find(([mx, my]) => mx === nx && my === ny)
          if (treffer && !l.muenzen.includes(`${treffer[0]},${treffer[1]}`)) l = { ...l, muenzen: [...l.muenzen, `${treffer[0]},${treffer[1]}`] }
        }
        setLage(l)
      }
      timer.current = window.setTimeout(tick, 320)
    }
    timer.current = window.setTimeout(tick, 200)
  }

  const zurueck = () => {
    window.clearTimeout(timer.current)
    setLaeuft(false)
    setEnde(null)
    setLage({ x: item.start[0], y: item.start[1], r: item.start[2], muenzen: [] })
  }

  const lege = (b: RoboterBefehl) => {
    if (laeuft) return
    rueckmeldung.tipp()
    setEnde(null)
    if (ziel === 'f') setFunktion((f) => (f.length < (item.funktion ?? 0) ? [...f, b] : f))
    else setHaupt((h) => (h.length < item.plaetze ? [...h, b] : h))
  }

  const nimm = (wo: 'haupt' | 'f', i: number) => {
    if (laeuft) return
    rueckmeldung.tipp()
    setEnde(null)
    if (wo === 'f') setFunktion((f) => f.filter((_, k) => k !== i))
    else setHaupt((h) => h.filter((_, k) => k !== i))
  }

  const aufgeben = () => {
    if (laeuft) return
    setAufgegeben(true)
    setEnde({ gut: false, grund: 'Aufgegeben – hier ist eine Lösung.' })
    rueckmeldung.falsch()
  }

  // Wer kurz programmiert, bekommt mehr: bis zum Par volle Punkte, jeder Fehlversuch kostet
  const laenge = haupt.length + funktion.length
  const punkte = !ende?.gut ? 0 : Math.max(0.5, 1 - Math.max(0, laenge - item.par) * 0.1 - Math.max(0, versuche - 2) * 0.1)

  return (
    <>
      <p className="lw-aufgabe">{item.titel}</p>

      <div className="lw-gitter" style={{ '--breite': item.breite, '--hoehe': item.hoehe } as React.CSSProperties}>
        {Array.from({ length: item.hoehe }, (_, y) =>
          Array.from({ length: item.breite }, (_, x) => {
            const istWand = wand(x, y)
            const istZiel = item.zielfeld[0] === x && item.zielfeld[1] === y
            const muenze = (item.muenzen ?? []).some(([mx, my]) => mx === x && my === y) && !lage.muenzen.includes(`${x},${y}`)
            const hier = lage.x === x && lage.y === y
            return (
              <div key={`${x},${y}`} className={`lw-feld${istWand ? ' is-wand' : ''}${istZiel ? ' is-ziel' : ''}`}>
                {muenze && <span className="lw-muenze" aria-hidden="true">🪙</span>}
                {hier && (
                  <span className="lw-bot" style={{ transform: `rotate(${lage.r * 90}deg)` }} aria-label="Roboter">
                    🤖
                  </span>
                )}
              </div>
            )
          }),
        )}
      </div>

      <div className="lw-programm">
        <button className={`lw-prog-reiter${ziel === 'haupt' ? ' is-an' : ''}`} onClick={() => setZiel('haupt')} aria-pressed={ziel === 'haupt'}>
          Programm {haupt.length}/{item.plaetze}
        </button>
        {!!item.funktion && (
          <button className={`lw-prog-reiter${ziel === 'f' ? ' is-an' : ''}`} onClick={() => setZiel('f')} aria-pressed={ziel === 'f'}>
            Funktion F {funktion.length}/{item.funktion}
          </button>
        )}
      </div>

      <ol className="lw-befehle" aria-label={ziel === 'f' ? 'Funktion F' : 'Programm'}>
        {(ziel === 'f' ? funktion : haupt).map((b, i) => (
          <li key={i}>
            <button className="lw-befehl is-gesetzt" onClick={() => nimm(ziel, i)} title={NAME[b]}>
              {ZEICHEN[b]}
            </button>
          </li>
        ))}
        {Array.from({ length: Math.max(0, (ziel === 'f' ? (item.funktion ?? 0) : item.plaetze) - (ziel === 'f' ? funktion : haupt).length) }, (_, i) => (
          <li key={`leer${i}`}>
            <span className="lw-befehl is-leer" aria-hidden="true" />
          </li>
        ))}
      </ol>

      <div className="lw-befehlsbrett">
        {item.befehle.map((b) => (
          <button key={b} className="lw-befehl" onClick={() => lege(b)} title={NAME[b]}>
            {ZEICHEN[b]}
          </button>
        ))}
      </div>

      {!ende?.gut && !aufgegeben && (
        <div className="lw-bot-knoepfe">
          <button className="btn btn-primary lw-pruefen" disabled={laeuft || haupt.length === 0} onClick={start}>
            {laeuft ? 'Läuft …' : '▶ Start'}
          </button>
          <button className="btn lw-zuruecksetzen" disabled={laeuft} onClick={zurueck}>
            Zurücksetzen
          </button>
          {versuche >= 3 && (
            <button className="lw-aufgeben" onClick={aufgeben}>
              Lösung zeigen
            </button>
          )}
        </div>
      )}

      {ende && (ende.gut || aufgegeben) && (
        <Rueckmeldung
          gut={ende.gut}
          titel={ende.gut ? (laenge <= item.par ? '✓ Elegant gelöst' : '✓ Geschafft') : 'Hier ist eine Lösung'}
          weiter={() => onFertig({ id: item.id, ziel: item.ziel, stufe: item.stufe, punkte })}
        >
          {ende.gut ? (
            <p className="lw-loesung">
              {laenge} {laenge === 1 ? 'Befehl' : 'Befehle'} · Bestmarke {item.par}
            </p>
          ) : (
            <p className="lw-loesung">
              {item.loesung.haupt.map((s) => (s.n ? `${ZEICHEN[s.b]}×${s.n}` : ZEICHEN[s.b])).join(' ')}
              {item.loesung.f && <small>F: {item.loesung.f.map((s) => (s.n ? `${ZEICHEN[s.b]}×${s.n}` : ZEICHEN[s.b])).join(' ')}</small>}
            </p>
          )}
          <Erklaerung text={item.tipp ?? item.erklaerung} mehr={item.mehr} />
        </Rueckmeldung>
      )}

      {ende && !ende.gut && !aufgegeben && <p className="lw-hinweis">{ende.grund}</p>}
    </>
  )
}
