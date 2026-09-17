// Die Bauwerke. Jedes Haus wird aus Kästen, Dächern und Kleinteilen zusammengesetzt:
// Sockel, Fensterrahmen, Fensterbänke, Ziegelreihen, Schornstein, Markise.
//
// Zwei Regeln ziehen sich durch: Erstens wächst ein Haus sichtbar mit seiner Stufe –
// es wird höher, füllt mehr von seinem Grundstück und bekommt Aufbauten dazu.
// Zweitens hängt alles Zufällige am Namen des Hauses, damit es sein Aussehen behält.
import { buildingDef, footprint, type Look } from './catalog'
import { fade, hashOf, lift, mix, quad, quadPath, roundedPath, shade, wobble, type Point } from './draw'
import { TILE_H, TILE_W, tileNoise, toScreen } from './iso'
import type { Theme } from './themes'
import type { Placed } from './types'

/** Höhe des dunkleren Sockels in Bildpunkten */
const SOCKEL = 5

/** Formen ohne Baukörper – sie stehen flach auf der Kachel */
const FLACH = new Set(['baum', 'bank', 'laterne', 'blumen', 'hecke', 'felsen', 'fahne', 'park', 'wasser', 'flach'])

/** Höhe eines Bauwerks in Bildpunkten. Jede Stufe legt spürbar zu. */
export function bauHoehe(look: Look, level: number): number {
  return TILE_H * (look.height + (level - 1) * 0.45)
}

/**
 * Wie weit der Baukörper vom Rand seines Grundstücks einrückt. Auf Stufe 1 steht ein
 * kleines Haus auf dem Platz, auf der höchsten Stufe füllt es ihn fast aus – so sieht
 * man einen Ausbau auch dann, wenn die Höhe allein nicht reichen würde.
 */
export function einzug(look: Look, level: number): number {
  if (FLACH.has(look.kind)) return 0
  return Math.max(0.03, 0.17 - (level - 1) * 0.07)
}

/**
 * Eine Fassade mit Sockel, Fensterreihen und Rahmen.
 *
 * Gezeichnet wird in Sammelpfaden: erst werden alle Rahmen in einen Pfad gelegt und
 * einmal gefüllt, dann alle hellen Scheiben, dann alle dunklen, und so weiter. Ein Haus
 * mit dreißig Fenstern kostet so acht Füllbefehle statt hundertfünfzig.
 */
function facade(
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  height: number,
  color: string,
  stil: { floors: number; seed: number; front: boolean; fein: boolean; balkon: boolean; licht: string },
): void {
  quad(ctx, a, b, lift(b, height), lift(a, height), color)
  if (height < 6) return

  // Sockel: unten eine dunklere Zone, das gibt dem Haus Gewicht
  const sockel = Math.min(SOCKEL, height * 0.3)
  quad(ctx, a, b, lift(b, sockel), lift(a, sockel), shade(color, -30))

  const breite = Math.hypot(b.sx - a.sx, b.sy - a.sy)
  if (stil.floors <= 0 || height < 14) return

  const cols = Math.max(1, Math.round(breite / 20))
  const rows = Math.min(stil.floors, Math.max(1, Math.floor((height - sockel) / 15)))
  const winH = Math.min(9, ((height - sockel) / rows) * 0.46)

  type Fenster = { p0: Point; p1: Point; r0: Point; r1: Point; an: boolean; base: number }
  const fenster: Fenster[] = []
  for (let row = 0; row < rows; row++) {
    const base = sockel + (height - sockel) * ((row + 0.66) / rows)
    for (let col = 0; col < cols; col++) {
      const t0 = (col + 0.26) / cols
      const t1 = (col + 0.74) / cols
      fenster.push({
        p0: lift(mix(a, b, t0), base),
        p1: lift(mix(a, b, t1), base),
        r0: lift(mix(a, b, t0 - 0.03 / cols), base - 1.6),
        r1: lift(mix(a, b, t1 + 0.03 / cols), base - 1.6),
        an: wobble(stil.seed, row * 7 + col * 3) > 0.55,
        base,
      })
    }
  }

  if (stil.fein) {
    // Geschossbänder
    ctx.strokeStyle = fade('#ffffff', 0.09)
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let row = 1; row < rows; row++) {
      const hoch = sockel + (height - sockel) * ((row + 0.66) / rows) + winH * 1.35
      ctx.moveTo(lift(a, hoch).sx, lift(a, hoch).sy)
      ctx.lineTo(lift(b, hoch).sx, lift(b, hoch).sy)
    }
    ctx.stroke()

    // Alle Rahmen in einem Zug
    ctx.beginPath()
    for (const f of fenster) quadPath(ctx, f.r0, f.r1, lift(f.r1, winH + 3.2), lift(f.r0, winH + 3.2))
    ctx.fillStyle = shade(color, 26)
    ctx.fill()
  }

  // Scheiben: erleuchtete und dunkle getrennt, aber je in einem Pfad
  for (const an of [true, false]) {
    const gruppe = fenster.filter((f) => f.an === an)
    if (gruppe.length === 0) continue
    ctx.beginPath()
    for (const f of gruppe) quadPath(ctx, f.p0, f.p1, lift(f.p1, winH), lift(f.p0, winH))
    ctx.fillStyle = an ? stil.licht : 'rgba(96,132,176,0.62)'
    ctx.fill()
  }

  if (stil.fein) {
    // Spiegelungen
    ctx.beginPath()
    for (const f of fenster) {
      const halb = mix(f.p0, f.p1, 0.5)
      quadPath(ctx, lift(f.p0, winH * 0.52), lift(halb, winH * 0.52), lift(halb, winH), lift(f.p0, winH))
    }
    ctx.fillStyle = fade('#ffffff', 0.19)
    ctx.fill()

    // Fensterkreuze
    ctx.strokeStyle = fade('#1b2132', 0.45)
    ctx.lineWidth = 0.8
    ctx.beginPath()
    for (const f of fenster) {
      const m0 = mix(f.p0, f.p1, 0.5)
      ctx.moveTo(m0.sx, m0.sy)
      ctx.lineTo(m0.sx, m0.sy - winH)
    }
    ctx.stroke()

    // Fensterbänke
    ctx.beginPath()
    for (const f of fenster) quadPath(ctx, lift(f.p0, -1.4), lift(f.p1, -1.4), f.p1, f.p0)
    ctx.fillStyle = shade(color, 34)
    ctx.fill()
  }

  if (stil.balkon && stil.front && rows > 1) {
    const mitBalkon = fenster.filter((f) => f.base < sockel + (height - sockel) * ((rows - 1 + 0.66) / rows) - 0.01)
    if (mitBalkon.length > 0) {
      ctx.beginPath()
      for (const f of mitBalkon) {
        const platte0 = lift(f.p0, -2.4)
        const platte1 = lift(f.p1, -2.4)
        quadPath(ctx, platte0, platte1, lift(platte1, 1.6), lift(platte0, 1.6))
      }
      ctx.fillStyle = shade(color, -12)
      ctx.fill()

      ctx.strokeStyle = fade('#f4f7ff', 0.5)
      ctx.lineWidth = 0.9
      ctx.beginPath()
      for (const f of mitBalkon) {
        const platte0 = lift(f.p0, -2.4)
        const platte1 = lift(f.p1, -2.4)
        ctx.moveTo(platte0.sx, platte0.sy - 1.6)
        ctx.lineTo(platte0.sx, platte0.sy - 6)
        ctx.lineTo(platte1.sx, platte1.sy - 6)
        ctx.lineTo(platte1.sx, platte1.sy - 1.6)
      }
      ctx.stroke()
    }
  }
}

