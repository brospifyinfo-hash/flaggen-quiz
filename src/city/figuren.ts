// Sonderbauten in derselben Sprache wie die übrigen Häuser: schattierte Wände,
// Fensterrahmen in der Wandebene, Ziegelreihen auf den Dachflächen. Die Silhouette
// bleibt erkennbar – ein Rad ist ein Rad, ein Apfel ein Apfel, eine Burg eine Burg.
import { buildingDef, footprint, type Figur, type Look } from './catalog'
import { fade, lift, mix, quad, quadPath, shade, wobble, ziegelReihen, type Point } from './draw'
import {
  aussen,
  licht3,
  NORMALE,
  normale3,
  proj,
  SEITEN,
  schwerpunkt,
  sichtbar3,
  umlauf,
  waende,
  type Grund,
  type P3,
  type Seite,
  type Wand,
} from './geo'
import { nachRechts, TILE_H, TILE_W, toScreen, zeigtNachVorn } from './iso'
import { fensterAn, fensterDunkel, leuchte, lichtJetzt } from './licht'
import type { Placed } from './types'

interface Los {
  x: number
  y: number
  w: number
  h: number
  time: number
  fein: boolean
}

interface Opt {
  basis?: number
  etagen?: number
  fugen?: boolean
  tuer?: boolean
  fein?: boolean
}

const HOCH: Record<Figur, number> = {
  riesenrad: 2.9,
  apfel: 1.75,
  schloss: 1.85,
  wal: 1.35,
  einhorn: 1.45,
  zwerg: 1.75,
  ufo: 1.5,
  pilz: 1.7,
  iglu: 1.3,
  jurte: 1.5,
  hausboot: 1.2,
  kopf: 2.2,
  rakete: 2.2,
  leuchtturm: 2.6,
  windrad: 2.9,
  flamingo: 1.65,
  moai: 1.75,
  drache: 1.45,
  roboter: 1.75,
  stuhl: 1.65,
  geist: 1.4,
  palme: 1.95,
  kaktus: 1.5,
  astronaut: 1.7,
  obelisk: 2.1,
}

const WEIT: Partial<Record<Figur, number>> = { riesenrad: 0.72, windrad: 0.9, wal: 0.62, drache: 0.62, palme: 0.58, ufo: 0.55 }

const STEIN = '#cfc6b6'
const DACHROT = '#8c2e2a'
const PUTZ = '#f4efe6'
const HOLZ = '#6b4423'
const GLAS_HELL = 'rgba(255,224,150,0.92)'

/** Welche Modellseite zur Tür zeigt. Drehen des Gebäudes rückt die Tür auf die nächste Wand. */
let bauRot = 0
const TUER_NACH: Seite[] = ['s', 'o', 'n', 'w']
const RING: Seite[] = ['n', 'o', 's', 'w']

function tuerWand(): Seite {
  return TUER_NACH[bauRot & 3]
}

function ring(seite: Seite, schritt: number): Seite {
  return RING[(RING.indexOf(seite) + schritt + 4) % 4]
}

interface F3 {
  pts: P3[]
  farbe: string
  /** Dünne Fläche, von beiden Seiten sichtbar: Speiche, Blatt, Flügel */
  duenn?: boolean
}

function mittelP(pts: P3[]): P3 {
  const n = pts.length || 1
  let x = 0
  let y = 0
  let z = 0
  for (const p of pts) {
    x += p.x
    y += p.y
    z += p.z
  }
  return { x: x / n, y: y / n, z: z / n }
}

/** Flächen eines Körpers, hinten zuerst, nur die zum Betrachter. */
function maleNetz(ctx: CanvasRenderingContext2D, netz: F3[], kern: P3): void {
  const liste: { pts: P3[]; farbe: string; sy: number }[] = []
  for (const f of netz) {
    if (f.pts.length < 3) continue
    const roh = normale3(f.pts[0], f.pts[1], f.pts[2])
    const m = mittelP(f.pts)
    let n = aussen(roh, m, kern)
    if (f.duenn && !sichtbar3(n)) n = [-n[0], -n[1], -n[2]]
    if (!sichtbar3(n)) continue
    liste.push({ pts: f.pts, farbe: shade(f.farbe, licht3(n)), sy: proj(m).sy })
  }
  liste.sort((a, b) => a.sy - b.sy)
  for (const f of liste) {
    ctx.beginPath()
    f.pts.forEach((p, i) => {
      const q = proj(p)
      if (i === 0) ctx.moveTo(q.sx, q.sy)
      else ctx.lineTo(q.sx, q.sy)
    })
    ctx.closePath()
    ctx.fillStyle = f.farbe
    ctx.fill()
  }
}

function kugelNetz(c: P3, rxy: number, rz: number, farbe: string, rings = 7, segs = 10): F3[] {
  const netz: F3[] = []
  const pkt = (i: number, j: number): P3 => {
    const v = (i / rings) * Math.PI
    const u = (j / segs) * Math.PI * 2
    const sr = Math.sin(v)
    return { x: c.x + Math.cos(u) * sr * rxy, y: c.y + Math.sin(u) * sr * rxy, z: c.z + Math.cos(v) * rz }
  }
  for (let i = 0; i < rings; i++) {
    const ton = i < 2 ? shade(farbe, 28) : i > rings - 3 ? shade(farbe, -36) : farbe
    for (let j = 0; j < segs; j++) {
      netz.push({ pts: [pkt(i, j), pkt(i, j + 1), pkt(i + 1, j + 1), pkt(i + 1, j)], farbe: ton })
    }
  }
  return netz
}

function dreh90(x: number, y: number, rot: number): { x: number; y: number } {
  const r = rot & 3
  if (r === 1) return { x: y, y: -x }
  if (r === 2) return { x: -x, y: -y }
  if (r === 3) return { x: -y, y: x }
  return { x, y }
}

/** Senkrechtes Rad in der Karte: von vorn ein Kreis, von der Seite eine Kante. */
function radNetz(cx: number, cy: number, cz: number, radius: number, farbe: string, phase: number): F3[] {
  const nrm = dreh90(Math.SQRT1_2, Math.SQRT1_2, bauRot)
  const u = { x: -nrm.y, y: nrm.x }
  const px = 45
  const dick = 0.045
  const seg = 18
  const netz: F3[] = []
  const punkt = (winkel: number, radial: number, seite: number): P3 => ({
    x: cx + u.x * radial * Math.cos(winkel) + nrm.x * seite,
    y: cy + u.y * radial * Math.cos(winkel) + nrm.y * seite,
    z: cz + radial * px * Math.sin(winkel),
  })
  for (let i = 0; i < seg; i++) {
    const a0 = phase + (i / seg) * Math.PI * 2
    const a1 = phase + ((i + 1) / seg) * Math.PI * 2
    const innen = radius * 0.84
    netz.push({ pts: [punkt(a0, radius, dick), punkt(a1, radius, dick), punkt(a1, radius, -dick), punkt(a0, radius, -dick)], farbe })
    netz.push({
      pts: [punkt(a0, innen, -dick), punkt(a1, innen, -dick), punkt(a1, innen, dick), punkt(a0, innen, dick)],
      farbe: shade(farbe, -25),
    })
    netz.push({ pts: [punkt(a0, innen, dick), punkt(a1, innen, dick), punkt(a1, radius, dick), punkt(a0, radius, dick)], farbe: shade(farbe, 12) })
    netz.push({
      pts: [punkt(a0, radius, -dick), punkt(a1, radius, -dick), punkt(a1, innen, -dick), punkt(a0, innen, -dick)],
      farbe: shade(farbe, -12),
    })
  }
  for (let i = 0; i < 8; i++) {
    const a = phase + (i / 8) * Math.PI * 2
    netz.push({
      pts: [punkt(a - 0.05, 0.08, 0.01), punkt(a + 0.05, 0.08, 0.01), punkt(a + 0.03, radius * 0.84, 0.01), punkt(a - 0.03, radius * 0.84, 0.01)],
      farbe: '#c9a227',
      duenn: true,
    })
  }
  return netz
}

function scheibeNetz(cx: number, cy: number, z: number, r: number, dicke: number, farbe: string): F3[] {
  const seg = 14
  const netz: F3[] = []
  const rand = (a: number, zz: number): P3 => ({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, z: zz })
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2
    const a1 = ((i + 1) / seg) * Math.PI * 2
    netz.push({ pts: [rand(a0, z), rand(a1, z), rand(a1, z + dicke), rand(a0, z + dicke)], farbe })
    netz.push({ pts: [rand(a0, z + dicke), rand(a1, z + dicke), { x: cx, y: cy, z: z + dicke }], farbe: shade(farbe, 16) })
    netz.push({ pts: [{ x: cx, y: cy, z }, rand(a1, z), rand(a0, z)], farbe: shade(farbe, -22) })
  }
  return netz
}

/** Drei Flügel in derselben senkrechten Ebene wie das Riesenrad. */
function fluegelNetz(cx: number, cy: number, cz: number, laenge: number, farbe: string, phase: number): F3[] {
  const nrm = dreh90(Math.SQRT1_2, Math.SQRT1_2, bauRot)
  const u = { x: -nrm.y, y: nrm.x }
  const px = 45
  const netz: F3[] = []
  const punkt = (winkel: number, radial: number, seite: number): P3 => ({
    x: cx + u.x * radial * Math.cos(winkel) + nrm.x * seite,
    y: cy + u.y * radial * Math.cos(winkel) + nrm.y * seite,
    z: cz + radial * px * Math.sin(winkel),
  })
  for (let i = 0; i < 3; i++) {
    const a = phase + (i * 2 * Math.PI) / 3
    netz.push({
      pts: [punkt(a - 0.16, 0.05, 0.04), punkt(a + 0.07, 0.05, 0.04), punkt(a + 0.03, laenge, 0.04), punkt(a - 0.05, laenge, 0.04)],
      farbe,
      duenn: true,
    })
    netz.push({
      pts: [punkt(a - 0.16, 0.05, -0.04), punkt(a - 0.16, 0.05, 0.04), punkt(a - 0.05, laenge, 0.04), punkt(a - 0.05, laenge, -0.04)],
      farbe,
    })
    netz.push({
      pts: [punkt(a + 0.07, 0.05, -0.04), punkt(a + 0.03, laenge, -0.04), punkt(a + 0.03, laenge, 0.04), punkt(a + 0.07, 0.05, 0.04)],
      farbe,
    })
  }
  return netz
}

/** Achsenparalleler Klotz. Der Kern des Netzes muss im Körper liegen, sonst dreht aussen() die Flächen um. */
function quaderNetz(x: number, y: number, z: number, w: number, h: number, hoch: number, farbe: string): F3[] {
  const p = (ix: number, iy: number, iz: number): P3 => ({ x: x + ix * w, y: y + iy * h, z: z + iz * hoch })
  return [
    { pts: [p(0, 0, 0), p(1, 0, 0), p(1, 0, 1), p(0, 0, 1)], farbe },
    { pts: [p(1, 0, 0), p(1, 1, 0), p(1, 1, 1), p(1, 0, 1)], farbe },
    { pts: [p(1, 1, 0), p(0, 1, 0), p(0, 1, 1), p(1, 1, 1)], farbe },
    { pts: [p(0, 1, 0), p(0, 0, 0), p(0, 0, 1), p(0, 1, 1)], farbe },
    { pts: [p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1)], farbe },
    { pts: [p(0, 0, 0), p(0, 1, 0), p(1, 1, 0), p(1, 0, 0)], farbe },
  ]
}

