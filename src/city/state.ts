// Zustand und Regeln der Stadt: bauen, versetzen, drehen, ausbauen, abreißen.
// Alles hier ist reine Rechnung ohne Browser – dadurch in der Simulation prüfbar.
import {
  BUILDINGS,
  RATHAUS,
  buildingDef,
  effectsOf,
  footprint,
  maxLevel,
  nextUpgrade,
  roadDef,
  unlockInfo,
} from './catalog'
import type { Seite } from './geo'
import { leerstandSchritt, leerstandVon } from './leerstand'
import { REQUEST_COINS, REQUEST_MATERIALS, sanitizeRequest } from './requests'
import { gesellschaft, KLASSEN, kriminalitaetBei, STEUER_MAX, STEUER_MIN, STEUER_START, steuerVon } from './society'
import { DEFAULT_THEME, themeById } from './themes'
import {
  CITY_VERSION,
  type CityState,
  type CityStats,
  type CycleReport,
  type Part,
  type Placed,
} from './types'

/** So lange dauert ein Wirtschaftszyklus */
export const CYCLE_MS = 3 * 60 * 60 * 1000
/** So viele Zyklen werden höchstens nachgeholt – niemand soll tagelang Ertrag stapeln */
export const MAX_CYCLES = 8
/** Ab dieser Stimmung ziehen Menschen zu */
export const MOVE_IN_MOOD = 55
/** Darunter ziehen sie weg */
export const MOVE_OUT_MOOD = 35

/** Kantenlänge des Startgebiets in Kacheln */
export const START_LAND = 12
export const START_COINS = 2500
export const START_MATERIALS = 40

/** Ausbaustufen des Stadtgebiets. Die Stadt wächst dabei nach allen Seiten. */
export interface Expansion {
  land: number
  level: number
  coins: number
  materials: number
}

export const EXPANSIONS: Expansion[] = [
  { land: 18, level: 4, coins: 1800, materials: 30 },
  { land: 26, level: 9, coins: 6000, materials: 90 },
  { land: 36, level: 16, coins: 18000, materials: 240 },
  { land: 48, level: 26, coins: 45000, materials: 600 },
]

export const roadKey = (x: number, y: number) => `${x}:${y}`
export const roadAt = (city: CityState, x: number, y: number): string | undefined => city.roads[roadKey(x, y)]

export function createCity(name: string, motto: string, emblem: string, now = Date.now()): CityState {
  const city: CityState = {
    version: CITY_VERSION,
    name: name.trim().slice(0, 24) || 'Neustadt',
    motto: motto.trim().slice(0, 60),
    emblem: emblem || '🏙️',
    theme: DEFAULT_THEME,
    land: START_LAND,
    level: 1,
    coins: START_COINS,
    materials: START_MATERIALS,
    buildings: [],
    roads: {},
    population: 0,
    lastTick: now,
    request: null,
    helped: 0,
    lastRequest: 0,
    tax: STEUER_START,
    lastGrowth: now,
    nextId: 1,
    foundedAt: now,
  }

  // Eine Straße quer durch die Siedlung, dazu ein Fußweg zum Platz
  for (let x = 3; x <= 8; x++) city.roads[roadKey(x, 6)] = 'strasse'
  city.roads[roadKey(5, 7)] = 'weg'

  // Eine kleine Siedlung, die schon beim ersten Blick etwas hermacht – mit dem Rathaus
  // am Platz, das mit der Stadt wächst
  const start: [string, number, number][] = [
    [RATHAUS, 5, 3],
    ['platz', 5, 5],
    ['platz', 6, 5],
    ['haus', 4, 4],
    ['familienhaus', 7, 4],
    ['laden', 4, 7],
    ['brunnen', 6, 7],
    ['baum', 3, 5],
    ['baum', 8, 5],
    ['baum', 3, 8],
    ['baum', 7, 8],
    ['baum', 2, 3],
    ['baum', 9, 7],
  ]
  for (const [type, x, y] of start) {
    const def = buildingDef(type)
    if (!def) continue
    city.buildings.push({ id: `b${city.nextId++}`, type, x, y, rot: 0, level: 1, at: now })
  }
  // In der Startsiedlung wohnt von Anfang an jemand
  city.population = statsOf(city).capacity
  city.level = levelOf(statsOf(city))
  return city
}

/** Alle Kacheln, die ein Bauwerk belegt */
export function tilesOf(placed: Placed): { x: number; y: number }[] {
  const def = buildingDef(placed.type)
  if (!def) return []
  const [w, h] = footprint(def, placed.rot)
  const list: { x: number; y: number }[] = []
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) list.push({ x: placed.x + dx, y: placed.y + dy })
  }
  return list
}

export interface PlaceCheck {
  ok: boolean
  /** verständlicher Grund, wenn es nicht geht */
  reason?: string
}

/** Passt das Bauwerk dorthin? Prüft Gebiet, Platz und Geld. */
export function canPlace(
  city: CityState,
  type: string,
  x: number,
  y: number,
  rot: 0 | 1 | 2 | 3,
  options: { ignore?: string; free?: boolean; levels?: Record<string, number> } = {},
): PlaceCheck {
  const def = buildingDef(type)
  if (!def) return { ok: false, reason: 'Dieses Bauwerk gibt es nicht.' }
  // Was schon steht, darf immer versetzt werden – Freischaltregeln gelten nur fürs Neubauen
  if (!options.free) {
    const lock = unlockInfo(def, city.level, options.levels ?? {})
    if (!lock.ok) return { ok: false, reason: `Dafür fehlt dir noch: ${lock.missing.join(', ')}.` }
  }

  const [w, h] = footprint(def, rot)
  if (x < 0 || y < 0 || x + w > city.land || y + h > city.land) {
    return { ok: false, reason: 'Das liegt außerhalb deines Gebiets.' }
  }

  const taken = new Set<string>()
  for (const placed of city.buildings) {
    if (placed.id === options.ignore) continue
    for (const tile of tilesOf(placed)) taken.add(roadKey(tile.x, tile.y))
  }
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) {
      const key = roadKey(x + dx, y + dy)
      if (taken.has(key)) return { ok: false, reason: 'Hier steht schon etwas.' }
      if (city.roads[key]) return { ok: false, reason: 'Hier verläuft eine Straße.' }
    }
  }

  if (!options.free) {
    if (city.coins < def.coins) return { ok: false, reason: `Dir fehlen ${def.coins - city.coins} Münzen.` }
    if (city.materials < def.materials) {
      return { ok: false, reason: `Dir fehlen ${def.materials - city.materials} Materialien.` }
    }
  }
  return { ok: true }
}

