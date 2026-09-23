// Der Tag der Stadt. Ein Stadttag hat 24 Stadtstunden und dauert sechs echte Stunden;
// er läuft auch, wenn niemand zuschaut. Steht der Zeiger wieder oben, ist Tagesabschluss:
// Die Kasse bekommt die Einnahmen, der Bauhof liefert Ziegel. Quiz und Kurse bringen
// keine Münzen mehr, sondern spulen die Uhr vor – wer lernt, erlebt den Abschluss früher.
import type { CityState } from './types'

/** Eine Stadtstunde in echten Millisekunden: 24 Stadtstunden = 6 echte Stunden */
export const STUNDE_MS = 15 * 60 * 1000
export const TAG_MS = 24 * STUNDE_MS
/** So viele Stadttage werden höchstens nachgeholt – eine echte Woche, länger stapelt sich kein Ertrag */
export const MAX_TAGE = 28
/** Wie lange ein Stadttag wirklich dauert, lesbar */
export const TAG_TEXT = '6 Stunden'

export type Tagesphase = 'morgen' | 'mittag' | 'abend' | 'nacht'

export interface PhaseInfo {
  id: Tagesphase
  name: string
  /** Stunde, ab der die Phase gilt */
  von: number
  bis: number
  /** was in der Stadt gerade los ist */
  text: string
}

/** Der Tag beginnt am Morgen und endet mit der Nacht – dann ist Tagesabschluss */
export const PHASEN: PhaseInfo[] = [
  { id: 'morgen', name: 'Morgen', von: 0, bis: 6, text: 'Die Stadt wacht auf, die Bäckereien öffnen.' },
  { id: 'mittag', name: 'Mittag', von: 6, bis: 12, text: 'Volle Straßen, volle Läden – die Kassen klingeln.' },
  { id: 'abend', name: 'Abend', von: 12, bis: 18, text: 'Die Läden schließen, Bars und Clubs füllen sich.' },
  { id: 'nacht', name: 'Nacht', von: 18, bis: 24, text: 'Die Stadt schläft. Am Morgen wird abgerechnet.' },
]

export const phaseInfo = (phase: Tagesphase): PhaseInfo => PHASEN.find((p) => p.id === phase) ?? PHASEN[0]

export interface Tageszeit {
  /** 0 bis 1 – wie weit der Tag ist */
  anteil: number
  /** 0 bis 24 */
  stunde: number
  phase: Tagesphase
  /** bis zum Tagesabschluss, in Millisekunden */
  rest: number
}

/**
 * Nur beim Entwickeln: Mit `?stunde=20` in der Adresse steht die Uhr fest, damit man
 * Licht und Schatten jeder Tageszeit prüfen kann. Im fertigen Spiel gibt es das nicht.
 */
function festeStunde(): number | null {
  if (!import.meta.env.DEV || typeof location === 'undefined') return null
  const wert = new URLSearchParams(location.search).get('stunde')
  if (wert === null) return null
  const stunde = Number(wert)
  return Number.isFinite(stunde) ? ((stunde % 24) + 24) % 24 : null
}

/** Wo der Zeiger gerade steht. Vorgespulte Zeit steckt bereits in lastTick. */
export function tageszeit(city: CityState, now = Date.now()): Tageszeit {
  const last = city.lastTick > 0 ? city.lastTick : now
  const vergangen = Math.max(0, now - last)
  const imTag = vergangen % TAG_MS
  const anteil = imTag / TAG_MS
  const stunde = festeStunde() ?? anteil * 24
  const phase = PHASEN.find((p) => stunde >= p.von && stunde < p.bis)?.id ?? 'nacht'
  return { anteil, stunde, phase, rest: TAG_MS - imTag }
}

/** Ist ein Tagesabschluss fällig? */
export const tagFaellig = (city: CityState, now = Date.now()): boolean =>
  city.lastTick > 0 && now - city.lastTick >= TAG_MS

/**
 * Die Uhr vorspulen. Der Beginn des Tages rückt nach hinten, dadurch steht der Zeiger
 * weiter vorn – und der Tagesabschluss kommt früher. Alles, was darüber hinaus in die
 * Vergangenheit rutscht, holt runCycles als weitere Tage nach.
 */
export function vorspulen(city: CityState, ms: number, now = Date.now()): CityState {
  const plus = Math.max(0, Math.round(ms))
  if (plus === 0) return city
  const last = city.lastTick > 0 ? city.lastTick : now
  // Nie weiter zurück als der Deckel – sonst verfiele Vorsprung ungenutzt. Wer ohnehin
  // schon länger weg ist, behält seinen Stand: Vorspulen rückt die Uhr nie vor.
  const fruehestens = now - MAX_TAGE * TAG_MS
  const ziel = last - plus
  return { ...city, lastTick: ziel < fruehestens ? Math.min(last, fruehestens) : ziel }
}

/** "6 Std", "2 Std 30 Min", "45 Min", "30 Sek" */
export function zeitText(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s} Sek`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} Min`
  const h = Math.floor(m / 60)
  const restMin = m % 60
  if (h >= 24) {
    const d = Math.floor(h / 24)
    const restH = h % 24
    return restH > 0 ? `${d} ${d === 1 ? 'Tag' : 'Tage'} ${restH} Std` : `${d} ${d === 1 ? 'Tag' : 'Tage'}`
  }
  return restMin > 0 ? `${h} Std ${restMin} Min` : `${h} Std`
}