/** Halbbogen in der YZ-Ebene, Dicke entlang X. Für Rippen. */
function rippe(x: number, y: number, z0: number, breit: number, hoehe: number, farbe: string): F3[] {
  const seg = 5
  const dick = 0.028
  const netz: F3[] = []
  const p = (i: number, seite: number): P3 => {
    const ang = Math.PI * (1 - i / seg)
    return { x: x + seite, y: y + Math.cos(ang) * breit, z: z0 + Math.sin(ang) * hoehe }
  }
  for (let i = 0; i < seg; i++) {
    netz.push({ pts: [p(i, -dick), p(i + 1, -dick), p(i + 1, dick), p(i, dick)], farbe })
  }
  return netz
}

/** Wie hoch die Figur über dem Boden reicht, in Bildpunkten. Für Umriss und Vorschau. */
export function figurHoehe(w: number, h: number, figur: Figur): number {
  return Math.max(w, h) * TILE_H * HOCH[figur]
}

export function figurUmriss(placed: Placed, look: Look): Point[] | null {
  if (!look.figur) return null
  const def = buildingDef(placed.type)
  if (!def) return null
  const [w, h] = footprint(def, placed.rot)
  const g: Grund = { x: placed.x, y: placed.y, w, h }
  const m = toScreen(placed.x + w / 2, placed.y + h / 2)
  const hoch = figurHoehe(w, h, look.figur)
  const breit = Math.max(w, h) * TILE_W * (WEIT[look.figur] ?? 0.42)
  return [
    ...umlauf(g),
    { sx: m.sx - breit, sy: m.sy - hoch },
    { sx: m.sx + breit, sy: m.sy - hoch },
    { sx: m.sx, sy: m.sy - hoch },
  ]
}

export function zeichneFigur(
  ctx: CanvasRenderingContext2D,
  placed: Placed,
  look: Look,
  time: number,
  fein: boolean,
): boolean {
  if (!look.figur) return false
  const def = buildingDef(placed.type)
  if (!def) return false
  const [w, h] = footprint(def, placed.rot)
  bauRot = ((placed.rot % 4) + 4) % 4
  const m = toScreen(placed.x + w / 2, placed.y + h / 2)
  ctx.save()
  ctx.globalAlpha = 0.16
  ctx.fillStyle = '#0b1424'
  ctx.beginPath()
  ctx.ellipse(m.sx, m.sy + 1, Math.max(8, Math.max(w, h) * 11), Math.max(3, Math.max(w, h) * 4.5), 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  MALER[look.figur](ctx, { x: placed.x, y: placed.y, w, h, time, fein })
  return true
}

function feld(los: Los, x: number, y: number, w: number, h: number): Grund {
  return { x: los.x + x, y: los.y + y, w, h }
}

function waendeVon(g: Grund, basis = 0): Wand[] {
  const seiten = waende(g, basis)
  return SEITEN.filter((seite) => seiten[seite].sichtbar)
    .sort((a, b) => seiten[a].tiefe - seiten[b].tiefe)
    .map((seite) => seiten[seite])
}

function wandTon(wand: Wand): number {
  return wand.ton * 0.72
}

function platte(ctx: CanvasRenderingContext2D, g: Grund, farbe: string, hoch = 0): void {
  const e = umlauf(g, hoch)
  quad(ctx, e[0], e[1], e[2], e[3], farbe)
}

function kasten(ctx: CanvasRenderingContext2D, g: Grund, hoehe: number, farbe: string, opt: Opt = {}): void {
  if (g.w < 0.04 || g.h < 0.04 || hoehe < 1) return
  const basis = opt.basis ?? 0
  const tuere = opt.tuer ? tuerWand() : null
  const liste = waendeVon(g, basis)
  liste.forEach((wand) => wandMalen(ctx, wand, hoehe, farbe, opt, wand.seite === tuere))
  const top = umlauf(g, basis + hoehe)
  quad(ctx, top[0], top[1], top[2], top[3], shade(farbe, 18))
}

/** Eine Wand mit Sockel, Fugen und Fenstern, die in der Wandebene liegen. */
function wandMalen(
  ctx: CanvasRenderingContext2D,
  wand: Wand,
  hoehe: number,
  farbe: string,
  opt: Opt,
  vorn: boolean,
): void {
  const ton = wandTon(wand)
  quad(ctx, wand.a, wand.b, lift(wand.b, hoehe), lift(wand.a, hoehe), shade(farbe, ton))
  const sockel = Math.min(5, hoehe * 0.22)
  if (hoehe > 8) quad(ctx, wand.a, wand.b, lift(wand.b, sockel), lift(wand.a, sockel), shade(farbe, ton - 24))

  const fein = opt.fein !== false
  const laenge = Math.hypot(wand.b.sx - wand.a.sx, wand.b.sy - wand.a.sy)
  if (fein && opt.fugen && hoehe > 12) {
    const reihen = Math.max(2, Math.floor(hoehe / 7))
    ctx.beginPath()
    ctx.strokeStyle = fade('#2a241c', 0.28)
    ctx.lineWidth = 0.7
    for (let i = 1; i < reihen; i++) {
      const h = (hoehe * i) / reihen
      const p = lift(wand.a, h)
      const q = lift(wand.b, h)
      ctx.moveTo(p.sx, p.sy)
      ctx.lineTo(q.sx, q.sy)
    }
    ctx.stroke()
  }

  const etagen = opt.etagen ?? 0
  if (fein && etagen > 0 && hoehe > 14 && laenge > 11) {
    const reihen = Math.min(etagen, Math.max(1, Math.floor((hoehe - sockel) / 13)))
    const spalten = Math.max(1, Math.round(laenge / 16))
    const winH = Math.min(8, ((hoehe - sockel) / reihen) * 0.46)
    type F = { p0: Point; p1: Point; an: boolean }
    const fenster: F[] = []
    for (let row = 0; row < reihen; row++) {
      const z = sockel + ((hoehe - sockel) * (row + 0.62)) / reihen
      for (let col = 0; col < spalten; col++) {
        // Rückseite: unten geschlossen, Fenster erst ab dem ersten Obergeschoss
        if (opt.tuer && wand.seite === ring(tuerWand(), 2) && row === 0) continue
        if (vorn && opt.tuer && row === 0 && Math.abs((col + 0.5) / spalten - 0.5) < 0.28) continue
        const t = (col + 0.5) / spalten
        const halb = 0.34 / spalten
        fenster.push({
          p0: lift(mix(wand.a, wand.b, t - halb), z),
          p1: lift(mix(wand.a, wand.b, t + halb), z),
          an: fensterAn(wobble(wand.ka.x * 17 + wand.ka.y * 9, row * 5 + col * 3 + wand.seite.charCodeAt(0))),
        })
      }
    }
    if (fenster.length > 0) fensterMalen(ctx, fenster, winH, farbe)
    // Die Seite neben der Tür hat Läden, die gegenüberliegende bleibt unten geschlossen
    if (opt.tuer && wand.seite === ring(tuerWand(), 1)) {
      for (const f of fenster) {
        const a = mix(f.p0, f.p1, -0.55)
        const b = mix(f.p0, f.p1, -0.08)
        const c = mix(f.p0, f.p1, 1.08)
        const d = mix(f.p0, f.p1, 1.55)
        quad(ctx, a, b, lift(b, winH), lift(a, winH), '#6d3b22')
        quad(ctx, c, d, lift(d, winH), lift(c, winH), '#6d3b22')
      }
    }
    if (reihen > 1) {
      ctx.strokeStyle = fade('#ffffff', 0.1)
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let row = 1; row < reihen; row++) {
        const z = sockel + ((hoehe - sockel) * row) / reihen
        const p = lift(wand.a, z)
        const q = lift(wand.b, z)
        ctx.moveTo(p.sx, p.sy)
        ctx.lineTo(q.sx, q.sy)
      }
      ctx.stroke()
    }
  }

  if (vorn && opt.tuer && laenge > 14) tuer(ctx, wand, Math.min(13, hoehe * 0.58))
}

function fensterMalen(ctx: CanvasRenderingContext2D, fenster: { p0: Point; p1: Point; an: boolean }[], winH: number, farbe: string): void {
  const licht = lichtJetzt()
  ctx.beginPath()
  for (const f of fenster) {
    const r0 = { sx: f.p0.sx - 0.8, sy: f.p0.sy + 1.15 }
    const r1 = { sx: f.p1.sx + 0.8, sy: f.p1.sy + 1.15 }
    quadPath(ctx, r0, r1, lift(r1, winH + 2.2), lift(r0, winH + 2.2))
  }
  ctx.fillStyle = shade(farbe, 28)
  ctx.fill()

  for (const an of [true, false]) {
    const gruppe = fenster.filter((f) => f.an === an)
    if (gruppe.length === 0) continue
    ctx.beginPath()
    for (const f of gruppe) quadPath(ctx, f.p0, f.p1, lift(f.p1, winH), lift(f.p0, winH))
    ctx.fillStyle = an ? GLAS_HELL : fensterDunkel(licht)
    ctx.fill()
    if (an && licht.nacht > 0.05) {
      const hof = fade(GLAS_HELL, 0.16 + licht.nacht * 0.14)
      leuchte((c) => {
        c.beginPath()
        for (const f of gruppe) quadPath(c, f.p0, f.p1, lift(f.p1, winH), lift(f.p0, winH))
        c.strokeStyle = hof
        c.lineWidth = 3
        c.stroke()
        c.fillStyle = GLAS_HELL
        c.fill()
      })
    }
  }

  ctx.beginPath()
  for (const f of fenster) {
    const halb = mix(f.p0, f.p1, 0.5)
    quadPath(ctx, lift(f.p0, winH * 0.55), lift(halb, winH * 0.55), lift(halb, winH), lift(f.p0, winH))
  }
  ctx.fillStyle = fade('#ffffff', 0.2 * (1 - licht.nacht * 0.65))
  ctx.fill()

  ctx.beginPath()
  for (const f of fenster) {
    const m0 = mix(f.p0, f.p1, 0.46)
    const m1 = mix(f.p0, f.p1, 0.54)
    quadPath(ctx, m0, m1, lift(m1, winH), lift(m0, winH))
  }
  ctx.fillStyle = fade('#1b2132', 0.4)
  ctx.fill()

  ctx.beginPath()
  for (const f of fenster) quadPath(ctx, lift(f.p0, -1.5), lift(f.p1, -1.5), f.p1, f.p0)
  ctx.fillStyle = shade(farbe, 34)
  ctx.fill()
}

