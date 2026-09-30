// Eigene Silhouetten. Ein Riesenrad ist ein Rad, ein Apfel ist ein Apfel, ein Schloss
// hat Türme. Alles andere bleibt beim normalen Baukasten.
import { buildingDef, footprint, type Figur, type Look } from './catalog'
import { fade, lift, quad, shade, type Point } from './draw'
import { SEITEN, schwerpunkt, umlauf, waende, type Grund, type Seite } from './geo'
import { TILE_H, TILE_W, toScreen } from './iso'
import type { Placed } from './types'

interface Buehne {
  cx: number
  cy: number
  s: number
  time: number
}

const HOCH: Record<Figur, number> = {
  riesenrad: 2.5,
  apfel: 1.35,
  schloss: 3.1,
  wal: 1.15,
  einhorn: 1.25,
  zwerg: 1.45,
  ufo: 1.15,
  pilz: 1.35,
  iglu: 1.05,
  jurte: 1.15,
  hausboot: 0.95,
  kopf: 1.45,
  rakete: 1.7,
  leuchtturm: 2.15,
  windrad: 2.35,
  flamingo: 1.35,
  moai: 1.45,
  drache: 1.2,
  roboter: 1.45,
  stuhl: 1.35,
  geist: 1.45,
  palme: 1.55,
  kaktus: 1.25,
  astronaut: 1.45,
  obelisk: 1.8,
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
  const breit = Math.max(w, h) * TILE_W * 0.48
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
  _fein: boolean,
): boolean {
  if (!look.figur) return false
  const def = buildingDef(placed.type)
  if (!def) return false
  const [w, h] = footprint(def, placed.rot)
  const m = toScreen(placed.x + w / 2, placed.y + h / 2)
  const b: Buehne = { cx: m.sx, cy: m.sy, s: Math.max(w, h) * 15.5, time }
  if (look.figur === 'schloss') schloss(ctx, placed, w, h, time)
  else MALER[look.figur](ctx, b)
  return true
}

function schatten(ctx: CanvasRenderingContext2D, b: Buehne, rx: number): void {
  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.beginPath()
  ctx.ellipse(b.cx, b.cy + 2, rx, rx * 0.36, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#0b1424'
  ctx.fill()
  ctx.restore()
}

function oval(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  farbe: string,
  dreh = 0,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(dreh)
  ctx.beginPath()
  ctx.ellipse(0, 0, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2)
  ctx.fillStyle = farbe
  ctx.fill()
  ctx.restore()
}

function strich(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  farbe: string,
  breite: number,
): void {
  ctx.strokeStyle = farbe
  ctx.lineWidth = breite
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
}

function apfel(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.7)
  ctx.fillStyle = '#b7b1a6'
  ctx.fillRect(cx - s * 0.42, cy - s * 0.16, s * 0.84, s * 0.16)
  ctx.fillStyle = '#9a948a'
  ctx.fillRect(cx - s * 0.42, cy - s * 0.16, s * 0.84, s * 0.04)
  const my = cy - s * 0.78
  oval(ctx, cx, my + s * 0.08, s * 0.62, s * 0.5, '#a93226')
  oval(ctx, cx, my, s * 0.58, s * 0.52, '#e74c3c')
  oval(ctx, cx - s * 0.16, my - s * 0.12, s * 0.22, s * 0.16, '#f5b7b1')
  // Kerbe oben, Stiel, Blatt – ohne die drei ist es nur ein roter Kreis
  ctx.fillStyle = '#922b21'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.08, my - s * 0.48)
  ctx.quadraticCurveTo(cx, my - s * 0.28, cx + s * 0.08, my - s * 0.48)
  ctx.quadraticCurveTo(cx, my - s * 0.4, cx - s * 0.08, my - s * 0.48)
  ctx.fill()
  strich(ctx, cx, my - s * 0.46, cx + s * 0.08, my - s * 0.78, '#6b4423', Math.max(2, s * 0.07))
  oval(ctx, cx + s * 0.28, my - s * 0.7, s * 0.22, s * 0.1, '#1e8449', -0.7)
  ctx.fillStyle = '#145a32'
  ctx.beginPath()
  ctx.moveTo(cx + s * 0.1, my - s * 0.66)
  ctx.lineTo(cx + s * 0.46, my - s * 0.74)
  ctx.strokeStyle = '#145a32'
  ctx.lineWidth = 1
  ctx.stroke()
}

