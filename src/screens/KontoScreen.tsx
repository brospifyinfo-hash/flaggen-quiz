// Das Konto: Ohne Anmeldung geht es nicht weiter – Fortschritt und Stadt liegen im Konto.
// Dieselbe Seite verwaltet das Konto, wenn man angemeldet ist (Sichern, Passwort, Abmelden).
import { useState, type FormEvent } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { IconBack, IconCheck, IconUser } from '../components/Icons'
import { haptic } from '../haptics'
import {
  abmelden,
  anmelden,
  jetztSichern,
  KontoFehler,
  ohneKontoWeiter,
  passwortAendern,
  registrieren,
  useSyncZustand,
} from '../konto'
import { goBack } from '../router'
import type { SaveData } from '../types'

const zeit = (t: number) =>
  t > 0 ? new Date(t).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '–'

const SYNC_TEXT = {
  ruhig: 'Alles gesichert',
  wartet: 'Änderungen werden gleich gesichert',
  sendet: 'Wird gesichert …',
  fehler: 'Sichern fehlgeschlagen',
  aus: 'Nicht angemeldet',
} as const

/** Anmelden oder Konto erstellen – als Pflichtschritt vor dem Spiel */
export function KontoTor({ data }: { data: SaveData }) {
  const [art, setArt] = useState<'neu' | 'anmelden'>('neu')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [passwort, setPasswort] = useState('')
  const [fehler, setFehler] = useState<KontoFehler | null>(null)
  const [laeuft, setLaeuft] = useState(false)
  const hatStand = data.xp > 0 || !!data.city

  const absenden = async (event: FormEvent) => {
    event.preventDefault()
    if (laeuft) return
    setFehler(null)
    setLaeuft(true)
    try {
      if (art === 'neu') await registrieren(email, passwort, name)
      else await anmelden(email, passwort)
      haptic('success')
    } catch (f) {
      haptic('error')
      setFehler(f instanceof KontoFehler ? f : new KontoFehler('Das hat nicht geklappt. Bitte versuche es noch einmal.', 0))
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <main className="screen konto">
      <div className="konto-kopf">
        <span className="konto-zeichen" aria-hidden="true">
          <IconUser />
        </span>
        <h1>{art === 'neu' ? 'Dein Konto' : 'Willkommen zurück'}</h1>
        <p>
          {art === 'neu'
            ? hatStand
              ? 'Dein Fortschritt und deine Stadt bleiben – sie werden ab jetzt in deinem Konto gesichert und auf jedem Gerät weitergeführt.'
              : 'Mit einem Konto sind Fortschritt und Stadt gesichert und auf jedem Gerät dabei.'
            : hatStand
              ? 'Was auf diesem Gerät liegt, wird mit deinem Konto zusammengeführt.'
              : 'Melde dich an, dann geht es genau da weiter, wo du aufgehört hast.'}
        </p>
      </div>

      <div className="konto-reiter" role="tablist">
        <button role="tab" aria-selected={art === 'neu'} className={art === 'neu' ? 'is-on' : ''} onClick={() => setArt('neu')}>
          Konto erstellen
        </button>
        <button
          role="tab"
          aria-selected={art === 'anmelden'}
          className={art === 'anmelden' ? 'is-on' : ''}
          onClick={() => setArt('anmelden')}
        >
          Anmelden
        </button>
      </div>

      <form className="list konto-form" onSubmit={(event) => void absenden(event)}>
        {art === 'neu' && (
          <div className="row row-stack">
            <label className="city-label" htmlFor="konto-name">
              Dein Name
            </label>
            <input
              id="konto-name"
              className="city-input"
              value={name}
              maxLength={30}
              autoComplete="nickname"
              placeholder="So heißt du im Spiel"
              required
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        )}
        <div className="row row-stack">
          <label className="city-label" htmlFor="konto-email">
            E-Mail-Adresse
          </label>
          <input
            id="konto-email"
            className="city-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            value={email}
            placeholder="du@beispiel.de"
            required
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="row row-stack">
          <label className="city-label" htmlFor="konto-passwort">
            Passwort {art === 'neu' && <span className="konto-leise">(mindestens 6 Zeichen)</span>}
          </label>
          <input
            id="konto-passwort"
            className="city-input"
            type="password"
            autoComplete={art === 'neu' ? 'new-password' : 'current-password'}
            value={passwort}
            minLength={6}
            required
            onChange={(event) => setPasswort(event.target.value)}
          />
        </div>

        {fehler && (
          <div className="row row-stack konto-fehler" role="alert">
            <p>{fehler.message}</p>
            {fehler.technisch && (
              <button type="button" className="btn btn-secondary" onClick={() => ohneKontoWeiter()}>
                Vorerst ohne Konto weiter (nur dieses Gerät)
              </button>
            )}
          </div>
        )}

        <div className="row row-stack">
          <button type="submit" className="btn btn-primary" disabled={laeuft}>
            {laeuft ? 'Einen Moment …' : art === 'neu' ? 'Konto erstellen' : 'Anmelden'}
          </button>
          <p className="konto-hinweis">
            {art === 'neu'
              ? 'Merke dir dein Passwort gut – eine Zurücksetzung per E-Mail gibt es noch nicht.'
              : 'Passwort vergessen? Eine Zurücksetzung per E-Mail gibt es noch nicht – erstelle notfalls ein neues Konto.'}
          </p>
        </div>
      </form>
    </main>
  )
}

/** Das angemeldete Konto verwalten */
export function KontoScreen({ data }: { data: SaveData }) {
  const konto = data.konto
  const sync = useSyncZustand()
  const [abmeldenFragen, setAbmeldenFragen] = useState(false)
  const [passwortOffen, setPasswortOffen] = useState(false)
  const [altes, setAltes] = useState('')
  const [neues, setNeues] = useState('')
  const [meldung, setMeldung] = useState<string | null>(null)
  const [laeuft, setLaeuft] = useState(false)

  if (!konto) return <KontoTor data={data} />

  const sichern = async () => {
    setMeldung(null)
    setLaeuft(true)
    await jetztSichern()
    setLaeuft(false)
    haptic('success')
  }

  const passwort = async (event: FormEvent) => {
    event.preventDefault()
    setMeldung(null)
    setLaeuft(true)
    try {
      await passwortAendern(altes, neues)
      setMeldung('Das Passwort ist geändert.')
      setAltes('')
      setNeues('')
      setPasswortOffen(false)
      haptic('success')
    } catch (f) {
      haptic('error')
      setMeldung(f instanceof Error ? f.message : 'Das hat nicht geklappt.')
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Zurück" onClick={() => goBack({ name: 'home' })}>
          <IconBack />
        </button>
        <h1>Konto</h1>
      </header>

      <section className="list">
        <div className="row">
          <span className="row-label">
            <strong>{konto.name || 'Ohne Namen'}</strong>
            <span>{konto.email}</span>
          </span>
          <span className="konto-zeichen klein" aria-hidden="true">
            <IconUser />
          </span>
        </div>
        <div className="row">
          <span className="row-label">
            <strong>{SYNC_TEXT[sync.zustand]}</strong>
            <span>
              {sync.zustand === 'fehler' && sync.fehler ? `${sync.fehler} · ` : ''}
              Zuletzt gesichert: {zeit(sync.zuletzt || konto.stand)}
            </span>
          </span>
          <span className={`konto-punkt is-${sync.zustand}`} aria-hidden="true" />
        </div>
        <div className="row row-stack">
          <button className="btn btn-secondary" disabled={laeuft} onClick={() => void sichern()}>
            <IconCheck /> Jetzt sichern
          </button>
          <p>Fortschritt, Lernstand und Stadt werden von selbst gesichert – kurz nach jeder Änderung und immer, wenn du die App verlässt.</p>
        </div>
      </section>

      <section className="list konto-abschnitt">
        {!passwortOffen ? (
          <div className="row row-stack">
            <button className="btn btn-secondary" onClick={() => setPasswortOffen(true)}>
              Passwort ändern
            </button>
          </div>
        ) : (
          <form className="row row-stack" onSubmit={(event) => void passwort(event)}>
            <label className="city-label" htmlFor="konto-alt">
              Bisheriges Passwort
            </label>
            <input
              id="konto-alt"
              className="city-input"
              type="password"
              autoComplete="current-password"
              value={altes}
              required
              onChange={(event) => setAltes(event.target.value)}
            />
            <label className="city-label" htmlFor="konto-neu">
              Neues Passwort (mindestens 6 Zeichen)
            </label>
            <input
              id="konto-neu"
              className="city-input"
              type="password"
              autoComplete="new-password"
              value={neues}
              minLength={6}
              required
              onChange={(event) => setNeues(event.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={laeuft}>
              Passwort speichern
            </button>
          </form>
        )}
        {meldung && (
          <div className="row row-stack">
            <p role="status">{meldung}</p>
          </div>
        )}
        <div className="row row-stack">
          <button className="btn btn-secondary konto-abmelden" onClick={() => setAbmeldenFragen(true)}>
            Abmelden
          </button>
          <p>Nach dem Abmelden bleibt der Stand auf diesem Gerät. Beim nächsten Start musst du dich wieder anmelden.</p>
        </div>
      </section>

      {abmeldenFragen && (
        <ConfirmDialog
          title="Abmelden?"
          text="Dein Stand ist im Konto gesichert. Auf diesem Gerät bleibt er ebenfalls – zum Weiterspielen meldest du dich einfach wieder an."
          confirmLabel="Abmelden"
          onCancel={() => setAbmeldenFragen(false)}
          onConfirm={() => {
            void jetztSichern().then(() => {
              abmelden()
              setAbmeldenFragen(false)
              haptic('soft')
              goBack({ name: 'home' })
            })
          }}
        />
      )}
    </main>
  )
}
