// Straßen, Gehwege und alles, was an ihnen steht. Gezeichnet wird in Durchgängen über
// alle Kacheln – erst alle Gehwege, dann alle Bordsteine, dann alle Fahrbahnen, dann
// die Markierungen. Sonst übermalt der Nachbar die Kante, und ein Strich je Kachel
// würde die Bildrate auffressen.
//
// An Kreuzungen stehen Ampeln, entlang der Straßen Laternen; nachts leuchten beide.
import { ampelPhase, arme, istKreuzung, type AmpelFarbe } from './ampeln'
import { tree } from './buildings'
import { roadDef } from './catalog'
import { fade, lift, quad, quadPath, roundedPath, type Point } from './draw'
import { TILE_H, tileNoise, toScreen } from './iso'
import { gelaendeHoehe } from './landschaft'
import { leuchte, lichtJetzt } from './licht'
import { roadAt } from './state'
import type { Theme } from './themes'
import type { CityState } from './types'

type Kachel = { x: number; y: number; art: string }

const GEHWEG = '#b9b5ab'
const GEHWEG_FUGE = 'rgba(70,70,80,0.16)'
const BORD = '#dcd8ce'

/** Wie hoch eine Brücke über dem Wasser liegt, in Bildpunkten */
export const BRUECKEN_HUB = 48
/** Sichtbare Dicke des Brückendecks */
const DECK_DICKE = 10

/**
 * Volle Breite in Kacheln. Mehrspurige Straßen sind breiter als ein Block,
 * damit je Richtung zwei Wagen nebeneinander Platz haben.
 */
export function fahrbahnBreite(def: { id: string; spuren?: number; bruecke?: boolean } | undefined): number {
  if (!def) return 0.56
  if (def.id === 'autobahn' || def.id === 'autobahnbruecke') return 2.45
  if (def.id === 'bundesstrasse') return 2.15
  if (def.bruecke) return 0.72
  if ((def.spuren ?? 1) >= 2) return 1.55
  if (def.id === 'allee') return 0.74
  if (def.id === 'weg') return 0.34
  if (def.id === 'landstrasse') return 0.5
  return 0.58
}

/** Welcher Anteil der Breite Asphalt ist. Außen liegt der Standstreifen oder der Bordstein. */
function asphaltAnteil(def: { id: string; bruecke?: boolean }): number {
  if (def.id === 'autobahn' || def.id === 'autobahnbruecke') return 0.78
  if (def.bruecke) return 0.9
  return 0.88
}

/**
 * Seitlicher Abstand von der Straßenmitte, rechts der Fahrtrichtung.
 * `streifen` 0 ist die innere Spur, 1 die äußere – nur auf mehrspurigen Straßen.
 */
export function spurVersatz(def: { id: string; spuren?: number; bruecke?: boolean } | undefined, streifen: number): number {
  const halb = fahrbahnBreite(def) / 2
  const asphalt = halb * (def ? asphaltAnteil(def) : 0.88)
  if ((def?.spuren ?? 1) < 2) return Math.min(0.15, asphalt * 0.42)
  return (streifen ? 0.84 : 0.24) * asphalt
}

/** In welcher Richtung die Brücke läuft. Seitlich darf das Deck nicht abfallen. */
function spanAchse(city: CityState, x: number, y: number): 'x' | 'y' {
  const o = !!roadAt(city, x + 1, y)
  const w = !!roadAt(city, x - 1, y)
  const n = !!roadAt(city, x, y - 1)
  const s = !!roadAt(city, x, y + 1)
  if ((o || w) && !(n || s)) return 'x'
  if ((n || s) && !(o || w)) return 'y'
  return o || w ? 'x' : 'y'
}

/** Wie lang die Rampe am Brückenende ist, in Kacheln */
const RAMPE = 0.72

/**
 * Anteil 0 bis 1, wie hoch das Deck hier liegt. In der Mitte voll, am Übergang zur
 * Straße auf 0, damit die Fahrbahn ohne Sprung ankommt. Quer zur Brücke bleibt die Höhe.
 */
function brueckenAnteil(city: CityState, x: number, y: number): number {
  const tx = Math.floor(x)
  const ty = Math.floor(y)
  const art = roadAt(city, tx, ty)
  if (!art || !roadDef(art)?.bruecke) return 0
  const fx = x - tx
  const fy = y - ty
  const achse = spanAchse(city, tx, ty)
  const dirs: [number, number][] = achse === 'x' ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]]
  let anteil = 1
  for (const [nx, ny] of dirs) {
    const nachbar = roadAt(city, tx + nx, ty + ny)
    if (nachbar && roadDef(nachbar)?.bruecke) continue
    const zumRand = nx === 1 ? 1 - fx : nx === -1 ? fx : ny === 1 ? 1 - fy : fy
    anteil = Math.min(anteil, Math.min(1, zumRand / RAMPE))
  }
  return anteil
}

/** Höhe der Fahrbahn: Hang plus Brückendeck */
export function fahrbahnHoehe(city: CityState, x: number, y: number): number {
  return gelaendeHoehe(city, x, y) + brueckenAnteil(city, x, y) * BRUECKEN_HUB
}

