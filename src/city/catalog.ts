// Der Bau-Katalog. Alles ist hier beschrieben – Aussehen, Kosten, Wirkung, Freischaltung.
// Ein neues Gebäude braucht genau einen Eintrag und keine Änderung am Stadt-Code.
import { domainById } from '../knowledge'

export type Category = 'wohnen' | 'handel' | 'bildung' | 'natur' | 'schmuck' | 'wege'

/** Straßen liegen nicht als Bauwerk auf der Kachel, sondern als eigenes Netz darunter. */
export interface RoadDef {
  id: string
  name: string
  emoji: string
  /** Preis je Kachel */
  coins: number
  materials: number
  note: string
  /** Breite als Anteil der Kachelhöhe */
  width: number
  surface: string
  edge: string
  /** Mittelstreifen, wenn vorhanden */
  marking?: string
  /** Bäume am Rand */
  trees?: boolean
}

export const ROADS: RoadDef[] = [
  {
    id: 'weg',
    name: 'Fußweg',
    emoji: '🚶',
    coins: 12,
    materials: 0,
    note: 'Schmal, für Spaziergänge',
    width: 0.4,
    surface: '#d9d2c4',
    edge: '#b7ae9d',
  },
  {
    id: 'strasse',
    name: 'Straße',
    emoji: '🛣️',
    coins: 35,
    materials: 1,
    note: 'Verbindet die Stadt',
    width: 0.62,
    surface: '#474c59',
    edge: '#cdc9bf',
    marking: '#e9e3d0',
  },
  {
    id: 'allee',
    name: 'Allee',
    emoji: '🌳',
    coins: 85,
    materials: 2,
    note: 'Breit, mit Bäumen am Rand',
    width: 0.8,
    surface: '#3e434d',
    edge: '#d3cfc4',
    marking: '#ffd23f',
    trees: true,
  },
]

const ROAD_BY_ID = new Map(ROADS.map((entry) => [entry.id, entry]))
export const roadDef = (id: string): RoadDef | undefined => ROAD_BY_ID.get(id)

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
  { id: 'schmuck', name: 'Schmuck', emoji: '✨' },
  { id: 'wege', name: 'Wege', emoji: '🛣️' },
]

/** Zeichenrezept: Der Renderer baut daraus den Körper des Gebäudes. */
export interface Look {
  /** Grundform */
  kind:
    | 'haus'
    | 'block'
    | 'laden'
    | 'baum'
    | 'flach'
    | 'park'
    | 'brunnen'
    | 'schule'
    | 'wasser'
    | 'statue'
    | 'kuppel'
    | 'bank'
    | 'laterne'
    | 'blumen'
    | 'fahne'
    | 'felsen'
    | 'hecke'
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

/** Ein Wissensgebiet auf einer Mindeststufe */
export interface Need {
  domain: string
  level: number
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
  /** Wissensgebiete, die dafür gelernt sein müssen */
  needs?: Need[]
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

  {
    id: 'teich',
    name: 'Teich',
    category: 'natur',
    emoji: '💧',
    size: [2, 1],
    coins: 420,
    materials: 2,
    effects: { happiness: 9, environment: 10 },
    note: 'Wasser tut jeder Stadt gut',
    look: { kind: 'wasser', height: 0.1, wall: '#3f7fb5', roof: '#6fb7e0', accent: '#9fd8f2' },
  },
  {
    id: 'statue',
    name: 'Statue',
    category: 'natur',
    emoji: '🗿',
    size: [1, 1],
    coins: 340,
    materials: 3,
    effects: { happiness: 7 },
    needsLevel: 3,
    note: 'Ein Denkmal für die Stadt',
    look: { kind: 'statue', height: 0.9, wall: '#c8c2b4', roof: '#a8a294', accent: '#8d8577' },
  },

