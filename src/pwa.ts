// Service Worker (Offline-Modus), Installation als App und dauerhafter Speicher
import { useSyncExternalStore } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PwaStatus {
  supported: boolean
  offlineReady: boolean
  canInstall: boolean
  standalone: boolean
  persisted: boolean
}

let status: PwaStatus = {
  supported: 'serviceWorker' in navigator,
  offlineReady: false,
  canInstall: false,
  standalone:
    matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true,
  persisted: false,
}

const listeners = new Set<() => void>()
const update = (patch: Partial<PwaStatus>) => {
  status = { ...status, ...patch }
  listeners.forEach((listener) => listener())
}

let installEvent: BeforeInstallPromptEvent | null = null

export function initPwa() {
  navigator.storage?.persisted?.().then((persisted) => update({ persisted })).catch(() => {})

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    installEvent = event as BeforeInstallPromptEvent
    update({ canInstall: true })
  })
  window.addEventListener('appinstalled', () => {
    installEvent = null
    update({ canInstall: false })
  })

  if (!status.supported) return

  // Der Service Worker legt beim ersten Besuch alle Dateien und Flaggen ab.
  // Die Seite wird bei Updates bewusst nicht neu geladen – der Spielstand soll nie mitten in einer Frage springen.
  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {})
      })
    })
    .catch(() => {})
  navigator.serviceWorker.ready.then(() => update({ offlineReady: true })).catch(() => {})
}

let persistRequested = false

/** Bittet den Browser, den Speicher nicht automatisch zu leeren */
export function requestPersistentStorage() {
  if (persistRequested || status.persisted || !navigator.storage?.persist) return
  persistRequested = true
  navigator.storage
    .persist()
    .then((persisted) => update({ persisted }))
    .catch(() => {})
}

export async function promptInstall() {
  if (!installEvent) return
  await installEvent.prompt()
  await installEvent.userChoice.catch(() => null)
  installEvent = null
  update({ canInstall: false })
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
const getStatus = () => status

export const usePwaStatus = () => useSyncExternalStore(subscribe, getStatus, getStatus)
