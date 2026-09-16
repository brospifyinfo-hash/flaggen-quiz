import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { CONTINENTS, COUNTRIES, type ContinentId } from '../data/countries'
import { CONTINENT_VIEWS, MAP_HEIGHT, MAP_WIDTH, SHAPES, type CountryShape } from '../data/map'
import { haptic } from '../haptics'
import { gradedMastery, pickSubject, recordLearn, solidCount } from '../learn'
import { distanceKm } from '../map-projection'
import { accuracyOf, modeProgress, xpForAnswer } from '../progression'
import { shuffle } from '../quiz'
import type { Judgement, MapInput, ModeProgress, ModeQuestion, SaveData } from '../types'
import type { QuizMode } from './registry'

export const MAP_MODE_ID = 'weltkarte'

/** Anteil der Fragen „Welches Land ist markiert?“ – der Rest wird auf der Karte gesucht */
const NAME_SHARE = 0.3
/** So viel Abstand hat das gesuchte Land mindestens zum Rand des Ausschnitts */
const VIEW_MARGIN = 16
/** Stärkste Vergrößerung: so schmal darf der Ausschnitt werden */
const MIN_SPAN = 10
/** So weit darf der Finger wandern, damit es noch ein Tipper und kein Schieben ist */
const TAP_SLOP = 10
/** Und so lange darf er dabei liegen bleiben */
const TAP_MS = 700

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

interface View {
  x: number
  y: number
  w: number
  h: number
}

function parseView(text: string): View {
  const parts = text.split(' ').map(Number)
  if (parts.length !== 4 || !parts.every((value) => Number.isFinite(value) && value >= 0)) {
    return { x: 0, y: 0, w: MAP_WIDTH, h: MAP_HEIGHT }
  }
  return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] }
}

/** Nie weiter heraus als der Ausschnitt der Frage und nie über dessen Rand hinaus */
function clampView(next: View, base: View): View {
  const w = Math.min(base.w, Math.max(MIN_SPAN, next.w))
  const h = w * (base.h / base.w)
  return {
    w,
    h,
    x: Math.min(base.x + base.w - w, Math.max(base.x, next.x)),
    y: Math.min(base.y + base.h - h, Math.max(base.y, next.y)),
  }
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

/** Luftlinie zwischen zwei Ländern */
const between = (a: CountryShape, b: CountryShape) => distanceKm(a.lat, a.lon, b.lat, b.lon)

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
      prompt: 'Wo liegt dieses Land?',
      data: { kind: 'find', code: shape.code, continent },
      options: [],
      correctId: shape.code,
      input: viewFor(shape.code),
    }
  },

  // Getroffen ist getroffen. Daneben gibt es Teilpunkte, je näher das angetippte Land liegt.
  judge(question, picked, combo): Judgement {
    const target = BY_CODE.get(question.correctId)
    if (!target || question.data.kind !== 'find') {
      const right = picked === question.correctId
      return { correct: right, xp: right ? xpForAnswer(combo) : 0, headline: right ? 'Richtig!' : 'Leider falsch' }
    }
    if (picked === target.code) return { correct: true, xp: xpForAnswer(combo) + 5, headline: 'Volltreffer!' }

    const other = BY_CODE.get(picked)
    if (!other) return { correct: false, xp: 0, headline: 'Leider falsch' }
    const distance = between(other, target)
    if (distance <= 800) return { correct: false, xp: 5, headline: `Knapp daneben: ${km(distance)}` }
    if (distance <= 2500) return { correct: false, xp: 3, headline: `${km(distance)} daneben` }
    if (distance <= 6000) return { correct: false, xp: 1, headline: `${km(distance)} daneben` }
    return { correct: false, xp: 0, headline: `${km(distance)} daneben` }
  },

  recordAnswer(data, question, picked, correct, now): SaveData {
    const next = recordLearn(data, MAP_MODE_ID, question.data.code, correct, now)
    const target = BY_CODE.get(question.correctId)
    if (!target || question.data.kind !== 'find') return next

    const other = BY_CODE.get(picked)
    const before = modeProgress(next, MAP_MODE_ID)
    const extra = { ...(before.extra ?? {}) }
    extra.distSum = (extra.distSum ?? 0) + (other ? between(other, target) : 0)
    extra.distCount = (extra.distCount ?? 0) + 1
    if (picked === target.code) extra.hits = (extra.hits ?? 0) + 1
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

  // Der Name steht für sich, statt in einem Satz – so stimmt es auch bei „die Niederlande“
  renderQuestion: (question) =>
    question.data.kind === 'name' ? (
      <div className="map-frame is-static">
        <MapCanvas view={viewFor(question.data.code).view} highlight={question.data.code} />
      </div>
    ) : (
      <p className="map-target">{NAME.get(question.data.code) ?? question.data.code}</p>
    ),

  renderInput: (question, picked, submit) =>
    question.input?.kind === 'map' ? (
      <MapBoard key={question.key} question={question} view={question.input.view} picked={picked} submit={submit} />
    ) : null,

  renderFeedback: (question, picked) => {
    const name = NAME.get(question.data.code) ?? ''
    const continent = CONTINENT_NAME.get(question.data.continent as ContinentId) ?? ''
    const target = BY_CODE.get(question.data.code)
    const other = BY_CODE.get(picked)
    const found = <p className="sheet-hint">{`${name} · ${continent}`}</p>
    if (question.data.kind === 'name' || picked === question.data.code || !target || !other) return found
    return (
      <>
        <p className="sheet-hint">{`Dein Tipp: ${NAME.get(other.code) ?? other.code} · ${km(between(other, target))} daneben`}</p>
        <p className="sheet-hint">{`Gesucht: ${name} · ${continent}`}</p>
      </>
    )
  },
}

