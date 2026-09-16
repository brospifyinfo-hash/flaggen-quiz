import { useState } from 'react'
import { EVENTS, TIMELINE_MAX, TIMELINE_MIN, formatYear, type HistoryEvent } from '../data/history'
import { haptic } from '../haptics'
import { accuracyOf, modeProgress, xpForAnswer } from '../progression'
import { shuffle } from '../quiz'
import type { Judgement, ModeProgress, ModeQuestion, QuestionInput, TimelineInput } from '../types'
import type { QuizMode } from './registry'

export const HISTORY_MODE_ID = 'geschichte'

/** So weit müssen zwei Ereignisse auseinanderliegen, damit die Reihenfolge eindeutig ist */
const MIN_ORDER_GAP = 20
/** Anteil der Reihenfolge-Fragen */
const ORDER_SHARE = 0.25
/** Der Zeitstrahl zeigt pro Frage diesen Ausschnitt */
const SPAN = 300
/** So weit bleibt die Lösung mindestens vom Rand entfernt */
const EDGE = 25

const BY_ID = new Map(EVENTS.map((event) => [event.id, event]))

/** Wie nah man am richtigen Jahr sein muss, damit die Antwort als richtig zählt */
const toleranceFor = (year: number) =>
  year < -500 ? 100 : year < 500 ? 60 : year < 1500 ? 30 : year < 1800 ? 15 : year < 1900 ? 8 : year < 1960 ? 4 : 2

/** Ausschnitt um das Ereignis – die Lösung liegt zufällig darin, nie in der Mitte festgenagelt */
function windowFor(year: number): TimelineInput {
  const offset = EDGE + Math.floor(Math.random() * (SPAN - EDGE * 2))
  let min = year - offset
  let max = min + SPAN
  if (max > TIMELINE_MAX) {
    max = TIMELINE_MAX
    min = max - SPAN
  }
  if (min < TIMELINE_MIN) {
    min = TIMELINE_MIN
    max = min + SPAN
  }
  return { kind: 'timeline', min, max }
}

const pickEvent = (recent: Set<string>): HistoryEvent => {
  const pool = EVENTS.filter((event) => !recent.has(event.id))
  const list = pool.length > 10 ? pool : EVENTS
  return list[Math.floor(Math.random() * list.length)]
}

function timelineQuestion(event: HistoryEvent): ModeQuestion {
  return {
    modeId: HISTORY_MODE_ID,
    key: `${HISTORY_MODE_ID}:y:${event.id}`,
    prompt: 'Wann war das? Stell den Zeitstrahl ein.',
    data: { kind: 'year', event: event.id },
    options: [],
    correctId: String(event.year),
    input: windowFor(event.year),
  }
}

const averageError = (progress: ModeProgress) => {
  const count = progress.extra?.errorCount ?? 0
  return count > 0 ? (progress.extra?.errorSum ?? 0) / count : 0
}

const plural = (years: number) => (years === 1 ? 'Jahr' : 'Jahre')

const positionIn = (year: number, input?: QuestionInput) => {
  const min = input?.kind === 'timeline' ? input.min : TIMELINE_MIN
  const max = input?.kind === 'timeline' ? input.max : TIMELINE_MAX
  const clamped = Math.min(max, Math.max(min, year))
  return Math.min(96, Math.max(4, ((clamped - min) / (max - min)) * 100))
}

