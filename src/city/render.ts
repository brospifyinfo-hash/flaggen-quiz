// Zeichnet die Stadt als kleines Diorama: schräge Sicht, Schatten, Fassaden mit Fenstern,
// Dächer, Bäume. Alles in ein Canvas, damit auch große Städte flüssig bleiben.
import { buildingDef, footprint, type Look } from './catalog'
import { TILE_H, TILE_W, tileNoise, toScreen } from './iso'
import { tilesOf } from './state'
import type { CityState, Placed } from './types'

export interface Camera {
  /** Weltpunkt, der in der Bildmitte liegt */
  x: number
  y: number
  zoom: number
}

export interface Ghost {
  type: string
  x: number
  y: number
  rot: 0 | 1 | 2 | 3
  ok: boolean
}

export interface DrawOptions {
  ghost?: Ghost | null
  selected?: string | null
  buildMode?: boolean
  /** Sekunden, für ruhige Animationen */
  time?: number
}

type Point = { sx: number; sy: number }

const shade = (hex: string, amount: number): string => {
  const num = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount))
  const b = Math.max(0, Math.min(255, (num & 255) + amount))
  return `rgb(${r},${g},${b})`
}

function quad(
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  c: Point,
  d: Point,
  fill: string | CanvasGradient,
): void {
  ctx.beginPath()
  ctx.moveTo(a.sx, a.sy)
  ctx.lineTo(b.sx, b.sy)
  ctx.lineTo(c.sx, c.sy)
  ctx.lineTo(d.sx, d.sy)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

const lift = (p: Point, px: number): Point => ({ sx: p.sx, sy: p.sy - px })
const mix = (a: Point, b: Point, t: number): Point => ({ sx: a.sx + (b.sx - a.sx) * t, sy: a.sy + (b.sy - a.sy) * t })

/** Eine Fassade mit Fensterreihen */
function facade(
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  height: number,
  color: string,
  floors: number,
  glow: number,
): void {
  quad(ctx, a, b, lift(b, height), lift(a, height), color)
  if (floors <= 0 || height < 14) return

  const cols = Math.max(1, Math.round(Math.hypot(b.sx - a.sx, b.sy - a.sy) / 20))
  const rows = Math.min(floors, Math.max(1, Math.floor(height / 16)))
  const winH = Math.min(9, (height / rows) * 0.42)
  for (let row = 0; row < rows; row++) {
    const base = height * ((row + 0.72) / rows)
    for (let col = 0; col < cols; col++) {
      const t0 = (col + 0.28) / cols
      const t1 = (col + 0.72) / cols
      const p0 = lift(mix(a, b, t0), base)
      const p1 = lift(mix(a, b, t1), base)
      quad(ctx, p0, p1, lift(p1, winH), lift(p0, winH), glow > 0 ? `rgba(255,224,150,${glow})` : 'rgba(90,120,160,0.55)')
    }
  }
}

/** Baukörper: Deckel plus zwei sichtbare Seiten */
function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  heightPx: number,
  look: Look,
  glow: number,
): { n: Point; e: Point; s: Point; w: Point } {
  const n = toScreen(x, y)
  const e = toScreen(x + w, y)
  const s = toScreen(x + w, y + h)
  const west = toScreen(x, y + h)

  facade(ctx, e, s, heightPx, shade(look.wall, -18), look.floors ?? 0, glow)
  facade(ctx, s, west, heightPx, shade(look.wall, -52), look.floors ?? 0, glow * 0.7)

  quad(ctx, lift(n, heightPx), lift(e, heightPx), lift(s, heightPx), lift(west, heightPx), shade(look.wall, 16))
  return { n: lift(n, heightPx), e: lift(e, heightPx), s: lift(s, heightPx), w: lift(west, heightPx) }
}

function pyramidRoof(ctx: CanvasRenderingContext2D, top: ReturnType<typeof box>, rise: number, color: string): void {
  const apex: Point = {
    sx: (top.n.sx + top.s.sx) / 2,
    sy: (top.n.sy + top.s.sy) / 2 - rise,
  }
  const faces: [Point, Point][] = [
    [top.n, top.e],
    [top.e, top.s],
    [top.s, top.w],
    [top.w, top.n],
  ]
  const tints = [10, -10, -34, -22]
  faces.forEach(([a, b], index) => {
    ctx.beginPath()
    ctx.moveTo(a.sx, a.sy)
    ctx.lineTo(b.sx, b.sy)
    ctx.lineTo(apex.sx, apex.sy)
    ctx.closePath()
    ctx.fillStyle = shade(color, tints[index])
    ctx.fill()
  })
}

