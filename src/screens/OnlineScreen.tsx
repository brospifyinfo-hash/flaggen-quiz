// Online-Duell: Lobby mit Code, der Host wählt das Spiel, dann acht Fragen gegeneinander.
import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { IconBack, IconCheck, IconCross } from '../components/Icons'
import { haptic } from '../haptics'
import { KontoFehler } from '../konto'
import { getMode, quizModes } from '../modes/registry'
import {
  alsModeFrage,
  duellFragen,
  lobbyBeginnen,
  lobbyBeitreten,
  lobbyErstellen,
  lobbyHolen,
  lobbyNeuer,
  lobbySenden,
  lobbySitzung,
  lobbySpielWaehlen,
  lobbyVerlassen,
  lobbyVergessen,
  type LobbySitzung,
  type OnlineLobby,
} from '../online'
import { goBack } from '../router'
import { getState } from '../store'
import type { SaveData } from '../types'

const FRAGE_MS = 20_000

function meldung(fehler: unknown) {
  return fehler instanceof KontoFehler ? fehler.message : 'Das hat nicht geklappt. Bitte versuche es noch einmal.'
}

export function OnlineScreen({ data }: { data: SaveData }) {
  const vorschlag = data.konto?.name || data.city?.name || ''
  const [sitzung, setSitzung] = useState<LobbySitzung | null>(() => lobbySitzung())
  const [stand, setStand] = useState<OnlineLobby | null>(null)
  const [name, setName] = useState(vorschlag)
  const [code, setCode] = useState('')
  const [fehler, setFehler] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  const [kopiert, setKopiert] = useState(false)
  const [lokal, setLokal] = useState<string | null>(null)
  const [sicher, setSicher] = useState(false)
  const [uhr, setUhr] = useState(0)
  const empfangen = useRef(performance.now())
  const gemeldet = useRef('')

  const uebernehmen = (lobby: OnlineLobby) => {
    setStand((alt) => {
      if (!lobbyNeuer(alt, lobby)) return alt
      empfangen.current = performance.now()
      return lobby
    })
  }

  useEffect(() => {
    if (!sitzung) return
    let weg = false
    let timer = 0
    const holen = async () => {
      try {
        const lobby = await lobbyHolen(sitzung)
        if (weg) return
        uebernehmen(lobby)
        setFehler('')
        if (lobby.status === 'ende') return
      } catch (grund) {
        if (weg) return
        if (grund instanceof KontoFehler && grund.status === 404) {
          lobbyVergessen()
          setSitzung(null)
          setStand(null)
          setFehler(grund.message)
          return
        }
        setFehler(meldung(grund))
      }
      if (!weg) timer = window.setTimeout(holen, 1000)
    }
    const sichtbar = () => {
      if (document.visibilityState !== 'visible') return
      window.clearTimeout(timer)
      void holen()
    }
    document.addEventListener('visibilitychange', sichtbar)
    void holen()
    return () => {
      weg = true
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', sichtbar)
    }
  }, [sitzung])

  useEffect(() => {
    if (stand?.status !== 'spiel') return
    const timer = window.setInterval(() => setUhr((wert) => wert + 1), 200)
    return () => window.clearInterval(timer)
  }, [stand?.status])

  useEffect(() => {
    setLokal(null)
  }, [stand?.frage?.index])

  useEffect(() => {
    const aktuelle = stand
    const frage = aktuelle?.frage
    if (!aktuelle || !frage?.aufloesung) return
    const marke = `${aktuelle.code}:${frage.index}`
    if (gemeldet.current === marke) return
    gemeldet.current = marke
    haptic(frage.hinzu > 0 ? 'success' : 'error')
  }, [stand])

  const ausstieg = async (heim: boolean) => {
    const aktuell = sitzung
    lobbyVergessen()
    setSitzung(null)
    setStand(null)
    setSicher(false)
    if (aktuell) await lobbyVerlassen(aktuell).catch(() => undefined)
    if (heim) goBack({ name: 'home' })
  }

  const erstellen = async () => {
    if (laeuft) return
    setLaeuft(true)
    setFehler('')
    try {
      const ergebnis = await lobbyErstellen(name.trim())
      setSitzung({ code: ergebnis.code, token: ergebnis.token })
      uebernehmen(ergebnis.lobby)
      haptic('success')
    } catch (grund) {
      haptic('error')
      setFehler(meldung(grund))
    } finally {
      setLaeuft(false)
    }
  }

  const beitreten = async () => {
    if (laeuft) return
    setLaeuft(true)
    setFehler('')
    try {
      const lobby = await lobbyBeitreten(code.replace(/\D/g, ''), name.trim())
      const gemerkt = lobbySitzung()
      if (gemerkt) setSitzung(gemerkt)
      uebernehmen(lobby)
      haptic('success')
    } catch (grund) {
      haptic('error')
      setFehler(meldung(grund))
    } finally {
      setLaeuft(false)
    }
  }

  const waehlen = async (modus: string) => {
    if (!sitzung || !stand?.besitzer || stand.modus?.id === modus) return
    setFehler('')
    try {
      uebernehmen(await lobbySpielWaehlen(sitzung, modus))
      haptic('soft')
    } catch (grund) {
      haptic('error')
      setFehler(meldung(grund))
    }
  }

  const starten = async () => {
    if (!sitzung || !stand?.modus || laeuft) return
    setLaeuft(true)
    setFehler('')
    try {
      uebernehmen(await lobbyBeginnen(sitzung, duellFragen(stand.modus.id, getState())))
      haptic('success')
    } catch (grund) {
      haptic('error')
      setFehler(meldung(grund))
    } finally {
      setLaeuft(false)
    }
  }

  const antworten = async (antwort: string) => {
    const frage = stand?.frage
    if (!sitzung || !frage || frage.aufloesung || frage.picked || lokal) return
    setLokal(antwort)
    try {
      uebernehmen(await lobbySenden(sitzung, frage.index, antwort))
    } catch (grund) {
      setLokal(null)
      haptic('error')
      setFehler(meldung(grund))
    }
  }

  const kopieren = async () => {
    if (!stand) return
    try {
      await navigator.clipboard.writeText(stand.code)
      setKopiert(true)
      haptic('soft')
      window.setTimeout(() => setKopiert(false), 1600)
    } catch {
      setFehler('Der Code steht oben. Bitte schreib ihn ab.')
    }
  }

  useEffect(() => {
    const frage = stand?.frage
    if (!frage || stand.status !== 'spiel') return
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const index = Number(event.key) - 1
      if (frage.input || frage.aufloesung || frage.picked || lokal) return
      if (index >= 0 && index < frage.options.length) antworten(frage.options[index].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const zurueck = () => {
    if (stand?.status === 'spiel') {
      setSicher(true)
      return
    }
    if (sitzung) void ausstieg(true)
    else goBack({ name: 'home' })
  }

  return (
    <main className={`screen online${stand?.status === 'spiel' ? ' is-duell' : ''}`}>
      <header className="topbar">
        <button className="icon-btn" aria-label={stand?.status === 'spiel' ? 'Spiel verlassen' : 'Zurück'} onClick={zurueck}>
          <IconBack />
        </button>
        <h1>Online</h1>
      </header>

      {fehler && (
        <p className="online-fehler" role="alert">
          {fehler}
        </p>
      )}

      {!sitzung && <Tor name={name} code={code} laeuft={laeuft} onName={setName} onCode={setCode} onErstellen={() => void erstellen()} onBeitreten={() => void beitreten()} />}

      {sitzung && !stand && !fehler && <p className="online-hinweis">Verbinde mit der Lobby …</p>}

      {stand?.status === 'warten' && (
        <Wartezimmer stand={stand} kopiert={kopiert} laeuft={laeuft} onKopieren={() => void kopieren()} onWaehlen={(id) => void waehlen(id)} onStart={() => void starten()} />
      )}

      {stand?.status === 'spiel' && stand.frage && (
        <Duell
          stand={stand}
          lokal={lokal}
          rest={
            stand.frage.aufloesung || uhr < 0
              ? 0
              : Math.max(0, stand.frage.restMs - (performance.now() - empfangen.current))
          }
          onAntwort={(antwort) => void antworten(antwort)}
        />
      )}

      {stand?.status === 'ende' && <Ergebnis stand={stand} onNeu={() => void ausstieg(false)} onHeim={() => void ausstieg(true)} />}

      {sicher && (
        <ConfirmDialog
          title="Spiel verlassen?"
          text="Das Duell endet dann für euch beide."
          confirmLabel="Verlassen"
          danger
          onConfirm={() => void ausstieg(true)}
          onCancel={() => setSicher(false)}
        />
      )}
    </main>
  )
}

function Tor({
  name,
  code,
  laeuft,
  onName,
  onCode,
  onErstellen,
  onBeitreten,
}: {
  name: string
  code: string
  laeuft: boolean
  onName: (wert: string) => void
  onCode: (wert: string) => void
  onErstellen: () => void
  onBeitreten: () => void
}) {
  const nameOk = name.trim().length > 0
  const codeOk = /^\d{4}$/.test(code.replace(/\D/g, '')) && !code.replace(/\D/g, '').startsWith('0')
  return (
    <>
      <p className="online-lead">Erstell eine Lobby oder tritt mit dem Code einer anderen Person bei. Danach spielt ihr acht Fragen gegeneinander.</p>
      <label className="city-label" htmlFor="online-name">
        Dein Name
      </label>
      <input
        id="online-name"
        className="city-input"
        value={name}
        maxLength={24}
        autoComplete="nickname"
        placeholder="So sieht dich der Gegner"
        onChange={(event) => onName(event.target.value)}
      />
      <button className="btn btn-primary online-knapp" disabled={!nameOk || laeuft} onClick={onErstellen}>
        Lobby erstellen
      </button>

      <div className="online-oder" aria-hidden="true">
        <span>oder</span>
      </div>

      <label className="city-label" htmlFor="online-code">
        Beitrittscode
      </label>
      <input
        id="online-code"
        className="city-input online-codefeld"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={4}
        placeholder="1234"
        value={code}
        onChange={(event) => onCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
      />
      <button className="btn btn-secondary" disabled={!nameOk || !codeOk || laeuft} onClick={onBeitreten}>
        Lobby beitreten
      </button>
    </>
  )
}

function Wartezimmer({
  stand,
  kopiert,
  laeuft,
  onKopieren,
  onWaehlen,
  onStart,
}: {
  stand: OnlineLobby
  kopiert: boolean
  laeuft: boolean
  onKopieren: () => void
  onWaehlen: (id: string) => void
  onStart: () => void
}) {
  const voll = stand.spieler.length >= 2
  const grund = !voll ? 'Warte, bis jemand den Code eingibt.' : !stand.modus ? 'Wähle ein Spiel.' : laeuft ? 'Fragen werden gemischt …' : ''
  return (
    <>
      <p className="online-lead">{stand.besitzer ? 'Gib den Code weiter. Du wählst das Spiel und startest.' : 'Du bist drin. Der Host wählt das Spiel und startet.'}</p>
      <p className="online-code" aria-label={`Code ${stand.code.split('').join(' ')}`}>
        {stand.code.split('').join(' ')}
      </p>
      <button className="btn btn-ghost" onClick={onKopieren}>
        {kopiert ? 'Code kopiert' : 'Code kopieren'}
      </button>
      <ul className="online-leute">
        {stand.spieler.map((spieler) => (
          <li key={spieler.ich ? 'ich' : spieler.name} className={spieler.ich ? 'is-ich' : ''}>
            <strong>{spieler.name}</strong>
            <small>
              {spieler.ich ? 'Du' : 'Gegner'}
              {spieler.besitzer ? ' · Host' : ''}
            </small>
          </li>
        ))}
        {!voll && <li className="is-leer">Zweite Person fehlt noch</li>}
      </ul>
      <h2 className="online-titel">Spiel</h2>
      <ul className="online-modi">
        {quizModes().map((modus) => {
          const an = stand.modus?.id === modus.id
          return (
            <li key={modus.id}>
              <button
                type="button"
                className={an ? 'is-on' : ''}
                aria-pressed={an}
                aria-disabled={!stand.besitzer}
                onClick={() => stand.besitzer && onWaehlen(modus.id)}
              >
                <span aria-hidden="true">{modus.emoji}</span>
                <strong>{modus.name}</strong>
                <small>{modus.tagline}</small>
              </button>
            </li>
          )
        })}
      </ul>
      {stand.besitzer ? (
        <button className="btn btn-primary" disabled={!voll || !stand.modus || laeuft} onClick={onStart}>
          {laeuft ? 'Startet …' : 'Duell starten'}
        </button>
      ) : (
        <p className="online-hinweis">{stand.modus ? `${stand.modus.emoji} ${stand.modus.name} · der Host startet gleich.` : 'Der Host sucht noch ein Spiel aus.'}</p>
      )}
      {stand.besitzer && grund && <p className="online-hinweis">{grund}</p>}
    </>
  )
}

function Duell({
  stand,
  lokal,
  rest,
  onAntwort,
}: {
  stand: OnlineLobby
  lokal: string | null
  rest: number
  onAntwort: (antwort: string) => void
}) {
  const frage = stand.frage!
  const mode = getMode(frage.modeId)
  const model = alsModeFrage(frage)
  const gewaehlt = frage.aufloesung ? (frage.picked ?? '') : (frage.picked ?? lokal)
  const gegner = stand.spieler.find((spieler) => !spieler.ich)

  return (
    <>
      <div className="online-stand" aria-label="Punktestand">
        {stand.spieler.map((spieler) => (
          <div key={spieler.ich ? 'ich' : 'gegner'} className={spieler.ich ? 'is-ich' : ''}>
            <small>
              {spieler.name}
              {spieler.besitzer ? ' · Host' : ''}
            </small>
            <strong>{spieler.punkte}</strong>
            <em>{frage.aufloesung ? (spieler.hinzu > 0 ? `+${spieler.hinzu}` : spieler.hinweis || '–') : spieler.dran ? 'fertig' : '…'}</em>
          </div>
        ))}
      </div>
      <div className="quiz-meta">
        <span className="chip">
          {stand.modus?.emoji} {stand.modus?.name}
        </span>
        <span className="chip">
          Frage {frage.index + 1} von {frage.gesamt}
        </span>
      </div>
      {!frage.aufloesung && (
        <div className="online-zeit" aria-hidden="true">
          <span style={{ width: `${(rest / FRAGE_MS) * 100}%` }} />
        </div>
      )}
      <p className="online-sekunden">{frage.aufloesung ? 'Auflösung' : `${Math.ceil(rest / 1000)} Sekunden`}</p>

      {mode?.renderQuestion(model, gewaehlt === null ? null : gewaehlt)}
      <p className="question">{frage.prompt}</p>

      {frage.input && gewaehlt === null ? (
        mode?.renderInput?.(model, null, onAntwort)
      ) : (
        frage.options.length > 0 && (
          <div className="options" key={frage.key}>
            {frage.options.map((option) => {
              const istLoesung = frage.aufloesung && option.id === frage.correctId
              const istMeine = option.id === gewaehlt
              const klasse = !frage.aufloesung
                ? istMeine
                  ? ' is-mine'
                  : ''
                : istLoesung
                  ? ' is-correct'
                  : istMeine
                    ? ' is-wrong'
                    : ' is-dim'
              return (
                <button
                  key={option.id}
                  className={`option${klasse}`}
                  aria-disabled={gewaehlt !== null}
                  onClick={() => onAntwort(option.id)}
                >
                  <span>{option.label}</span>
                  {frage.aufloesung && istLoesung && <IconCheck className="option-mark" />}
                  {frage.aufloesung && istMeine && !istLoesung && <IconCross className="option-mark" />}
                </button>
              )
            })}
          </div>
        )
      )}

      {gewaehlt !== null && !frage.aufloesung && (
        <p className="online-hinweis" role="status">
          {gegner?.dran ? `${gegner.name} ist auch fertig.` : `Antwort ist raus. Warte auf ${gegner?.name ?? 'den Gegner'} …`}
        </p>
      )}

      {frage.aufloesung && (
        <div className={`sheet ${frage.hinzu > 0 ? 'sheet-good' : 'sheet-bad'}`} role="status">
          <p className="sheet-title">
            {frage.hinzu > 0 ? <IconCheck /> : <IconCross />}
            {frage.hinweis || 'Zeit abgelaufen'}
            {frage.hinzu > 0 && <span className="sheet-xp">+{frage.hinzu}</span>}
          </p>
          {!frage.hinzu && !frage.input && frage.options.length > 0 && (
            <p className="sheet-text">
              Richtig: <strong>{frage.options.find((option) => option.id === frage.correctId)?.label}</strong>
            </p>
          )}
          {frage.picked && mode?.renderFeedback?.(model, frage.picked)}
          <ul className="online-zwischen">
            {stand.spieler.map((spieler) => (
              <li key={spieler.ich ? 'ich' : 'gegner'}>
                <span>{spieler.name}</span>
                <b>
                  {spieler.hinweis || '–'}
                  {spieler.hinzu > 0 ? ` · +${spieler.hinzu}` : ''}
                </b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

function Ergebnis({ stand, onNeu, onHeim }: { stand: OnlineLobby; onNeu: () => void; onHeim: () => void }) {
  const ich = stand.spieler.find((spieler) => spieler.ich)
  const gegner = stand.spieler.find((spieler) => !spieler.ich)
  const titel =
    stand.sieger === 'ich' ? 'Du gewinnst' : stand.sieger === 'gegner' ? `${gegner?.name ?? 'Der Gegner'} gewinnt` : 'Unentschieden'
  return (
    <>
      {stand.abbruch && <p className="online-hinweis">{stand.abbruch}</p>}
      <h2 className={`online-sieg${stand.sieger === 'ich' ? ' is-sieg' : ''}`}>{titel}</h2>
      <ul className="online-leute online-ergebnis">
        {stand.spieler.map((spieler) => (
          <li key={spieler.ich ? 'ich' : spieler.name} className={spieler.ich ? 'is-ich' : ''}>
            <strong>{spieler.name}</strong>
            <b>{spieler.punkte}</b>
            <small>
              {spieler.richtig} von {stand.frage?.gesamt ?? 8} richtig
            </small>
          </li>
        ))}
      </ul>
      <button className="btn btn-primary" onClick={onNeu}>
        Neue Lobby
      </button>
      <button className="btn btn-ghost" onClick={onHeim}>
        Zur Startseite
      </button>
      {!ich && !gegner && <p className="online-hinweis">Die Lobby ist leer.</p>}
    </>
  )
}