function riesenrad(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s, time } = b
  const r = s * 1.55
  const nabeY = cy - r - s * 0.15
  schatten(ctx, b, r * 0.85)
  // Kasse am Fuß, damit es ein Fahrgeschäft ist und kein Turm
  ctx.fillStyle = '#f4d35e'
  ctx.fillRect(cx - s * 0.55, cy - s * 0.38, s * 0.7, s * 0.38)
  ctx.fillStyle = '#c0392b'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.62, cy - s * 0.38)
  ctx.lineTo(cx + s * 0.22, cy - s * 0.38)
  ctx.lineTo(cx - s * 0.2, cy - s * 0.62)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#5d6d7e'
  ctx.lineWidth = Math.max(3, s * 0.09)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.85, cy)
  ctx.lineTo(cx, nabeY)
  ctx.lineTo(cx + s * 0.85, cy)
  ctx.stroke()
  ctx.strokeStyle = '#f4d35e'
  ctx.lineWidth = Math.max(3, s * 0.1)
  ctx.beginPath()
  ctx.arc(cx, nabeY, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = '#d4ac0d'
  ctx.lineWidth = Math.max(1.5, s * 0.045)
  const dreh = time * 0.45
  for (let i = 0; i < 8; i++) {
    const winkel = dreh + (i / 8) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx, nabeY)
    ctx.lineTo(cx + Math.cos(winkel) * r, nabeY + Math.sin(winkel) * r)
    ctx.stroke()
  }
  oval(ctx, cx, nabeY, s * 0.16, s * 0.16, '#2c3e50')
  const farben = ['#e74c3c', '#5dade2', '#27ae60', '#f4d35e', '#af7ac5', '#e67e22', '#f5b7c5', '#1abc9c']
  for (let i = 0; i < 8; i++) {
    const winkel = dreh + (i / 8) * Math.PI * 2
    const gx = cx + Math.cos(winkel) * r
    const gy = nabeY + Math.sin(winkel) * r
    ctx.fillStyle = farben[i]
    ctx.fillRect(gx - s * 0.16, gy - s * 0.02, s * 0.32, s * 0.26)
    ctx.fillStyle = fade('#ffffff', 0.55)
    ctx.fillRect(gx - s * 0.1, gy + s * 0.04, s * 0.2, s * 0.1)
  }
}

function wal(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 1.15)
  ctx.strokeStyle = '#f7f4ee'
  ctx.lineWidth = Math.max(2.5, s * 0.07)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - s * 1.15, cy - s * 0.15)
  ctx.quadraticCurveTo(cx, cy - s * 0.85, cx + s * 1.05, cy - s * 0.25)
  ctx.stroke()
  for (let i = 0; i < 6; i++) {
    const t = i / 5
    const x = cx - s * 0.85 + t * s * 1.55
    const scheitel = cy - s * (0.35 + Math.sin(t * Math.PI) * 0.7)
    ctx.beginPath()
    ctx.moveTo(x - s * 0.22, cy - s * 0.05)
    ctx.quadraticCurveTo(x, scheitel, x + s * 0.22, cy - s * 0.05)
    ctx.stroke()
  }
  // Schädel
  oval(ctx, cx - s * 1.15, cy - s * 0.28, s * 0.28, s * 0.2, '#f7f4ee')
  ctx.fillStyle = '#d5d8dc'
  ctx.beginPath()
  ctx.moveTo(cx - s * 1.35, cy - s * 0.18)
  ctx.lineTo(cx - s * 0.95, cy - s * 0.18)
  ctx.lineTo(cx - s * 1.05, cy - s * 0.02)
  ctx.closePath()
  ctx.fill()
}

function einhorn(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.85)
  const bein = (x: number) => {
    ctx.fillStyle = '#f7f4ee'
    ctx.fillRect(x, cy - s * 0.42, s * 0.08, s * 0.42)
  }
  bein(cx - s * 0.42)
  bein(cx - s * 0.22)
  bein(cx + s * 0.18)
  bein(cx + s * 0.38)
  oval(ctx, cx, cy - s * 0.62, s * 0.55, s * 0.28, '#f7f4ee')
  oval(ctx, cx + s * 0.62, cy - s * 0.95, s * 0.22, s * 0.16, '#f7f4ee')
  strich(ctx, cx + s * 0.48, cy - s * 0.72, cx + s * 0.58, cy - s * 0.88, '#f7f4ee', s * 0.12)
  // Horn
  ctx.fillStyle = '#f4d35e'
  ctx.beginPath()
  ctx.moveTo(cx + s * 0.7, cy - s * 1.05)
  ctx.lineTo(cx + s * 0.95, cy - s * 1.55)
  ctx.lineTo(cx + s * 0.82, cy - s * 1.02)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#f5b7c5'
  ctx.lineWidth = Math.max(2, s * 0.08)
  ctx.beginPath()
  ctx.moveTo(cx + s * 0.45, cy - s * 0.82)
  ctx.quadraticCurveTo(cx + s * 0.2, cy - s * 1.05, cx + s * 0.35, cy - s * 0.7)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.5, cy - s * 0.62)
  ctx.quadraticCurveTo(cx - s * 0.85, cy - s * 0.4, cx - s * 0.7, cy - s * 0.2)
  ctx.stroke()
  oval(ctx, cx + s * 0.68, cy - s * 0.98, s * 0.035, s * 0.035, '#2c3e50')
}

