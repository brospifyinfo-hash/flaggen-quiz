/**
 * Online-Duell: Lobby mit vierstelligem Code. Der Stand liegt auf dem Server,
 * dieses Gerät merkt sich nur Code und Ausweis – und nur in diesem Tab.
 */
import { KontoFehler } from './konto'
import { getMode } from './modes/registry'
import type { ModeQuestion, QuestionInput, SaveData } from './types'

const PFAD = '/api/konto'
const MERKER = 'weltwissen:lobby'
export const DUELL_FRAGEN = 8

export interface OnlineSpieler {
  name: string
  ich: boolean
  besitzer: boolean
  punkte: number
  richtig: number
  dran: boolean
  hinzu: number
  hinweis: string
}

export interface OnlineFrage {
  index: number
  gesamt: number
  modeId: string
  key: string
  prompt: string
  data: Record<string, string>
  options: { id: string; label: string }[]
  correctId: string
  input?: Exclude<QuestionInput, { kind: 'aktivitaet' }>
  aufloesung: boolean
  restMs: number
  picked: string | null
  hinweis: string
  hinzu: number
}

export interface OnlineLobby {
  code: string
  status: 'warten' | 'spiel' | 'ende'
  besitzer: boolean
  modus: { id: string; name: string; emoji: string } | null
  spieler: OnlineSpieler[]
  frage: OnlineFrage | null
  abbruch: string | null
  sieger: 'ich' | 'gegner' | 'unentschieden' | null
  fassung: number
}

export interface LobbySitzung {
  code: string
  token: string
}

async function anfrage<T>(aktion: string, body: object): Promise<T> {
  let antwort: Response
  try {
    antwort = await fetch(PFAD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aktion, ...body }),
    })
  } catch {
    throw new KontoFehler('Keine Verbindung zum Server. Bist du online?', 0)
  }
  let json: Record<string, unknown> = {}
  try {
    json = (await antwort.json()) as Record<string, unknown>
  } catch {
    // der Status reicht
  }
  if (!antwort.ok) {
    const fehler = typeof json.fehler === 'string' ? json.fehler : `Der Server antwortete mit ${antwort.status}.`
    throw new KontoFehler(fehler, antwort.status)
  }
  return json as T
}

export function lobbySitzung(): LobbySitzung | null {
  try {
    const roh = JSON.parse(sessionStorage.getItem(MERKER) ?? '') as LobbySitzung
    if (roh && typeof roh.code === 'string' && typeof roh.token === 'string') return roh
  } catch {
    // kein Eintrag
  }
  return null
}

export function lobbyMerken(sitzung: LobbySitzung) {
  sessionStorage.setItem(MERKER, JSON.stringify(sitzung))
}

export function lobbyVergessen() {
  sessionStorage.removeItem(MERKER)
}

function paket(json: { lobby?: OnlineLobby }, token: string, code: string): OnlineLobby {
  if (!json.lobby) throw new KontoFehler('Die Lobby antwortet nicht.', 500)
  lobbyMerken({ code, token })
  return json.lobby
}

export async function lobbyErstellen(name: string): Promise<{ code: string; token: string; lobby: OnlineLobby }> {
  const alt = lobbySitzung()
  if (alt) await lobbyVerlassen(alt).catch(() => undefined)
  const json = await anfrage<{ code: string; token: string; lobby: OnlineLobby }>('lobbyErstellen', { name })
  return { code: json.code, token: json.token, lobby: paket(json, json.token, json.code) }
}

export async function lobbyBeitreten(code: string, name: string): Promise<OnlineLobby> {
  const alt = lobbySitzung()
  if (alt && alt.code !== code) await lobbyVerlassen(alt).catch(() => undefined)
  const json = await anfrage<{ code: string; token: string; lobby: OnlineLobby }>('lobbyBeitreten', { code, name })
  return paket(json, json.token, json.code)
}

export async function lobbyHolen(sitzung: LobbySitzung): Promise<OnlineLobby> {
  const json = await anfrage<{ lobby: OnlineLobby }>('lobbyStand', sitzung)
  return json.lobby
}