function tree(ctx: CanvasRenderingContext2D, x: number, y: number, look: Look, seed: number): void {
  const center = toScreen(x + 0.5, y + 0.5)
  const scale = 0.8 + seed * 0.45
  const trunkH = 14 * scale
  ctx.fillStyle = look.wall
  ctx.fillRect(center.sx - 2.5, center.sy - trunkH, 5, trunkH)
  const crown = 13 * scale
  ctx.fillStyle = look.accent
  ctx.beginPath()
  ctx.ellipse(center.sx, center.sy - trunkH - crown * 0.35, crown, crown * 0.85, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = look.roof
  ctx.beginPath()
  ctx.ellipse(center.sx - crown * 0.22, center.sy - trunkH - crown * 0.62, crown * 0.78, crown * 0.7, 0, 0, Math.PI * 2)
  ctx.fill()
}

function fountain(ctx: CanvasRenderingContext2D, x: number, y: number, look: Look, time: number): void {
  const center = toScreen(x + 0.5, y + 0.5)
  ctx.fillStyle = shade(look.wall, -30)
  ctx.beginPath()
  ctx.ellipse(center.sx, center.sy - 3, TILE_W * 0.34, TILE_H * 0.34, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = look.roof
  ctx.beginPath()
  ctx.ellipse(center.sx, center.sy - 6, TILE_W * 0.24, TILE_H * 0.24, 0, 0, Math.PI * 2)
  ctx.fill()
  const jet = 8 + Math.sin(time * 3) * 2
  ctx.strokeStyle = look.accent
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(center.sx, center.sy - 6)
  ctx.lineTo(center.sx, center.sy - 6 - jet)
  ctx.stroke()
}

function park(ctx: CanvasRenderingContext2D, placed: Placed, w: number, h: number, look: Look): void {
  const top = box(ctx, placed.x, placed.y, w, h, TILE_H * look.height, look, 0)
  // Weg quer durch den Park
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(top.n.sx, top.n.sy)
  ctx.lineTo(top.e.sx, top.e.sy)
  ctx.lineTo(top.s.sx, top.s.sy)
  ctx.lineTo(top.w.sx, top.w.sy)
  ctx.closePath()
  ctx.clip()
  ctx.strokeStyle = 'rgba(232,222,196,0.85)'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(top.w.sx, top.w.sy)
  ctx.lineTo(top.e.sx, top.e.sy)
  ctx.stroke()
  ctx.restore()

  for (let i = 0; i < w * h; i++) {
    const seed = tileNoise(placed.x + i, placed.y + i * 3)
    if (seed < 0.45) continue
    tree(
      ctx,
      placed.x + (i % w) + (seed - 0.5) * 0.4,
      placed.y + Math.floor(i / w) + (seed - 0.5) * 0.4,
      { ...look, wall: '#6b4a2f', accent: '#2f9e5c', roof: '#46b972' },
      seed * 0.6,
    )
  }
}

function drawBuilding(ctx: CanvasRenderingContext2D, placed: Placed, options: DrawOptions): void {
  const def = buildingDef(placed.type)
  if (!def) return
  const [w, h] = footprint(def, placed.rot)
  const look = def.look
  const time = options.time ?? 0

  // Schatten
  const shadow = toScreen(placed.x + 0.18, placed.y + 0.22)
  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.fillStyle = '#0b1424'
  ctx.beginPath()
  const n = toScreen(0, 0)
  const e = toScreen(w, 0)
  const s = toScreen(w, h)
  const west = toScreen(0, h)
  ctx.moveTo(shadow.sx + n.sx, shadow.sy + n.sy)
  ctx.lineTo(shadow.sx + e.sx, shadow.sy + e.sy)
  ctx.lineTo(shadow.sx + s.sx, shadow.sy + s.sy)
  ctx.lineTo(shadow.sx + west.sx, shadow.sy + west.sy)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Frisch Gebautes wächst kurz aus dem Boden. Wichtig: echte Uhrzeit, nicht die
  // Laufzeit der Seite – sonst bleibt jedes Haus für immer flach.
  const age = Date.now() - placed.at
  const rise = placed.at > 0 && age >= 0 && age < 600 ? Math.max(0.08, age / 600) : 1

  if (look.kind === 'baum') {
    tree(ctx, placed.x, placed.y, look, tileNoise(placed.x, placed.y))
    return
  }
  if (look.kind === 'park') {
    park(ctx, placed, w, h, look)
    return
  }

  const extra = (placed.level - 1) * 0.35
  const heightPx = TILE_H * (look.height + extra) * rise
  const glow = look.floors ? 0 : 0
  const top = box(ctx, placed.x, placed.y, w, h, heightPx, look, glow)

  if (look.kind === 'brunnen') {
    fountain(ctx, placed.x, placed.y, look, time)
    return
  }
  if (look.kind === 'flach') return

  if (look.kind === 'haus') {
    pyramidRoof(ctx, top, TILE_H * (0.45 + extra * 0.2), look.roof)
    // Tür
    const doorA = mix(top.e, top.s, 0.42)
    const doorB = mix(top.e, top.s, 0.58)
    quad(ctx, { sx: doorA.sx, sy: doorA.sy + heightPx }, { sx: doorB.sx, sy: doorB.sy + heightPx }, { sx: doorB.sx, sy: doorB.sy + heightPx - 13 }, { sx: doorA.sx, sy: doorA.sy + heightPx - 13 }, look.accent)
  } else if (look.kind === 'laden') {
    // Flachdach mit Markise
    quad(ctx, top.n, top.e, top.s, top.w, shade(look.roof, 0))
    const a = mix(top.e, top.s, 0.15)
    const b = mix(top.e, top.s, 0.85)
    quad(
      ctx,
      { sx: a.sx, sy: a.sy + heightPx * 0.42 },
      { sx: b.sx, sy: b.sy + heightPx * 0.42 },
      { sx: b.sx + 6, sy: b.sy + heightPx * 0.42 + 8 },
      { sx: a.sx + 6, sy: a.sy + heightPx * 0.42 + 8 },
      look.accent,
    )
  } else if (look.kind === 'schule') {
    quad(ctx, top.n, top.e, top.s, top.w, shade(look.roof, -6))
    // kleiner Turm
    const center = { sx: (top.n.sx + top.s.sx) / 2, sy: (top.n.sy + top.s.sy) / 2 }
    ctx.fillStyle = shade(look.wall, 8)
    ctx.fillRect(center.sx - 9, center.sy - 26, 18, 26)
    ctx.fillStyle = look.roof
    ctx.beginPath()
    ctx.moveTo(center.sx - 12, center.sy - 26)
    ctx.lineTo(center.sx + 12, center.sy - 26)
    ctx.lineTo(center.sx, center.sy - 44)
    ctx.closePath()
    ctx.fill()
  } else {
    // Block: Dachkante und Aufbau
    quad(ctx, top.n, top.e, top.s, top.w, shade(look.roof, 6))
    const inset = 0.25
    const a = toScreen(placed.x + inset, placed.y + inset)
    const b = toScreen(placed.x + w - inset, placed.y + inset)
    const c = toScreen(placed.x + w - inset, placed.y + h - inset)
    const d = toScreen(placed.x + inset, placed.y + h - inset)
    const up = heightPx + 9
    quad(ctx, lift(a, up), lift(b, up), lift(c, up), lift(d, up), shade(look.accent, 20))
  }
}

/** Boden, Gitter und Rand des freigeschalteten Gebiets */
function drawGround(ctx: CanvasRenderingContext2D, city: CityState, buildMode: boolean): void {
  const size = city.land
  const n = toScreen(0, 0)
  const e = toScreen(size, 0)
  const s = toScreen(size, size)
  const w = toScreen(0, size)

  // Erdschicht als Dicke unter der Wiese
  const depth = 26
  quad(ctx, e, s, lift(s, -depth), lift(e, -depth), '#6b5136')
  quad(ctx, s, w, lift(w, -depth), lift(s, -depth), '#57402b')

  const grass = ctx.createLinearGradient(n.sx, n.sy, s.sx, s.sy)
  grass.addColorStop(0, '#7fc86a')
  grass.addColorStop(1, '#4f9f57')
  quad(ctx, n, e, s, w, grass)

  // Kachelrauschen – die Wiese soll nicht wie Farbe aus der Dose aussehen
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const seed = tileNoise(x, y)
      if (seed < 0.55) continue
      const a = toScreen(x, y)
      const b = toScreen(x + 1, y)
      const c = toScreen(x + 1, y + 1)
      const d = toScreen(x, y + 1)
      quad(ctx, a, b, c, d, `rgba(255,255,255,${(seed - 0.55) * 0.14})`)
    }
  }

  if (buildMode) {
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 1
    for (let i = 0; i <= size; i++) {
      const a = toScreen(i, 0)
      const b = toScreen(i, size)
      ctx.beginPath()
      ctx.moveTo(a.sx, a.sy)
      ctx.lineTo(b.sx, b.sy)
      ctx.stroke()
      const c = toScreen(0, i)
      const d = toScreen(size, i)
      ctx.beginPath()
      ctx.moveTo(c.sx, c.sy)
      ctx.lineTo(d.sx, d.sy)
      ctx.stroke()
    }
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(n.sx, n.sy)
  ctx.lineTo(e.sx, e.sy)
  ctx.lineTo(s.sx, s.sy)
  ctx.lineTo(w.sx, w.sy)
  ctx.closePath()
  ctx.stroke()
}

function outline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  const n = toScreen(x, y)
  const e = toScreen(x + w, y)
  const s = toScreen(x + w, y + h)
  const west = toScreen(x, y + h)
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(n.sx, n.sy)
  ctx.lineTo(e.sx, e.sy)
  ctx.lineTo(s.sx, s.sy)
  ctx.lineTo(west.sx, west.sy)
  ctx.closePath()
  ctx.stroke()
}