function zwerg(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.45)
  ctx.fillStyle = '#2c3e50'
  ctx.fillRect(cx - s * 0.22, cy - s * 0.16, s * 0.16, s * 0.16)
  ctx.fillRect(cx + s * 0.06, cy - s * 0.16, s * 0.16, s * 0.16)
  oval(ctx, cx, cy - s * 0.55, s * 0.32, s * 0.38, '#1e8449')
  oval(ctx, cx, cy - s * 0.72, s * 0.28, s * 0.22, '#f7f4ee')
  oval(ctx, cx, cy - s * 0.95, s * 0.2, s * 0.16, '#f5cba7')
  oval(ctx, cx - s * 0.07, cy - s * 0.98, s * 0.03, s * 0.03, '#2c3e50')
  oval(ctx, cx + s * 0.07, cy - s * 0.98, s * 0.03, s * 0.03, '#2c3e50')
  ctx.fillStyle = '#c0392b'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.28, cy - s * 1.05)
  ctx.lineTo(cx + s * 0.28, cy - s * 1.05)
  ctx.lineTo(cx + s * 0.04, cy - s * 1.85)
  ctx.closePath()
  ctx.fill()
  oval(ctx, cx, cy - s * 1.02, s * 0.3, s * 0.08, '#f4d35e')
}

function ufo(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s, time } = b
  schatten(ctx, b, s * 0.7)
  const y = cy - s * 0.85
  ctx.strokeStyle = '#aeb6bf'
  ctx.lineWidth = Math.max(2, s * 0.06)
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx, y + s * 0.15)
  ctx.stroke()
  oval(ctx, cx, y, s * 0.85, s * 0.22, '#d5d8dc')
  oval(ctx, cx, y - s * 0.02, s * 0.72, s * 0.16, '#aeb6bf')
  oval(ctx, cx, y - s * 0.16, s * 0.28, s * 0.22, '#7d7fff')
  const an = Math.sin(time * 4) > 0
  for (let i = -2; i <= 2; i++) {
    oval(ctx, cx + i * s * 0.28, y + s * 0.02, s * 0.06, s * 0.06, an && i % 2 === 0 ? '#f4d35e' : '#e74c3c')
  }
  ctx.save()
  ctx.globalAlpha = 0.28
  ctx.fillStyle = '#7d7fff'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.35, y + s * 0.12)
  ctx.lineTo(cx + s * 0.35, y + s * 0.12)
  ctx.lineTo(cx + s * 0.12, cy)
  ctx.lineTo(cx - s * 0.12, cy)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function pilz(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.7)
  ctx.fillStyle = '#f4e1c1'
  ctx.fillRect(cx - s * 0.28, cy - s * 0.7, s * 0.56, s * 0.7)
  ctx.fillStyle = '#6b4423'
  ctx.fillRect(cx - s * 0.1, cy - s * 0.28, s * 0.2, s * 0.28)
  oval(ctx, cx, cy - s * 0.48, s * 0.08, s * 0.08, '#5dade2')
  oval(ctx, cx, cy - s * 0.95, s * 0.78, s * 0.42, '#c0392b')
  oval(ctx, cx, cy - s * 1.02, s * 0.7, s * 0.28, '#e74c3c')
  for (const [dx, dy] of [
    [-0.35, -0.95],
    [0.2, -1.15],
    [0.4, -0.85],
    [-0.05, -1.2],
  ] as const) {
    oval(ctx, cx + dx * s, cy + dy * s, s * 0.1, s * 0.07, '#f7f4ee')
  }
}

function iglu(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.7)
  ctx.fillStyle = '#f7f4ee'
  ctx.beginPath()
  ctx.arc(cx, cy - s * 0.05, s * 0.72, Math.PI, 0)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#d5d8dc'
  ctx.lineWidth = 1.4
  for (let i = 1; i <= 3; i++) {
    const ry = s * 0.72 * (1 - i * 0.22)
    ctx.beginPath()
    ctx.ellipse(cx, cy - s * 0.05, s * 0.72 * (1 - i * 0.08), ry, 0, Math.PI, 0)
    ctx.stroke()
  }
  ctx.fillStyle = '#5d6d7e'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.18, cy)
  ctx.lineTo(cx + s * 0.18, cy)
  ctx.lineTo(cx + s * 0.12, cy - s * 0.32)
  ctx.quadraticCurveTo(cx, cy - s * 0.46, cx - s * 0.12, cy - s * 0.32)
  ctx.closePath()
  ctx.fill()
}

function jurte(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.75)
  ctx.fillStyle = '#f4e1c1'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.7, cy)
  ctx.lineTo(cx - s * 0.55, cy - s * 0.55)
  ctx.lineTo(cx + s * 0.55, cy - s * 0.55)
  ctx.lineTo(cx + s * 0.7, cy)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#c0392b'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.58, cy - s * 0.52)
  ctx.lineTo(cx, cy - s * 1.25)
  ctx.lineTo(cx + s * 0.58, cy - s * 0.52)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#6b4423'
  ctx.lineWidth = 1.2
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath()
    ctx.moveTo(cx + i * s * 0.18, cy)
    ctx.lineTo(cx + i * s * 0.1, cy - s * 0.52)
    ctx.stroke()
  }
  ctx.fillStyle = '#6b4423'
  ctx.fillRect(cx - s * 0.12, cy - s * 0.36, s * 0.24, s * 0.36)
  oval(ctx, cx, cy - s * 1.28, s * 0.08, s * 0.08, '#2c3e50')
}