function tuer(ctx: CanvasRenderingContext2D, wand: Wand, hoehe: number): void {
  const a = mix(wand.a, wand.b, 0.36)
  const b = mix(wand.a, wand.b, 0.64)
  const ra = mix(wand.a, wand.b, 0.3)
  const rb = mix(wand.a, wand.b, 0.7)
  quad(ctx, ra, rb, lift(rb, hoehe + 2), lift(ra, hoehe + 2), '#3d2918')
  quad(ctx, a, b, lift(b, hoehe), lift(a, hoehe), HOLZ)
  quad(
    ctx,
    lift(mix(a, b, 0.16), hoehe * 0.18),
    lift(mix(a, b, 0.84), hoehe * 0.18),
    lift(mix(a, b, 0.84), hoehe * 0.72),
    lift(mix(a, b, 0.16), hoehe * 0.72),
    '#8a5a32',
  )
  const klinke = lift(mix(a, b, 0.78), hoehe * 0.46)
  ctx.fillStyle = '#e6c15a'
  ctx.beginPath()
  ctx.arc(klinke.sx, klinke.sy, 1.15, 0, Math.PI * 2)
  ctx.fill()
  const s0 = mix(wand.a, wand.b, 0.3)
  const s1 = mix(wand.a, wand.b, 0.7)
  const vor = { sx: wand.raus.sx * 4, sy: wand.raus.sy * 4 }
  quad(ctx, s0, s1, { sx: s1.sx + vor.sx, sy: s1.sy + vor.sy }, { sx: s0.sx + vor.sx, sy: s0.sy + vor.sy }, '#d5d0c6')
}

/** Satteldach mit First und Ziegelreihen, First entlang der längeren Seite. */
function sattel(ctx: CanvasRenderingContext2D, g: Grund, basis: number, rise: number, farbe: string, fein: boolean, kopf = false): void {
  const u = 0.045
  const r: Grund = { x: g.x - u, y: g.y - u, w: g.w + 2 * u, h: g.h + 2 * u }
  const traufe = kopf ? basis : basis
  const firstH = kopf ? basis - rise : basis + rise
  const [c0, c1, c2, c3] = umlauf(r, traufe)
  const laengsX = g.w >= g.h
  const f1 = laengsX
    ? lift(toScreen(r.x, r.y + r.h / 2), firstH)
    : lift(toScreen(r.x + r.w / 2, r.y), firstH)
  const f2 = laengsX
    ? lift(toScreen(r.x + r.w, r.y + r.h / 2), firstH)
    : lift(toScreen(r.x + r.w / 2, r.y + r.h), firstH)

  type Schraege = { punkte: [Point, Point, Point, Point]; n: [number, number]; traufe: [Point, Point] }
  const schraegen: Schraege[] = laengsX
    ? [
        { punkte: [c0, c1, f2, f1], n: [0, -1], traufe: [c0, c1] },
        { punkte: [c3, c2, f2, f1], n: [0, 1], traufe: [c3, c2] },
      ]
    : [
        { punkte: [c0, c3, f2, f1], n: [-1, 0], traufe: [c0, c3] },
        { punkte: [c1, c2, f2, f1], n: [1, 0], traufe: [c1, c2] },
      ]
  const giebel: { punkte: [Point, Point, Point]; n: [number, number]; first: Point }[] = laengsX
    ? [
        { punkte: [c0, c3, f1], n: [-1, 0], first: f1 },
        { punkte: [c1, c2, f2], n: [1, 0], first: f2 },
      ]
    : [
        { punkte: [c0, c1, f1], n: [0, -1], first: f1 },
        { punkte: [c3, c2, f2], n: [0, 1], first: f2 },
      ]

  schraegen.sort((a, b) => schwerpunkt(a.punkte).sy - schwerpunkt(b.punkte).sy)
  for (const flaeche of schraegen) {
    const [p0, p1, p2, p3] = flaeche.punkte
    quad(ctx, p0, p1, p2, p3, shade(farbe, -7 + 19 * nachRechts(flaeche.n[0], flaeche.n[1])))
    if (fein) {
      ctx.save()
      ctx.beginPath()
      quadPath(ctx, p0, p1, p2, p3)
      ctx.clip()
      ziegelReihen(ctx, flaeche.traufe[0], flaeche.traufe[1], f1, f2)
      ctx.restore()
    }
  }

  for (const g3 of giebel) {
    if (!zeigtNachVorn(g3.n[0], g3.n[1])) continue
    ctx.beginPath()
    ctx.moveTo(g3.punkte[0].sx, g3.punkte[0].sy)
    ctx.lineTo(g3.punkte[1].sx, g3.punkte[1].sy)
    ctx.lineTo(g3.punkte[2].sx, g3.punkte[2].sy)
    ctx.closePath()
    ctx.fillStyle = shade(PUTZ, -8 + 8 * nachRechts(g3.n[0], g3.n[1]))
    ctx.fill()
    if (!fein || rise < 11) continue
    const links = mix(mix(g3.punkte[0], g3.punkte[1], 0.4), g3.punkte[2], 0.3)
    const rechts = mix(mix(g3.punkte[0], g3.punkte[1], 0.6), g3.punkte[2], 0.3)
    const linksO = mix(mix(g3.punkte[0], g3.punkte[1], 0.44), g3.punkte[2], 0.52)
    const rechtsO = mix(mix(g3.punkte[0], g3.punkte[1], 0.56), g3.punkte[2], 0.52)
    quad(ctx, links, rechts, rechtsO, linksO, '#243044')
    ctx.fillStyle = fade('#ffffff', 0.35)
    ctx.fillRect(links.sx, Math.min(links.sy, linksO.sy), 1.2, 2)
  }

  if (fein) {
    ctx.strokeStyle = fade('#ffffff', 0.32)
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(f1.sx, f1.sy)
    ctx.lineTo(f2.sx, f2.sy)
    ctx.stroke()
  }
}

/** Balkon an einer festen Kartenseite, nicht an der Seite, die gerade zur Kamera zeigt. */
function balkonAn(ctx: CanvasRenderingContext2D, g: Grund, basis: number, wandH: number, seite: Seite): void {
  if (wandH < 14 || Math.min(g.w, g.h) < 0.22) return
  const tiefe = 0.11
  const slab: Grund =
    seite === 's'
      ? { x: g.x + g.w * 0.2, y: g.y + g.h - 0.01, w: g.w * 0.6, h: tiefe }
      : seite === 'n'
        ? { x: g.x + g.w * 0.2, y: g.y - tiefe + 0.01, w: g.w * 0.6, h: tiefe }
        : seite === 'o'
          ? { x: g.x + g.w - 0.01, y: g.y + g.h * 0.2, w: tiefe, h: g.h * 0.6 }
          : { x: g.x - tiefe + 0.01, y: g.y + g.h * 0.2, w: tiefe, h: g.h * 0.6 }
  const z = basis + wandH * 0.46
  kasten(ctx, slab, 3, '#d9d3c8', { basis: z, etagen: 0, fein: true })
}

function haus(
  ctx: CanvasRenderingContext2D,
  g: Grund,
  wandH: number,
  wandF: string,
  dachF: string,
  opt: Opt & { rise?: number; schlot?: boolean; time?: number; kopf?: boolean },
): void {
  const basis = opt.basis ?? 0
  const seite = opt.tuer ? ring(tuerWand(), 3) : null
  const zuerst = seite ? !zeigtNachVorn(NORMALE[seite][0], NORMALE[seite][1]) : false
  if (seite && zuerst) balkonAn(ctx, g, basis, wandH, seite)
  kasten(ctx, g, wandH, wandF, opt)
  const dachBasis = basis + wandH
  sattel(ctx, g, dachBasis, opt.rise ?? Math.min(TILE_H * 0.55, wandH * 0.7), dachF, opt.fein !== false, opt.kopf)
  if (opt.schlot) schlot(ctx, { x: g.x + g.w * 0.68, y: g.y + g.h * 0.22, w: 0.1, h: 0.1 }, dachBasis, opt.time ?? 0, opt.fein !== false)
  if (seite && !zuerst) balkonAn(ctx, g, basis, wandH, seite)
}