/** Punkt auf dem Gelände: Hänge heben ihn an, Brücken liegen über dem Wasser */
function heb(city: CityState, x: number, y: number): Point {
  return lift(toScreen(x, y), fahrbahnHoehe(city, x, y))
}

/** Mitte, Kanten und Ecken einer Kachel, alle auf der Geländehöhe */
export function gelaendeNetz(city: CityState, x: number, y: number) {
  const p = (px: number, py: number) => heb(city, px, py)
  return {
    m: p(x + 0.5, y + 0.5),
    nw: p(x, y),
    n: p(x + 0.5, y),
    no: p(x + 1, y),
    o: p(x + 1, y + 0.5),
    so: p(x + 1, y + 1),
    s: p(x + 0.5, y + 1),
    sw: p(x, y + 1),
    w: p(x, y + 0.5),
  }
}

/** Acht Dreiecke von der Mitte zu den Kanten, damit die Fläche zum Nachbarn hin abfällt */
export function netzPfad(ctx: CanvasRenderingContext2D, n: ReturnType<typeof gelaendeNetz>): void {
  const keile = [
    [n.m, n.nw, n.n],
    [n.m, n.n, n.no],
    [n.m, n.no, n.o],
    [n.m, n.o, n.so],
    [n.m, n.so, n.s],
    [n.m, n.s, n.sw],
    [n.m, n.sw, n.w],
    [n.m, n.w, n.nw],
  ]
  for (const [a, b, c] of keile) {
    ctx.moveTo(a.sx, a.sy)
    ctx.lineTo(b.sx, b.sy)
    ctx.lineTo(c.sx, c.sy)
    ctx.closePath()
  }
}

/** Ein Rechteck auf dem Boden in Kachelkoordinaten */
function bodenQuad(ctx: CanvasRenderingContext2D, city: CityState, x0: number, y0: number, x1: number, y1: number): void {
  quadPath(ctx, heb(city, x0, y0), heb(city, x1, y0), heb(city, x1, y1), heb(city, x0, y1))
}

/**
 * Gehwege: Straßen liegen in einer Kachel voller Pflaster. Die Fahrbahn wird später
 * darübergelegt, der Rest bleibt Gehweg. Fußwege bekommen keinen.
 */