export async function lobbySpielWaehlen(sitzung: LobbySitzung, modus: string): Promise<OnlineLobby> {
  const json = await anfrage<{ lobby: OnlineLobby }>('lobbySpiel', { ...sitzung, modus })
  return json.lobby
}

export async function lobbyBeginnen(sitzung: LobbySitzung, fragen: ReturnType<typeof duellFragen>): Promise<OnlineLobby> {
  const json = await anfrage<{ lobby: OnlineLobby }>('lobbyStart', { ...sitzung, fragen })
  return json.lobby
}

export async function lobbySenden(sitzung: LobbySitzung, index: number, antwort: string): Promise<OnlineLobby> {
  const json = await anfrage<{ lobby: OnlineLobby }>('lobbyAntwort', { ...sitzung, index, antwort })
  return json.lobby
}

export async function lobbyVerlassen(sitzung: LobbySitzung): Promise<OnlineLobby | null> {
  const json = await anfrage<{ lobby: OnlineLobby | null }>('lobbyVerlassen', sitzung)
  if (!json.lobby) lobbyVergessen()
  return json.lobby
}

/** Acht verschiedene Fragen des gewählten Spiels – beide sehen danach dieselbe Reihe */
export function duellFragen(modusId: string, data: SaveData) {
  const mode = getMode(modusId)
  if (!mode || mode.lernwelt) throw new KontoFehler('Dieses Spiel gibt es online nicht.', 400)
  const fragen: ModeQuestion[] = []
  const keys: string[] = []
  for (let versuch = 0; fragen.length < DUELL_FRAGEN && versuch < DUELL_FRAGEN * 12; versuch++) {
    const frage = mode.nextQuestion(data, keys)
    if (!frage || frage.modeId !== modusId || keys.includes(frage.key)) continue
    if (frage.input?.kind === 'aktivitaet') continue
    keys.unshift(frage.key)
    fragen.push(frage)
  }
  if (fragen.length < DUELL_FRAGEN) throw new KontoFehler('Dafür gibt es gerade nicht genug Fragen.', 400)
  return fragen.map((frage) => ({
    modeId: frage.modeId,
    key: frage.key,
    prompt: frage.prompt,
    data: frage.data,
    options: frage.options.map((option) => ({ id: option.id, label: option.label })),
    correctId: frage.correctId,
    ...(frage.input?.kind === 'timeline'
      ? { input: { kind: 'timeline' as const, min: frage.input.min, max: frage.input.max } }
      : frage.input?.kind === 'map'
        ? { input: { kind: 'map' as const, view: frage.input.view } }
        : {}),
  }))
}

/** Ein älterer Abruf darf einen neueren Stand nicht überschreiben */
export function lobbyNeuer(alt: OnlineLobby | null, neu: OnlineLobby): boolean {
  if (!alt || alt.code !== neu.code) return true
  if ((neu.fassung ?? 0) !== (alt.fassung ?? 0)) return (neu.fassung ?? 0) > (alt.fassung ?? 0)
  if (alt.status === 'ende') return false
  if (neu.status === 'ende' || (alt.status === 'warten' && neu.status !== 'warten')) return true
  if (alt.status === 'spiel' && neu.status === 'warten') return false
  const vorher = alt.frage?.index ?? -1
  const nachher = neu.frage?.index ?? -1
  if (nachher !== vorher) return nachher > vorher
  if (Boolean(neu.frage?.aufloesung) !== Boolean(alt.frage?.aufloesung)) return Boolean(neu.frage?.aufloesung)
  const zaehle = (lobby: OnlineLobby) => lobby.spieler.reduce((summe, spieler) => summe + (spieler.dran ? 1 : 0), 0)
  if (zaehle(neu) < zaehle(alt)) return false
  return true
}

export function alsModeFrage(frage: OnlineFrage): ModeQuestion {
  return {
    modeId: frage.modeId,
    key: frage.key,
    prompt: frage.prompt,
    data: frage.data,
    options: frage.options,
    correctId: frage.correctId,
    ...(frage.input ? { input: frage.input } : {}),
  }
}
