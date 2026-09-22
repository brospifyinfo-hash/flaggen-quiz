// Zeichnet die Stadt als kleines Diorama: schräge Sicht, Schatten, Fassaden mit Fenstern,
// Dächer, Bäume. Alles in ein Canvas, damit auch große Städte flüssig bleiben.
import { koerperVon } from './bau'
import { bauHoehe, drawBuilding, einzug, tree, umrissPunkte } from './buildings'
import { RATHAUS, buildingDef, footprint, roadDef } from './catalog'
import { fade, lift, quad, quadPath, roundedPath, type Point } from './draw'
import { drawAgent } from './figures'
import type { Grund } from './geo'
import { nachRechts, setBlick, TILE_H, TILE_W, tiefe, tiefenRichtung, tileNoise, toScreen, zeigtNachVorn, type Blick } from './iso'
import { brennt, type Agent, type Life } from './life'
import { kriminalitaetsfeld } from './society'
import { nextExpansion, roadAt, seiteZurStrasse, tilesOf } from './state'
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
  /** Aus welcher Richtung man auf die Stadt schaut, als Winkel */
  blick?: Blick
  /** Kriminalität je Kachel als rote Tönung zeigen */
  kriminalitaet?: boolean
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

/** Ein stilles Zeichen über einem Bauwerk – ohne Sprechblase, halb durchsichtig */
function drawMarke(ctx: CanvasRenderingContext2D, placed: Placed, emoji: string, alpha: number): void {
  const def = buildingDef(placed.type)
  if (!def) return
  const [w, h] = footprint(def, placed.rot)
  const top = toScreen(placed.x + w / 2, placed.y + h / 2)
  const y = top.sy - bauHoehe(def.look, placed.level) - 14
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.font = '16px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, top.sx, y)
  ctx.restore()
}

/**
 * Wie weit vorn ein Bauwerk steht: gemessen an seiner vordersten Kachel, nicht an
 * der Ecke, an der es verankert ist. Welche Kachel vorn liegt, hängt vom Blick ab.
 */
export function vorderTiefe(placed: Placed): number {
  const def = buildingDef(placed.type)
  if (!def) return tiefe(placed.x + 0.5, placed.y + 0.5)
  const [bw, bh] = footprint(def, placed.rot)
  let vorn = -Infinity
  for (let dx = 0; dx < bw; dx++) {
    for (let dy = 0; dy < bh; dy++) vorn = Math.max(vorn, tiefe(placed.x + dx + 0.5, placed.y + dy + 0.5))
  }
  return vorn
}

/** Formen ohne Baukörper: Figuren stehen auf ihnen, nie dahinter */
const FLACHE_FORMEN = new Set(['park', 'wasser', 'flach', 'brunnen', 'bank', 'blumen', 'hecke', 'felsen', 'laterne', 'fahne'])

type Reihenfolge = { flach: boolean; lot: Grund; hmin: number; hmax: number; ecken: { h: number; g: number }[] }

/** Der Baukörper eines Gebäudes, in Blickrichtung ausgemessen */
function koerperFuerReihenfolge(
  city: CityState,
  placed: Placed,
  g: { x: number; y: number },
  quer: { x: number; y: number },
): Reihenfolge | null {
  const def = buildingDef(placed.type)
  if (!def) return null
  const [w, h] = footprint(def, placed.rot)
  const lot: Grund = { x: placed.x, y: placed.y, w, h }
  const look = def.look
  if (FLACHE_FORMEN.has(look.kind)) return { flach: true, lot, hmin: 0, hmax: 0, ecken: [] }
  let k: Grund
  if (look.kind === 'baum') k = { x: placed.x + 0.25, y: placed.y + 0.25, w: 0.5, h: 0.5 }
  else if (look.kind === 'bau' && look.stil) k = koerperVon(lot, look.stil, seiteZurStrasse(city, placed), placed.level, einzug(look, placed.level))
  else {
    const e = einzug(look, placed.level)
    k = { x: lot.x + e, y: lot.y + e, w: lot.w - 2 * e, h: lot.h - 2 * e }
  }
  const ecken = [
    { x: k.x, y: k.y },
    { x: k.x + k.w, y: k.y },
    { x: k.x + k.w, y: k.y + k.h },
    { x: k.x, y: k.y + k.h },
  ].map((p) => ({ h: p.x * quer.x + p.y * quer.y, g: p.x * g.x + p.y * g.y }))
  const hs = ecken.map((e) => e.h)
  return { flach: false, lot, hmin: Math.min(...hs), hmax: Math.max(...hs), ecken }
}