function hausboot(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  ctx.save()
  ctx.globalAlpha = 0.85
  oval(ctx, cx, cy + s * 0.05, s * 0.95, s * 0.22, '#1a5276')
  ctx.restore()
  ctx.fillStyle = '#8c5a3a'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.85, cy - s * 0.05)
  ctx.lineTo(cx + s * 0.85, cy - s * 0.05)
  ctx.lineTo(cx + s * 0.6, cy - s * 0.32)
  ctx.lineTo(cx - s * 0.6, cy - s * 0.32)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#f7f1e4'
  ctx.fillRect(cx - s * 0.32, cy - s * 0.72, s * 0.5, s * 0.42)
  ctx.fillStyle = '#a8563c'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.4, cy - s * 0.72)
  ctx.lineTo(cx + s * 0.26, cy - s * 0.72)
  ctx.lineTo(cx - s * 0.07, cy - s * 0.98)
  ctx.closePath()
  ctx.fill()
  oval(ctx, cx - s * 0.08, cy - s * 0.52, s * 0.08, s * 0.08, '#5dade2')
}

function kopf(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.55)
  // Dach zeigt nach unten, Tür hängt oben
  ctx.fillStyle = '#a8563c'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.7, cy - s * 0.55)
  ctx.lineTo(cx + s * 0.7, cy - s * 0.55)
  ctx.lineTo(cx, cy - s * 0.05)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#f7f1e4'
  ctx.fillRect(cx - s * 0.48, cy - s * 1.35, s * 0.96, s * 0.82)
  ctx.fillStyle = '#5dade2'
  ctx.fillRect(cx - s * 0.32, cy - s * 1.15, s * 0.22, s * 0.22)
  ctx.fillRect(cx + s * 0.08, cy - s * 1.15, s * 0.22, s * 0.22)
  ctx.fillStyle = '#6b4423'
  ctx.fillRect(cx - s * 0.1, cy - s * 1.32, s * 0.2, s * 0.28)
  strich(ctx, cx + s * 0.28, cy - s * 0.55, cx + s * 0.28, cy + s * 0.02, '#5d6d7e', Math.max(2, s * 0.06))
  ctx.fillStyle = '#7f8c8d'
  ctx.fillRect(cx + s * 0.18, cy - s * 0.08, s * 0.2, s * 0.12)
}

function rakete(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.4)
  ctx.fillStyle = '#e74c3c'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.28, cy - s * 0.35)
  ctx.lineTo(cx - s * 0.55, cy)
  ctx.lineTo(cx - s * 0.12, cy - s * 0.15)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx + s * 0.28, cy - s * 0.35)
  ctx.lineTo(cx + s * 0.55, cy)
  ctx.lineTo(cx + s * 0.12, cy - s * 0.15)
  ctx.fill()
  ctx.fillStyle = '#f7f4ee'
  ctx.fillRect(cx - s * 0.22, cy - s * 1.35, s * 0.44, s * 1.05)
  oval(ctx, cx, cy - s * 0.85, s * 0.1, s * 0.1, '#5dade2')
  ctx.fillStyle = '#e74c3c'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.22, cy - s * 1.35)
  ctx.lineTo(cx + s * 0.22, cy - s * 1.35)
  ctx.lineTo(cx, cy - s * 1.75)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#e67e22'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.1, cy - s * 0.3)
  ctx.lineTo(cx + s * 0.1, cy - s * 0.3)
  ctx.lineTo(cx, cy - s * 0.02)
  ctx.closePath()
  ctx.fill()
}

function leuchtturm(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s, time } = b
  schatten(ctx, b, s * 0.4)
  ctx.fillStyle = '#f7f4ee'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.32, cy)
  ctx.lineTo(cx + s * 0.32, cy)
  ctx.lineTo(cx + s * 0.18, cy - s * 1.45)
  ctx.lineTo(cx - s * 0.18, cy - s * 1.45)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#c0392b'
  for (let i = 0; i < 3; i++) {
    const y = cy - s * (0.35 + i * 0.38)
    ctx.fillRect(cx - s * (0.3 - i * 0.03), y, s * (0.6 - i * 0.06), s * 0.1)
  }
  ctx.fillStyle = '#2c3e50'
  ctx.fillRect(cx - s * 0.22, cy - s * 1.62, s * 0.44, s * 0.2)
  oval(ctx, cx, cy - s * 1.5, s * 0.1, s * 0.08, Math.sin(time * 3) > 0 ? '#f4d35e' : '#f7e7a2')
  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.fillStyle = '#f4d35e'
  ctx.beginPath()
  ctx.moveTo(cx + s * 0.2, cy - s * 1.55)
  ctx.lineTo(cx + s * 1.3, cy - s * 1.85)
  ctx.lineTo(cx + s * 1.3, cy - s * 1.25)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function windrad(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s, time } = b
  schatten(ctx, b, s * 0.35)
  strich(ctx, cx, cy, cx, cy - s * 1.7, '#f7f4ee', Math.max(3, s * 0.08))
  const ny = cy - s * 1.7
  oval(ctx, cx, ny, s * 0.1, s * 0.1, '#5d6d7e')
  ctx.strokeStyle = '#f7f4ee'
  ctx.lineWidth = Math.max(3, s * 0.07)
  ctx.lineCap = 'round'
  const dreh = time * 0.8
  for (let i = 0; i < 3; i++) {
    const w = dreh + (i * 2 * Math.PI) / 3
    ctx.beginPath()
    ctx.moveTo(cx, ny)
    ctx.lineTo(cx + Math.cos(w) * s * 0.95, ny + Math.sin(w) * s * 0.95)
    ctx.stroke()
  }
}

