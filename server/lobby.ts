/// <reference types="node" />
/**
 * Online-Duell: eine Lobby mit vierstelligem Code, höchstens zwei Spieler.
 * Es gibt keine stehende Verbindung. Beide Geräte fragen denselben Stand ab.
 * Die Fragen legt der Host beim Start ab, der Server wertet die Antworten.
 */
import { randomBytes, randomInt } from 'node:crypto'
import { Abgelehnt } from './konto'
import { KonfliktFehler, speicher } from './speicher'

export const DUELL_FRAGEN = 8
const LEBENSDAUER = 2 * 60 * 60 * 1000
const FRAGE_MS = 20_000
const ZEIGEN_MS = 4_500
const MAX_SPIELER = 2

const MODI: Record<string, { name: string; emoji: string }> = {
  'was-ist-das': { name: 'Was ist das', emoji: '🔎' },
  'higher-lower': { name: 'Higher or Lower', emoji: '📈' },
  geschichte: { name: 'Geschichte', emoji: '⏳' },
  weltkarte: { name: 'Weltkarte', emoji: '🗺️' },
}

interface FrageInput {
  kind: 'timeline'
  min: number
  max: number
}
interface KartenInput {
  kind: 'map'
  view: string
}

interface Frage {
  modeId: string
  key: string
  prompt: string
  data: Record<string, string>
  options: { id: string; label: string }[]
  correctId: string
  input?: FrageInput | KartenInput
}

interface Antwort {
  index: number
  antwort: string
  richtig: boolean
  punkte: number
  hinweis: string
}

interface Spieler {
  id: string
  name: string
  punkte: number
  richtig: number
  antworten: Antwort[]
}

interface Lobby {
  code: string
  erstellt: number
  status: 'warten' | 'spiel' | 'ende'
  besitzer: string
  modus: { id: string; name: string; emoji: string } | null
  fragen: Frage[]
  frage: number
  frageSeit: number
  aufloesung: boolean
  aufloesungSeit: number
  abbruch: string | null
  /** Steigt bei jeder Änderung, damit ein verspäteter Abruf den neueren Stand nicht überschreibt */
  fassung: number
  spieler: Spieler[]
}

export interface LobbySpielerBlick {
  name: string
  ich: boolean
  besitzer: boolean
  punkte: number
  richtig: number
  dran: boolean
  hinzu: number
  hinweis: string
}

export interface LobbyBlick {
  code: string
  status: Lobby['status']
  besitzer: boolean
  modus: Lobby['modus']
  spieler: LobbySpielerBlick[]
  frage: null | {
    index: number
    gesamt: number
    modeId: string
    key: string
    prompt: string
    data: Record<string, string>
    options: { id: string; label: string }[]
    correctId: string
    input?: FrageInput | KartenInput
    aufloesung: boolean
    restMs: number
    picked: string | null
    hinweis: string
    hinzu: number
  }
  abbruch: string | null
  sieger: 'ich' | 'gegner' | 'unentschieden' | null
  fassung: number
}

class Belegt extends Error {}

const kette = new Map<string, Promise<unknown>>()

function exklusiv<T>(code: string, fn: () => Promise<T>): Promise<T> {
  const vorher = kette.get(code) ?? Promise.resolve()
  const lauf = vorher.then(fn, fn)
  const ende = lauf.then(
    () => undefined,
    () => undefined,
  )
  kette.set(code, ende)
  void ende.then(() => {
    if (kette.get(code) === ende) kette.delete(code)
  })
  return lauf
}

function pfadVon(code: string) {
  return `lobbys/${code}.json`
}

function abgelaufen(lobby: Lobby, jetzt = Date.now()) {
  return jetzt - lobby.erstellt > LEBENSDAUER
}

function text(wert: unknown, max: number, fehler: string): string {
  if (typeof wert !== 'string') throw new Abgelehnt(400, fehler)
  const sauber = wert.trim()
  if (sauber.length < 1 || sauber.length > max || /[\u0000-\u001f]/.test(sauber)) throw new Abgelehnt(400, fehler)
  return sauber
}

