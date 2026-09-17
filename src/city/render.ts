// Zeichnet die Stadt als kleines Diorama: schräge Sicht, Schatten, Fassaden mit Fenstern,
// Dächer, Bäume. Alles in ein Canvas, damit auch große Städte flüssig bleiben.
import { buildingDef, footprint, roadDef } from './catalog'
import { bauHoehe, drawBuilding, tree } from './buildings'
import { lift, quad, quadPath, roundedPath, type Point } from './draw'
import { drawIdler, drawWalker, walkerAt } from './figures'
import { TILE_H, TILE_W, tileNoise, toScreen, toTile } from './iso'
import type { Idler, Life, Walker } from './life'
import { nextExpansion, roadAt, tilesOf } from './state'
import { themeById, type Theme } from './themes'
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

export interface Paint {
  /** Kacheln als "x:y" */
  tiles: string[]
  type: string
  /** true beim Pflastern, false beim Aufnehmen */
  adding: boolean
}

export interface DrawOptions {
  ghost?: Ghost | null
  paint?: Paint | null
  selected?: string | null
  buildMode?: boolean
  /** Leben in der Stadt */
  life?: Life | null
  /** Sprechblase über einem Bauwerk */
  bubble?: { buildingId: string; emoji: string } | null
  /** Sekunden, für ruhige Animationen */
  time?: number
  /** Kleinteile zeichnen? false, wenn das Gerät sonst ins Stocken gerät */
  detail?: boolean
}

/**
 * Straßen. Gezeichnet wird in drei Durchgängen über alle Kacheln: erst die Kanten,
 * dann die Fahrbahn, dann die Markierung. Sonst übermalt der Nachbar die Kante.
 */
