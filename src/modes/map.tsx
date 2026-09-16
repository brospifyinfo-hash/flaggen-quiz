import { useState, type PointerEvent, type ReactNode } from 'react'
import { CONTINENTS, COUNTRIES, type ContinentId } from '../data/countries'
import { CONTINENT_VIEWS, MAP_DX, MAP_DY, MAP_HEIGHT, MAP_SCALE, MAP_WIDTH, SHAPES, type CountryShape } from '../data/map'
import { haptic } from '../haptics'
import { gradedMastery, pickSubject, recordLearn, solidCount } from '../learn'
import { distanceKm, mapToLatLon } from '../map-projection'
import { accuracyOf, modeProgress, xpForAnswer } from '../progression'
import { shuffle } from '../quiz'
import type { Judgement, MapInput, ModeProgress, ModeQuestion, SaveData } from '../types'
import type { QuizMode } from './registry'

export const MAP_MODE_ID = 'weltkarte'

/** Anteil der Fragen „Welches Land ist markiert?“ – der Rest wird auf der Karte gesucht */
const NAME_SHARE = 0.3
/** Länder mit weniger Fläche gelten als klein: dort zählt auch ein Tipper knapp daneben */
const SMALL_AREA = 60
/** So viel Abstand hat das gesuchte Land mindestens zum Rand des Ausschnitts */
const VIEW_MARGIN = 16

const BY_CODE = new Map(SHAPES.map((shape) => [shape.code, shape]))
const IDS = SHAPES.map((shape) => shape.code)
const NAME = new Map(COUNTRIES.map((country) => [country.code, country.name]))
const CONTINENT_OF = new Map(COUNTRIES.map((country) => [country.code, country.continent]))
const CONTINENT_NAME = new Map(CONTINENTS.map((continent) => [continent.id, continent.name]))

const round1 = (value: number) => Math.round(value * 10) / 10
const km = (value: number) => `${Math.round(value).toLocaleString('de-DE')} km`

/** Ausschnitt einer Frage: der Kontinent – notfalls erweitert, damit das Land sicher darin liegt */
export function viewFor(code: string): MapInput {
  const shape = BY_CODE.get(code)
  const continent = CONTINENT_OF.get(code)
  const base = continent ? CONTINENT_VIEWS[continent] : undefined
  if (!shape || !base) return { kind: 'map', view: `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}` }

  let [x0, y0, x1, y1] = base
  if (shape.cx - VIEW_MARGIN < x0) x0 = shape.cx - VIEW_MARGIN
  if (shape.cx + VIEW_MARGIN > x1) x1 = shape.cx + VIEW_MARGIN
  if (shape.cy - VIEW_MARGIN < y0) y0 = shape.cy - VIEW_MARGIN
  if (shape.cy + VIEW_MARGIN > y1) y1 = shape.cy + VIEW_MARGIN
  x0 = Math.max(0, x0)
  y0 = Math.max(0, y0)
  x1 = Math.min(MAP_WIDTH, x1)
  y1 = Math.min(MAP_HEIGHT, y1)
  return { kind: 'map', view: `${round1(x0)} ${round1(y0)} ${round1(x1 - x0)} ${round1(y1 - y0)}` }
}

function sizeOf(view: string): [number, number, number, number] {
  const parts = view.split(' ').map(Number)
  return parts.length === 4 && parts.every((value) => Number.isFinite(value))
    ? (parts as [number, number, number, number])
    : [0, 0, MAP_WIDTH, MAP_HEIGHT]
}

/** Je größer der Ausschnitt, desto gröber trifft der Finger – die Toleranz wächst mit */
function toleranceKm(view: string): number {
  const [, , width] = sizeOf(view)
  return Math.min(600, Math.max(150, (width / MAP_WIDTH) * 2000))
}

/** Ein Tipper auf der Karte: Punkt im Kartensystem und das Land darunter (leer = Wasser) */
interface Spot {
  x: number
  y: number
  code: string
}

const encodeSpot = (spot: Spot) => `${round1(spot.x)},${round1(spot.y)},${spot.code}`

function parseSpot(answer: string): Spot | null {
  const [x, y, code = ''] = answer.split(',')
  if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) return null
  return { x: Number(x), y: Number(y), code }
}

/** Luftlinie vom Tipper zum Mittelpunkt des gesuchten Landes */
function missKm(spot: Spot, target: CountryShape): number {
  const [lat, lon] = mapToLatLon(spot.x, spot.y, MAP_SCALE, MAP_DX, MAP_DY)
  return distanceKm(lat, lon, target.lat, target.lon)
}

