// Raumgeometrie für Gebäude: Grundrisse, Wände, Flächen im Raum. Häuser, Dächer und
// Zugaben rechnen alle hiermit – aus jedem Blickwinkel gleich.
import { lift, type Point } from './draw'
import { dirToScreen, drehRichtung, nachRechts, toScreen, zeigtNachVorn } from './iso'

/**
 * Die vier Seiten eines Grundrisses, fest an der Karte: n (kleines y), o (großes x),
 * s (großes y), w (kleines x). Eine Tür bleibt so an ihrer Wand, gleich wie man die
 * Stadt dreht – sie verschwindet höchstens auf die Rückseite.
 */
export type Seite = 'n' | 'o' | 's' | 'w'

export const SEITEN: Seite[] = ['n', 'o', 's', 'w']

/** Ein Grundriss in Kachelkoordinaten */
export type Grund = { x: number; y: number; w: number; h: number }

/** Außenrichtung jeder Seite auf der Karte */
export const NORMALE: Record<Seite, [number, number]> = { n: [0, -1], o: [1, 0], s: [0, 1], w: [-1, 0] }

/** Die vier Ecken eines Grundrisses, rundherum in fester Reihenfolge, auf gegebener Höhe */
export function umlauf(g: Grund, hoch = 0): [Point, Point, Point, Point] {
  return [
    lift(toScreen(g.x, g.y), hoch),
    lift(toScreen(g.x + g.w, g.y), hoch),
    lift(toScreen(g.x + g.w, g.y + g.h), hoch),
    lift(toScreen(g.x, g.y + g.h), hoch),
  ]
}

/** Schwerpunkt – die Mitte eines Dachs, gleich wie es gerade im Bild liegt */
export function schwerpunkt(punkte: Point[]): Point {
  let sx = 0
  let sy = 0
  for (const p of punkte) {
    sx += p.sx
    sy += p.sy
  }
  return { sx: sx / punkte.length, sy: sy / punkte.length }
}

/**
 * Eine Wand: ihre beiden Fußpunkte im Bild (links, rechts), ob sie zum Betrachter
 * zeigt, wie hell sie im Licht von rechts ist, wie weit vorn sie steht und in welche
 * Richtung "nach draußen" im Bild zeigt – für Markisen, Stufen und Kisten.
 * Dazu die beiden Fußpunkte auf der Karte, für alles, was an der Wand verankert ist.
 */
export type Wand = {
  seite: Seite
  a: Point
  b: Point
  sichtbar: boolean
  ton: number
  tiefe: number
  raus: Point
  /** Fußpunkte auf der Karte, in derselben Reihenfolge wie a und b */
  ka: { x: number; y: number }
  kb: { x: number; y: number }
}

export function waende(g: Grund, basis = 0): Record<Seite, Wand> {
  const [p0, p1, p2, p3] = umlauf(g, basis)
  const k0 = { x: g.x, y: g.y }
  const k1 = { x: g.x + g.w, y: g.y }
  const k2 = { x: g.x + g.w, y: g.y + g.h }
  const k3 = { x: g.x, y: g.y + g.h }
  const kanten: Record<Seite, [Point, Point, { x: number; y: number }, { x: number; y: number }]> = {
    n: [p0, p1, k0, k1],
    o: [p1, p2, k1, k2],
    s: [p2, p3, k2, k3],
    w: [p3, p0, k3, k0],
  }
  const out = {} as Record<Seite, Wand>
  for (const seite of SEITEN) {
    const [nx, ny] = NORMALE[seite]
    const [e0, e1, m0, m1] = kanten[seite]
    const links = e0.sx <= e1.sx
    const r = dirToScreen(nx, ny)
    const laenge = Math.hypot(r.sx, r.sy) || 1
    out[seite] = {
      seite,
      a: links ? e0 : e1,
      b: links ? e1 : e0,
      ka: links ? m0 : m1,
      kb: links ? m1 : m0,
      sichtbar: zeigtNachVorn(nx, ny),
      // Licht von rechts: nach rechts gewandte Wände sind heller
      ton: -35 + 17 * nachRechts(nx, ny),
      tiefe: (e0.sy + e1.sy) / 2,
      raus: { sx: r.sx / laenge, sy: r.sy / laenge },
    }
  }
  return out
}

