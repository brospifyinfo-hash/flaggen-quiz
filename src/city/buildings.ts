// Die Bauwerke. Jedes Haus wird aus Kästen, Dächern und Kleinteilen zusammengesetzt:
// Sockel, Fensterrahmen, Fensterbänke, Ziegelreihen, Schornstein, Markise.
//
// Zwei Regeln ziehen sich durch: Erstens wächst ein Haus sichtbar mit seiner Stufe –
// es wird höher, füllt mehr von seinem Grundstück und bekommt Aufbauten dazu.
// Zweitens hängt alles Zufällige am Namen des Hauses, damit es sein Aussehen behält.
import { drawBau, umrissBau } from './bau'
import { buildingDef, footprint, type Look } from './catalog'
import { fade, hashOf, lift, mix, quad, quadPath, roundedPath, shade, wobble, type Point } from './draw'
import { nachRechts, TILE_H, TILE_W, tileNoise, toScreen, zeigtNachVorn } from './iso'
import { SEITEN, umlauf, waende, schwerpunkt, type Grund, type Seite, type Wand } from './geo'
import type { Theme } from './themes'

export { SEITEN, type Seite } from './geo'
import type { Placed } from './types'

/** Höhe des dunkleren Sockels in Bildpunkten */
const SOCKEL = 5

/** Formen ohne Baukörper – sie stehen flach auf der Kachel */
const FLACH = new Set(['baum', 'bank', 'laterne', 'blumen', 'hecke', 'felsen', 'fahne', 'park', 'wasser', 'flach'])