// ---------- Anzeige ----------

// Die Umrisse ändern sich nie: einmal erzeugt, spart das Arbeit bei jeder Frage
const BASE_PATHS = SHAPES.map((shape) => (
  <path key={shape.code} className="map-country" d={shape.d} data-code={shape.code} />
))

interface Gestures {
  onPointerDown: (event: ReactPointerEvent<SVGSVGElement>) => void
  onPointerMove: (event: ReactPointerEvent<SVGSVGElement>) => void
  onPointerUp: (event: ReactPointerEvent<SVGSVGElement>) => void
  onPointerCancel: (event: ReactPointerEvent<SVGSVGElement>) => void
}

function MapCanvas({
  view,
  highlight,
  children,
  handlers,
}: {
  view: string
  highlight?: string
  children?: ReactNode
  handlers?: Gestures
}) {
  const target = highlight ? BY_CODE.get(highlight) : undefined
  return (
    <svg className="map-svg" viewBox={view} preserveAspectRatio="xMidYMid meet" {...handlers}>
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

function MapBoard({ question, view: viewText, picked, submit }: BoardProps) {
  const base = parseView(viewText)
  const [view, setView] = useState<View>(base)
  const [choice, setChoice] = useState('')
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef({ startedAt: 0, moved: 0, pinch: 0, from: base })

  const answered = picked !== null
  const target = BY_CODE.get(question.data.code)
  const chosen = BY_CODE.get(answered ? (picked as string) : choice)
  const wrong = answered && chosen && target && chosen.code !== target.code ? chosen : null

  /** factor < 1 vergrößert. Ohne Ankerpunkt wird um die Mitte gezoomt. */
  const zoom = (factor: number, anchorX?: number, anchorY?: number, rect?: DOMRect, from?: View) => {
    setView((current) => {
      const source = from ?? current
      const next = clampView({ ...source, w: source.w * factor }, base)
      if (!rect || anchorX === undefined || anchorY === undefined) {
        return clampView({ ...next, x: source.x + (source.w - next.w) / 2, y: source.y + (source.h - next.h) / 2 }, base)
      }
      // Der Punkt unter den Fingern soll liegen bleiben
      const atX = source.x + (anchorX / rect.width) * source.w
      const atY = source.y + (anchorY / rect.height) * source.h
      return clampView(
        { ...next, x: atX - (anchorX / rect.width) * next.w, y: atY - (anchorY / rect.height) * next.h },
        base,
      )
    })
  }

  const down = (event: ReactPointerEvent<SVGSVGElement>) => {
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // ohne echten Zeiger gibt es nichts einzufangen
    }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.current.size === 1) {
      gesture.current = { startedAt: performance.now(), moved: 0, pinch: 0, from: view }
      return
    }
    const [a, b] = [...pointers.current.values()]
    gesture.current.pinch = Math.hypot(a.x - b.x, a.y - b.y)
    gesture.current.from = view
    // Zwei Finger sind nie ein Tipper
    gesture.current.moved = 999
  }

  const move = (event: ReactPointerEvent<SVGSVGElement>) => {
    const previous = pointers.current.get(event.pointerId)
    if (!previous) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const rect = event.currentTarget.getBoundingClientRect()

    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const spread = Math.hypot(a.x - b.x, a.y - b.y)
      if (gesture.current.pinch > 0 && spread > 0) {
        zoom(
          gesture.current.pinch / spread,
          (a.x + b.x) / 2 - rect.left,
          (a.y + b.y) / 2 - rect.top,
          rect,
          gesture.current.from,
        )
      }
      return
    }

    const dx = event.clientX - previous.x
    const dy = event.clientY - previous.y
    gesture.current.moved += Math.abs(dx) + Math.abs(dy)
    if (gesture.current.moved < TAP_SLOP) return
    setView((current) =>
      clampView(
        { ...current, x: current.x - (dx / rect.width) * current.w, y: current.y - (dy / rect.height) * current.h },
        base,
      ),
    )
  }

  const up = (event: ReactPointerEvent<SVGSVGElement>) => {
    const had = pointers.current.delete(event.pointerId)
    if (pointers.current.size > 0) {
      gesture.current.pinch = 0
      return
    }
    if (!had || answered) return
    if (gesture.current.moved >= TAP_SLOP || performance.now() - gesture.current.startedAt > TAP_MS) return

    const element = document.elementFromPoint(event.clientX, event.clientY)
    const code = element?.getAttribute('data-code') ?? ''
    if (code === choice) return
    setChoice(code)
    haptic(code ? 'tick' : 'soft')
  }

  return (
    <div className="map-board">
      <div className="map-frame">
        <MapCanvas
          view={`${round1(view.x)} ${round1(view.y)} ${round1(view.w)} ${round1(view.h)}`}
          handlers={{ onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up }}
        >
          {chosen && !wrong && <path className="map-country is-choice" d={chosen.d} data-code={chosen.code} />}
          {wrong && <path className="map-country is-wrong" d={wrong.d} data-code={wrong.code} />}
          {answered && target && <path className="map-country is-target" d={target.d} data-code={target.code} />}
        </MapCanvas>
        <div className="map-zoom">
          <button aria-label="Näher heran" onClick={() => zoom(1 / 1.8)}>
            +
          </button>
          <button aria-label="Weiter weg" onClick={() => zoom(1.8)}>
            −
          </button>
        </div>
      </div>
      {!answered && (
        <button
          className="btn btn-primary"
          aria-disabled={!choice}
          onClick={() => {
            if (!choice) return
            haptic('strong')
            submit(choice)
          }}
        >
          {choice ? 'Bestätigen' : 'Tippe auf ein Land'}
        </button>
      )}
    </div>
  )
}