/** Malt die ganze Stadt. Der Aufrufer setzt vorher Größe und Kamera. */
export function drawCity(
  ctx: CanvasRenderingContext2D,
  city: CityState,
  camera: Camera,
  view: { w: number; h: number },
  options: DrawOptions = {},
): void {
  const sky = ctx.createLinearGradient(0, 0, 0, view.h)
  sky.addColorStop(0, '#1b2a4a')
  sky.addColorStop(1, '#0d1526')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, view.w, view.h)

  ctx.save()
  ctx.translate(view.w / 2, view.h / 2)
  ctx.scale(camera.zoom, camera.zoom)
  ctx.translate(-camera.x, -camera.y)

  drawGround(ctx, city, options.buildMode === true)

  // Maler-Reihenfolge: was weiter hinten liegt, kommt zuerst
  const sorted = [...city.buildings].sort((a, b) => a.x + a.y - (b.x + b.y))
  for (const placed of sorted) {
    drawBuilding(ctx, placed, options)
    if (placed.id === options.selected) {
      const def = buildingDef(placed.type)
      if (def) {
        const [w, h] = footprint(def, placed.rot)
        outline(ctx, placed.x, placed.y, w, h, '#ffd23f')
      }
    }
  }

  const ghost = options.ghost
  if (ghost) {
    const def = buildingDef(ghost.type)
    if (def) {
      const [w, h] = footprint(def, ghost.rot)
      ctx.save()
      ctx.globalAlpha = 0.55
      drawBuilding(ctx, { id: 'ghost', type: ghost.type, x: ghost.x, y: ghost.y, rot: ghost.rot, level: 1, at: 0 }, options)
      ctx.restore()
      outline(ctx, ghost.x, ghost.y, w, h, ghost.ok ? '#3ce08a' : '#ff5f7a')
      ctx.save()
      ctx.globalAlpha = 0.25
      ctx.fillStyle = ghost.ok ? '#3ce08a' : '#ff5f7a'
      const n = toScreen(ghost.x, ghost.y)
      const e = toScreen(ghost.x + w, ghost.y)
      const s = toScreen(ghost.x + w, ghost.y + h)
      const west = toScreen(ghost.x, ghost.y + h)
      ctx.beginPath()
      ctx.moveTo(n.sx, n.sy)
      ctx.lineTo(e.sx, e.sy)
      ctx.lineTo(s.sx, s.sy)
      ctx.lineTo(west.sx, west.sy)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }
  }

  ctx.restore()
}

