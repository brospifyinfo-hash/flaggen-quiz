/**
 * Das Konto im Client: Anmelden, Registrieren und der stille Abgleich mit dem Server.
 *
 * Alles Spielerische liegt weiter im localStorage (src/store.ts). Ist ein Konto angemeldet,
 * schickt der Abgleich jeden Stand ein paar Sekunden nach der letzten Änderung an den Server –
 * und sofort, wenn die App in den Hintergrund geht. Liegt dort inzwischen ein anderer Stand
 * (anderes Gerät), werden beide zusammengeführt und das Ergebnis erneut gesichert.
 */
import { useSyncExternalStore } from 'react'
import { getState, leseStand, mergeSaves, setState } from './store'
import type { Konto, SaveData } from './types'

const PFAD = '/api/konto'
/** So lange wartet der Abgleich nach der letzten Änderung */
const RUHE_MS = 25_000
/** Nicht öfter sichern, solange gespielt wird – beim Verlassen der App wird sofort gesichert */
const MINDEST_ABSTAND = 90_000
/** Nur dieses Gerät, wenn der Server nicht erreichbar war – gilt für diesen Tab */
const OFFLINE_SCHLUESSEL = 'weltwissen:ohne-konto'

export class KontoFehler extends Error {
  constructor(
    nachricht: string,
    public status: number,
    public zusatz: Record<string, unknown> = {},
  ) {
    super(nachricht)
  }
  /** Netz oder Server weg – kein Fehler der Eingabe */
  get technisch() {
    return this.status === 0 || this.status >= 500
  }
}

async function anfrage<T>(aktion: string, body: Record<string, unknown>, keepalive = false): Promise<T> {
  let antwort: Response
  try {
    antwort = await fetch(PFAD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aktion, ...body }),
      keepalive,
    })
  } catch {
    throw new KontoFehler('Keine Verbindung zum Server. Bist du online?', 0)
  }
  let json: Record<string, unknown> = {}
  try {
    json = (await antwort.json()) as Record<string, unknown>
  } catch {
    // leerer oder fremder Körper – der Status reicht
  }
  if (!antwort.ok) {
    const { fehler, ...zusatz } = json
    throw new KontoFehler(typeof fehler === 'string' ? fehler : `Der Server antwortete mit ${antwort.status}.`, antwort.status, zusatz)
  }
  return json as T
}

/** Was zum Server geht: alles außer Konto und aktueller Seite */
export function fuerServer(data: SaveData): Omit<SaveData, 'konto' | 'route'> {
  const { konto: _k, route: _r, ...rest } = data
  return rest
}

interface KontoAntwort {
  konto: { id: string; email: string; name: string }
  token: string
  stand: number
  daten?: unknown
}

function alsKonto(antwort: KontoAntwort): Konto {
  return { ...antwort.konto, token: antwort.token, stand: antwort.stand }
}

/** Serverdaten lesen – kaputte oder fremde Daten zählen als „nichts da“ */
function vomServer(daten: unknown): SaveData | null {
  if (!daten || typeof daten !== 'object') return null
  return leseStand(daten)
}

// ---------- Anmelden und Registrieren ----------

export async function registrieren(email: string, passwort: string, name: string): Promise<void> {
  const lokal = getState()
  const antwort = await anfrage<KontoAntwort>('registrieren', { email, passwort, name, daten: fuerServer(lokal) })
  setState((data) => ({ ...data, konto: alsKonto(antwort) }))
  zuletztGesendet = schluessel(getState())
  meldeZustand({ zustand: 'ruhig', zuletzt: Date.now() })
}

export async function anmelden(email: string, passwort: string): Promise<void> {
  const antwort = await anfrage<KontoAntwort>('anmelden', { email, passwort })
  const server = vomServer(antwort.daten)
  const konto = alsKonto(antwort)
  setState((lokal) => {
    // Das Konto führt: sein Stand ist die Grundlage, was hier lag, kommt dazu
    const zusammen = server ? mergeSaves({ ...server, route: lokal.route, settings: lokal.settings }, lokal) : lokal
    return { ...zusammen, konto }
  })
  // Was zusammenkam, gleich sichern – dann sind Gerät und Server wieder eins
  await jetztSichern()
}