/** Wo schneidet eine Linie quer zur Blickrichtung den Baukörper? Vorderste und hinterste Tiefe dort. */
function sehne(ecken: { h: number; g: number }[], hp: number): [number, number] {
  let gmin = Infinity
  let gmax = -Infinity
  for (let i = 0; i < ecken.length; i++) {
    const a = ecken[i]
    const b = ecken[(i + 1) % ecken.length]
    if ((a.h - hp) * (b.h - hp) > 0) continue
    const t = Math.abs(b.h - a.h) < 1e-9 ? 0 : (hp - a.h) / (b.h - a.h)
    const gs = Math.abs(b.h - a.h) < 1e-9 ? [a.g, b.g] : [a.g + (b.g - a.g) * t]
    for (const wert of gs) {
      gmin = Math.min(gmin, wert)
      gmax = Math.max(gmax, wert)
    }
  }
  if (gmin === Infinity) return [0, 0]
  return [gmin, gmax]
}

/** Flammen und Rauch über einem brennenden Gebäude */
function flammen(ctx: CanvasRenderingContext2D, placed: Placed, t: number): void {
  const def = buildingDef(placed.type)
  if (!def) return
  const [w, h] = footprint(def, placed.rot)
  const mitte = toScreen(placed.x + w / 2, placed.y + h / 2)
  const hoch = bauHoehe(def.look, placed.level) * 0.95
  const fuss = { sx: mitte.sx, sy: mitte.sy - hoch }
  // Rauch
  for (let i = 0; i < 5; i++) {
    const phase = (t * 0.45 + i / 5) % 1
    ctx.globalAlpha = (1 - phase) * 0.5
    ctx.fillStyle = '#3a3a40'
    ctx.beginPath()
    ctx.arc(fuss.sx + Math.sin(phase * 4 + i) * 7, fuss.sy - 12 - phase * 38, 5 + phase * 9, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  // Flammenzungen
  for (let i = 0; i < 6; i++) {
    const x = fuss.sx + (i - 2.5) * 5
    const flacker = Math.sin(t * 14 + i * 1.7) * 3
    const hoehe = 12 + ((i * 37) % 7) + flacker
    ctx.fillStyle = i % 2 ? '#ffb020' : '#ff5a1f'
    ctx.beginPath()
    ctx.moveTo(x - 4, fuss.sy + 2)
    ctx.quadraticCurveTo(x - 3, fuss.sy - hoehe * 0.5, x + Math.sin(t * 9 + i) * 2, fuss.sy - hoehe)
    ctx.quadraticCurveTo(x + 3, fuss.sy - hoehe * 0.5, x + 4, fuss.sy + 2)
    ctx.closePath()
    ctx.fill()
  }
  ctx.fillStyle = fade('#ff8a3a', 0.18)
  ctx.beginPath()
  ctx.ellipse(fuss.sx, fuss.sy - 4, 26, 16, 0, 0, Math.PI * 2)
  ctx.fill()
}

/** Kriminalität als rote Tönung über dem Boden – dunkler, wo es gefährlicher ist */
/** Kriminalität als Farbe: grün sicher, gelb unruhig, rot gefährlich */
export function krimFarbe(wert: number, alpha: number): string {
  const t = Math.max(0, Math.min(1, wert / 60))
  const von = t < 0.5 ? [60, 200, 110] : [255, 200, 40]
  const bis = t < 0.5 ? [255, 200, 40] : [235, 40, 60]
  const u = t < 0.5 ? t * 2 : (t - 0.5) * 2
  const k = von.map((v, i) => Math.round(v + (bis[i] - v) * u))
  return `rgba(${k[0]},${k[1]},${k[2]},${alpha})`
}

/** Der Boden, eingefärbt nach Kriminalität – in sechs Stufen, damit es nur sechs Pfade sind */
function kriminalitaetZeigen(ctx: CanvasRenderingContext2D, city: CityState): void {
  const feld = kriminalitaetsfeld(city)
  const n = city.land
  const STUFEN = 6
  const stufen: Point[][][] = Array.from({ length: STUFEN }, () => [])
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const stufe = Math.min(STUFEN - 1, Math.floor(feld[y * n + x] / 10))
      stufen[stufe].push([toScreen(x, y), toScreen(x + 1, y), toScreen(x + 1, y + 1), toScreen(x, y + 1)])
    }
  }
  stufen.forEach((kacheln, stufe) => {
    if (!kacheln.length) return
    ctx.beginPath()
    for (const [a, b, c, d] of kacheln) quadPath(ctx, a, b, c, d)
    ctx.fillStyle = krimFarbe(stufe * 10 + 5, 0.5)
    ctx.fill()
  })
}