export type TopBox = { n: Point; e: Point; s: Point; w: Point }

/** Baukörper: Deckel plus die beiden Seiten, die man sieht */
function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  heightPx: number,
  look: Look,
  stil: { seed: number; floors: number; fein: boolean; balkon: boolean; licht: string },
): TopBox {
  const n = toScreen(x, y)
  const e = toScreen(x + w, y)
  const s = toScreen(x + w, y + h)
  const west = toScreen(x, y + h)

  facade(ctx, e, s, heightPx, shade(look.wall, -18), { ...stil, front: true })
  facade(ctx, s, west, heightPx, shade(look.wall, -52), { ...stil, front: false, balkon: false })

  // Hauskante zwischen den beiden Seiten – ein heller Strich gibt der Ecke Schärfe
  if (stil.fein && heightPx > 10) {
    ctx.strokeStyle = fade('#ffffff', 0.16)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(s.sx, s.sy)
    ctx.lineTo(s.sx, s.sy - heightPx)
    ctx.stroke()
  }

  quad(ctx, lift(n, heightPx), lift(e, heightPx), lift(s, heightPx), lift(west, heightPx), shade(look.wall, 16))
  return { n: lift(n, heightPx), e: lift(e, heightPx), s: lift(s, heightPx), w: lift(west, heightPx) }
}

/**
 * Ein Kasten, der auf einem Dach steht. Anders als box() beginnt er nicht am Boden –
 * sonst zöge er einen Streifen über die Fassade des Hauses, auf dem er sitzt.
 */
function roofBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  basis: number,
  hoehe: number,
  farbe: string,
): TopBox {
  const n = lift(toScreen(x, y), basis)
  const e = lift(toScreen(x + w, y), basis)
  const s = lift(toScreen(x + w, y + h), basis)
  const west = lift(toScreen(x, y + h), basis)
  quad(ctx, e, s, lift(s, hoehe), lift(e, hoehe), shade(farbe, -16))
  quad(ctx, s, west, lift(west, hoehe), lift(s, hoehe), shade(farbe, -38))
  quad(ctx, lift(n, hoehe), lift(e, hoehe), lift(s, hoehe), lift(west, hoehe), shade(farbe, 16))
  return { n: lift(n, hoehe), e: lift(e, hoehe), s: lift(s, hoehe), w: lift(west, hoehe) }
}

/** Satteldach mit First, Überstand und Ziegelreihen */
function gableRoof(ctx: CanvasRenderingContext2D, top: TopBox, rise: number, color: string, fein: boolean): TopBox {
  const mitte = { sx: (top.n.sx + top.s.sx) / 2, sy: (top.n.sy + top.s.sy) / 2 }
  const weit = (p: Point, f: number): Point => ({
    sx: mitte.sx + (p.sx - mitte.sx) * f,
    sy: mitte.sy + (p.sy - mitte.sy) * f,
  })
  // Überstand: das Dach ragt über die Wand hinaus
  const n = weit(top.n, 1.12)
  const e = weit(top.e, 1.12)
  const s = weit(top.s, 1.12)
  const w = weit(top.w, 1.12)

  const first1 = lift(mix(n, w, 0.5), rise)
  const first2 = lift(mix(e, s, 0.5), rise)

  // Die beiden Schrägen
  quad(ctx, n, e, first2, first1, shade(color, 12))
  quad(ctx, w, s, first2, first1, shade(color, -26))
  // Giebel an den Schmalseiten
  ctx.beginPath()
  ctx.moveTo(n.sx, n.sy)
  ctx.lineTo(w.sx, w.sy)
  ctx.lineTo(first1.sx, first1.sy)
  ctx.closePath()
  ctx.fillStyle = shade(color, -4)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(e.sx, e.sy)
  ctx.lineTo(s.sx, s.sy)
  ctx.lineTo(first2.sx, first2.sy)
  ctx.closePath()
  ctx.fillStyle = shade(color, -16)
  ctx.fill()

  if (fein) {
    // Ziegelreihen auf beiden Schrägen
    ctx.strokeStyle = fade('#10131c', 0.18)
    ctx.lineWidth = 0.9
    for (const [kanteA, kanteB] of [
      [n, e],
      [w, s],
    ] as [Point, Point][]) {
      for (let i = 1; i <= 3; i++) {
        const t = i / 4
        const p0 = mix(kanteA, first1, t)
        const p1 = mix(kanteB, first2, t)
        ctx.beginPath()
        ctx.moveTo(p0.sx, p0.sy)
        ctx.lineTo(p1.sx, p1.sy)
        ctx.stroke()
      }
    }
    // First als heller Grat
    ctx.strokeStyle = fade('#ffffff', 0.3)
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(first1.sx, first1.sy)
    ctx.lineTo(first2.sx, first2.sy)
    ctx.stroke()
  }
  return { n: first1, e: first2, s: first2, w: first1 }
}