function flamingo(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.4)
  strich(ctx, cx, cy, cx, cy - s * 0.55, '#f5b7c5', Math.max(2, s * 0.06))
  oval(ctx, cx + s * 0.15, cy - s * 0.7, s * 0.28, s * 0.16, '#e85d8a')
  ctx.strokeStyle = '#e85d8a'
  ctx.lineWidth = Math.max(3, s * 0.1)
  ctx.beginPath()
  ctx.moveTo(cx + s * 0.3, cy - s * 0.78)
  ctx.quadraticCurveTo(cx + s * 0.15, cy - s * 1.25, cx + s * 0.45, cy - s * 1.35)
  ctx.stroke()
  oval(ctx, cx + s * 0.5, cy - s * 1.36, s * 0.1, s * 0.07, '#e85d8a')
  strich(ctx, cx + s * 0.58, cy - s * 1.36, cx + s * 0.85, cy - s * 1.32, '#2c3e50', Math.max(2, s * 0.05))
  oval(ctx, cx + s * 0.42, cy - s * 1.4, s * 0.03, s * 0.03, '#2c3e50')
}

function moai(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.5)
  ctx.fillStyle = '#8d7b66'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.42, cy)
  ctx.lineTo(cx + s * 0.42, cy)
  ctx.lineTo(cx + s * 0.32, cy - s * 1.15)
  ctx.lineTo(cx - s * 0.32, cy - s * 1.15)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#6f6256'
  ctx.fillRect(cx - s * 0.34, cy - s * 1.28, s * 0.68, s * 0.16)
  ctx.fillStyle = '#4a4038'
  ctx.fillRect(cx - s * 0.22, cy - s * 0.85, s * 0.12, s * 0.1)
  ctx.fillRect(cx + s * 0.1, cy - s * 0.85, s * 0.12, s * 0.1)
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.06, cy - s * 0.7)
  ctx.lineTo(cx + s * 0.06, cy - s * 0.7)
  ctx.lineTo(cx, cy - s * 0.42)
  ctx.closePath()
  ctx.fill()
  ctx.fillRect(cx - s * 0.12, cy - s * 0.32, s * 0.24, s * 0.06)
}

function drache(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.9)
  ctx.strokeStyle = '#1e8449'
  ctx.lineWidth = Math.max(6, s * 0.16)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.8, cy - s * 0.15)
  ctx.quadraticCurveTo(cx - s * 0.2, cy - s * 0.9, cx + s * 0.35, cy - s * 0.45)
  ctx.quadraticCurveTo(cx + s * 0.7, cy - s * 0.15, cx + s * 0.95, cy - s * 0.55)
  ctx.stroke()
  ctx.fillStyle = '#145232'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.15, cy - s * 0.7)
  ctx.lineTo(cx + s * 0.15, cy - s * 1.15)
  ctx.lineTo(cx + s * 0.45, cy - s * 0.55)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.05, cy - s * 0.55)
  ctx.lineTo(cx + s * 0.35, cy - s * 0.15)
  ctx.lineTo(cx + s * 0.55, cy - s * 0.7)
  ctx.closePath()
  ctx.fill()
  oval(ctx, cx + s * 0.95, cy - s * 0.62, s * 0.16, s * 0.12, '#1e8449')
  oval(ctx, cx + s * 1.0, cy - s * 0.66, s * 0.03, s * 0.03, '#f4d35e')
  ctx.fillStyle = '#f4d35e'
  ctx.beginPath()
  ctx.moveTo(cx + s * 1.08, cy - s * 0.62)
  ctx.lineTo(cx + s * 1.28, cy - s * 0.7)
  ctx.lineTo(cx + s * 1.08, cy - s * 0.52)
  ctx.closePath()
  ctx.fill()
}

