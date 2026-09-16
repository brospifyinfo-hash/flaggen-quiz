// Registry aller Spielmodi. Ein neuer Modus wird einmal registriert und taucht danach
// automatisch im Specific Mode, im Random Mode, in den Statistiken und in der Mastery auf.
import type { ReactNode } from 'react'
import type { Judgement, ModeQuestion, SaveData } from '../types'

export interface ModeStatLine {
  label: string
  value: string
}

export interface QuizMode {
  id: string
  name: string
  emoji: string
  /** kurzer Satz auf der Auswahlkarte */
  tagline: string
  /** Erzeugt die nächste Frage. recentKeys sind die zuletzt gestellten Fragen, neueste zuerst. */
  nextQuestion: (data: SaveData, recentKeys: readonly string[]) => ModeQuestion | null
  /** Eigene Bewertung, z. B. Punkte nach Nähe beim Zeitstrahl. Ohne Angabe gilt richtig/falsch. */
  judge?: (question: ModeQuestion, picked: string, combo: number) => Judgement
  /** Trägt das Ergebnis in den modus-eigenen Lernstand ein (z. B. Flaggen oder Jahresabweichung) */
  recordAnswer?: (data: SaveData, question: ModeQuestion, picked: string, correct: boolean, now: number) => SaveData
  /** 0 bis 1 */
  mastery: (data: SaveData) => number
  /** Kurzstatistik für Auswahlkarte und Modus-Bildschirm */
  summary: (data: SaveData) => ModeStatLine[]
  /** Anzeige über den Antwortmöglichkeiten */
  renderQuestion: (question: ModeQuestion, picked: string | null) => ReactNode
  /** Eigene Eingabe statt Antwortknöpfen (Zeitstrahl); submit übergibt die Antwort */
  renderInput?: (question: ModeQuestion, picked: string | null, submit: (answer: string) => void) => ReactNode
  /** Auflösung nach einer Antwort */
  renderFeedback?: (question: ModeQuestion, picked: string) => ReactNode
  /** eigener Bereich auf dem Modus-Bildschirm, z. B. die Kontinent-Reise der Flaggen */
  renderExtra?: (data: SaveData) => ReactNode
}

const MODES: QuizMode[] = []

export function registerMode(mode: QuizMode) {
  if (!MODES.some((existing) => existing.id === mode.id)) MODES.push(mode)
}

export const allModes = (): readonly QuizMode[] => MODES
export const getMode = (id: string) => MODES.find((mode) => mode.id === id)

/**
 * Gewichtete Auswahl für den Random Mode: abwechslungsreich, aber nicht vorhersehbar.
 * Zuletzt gespielte Modi werden stark abgewertet, schwache und selten gespielte leicht bevorzugt.
 */
export function pickRandomMode(data: SaveData, recentModes: readonly string[]): QuizMode | null {
  if (MODES.length === 0) return null
  if (MODES.length === 1) return MODES[0]

  // Harte Grenze: nach zwei gleichen Kategorien am Stück ist diese Kategorie gesperrt
  const blocked = recentModes.length >= 2 && recentModes[0] === recentModes[1] ? recentModes[0] : null
  const pool = MODES.filter((mode) => mode.id !== blocked)
  const candidates = pool.length > 0 ? pool : MODES

  const weights = candidates.map((mode) => {
    let weight = 1
    if (recentModes[0] === mode.id) weight *= 0.12
    else if (recentModes.slice(0, 2).includes(mode.id)) weight *= 0.45
    else if (recentModes.slice(0, 3).includes(mode.id)) weight *= 0.8
    // Schwächen etwas häufiger, ohne dass es sich nach Zwang anfühlt
    weight *= 1 + (1 - clamp(mode.mastery(data))) * 0.5
    // wenig gespielte Modi etwas häufiger
    const answered = data.modes[mode.id]?.answered ?? 0
    weight *= 1 + Math.max(0, 1 - answered / 60) * 0.4
    return weight
  })

  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let ticket = Math.random() * total
  for (let i = 0; i < candidates.length; i++) {
    ticket -= weights[i]
    if (ticket <= 0) return candidates[i]
  }
  return candidates[candidates.length - 1]
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))