/**
 * In dichten Vierteln verdecken die Häuser den Boden – darum schwebt über jedem Bauwerk
 * ein Punkt in der Farbe seines Viertels. Dunkle Geschäfte tragen einen schwarzen Kern.
 */
function kriminalitaetMarken(ctx: CanvasRenderingContext2D, city: CityState): void {
  const feld = kriminalitaetsfeld(city)
  const n = city.land
  for (const placed of city.buildings) {
    const def = buildingDef(placed.type)
    if (!def || def.category === 'natur' || def.category === 'schmuck' || def.category === 'wege') continue
    const [w, h] = footprint(def, placed.rot)
    const tx = Math.max(0, Math.min(n - 1, Math.floor(placed.x + w / 2)))
    const ty = Math.max(0, Math.min(n - 1, Math.floor(placed.y + h / 2)))
    const wert = feld[ty * n + tx]
    let oben = Infinity
    let links = Infinity
    let rechts = -Infinity
    for (const p of umrissPunkte(placed, seiteZurStrasse(city, placed))) {
      if (p.sy < oben) oben = p.sy
      if (p.sx < links) links = p.sx
      if (p.sx > rechts) rechts = p.sx
    }
    if (!Number.isFinite(oben)) continue
    const x = (links + rechts) / 2
    const y = oben - 10
    ctx.beginPath()
    ctx.moveTo(x, y + 12)
    ctx.lineTo(x - 4, y + 4)
    ctx.lineTo(x + 4, y + 4)
    ctx.closePath()
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x, y, 7, 0, Math.PI * 2)
    ctx.fillStyle = krimFarbe(wert, 1)
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'
    ctx.stroke()
    if (def.category === 'unterwelt') {
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#16121c'
      ctx.fill()
    }
  }
}

