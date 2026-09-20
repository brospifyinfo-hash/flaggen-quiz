// Die Session als Zustandsmaschine – reine Funktionen auf dem Spielstand.
// Starten → Aktivität spielen → abrechnen → nächste → … → Bilanz. Jede Aktivität wird genau
// einmal abgerechnet; wer mittendrin aufhört, behält, was schon verdient ist.
import { checkAchievements } from '../progression'
import { pointsOf } from '../knowledge'
import type { ModeProgress, SaveData } from '../types'
import { GESCHAFFT_AB, gutschreiben, modusVon, neuFreigeschaltet, PERFEKT_BONUS, xpFuer } from './belohnung'
import { kursStand, lernen, mitKurs, mitLernen, itemNachher, serieNachher, spielNachher } from './fortschritt'
import { inhaltVon, kursById } from './kurse'
import { zielNachher } from './meisterschaft'
import { aktivitaetFuer, planeSitzung } from './planer'
import type { Aktivitaet, AktivitaetsErgebnis, KursSitzung, RundenErgebnis, SitzungsBilanz } from './typen'
import { ableiten, neuerSamen, zufall } from './zufall'

export const LAENGEN = [
  { id: 'kurz', name: 'Kurz', anzahl: 3 },
  { id: 'standard', name: 'Standard', anzahl: 5 },
  { id: 'lang', name: 'Lang', anzahl: 8 },
] as const

const VERLAUF = 12

/** IDs der Inhalte einer Aktivität */
export const itemIds = (akt: Aktivitaet): string[] => akt.items.map((item) => (typeof item === 'string' ? item : item.id))

/** Nur Runden gelten, die zu den Inhalten der Aktivität gehören – und jede nur einmal */
export function bereinigt(akt: Aktivitaet, ergebnis: AktivitaetsErgebnis): AktivitaetsErgebnis {
  const erlaubt = new Set(itemIds(akt))
  const gesehen = new Set<string>()
  const runden: RundenErgebnis[] = []
  for (const runde of ergebnis.runden) {
    if (!erlaubt.has(runde.id) || gesehen.has(runde.id)) continue
    gesehen.add(runde.id)
    const punkte = Number.isFinite(runde.punkte) ? Math.max(0, Math.min(1, runde.punkte)) : 0
    const stufe = ([1, 2, 3, 4, 5] as const).includes(runde.stufe) ? runde.stufe : akt.stufe
    runden.push({ id: runde.id, ziel: typeof runde.ziel === 'string' ? runde.ziel : akt.ziel, stufe, punkte })
  }
  const punkte = Number.isFinite(ergebnis.punkte) ? Math.max(0, Math.min(1, ergebnis.punkte)) : 0
  return { punkte, runden, ...(ergebnis.uebersprungen ? { uebersprungen: true } : {}) }
}

/**
 * Lernstand fortschreiben: Lernziele, Inhalte, Spiele, Verlauf, Tagesserie und die Statistik
 * des Kurs-Modus. XP gehören nicht hierher – die vergibt der Aufrufer über die zentrale Kette.
 */
export function wendeErgebnisAn(
  data: SaveData,
  akt: Aktivitaet,
  roh: AktivitaetsErgebnis,
  combo: number,
  jetzt: number,
  { statistik = true }: { statistik?: boolean } = {},
): SaveData {
  const ergebnis = bereinigt(akt, roh)
  let next = mitKurs(data, akt.kurs, (stand) => {
    const ziele = { ...stand.ziele }
    const items = { ...stand.items }
    for (const runde of ergebnis.runden) {
      ziele[runde.ziel] = zielNachher(ziele[runde.ziel], runde.stufe, runde.punkte, jetzt)
      if (!runde.id.startsWith('gen:')) items[runde.id] = itemNachher(items[runde.id], runde.punkte, jetzt)
    }
    // Ohne einzelne Runden zählt die Aktivität als Ganzes für ihr Lernziel
    if (ergebnis.runden.length === 0) ziele[akt.ziel] = zielNachher(ziele[akt.ziel], akt.stufe, ergebnis.punkte, jetzt)
    return {
      ...stand,
      ziele,
      items,
      spiele: { ...stand.spiele, [akt.spiel]: spielNachher(stand.spiele[akt.spiel], ergebnis.punkte, jetzt) },
      aktivitaeten: stand.aktivitaeten + 1,
      bestCombo: Math.max(stand.bestCombo, combo),
      zuletzt: jetzt,
      verlauf: [akt.spiel, ...stand.verlauf].slice(0, VERLAUF),
      ...serieNachher(stand, jetzt),
    }
  })
  next = mitLernen(next, (l) => ({ ...l, verlauf: [akt.spiel, ...l.verlauf].slice(0, VERLAUF) }))

  // Die Aktivität zählt auch in der allgemeinen Statistik – für Fragen-Zähler und Achievements.
  // Im Random Mode zählt der Run selbst; dort bleibt das hier aus.
  if (!statistik) return next
  const modus = modusVon(akt.kurs)
  const vorher: ModeProgress = next.modes[modus] ?? {
    answered: 0,
    correct: 0,
    runs: 0,
    bestCombo: 0,
    bestXp: 0,
    bestQuestions: 0,
    bestAccuracy: 0,
    lastPlayed: 0,
  }
  return {
    ...next,
    modes: {
      ...next.modes,
      [modus]: {
        ...vorher,
        answered: vorher.answered + 1,
        correct: vorher.correct + (ergebnis.punkte >= GESCHAFFT_AB ? 1 : 0),
        bestCombo: Math.max(vorher.bestCombo, combo),
        lastPlayed: jetzt,
      },
    },
  }
}