function drawRoads(ctx: CanvasRenderingContext2D, city: CityState, theme: Theme, fein: boolean): void {
  const entries = Object.entries(city.roads)
  if (entries.length === 0) return

  const enden = (x: number, y: number) => {
    const list: { sx: number; sy: number }[] = []
    if (roadAt(city, x, y - 1)) list.push(toScreen(x + 0.5, y))
    if (roadAt(city, x + 1, y)) list.push(toScreen(x + 1, y + 0.5))
    if (roadAt(city, x, y + 1)) list.push(toScreen(x + 0.5, y + 1))
    if (roadAt(city, x - 1, y)) list.push(toScreen(x, y + 0.5))
    return list
  }

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Je Durchgang und Straßenart ein einziger Pfad: erst alle Kanten, dann alle
  // Fahrbahnen, dann alle Markierungen. Sonst übermalt der Nachbar die Kante –
  // und ein Strich je Kachel würde die Bildrate auffressen.
  const arten = [...new Set(entries.map(([, type]) => type))]
  for (const pass of [0, 1, 2]) {
    for (const art of arten) {
      const def = roadDef(art)
      if (!def) continue
      if (pass === 2 && !def.marking) continue

      ctx.strokeStyle = pass === 0 ? def.edge : pass === 1 ? def.surface : (def.marking as string)
      ctx.lineWidth = def.width * TILE_H * (pass === 0 ? 1.45 : pass === 1 ? 1 : 0.14)
      ctx.setLineDash(pass === 2 ? [7, 7] : [])
      ctx.beginPath()

      for (const [key, type] of entries) {
        if (type !== art) continue
        const [x, y] = key.split(':').map(Number)
        const center = toScreen(x + 0.5, y + 0.5)
        const ziele = enden(x, y)

        if (ziele.length === 0) {
          // einzelne Kachel: kleiner Fleck
          ctx.moveTo(center.sx - 7, center.sy)
          ctx.lineTo(center.sx + 7, center.sy)
          continue
        }
        // Bei Markierungen nur die durchgehende Richtung streifen
        const striche = pass === 2 && ziele.length !== 2 ? [] : ziele
        for (const ziel of striche) {
          ctx.moveTo(center.sx, center.sy)
          ctx.lineTo(ziel.sx, ziel.sy)
        }
      }
      ctx.stroke()
    }
  }
  ctx.setLineDash([])
  ctx.restore()

  // Was die Straße lebendig macht: Körnung im Asphalt, Gullideckel, geflickte
  // Stellen und Zebrastreifen dort, wo sich Wege kreuzen.
  if (fein) {
    ctx.save()
    const koerner: [number, number][] = []
    const zebra: [number, number][] = []
    const deckel: [number, number][] = []
    const flicken: [number, number][] = []
    for (const [key, type] of entries) {
      const def = roadDef(type)
      if (!def) continue
      const [x, y] = key.split(':').map(Number)
      const center = toScreen(x + 0.5, y + 0.5)
      const wuerfel = tileNoise(x * 3 + 1, y * 7 + 2)
      const halb = def.width * TILE_H * 0.45

      // Körnung – alle Flecken dieser Kachel wandern in den gemeinsamen Pfad
      for (let i = 0; i < 5; i++) {
        const a = tileNoise(x + i * 5, y + i * 11)
        const b = tileNoise(y + i * 7, x + i * 13)
        koerner.push([center.sx + (a - 0.5) * 34, center.sy + (b - 0.5) * 17])
      }

      const nachbarn = enden(x, y).length
      if (nachbarn >= 3 && def.marking) {
        for (let i = -2; i <= 2; i++) {
          const auf = toScreen(x + 0.5 + i * 0.13, y + 0.5 + i * 0.13)
          zebra.push([auf.sx, auf.sy])
        }
      } else if (wuerfel > 0.82) {
        deckel.push([center.sx + 9, center.sy + halb * 0.5])
      } else if (wuerfel < 0.14) {
        flicken.push([center.sx - 7, center.sy - 2])
      }
    }

    const tupfen = (liste: [number, number][], rx: number, ry: number, farbe: string) => {
      if (liste.length === 0) return
      ctx.beginPath()
      for (const [px, py] of liste) {
        ctx.moveTo(px + rx, py)
        ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2)
      }
      ctx.fillStyle = farbe
      ctx.fill()
    }
    tupfen(koerner, 1.6, 0.9, 'rgba(255,255,255,0.05)')
    tupfen(flicken, 6, 3.2, 'rgba(0,0,0,0.13)')
    tupfen(zebra, 2.2, 1.1, 'rgba(244,247,255,0.8)')
    tupfen(deckel, 3.4, 1.9, 'rgba(28,34,50,0.85)')
    if (deckel.length > 0) {
      ctx.strokeStyle = 'rgba(150,160,180,0.45)'
      ctx.lineWidth = 0.7
      ctx.beginPath()
      for (const [px, py] of deckel) {
        ctx.moveTo(px + 2.2, py)
        ctx.ellipse(px, py, 2.2, 1.2, 0, 0, Math.PI * 2)
      }
      ctx.stroke()
    }
    ctx.restore()
  }

  // Alleen bekommen Bäume auf den Schultern
  for (const [key, type] of entries) {
    const def = roadDef(type)
    if (!def?.trees) continue
    const [x, y] = key.split(':').map(Number)
    const frei = [
      { da: roadAt(city, x, y - 1), at: [x + 0.5, y + 0.12] },
      { da: roadAt(city, x, y + 1), at: [x + 0.5, y + 0.88] },
    ]
    for (const seite of frei) {
      if (seite.da) continue
      tree(
        ctx,
        seite.at[0] - 0.5,
        seite.at[1] - 0.5,
        { kind: 'baum', height: 0.5, wall: theme.tree[0], roof: theme.tree[2], accent: theme.tree[1] },
        0.25,
        fein,
      )
    }
  }
}

/** Wo eine Figur gerade steht, in Kachelkoordinaten */
function drawBubble(ctx: CanvasRenderingContext2D, placed: Placed, emoji: string, t: number): void {
  const def = buildingDef(placed.type)
  if (!def) return
  const [w, h] = footprint(def, placed.rot)
  const top = toScreen(placed.x + w / 2, placed.y + h / 2)
  const hover = Math.sin(t * 2.4) * 3
  const y = top.sy - TILE_H * (def.look.height + 1.6) - hover
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  roundedPath(ctx, top.sx - 17, y - 17, 34, 30, 12)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(top.sx - 6, y + 12)
  ctx.lineTo(top.sx + 4, y + 12)
  ctx.lineTo(top.sx - 1, y + 21)
  ctx.closePath()
  ctx.fill()
  ctx.font = '18px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, top.sx, y - 2)
  ctx.restore()
}