function schlot(ctx: CanvasRenderingContext2D, g: Grund, basis: number, time: number, fein: boolean): void {
  kasten(ctx, g, 10, '#7a5644', { basis, etagen: 0, fugen: true, fein })
  const kappe = umlauf({ x: g.x - 0.012, y: g.y - 0.012, w: g.w + 0.024, h: g.h + 0.024 }, basis + 10)
  quad(ctx, kappe[0], kappe[1], kappe[2], kappe[3], '#3e2a22')
  if (!fein) return
  const p = lift(schwerpunkt(umlauf(g)), basis + 10)
  ctx.save()
  for (let i = 0; i < 3; i++) {
    const phase = (time * 0.5 + i / 3) % 1
    ctx.globalAlpha = (1 - phase) * 0.38
    ctx.fillStyle = '#e7eef6'
    ctx.beginPath()
    ctx.arc(p.sx + Math.sin(phase * 5 + i) * 2.4, p.sy - 3 - phase * 12, 1.6 + phase * 2.2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** Kegel mit Ziegelreihen, die zur Spitze zusammenlaufen. */
function kegel(
  ctx: CanvasRenderingContext2D,
  g: Grund,
  basis: number,
  hoehe: number,
  farbe: string,
  fein: boolean,
  knauf = '#e6c15a',
): Point {
  const liste = waendeVon(g, basis)
  const spitze = lift(schwerpunkt(umlauf(g, basis)), hoehe)
  for (const wand of liste) {
    const [nx, ny] = NORMALE[wand.seite]
    ctx.beginPath()
    ctx.moveTo(wand.a.sx, wand.a.sy)
    ctx.lineTo(wand.b.sx, wand.b.sy)
    ctx.lineTo(spitze.sx, spitze.sy)
    ctx.closePath()
    ctx.fillStyle = shade(farbe, -7 + 19 * nachRechts(nx, ny))
    ctx.fill()
    if (!fein) continue
    ctx.save()
    ctx.clip()
    ziegelReihen(ctx, wand.a, wand.b, spitze, spitze)
    ctx.restore()
    ctx.strokeStyle = fade('#ffffff', 0.22)
    ctx.lineWidth = 0.8
    ctx.beginPath()
    const m = mix(wand.a, wand.b, 0.5)
    ctx.moveTo(m.sx, m.sy)
    ctx.lineTo(spitze.sx, spitze.sy)
    ctx.stroke()
  }
  ctx.fillStyle = knauf
  ctx.beginPath()
  ctx.arc(spitze.sx, spitze.sy, 2.2, 0, Math.PI * 2)
  ctx.fill()
  return spitze
}

function band(ctx: CanvasRenderingContext2D, g: Grund, von: number, dicke: number, farbe: string): void {
  for (const wand of waendeVon(g, von)) {
    quad(ctx, wand.a, wand.b, lift(wand.b, dicke), lift(wand.a, dicke), farbe)
  }
}

function fachwerk(ctx: CanvasRenderingContext2D, g: Grund, hoehe: number, basis = 0): void {
  ctx.save()
  ctx.strokeStyle = '#4a2e22'
  ctx.lineWidth = 1.15
  ctx.lineCap = 'square'
  for (const wand of waendeVon(g, basis)) {
    const o = lift(wand.a, hoehe)
    const p = lift(wand.b, hoehe)
    ctx.beginPath()
    ctx.moveTo(wand.a.sx, wand.a.sy)
    ctx.lineTo(o.sx, o.sy)
    ctx.lineTo(p.sx, p.sy)
    ctx.lineTo(wand.b.sx, wand.b.sy)
    const mit = mix(wand.a, wand.b, 0.5)
    const mitO = lift(mit, hoehe)
    ctx.moveTo(mit.sx, mit.sy)
    ctx.lineTo(mitO.sx, mitO.sy)
    ctx.moveTo(wand.a.sx, wand.a.sy)
    ctx.lineTo(p.sx, p.sy)
    ctx.stroke()
  }
  ctx.restore()
}

function markise(ctx: CanvasRenderingContext2D, g: Grund, hoehe: number, farbe: string): void {
  const front = waende(g, hoehe)[tuerWand()]
  if (!front.sichtbar) return
  const a = mix(front.a, front.b, 0.06)
  const b = mix(front.a, front.b, 0.94)
  const vor = front.raus
  const a2 = { sx: a.sx + vor.sx * 12, sy: a.sy + vor.sy * 12 - 4 }
  const b2 = { sx: b.sx + vor.sx * 12, sy: b.sy + vor.sy * 12 - 4 }
  quad(ctx, a, b, b2, a2, farbe)
  ctx.save()
  ctx.beginPath()
  quadPath(ctx, a, b, b2, a2)
  ctx.clip()
  ctx.strokeStyle = fade('#ffffff', 0.7)
  ctx.lineWidth = 2.2
  ctx.beginPath()
  for (let i = 1; i < 6; i++) {
    const p = mix(a, b, i / 6)
    const q = mix(a2, b2, i / 6)
    ctx.moveTo(p.sx, p.sy)
    ctx.lineTo(q.sx, q.sy)
  }
  ctx.stroke()
  ctx.restore()
}

function bogen(ctx: CanvasRenderingContext2D, wand: Wand, basis: number, breite: number, hoehe: number, farbe: string): void {
  const links = lift(mix(wand.a, wand.b, 0.5 - breite), basis)
  const rechts = lift(mix(wand.a, wand.b, 0.5 + breite), basis)
  ctx.beginPath()
  ctx.moveTo(links.sx, links.sy)
  ctx.lineTo(rechts.sx, rechts.sy)
  for (let i = 0; i <= 8; i++) {
    const winkel = (i / 8) * Math.PI
    const q = lift(mix(links, rechts, 0.5 + Math.cos(winkel) / 2), Math.sin(winkel) * hoehe)
    ctx.lineTo(q.sx, q.sy)
  }
  ctx.closePath()
  ctx.fillStyle = farbe
  ctx.fill()
}

function banner(ctx: CanvasRenderingContext2D, anker: Point, time: number, farbe: string, salz: number): void {
  const weht = Math.sin(time * 2.4 + salz) * 3.5
  ctx.strokeStyle = '#efe6d4'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(anker.sx, anker.sy)
  ctx.lineTo(anker.sx, anker.sy - 18)
  ctx.stroke()
  ctx.fillStyle = '#e6c15a'
  ctx.beginPath()
  ctx.arc(anker.sx, anker.sy - 18, 1.8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = farbe
  ctx.beginPath()
  ctx.moveTo(anker.sx, anker.sy - 16)
  ctx.quadraticCurveTo(anker.sx + 8, anker.sy - 13 + weht, anker.sx + 14, anker.sy - 15 + weht)
  ctx.lineTo(anker.sx + 11, anker.sy - 10 + weht * 0.4)
  ctx.lineTo(anker.sx + 14, anker.sy - 6 + weht)
  ctx.quadraticCurveTo(anker.sx + 7, anker.sy - 8 - weht * 0.3, anker.sx, anker.sy - 6)
  ctx.closePath()
  ctx.fill()
}

function oval(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, farbe: string): void {
  ctx.beginPath()
  ctx.ellipse(x, y, Math.max(0.4, rx), Math.max(0.4, ry), 0, 0, Math.PI * 2)
  ctx.fillStyle = farbe
  ctx.fill()
}

function oben(g: Grund, z: number): Point {
  return lift(schwerpunkt(umlauf(g)), z)
}

// ---------- Schloss ----------

function mauerwerk(ctx: CanvasRenderingContext2D, g: Grund, hoehe: number, farbe: string, scharten: number, basis = 0): void {
  const liste = waendeVon(g, basis)
  for (const wand of liste) {
    const ton = wandTon(wand)
    quad(ctx, wand.a, wand.b, lift(wand.b, hoehe), lift(wand.a, hoehe), shade(farbe, ton))
    const sockel = Math.min(7, hoehe * 0.14)
    if (hoehe > 10) quad(ctx, wand.a, wand.b, lift(wand.b, sockel), lift(wand.a, sockel), shade(farbe, ton - 22))
    const reihen = Math.max(2, Math.floor(hoehe / 8))
    ctx.beginPath()
    ctx.strokeStyle = fade('#2a241c', 0.32)
    ctx.lineWidth = 0.7
    for (let i = 1; i < reihen; i++) {
      const h = (hoehe * i) / reihen
      const p = lift(wand.a, h)
      const q = lift(wand.b, h)
      ctx.moveTo(p.sx, p.sy)
      ctx.lineTo(q.sx, q.sy)
      if (i % 2 === 0) {
        const n = Math.max(1, Math.round(Math.hypot(q.sx - p.sx, q.sy - p.sy) / 9))
        for (let k = 1; k < n; k++) {
          const f = mix(p, q, k / n)
          ctx.moveTo(f.sx, f.sy)
          ctx.lineTo(f.sx, f.sy + 3.2)
        }
      }
    }
    ctx.stroke()
    if (scharten <= 0 || hoehe < 20) continue
    const zeilen = hoehe > TILE_H * 1.6 ? [0.4, 0.68] : [0.55]
    for (const anteil of zeilen) {
      for (let i = 0; i < scharten; i++) {
        const t = (i + 0.5) / scharten
        const fuss = hoehe * anteil
        const links = lift(mix(wand.a, wand.b, t - 0.015), fuss)
        const rechts = lift(mix(wand.a, wand.b, t + 0.015), fuss)
        quad(ctx, links, rechts, lift(rechts, 8), lift(links, 8), '#141820')
        const spitze = lift(mix(wand.a, wand.b, t), fuss + 12)
        ctx.beginPath()
        ctx.moveTo(lift(links, 8).sx, lift(links, 8).sy)
        ctx.lineTo(spitze.sx, spitze.sy)
        ctx.lineTo(lift(rechts, 8).sx, lift(rechts, 8).sy)
        ctx.closePath()
        ctx.fillStyle = '#141820'
        ctx.fill()
      }
    }
  }
  const top = umlauf(g, basis + hoehe)
  quad(ctx, top[0], top[1], top[2], top[3], shade(farbe, 16))
}

function zinnen(ctx: CanvasRenderingContext2D, g: Grund, hoehe: number, farbe: string): void {
  for (const wand of waendeVon(g, hoehe)) {
    const laenge = Math.hypot(wand.b.sx - wand.a.sx, wand.b.sy - wand.a.sy)
    const n = Math.max(3, Math.round(laenge / 8))
    for (let i = 0; i < n; i++) {
      if (i % 2 === 1) continue
      const a = mix(wand.a, wand.b, i / n)
      const b = mix(wand.a, wand.b, (i + 0.62) / n)
      const obenA = lift(a, 7)
      const obenB = lift(b, 7)
      const raus = wand.raus
      quad(ctx, a, b, obenB, obenA, shade(farbe, wandTon(wand)))
      quad(
        ctx,
        obenA,
        obenB,
        { sx: obenB.sx + raus.sx * 3.5, sy: obenB.sy + raus.sy * 3.5 },
        { sx: obenA.sx + raus.sx * 3.5, sy: obenA.sy + raus.sy * 3.5 },
        shade(farbe, 22),
      )
    }
  }
}

function schloss(ctx: CanvasRenderingContext2D, los: Los): void {
  const { x, y, w, h, time, fein } = los
  platte(ctx, { x: x + 0.05, y: y + 0.05, w: w - 0.1, h: h - 0.1 }, '#14375c')
  platte(ctx, { x: x + 0.16, y: y + 0.16, w: w - 0.32, h: h - 0.32 }, '#8d8272')
  platte(ctx, { x: x + 0.28, y: y + 0.28, w: w - 0.56, h: h - 0.56 }, '#4f8f55')
  platte(ctx, { x: x + w * 0.42, y: y + h * 0.52, w: w * 0.16, h: h * 0.4 }, '#cbb892')

  const tw = 0.52
  const dick = 0.16
  const ecken = [
    { x: x + 0.32, y: y + 0.32 },
    { x: x + w - 0.32 - tw, y: y + 0.32 },
    { x: x + 0.32, y: y + h - 0.32 - tw },
    { x: x + w - 0.32 - tw, y: y + h - 0.32 - tw },
  ]
  const mauern: Grund[] = [
    { x: x + 0.32 + tw * 0.55, y: y + 0.34, w: w - 0.64 - tw, h: dick },
    { x: x + w - 0.34 - dick, y: y + 0.32 + tw * 0.55, w: dick, h: h - 0.64 - tw },
    { x: x + 0.34, y: y + 0.32 + tw * 0.55, w: dick, h: h - 0.64 - tw },
    { x: x + 0.32 + tw * 0.4, y: y + h - 0.34 - dick, w: w * 0.28, h: dick },
    { x: x + w * 0.58, y: y + h - 0.34 - dick, w: w * 0.28, h: dick },
  ]
  const bergfried: Grund = { x: x + w * 0.36, y: y + h * 0.28, w: w * 0.28, h: h * 0.3 }
  const palas: Grund = { x: x + w * 0.3, y: y + h * 0.5, w: w * 0.4, h: h * 0.2 }
  const kapelle: Grund = { x: x + 0.55, y: y + h * 0.7, w: 0.48, h: 0.42 }
  const torhaus: Grund = { x: x + w * 0.36, y: y + h - 0.62, w: w * 0.28, h: 0.42 }
  const bruecke: Grund = { x: x + w * 0.43, y: y + h - 0.28, w: w * 0.14, h: 0.32 }
  const brunnen: Grund = { x: x + 0.58, y: y + h * 0.42, w: 0.28, h: 0.28 }

  type Teil = { g: Grund; art: 'mauer' | 'turm' | 'fried' | 'palas' | 'kapelle' | 'tor' | 'bruecke' | 'brunnen' }
  const stuecke: Teil[] = [
    ...mauern.map((g) => ({ g, art: 'mauer' as const })),
    ...ecken.map((e) => ({ g: { x: e.x, y: e.y, w: tw, h: tw }, art: 'turm' as const })),
    { g: bergfried, art: 'fried' },
    { g: palas, art: 'palas' },
    { g: kapelle, art: 'kapelle' },
    { g: torhaus, art: 'tor' },
    { g: bruecke, art: 'bruecke' },
    { g: brunnen, art: 'brunnen' },
  ]
  stuecke.sort((a, b) => a.g.x + a.g.y - (b.g.x + b.g.y))

  for (const teil of stuecke) {
    if (teil.art === 'bruecke') {
      const deck = umlauf(teil.g, 5)
      quad(ctx, deck[0], deck[1], deck[2], deck[3], '#8a5a32')
      ctx.strokeStyle = fade('#3d2914', 0.55)
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 1; i < 5; i++) {
        const p = mix(deck[0], deck[3], i / 5)
        const q = mix(deck[1], deck[2], i / 5)
        ctx.moveTo(p.sx, p.sy)
        ctx.lineTo(q.sx, q.sy)
      }
      ctx.stroke()
      continue
    }
    if (teil.art === 'brunnen') {
      kasten(ctx, teil.g, 8, '#b7b1a6', { fugen: true, etagen: 0, fein })
      platte(ctx, { x: teil.g.x + 0.05, y: teil.g.y + 0.05, w: teil.g.w - 0.1, h: teil.g.h - 0.1 }, '#1a5276', 8)
      kegel(ctx, { x: teil.g.x - 0.04, y: teil.g.y - 0.04, w: teil.g.w + 0.08, h: teil.g.h + 0.08 }, 16, 10, DACHROT, fein)
      continue
    }
    if (teil.art === 'mauer') {
      const hoch = TILE_H * 0.95
      mauerwerk(ctx, teil.g, hoch, STEIN, 0)
      zinnen(ctx, teil.g, hoch, STEIN)
      continue
    }
    if (teil.art === 'turm') {
      const hoch = TILE_H * 2.05
      mauerwerk(ctx, teil.g, hoch, STEIN, 2)
      const kranz: Grund = { x: teil.g.x - 0.05, y: teil.g.y - 0.05, w: teil.g.w + 0.1, h: teil.g.h + 0.1 }
      mauerwerk(ctx, kranz, 7, shade(STEIN, -8), 0, hoch)
      zinnen(ctx, kranz, hoch + 7, STEIN)
      const spitze = kegel(ctx, teil.g, hoch + 7, TILE_H * 0.85, DACHROT, fein)
      banner(ctx, spitze, time, teil.g.x < x + w / 2 ? '#1a5276' : '#f4d35e', teil.g.y)
      continue
    }
    if (teil.art === 'fried') {
      const hoch = TILE_H * 2.7
      mauerwerk(ctx, teil.g, hoch, '#e4dccf', 3)
      zinnen(ctx, teil.g, hoch, '#e4dccf')
      const spitze = kegel(ctx, teil.g, hoch + 3, TILE_H * 0.95, DACHROT, fein)
      banner(ctx, spitze, time, '#8c2e2a', 1.2)
      continue
    }
    if (teil.art === 'palas') {
      haus(ctx, teil.g, TILE_H * 0.85, '#e7dfd2', DACHROT, { etagen: 2, fein, rise: 14, schlot: true, time })
      continue
    }
    if (teil.art === 'kapelle') {
      haus(ctx, teil.g, 18, PUTZ, DACHROT, { etagen: 1, tuer: true, fein, rise: 16 })
      fachwerk(ctx, teil.g, 18)
      continue
    }
    const hoch = TILE_H * 1.25
    mauerwerk(ctx, teil.g, hoch, STEIN, 0)
    zinnen(ctx, teil.g, hoch, STEIN)
    const front = waende(teil.g)[tuerWand()]
    if (!front.sichtbar) continue
    bogen(ctx, front, 1, 0.2, 14, '#141820')
    ctx.strokeStyle = '#c6a15a'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const p = lift(mix(front.a, front.b, 0.36 + i * 0.07), 3)
      const q = lift(mix(front.a, front.b, 0.36 + i * 0.07), 14)
      ctx.moveTo(p.sx, p.sy)
      ctx.lineTo(q.sx, q.sy)
    }
    const quer = lift(mix(front.a, front.b, 0.34), 8)
    const quer2 = lift(mix(front.a, front.b, 0.66), 8)
    ctx.moveTo(quer.sx, quer.sy)
    ctx.lineTo(quer2.sx, quer2.sy)
    ctx.stroke()
    const tl = lift(mix(front.a, front.b, 0.4), 1)
    const tr = lift(mix(front.a, front.b, 0.6), 1)
    quad(ctx, tl, tr, lift(tr, 11), lift(tl, 11), HOLZ)
    quad(ctx, lift(mix(tl, tr, 0.15), 2), lift(mix(tl, tr, 0.85), 2), lift(mix(tl, tr, 0.85), 6), lift(mix(tl, tr, 0.15), 6), '#8a5a32')
  }
}

// ---------- Übrige Silhouetten ----------

function riesenrad(ctx: CanvasRenderingContext2D, los: Los): void {
  const platz = feld(los, los.w * 0.22, los.h * 0.22, los.w * 0.56, los.h * 0.56)
  platte(ctx, platz, '#d9d3c4', 2)
  const kasse = feld(los, los.w * 0.12, los.h * 0.62, los.w * 0.34, los.h * 0.26)
  const mastL = feld(los, los.w * 0.3, los.h * 0.4, 0.12, 0.12)
  const mastR = feld(los, los.w * 0.62, los.h * 0.4, 0.12, 0.12)
  const mastH = TILE_H * 1.7
  const teile = [
    { x: mastL.x, y: mastL.y, mal: () => kasten(ctx, mastL, mastH, '#d5d8dc', { etagen: 0, fugen: true, fein: los.fein }) },
    { x: mastR.x, y: mastR.y, mal: () => kasten(ctx, mastR, mastH, '#d5d8dc', { etagen: 0, fugen: true, fein: los.fein }) },
    {
      x: kasse.x,
      y: kasse.y,
      mal: () => {
        haus(ctx, kasse, 16, '#f6e27a', DACHROT, { etagen: 1, tuer: true, fein: los.fein, rise: 10 })
        markise(ctx, kasse, 16, '#c0392b')
      },
    },
  ]
  teile.sort((a, b) => a.x + a.y - (b.x + b.y))
  const radMitte = teile.findIndex((t) => t.y > los.y + los.h * 0.45)
  const vorne = radMitte === -1 ? teile.length : radMitte
  for (let i = 0; i < vorne; i++) teile[i].mal()

  const radius = Math.min(los.w, los.h) * 0.4
  const cx = los.x + los.w * 0.52
  const cy = los.y + los.h * 0.4
  const cz = radius * 45 + 6
  const phase = los.time * 0.4
  const nrm = dreh90(Math.SQRT1_2, Math.SQRT1_2, bauRot)
  const u = { x: -nrm.y, y: nrm.x }
  const punkt = (winkel: number): P3 => ({
    x: cx + u.x * radius * Math.cos(winkel),
    y: cy + u.y * radius * Math.cos(winkel),
    z: cz + radius * 45 * Math.sin(winkel),
  })
  const farben = ['#e74c3c', '#5dade2', '#27ae60', '#f4d35e', '#af7ac5', '#e67e22', '#f5b7c5', '#1abc9c']
  const gondeln = farben.map((farbe, i) => {
    const p = punkt(phase + (i / 8) * Math.PI * 2)
    return { farbe, p, sy: proj(p).sy }
  })
  gondeln.sort((a, b) => a.sy - b.sy)
  const schnitt = gondeln.findIndex((g) => g.sy > proj({ x: cx, y: cy, z: cz }).sy)
  const halb = schnitt === -1 ? gondeln.length : schnitt
  const gondel = (g: (typeof gondeln)[number]) => {
    kasten(ctx, { x: g.p.x - 0.07, y: g.p.y - 0.05, w: 0.14, h: 0.1 }, 8, g.farbe, { basis: g.p.z - 10, etagen: 1, fein: los.fein })
  }
  for (let i = 0; i < halb; i++) gondel(gondeln[i])
  maleNetz(
    ctx,
    [...radNetz(cx, cy, cz, radius, '#f4d35e', phase), ...kugelNetz({ x: cx, y: cy, z: cz }, 0.06, 4, '#2c3e50', 3, 6)],
    { x: cx, y: cy, z: cz },
  )
  for (let i = halb; i < gondeln.length; i++) gondel(gondeln[i])
  for (let i = vorne; i < teile.length; i++) teile[i].mal()
}

function apfel(ctx: CanvasRenderingContext2D, los: Los): void {
  const sockel = feld(los, 0.16, 0.28, 0.68, 0.5)
  kasten(ctx, sockel, 8, STEIN, { fugen: true, etagen: 0, fein: los.fein })
  const cx = los.x + los.w * 0.5
  const cy = los.y + los.h * 0.52
  const rxy = 0.3
  const rz = 15
  const cz = 8 + rz
  const kern = { x: cx, y: cy, z: cz }
  const [nx, ny] = NORMALE[tuerWand()]
  const breit = 0.13
  const tief = 0.055
  let dx = cx - breit / 2
  let dy = cy - 0.045
  let dw = breit
  let dh = 0.09
  if (nx > 0) {
    dx = cx + rxy * 0.42
    dw = tief
  } else if (nx < 0) {
    dx = cx - rxy * 0.42 - tief
    dw = tief
  } else if (ny > 0) {
    dy = cy + rxy * 0.42
    dh = tief
    dw = breit
    dx = cx - breit / 2
  } else {
    dy = cy - rxy * 0.42 - tief
    dh = tief
    dw = breit
    dx = cx - breit / 2
  }
  const netz = [
    ...kugelNetz(kern, rxy, rz, '#c0392b', 8, 12),
    ...quaderNetz(cx - 0.02, cy - 0.02, cz + rz - 3, 0.04, 0.04, 8, '#6b4423'),
    ...quaderNetz(dx, dy, 10, dw, dh, 11, HOLZ),
    ...quaderNetz(
      Math.abs(nx) > 0 ? (nx > 0 ? dx + dw - 0.012 : dx - 0.004) : dx + dw * 0.68,
      Math.abs(ny) > 0 ? (ny > 0 ? dy + dh - 0.012 : dy - 0.004) : dy + dh * 0.38,
      14.2,
      Math.abs(nx) > 0 ? 0.016 : 0.02,
      Math.abs(ny) > 0 ? 0.016 : 0.02,
      1.5,
      '#e6c15a',
    ),
    {
      pts: [
        { x: cx, y: cy, z: cz + rz + 2 },
        { x: cx + 0.18, y: cy - 0.02, z: cz + rz + 5 },
        { x: cx + 0.24, y: cy + 0.07, z: cz + rz },
        { x: cx + 0.04, y: cy + 0.05, z: cz + rz - 1 },
      ],
      farbe: '#1e8449',
      duenn: true,
    },
  ]
  maleNetz(ctx, netz, kern)
}

function pilz(ctx: CanvasRenderingContext2D, los: Los): void {
  const stamm = feld(los, 0.36, 0.4, 0.28, 0.28)
  kasten(ctx, stamm, 18, '#f3e2c4', { etagen: 1, tuer: true, fein: los.fein })
  const hut = feld(los, 0.08, 0.12, 0.84, 0.76)
  kegel(ctx, hut, 12, 18, '#c0392b', los.fein, '#f4d35e')
  const spitze = oben(hut, 30)
  for (const wand of waendeVon(hut, 12)) {
    for (const t of [0.32, 0.68]) {
      const fuss = mix(wand.a, wand.b, t)
      const fleck = mix(fuss, spitze, 0.42)
      oval(ctx, fleck.sx, fleck.sy, 3.1, 2, '#f7f4ee')
    }
  }
}

function iglu(ctx: CanvasRenderingContext2D, los: Los): void {
  const ringe = [
    { m: 0.06, h: 6 },
    { m: 0.12, h: 5 },
    { m: 0.18, h: 5 },
    { m: 0.25, h: 4 },
    { m: 0.32, h: 4 },
    { m: 0.4, h: 4 },
  ]
  let z = 0
  for (const ring of ringe) {
    const g = feld(los, ring.m, ring.m, los.w - ring.m * 2, los.h - ring.m * 2)
    kasten(ctx, g, ring.h, '#f4f7fb', { basis: z, etagen: 0, fugen: true, fein: los.fein })
    z += ring.h
  }
  const fuss = feld(los, 0.06, 0.06, los.w - 0.12, los.h - 0.12)
  const front = waende(fuss)[tuerWand()]
  if (front.sichtbar) bogen(ctx, front, 0, 0.14, 9, '#5d6d7e')
  kegel(ctx, feld(los, 0.4, 0.4, los.w - 0.8, los.h - 0.8), z, 7, '#f7fbff', los.fein, '#f7fbff')
}

function jurte(ctx: CanvasRenderingContext2D, los: Los): void {
  const g = feld(los, 0.14, 0.2, 0.72, 0.64)
  kasten(ctx, g, 14, '#f3e0c4', { etagen: 0, tuer: true, fein: los.fein })
  ctx.save()
  ctx.strokeStyle = '#6b4423'
  ctx.lineWidth = 1
  for (const wand of waendeVon(g)) {
    for (let i = 1; i < 4; i++) {
      const p = mix(wand.a, wand.b, i / 4)
      const q = lift(p, 14)
      ctx.beginPath()
      ctx.moveTo(p.sx, p.sy)
      ctx.lineTo(q.sx, q.sy)
      ctx.stroke()
    }
  }
  ctx.restore()
  const spitze = kegel(ctx, g, 14, 20, '#a33b32', los.fein)
  if (los.fein) schlot(ctx, { x: g.x + g.w * 0.42, y: g.y + g.h * 0.42, w: 0.08, h: 0.08 }, 30, los.time, true)
  banner(ctx, spitze, los.time, '#1a5276', 0.4)
}

function hausboot(ctx: CanvasRenderingContext2D, los: Los): void {
  platte(ctx, feld(los, 0.04, 0.18, 0.92, 0.72), '#1a5276')
  platte(ctx, feld(los, 0.1, 0.26, 0.8, 0.56), '#2471a3', 1)
  const rumpf = feld(los, 0.16, 0.32, 0.68, 0.4)
  const seite = tuerWand()
  const wand = waende(rumpf)[seite]
  const [nx, ny] = NORMALE[seite]
  const mx = (wand.ka.x + wand.kb.x) / 2
  const my = (wand.ka.y + wand.kb.y) / 2
  const spitze = { x: mx + nx * 0.26, y: my + ny * 0.26 }
  const kern = { x: rumpf.x + rumpf.w / 2, y: rumpf.y + rumpf.h / 2, z: 4 }
  const bugNetz: F3[] = [
    {
      pts: [
        { x: wand.ka.x, y: wand.ka.y, z: 8 },
        { x: wand.kb.x, y: wand.kb.y, z: 8 },
        { x: spitze.x, y: spitze.y, z: 7 },
      ],
      farbe: '#a56b42',
    },
    {
      pts: [
        { x: wand.ka.x, y: wand.ka.y, z: 1 },
        { x: spitze.x, y: spitze.y, z: 2 },
        { x: wand.ka.x, y: wand.ka.y, z: 8 },
      ],
      farbe: '#6e4630',
    },
    {
      pts: [
        { x: wand.kb.x, y: wand.kb.y, z: 1 },
        { x: wand.kb.x, y: wand.kb.y, z: 8 },
        { x: spitze.x, y: spitze.y, z: 2 },
      ],
      farbe: '#6e4630',
    },
    {
      pts: [
        { x: wand.ka.x, y: wand.ka.y, z: 1 },
        { x: wand.kb.x, y: wand.kb.y, z: 1 },
        { x: spitze.x, y: spitze.y, z: 2 },
      ],
      farbe: '#5c3a28',
    },
  ]
  const vorn = proj({ x: spitze.x, y: spitze.y, z: 4 }).sy >= proj(kern).sy
  if (!vorn) maleNetz(ctx, bugNetz, kern)
  kasten(ctx, rumpf, 8, '#8c5a3a', { etagen: 0, fugen: true, fein: los.fein })
  if (vorn) maleNetz(ctx, bugNetz, kern)
  const kajuete = feld(los, 0.28, 0.38, 0.4, 0.26)
  haus(ctx, kajuete, 14, PUTZ, DACHROT, { basis: 8, etagen: 1, tuer: true, fein: los.fein, rise: 9, schlot: true, time: los.time })
}

function kopf(ctx: CanvasRenderingContext2D, los: Los): void {
  const g = feld(los, 0.18, 0.2, 0.64, 0.56)
  const traufe = 32
  const rise = 18
  sattel(ctx, g, traufe, rise, DACHROT, los.fein, true)
  // Der Schlot hängt an der Firstspitze nach unten, bis fast auf den Boden
  schlot(ctx, { x: g.x + g.w * 0.58, y: g.y + g.h * 0.58, w: 0.1, h: 0.1 }, traufe - rise - 10, los.time, los.fein)
  kasten(ctx, g, 24, PUTZ, { basis: traufe, etagen: 2, tuer: true, fein: los.fein })
  fachwerk(ctx, g, 24, traufe)
}

function rakete(ctx: CanvasRenderingContext2D, los: Los): void {
  const rampe = feld(los, 0.2, 0.32, 0.6, 0.42)
  kasten(ctx, rampe, 4, '#d5d8dc', { fugen: true, etagen: 0, fein: los.fein })
  const leib = feld(los, 0.36, 0.38, 0.28, 0.28)
  const cx = leib.x + leib.w / 2
  const cy = leib.y + leib.h / 2
  const flack = Math.sin(los.time * 12)
  const farbe = flack > 0 ? '#f4d35e' : '#e67e22'
  const kern = { x: cx, y: cy, z: 6 }
  const flamme: F3[] = []
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2
    const a1 = ((i + 1) / 6) * Math.PI * 2
    const r = 0.07
    flamme.push({
      pts: [
        { x: cx + Math.cos(a0) * r, y: cy + Math.sin(a0) * r, z: 2 },
        { x: cx + Math.cos(a1) * r, y: cy + Math.sin(a1) * r, z: 2 },
        { x: cx, y: cy, z: -14 - flack * 3 },
      ],
      farbe,
    })
  }
  const flossen = [
    feld(los, 0.2, 0.44, 0.2, 0.1),
    feld(los, 0.6, 0.44, 0.2, 0.1),
    feld(los, 0.42, 0.58, 0.16, 0.16),
  ]
  for (const f of flossen) kasten(ctx, f, 14, '#c0392b', { etagen: 0, fein: los.fein })
  kasten(ctx, leib, 36, '#f7f9fb', { etagen: 2, fein: los.fein })
  band(ctx, leib, 6, 4, '#c0392b')
  band(ctx, leib, 22, 4, '#c0392b')
  kegel(ctx, leib, 36, 20, '#c0392b', los.fein)
  maleNetz(ctx, flamme, kern)
}

function leuchtturm(ctx: CanvasRenderingContext2D, los: Los): void {
  const turm = feld(los, 0.32, 0.16, 0.36, 0.36)
  const hausG = feld(los, 0.16, 0.5, 0.62, 0.38)
  kasten(ctx, turm, 46, '#f7f4ee', { etagen: 0, fugen: true, fein: los.fein })
  band(ctx, turm, 10, 5, '#c0392b')
  band(ctx, turm, 24, 5, '#c0392b')
  band(ctx, turm, 38, 5, '#c0392b')
  const laterne = feld(los, 0.3, 0.14, 0.4, 0.4)
  kasten(ctx, laterne, 8, '#2c3e50', { basis: 46, etagen: 1, fein: los.fein })
  const an = Math.sin(los.time * 3) > 0
  const cx = laterne.x + laterne.w / 2
  const cy = laterne.y + laterne.h / 2
  const z = 50
  const winkel = los.time * 0.7
  const dx = Math.cos(winkel)
  const dy = Math.sin(winkel)
  const reich = 0.9
  const strahl: F3[] = [
    {
      pts: [
        { x: cx, y: cy, z },
        { x: cx + dx * reich, y: cy + dy * reich, z: z - 4 },
        { x: cx + dx * reich, y: cy + dy * reich, z: z + 6 },
      ],
      farbe: '#f8e7a0',
      duenn: true,
    },
  ]
  const vorn = proj({ x: cx + dx * reich, y: cy + dy * reich, z }).sy > proj({ x: cx, y: cy, z }).sy
  if (an && !vorn) maleNetz(ctx, strahl, { x: cx, y: cy, z })
  kegel(ctx, laterne, 54, 10, DACHROT, los.fein)
  if (an && vorn) maleNetz(ctx, strahl, { x: cx, y: cy, z })
  haus(ctx, hausG, 16, PUTZ, '#5d6d7e', { etagen: 1, tuer: true, fein: los.fein, rise: 10, schlot: true, time: los.time })
}

function windrad(ctx: CanvasRenderingContext2D, los: Los): void {
  const fuss = feld(los, 0.3, 0.38, 0.4, 0.32)
  haus(ctx, fuss, 12, '#e7eef2', '#8d99a6', { etagen: 1, tuer: true, fein: los.fein, rise: 8 })
  const mast = feld(los, 0.44, 0.46, 0.12, 0.12)
  kasten(ctx, mast, 52, '#f7f9fb', { basis: 10, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.4, 0.42, 0.2, 0.16), 6, '#5d6d7e', { basis: 60, etagen: 0, fein: los.fein })
  const cx = los.x + los.w * 0.5
  const cy = los.y + los.h * 0.52
  const cz = 66
  maleNetz(ctx, [...fluegelNetz(cx, cy, cz, 0.62, '#f4f7fb', los.time * 0.8), ...kugelNetz({ x: cx, y: cy, z: cz }, 0.045, 3.2, '#2c3e50', 4, 6)], {
    x: cx,
    y: cy,
    z: cz,
  })
}

function geist(ctx: CanvasRenderingContext2D, los: Los): void {
  const g = feld(los, 0.08, 0.12, los.w - 0.2, los.h - 0.28)
  haus(ctx, g, 24, '#3c3358', '#6c3483', { etagen: 2, tuer: true, fein: los.fein, rise: 14, schlot: true, time: los.time })
  const front = waende(g)[tuerWand()]
  if (front.sichtbar) bogen(ctx, front, 0, 0.18, 12, '#120c18')
  const schiene = feld(los, 0.15, los.h - 0.22, los.w - 0.3, 0.08)
  kasten(ctx, schiene, 2, '#5d6d7e', { etagen: 0, fein: los.fein })
  const bob = Math.sin(los.time * 2) * 3
  const cx = g.x + g.w * 0.78
  const cy = g.y + g.h * 0.2
  const cz = 24 + bob
  const [nx, ny] = NORMALE[tuerWand()]
  const tx = -ny
  const ty = nx
  const augen: F3[] = [-0.04, 0.018].map((s) => ({
    pts: [
      { x: cx + nx * 0.09 + tx * s, y: cy + ny * 0.09 + ty * s, z: cz + 1 },
      { x: cx + nx * 0.09 + tx * (s + 0.018), y: cy + ny * 0.09 + ty * (s + 0.018), z: cz + 1 },
      { x: cx + nx * 0.09 + tx * (s + 0.018), y: cy + ny * 0.09 + ty * (s + 0.018), z: cz + 2.8 },
      { x: cx + nx * 0.09 + tx * s, y: cy + ny * 0.09 + ty * s, z: cz + 2.8 },
    ],
    farbe: '#2c3e50',
    duenn: true,
  }))
  maleNetz(ctx, [...kugelNetz({ x: cx, y: cy, z: cz }, 0.11, 9, '#f7f4ee', 6, 8), ...augen], { x: cx, y: cy, z: cz })
}

function ufo(ctx: CanvasRenderingContext2D, los: Los): void {
  const stiel = feld(los, 0.42, 0.44, 0.16, 0.14)
  kasten(ctx, stiel, 12, '#aeb6bf', { etagen: 0, fein: los.fein })
  const cx = los.x + los.w * 0.5
  const cy = los.y + los.h * 0.48
  const z = 11
  const r = Math.min(los.w, los.h) * 0.4
  const an = Math.sin(los.time * 4) > 0
  const lichter: F3[] = []
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const lx = cx + Math.cos(a) * r * 0.78
    const ly = cy + Math.sin(a) * r * 0.78
    lichter.push(...quaderNetz(lx - 0.03, ly - 0.025, z + 1.4, 0.06, 0.05, 2.2, an && i % 2 === 0 ? '#f4d35e' : '#e74c3c'))
  }
  maleNetz(ctx, [...scheibeNetz(cx, cy, z, r, 5, '#d5dbe2'), ...lichter], { x: cx, y: cy, z: z + 2.5 })
  const kuppel = feld(los, 0.36, 0.36, 0.28, 0.24)
  kasten(ctx, kuppel, 7, '#9aa6ff', { basis: 16, etagen: 1, fein: los.fein })
  kegel(ctx, kuppel, 23, 8, '#b7c0ff', los.fein, '#e8ecff')
}