export function abmelden(): void {
  stoppeWartezeit()
  setState((data) => {
    const { konto: _k, ...rest } = data
    return rest
  })
  zuletztGesendet = ''
  meldeZustand({ zustand: 'ruhig', zuletzt: 0 })
}

export async function passwortAendern(altes: string, neues: string): Promise<void> {
  const konto = getState().konto
  if (!konto) throw new KontoFehler('Du bist nicht angemeldet.', 401)
  await anfrage('passwortAendern', { token: konto.token, email: konto.email, altesPasswort: altes, neuesPasswort: neues })
}

// ---------- Ohne Konto weiter, wenn der Server nicht da ist ----------

export const ohneKontoErlaubt = (): boolean => {
  try {
    return sessionStorage.getItem(OFFLINE_SCHLUESSEL) === '1'
  } catch {
    return false
  }
}

export function ohneKontoWeiter(): void {
  try {
    sessionStorage.setItem(OFFLINE_SCHLUESSEL, '1')
  } catch {
    // ohne Sitzungsspeicher bleibt die Frage beim nächsten Laden
  }
  meldeZustand({ ...zustand })
}

// ---------- Abgleich ----------

export interface SyncZustand {
  zustand: 'ruhig' | 'wartet' | 'sendet' | 'fehler' | 'aus'
  /** Wann zuletzt erfolgreich gesichert wurde */
  zuletzt: number
  fehler?: string
}

let zustand: SyncZustand = { zustand: getState().konto ? 'ruhig' : 'aus', zuletzt: 0 }
const lauscher = new Set<() => void>()
function meldeZustand(neu: SyncZustand) {
  zustand = neu
  lauscher.forEach((l) => l())
}
const abonniere = (l: () => void) => {
  lauscher.add(l)
  return () => {
    lauscher.delete(l)
  }
}
export const useSyncZustand = () => useSyncExternalStore(abonniere, () => zustand, () => zustand)

/** Kennzeichen des Inhalts – ohne Zeitstempel, damit ein reines Speichern nichts erneut auslöst */
function schluessel(data: SaveData): string {
  const { updatedAt: _u, ...rest } = fuerServer(data)
  return JSON.stringify(rest)
}

let zuletztGesendet = ''
let wartezeit: ReturnType<typeof setTimeout> | null = null
let laeuft: Promise<void> | null = null

function stoppeWartezeit() {
  if (wartezeit) clearTimeout(wartezeit)
  wartezeit = null
}

/** Sichert den aktuellen Stand – wartet, falls gerade eine Sicherung läuft */
export function jetztSichern(keepalive = false): Promise<void> {
  stoppeWartezeit()
  if (laeuft) return laeuft.then(() => jetztSichern(keepalive))
  laeuft = sichern(keepalive).finally(() => {
    laeuft = null
  })
  return laeuft
}

