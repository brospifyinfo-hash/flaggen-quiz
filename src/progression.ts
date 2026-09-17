// XP, Level, Mastery und Achievements – gelten für alle Spielmodi gemeinsam.
// Alle Regeln stehen hier oben und lassen sich einzeln ändern.
import { grant } from './city/state'
import { CONTINENTS, COUNTRIES } from './data/countries'
import { addKnowledge } from './knowledge'
import { allModes } from './modes/registry'
import { flagState } from './quiz'
import type { ModeProgress, SaveData } from './types'

/** XP für eine richtige Antwort: Grundwert plus Bonus je Combo-Stufe */
export const XP_BASE = 10
export const XP_PER_COMBO = 2
export const XP_COMBO_CAP = 10

export function xpForAnswer(comboBefore: number): number {
  return XP_BASE + Math.min(comboBefore, XP_COMBO_CAP) * XP_PER_COMBO
}

/**
 * Der einzige Weg, XP zu vergeben: Sie zählen für den Rang und fließen zugleich
 * als Münzen und Material in die Stadt. Jedes Spiel nutzt diese eine Kette.
 */
export function creditXp(data: SaveData, gained: number, modeId?: string): SaveData {
  if (gained <= 0) return data
  const city = data.city ? grant(data.city, gained, Math.floor(gained / 20)) : undefined
  const mitXp: SaveData = { ...data, xp: data.xp + gained, ...(city ? { city } : {}) }
  return addKnowledge(mitXp, modeId, gained)
}

/** XP aus Spielen außerhalb der Quiz-Runs, z. B. dem Math Runner */
export function awardXP(data: SaveData, amount: number, now = Date.now(), modeId?: string): SaveData {
  const gained = Math.max(0, Math.round(amount))
  if (gained === 0) return data
  return checkAchievements(creditXp(data, gained, modeId), now).data
}

/** Level 2 ab 100 XP, jede weitere Stufe kostet 100 XP mehr als die vorige */
export function levelFor(xp: number) {
  let level = 1
  let needed = 100
  let into = Math.max(0, Math.floor(xp))
  while (into >= needed) {
    into -= needed
    level += 1
    needed += 100
  }
  return { level, into, needed }
}

/** Ränge: Wappen auf der Startseite, vergeben nach gesammelten XP aus allen Modi */
export interface Rank {
  id: string
  name: string
  /** ab so vielen XP */
  from: number
  /** Verlauf des Wappens von hell nach dunkel */
  colors: [string, string]
  /** Farbe des Emblems im Wappen */
  ink: string
}

export const RANKS: Rank[] = [
  { id: 'holz', name: 'Holz', from: 0, colors: ['#c99a63', '#6f4520'], ink: '#3a2410' },
  { id: 'bronze', name: 'Bronze', from: 750, colors: ['#f0b47c', '#a15c26'], ink: '#4a2a0e' },
  { id: 'silber', name: 'Silber', from: 3000, colors: ['#f4f7fb', '#93a3b8'], ink: '#3c4657' },
  { id: 'gold', name: 'Gold', from: 10000, colors: ['#ffe680', '#d79a08'], ink: '#5a3d00' },
  { id: 'platin', name: 'Platin', from: 25000, colors: ['#edf6ff', '#9db2c8'], ink: '#33465a' },
  { id: 'diamant', name: 'Diamant', from: 60000, colors: ['#c9f5ff', '#3fb0e6'], ink: '#0b4a63' },
  { id: 'champion', name: 'Champion', from: 150000, colors: ['#ffd76a', '#ff5f9e'], ink: '#4a1338' },
]

export function rankFor(xp: number) {
  let index = 0
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].from) {
      index = i
      break
    }
  }
  const rank = RANKS[index]
  const next = RANKS[index + 1] ?? null
  return {
    rank,
    index,
    next,
    into: Math.max(0, xp - rank.from),
    needed: next ? next.from - rank.from : 0,
  }
}

export const rankById = (id: string) => RANKS.find((rank) => rank.id === id)

export const EMPTY_MODE_PROGRESS: ModeProgress = {
  answered: 0,
  correct: 0,
  runs: 0,
  bestCombo: 0,
  bestXp: 0,
  bestQuestions: 0,
  bestAccuracy: 0,
  lastPlayed: 0,
}

export const modeProgress = (data: SaveData, id: string): ModeProgress => data.modes[id] ?? EMPTY_MODE_PROGRESS

export const accuracyOf = (progress: ModeProgress) =>
  progress.answered > 0 ? progress.correct / progress.answered : 0

/** Durchschnitt über alle Modi – Grundlage für den Gesamtfortschritt */
export function overallMastery(data: SaveData): number {
  const modes = allModes()
  if (modes.length === 0) return 0
  return modes.reduce((sum, mode) => sum + mode.mastery(data), 0) / modes.length
}