function sockel(ctx: CanvasRenderingContext2D, los: Los, farbe = STEIN): Grund {
  const g = feld(los, 0.22, 0.34, 0.56, 0.4)
  kasten(ctx, g, 6, farbe, { fugen: true, etagen: 0, fein: los.fein })
  return g
}

function wal(ctx: CanvasRenderingContext2D, los: Los): void {
  const g = feld(los, 0.06, 0.38, 0.88, 0.28)
  kasten(ctx, g, 5, STEIN, { fugen: true, etagen: 0, fein: los.fein })
  const y = g.y + g.h * 0.5
  const netz: F3[] = []
  for (let i = 0; i < 7; i++) {
    const t = (i + 0.5) / 7
    const x = g.x + g.w * (0.18 + t * 0.68)
    const hoehe = 7 + Math.sin(t * Math.PI) * 12
    netz.push(...rippe(x, y, 5, 0.09 + Math.sin(t * Math.PI) * 0.03, hoehe, i % 2 ? '#e8e4dc' : '#f7f4ee'))
    if (i < 6) {
      const t2 = (i + 1.5) / 7
      const x2 = g.x + g.w * (0.18 + t2 * 0.68)
      const h2 = 5 + 7 + Math.sin(t2 * Math.PI) * 12
      const h1 = 5 + hoehe
      netz.push({
        pts: [
          { x, y: y - 0.02, z: h1 },
          { x: x2, y: y - 0.02, z: h2 },
          { x: x2, y: y + 0.02, z: h2 },
          { x, y: y + 0.02, z: h1 },
        ],
        farbe: '#f7f4ee',
      })
    }
  }
  const kx = g.x + g.w * 0.12
  netz.push(...kugelNetz({ x: kx, y, z: 13 }, 0.09, 6.5, '#f7f4ee', 5, 8))
  netz.push(...kugelNetz({ x: kx + 0.02, y: y + 0.06, z: 14 }, 0.018, 1.3, '#2c3e50', 3, 5))
  maleNetz(ctx, netz, { x: g.x + g.w / 2, y, z: 12 })
}