/** Schornstein mit Rauch */
function schornstein(ctx: CanvasRenderingContext2D, p: Point, hoehe: number, rauch: boolean, t: number, seed: number): void {
  ctx.fillStyle = '#8d6a55'
  ctx.fillRect(p.sx - 3, p.sy - hoehe, 6, hoehe)
  ctx.fillStyle = '#6b4f3f'
  ctx.fillRect(p.sx - 3, p.sy - hoehe, 6, 2.4)
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.fillRect(p.sx - 3, p.sy - hoehe, 2, hoehe)
  if (!rauch) return
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.55 + i / 3 + wobble(seed, i)) % 1
    const hoch = hoehe + 3 + phase * 17
    ctx.globalAlpha = (1 - phase) * 0.4
    ctx.fillStyle = '#e8eef7'
    ctx.beginPath()
    ctx.arc(p.sx + Math.sin(phase * 5 + i) * 3.5, p.sy - hoch, 2.2 + phase * 3.4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/** Dachgaube – ein kleines Fenster im Dach */
function gaube(ctx: CanvasRenderingContext2D, p: Point, wand: string, licht: string): void {
  ctx.fillStyle = shade(wand, -10)
  ctx.beginPath()
  ctx.moveTo(p.sx - 5, p.sy)
  ctx.lineTo(p.sx + 5, p.sy)
  ctx.lineTo(p.sx + 5, p.sy - 5.5)
  ctx.lineTo(p.sx, p.sy - 9)
  ctx.lineTo(p.sx - 5, p.sy - 5.5)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = licht
  ctx.fillRect(p.sx - 2.6, p.sy - 5, 5.2, 4)
}

export function tree(ctx: CanvasRenderingContext2D, x: number, y: number, look: Look, seed: number, fein: boolean): void {
  const center = toScreen(x + 0.5, y + 0.5)
  const scale = 0.8 + seed * 0.45
  const trunkH = 14 * scale
  // Stamm mit leichter Rundung
  ctx.fillStyle = look.wall
  ctx.fillRect(center.sx - 2.5, center.sy - trunkH, 5, trunkH)
  ctx.fillStyle = shade(look.wall, 22)
  ctx.fillRect(center.sx - 2.5, center.sy - trunkH, 1.8, trunkH)
  if (fein) {
    // Wurzelansatz
    ctx.fillStyle = fade('#1a2233', 0.25)
    ctx.beginPath()
    ctx.ellipse(center.sx, center.sy, 6 * scale, 2.6 * scale, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  const crown = 13 * scale
  // Krone aus mehreren Ballen, damit sie nicht wie ein Lutscher aussieht
  ctx.fillStyle = look.accent
  ctx.beginPath()
  ctx.ellipse(center.sx, center.sy - trunkH - crown * 0.35, crown, crown * 0.85, 0, 0, Math.PI * 2)
  ctx.fill()
  if (fein) {
    ctx.fillStyle = shade(look.accent, -18)
    ctx.beginPath()
    ctx.ellipse(center.sx + crown * 0.42, center.sy - trunkH - crown * 0.12, crown * 0.5, crown * 0.45, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = look.roof
  ctx.beginPath()
  ctx.ellipse(center.sx - crown * 0.22, center.sy - trunkH - crown * 0.62, crown * 0.78, crown * 0.7, 0, 0, Math.PI * 2)
  ctx.fill()
  if (fein) {
    ctx.fillStyle = fade('#ffffff', 0.25)
    ctx.beginPath()
    ctx.ellipse(center.sx - crown * 0.38, center.sy - trunkH - crown * 0.82, crown * 0.34, crown * 0.28, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

function fountain(ctx: CanvasRenderingContext2D, x: number, y: number, look: Look, time: number): void {
  const center = toScreen(x + 0.5, y + 0.5)
  ctx.fillStyle = shade(look.wall, -30)
  ctx.beginPath()
  ctx.ellipse(center.sx, center.sy - 3, TILE_W * 0.34, TILE_H * 0.34, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = shade(look.wall, 10)
  ctx.beginPath()
  ctx.ellipse(center.sx, center.sy - 5, TILE_W * 0.3, TILE_H * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = look.roof
  ctx.beginPath()
  ctx.ellipse(center.sx, center.sy - 6, TILE_W * 0.24, TILE_H * 0.24, 0, 0, Math.PI * 2)
  ctx.fill()
  // Wasserringe
  ctx.strokeStyle = fade('#ffffff', 0.35)
  ctx.lineWidth = 1
  for (let i = 0; i < 2; i++) {
    const phase = (time * 0.8 + i / 2) % 1
    ctx.globalAlpha = 1 - phase
    ctx.beginPath()
    ctx.ellipse(center.sx, center.sy - 6, TILE_W * 0.08 + phase * TILE_W * 0.16, TILE_H * 0.08 + phase * TILE_H * 0.16, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  const jet = 8 + Math.sin(time * 3) * 2
  ctx.strokeStyle = look.accent
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(center.sx, center.sy - 6)
  ctx.lineTo(center.sx, center.sy - 6 - jet)
  ctx.stroke()
  // Tropfen, die zur Seite fallen
  for (let i = 0; i < 4; i++) {
    const phase = (time * 1.4 + i / 4) % 1
    const weite = phase * 9
    ctx.fillStyle = fade('#bfe6ff', 0.8 * (1 - phase))
    ctx.beginPath()
    ctx.arc(
      center.sx + (i % 2 === 0 ? weite : -weite),
      center.sy - 6 - jet + phase * jet * 0.9,
      1.4,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
}

function park(ctx: CanvasRenderingContext2D, placed: Placed, w: number, h: number, look: Look, fein: boolean): void {
  const top = box(ctx, placed.x, placed.y, w, h, TILE_H * look.height, look, {
    seed: hashOf(placed.id),
    floors: 0,
    fein,
    balkon: false,
    licht: 'rgba(255,224,150,0.9)',
  })
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(top.n.sx, top.n.sy)
  ctx.lineTo(top.e.sx, top.e.sy)
  ctx.lineTo(top.s.sx, top.s.sy)
  ctx.lineTo(top.w.sx, top.w.sy)
  ctx.closePath()
  ctx.clip()
  // Weg quer durch den Park, mit hellem Kies
  ctx.strokeStyle = 'rgba(232,222,196,0.85)'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(top.w.sx, top.w.sy)
  ctx.lineTo(top.e.sx, top.e.sy)
  ctx.stroke()
  if (fein) {
    ctx.strokeStyle = 'rgba(160,150,124,0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(top.w.sx, top.w.sy - 3.5)
    ctx.lineTo(top.e.sx, top.e.sy - 3.5)
    ctx.moveTo(top.w.sx, top.w.sy + 3.5)
    ctx.lineTo(top.e.sx, top.e.sy + 3.5)
    ctx.stroke()
    // Blumentupfer im Gras
    for (let i = 0; i < w * h * 3; i++) {
      const seed = tileNoise(placed.x * 3 + i, placed.y * 5 + i * 2)
      const seed2 = tileNoise(placed.y * 7 + i, placed.x * 11 + i * 3)
      const p = toScreen(placed.x + seed * w, placed.y + seed2 * h)
      ctx.fillStyle = ['#ffd23f', '#ff7ab5', '#ffffff'][i % 3]
      ctx.beginPath()
      ctx.arc(p.sx, p.sy - TILE_H * look.height, 1.1, 0, Math.PI * 2)
      ctx.fill()
    }
  }
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
      fein,
    )
  }
}

/** Kleiner Schmuck: Bank, Laterne, Blumen, Hecke, Felsen, Fahne */
function trinket(ctx: CanvasRenderingContext2D, placed: Placed, look: Look, t: number, fein: boolean): void {
  const p = toScreen(placed.x + 0.5, placed.y + 0.5)

  if (look.kind === 'bank') {
    // Beine
    ctx.fillStyle = shade(look.accent, -30)
    ctx.fillRect(p.sx - 9, p.sy - 6, 2, 6)
    ctx.fillRect(p.sx + 7, p.sy - 6, 2, 6)
    // Sitzfläche und Lehne aus einzelnen Latten
    ctx.fillStyle = look.wall
    ctx.fillRect(p.sx - 10, p.sy - 6, 20, 3)
    ctx.fillRect(p.sx - 10, p.sy - 12, 20, 3)
    if (fein) {
      ctx.strokeStyle = fade('#1a2233', 0.35)
      ctx.lineWidth = 0.7
      ctx.beginPath()
      ctx.moveTo(p.sx - 10, p.sy - 4.6)
      ctx.lineTo(p.sx + 10, p.sy - 4.6)
      ctx.moveTo(p.sx - 10, p.sy - 10.6)
      ctx.lineTo(p.sx + 10, p.sy - 10.6)
      ctx.stroke()
    }
    return
  }
  if (look.kind === 'laterne') {
    ctx.fillStyle = look.wall
    ctx.fillRect(p.sx - 1.5, p.sy - 26, 3, 26)
    if (fein) {
      ctx.fillStyle = shade(look.wall, 30)
      ctx.fillRect(p.sx - 1.5, p.sy - 26, 1, 26)
      ctx.beginPath()
      ctx.ellipse(p.sx, p.sy, 4, 1.8, 0, 0, Math.PI * 2)
      ctx.fillStyle = shade(look.wall, -20)
      ctx.fill()
    }
    ctx.save()
    ctx.globalAlpha = 0.22 + Math.sin(t * 1.8) * 0.06
    ctx.fillStyle = look.accent
    ctx.beginPath()
    ctx.arc(p.sx, p.sy - 28, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    // Laternenkopf
    ctx.fillStyle = shade(look.wall, -20)
    ctx.beginPath()
    ctx.moveTo(p.sx - 5, p.sy - 26)
    ctx.lineTo(p.sx + 5, p.sy - 26)
    ctx.lineTo(p.sx + 3.4, p.sy - 32)
    ctx.lineTo(p.sx - 3.4, p.sy - 32)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = look.roof
    ctx.beginPath()
    ctx.arc(p.sx, p.sy - 28.5, 3.4, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  if (look.kind === 'blumen') {
    ctx.fillStyle = shade(look.wall, -24)
    ctx.beginPath()
    ctx.ellipse(p.sx, p.sy - 1, 14, 8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = look.wall
    ctx.beginPath()
    ctx.ellipse(p.sx, p.sy - 3, 14, 8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#3f7a46'
    ctx.beginPath()
    ctx.ellipse(p.sx, p.sy - 4, 11, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    for (let i = 0; i < 7; i++) {
      const winkel = (i / 7) * Math.PI * 2
      const bx = p.sx + Math.cos(winkel) * 7
      const by = p.sy - 5 + Math.sin(winkel) * 4
      if (fein) {
        ctx.strokeStyle = '#2f6b38'
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.moveTo(bx, by + 2.5)
        ctx.lineTo(bx, by)
        ctx.stroke()
      }
      ctx.fillStyle = i % 2 === 0 ? look.roof : look.accent
      ctx.beginPath()
      ctx.arc(bx, by, 2.2, 0, Math.PI * 2)
      ctx.fill()
      if (fein) {
        ctx.fillStyle = '#ffe9a8'
        ctx.beginPath()
        ctx.arc(bx, by, 0.8, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    return
  }
  if (look.kind === 'hecke') {
    ctx.fillStyle = shade(look.accent, -22)
    roundedPath(ctx, p.sx - 15, p.sy - 12, 30, 12, 5)
    ctx.fill()
    ctx.fillStyle = look.roof
    roundedPath(ctx, p.sx - 15, p.sy - 15, 30, 8, 5)
    ctx.fill()
    if (fein) {
      // Blattstruktur
      ctx.fillStyle = fade('#ffffff', 0.18)
      for (let i = 0; i < 7; i++) {
        ctx.beginPath()
        ctx.arc(p.sx - 12 + i * 4, p.sy - 13 + (i % 2) * 2, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    return
  }
  if (look.kind === 'felsen') {
    ctx.fillStyle = shade(look.accent, -26)
    ctx.beginPath()
    ctx.ellipse(p.sx - 4, p.sy - 3, 9, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = look.accent
    ctx.beginPath()
    ctx.ellipse(p.sx - 4, p.sy - 5, 8.4, 5.4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = look.roof
    ctx.beginPath()
    ctx.ellipse(p.sx + 4, p.sy - 7, 7, 5, 0, 0, Math.PI * 2)
    ctx.fill()
    if (fein) {
      ctx.fillStyle = fade('#ffffff', 0.3)
      ctx.beginPath()
      ctx.ellipse(p.sx + 2.6, p.sy - 9, 3, 1.8, -0.4, 0, Math.PI * 2)
      ctx.fill()
      // Moos am Fuß
      ctx.fillStyle = 'rgba(110,180,120,0.5)'
      ctx.beginPath()
      ctx.ellipse(p.sx - 7, p.sy - 1.5, 4, 1.8, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    return
  }
  // Fahnenmast
  ctx.fillStyle = look.wall
  ctx.fillRect(p.sx - 1.5, p.sy - 34, 3, 34)
  if (fein) {
    ctx.fillStyle = shade(look.wall, 30)
    ctx.fillRect(p.sx - 1.5, p.sy - 34, 1, 34)
    ctx.fillStyle = shade(look.wall, -24)
    ctx.beginPath()
    ctx.ellipse(p.sx, p.sy, 5, 2.2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f3f6ff'
    ctx.beginPath()
    ctx.arc(p.sx, p.sy - 35.4, 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
  // Fahne mit Wellen
  const weht = Math.sin(t * 3) * 3
  ctx.fillStyle = look.roof
  ctx.beginPath()
  ctx.moveTo(p.sx + 1, p.sy - 34)
  ctx.quadraticCurveTo(p.sx + 9, p.sy - 33 + weht, p.sx + 18, p.sy - 30 + weht)
  ctx.lineTo(p.sx + 18, p.sy - 26 + weht)
  ctx.quadraticCurveTo(p.sx + 9, p.sy - 26 - weht, p.sx + 1, p.sy - 24)
  ctx.closePath()
  ctx.fill()
  if (fein) {
    ctx.fillStyle = fade('#ffffff', 0.25)
    ctx.beginPath()
    ctx.moveTo(p.sx + 1, p.sy - 34)
    ctx.quadraticCurveTo(p.sx + 9, p.sy - 33 + weht, p.sx + 18, p.sy - 30 + weht)
    ctx.lineTo(p.sx + 18, p.sy - 28.5 + weht)
    ctx.quadraticCurveTo(p.sx + 9, p.sy - 31 + weht, p.sx + 1, p.sy - 32)
    ctx.closePath()
    ctx.fill()
  }
}

/** Tür mit Rahmen, Stufe, Klinke und kleinem Vordach */
function tuer(ctx: CanvasRenderingContext2D, unten: Point, oben: Point, hoehe: number, look: Look, fein: boolean): void {
  const a = { sx: unten.sx, sy: unten.sy }
  const b = { sx: oben.sx, sy: oben.sy }
  if (fein) {
    // Rahmen
    quad(ctx, mix(a, b, -0.12), mix(a, b, 1.12), lift(mix(a, b, 1.12), hoehe + 2), lift(mix(a, b, -0.12), hoehe + 2), shade(look.accent, 34))
  }
  quad(ctx, a, b, lift(b, hoehe), lift(a, hoehe), look.accent)
  if (!fein) return
  // Türblatt-Füllung
  quad(
    ctx,
    lift(mix(a, b, 0.2), hoehe * 0.2),
    lift(mix(a, b, 0.8), hoehe * 0.2),
    lift(mix(a, b, 0.8), hoehe * 0.78),
    lift(mix(a, b, 0.2), hoehe * 0.78),
    shade(look.accent, -22),
  )
  // Klinke
  const klinke = lift(mix(a, b, 0.76), hoehe * 0.46)
  ctx.fillStyle = '#ffe9a8'
  ctx.beginPath()
  ctx.arc(klinke.sx, klinke.sy, 1.1, 0, Math.PI * 2)
  ctx.fill()
  // Stufe davor
  quad(ctx, mix(a, b, -0.1), mix(a, b, 1.1), { sx: mix(a, b, 1.1).sx + 2, sy: mix(a, b, 1.1).sy + 2.6 }, { sx: mix(a, b, -0.1).sx + 2, sy: mix(a, b, -0.1).sy + 2.6 }, 'rgba(226,226,226,0.55)')
}

/**
 * Ein Bauwerk. `fein` schaltet die Kleinteile zu – bei weit herausgezoomter Kamera
 * bleiben sie weg, damit auch große Städte flüssig laufen.
 */
export function drawBuilding(ctx: CanvasRenderingContext2D, placed: Placed, time: number, theme: Theme, fein: boolean): void {
  const def = buildingDef(placed.type)
  if (!def) return
  const [w, h] = footprint(def, placed.rot)
  const look = def.look
  const seed = hashOf(placed.id + placed.type)
  const stufe = Math.max(1, placed.level)

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
    tree(
      ctx,
      placed.x,
      placed.y,
      { ...look, wall: theme.tree[0], accent: theme.tree[1], roof: theme.tree[2] },
      tileNoise(placed.x, placed.y),
      fein,
    )
    return
  }
  if (['bank', 'laterne', 'blumen', 'hecke', 'felsen', 'fahne'].includes(look.kind)) {
    trinket(ctx, placed, look, time, fein)
    return
  }
  if (look.kind === 'park') {
    park(ctx, placed, w, h, look, fein)
    return
  }

  // Der Baukörper rückt mit jeder Stufe weiter an den Rand seines Grundstücks
  const ein = einzug(look, stufe)
  const bx = placed.x + ein
  const by = placed.y + ein
  const bw = w - ein * 2
  const bh = h - ein * 2
  const heightPx = bauHoehe(look, stufe) * rise
  const licht = 'rgba(255,214,132,0.92)'
  const stil = {
    seed,
    floors: (look.floors ?? 0) > 0 ? (look.floors ?? 0) + (stufe - 1) : 0,
    fein,
    balkon: look.kind === 'block' && stufe >= 2,
    licht,
  }
  const top = box(ctx, bx, by, bw, bh, heightPx, look, stil)

  if (look.kind === 'brunnen') {
    fountain(ctx, placed.x, placed.y, look, time)
    return
  }
  if (look.kind === 'wasser') {
    const inner = 0.16
    const a = toScreen(placed.x + inner, placed.y + inner)
    const b = toScreen(placed.x + w - inner, placed.y + inner)
    const c = toScreen(placed.x + w - inner, placed.y + h - inner)
    const d = toScreen(placed.x + inner, placed.y + h - inner)
    quad(ctx, a, b, c, d, look.roof)
    const mid = toScreen(placed.x + w / 2, placed.y + h / 2)
    // Wellen, die über die Fläche wandern
    ctx.save()
    ctx.strokeStyle = look.accent
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.55 - i * 0.12
      const versatz = Math.sin(time * 1.6 + i * 1.7) * 3
      ctx.beginPath()
      ctx.moveTo(mid.sx - 16 + i * 2, mid.sy - 6 + i * 6 + versatz)
      ctx.quadraticCurveTo(mid.sx, mid.sy - 9 + i * 6 - versatz, mid.sx + 16 - i * 2, mid.sy - 6 + i * 6 + versatz)
      ctx.stroke()
    }
    ctx.restore()
    return
  }
  if (look.kind === 'kuppel') {
    const mitte = { sx: (top.n.sx + top.s.sx) / 2, sy: (top.n.sy + top.s.sy) / 2 }
    const r = Math.min(bw, bh) * TILE_W * 0.3
    ctx.fillStyle = look.roof
    ctx.beginPath()
    ctx.ellipse(mitte.sx, mitte.sy + 2, r, r * 0.7, 0, Math.PI, 0)
    ctx.fill()
    ctx.fillStyle = shade(look.roof, 22)
    ctx.beginPath()
    ctx.ellipse(mitte.sx - r * 0.25, mitte.sy - r * 0.05, r * 0.55, r * 0.4, 0, Math.PI, 0)
    ctx.fill()
    if (fein) {
      // Rippen auf der Kuppel
      ctx.strokeStyle = fade('#0d1420', 0.25)
      ctx.lineWidth = 0.9
      for (let i = 1; i < 5; i++) {
        const t = i / 5
        ctx.beginPath()
        ctx.ellipse(mitte.sx, mitte.sy + 2, r * (1 - t * 0.85), r * 0.7 * (1 - t * 0.2), 0, Math.PI, 0)
        ctx.stroke()
      }
    }
    // Spalt für das Fernrohr
    ctx.strokeStyle = look.accent
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(mitte.sx + r * 0.1, mitte.sy - r * 0.62)
    ctx.lineTo(mitte.sx + r * 0.5, mitte.sy - r * 0.1)
    ctx.stroke()
    return
  }
  if (look.kind === 'statue') {
    const sockel = box(ctx, placed.x + 0.25, placed.y + 0.25, 0.5, 0.5, TILE_H * 0.35, look, { ...stil, floors: 0 })
    const mitte = { sx: (sockel.n.sx + sockel.s.sx) / 2, sy: (sockel.n.sy + sockel.s.sy) / 2 }
    ctx.fillStyle = shade(look.wall, 22)
    // Körper
    ctx.beginPath()
    ctx.moveTo(mitte.sx - 6, mitte.sy)
    ctx.lineTo(mitte.sx + 6, mitte.sy)
    ctx.lineTo(mitte.sx + 3, mitte.sy - 26)
    ctx.lineTo(mitte.sx - 3, mitte.sy - 26)
    ctx.closePath()
    ctx.fill()
    if (fein) {
      // ein erhobener Arm macht aus dem Klotz eine Gestalt
      ctx.strokeStyle = shade(look.wall, 22)
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(mitte.sx + 2, mitte.sy - 22)
      ctx.lineTo(mitte.sx + 9, mitte.sy - 32)
      ctx.stroke()
      ctx.fillStyle = fade('#ffffff', 0.25)
      ctx.fillRect(mitte.sx - 3, mitte.sy - 26, 2, 26)
    }
    ctx.fillStyle = shade(look.wall, 22)
    ctx.beginPath()
    ctx.arc(mitte.sx, mitte.sy - 31, 5, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  if (look.kind === 'flach') return

  const mitte = { sx: (top.n.sx + top.s.sx) / 2, sy: (top.n.sy + top.s.sy) / 2 }

  if (look.kind === 'haus') {
    const dach = gableRoof(ctx, top, TILE_H * (0.5 + (stufe - 1) * 0.12), look.roof, fein)
    // Tür auf der Vorderseite
    const doorA = mix(top.e, top.s, 0.42)
    const doorB = mix(top.e, top.s, 0.58)
    tuer(
      ctx,
      { sx: doorA.sx, sy: doorA.sy + heightPx },
      { sx: doorB.sx, sy: doorB.sy + heightPx },
      Math.min(14, heightPx * 0.72),
      look,
      fein,
    )
    if (fein) {
      // Schornstein, ab Stufe 2 raucht er
      const schornOrt = mix(top.n, top.e, 0.72)
      schornstein(ctx, { sx: schornOrt.sx, sy: schornOrt.sy - 2 }, 9 + stufe * 2, stufe >= 2, time, seed)
      if (stufe >= 2) gaube(ctx, { sx: mitte.sx + 6, sy: (dach.n.sy + mitte.sy) / 2 + 4 }, look.wall, licht)
      if (stufe >= 3) {
        // Dachfenster auf der zweiten Schräge und ein Wetterhahn
        gaube(ctx, { sx: mitte.sx - 10, sy: (dach.n.sy + mitte.sy) / 2 + 7 }, look.wall, licht)
        ctx.strokeStyle = '#ffd23f'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(dach.n.sx, dach.n.sy)
        ctx.lineTo(dach.n.sx, dach.n.sy - 8)
        ctx.stroke()
        ctx.fillStyle = '#ffd23f'
        ctx.beginPath()
        ctx.moveTo(dach.n.sx, dach.n.sy - 9.5)
        ctx.lineTo(dach.n.sx + 5, dach.n.sy - 7.5)
        ctx.lineTo(dach.n.sx, dach.n.sy - 5.5)
        ctx.closePath()
        ctx.fill()
      }
    }
    return
  }

  if (look.kind === 'laden') {
    // Flachdach mit umlaufender Attika
    quad(ctx, top.n, top.e, top.s, top.w, shade(look.roof, 0))
    if (fein) {
      const rand = 3
      const innen = [top.n, top.e, top.s, top.w].map((p) => ({
        sx: mitte.sx + (p.sx - mitte.sx) * 0.82,
        sy: mitte.sy + (p.sy - mitte.sy) * 0.82,
      })) as [Point, Point, Point, Point]
      quad(ctx, lift(innen[0], rand), lift(innen[1], rand), lift(innen[2], rand), lift(innen[3], rand), shade(look.roof, -18))
      // Lüftungskasten
      ctx.fillStyle = shade(look.wall, -10)
      ctx.fillRect(mitte.sx - 7, mitte.sy - 9, 12, 7)
      ctx.fillStyle = shade(look.wall, 20)
      ctx.fillRect(mitte.sx - 7, mitte.sy - 11, 12, 2.4)
    }

    // Schaufenster über die ganze Vorderseite
    const fensterA = mix(top.e, top.s, 0.14)
    const fensterB = mix(top.e, top.s, 0.86)
    const unten = heightPx * 0.92
    quad(
      ctx,
      { sx: fensterA.sx, sy: fensterA.sy + unten },
      { sx: fensterB.sx, sy: fensterB.sy + unten },
      { sx: fensterB.sx, sy: fensterB.sy + unten - 13 },
      { sx: fensterA.sx, sy: fensterA.sy + unten - 13 },
      licht,
    )
    if (fein) {
      // Waren im Fenster
      for (let i = 0; i < 3; i++) {
        const p = mix(fensterA, fensterB, 0.24 + i * 0.26)
        ctx.fillStyle = ['#ff7ab5', '#7bdcff', '#9dff8b'][i]
        ctx.fillRect(p.sx - 2, p.sy + unten - 7, 4, 5)
      }
      ctx.strokeStyle = fade('#2a3348', 0.5)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(fensterA.sx, fensterA.sy + unten - 13)
      ctx.lineTo(fensterB.sx, fensterB.sy + unten - 13)
      ctx.stroke()
    }

    // Markise mit Streifen
    const a = mix(top.e, top.s, 0.12)
    const b = mix(top.e, top.s, 0.88)
    const hoeheMarkise = heightPx * 0.42
    const ecke = 8
    quad(
      ctx,
      { sx: a.sx, sy: a.sy + hoeheMarkise },
      { sx: b.sx, sy: b.sy + hoeheMarkise },
      { sx: b.sx + ecke * 0.8, sy: b.sy + hoeheMarkise + ecke },
      { sx: a.sx + ecke * 0.8, sy: a.sy + hoeheMarkise + ecke },
      look.accent,
    )
    if (fein) {
      for (let i = 0; i < 5; i += 2) {
        const t0 = i / 6
        const t1 = (i + 1) / 6
        const s0 = mix(a, b, t0)
        const s1 = mix(a, b, t1)
        quad(
          ctx,
          { sx: s0.sx, sy: s0.sy + hoeheMarkise },
          { sx: s1.sx, sy: s1.sy + hoeheMarkise },
          { sx: s1.sx + ecke * 0.8, sy: s1.sy + hoeheMarkise + ecke },
          { sx: s0.sx + ecke * 0.8, sy: s0.sy + hoeheMarkise + ecke },
          fade('#ffffff', 0.55),
        )
      }
      // Schild über der Markise
      const schild = mix(a, b, 0.5)
      ctx.fillStyle = shade(look.accent, -34)
      roundedPath(ctx, schild.sx - 13, schild.sy + hoeheMarkise - 12, 26, 8, 2)
      ctx.fill()
      ctx.fillStyle = fade('#ffffff', 0.8)
      for (let i = 0; i < 4; i++) ctx.fillRect(schild.sx - 9 + i * 5, schild.sy + hoeheMarkise - 9, 3, 2.4)
      if (stufe >= 2) {
        // Kisten neben dem Eingang
        const kiste = mix(top.s, top.w, 0.2)
        ctx.fillStyle = '#b98a54'
        ctx.fillRect(kiste.sx - 4, kiste.sy + heightPx - 6, 9, 6)
        ctx.fillStyle = '#8f6a3f'
        ctx.fillRect(kiste.sx - 4, kiste.sy + heightPx - 6, 9, 1.6)
      }
    }
    return
  }

  if (look.kind === 'schule') {
    quad(ctx, top.n, top.e, top.s, top.w, shade(look.roof, -6))
    // Turm in der Mitte
    const turmHoch = 26 + stufe * 4
    ctx.fillStyle = shade(look.wall, 8)
    ctx.fillRect(mitte.sx - 9, mitte.sy - turmHoch, 18, turmHoch)
    ctx.fillStyle = shade(look.wall, -24)
    ctx.fillRect(mitte.sx + 4, mitte.sy - turmHoch, 5, turmHoch)
    ctx.fillStyle = look.roof
    ctx.beginPath()
    ctx.moveTo(mitte.sx - 12, mitte.sy - turmHoch)
    ctx.lineTo(mitte.sx + 12, mitte.sy - turmHoch)
    ctx.lineTo(mitte.sx, mitte.sy - turmHoch - 18)
    ctx.closePath()
    ctx.fill()
    if (fein) {
      // Uhr am Turm
      ctx.fillStyle = '#fdf6e3'
      ctx.beginPath()
      ctx.arc(mitte.sx, mitte.sy - turmHoch + 9, 5.4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#2a3348'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(mitte.sx, mitte.sy - turmHoch + 9, 5.4, 0, Math.PI * 2)
      ctx.stroke()
      const std = (time / 12) % (Math.PI * 2)
      ctx.lineWidth = 1.3
      ctx.beginPath()
      ctx.moveTo(mitte.sx, mitte.sy - turmHoch + 9)
      ctx.lineTo(mitte.sx + Math.cos(std - Math.PI / 2) * 3, mitte.sy - turmHoch + 9 + Math.sin(std - Math.PI / 2) * 3)
      ctx.moveTo(mitte.sx, mitte.sy - turmHoch + 9)
      ctx.lineTo(mitte.sx + Math.cos(std * 12 - Math.PI / 2) * 4.4, mitte.sy - turmHoch + 9 + Math.sin(std * 12 - Math.PI / 2) * 4.4)
      ctx.stroke()
      // Eingangstreppe
      const doorA = mix(top.e, top.s, 0.4)
      const doorB = mix(top.e, top.s, 0.6)
      tuer(
        ctx,
        { sx: doorA.sx, sy: doorA.sy + heightPx },
        { sx: doorB.sx, sy: doorB.sy + heightPx },
        Math.min(15, heightPx * 0.6),
        look,
        fein,
      )
      if (stufe >= 2) {
        // Fahne auf dem Turm
        ctx.strokeStyle = '#e8eef7'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(mitte.sx, mitte.sy - turmHoch - 18)
        ctx.lineTo(mitte.sx, mitte.sy - turmHoch - 30)
        ctx.stroke()
        const weht = Math.sin(time * 3) * 2.4
        ctx.fillStyle = look.accent
        ctx.beginPath()
        ctx.moveTo(mitte.sx, mitte.sy - turmHoch - 30)
        ctx.quadraticCurveTo(mitte.sx + 6, mitte.sy - turmHoch - 29 + weht, mitte.sx + 12, mitte.sy - turmHoch - 27 + weht)
        ctx.lineTo(mitte.sx + 12, mitte.sy - turmHoch - 23 + weht)
        ctx.quadraticCurveTo(mitte.sx + 6, mitte.sy - turmHoch - 23 - weht, mitte.sx, mitte.sy - turmHoch - 22)
        ctx.closePath()
        ctx.fill()
      }
    }
    return
  }

  // Block: Dachfläche, Attika, Treppenhaus, Technik
  quad(ctx, top.n, top.e, top.s, top.w, shade(look.roof, 6))

  // Attika: ein umlaufender Rand, innen etwas dunkler – das Dach bekommt Tiefe
  const randHoch = 4
  const innen = [top.n, top.e, top.s, top.w].map((punkt) => ({
    sx: mitte.sx + (punkt.sx - mitte.sx) * 0.88,
    sy: mitte.sy + (punkt.sy - mitte.sy) * 0.88,
  })) as [Point, Point, Point, Point]
  quad(
    ctx,
    lift(top.n, randHoch),
    lift(top.e, randHoch),
    lift(top.s, randHoch),
    lift(top.w, randHoch),
    shade(look.roof, 18),
  )
  quad(ctx, innen[0], innen[1], innen[2], innen[3], shade(look.roof, -16))

  // Treppenhaus: ein kleiner Kasten, der auf dem Dach steht
  const aufbau = 0.24
  const ax = bx + bw * 0.5 - aufbau
  const ay = by + bh * 0.5 - aufbau
  const aufbauHoch = 8 + stufe * 2
  roofBox(ctx, ax, ay, aufbau * 2, aufbau * 2, heightPx + randHoch, aufbauHoch, shade(look.wall, -14))
  if (!fein) return

  // Eingang unten
  const doorA = mix(top.e, top.s, 0.44)
  const doorB = mix(top.e, top.s, 0.56)
  tuer(
    ctx,
    { sx: doorA.sx, sy: doorA.sy + heightPx },
    { sx: doorB.sx, sy: doorB.sy + heightPx },
    Math.min(13, heightPx * 0.34),
    look,
    fein,
  )

  if (stufe >= 2) {
    // Lüftung und Wassertank
    roofBox(ctx, bx + bw * 0.2, by + bh * 0.62, 0.3, 0.3, heightPx + randHoch, 6, shade(look.wall, -20))
    roofBox(ctx, bx + bw * 0.62, by + bh * 0.22, 0.26, 0.26, heightPx + randHoch, 9, shade(look.accent, 6))
  }
  if (stufe >= 3) {
    // Antenne mit blinkender Spitze
    const spitze = { sx: mitte.sx + 8, sy: mitte.sy - randHoch - 26 }
    ctx.strokeStyle = '#d7dfee'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(spitze.sx, spitze.sy + 26)
    ctx.lineTo(spitze.sx, spitze.sy)
    ctx.stroke()
    ctx.fillStyle = Math.sin(time * 4) > 0 ? '#ff5f7a' : 'rgba(255,95,122,0.35)'
    ctx.beginPath()
    ctx.arc(spitze.sx, spitze.sy, 2.2, 0, Math.PI * 2)
    ctx.fill()
    // Sonnendach
    ctx.fillStyle = 'rgba(70,120,190,0.85)'
    ctx.fillRect(mitte.sx - 2, mitte.sy - randHoch - 5, 14, 5)
    ctx.strokeStyle = fade('#ffffff', 0.4)
    ctx.lineWidth = 0.7
    ctx.beginPath()
    for (let i = 1; i < 4; i++) {
      ctx.moveTo(mitte.sx - 2 + i * 3.5, mitte.sy - randHoch - 5)
      ctx.lineTo(mitte.sx - 2 + i * 3.5, mitte.sy - randHoch)
    }
    ctx.stroke()
  }
}