/** Boden, Gitter und Rand des freigeschalteten Gebiets */
function drawGround(ctx: CanvasRenderingContext2D, city: CityState, buildMode: boolean, theme: Theme): void {
  const size = city.land
  const p0 = toScreen(0, 0)
  const p1 = toScreen(size, 0)
  const p2 = toScreen(size, size)
  const p3 = toScreen(0, size)

  // Erdschicht als Dicke unter der Wiese – an den Rändern, die zum Betrachter zeigen.
  // Welche das sind, hängt vom Blickwinkel ab; die nach rechts gewandten sind heller.
  const depth = 26
  const raender: [Point, Point, number, number][] = [
    [p0, p1, 0, -1],
    [p1, p2, 1, 0],
    [p2, p3, 0, 1],
    [p3, p0, -1, 0],
  ]
  for (const [a, b, nx, ny] of raender) {
    if (!zeigtNachVorn(nx, ny)) continue
    quad(ctx, a, b, lift(b, -depth), lift(a, -depth), nachRechts(nx, ny) >= 0 ? theme.soil[0] : theme.soil[1])
  }

  // Wiese mit Verlauf von oben nach unten im Bild
  const oben = Math.min(p0.sy, p1.sy, p2.sy, p3.sy)
  const unten = Math.max(p0.sy, p1.sy, p2.sy, p3.sy)
  const grass = ctx.createLinearGradient(0, oben, 0, unten)
  grass.addColorStop(0, theme.ground[0])
  grass.addColorStop(1, theme.ground[1])
  quad(ctx, p0, p1, p2, p3, grass)
  const n = p0
  const e = p1
  const s = p2
  const w = p3

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
  // Zuerst den Blick setzen – alles Weitere rechnet schon aus dieser Richtung
  setBlick(options.blick ?? 0, city.land)
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

  if (options.kriminalitaet) kriminalitaetZeigen(ctx, city)

  // Gebäude von hinten nach vorn
  const sorted = [...city.buildings].sort((a, b) => vorderTiefe(a) - vorderTiefe(b))

  // Jede Figur kommt direkt nach dem letzten Gebäude, vor dem sie steht. Gemessen wird
  // in Blickrichtung und nur dort, wo Figur und Baukörper seitlich überlappen – ein Haus
  // verdeckt nur, was wirklich hinter ihm ist.
  const g = tiefenRichtung()
  const quer = { x: -g.y, y: g.x }
  const koerper = sorted.map((placed) => koerperFuerReihenfolge(city, placed, g, quer))
  const faecher: Agent[][] = sorted.map(() => [])
  const danach: Agent[] = []
  if (options.life) {
    for (const agent of options.life.agents) {
      if (agent.zustand === 'drinnen') continue
      const hp = agent.x * quer.x + agent.y * quer.y
      const gp = agent.x * g.x + agent.y * g.y
      let platz = -1
      for (let i = 0; i < koerper.length; i++) {
        const k = koerper[i]
        if (!k) continue
        if (k.flach) {
          // Auf Flachem – Park, Platz, Bank – steht man immer obendrauf
          if (agent.x >= k.lot.x - 0.05 && agent.x <= k.lot.x + k.lot.w + 0.05 && agent.y >= k.lot.y - 0.05 && agent.y <= k.lot.y + k.lot.h + 0.05) platz = i
          continue
        }
        const breite = agent.art === 'auto' || agent.art === 'dienst' ? 0.34 : 0.14
        if (hp < k.hmin - breite || hp > k.hmax + breite) continue
        const [gmin, gmax] = sehne(k.ecken, Math.max(k.hmin, Math.min(k.hmax, hp)))
        if (gp >= gmax - 0.02) platz = i
        else if (gp <= gmin) continue
        else platz = i
      }
      ;(platz + 1 < faecher.length ? faecher[platz + 1] : danach).push(agent)
    }
  }
  const nachTiefe = (a: Agent, b: Agent) => a.x * g.x + a.y * g.y - (b.x * g.x + b.y * g.y)
  const figuren = (liste: Agent[]) => {
    liste.sort(nachTiefe)
    for (const agent of liste) drawAgent(ctx, agent, zeit, fein)
  }

  for (let i = 0; i < sorted.length; i++) {
    const placed = sorted[i]
    figuren(faecher[i])
    drawBuilding(ctx, placed, zeit, theme, fein, seiteZurStrasse(city, placed))
    if (brennt(options.life, placed.id)) flammen(ctx, placed, zeit)
    if (placed.id === options.selected) {
      const def = buildingDef(placed.type)
      if (def) {
        const [w, h] = footprint(def, placed.rot)
        outline(ctx, placed.x, placed.y, w, h, '#ffd23f')
      }
    }
  }
  figuren(danach)

  if (options.kriminalitaet) kriminalitaetMarken(ctx, city)

  // Das Rathaus ist immer markiert: goldener Rahmen am Boden und ein schwebendes Zeichen
  // darüber – so findet man den Stadtbericht auch in einer großen Stadt sofort
  const rathaus = city.buildings.find((placed) => placed.type === RATHAUS)
  if (rathaus) {
    const [w, h] = footprint(buildingDef(RATHAUS)!, rathaus.rot)
    ctx.save()
    ctx.globalAlpha = 0.55 + 0.35 * Math.sin(zeit * 2.2)
    outline(ctx, rathaus.x, rathaus.y, w, h, '#ffd23f')
    ctx.restore()
    drawBubble(ctx, rathaus, '🏛️', zeit)
  }

  // Wer sich beschwert, sagt es über dem Dach – und eine Ruine trägt ihr Zeichen
  for (const placed of sorted) {
    if (placed.verlassen) {
      if (fein) drawMarke(ctx, placed, '🏚️', 0.7)
    } else if (placed.beschwerde) {
      drawBubble(ctx, placed, zeit % 2 < 1 ? '😠' : '💢', zeit)
    }
  }

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

/** Konvexe Hülle einer Punktwolke (Andrews Verfahren) */
function huelle(punkte: Point[]): Point[] {
  const p = [...punkte].sort((a, b) => a.sx - b.sx || a.sy - b.sy)
  if (p.length < 3) return p
  const kreuz = (o: Point, a: Point, b: Point) => (a.sx - o.sx) * (b.sy - o.sy) - (a.sy - o.sy) * (b.sx - o.sx)
  const unten: Point[] = []
  for (const q of p) {
    while (unten.length >= 2 && kreuz(unten[unten.length - 2], unten[unten.length - 1], q) <= 0) unten.pop()
    unten.push(q)
  }
  const oben: Point[] = []
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i]
    while (oben.length >= 2 && kreuz(oben[oben.length - 2], oben[oben.length - 1], q) <= 0) oben.pop()
    oben.push(q)
  }
  return unten.slice(0, -1).concat(oben.slice(0, -1))
}

