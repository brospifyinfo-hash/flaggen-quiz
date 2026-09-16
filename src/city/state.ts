// Zustand und Regeln der Stadt: bauen, versetzen, drehen, ausbauen, abreißen.
// Alles hier ist reine Rechnung ohne Browser – dadurch in der Simulation prüfbar.
import {
  BUILDINGS,
  buildingDef,
  effectsOf,
  footprint,
  maxLevel,
  nextUpgrade,
  roadDef,
  type BuildingDef,
} from './catalog'
import { CITY_VERSION, type CityState, type CityStats, type Placed } from './types'

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
    land: START_LAND,
    level: 1,
    coins: START_COINS,
    materials: START_MATERIALS,
    buildings: [],
    roads: {},
    nextId: 1,
    foundedAt: now,
  }

  // Eine Straße quer durch die Siedlung, dazu ein Fußweg zum Platz
  for (let x = 3; x <= 8; x++) city.roads[roadKey(x, 6)] = 'strasse'
  city.roads[roadKey(5, 7)] = 'weg'

  // Eine kleine Siedlung, die schon beim ersten Blick etwas hermacht
  const start: [string, number, number][] = [
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
  options: { ignore?: string; free?: boolean } = {},
): PlaceCheck {
  const def = buildingDef(type)
  if (!def) return { ok: false, reason: 'Dieses Bauwerk gibt es nicht.' }
  if (def.needsLevel && city.level < def.needsLevel) {
    return { ok: false, reason: `Erst ab Stadt-Stufe ${def.needsLevel}.` }
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
  now = Date.now(),
): CityState {
  const def = buildingDef(type)
  if (!def || !canPlace(city, type, x, y, rot).ok) return city
  const placed: Placed = { id: `b${city.nextId}`, type, x, y, rot, level: 1, at: now }
  return withLevel({
    ...city,
    coins: city.coins - def.coins,
    materials: city.materials - def.materials,
    buildings: [...city.buildings, placed],
    nextId: city.nextId + 1,
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

/** Abreißen gibt die Hälfte zurück */
export function remove(city: CityState, id: string): CityState {
  const placed = city.buildings.find((entry) => entry.id === id)
  const def = placed ? buildingDef(placed.type) : undefined
  if (!placed || !def) return city
  return withLevel({
    ...city,
    coins: city.coins + Math.round(def.coins / 2),
    materials: city.materials + Math.floor(def.materials / 2),
    buildings: city.buildings.filter((entry) => entry.id !== id),
  })
}

export function upgrade(city: CityState, id: string): CityState {
  const placed = city.buildings.find((entry) => entry.id === id)
  const def = placed ? buildingDef(placed.type) : undefined
  if (!placed || !def) return city
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

/** Münzen und Material aus Spielen */
export function grant(city: CityState, coins: number, materials: number): CityState {
  const plusCoins = Math.max(0, Math.round(coins))
  const plusMaterials = Math.max(0, Math.round(materials))
  if (plusCoins === 0 && plusMaterials === 0) return city
  return { ...city, coins: city.coins + plusCoins, materials: city.materials + plusMaterials }
}

/** Kennzahlen der Stadt – immer aus den Gebäuden gerechnet, nie gespeichert */
export function statsOf(city: CityState): CityStats {
  let capacity = 0
  let happiness = 0
  let education = 0
  let environment = 0
  let income = 0
  let jobs = 0

  for (const placed of city.buildings) {
    const def = buildingDef(placed.type)
    if (!def) continue
    const effects = effectsOf(def, placed.level)
    capacity += effects.capacity ?? 0
    happiness += effects.happiness ?? 0
    education += effects.education ?? 0
    environment += effects.environment ?? 0
    income += effects.income ?? 0
    jobs += effects.jobs ?? 0
  }

  // In Phase 1 wohnt jeder, der Platz findet. Zu- und Wegzug kommt später.
  const population = capacity
  // Wer arbeiten kann, aber keine Arbeit findet, drückt die Stimmung
  const missingJobs = Math.max(0, Math.round(population / 4) - jobs)
  const mood = 70 + happiness - Math.min(25, missingJobs)

  return {
    population,
    capacity,
    happiness: Math.max(0, Math.min(100, Math.round(mood))),
    education,
    environment: Math.max(0, Math.min(100, 50 + environment)),
    income,
    jobs,
    buildings: city.buildings.length,
  }
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

const withLevel = (city: CityState): CityState => ({ ...city, level: levelOf(statsOf(city)) })

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

/** Was zur Zeit gebaut werden darf */
export function available(city: CityState): BuildingDef[] {
  return BUILDINGS.filter((def) => !def.needsLevel || city.level >= def.needsLevel)
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
      }
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
    land,
    level: 1,
    coins: Math.max(0, int(raw.coins)),
    materials: Math.max(0, int(raw.materials)),
    buildings,
    // Straßen unter Bauwerken kann es nach einer Migration geben – die weichen
    roads: Object.fromEntries(Object.entries(roads).filter(([key]) => !taken.has(key))),
    nextId: Math.max(buildings.length + 1, int(raw.nextId, 1)),
    foundedAt: int(raw.foundedAt),
  }
  return withLevel(city)
}

/** Beim Zusammenführen zweier Stände gewinnt die weiter entwickelte Stadt */
export function mergeCities(a?: CityState | null, b?: CityState | null): CityState | undefined {
  if (!a || !b) return a ?? b ?? undefined
  const worth = (city: CityState) =>
    city.buildings.length * 100 + Object.keys(city.roads).length * 20 + city.coins + city.materials * 10
  return worth(a) >= worth(b) ? a : b
}
