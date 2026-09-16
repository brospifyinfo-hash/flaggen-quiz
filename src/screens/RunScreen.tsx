import { useEffect, useRef, useState } from 'react'
import { IconCheck, IconClose, IconCross } from '../components/Icons'
import { vibrate } from '../haptics'
import { getMode } from '../modes/registry'
import { xpForAnswer } from '../progression'
import { requestPersistentStorage } from '../pwa'
import { goBack, navigate } from '../router'
import { RANDOM, answerRun, endRun, nextRunQuestion } from '../run'
import { getState, setState } from '../store'
import type { ModeQuestion, Run } from '../types'

const AUTO_NEXT_MS = 900
const AUTO_NEXT_QUICK_MS = 600
const SHEET_TAP_GUARD_MS = 450

export function RunScreen({ run }: { run: Run }) {
  const question = run.current
  const mode = getMode(question.modeId)
  const answered = question.picked !== null
  const correct = question.picked === question.correctId
  const accuracy = run.answered > 0 ? Math.round((run.correct / run.answered) * 100) : 0
  const gained = answered && correct ? xpForAnswer(Math.max(0, run.combo - 1)) : 0

  const [autoNext, setAutoNext] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const goNext = () => {
    window.clearTimeout(timer.current)
    setAutoNext(false)
    setState((data) => nextRunQuestion(data))
    if (!getState().run) navigate({ name: 'runResult' }, { replace: true })
  }

  const pick = (optionId: string) => {
    if (answered) return
    setState((data) => answerRun(data, optionId))
    requestPersistentStorage()
    if (optionId === question.correctId) {
      vibrate(15)
      setAutoNext(true)
      timer.current = window.setTimeout(goNext, question.quickNext ? AUTO_NEXT_QUICK_MS : AUTO_NEXT_MS)
    } else {
      vibrate([40, 70, 40])
    }
  }

  const finish = () => {
    window.clearTimeout(timer.current)
    const hadQuestions = run.answered > 0
    setState((data) => endRun(data))
    if (hadQuestions) navigate({ name: 'runResult' }, { replace: true })
    else goBack({ name: 'home' })
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const index = Number(event.key) - 1
      if (!answered && index >= 0 && index < question.options.length) pick(question.options[index].id)
      else if (answered && (event.key === 'Enter' || event.key === ' ')) {
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
        <button className="icon-btn" aria-label="Run beenden" onClick={finish}>
          <IconClose />
        </button>
        <div className="run-hud">
          <span className="hud-item" title="Combo">
            🔥 {run.combo}
          </span>
          <span className="hud-item" title="XP in diesem Run">
            ⭐ {run.xp}
          </span>
          <span className="hud-item" title="Trefferquote">
            🎯 {accuracy} %
          </span>
          <span className="hud-item" title="Fragen">
            ❓ {run.answered}
          </span>
        </div>
        {gained > 0 && (
          <span className="xp-pop" key={run.answered}>
            +{gained}
          </span>
        )}
      </header>

      <div className="quiz-meta">
        {run.mode === RANDOM && <span className="chip chip-random">🎲 Random</span>}
        <span className="chip">
          {mode?.emoji} {mode?.name}
        </span>
      </div>

      {mode?.renderQuestion(question, question.picked)}

      <p className="question">{question.prompt}</p>

      <div className="options" key={`${run.answered}-${question.key}`}>
        {question.options.map((option) => {
          const isAnswer = option.id === question.correctId
          const isPicked = option.id === question.picked
          const state = !answered ? '' : isAnswer ? ' is-correct' : isPicked ? ' is-wrong' : ' is-dim'
          return (
            <button
              key={option.id}
              className={`option${state}`}
              aria-disabled={answered}
              onClick={() => pick(option.id)}
            >
              <span>{option.label}</span>
              {answered && isAnswer && <IconCheck className="option-mark" />}
              {answered && isPicked && !isAnswer && <IconCross className="option-mark" />}
            </button>
          )
        })}
      </div>

      {answered && !(correct && autoNext) && (
        <RunFeedback question={question} picked={question.picked as string} gained={gained} onNext={goNext} />
      )}
    </main>
  )
}

interface FeedbackProps {
  question: ModeQuestion
  picked: string
  gained: number
  onNext: () => void
}

function RunFeedback({ question, picked, gained, onNext }: FeedbackProps) {
  const correct = picked === question.correctId
  const mode = getMode(question.modeId)
  const shownAt = useRef(0)
  const button = useRef<HTMLButtonElement>(null)
  const answer = question.options.find((option) => option.id === question.correctId)

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
        {correct ? `Richtig! +${gained} XP` : 'Leider falsch'}
      </p>
      {!correct && (
        <p className="sheet-text">
          Richtig: <strong>{answer?.label}</strong>
        </p>
      )}
      {mode?.renderFeedback?.(question, picked)}
      <button ref={button} className={`btn ${correct ? 'btn-good' : 'btn-bad'}`} onClick={handleNext}>
        Weiter
      </button>
    </div>
  )
}
