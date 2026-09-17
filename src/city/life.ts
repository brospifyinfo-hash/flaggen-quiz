// Leben in der Stadt: Figuren, die über die Straßen laufen, radeln und fahren,
// dazu Menschen, die sich an Parks, Cafés und Schulen aufhalten.
// Bewusst einfach gehalten – es geht um ein glaubwürdiges Bild, nicht um eine echte Simulation.
import { buildingDef } from './catalog'
import { roadAt, tilesOf } from './state'
import type { CityState } from './types'

export type Kind = 'fuss' | 'rad' | 'auto'

export interface Walker {
  kind: Kind
  /** Kachel, auf der die Figur gerade startet */
  x: number
  y: number
  /** Kachel, auf die sie zugeht */
  tx: number
  ty: number
  /** Fortschritt auf diesem Stück, 0 bis 1 */
  t: number
  speed: number
  color: string
  /** seitlicher Versatz, damit nicht alle auf derselben Linie laufen */
  off: number
}

export interface Idler {
  x: number
  y: number
  color: string
  /** Phase der kleinen Bewegung */
  phase: number
}

export interface Life {
  walkers: Walker[]
  idlers: Idler[]
  /** Stand der Stadt, für den dieses Leben gebaut wurde */
  signature: string
}

const COLORS = ['#ffd23f', '#ff7ab5', '#7bdcff', '#9dff8b', '#ffab6b', '#d3b3ff', '#ffffff']
const CAR_COLORS = ['#e94f5a', '#3f9ee0', '#f2c14e', '#7ad39a', '#c9cfda', '#a97bff']

const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]

/** Wo sich Menschen gern aufhalten */
const MEETING = new Set(['park', 'brunnen', 'cafe', 'restaurant', 'schule', 'universitaet', 'bibliothek', 'teich', 'platz'])

export const signatureOf = (city: CityState) =>
  `${city.buildings.length}:${Object.keys(city.roads).length}:${city.population}:${city.land}`

function roadTiles(city: CityState): { x: number; y: number; type: string }[] {
  return Object.entries(city.roads).map(([key, type]) => {
    const [x, y] = key.split(':').map(Number)
    return { x, y, type }
  })
}

/** Nachbarkacheln, auf denen diese Art unterwegs sein darf */
function neighbours(city: CityState, x: number, y: number, kind: Kind) {
  const list: { x: number; y: number }[] = []
  for (const [dx, dy] of [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ]) {
    const type = roadAt(city, x + dx, y + dy)
    if (!type) continue
    if (kind === 'auto' && type === 'weg') continue
    list.push({ x: x + dx, y: y + dy })
  }
  return list
}

export function createLife(city: CityState): Life {
  const roads = roadTiles(city)
  const walkers: Walker[] = []
  const idlers: Idler[] = []

  if (roads.length > 0) {
    const wanted = Math.max(2, Math.min(26, Math.round(city.population / 6) + 2))
    for (let i = 0; i < wanted; i++) {
      const fahrbar = roads.filter((tile) => tile.type !== 'weg')
      const kind: Kind = i % 5 === 0 && fahrbar.length > 1 ? 'auto' : i % 4 === 1 ? 'rad' : 'fuss'
      const start = pick(kind === 'auto' && fahrbar.length > 0 ? fahrbar : roads)
      const ziele = neighbours(city, start.x, start.y, kind)
      const ziel = ziele.length > 0 ? pick(ziele) : { x: start.x, y: start.y }
      walkers.push({
        kind,
        x: start.x,
        y: start.y,
        tx: ziel.x,
        ty: ziel.y,
        t: Math.random(),
        speed: kind === 'auto' ? 0.9 + Math.random() * 0.35 : kind === 'rad' ? 0.6 + Math.random() * 0.2 : 0.34 + Math.random() * 0.14,
        color: kind === 'auto' ? pick(CAR_COLORS) : pick(COLORS),
        off: (Math.random() - 0.5) * 0.3,
      })
    }
  }

  // Menschen an Treffpunkten – sie erscheinen erst, wenn es die Orte gibt
  for (const placed of city.buildings) {
    const def = buildingDef(placed.type)
    if (!def || !MEETING.has(def.id)) continue
    const tiles = tilesOf(placed)
    const anzahl = Math.min(4, 1 + Math.floor(tiles.length / 2))
    for (let i = 0; i < anzahl; i++) {
      const tile = tiles[Math.floor(Math.random() * tiles.length)]
      idlers.push({
        x: tile.x + 0.2 + Math.random() * 0.6,
        y: tile.y + 0.2 + Math.random() * 0.6,
        color: pick(COLORS),
        phase: Math.random() * Math.PI * 2,
      })
    }
  }

  return { walkers, idlers, signature: signatureOf(city) }
}

/** Ein Zeitschritt. Die Figuren laufen ihr Stück ab und suchen sich dann das nächste. */
export function stepLife(life: Life, city: CityState, dt: number): void {
  for (const walker of life.walkers) {
    walker.t += walker.speed * dt
    while (walker.t >= 1) {
      walker.t -= 1
      const von = { x: walker.x, y: walker.y }
      walker.x = walker.tx
      walker.y = walker.ty
      const ziele = neighbours(city, walker.x, walker.y, walker.kind)
      // Nicht sofort umdrehen, wenn es weitergeht
      const weiter = ziele.filter((ziel) => ziel.x !== von.x || ziel.y !== von.y)
      const gewaehlt = weiter.length > 0 ? pick(weiter) : ziele.length > 0 ? pick(ziele) : null
      if (!gewaehlt) {
        walker.t = 0
        break
      }
      walker.tx = gewaehlt.x
      walker.ty = gewaehlt.y
    }
  }
}