/** Abstand eines Punkts zur Strecke a–b */
function abstandZurStrecke(p: Point, a: Point, b: Point): number {
  const dx = b.sx - a.sx
  const dy = b.sy - a.sy
  const laenge = dx * dx + dy * dy
  const t = laenge > 0 ? Math.max(0, Math.min(1, ((p.sx - a.sx) * dx + (p.sy - a.sy) * dy) / laenge)) : 0
  return Math.hypot(p.sx - (a.sx + t * dx), p.sy - (a.sy + t * dy))
}

/**
 * Liegt der Punkt im Umriss – oder so knapp daneben, dass ein Finger es gemeint
 * haben muss? Fingerkuppen sind breiter als eine Hauskante.
 */
function imUmriss(umriss: Point[], p: Point, spielraum: number): boolean {
  if (umriss.length < 3) return false
  let plus = false
  let minus = false
  for (let i = 0; i < umriss.length; i++) {
    const a = umriss[i]
    const b = umriss[(i + 1) % umriss.length]
    const k = (b.sx - a.sx) * (p.sy - a.sy) - (b.sy - a.sy) * (p.sx - a.sx)
    if (k > 0) plus = true
    if (k < 0) minus = true
  }
  if (!(plus && minus)) return true
  for (let i = 0; i < umriss.length; i++) {
    if (abstandZurStrecke(p, umriss[i], umriss[(i + 1) % umriss.length]) <= spielraum) return true
  }
  return false
}

/**
 * Welches Bauwerk liegt unter diesem Punkt?
 *
 * Geprüft wird gegen den sichtbaren Umriss: Grundriss, Wände, First, Turm. Und von
 * vorn nach hinten, damit das nähere Bauwerk gewinnt – aber nur dort, wo es wirklich
 * zu sehen ist. Ein Tipper knapp über seinem Dach gehört dem Haus dahinter.
 */
export function hitTest(city: CityState, wx: number, wy: number): Placed | null {
  const vonVorn = [...city.buildings].sort((a, b) => vorderTiefe(b) - vorderTiefe(a))
  const punkt = { sx: wx, sy: wy }
  // Zuerst ohne Spielraum: wer genau getroffen ist, gewinnt – auch wenn ein Haus
  // davor mit seinem Rand knapp danebenliegt
  for (const placed of vonVorn) {
    if (imUmriss(huelle(umrissPunkte(placed, seiteZurStrasse(city, placed))), punkt, 0)) return placed
  }
  for (const placed of vonVorn) {
    if (imUmriss(huelle(umrissPunkte(placed, seiteZurStrasse(city, placed))), punkt, 5)) return placed
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
