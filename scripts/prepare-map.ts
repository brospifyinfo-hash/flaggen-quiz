// Erzeugt aus den Natural-Earth-Daten (gemeinfrei, Paket world-atlas) fertige SVG-Pfade
// für die Weltkarte. Die App braucht dadurch zur Laufzeit keine Kartenbibliothek.
// Aufruf: npm run map
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { geoCentroid, geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { COUNTRIES, type ContinentId } from '../src/data/countries.ts'
import { mapToLatLon } from '../src/map-projection.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

const WIDTH = 1000
const HEIGHT = 500
/** Ein Land, dessen Umriss breiter ist, wird am Datumsgrenze zerschnitten – dann zählt nur der Mittelpunkt */
const SAFE_WIDTH = WIDTH * 0.42
/** Breite geteilt durch Höhe der Kontinent-Ausschnitte – hochkant, wie ein Handy */
const VIEW_ASPECT = 0.85

/** Namen aus Natural Earth, die nicht zu unseren Ländernamen passen */
const OVERRIDES: Record<string, string> = {
  Russia: 'ru',
  'United States of America': 'us',
  'United Kingdom': 'gb',
  'Dominican Rep.': 'do',
  'Dem. Rep. Congo': 'cd',
  Congo: 'cg',
  'Central African Rep.': 'cf',
  'S. Sudan': 'ss',
  'Eq. Guinea': 'gq',
  'W. Sahara': '',
  'Falkland Is.': '',
  'Fr. S. Antarctic Lands': '',
  Greenland: '',
  'N. Cyprus': '',
  Somaliland: '',
  Antarctica: '',
  'Solomon Is.': 'sb',
  'Papua New Guinea': 'pg',
  'New Zealand': 'nz',
  'Timor-Leste': 'tl',
  'Bosnia and Herz.': 'ba',
  'North Macedonia': 'mk',
  Czechia: 'cz',
  Moldova: 'md',
  'Côte d’Ivoire': 'ci',
  "Côte d'Ivoire": 'ci',
  Tanzania: 'tz',
  Vietnam: 'vn',
  Laos: 'la',
  Syria: 'sy',
  Iran: 'ir',
  'South Korea': 'kr',
  'North Korea': 'kp',
  Bolivia: 'bo',
  Venezuela: 've',
  Brunei: 'bn',
  Taiwan: 'tw',
  Palestine: 'ps',
  'Cabo Verde': 'cv',
  Eswatini: 'sz',
  eSwatini: 'sz',
  // Gebiete, die in unserer Länderliste bewusst fehlen
  'Puerto Rico': '',
  'New Caledonia': '',
  'São Tomé and Principe': 'st',
  Kosovo: 'xk',
  Myanmar: 'mm',
  Turkey: 'tr',
  'Türkiye': 'tr',
  Vatican: 'va',
  'Antigua and Barb.': 'ag',
  'St. Kitts and Nevis': 'kn',
  'St. Vin. and Gren.': 'vc',
  'Trinidad and Tobago': 'tt',
  Bahamas: 'bs',
  'Marshall Is.': 'mh',
  Micronesia: 'fm',
  'Fed. States of Micronesia': 'fm',
}

const german = new Map(COUNTRIES.map((country) => [country.code, country.name]))
const continentOf = new Map(COUNTRIES.map((country) => [country.code, country.continent]))

/** englische Namen aus dem Flaggenpaket, um Natural Earth zuzuordnen */
const flagNames: Record<string, string> = JSON.parse(
  readFileSync(join(dirname(require.resolve('svg-country-flags/package.json')), 'countries.json'), 'utf8'),
)

const normalise = (name: string) =>
  name
    .toLowerCase()
    .split(',')[0]
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z ]/g, '')
    .replace(/\bthe\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const byName = new Map<string, string>()
for (const [code, name] of Object.entries(flagNames)) {
  const lower = code.toLowerCase()
  if (!german.has(lower)) continue
  byName.set(normalise(name), lower)
}
// ein paar gängige Kurzformen
byName.set('united states', 'us')
byName.set('united kingdom', 'gb')
byName.set('south korea', 'kr')
byName.set('north korea', 'kp')

const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-110m.json'), 'utf8'))
const collection = feature(topo, topo.objects.countries) as unknown as {
  type: string
  features: { id?: string; properties: { name: string }; geometry: unknown }[]
}

const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], collection as never)
const toPath = geoPath(projection)
const scale = projection.scale()
const [dx, dy] = projection.translate()