/** Neue Session. Die Inhalte des Kurses müssen geladen sein. */
export function starteSitzung(
  data: SaveData,
  kursId: string,
  laenge: number,
  optionen: { modul?: string | null; seed?: number; jetzt?: number } = {},
): SaveData {
  const kurs = kursById(kursId)
  const inhalt = inhaltVon(kursId)
  if (!kurs || !inhalt) return data
  const jetzt = optionen.jetzt ?? Date.now()
  const seed = (optionen.seed ?? neuerSamen()) >>> 0
  const stand = kursStand(data, kursId)
  const { plan } = planeSitzung(kurs, inhalt, stand, Math.max(1, Math.min(8, laenge)), zufall(seed), {
    modul: optionen.modul ?? null,
    verlauf: lernen(data).verlauf,
    jetzt,
  })
  if (plan.length === 0) return data
  const aktuell = aktivitaetFuer(kurs, inhalt, stand, plan[0], { seed: ableiten(seed, 0), jetzt, finale: plan.length === 1 })
  if (!aktuell) return data
  const vorherZiele: Record<string, number> = {}
  for (const ziel of kurs.ziele) vorherZiele[ziel.id] = stand?.ziele[ziel.id]?.t ?? 0
  const sitzung: KursSitzung = {
    kurs: kursId,
    seed,
    laenge: plan.length,
    modul: optionen.modul ?? null,
    plan,
    index: 0,
    aktuell,
    fertig: false,
    bilanz: [],
    combo: 0,
    bestCombo: 0,
    xp: 0,
    muenzen: 0,
    material: 0,
    wissen: 0,
    vorher: { ziele: vorherZiele, punkte: pointsOf(data, kurs.domain) },
    gesehen: itemIds(aktuell),
    erfolge: [],
    start: jetzt,
  }
  return mitLernen(data, (l) => ({ ...l, sitzung }))
}

/** Die laufende Aktivität abrechnen – genau einmal */
export function schliesseAb(data: SaveData, roh: AktivitaetsErgebnis, jetzt = Date.now()): SaveData {
  const s = lernen(data).sitzung
  const kurs = s ? kursById(s.kurs) : undefined
  if (!s || !s.aktuell || s.fertig || !kurs) return data
  const akt = s.aktuell
  const ergebnis = bereinigt(akt, roh)
  // Übersprungen (Inhalte fehlten): weiter, ohne Wertung und ohne die Combo zu brechen
  if (ergebnis.uebersprungen) {
    const bilanz = [...s.bilanz, { spiel: akt.spiel, ziel: akt.ziel, stufe: akt.stufe, punkte: 0, xp: 0 }]
    return mitLernen(data, (l) => ({ ...l, sitzung: { ...s, fertig: true, bilanz } }))
  }
  const geschafft = ergebnis.punkte >= GESCHAFFT_AB
  const combo = geschafft ? s.combo + 1 : 0
  const xp = xpFuer(ergebnis.punkte, akt.stufe, s.combo)

  const gelernt = wendeErgebnisAn(data, akt, ergebnis, combo, jetzt)
  const gut = gutschreiben(gelernt, xp, kurs)
  const geprueft = checkAchievements(gut.data, jetzt)

  const sitzung: KursSitzung = {
    ...s,
    fertig: true,
    combo,
    bestCombo: Math.max(s.bestCombo, combo),
    bilanz: [...s.bilanz, { spiel: akt.spiel, ziel: akt.ziel, stufe: akt.stufe, punkte: ergebnis.punkte, xp: gut.xp }],
    xp: s.xp + gut.xp,
    muenzen: s.muenzen + gut.muenzen,
    material: s.material + gut.material,
    wissen: s.wissen + gut.wissen,
    erfolge: [...s.erfolge, ...geprueft.unlocked],
  }
  return mitLernen(geprueft.data, (l) => ({ ...l, sitzung }))
}

/** Wie schwer die nächste Aktivität wird: Pause nach Fehlschlägen, Herausforderung nach Serien */
export function anpassungFuer(s: KursSitzung, finale: boolean): number {
  const punkte = s.bilanz.map((b) => b.punkte)
  const letzte2 = punkte.slice(-2)
  const letzte3 = punkte.slice(-3)
  if (letzte2.length === 2 && letzte2.every((p) => p < 0.5)) return -1
  if (letzte3.length === 3 && letzte3.every((p) => p >= 0.9)) return 1
  if (finale && punkte.length > 0 && punkte.reduce((a, b) => a + b, 0) / punkte.length >= 0.75) return 1
  return 0
}