function roboter(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.45)
  ctx.fillStyle = '#5d6d7e'
  ctx.fillRect(cx - s * 0.14, cy - s * 0.35, s * 0.1, s * 0.35)
  ctx.fillRect(cx + s * 0.04, cy - s * 0.35, s * 0.1, s * 0.35)
  ctx.fillStyle = '#aeb6bf'
  ctx.fillRect(cx - s * 0.32, cy - s * 0.95, s * 0.64, s * 0.62)
  ctx.fillStyle = '#e74c3c'
  oval(ctx, cx, cy - s * 0.62, s * 0.08, s * 0.08, '#e74c3c')
  ctx.fillStyle = '#d5d8dc'
  ctx.fillRect(cx - s * 0.22, cy - s * 1.35, s * 0.44, s * 0.36)
  oval(ctx, cx - s * 0.08, cy - s * 1.2, s * 0.06, s * 0.06, '#5dade2')
  oval(ctx, cx + s * 0.1, cy - s * 1.2, s * 0.06, s * 0.06, '#5dade2')
  strich(ctx, cx, cy - s * 1.35, cx, cy - s * 1.55, '#7f8c8d', 2)
  oval(ctx, cx, cy - s * 1.58, s * 0.05, s * 0.05, '#e74c3c')
  ctx.strokeStyle = '#aeb6bf'
  ctx.lineWidth = Math.max(3, s * 0.08)
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.32, cy - s * 0.8)
  ctx.lineTo(cx - s * 0.62, cy - s * 0.45)
  ctx.moveTo(cx + s * 0.32, cy - s * 0.8)
  ctx.lineTo(cx + s * 0.62, cy - s * 0.45)
  ctx.stroke()
}

function stuhl(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.55)
  ctx.strokeStyle = '#c0392b'
  ctx.lineWidth = Math.max(4, s * 0.1)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.4, cy)
  ctx.lineTo(cx - s * 0.28, cy - s * 0.55)
  ctx.moveTo(cx + s * 0.4, cy)
  ctx.lineTo(cx + s * 0.28, cy - s * 0.55)
  ctx.moveTo(cx - s * 0.22, cy - s * 0.15)
  ctx.lineTo(cx - s * 0.22, cy - s * 0.55)
  ctx.moveTo(cx + s * 0.22, cy - s * 0.15)
  ctx.lineTo(cx + s * 0.22, cy - s * 0.55)
  ctx.stroke()
  ctx.fillStyle = '#e74c3c'
  ctx.fillRect(cx - s * 0.48, cy - s * 0.7, s * 0.96, s * 0.16)
  ctx.fillRect(cx - s * 0.42, cy - s * 1.45, s * 0.14, s * 0.78)
  ctx.fillRect(cx + s * 0.28, cy - s * 1.45, s * 0.14, s * 0.78)
  ctx.fillRect(cx - s * 0.42, cy - s * 1.5, s * 0.84, s * 0.12)
}

function geist(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s, time } = b
  schatten(ctx, b, s * 0.9)
  ctx.fillStyle = '#2c3e50'
  ctx.fillRect(cx - s * 0.7, cy - s * 0.7, s * 1.4, s * 0.7)
  ctx.fillStyle = '#6c3483'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.8, cy - s * 0.7)
  ctx.lineTo(cx - s * 0.2, cy - s * 1.25)
  ctx.lineTo(cx + s * 0.15, cy - s * 0.85)
  ctx.lineTo(cx + s * 0.55, cy - s * 1.35)
  ctx.lineTo(cx + s * 0.85, cy - s * 0.7)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#1c2833'
  ctx.beginPath()
  ctx.arc(cx, cy - s * 0.28, s * 0.28, Math.PI, 0)
  ctx.closePath()
  ctx.fill()
  const gy = cy - s * (1.15 + Math.sin(time * 2) * 0.06)
  ctx.fillStyle = fade('#f7f4ee', 0.92)
  ctx.beginPath()
  ctx.moveTo(cx + s * 0.35, gy)
  ctx.quadraticCurveTo(cx + s * 0.55, gy - s * 0.45, cx + s * 0.35, gy - s * 0.5)
  ctx.quadraticCurveTo(cx + s * 0.15, gy - s * 0.45, cx + s * 0.2, gy)
  ctx.quadraticCurveTo(cx + s * 0.28, gy - s * 0.08, cx + s * 0.35, gy)
  ctx.fill()
  oval(ctx, cx + s * 0.3, gy - s * 0.38, s * 0.03, s * 0.03, '#2c3e50')
  oval(ctx, cx + s * 0.4, gy - s * 0.38, s * 0.03, s * 0.03, '#2c3e50')
}

function palme(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.4)
  ctx.strokeStyle = '#8c5a3a'
  ctx.lineWidth = Math.max(4, s * 0.12)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.quadraticCurveTo(cx + s * 0.2, cy - s * 0.6, cx - s * 0.05, cy - s * 1.15)
  ctx.stroke()
  const krone = { x: cx - s * 0.05, y: cy - s * 1.15 }
  for (let i = 0; i < 6; i++) {
    const w = -2.4 + i * 0.75
    ctx.strokeStyle = i % 2 === 0 ? '#1e8449' : '#27ae60'
    ctx.lineWidth = Math.max(2, s * 0.06)
    ctx.beginPath()
    ctx.moveTo(krone.x, krone.y)
    ctx.quadraticCurveTo(krone.x + Math.cos(w) * s * 0.4, krone.y + Math.sin(w) * s * 0.15, krone.x + Math.cos(w) * s * 0.7, krone.y + Math.sin(w) * s * 0.35)
    ctx.stroke()
  }
}

