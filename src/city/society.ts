// Die Gesellschaft der Stadt: wer hier wohnt, wie reich, wie sicher. Alles ist reine
// Rechnung aus Bauwerken, Einwohnerzahl und Steuersatz – nichts davon wird gespeichert,
// und jede Anzeige zeigt genau das, womit das Spiel rechnet.
//
// Kriminalität entsteht aus Armut, Arbeitslosigkeit, fehlender Bildung und dunklen
// Geschäften. Sie wird für jede Kachel gerechnet: Ein Viertel mit Schule und Wache ist
// sicherer als eines mit Spielhalle und ohne Polizei.
import { buildingDef, effectsOf, footprint, type Klasse } from './catalog'
import type { CityState, Placed } from './types'

export const KLASSEN: Klasse[] = ['arm', 'mittel', 'reich', 'superreich']

/** Steuern je Einwohner und Zyklus bei 100 % – Reiche tragen deutlich mehr */
const STEUERBASIS: Record<Klasse, number> = { arm: 6, mittel: 30, reich: 90, superreich: 600 }

/** Wie viel Vermögen jemand dieser Klasse hat – von bis, in Euro */
const VERMOEGEN: Record<Klasse, [number, number]> = {
  arm: [0, 18_000],
  mittel: [60_000, 900_000],
  reich: [3_000_000, 90_000_000],
  superreich: [1_200_000_000, 84_000_000_000],
}

export const STEUER_MIN = 0
export const STEUER_MAX = 30
export const STEUER_START = 10

export interface Gesellschaft {
  einwohner: number
  /** Einwohner je Klasse */
  klassen: Record<Klasse, number>
  /** Wohnraum je Klasse, nach Steuern und Kriminalität – so viele wollen hier wohnen */
  platz: Record<Klasse, number>
  obdachlose: number
  milliardaere: number
  reichster: { name: string; vermoegen: number; klasse: Klasse } | null
  arbeitsplaetze: number
  arbeitslose: number
  /** 0–100: Bildungsangebot je Kopf */
  bildung: number
  /** 0–100: dort gemessen, wo die Menschen wohnen */
  kriminalitaet: number
  schwarzgeld: number
  steuern: number
  abdeckung: { polizei: number; feuer: number; gesundheit: number }
}

/**
 * Gemerkt wird je Stadtstand – aber nur, solange sich nichts geändert hat, das in die
 * Rechnung eingeht. Ein Stand darf nachträglich verändert werden (etwa beim Gründen,
 * wenn die ersten Bewohner einziehen); dann wird neu gerechnet statt Altes gezeigt.
 */
type Stempel = { population: number; tax: number; land: number; buildings: unknown; roads: unknown }
const stempelVon = (city: CityState): Stempel => ({
  population: city.population,
  tax: city.tax,
  land: city.land,
  buildings: city.buildings,
  roads: city.roads,
})
const gleich = (a: Stempel, b: Stempel) =>
  a.population === b.population && a.tax === b.tax && a.land === b.land && a.buildings === b.buildings && a.roads === b.roads
const merk = new WeakMap<CityState, { stempel: Stempel; wert: Gesellschaft }>()
const felder = new WeakMap<CityState, { stempel: Stempel; wert: Float32Array }>()

export const steuerVon = (city: CityState): number =>
  Math.max(STEUER_MIN, Math.min(STEUER_MAX, Math.round(city.tax ?? STEUER_START)))

/** Grundstücksmitte */
const mitte = (placed: Placed) => {
  const def = buildingDef(placed.type)
  const [w, h] = def ? footprint(def, placed.rot) : [1, 1]
  return { x: placed.x + w / 2, y: placed.y + h / 2 }
}

/** Sanftes Abklingen mit der Entfernung – 1 am Ort, 0 am Rand der Reichweite */
const abklingen = (d: number, reichweite: number) => (d >= reichweite ? 0 : 1 - d / reichweite)

/** Wie gut ein Punkt von Wachen einer Art abgedeckt ist: 0 bis 1 */
function abgedeckt(city: CityState, x: number, y: number, art: 'police' | 'fire' | 'health'): number {
  let best = 0
  for (const placed of city.buildings) {
    const def = buildingDef(placed.type)
    const reichweite = def?.effects[art]
    if (!def || !reichweite) continue
    const m = mitte(placed)
    const d = Math.hypot(m.x - x, m.y - y)
    best = Math.max(best, d <= reichweite ? 1 - (d / reichweite) * 0.35 : 0)
  }
  return best
}

