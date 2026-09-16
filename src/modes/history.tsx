import { useState } from 'react'
import { EVENTS, TIMELINE_MAX, TIMELINE_MIN, formatYear, type HistoryEvent } from '../data/history'
import { accuracyOf, modeProgress, xpForAnswer } from '../progression'
import { shuffle } from '../quiz'
import type { Judgement, ModeProgress, ModeQuestion } from '../types'
import type { QuizMode } from './registry'

export const HISTORY_MODE_ID = 'geschichte'

/** So weit müssen zwei Ereignisse auseinanderliegen, damit die Reihenfolge eindeutig ist */
const MIN_ORDER_GAP = 20
/** Anteil der Reihenfolge-Fragen */
const ORDER_SHARE = 0.25

const BY_ID = new Map(EVENTS.map((event) => [event.id, event]))

/** Wie nah man am richtigen Jahr sein muss, damit die Antwort als richtig zählt */
const toleranceFor = (year: number) =>
  year < -500 ? 100 : year < 500 ? 60 : year < 1500 ? 30 : year < 1800 ? 15 : year < 1900 ? 8 : year < 1960 ? 4 : 2

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
    input: { kind: 'timeline', min: TIMELINE_MIN, max: TIMELINE_MAX },
  }
}

const averageError = (progress: ModeProgress) => {
  const count = progress.extra?.errorCount ?? 0
  return count > 0 ? (progress.extra?.errorSum ?? 0) / count : 0
}

const plural = (years: number) => (years === 1 ? 'Jahr' : 'Jahre')
const clampYear = (year: number) => Math.min(TIMELINE_MAX, Math.max(TIMELINE_MIN, year))
const positionOf = (year: number) =>
  Math.min(97, Math.max(3, ((clampYear(year) - TIMELINE_MIN) / (TIMELINE_MAX - TIMELINE_MIN)) * 100))

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

    if (diff === 0) return { correct: true, xp: 120 + comboBonus * 2, headline: 'Volltreffer! Exakt das richtige Jahr' }
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
    question.data.kind === 'year' && picked === null ? <Timeline onSubmit={submit} /> : null,

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
    return (
      <>
        <div className="timeline-marks">
          <span className="timeline-mark is-guess" style={{ left: `${positionOf(guess)}%` }}>
            <span>Du: {formatYear(guess)}</span>
          </span>
          <span className="timeline-mark is-truth" style={{ left: `${positionOf(event.year)}%` }}>
            <span>{formatYear(event.year)}</span>
          </span>
        </div>
        <p className="sheet-text">
          Richtig: <strong>{formatYear(event.year)}</strong>
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

function Timeline({ onSubmit }: { onSubmit: (answer: string) => void }) {
  const [year, setYear] = useState(1500)
  const step = (delta: number) => setYear((current) => clampYear(current + delta))

  return (
    <div className="timeline">
      <p className="timeline-year">
        {formatYear(year)}
        <small>dein Tipp</small>
      </p>
      <input
        className="timeline-range"
        type="range"
        min={TIMELINE_MIN}
        max={TIMELINE_MAX}
        step={1}
        value={year}
        aria-label="Jahr auf dem Zeitstrahl wählen"
        onChange={(event) => setYear(Number(event.target.value))}
      />
      <div className="timeline-scale">
        <span>{formatYear(TIMELINE_MIN)}</span>
        <span>{TIMELINE_MAX}</span>
      </div>
      <div className="timeline-fine">
        {[-100, -10, -1, 1, 10, 100].map((delta) => (
          <button key={delta} className="timeline-step" onClick={() => step(delta)}>
            {delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`}
          </button>
        ))}
      </div>
      <button className="btn btn-primary" onClick={() => onSubmit(String(year))}>
        Antwort abgeben
      </button>
    </div>
  )
}