/**
 * Kamera so setzen, dass die bebaute Fläche schön im Bild liegt.
 * Ohne das steht man beim Start viel zu weit weg.
 */
export function cityFrame(city: CityState, view: { w: number; h: number }): Camera {
  let minX = 0
  let minY = 0
  let maxX = city.land
  let maxY = city.land
  if (city.buildings.length > 0) {
    minX = Math.min(...city.buildings.map((b) => b.x)) - 1
    minY = Math.min(...city.buildings.map((b) => b.y)) - 1
    maxX = Math.max(...city.buildings.map((b) => b.x + 2)) + 1
    maxY = Math.max(...city.buildings.map((b) => b.y + 2)) + 1
  }

  const corners = [toScreen(minX, minY), toScreen(maxX, minY), toScreen(maxX, maxY), toScreen(minX, maxY)]
  const xs = corners.map((c) => c.sx)
  const ys = corners.map((c) => c.sy)
  const left = Math.min(...xs)
  const right = Math.max(...xs)
  const top = Math.min(...ys) - 70
  const bottom = Math.max(...ys) + 20
  // Lieber nah dran als alles im Bild: Häuser sollen als Häuser zu erkennen sein.
  const fit = Math.min(view.w / (right - left + 40), view.h / (bottom - top + 40))
  const zoom = Math.max(1, Math.min(2.4, fit))
  return { x: (left + right) / 2, y: (top + bottom) / 2, zoom }
}

/** Mittelpunkt der Stadt in Weltkoordinaten */
export function cityCenter(city: CityState): { x: number; y: number } {
  const built = city.buildings
  if (built.length === 0) {
    const center = toScreen(city.land / 2, city.land / 2)
    return { x: center.sx, y: center.sy }
  }
  let sx = 0
  let sy = 0
  for (const placed of built) {
    const tiles = tilesOf(placed)
    const point = toScreen(placed.x + tiles.length / 4, placed.y + tiles.length / 4)
    sx += point.sx
    sy += point.sy
  }
  return { x: sx / built.length, y: sy / built.length }
}

export { TILE_H, TILE_W }