function gehwege(ctx: CanvasRenderingContext2D, city: CityState, kacheln: Kachel[], fein: boolean): void {
  const licht = lichtJetzt()
  const pflaster = kacheln.filter((k) => !roadDef(k.art)?.bruecke)
  const fuellen = (liste: Kachel[], farbe: string) => {
    if (liste.length === 0) return
    ctx.beginPath()
    for (const k of liste) netzPfad(ctx, gelaendeNetz(city, k.x, k.y))
    ctx.fillStyle = farbe
    ctx.fill()
  }
  fuellen(pflaster, GEHWEG)
  // Platten: leicht unterschiedliche Helligkeit je Kachelviertel
  if (fein) {
    ctx.beginPath()
    for (const k of pflaster) {
      for (let i = 0; i < 4; i++) {
        if (tileNoise(k.x * 4 + i, k.y * 9 + i * 3) < 0.55) continue
        const qx = k.x + (i % 2) * 0.5
        const qy = k.y + Math.floor(i / 2) * 0.5
        bodenQuad(ctx, city, qx, qy, qx + 0.5, qy + 0.5)
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.07)'
    ctx.fill()
    // Fugen
    ctx.strokeStyle = GEHWEG_FUGE
    ctx.lineWidth = 0.7
    ctx.beginPath()
    for (const k of pflaster) {
      for (const t of [0.25, 0.5, 0.75]) {
        const a = heb(city, k.x + t, k.y)
        const b = heb(city, k.x + t, k.y + 1)
        ctx.moveTo(a.sx, a.sy)
        ctx.lineTo(b.sx, b.sy)
        const c = heb(city, k.x, k.y + t)
        const d = heb(city, k.x + 1, k.y + t)
        ctx.moveTo(c.sx, c.sy)
        ctx.lineTo(d.sx, d.sy)
      }
    }
    ctx.stroke()
  }
  if (licht.helligkeit < 1) {
    ctx.beginPath()
    for (const k of pflaster) netzPfad(ctx, gelaendeNetz(city, k.x, k.y))
    ctx.fillStyle = `rgba(20,26,50,${(1 - licht.helligkeit) * 0.5})`
    ctx.fill()
  }
}

/** Zebrastreifen, Haltelinien, Gullis, Flicken – die Kleinteile der Fahrbahn */
function fahrbahnDetails(ctx: CanvasRenderingContext2D, city: CityState, kacheln: Kachel[]): void {
  const zebra: [number, number, number, number][] = []
  const halte: [number, number, number, number][] = []
  const deckel: Point[] = []
  const flicken: Point[] = []
  const koerner: Point[] = []
  for (const k of kacheln) {
    const def = roadDef(k.art)
    if (!def) continue
    const halb = fahrbahnBreite(def) / 2
    const a = arme(city, k.x, k.y)
    const kreuz = a.zahl >= 3 && def.marking
    const w = tileNoise(k.x * 3 + 1, k.y * 7 + 2)
    const c = heb(city, k.x + 0.5, k.y + 0.5)
    for (let i = 0; i < 4; i++) {
      koerner.push({ sx: c.sx + (tileNoise(k.x + i * 5, k.y + i * 11) - 0.5) * 30, sy: c.sy + (tileNoise(k.y + i * 7, k.x + i * 13) - 0.5) * 14 })
    }
    if (kreuz) {
      // je Arm ein Zebrastreifen quer zur Fahrbahn und eine Haltelinie auf der rechten Spur
      const streifen = 5
      const arm = (dx: number, dy: number) => {
        // Position des Übergangs: 0.36 von der Mitte weg
        const m = 0.36
        for (let i = 0; i < streifen; i++) {
          const q = -halb + (i + 0.5) * ((2 * halb) / streifen)
          const b = (halb / streifen) * 0.55
          if (dx !== 0) zebra.push([k.x + 0.5 + dx * m - 0.05, k.y + 0.5 + q - b, k.x + 0.5 + dx * m + 0.05, k.y + 0.5 + q + b])
          else zebra.push([k.x + 0.5 + q - b, k.y + 0.5 + dy * m - 0.05, k.x + 0.5 + q + b, k.y + 0.5 + dy * m + 0.05])
        }
        // Haltelinie für die ankommende Spur (rechts in Fahrtrichtung zur Kreuzung)
        const h = 0.46
        if (dx !== 0) {
          const spur = dx > 0 ? [0, halb] : [-halb, 0]
          halte.push([k.x + 0.5 + dx * h - 0.02, k.y + 0.5 + spur[0] + 0.02, k.x + 0.5 + dx * h + 0.02, k.y + 0.5 + spur[1] - 0.02])
        } else {
          const spur = dy > 0 ? [-halb, 0] : [0, halb]
          halte.push([k.x + 0.5 + spur[0] + 0.02, k.y + 0.5 + dy * h - 0.02, k.x + 0.5 + spur[1] - 0.02, k.y + 0.5 + dy * h + 0.02])
        }
      }
      if (a.n) arm(0, -1)
      if (a.s) arm(0, 1)
      if (a.o) arm(1, 0)
      if (a.w) arm(-1, 0)
    } else if (w > 0.84) {
      deckel.push({ sx: c.sx + 8, sy: c.sy + halb * TILE_H * 0.4 })
    } else if (w < 0.12) {
      flicken.push({ sx: c.sx - 6, sy: c.sy - 2 })
    }
  }
  const tupfen = (liste: Point[], rx: number, ry: number, farbe: string) => {
    if (liste.length === 0) return
    ctx.beginPath()
    for (const p of liste) {
      ctx.moveTo(p.sx + rx, p.sy)
      ctx.ellipse(p.sx, p.sy, rx, ry, 0, 0, Math.PI * 2)
    }
    ctx.fillStyle = farbe
    ctx.fill()
  }
  tupfen(koerner, 1.5, 0.8, 'rgba(255,255,255,0.05)')
  tupfen(flicken, 6, 3.2, 'rgba(0,0,0,0.14)')
  if (zebra.length) {
    ctx.beginPath()
    for (const [x0, y0, x1, y1] of zebra) bodenQuad(ctx, city, x0, y0, x1, y1)
    ctx.fillStyle = 'rgba(244,247,255,0.82)'
    ctx.fill()
  }
  if (halte.length) {
    ctx.beginPath()
    for (const [x0, y0, x1, y1] of halte) bodenQuad(ctx, city, x0, y0, x1, y1)
    ctx.fillStyle = 'rgba(244,247,255,0.8)'
    ctx.fill()
  }
  tupfen(deckel, 3.4, 1.9, 'rgba(28,34,50,0.85)')
  if (deckel.length) {
    ctx.strokeStyle = 'rgba(150,160,180,0.45)'
    ctx.lineWidth = 0.7
    ctx.beginPath()
    for (const p of deckel) {
      ctx.moveTo(p.sx + 2.2, p.sy)
      ctx.ellipse(p.sx, p.sy, 2.2, 1.2, 0, 0, Math.PI * 2)
    }
    ctx.stroke()
  }
}

// ---------------------------------------------------------------------------
// Laternen und Ampeln
// ---------------------------------------------------------------------------

const LATERNE_HOCH = 27

/** Eine Straßenlaterne: Mast, Ausleger, Kopf – und nachts der Lichtkegel */
export function laterne(ctx: CanvasRenderingContext2D, p: Point, nachRechts: number, fein: boolean): void {
  const licht = lichtJetzt()
  // Fuß
  ctx.fillStyle = '#4a505c'
  ctx.beginPath()
  ctx.ellipse(p.sx, p.sy, 3, 1.4, 0, 0, Math.PI * 2)
  ctx.fill()
  // Mast
  ctx.strokeStyle = '#5c6472'
  ctx.lineWidth = 1.8
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(p.sx, p.sy)
  ctx.lineTo(p.sx, p.sy - LATERNE_HOCH)
  ctx.quadraticCurveTo(p.sx, p.sy - LATERNE_HOCH - 5, p.sx + nachRechts * 6, p.sy - LATERNE_HOCH - 5)
  ctx.stroke()
  if (fein) {
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 0.6
    ctx.beginPath()
    ctx.moveTo(p.sx - 0.5, p.sy - 2)
    ctx.lineTo(p.sx - 0.5, p.sy - LATERNE_HOCH + 1)
    ctx.stroke()
  }
  // Kopf
  const kopf = { sx: p.sx + nachRechts * 6, sy: p.sy - LATERNE_HOCH - 5 }
  ctx.fillStyle = '#39404c'
  ctx.beginPath()
  ctx.moveTo(kopf.sx - 4.5, kopf.sy)
  ctx.lineTo(kopf.sx + 4.5, kopf.sy)
  ctx.lineTo(kopf.sx + 3, kopf.sy + 2.6)
  ctx.lineTo(kopf.sx - 3, kopf.sy + 2.6)
  ctx.closePath()
  ctx.fill()
  const an = licht.lampen
  ctx.fillStyle = an > 0.2 ? `rgba(255,236,170,${0.5 + an * 0.5})` : '#c9d0dc'
  ctx.fillRect(kopf.sx - 2.6, kopf.sy + 2.2, 5.2, 1.6)
  if (an > 0.05) {
    const staerke = an
    leuchte((c) => {
      // Lichtkegel auf dem Boden und Hof um die Lampe
      const pool = c.createRadialGradient(kopf.sx, p.sy + 1, 1, kopf.sx, p.sy + 1, 26)
      pool.addColorStop(0, `rgba(255,224,150,${0.34 * staerke})`)
      pool.addColorStop(1, 'rgba(255,224,150,0)')
      c.fillStyle = pool
      c.beginPath()
      c.ellipse(kopf.sx, p.sy + 1, 26, 12, 0, 0, Math.PI * 2)
      c.fill()
      const hof = c.createRadialGradient(kopf.sx, kopf.sy + 3, 0.5, kopf.sx, kopf.sy + 3, 10)
      hof.addColorStop(0, `rgba(255,240,190,${0.7 * staerke})`)
      hof.addColorStop(1, 'rgba(255,240,190,0)')
      c.fillStyle = hof
      c.beginPath()
      c.arc(kopf.sx, kopf.sy + 3, 10, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = `rgba(255,246,210,${0.9 * staerke})`
      c.fillRect(kopf.sx - 2.6, kopf.sy + 2.2, 5.2, 1.6)
    })
  }
}

const AMPEL_FARBEN: Record<AmpelFarbe, string> = { rot: '#ff3b3b', gelb: '#ffc21a', gruen: '#3ddc6a' }

/** Eine Ampel am Mast mit drei Lampen; `farbe` leuchtet */
function ampel(ctx: CanvasRenderingContext2D, p: Point, farbe: AmpelFarbe, nachRechts: number, fein: boolean): void {
  const hoch = 20
  ctx.fillStyle = '#4a505c'
  ctx.beginPath()
  ctx.ellipse(p.sx, p.sy, 2.4, 1.2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#5c6472'
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(p.sx, p.sy)
  ctx.lineTo(p.sx, p.sy - hoch)
  ctx.stroke()
  // Gehäuse
  const gx = p.sx + nachRechts * 1.5
  const gy = p.sy - hoch - 11
  ctx.fillStyle = '#1e222b'
  roundedPath(ctx, gx - 3, gy, 6, 12.5, 1.6)
  ctx.fill()
  if (fein) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillRect(gx - 2.4, gy + 0.6, 1, 11)
  }
  const lampen: AmpelFarbe[] = ['rot', 'gelb', 'gruen']
  lampen.forEach((f, i) => {
    const ly = gy + 2.4 + i * 4
    const an = f === farbe
    ctx.fillStyle = an ? AMPEL_FARBEN[f] : fade(AMPEL_FARBEN[f], 0.22)
    ctx.beginPath()
    ctx.arc(gx, ly, 1.4, 0, Math.PI * 2)
    ctx.fill()
    if (an) {
      const glow = AMPEL_FARBEN[f]
      leuchte((c) => {
        const g = c.createRadialGradient(gx, ly, 0.3, gx, ly, 5)
        g.addColorStop(0, fade(glow, 0.7))
        g.addColorStop(1, fade(glow, 0))
        c.fillStyle = g
        c.beginPath()
        c.arc(gx, ly, 5, 0, Math.PI * 2)
        c.fill()
        c.fillStyle = glow
        c.beginPath()
        c.arc(gx, ly, 1.4, 0, Math.PI * 2)
        c.fill()
      })
    }
  })
}

/** Etwas, das an der Straße steht und in die Malreihenfolge der Stadt eingereiht wird */
export interface Moebel {
  x: number
  y: number
  malen: (ctx: CanvasRenderingContext2D) => void
}

/** Ampeln an allen Kreuzungen: je Arm ein Mast rechts vor der Kreuzung, mit der Farbe seiner Richtung */
function ampeln(city: CityState, kacheln: Kachel[], uhr: number, fein: boolean, ziel: Moebel[]): void {
  for (const k of kacheln) {
    if (!istKreuzung(city, k.x, k.y)) continue
    const a = arme(city, k.x, k.y)
    const phase = ampelPhase(k.x, k.y, uhr)
    const def = roadDef(k.art)
    const halb = fahrbahnBreite(def) / 2 + 0.06
    // Mast steht rechts der ankommenden Spur, kurz vor der Kreuzung
    const platz = (px: number, py: number, farbe: AmpelFarbe) => {
      const x = k.x + px
      const y = k.y + py
      const p = heb(city, x, y)
      const mitte = heb(city, k.x + 0.5, k.y + 0.5)
      const rechts = p.sx >= mitte.sx ? -1 : 1
      ziel.push({ x, y, malen: (ctx) => ampel(ctx, p, farbe, rechts, fein) })
    }
    if (a.w) platz(0.5 - halb - 0.06, 0.5 + halb, phase.ow) // kommt von Westen, fährt +x, rechts = +y
    if (a.o) platz(0.5 + halb + 0.06, 0.5 - halb, phase.ow) // kommt von Osten, fährt -x, rechts = -y
    if (a.n) platz(0.5 - halb, 0.5 - halb - 0.06, phase.ns) // kommt von Norden, fährt +y, rechts = -x
    if (a.s) platz(0.5 + halb, 0.5 + halb + 0.06, phase.ns) // kommt von Süden, fährt -y, rechts = +x
  }
}

/**
 * Laternen entlang gerader Straßenstücke, abwechselnd links und rechts, alle zwei
 * Kacheln. An Kreuzungen stehen Ampeln, dort bleibt die Laterne weg.
 */
function laternen(city: CityState, kacheln: Kachel[], fein: boolean, ziel: Moebel[]): void {
  for (const k of kacheln) {
    if (roadDef(k.art)?.bruecke) continue
    if ((k.x + k.y) % 2 !== 0) continue
    const a = arme(city, k.x, k.y)
    if (a.zahl >= 3) continue
    const def = roadDef(k.art)
    const halb = fahrbahnBreite(def) / 2 + 0.12
    const waagrecht = a.o || a.w
    const senkrecht = a.n || a.s
    let px: number
    let py: number
    if (waagrecht && !senkrecht) {
      px = 0.5
      py = (k.x % 4 === 0 ? 0.5 - halb : 0.5 + halb)
    } else if (senkrecht && !waagrecht) {
      px = (k.y % 4 === 0 ? 0.5 - halb : 0.5 + halb)
      py = 0.5
    } else {
      // Kurve: Laterne an der Außenecke
      px = a.o ? 0.5 - halb : 0.5 + halb
      py = a.s ? 0.5 - halb : 0.5 + halb
    }
    // Nicht auf einen Nachbarn mit Straße stellen
    const nx = Math.floor(k.x + (px - 0.5) * 1.6 + 0.5)
    const ny = Math.floor(k.y + (py - 0.5) * 1.6 + 0.5)
    if ((nx !== k.x || ny !== k.y) && roadAt(city, nx, ny)) continue
    const x = k.x + px
    const y = k.y + py
    const p = heb(city, x, y)
    const mitte = heb(city, k.x + 0.5, k.y + 0.5)
    const rechts = p.sx >= mitte.sx ? -1 : 1
    ziel.push({ x, y, malen: (ctx) => laterne(ctx, p, rechts, fein) })
  }
}

// ---------------------------------------------------------------------------
// Fahrbahn als Band, Brücke als Deck
// ---------------------------------------------------------------------------

type Stueck = { x0: number; y0: number; x1: number; y1: number; art: string; gerade: boolean }

/** Punkt neben der Mittellinie, aber auf der Höhe der Mittellinie. Das Deck kippt nicht zur Seite. */
function stelle(city: CityState, x: number, y: number, hx: number, hy: number): Point {
  return lift(toScreen(x, y), fahrbahnHoehe(city, hx, hy))
}

function band(city: CityState, x0: number, y0: number, x1: number, y1: number, halb: number): [Point, Point, Point, Point] {
  const dx = x1 - x0
  const dy = y1 - y0
  const l = Math.hypot(dx, dy) || 1
  const nx = (-dy / l) * halb
  const ny = (dx / l) * halb
  return [
    stelle(city, x0 + nx, y0 + ny, x0, y0),
    stelle(city, x1 + nx, y1 + ny, x1, y1),
    stelle(city, x1 - nx, y1 - ny, x1, y1),
    stelle(city, x0 - nx, y0 - ny, x0, y0),
  ]
}

function scheibe(city: CityState, x: number, y: number, halb: number): Point[] {
  const h = fahrbahnHoehe(city, x, y)
  const punkte: Point[] = []
  for (let i = 0; i < 12; i++) {
    const w = (i / 12) * Math.PI * 2
    punkte.push(lift(toScreen(x + Math.cos(w) * halb, y + Math.sin(w) * halb), h))
  }
  return punkte
}

function flaeche(ctx: CanvasRenderingContext2D, punkte: Point[], farbe: string): void {
  if (punkte.length < 3) return
  ctx.beginPath()
  ctx.moveTo(punkte[0].sx, punkte[0].sy)
  for (let i = 1; i < punkte.length; i++) ctx.lineTo(punkte[i].sx, punkte[i].sy)
  ctx.closePath()
  ctx.fillStyle = farbe
  ctx.fill()
}

function senken(p: Point, px: number): Point {
  return { sx: p.sx, sy: p.sy + px }
}

/** Pfeiler mit Sockel, Schaft und Auflager. Das Wasser bleibt darunter frei. */
function pfeiler(ctx: CanvasRenderingContext2D, city: CityState, kacheln: Kachel[]): void {
  const bruecken = kacheln.filter((k) => roadDef(k.art)?.bruecke)
  if (bruecken.length === 0) return
  for (const k of bruecken) {
    const def = roadDef(k.art)
    if (!def) continue
    const halb = fahrbahnBreite(def) / 2
    const cx = k.x + 0.5
    const cy = k.y + 0.5
    if (fahrbahnHoehe(city, cx, cy) - gelaendeHoehe(city, cx, cy) < BRUECKEN_HUB * 0.55) continue
    const o = !!roadAt(city, k.x + 1, k.y)
    const w = !!roadAt(city, k.x - 1, k.y)
    const laengs = o || w
    const ox = laengs ? 0 : 1
    const oy = laengs ? 1 : 0
    const abstand = Math.max(0.16, halb * 0.55)
    const koepfe: Point[] = []
    for (const seite of [-1, 1]) {
      const px = cx + ox * abstand * seite
      const py = cy + oy * abstand * seite
      const fuss = toScreen(px, py)
      const kopf = heb(city, px, py)
      const unten = 7.2
      const oben = 4.4
      ctx.beginPath()
      ctx.moveTo(fuss.sx - unten, fuss.sy)
      ctx.lineTo(kopf.sx - oben, kopf.sy + 3)
      ctx.lineTo(kopf.sx + oben, kopf.sy + 3)
      ctx.lineTo(fuss.sx + unten, fuss.sy)
      ctx.closePath()
      ctx.fillStyle = '#6a635c'
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(fuss.sx - unten * 0.2, fuss.sy - 0.4)
      ctx.lineTo(kopf.sx - oben * 0.15, kopf.sy + 3)
      ctx.lineTo(kopf.sx + oben * 0.35, kopf.sy + 3)
      ctx.lineTo(fuss.sx + unten * 0.28, fuss.sy - 0.4)
      ctx.closePath()
      ctx.fillStyle = '#918980'
      ctx.fill()
      ctx.fillStyle = '#3f3b36'
      ctx.beginPath()
      ctx.ellipse(fuss.sx, fuss.sy + 1.6, unten + 2.2, 2.6, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#514c46'
      ctx.beginPath()
      ctx.ellipse(kopf.sx, kopf.sy + 3.2, oben + 3.4, 2.3, 0, 0, Math.PI * 2)
      ctx.fill()
      koepfe.push(kopf)
    }
    if (koepfe.length === 2) {
      ctx.strokeStyle = '#3e3a36'
      ctx.lineWidth = 6
      ctx.lineCap = 'butt'
      ctx.beginPath()
      ctx.moveTo(koepfe[0].sx, koepfe[0].sy + 4)
      ctx.lineTo(koepfe[1].sx, koepfe[1].sy + 4)
      ctx.stroke()
    }
  }
}

/** Brüstung und Geländer entlang einer Deck-Kante */
function bruestung(ctx: CanvasRenderingContext2D, city: CityState, stueck: Stueck, halb: number): void {
  const dx = stueck.x1 - stueck.x0
  const dy = stueck.y1 - stueck.y0
  const l = Math.hypot(dx, dy) || 1
  const nx = -dy / l
  const ny = dx / l
  const aussen = halb + 0.02
  const innen = Math.max(0.04, halb - 0.05)
  const hoch = 7
  const flach = Math.abs(fahrbahnHoehe(city, stueck.x0, stueck.y0) - fahrbahnHoehe(city, stueck.x1, stueck.y1)) < 14
  for (const seite of [-1, 1]) {
    const a = stelle(city, stueck.x0 + nx * aussen * seite, stueck.y0 + ny * aussen * seite, stueck.x0, stueck.y0)
    const b = stelle(city, stueck.x1 + nx * aussen * seite, stueck.y1 + ny * aussen * seite, stueck.x1, stueck.y1)
    const c = stelle(city, stueck.x1 + nx * innen * seite, stueck.y1 + ny * innen * seite, stueck.x1, stueck.y1)
    const d = stelle(city, stueck.x0 + nx * innen * seite, stueck.y0 + ny * innen * seite, stueck.x0, stueck.y0)
    if (flach) {
      quad(ctx, a, b, lift(b, hoch * 0.55), lift(a, hoch * 0.55), seite > 0 ? '#b7b0a4' : '#9c958a')
      quad(ctx, lift(a, hoch * 0.55), lift(b, hoch * 0.55), lift(c, hoch), lift(d, hoch), '#f7f4ee')
    }
  }
  const schritte = Math.max(1, Math.round(l / 0.28))
  ctx.strokeStyle = '#4a453f'
  ctx.lineWidth = 2.4
  ctx.lineCap = 'butt'
  ctx.beginPath()
  for (const seite of [-1, 1]) {
    for (let i = 0; i < schritte; i++) {
      const t = (i + 0.5) / schritte
      const p = stelle(city, stueck.x0 + dx * t + nx * aussen * seite, stueck.y0 + dy * t + ny * aussen * seite, stueck.x0 + dx * t, stueck.y0 + dy * t)
      ctx.moveTo(p.sx, p.sy - hoch * 0.2)
      ctx.lineTo(p.sx, p.sy - hoch - 4)
    }
  }
  ctx.stroke()
  ctx.strokeStyle = '#fffdf8'
  ctx.lineWidth = 1.8
  ctx.beginPath()
  for (const seite of [-1, 1]) {
    const a = stelle(city, stueck.x0 + nx * aussen * seite, stueck.y0 + ny * aussen * seite, stueck.x0, stueck.y0)
    const b = stelle(city, stueck.x1 + nx * aussen * seite, stueck.y1 + ny * aussen * seite, stueck.x1, stueck.y1)
    ctx.moveTo(a.sx, a.sy - hoch - 4)
    ctx.lineTo(b.sx, b.sy - hoch - 4)
  }
  ctx.stroke()
}

function stueckeVon(city: CityState, kacheln: Kachel[]): Stueck[] {
  const liste: Stueck[] = []
  for (const k of kacheln) {
    const armeHier: [number, number][] = []
    if (roadAt(city, k.x, k.y - 1)) armeHier.push([0, -1])
    if (roadAt(city, k.x + 1, k.y)) armeHier.push([1, 0])
    if (roadAt(city, k.x, k.y + 1)) armeHier.push([0, 1])
    if (roadAt(city, k.x - 1, k.y)) armeHier.push([-1, 0])
    const gerade =
      armeHier.length === 2 &&
      ((armeHier[0][0] !== 0 && armeHier[1][0] !== 0) || (armeHier[0][1] !== 0 && armeHier[1][1] !== 0))
    const ziele = armeHier.length > 0 ? armeHier : ([[1, 0], [-1, 0]] as [number, number][])
    for (const [dx, dy] of ziele) {
      liste.push({
        x0: k.x + 0.5,
        y0: k.y + 0.5,
        x1: k.x + 0.5 + dx * 0.5,
        y1: k.y + 0.5 + dy * 0.5,
        art: k.art,
        gerade,
      })
    }
  }
  return liste
}

function geradeKachel(city: CityState, k: Kachel): boolean {
  const n = !!roadAt(city, k.x, k.y - 1)
  const s = !!roadAt(city, k.x, k.y + 1)
  const o = !!roadAt(city, k.x + 1, k.y)
  const w = !!roadAt(city, k.x - 1, k.y)
  const zahl = Number(n) + Number(s) + Number(o) + Number(w)
  return zahl === 2 && ((n && s) || (o && w))
}

function baender(ctx: CanvasRenderingContext2D, city: CityState, stuecke: Stueck[], kacheln: Kachel[], halbVon: (art: string) => number, farbeVon: (art: string) => string): void {
  const nachBreite = (a: string, b: string) => halbVon(a) - halbVon(b)
  for (const s of [...stuecke].sort((a, b) => nachBreite(a.art, b.art))) {
    const punkte = band(city, s.x0, s.y0, s.x1, s.y1, halbVon(s.art))
    flaeche(ctx, punkte, farbeVon(s.art))
  }
  // Kappen nur in Kurven und Kreuzungen. Auf gerader Strecke macht die Scheibe am Brückenende einen Knick.
  for (const k of [...kacheln].sort((a, b) => nachBreite(a.art, b.art))) {
    if (geradeKachel(city, k)) continue
    flaeche(ctx, scheibe(city, k.x + 0.5, k.y + 0.5, halbVon(k.art)), farbeVon(k.art))
  }
}

/** Straßen und Gehwege – ohne Masten, die kommen mit `strassenMoebel` nach dem Boden */
export function drawRoads(ctx: CanvasRenderingContext2D, city: CityState, theme: Theme, fein: boolean): void {
  const kacheln: Kachel[] = Object.entries(city.roads).map(([key, art]) => {
    const [x, y] = key.split(':').map(Number)
    return { x, y, art }
  })
  if (kacheln.length === 0) return
  const licht = lichtJetzt()
  const stuecke = stueckeVon(city, kacheln)
  const bruecke = (art: string) => !!roadDef(art)?.bruecke
  const halb = (art: string) => fahrbahnBreite(roadDef(art)) / 2
  const asphalt = (art: string) => {
    const def = roadDef(art)
    return halb(art) * (def ? asphaltAnteil(def) : 0.88)
  }

  // Pfeiler zuerst. Das Deck liegt darüber, das Wasser bleibt frei.
  pfeiler(ctx, city, kacheln)
  gehwege(
    ctx,
    city,
    kacheln.filter((k) => {
      const def = roadDef(k.art)
      return !!def && k.art !== 'weg' && !def.bruecke && (def.spuren ?? 1) < 2
    }),
    fein,
  )

  const land = stuecke.filter((s) => !bruecke(s.art))
  const landKacheln = kacheln.filter((k) => !bruecke(k.art))
  const deck = stuecke.filter((s) => bruecke(s.art))
  const deckKacheln = kacheln.filter((k) => bruecke(k.art))

  // Standstreifen und Bordstein
  baender(ctx, city, land, landKacheln, halb, (art) => {
    const def = roadDef(art)
    if (!def) return BORD
    if (def.id === 'autobahn') return def.edge
    if ((def.spuren ?? 1) >= 2 || art === 'weg') return def.edge
    return BORD
  })
  // Fahrbahn
  baender(ctx, city, land, landKacheln, asphalt, (art) => roadDef(art)?.surface ?? '#474c59')

  // Brückendeck: zuerst die Stirn, dann die Fahrbahn. Keine volle Kachel, das Wasser bleibt sichtbar.
  for (const s of deck) {
    const oben = band(city, s.x0, s.y0, s.x1, s.y1, halb(s.art))
    const [a, b, c, d] = oben
    const flach = Math.abs(fahrbahnHoehe(city, s.x0, s.y0) - fahrbahnHoehe(city, s.x1, s.y1)) < 14
    if (!flach) continue
    quad(ctx, a, b, senken(b, DECK_DICKE), senken(a, DECK_DICKE), '#c9c2b4')
    quad(ctx, d, c, senken(c, DECK_DICKE), senken(d, DECK_DICKE), '#8f887e')
  }
  for (const k of deckKacheln) {
    if (geradeKachel(city, k)) continue
    const rand = scheibe(city, k.x + 0.5, k.y + 0.5, halb(k.art)).map((p) => senken(p, DECK_DICKE))
    flaeche(ctx, rand, '#6a645c')
  }
  baender(ctx, city, deck, deckKacheln, halb, () => '#d9d3c8')
  baender(ctx, city, deck, deckKacheln, asphalt, (art) => roadDef(art)?.surface ?? '#4a4f59')

  // Spurmarkierung
  ctx.save()
  ctx.lineCap = 'butt'
  for (const s of stuecke) {
    const def = roadDef(s.art)
    if (!def?.marking || !s.gerade) continue
    const innen = asphalt(s.art)
    const mehr = (def.spuren ?? 1) >= 2
    const strich = (versatz: number, dash: number[] | null, breite: number) => {
      const dx = s.x1 - s.x0
      const dy = s.y1 - s.y0
      const l = Math.hypot(dx, dy) || 1
      const nx = (-dy / l) * versatz
      const ny = (dx / l) * versatz
      const a = stelle(city, s.x0 + nx, s.y0 + ny, s.x0, s.y0)
      const b = stelle(city, s.x1 + nx, s.y1 + ny, s.x1, s.y1)
      ctx.strokeStyle = def.marking as string
      ctx.lineWidth = breite
      ctx.setLineDash(dash ?? [])
      ctx.beginPath()
      ctx.moveTo(a.sx, a.sy)
      ctx.lineTo(b.sx, b.sy)
      ctx.stroke()
    }
    if (mehr) {
      strich(innen * 0.08, null, 1.3)
      strich(-innen * 0.08, null, 1.3)
      strich(innen * 0.52, [7, 8], 1.15)
      strich(-innen * 0.52, [7, 8], 1.15)
    } else {
      strich(0, [6, 8], 1.15)
    }
  }
  ctx.restore()

  for (const s of deck) bruestung(ctx, city, s, halb(s.art))

  if (fein) fahrbahnDetails(ctx, city, kacheln.filter((k) => !roadDef(k.art)?.bruecke && (roadDef(k.art)?.spuren ?? 1) < 2))

  if (licht.helligkeit < 1) {
    const dunkel = `rgba(16,20,40,${(1 - licht.helligkeit) * 0.45})`
    baender(ctx, city, stuecke, kacheln, asphalt, () => dunkel)
  }


  // Alleen bekommen Bäume auf den Schultern
  for (const k of kacheln) {
    const def = roadDef(k.art)
    if (!def?.trees) continue
    const frei = [
      { da: roadAt(city, k.x, k.y - 1), at: [k.x + 0.5, k.y + 0.12] },
      { da: roadAt(city, k.x, k.y + 1), at: [k.x + 0.5, k.y + 0.88] },
    ]
    for (const seite of frei) {
      if (seite.da) continue
      tree(ctx, seite.at[0] - 0.5, seite.at[1] - 0.5, { kind: 'baum', height: 0.5, wall: theme.tree[0], roof: theme.tree[2], accent: theme.tree[1] }, 0.25, fein)
    }
  }
}

/**
 * Laternen und Ampeln mit ihrem Standort – der Zeichner reiht sie nach Tiefe zwischen
 * die Häuser ein, damit ein Mast vor einem Haus auch davor bleibt.
 */
export function strassenMoebel(city: CityState, uhr: number, fein: boolean): Moebel[] {
  const kacheln: Kachel[] = []
  for (const [key, art] of Object.entries(city.roads)) {
    if (art === 'weg') continue
    const [x, y] = key.split(':').map(Number)
    kacheln.push({ x, y, art })
  }
  const liste: Moebel[] = []
  if (kacheln.length === 0) return liste
  laternen(city, kacheln, fein, liste)
  ampeln(city, kacheln, uhr, fein, liste)
  return liste
}

/** Höhe einer Laterne – für Trefferflächen und Reihenfolge */
export const LATERNE_HOEHE = LATERNE_HOCH + 8
export { lift }