/** Grundpegel der Kriminalität für die ganze Stadt – aus Armut, Arbeit, Bildung und Steuern */
function grundpegel(city: CityState, g: Omit<Gesellschaft, 'kriminalitaet' | 'steuern' | 'schwarzgeld'>): number {
  if (city.population <= 0) return 0
  const armAnteil = g.klassen.arm / Math.max(1, g.einwohner)
  const ohneArbeit = g.arbeitslose / Math.max(1, g.einwohner * 0.55)
  const obdach = g.obdachlose / Math.max(1, g.einwohner)
  const steuer = Math.max(0, steuerVon(city) - 20)
  // Ein Dorf kennt keine organisierte Kriminalität – sie wächst mit der Stadt, und bis
  // sie voll durchschlägt, kann man längst Schule und Wache bauen
  const groesse = Math.min(1, g.einwohner / 200)
  return (armAnteil * 26 + ohneArbeit * 30 + (1 - g.bildung / 100) * 28 + obdach * 60) * groesse + steuer
}

/**
 * Kriminalität je Kachel, 0 bis 100. Dunkle Geschäfte strahlen in ihr Viertel, arme
 * Wohnhäuser heben den Pegel ein wenig; Wachen und Schulen drücken ihn.
 */
export function kriminalitaetsfeld(city: CityState): Float32Array {
  const stempel = stempelVon(city)
  const fertig = felder.get(city)
  if (fertig && gleich(fertig.stempel, stempel)) return fertig.wert
  const n = city.land
  const feld = new Float32Array(n * n)
  const g = basis(city)
  const pegel = grundpegel(city, g)

  type Quelle = { x: number; y: number; staerke: number; reichweite: number }
  const quellen: Quelle[] = []
  for (const placed of city.buildings) {
    const def = buildingDef(placed.type)
    if (!def) continue
    const m = mitte(placed)
    // Eine Ruine zieht Gesindel an
    if (placed.verlassen) {
      quellen.push({ ...m, staerke: 4, reichweite: 2 })
      continue
    }
    const e = effectsOf(def, placed.level)
    if (e.crime && e.crime > 0) quellen.push({ ...m, staerke: e.crime * 3.2, reichweite: 6 })
    if (e.crime && e.crime < 0) quellen.push({ ...m, staerke: e.crime * 3, reichweite: (e.police ?? 6) + 1 })
    if (e.police) quellen.push({ ...m, staerke: -28, reichweite: e.police })
    if (e.klasse === 'arm') quellen.push({ ...m, staerke: 6, reichweite: 4 })
    if (def.category === 'bildung' && (e.education ?? 0) > 0) quellen.push({ ...m, staerke: -Math.min(20, (e.education ?? 0) * 0.8), reichweite: 7 })
    if (def.id === 'laterne') quellen.push({ ...m, staerke: -3, reichweite: 2 })
  }

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let wert = pegel
      for (const q of quellen) {
        const d = Math.hypot(q.x - (x + 0.5), q.y - (y + 0.5))
        const f = abklingen(d, q.reichweite)
        if (f > 0) wert += q.staerke * f
      }
      feld[y * n + x] = Math.max(0, Math.min(100, wert))
    }
  }
  felder.set(city, { stempel, wert: feld })
  return feld
}

/** Kriminalität an einer Kachel */
export function kriminalitaetBei(city: CityState, x: number, y: number): number {
  const n = city.land
  const tx = Math.max(0, Math.min(n - 1, Math.floor(x)))
  const ty = Math.max(0, Math.min(n - 1, Math.floor(y)))
  return kriminalitaetsfeld(city)[ty * n + tx]
}

