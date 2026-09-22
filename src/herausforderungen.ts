// Herausforderungen: einmalige Aufgaben rund um Quiz, Kurse und Math Runner, die Münzen
// und Ziegel für die Stadt bringen – jede genau einmal. Sie ergänzen den Tag der Stadt:
// Der tägliche Ertrag kommt aus der Uhr, der große Schub aus geschafften Herausforderungen.
// Geprüft wird wie bei den Achievements gegen den Spielstand; eingelöst wird sofort.
import { grant } from './city/state'
import { CONTINENTS, COUNTRIES } from './data/countries'
import { kursStand } from './lernen/fortschritt'
import { KURSE } from './lernen/kurse'
import { quizModes } from './modes/registry'
import { ACHIEVEMENTS, levelFor, modeProgress, RANKS, rankFor, totalAnswered } from './progression'
import { flagState } from './quiz'
import type { SaveData } from './types'

export interface Lohn {
  coins: number
  materials: number
}

export interface Herausforderung {
  id: string
  emoji: string
  titel: string
  text: string
  /** Gruppe: Modus-ID, Kurs-ID ("kurs:deutsch"), 'math' oder 'alle' */
  gruppe: string
  lohn: Lohn
  /** Ist-Wert und Ziel – geschafft ab wert >= ziel */
  stand: (data: SaveData) => { wert: number; ziel: number }
}

export interface Gruppe {
  id: string
  name: string
  emoji: string
}

const zahl = (n: number) => n.toLocaleString('de-DE')

/** Eine Reihe gestaffelter Aufgaben aus einem Messwert */
function reihe(
  gruppe: string,
  schluessel: string,
  emoji: string,
  titel: (ziel: number) => string,
  text: (ziel: number) => string,
  ziele: number[],
  loehne: Lohn[],
  wert: (data: SaveData) => number,
): Herausforderung[] {
  return ziele.map((ziel, i) => ({
    id: `${gruppe}:${schluessel}:${ziel}`,
    emoji,
    titel: titel(ziel),
    text: text(ziel),
    gruppe,
    lohn: loehne[Math.min(i, loehne.length - 1)],
    stand: (data) => ({ wert: wert(data), ziel }),
  }))
}

const L = (coins: number, materials: number): Lohn => ({ coins, materials })

let LISTE: Herausforderung[] | null = null