function kaktus(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.35)
  ctx.fillStyle = '#1e8449'
  ctx.fillRect(cx - s * 0.12, cy - s * 1.15, s * 0.24, s * 1.15)
  ctx.fillRect(cx - s * 0.55, cy - s * 0.85, s * 0.43, s * 0.16)
  ctx.fillRect(cx - s * 0.55, cy - s * 1.15, s * 0.16, s * 0.32)
  ctx.fillRect(cx + s * 0.12, cy - s * 0.62, s * 0.4, s * 0.16)
  ctx.fillRect(cx + s * 0.36, cy - s * 0.95, s * 0.16, s * 0.35)
  ctx.fillStyle = '#145a32'
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(cx - s * 0.08, cy - s * (0.2 + i * 0.2), s * 0.04, s * 0.06)
  }
}

function astronaut(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.4)
  ctx.fillStyle = '#f7f4ee'
  ctx.fillRect(cx - s * 0.1, cy - s * 0.4, s * 0.08, s * 0.4)
  ctx.fillRect(cx + s * 0.04, cy - s * 0.4, s * 0.08, s * 0.4)
  oval(ctx, cx, cy - s * 0.7, s * 0.28, s * 0.32, '#f7f4ee')
  oval(ctx, cx + s * 0.22, cy - s * 0.7, s * 0.12, s * 0.2, '#d5d8dc')
  oval(ctx, cx, cy - s * 1.15, s * 0.2, s * 0.2, '#f7f4ee')
  oval(ctx, cx, cy - s * 1.15, s * 0.12, s * 0.1, '#f4d35e')
  ctx.strokeStyle = '#aeb6bf'
  ctx.lineWidth = Math.max(3, s * 0.07)
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.2, cy - s * 0.75)
  ctx.lineTo(cx - s * 0.48, cy - s * 0.4)
  ctx.moveTo(cx + s * 0.2, cy - s * 0.75)
  ctx.lineTo(cx + s * 0.42, cy - s * 0.45)
  ctx.stroke()
}

function obelisk(ctx: CanvasRenderingContext2D, b: Buehne): void {
  const { cx, cy, s } = b
  schatten(ctx, b, s * 0.35)
  ctx.fillStyle = '#d5d8dc'
  ctx.fillRect(cx - s * 0.28, cy - s * 0.12, s * 0.56, s * 0.12)
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.16, cy - s * 0.12)
  ctx.lineTo(cx + s * 0.16, cy - s * 0.12)
  ctx.lineTo(cx + s * 0.06, cy - s * 1.45)
  ctx.lineTo(cx - s * 0.06, cy - s * 1.45)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#aeb6bf'
  ctx.beginPath()
  ctx.moveTo(cx, cy - s * 0.12)
  ctx.lineTo(cx + s * 0.16, cy - s * 0.12)
  ctx.lineTo(cx + s * 0.06, cy - s * 1.45)
  ctx.lineTo(cx, cy - s * 1.45)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#f4d35e'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.06, cy - s * 1.45)
  ctx.lineTo(cx + s * 0.06, cy - s * 1.45)
  ctx.lineTo(cx, cy - s * 1.72)
  ctx.closePath()
  ctx.fill()
}

