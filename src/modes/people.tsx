import { PEOPLE, type Person } from '../data/people'
import { gradedMastery, pickSubject, recordLearn, seenCount, solidCount } from '../learn'
import { accuracyOf, modeProgress } from '../progression'
import { shuffle } from '../quiz'
import type { QuizMode } from './registry'

export const PEOPLE_MODE_ID = 'personen'

const BY_ID = new Map(PEOPLE.map((person) => [person.id, person]))
const IDS = PEOPLE.map((person) => person.id)

/** erstes Wort des Steckbriefs, z. B. „fußballer“ – dient als Stichwort für ähnliche Antworten */
const keywordOf = (person: Person) => person.role.toLowerCase().split(/[\s,]+/)[0].replace(/[^a-zäöüß-]/g, '')

/** Drei falsche Antworten: bevorzugt Leute aus demselben Fach */
function distractors(person: Person): string[] {
  const keyword = keywordOf(person)
  const picks: string[] = []
  for (const other of shuffle(PEOPLE)) {
    if (picks.length >= 2) break
    if (other.id === person.id) continue
    if (keyword.length > 3 && keywordOf(other) === keyword) picks.push(other.id)
  }
  for (const other of shuffle(PEOPLE)) {
    if (picks.length >= 3) break
    if (other.id === person.id || picks.includes(other.id)) continue
    picks.push(other.id)
  }
  return picks
}

export const peopleMode: QuizMode = {
  id: PEOPLE_MODE_ID,
  name: 'Berühmte Personen',
  emoji: '👤',
  tagline: 'Erkenne berühmte Persönlichkeiten',

  nextQuestion(data, recentKeys) {
    const recent = recentKeys
      .filter((key) => key.startsWith(`${PEOPLE_MODE_ID}:`))
      .map((key) => key.slice(PEOPLE_MODE_ID.length + 1))
    const id = pickSubject(IDS, data, PEOPLE_MODE_ID, recent)
    const person = id ? BY_ID.get(id) : null
    if (!person) return null

    const options = shuffle([person.id, ...distractors(person)]).map((entry) => ({
      id: entry,
      label: BY_ID.get(entry)?.name ?? entry,
    }))

    return {
      modeId: PEOPLE_MODE_ID,
      key: `${PEOPLE_MODE_ID}:${person.id}`,
      prompt: 'Wer ist das?',
      data: { person: person.id },
      options,
      correctId: person.id,
    }
  },

  recordAnswer: (data, question, _picked, correct, now) =>
    recordLearn(data, PEOPLE_MODE_ID, question.data.person, correct, now),

  // Teilwissen zählt mit, sonst bewegt sich die Mastery viel zu langsam
  mastery: (data) => gradedMastery(data, PEOPLE_MODE_ID, IDS),

  summary(data) {
    const progress = modeProgress(data, PEOPLE_MODE_ID)
    return [
      { label: 'Personen gesehen', value: `${seenCount(data, PEOPLE_MODE_ID)} / ${PEOPLE.length}` },
      { label: 'Sicher erkannt', value: `${solidCount(data, PEOPLE_MODE_ID)}` },
      { label: 'Beste Combo', value: `${progress.bestCombo}` },
      { label: 'Trefferquote', value: progress.answered > 0 ? `${Math.round(accuracyOf(progress) * 100)} %` : '–' },
    ]
  },

  renderQuestion: (question) => (
    <div className="portrait" role="img" aria-label="Porträt">
      <img src={`/people/${question.data.person}.webp`} alt="" draggable={false} />
    </div>
  ),

  renderFeedback: (question) => {
    const person = BY_ID.get(question.data.person)
    if (!person) return null
    return (
      <>
        <p className="sheet-hint">
          <strong>{person.name}</strong> · {person.role}
        </p>
        <p className="credit">
          Foto: {person.credit.author} · {person.credit.license} · Wikimedia Commons
        </p>
      </>
    )
  },
}