/** Baut – gibt die Stadt unverändert zurück, wenn es nicht geht */
export function place(
  city: CityState,
  type: string,
  x: number,
  y: number,
  rot: 0 | 1 | 2 | 3,
  options: { now?: number; levels?: Record<string, number> } = {},
): CityState {
  const now = options.now ?? Date.now()
  const def = buildingDef(type)
  if (!def || !canPlace(city, type, x, y, rot, { levels: options.levels }).ok) return city
  const placed: Placed = { id: `b${city.nextId}`, type, x, y, rot, level: 1, at: now }
  const gebaut: CityState = {
    ...city,
    coins: city.coins - def.coins,
    materials: city.materials - def.materials,
    buildings: [...city.buildings, placed],
    nextId: city.nextId + 1,
  }

  // Neuer Wohnraum bleibt nicht leer: ein Teil zieht sofort ein, der Rest mit der Zeit
  const platz = effectsOf(def, 1).capacity ?? 0
  const willkommen = platz > 0 && happinessBreakdown(gebaut).total >= 50 ? Math.ceil(platz * 0.35) : 0
  return withLevel({
    ...gebaut,
    population: Math.min(statsOf(gebaut).capacity, gebaut.population + willkommen),
  })
}

/** Versetzen und Drehen kosten nichts – Ausprobieren soll sich lohnen */
export function moveTo(city: CityState, id: string, x: number, y: number, rot: 0 | 1 | 2 | 3): CityState {
  const placed = city.buildings.find((entry) => entry.id === id)
  if (!placed) return city
  if (!canPlace(city, placed.type, x, y, rot, { ignore: id, free: true }).ok) return city
  return {
    ...city,
    buildings: city.buildings.map((entry) => (entry.id === id ? { ...entry, x, y, rot } : entry)),
  }
}

/** Abreißen gibt die Hälfte zurück – bei Ruinen nichts, die sind nichts mehr wert */
export function remove(city: CityState, id: string): CityState {
  const placed = city.buildings.find((entry) => entry.id === id)
  const def = placed ? buildingDef(placed.type) : undefined
  if (!placed || !def || def.id === RATHAUS) return city
  // Was Zugezogene selbst gebaut haben, hast du nicht bezahlt – dafür gibt es nichts zurück
  const zurueck = placed.auto || placed.verlassen ? 0 : 1
  return withLevel({
    ...city,
    coins: city.coins + Math.round(def.coins / 2) * zurueck,
    materials: city.materials + Math.floor(def.materials / 2) * zurueck,
    buildings: city.buildings.filter((entry) => entry.id !== id),
  })
}

export function upgrade(city: CityState, id: string): CityState {
  const placed = city.buildings.find((entry) => entry.id === id)
  const def = placed ? buildingDef(placed.type) : undefined
  if (!placed || !def || def.id === RATHAUS || placed.verlassen) return city
  const step = nextUpgrade(def, placed.level)
  if (!step) return city
  if (city.coins < step.coins || city.materials < step.materials) return city
  return withLevel({
    ...city,
    coins: city.coins - step.coins,
    materials: city.materials - step.materials,
    buildings: city.buildings.map((entry) =>
      entry.id === id ? { ...entry, level: Math.min(maxLevel(def), entry.level + 1) } : entry,
    ),
  })
}

/** Was eine Sanierung kostet: die Hälfte des Neupreises */
export function sanierungsKosten(placed: Placed): { coins: number; materials: number } {
  const def = buildingDef(placed.type)
  if (!def) return { coins: 0, materials: 0 }
  return { coins: Math.round(def.coins / 2), materials: Math.ceil(def.materials / 2) }
}

/** Eine Ruine wieder bewohnbar machen – danach können Menschen einziehen, wenn die Lage passt */
export function sanieren(city: CityState, id: string): CityState {
  const placed = city.buildings.find((entry) => entry.id === id)
  if (!placed || !placed.verlassen) return city
  const kosten = sanierungsKosten(placed)
  if (city.coins < kosten.coins || city.materials < kosten.materials) return city
  return withLevel({
    ...city,
    coins: city.coins - kosten.coins,
    materials: city.materials - kosten.materials,
    buildings: city.buildings.map((entry) => {
      if (entry.id !== id) return entry
      const { verlassen: _weg, beschwerde: _auch, ...frisch } = entry
      return frisch
    }),
  })
}

/** Das Rathaus der Stadt – es gibt genau eines */
export const rathausVon = (city: CityState): Placed | undefined => city.buildings.find((b) => b.type === RATHAUS)

/** Auf welcher Ausbaustufe das Rathaus bei dieser Stadt-Stufe steht: alle drei Stufen ein Anbau */
export function rathausStufe(cityLevel: number): number {
  const def = buildingDef(RATHAUS)
  const max = def ? maxLevel(def) : 1
  return Math.max(1, Math.min(max, 1 + Math.floor((cityLevel - 1) / 3)))
}

// ---------- Straßen ----------

/** Liegt die Kachel frei für eine Straße? */
export function canPave(city: CityState, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= city.land || y >= city.land) return false
  const key = roadKey(x, y)
  for (const placed of city.buildings) {
    for (const tile of tilesOf(placed)) {
      if (roadKey(tile.x, tile.y) === key) return false
    }
  }
  return true
}

/** Was das Pflastern dieser Kacheln kostet – schon vorhandene gleiche Straßen sind gratis */
export function paveCost(city: CityState, tiles: { x: number; y: number }[], type: string) {
  const def = roadDef(type)
  if (!def) return { coins: 0, materials: 0, count: 0 }
  let count = 0
  for (const tile of tiles) {
    if (!canPave(city, tile.x, tile.y)) continue
    if (roadAt(city, tile.x, tile.y) === type) continue
    count += 1
  }
  return { coins: count * def.coins, materials: count * def.materials, count }
}

/** Legt Straße auf die Kacheln, die frei sind. Zu teure Kacheln bleiben leer. */
export function pave(city: CityState, tiles: { x: number; y: number }[], type: string): CityState {
  const def = roadDef(type)
  if (!def) return city
  const roads = { ...city.roads }
  let coins = city.coins
  let materials = city.materials
  let changed = false

  for (const tile of tiles) {
    if (!canPave(city, tile.x, tile.y)) continue
    const key = roadKey(tile.x, tile.y)
    if (roads[key] === type) continue
    if (coins < def.coins || materials < def.materials) break
    coins -= def.coins
    materials -= def.materials
    roads[key] = type
    changed = true
  }
  if (!changed) return city
  return withLevel({ ...city, roads, coins, materials })
}

/** Straße wieder aufnehmen – die Hälfte kommt zurück */
export function unpave(city: CityState, tiles: { x: number; y: number }[]): CityState {
  const roads = { ...city.roads }
  let coins = city.coins
  let materials = city.materials
  let changed = false
  for (const tile of tiles) {
    const key = roadKey(tile.x, tile.y)
    const def = roads[key] ? roadDef(roads[key]) : undefined
    if (!def) continue
    delete roads[key]
    coins += Math.round(def.coins / 2)
    materials += Math.floor(def.materials / 2)
    changed = true
  }
  if (!changed) return city
  return withLevel({ ...city, roads, coins, materials })
}