function nameVon(wert: unknown): string {
  if (typeof wert !== 'string') throw new Abgelehnt(400, 'Wie heißt du?')
  return text(wert.replace(/\s+/g, ' '), 24, 'Der Name braucht 1 bis 24 Zeichen.')
}

function codeVon(wert: unknown): string {
  if (typeof wert !== 'string' || !/^[1-9]\d{3}$/.test(wert)) throw new Abgelehnt(400, 'Der Code hat vier Ziffern.')
  return wert
}

function tokenVon(wert: unknown): string {
  if (typeof wert !== 'string' || !/^[A-Za-z0-9_-]{16,48}$/.test(wert)) throw new Abgelehnt(401, 'Die Lobby kennt dich nicht.')
  return wert
}

function schluessel(body: Record<string, unknown>) {
  return { code: codeVon(body.code), token: tokenVon(body.token) }
}

function spielerNeu(id: string, name: string): Spieler {
  return { id, name, punkte: 0, richtig: 0, antworten: [] }
}

function lies(inhalt: string): Lobby | null {
  try {
    const roh = JSON.parse(inhalt) as Lobby
    if (!roh || typeof roh !== 'object' || !/^[1-9]\d{3}$/.test(roh.code)) return null
    if (!Array.isArray(roh.spieler) || typeof roh.besitzer !== 'string') return null
    if (roh.status !== 'warten' && roh.status !== 'spiel' && roh.status !== 'ende') return null
    return roh
  } catch {
    return null
  }
}

async function aendere(code: string, fn: (lobby: Lobby | null) => Lobby | null): Promise<Lobby | null> {
  const ablage = speicher()
  if (!ablage) throw new Abgelehnt(503, 'Online-Spiele sind gerade nicht eingerichtet.')
  const pfad = pfadVon(code)
  return exklusiv(code, async () => {
    for (let versuch = 0; versuch < 5; versuch++) {
      const gelesen = await ablage.lesen(pfad)
      const bisher = gelesen ? lies(gelesen.inhalt) : null
      const aktuell = bisher && !abgelaufen(bisher) ? bisher : null
      const erzeugt = fn(aktuell)
      if (erzeugt === aktuell) return aktuell
      if (erzeugt === null) {
        if (gelesen) await ablage.loeschen(pfad, gelesen.marke)
        return null
      }
      const neu = { ...erzeugt, fassung: (aktuell?.fassung ?? 0) + 1 }
      const inhalt = JSON.stringify(neu)
      if (gelesen && inhalt === gelesen.inhalt) return neu
      try {
        await ablage.schreiben(pfad, inhalt, gelesen?.marke)
        return neu
      } catch (fehler) {
        if (fehler instanceof KonfliktFehler) continue
        throw fehler
      }
    }
    throw new Abgelehnt(409, 'Die Lobby war gerade belegt. Bitte noch einmal.')
  })
}

function brauchen(lobby: Lobby | null, token: string): Lobby {
  if (!lobby) throw new Abgelehnt(404, 'Diesen Code gibt es nicht. Er gilt zwei Stunden.')
  if (!lobby.spieler.some((spieler) => spieler.id === token)) throw new Abgelehnt(404, 'Du bist nicht in dieser Lobby.')
  return lobby
}

/** Nähe am Jahr – dieselbe Staffel wie im Geschichtsmodus */
function toleranz(jahr: number) {
  return jahr < -500 ? 100 : jahr < 500 ? 60 : jahr < 1500 ? 30 : jahr < 1800 ? 15 : jahr < 1900 ? 8 : jahr < 1960 ? 4 : 2
}

function tempo(ms: number) {
  return Math.round(50 * Math.max(0, 1 - ms / FRAGE_MS))
}

