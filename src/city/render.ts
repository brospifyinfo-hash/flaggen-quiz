// Zeichnet die Stadt als kleines Diorama: schräge Sicht, Schatten, Fassaden mit Fenstern,
// Dächer, Bäume. Alles in ein Canvas, damit auch große Städte flüssig bleiben.
import { koerperVon } from './bau'
import { bauHoehe, drawBuilding, einzug, umrissPunkte } from './buildings'
import { RATHAUS, buildingDef, footprint, roadDef } from './catalog'
import { fade, lift, quad, quadPath, roundedPath, wobble, type Point } from './draw'
import { drawAgent } from './figures'
import { umlauf, type Grund } from './geo'
import { nachRechts, setBlick, setLichtSeite, setProjektion, TILE_H, TILE_W, tiefe, tiefenRichtung, tileNoise, toScreen, zeigtNachVorn, type Blick } from './iso'
import { leuchtSchichtBeginnen, leuchtenLeeren, leuchtenMalen, lichtFuer, setLicht, verdecken, type Licht } from './licht'
import { brennt, type Life } from './life'
import { kriminalitaetsfeld } from './society'
import { nextExpansion, seiteZurStrasse, tilesOf } from './state'
import { drawRoads, strassenMoebel } from './strassen'
import { themeById, type Theme } from './themes'
import type { CityState, Placed } from './types'
import { seedAus, zeichen, zeichenFuerEmoji, type Zeichen } from './zeichen'

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
  /** Tagesstunde der Stadt (0 bis 24) – färbt das Licht über der Karte */
  stunde?: number
}

// ---------------------------------------------------------------------------
// Himmel
// ---------------------------------------------------------------------------

const rgb = (k: [number, number, number], a = 1) => `rgba(${Math.round(k[0])},${Math.round(k[1])},${Math.round(k[2])},${a})`
const mischen = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

/**
 * Der Himmel hinter der Stadt: Verlauf je Tageszeit, Sterne, Sonne oder Mond und ein
 * paar Wolken, die langsam ziehen. Alles im Bildraum, vor der Kamera.
 */