// Die App rechnet einen Tipper selbst in Koordinaten um – hier prüfen wir, dass sie dasselbe herausbekommt
for (const [x, y] of [
  [120, 90],
  [500, 250],
  [860, 360],
  [300, 430],
  [640, 140],
]) {
  const own = mapToLatLon(x, y, scale, dx, dy)
  const reference = projection.invert?.([x, y])
  if (!reference) throw new Error('Projektion lässt sich nicht umkehren')
  const error = Math.max(Math.abs(own[0] - reference[1]), Math.abs(own[1] - reference[0]))
  if (error > 1e-6) throw new Error(`Umkehrung weicht ab (${error} Grad bei ${x}/${y})`)
}

/** Pfad kürzen: eine Nachkommastelle reicht für die Anzeige */
const round = (d: string) => d.replace(/-?\d+\.\d+/g, (value) => Number(value).toFixed(1))

interface Shape {
  code: string
  d: string
  cx: number
  cy: number
  lat: number
  lon: number
  area: number
}

type Box = [x0: number, y0: number, x1: number, y1: number]

const shapes: Shape[] = []
const boxes = new Map<string, Box>()
const unmatched: string[] = []

for (const entry of collection.features) {
  const name = entry.properties?.name ?? ''
  const override = OVERRIDES[name]
  const code = override !== undefined ? override : (byName.get(normalise(name)) ?? '')
  if (!code) {
    if (override === undefined) unmatched.push(name)
    continue
  }
  if (!german.has(code)) {
    unmatched.push(`${name} → ${code} (kein Land der Liste)`)
    continue
  }
  const d = toPath(entry as never)
  if (!d) continue
  const [lon, lat] = geoCentroid(entry as never)
  const [cx, cy] = projection([lon, lat]) ?? [0, 0]
  const bounds = toPath.bounds(entry as never)
  shapes.push({
    code,
    d: round(d),
    cx: Number(cx.toFixed(1)),
    cy: Number(cy.toFixed(1)),
    lat: Number(lat.toFixed(3)),
    lon: Number(lon.toFixed(3)),
    area: Number(toPath.area(entry as never).toFixed(1)),
  })
  boxes.set(code, [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]])
}

shapes.sort((a, b) => a.code.localeCompare(b.code))

// ---------- Kontinent-Ausschnitte ----------

const percentile = (values: number[], share: number) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(share * (sorted.length - 1))))]
}

/**
 * Ausschnitt je Kontinent. Ausreißer wie Russland in Europa würden den Ausschnitt
 * zur halben Weltkarte aufblähen – deshalb zählen nur die mittleren 90 Prozent.
 * Liegt ein gesuchtes Land außerhalb, vergrößert die App den Ausschnitt zur Laufzeit.
 */