/** Drei falsche Antworten: die nächsten Nachbarn desselben Kontinents */
function nameDistractors(shape: CountryShape): string[] {
  const continent = CONTINENT_OF.get(shape.code)
  const near = SHAPES.filter((other) => other.code !== shape.code && CONTINENT_OF.get(other.code) === continent).sort(
    (a, b) => distanceKm(a.lat, a.lon, shape.lat, shape.lon) - distanceKm(b.lat, b.lon, shape.lat, shape.lon),
  )
  const picks = shuffle(near.slice(0, 8))
    .slice(0, 3)
    .map((entry) => entry.code)
  for (const other of shuffle(SHAPES)) {
    if (picks.length >= 3) break
    if (other.code === shape.code || picks.includes(other.code)) continue
    picks.push(other.code)
  }
  return picks
}

const averageMiss = (progress: ModeProgress) => {
  const count = progress.extra?.distCount ?? 0
  return count > 0 ? (progress.extra?.distSum ?? 0) / count : 0
}

export const mapMode: QuizMode = {
  id: MAP_MODE_ID,
  name: 'Weltkarte',
  emoji: '🗺️',
  tagline: 'Finde Länder auf der Karte',

  nextQuestion(data, recentKeys) {
    const recent = recentKeys
      .filter((key) => key.startsWith(`${MAP_MODE_ID}:`))
      .map((key) => key.split(':')[2] ?? '')
    const code = pickSubject(IDS, data, MAP_MODE_ID, recent)
    const shape = code ? BY_CODE.get(code) : null
    if (!shape) return null
    const continent = CONTINENT_OF.get(shape.code) ?? ''
    const name = NAME.get(shape.code) ?? shape.code

    if (Math.random() < NAME_SHARE) {
      return {
        modeId: MAP_MODE_ID,
        key: `${MAP_MODE_ID}:name:${shape.code}`,
        prompt: 'Welches Land ist markiert?',
        data: { kind: 'name', code: shape.code, continent },
        options: shuffle([shape.code, ...nameDistractors(shape)]).map((entry) => ({
          id: entry,
          label: NAME.get(entry) ?? entry,
        })),
        correctId: shape.code,
      }
    }

    return {
      modeId: MAP_MODE_ID,
      key: `${MAP_MODE_ID}:find:${shape.code}`,
      prompt: `Wo liegt ${name}?`,
      data: { kind: 'find', code: shape.code, continent },
      options: [],
      correctId: shape.code,
      input: viewFor(shape.code),
    }
  },

  // Punkte nach Nähe: mitten im Land ist ein Volltreffer, knapp daneben gibt es Teilpunkte
  judge(question, picked, combo): Judgement {
    const target = BY_CODE.get(question.correctId)
    const spot = question.data.kind === 'find' ? parseSpot(picked) : null
    if (!target || !spot) {
      const right = picked === question.correctId
      return { correct: right, xp: right ? xpForAnswer(combo) : 0, headline: right ? 'Richtig!' : 'Leider falsch' }
    }

    if (spot.code === target.code) return { correct: true, xp: xpForAnswer(combo) + 5, headline: 'Volltreffer!' }

    const distance = missKm(spot, target)
    const tolerance = toleranceKm(question.input?.kind === 'map' ? question.input.view : '')
    // Kleine Länder trifft man kaum mittig – dort zählt auch der Tipper direkt daneben
    if (distance <= tolerance && (target.area < SMALL_AREA || spot.code === '')) {
      return { correct: true, xp: xpForAnswer(combo), headline: `Sehr nah: ${km(distance)}` }
    }
    if (distance <= tolerance) return { correct: false, xp: 5, headline: `Knapp daneben: ${km(distance)}` }
    if (distance <= tolerance * 4) return { correct: false, xp: 3, headline: `${km(distance)} daneben` }
    if (distance <= tolerance * 12) return { correct: false, xp: 1, headline: `${km(distance)} daneben` }
    return { correct: false, xp: 0, headline: `${km(distance)} daneben` }
  },

  recordAnswer(data, question, picked, correct, now): SaveData {
    const next = recordLearn(data, MAP_MODE_ID, question.data.code, correct, now)
    const target = BY_CODE.get(question.correctId)
    const spot = question.data.kind === 'find' ? parseSpot(picked) : null
    if (!target || !spot) return next

    const before = modeProgress(next, MAP_MODE_ID)
    const extra = { ...(before.extra ?? {}) }
    extra.distSum = (extra.distSum ?? 0) + missKm(spot, target)
    extra.distCount = (extra.distCount ?? 0) + 1
    if (spot.code === target.code) extra.hits = (extra.hits ?? 0) + 1
    return { ...next, modes: { ...next.modes, [MAP_MODE_ID]: { ...before, extra, lastPlayed: now } } }
  },

  mastery: (data) => gradedMastery(data, MAP_MODE_ID, IDS),

  summary(data) {
    const progress = modeProgress(data, MAP_MODE_ID)
    const tries = progress.extra?.distCount ?? 0
    return [
      { label: 'Länder gefunden', value: `${solidCount(data, MAP_MODE_ID)} / ${SHAPES.length}` },
      { label: 'Volltreffer', value: `${progress.extra?.hits ?? 0}` },
      { label: 'Ø Entfernung', value: tries > 0 ? km(averageMiss(progress)) : '–' },
      { label: 'Trefferquote', value: progress.answered > 0 ? `${Math.round(accuracyOf(progress) * 100)} %` : '–' },
    ]
  },

  renderQuestion: (question) =>
    question.data.kind === 'name' ? (
      <div className="map-frame is-static">
        <MapCanvas view={viewFor(question.data.code).view} highlight={question.data.code} />
      </div>
    ) : null,

  renderInput: (question, picked, submit) =>
    question.input?.kind === 'map' ? (
      <MapBoard question={question} view={question.input.view} picked={picked} submit={submit} />
    ) : null,

  renderFeedback: (question, picked) => {
    const name = NAME.get(question.data.code) ?? ''
    const continent = CONTINENT_NAME.get(question.data.continent as ContinentId) ?? ''
    if (question.data.kind === 'name') {
      return (
        <p className="sheet-hint">
          {name} liegt in {continent}.
        </p>
      )
    }

    const target = BY_CODE.get(question.data.code)
    const spot = parseSpot(picked)
    if (!target || !spot) return null
    if (spot.code === target.code) {
      return (
        <p className="sheet-hint">
          Genau in {name} – {continent}.
        </p>
      )
    }
    const where = spot.code ? `in ${NAME.get(spot.code) ?? 'einem anderen Land'}` : 'im Wasser'
    return (
      <p className="sheet-hint">
        Dein Tipp lag {where}, {km(missKm(spot, target))} von {name} entfernt ({continent}).
      </p>
    )
  },
}

