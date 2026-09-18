// Werkzeug zum Zeichnen: Farben aufhellen, Vierecke füllen, Kästen auf den Boden
// stellen. Häuser und Figuren greifen auf dieselben Handgriffe zurück.
import { dirToScreen } from './iso'

export type Point = { sx: number; sy: number }

/**
 * Farbe in ihre drei Kanäle zerlegen. Verstanden werden "#rrggbb" und "rgb(r,g,b)",
 * denn eine aufgehellte Farbe wird selbst wieder weitergereicht – wer das nicht kann,
 * liefert stillschweigend Schwarz.
 */
function kanaele(farbe: string): [number, number, number] {
  if (farbe.startsWith('#')) {
    const kurz = farbe.length === 4
    const voll = kurz ? '#' + [1, 2, 3].map((i) => farbe[i] + farbe[i]).join('') : farbe
    const num = parseInt(voll.slice(1, 7), 16)
    if (Number.isNaN(num)) return [0, 0, 0]
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
  }
  const zahlen = farbe.match(/-?\d*\.?\d+/g)
  if (!zahlen || zahlen.length < 3) return [0, 0, 0]
  return [Number(zahlen[0]), Number(zahlen[1]), Number(zahlen[2])]
}

const klemme = (wert: number) => Math.max(0, Math.min(255, Math.round(wert)))

/** Farbe heller oder dunkler machen. Positiver Wert hellt auf. */
export const shade = (farbe: string, amount: number): string => {
  const [r, g, b] = kanaele(farbe)
  return `rgb(${klemme(r + amount)},${klemme(g + amount)},${klemme(b + amount)})`
}

/** Dieselbe Farbe, aber durchscheinend */
export const fade = (farbe: string, alpha: number): string => {
  const [r, g, b] = kanaele(farbe)
  return `rgba(${klemme(r)},${klemme(g)},${klemme(b)},${alpha})`
}

export function quad(
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

/** Rechteck mit runden Ecken – für Figuren, Fahrzeuge und Sprechblasen */
export function roundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

export const lift = (p: Point, px: number): Point => ({ sx: p.sx, sy: p.sy - px })
export const mix = (a: Point, b: Point, t: number): Point => ({
  sx: a.sx + (b.sx - a.sx) * t,
  sy: a.sy + (b.sy - a.sy) * t,
})
export const add = (p: Point, q: Point): Point => ({ sx: p.sx + q.sx, sy: p.sy + q.sy })
export const scale = (p: Point, f: number): Point => ({ sx: p.sx * f, sy: p.sy * f })

/**
 * Gleichmäßiger Zufall aus einer Zahl. Damit sieht jedes Haus und jeder Mensch
 * immer gleich aus – Streuung ja, Flackern nein.
 */
export const wobble = (seed: number, salt: number): number => {
  const value = Math.sin(seed * 127.1 + salt * 311.7) * 43758.5453
  return value - Math.floor(value)
}

/** Zahl aus einer Zeichenkette – für Häuser, die ihre Gestalt behalten sollen */
export function hashOf(text: string): number {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967295
}

/**
 * Richtung auf dem Boden, in Bildschirmschritten: vorwärts entlang der Fahrt und
 * quer dazu. Beides in Bildpunkten für einen Schritt von einer Kachel.
 */
export function isoFrame(dx: number, dy: number): { vor: Point; quer: Point } {
  const len = Math.hypot(dx, dy) || 1
  const nx = dx / len
  const ny = dy / len
  // Richtungen, keine Orte: sie drehen mit dem Blick, wandern aber nicht mit
  const vor = dirToScreen(nx, ny)
  // 90 Grad gedreht auf dem Boden, nicht auf dem Bildschirm
  const quer = dirToScreen(ny, -nx)
  const vl = Math.hypot(vor.sx, vor.sy) || 1
  const ql = Math.hypot(quer.sx, quer.sy) || 1
  return { vor: scale(vor, 1 / vl), quer: scale(quer, 1 / ql) }
}

/** Die vier Ecken eines Rechtecks, das flach auf dem Boden liegt */
export function groundRect(
  mitte: Point,
  frame: { vor: Point; quer: Point },
  laenge: number,
  breite: number,
): [Point, Point, Point, Point] {
  const v = scale(frame.vor, laenge / 2)
  const q = scale(frame.quer, breite / 2)
  return [
    { sx: mitte.sx + v.sx + q.sx, sy: mitte.sy + v.sy + q.sy },
    { sx: mitte.sx + v.sx - q.sx, sy: mitte.sy + v.sy - q.sy },
    { sx: mitte.sx - v.sx - q.sx, sy: mitte.sy - v.sy - q.sy },
    { sx: mitte.sx - v.sx + q.sx, sy: mitte.sy - v.sy + q.sy },
  ]
}

/**
 * Ein Kasten, der auf dem Boden steht und in Fahrtrichtung zeigt: Deckel und die
 * beiden Seiten, die man sieht. Grundlage für Autos, Anhänger und Ladeflächen.
 */
export function groundBox(
  ctx: CanvasRenderingContext2D,
  mitte: Point,
  frame: { vor: Point; quer: Point },
  laenge: number,
  breite: number,
  hoehe: number,
  farbe: string,
  unten = 0,
): [Point, Point, Point, Point] {
  const boden = groundRect({ sx: mitte.sx, sy: mitte.sy - unten }, frame, laenge, breite)
  const deckel = boden.map((p) => lift(p, hoehe)) as [Point, Point, Point, Point]
  // Seiten nach ihrer Tiefe malen, damit die hintere nicht über der vorderen liegt
  const seiten: [Point, Point][] = [
    [boden[0], boden[1]],
    [boden[1], boden[2]],
    [boden[2], boden[3]],
    [boden[3], boden[0]],
  ]
  seiten
    .map((kante, index) => ({ kante, index, tiefe: (kante[0].sy + kante[1].sy) / 2 }))
    .sort((a, b) => a.tiefe - b.tiefe)
    .forEach(({ kante, index }) => {
      const dunkel = index === 1 || index === 2 ? -30 : -12
      quad(ctx, kante[0], kante[1], lift(kante[1], hoehe), lift(kante[0], hoehe), shade(farbe, dunkel))
    })
  quad(ctx, deckel[0], deckel[1], deckel[2], deckel[3], shade(farbe, 14))
  return deckel
}

/** Weicher Schatten unter einer Figur oder einem Fahrzeug */
export function bodenSchatten(ctx: CanvasRenderingContext2D, p: Point, rx: number, ry: number, staerke = 0.22): void {
  ctx.save()
  ctx.globalAlpha = staerke
  ctx.fillStyle = '#0b1424'
  ctx.beginPath()
  ctx.ellipse(p.sx, p.sy + 1, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/**
 * Ein Viereck nur in den laufenden Pfad legen, ohne zu füllen. So kommen viele
 * gleichfarbige Flächen – etwa alle Fenster einer Wand – mit einem einzigen
 * Füllbefehl aus. Das ist der Unterschied zwischen 25 und 60 Bildern je Sekunde.
 */
export function quadPath(ctx: CanvasRenderingContext2D, a: Point, b: Point, c: Point, d: Point): void {
  ctx.moveTo(a.sx, a.sy)
  ctx.lineTo(b.sx, b.sy)
  ctx.lineTo(c.sx, c.sy)
  ctx.lineTo(d.sx, d.sy)
  ctx.closePath()
}
