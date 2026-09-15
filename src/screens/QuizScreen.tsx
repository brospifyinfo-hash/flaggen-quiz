import { useEffect, useRef, useState } from 'react'
import { Flag } from '../components/Flag'
import { IconCheck, IconClose, IconCross } from '../components/Icons'
import { vibrate } from '../haptics'
import { requestPersistentStorage } from '../pwa'
import { answerQuestion, countryName, getContinent, nextQuestion, sessionKey } from '../quiz'
import { goBack, navigate } from '../router'
import { getState, setState } from '../store'
import type { Mode, Question, Session } from '../types'

/** So lange bleibt eine richtige Antwort grün stehen, bevor die nächste Flagge kommt */
const AUTO_NEXT_MS = 850
/** Schutz davor, dass ein Doppeltipp die Auflösung sofort wegklickt */
const SHEET_TAP_GUARD_MS = 450

export function QuizScreen({ session }: { session: Session }) {
  const { continent: id, mode, current } = session
  const answered = current.picked !== null
  const correct = current.picked === current.code
  const questionIndex = session.answered - (answered ? 1 : 0)
  const total = session.round.length
  const progress = mode === 'test' ? session.answered : session.done.length

  // true, solange eine eben gegebene richtige Antwort automatisch weiterläuft
  const [autoNext, setAutoNext] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // nächste Flagge schon laden, damit der Wechsel ohne Flackern passiert
  const upcoming = session.queue[0]
  useEffect(() => {
    if (upcoming) new Image().src = `/flags/${upcoming}.svg`
  }, [upcoming])

  const goNext = () => {
    window.clearTimeout(timer.current)
    setAutoNext(false)
    setState((data) => nextQuestion(data, id, mode))
    if (!getState().sessions[sessionKey(id, mode)]) navigate({ name: 'result', id, mode }, { replace: true })
  }

  const pick = (code: string) => {
    if (answered) return
    setState((data) => answerQuestion(data, id, mode, code))
    requestPersistentStorage()
    if (code === current.code) {
      vibrate(15)
      setAutoNext(true)
      timer.current = window.setTimeout(goNext, AUTO_NEXT_MS)
    } else {
      vibrate([40, 70, 40])
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (!answered && /^[1-4]$/.test(event.key)) {
        pick(current.options[Number(event.key) - 1])
      } else if (answered && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <main className="quiz">
      <header className="quiz-top">
        <button className="icon-btn" aria-label="Quiz verlassen" onClick={() => goBack({ name: 'continent', id })}>
          <IconClose />
        </button>
        <div
          className="quiz-progress"
          role="progressbar"
          aria-label="Fortschritt"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={progress}
        >
          <span style={{ width: `${(progress / total) * 100}%` }} />
        </div>
        <span className="quiz-count">
          {progress}/{total}
        </span>
      </header>

      <div className="quiz-meta">
        <span className={`chip${mode === 'test' ? ' chip-test' : ''}`}>
          {mode === 'test' ? 'Abschlusstest' : 'Übung'} · {getContinent(id).name}
        </span>
        {mode === 'test' && session.mistakes.length > 0 && (
          <span className="chip chip-bad">{session.mistakes.length} Fehler</span>
        )}
      </div>

      <div className="stage" key={`flag-${questionIndex}`} role="img" aria-label="Flagge">
        <Flag code={current.code} />
      </div>

      <p className="question">Welches Land ist das?</p>

      <div className="options" key={`options-${questionIndex}`}>
        {current.options.map((code) => {
          const isAnswer = code === current.code
          const isPicked = code === current.picked
          const state = !answered ? '' : isAnswer ? ' is-correct' : isPicked ? ' is-wrong' : ' is-dim'
          return (
            <button key={code} className={`option${state}`} aria-disabled={answered} onClick={() => pick(code)}>
              <span>{countryName(code)}</span>
              {answered && isAnswer && <IconCheck className="option-mark" />}
              {answered && isPicked && !isAnswer && <IconCross className="option-mark" />}
            </button>
          )
        })}
      </div>

      {answered && !(correct && autoNext) && (
        <FeedbackSheet question={current} mode={mode} firstTestMistake={session.mistakes.length === 1} onNext={goNext} />
      )}
    </main>
  )
}

interface SheetProps {
  question: Question
  mode: Mode
  firstTestMistake: boolean
  onNext: () => void
}

function FeedbackSheet({ question, mode, firstTestMistake, onNext }: SheetProps) {
  const shownAt = useRef(0)
  const button = useRef<HTMLButtonElement>(null)
  const correct = question.picked === question.code

  useEffect(() => {
    shownAt.current = performance.now()
    button.current?.focus({ preventScroll: true })
  }, [])

  const handleNext = () => {
    if (performance.now() - shownAt.current < SHEET_TAP_GUARD_MS) return
    onNext()
  }

  return (
    <div className={`sheet ${correct ? 'sheet-good' : 'sheet-bad'}`} role="status" aria-live="assertive">
      <p className="sheet-title">
        {correct ? <IconCheck /> : <IconCross />}
        {correct ? 'Richtig!' : 'Leider falsch'}
      </p>
      {correct ? (
        <p className="sheet-text">
          Das ist <strong>{countryName(question.code)}</strong>.
        </p>
      ) : (
        <>
          <p className="sheet-text">
            Richtig ist <strong>{countryName(question.code)}</strong>.
          </p>
          <div className="sheet-compare">
            <span className="sheet-compare-flag">
              <Flag code={question.picked!} />
            </span>
            <span>
              So sieht <strong>{countryName(question.picked!)}</strong> aus.
            </span>
          </div>
          <p className="sheet-hint">
            {mode === 'practice'
              ? 'Diese Flagge kommt gleich noch einmal.'
              : firstTestMistake
                ? 'Zum Freischalten brauchst du einen fehlerfreien Durchlauf.'
                : 'Merk sie dir für den nächsten Versuch.'}
          </p>
        </>
      )}
      <button ref={button} className={`btn ${correct ? 'btn-good' : 'btn-bad'}`} onClick={handleNext}>
        Weiter
      </button>
    </div>
  )
}
