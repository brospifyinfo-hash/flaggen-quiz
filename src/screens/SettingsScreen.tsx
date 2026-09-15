import { useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { IconBack, IconCheck, IconDownload, IconTrash } from '../components/Icons'
import { canVibrate } from '../haptics'
import { promptInstall, usePwaStatus } from '../pwa'
import { goBack } from '../router'
import { isStorageWorking, resetProgress, setState } from '../store'
import type { SaveData } from '../types'

const isIos =
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export function SettingsScreen({ data }: { data: SaveData }) {
  const pwa = usePwaStatus()
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Zurück" onClick={() => goBack({ name: 'home' })}>
          <IconBack />
        </button>
        <h1>Einstellungen</h1>
      </header>

      {canVibrate && (
        <section className="list">
          <div className="row">
            <span className="row-label">
              <strong>Vibration</strong>
              <span>Kurzes Feedback bei jeder Antwort</span>
            </span>
            <button
              className="switch"
              role="switch"
              aria-checked={data.settings.haptics}
              aria-label="Vibration"
              onClick={() =>
                setState((current) => ({ ...current, settings: { ...current.settings, haptics: !current.settings.haptics } }))
              }
            />
          </div>
        </section>
      )}

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
            <span>Alle Flaggen liegen auf dem Gerät</span>
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
              <p>
                Leg das Quiz auf deinen Home-Bildschirm. Es startet dann wie eine App – im Vollbild und ohne Internet.
              </p>
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

      <h2 className="section-title">Zurücksetzen</h2>
      <section className="list">
        <div className="row row-stack">
          <p>Löscht alle Ergebnisse, gelernten Flaggen und freigeschalteten Kontinente auf diesem Gerät.</p>
          <button className="btn btn-danger-outline" onClick={() => setConfirmReset(true)}>
            <IconTrash /> Fortschritt zurücksetzen
          </button>
        </div>
      </section>

      {confirmReset && (
        <ConfirmDialog
          danger
          title="Fortschritt wirklich löschen?"
          text="Alle Ergebnisse, gelernten Flaggen und freigeschalteten Kontinente werden gelöscht. Das lässt sich nicht rückgängig machen."
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