/** Alle Herausforderungen – beim ersten Aufruf gebaut, dann sind alle Modi registriert */
export function alleHerausforderungen(): readonly Herausforderung[] {
  if (LISTE) return LISTE
  const liste: Herausforderung[] = []

  // ---------- Je Quiz-Modus ----------
  for (const mode of quizModes()) {
    const g = mode.id
    const p = (d: SaveData) => modeProgress(d, g)
    liste.push(
      ...reihe(g, 'richtig', '✅', (z) => `${zahl(z)} richtige Antworten`, () => `Beantworte in ${mode.name} richtig – über alle Runs hinweg.`,
        [10, 50, 150, 400, 1000], [L(150, 4), L(400, 10), L(900, 25), L(2000, 60), L(5000, 150)], (d) => p(d).correct),
      ...reihe(g, 'combo', '🔥', (z) => `Combo ${z}`, (z) => `${z} richtige Antworten in Folge in einem ${mode.name}-Run.`,
        [5, 10, 20, 35], [L(200, 5), L(500, 12), L(1200, 30), L(3000, 80)], (d) => p(d).bestCombo),
      ...reihe(g, 'fragen', '❓', (z) => `${z} Fragen in einem Run`, () => `Ein langer Atem in ${mode.name}.`,
        [15, 30, 60], [L(250, 6), L(700, 18), L(1800, 45)], (d) => p(d).bestQuestions),
      ...reihe(g, 'xp', '⭐', (z) => `${zahl(z)} XP in einem Run`, () => `Viele Punkte am Stück in ${mode.name}.`,
        [200, 500, 1200], [L(300, 8), L(800, 20), L(2000, 50)], (d) => p(d).bestXp),
      ...reihe(g, 'runs', '🎬', (z) => `${z} Runs gespielt`, () => `Bleib dran in ${mode.name}.`,
        [3, 10, 30], [L(120, 3), L(450, 10), L(1500, 35)], (d) => p(d).runs),
      {
        id: `${g}:treffer:90`,
        emoji: '🎯',
        titel: 'Trefferquote 90 %',
        text: `Ein ${mode.name}-Run mit mindestens 10 Fragen und 90 % richtig.`,
        gruppe: g,
        lohn: L(600, 15),
        stand: (d) => ({ wert: Math.round(p(d).bestAccuracy * 100), ziel: 90 }),
      },
      {
        id: `${g}:treffer:100`,
        emoji: '💯',
        titel: 'Fehlerfrei',
        text: `Ein ${mode.name}-Run mit mindestens 10 Fragen ohne einen Fehler.`,
        gruppe: g,
        lohn: L(1500, 40),
        stand: (d) => ({ wert: Math.round(p(d).bestAccuracy * 100), ziel: 100 }),
      },
    )
  }

  // ---------- Übergreifend ----------
  const a = 'alle'
  liste.push(
    ...reihe(a, 'fragen', '🧠', (z) => `${zahl(z)} Fragen insgesamt`, () => 'Über alle Modi und Kurse gezählt.',
      [50, 250, 1000, 3000, 10000], [L(200, 5), L(600, 15), L(2000, 50), L(6000, 150), L(20000, 500)], totalAnswered),
    ...reihe(a, 'random', '🎲', (z) => `${z} Random-Runs`, () => 'Alles gemischt – Random Mode gespielt.',
      [1, 5, 20], [L(150, 4), L(500, 12), L(1800, 45)], (d) => modeProgress(d, 'random').runs),
    ...reihe(a, 'xp', '🌟', (z) => `${zahl(z)} XP gesammelt`, () => 'Dein Gesamtstand an Erfahrung.',
      [500, 2500, 10000, 50000], [L(300, 8), L(1200, 30), L(4000, 100), L(15000, 400)], (d) => d.xp),
    ...reihe(a, 'level', '📈', (z) => `Level ${z}`, () => 'Dein Level aus allen XP.',
      [3, 5, 10, 20], [L(250, 6), L(600, 15), L(2000, 50), L(7000, 180)], (d) => levelFor(d.xp).level),
    ...reihe(a, 'erfolge', '🏅', (z) => `${z} Erfolge`, () => 'Achievements aus allen Bereichen.',
      [5, 10, 20], [L(400, 10), L(1200, 30), L(3500, 90)], (d) => Object.keys(d.achievements).filter((id) => ACHIEVEMENTS.some((x) => x.id === id)).length),
  )
  RANKS.slice(1).forEach((rank, i) => {
    liste.push({
      id: `${a}:rang:${rank.id}`,
      emoji: '🎖️',
      titel: `Rang ${rank.name}`,
      text: `Erreiche den Rang ${rank.name} (${zahl(rank.from)} XP).`,
      gruppe: a,
      lohn: [L(500, 12), L(1500, 40), L(4000, 100), L(9000, 220), L(20000, 500), L(50000, 1200)][i] ?? L(50000, 1200),
      stand: (d) => ({ wert: rankFor(d.xp).index, ziel: i + 1 }),
    })
  })

  // ---------- Flaggen: sichere Flaggen und Kontinente ----------
  const f = 'flaggen'
  const sicher = (d: SaveData) => COUNTRIES.filter((c) => flagState(d.stats[c.code]) === 'solid').length
  liste.push(
    ...reihe(f, 'sicher', '🚩', (z) => (z >= COUNTRIES.length ? 'Alle Flaggen sicher' : `${z} Flaggen sicher`), () => 'Flaggen, die du sicher erkennst.',
      [25, 60, 120, COUNTRIES.length], [L(500, 12), L(1200, 30), L(3000, 80), L(10000, 250)], sicher),
    {
      id: `${f}:gesehen:alle`,
      emoji: '🗺️',
      titel: 'Jede Flagge gesehen',
      text: 'Alle Flaggen der Welt mindestens einmal gesehen.',
      gruppe: f,
      lohn: L(2000, 50),
      stand: (d) => ({ wert: COUNTRIES.filter((c) => (d.stats[c.code]?.seen ?? 0) > 0).length, ziel: COUNTRIES.length }),
    },
  )
  for (const continent of CONTINENTS) {
    liste.push({
      id: `${f}:kontinent:${continent.id}`,
      emoji: '🏆',
      titel: `${continent.name} bestanden`,
      text: `Bestehe den Abschlusstest von ${continent.name}.`,
      gruppe: f,
      lohn: L(800, 20),
      stand: (d) => ({ wert: d.progress[continent.id]?.passed ? 1 : 0, ziel: 1 }),
    })
  }
  liste.push({
    id: `${f}:kontinent:alle`,
    emoji: '🌍',
    titel: 'Weltmeister',
    text: 'Alle Abschlusstests bestanden.',
    gruppe: f,
    lohn: L(5000, 120),
    stand: (d) => ({ wert: CONTINENTS.filter((c) => d.progress[c.id]?.passed).length, ziel: CONTINENTS.length }),
  })

  // ---------- Math Runner ----------
  const m = 'math'
  liste.push(
    ...reihe(m, 'punkte', '🧮', (z) => `${zahl(z)} Punkte`, () => 'Highscore im Math Runner.',
      [300, 1000, 3000, 8000], [L(200, 5), L(600, 15), L(1800, 45), L(5000, 120)], (d) => d.mathRunner?.highScore ?? 0),
    ...reihe(m, 'stufe', '🚀', (z) => `Stufe ${z} erreicht`, () => 'Schwierigkeitsstufe im Math Runner.',
      [2, 3, 4], [L(400, 10), L(1000, 25), L(2500, 60)], (d) => d.mathRunner?.bestStage ?? 0),
    ...reihe(m, 'laeufe', '🏁', (z) => `${z} Läufe`, () => 'Math-Runner-Läufe gespielt.',
      [3, 15], [L(150, 4), L(800, 20)], (d) => d.mathRunner?.runs ?? 0),
  )

  // ---------- Kurse ----------
  for (const kurs of KURSE) {
    const g = `kurs:${kurs.id}`
    const s = (d: SaveData) => kursStand(d, kurs.id)
    liste.push(
      ...reihe(g, 'sitzungen', '📚', (z) => (z === 1 ? 'Erste Session' : `${z} Sessions`), () => `Sessions im Kurs ${kurs.titel} abgeschlossen.`,
        [1, 5, 20], [L(200, 5), L(700, 18), L(2500, 60)], (d) => s(d)?.sitzungen ?? 0),
      ...reihe(g, 'perfekt', '🏆', (z) => (z === 1 ? 'Perfekte Session' : `${z} perfekte Sessions`), () => `Sessions in ${kurs.titel} ohne Fehler.`,
        [1, 5], [L(800, 20), L(3000, 75)], (d) => s(d)?.perfekt ?? 0),
      {
        id: `${g}:combo:5`,
        emoji: '🔥',
        titel: '5er-Combo',
        text: `Fünf Challenges in Folge geschafft in ${kurs.titel}.`,
        gruppe: g,
        lohn: L(500, 12),
        stand: (d) => ({ wert: s(d)?.bestCombo ?? 0, ziel: 5 }),
      },
    )
  }

  LISTE = liste
  return liste
}