function bewerte(frage: Frage, antwort: string, ms: number): Omit<Antwort, 'index' | 'antwort'> {
  const bonus = tempo(ms)
  if (frage.input?.kind === 'timeline') {
    const jahr = Number(frage.correctId)
    const tipp = Number(antwort)
    if (!Number.isFinite(tipp) || !Number.isFinite(jahr)) return { richtig: false, punkte: 0, hinweis: 'Keine Zahl' }
    const diff = Math.abs(tipp - jahr)
    const jahre = diff === 1 ? 'Jahr' : 'Jahre'
    if (diff === 0) return { richtig: true, punkte: 150 + bonus, hinweis: 'Volltreffer' }
    if (diff <= toleranz(jahr)) return { richtig: true, punkte: 60 + bonus, hinweis: `${diff} ${jahre} daneben` }
    return { richtig: false, punkte: 0, hinweis: `${diff} ${jahre} daneben` }
  }
  if (antwort === frage.correctId) return { richtig: true, punkte: 100 + bonus, hinweis: 'Richtig' }
  return { richtig: false, punkte: 0, hinweis: 'Falsch' }
}

function tick(lobby: Lobby, jetzt: number): Lobby {
  if (lobby.status !== 'spiel' || lobby.fragen.length === 0) return lobby
  if (!lobby.aufloesung) {
    const beide = lobby.spieler.every((spieler) => spieler.antworten.some((eintrag) => eintrag.index === lobby.frage))
    if (!beide && jetzt - lobby.frageSeit < FRAGE_MS) return lobby
    const spieler = lobby.spieler.map((eintrag) => {
      if (eintrag.antworten.some((antwort) => antwort.index === lobby.frage)) return eintrag
      return {
        ...eintrag,
        antworten: [
          ...eintrag.antworten,
          { index: lobby.frage, antwort: '', richtig: false, punkte: 0, hinweis: 'Zeit abgelaufen' },
        ],
      }
    })
    return { ...lobby, spieler, aufloesung: true, aufloesungSeit: jetzt }
  }
  if (jetzt - lobby.aufloesungSeit < ZEIGEN_MS) return lobby
  if (lobby.frage + 1 >= lobby.fragen.length) return { ...lobby, status: 'ende', aufloesung: false }
  return { ...lobby, frage: lobby.frage + 1, frageSeit: jetzt, aufloesung: false, aufloesungSeit: 0 }
}

function blick(lobby: Lobby, token: string, jetzt: number): LobbyBlick {
  const ich = lobby.spieler.find((spieler) => spieler.id === token)
  if (!ich) throw new Abgelehnt(404, 'Du bist nicht in dieser Lobby.')
  const imSpiel = lobby.status !== 'warten' && lobby.fragen[lobby.frage]
  const frage = imSpiel ? lobby.fragen[lobby.frage] : null
  const aufloesung = lobby.status === 'spiel' && lobby.aufloesung
  const eigene = frage ? ich.antworten.find((eintrag) => eintrag.index === lobby.frage) : undefined
  const restMs = !frage
    ? 0
    : aufloesung
      ? Math.max(0, ZEIGEN_MS - (jetzt - lobby.aufloesungSeit))
      : Math.max(0, FRAGE_MS - (jetzt - lobby.frageSeit))

  let sieger: LobbyBlick['sieger'] = null
  if (lobby.status === 'ende' && lobby.spieler.length >= 2) {
    const [a, b] = [...lobby.spieler].sort((x, y) => y.punkte - x.punkte)
    sieger = a.punkte === b.punkte ? 'unentschieden' : a.id === token ? 'ich' : 'gegner'
  }

  return {
    code: lobby.code,
    status: lobby.status,
    besitzer: lobby.besitzer === token,
    modus: lobby.modus,
    abbruch: lobby.abbruch,
    sieger,
    fassung: lobby.fassung ?? 0,
    spieler: lobby.spieler.map((spieler) => {
      const zug = frage ? spieler.antworten.find((eintrag) => eintrag.index === lobby.frage) : undefined
      return {
        name: spieler.name,
        ich: spieler.id === token,
        besitzer: spieler.id === lobby.besitzer,
        punkte: spieler.punkte,
        richtig: spieler.richtig,
        dran: Boolean(zug),
        hinzu: aufloesung || lobby.status === 'ende' ? (zug?.punkte ?? 0) : 0,
        hinweis: aufloesung || lobby.status === 'ende' ? (zug?.hinweis ?? '') : '',
      }
    }),
    frage: frage
      ? {
          index: lobby.frage,
          gesamt: lobby.fragen.length,
          modeId: frage.modeId,
          key: frage.key,
          prompt: frage.prompt,
          data: frage.data,
          options: frage.options,
          correctId: aufloesung ? frage.correctId : '',
          input: frage.input,
          aufloesung,
          restMs,
          picked: eigene?.antwort ? eigene.antwort : null,
          hinweis: aufloesung ? (eigene?.hinweis ?? '') : '',
          hinzu: aufloesung ? (eigene?.punkte ?? 0) : 0,
        }
      : null,
  }
}