function einhorn(ctx: CanvasRenderingContext2D, los: Los): void {
  sockel(ctx, los)
  const bein = (x: number, y: number) => kasten(ctx, feld(los, x, y, 0.07, 0.07), 12, '#f7f4ee', { basis: 6, etagen: 0, fein: los.fein })
  bein(0.28, 0.48)
  bein(0.4, 0.5)
  bein(0.52, 0.48)
  bein(0.64, 0.5)
  const leib = feld(los, 0.26, 0.42, 0.42, 0.18)
  kasten(ctx, leib, 10, '#f7f4ee', { basis: 16, etagen: 0, fein: los.fein })
  const hals = feld(los, 0.58, 0.36, 0.12, 0.12)
  kasten(ctx, hals, 10, '#f7f4ee', { basis: 22, etagen: 0, fein: los.fein })
  const kopf = feld(los, 0.6, 0.28, 0.16, 0.12)
  kasten(ctx, kopf, 7, '#f7f4ee', { basis: 30, etagen: 0, fein: los.fein })
  kegel(ctx, feld(los, 0.64, 0.3, 0.08, 0.08), 36, 12, '#f4d35e', false)
  const [nx, ny] = NORMALE[tuerWand()]
  maleNetz(
    ctx,
    [
      ...kugelNetz({ x: kopf.x + kopf.w * 0.7 + nx * 0.04, y: kopf.y + kopf.h * 0.4 + ny * 0.04, z: 34 }, 0.02, 1.4, '#2c3e50', 3, 5),
      {
        pts: [
          { x: leib.x + leib.w * 0.7, y: leib.y + leib.h * 0.15, z: 26 },
          { x: leib.x + leib.w * 0.55, y: leib.y - 0.02, z: 34 },
          { x: leib.x + leib.w * 0.4, y: leib.y + leib.h * 0.2, z: 30 },
        ],
        farbe: '#f5b7c5',
        duenn: true,
      },
      {
        pts: [
          { x: leib.x + 0.02, y: leib.y + leib.h * 0.4, z: 20 },
          { x: leib.x - 0.14, y: leib.y + leib.h * 0.15, z: 24 },
          { x: leib.x - 0.08, y: leib.y + leib.h * 0.7, z: 16 },
        ],
        farbe: '#f5b7c5',
        duenn: true,
      },
    ],
    { x: leib.x + leib.w / 2, y: leib.y + leib.h / 2, z: 22 },
  )
}