export const herausforderungById = (id: string) => alleHerausforderungen().find((h) => h.id === id)

/** Gruppen in Anzeige-Reihenfolge */
export function gruppen(): Gruppe[] {
  return [
    { id: 'alle', name: 'Allgemein', emoji: '🌟' },
    ...quizModes().map((mode) => ({ id: mode.id, name: mode.name, emoji: mode.emoji })),
    { id: 'math', name: 'Math Runner', emoji: '🧮' },
    ...KURSE.map((kurs) => ({ id: `kurs:${kurs.id}`, name: kurs.titel, emoji: kurs.emoji })),
  ]
}

export const istGeschafft = (data: SaveData, id: string): boolean => !!data.herausforderungen?.[id]

/** Fortschritt 0 bis 1 */
export function fortschritt(data: SaveData, h: Herausforderung): number {
  const { wert, ziel } = h.stand(data)
  return ziel <= 0 ? 1 : Math.max(0, Math.min(1, wert / ziel))
}

/** Was insgesamt schon verdient wurde und was noch offen ist */
export function bilanz(data: SaveData): { geschafft: number; gesamt: number; verdient: Lohn; offen: Lohn } {
  const verdient = L(0, 0)
  const offen = L(0, 0)
  let geschafft = 0
  for (const h of alleHerausforderungen()) {
    const ziel = istGeschafft(data, h.id) ? verdient : offen
    if (ziel === verdient) geschafft++
    ziel.coins += h.lohn.coins
    ziel.materials += h.lohn.materials
  }
  return { geschafft, gesamt: alleHerausforderungen().length, verdient, offen }
}

/**
 * Prüft alle offenen Herausforderungen und löst die geschafften ein: Münzen und Ziegel
 * gehen in die Stadt. Ohne Stadt bleibt alles offen – eingelöst wird, sobald es eine gibt.
 */
export function pruefeHerausforderungen(data: SaveData, now: number): { data: SaveData; geschafft: string[] } {
  if (!data.city) return { data, geschafft: [] }
  const geschafft: string[] = []
  let city = data.city
  for (const h of alleHerausforderungen()) {
    if (data.herausforderungen?.[h.id]) continue
    const { wert, ziel } = h.stand(data)
    if (wert < ziel) continue
    geschafft.push(h.id)
    city = grant(city, h.lohn.coins, h.lohn.materials)
  }
  if (geschafft.length === 0) return { data, geschafft }
  const eingeloest = { ...data.herausforderungen }
  for (const id of geschafft) eingeloest[id] = now
  return { data: { ...data, city, herausforderungen: eingeloest }, geschafft }
}

/** Summe der Belohnungen einer Liste geschaffter Herausforderungen */
export function lohnVon(ids: readonly string[]): Lohn {
  const summe = L(0, 0)
  for (const id of ids) {
    const h = herausforderungById(id)
    if (!h) continue
    summe.coins += h.lohn.coins
    summe.materials += h.lohn.materials
  }
  return summe
}