function alsFragen(wert: unknown, modusId: string): Frage[] {
  if (!Array.isArray(wert) || wert.length !== DUELL_FRAGEN) throw new Abgelehnt(400, 'Das Duell hat acht Fragen.')
  if (JSON.stringify(wert).length > 80_000) throw new Abgelehnt(400, 'Die Fragen sind zu groß.')
  const keys = new Set<string>()
  return wert.map((roh, index) => {
    if (!roh || typeof roh !== 'object') throw new Abgelehnt(400, 'Eine Frage ist unlesbar.')
    const feld = roh as Record<string, unknown>
    const nummer = `Frage ${index + 1}`
    const modeId = text(feld.modeId, 40, `${nummer} ist ungültig.`)
    if (modeId !== modusId) throw new Abgelehnt(400, 'Die Fragen gehören nicht zum gewählten Spiel.')
    const key = text(feld.key, 120, `${nummer} ist ungültig.`)
    if (keys.has(key)) throw new Abgelehnt(400, 'Dieselbe Frage kam doppelt.')
    keys.add(key)
    const prompt = text(feld.prompt, 240, `${nummer} hat keine Aufgabe.`)
    if (!feld.data || typeof feld.data !== 'object' || Array.isArray(feld.data)) throw new Abgelehnt(400, `${nummer} ist unvollständig.`)
    const data: Record<string, string> = {}
    for (const [k, v] of Object.entries(feld.data as Record<string, unknown>)) {
      if (!/^[a-z]{1,20}$/.test(k)) throw new Abgelehnt(400, `${nummer} ist ungültig.`)
      data[k] = text(v, 80, `${nummer} ist ungültig.`)
    }
    if (Object.keys(data).length > 8) throw new Abgelehnt(400, `${nummer} ist ungültig.`)
    if (!Array.isArray(feld.options) || feld.options.length > 6) throw new Abgelehnt(400, `${nummer} hat zu viele Antworten.`)
    const options = feld.options.map((option) => {
      if (!option || typeof option !== 'object') throw new Abgelehnt(400, `${nummer} ist ungültig.`)
      const eintrag = option as Record<string, unknown>
      return { id: text(eintrag.id, 80, `${nummer} ist ungültig.`), label: text(eintrag.label, 160, `${nummer} ist ungültig.`) }
    })
    const correctId = text(feld.correctId, 80, `${nummer} hat keine Lösung.`)
    if (options.length > 0 && !options.some((option) => option.id === correctId)) {
      throw new Abgelehnt(400, `${nummer}: die Lösung passt nicht zu den Antworten.`)
    }
    let input: Frage['input']
    if (feld.input != null) {
      if (typeof feld.input !== 'object') throw new Abgelehnt(400, `${nummer} ist ungültig.`)
      const eingabe = feld.input as Record<string, unknown>
      if (eingabe.kind === 'timeline') {
        const { min, max } = eingabe
        if (typeof min !== 'number' || typeof max !== 'number' || !Number.isFinite(min) || !Number.isFinite(max)) {
          throw new Abgelehnt(400, `${nummer} hat einen kaputten Zeitstrahl.`)
        }
        if (max - min < 20 || max - min > 2000) throw new Abgelehnt(400, `${nummer} hat einen kaputten Zeitstrahl.`)
        input = { kind: 'timeline', min, max }
      } else if (eingabe.kind === 'map') {
        if (typeof eingabe.view !== 'string' || !/^-?\d+(\.\d+)?(?: -?\d+(\.\d+)?){3}$/.test(eingabe.view)) {
          throw new Abgelehnt(400, `${nummer} hat eine kaputte Karte.`)
        }
        input = { kind: 'map', view: eingabe.view }
      } else throw new Abgelehnt(400, 'Diese Frageart geht online nicht.')
    }
    if (options.length === 0 && !input) throw new Abgelehnt(400, `${nummer} hat keine Antworten.`)
    return { modeId, key, prompt, data, options, correctId, ...(input ? { input } : {}) }
  })
}