/** Der Teil, der ohne das Kriminalitätsfeld auskommt – sonst liefe die Rechnung im Kreis */
function basis(city: CityState): Omit<Gesellschaft, 'kriminalitaet' | 'steuern' | 'schwarzgeld'> {
  const steuer = steuerVon(city)
  const kap: Record<Klasse, number> = { arm: 0, mittel: 0, reich: 0, superreich: 0 }
  let arbeit = 0
  let bildungsPunkte = 0
  for (const placed of city.buildings) {
    const def = buildingDef(placed.type)
    if (!def || placed.verlassen) continue
    const e = effectsOf(def, placed.level)
    const klasse = def.effects.klasse
    if (klasse && e.capacity) kap[klasse] += e.capacity
    arbeit += Math.max(0, e.jobs ?? 0)
    bildungsPunkte += Math.max(0, e.education ?? 0)
  }
  // Reiche sind wählerisch: hohe Steuern vertreiben sie zuerst
  const platz: Record<Klasse, number> = {
    arm: kap.arm,
    mittel: kap.mittel,
    reich: Math.round(kap.reich * Math.max(0.25, Math.min(1, 1 - Math.max(0, steuer - 12) * 0.05))),
    superreich: Math.round(kap.superreich * Math.max(0.1, Math.min(1, 1 - Math.max(0, steuer - 10) * 0.07))),
  }
  const gesamt = KLASSEN.reduce((s, k) => s + platz[k], 0)
  const einwohner = Math.max(0, Math.min(city.population, gesamt))
  const klassen: Record<Klasse, number> = { arm: 0, mittel: 0, reich: 0, superreich: 0 }
  if (gesamt > 0) {
    let verteilt = 0
    for (const k of KLASSEN) {
      klassen[k] = Math.floor((einwohner * platz[k]) / gesamt)
      verteilt += klassen[k]
    }
    // Rundungsrest zu den Mittleren
    klassen.mittel += einwohner - verteilt
  }
  const arbeitsfaehig = Math.round(einwohner * 0.55)
  const arbeitslose = Math.max(0, arbeitsfaehig - arbeit)
  const bildung = einwohner > 0 ? Math.max(0, Math.min(100, Math.round((100 * bildungsPunkte) / (einwohner * 0.6 + 10)))) : 100
  const ohneArbeitAnteil = arbeitsfaehig > 0 ? arbeitslose / arbeitsfaehig : 0
  const obdachlose = Math.max(
    0,
    Math.round(klassen.arm * ohneArbeitAnteil * 0.3 + einwohner * Math.max(0, steuer - 20) * 0.005 + (einwohner > 30 && klassen.arm > 0 ? 1 : 0)),
  )
  const milliardaere = klassen.superreich
  return {
    einwohner,
    klassen,
    platz,
    obdachlose,
    milliardaere,
    reichster: reichsterBuerger(city, klassen),
    arbeitsplaetze: arbeit,
    arbeitslose,
    bildung,
    abdeckung: abdeckungVon(city),
  }
}

function abdeckungVon(city: CityState): Gesellschaft['abdeckung'] {
  let wohnen = 0
  let polizei = 0
  let gesundheit = 0
  let bauten = 0
  let feuer = 0
  for (const placed of city.buildings) {
    const def = buildingDef(placed.type)
    if (!def || def.category === 'natur' || def.category === 'schmuck' || def.category === 'wege' || placed.verlassen) continue
    const m = mitte(placed)
    bauten++
    feuer += abgedeckt(city, m.x, m.y, 'fire') > 0 ? 1 : 0
    const kap = effectsOf(def, placed.level).capacity ?? 0
    if (def.category === 'wohnen' && kap > 0) {
      wohnen += kap
      polizei += abgedeckt(city, m.x, m.y, 'police') > 0 ? kap : 0
      gesundheit += abgedeckt(city, m.x, m.y, 'health') > 0 ? kap : 0
    }
  }
  return {
    polizei: wohnen > 0 ? polizei / wohnen : 0,
    feuer: bauten > 0 ? feuer / bauten : 0,
    gesundheit: wohnen > 0 ? gesundheit / wohnen : 0,
  }
}

/** Die Gesellschaft dieser Stadt – einmal gerechnet, dann gemerkt */
export function gesellschaft(city: CityState): Gesellschaft {
  const stempel = stempelVon(city)
  const fertig = merk.get(city)
  if (fertig && gleich(fertig.stempel, stempel)) return fertig.wert
  const g = basis(city)
  const feld = kriminalitaetsfeld(city)
  const n = city.land

  // Kriminalität dort messen, wo die Menschen wohnen
  let summe = 0
  let gewicht = 0
  let schwarz = 0
  for (const placed of city.buildings) {
    const def = buildingDef(placed.type)
    if (!def || placed.verlassen) continue
    const e = effectsOf(def, placed.level)
    const m = mitte(placed)
    const wert = feld[Math.min(n - 1, Math.floor(m.y)) * n + Math.min(n - 1, Math.floor(m.x))]
    if (def.category === 'wohnen' && e.capacity) {
      summe += wert * e.capacity
      gewicht += e.capacity
    }
    if (e.black) schwarz += e.black * (1 - 0.6 * abgedeckt(city, m.x, m.y, 'police'))
  }
  const kriminalitaet = gewicht > 0 ? Math.round(summe / gewicht) : 0

  const satz = steuerVon(city) / 100
  const ehrlichkeit = 1 - kriminalitaet / 200
  let steuern = 0
  for (const k of KLASSEN) steuern += g.klassen[k] * STEUERBASIS[k] * satz
  steuern = Math.round(steuern * ehrlichkeit)

  const ergebnis: Gesellschaft = { ...g, kriminalitaet, schwarzgeld: Math.round(schwarz), steuern }
  merk.set(city, { stempel, wert: ergebnis })
  return ergebnis
}

