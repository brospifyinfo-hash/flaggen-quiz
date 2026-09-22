import { GRID, PLAZA, TOWN_HALL_ID, footprint, getDef } from './defs';
import type { Building, GameState, LogEntry, LogKind } from './types';

const SAVE_KEY = 'schattenstadt-save-v1';
const VERSION = 1;

export function newBuilding(state: GameState, type: string, x: number, y: number): Building {
  return {
    id: state.nextId++,
    type,
    x,
    y,
    level: 1,
    residents: 0,
    moveInProgress: 0,
    happiness: 60,
    status: 'ok',
    unhappyFor: 0,
    complaint: '',
    raidedUntil: 0,
    builtAt: state.time,
  };
}

export function createState(): GameState {
  const state: GameState = {
    version: VERSION,
    cash: 6000,
    time: 0,
    cityLevel: 1,
    nextId: 1,
    buildings: [],
    log: [],
    stats: { totalEarned: 0, movedOut: 0, raids: 0, demolished: 0, finesPaid: 0 },
    savedAt: Date.now(),
  };
  state.buildings.push(newBuilding(state, TOWN_HALL_ID, PLAZA.x, PLAZA.y));
  addLog(state, 'Willkommen in Schattenstadt. Baue Wohnhäuser, damit Bewohner einziehen – und entscheide, wie sauber dein Geld sein soll.', 'info');
  return state;
}

export function addLog(state: GameState, text: string, kind: LogKind = 'info'): LogEntry {
  const entry = { t: state.time, text, kind };
  state.log.unshift(entry);
  if (state.log.length > 60) state.log.length = 60;
  return entry;
}

export function townHall(state: GameState): Building {
  return state.buildings.find((b) => b.type === TOWN_HALL_ID)!;
}

/** Liefert für jedes Feld das darauf stehende Gebäude */
export function buildOccupancy(state: GameState): (Building | null)[] {
  const occ: (Building | null)[] = new Array(GRID * GRID).fill(null);
  for (const b of state.buildings) {
    const size = footprint(b.type, b.level);
    for (let dx = 0; dx < size; dx++) {
      for (let dy = 0; dy < size; dy++) {
        const x = b.x + dx;
        const y = b.y + dy;
        if (x >= 0 && y >= 0 && x < GRID && y < GRID) occ[y * GRID + x] = b;
      }
    }
  }
  return occ;
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < GRID && y < GRID;
}

export function isPlaza(x: number, y: number): boolean {
  return x >= PLAZA.x && y >= PLAZA.y && x < PLAZA.x + PLAZA.size && y < PLAZA.y + PLAZA.size;
}

export function buildingAt(state: GameState, x: number, y: number): Building | null {
  if (!inBounds(x, y)) return null;
  return buildOccupancy(state)[y * GRID + x];
}

export function canPlace(state: GameState, type: string, x: number, y: number): boolean {
  if (!inBounds(x, y) || isPlaza(x, y)) return false;
  if (buildingAt(state, x, y)) return false;
  const d = getDef(type);
  return d.unlockLevel <= state.cityLevel && state.cash >= d.cost;
}

export function save(state: GameState): void {
  state.savedAt = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Speicher voll oder blockiert – Spiel läuft trotzdem weiter
  }
}

export function load(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.version !== VERSION || !Array.isArray(parsed.buildings)) return null;
    if (!parsed.buildings.some((b) => b.type === TOWN_HALL_ID)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