function himmelMalen(ctx: CanvasRenderingContext2D, view: { w: number; h: number }, licht: Licht, zeit: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, view.h)
  sky.addColorStop(0, licht.himmel[0])
  sky.addColorStop(0.55, licht.himmel[1])
  sky.addColorStop(1, licht.himmel[2])
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, view.w, view.h)

  // Sterne, nachts – ein paar funkeln
  if (licht.sterne > 0.02) {
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 110; i++) {
      const x = wobble(i, 1) * view.w
      const y = wobble(i, 2) * view.h * 0.75
      const funkeln = 0.55 + 0.45 * Math.sin(zeit * (1 + wobble(i, 3) * 2) + i)
      const gross = wobble(i, 4) > 0.85 ? 1.6 : 1
      ctx.globalAlpha = licht.sterne * funkeln * (0.5 + wobble(i, 5) * 0.5)
      ctx.fillRect(x, y, gross, gross)
    }
    ctx.globalAlpha = 1
  }

  // Sonne mit Hof
  if (licht.sonne && licht.sonne.alpha > 0.01) {
    const s = licht.sonne
    const x = s.x * view.w
    const y = s.y * view.h
    const hof = ctx.createRadialGradient(x, y, 6, x, y, 120)
    hof.addColorStop(0, s.hof)
    hof.addColorStop(1, 'rgba(255,200,120,0)')
    ctx.globalAlpha = s.alpha
    ctx.fillStyle = hof
    ctx.fillRect(x - 120, y - 120, 240, 240)
    ctx.fillStyle = s.farbe
    ctx.beginPath()
    ctx.arc(x, y, 17, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // Mond als Sichel mit blassem Hof
  if (licht.mond && licht.mond.alpha > 0.01) {
    const m = licht.mond
    const x = m.x * view.w
    const y = m.y * view.h
    ctx.globalAlpha = m.alpha
    const hof = ctx.createRadialGradient(x, y, 8, x, y, 70)
    hof.addColorStop(0, 'rgba(200,215,255,0.35)')
    hof.addColorStop(1, 'rgba(200,215,255,0)')
    ctx.fillStyle = hof
    ctx.fillRect(x - 70, y - 70, 140, 140)
    ctx.fillStyle = '#f4f2e6'
    ctx.beginPath()
    ctx.arc(x, y, 13, 0, Math.PI * 2)
    ctx.fill()
    // Krater
    ctx.fillStyle = 'rgba(180,180,170,0.55)'
    for (const [kx, ky, r] of [
      [-4, -3, 2.4],
      [3, 4, 1.8],
      [5, -5, 1.3],
      [-2, 6, 1.2],
    ]) {
      ctx.beginPath()
      ctx.arc(x + kx, y + ky, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // Wolken: weich, langsam ziehend; nachts dunkel vor dem Himmel
  const tag: [number, number, number] = [255, 255, 255]
  const abend: [number, number, number] = [255, 190, 150]
  const nacht: [number, number, number] = [44, 52, 90]
  const farbe = mischen(mischen(tag, abend, licht.daemmerung * 0.8), nacht, licht.nacht)
  const schatten = mischen(farbe, [120, 130, 170], 0.35 * (1 - licht.nacht))
  const anzahl = 7
  for (let i = 0; i < anzahl; i++) {
    const tempo = 6 + wobble(i, 11) * 8
    const spanne = view.w + 260
    const x = ((wobble(i, 12) * spanne + zeit * tempo) % spanne) - 130
    const y = 20 + wobble(i, 13) * view.h * 0.42
    const gross = 0.7 + wobble(i, 14) * 0.8
    const alpha = 0.55 + wobble(i, 15) * 0.35
    ctx.globalAlpha = alpha * (1 - licht.nacht * 0.45)
    // Unterseite dunkler
    ctx.fillStyle = rgb(schatten)
    wolke(ctx, x, y + 3 * gross, gross)
    ctx.fillStyle = rgb(farbe)
    wolke(ctx, x, y, gross)
  }
  ctx.globalAlpha = 1
}

function wolke(ctx: CanvasRenderingContext2D, x: number, y: number, g: number): void {
  ctx.beginPath()
  ctx.ellipse(x, y, 42 * g, 13 * g, 0, 0, Math.PI * 2)
  ctx.ellipse(x - 20 * g, y + 2 * g, 22 * g, 11 * g, 0, 0, Math.PI * 2)
  ctx.ellipse(x + 8 * g, y - 8 * g, 20 * g, 14 * g, 0, 0, Math.PI * 2)
  ctx.ellipse(x + 26 * g, y + 1 * g, 20 * g, 10 * g, 0, 0, Math.PI * 2)
  ctx.fill()
}

// ---------------------------------------------------------------------------
// Schattenwurf
// ---------------------------------------------------------------------------

/**
 * Die Schatten, die Häuser und Bäume auf den Boden werfen. Richtung und Länge
 * kommen von der Sonne: morgens lang nach rechts, mittags kurz, abends lang nach
 * links. Alle Schatten liegen in einem Pfad, damit sie sich nicht übereinander
 * aufaddieren, wo sie sich überlappen.
 */
function schattenWerfen(ctx: CanvasRenderingContext2D, koerper: (Reihenfolge | null)[], licht: Licht): void {
  const s = licht.schatten
  if (s.alpha < 0.01) return
  ctx.save()
  ctx.beginPath()
  for (const k of koerper) {
    if (!k || k.flach || !k.grund || k.hoehe <= 0) continue
    const fuss = umlauf(k.grund)
    const dx = s.dx * s.laenge * k.hoehe
    const dy = s.dy * s.laenge * k.hoehe
    const kopf = fuss.map((p) => ({ sx: p.sx + dx, sy: p.sy + dy }))
    const rand = huelle([...fuss, ...kopf])
    if (rand.length < 3) continue
    ctx.moveTo(rand[0].sx, rand[0].sy)
    for (let i = 1; i < rand.length; i++) ctx.lineTo(rand[i].sx, rand[i].sy)
    ctx.closePath()
  }
  ctx.fillStyle = `rgba(14,22,48,${s.alpha.toFixed(3)})`
  ctx.fill()
  ctx.restore()
}

/** Umriss eines Baukörpers auf dem Bildschirm: Grundriss und der um die Höhe gehobene Grundriss */
function silhouette(k: Reihenfolge | null): Point[] {
  if (!k || k.flach || !k.grund) return []
  const fuss = umlauf(k.grund)
  // Dächer ragen über die Wandhöhe hinaus – der Zuschlag deckt First, Giebel und Aufbauten ab
  const hoch = k.hoehe * 1.15 + TILE_H * 0.9
  return huelle([...fuss, ...fuss.map((p) => ({ sx: p.sx, sy: p.sy - hoch }))])
}

/** Sprechblase über einem Bauwerk mit einem gezeichneten Zeichen darin */
function drawBubble(ctx: CanvasRenderingContext2D, placed: Placed, art: Zeichen, t: number, seed = 0): void {
  const def = buildingDef(placed.type)
  if (!def) return
  const [w, h] = footprint(def, placed.rot)
  const top = toScreen(placed.x + w / 2, placed.y + h / 2)
  const hover = Math.sin(t * 2.4) * 3
  const y = top.sy - TILE_H * (def.look.height + 1.6) - hover
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 2
  ctx.fillStyle = 'rgba(255,255,255,0.96)'
  roundedPath(ctx, top.sx - 17, y - 17, 34, 30, 12)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.beginPath()
  ctx.moveTo(top.sx - 6, y + 12)
  ctx.lineTo(top.sx + 4, y + 12)
  ctx.lineTo(top.sx - 1, y + 21)
  ctx.closePath()
  ctx.fill()
  zeichen(ctx, art, top.sx, y - 2, 20, seed)
  ctx.restore()
}

/** Ein stilles Zeichen über einem Bauwerk – ohne Sprechblase, halb durchsichtig */
function drawMarke(ctx: CanvasRenderingContext2D, placed: Placed, art: Zeichen, alpha: number): void {
  const def = buildingDef(placed.type)
  if (!def) return
  const [w, h] = footprint(def, placed.rot)
  const top = toScreen(placed.x + w / 2, placed.y + h / 2)
  const y = top.sy - bauHoehe(def.look, placed.level) - 14
  ctx.save()
  ctx.globalAlpha = alpha
  zeichen(ctx, art, top.sx, y, 18)
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

/**
 * Liegt Grundstück A hinter Grundstück B? Zwei Grundstücke überlappen sich nie, also
 * trennt sie mindestens eine Achse – und entlang der Blickrichtung sagt diese Achse
 * genau, wer vor wem steht. Ein Vergleich nach der vordersten Kachel allein irrt bei
 * langen Häusern: Ein kurzes Haus neben dem hinteren Ende eines langen stünde dann
 * plötzlich hinter ihm und verschwände in seiner Wand.
 * -1: A zuerst malen, 1: B zuerst, 0: nicht entscheidbar.
 */
function vorOderHinter(a: Grund, b: Grund, g: { x: number; y: number }): -1 | 0 | 1 {
  const EPS = 1e-6
  const achse = (a0: number, a1: number, b0: number, b1: number, richtung: number): -1 | 0 | 1 => {
    if (Math.abs(richtung) < EPS) return 0
    // b liegt in Richtung größerer Werte: dann steht b vorn, wenn die Tiefe dorthin wächst
    if (a1 <= b0 + EPS) return richtung > 0 ? -1 : 1
    if (b1 <= a0 + EPS) return richtung > 0 ? 1 : -1
    return 0
  }
  const vx = achse(a.x, a.x + a.w, b.x, b.x + b.w, g.x)
  const vy = achse(a.y, a.y + a.h, b.y, b.y + b.h, g.y)
  if (vx === 0) return vy
  if (vy === 0) return vx
  return vx === vy ? vx : 0
}

let reihenfolgeCache: { buildings: Placed[]; gx: number; gy: number; folge: number[] } | null = null

/**
 * Die Reihenfolge, in der Gebäude gemalt werden: von hinten nach vorn, aber paarweise
 * geprüft statt nur nach einer Zahl je Haus. Flache Anlagen kommen zuerst, sie liegen am
 * Boden. Aus den Paaren wird ein Graph; wo er nicht entscheidet, gilt die vorderste Kachel.
 */
function malReihenfolge(buildings: Placed[], koerper: (Reihenfolge | null)[], g: { x: number; y: number }): number[] {
  if (reihenfolgeCache && reihenfolgeCache.buildings === buildings && Math.abs(reihenfolgeCache.gx - g.x) < 1e-4 && Math.abs(reihenfolgeCache.gy - g.y) < 1e-4) {
    return reihenfolgeCache.folge
  }
  const n = buildings.length
  const tiefen = buildings.map((placed) => vorderTiefe(placed))
  const flach: number[] = []
  const hoch: number[] = []
  for (let i = 0; i < n; i++) (koerper[i]?.flach !== false ? flach : hoch).push(i)
  flach.sort((a, b) => tiefen[a] - tiefen[b])

  // Kanten: vor[j] zählt, wie viele Häuser noch vor j gemalt werden müssen
  const danach: number[][] = Array.from({ length: n }, () => [])
  const offen = new Array<number>(n).fill(0)
  for (let p = 0; p < hoch.length; p++) {
    const i = hoch[p]
    const ki = koerper[i]!
    for (let q = p + 1; q < hoch.length; q++) {
      const j = hoch[q]
      const kj = koerper[j]!
      let rel = vorOderHinter(ki.lot, kj.lot, g)
      if (rel === 0) rel = tiefen[i] < tiefen[j] ? -1 : tiefen[i] > tiefen[j] ? 1 : 0
      if (rel === -1) {
        danach[i].push(j)
        offen[j]++
      } else if (rel === 1) {
        danach[j].push(i)
        offen[i]++
      }
    }
  }
  // Kahn: immer das hinterste malbare Haus zuerst; ein Kreis wird beim Hintersten aufgebrochen
  const folge: number[] = [...flach]
  const fertig = new Array<boolean>(n).fill(false)
  let rest = hoch.length
  while (rest > 0) {
    let wahl = -1
    let wahlFrei = -1
    for (const i of hoch) {
      if (fertig[i]) continue
      if (offen[i] === 0) {
        if (wahlFrei === -1 || tiefen[i] < tiefen[wahlFrei]) wahlFrei = i
      } else if (wahl === -1 || tiefen[i] < tiefen[wahl]) wahl = i
    }
    const i = wahlFrei !== -1 ? wahlFrei : wahl
    fertig[i] = true
    rest--
    folge.push(i)
    for (const j of danach[i]) offen[j]--
  }
  reihenfolgeCache = { buildings, gx: g.x, gy: g.y, folge }
  return folge
}

/** Formen ohne Baukörper: Figuren stehen auf ihnen, nie dahinter */
const FLACHE_FORMEN = new Set(['park', 'wasser', 'flach', 'brunnen', 'bank', 'blumen', 'hecke', 'felsen', 'laterne', 'fahne'])

type Reihenfolge = {
  flach: boolean
  lot: Grund
  hmin: number
  hmax: number
  ecken: { h: number; g: number }[]
  /** Baukörper auf der Karte und seine Höhe in Bildpunkten – für den Schattenwurf */
  grund?: Grund
  hoehe: number
}

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
  if (FLACHE_FORMEN.has(look.kind)) return { flach: true, lot, hmin: 0, hmax: 0, ecken: [], hoehe: 0 }
  let k: Grund
  let hoehe = bauHoehe(look, Math.max(1, placed.level))
  if (look.kind === 'baum') {
    k = { x: placed.x + 0.32, y: placed.y + 0.32, w: 0.36, h: 0.36 }
    hoehe *= 0.75
  } else if (look.kind === 'bau' && look.stil) k = koerperVon(lot, look.stil, seiteZurStrasse(city, placed), placed.level, einzug(look, placed.level))
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
  return { flach: false, lot, hmin: Math.min(...hs), hmax: Math.max(...hs), ecken, grund: k, hoehe }
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
function drawGround(ctx: CanvasRenderingContext2D, city: CityState, buildMode: boolean, theme: Theme, fein: boolean): void {
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

  // Grasbüschel und Blümchen auf freien Kacheln – nur dort, wo nichts steht
  if (fein) {
    const belegt = new Set<string>(Object.keys(city.roads))
    for (const placed of city.buildings) for (const t of tilesOf(placed)) belegt.add(`${t.x}:${t.y}`)
    const halme: Point[] = []
    const blumen: Point[] = []
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        if (belegt.has(`${x}:${y}`)) continue
        const n = tileNoise(x * 5 + 2, y * 3 + 7)
        const anzahl = n > 0.7 ? 3 : n > 0.4 ? 2 : 1
        for (let i = 0; i < anzahl; i++) {
          const px = x + 0.12 + tileNoise(x + i * 17, y + i * 29) * 0.76
          const py = y + 0.12 + tileNoise(y + i * 23, x + i * 31) * 0.76
          halme.push(toScreen(px, py))
        }
        if (tileNoise(x * 9 + 1, y * 11 + 4) > 0.9) blumen.push(toScreen(x + 0.3 + tileNoise(x, y * 2) * 0.4, y + 0.3 + tileNoise(y, x * 2) * 0.4))
      }
    }
    ctx.strokeStyle = 'rgba(30,90,40,0.35)'
    ctx.lineWidth = 1
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (const p of halme) {
      ctx.moveTo(p.sx - 1.6, p.sy + 0.8)
      ctx.lineTo(p.sx - 0.6, p.sy - 2.2)
      ctx.moveTo(p.sx, p.sy + 0.8)
      ctx.lineTo(p.sx + 0.4, p.sy - 2.8)
      ctx.moveTo(p.sx + 1.6, p.sy + 0.8)
      ctx.lineTo(p.sx + 1.2, p.sy - 2)
    }
    ctx.stroke()
    if (blumen.length) {
      ctx.fillStyle = 'rgba(255,240,180,0.9)'
      ctx.beginPath()
      for (const p of blumen) {
        ctx.moveTo(p.sx + 1, p.sy)
        ctx.arc(p.sx, p.sy, 1, 0, Math.PI * 2)
        ctx.moveTo(p.sx + 4, p.sy + 1.5)
        ctx.arc(p.sx + 3, p.sy + 1.5, 0.9, 0, Math.PI * 2)
      }
      ctx.fill()
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

/** Etwas, das zwischen den Häusern steht und nach Tiefe eingereiht wird */
type Ding = { x: number; y: number; breite: number; tiefe: number; malen: () => void }

/** Fehler, die schon gemeldet wurden – ein Bild pro Sekunde reicht nicht als Protokoll */
const gemeldet = new Set<string>()

/**
 * Malt die ganze Stadt. Der Aufrufer setzt vorher Größe und Kamera.
 *
 * Geht beim Zeichnen etwas schief, wird der Zeichenzustand wieder aufgeräumt: Ohne
 * das bliebe die Kamera von diesem Bild auf dem Stapel liegen und das nächste Bild
 * würde noch einmal verschoben gemalt – die Stadt erschiene dann viele Male nebeneinander.
 */
export function drawCity(
  ctx: CanvasRenderingContext2D,
  city: CityState,
  camera: Camera,
  view: { w: number; h: number },
  options: DrawOptions = {},
): void {
  const grund = ctx.getTransform()
  try {
    stadtMalen(ctx, city, camera, view, options)
  } catch (fehler) {
    // Alles, was dieses Bild auf den Stapel gelegt hat, wieder herunternehmen –
    // restore() auf leerem Stapel tut nichts, daher darf man großzügig sein
    for (let i = 0; i < 64; i++) ctx.restore()
    ctx.setTransform(grund)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    leuchtenLeeren()
    melden(fehler)
  }
}

function melden(fehler: unknown): void {
  const text = fehler instanceof Error ? `${fehler.name}: ${fehler.message}` : String(fehler)
  if (gemeldet.has(text)) return
  gemeldet.add(text)
  console.error('Stadt konnte nicht gezeichnet werden:', fehler)
}

function stadtMalen(
  ctx: CanvasRenderingContext2D,
  city: CityState,
  camera: Camera,
  view: { w: number; h: number },
  options: DrawOptions,
): void {
  // Zuerst Blick und Licht setzen – alles Weitere rechnet schon damit
  setProjektion('iso')
  setBlick(options.blick ?? 0, city.land)
  const licht = lichtFuer(options.stunde ?? 9)
  setLicht(licht)
  setLichtSeite(licht.zumLicht.sx)
  leuchtenLeeren()
  const theme = themeById(city.theme)
  const zeit = options.time ?? 0

  himmelMalen(ctx, view, licht, zeit)

  const kamera = () => {
    ctx.translate(view.w / 2, view.h / 2)
    ctx.scale(camera.zoom, camera.zoom)
    ctx.translate(-camera.x, -camera.y)
  }

  ctx.save()
  kamera()
  leuchtSchichtBeginnen(ctx)
  // Ein Haus oder eine Figur, die nicht gezeichnet werden kann, soll nicht das ganze
  // Bild abbrechen. Danach steht der Zeichenzustand wieder so da wie nach kamera().
  const kameraMatrix = ctx.getTransform()
  const sicher = (malen: () => void) => {
    try {
      malen()
    } catch (fehler) {
      for (let i = 0; i < 64; i++) ctx.restore()
      ctx.save()
      ctx.setTransform(kameraMatrix)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      melden(fehler)
    }
  }
  // Kleinteile nur zeichnen, wenn man sie auch sehen kann – und nur, solange das
  // Gerät mitkommt. Die Bildrate zählt mehr als eine Fensterbank.
  const fein = camera.zoom >= 0.7 && options.detail !== false

  drawGround(ctx, city, options.buildMode === true, theme, fein)
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

  if (options.kriminalitaet) kriminalitaetZeigen(ctx, city)

  // Maler-Reihenfolge: was weiter hinten liegt, kommt zuerst.
  const g = tiefenRichtung()
  const quer = { x: -g.y, y: g.x }
  const alleKoerper = city.buildings.map((placed) => koerperFuerReihenfolge(city, placed, g, quer))
  const reihenfolge = malReihenfolge(city.buildings, alleKoerper, g)
  const sorted = reihenfolge.map((i) => city.buildings[i])
  const koerper = reihenfolge.map((i) => alleKoerper[i])

  // Die Schatten der Häuser liegen auf dem Boden, unter allem, was darauf steht
  schattenWerfen(ctx, koerper, licht)

  // Alles, was zwischen den Häusern steht: Figuren, Fahrzeuge, Laternen, Ampeln.
  // Jedes kommt direkt nach dem letzten Gebäude, vor dem es steht. Gemessen wird
  // in Blickrichtung und nur dort, wo Ding und Baukörper seitlich überlappen – ein
  // Haus verdeckt nur, was wirklich hinter ihm ist.
  const dinge: Ding[] = []
  if (options.life) {
    for (const agent of options.life.agents) {
      if (agent.zustand === 'drinnen') continue
      dinge.push({
        x: agent.x,
        y: agent.y,
        breite: agent.art === 'auto' || agent.art === 'dienst' ? 0.34 : 0.14,
        tiefe: agent.x * g.x + agent.y * g.y,
        malen: () => drawAgent(ctx, agent, zeit, fein),
      })
    }
  }
  for (const m of strassenMoebel(city, zeit, fein)) {
    dinge.push({ x: m.x, y: m.y, breite: 0.06, tiefe: m.x * g.x + m.y * g.y, malen: () => m.malen(ctx) })
  }

  const faecher: Ding[][] = sorted.map(() => [])
  const danach: Ding[] = []
  for (const ding of dinge) {
    const hp = ding.x * quer.x + ding.y * quer.y
    const gp = ding.tiefe
    let platz = -1
    for (let i = 0; i < koerper.length; i++) {
      const k = koerper[i]
      if (!k) continue
      if (k.flach) {
        // Auf Flachem – Park, Platz, Bank – steht man immer obendrauf
        if (ding.x >= k.lot.x - 0.05 && ding.x <= k.lot.x + k.lot.w + 0.05 && ding.y >= k.lot.y - 0.05 && ding.y <= k.lot.y + k.lot.h + 0.05) platz = i
        continue
      }
      if (hp < k.hmin - ding.breite || hp > k.hmax + ding.breite) continue
      const [gmin, gmax] = sehne(k.ecken, Math.max(k.hmin, Math.min(k.hmax, hp)))
      if (gp >= gmax - 0.02) platz = i
      else if (gp <= gmin) continue
      else platz = i
    }
    ;(platz + 1 < faecher.length ? faecher[platz + 1] : danach).push(ding)
  }
  const malen = (liste: Ding[]) => {
    liste.sort((a, b) => a.tiefe - b.tiefe)
    for (const d of liste) sicher(d.malen)
  }

  for (let i = 0; i < sorted.length; i++) {
    const placed = sorted[i]
    malen(faecher[i])
    verdecken(silhouette(koerper[i]))
    sicher(() => drawBuilding(ctx, placed, zeit, theme, fein, seiteZurStrasse(city, placed)))
    if (brennt(options.life, placed.id)) flammen(ctx, placed, zeit)
    if (placed.id === options.selected) {
      const def = buildingDef(placed.type)
      if (def) {
        const [w, h] = footprint(def, placed.rot)
        outline(ctx, placed.x, placed.y, w, h, '#ffd23f')
      }
    }
  }
  malen(danach)

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

  // Das Licht des Tages: morgens rosig, abends golden, nachts blau – über allem
  if (licht.ton.alpha > 0.005) {
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = rgb(licht.ton.farbe, licht.ton.alpha)
    ctx.fillRect(0, 0, view.w, view.h)
    ctx.restore()
  }
  if (licht.schleier.alpha > 0.005) {
    ctx.fillStyle = rgb(licht.schleier.farbe, licht.schleier.alpha)
    ctx.fillRect(0, 0, view.w, view.h)
  }

  // Was selbst leuchtet, kommt nach der Tönung: Fenster, Laternen, Scheinwerfer
  leuchtenMalen(ctx)
  ctx.save()
  kamera()

  // Zeichen und Blasen liegen über dem Licht – sie gehören zur Bedienung, nicht zur Stadt
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
    drawBubble(ctx, rathaus, 'rathaus', zeit)
  }

  // Wer sich beschwert, sagt es über dem Dach – und eine Ruine trägt ihr Zeichen
  for (const placed of sorted) {
    if (placed.verlassen) {
      if (fein) drawMarke(ctx, placed, 'ruine', 0.7)
    } else if (placed.beschwerde) {
      drawBubble(ctx, placed, zeit % 2 < 1 ? 'wut' : 'zorn', zeit)
    }
  }

  if (options.bubble) {
    const haus = city.buildings.find((placed) => placed.id === options.bubble?.buildingId)
    if (haus) drawBubble(ctx, haus, zeichenFuerEmoji(options.bubble.emoji), zeit, seedAus(options.bubble.emoji + options.bubble.buildingId))
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