async function mitTick(code: string, token: string, fn: (lobby: Lobby, jetzt: number) => Lobby | null): Promise<LobbyBlick | null> {
  const jetzt = Date.now()
  const lobby = await aendere(code, (da) => {
    const vorhanden = brauchen(da, token)
    const stand = tick(vorhanden, jetzt)
    const neu = fn(stand, jetzt)
    return neu
  })
  if (!lobby || !lobby.spieler.some((spieler) => spieler.id === token)) return null
  return blick(lobby, token, Date.now())
}

export async function lobbyErstellen(body: Record<string, unknown>) {
  const name = nameVon(body.name)
  for (let versuch = 0; versuch < 30; versuch++) {
    const code = String(randomInt(1000, 10000))
    const token = randomBytes(16).toString('base64url')
    try {
      const lobby = await aendere(code, (da) => {
        if (da) throw new Belegt()
        const jetzt = Date.now()
        return {
          code,
          erstellt: jetzt,
          status: 'warten',
          besitzer: token,
          modus: null,
          fragen: [],
          frage: 0,
          frageSeit: 0,
          aufloesung: false,
          aufloesungSeit: 0,
          abbruch: null,
          fassung: 0,
          spieler: [spielerNeu(token, name)],
        }
      })
      return { code, token, lobby: blick(lobby!, token, Date.now()) }
    } catch (fehler) {
      if (fehler instanceof Belegt) continue
      throw fehler
    }
  }
  throw new Abgelehnt(503, 'Gerade ist keine Lobby frei. Bitte versuche es noch einmal.')
}

export async function lobbyBeitreten(body: Record<string, unknown>) {
  const code = codeVon(body.code)
  const name = nameVon(body.name)
  const token = randomBytes(16).toString('base64url')
  const lobby = await aendere(code, (da) => {
    if (!da) throw new Abgelehnt(404, 'Diesen Code gibt es nicht. Er gilt zwei Stunden.')
    if (da.status !== 'warten') throw new Abgelehnt(409, 'Das Spiel hat schon begonnen.')
    if (da.spieler.length >= MAX_SPIELER) throw new Abgelehnt(409, 'Die Lobby ist voll.')
    return { ...da, spieler: [...da.spieler, spielerNeu(token, name)] }
  })
  return { code, token, lobby: blick(lobby!, token, Date.now()) }
}

export async function lobbyStand(body: Record<string, unknown>) {
  const { code, token } = schluessel(body)
  const lobby = await mitTick(code, token, (stand) => stand)
  if (!lobby) throw new Abgelehnt(404, 'Diesen Code gibt es nicht. Er gilt zwei Stunden.')
  return { lobby }
}