// ---------- Flächen im Raum ----------

/** Ein Punkt im Raum: x und y in Kacheln, z in Bildpunkten über dem Boden */
export type P3 = { x: number; y: number; z: number }

/** So viele Bildpunkte Höhe entsprechen einer Kachellänge im Raum (2:1-Schrägsicht) */
const HOEHE_JE_KACHEL = 39.2

export const proj = (p: P3): Point => lift(toScreen(p.x, p.y), p.z)

/** Senkrechte einer ebenen Fläche aus drei ihrer Punkte. Welche Seite herauskommt, hängt
 * von der Reihenfolge ab – aussen() dreht sie verlässlich nach außen. */
export function normale3(a: P3, b: P3, c: P3): [number, number, number] {
  const ux = b.x - a.x
  const uy = b.y - a.y
  const uz = (b.z - a.z) / HOEHE_JE_KACHEL
  const vx = c.x - a.x
  const vy = c.y - a.y
  const vz = (c.z - a.z) / HOEHE_JE_KACHEL
  const nx = uy * vz - uz * vy
  const ny = uz * vx - ux * vz
  const nz = ux * vy - uy * vx
  const l = Math.hypot(nx, ny, nz) || 1
  return [nx / l, ny / l, nz / l]
}

/** Die Senkrechte so drehen, dass sie vom Mittelpunkt des Körpers weg zeigt */
export function aussen(n: [number, number, number], punkt: P3, mitte: P3): [number, number, number] {
  const dx = punkt.x - mitte.x
  const dy = punkt.y - mitte.y
  const dz = (punkt.z - mitte.z) / HOEHE_JE_KACHEL
  return n[0] * dx + n[1] * dy + n[2] * dz < 0 ? [-n[0], -n[1], -n[2]] : n
}

/** Schaut eine Fläche mit dieser Außenrichtung zum Betrachter? Blick von schräg oben (30°). */
export function sichtbar3(n: [number, number, number]): boolean {
  const d = drehRichtung(n[0], n[1])
  return 0.612 * (d.x + d.y) + 0.5 * n[2] > 1e-6
}

/** Helligkeit einer Fläche: Licht von rechts und von oben */
export function licht3(n: [number, number, number]): number {
  const waagrecht = Math.hypot(n[0], n[1])
  const rechts = waagrecht > 1e-6 ? nachRechts(n[0] / waagrecht, n[1] / waagrecht) * waagrecht : 0
  return -35 + 17 * rechts + 45 * Math.max(0, n[2])
}

/** Eine Fläche füllen – wenn sie zum Betrachter zeigt. Gibt zurück, ob sie gemalt wurde. */
export function flaeche3(
  ctx: CanvasRenderingContext2D,
  punkte: P3[],
  n: [number, number, number],
  farbe: string,
  shadeFn: (farbe: string, amount: number) => string,
  aufhellen = 0,
): boolean {
  if (!sichtbar3(n)) return false
  ctx.beginPath()
  punkte.forEach((p, i) => {
    const q = proj(p)
    if (i === 0) ctx.moveTo(q.sx, q.sy)
    else ctx.lineTo(q.sx, q.sy)
  })
  ctx.closePath()
  ctx.fillStyle = shadeFn(farbe, licht3(n) + aufhellen)
  ctx.fill()
  return true
}

/** Liegt die Kartenseite zum Betrachter hin? Dann steht dort Vorgelagertes vor dem Haus. */
export const seiteVorn = (seite: Seite): boolean => zeigtNachVorn(NORMALE[seite][0], NORMALE[seite][1])
