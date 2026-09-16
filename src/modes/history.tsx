import { EVENTS, formatYear, type HistoryEvent } from '../data/history'
import { accuracyOf, modeProgress } from '../progression'
import { shuffle } from '../quiz'
import type { ModeProgress, ModeQuestion } from '../types'
import type { QuizMode } from './registry'

export const HISTORY_MODE_ID = 'geschichte'

/** So weit müssen zwei Ereignisse auseinanderliegen, damit die Reihenfolge eindeutig ist */
const MIN_ORDER_GAP = 20
/** Anteil der Reihenfolge-Fragen */
const ORDER_SHARE = 0.3

const BY_ID = new Map(EVENTS.map((event) => [event.id, event]))
const THIS_YEAR = new Date().getFullYear()

/** Je weiter zurück, desto größer dürfen die falschen Jahreszahlen danebenliegen */
const spreadFor = (year: number) => (year < 0 ? 180 : year < 1000 ? 110 : year < 1800 ? 40 : year < 1950 ? 14 : 8)

function fakeYears(year: number): number[] {
  const spread = spreadFor(year)
  const minGap = Math.max(1, Math.round(spread / 5))
  const picked: number[] = []
  let guard = 0
  while (picked.length < 3 && guard++ < 300) {
    const direction = Math.random() < 0.5 ? -1 : 1
    const candidate = year + direction * (minGap + Math.floor(Math.random() * spread))
    if (candidate > THIS_YEAR || candidate === 0) continue
    if (Math.abs(candidate - year) < minGap) continue
    if (picked.some((other) => Math.abs(other - candidate) < minGap)) continue
    picked.push(candidate)
  }
  while (picked.length < 3) picked.push(year - (picked.length + 1) * Math.max(2, minGap))
  return picked
}

const pickEvent = (recent: Set<string>): HistoryEvent => {
  const pool = EVENTS.filter((event) => !recent.has(event.id))
  const list = pool.length > 10 ? pool : EVENTS
  return list[Math.floor(Math.random() * list.length)]
}

function yearQuestion(event: HistoryEvent): ModeQuestion {
  const years = shuffle([event.year, ...fakeYears(event.year)])
  return {
    modeId: HISTORY_MODE_ID,
    key: `${HISTORY_MODE_ID}:y:${event.id}`,
    prompt: 'In welchem Jahr war das?',
    data: { kind: 'year', event: event.id },
    options: years.map((year) => ({ id: String(year), label: formatYear(year) })),
    correctId: String(event.year),
  }
}

const averageError = (progress: ModeProgress) => {
  const count = progress.extra?.errorCount ?? 0
  return count > 0 ? (progress.extra?.errorSum ?? 0) / count : 0
}

export const historyMode: QuizMode = {
  id: HISTORY_MODE_ID,
  name: 'Geschichte',
  emoji: '⏳',
  tagline: 'Ordne Ereignisse in der Zeit ein',

  nextQuestion(_data, recentKeys) {
    const recent = new Set(
      recentKeys
        .filter((key) => key.startsWith(`${HISTORY_MODE_ID}:`))
        .flatMap((key) => key.split(':')[2]?.split('|') ?? []),
    )
    const first = pickEvent(recent)
    if (Math.random() >= ORDER_SHARE) return yearQuestion(first)

    let second = pickEvent(recent)
    for (let attempt = 0; attempt < 40 && Math.abs(second.year - first.year) < MIN_ORDER_GAP; attempt++) {
      second = pickEvent(recent)
    }
    if (Math.abs(second.year - first.year) < MIN_ORDER_GAP) return yearQuestion(first)

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

  // Bei Jahresfragen zählen wir mit, wie weit daneben getippt wurde
  recordAnswer(data, question, picked, correct, now) {
    if (question.data.kind !== 'year') return data
    const event = BY_ID.get(question.data.event)
    if (!event) return data
    const before = modeProgress(data, HISTORY_MODE_ID)
    const extra = { ...(before.extra ?? {}) }
    extra.errorSum = (extra.errorSum ?? 0) + Math.abs(Number(picked) - event.year)
    extra.errorCount = (extra.errorCount ?? 0) + 1
    if (correct) extra.exact = (extra.exact ?? 0) + 1
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
      { label: 'Perfekt eingeordnet', value: `${progress.extra?.exact ?? 0}` },
      { label: 'Trefferquote', value: progress.answered > 0 ? `${Math.round(accuracyOf(progress) * 100)} %` : '–' },
    ]
  },

  // Bei Reihenfolge-Fragen stehen die Ereignisse schon auf den Antwortknöpfen –
  // hier oben bleibt nur ein ruhiges Symbol, damit nichts doppelt steht.
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

  renderFeedback: (question) => {
    if (question.data.kind === 'order') {
      const a = BY_ID.get(question.data.a)
      const b = BY_ID.get(question.data.b)
      if (!a || !b) return null
      return (
        <p className="sheet-hint">
          {a.title}: {formatYear(a.year)} · {b.title}: {formatYear(b.year)}
        </p>
      )
    }
    const event = BY_ID.get(question.data.event)
    return event?.note ? <p className="sheet-hint">{event.note}</p> : null
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
