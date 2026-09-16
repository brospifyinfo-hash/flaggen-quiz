// Der Bau-Katalog. Alles ist hier beschrieben – Aussehen, Kosten, Wirkung, Freischaltung.
// Ein neues Gebäude braucht genau einen Eintrag und keine Änderung am Stadt-Code.

export type Category = 'wohnen' | 'handel' | 'bildung' | 'natur' | 'wege'

export interface CategoryInfo {
  id: Category
  name: string
  emoji: string
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'wohnen', name: 'Wohnen', emoji: '🏠' },
  { id: 'handel', name: 'Handel', emoji: '🏪' },
  { id: 'bildung', name: 'Bildung', emoji: '🎓' },
  { id: 'natur', name: 'Natur', emoji: '🌳' },
  { id: 'wege', name: 'Wege', emoji: '🛣️' },
]

/** Zeichenrezept: Der Renderer baut daraus den Körper des Gebäudes. */
export interface Look {
  /** Grundform */
  kind: 'haus' | 'block' | 'laden' | 'baum' | 'flach' | 'park' | 'brunnen' | 'schule'
  /** Höhe in Kachelhöhen */
  height: number
  wall: string
  roof: string
  accent: string
  /** Fensterreihen, 0 = keine */
  floors?: number
}

export interface Effects {
  /** Wohnraum für so viele Menschen */
  capacity?: number
  happiness?: number
  education?: number
  environment?: number
  income?: number
  jobs?: number
}

export interface BuildingDef {
  id: string
  name: string
  category: Category
  emoji: string
  /** Größe in Kacheln, ohne Drehung */
  size: [number, number]
  coins: number
  materials: number
  effects: Effects
  /** Freischaltung – fehlt sie, ist das Bauwerk von Anfang an verfügbar */
  needsLevel?: number
  /** Kurzbeschreibung in der Bauauswahl */
  note: string
  look: Look
  /** Ausbaustufen: Aufpreis und was besser wird */
  upgrades?: { coins: number; materials: number; effects: Effects }[]
}