/** Nachbarn in der Reihenfolge Nord, Ost, Süd, West – für die Form der Straße */
export function roadNeighbours(city: CityState, x: number, y: number): [boolean, boolean, boolean, boolean] {
  return [
    !!roadAt(city, x, y - 1),
    !!roadAt(city, x + 1, y),
    !!roadAt(city, x, y + 1),
    !!roadAt(city, x - 1, y),
  ]
}

// ---------- Landerweiterung ----------

export const nextExpansion = (city: CityState): Expansion | null =>
  EXPANSIONS.find((entry) => entry.land > city.land) ?? null

export function expansionCheck(city: CityState): PlaceCheck {
  const step = nextExpansion(city)
  if (!step) return { ok: false, reason: 'Dein Gebiet ist schon so groß wie möglich.' }
  if (city.level < step.level) return { ok: false, reason: `Erst ab Stadt-Stufe ${step.level}.` }
  if (city.coins < step.coins) return { ok: false, reason: `Dir fehlen ${step.coins - city.coins} Münzen.` }
  if (city.materials < step.materials) {
    return { ok: false, reason: `Dir fehlen ${step.materials - city.materials} Materialien.` }
  }
  return { ok: true }
}

/**
 * Erweitert das Gebiet. Die Stadt rückt dabei in die Mitte, damit das neue Land
 * rundherum entsteht und nicht nur an einer Seite.
 */
export function expand(city: CityState): CityState {
  const step = nextExpansion(city)
  if (!step || !expansionCheck(city).ok) return city
  const shift = Math.floor((step.land - city.land) / 2)

  const roads: Record<string, string> = {}
  for (const [key, type] of Object.entries(city.roads)) {
    const [x, y] = key.split(':').map(Number)
    roads[roadKey(x + shift, y + shift)] = type
  }

  return withLevel({
    ...city,
    land: step.land,
    coins: city.coins - step.coins,
    materials: city.materials - step.materials,
    buildings: city.buildings.map((placed) => ({ ...placed, x: placed.x + shift, y: placed.y + shift })),
    roads,
  })
}

/** Eine Bitte wurde gelöst: Belohnung, Dankbarkeit, Bitte schließen */
export function solveRequest(city: CityState): CityState {
  if (!city.request) return city
  return withLevel({
    ...city,
    request: null,
    helped: city.helped + 1,
    coins: city.coins + REQUEST_COINS,
    materials: city.materials + REQUEST_MATERIALS,
  })
}

/** Aussehen der Stadt wechseln */
export const setTheme = (city: CityState, id: string): CityState => ({ ...city, theme: themeById(id).id })

/** Stadt umbenennen – Name, Wahlspruch und Wappen lassen sich jederzeit ändern */
export function rename(city: CityState, name: string, motto: string, emblem: string): CityState {
  return {
    ...city,
    name: name.trim().slice(0, 24) || city.name,
    motto: motto.trim().slice(0, 60),
    emblem: emblem.slice(0, 4) || city.emblem,
  }
}

/**
 * Der Geheimcode der Stadtkasse. Wer ihn als Wahlspruch einträgt, bekommt eine Kasse,
 * die nie wieder leer wird – der Wahlspruch selbst bleibt, wie er war. Groß- und
 * Kleinschreibung sowie Leerzeichen sind egal.
 */
const GEHEIMCODE = 'derbürgermeisterträgtkeinesocken'
export const CHEAT_MUENZEN = 100_000_000
export const CHEAT_MATERIAL = 5_000_000