// ---------- Anzeige ----------

// Die Umrisse ändern sich nie: einmal erzeugt, spart das Arbeit bei jeder Frage
const BASE_PATHS = SHAPES.map((shape) => (
  <path key={shape.code} className="map-country" d={shape.d} data-code={shape.code} />
))

function MapCanvas({
  view,
  highlight,
  onTap,
  children,
}: {
  view: string
  highlight?: string
  onTap?: (event: PointerEvent<SVGSVGElement>) => void
  children?: ReactNode
}) {
  const target = highlight ? BY_CODE.get(highlight) : undefined
  return (
    <svg className="map-svg" viewBox={view} preserveAspectRatio="xMidYMid meet" onPointerDown={onTap}>
      <rect className="map-sea" x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} />
      {BASE_PATHS}
      {target && <path className="map-country is-target" d={target.d} data-code={target.code} />}
      {children}
    </svg>
  )
}

interface BoardProps {
  question: ModeQuestion
  view: string
  picked: string | null
  submit: (answer: string) => void
}

function MapBoard({ question, view, picked, submit }: BoardProps) {
  const [spot, setSpot] = useState<Spot | null>(null)
  const answered = picked !== null
  const shown = answered ? parseSpot(picked) : spot
  const target = BY_CODE.get(question.data.code)
  const [, , width] = sizeOf(view)
  // Markierungen sollen bei jedem Ausschnitt gleich groß wirken
  const unit = width / 100

  const tap = (event: PointerEvent<SVGSVGElement>) => {
    const svg = event.currentTarget
    const matrix = svg.getScreenCTM()
    if (!matrix) return
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const local = point.matrixTransform(matrix.inverse())
    const code = (event.target as SVGElement).getAttribute?.('data-code') ?? ''
    setSpot({ x: local.x, y: local.y, code })
    haptic('tick', { minGap: 20 })
  }

  return (
    <div className="map-board">
      <div className="map-frame">
        <MapCanvas view={view} highlight={answered ? question.data.code : undefined} onTap={answered ? undefined : tap}>
          {answered && shown && target && (
            <line
              className="map-link"
              x1={shown.x}
              y1={shown.y}
              x2={target.cx}
              y2={target.cy}
              strokeWidth={unit * 0.5}
            />
          )}
          {shown && (
            <circle
              className={`map-pin${answered ? ' is-done' : ''}`}
              cx={shown.x}
              cy={shown.y}
              r={unit * 2.2}
              strokeWidth={unit * 0.9}
            />
          )}
          {answered && target && (
            <circle className="map-goal" cx={target.cx} cy={target.cy} r={unit * 1.6} strokeWidth={unit * 0.9} />
          )}
        </MapCanvas>
      </div>
      {!answered && (
        <button
          className="btn btn-primary"
          aria-disabled={!spot}
          onClick={() => {
            if (!spot) return
            haptic('strong')
            submit(encodeSpot(spot))
          }}
        >
          {spot ? 'Antwort abgeben' : 'Tippe auf die Karte'}
        </button>
      )}
    </div>
  )
}