export const BUILDINGS: BuildingDef[] = [
  // ---------- Wohnen ----------
  {
    id: 'haus',
    name: 'Kleines Haus',
    category: 'wohnen',
    emoji: '🏠',
    size: [1, 1],
    coins: 120,
    materials: 2,
    effects: { capacity: 4, happiness: 1 },
    note: 'Platz für vier Menschen',
    look: { kind: 'haus', height: 1.05, wall: '#f3e2c7', roof: '#c8553d', accent: '#8c4230', floors: 1 },
    upgrades: [
      { coins: 220, materials: 4, effects: { capacity: 7, happiness: 2 } },
      { coins: 480, materials: 8, effects: { capacity: 11, happiness: 3 } },
    ],
  },
  {
    id: 'familienhaus',
    name: 'Familienhaus',
    category: 'wohnen',
    emoji: '🏡',
    size: [1, 1],
    coins: 280,
    materials: 4,
    effects: { capacity: 8, happiness: 2 },
    note: 'Etwas größer, mit Garten',
    look: { kind: 'haus', height: 1.35, wall: '#fbf0dc', roof: '#3f7d8c', accent: '#2c5b66', floors: 2 },
    upgrades: [{ coins: 520, materials: 9, effects: { capacity: 14, happiness: 3 } }],
  },
  {
    id: 'reihenhaus',
    name: 'Reihenhäuser',
    category: 'wohnen',
    emoji: '🏘️',
    size: [2, 1],
    coins: 520,
    materials: 8,
    effects: { capacity: 18, happiness: 2 },
    note: 'Viel Wohnraum auf wenig Fläche',
    look: { kind: 'haus', height: 1.2, wall: '#efd9bd', roof: '#a8563c', accent: '#7c3f2c', floors: 2 },
  },
  {
    id: 'wohnblock',
    name: 'Wohnblock',
    category: 'wohnen',
    emoji: '🏢',
    size: [2, 2],
    coins: 1100,
    materials: 18,
    effects: { capacity: 48, happiness: -2, jobs: 4 },
    needsLevel: 3,
    note: 'Sehr viel Wohnraum, wenig Charme',
    look: { kind: 'block', height: 2.8, wall: '#dfe6ef', roof: '#8a99ad', accent: '#5d6b80', floors: 5 },
    upgrades: [{ coins: 1600, materials: 26, effects: { capacity: 72, happiness: 0, jobs: 8 } }],
  },

  // ---------- Handel ----------
  {
    id: 'laden',
    name: 'Laden',
    category: 'handel',
    emoji: '🏪',
    size: [1, 1],
    coins: 220,
    materials: 3,
    effects: { income: 14, jobs: 3, happiness: 1 },
    note: 'Bringt täglich Einnahmen',
    look: { kind: 'laden', height: 1.05, wall: '#ffe9a8', roof: '#e0623d', accent: '#b8462a', floors: 1 },
    upgrades: [{ coins: 420, materials: 6, effects: { income: 26, jobs: 6, happiness: 2 } }],
  },
  {
    id: 'cafe',
    name: 'Café',
    category: 'handel',
    emoji: '☕',
    size: [1, 1],
    coins: 340,
    materials: 4,
    effects: { income: 20, jobs: 4, happiness: 4 },
    note: 'Treffpunkt im Viertel',
    look: { kind: 'laden', height: 1, wall: '#f8d8c0', roof: '#6b4a3a', accent: '#4a3126', floors: 1 },
  },
  {
    id: 'markt',
    name: 'Markthalle',
    category: 'handel',
    emoji: '🛍️',
    size: [2, 1],
    coins: 760,
    materials: 11,
    effects: { income: 52, jobs: 12, happiness: 3 },
    needsLevel: 2,
    note: 'Der Handel des Viertels',
    look: { kind: 'laden', height: 1.5, wall: '#ffe2b8', roof: '#2f8f6f', accent: '#1f6b52', floors: 2 },
  },

  // ---------- Bildung ----------
  {
    id: 'schule',
    name: 'Schule',
    category: 'bildung',
    emoji: '🏫',
    size: [2, 2],
    coins: 1400,
    materials: 22,
    effects: { education: 14, jobs: 10, happiness: 3, capacity: 4 },
    needsLevel: 2,
    note: 'Bildung macht die Stadt stärker',
    look: { kind: 'schule', height: 1.75, wall: '#f6e7d2', roof: '#b9503f', accent: '#8a372a', floors: 2 },
    upgrades: [{ coins: 2200, materials: 30, effects: { education: 26, jobs: 18, happiness: 5, capacity: 6 } }],
  },
  {
    id: 'bibliothek',
    name: 'Bibliothek',
    category: 'bildung',
    emoji: '📚',
    size: [1, 1],
    coins: 900,
    materials: 14,
    effects: { education: 9, happiness: 4, jobs: 3 },
    needsLevel: 2,
    note: 'Ruhe, Bücher, Wissen',
    look: { kind: 'schule', height: 1.35, wall: '#e8ddc8', roof: '#4b6b8a', accent: '#334c66', floors: 2 },
  },

  // ---------- Natur ----------
  {
    id: 'baum',
    name: 'Baum',
    category: 'natur',
    emoji: '🌳',
    size: [1, 1],
    coins: 25,
    materials: 0,
    effects: { happiness: 1, environment: 3 },
    note: 'Schnell gepflanzt, immer schön',
    look: { kind: 'baum', height: 0.9, wall: '#6b4a2f', roof: '#2f9e5c', accent: '#237a46' },
  },
  {
    id: 'park',
    name: 'Park',
    category: 'natur',
    emoji: '🌲',
    size: [2, 2],
    coins: 520,
    materials: 4,
    effects: { happiness: 14, environment: 12 },
    note: 'Das grüne Herz eines Viertels',
    look: { kind: 'park', height: 0.12, wall: '#5fbf7a', roof: '#3f9e5c', accent: '#2f7d46' },
  },
  {
    id: 'brunnen',
    name: 'Brunnen',
    category: 'natur',
    emoji: '⛲',
    size: [1, 1],
    coins: 180,
    materials: 2,
    effects: { happiness: 6 },
    note: 'Wasser mitten im Platz',
    look: { kind: 'brunnen', height: 0.3, wall: '#cfd8e3', roof: '#7fc7e8', accent: '#4a9fd0' },
  },

  // ---------- Wege ----------
  {
    id: 'platz',
    name: 'Pflasterplatz',
    category: 'wege',
    emoji: '⬜',
    size: [1, 1],
    coins: 40,
    materials: 1,
    effects: { happiness: 1 },
    note: 'Fläche zum Verbinden und Gestalten',
    look: { kind: 'flach', height: 0.08, wall: '#cfc6b8', roof: '#bdb3a4', accent: '#a79c8c' },
  },
  {
    id: 'weg',
    name: 'Fußweg',
    category: 'wege',
    emoji: '🚶',
    size: [1, 1],
    coins: 20,
    materials: 0,
    effects: {},
    note: 'Schmaler Weg für Fußgänger',
    look: { kind: 'flach', height: 0.06, wall: '#d9d2c4', roof: '#c9c1b2', accent: '#b3a996' },
  },
]

const BY_ID = new Map(BUILDINGS.map((entry) => [entry.id, entry]))

export const buildingDef = (id: string): BuildingDef | undefined => BY_ID.get(id)

/** Größe nach Drehung: ungerade Vierteldrehungen tauschen Breite und Tiefe */
export function footprint(def: BuildingDef, rot: number): [number, number] {
  return rot % 2 === 0 ? [def.size[0], def.size[1]] : [def.size[1], def.size[0]]
}

/** Wirkung auf der aktuellen Ausbaustufe */
export function effectsOf(def: BuildingDef, level: number): Effects {
  if (level <= 1 || !def.upgrades) return def.effects
  return def.upgrades[Math.min(def.upgrades.length, level - 1) - 1]?.effects ?? def.effects
}

/** Kosten des nächsten Ausbaus – null, wenn es keinen weiteren gibt */
export function nextUpgrade(def: BuildingDef, level: number) {
  const step = def.upgrades?.[level - 1]
  return step ?? null
}

export const maxLevel = (def: BuildingDef) => 1 + (def.upgrades?.length ?? 0)