export const historyMode: QuizMode = {
  id: HISTORY_MODE_ID,
  name: 'Geschichte',
  emoji: '⏳',
  tagline: 'Ordne Ereignisse auf dem Zeitstrahl ein',

  nextQuestion(_data, recentKeys) {
    const recent = new Set(
      recentKeys
        .filter((key) => key.startsWith(`${HISTORY_MODE_ID}:`))
        .flatMap((key) => key.split(':')[2]?.split('|') ?? []),
    )
    const first = pickEvent(recent)
    if (Math.random() >= ORDER_SHARE) return timelineQuestion(first)

    let second = pickEvent(recent)
    for (let attempt = 0; attempt < 40 && Math.abs(second.year - first.year) < MIN_ORDER_GAP; attempt++) {
      second = pickEvent(recent)
    }
    if (Math.abs(second.year - first.year) < MIN_ORDER_GAP) return timelineQuestion(first)

    const [a, b] = shuffle([first, second])
    return {
      modeId: HISTORY_MODE_ID,
      key: `${HISTORY_MODE_ID}:o:${[a.id, b.id].sort().join('|')}`,
      prompt: 'Was passierte früher?',
      data: { kind: 'order', a: a.id, b: b.id },
      options: [
        { id: a.id, label: a.title },
        { id: b.id, label: b.title },
      ],
      correctId: a.year < b.year ? a.id : b.id,
    }
  },

  // Punkte nach Nähe: je dichter am Jahr, desto mehr – ein Volltreffer gibt ein Vielfaches
  judge(question, picked, combo): Judgement {
    if (question.data.kind !== 'year') {
      const right = picked === question.correctId
      return {
        correct: right,
        xp: right ? xpForAnswer(combo) : 0,
        headline: right ? 'Richtig!' : 'Leider falsch',
      }
    }

    const year = Number(question.correctId)
    const diff = Math.abs(Number(picked) - year)
    const tolerance = toleranceFor(year)
    const comboBonus = Math.min(combo, 10) * 2

    if (diff === 0) return { correct: true, xp: 120 + comboBonus * 2, headline: 'Volltreffer!' }
    if (diff <= tolerance) {
      const share = 1 - diff / (tolerance + 1)
      return {
        correct: true,
        xp: Math.round(15 + share * 25) + comboBonus,
        headline: `Sehr nah dran: ${diff} ${plural(diff)} daneben`,
      }
    }
    if (diff <= tolerance * 4) return { correct: false, xp: 5, headline: `${diff} ${plural(diff)} daneben` }
    if (diff <= tolerance * 12) return { correct: false, xp: 2, headline: `${diff} ${plural(diff)} daneben` }
    return { correct: false, xp: 0, headline: `${diff} ${plural(diff)} daneben` }
  },

  // Bei Zeitstrahl-Fragen zählen wir mit, wie weit daneben getippt wurde
  recordAnswer(data, question, picked, correct, now) {
    if (question.data.kind !== 'year') return data
    const event = BY_ID.get(question.data.event)
    if (!event) return data
    const before = modeProgress(data, HISTORY_MODE_ID)
    const extra = { ...(before.extra ?? {}) }
    const diff = Math.abs(Number(picked) - event.year)
    extra.errorSum = (extra.errorSum ?? 0) + diff
    extra.errorCount = (extra.errorCount ?? 0) + 1
    if (diff === 0) extra.exact = (extra.exact ?? 0) + 1
    if (correct) extra.close = (extra.close ?? 0) + 1
    return { ...data, modes: { ...data.modes, [HISTORY_MODE_ID]: { ...before, extra, lastPlayed: now } } }
  },

  mastery(data) {
    const progress = modeProgress(data, HISTORY_MODE_ID)
    if (progress.answered === 0) return 0
    const errors = progress.extra?.errorCount ?? 0
    const precision = errors > 0 ? 1 - Math.min(1, averageError(progress) / 40) : accuracyOf(progress)
    const experience = Math.min(1, progress.answered / 40)
    return (accuracyOf(progress) * 0.6 + precision * 0.4) * experience
  },

  summary(data) {
    const progress = modeProgress(data, HISTORY_MODE_ID)
    const errors = progress.extra?.errorCount ?? 0
    return [
      { label: 'Ereignisse', value: `${progress.answered}` },
      {
        label: 'Ø Jahresabweichung',
        value: errors > 0 ? `${averageError(progress).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Jahre` : '–',
      },
      { label: 'Volltreffer', value: `${progress.extra?.exact ?? 0}` },
      { label: 'Trefferquote', value: progress.answered > 0 ? `${Math.round(accuracyOf(progress) * 100)} %` : '–' },
    ]
  },

  renderQuestion: (question) =>
    question.data.kind === 'order' ? (
      <div className="events">
        <span className="events-symbol" aria-hidden="true">
          ⏳
        </span>
      </div>
    ) : (
      <div className="events">
        <EventCard id={question.data.event} big />
      </div>
    ),

  // Zeitstrahl statt Antwortknöpfen
  renderInput: (question, picked, submit) =>
    question.data.kind === 'year' && picked === null && question.input?.kind === 'timeline' ? (
      <Timeline input={question.input} onSubmit={submit} />
    ) : null,

  renderFeedback: (question, picked) => {
    if (question.data.kind === 'order') {
      const a = BY_ID.get(question.data.a)
      const b = BY_ID.get(question.data.b)
      if (!a || !b) return null
      return (
        <>
          <p className="sheet-hint">
            <strong>{formatYear(a.year)}</strong> {a.title}. {a.note}
          </p>
          <p className="sheet-hint">
            <strong>{formatYear(b.year)}</strong> {b.title}. {b.note}
          </p>
        </>
      )
    }
    const event = BY_ID.get(question.data.event)
    if (!event) return null
    const guess = Number(picked)
    const hit = guess === event.year
    return (
      <>
        <div className="timeline-marks">
          {!hit && (
            <span className="timeline-mark is-guess" style={{ left: `${positionIn(guess, question.input)}%` }} />
          )}
          <span className="timeline-mark is-truth" style={{ left: `${positionIn(event.year, question.input)}%` }} />
        </div>
        <p className="timeline-legend">
          <span className="is-guess">Dein Tipp: {formatYear(guess)}</span>
          <span className="is-truth">Richtig: {formatYear(event.year)}</span>
        </p>
        <p className="sheet-hint">{event.note}</p>
      </>
    )
  },
}

function EventCard({ id, big = false }: { id: string; big?: boolean }) {
  const event = BY_ID.get(id)
  if (!event) return null
  return (
    <span className={`event-card${big ? ' is-big' : ''}`}>
      <strong>{event.title}</strong>
    </span>
  )
}

function Timeline({ input, onSubmit }: { input: TimelineInput; onSubmit: (answer: string) => void }) {
  const [year, setYear] = useState(() => Math.round((input.min + input.max) / 2))

  const change = (value: number) => {
    const next = Math.min(input.max, Math.max(input.min, value))
    if (next !== year) haptic('tick', { minGap: 45 })
    setYear(next)
  }

  return (
    <div className="timeline">
      <p className="timeline-year">
        {formatYear(year)}
        <small>dein Tipp</small>
      </p>
      <input
        className="timeline-range"
        type="range"
        min={input.min}
        max={input.max}
        step={1}
        value={year}
        aria-label="Jahr auf dem Zeitstrahl wählen"
        onChange={(event) => change(Number(event.target.value))}
      />
      <div className="timeline-scale">
        <span>{formatYear(input.min)}</span>
        <span>{formatYear(input.max)}</span>
      </div>
      <div className="timeline-fine">
        {[-10, -1, 1, 10].map((delta) => (
          <button key={delta} className="timeline-step" onClick={() => change(year + delta)}>
            {delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`}
          </button>
        ))}
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          haptic('strong')
          onSubmit(String(year))
        }}
      >
        Antwort abgeben
      </button>
    </div>
  )
}