export async function lobbySpiel(body: Record<string, unknown>) {
  const { code, token } = schluessel(body)
  const modusId = typeof body.modus === 'string' ? body.modus : ''
  const modus = MODI[modusId]
  if (!modus) throw new Abgelehnt(400, 'Dieses Spiel gibt es online nicht.')
  const lobby = await mitTick(code, token, (stand) => {
    if (stand.besitzer !== token) throw new Abgelehnt(403, 'Nur der Host wählt das Spiel.')
    if (stand.status !== 'warten') throw new Abgelehnt(409, 'Das Spiel läuft schon.')
    if (stand.modus?.id === modusId) return stand
    return { ...stand, modus: { id: modusId, name: modus.name, emoji: modus.emoji } }
  })
  if (!lobby) throw new Abgelehnt(404, 'Diesen Code gibt es nicht. Er gilt zwei Stunden.')
  return { lobby }
}

export async function lobbyStart(body: Record<string, unknown>) {
  const { code, token } = schluessel(body)
  const lobby = await mitTick(code, token, (stand, jetzt) => {
    if (stand.besitzer !== token) throw new Abgelehnt(403, 'Nur der Host startet das Spiel.')
    if (stand.status !== 'warten') throw new Abgelehnt(409, 'Das Spiel läuft schon.')
    if (!stand.modus) throw new Abgelehnt(400, 'Wähle zuerst ein Spiel.')
    if (stand.spieler.length < MAX_SPIELER) throw new Abgelehnt(409, 'Es fehlt noch jemand.')
    const fragen = alsFragen(body.fragen, stand.modus.id)
    return { ...stand, status: 'spiel', fragen, frage: 0, frageSeit: jetzt, aufloesung: false, aufloesungSeit: 0 }
  })
  if (!lobby) throw new Abgelehnt(404, 'Diesen Code gibt es nicht. Er gilt zwei Stunden.')
  return { lobby }
}

export async function lobbyAntwort(body: Record<string, unknown>) {
  const { code, token } = schluessel(body)
  const index = body.index
  if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= DUELL_FRAGEN) {
    throw new Abgelehnt(400, 'Diese Frage gibt es nicht.')
  }
  const antwort = text(body.antwort, 80, 'Die Antwort fehlt.')
  const lobby = await mitTick(code, token, (stand, jetzt) => {
    if (stand.status !== 'spiel' || stand.aufloesung || stand.frage !== index) return stand
    const frage = stand.fragen[index]
    if (!frage) return stand
    const spieler = stand.spieler.map((eintrag) => {
      if (eintrag.id !== token || eintrag.antworten.some((zug) => zug.index === index)) return eintrag
      const wert = bewerte(frage, antwort, Math.min(FRAGE_MS, Math.max(0, jetzt - stand.frageSeit)))
      return {
        ...eintrag,
        punkte: eintrag.punkte + wert.punkte,
        richtig: eintrag.richtig + (wert.richtig ? 1 : 0),
        antworten: [...eintrag.antworten, { index, antwort, ...wert }],
      }
    })
    return tick({ ...stand, spieler }, jetzt)
  })
  if (!lobby) throw new Abgelehnt(404, 'Diesen Code gibt es nicht. Er gilt zwei Stunden.')
  return { lobby }
}

export async function lobbyVerlassen(body: Record<string, unknown>) {
  const { code, token } = schluessel(body)
  const lobby = await aendere(code, (da) => {
    if (!da || abgelaufen(da)) return null
    const ich = da.spieler.find((spieler) => spieler.id === token)
    if (!ich) return da
    if (da.status === 'spiel') {
      return { ...tick(da, Date.now()), status: 'ende', aufloesung: false, abbruch: `${ich.name} hat das Spiel verlassen.` }
    }
    const spieler = da.spieler.filter((spieler) => spieler.id !== token)
    if (spieler.length === 0) return null
    return { ...da, spieler, besitzer: da.besitzer === token ? spieler[0].id : da.besitzer }
  })
  if (!lobby || !lobby.spieler.some((spieler) => spieler.id === token)) return { lobby: null }
  return { lobby: blick(lobby, token, Date.now()) }
}