export const totalAnswered = (data: SaveData) =>
  allModes().reduce((sum, mode) => sum + modeProgress(data, mode.id).answered, 0)

export const bestComboOverall = (data: SaveData) =>
  Object.values(data.modes).reduce((best, progress) => Math.max(best, progress?.bestCombo ?? 0), 0)

export const totalRuns = (data: SaveData) =>
  Object.values(data.modes).reduce((sum, progress) => sum + (progress?.runs ?? 0), 0)

const solidFlags = (data: SaveData) =>
  COUNTRIES.filter((country) => flagState(data.stats[country.code]) === 'solid').length

const seenFlags = (data: SaveData) => COUNTRIES.filter((country) => (data.stats[country.code]?.seen ?? 0) > 0).length

export interface Achievement {
  id: string
  emoji: string
  title: string
  text: string
  reached: (data: SaveData) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'erster-run', emoji: '🎬', title: 'Losgelegt', text: 'Beende deinen ersten Run', reached: (d) => totalRuns(d) >= 1 },
  { id: 'combo-10', emoji: '🔥', title: 'Combo 10', text: '10 richtige Antworten in Folge', reached: (d) => bestComboOverall(d) >= 10 },
  { id: 'combo-25', emoji: '🌋', title: 'Combo 25', text: '25 richtige Antworten in Folge', reached: (d) => bestComboOverall(d) >= 25 },
  { id: 'combo-50', emoji: '☄️', title: 'Combo 50', text: '50 richtige Antworten in Folge', reached: (d) => bestComboOverall(d) >= 50 },
  { id: 'fragen-100', emoji: '💯', title: '100 Fragen', text: '100 Fragen beantwortet', reached: (d) => totalAnswered(d) >= 100 },
  { id: 'fragen-1000', emoji: '🧠', title: '1000 Fragen', text: '1000 Fragen beantwortet', reached: (d) => totalAnswered(d) >= 1000 },
  { id: 'level-5', emoji: '⭐', title: 'Level 5', text: 'Erreiche Level 5', reached: (d) => levelFor(d.xp).level >= 5 },
  { id: 'level-10', emoji: '🌟', title: 'Level 10', text: 'Erreiche Level 10', reached: (d) => levelFor(d.xp).level >= 10 },
  { id: 'xp-5000', emoji: '💎', title: '5.000 XP', text: 'Sammle 5.000 XP', reached: (d) => d.xp >= 5000 },
  { id: 'flaggen-50', emoji: '🚩', title: '50 Flaggen sicher', text: '50 Flaggen sitzen sicher', reached: (d) => solidFlags(d) >= 50 },
  { id: 'flaggen-alle-gesehen', emoji: '🗺️', title: 'Weltenbummler', text: 'Jede Flagge der Welt einmal gesehen', reached: (d) => seenFlags(d) === COUNTRIES.length },
  { id: 'europa-bestanden', emoji: '🏆', title: 'Europa gemeistert', text: 'Bestehe den Abschlusstest von Europa', reached: (d) => d.progress.europa?.passed === true },
  { id: 'alle-kontinente', emoji: '🌍', title: 'Weltmeister', text: 'Bestehe alle Abschlusstests', reached: (d) => CONTINENTS.every((c) => d.progress[c.id]?.passed) },
  { id: 'hl-combo-20', emoji: '📈', title: 'Zahlenmensch', text: '20 Higher-or-Lower-Fragen in Folge richtig', reached: (d) => modeProgress(d, 'higher-lower').bestCombo >= 20 },
  { id: 'geschichte-100', emoji: '⏳', title: 'Zeitreisender', text: '100 historische Ereignisse beantwortet', reached: (d) => modeProgress(d, 'geschichte').answered >= 100 },
  { id: 'math-1000', emoji: '🧮', title: 'Kopfrechner', text: '1.000 Punkte im Math Runner', reached: (d) => (d.mathRunner?.highScore ?? 0) >= 1000 },
  { id: 'math-expert', emoji: '🚀', title: 'Rechenrakete', text: 'Erreiche EXPERT im Math Runner', reached: (d) => (d.mathRunner?.bestStage ?? 0) >= 3 },
]

export const achievementById = (id: string) => ACHIEVEMENTS.find((a) => a.id === id)

/** Prüft alle Achievements und trägt neu erreichte ein */
export function checkAchievements(data: SaveData, now: number): { data: SaveData; unlocked: string[] } {
  const unlocked: string[] = []
  for (const achievement of ACHIEVEMENTS) {
    if (data.achievements[achievement.id]) continue
    if (achievement.reached(data)) unlocked.push(achievement.id)
  }
  if (unlocked.length === 0) return { data, unlocked }
  const achievements = { ...data.achievements }
  for (const id of unlocked) achievements[id] = now
  return { data: { ...data, achievements }, unlocked }
}