function zwerg(ctx: CanvasRenderingContext2D, los: Los): void {
  sockel(ctx, los, '#8d7b66')
  kasten(ctx, feld(los, 0.3, 0.5, 0.14, 0.12), 8, '#2c3e50', { basis: 6, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.52, 0.5, 0.14, 0.12), 8, '#2c3e50', { basis: 6, etagen: 0, fein: los.fein })
  const leib = feld(los, 0.32, 0.4, 0.36, 0.26)
  kasten(ctx, leib, 16, '#1e8449', { basis: 12, etagen: 0, fein: los.fein })
  band(ctx, leib, 20, 3, '#c0392b')
  const kopf = feld(los, 0.38, 0.42, 0.24, 0.18)
  kasten(ctx, kopf, 8, '#f5cba7', { basis: 28, etagen: 0, fein: los.fein })
  kegel(ctx, feld(los, 0.34, 0.38, 0.32, 0.24), 34, 16, '#c0392b', los.fein)
  const auge = oben(kopf, 32)
  oval(ctx, auge.sx - 2, auge.sy, 1.2, 1.2, '#2c3e50')
  oval(ctx, auge.sx + 2, auge.sy, 1.2, 1.2, '#2c3e50')
}

function flamingo(ctx: CanvasRenderingContext2D, los: Los): void {
  const g = sockel(ctx, los, '#e5e0d6')
  const bein = feld(los, 0.46, 0.48, 0.06, 0.06)
  kasten(ctx, bein, 16, '#f5b7c5', { basis: 6, etagen: 0, fein: los.fein })
  const leib = feld(los, 0.34, 0.4, 0.28, 0.16)
  kasten(ctx, leib, 8, '#e85d8a', { basis: 20, etagen: 0, fein: los.fein })
  const hals1 = feld(los, 0.52, 0.34, 0.08, 0.08)
  kasten(ctx, hals1, 8, '#e85d8a', { basis: 24, etagen: 0, fein: los.fein })
  const kopf = feld(los, 0.56, 0.26, 0.1, 0.08)
  kasten(ctx, kopf, 5, '#e85d8a', { basis: 32, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.64, 0.24, 0.12, 0.05), 2, '#2c3e50', { basis: 34, etagen: 0, fein: los.fein })
  oval(ctx, oben(kopf, 35).sx, oben(kopf, 35).sy, 1.1, 1.1, '#2c3e50')
  oval(ctx, oben(g, 6).sx, oben(g, 6).sy, 2, 1, '#d5d0c6')
}