// ---------- Namen und Vermögen ----------

const VORNAMEN = [
  'Konstantin', 'Viktoria', 'Friedrich', 'Charlotte', 'Maximilian', 'Amelie', 'Leopold', 'Helena', 'Alexander', 'Sophia',
  'Benedikt', 'Valentina', 'Cornelius', 'Isabella', 'Julius', 'Luise', 'Ferdinand', 'Clara', 'Theodor', 'Emilia',
  'Mehmet', 'Aylin', 'Luca', 'Nora', 'Jonas', 'Lena', 'Emre', 'Mia', 'Noah', 'Hannah',
]
const NACHNAMEN_REICH = ['von Adlerstein', 'von Hohenberg', 'zu Rabenfels', 'Goldmann', 'von Thurnau', 'Silberberg', 'von Eschenbach', 'Kronhausen', 'de Montfort', 'Achenbach']
const NACHNAMEN = ['Weber', 'Schneider', 'Yılmaz', 'Fischer', 'Wagner', 'Becker', 'Hoffmann', 'Kaya', 'Schulz', 'Koch', 'Novak', 'Richter']

const zahl = (text: string) => {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967295
}

/** Name und Vermögen eines Bewohners – fest an sein Haus gebunden */
export function bewohnerVon(placed: Placed, nr: number, klasse: Klasse): { name: string; vermoegen: number } {
  const s = zahl(`${placed.id}:${nr}`)
  const s2 = zahl(`${placed.id}:${nr}:n`)
  const vorname = VORNAMEN[Math.floor(s * VORNAMEN.length) % VORNAMEN.length]
  const nachnamen = klasse === 'superreich' || klasse === 'reich' ? NACHNAMEN_REICH : NACHNAMEN
  const nachname = nachnamen[Math.floor(s2 * nachnamen.length) % nachnamen.length]
  const [von, bis] = VERMOEGEN[klasse]
  // Vermögen sind ungleich verteilt: wenige haben sehr viel
  const vermoegen = Math.round(von + (bis - von) * Math.pow(zahl(`${placed.id}:${nr}:v`), 2.2))
  return { name: `${vorname} ${nachname}`, vermoegen }
}

function reichsterBuerger(city: CityState, klassen: Record<Klasse, number>): Gesellschaft['reichster'] {
  const rang: Klasse[] = ['superreich', 'reich', 'mittel', 'arm']
  for (const klasse of rang) {
    if (klassen[klasse] <= 0) continue
    let best: { name: string; vermoegen: number } | null = null
    for (const placed of city.buildings) {
      if (buildingDef(placed.type)?.effects.klasse !== klasse) continue
      for (let nr = 0; nr < 2; nr++) {
        const b = bewohnerVon(placed, nr, klasse)
        if (!best || b.vermoegen > best.vermoegen) best = b
      }
    }
    if (best) return { ...best, klasse }
  }
  return null
}

/** Vermögen lesbar: 12,4 Mrd. € – 3,1 Mio. € – 48.000 € */
export function euro(betrag: number): string {
  if (betrag >= 1e9) return `${(betrag / 1e9).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mrd. €`
  if (betrag >= 1e6) return `${(betrag / 1e6).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mio. €`
  return `${Math.round(betrag).toLocaleString('de-DE')} €`
}

/** Welche Wache deckt diesen Punkt ab? Für Einsätze: die nächste mit passender Aufgabe. */
export function wachenFuer(city: CityState, art: 'police' | 'fire' | 'health'): Placed[] {
  return city.buildings.filter((placed) => (buildingDef(placed.type)?.effects[art] ?? 0) > 0)
}

export const abdeckungBei = abgedeckt