  // ---------- Handel und Bildung, größer ----------
  {
    id: 'restaurant',
    name: 'Restaurant',
    category: 'handel',
    emoji: '🍽️',
    size: [2, 1],
    coins: 980,
    materials: 13,
    effects: { income: 68, jobs: 14, happiness: 6 },
    needsLevel: 4,
    note: 'Wo die Stadt abends hingeht',
    look: { kind: 'laden', height: 1.35, wall: '#f6ddc0', roof: '#9c3f52', accent: '#732b3c', floors: 2 },
  },
  {
    id: 'hotel',
    name: 'Hotel',
    category: 'handel',
    emoji: '🏨',
    size: [2, 2],
    coins: 2400,
    materials: 34,
    effects: { income: 160, jobs: 30, happiness: 4, capacity: 6 },
    needsLevel: 7,
    note: 'Gäste bringen Geld in die Stadt',
    look: { kind: 'block', height: 3.2, wall: '#f0e4d2', roof: '#b06a3a', accent: '#7f4a26', floors: 6 },
    upgrades: [{ coins: 3600, materials: 48, effects: { income: 240, jobs: 44, happiness: 6, capacity: 10 } }],
  },
  {
    id: 'stadthaus',
    name: 'Stadthaus',
    category: 'wohnen',
    emoji: '🏘️',
    size: [1, 1],
    coins: 620,
    materials: 9,
    effects: { capacity: 22, happiness: 1 },
    needsLevel: 4,
    note: 'Schmal, hoch, viele Nachbarn',
    look: { kind: 'haus', height: 2.2, wall: '#e9dcc6', roof: '#6b5a8c', accent: '#4c3f68', floors: 4 },
    upgrades: [{ coins: 980, materials: 14, effects: { capacity: 32, happiness: 2 } }],
  },
  {
    id: 'villa',
    name: 'Villa',
    category: 'wohnen',
    emoji: '🏰',
    size: [2, 2],
    coins: 1900,
    materials: 26,
    effects: { capacity: 14, happiness: 12 },
    needsLevel: 6,
    note: 'Wenig Platz, viel Ansehen',
    look: { kind: 'haus', height: 1.9, wall: '#fdf3e0', roof: '#37606b', accent: '#24454e', floors: 2 },
  },
  {
    id: 'universitaet',
    name: 'Universität',
    category: 'bildung',
    emoji: '🎓',
    size: [2, 2],
    coins: 4200,
    materials: 62,
    effects: { education: 44, jobs: 38, happiness: 8, income: 60, capacity: 12 },
    needsLevel: 10,
    note: 'Das Herz einer klugen Stadt',
    look: { kind: 'schule', height: 2.4, wall: '#f2e3cb', roof: '#8c4a3f', accent: '#5f2f28', floors: 3 },
    upgrades: [{ coins: 6800, materials: 90, effects: { education: 72, jobs: 60, happiness: 12, income: 110, capacity: 18 } }],
  },

  // ---------- Wissen wird sichtbar ----------
  {
    id: 'museum',
    name: 'Museum',
    category: 'bildung',
    emoji: '🏛️',
    size: [2, 2],
    coins: 2600,
    materials: 38,
    effects: { education: 22, happiness: 11, income: 48, jobs: 14 },
    needsLevel: 6,
    needs: [{ domain: 'geschichte', level: 3 }],
    note: 'Wächst aus dem, was du über Geschichte gelernt hast',
    look: { kind: 'schule', height: 1.9, wall: '#f1e7d3', roof: '#9c7b4f', accent: '#6d5334', floors: 2 },
    upgrades: [{ coins: 3900, materials: 52, effects: { education: 36, happiness: 16, income: 78, jobs: 22 } }],
  },
  {
    id: 'sternwarte',
    name: 'Sternwarte',
    category: 'bildung',
    emoji: '🔭',
    size: [1, 1],
    coins: 2300,
    materials: 32,
    effects: { education: 20, happiness: 8, jobs: 6 },
    needsLevel: 6,
    needs: [{ domain: 'mathe', level: 3 }],
    note: 'Für alle, die gern rechnen und nach oben schauen',
    look: { kind: 'kuppel', height: 1.5, wall: '#e7eef6', roof: '#93a7c0', accent: '#5f7a99' },
  },
  {
    id: 'weltzentrum',
    name: 'Geografie-Zentrum',
    category: 'bildung',
    emoji: '🌍',
    size: [2, 1],
    coins: 2400,
    materials: 34,
    effects: { education: 20, happiness: 9, income: 40, jobs: 12 },
    needsLevel: 6,
    needs: [{ domain: 'geografie', level: 3 }],
    note: 'Karten, Globen und Länderkunde',
    look: { kind: 'block', height: 1.7, wall: '#dfeef0', roof: '#2f8f8f', accent: '#1f6b6b', floors: 3 },
  },
  {
    id: 'theater',
    name: 'Theater',
    category: 'bildung',
    emoji: '🎭',
    size: [2, 2],
    coins: 2800,
    materials: 40,
    effects: { happiness: 20, income: 60, jobs: 18, education: 8 },
    needsLevel: 7,
    needs: [{ domain: 'menschen', level: 3 }],
    note: 'Bühne für die Geschichten der Menschen',
    look: { kind: 'laden', height: 2, wall: '#f4dcd6', roof: '#8c3b52', accent: '#5e2436', floors: 2 },
  },
  {
    id: 'raumfahrt',
    name: 'Raumfahrtzentrum',
    category: 'bildung',
    emoji: '🚀',
    size: [2, 2],
    coins: 9800,
    materials: 140,
    effects: { education: 70, happiness: 25, income: 180, jobs: 60 },
    needsLevel: 15,
    needs: [
      { domain: 'mathe', level: 6 },
      { domain: 'geografie', level: 4 },
    ],
    note: 'Das Ziel für eine Stadt, die rechnen kann',
    look: { kind: 'kuppel', height: 2.6, wall: '#eef3f8', roof: '#6d7f99', accent: '#3f4f66' },
  },