function moai(ctx: CanvasRenderingContext2D, los: Los): void {
  sockel(ctx, los, '#8d7b66')
  const leib = feld(los, 0.28, 0.32, 0.44, 0.36)
  kasten(ctx, leib, 28, '#a89880', { basis: 6, etagen: 0, fugen: true, fein: los.fein })
  const stirn = feld(los, 0.24, 0.28, 0.52, 0.28)
  kasten(ctx, stirn, 6, '#8d7b66', { basis: 30, etagen: 0, fein: los.fein })
  const front = waende(leib, 6)[tuerWand()]
  if (front.sichtbar) {
    const auge = (t: number) => {
      const l = lift(mix(front.a, front.b, t - 0.06), 16)
      const r = lift(mix(front.a, front.b, t + 0.06), 16)
      quad(ctx, l, r, lift(r, 4), lift(l, 4), '#3e342c')
    }
    auge(0.36)
    auge(0.64)
    const nase = feld(los, 0.44, 0.58, 0.12, 0.1)
    kasten(ctx, nase, 8, '#8d7b66', { basis: 14, etagen: 0, fein: los.fein })
    const m = lift(mix(front.a, front.b, 0.5), 10)
    const ml = lift(mix(front.a, front.b, 0.32), 10)
    const mr = lift(mix(front.a, front.b, 0.68), 10)
    quad(ctx, ml, mr, lift(mr, 2), lift(ml, 2), '#4a4038')
    oval(ctx, m.sx, m.sy, 1, 1, '#4a4038')
  }
}

function drache(ctx: CanvasRenderingContext2D, los: Los): void {
  sockel(ctx, los, '#6f6256')
  const seg = [0.16, 0.32, 0.46, 0.58]
  seg.forEach((x, i) => {
    kasten(ctx, feld(los, x, 0.42 + (i % 2) * 0.04, 0.16, 0.14), 8, i % 2 ? '#1e8449' : '#196f3d', {
      basis: 8 + Math.sin(i) * 2,
      etagen: 0,
      fein: los.fein,
    })
  })
  const kopf = feld(los, 0.68, 0.34, 0.18, 0.14)
  kasten(ctx, kopf, 8, '#1e8449', { basis: 14, etagen: 0, fein: los.fein })
  kegel(ctx, feld(los, 0.74, 0.32, 0.06, 0.06), 20, 8, '#f4d35e', false)
  const [nx, ny] = NORMALE[tuerWand()]
  const rx = los.x + 0.46
  const ry = los.y + 0.46
  const rz = 18
  maleNetz(
    ctx,
    [
      ...kugelNetz({ x: kopf.x + kopf.w * 0.55 + nx * 0.05, y: kopf.y + kopf.h * 0.4 + ny * 0.05, z: 18 }, 0.02, 1.5, '#f4d35e', 3, 5),
      {
        pts: [
          { x: rx, y: ry, z: rz },
          { x: rx - 0.28, y: ry - 0.06, z: rz + 14 },
          { x: rx - 0.2, y: ry + 0.16, z: rz + 3 },
        ],
        farbe: '#145232',
        duenn: true,
      },
      {
        pts: [
          { x: rx + 0.06, y: ry, z: rz - 1 },
          { x: rx + 0.32, y: ry - 0.1, z: rz + 12 },
          { x: rx + 0.24, y: ry + 0.12, z: rz + 2 },
        ],
        farbe: '#196f3d',
        duenn: true,
      },
    ],
    { x: rx, y: ry, z: rz },
  )
}

function roboter(ctx: CanvasRenderingContext2D, los: Los): void {
  sockel(ctx, los, '#5d6d7e')
  kasten(ctx, feld(los, 0.32, 0.5, 0.1, 0.1), 10, '#7f8c9a', { basis: 6, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.54, 0.5, 0.1, 0.1), 10, '#7f8c9a', { basis: 6, etagen: 0, fein: los.fein })
  const leib = feld(los, 0.28, 0.38, 0.44, 0.28)
  kasten(ctx, feld(los, 0.16, 0.46, 0.14, 0.1), 4, '#aeb6bf', { basis: 18, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.7, 0.46, 0.14, 0.1), 4, '#aeb6bf', { basis: 18, etagen: 0, fein: los.fein })
  kasten(ctx, leib, 16, '#d0d5db', { basis: 14, etagen: 1, fein: los.fein })
  band(ctx, leib, 20, 2, '#e74c3c')
  const kopf = feld(los, 0.34, 0.4, 0.32, 0.22)
  kasten(ctx, kopf, 10, '#eef1f4', { basis: 30, etagen: 1, fein: los.fein })
  const ax = kopf.x + kopf.w * 0.5
  const ay = kopf.y + kopf.h * 0.35
  maleNetz(ctx, [...quaderNetz(ax - 0.012, ay - 0.012, 40, 0.024, 0.024, 8, '#7f8c8d'), ...kugelNetz({ x: ax, y: ay, z: 49 }, 0.03, 2, '#e74c3c', 3, 5)], {
    x: ax,
    y: ay,
    z: 44,
  })
}

function stuhl(ctx: CanvasRenderingContext2D, los: Los): void {
  const beine = [
    [0.22, 0.4],
    [0.62, 0.4],
    [0.22, 0.62],
    [0.62, 0.62],
  ] as const
  for (const [x, y] of beine) kasten(ctx, feld(los, x, y, 0.08, 0.08), 14, HOLZ, { etagen: 0, fein: los.fein })
  const sitz = feld(los, 0.18, 0.36, 0.58, 0.36)
  kasten(ctx, sitz, 4, '#c0392b', { basis: 14, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.2, 0.38, 0.08, 0.28), 18, '#e74c3c', { basis: 18, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.66, 0.38, 0.08, 0.28), 18, '#e74c3c', { basis: 18, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.2, 0.36, 0.54, 0.1), 4, '#f4d35e', { basis: 34, etagen: 0, fein: los.fein })
}

function palme(ctx: CanvasRenderingContext2D, los: Los): void {
  const topf = feld(los, 0.3, 0.4, 0.4, 0.32)
  kasten(ctx, topf, 8, '#c0392b', { etagen: 0, fein: los.fein })
  const stamm = [0, 8, 16, 24]
  const stammMal = (z: number, i: number) => {
    const seit = (i % 2 === 0 ? -0.02 : 0.02) * i
    kasten(ctx, feld(los, 0.44 + seit, 0.48, 0.12, 0.12), 8, '#8c5a3a', { basis: 8 + z, etagen: 0, fugen: true, fein: los.fein })
  }
  stamm.forEach((z, i) => {
    if (i < stamm.length - 1) stammMal(z, i)
  })
  const cx = los.x + los.w * 0.5
  const cy = los.y + los.h * 0.54
  const cz = 44
  const wedel: F3[] = []
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const dx = Math.cos(a)
    const dy = Math.sin(a)
    wedel.push({
      pts: [
        { x: cx, y: cy, z: cz },
        { x: cx + dx * 0.14, y: cy + dy * 0.14, z: cz + 3 },
        { x: cx + dx * 0.4, y: cy + dy * 0.4, z: cz - 10 },
        { x: cx + dx * 0.06, y: cy + dy * 0.02, z: cz - 1 },
      ],
      farbe: i % 2 ? '#27ae60' : '#1e8449',
      duenn: true,
    })
  }
  const stammP = { x: cx, y: cy, z: cz }
  const hinten = wedel.filter((f) => proj(mittelP(f.pts)).sy < proj(stammP).sy)
  const vorn = wedel.filter((f) => proj(mittelP(f.pts)).sy >= proj(stammP).sy)
  if (hinten.length) maleNetz(ctx, hinten, { x: cx, y: cy, z: cz - 4 })
  stammMal(stamm[stamm.length - 1], stamm.length - 1)
  if (vorn.length) maleNetz(ctx, vorn, { x: cx, y: cy, z: cz - 4 })
}

function kaktus(ctx: CanvasRenderingContext2D, los: Los): void {
  const topf = feld(los, 0.28, 0.46, 0.44, 0.3)
  kasten(ctx, topf, 6, '#c4a574', { fugen: true, etagen: 0, fein: los.fein })
  const stamm = feld(los, 0.4, 0.48, 0.2, 0.18)
  kasten(ctx, stamm, 28, '#1e8449', { basis: 6, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.18, 0.5, 0.22, 0.1), 5, '#196f3d', { basis: 16, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.16, 0.46, 0.1, 0.1), 10, '#1e8449', { basis: 18, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.6, 0.5, 0.2, 0.1), 5, '#196f3d', { basis: 20, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.72, 0.46, 0.1, 0.1), 8, '#1e8449', { basis: 22, etagen: 0, fein: los.fein })
  if (!los.fein) return
  ctx.fillStyle = '#145a32'
  const p = oben(stamm, 20)
  for (let i = 0; i < 4; i++) ctx.fillRect(p.sx - 2, p.sy + i * 5, 1.2, 2)
}

function astronaut(ctx: CanvasRenderingContext2D, los: Los): void {
  sockel(ctx, los)
  kasten(ctx, feld(los, 0.34, 0.5, 0.1, 0.1), 10, '#f7f4ee', { basis: 6, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.54, 0.5, 0.1, 0.1), 10, '#f7f4ee', { basis: 6, etagen: 0, fein: los.fein })
  const leib = feld(los, 0.32, 0.4, 0.36, 0.24)
  kasten(ctx, leib, 14, '#f7f4ee', { basis: 14, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.58, 0.42, 0.12, 0.16), 10, '#d5d8dc', { basis: 16, etagen: 0, fein: los.fein })
  const helm = feld(los, 0.38, 0.38, 0.24, 0.18)
  kasten(ctx, helm, 9, '#f7f4ee', { basis: 28, etagen: 0, fein: los.fein })
  const front = waende(helm, 28)[tuerWand()]
  if (front.sichtbar) {
    const l = lift(mix(front.a, front.b, 0.22), 2)
    const r = lift(mix(front.a, front.b, 0.78), 2)
    quad(ctx, l, r, lift(r, 5), lift(l, 5), '#f4d35e')
    ctx.fillStyle = fade('#ffffff', 0.45)
    ctx.fillRect(l.sx, l.sy - 4, 2, 2)
  }
}

function obelisk(ctx: CanvasRenderingContext2D, los: Los): void {
  kasten(ctx, feld(los, 0.18, 0.32, 0.64, 0.42), 4, STEIN, { fugen: true, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.26, 0.38, 0.48, 0.32), 4, '#b7b3aa', { basis: 4, fugen: true, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.36, 0.44, 0.28, 0.22), 28, '#e4e7ea', { basis: 8, fugen: true, etagen: 0, fein: los.fein })
  kasten(ctx, feld(los, 0.4, 0.46, 0.2, 0.16), 10, '#f7f9fb', { basis: 36, etagen: 0, fein: los.fein })
  kegel(ctx, feld(los, 0.42, 0.48, 0.16, 0.12), 46, 12, '#f4d35e', los.fein)
}

const MALER: Record<Figur, (ctx: CanvasRenderingContext2D, los: Los) => void> = {
  riesenrad,
  apfel,
  schloss,
  wal,
  einhorn,
  zwerg,
  ufo,
  pilz,
  iglu,
  jurte,
  hausboot,
  kopf,
  rakete,
  leuchtturm,
  windrad,
  flamingo,
  moai,
  drache,
  roboter,
  stuhl,
  geist,
  palme,
  kaktus,
  astronaut,
  obelisk,
}