function viewFor(continent: ContinentId): Box {
  const members = shapes.filter((shape) => continentOf.get(shape.code) === continent)
  const lefts: number[] = []
  const rights: number[] = []
  const tops: number[] = []
  const bottoms: number[] = []

  for (const shape of members) {
    const box = boxes.get(shape.code) as Box
    const split = box[2] - box[0] > SAFE_WIDTH || box[3] - box[1] > HEIGHT * 0.6
    const [x0, y0, x1, y1] = split ? [shape.cx - 25, shape.cy - 25, shape.cx + 25, shape.cy + 25] : box
    lefts.push(x0)
    rights.push(x1)
    tops.push(y0)
    bottoms.push(y1)
  }

  let x0 = percentile(lefts, 0.05)
  let x1 = percentile(rights, 0.95)
  let y0 = percentile(tops, 0.05)
  let y1 = percentile(bottoms, 0.95)

  const padX = Math.max(12, (x1 - x0) * 0.08)
  const padY = Math.max(12, (y1 - y0) * 0.08)
  x0 -= padX
  x1 += padX
  y0 -= padY
  y1 += padY

  // auf ein festes Seitenverhältnis bringen, damit jeder Ausschnitt gleich gut auf das Handy passt
  let width = x1 - x0
  let height = y1 - y0
  if (width / height < VIEW_ASPECT) {
    const grow = (height * VIEW_ASPECT - width) / 2
    x0 -= grow
    x1 += grow
  } else {
    const grow = (width / VIEW_ASPECT - height) / 2
    y0 -= grow
    y1 += grow
  }
  width = x1 - x0
  height = y1 - y0

  // in die Karte schieben, ohne die Größe zu verändern
  if (x0 < 0) {
    x1 -= x0
    x0 = 0
  }
  if (y0 < 0) {
    y1 -= y0
    y0 = 0
  }
  if (x1 > WIDTH) {
    x0 -= x1 - WIDTH
    x1 = WIDTH
  }
  if (y1 > HEIGHT) {
    y0 -= y1 - HEIGHT
    y1 = HEIGHT
  }

  return [
    Number(Math.max(0, x0).toFixed(1)),
    Number(Math.max(0, y0).toFixed(1)),
    Number(Math.min(WIDTH, x1).toFixed(1)),
    Number(Math.min(HEIGHT, y1).toFixed(1)),
  ]
}

const CONTINENTS: ContinentId[] = ['europa', 'nordamerika', 'suedamerika', 'asien', 'afrika', 'ozeanien']
const views = Object.fromEntries(CONTINENTS.map((continent) => [continent, viewFor(continent)]))

const file = `// Diese Datei wird von scripts/prepare-map.ts erzeugt – nicht von Hand ändern.
// Grundlage: Natural Earth (gemeinfrei) über das Paket world-atlas.
import type { ContinentId } from './countries'

export const MAP_WIDTH = ${WIDTH}
export const MAP_HEIGHT = ${HEIGHT}

/** Kennwerte der Projektion, damit aus einem Tipper echte Koordinaten werden */
export const MAP_SCALE = ${scale}
export const MAP_DX = ${dx}
export const MAP_DY = ${dy}

export interface CountryShape {
  code: string
  /** SVG-Pfad im Koordinatensystem ${WIDTH} × ${HEIGHT} */
  d: string
  /** Mittelpunkt auf der Karte */
  cx: number
  cy: number
  /** Mittelpunkt in Grad, für Entfernungen */
  lat: number
  lon: number
  /** Fläche auf der Karte, um winzige Länder auszuschließen */
  area: number
}

export const SHAPES: CountryShape[] = ${JSON.stringify(shapes)}

/** Ausschnitt je Kontinent als [x0, y0, x1, y1] */
export const CONTINENT_VIEWS: Record<ContinentId, [number, number, number, number]> = ${JSON.stringify(views)}
`

writeFileSync(join(root, 'src', 'data', 'map.ts'), file)

const missing = COUNTRIES.filter((country) => !shapes.some((shape) => shape.code === country.code))
console.log(`${shapes.length} Länder mit Umriss, ${Math.round(file.length / 1024)} KB`)
console.log(`ohne Umriss (${missing.length}): ${missing.map((c) => c.name).join(', ')}`)
if (unmatched.length > 0) console.log(`nicht zugeordnet (${unmatched.length}): ${unmatched.join(', ')}`)
for (const [continent, box] of Object.entries(views)) {
  const outside = shapes.filter(
    (shape) =>
      continentOf.get(shape.code) === continent &&
      (shape.cx < box[0] || shape.cx > box[2] || shape.cy < box[1] || shape.cy > box[3]),
  )
  const size = `${Math.round(box[2] - box[0])} × ${Math.round(box[3] - box[1])}`
  console.log(`${continent}: ${size} px, außerhalb: ${outside.map((s) => s.code).join(' ') || '–'}`)
}
