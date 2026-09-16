import { useEffect, useRef, useState } from 'react'
import { IconCheck, IconClose, IconCross } from '../components/Icons'
import { haptic } from '../haptics'
import { getMode } from '../modes/registry'
import { requestPersistentStorage } from '../pwa'
import { goBack, navigate } from '../router'
import { RANDOM, answerRun, endRun, nextRunQuestion } from '../run'
import { getState, setState } from '../store'
import type { Judgement, ModeQuestion, Run } from '../types'

const AUTO_NEXT_MS = 900
const AUTO_NEXT_QUICK_MS = 600
const SHEET_TAP_GUARD_MS = 450

export function RunScreen({ run }: { run: Run }) {
  const question = run.current
  const mode = getMode(question.modeId)
  const answered = question.picked !== null
  const judged = run.judged
  const correct = judged?.correct ?? false
  const accuracy = run.answered > 0 ? Math.round((run.correct / run.answered) * 100) : 0
  const gained = answered ? (judged?.xp ?? 0) : 0

  const [autoNext, setAutoNext] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const goNext = () => {
    window.clearTimeout(timer.current)
    setAutoNext(false)
    setState((data) => nextRunQuestion(data))
    if (!getState().run) navigate({ name: 'runResult' }, { replace: true })
  }

  const pick = (answer: string) => {
    if (answered) return
    setState((data) => answerRun(data, answer))
    requestPersistentStorage()
    const judgement = getState().run?.judged
    const combo = getState().run?.combo ?? 0
    if (judgement?.correct) {
      haptic(combo > 0 && combo % 5 === 0 ? 'celebrate' : 'success')
      // Bei Zeitstrahl-Fragen bleibt die Erklärung stehen, sonst läuft es automatisch weiter
      if (!question.input) {
        setAutoNext(true)
        timer.current = window.setTimeout(goNext, question.quickNext ? AUTO_NEXT_QUICK_MS : AUTO_NEXT_MS)
      }
    } else {
      haptic('error')
    }
  }

  const finish = () => {
    haptic('soft')
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
      if (!answered && !question.input && index >= 0 && index < question.options.length) {
        pick(question.options[index].id)
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

      {question.input ? (
        mode?.renderInput?.(question, question.picked, pick)
      ) : (
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
      )}

      {answered && judged && !(correct && autoNext) && (
        <RunFeedback question={question} picked={question.picked as string} judged={judged} onNext={goNext} />
      )}
    </main>
  )
}

interface FeedbackProps {
  question: ModeQuestion
  picked: string
  judged: Judgement
  onNext: () => void
}

function RunFeedback({ question, picked, judged, onNext }: FeedbackProps) {
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
    haptic('tick')
    onNext()
  }

  return (
    <div className={`sheet ${judged.correct ? 'sheet-good' : 'sheet-bad'}`} role="status" aria-live="assertive">
      <p className="sheet-title">
        {judged.correct ? <IconCheck /> : <IconCross />}
        {judged.headline}
        {judged.xp > 0 && <span className="sheet-xp">+{judged.xp} XP</span>}
      </p>
      {!judged.correct && !question.input && answer && (
        <p className="sheet-text">
          Richtig: <strong>{answer.label}</strong>
        </p>
      )}
      {mode?.renderFeedback?.(question, picked)}
      <button ref={button} className={`btn ${judged.correct ? 'btn-good' : 'btn-bad'}`} onClick={handleNext}>
        Weiter
      </button>
    </div>
  )
}
