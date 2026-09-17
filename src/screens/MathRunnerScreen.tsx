import { useEffect, useRef, useState } from 'react'
import { IconClose, IconPlay } from '../components/Icons'
import { EMPTY_MATH_STATS, STAGES, START_SCORE, XP_HIGHSCORE_BONUS, stageAt } from '../games/mathRunner/config'
import {
  createGame,
  endGame,
  pauseGame,
  penaltyFor,
  resumeGame,
  startGame,
  steer,
  step,
  type Game,
  type GameEvent,
} from '../games/mathRunner/engine'
import {
  RUNNER_Y,
  burst,
  createScene,
  draw,
  flash,
  floatText,
  laneX,
  mood,
  shake,
  updateScene,
} from '../games/mathRunner/render'
import { closeSound, initSound, playCue } from '../games/mathRunner/sound'
import { haptic } from '../haptics'
import { awardXP } from '../progression'
import { goBack } from '../router'
import { setState } from '../store'
import type { MathRunnerStats, SaveData } from '../types'

type Phase = 'intro' | 'countdown' | 'running' | 'paused' | 'over'

interface Result {
  score: number
  correct: number
  wrong: number
  bestCombo: number
  time: number
  stage: number
  xp: number
  record: boolean
}

const SWIPE = 24
const clock = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

const lessMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function MathRunnerScreen({ data }: { data: SaveData }) {
  const stats = data.mathRunner ?? EMPTY_MATH_STATS
  const [phase, setPhase] = useState<Phase>('intro')
  const [countdown, setCountdown] = useState(3)
  const [result, setResult] = useState<Result | null>(null)

  const game = useRef<Game>(createGame())
  const scene = useRef(createScene())
  const canvas = useRef<HTMLCanvasElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLElement>(null)
  const size = useRef({ w: 320, h: 480 })
  const shown = useRef({ score: 0, combo: -1, stage: -1, time: -1, pair: -1, lane: 0, risk: -1, danger: false })
  const best = useRef(stats.highScore)

  const scoreOut = useRef<HTMLSpanElement>(null)
  const comboOut = useRef<HTMLSpanElement>(null)
  const stageOut = useRef<HTMLSpanElement>(null)
  const timeOut = useRef<HTMLSpanElement>(null)
  const taskOut = useRef<HTMLParagraphElement>(null)
  const laneOut = useRef<HTMLDivElement>(null)
  const riskOut = useRef<HTMLSpanElement>(null)

  // ---------- Fortschritt sichern ----------
  // Wird bei jedem Ausstieg gerufen: Spielende, Beenden, Neustart, App verlassen.
  // Gezählt wird immer nur die Differenz, damit nichts doppelt in den Speicher wandert.
  const saved = useRef({ game: null as Game | null, xp: 0, correct: 0, wrong: 0, counted: false })
  const bank = useRef((): { record: boolean; xp: number } => ({ record: false, xp: 0 }))
  bank.current = () => {
    const current = game.current
    const mark = saved.current
    if (mark.game !== current) {
      mark.game = current
      mark.xp = 0
      mark.correct = 0
      mark.wrong = 0
      mark.counted = false
    }
    if (current.correct + current.wrong === 0) return { record: false, xp: 0 }

    const record = current.peak > Math.max(best.current, START_SCORE)
    const total = current.xp + (record ? XP_HIGHSCORE_BONUS : 0)
    const gainXp = Math.max(0, total - mark.xp)
    const gainCorrect = current.correct - mark.correct
    const gainWrong = current.wrong - mark.wrong
    const countRun = !mark.counted
    mark.xp = total
    mark.correct = current.correct
    mark.wrong = current.wrong
    mark.counted = true

    setState((save) => {
      const before = save.mathRunner ?? EMPTY_MATH_STATS
      const next: MathRunnerStats = {
        highScore: Math.max(before.highScore, current.peak > START_SCORE ? current.peak : 0),
        bestCombo: Math.max(before.bestCombo, current.bestCombo),
        bestTime: Math.max(before.bestTime, current.time),
        bestStage: Math.max(before.bestStage, current.maxStage),
        runs: before.runs + (countRun ? 1 : 0),
        correct: before.correct + gainCorrect,
        wrong: before.wrong + gainWrong,
      }
      return awardXP({ ...save, mathRunner: next }, gainXp, Date.now(), 'mathRunner')
    })
    return { record, xp: total }
  }

  const finish = useRef(() => {})
  finish.current = () => {
    const current = game.current
    endGame(current)
    const { record, xp } = bank.current()
    setResult({
      score: current.peak,
      correct: current.correct,
      wrong: current.wrong,
      bestCombo: current.bestCombo,
      time: current.time,
      stage: current.maxStage,
      xp,
      record,
    })
    setPhase('over')
    playCue(record ? 'highscore' : 'over')
    haptic(record ? 'celebrate' : 'error')
  }

  // ---------- Rückmeldung auf Spielereignisse ----------
  const react = useRef((event: GameEvent) => void event)
  react.current = (event: GameEvent) => {
    const view = size.current
    const current = game.current
    const x = laneX(current.lane, view.w)
    const y = view.h * RUNNER_Y
    const accent = stageAt(current.stage).accent

    if (event.type === 'correct') {
      burst(scene.current, x, y, accent, lessMotion ? 6 : 20)
      floatText(scene.current, x, y - 44, `+${event.gained}`, '#ffffff')
      flash(scene.current, accent)
      mood(scene.current, 'happy')
      haptic(event.combo > 0 && event.combo % 5 === 0 ? 'celebrate' : 'success')
      playCue('correct')
    } else if (event.type === 'wrong') {
      burst(scene.current, x, y, '#ff3b5c', lessMotion ? 6 : 18)
      floatText(scene.current, x, y - 44, `−${event.lost}`, '#ff8a9c')
      flash(scene.current, '#ff2d55')
      shake(scene.current, lessMotion ? 0.3 : 1.1)
      mood(scene.current, 'hurt')
      haptic('error')
      playCue('wrong')
    } else if (event.type === 'celebrate') {
      if (!lessMotion) {
        for (const color of ['#ff3fa4', '#00d9ff', '#ffd23f', '#7bff3f']) {
          burst(scene.current, view.w / 2, view.h * 0.45, color, 16, 1.6)
        }
      }
      floatText(scene.current, view.w / 2, view.h * 0.4, `COMBO ${event.combo}!`, '#ffe14d')
      haptic('celebrate')
      playCue('combo')
    } else if (event.type === 'stage') {
      floatText(scene.current, view.w / 2, view.h * 0.32, stageAt(event.stage).name, stageAt(event.stage).accent)
      flash(scene.current, stageAt(event.stage).accent)
      haptic('strong')
      playCue('level')
    } else if (event.type === 'danger') {
      floatText(scene.current, view.w / 2, view.h * 0.5, 'GEFAHR!', '#ff5f7a')
      haptic('strong')
      playCue('danger')
    } else if (event.type === 'over') {
      finish.current()
    }
  }

  // ---------- Bildschleife ----------
  useEffect(() => {
    const element = canvas.current
    const box = stage.current
    if (!element || !box) return
    const ctx = element.getContext('2d')
    if (!ctx) return

    const fit = () => {
      const rect = box.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      size.current = { w: Math.max(200, rect.width), h: Math.max(240, rect.height) }
      element.width = Math.round(size.current.w * dpr)
      element.height = Math.round(size.current.h * dpr)
      element.style.width = `${size.current.w}px`
      element.style.height = `${size.current.h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(box)

    let raf = 0
    let last = performance.now()
    const events: GameEvent[] = []

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      const current = game.current

      events.length = 0
      step(current, dt, events)
      for (const event of events) react.current(event)

      updateScene(scene.current, current, dt, size.current.w, size.current.h)
      draw(ctx, current, scene.current, size.current.w, size.current.h, now / 1000)

      // HUD ohne Neuaufbau der Oberfläche: Zahlen laufen weich hoch
      const view = shown.current
      view.score += (current.score - view.score) * Math.min(1, dt * 9)
      if (Math.abs(current.score - view.score) < 0.6) view.score = current.score
      const rounded = Math.round(view.score)
      if (scoreOut.current && scoreOut.current.dataset.value !== String(rounded)) {
        scoreOut.current.dataset.value = String(rounded)
        scoreOut.current.textContent = rounded.toLocaleString('de-DE')
      }
      if (comboOut.current && view.combo !== current.combo) {
        view.combo = current.combo
        comboOut.current.textContent = `🔥 ${current.combo}`
        comboOut.current.classList.toggle('is-hot', current.combo >= 5)
      }
      if (stageOut.current && view.stage !== current.stage) {
        view.stage = current.stage
        stageOut.current.textContent = stageAt(current.stage).name
      }
      const seconds = Math.floor(current.time)
      if (timeOut.current && view.time !== seconds) {
        view.time = seconds
        timeOut.current.textContent = clock(seconds)
      }
      const risk = penaltyFor(current)
      if (riskOut.current && view.risk !== risk) {
        view.risk = risk
        riskOut.current.textContent = `−${risk.toLocaleString('de-DE')}`
      }
      if (root.current && view.danger !== current.danger) {
        view.danger = current.danger
        root.current.classList.toggle('is-danger', current.danger)
      }
      if (laneOut.current && view.lane !== current.lane) {
        view.lane = current.lane
        laneOut.current.dataset.side = current.lane < 0 ? 'links' : 'rechts'
      }
      const pair = current.pair
      if (taskOut.current && pair && view.pair !== pair.id) {
        view.pair = pair.id
        taskOut.current.textContent = `${pair.question.text} = ?`
        taskOut.current.classList.remove('is-new')
        void taskOut.current.offsetWidth
        taskOut.current.classList.add('is-new')
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  // ---------- Steuerung ----------
  useEffect(() => {
    const box = stage.current
    if (!box) return
    let startX = 0
    let moved = false
    let active = false

    const turn = (direction: -1 | 1) => {
      if (steer(game.current, direction)) haptic('tick', { minGap: 60 })
    }

    const down = (event: PointerEvent) => {
      active = true
      moved = false
      startX = event.clientX
    }
    const move = (event: PointerEvent) => {
      if (!active) return
      const dx = event.clientX - startX
      if (Math.abs(dx) >= SWIPE) {
        turn(dx < 0 ? -1 : 1)
        moved = true
        startX = event.clientX
      }
    }
    const up = (event: PointerEvent) => {
      if (active && !moved) {
        const rect = box.getBoundingClientRect()
        turn(event.clientX - rect.left < rect.width / 2 ? -1 : 1)
      }
      active = false
    }
    const key = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') turn(-1)
      else if (event.key === 'ArrowRight') turn(1)
    }

    box.addEventListener('pointerdown', down)
    box.addEventListener('pointermove', move)
    box.addEventListener('pointerup', up)
    box.addEventListener('pointercancel', up)
    window.addEventListener('keydown', key)
    return () => {
      box.removeEventListener('pointerdown', down)
      box.removeEventListener('pointermove', move)
      box.removeEventListener('pointerup', up)
      box.removeEventListener('pointercancel', up)
      window.removeEventListener('keydown', key)
    }
  }, [])

  // ---------- Countdown ----------
  useEffect(() => {
    if (phase !== 'countdown') return
    setCountdown(3)
    playCue('count')
    let value = 3
    let go = 0
    const timer = window.setInterval(() => {
      value -= 1
      setCountdown(value)
      haptic(value > 0 ? 'tick' : 'strong')
      playCue(value > 0 ? 'count' : 'go')
      if (value <= 0) {
        window.clearInterval(timer)
        go = window.setTimeout(() => {
          startGame(game.current)
          setPhase('running')
        }, 420)
      }
    }, 700)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(go)
    }
  }, [phase])

  // ---------- App verlassen: anhalten und sichern ----------
  useEffect(() => {
    const hide = () => {
      if (!document.hidden) return
      if (game.current.phase === 'running') {
        pauseGame(game.current)
        setPhase('paused')
      }
      bank.current()
    }
    document.addEventListener('visibilitychange', hide)
    window.addEventListener('pagehide', hide)
    return () => {
      document.removeEventListener('visibilitychange', hide)
      window.removeEventListener('pagehide', hide)
      // auch beim Wegnavigieren zählt der Lauf
      bank.current()
      closeSound()
    }
  }, [])

  const begin = () => {
    bank.current()
    initSound()
    haptic('soft')
    game.current = createGame()
    scene.current = createScene()
    shown.current = { score: 0, combo: -1, stage: -1, time: -1, pair: -1, lane: 0, risk: -1, danger: false }
    best.current = (data.mathRunner ?? EMPTY_MATH_STATS).highScore
    root.current?.classList.remove('is-danger')
    setResult(null)
    setPhase('countdown')
  }

  const pause = () => {
    if (game.current.phase !== 'running') return
    pauseGame(game.current)
    setPhase('paused')
    haptic('soft')
  }

  const resume = () => {
    const pair = game.current.pair
    // kleine Atempause: das Tor rutscht ein Stück zurück
    if (pair) pair.progress = Math.max(0, pair.progress - 0.18)
    resumeGame(game.current)
    setPhase('running')
    haptic('tick')
  }

  const leave = () => {
    haptic('soft')
    bank.current()
    goBack({ name: 'home' })
  }

  const stageName = (index: number) => STAGES[Math.min(STAGES.length - 1, Math.max(0, index))].name

  return (
    <main className="mr" ref={root}>
      <div className="mr-bar">
        <div className="mr-left">
          <button className="mr-icon" aria-label="Pause" onClick={pause} disabled={phase !== 'running'}>
            ⏸
          </button>
          <span className="mr-risk" ref={riskOut} title="So viel kostet ein Fehler gerade">
            −15
          </span>
        </div>
        <div className="mr-score">
          <span ref={scoreOut}>100</span>
          <small>SCORE</small>
        </div>
        <div className="mr-side">
          <span className="mr-combo" ref={comboOut}>
            🔥 0
          </span>
          <span className="mr-meta">
            <span ref={stageOut}>EASY</span> · <span ref={timeOut}>00:00</span>
          </span>
        </div>
      </div>

      <div className="mr-taskrow" data-side="links" ref={laneOut}>
        <span className="mr-arrow mr-arrow-left" aria-hidden="true">
          ◀
        </span>
        <p className="mr-task" ref={taskOut}>
          🧮 MATH RUNNER
        </p>
        <span className="mr-arrow mr-arrow-right" aria-hidden="true">
          ▶
        </span>
      </div>

      <div className="mr-stage" ref={stage}>
        <canvas ref={canvas} className="mr-canvas" />

        {phase === 'intro' && (
          <div className="mr-overlay">
            <div className="mr-card">
              <p className="mr-logo">🧮 MATH RUNNER</p>
              <p className="mr-hint">
                Wisch nach links oder rechts und lauf durch das Tor mit dem <strong>richtigen Ergebnis</strong>. Je
                weiter oben du stehst, desto teurer wird ein Fehler.
              </p>
              <div className="mr-records">
                <div>
                  <strong>{stats.highScore.toLocaleString('de-DE')}</strong>
                  <span>Highscore</span>
                </div>
                <div>
                  <strong>{stats.bestCombo}</strong>
                  <span>Beste Combo</span>
                </div>
                <div>
                  <strong>{clock(stats.bestTime)}</strong>
                  <span>Längster Lauf</span>
                </div>
              </div>
              <button className="mr-btn mr-btn-go" onClick={begin}>
                <IconPlay /> START
              </button>
              <button className="mr-btn mr-btn-ghost" onClick={leave}>
                Zurück
              </button>
            </div>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="mr-overlay mr-overlay-clear">
            <p className="mr-count" key={countdown}>
              {countdown > 0 ? countdown : 'GO!'}
            </p>
          </div>
        )}

        {phase === 'paused' && (
          <div className="mr-overlay">
            <div className="mr-card">
              <p className="mr-logo">PAUSE</p>
              <button className="mr-btn mr-btn-go" onClick={resume}>
                <IconPlay /> WEITER
              </button>
              <button className="mr-btn mr-btn-alt" onClick={begin}>
                NEU STARTEN
              </button>
              <button className="mr-btn mr-btn-ghost" onClick={leave}>
                <IconClose /> BEENDEN
              </button>
            </div>
          </div>
        )}

        {phase === 'over' && result && (
          <div className="mr-overlay">
            <div className="mr-card mr-card-over">
              {result.record && <p className="mr-record">🏆 NEUER HIGHSCORE</p>}
              <p className="mr-logo">GAME OVER</p>
              <p className="mr-final">{result.score.toLocaleString('de-DE')}</p>
              <p className="mr-final-label">Score</p>
              <div className="mr-table">
                <div>
                  <span>Richtig</span>
                  <strong>{result.correct}</strong>
                </div>
                <div>
                  <span>Falsch</span>
                  <strong>{result.wrong}</strong>
                </div>
                <div>
                  <span>Beste Combo</span>
                  <strong>🔥 {result.bestCombo}</strong>
                </div>
                <div>
                  <span>Spielzeit</span>
                  <strong>{clock(result.time)}</strong>
                </div>
                <div>
                  <span>Schwierigkeit</span>
                  <strong>{stageName(result.stage)}</strong>
                </div>
                <div>
                  <span>XP verdient</span>
                  <strong>+{result.xp.toLocaleString('de-DE')}</strong>
                </div>
              </div>
              <button className="mr-btn mr-btn-go" onClick={begin}>
                <IconPlay /> NOCHMAL SPIELEN
              </button>
              <button className="mr-btn mr-btn-ghost" onClick={leave}>
                ZURÜCK
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
