// Sonderbauten in derselben Sprache wie die übrigen Häuser: schattierte Wände,
// Fensterrahmen in der Wandebene, Ziegelreihen auf den Dachflächen. Die Silhouette
// bleibt erkennbar – ein Rad ist ein Rad, ein Apfel ein Apfel, eine Burg eine Burg.
import { buildingDef, footprint, type Figur, type Look } from './catalog'
import { fade, lift, mix, quad, quadPath, shade, wobble, ziegelReihen, type Point } from './draw'
import { NORMALE, SEITEN, schwerpunkt, umlauf, waende, type Grund, type Wand } from './geo'
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
  apfel: 1.55,
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

const WEIT: Partial<Record<Figur, number>> = { riesenrad: 0.72, windrad: 0.9, wal: 0.62, drache: 0.62 }

const STEIN = '#cfc6b6'
const DACHROT = '#8c2e2a'
const PUTZ = '#f4efe6'
const HOLZ = '#6b4423'
const GLAS_HELL = 'rgba(255,224,150,0.92)'

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
  const liste = waendeVon(g, basis)
  liste.forEach((wand, index) => wandMalen(ctx, wand, hoehe, farbe, opt, index === liste.length - 1))
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

function haus(
  ctx: CanvasRenderingContext2D,
  g: Grund,
  wandH: number,
  wandF: string,
  dachF: string,
  opt: Opt & { rise?: number; schlot?: boolean; time?: number; kopf?: boolean },
): void {
  const basis = opt.basis ?? 0
  kasten(ctx, g, wandH, wandF, opt)
  const dachBasis = basis + wandH
  sattel(ctx, g, dachBasis, opt.rise ?? Math.min(TILE_H * 0.55, wandH * 0.7), dachF, opt.fein !== false, opt.kopf)
  if (opt.schlot) schlot(ctx, { x: g.x + g.w * 0.68, y: g.y + g.h * 0.22, w: 0.1, h: 0.1 }, dachBasis, opt.time ?? 0, opt.fein !== false)
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
  const front = waendeVon(g, hoehe).at(-1)
  if (!front) return
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
    const front = waendeVon(teil.g).at(-1)
    if (!front) continue
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

  const nabe = oben(feld(los, los.w * 0.5 - 0.05, los.h * 0.42, 0.1, 0.1), mastH + 6)
  const r = Math.min(los.w, los.h) * 30
  ctx.strokeStyle = '#8a7020'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.arc(nabe.sx, nabe.sy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = '#f4d35e'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(nabe.sx, nabe.sy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = '#6b5420'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.arc(nabe.sx, nabe.sy, r * 0.62, 0, Math.PI * 2)
  ctx.stroke()
  const dreh = los.time * 0.4
  ctx.strokeStyle = '#d4ac0d'
  ctx.lineWidth = 1.5
  for (let i = 0; i < 8; i++) {
    const winkel = dreh + (i / 8) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(nabe.sx, nabe.sy)
    ctx.lineTo(nabe.sx + Math.cos(winkel) * r, nabe.sy + Math.sin(winkel) * r)
    ctx.stroke()
  }
  oval(ctx, nabe.sx, nabe.sy, 5, 5, '#2c3e50')
  oval(ctx, nabe.sx, nabe.sy, 2.2, 2.2, '#e6c15a')
  const farben = ['#e74c3c', '#5dade2', '#27ae60', '#f4d35e', '#af7ac5', '#e67e22', '#f5b7c5', '#1abc9c']
  for (let i = 0; i < 8; i++) {
    const winkel = dreh + (i / 8) * Math.PI * 2
    const gx = nabe.sx + Math.cos(winkel) * r
    const gy = nabe.sy + Math.sin(winkel) * r
    ctx.fillStyle = '#2c3e50'
    ctx.fillRect(gx - 7, gy, 14, 3)
    ctx.fillStyle = farben[i]
    ctx.fillRect(gx - 6.5, gy + 3, 13, 11)
    ctx.fillStyle = shade(farben[i], -28)
    ctx.fillRect(gx - 6.5, gy + 3, 3, 11)
    ctx.fillStyle = fade('#ffffff', 0.55)
    ctx.fillRect(gx - 3, gy + 5, 6, 4)
    ctx.strokeStyle = shade(farben[i], -40)
    ctx.lineWidth = 1
    ctx.strokeRect(gx - 6.5, gy + 3, 13, 11)
  }
  for (let i = vorne; i < teile.length; i++) teile[i].mal()
}

function apfel(ctx: CanvasRenderingContext2D, los: Los): void {
  const sockel = feld(los, 0.16, 0.28, 0.68, 0.5)
  kasten(ctx, sockel, 8, STEIN, { fugen: true, etagen: 0, fein: los.fein })
  const p = oben(sockel, 8)
  const s = 16
  oval(ctx, p.sx + 1, p.sy - s * 0.2, s * 0.95, s * 0.72, '#7b241c')
  oval(ctx, p.sx, p.sy - s * 0.55, s * 1.05, s * 0.95, '#c0392b')
  oval(ctx, p.sx - s * 0.12, p.sy - s * 0.85, s * 0.78, s * 0.62, '#e74c3c')
  oval(ctx, p.sx - s * 0.35, p.sy - s * 1.05, s * 0.28, s * 0.16, fade('#f5b7b1', 0.85))
  ctx.fillStyle = '#922b21'
  ctx.beginPath()
  ctx.moveTo(p.sx - s * 0.16, p.sy - s * 1.35)
  ctx.quadraticCurveTo(p.sx, p.sy - s * 0.95, p.sx + s * 0.16, p.sy - s * 1.35)
  ctx.quadraticCurveTo(p.sx, p.sy - s * 1.15, p.sx - s * 0.16, p.sy - s * 1.35)
  ctx.fill()
  ctx.strokeStyle = '#6b4423'
  ctx.lineWidth = 2.4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(p.sx, p.sy - s * 1.32)
  ctx.quadraticCurveTo(p.sx + 2, p.sy - s * 1.7, p.sx + 4, p.sy - s * 1.85)
  ctx.stroke()
  ctx.fillStyle = '#1e8449'
  ctx.beginPath()
  ctx.ellipse(p.sx + s * 0.45, p.sy - s * 1.7, s * 0.38, s * 0.16, -0.7, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#145a32'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(p.sx + 4, p.sy - s * 1.72)
  ctx.lineTo(p.sx + s * 0.7, p.sy - s * 1.68)
  ctx.stroke()
  // Tür im Apfel, damit er ein Gebäude bleibt und keine flache Frucht
  ctx.fillStyle = '#4a241c'
  ctx.beginPath()
  ctx.moveTo(p.sx - 4, p.sy - 2)
  ctx.lineTo(p.sx + 4, p.sy - 2)
  ctx.lineTo(p.sx + 4, p.sy - 12)
  ctx.quadraticCurveTo(p.sx, p.sy - 16, p.sx - 4, p.sy - 12)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#e6c15a'
  ctx.fillRect(p.sx + 1.5, p.sy - 8, 1.2, 1.2)
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
  const front = waendeVon(fuss).at(-1)
  if (front) bogen(ctx, front, 0, 0.14, 9, '#5d6d7e')
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
  kasten(ctx, rumpf, 8, '#8c5a3a', { etagen: 0, fugen: true, fein: los.fein })
  const bug = waendeVon(rumpf).at(-1)
  if (bug) {
    const l = bug.a
    const r = bug.b
    const spitze = { sx: (l.sx + r.sx) / 2 + bug.raus.sx * 14, sy: (l.sy + r.sy) / 2 + bug.raus.sy * 14 }
    quad(ctx, l, r, lift(spitze, 8), lift(spitze, 8), '#6e4630')
    quad(ctx, lift(l, 8), lift(r, 8), lift(spitze, 8), lift(spitze, 8), '#a56b42')
  }
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
  const flamme = oben(leib, 1)
  ctx.save()
  ctx.globalAlpha = 0.9
  ctx.fillStyle = Math.sin(los.time * 12) > 0 ? '#f4d35e' : '#e67e22'
  ctx.beginPath()
  ctx.moveTo(flamme.sx - 5, flamme.sy - 2)
  ctx.lineTo(flamme.sx + 5, flamme.sy - 2)
  ctx.lineTo(flamme.sx, flamme.sy + 12)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
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
  if (an) {
    const scheibe = oben(laterne, 50)
    ctx.save()
    ctx.globalAlpha = 0.22
    ctx.fillStyle = '#f4d35e'
    ctx.beginPath()
    ctx.moveTo(scheibe.sx, scheibe.sy)
    ctx.lineTo(scheibe.sx + 36, scheibe.sy - 8)
    ctx.lineTo(scheibe.sx + 36, scheibe.sy + 10)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  kegel(ctx, laterne, 54, 10, DACHROT, los.fein)
  haus(ctx, hausG, 16, PUTZ, '#5d6d7e', { etagen: 1, tuer: true, fein: los.fein, rise: 10, schlot: true, time: los.time })
}

function windrad(ctx: CanvasRenderingContext2D, los: Los): void {
  const fuss = feld(los, 0.3, 0.38, 0.4, 0.32)
  haus(ctx, fuss, 12, '#e7eef2', '#8d99a6', { etagen: 1, tuer: true, fein: los.fein, rise: 8 })
  const mast = feld(los, 0.44, 0.46, 0.12, 0.12)
  kasten(ctx, mast, 52, '#f7f9fb', { basis: 10, etagen: 0, fein: los.fein })
  const nabe = oben(mast, 64)
  kasten(ctx, feld(los, 0.4, 0.42, 0.2, 0.16), 6, '#5d6d7e', { basis: 60, etagen: 0, fein: los.fein })
  ctx.strokeStyle = '#f4f7fb'
  ctx.lineWidth = 3.2
  ctx.lineCap = 'round'
  const dreh = los.time * 0.8
  for (let i = 0; i < 3; i++) {
    const w = dreh + (i * 2 * Math.PI) / 3
    ctx.beginPath()
    ctx.moveTo(nabe.sx, nabe.sy)
    ctx.lineTo(nabe.sx + Math.cos(w) * 28, nabe.sy + Math.sin(w) * 28)
    ctx.stroke()
    ctx.strokeStyle = '#d5dde6'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(nabe.sx, nabe.sy)
    ctx.lineTo(nabe.sx + Math.cos(w) * 26, nabe.sy + Math.sin(w) * 26)
    ctx.stroke()
    ctx.strokeStyle = '#f4f7fb'
    ctx.lineWidth = 3.2
  }
  oval(ctx, nabe.sx, nabe.sy, 3.2, 3.2, '#2c3e50')
}

function geist(ctx: CanvasRenderingContext2D, los: Los): void {
  const g = feld(los, 0.08, 0.12, los.w - 0.2, los.h - 0.28)
  haus(ctx, g, 24, '#3c3358', '#6c3483', { etagen: 2, tuer: true, fein: los.fein, rise: 14, schlot: true, time: los.time })
  const front = waendeVon(g).at(-1)
  if (front) bogen(ctx, front, 0, 0.18, 12, '#120c18')
  const schiene = feld(los, 0.15, los.h - 0.22, los.w - 0.3, 0.08)
  kasten(ctx, schiene, 2, '#5d6d7e', { etagen: 0, fein: los.fein })
  const gy = oben(g, 36 + Math.sin(los.time * 2) * 2)
  ctx.save()
  ctx.globalAlpha = 0.88
  ctx.fillStyle = '#f7f4ee'
  ctx.beginPath()
  ctx.moveTo(gy.sx - 7, gy.sy)
  ctx.quadraticCurveTo(gy.sx - 8, gy.sy - 16, gy.sx, gy.sy - 18)
  ctx.quadraticCurveTo(gy.sx + 8, gy.sy - 16, gy.sx + 7, gy.sy)
  ctx.quadraticCurveTo(gy.sx + 4, gy.sy - 3, gy.sx, gy.sy - 1)
  ctx.quadraticCurveTo(gy.sx - 4, gy.sy - 3, gy.sx - 7, gy.sy)
  ctx.fill()
  ctx.fillStyle = '#2c3e50'
  ctx.fillRect(gy.sx - 3, gy.sy - 12, 1.6, 1.6)
  ctx.fillRect(gy.sx + 1.6, gy.sy - 12, 1.6, 1.6)
  ctx.restore()
}

function ufo(ctx: CanvasRenderingContext2D, los: Los): void {
  const stiel = feld(los, 0.42, 0.44, 0.16, 0.14)
  kasten(ctx, stiel, 14, '#aeb6bf', { etagen: 0, fein: los.fein })
  const disc = feld(los, 0.16, 0.2, 0.68, 0.58)
  kasten(ctx, disc, 7, '#d5dbe2', { basis: 12, etagen: 1, fein: los.fein })
  const mit = oben(disc, 16)
  oval(ctx, mit.sx, mit.sy + 2, 22, 9, '#8d99a6')
  oval(ctx, mit.sx, mit.sy - 1, 22, 8, '#eef2f6')
  const an = Math.sin(los.time * 4) > 0
  for (let i = -2; i <= 2; i++) oval(ctx, mit.sx + i * 8, mit.sy + 1, 1.7, 1.3, an && i % 2 === 0 ? '#f4d35e' : '#e74c3c')
  const kuppel = feld(los, 0.34, 0.34, 0.32, 0.28)
  kasten(ctx, kuppel, 8, '#9aa6ff', { basis: 18, etagen: 1, fein: los.fein })
  kegel(ctx, kuppel, 26, 8, '#b7c0ff', los.fein, '#e8ecff')
}

function sockel(ctx: CanvasRenderingContext2D, los: Los, farbe = STEIN): Grund {
  const g = feld(los, 0.22, 0.34, 0.56, 0.4)
  kasten(ctx, g, 6, farbe, { fugen: true, etagen: 0, fein: los.fein })
  return g
}

function wal(ctx: CanvasRenderingContext2D, los: Los): void {
  const g = feld(los, 0.06, 0.38, 0.88, 0.28)
  kasten(ctx, g, 5, STEIN, { fugen: true, etagen: 0, fein: los.fein })
  const a = oben(feld(los, 0.1, 0.45, 0.1, 0.1), 5)
  const b = oben(feld(los, 0.8, 0.48, 0.1, 0.1), 5)
  ctx.strokeStyle = '#f7f4ee'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(a.sx, a.sy)
  ctx.quadraticCurveTo((a.sx + b.sx) / 2, a.sy - 22, b.sx, b.sy)
  ctx.stroke()
  for (let i = 0; i < 7; i++) {
    const t = (i + 0.5) / 7
    const x = a.sx + (b.sx - a.sx) * t
    const scheitel = a.sy - Math.sin(t * Math.PI) * 20
    ctx.strokeStyle = i % 2 ? '#e8e4dc' : '#f7f4ee'
    ctx.lineWidth = 2.2
    ctx.beginPath()
    ctx.moveTo(x - 6, a.sy)
    ctx.quadraticCurveTo(x, scheitel, x + 6, a.sy + 1)
    ctx.stroke()
  }
  const kopf = oben(feld(los, 0.08, 0.4, 0.16, 0.16), 8)
  oval(ctx, kopf.sx, kopf.sy - 6, 8, 6, '#f7f4ee')
  oval(ctx, kopf.sx - 2, kopf.sy - 8, 1.4, 1.4, '#2c3e50')
}

function einhorn(ctx: CanvasRenderingContext2D, los: Los): void {
  const boden = sockel(ctx, los)
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
  const auge = oben(kopf, 34)
  oval(ctx, auge.sx + 2, auge.sy, 1.3, 1.3, '#2c3e50')
  ctx.strokeStyle = '#f5b7c5'
  ctx.lineWidth = 2
  ctx.beginPath()
  const m = oben(leib, 26)
  ctx.moveTo(m.sx, m.sy)
  ctx.quadraticCurveTo(m.sx - 8, m.sy - 8, m.sx - 4, m.sy - 14)
  ctx.stroke()
  const schweif = oben(boden, 18)
  ctx.beginPath()
  ctx.moveTo(schweif.sx - 6, schweif.sy - 8)
  ctx.quadraticCurveTo(schweif.sx - 16, schweif.sy - 4, schweif.sx - 12, schweif.sy + 2)
  ctx.stroke()
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
  const front = waendeVon(leib, 6).at(-1)
  if (front) {
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
  const auge = oben(kopf, 18)
  oval(ctx, auge.sx, auge.sy, 1.4, 1.4, '#f4d35e')
  const ruecken = oben(feld(los, 0.4, 0.44, 0.1, 0.1), 16)
  ctx.fillStyle = '#145232'
  ctx.beginPath()
  ctx.moveTo(ruecken.sx - 10, ruecken.sy)
  ctx.lineTo(ruecken.sx, ruecken.sy - 14)
  ctx.lineTo(ruecken.sx + 8, ruecken.sy + 2)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(ruecken.sx + 6, ruecken.sy + 4)
  ctx.lineTo(ruecken.sx + 18, ruecken.sy - 8)
  ctx.lineTo(ruecken.sx + 16, ruecken.sy + 6)
  ctx.closePath()
  ctx.fill()
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
  const antenne = oben(kopf, 40)
  ctx.strokeStyle = '#7f8c8d'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(antenne.sx, antenne.sy)
  ctx.lineTo(antenne.sx, antenne.sy - 8)
  ctx.stroke()
  oval(ctx, antenne.sx, antenne.sy - 9, 2, 2, '#e74c3c')
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
  stamm.forEach((z, i) => {
    const seit = (i % 2 === 0 ? -0.02 : 0.02) * i
    kasten(ctx, feld(los, 0.44 + seit, 0.48, 0.12, 0.12), 8, '#8c5a3a', { basis: 8 + z, etagen: 0, fugen: true, fein: los.fein })
  })
  const krone = oben(feld(los, 0.46, 0.5, 0.1, 0.1), 42)
  for (let i = 0; i < 6; i++) {
    const w = -2.2 + i * 0.7
    ctx.strokeStyle = i % 2 ? '#27ae60' : '#1e8449'
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(krone.sx, krone.sy)
    ctx.quadraticCurveTo(krone.sx + Math.cos(w) * 10, krone.sy + Math.sin(w) * 4, krone.sx + Math.cos(w) * 18, krone.sy + Math.sin(w) * 8)
    ctx.stroke()
  }
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
  const front = waendeVon(helm, 28).at(-1)
  if (front) {
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
