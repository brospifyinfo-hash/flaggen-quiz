// Bürger, die um Hilfe bitten. Die Aufgabe kommt aus den vorhandenen Quiz-Modi –
// so fließt jedes Wissensgebiet der App in die Stadt zurück.
import { getMode, pickRandomMode } from '../modes/registry'
import type { ModeQuestion, SaveData } from '../types'
import { buildingDef } from './catalog'

export interface Citizen {
  name: string
  emoji: string
  /** Beruf, prägt die Geschichte */
  role: string
}

export interface CityRequest {
  id: string
  citizen: Citizen
  /** kurze Geschichte vor der Frage */
  story: string
  modeId: string
  question: ModeQuestion
  /** Bauwerk, über dem die Sprechblase schwebt */
  buildingId: string
  at: number
}

/** Belohnung für eine gelöste Bitte */
export const REQUEST_COINS = 140
export const REQUEST_MATERIALS = 3
export const REQUEST_XP = 25
/** So lange dauert es mindestens bis zur nächsten Bitte */
export const REQUEST_PAUSE = 25 * 60 * 1000

const PEOPLE: Citizen[] = [
  { name: 'Anna', emoji: '👩‍🔬', role: 'Astronomin' },
  { name: 'Max', emoji: '👷', role: 'Ingenieur' },
  { name: 'Leo', emoji: '🧑‍🍳', role: 'Ladenbesitzer' },
  { name: 'Mia', emoji: '👩‍🎨', role: 'Künstlerin' },
  { name: 'Jonas', emoji: '🧑‍🏫', role: 'Lehrer' },
  { name: 'Yuki', emoji: '🧑‍✈️', role: 'Pilotin' },
  { name: 'Samir', emoji: '🧑‍⚕️', role: 'Arzt' },
  { name: 'Elin', emoji: '👩‍🌾', role: 'Gärtnerin' },
]

/** Geschichten je Modus – so wirkt es wie eine Bitte und nicht wie Frage Nummer 284 */
const STORIES: Record<string, string[]> = {
  flaggen: [
    'Meine Nichte klebt Flaggen in ein Album und ist bei einer hängengeblieben.',
    'Im Laden hängt eine Flagge, und keiner von uns weiß, wozu sie gehört.',
  ],
  'higher-lower': [
    'Wir wetten gerade im Café, welches Land mehr Menschen hat.',
    'Für meinen Vortrag muss ich zwei Länder vergleichen und komme nicht weiter.',
  ],
  geschichte: [
    'Ich streite mich mit meinem Bruder über eine Jahreszahl.',
    'Für die Stadtchronik fehlt mir ein Datum.',
  ],
  personen: [
    'In der Zeitung war ein Foto ohne Bildunterschrift.',
    'Wir hängen eine Ahnengalerie auf und wissen bei einem Bild nicht weiter.',
  ],
  weltkarte: [
    'Ich plane eine Reise und finde das Land auf der Karte nicht.',
    'Meine Schüler fragen, wo das liegt – und ich bin mir unsicher.',
  ],
}

const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]

/**
 * Sucht eine Bitte. Fragen mit eigener Eingabe (Zeitstrahl, Karte) bleiben außen vor –
 * in einer kleinen Sprechblase braucht es Antwortknöpfe.
 */
export function makeRequest(data: SaveData, buildingId: string, now = Date.now()): CityRequest | null {
  for (let versuch = 0; versuch < 6; versuch++) {
    const mode = pickRandomMode(data, [])
    if (!mode) continue
    const question = mode.nextQuestion(data, [])
    if (!question || question.input || question.options.length < 2) continue
    const citizen = pick(PEOPLE)
    const story = pick(STORIES[mode.id] ?? ['Kannst du mir kurz helfen?'])
    return {
      id: `r${now}`,
      citizen,
      story,
      modeId: mode.id,
      question,
      buildingId,
      at: now,
    }
  }
  return null
}

/** Ist eine neue Bitte fällig? Gibt sie zurück, sonst null. */
export function dueRequest(data: SaveData, now = Date.now()): CityRequest | null {
  const city = data.city
  if (!city || city.request) return null
  if (now - city.lastRequest < REQUEST_PAUSE) return null
  const wohnhaeuser = city.buildings.filter((placed) => buildingDef(placed.type)?.category === 'wohnen')
  const zuhause = wohnhaeuser.length > 0 ? pick(wohnhaeuser) : city.buildings[0]
  if (!zuhause) return null
  return makeRequest(data, zuhause.id, now)
}

/** Prüft die Antwort auf eine Bitte */
export function judgeRequest(request: CityRequest, picked: string): boolean {
  const mode = getMode(request.modeId)
  const judged = mode?.judge?.(request.question, picked, 0)
  return judged ? judged.correct : picked === request.question.correctId
}

/** Geprüfte Fassung aus dem Speicher – alles Unbekannte fliegt raus */
export function sanitizeRequest(value: unknown): CityRequest | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Record<string, unknown>
  const citizen = raw.citizen as Citizen | undefined
  const question = raw.question as ModeQuestion | undefined
  if (typeof raw.id !== 'string' || typeof raw.modeId !== 'string' || typeof raw.buildingId !== 'string') return null
  if (!citizen || typeof citizen.name !== 'string' || typeof citizen.emoji !== 'string') return null
  if (!question || typeof question.correctId !== 'string' || !Array.isArray(question.options)) return null
  if (question.options.length < 2) return null
  if (!getMode(raw.modeId)) return null
  return {
    id: raw.id,
    citizen: { name: citizen.name.slice(0, 20), emoji: citizen.emoji.slice(0, 4), role: String(citizen.role ?? '') },
    story: typeof raw.story === 'string' ? raw.story.slice(0, 160) : '',
    modeId: raw.modeId,
    question,
    buildingId: raw.buildingId,
    at: typeof raw.at === 'number' ? raw.at : 0,
  }
}