const normiert = (text: string) => text.toLowerCase().replace(/[\s.,!?'"„“-]/g, '')

/** Ist das der Geheimcode? */
export const istGeheimcode = (text: string): boolean => normiert(text) === GEHEIMCODE

/** Die Schattenkasse öffnet sich: Münzen und Material ohne Ende */
export function schattenkasse(city: CityState): CityState {
  return { ...city, coins: city.coins + CHEAT_MUENZEN, materials: city.materials + CHEAT_MATERIAL }
}

/** Eine neue Bitte hinterlegen */
export function setRequest(city: CityState, request: unknown, now = Date.now()): CityState {
  return { ...city, request, lastRequest: now }
}

/** Münzen und Material aus Spielen */
export function grant(city: CityState, coins: number, materials: number): CityState {
  const plusCoins = Math.max(0, Math.round(coins))
  const plusMaterials = Math.max(0, Math.round(materials))
  if (plusCoins === 0 && plusMaterials === 0) return city
  return { ...city, coins: city.coins + plusCoins, materials: city.materials + plusMaterials }
}

/** Summe aller Bauwerkswirkungen */
function totals(city: CityState) {
  let capacity = 0
  let happy = 0
  let education = 0
  let environment = 0
  let income = 0
  let jobs = 0
  for (const placed of city.buildings) {
    const def = buildingDef(placed.type)
    if (!def) continue
    // Eine Ruine bietet keinen Wohnraum und macht niemanden froh
    if (placed.verlassen) {
      happy -= 2
      continue
    }
    const effects = effectsOf(def, placed.level)
    capacity += effects.capacity ?? 0
    happy += effects.happiness ?? 0
    education += effects.education ?? 0
    environment += effects.environment ?? 0
    income += effects.income ?? 0
    jobs += effects.jobs ?? 0
  }
  return { capacity, happy, education, environment, income, jobs }
}

/**
 * Woraus sich die Stimmung zusammensetzt. Diese eine Rechnung gilt überall –
 * die Anzeige zeigt genau die Posten, mit denen das Spiel rechnet.
 */
export function happinessBreakdown(city: CityState): { total: number; parts: Part[] } {
  const sums = totals(city)
  const g = gesellschaft(city)
  const parts: Part[] = [{ label: 'Grundstimmung', value: 60 }]

  // Bauwerke und Grün freuen – mit abnehmendem Ertrag: Der zehnte Park macht nicht mehr so
  // froh wie der erste. Sonst höbe jedes selbst gebaute Haus die Stimmung, die wieder neue
  // Häuser bringt, und keine Arbeitslosigkeit könnte die Stadt je noch verstimmen.
  const gruen = sums.happy > 0 ? Math.round(45 * Math.tanh(sums.happy / 45)) : Math.max(-40, sums.happy)
  if (gruen !== 0) parts.push({ label: 'Bauwerke und Grün', value: gruen })

  const schulen = Math.min(12, Math.round(sums.education / 2))
  if (schulen > 0) parts.push({ label: 'Bildung', value: schulen })

  if (g.arbeitslose > 0) parts.push({ label: 'Arbeitslosigkeit', value: -Math.min(25, Math.round(g.arbeitslose / 3)) })

  const eng = city.population - Math.round(sums.capacity * 0.95)
  if (eng > 0) parts.push({ label: 'Enge Wohnungen', value: -Math.min(20, Math.round(eng / 2) + 4) })

  const wege = Object.keys(city.roads).length
  const noetig = Math.ceil(city.population / 25)
  if (city.population > 0) {
    parts.push(
      wege >= noetig
        ? { label: 'Gute Wege', value: 4 }
        : { label: 'Zu wenige Wege', value: -Math.min(15, (noetig - wege) * 3) },
    )
  }

  // Steuern: unter zehn Prozent freut es die Leute, darüber ärgert es sie
  const steuer = steuerVon(city)
  if (city.population > 0 && steuer !== 10) {
    parts.push({
      label: `Steuern ${steuer} %`,
      value: steuer < 10 ? Math.round((10 - steuer) * 0.8) : -Math.round((steuer - 10) * 1.6),
    })
  }

  if (g.kriminalitaet >= 6) parts.push({ label: 'Kriminalität', value: -Math.round(g.kriminalitaet / 4) })
  if (g.obdachlose > 0) parts.push({ label: 'Obdachlosigkeit', value: -Math.min(10, Math.ceil(g.obdachlose / 3)) })

  // Verlassene Häuser: Wer an Ruinen vorbeigeht, fühlt sich nicht wohl
  const ruinen = leerstandVon(city)
  if (ruinen > 0) parts.push({ label: 'Leerstand', value: -Math.min(12, ruinen * 2) })

  // Dienste: wer abgedeckt ist, fühlt sich sicherer – wer lange ohne auskommen muss, nicht
  if (city.population >= 40) {
    if (g.abdeckung.polizei > 0) parts.push({ label: 'Sicherheit', value: Math.round(5 * g.abdeckung.polizei) })
    else if (city.population >= 80) parts.push({ label: 'Keine Polizei', value: -6 })
    if (g.abdeckung.gesundheit > 0) parts.push({ label: 'Ärzte in der Nähe', value: Math.round(5 * g.abdeckung.gesundheit) })
    else if (city.population >= 100) parts.push({ label: 'Keine Ärzte', value: -6 })
  }
  if (city.buildings.length >= 12) {
    if (g.abdeckung.feuer > 0) parts.push({ label: 'Brandschutz', value: Math.round(3 * g.abdeckung.feuer) })
    else if (city.buildings.length >= 25) parts.push({ label: 'Keine Feuerwehr', value: -4 })
  }

  // Wer seinen Nachbarn hilft, merkt es an der Stimmung
  const dank = Math.min(10, Math.floor(city.helped / 3))
  if (dank > 0) parts.push({ label: 'Nachbarschaftshilfe', value: dank })

  const total = Math.max(0, Math.min(100, parts.reduce((sum, part) => sum + part.value, 0)))
  return { total, parts }
}

/** Woraus die Einnahmen eines Zyklus bestehen */
export function incomeBreakdown(city: CityState): { total: number; parts: Part[] } {
  const g = gesellschaft(city)
  let handel = 0
  let dienste = 0
  for (const placed of city.buildings) {
    const def = buildingDef(placed.type)
    if (!def || placed.verlassen) continue
    const einnahme = effectsOf(def, placed.level).income ?? 0
    if (einnahme >= 0) handel += einnahme
    else dienste += einnahme
  }
  const diebstahl = Math.round((handel * g.kriminalitaet) / 250)
  const unterhalt = city.buildings.length + Math.ceil(Object.keys(city.roads).length / 2)

  const parts: Part[] = []
  if (handel > 0) parts.push({ label: 'Handel', value: handel })
  if (g.steuern > 0) parts.push({ label: `Steuern (${steuerVon(city)} %)`, value: g.steuern })
  if (g.schwarzgeld > 0) parts.push({ label: 'Schwarzgeld', value: g.schwarzgeld })
  if (dienste < 0) parts.push({ label: 'Polizei, Feuerwehr, Ärzte', value: dienste })
  if (diebstahl > 0) parts.push({ label: 'Diebstahl', value: -diebstahl })
  if (unterhalt > 0) parts.push({ label: 'Unterhalt', value: -unterhalt })

  const total = Math.max(0, parts.reduce((sum, part) => sum + part.value, 0))
  return { total, parts }
}

/** Was die Bürger gerade stört – daraus werden freiwillige Ziele */
export function problemsOf(city: CityState): string[] {
  const sums = totals(city)
  const g = gesellschaft(city)
  const list: string[] = []
  if (g.arbeitslose > 0 && city.population > 0) {
    list.push(`💼 ${g.arbeitslose} Menschen suchen Arbeit. Läden, Büros und Fabriken helfen.`)
  }
  if (city.population >= Math.round(sums.capacity * 0.95) && sums.capacity > 0) {
    list.push('🏠 Es gibt keine freien Wohnungen mehr – bei guter Stimmung bauen Zugezogene selbst.')
  }
  if (sums.education === 0 && city.population >= 20) {
    list.push('🎓 Die Kinder brauchen eine Schule. Ohne Bildung wächst die Kriminalität.')
  }
  if (g.kriminalitaet >= 40) {
    list.push(`🚨 Kriminalität ${g.kriminalitaet} %. Polizeiwachen und Schulen drücken sie.`)
  }
  if (g.abdeckung.polizei === 0 && city.population >= 60) list.push('🚓 Es gibt keine Polizei.')
  const ruinen = leerstandVon(city)
  if (ruinen > 0) {
    list.push(`🏚️ ${ruinen} ${ruinen === 1 ? 'Haus steht' : 'Häuser stehen'} leer und verfallen. Abreißen oder sanieren – und die Ursache beseitigen.`)
  }
  const beschwerden = city.buildings.filter((b) => b.beschwerde && !b.verlassen).length
  if (beschwerden > 0) {
    list.push(`😠 In ${beschwerden} ${beschwerden === 1 ? 'Haus beschweren' : 'Häusern beschweren'} sich die Bewohner. Tippe das Haus an, um den Grund zu sehen.`)
  }
  if (g.obdachlose > 0) {
    list.push(`🛏️ ${g.obdachlose} ${g.obdachlose === 1 ? 'Mensch schläft' : 'Menschen schlafen'} auf der Straße. Arbeit und günstiger Wohnraum helfen.`)
  }
  if (g.abdeckung.gesundheit === 0 && city.population >= 100) list.push('🏥 Kranke müssen weit fahren. Eine Arztpraxis hilft.')
  if (g.abdeckung.feuer === 0 && city.buildings.length >= 25) list.push('🚒 Ohne Feuerwehr brennt es länger.')
  if (steuerVon(city) > 20) list.push('💸 Die Steuern sind hoch – die Reichen ziehen weg.')
  if (sums.environment < 10 && city.population >= 20) {
    list.push('🌳 Die Stadt braucht mehr Grün.')
  }
  const wege = Object.keys(city.roads).length
  if (city.population > 0 && wege < Math.ceil(city.population / 25)) {
    list.push('🛣️ Wir kommen schlecht durch die Stadt. Mehr Straßen!')
  }
  return list
}

/** Kennzahlen der Stadt */
export function statsOf(city: CityState): CityStats {
  const sums = totals(city)
  return {
    population: city.population,
    capacity: sums.capacity,
    happiness: happinessBreakdown(city).total,
    education: sums.education,
    environment: Math.max(0, Math.min(100, 50 + sums.environment)),
    income: incomeBreakdown(city).total,
    jobs: sums.jobs,
    buildings: city.buildings.length,
  }
}

/** Kleiner, wiederholbarer Zufall – damit Zyklen nachvollziehbar bleiben */
export function zufallAus(samen: number): () => number {
  let a = Math.floor(samen) >>> 0 || 1
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** So viel Wohnraum wollen die Menschen bei diesem Steuersatz tatsächlich nutzen */
export const wohnplatz = (city: CityState): number => {
  const g = gesellschaft(city)
  return KLASSEN.reduce((summe, k) => summe + g.platz[k], 0)
}

/**
 * Holt die Zyklen seit dem letzten Besuch nach: Einnahmen, Zuzug, Wegzug – und was
 * die Bürger in der Zeit selbst getan haben: Häuser gebaut, dunkle Geschäfte eröffnet,
 * und was die Polizei davon ausgehoben hat. Es wird höchstens ein Tag nachgeholt.
 */
export function runCycles(city: CityState, now = Date.now()): { city: CityState; report: CycleReport | null } {
  const last = city.lastTick > 0 ? city.lastTick : now
  const elapsed = now - last
  if (elapsed < CYCLE_MS) return { city: city.lastTick > 0 ? city : { ...city, lastTick: now }, report: null }

  const cycles = Math.min(MAX_CYCLES, Math.floor(elapsed / CYCLE_MS))
  const zufall = zufallAus(last + city.nextId * 7919)
  let next: CityState = { ...city }
  let coins = 0
  let movedIn = 0
  let movedOut = 0
  const gebaut: string[] = []
  const meldungen: string[] = []

  for (let i = 0; i < cycles; i++) {
    const zeit = last + (i + 1) * CYCLE_MS
    const income = incomeBreakdown(next)
    coins += income.total
    const mood = happinessBreakdown(next).total
    const platz = wohnplatz(next)

    let population = next.population
    if (population > platz) {
      // Zu hohe Steuern oder Kriminalität: wer es sich leisten kann, geht
      const weg = Math.max(1, Math.round((population - platz) * 0.5))
      population -= weg
      movedOut += weg
    } else if (mood >= MOVE_IN_MOOD && population < platz) {
      const zuzug = Math.min(platz - population, Math.max(1, Math.round(platz * 0.08 * ((mood - 40) / 60))))
      population += zuzug
      movedIn += zuzug
    } else if (mood < MOVE_OUT_MOOD && population > 0) {
      const wegzug = Math.min(population, Math.max(1, Math.round(population * 0.06)))
      population -= wegzug
      movedOut += wegzug
    }
    next = { ...next, population, coins: next.coins + income.total }

    // Wer sich schon lange beschwert, ist bis zum nächsten Zyklus ausgezogen; neue
    // Beschwerden entstehen, wo die Wohnlage nicht stimmt
    const leer = leerstandSchritt(next, zeit, mood, 3)
    if (leer.city !== next) {
      next = leer.city
      meldungen.push(...leer.meldungen.filter((m) => m.startsWith('🏚️')))
    }

    // Bei guter Stimmung bauen Zugezogene selbst – je besser, desto mehr
    const bauten = mood >= WACHSTUM_STIMMUNG ? 1 + Math.floor((mood - WACHSTUM_STIMMUNG) / 12) : 0
    for (let b = 0; b < bauten; b++) {
      const schritt = wachsen(next, zeit, zufall)
      if (!schritt.gebaut) break
      next = schritt.city
      gebaut.push(buildingDef(schritt.gebaut.type)?.name ?? schritt.gebaut.type)
    }

    // Wo Armut und fehlende Bildung zusammenkommen, entstehen dunkle Geschäfte
    const dunkel = dunkelWaechst(next, zeit, zufall)
    if (dunkel.gebaut) {
      next = dunkel.city
      meldungen.push(`🕶️ Im Viertel ist ${artikel(dunkel.gebaut.type)} entstanden.`)
    }

    // Die Polizei hebt aus, was sie erreicht
    for (const placed of next.buildings) {
      const def = buildingDef(placed.type)
      if (def?.category !== 'unterwelt') continue
      const abgedeckt = razziaMoeglich(next, placed)
      if (!abgedeckt || zufall() > 0.3) continue
      const r = razzia(next, placed.id)
      next = r.city
      meldungen.push(
        r.zerstoert
          ? `🚔 Razzia: ${def.name} ausgehoben, ${r.beute} 🪙 beschlagnahmt.`
          : `🚔 Razzia: ${def.name} verliert eine Ausbaustufe, ${r.beute} 🪙 beschlagnahmt.`,
      )
      coins += r.beute
    }
  }

  // Alles, was über den Deckel hinausgeht, verfällt
  next.lastTick = elapsed > MAX_CYCLES * CYCLE_MS ? now : last + cycles * CYCLE_MS
  return {
    city: withLevel(next),
    report: { cycles, coins, movedIn, movedOut, income: incomeBreakdown(next).parts, gebaut, meldungen },
  }
}

// ---------- Die Stadt wächst von selbst ----------

/** Ab dieser Stimmung bauen Zugezogene selbst */
export const WACHSTUM_STIMMUNG = 60

/** Sekunden zwischen zwei Häusern, die Bürger live bauen – je besser die Stimmung, desto schneller */
export function wachstumsTakt(stimmung: number): number | null {
  if (stimmung < WACHSTUM_STIMMUNG) return null
  return Math.max(22, 95 - (stimmung - WACHSTUM_STIMMUNG) * 2.1)
}

/** Kacheln, die frei sind und an einer Straße liegen – dort kann jemand bauen */
function freieKacheln(city: CityState): { x: number; y: number }[] {
  const belegt = new Set<string>()
  for (const placed of city.buildings) for (const t of tilesOf(placed)) belegt.add(roadKey(t.x, t.y))
  const liste: { x: number; y: number }[] = []
  for (let y = 0; y < city.land; y++) {
    for (let x = 0; x < city.land; x++) {
      const key = roadKey(x, y)
      if (belegt.has(key) || city.roads[key]) continue
      if (roadAt(city, x + 1, y) || roadAt(city, x - 1, y) || roadAt(city, x, y + 1) || roadAt(city, x, y - 1)) {
        liste.push({ x, y })
      }
    }
  }
  return liste
}

/** Wie begehrt eine Lage ist: Grün und Wasser ziehen an, Industrie und Kriminalität stoßen ab */
function lageBei(city: CityState, x: number, y: number): number {
  let lage = 0
  for (const placed of city.buildings) {
    const def = buildingDef(placed.type)
    if (!def) continue
    const d = Math.hypot(placed.x - x, placed.y - y)
    if (d > 5) continue
    const f = 1 - d / 5
    if (def.category === 'natur') lage += 1.4 * f
    if (placed.verlassen) {
      lage -= 2.5 * f
      continue
    }
    if (def.effects.klasse === 'reich' || def.effects.klasse === 'superreich') lage += 2 * f
    if (def.effects.klasse === 'arm') lage -= 1.2 * f
    if ((def.effects.environment ?? 0) < 0) lage -= 2 * f
    if (def.category === 'unterwelt') lage -= 3 * f
  }
  return lage - kriminalitaetBei(city, x, y) / 20
}

/** Wählt, was Zugezogene an dieser Stelle bauen – nach Lage, Kriminalität und Stadtstufe */
function wohnartFuer(city: CityState, x: number, y: number, zufall: () => number) {
  const lage = lageBei(city, x, y)
  const krim = kriminalitaetBei(city, x, y)
  const kandidaten = BUILDINGS.filter(
    (def) => def.category === 'wohnen' && def.effects.klasse && (def.needsLevel ?? 1) <= city.level,
  )
  const gewicht = (def: (typeof kandidaten)[number]) => {
    const k = def.effects.klasse
    const flaeche = def.size[0] * def.size[1]
    const groesse = flaeche === 1 ? 1 : flaeche === 2 ? 0.7 : 0.35
    if (k === 'arm') return (0.6 + krim / 30 + (lage < 0 ? 1.5 : 0)) * groesse
    if (k === 'mittel') return 3 * groesse
    if (k === 'reich') return Math.max(0, lage) * 0.9 * groesse
    return Math.max(0, lage - 3) * 0.35 * groesse
  }
  const summe = kandidaten.reduce((s, d) => s + gewicht(d), 0)
  let wahl = zufall() * summe
  for (const def of kandidaten) {
    wahl -= gewicht(def)
    if (wahl <= 0) return def
  }
  return kandidaten[0]
}

/**
 * Zugezogene bauen ein Haus: auf einem freien Platz an einer Straße, gern in der Nähe
 * anderer Häuser. Kostet dich nichts – sie bauen mit ihrem eigenen Geld.
 */
export function wachsen(city: CityState, now: number, zufall: () => number = Math.random): { city: CityState; gebaut: Placed | null } {
  const platz = wohnplatz(city)
  // Solange es genug freie Wohnungen gibt, ziehen die Leute dort ein
  if (platz > 0 && city.population < platz * 0.8) return { city, gebaut: null }
  const frei = freieKacheln(city)
  if (frei.length === 0) return { city, gebaut: null }

  // Nähe zu bestehenden Häusern: Viertel wachsen zusammen, statt überall zu streuen
  const bewertet = frei
    .map((k) => {
      let nachbarn = 0
      for (const placed of city.buildings) if (Math.abs(placed.x - k.x) <= 2 && Math.abs(placed.y - k.y) <= 2) nachbarn++
      return { ...k, wert: nachbarn + zufall() * 1.5 }
    })
    .sort((a, b) => b.wert - a.wert)
    .slice(0, 6)

  for (const lot of bewertet) {
    for (let versuch = 0; versuch < 4; versuch++) {
      const def = wohnartFuer(city, lot.x, lot.y, zufall)
      for (const rot of [0, 1] as const) {
        // Ein Rechteck darf von der Kachel aus nach links oder oben reichen
        const [w, h] = footprint(def, rot)
        for (const [ox, oy] of [
          [0, 0],
          [1 - w, 0],
          [0, 1 - h],
          [1 - w, 1 - h],
        ]) {
          const x = lot.x + ox
          const y = lot.y + oy
          if (!canPlace(city, def.id, x, y, rot, { free: true }).ok) continue
          const placed: Placed = { id: `b${city.nextId}`, type: def.id, x, y, rot, level: 1, at: now, auto: true }
          const neu = withLevel({ ...city, buildings: [...city.buildings, placed], nextId: city.nextId + 1, lastGrowth: now })
          return { city: neu, gebaut: placed }
        }
      }
    }
  }
  return { city, gebaut: null }
}

/** Unterwelt, die ohne dein Zutun entsteht */
const DUNKLES = ['gangtreff', 'growhaus', 'spielhalle', 'drogenlabor', 'hanfplantage']

/**
 * Wo Kriminalität hoch und Bildung niedrig ist, eröffnet jemand ein dunkles Geschäft –
 * auf einem freien Platz im schlimmsten Viertel.
 */
export function dunkelWaechst(city: CityState, now: number, zufall: () => number = Math.random): { city: CityState; gebaut: Placed | null } {
  if (city.level < 2 || city.population < 40) return { city, gebaut: null }
  const g = gesellschaft(city)
  if (g.kriminalitaet < 35 || g.bildung > 70) return { city, gebaut: null }
  const chance = ((g.kriminalitaet - 35) / 100) * (1 - g.bildung / 100) * 1.4
  if (zufall() > chance) return { city, gebaut: null }
  const frei = freieKacheln(city)
    .map((k) => ({ ...k, krim: kriminalitaetBei(city, k.x, k.y) }))
    .filter((k) => k.krim >= 45)
    .sort((a, b) => b.krim - a.krim)
  const arten = DUNKLES.map((id) => buildingDef(id)).filter((def): def is NonNullable<typeof def> => !!def && (def.needsLevel ?? 1) <= city.level)
  for (const lot of frei.slice(0, 5)) {
    const def = arten[Math.floor(zufall() * arten.length)]
    if (!def) break
    for (const rot of [0, 1] as const) {
      if (!canPlace(city, def.id, lot.x, lot.y, rot, { free: true }).ok) continue
      const placed: Placed = { id: `b${city.nextId}`, type: def.id, x: lot.x, y: lot.y, rot, level: 1, at: now, auto: true }
      return { city: withLevel({ ...city, buildings: [...city.buildings, placed], nextId: city.nextId + 1 }), gebaut: placed }
    }
  }
  return { city, gebaut: null }
}

/** Kann die Polizei dieses Gebäude erreichen? */
export function razziaMoeglich(city: CityState, placed: Placed): boolean {
  const def = buildingDef(placed.type)
  if (def?.category !== 'unterwelt') return false
  const [w, h] = footprint(def, placed.rot)
  const mx = placed.x + w / 2
  const my = placed.y + h / 2
  return city.buildings.some((wache) => {
    const reichweite = buildingDef(wache.type)?.effects.police ?? 0
    if (!reichweite) return false
    const wd = buildingDef(wache.type)!
    const [ww, wh] = footprint(wd, wache.rot)
    return Math.hypot(wache.x + ww / 2 - mx, wache.y + wh / 2 - my) <= reichweite
  })
}

/**
 * Die Polizei hebt ein dunkles Geschäft aus. Ein kleiner Betrieb verschwindet ganz;
 * ein ausgebauter verliert eine Stufe – die Anlage ist zu groß, um sie über Nacht
 * abzuräumen. Die Beute geht in jedem Fall an die Stadt.
 */
export function razzia(city: CityState, id: string): { city: CityState; beute: number; zerstoert: boolean } {
  const placed = city.buildings.find((b) => b.id === id)
  const def = placed ? buildingDef(placed.type) : undefined
  if (!placed || def?.category !== 'unterwelt') return { city, beute: 0, zerstoert: false }
  const beute = Math.round((effectsOf(def, placed.level).black ?? 0) * 2)
  if (placed.level > 1) {
    return {
      city: withLevel({
        ...city,
        buildings: city.buildings.map((b) => (b.id === id ? { ...b, level: b.level - 1 } : b)),
        coins: city.coins + beute,
      }),
      beute,
      zerstoert: false,
    }
  }
  return {
    city: withLevel({ ...city, buildings: city.buildings.filter((b) => b.id !== id), coins: city.coins + beute }),
    beute,
    zerstoert: true,
  }
}

/** Steuersatz setzen – zwischen 0 und 30 Prozent */
export function setTax(city: CityState, satz: number): CityState {
  const tax = Math.max(STEUER_MIN, Math.min(STEUER_MAX, Math.round(satz)))
  return tax === city.tax ? city : { ...city, tax }
}

/** "eine Hanfplantage", "ein Grow-Haus" – für Meldungen */
export function artikel(type: string): string {
  const def = buildingDef(type)
  if (!def) return type
  const weiblich = /e$|ung$|halle$|plantage$|ei$|stelle$|wache$|praxis$|villa$/i.test(def.name.split(' ').pop() ?? '')
  return `${weiblich ? 'eine' : 'ein'} ${def.name}`
}

/**
 * Auf welcher Seite liegt die Straße? Dorthin kommen Tür, Schaufenster und Markise,
 * und dort gehen die Menschen hinein. Gezählt werden die Straßenkacheln entlang jeder
 * Seite; ohne Straße daneben wird in zwei Kacheln Umkreis gesucht, sonst bleibt es Osten.
 */
export function seiteZurStrasse(city: CityState, placed: Placed): Seite {
  const def = buildingDef(placed.type)
  if (!def) return 'o'
  const [w, h] = footprint(def, placed.rot)
  const zaehle = (kacheln: [number, number][]) => kacheln.filter(([x, y]) => roadAt(city, x, y)).length
  const entlangX = (y: number) => Array.from({ length: w }, (_, i) => [placed.x + i, y] as [number, number])
  const entlangY = (x: number) => Array.from({ length: h }, (_, i) => [x, placed.y + i] as [number, number])
  for (const abstand of [1, 2]) {
    const kandidaten: [Seite, number][] = [
      ['o', zaehle(entlangY(placed.x + w - 1 + abstand))],
      ['s', zaehle(entlangX(placed.y + h - 1 + abstand))],
      ['n', zaehle(entlangX(placed.y - abstand))],
      ['w', zaehle(entlangY(placed.x - abstand))],
    ]
    let beste: [Seite, number] = kandidaten[0]
    for (const k of kandidaten) if (k[1] > beste[1]) beste = k
    if (beste[1] > 0) return beste[0]
  }
  return 'o'
}

/** Die Straßenkachel vor dem Eingang – dort beginnt und endet jeder Weg zu diesem Haus */
export function zugangVon(city: CityState, placed: Placed): { x: number; y: number } | null {
  const def = buildingDef(placed.type)
  if (!def) return null
  const [w, h] = footprint(def, placed.rot)
  const seite = seiteZurStrasse(city, placed)
  // Wie die Türseite sucht auch der Zugang bis zu zwei Kacheln weit – dazwischen liegt
  // dann eben ein Vorgarten, durch den man zur Straße geht
  for (const abstand of [1, 2]) {
    const kandidaten: [number, number][] = []
    if (seite === 'o') for (let i = 0; i < h; i++) kandidaten.push([placed.x + w - 1 + abstand, placed.y + i])
    if (seite === 'w') for (let i = 0; i < h; i++) kandidaten.push([placed.x - abstand, placed.y + i])
    if (seite === 's') for (let i = 0; i < w; i++) kandidaten.push([placed.x + i, placed.y + h - 1 + abstand])
    if (seite === 'n') for (let i = 0; i < w; i++) kandidaten.push([placed.x + i, placed.y - abstand])
    // die mittlere zuerst, damit der Weg gerade auf die Tür zuläuft
    const mx = placed.x + w / 2 - 0.5
    const my = placed.y + h / 2 - 0.5
    kandidaten.sort((a, b) => Math.abs(a[0] - mx) + Math.abs(a[1] - my) - (Math.abs(b[0] - mx) + Math.abs(b[1] - my)))
    for (const [x, y] of kandidaten) if (roadAt(city, x, y)) return { x, y }
  }
  return null
}

/** Stadt-Stufe: wächst mit Einwohnern, Bauwerken und Bildung */
export function levelOf(stats: CityStats): number {
  let points = stats.population + stats.buildings * 6 + stats.education * 3
  let level = 1
  let need = 60
  while (points >= need && level < 100) {
    points -= need
    level += 1
    need = Math.round(need * 1.28)
  }
  return level
}

/** Stadt-Stufe nachrechnen – und das Rathaus wächst mit */
const withLevel = (city: CityState): CityState => {
  const level = levelOf(statsOf(city))
  const rathaus = rathausVon(city)
  const stufe = rathausStufe(level)
  if (!rathaus || rathaus.level === stufe) return { ...city, level }
  return {
    ...city,
    level,
    buildings: city.buildings.map((b) => (b.id === rathaus.id ? { ...b, level: stufe, at: Date.now() } : b)),
  }
}

/**
 * Ältere Stände haben kein Rathaus. Es kommt auf den ersten freien Platz nahe der
 * Mitte – notfalls wird dafür ein Baum oder eine Bank versetzt, nie ein Haus.
 */
export function mitRathaus(city: CityState, now = Date.now()): CityState {
  if (rathausVon(city)) return city
  const def = buildingDef(RATHAUS)
  if (!def) return city
  const m = Math.floor(city.land / 2)
  const kandidaten: { x: number; y: number; d: number }[] = []
  for (let y = 0; y + 2 <= city.land; y++) {
    for (let x = 0; x + 2 <= city.land; x++) kandidaten.push({ x, y, d: Math.hypot(x + 1 - m, y + 1 - m) })
  }
  kandidaten.sort((a, b) => a.d - b.d)
  const weich = new Set(['natur', 'schmuck', 'wege'])
  for (const k of kandidaten) {
    if (canPlace(city, RATHAUS, k.x, k.y, 0, { free: true }).ok) {
      return withLevel({
        ...city,
        buildings: [...city.buildings, { id: `b${city.nextId}`, type: RATHAUS, x: k.x, y: k.y, rot: 0, level: 1, at: now }],
        nextId: city.nextId + 1,
      })
    }
  }
  // Kein freier 2×2-Platz: dann weicht Kleinkram – Bäume, Bänke, Pflaster
  for (const k of kandidaten) {
    const tiles = [`${k.x}:${k.y}`, `${k.x + 1}:${k.y}`, `${k.x}:${k.y + 1}`, `${k.x + 1}:${k.y + 1}`]
    if (tiles.some((t) => city.roads[t])) continue
    const stoeren = city.buildings.filter((b) => tilesOf(b).some((t) => tiles.includes(roadKey(t.x, t.y))))
    if (stoeren.some((b) => !weich.has(buildingDef(b.type)?.category ?? ''))) continue
    const rest = city.buildings.filter((b) => !stoeren.includes(b))
    return withLevel({
      ...city,
      buildings: [...rest, { id: `b${city.nextId}`, type: RATHAUS, x: k.x, y: k.y, rot: 0, level: 1, at: now }],
      nextId: city.nextId + 1,
    })
  }
  return city
}

/** Wie weit ist die Stadt zur nächsten Stufe? */
export function levelProgress(city: CityState): { level: number; into: number; need: number } {
  const stats = statsOf(city)
  let points = stats.population + stats.buildings * 6 + stats.education * 3
  let level = 1
  let need = 60
  while (points >= need && level < 100) {
    points -= need
    level += 1
    need = Math.round(need * 1.28)
  }
  return { level, into: points, need }
}

/** Name der Stadtgröße – aus der Stufe */
export function cityTitle(level: number): string {
  if (level >= 75) return 'Weltstadt'
  if (level >= 50) return 'Megastadt'
  if (level >= 30) return 'Metropole'
  if (level >= 15) return 'Großstadt'
  if (level >= 5) return 'Stadt'
  return 'Dorf'
}

/** Der Katalog einer Kategorie – gesperrte Bauwerke bleiben sichtbar, mit Begründung */
export function catalogFor(city: CityState, levels: Record<string, number>, category: string) {
  return BUILDINGS.filter((def) => def.category === category && !def.nichtBaubar).map((def) => ({
    def,
    lock: unlockInfo(def, city.level, levels),
  }))
}

// ---------- Laden geprüfter Daten ----------

const int = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback

/** Prüft einen geladenen Stadtstand. null heißt: keine gültige Stadt. */
export function sanitizeCity(input: unknown): CityState | null {
  if (typeof input !== 'object' || input === null) return null
  const raw = input as Record<string, unknown>
  if (typeof raw.name !== 'string') return null

  const land = Math.max(START_LAND, Math.min(80, int(raw.land, START_LAND)))
  const buildings: Placed[] = []
  const taken = new Set<string>()
  const roads: Record<string, string> = {}

  if (typeof raw.roads === 'object' && raw.roads !== null) {
    for (const [key, type] of Object.entries(raw.roads as Record<string, unknown>)) {
      if (typeof type !== 'string' || !roadDef(type)) continue
      const [x, y] = key.split(':').map(Number)
      if (!Number.isInteger(x) || !Number.isInteger(y)) continue
      if (x < 0 || y < 0 || x >= land || y >= land) continue
      roads[roadKey(x, y)] = type
    }
  }

  if (Array.isArray(raw.buildings)) {
    for (const entry of raw.buildings) {
      if (typeof entry !== 'object' || entry === null) continue
      const item = entry as Record<string, unknown>
      // Stände von Version 1: Wege waren Bauwerke, jetzt sind sie Straßen
      if (item.type === 'weg' && Number.isInteger(item.x) && Number.isInteger(item.y)) {
        const x = int(item.x)
        const y = int(item.y)
        if (x >= 0 && y >= 0 && x < land && y < land) roads[roadKey(x, y)] = 'weg'
        continue
      }
      const def = typeof item.type === 'string' ? buildingDef(item.type) : undefined
      if (!def) continue
      const rot = (int(item.rot) % 4) as 0 | 1 | 2 | 3
      const placed: Placed = {
        id: typeof item.id === 'string' && item.id ? item.id : `b${buildings.length + 1}`,
        type: def.id,
        x: int(item.x),
        y: int(item.y),
        rot: rot < 0 ? 0 : rot,
        level: Math.max(1, Math.min(maxLevel(def), int(item.level, 1))),
        at: int(item.at, 0),
        ...(item.auto === true ? { auto: true } : {}),
        ...(typeof item.verlassen === 'number' && item.verlassen > 0 ? { verlassen: int(item.verlassen) } : {}),
        ...(typeof item.beschwerde === 'object' && item.beschwerde !== null && typeof (item.beschwerde as Record<string, unknown>).grund === 'string'
          ? { beschwerde: { seit: int((item.beschwerde as Record<string, unknown>).seit), grund: (item.beschwerde as Record<string, unknown>).grund as string } }
          : {}),
      }
      // Ein Rathaus gibt es nur einmal
      if (def.id === RATHAUS && buildings.some((b) => b.type === RATHAUS)) continue
      const [w, h] = footprint(def, placed.rot)
      if (placed.x < 0 || placed.y < 0 || placed.x + w > land || placed.y + h > land) continue
      // Doppelt belegte Kacheln können nur durch kaputte Daten entstehen – dann gewinnt das erste
      const tiles = tilesOf(placed)
      if (tiles.some((tile) => taken.has(roadKey(tile.x, tile.y)))) continue
      for (const tile of tiles) taken.add(roadKey(tile.x, tile.y))
      buildings.push(placed)
    }
  }

  const city: CityState = {
    version: CITY_VERSION,
    name: raw.name.slice(0, 24) || 'Neustadt',
    motto: typeof raw.motto === 'string' ? raw.motto.slice(0, 60) : '',
    emblem: typeof raw.emblem === 'string' && raw.emblem ? raw.emblem.slice(0, 4) : '🏙️',
    theme: themeById(typeof raw.theme === 'string' ? raw.theme : undefined).id,
    land,
    level: 1,
    coins: Math.max(0, int(raw.coins)),
    materials: Math.max(0, int(raw.materials)),
    buildings,
    // Straßen unter Bauwerken kann es nach einer Migration geben – die weichen
    roads: Object.fromEntries(Object.entries(roads).filter(([key]) => !taken.has(key))),
    population: 0,
    lastTick: Math.max(0, int(raw.lastTick)),
    request: sanitizeRequest(raw.request),
    helped: Math.max(0, int(raw.helped)),
    lastRequest: Math.max(0, int(raw.lastRequest)),
    tax: Math.max(STEUER_MIN, Math.min(STEUER_MAX, int(raw.tax, STEUER_START))),
    lastGrowth: Math.max(0, int(raw.lastGrowth)),
    nextId: Math.max(buildings.length + 1, int(raw.nextId, 1)),
    foundedAt: int(raw.foundedAt),
  }

  // Version 2 und älter kannten keine Einwohnerzahl: Dort wohnte jeder, der Platz fand.
  const platz = statsOf(city).capacity
  const gemeldet = typeof raw.population === 'number' ? Math.max(0, int(raw.population)) : platz
  city.population = Math.min(platz, gemeldet)
  return mitRathaus(withLevel(city))
}

/** Beim Zusammenführen zweier Stände gewinnt die weiter entwickelte Stadt */
export function mergeCities(a?: CityState | null, b?: CityState | null): CityState | undefined {
  if (!a || !b) return a ?? b ?? undefined
  const worth = (city: CityState) =>
    city.buildings.length * 100 + Object.keys(city.roads).length * 20 + city.coins + city.materials * 10
  return worth(a) >= worth(b) ? a : b
}
