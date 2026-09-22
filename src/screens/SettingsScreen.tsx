import { useState } from 'react'
import { neuAnfangen } from '../city/state'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { IconBack, IconCheck, IconDownload, IconTrash } from '../components/Icons'
import { haptic, hapticSupport } from '../haptics'
import { promptInstall, usePwaStatus } from '../pwa'
import { goBack } from '../router'
import { isStorageWorking, resetProgress, setState } from '../store'
import type { SaveData } from '../types'

const isIos =
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

const HAPTIC_NOTE: Record<typeof hapticSupport, string> = {
  vibration: 'Kurzes Feedback bei Antworten, Combos und am Zeitstrahl.',
  ios: 'Auf dem iPhone läuft das über die System-Haptik. Sie muss unter Einstellungen → Töne & Haptik → Systemhaptik eingeschaltet sein.',
  none: 'Dein Browser kann kein fühlbares Feedback geben.',
}

export function SettingsScreen({ data }: { data: SaveData }) {
  const pwa = usePwaStatus()
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmStadt, setConfirmStadt] = useState(false)
  const [stadtNeu, setStadtNeu] = useState(false)

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Zurück" onClick={() => goBack({ name: 'home' })}>
          <IconBack />
        </button>
        <h1>Einstellungen</h1>
      </header>

      <section className="list">
        <div className="row">
          <span className="row-label">
            <strong>Vibration</strong>
            <span>{HAPTIC_NOTE[hapticSupport]}</span>
          </span>
          <button
            className="switch"
            role="switch"
            aria-checked={data.settings.haptics}
            aria-label="Vibration"
            disabled={hapticSupport === 'none'}
            onClick={() => {
              setState((current) => ({
                ...current,
                settings: { ...current.settings, haptics: !current.settings.haptics },
              }))
              haptic('success')
            }}
          />
        </div>
        {hapticSupport !== 'none' && (
          <div className="row row-stack">
            <button className="btn btn-secondary" onClick={() => haptic('celebrate')}>
              Vibration testen
            </button>
          </div>
        )}
        <div className="row">
          <span className="row-label">
            <strong>Ton</strong>
            <span>Kurze Töne im Math Runner und in den Lernwelten</span>
          </span>
          <button
            className="switch"
            role="switch"
            aria-checked={data.settings.sound}
            aria-label="Ton"
            onClick={() => {
              setState((current) => ({
                ...current,
                settings: { ...current.settings, sound: !current.settings.sound },
              }))
              haptic('success')
            }}
          />
        </div>
      </section>

      <h2 className="section-title">Sprachausgabe</h2>
      <section className="list">
        <div className="row">
          <span className="row-label">
            <strong>Vorlesen</strong>
            <span>
              Englisch und Französisch mit der Stimme deines Geräts – unabhängig vom Ton oben. Klingt die Stimme falsch, lässt
              sie sich in den Geräteeinstellungen unter Bedienungshilfen wechseln.
            </span>
          </span>
          <button
            className="switch"
            role="switch"
            aria-checked={data.settings.stimme !== false}
            aria-label="Vorlesen"
            onClick={() => {
              setState((current) => ({
                ...current,
                settings: { ...current.settings, stimme: current.settings.stimme === false },
              }))
              haptic('success')
            }}
          />
        </div>
        <div className="row">
          <span className="row-label">
            <strong>Ruhiger sprechen</strong>
            <span>Etwas langsameres Grundtempo. Der 🐢-Knopf spricht immer ganz langsam.</span>
          </span>
          <button
            className="switch"
            role="switch"
            aria-checked={data.settings.langsam === true}
            aria-label="Ruhiger sprechen"
            onClick={() => {
              setState((current) => ({
                ...current,
                settings: { ...current.settings, langsam: current.settings.langsam !== true },
              }))
              haptic('success')
            }}
          />
        </div>
      </section>

      <h2 className="section-title">Speicher & Offline</h2>
      <section className="list">
        <div className="row">
          <span className="row-label">
            <strong>Fortschritt</strong>
            <span>Wird bei jeder Antwort auf diesem Gerät gespeichert</span>
          </span>
          {isStorageWorking() ? (
            <span className="status">
              <IconCheck /> Aktiv
            </span>
          ) : (
            <span className="status status-bad">Gesperrt</span>
          )}
        </div>
        <div className="row">
          <span className="row-label">
            <strong>Offline spielen</strong>
            <span>Alle Flaggen und Fragen liegen auf dem Gerät</span>
          </span>
          {pwa.offlineReady ? (
            <span className="status">
              <IconCheck /> Bereit
            </span>
          ) : (
            <span className="status status-pending">{pwa.supported ? 'Lädt …' : 'Nicht möglich'}</span>
          )}
        </div>
      </section>
      {!isStorageWorking() && (
        <p className="note note-bad">
          Dein Browser blockiert gerade das Speichern (z. B. im privaten Modus). Öffne das Quiz in einem normalen Tab, damit
          dein Fortschritt erhalten bleibt.
        </p>
      )}

      {!pwa.standalone && (
        <>
          <h2 className="section-title">Als App nutzen</h2>
          <section className="list">
            <div className="row row-stack">
              <p>Leg das Quiz auf deinen Home-Bildschirm. Es startet dann wie eine App – im Vollbild und ohne Internet.</p>
              {pwa.canInstall ? (
                <button className="btn btn-primary" onClick={() => promptInstall()}>
                  <IconDownload /> App installieren
                </button>
              ) : isIos ? (
                <p className="howto">
                  Tippe in Safari unten auf <strong>Teilen</strong> und dann auf <strong>Zum Home-Bildschirm</strong>.
                </p>
              ) : (
                <p className="howto">
                  Öffne das Menü deines Browsers und wähle <strong>App installieren</strong> oder{' '}
                  <strong>Zum Startbildschirm hinzufügen</strong>.
                </p>
              )}
            </div>
          </section>
        </>
      )}

      {data.city && (
        <>
          <h2 className="section-title">Stadt</h2>
          <section className="list">
            <div className="row row-stack">
              <p>
                Reißt alle Gebäude und Straßen ab und beginnt mit der Startsiedlung neu. Deine Münzen (🪙{' '}
                {data.city.coins.toLocaleString('de-DE')}) und Materialien (🧱 {data.city.materials.toLocaleString('de-DE')})
                bleiben – ebenso Name, Wahlspruch und Wappen.
              </p>
              {stadtNeu ? (
                <span className="status">
                  <IconCheck /> Stadt wurde neu angelegt
                </span>
              ) : (
                <button className="btn btn-danger-outline" onClick={() => setConfirmStadt(true)}>
                  <IconTrash /> Stadt zurücksetzen
                </button>
              )}
            </div>
          </section>
        </>
      )}

      <h2 className="section-title">Zurücksetzen</h2>
      <section className="list">
        <div className="row row-stack">
          <p>Löscht alle Ergebnisse, Ränge, XP und gelernten Flaggen auf diesem Gerät.</p>
          <button className="btn btn-danger-outline" onClick={() => setConfirmReset(true)}>
            <IconTrash /> Fortschritt zurücksetzen
          </button>
        </div>
      </section>

      {confirmStadt && data.city && (
        <ConfirmDialog
          danger
          title={`${data.city.name} wirklich neu anfangen?`}
          text="Alle Gebäude, Straßen und Einwohner werden entfernt, die Stadt startet wieder mit der kleinen Siedlung. Münzen und Materialien bleiben dir erhalten."
          confirmLabel="Ja, Stadt zurücksetzen"
          onCancel={() => setConfirmStadt(false)}
          onConfirm={() => {
            setConfirmStadt(false)
            setState((current) => (current.city ? { ...current, city: neuAnfangen(current.city) } : current))
            setStadtNeu(true)
            haptic('strong')
          }}
        />
      )}

      {confirmReset && (
        <ConfirmDialog
          danger
          title="Fortschritt wirklich löschen?"
          text="Alle Ergebnisse, Ränge, XP und gelernten Flaggen werden gelöscht. Das lässt sich nicht rückgängig machen."
          confirmLabel="Ja, alles löschen"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            setConfirmReset(false)
            resetProgress()
            goBack({ name: 'home' })
          }}
        />
      )}
    </main>
  )
}
