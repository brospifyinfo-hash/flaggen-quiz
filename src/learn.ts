// Lernstand je Thema für beliebige Modi: was man falsch hatte, kommt häufiger dran.
// Die Flaggen haben aus historischen Gründen ihren eigenen Speicher (data.stats).
import type { CountryStat, SaveData } from './types'

export const learnStat = (data: SaveData, modeId: string, subject: string): CountryStat | undefined =>
  data.learn?.[modeId]?.[subject]

export function recordLearn(data: SaveData, modeId: string, subject: string, correct: boolean, now: number): SaveData {
  const prev = learnStat(data, modeId, subject)
  const stat: CountryStat = {
    seen: (prev?.seen ?? 0) + 1,
    right: (prev?.right ?? 0) + (correct ? 1 : 0),
    wrong: (prev?.wrong ?? 0) + (correct ? 0 : 1),
    streak: correct ? (prev?.streak ?? 0) + 1 : 0,
    lastWrong: !correct,
    lastSeen: now,
  }
  return {
    ...data,
    learn: { ...data.learn, [modeId]: { ...(data.learn?.[modeId] ?? {}), [subject]: stat } },
  }
}

/** Wie dringend ein Thema wieder drankommen sollte */
export function urgencyOf(stat: CountryStat | undefined): number {
  if (!stat?.seen) return 3
  if (stat.lastWrong) return 16
  const fading = [6, 3, 1.5, 1, 0.6][Math.min(stat.streak, 4)]
  return fading * (1 + Math.min(stat.wrong, 6) * 0.5)
}

/** Gewichtete Auswahl: neue und unsichere Themen zuerst, zuletzt gestellte überspringen */
export function pickSubject(
  ids: readonly string[],
  data: SaveData,
  modeId: string,
  recent: readonly string[],
): string | null {
  const pool = ids.filter((id) => !recent.includes(id))
  const list = pool.length > 0 ? pool : ids
  let best: string | null = null
  let bestKey = -1
  for (const id of list) {
    const key = Math.random() ** (1 / urgencyOf(learnStat(data, modeId, id)))
    if (key > bestKey) {
      bestKey = key
      best = id
    }
  }
  return best
}

/** Themen, die sicher sitzen: zuletzt richtig und mindestens zweimal in Folge */
export const solidCount = (data: SaveData, modeId: string) =>
  Object.values(data.learn?.[modeId] ?? {}).filter((stat) => !stat.lastWrong && stat.streak >= 2).length

/** Themen, die schon einmal dran waren */
export const seenCount = (data: SaveData, modeId: string) => Object.keys(data.learn?.[modeId] ?? {}).length

/** Mastery mit Teilwissen: einmal richtig zählt anteilig, ab zweimal in Folge fast voll */
export function gradedMastery(data: SaveData, modeId: string, ids: readonly string[]): number {
  if (ids.length === 0) return 0
  const points = ids.reduce((sum, id) => {
    const stat = learnStat(data, modeId, id)
    if (!stat?.seen) return sum
    if (stat.lastWrong) return sum + 0.25
    return sum + (stat.streak >= 3 ? 1 : stat.streak >= 2 ? 0.85 : 0.6)
  }, 0)
  return points / ids.length
}