/** Boden, Gitter und Rand des freigeschalteten Gebiets */
function drawGround(ctx: CanvasRenderingContext2D, city: CityState, buildMode: boolean, theme: Theme): void {
  const size = city.land
  const n = toScreen(0, 0)
  const e = toScreen(size, 0)
  const s = toScreen(size, size)
  const w = toScreen(0, size)

  // Erdschicht als Dicke unter der Wiese
  const depth = 26
  quad(ctx, e, s, lift(s, -depth), lift(e, -depth), theme.soil[0])
  quad(ctx, s, w, lift(w, -depth), lift(s, -depth), theme.soil[1])

  const grass = ctx.createLinearGradient(n.sx, n.sy, s.sx, s.sy)
  grass.addColorStop(0, theme.ground[0])
  grass.addColorStop(1, theme.ground[1])
  quad(ctx, n, e, s, w, grass)

  // Kachelrauschen – die Wiese soll nicht wie Farbe aus der Dose aussehen.
  // Die Kacheln werden in drei Helligkeiten sortiert und je Gruppe einmal gefüllt.
  const gruppen: Point[][][] = [[], [], []]
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const seed = tileNoise(x, y)
      if (seed < 0.55) continue
      const stufe = Math.min(2, Math.floor((seed - 0.55) / 0.15))
      gruppen[stufe].push([toScreen(x, y), toScreen(x + 1, y), toScreen(x + 1, y + 1), toScreen(x, y + 1)])
    }
  }
  gruppen.forEach((kacheln, stufe) => {
    if (kacheln.length === 0) return
    ctx.beginPath()
    for (const [a, b, c, d] of kacheln) quadPath(ctx, a, b, c, d)
    ctx.fillStyle = `rgba(255,255,255,${0.02 + stufe * 0.022})`
    ctx.fill()
  })

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

  ctx.strokeStyle = theme.edge
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(n.sx, n.sy)
  ctx.lineTo(e.sx, e.sy)
  ctx.lineTo(s.sx, s.sy)
  ctx.lineTo(w.sx, w.sy)
  ctx.closePath()
  ctx.stroke()

  // Was noch kommt: der Umriss des nächsten Gebiets, damit man sieht, dass es weitergeht
  const step = nextExpansion(city)
  if (step) {
    const shift = Math.floor((step.land - size) / 2)
    const a = toScreen(-shift, -shift)
    const b = toScreen(size + shift, -shift)
    const c = toScreen(size + shift, size + shift)
    const d = toScreen(-shift, size + shift)
    ctx.save()
    ctx.setLineDash([10, 10])
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(a.sx, a.sy)
    ctx.lineTo(b.sx, b.sy)
    ctx.lineTo(c.sx, c.sy)
    ctx.lineTo(d.sx, d.sy)
    ctx.closePath()
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }
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
  const theme = themeById(city.theme)
  const sky = ctx.createLinearGradient(0, 0, 0, view.h)
  sky.addColorStop(0, theme.sky[0])
  sky.addColorStop(1, theme.sky[1])
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, view.w, view.h)

  ctx.save()
  ctx.translate(view.w / 2, view.h / 2)
  ctx.scale(camera.zoom, camera.zoom)
  ctx.translate(-camera.x, -camera.y)
  // Kleinteile nur zeichnen, wenn man sie auch sehen kann – und nur, solange das
  // Gerät mitkommt. Die Bildrate zählt mehr als eine Fensterbank.
  const fein = camera.zoom >= 0.7 && options.detail !== false

  drawGround(ctx, city, options.buildMode === true, theme)
  drawRoads(ctx, city, theme, fein)

  // Vorschau beim Straßenziehen
  const paint = options.paint
  if (paint && paint.tiles.length > 0) {
    const def = roadDef(paint.type)
    ctx.save()
    ctx.globalAlpha = 0.6
    ctx.fillStyle = paint.adding ? (def?.surface ?? '#ffffff') : '#ff5f7a'
    for (const key of paint.tiles) {
      const [x, y] = key.split(':').map(Number)
      const a = toScreen(x, y)
      const b = toScreen(x + 1, y)
      const c = toScreen(x + 1, y + 1)
      const d = toScreen(x, y + 1)
      ctx.beginPath()
      ctx.moveTo(a.sx, a.sy)
      ctx.lineTo(b.sx, b.sy)
      ctx.lineTo(c.sx, c.sy)
      ctx.lineTo(d.sx, d.sy)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }

  // Maler-Reihenfolge: was weiter hinten liegt, kommt zuerst.
  // Menschen werden nach derselben Tiefe zwischen die Bauwerke gemischt.
  const zeit = options.time ?? 0
  const menschen: { depth: number; walker?: Walker; idler?: Idler }[] = []
  if (options.life) {
    for (const walker of options.life.walkers) {
      const at = walkerAt(walker)
      menschen.push({ depth: at.x + at.y, walker })
    }
    for (const idler of options.life.idlers) menschen.push({ depth: idler.x + idler.y, idler })
    menschen.sort((a, b) => a.depth - b.depth)
  }

  let naechster = 0
  const bisTiefe = (tiefe: number) => {
    while (naechster < menschen.length && menschen[naechster].depth <= tiefe) {
      const person = menschen[naechster++]
      if (person.walker) drawWalker(ctx, person.walker, zeit)
      else if (person.idler) drawIdler(ctx, person.idler, zeit)
    }
  }

  const sorted = [...city.buildings].sort((a, b) => a.x + a.y - (b.x + b.y))
  for (const placed of sorted) {
    bisTiefe(placed.x + placed.y)
    drawBuilding(ctx, placed, zeit, theme, fein)
    if (placed.id === options.selected) {
      const def = buildingDef(placed.type)
      if (def) {
        const [w, h] = footprint(def, placed.rot)
        outline(ctx, placed.x, placed.y, w, h, '#ffd23f')
      }
    }
  }
  bisTiefe(Number.MAX_SAFE_INTEGER)

  if (options.bubble) {
    const haus = city.buildings.find((placed) => placed.id === options.bubble?.buildingId)
    if (haus) drawBubble(ctx, haus, options.bubble.emoji, zeit)
  }

  const ghost = options.ghost
  if (ghost) {
    const def = buildingDef(ghost.type)
    if (def) {
      const [w, h] = footprint(def, ghost.rot)
      ctx.save()
      ctx.globalAlpha = 0.55
      drawBuilding(
        ctx,
        { id: 'ghost', type: ghost.type, x: ghost.x, y: ghost.y, rot: ghost.rot, level: 1, at: 0 },
        zeit,
        theme,
        fein,
      )
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

/**
 * Welches Bauwerk liegt unter diesem Punkt?
 *
 * In der Schrägsicht steht ein Haus über seiner Bodenkachel: Wer auf die Wand tippt,
 * trifft am Boden die Kachel dahinter. Deshalb wird die sichtbare Höhe mitgeprüft –
 * der Punkt wird schrittweise nach unten verschoben, bis er auf der Grundfläche landet.
 * Geprüft wird von vorn nach hinten, damit das nähere Bauwerk gewinnt.
 */
export function hitTest(city: CityState, wx: number, wy: number): Placed | null {
  const vonVorn = [...city.buildings].sort((a, b) => b.x + b.y - (a.x + a.y))
  for (const placed of vonVorn) {
    const def = buildingDef(placed.type)
    if (!def) continue
    const [w, h] = footprint(def, placed.rot)
    // Dach und Krone ragen über die Wandhöhe hinaus – aber nur so viel, wie die Bauform hergibt.
    // Ein flacher Platz darf keine Tipper abfangen, die weit über ihm liegen.
    const dach = def.look.kind === 'haus' ? 0.62 : def.look.kind === 'baum' ? 0.4 : 0.15
    const hoehe = bauHoehe(def.look, placed.level) + TILE_H * dach
    for (let schritt = 0; schritt <= 6; schritt++) {
      const tile = toTile(wx, wy + (hoehe * schritt) / 6)
      const tx = Math.floor(tile.x)
      const ty = Math.floor(tile.y)
      if (tx >= placed.x && tx < placed.x + w && ty >= placed.y && ty < placed.y + h) return placed
    }
  }
  return null
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