/** Weiter zur nächsten Aktivität – oder zur Bilanz, wenn alle gespielt sind */
export function naechste(data: SaveData, jetzt = Date.now()): SaveData {
  const s = lernen(data).sitzung
  const kurs = s ? kursById(s.kurs) : undefined
  const inhalt = s ? inhaltVon(s.kurs) : null
  if (!s || !s.fertig || !kurs || !inhalt) return data
  const stand = kursStand(data, s.kurs)
  for (let index = s.index + 1; index < s.plan.length; index++) {
    const finale = index === s.plan.length - 1
    const aktuell = aktivitaetFuer(kurs, inhalt, stand, s.plan[index], {
      seed: ableiten(s.seed, index),
      anpassung: anpassungFuer(s, finale),
      gesehen: new Set(s.gesehen),
      jetzt,
      finale,
    })
    if (!aktuell) continue
    const sitzung: KursSitzung = { ...s, index, aktuell, fertig: false, gesehen: [...s.gesehen, ...itemIds(aktuell)] }
    return mitLernen(data, (l) => ({ ...l, sitzung }))
  }
  return beende(data, jetzt)
}

/** Die Session abschließen: Bonus, Zähler, Bilanz. Ohne gespielte Aktivität: einfach verwerfen. */
export function beende(data: SaveData, jetzt = Date.now()): SaveData {
  const s = lernen(data).sitzung
  if (!s) return data
  const kurs = kursById(s.kurs)
  if (!kurs || s.bilanz.length === 0) return mitLernen(data, (l) => ({ ...l, sitzung: null }))

  const perfekt = s.bilanz.length === s.laenge && s.laenge >= 3 && s.bilanz.every((b) => b.punkte >= 0.9)
  const bonus = perfekt ? gutschreiben(data, PERFEKT_BONUS, kurs) : null
  let next = bonus?.data ?? data
  next = mitKurs(next, s.kurs, (stand) => ({
    ...stand,
    sitzungen: stand.sitzungen + 1,
    perfekt: stand.perfekt + (perfekt ? 1 : 0),
    bestCombo: Math.max(stand.bestCombo, s.bestCombo),
  }))
  const geprueft = checkAchievements(next, jetzt)
  next = geprueft.data

  const stand = kursStand(next, s.kurs)
  const beruehrt = [...new Set(s.bilanz.map((b) => b.ziel))]
  // Alle Lernziele, die sich bewegt haben – nicht nur die geplanten
  const ziele = kurs.ziele
    .map((ziel) => ({ id: ziel.id, vorher: s.vorher.ziele[ziel.id] ?? 0, nachher: stand?.ziele[ziel.id]?.t ?? 0 }))
    .filter((z) => Math.abs(z.nachher - z.vorher) > 0.0005 || beruehrt.includes(z.id))
    .sort((a, b) => b.nachher - b.vorher - (a.nachher - a.vorher))

  const bilanz: SitzungsBilanz = {
    kurs: s.kurs,
    laenge: s.laenge,
    aktivitaeten: s.bilanz,
    xp: s.xp + (bonus?.xp ?? 0),
    muenzen: s.muenzen + (bonus?.muenzen ?? 0),
    material: s.material + (bonus?.material ?? 0),
    wissen: s.wissen + (bonus?.wissen ?? 0),
    bestCombo: s.bestCombo,
    perfekt,
    bonus: bonus?.xp ?? 0,
    ziele,
    freigeschaltet: neuFreigeschaltet({ [kurs.domain]: s.vorher.punkte }, next),
    erfolge: [...s.erfolge, ...geprueft.unlocked],
    ende: jetzt,
  }
  return mitLernen(next, (l) => ({ ...l, sitzung: null, letzte: bilanz }))
}

/** Vorzeitig aufhören: Was gespielt ist, bleibt; ohne Aktivität keine Bilanz */
export const brichAb = (data: SaveData, jetzt = Date.now()): SaveData => beende(data, jetzt)

/** Vorliebe für ein Spiel merken: mehr davon oder weniger – nie ganz weg */
export function merkeVorliebe(data: SaveData, kurs: string, spiel: string, mag: -1 | 0 | 1): SaveData {
  return mitKurs(data, kurs, (stand) => {
    const vorher = stand.spiele[spiel] ?? { n: 0, summe: 0, zuletzt: 0 }
    const { mag: _alt, ...rest } = vorher
    return { ...stand, spiele: { ...stand.spiele, [spiel]: mag === 0 ? rest : { ...rest, mag } } }
  })
}

export const laufendeSitzung = (data: SaveData): KursSitzung | null => lernen(data).sitzung