const MALER: Record<Exclude<Figur, 'schloss'>, (ctx: CanvasRenderingContext2D, b: Buehne) => void> = {
  riesenrad,
  apfel,
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

function kasten(
  ctx: CanvasRenderingContext2D,
  g: Grund,
  hoehe: number,
  wand: string,
  dach: string,
  art: 'spitz' | 'zinnen' | 'flach',
): void {
  const seiten = waende(g)
  const sichtbar = SEITEN.filter((seite) => seiten[seite].sichtbar).sort((a, b) => seiten[a].tiefe - seiten[b].tiefe)
  for (const seite of sichtbar) {
    const kante = seiten[seite]
    const ton = kante.ton > 0 ? 16 : -22
    quad(ctx, kante.a, kante.b, lift(kante.b, hoehe), lift(kante.a, hoehe), shade(wand, ton))
    const n = Math.max(1, Math.round((Math.abs(kante.b.sx - kante.a.sx) + 20) / 28))
    for (let i = 0; i < n; i++) {
      const p = lift(
        { sx: kante.a.sx + ((kante.b.sx - kante.a.sx) * (i + 0.5)) / n, sy: kante.a.sy + ((kante.b.sy - kante.a.sy) * (i + 0.5)) / n },
        hoehe * 0.62,
      )
      ctx.fillStyle = '#243044'
      ctx.fillRect(p.sx - 2.2, p.sy - 3.2, 4.4, 5.2)
    }
  }
  const top = umlauf(g, hoehe)
  if (art === 'spitz') {
    const spitze = lift(schwerpunkt(top), hoehe * 0.42)
    for (const seite of sichtbar) {
      const kante = seiten[seite]
      ctx.beginPath()
      ctx.moveTo(lift(kante.a, hoehe).sx, lift(kante.a, hoehe).sy)
      ctx.lineTo(lift(kante.b, hoehe).sx, lift(kante.b, hoehe).sy)
      ctx.lineTo(spitze.sx, spitze.sy)
      ctx.closePath()
      ctx.fillStyle = shade(dach, kante.ton > 0 ? 12 : -18)
      ctx.fill()
    }
    return
  }
  quad(ctx, top[0], top[1], top[2], top[3], shade(dach, 8))
  if (art === 'zinnen') {
    const m = schwerpunkt(top)
    for (let i = 0; i < 4; i++) {
      const ecke = top[i]
      ctx.fillStyle = shade(wand, 8)
      ctx.fillRect((ecke.sx + m.sx) / 2 - 3, (ecke.sy + m.sy) / 2 - 8, 6, 8)
    }
  }
}

function fahne(ctx: CanvasRenderingContext2D, g: Grund, hoehe: number, time: number, farbe: string): void {
  const m = lift(schwerpunkt(umlauf(g, hoehe)), 8)
  strich(ctx, m.sx, m.sy, m.sx, m.sy - 16, '#f7f4ee', 1.4)
  const weht = Math.sin(time * 3) * 3
  ctx.fillStyle = farbe
  ctx.beginPath()
  ctx.moveTo(m.sx, m.sy - 16)
  ctx.quadraticCurveTo(m.sx + 8, m.sy - 14 + weht, m.sx + 14, m.sy - 12 + weht)
  ctx.lineTo(m.sx + 14, m.sy - 7 + weht)
  ctx.quadraticCurveTo(m.sx + 8, m.sy - 8 - weht, m.sx, m.sy - 6)
  ctx.closePath()
  ctx.fill()
}

function schloss(ctx: CanvasRenderingContext2D, placed: Placed, w: number, h: number, time: number): void {
  const x = placed.x
  const y = placed.y
  const graben: Grund = { x: x + 0.08, y: y + 0.08, w: w - 0.16, h: h - 0.16 }
  quad(ctx, ...umlauf(graben), '#1a5276')
  const insel: Grund = { x: x + 0.28, y: y + 0.28, w: w - 0.56, h: h - 0.56 }
  quad(ctx, ...umlauf(insel), '#7dcea0')

  const t = 0.62
  const teile: { g: Grund; hoehe: number; art: 'spitz' | 'zinnen' | 'flach'; fahne?: string }[] = [
    { g: { x: x + 0.35, y: y + 0.35, w: t, h: t }, hoehe: TILE_H * 2.15, art: 'spitz', fahne: '#1a5276' },
    { g: { x: x + w - 0.35 - t, y: y + 0.35, w: t, h: t }, hoehe: TILE_H * 2.15, art: 'spitz', fahne: '#f4d35e' },
    { g: { x: x + 0.35, y: y + h - 0.35 - t, w: t, h: t }, hoehe: TILE_H * 1.9, art: 'spitz' },
    { g: { x: x + w - 0.35 - t, y: y + h - 0.35 - t, w: t, h: t }, hoehe: TILE_H * 1.9, art: 'spitz', fahne: '#c0392b' },
    { g: { x: x + w * 0.34, y: y + h * 0.3, w: w * 0.32, h: h * 0.4 }, hoehe: TILE_H * 2.7, art: 'zinnen', fahne: '#1a5276' },
    { g: { x: x + w * 0.38, y: y + h * 0.62, w: w * 0.24, h: h * 0.22 }, hoehe: TILE_H * 1.15, art: 'zinnen' },
  ]
  teile.sort((a, b) => a.g.x + a.g.y - (b.g.x + b.g.y))
  for (const teil of teile) {
    kasten(ctx, teil.g, teil.hoehe, '#d9d3c7', '#8e2f2f', teil.art)
    if (teil.fahne) fahne(ctx, teil.g, teil.hoehe + (teil.art === 'spitz' ? teil.hoehe * 0.32 : 10), time, teil.fahne)
  }
  // Tor in der vorderen Mauer
  const tor = teile[teile.length - 1]
  const seiten = waende(tor.g)
  const vorn = (['s', 'o', 'n', 'w'] as Seite[]).filter((seite) => seiten[seite].sichtbar).sort((a, b) => seiten[b].tiefe - seiten[a].tiefe)[0]
  if (vorn) {
    const kante = seiten[vorn]
    const fuss = { sx: (kante.a.sx + kante.b.sx) / 2, sy: (kante.a.sy + kante.b.sy) / 2 }
    ctx.fillStyle = '#1c2833'
    ctx.beginPath()
    ctx.moveTo(fuss.sx - 7, fuss.sy)
    ctx.lineTo(fuss.sx + 7, fuss.sy)
    ctx.lineTo(fuss.sx + 7, fuss.sy - 12)
    ctx.quadraticCurveTo(fuss.sx, fuss.sy - 20, fuss.sx - 7, fuss.sy - 12)
    ctx.closePath()
    ctx.fill()
  }
}