/** Höhe eines Bauwerks in Bildpunkten. Jede Stufe legt spürbar zu. */
export function bauHoehe(look: Look, level: number): number {
  return TILE_H * (look.height + (level - 1) * (look.stufenHoehe ?? 0.45))
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

/** Was ein Baukörper nach dem Zeichnen über sich verrät */
export type Deckel = {
  grund: Grund
  hoehe: number
  ecken: [Point, Point, Point, Point]
  mitte: Point
  waende: Record<Seite, Wand>
}

/** Baukörper: die Wände, die zum Betrachter zeigen, und der Deckel darauf */
function box(
  ctx: CanvasRenderingContext2D,
  g: Grund,
  heightPx: number,
  look: Look,
  stil: { seed: number; floors: number; fein: boolean; balkon: boolean; licht: string; vorn: Seite },
): Deckel {
  const alle = waende(g)
  const sichtbar = SEITEN.map((s) => alle[s])
    .filter((wand) => wand.sichtbar)
    .sort((a, b) => a.tiefe - b.tiefe)

  for (const wand of sichtbar) {
    facade(ctx, wand.a, wand.b, heightPx, shade(look.wall, wand.ton), {
      ...stil,
      front: wand.seite === stil.vorn,
      balkon: stil.balkon && wand.seite === stil.vorn,
    })
  }

  // Hauskante dort, wo zwei sichtbare Wände zusammenstoßen – ein heller Strich gibt der Ecke Schärfe
  if (stil.fein && heightPx > 10 && sichtbar.length === 2) {
    const unten = umlauf(g).reduce((a, b) => (b.sy > a.sy ? b : a))
    ctx.strokeStyle = fade('#ffffff', 0.16)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(unten.sx, unten.sy)
    ctx.lineTo(unten.sx, unten.sy - heightPx)
    ctx.stroke()
  }

  const ecken = umlauf(g, heightPx)
  quad(ctx, ecken[0], ecken[1], ecken[2], ecken[3], shade(look.wall, 16))
  return { grund: g, hoehe: heightPx, ecken, mitte: schwerpunkt(ecken), waende: alle }
}

/**
 * Ein Kasten, der auf einem Dach steht. Anders als box() beginnt er nicht am Boden –
 * sonst zöge er einen Streifen über die Fassade des Hauses, auf dem er sitzt.
 */
function roofBox(ctx: CanvasRenderingContext2D, g: Grund, basis: number, hoehe: number, farbe: string): Deckel {
  const alle = waende(g, basis)
  for (const wand of SEITEN.map((s) => alle[s])
    .filter((w) => w.sichtbar)
    .sort((a, b) => a.tiefe - b.tiefe)) {
    quad(ctx, wand.a, wand.b, lift(wand.b, hoehe), lift(wand.a, hoehe), shade(farbe, wand.ton * 0.8))
  }
  const ecken = umlauf(g, basis + hoehe)
  quad(ctx, ecken[0], ecken[1], ecken[2], ecken[3], shade(farbe, 16))
  return { grund: g, hoehe: basis + hoehe, ecken, mitte: schwerpunkt(ecken), waende: alle }
}

/** Etwas, das auf einer Dachschräge sitzt: Schornstein, Gaube */
type AufDach = { wx: number; wy: number; malen: (p: Point) => void }

/**
 * Satteldach mit First, Überstand und Ziegelreihen. Der First liegt fest auf der
 * Karte, entlang der längeren Seite – dreht man die Stadt, dreht das Dach mit, statt
 * bei einem bestimmten Winkel umzuspringen. Die Flächen werden von hinten nach vorn
 * gemalt; was auf einer Schräge sitzt, kommt direkt nach seiner Schräge dran, damit
 * die vordere Schräge es verdecken kann.
 */
function gableRoof(
  ctx: CanvasRenderingContext2D,
  deckel: Deckel,
  rise: number,
  color: string,
  fein: boolean,
  aufDach: AufDach[] = [],
): { first: [Point, Point]; punkt: (wx: number, wy: number) => Point } {
  const u = 0.06
  const g = deckel.grund
  const r: Grund = { x: g.x - u, y: g.y - u, w: g.w + 2 * u, h: g.h + 2 * u }
  const basis = deckel.hoehe
  const [c0, c1, c2, c3] = umlauf(r, basis)
  const laengsX = g.w >= g.h
  const f1 = laengsX
    ? lift(toScreen(r.x, r.y + r.h / 2), basis + rise)
    : lift(toScreen(r.x + r.w / 2, r.y), basis + rise)
  const f2 = laengsX
    ? lift(toScreen(r.x + r.w, r.y + r.h / 2), basis + rise)
    : lift(toScreen(r.x + r.w / 2, r.y + r.h), basis + rise)

  // Höhe der Dachfläche über einem Kartenpunkt: am First am höchsten, an der Traufe am tiefsten
  const punkt = (wx: number, wy: number): Point => {
    const abstand = laengsX ? Math.abs(wy - (r.y + r.h / 2)) / (r.h / 2) : Math.abs(wx - (r.x + r.w / 2)) / (r.w / 2)
    return lift(toScreen(wx, wy), basis + rise * Math.max(0, 1 - abstand))
  }

  type Schraege = { punkte: [Point, Point, Point, Point]; n: [number, number]; traufe: [Point, Point]; seiteNeg: boolean }
  const schraegen: Schraege[] = laengsX
    ? [
        { punkte: [c0, c1, f2, f1], n: [0, -1], traufe: [c0, c1], seiteNeg: true },
        { punkte: [c3, c2, f2, f1], n: [0, 1], traufe: [c3, c2], seiteNeg: false },
      ]
    : [
        { punkte: [c0, c3, f2, f1], n: [-1, 0], traufe: [c0, c3], seiteNeg: true },
        { punkte: [c1, c2, f2, f1], n: [1, 0], traufe: [c1, c2], seiteNeg: false },
      ]
  const giebel: { punkte: [Point, Point, Point]; n: [number, number] }[] = laengsX
    ? [
        { punkte: [c0, c3, f1], n: [-1, 0] },
        { punkte: [c1, c2, f2], n: [1, 0] },
      ]
    : [
        { punkte: [c0, c1, f1], n: [0, -1] },
        { punkte: [c3, c2, f2], n: [0, 1] },
      ]

  // Die hintere Schräge zuerst, dazu was auf ihr sitzt; dann die vordere
  schraegen.sort((a, b) => schwerpunkt(a.punkte).sy - schwerpunkt(b.punkte).sy)
  for (const flaeche of schraegen) {
    const [p0, p1, p2, p3] = flaeche.punkte
    quad(ctx, p0, p1, p2, p3, shade(color, -7 + 19 * nachRechts(flaeche.n[0], flaeche.n[1])))
    if (fein) {
      ctx.strokeStyle = fade('#10131c', 0.18)
      ctx.lineWidth = 0.9
      ctx.beginPath()
      for (let i = 1; i <= 3; i++) {
        const t = i / 4
        const q0 = mix(flaeche.traufe[0], f1, t)
        const q1 = mix(flaeche.traufe[1], f2, t)
        ctx.moveTo(q0.sx, q0.sy)
        ctx.lineTo(q1.sx, q1.sy)
      }
      ctx.stroke()
    }
    for (const ding of aufDach) {
      const aufNeg = laengsX ? ding.wy < r.y + r.h / 2 : ding.wx < r.x + r.w / 2
      if (aufNeg === flaeche.seiteNeg) ding.malen(punkt(ding.wx, ding.wy))
    }
  }

  // Giebel nur, wo sie zum Betrachter zeigen – die hinteren verdeckt das Dach ohnehin
  for (const g3 of giebel) {
    if (!zeigtNachVorn(g3.n[0], g3.n[1])) continue
    ctx.beginPath()
    ctx.moveTo(g3.punkte[0].sx, g3.punkte[0].sy)
    ctx.lineTo(g3.punkte[1].sx, g3.punkte[1].sy)
    ctx.lineTo(g3.punkte[2].sx, g3.punkte[2].sy)
    ctx.closePath()
    ctx.fillStyle = shade(color, -10 + 6 * nachRechts(g3.n[0], g3.n[1]))
    ctx.fill()
  }

  if (fein) {
    // First als heller Grat
    ctx.strokeStyle = fade('#ffffff', 0.3)
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(f1.sx, f1.sy)
    ctx.lineTo(f2.sx, f2.sy)
    ctx.stroke()
  }
  return { first: [f1, f2], punkt }
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
  const hoch = TILE_H * look.height
  const deckel = box(ctx, { x: placed.x, y: placed.y, w, h }, hoch, look, {
    seed: hashOf(placed.id),
    floors: 0,
    fein,
    balkon: false,
    licht: 'rgba(255,224,150,0.9)',
    vorn: 'o',
  })
  const [k0, k1, k2, k3] = deckel.ecken
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(k0.sx, k0.sy)
  ctx.lineTo(k1.sx, k1.sy)
  ctx.lineTo(k2.sx, k2.sy)
  ctx.lineTo(k3.sx, k3.sy)
  ctx.closePath()
  ctx.clip()
  // Weg quer durch den Park, mit hellem Kies – fest auf der Karte, von West nach Ost
  const wegA = lift(toScreen(placed.x, placed.y + h / 2), hoch)
  const wegB = lift(toScreen(placed.x + w, placed.y + h / 2), hoch)
  ctx.strokeStyle = 'rgba(232,222,196,0.85)'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(wegA.sx, wegA.sy)
  ctx.lineTo(wegB.sx, wegB.sy)
  ctx.stroke()
  if (fein) {
    // Kanten des Wegs: parallel versetzt, quer zur Wegrichtung im Bild
    const lang = Math.hypot(wegB.sx - wegA.sx, wegB.sy - wegA.sy) || 1
    const q = { sx: (-(wegB.sy - wegA.sy) / lang) * 3.5, sy: ((wegB.sx - wegA.sx) / lang) * 3.5 }
    ctx.strokeStyle = 'rgba(160,150,124,0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(wegA.sx + q.sx, wegA.sy + q.sy)
    ctx.lineTo(wegB.sx + q.sx, wegB.sy + q.sy)
    ctx.moveTo(wegA.sx - q.sx, wegA.sy - q.sy)
    ctx.lineTo(wegB.sx - q.sx, wegB.sy - q.sy)
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

/** Tür mit Rahmen, Stufe, Klinke – auf einer Wand, deren Außenrichtung `raus` ist */
function tuer(
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  hoehe: number,
  look: Look,
  fein: boolean,
  raus: Point,
): void {
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
  // Stufe davor – sie liegt draußen vor der Wand, in welche Richtung die auch zeigt
  const s0 = mix(a, b, -0.1)
  const s1 = mix(a, b, 1.1)
  const vor = { sx: raus.sx * 3, sy: raus.sy * 3 }
  quad(ctx, s0, s1, { sx: s1.sx + vor.sx, sy: s1.sy + vor.sy }, { sx: s0.sx + vor.sx, sy: s0.sy + vor.sy }, 'rgba(226,226,226,0.55)')
}

/**
 * Ein Bauwerk. `fein` schaltet die Kleinteile zu – bei weit herausgezoomter Kamera
 * bleiben sie weg, damit auch große Städte flüssig laufen. `vorn` ist die Seite, an
 * der Tür, Schaufenster und Markise sitzen: die zur Straße.
 */
export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  placed: Placed,
  time: number,
  theme: Theme,
  fein: boolean,
  vorn: Seite = 'o',
): void {
  const def = buildingDef(placed.type)
  if (!def) return
  if (placed.verlassen) {
    zeichneRuine(ctx, placed, def.look, time, theme, fein, vorn)
    return
  }
  zeichneBauwerk(ctx, placed, def.look, time, theme, fein, vorn)
}

/** Gedeckte, abgeblätterte Töne für Häuser, in denen niemand mehr wohnt */
const RUINENFARBEN = ['#8a8478', '#7d7a70', '#8f8677', '#7a7f7c', '#888078']
const RUINENDACH = ['#4a4744', '#54504a', '#454a4c']

/**
 * Ein verlassenes Haus: Der Putz ist grau, die Fenster sind dunkel oder vernagelt,
 * Efeu und Graffiti an der Wand, Müll und Unkraut davor. Niemand geht hinein.
 */
function zeichneRuine(
  ctx: CanvasRenderingContext2D,
  placed: Placed,
  look: Look,
  time: number,
  theme: Theme,
  fein: boolean,
  vorn: Seite,
): void {
  const def = buildingDef(placed.type)
  if (!def) return
  const [w, h] = footprint(def, placed.rot)
  const seed = hashOf(placed.id + placed.type)
  const stufe = Math.max(1, placed.level)

  const verfallen: Look = {
    ...look,
    wall: RUINENFARBEN[seed % RUINENFARBEN.length],
    roof: RUINENDACH[seed % RUINENDACH.length],
    accent: '#3a3835',
    stil: look.stil
      ? {
          ...look.stil,
          farben: RUINENFARBEN,
          dachfarben: RUINENDACH,
          fenster: 'dunkel',
          extras: [...(look.stil.extras ?? []).filter((e) => !['solar', 'pool', 'tische', 'markise', 'leuchtschrift', 'schild', 'fahrrad'].includes(e)), 'graffiti', 'muell', 'efeu'],
          vielleicht: [],
          neon: undefined,
          schild: undefined,
        }
      : undefined,
  }
  zeichneBauwerk(ctx, { ...placed, at: 0 }, verfallen, time, theme, fein, vorn)

  // Unkraut am Rand des Grundstücks und vernagelte Fenster, wenn man nah genug dran ist
  if (!fein) return
  const ein = einzug(look, stufe)
  const grund: Grund = { x: placed.x + ein, y: placed.y + ein, w: w - ein * 2, h: h - ein * 2 }
  const hoehe = bauHoehe(look, stufe)
  ctx.save()
  ctx.fillStyle = 'rgba(78,110,52,0.85)'
  for (let i = 0; i < 6 + w * h * 2; i++) {
    const u = wobble(seed, 200 + i)
    const v = wobble(seed, 300 + i)
    const rand = i % 2 === 0
    const px = placed.x + (rand ? u : v < 0.5 ? 0.05 : 0.95) * w
    const py = placed.y + (rand ? (v < 0.5 ? 0.05 : 0.95) : u) * h
    const p = toScreen(px, py)
    ctx.beginPath()
    ctx.ellipse(p.sx, p.sy, 2.4 + u * 2, 1.6 + v * 1.4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(p.sx, p.sy)
    ctx.lineTo(p.sx - 1.5 + u * 3, p.sy - 4 - v * 3)
    ctx.strokeStyle = 'rgba(78,110,52,0.9)'
    ctx.lineWidth = 1
    ctx.stroke()
  }
  // Bretter über den Fenstern der sichtbaren Wände
  const wandListe = waende(grund)
  ctx.strokeStyle = '#5c4a36'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  for (const seite of SEITEN) {
    const wand = wandListe[seite]
    if (!wand.sichtbar) continue
    const n = Math.max(1, Math.round(Math.hypot(wand.b.sx - wand.a.sx, wand.b.sy - wand.a.sy) / 22))
    for (let i = 0; i < n; i++) {
      if (wobble(seed, 400 + i + seite.charCodeAt(0)) < 0.35) continue
      const m = mix(wand.a, wand.b, (i + 0.5) / n)
      const y = m.sy - hoehe * (0.35 + 0.3 * wobble(seed, 500 + i))
      ctx.beginPath()
      ctx.moveTo(m.sx - 5, y - 5)
      ctx.lineTo(m.sx + 5, y + 5)
      ctx.moveTo(m.sx + 5, y - 5)
      ctx.lineTo(m.sx - 5, y + 5)
      ctx.stroke()
    }
  }
  ctx.restore()
}

function zeichneBauwerk(
  ctx: CanvasRenderingContext2D,
  placed: Placed,
  look: Look,
  time: number,
  theme: Theme,
  fein: boolean,
  vorn: Seite,
): void {
  const def = buildingDef(placed.type)
  if (!def) return
  const [w, h] = footprint(def, placed.rot)
  const seed = hashOf(placed.id + placed.type)
  const stufe = Math.max(1, placed.level)

  // Der Baukörper rückt mit jeder Stufe weiter an den Rand seines Grundstücks
  const ein = einzug(look, stufe)
  const grund: Grund = { x: placed.x + ein, y: placed.y + ein, w: w - ein * 2, h: h - ein * 2 }

  if (look.kind === 'bau' && look.stil) {
    const alter = Date.now() - placed.at
    const wachsen = placed.at > 0 && alter >= 0 && alter < 600 ? Math.max(0.08, alter / 600) : 1
    drawBau(ctx, {
      placed,
      look,
      stil: look.stil,
      lot: { x: placed.x, y: placed.y, w, h },
      stufe,
      hoehe: bauHoehe(look, stufe) * wachsen,
      seed,
      time,
      fein,
      vorn,
      einzug: ein,
    })
    return
  }

  // Schatten. Er gehört unter den Baukörper, nicht unter die ganze Kachel: Schaute
  // er ringsum unter dem Haus hervor, sähe es aus, als schwebte es darüber. Der
  // Versatz liegt im Bild, nicht auf der Karte – aus jeder Blickrichtung fällt er
  // nach vorn unten und nie hinter das Haus. Flaches bringt eigene Schatten mit.
  if (!FLACH.has(look.kind)) {
    const wurf = 1.4 + Math.min(1.6, look.height * 0.5)
    const [s0, s1, s2, s3] = umlauf(grund).map((p) => ({ sx: p.sx, sy: p.sy + wurf }))
    ctx.save()
    ctx.globalAlpha = 0.26
    quad(ctx, s0, s1, s2, s3, '#0b1424')
    ctx.restore()
  }

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

  const heightPx = bauHoehe(look, stufe) * rise
  const licht = 'rgba(255,214,132,0.92)'
  const stil = {
    seed,
    floors: (look.floors ?? 0) > 0 ? (look.floors ?? 0) + (stufe - 1) : 0,
    fein,
    balkon: look.kind === 'block' && stufe >= 2,
    licht,
    vorn,
  }
  const deckel = box(ctx, grund, heightPx, look, stil)
  const mitte = deckel.mitte
  const front = deckel.waende[vorn]

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
    const r = Math.min(grund.w, grund.h) * TILE_W * 0.3
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
    const sockel = box(ctx, { x: placed.x + 0.25, y: placed.y + 0.25, w: 0.5, h: 0.5 }, TILE_H * 0.35, look, {
      ...stil,
      floors: 0,
    })
    const oben = sockel.mitte
    ctx.fillStyle = shade(look.wall, 22)
    // Körper
    ctx.beginPath()
    ctx.moveTo(oben.sx - 6, oben.sy)
    ctx.lineTo(oben.sx + 6, oben.sy)
    ctx.lineTo(oben.sx + 3, oben.sy - 26)
    ctx.lineTo(oben.sx - 3, oben.sy - 26)
    ctx.closePath()
    ctx.fill()
    if (fein) {
      // ein erhobener Arm macht aus dem Klotz eine Gestalt
      ctx.strokeStyle = shade(look.wall, 22)
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(oben.sx + 2, oben.sy - 22)
      ctx.lineTo(oben.sx + 9, oben.sy - 32)
      ctx.stroke()
      ctx.fillStyle = fade('#ffffff', 0.25)
      ctx.fillRect(oben.sx - 3, oben.sy - 26, 2, 26)
    }
    ctx.fillStyle = shade(look.wall, 22)
    ctx.beginPath()
    ctx.arc(oben.sx, oben.sy - 31, 5, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  if (look.kind === 'flach') return

  if (look.kind === 'haus') {
    // Schornstein und Gauben sitzen fest auf ihrer Dachseite
    const g = grund
    const laengsX = g.w >= g.h
    const aufDach: AufDach[] = []
    if (fein) {
      aufDach.push({
        wx: g.x + g.w * (laengsX ? 0.72 : 0.28),
        wy: g.y + g.h * (laengsX ? 0.28 : 0.72),
        malen: (p) => schornstein(ctx, p, 9 + stufe * 2, stufe >= 2, time, seed),
      })
      if (stufe >= 2) {
        aufDach.push({
          wx: g.x + g.w * (laengsX ? 0.38 : 0.76),
          wy: g.y + g.h * (laengsX ? 0.76 : 0.38),
          malen: (p) => gaube(ctx, p, look.wall, licht),
        })
      }
      if (stufe >= 3) {
        aufDach.push({
          wx: g.x + g.w * (laengsX ? 0.7 : 0.76),
          wy: g.y + g.h * (laengsX ? 0.76 : 0.7),
          malen: (p) => gaube(ctx, p, look.wall, licht),
        })
      }
    }
    const dach = gableRoof(ctx, deckel, TILE_H * (0.5 + (stufe - 1) * 0.12), look.roof, fein, aufDach)
    // Tür auf der Straßenseite – nur, wenn man diese Seite gerade sieht
    if (front.sichtbar) {
      tuer(
        ctx,
        mix(front.a, front.b, 0.42),
        mix(front.a, front.b, 0.58),
        Math.min(14, heightPx * 0.72),
        look,
        fein,
        front.raus,
      )
    }
    if (fein && stufe >= 3) {
      // Wetterhahn auf dem Firstende
      const spitze = dach.first[0]
      ctx.strokeStyle = '#ffd23f'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(spitze.sx, spitze.sy)
      ctx.lineTo(spitze.sx, spitze.sy - 8)
      ctx.stroke()
      ctx.fillStyle = '#ffd23f'
      ctx.beginPath()
      ctx.moveTo(spitze.sx, spitze.sy - 9.5)
      ctx.lineTo(spitze.sx + 5, spitze.sy - 7.5)
      ctx.lineTo(spitze.sx, spitze.sy - 5.5)
      ctx.closePath()
      ctx.fill()
    }
    return
  }

  const [d0, d1, d2, d3] = deckel.ecken

  if (look.kind === 'laden') {
    // Flachdach mit umlaufender Attika
    quad(ctx, d0, d1, d2, d3, shade(look.roof, 0))
    if (fein) {
      const rand = 3
      const innen = deckel.ecken.map((p) => ({
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
    if (!front.sichtbar) return

    // Schaufenster über die ganze Straßenseite
    const unten = heightPx * 0.08
    const fensterA = lift(mix(front.a, front.b, 0.14), unten)
    const fensterB = lift(mix(front.a, front.b, 0.86), unten)
    quad(ctx, fensterA, fensterB, lift(fensterB, 13), lift(fensterA, 13), licht)
    if (fein) {
      // Waren im Fenster
      for (let i = 0; i < 3; i++) {
        const p = mix(fensterA, fensterB, 0.24 + i * 0.26)
        ctx.fillStyle = ['#ff7ab5', '#7bdcff', '#9dff8b'][i]
        ctx.fillRect(p.sx - 2, p.sy - 7, 4, 5)
      }
      ctx.strokeStyle = fade('#2a3348', 0.5)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(fensterA.sx, fensterA.sy - 13)
      ctx.lineTo(fensterB.sx, fensterB.sy - 13)
      ctx.stroke()
    }

    // Markise mit Streifen – sie ragt nach draußen, weg von der Wand
    const hoeheMarkise = heightPx * 0.58
    const a = lift(mix(front.a, front.b, 0.12), hoeheMarkise)
    const b = lift(mix(front.a, front.b, 0.88), hoeheMarkise)
    const vor = { sx: front.raus.sx * 7, sy: front.raus.sy * 7 + 5 }
    const weg = (p: Point): Point => ({ sx: p.sx + vor.sx, sy: p.sy + vor.sy })
    quad(ctx, a, b, weg(b), weg(a), look.accent)
    if (fein) {
      for (let i = 0; i < 5; i += 2) {
        const s0 = mix(a, b, i / 6)
        const s1 = mix(a, b, (i + 1) / 6)
        quad(ctx, s0, s1, weg(s1), weg(s0), fade('#ffffff', 0.55))
      }
      // Schild über der Markise
      const schild = lift(mix(a, b, 0.5), 4)
      ctx.fillStyle = shade(look.accent, -34)
      roundedPath(ctx, schild.sx - 13, schild.sy - 8, 26, 8, 2)
      ctx.fill()
      ctx.fillStyle = fade('#ffffff', 0.8)
      for (let i = 0; i < 4; i++) ctx.fillRect(schild.sx - 9 + i * 5, schild.sy - 5, 3, 2.4)
      if (stufe >= 2) {
        // Kisten vor dem Laden
        const kiste = mix(front.a, front.b, 0.86)
        const ort = { sx: kiste.sx + front.raus.sx * 6, sy: kiste.sy + front.raus.sy * 6 }
        ctx.fillStyle = '#b98a54'
        ctx.fillRect(ort.sx - 4, ort.sy - 6, 9, 6)
        ctx.fillStyle = '#8f6a3f'
        ctx.fillRect(ort.sx - 4, ort.sy - 6, 9, 1.6)
      }
    }
    return
  }

  if (look.kind === 'schule') {
    quad(ctx, d0, d1, d2, d3, shade(look.roof, -6))
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
      // Eingang auf der Straßenseite
      if (front.sichtbar) {
        tuer(
          ctx,
          mix(front.a, front.b, 0.4),
          mix(front.a, front.b, 0.6),
          Math.min(15, heightPx * 0.6),
          look,
          fein,
          front.raus,
        )
      }
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
  quad(ctx, d0, d1, d2, d3, shade(look.roof, 6))

  // Attika: ein umlaufender Rand, innen etwas dunkler – das Dach bekommt Tiefe
  const randHoch = 4
  const innen = deckel.ecken.map((punkt) => ({
    sx: mitte.sx + (punkt.sx - mitte.sx) * 0.88,
    sy: mitte.sy + (punkt.sy - mitte.sy) * 0.88,
  })) as [Point, Point, Point, Point]
  quad(ctx, lift(d0, randHoch), lift(d1, randHoch), lift(d2, randHoch), lift(d3, randHoch), shade(look.roof, 18))
  quad(ctx, innen[0], innen[1], innen[2], innen[3], shade(look.roof, -16))

  // Treppenhaus: ein kleiner Kasten, der auf dem Dach steht
  const aufbau = 0.24
  const aufbauHoch = 8 + stufe * 2
  roofBox(
    ctx,
    { x: grund.x + grund.w * 0.5 - aufbau, y: grund.y + grund.h * 0.5 - aufbau, w: aufbau * 2, h: aufbau * 2 },
    heightPx + randHoch,
    aufbauHoch,
    shade(look.wall, -14),
  )
  if (!fein) return

  // Eingang unten, auf der Straßenseite
  if (front.sichtbar) {
    tuer(
      ctx,
      mix(front.a, front.b, 0.44),
      mix(front.a, front.b, 0.56),
      Math.min(13, heightPx * 0.34),
      look,
      fein,
      front.raus,
    )
  }

  if (stufe >= 2) {
    // Lüftung und Wassertank
    roofBox(ctx, { x: grund.x + grund.w * 0.2, y: grund.y + grund.h * 0.62, w: 0.3, h: 0.3 }, heightPx + randHoch, 6, shade(look.wall, -20))
    roofBox(ctx, { x: grund.x + grund.w * 0.62, y: grund.y + grund.h * 0.22, w: 0.26, h: 0.26 }, heightPx + randHoch, 9, shade(look.accent, 6))
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

/**
 * Der sichtbare Umriss eines Bauwerks im Bild, als Punktwolke: Grundriss am Boden,
 * Oberkante der Wände, First, Turm oder Antenne. Die konvexe Hülle dieser Punkte ist
 * die Trefferfläche – genau genug, dass ein Haus keine Tipper abfängt, die sichtbar
 * dem Haus dahinter gehören. Bei freier Drehung stehen Häuser oft knapp hintereinander.
 */
export function umrissPunkte(placed: Placed, vorn: Seite = 'o'): Point[] {
  const def = buildingDef(placed.type)
  if (!def) return []
  const [w, h] = footprint(def, placed.rot)
  const look = def.look
  const stufe = Math.max(1, placed.level)

  if (look.kind === 'bau' && look.stil) {
    return umrissBau({
      placed,
      look,
      stil: look.stil,
      lot: { x: placed.x, y: placed.y, w, h },
      stufe,
      hoehe: bauHoehe(look, stufe),
      seed: hashOf(placed.id + placed.type),
      vorn,
      einzug: einzug(look, stufe),
    })
  }

  if (look.kind === 'baum') {
    // Stamm und Krone: gut eine Kachelhöhe hoch, schmaler als die Kachel
    const k: Grund = { x: placed.x + 0.2, y: placed.y + 0.2, w: 0.6, h: 0.6 }
    return [...umlauf(k), ...umlauf(k, TILE_H * 1.3)]
  }
  if (FLACH.has(look.kind)) {
    // So hoch, wie das Ding wirklich gezeichnet wird – ein Platz ist kaum höher als
    // der Boden und darf keine Tipper abfangen, die über ihm liegen
    const g: Grund = { x: placed.x, y: placed.y, w, h }
    const HOEHE: Record<string, number> = {
      laterne: 37,
      fahne: 37,
      bank: 14,
      blumen: 10,
      hecke: 16,
      felsen: 13,
      park: TILE_H * 1.1,
    }
    const hoch = HOEHE[look.kind] ?? TILE_H * look.height + 2
    return [...umlauf(g), ...umlauf(g, hoch)]
  }

  const ein = einzug(look, stufe)
  const g: Grund = { x: placed.x + ein, y: placed.y + ein, w: w - ein * 2, h: h - ein * 2 }
  const hoehe = bauHoehe(look, stufe)
  const punkte: Point[] = [...umlauf(g), ...umlauf(g, hoehe)]
  const mitteBoden = toScreen(g.x + g.w / 2, g.y + g.h / 2)

  if (look.kind === 'haus') {
    // Traufe mit Überstand und die beiden Firstenden – wie in gableRoof
    const u = 0.06
    const r: Grund = { x: g.x - u, y: g.y - u, w: g.w + 2 * u, h: g.h + 2 * u }
    const rise = TILE_H * (0.5 + (stufe - 1) * 0.12)
    const laengsX = g.w >= g.h
    const f1 = laengsX ? toScreen(r.x, r.y + r.h / 2) : toScreen(r.x + r.w / 2, r.y)
    const f2 = laengsX ? toScreen(r.x + r.w, r.y + r.h / 2) : toScreen(r.x + r.w / 2, r.y + r.h)
    punkte.push(...umlauf(r, hoehe), lift(f1, hoehe + rise), lift(f2, hoehe + rise))
  } else if (look.kind === 'schule') {
    punkte.push(lift(mitteBoden, hoehe + 26 + stufe * 4 + 18))
  } else if (look.kind === 'block') {
    punkte.push(lift(mitteBoden, hoehe + 4 + 8 + stufe * 2 + (stufe >= 3 ? 26 : 0)))
  } else if (look.kind === 'kuppel') {
    punkte.push(lift(mitteBoden, hoehe + Math.min(g.w, g.h) * TILE_W * 0.21))
  } else if (look.kind === 'statue') {
    punkte.push(lift(mitteBoden, TILE_H * 0.35 + 36))
  } else {
    punkte.push(lift(mitteBoden, hoehe + 6))
  }
  return punkte
}