  // ---------- Schmuck: kleine Dinge, die eine Stadt erst wohnlich machen ----------
  {
    id: 'bank',
    name: 'Bank',
    category: 'schmuck',
    emoji: '🪑',
    size: [1, 1],
    coins: 60,
    materials: 1,
    effects: { happiness: 2 },
    note: 'Zum Sitzen und Schauen',
    look: { kind: 'bank', height: 0.2, wall: '#a97b4f', roof: '#8a5f3a', accent: '#6b4a2c' },
  },
  {
    id: 'laterne',
    name: 'Laterne',
    category: 'schmuck',
    emoji: '💡',
    size: [1, 1],
    coins: 85,
    materials: 1,
    effects: { happiness: 2 },
    note: 'Licht für den Abend',
    look: { kind: 'laterne', height: 0.8, wall: '#4a5162', roof: '#ffe9a8', accent: '#ffd23f' },
  },
  {
    id: 'blumen',
    name: 'Blumenbeet',
    category: 'schmuck',
    emoji: '🌸',
    size: [1, 1],
    coins: 45,
    materials: 0,
    effects: { happiness: 2, environment: 2 },
    note: 'Ein bisschen Farbe',
    look: { kind: 'blumen', height: 0.12, wall: '#5aa85f', roof: '#ff7ab5', accent: '#ffd23f' },
  },
  {
    id: 'hecke',
    name: 'Hecke',
    category: 'schmuck',
    emoji: '🌿',
    size: [1, 1],
    coins: 35,
    materials: 0,
    effects: { environment: 2 },
    note: 'Grenzt Grundstücke ab',
    look: { kind: 'hecke', height: 0.3, wall: '#3f8f52', roof: '#4fa862', accent: '#2f6b3f' },
  },
  {
    id: 'felsen',
    name: 'Felsen',
    category: 'schmuck',
    emoji: '🪨',
    size: [1, 1],
    coins: 30,
    materials: 0,
    effects: { environment: 1 },
    note: 'Steht einfach da und sieht gut aus',
    look: { kind: 'felsen', height: 0.3, wall: '#9aa0aa', roof: '#b4bac4', accent: '#7a8089' },
  },
  {
    id: 'fahne',
    name: 'Fahnenmast',
    category: 'schmuck',
    emoji: '🚩',
    size: [1, 1],
    coins: 130,
    materials: 2,
    effects: { happiness: 3 },
    needsLevel: 3,
    note: 'Zeigt Flagge in deiner Stadt',
    look: { kind: 'fahne', height: 1.1, wall: '#d7dbe2', roof: '#e0623d', accent: '#ffd23f' },
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
]

const BY_ID = new Map(BUILDINGS.map((entry) => [entry.id, entry]))

export const buildingDef = (id: string): BuildingDef | undefined => BY_ID.get(id)

/**
 * Ist dieses Bauwerk freigeschaltet? Die Regeln stehen am Bauwerk selbst,
 * geprüft wird gegen Stadt-Stufe und Wissensstufen – nichts davon ist fest verdrahtet.
 */
export function unlockInfo(
  def: BuildingDef,
  cityLevel: number,
  levels: Record<string, number>,
): { ok: boolean; missing: string[] } {
  const missing: string[] = []
  if (def.needsLevel && cityLevel < def.needsLevel) missing.push(`Stadt-Stufe ${def.needsLevel}`)
  for (const need of def.needs ?? []) {
    if ((levels[need.domain] ?? 0) < need.level) {
      missing.push(`${domainById(need.domain)?.name ?? need.domain} Stufe ${need.level}`)
    }
  }
  return { ok: missing.length === 0, missing }
}

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