async function sichern(keepalive: boolean): Promise<void> {
  const data = getState()
  const konto = data.konto
  if (!konto) return
  const kennung = schluessel(data)
  if (kennung === zuletztGesendet) {
    meldeZustand({ zustand: 'ruhig', zuletzt: zustand.zuletzt })
    return
  }
  // Im Spiel ändert sich die Stadt laufend. Gebündelt sichern, außer die App geht gerade zu.
  if (!keepalive && zustand.zuletzt > 0 && Date.now() - zustand.zuletzt < MINDEST_ABSTAND) {
    const rest = MINDEST_ABSTAND - (Date.now() - zustand.zuletzt)
    meldeZustand({ zustand: 'wartet', zuletzt: zustand.zuletzt })
    stoppeWartezeit()
    wartezeit = setTimeout(() => void jetztSichern(), rest)
    return
  }
  meldeZustand({ zustand: 'sendet', zuletzt: zustand.zuletzt })
  try {
    const antwort = await anfrage<{ stand: number }>(
      'speichern',
      { token: konto.token, daten: fuerServer(data), stand: konto.stand },
      keepalive,
    )
    zuletztGesendet = kennung
    setState((jetzt) => (jetzt.konto ? { ...jetzt, konto: { ...jetzt.konto, stand: antwort.stand } } : jetzt))
    meldeZustand({ zustand: 'ruhig', zuletzt: Date.now() })
  } catch (fehler) {
    if (fehler instanceof KontoFehler && fehler.status === 409) {
      // Anderes Gerät war schneller: beides zusammenführen und mit dem neuen Stand erneut sichern
      const server = vomServer(fehler.zusatz.daten)
      const stand = typeof fehler.zusatz.stand === 'number' ? fehler.zusatz.stand : 0
      setState((lokal) => {
        const zusammen = server ? mergeSaves(lokal, server) : lokal
        return { ...zusammen, konto: lokal.konto ? { ...lokal.konto, stand } : lokal.konto }
      })
      zuletztGesendet = ''
      return sichern(keepalive)
    }
    if (fehler instanceof KontoFehler && fehler.status === 401) {
      // Sitzung abgelaufen oder Schlüssel gewechselt – der Anmeldebildschirm kommt von selbst
      abmelden()
      meldeZustand({ zustand: 'aus', zuletzt: 0, fehler: fehler.message })
      return
    }
    meldeZustand({
      zustand: 'fehler',
      zuletzt: zustand.zuletzt,
      fehler: fehler instanceof Error ? fehler.message : 'Sichern fehlgeschlagen.',
    })
  }
}

/** Beim Start: Liegt auf dem Server ein neuerer Stand, kommt er dazu */
async function abholen(): Promise<void> {
  const konto = getState().konto
  if (!konto) return
  try {
    const antwort = await anfrage<{ stand: number; daten: unknown }>('laden', { token: konto.token })
    if (antwort.stand === konto.stand) {
      zuletztGesendet = schluessel(getState())
      return
    }
    const server = vomServer(antwort.daten)
    setState((lokal) => {
      const zusammen = server ? mergeSaves(lokal, server) : lokal
      return { ...zusammen, konto: lokal.konto ? { ...lokal.konto, stand: antwort.stand } : lokal.konto }
    })
    await jetztSichern()
  } catch (fehler) {
    if (fehler instanceof KontoFehler && fehler.status === 401) abmelden()
  }
}

let gestartet = false

/** Einmal beim Start aufrufen: lauscht auf Änderungen und hält den Server auf dem Laufenden */
export function starteAbgleich(abonniereStore: (l: () => void) => () => void): void {
  if (gestartet) return
  gestartet = true

  let vorher = getState()
  abonniereStore(() => {
    const jetzt = getState()
    const konto = jetzt.konto
    if (!konto) {
      if (vorher.konto) meldeZustand({ zustand: 'aus', zuletzt: 0 })
      vorher = jetzt
      return
    }
    if (!vorher.konto) {
      // gerade angemeldet – die Anmeldung selbst sichert schon
      vorher = jetzt
      return
    }
    vorher = jetzt
    if (schluessel(jetzt) === zuletztGesendet) return
    if (zustand.zustand !== 'sendet') meldeZustand({ zustand: 'wartet', zuletzt: zustand.zuletzt })
    stoppeWartezeit()
    wartezeit = setTimeout(() => void jetztSichern(), RUHE_MS)
  })

  const eilig = () => {
    if (document.visibilityState === 'hidden' && wartezeit) void jetztSichern(true)
  }
  document.addEventListener('visibilitychange', eilig)
  window.addEventListener('pagehide', () => {
    if (wartezeit) void jetztSichern(true)
  })
  window.addEventListener('online', () => {
    if (zustand.zustand === 'fehler') void jetztSichern()
  })

  void abholen()
}
