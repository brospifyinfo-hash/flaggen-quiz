// Eigene Silhouetten. Ein Riesenrad ist ein Rad, ein Apfel ist ein Apfel, ein Schloss
// hat Türme. Alles andere bleibt beim normalen Baukasten.
import { buildingDef, footprint, type Figur, type Look } from './catalog'
import { fade, lift, mix, quad, shade, type Point } from './draw'
import { SEITEN, schwerpunkt, umlauf, waende, type Grund } from './geo'
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
  schloss: 1.72,
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
  const b: Buehne = { cx: m.sx, cy: m.sy, s: Math.max(w, h) * 20, time }
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
  oval(ctx, cx + s * 0.08, my + s * 0.16, s * 0.58, s * 0.42, '#7b241c')
  oval(ctx, cx, my + s * 0.06, s * 0.64, s * 0.52, '#c0392b')
  oval(ctx, cx - s * 0.06, my - s * 0.04, s * 0.56, s * 0.46, '#e74c3c')
  oval(ctx, cx - s * 0.2, my - s * 0.16, s * 0.18, s * 0.12, '#f5b7b1')
  oval(ctx, cx + s * 0.22, my + s * 0.18, s * 0.08, s * 0.05, '#f5cba7')
  oval(ctx, cx, my + s * 0.42, s * 0.06, s * 0.035, '#641e16')
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
  ctx.strokeStyle = '#b7950b'
  ctx.lineWidth = Math.max(7, s * 0.18)
  ctx.beginPath()
  ctx.arc(cx, nabeY, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = '#f7dc6f'
  ctx.lineWidth = Math.max(3, s * 0.08)
  ctx.beginPath()
  ctx.arc(cx, nabeY, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = '#7d6608'
  ctx.lineWidth = Math.max(1.5, s * 0.04)
  ctx.beginPath()
  ctx.arc(cx, nabeY, r * 0.72, 0, Math.PI * 2)
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
    ctx.fillStyle = '#2c3e50'
    ctx.beginPath()
    ctx.moveTo(gx - s * 0.18, gy)
    ctx.lineTo(gx + s * 0.18, gy)
    ctx.lineTo(gx + s * 0.1, gy - s * 0.14)
    ctx.lineTo(gx - s * 0.1, gy - s * 0.14)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = farben[i]
    ctx.fillRect(gx - s * 0.16, gy, s * 0.32, s * 0.28)
    ctx.fillStyle = fade('#ffffff', 0.65)
    ctx.fillRect(gx - s * 0.1, gy + s * 0.06, s * 0.2, s * 0.12)
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
  oval(ctx, cx, cy - s * 0.78, s * 0.7, s * 0.16, '#f5d7a1')
  for (let i = -3; i <= 3; i++) {
    strich(ctx, cx + i * s * 0.12, cy - s * 0.78, cx + i * s * 0.16, cy - s * 0.68, '#e6c79a', 1)
  }
  oval(ctx, cx, cy - s * 0.95, s * 0.82, s * 0.46, '#922b21')
  oval(ctx, cx - s * 0.06, cy - s * 1.05, s * 0.7, s * 0.32, '#e74c3c')
  oval(ctx, cx - s * 0.22, cy - s * 1.12, s * 0.2, s * 0.1, '#f5b7b1')
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

const STEIN = '#cfc6b6'
const DACHROT = '#8c2e2a'
const HOLZTOR = '#6b4423'

/** Sichtbare Wände, hinten zuerst. basis hebt den Fuß über den Boden, für Kränze auf Türmen. */
function sichtbareWaende(g: Grund, basis = 0) {
  const seiten = waende(g, basis)
  return SEITEN.filter((seite) => seiten[seite].sichtbar)
    .sort((a, b) => seiten[a].tiefe - seiten[b].tiefe)
    .map((seite) => seiten[seite])
}

/** Mauer mit Sockel, Lagerfugen und Schießscharten, die in der Wandebene liegen */
function mauerwerk(
  ctx: CanvasRenderingContext2D,
  g: Grund,
  hoehe: number,
  farbe: string,
  scharten: number,
  basis = 0,
): void {
  for (const wand of sichtbareWaende(g, basis)) {
    const ton = wand.ton > 0 ? 14 : -24
    quad(ctx, wand.a, wand.b, lift(wand.b, hoehe), lift(wand.a, hoehe), shade(farbe, ton))
    const sockel = Math.min(8, hoehe * 0.16)
    quad(ctx, wand.a, wand.b, lift(wand.b, sockel), lift(wand.a, sockel), shade(farbe, -40))
    const reihen = Math.max(2, Math.floor(hoehe / 12))
    ctx.beginPath()
    ctx.strokeStyle = fade('#2a241c', 0.35)
    ctx.lineWidth = 0.7
    for (let i = 1; i < reihen; i++) {
      const h = (hoehe * i) / reihen
      const p = lift(wand.a, h)
      const q = lift(wand.b, h)
      ctx.moveTo(p.sx, p.sy)
      ctx.lineTo(q.sx, q.sy)
    }
    ctx.stroke()
    if (scharten <= 0 || hoehe < 22) continue
    const spalten = Math.max(1, scharten)
    const zeilen = hoehe > TILE_H * 2 ? [0.42, 0.68] : [0.58]
    for (const anteil of zeilen) {
      for (let i = 0; i < spalten; i++) {
        const t = (i + 0.5) / spalten
        const fuss = hoehe * anteil
        const links = lift(mix(wand.a, wand.b, t - 0.018), fuss)
        const rechts = lift(mix(wand.a, wand.b, t + 0.018), fuss)
        quad(ctx, links, rechts, lift(rechts, 10), lift(links, 10), '#1b2330')
        const scheitel = lift(mix(wand.a, wand.b, t), fuss + 10)
        ctx.beginPath()
        ctx.arc(scheitel.sx, scheitel.sy, 2.1, Math.PI, 0)
        ctx.fillStyle = '#1b2330'
        ctx.fill()
        ctx.fillStyle = fade('#f6e7a8', 0.8)
        ctx.fillRect(scheitel.sx - 0.8, scheitel.sy + 3, 1.6, 4)
      }
    }
  }
  const top = umlauf(g, basis + hoehe)
  quad(ctx, top[0], top[1], top[2], top[3], shade(farbe, 20))
}

/** Zinnen als eigene Zähne auf der Mauerkrone, nicht als vier Punkte in der Mitte */
function zinnen(ctx: CanvasRenderingContext2D, g: Grund, hoehe: number, farbe: string): void {
  for (const wand of sichtbareWaende(g)) {
    const laenge = Math.hypot(wand.b.sx - wand.a.sx, wand.b.sy - wand.a.sy)
    const n = Math.max(3, Math.round(laenge / 9))
    for (let i = 0; i < n; i++) {
      if (i % 2 === 1) continue
      const t0 = i / n
      const t1 = (i + 0.62) / n
      const a = lift(mix(wand.a, wand.b, t0), hoehe)
      const b = lift(mix(wand.a, wand.b, t1), hoehe)
      const obenA = lift(a, 7)
      const obenB = lift(b, 7)
      const raus = wand.raus
      const aussenA = { sx: obenA.sx + raus.sx * 4, sy: obenA.sy + raus.sy * 4 }
      const aussenB = { sx: obenB.sx + raus.sx * 4, sy: obenB.sy + raus.sy * 4 }
      quad(ctx, a, b, obenB, obenA, shade(farbe, wand.ton > 0 ? 18 : -12))
      quad(ctx, obenA, obenB, aussenB, aussenA, shade(farbe, 28))
    }
  }
}

/** Kegeldach mit Graten, damit es kein glatter Klecks bleibt */
function kegel(ctx: CanvasRenderingContext2D, g: Grund, basis: number, hoehe: number, farbe: string): Point {
  const top = umlauf(g, basis)
  const spitze = lift(schwerpunkt(top), hoehe)
  for (const wand of sichtbareWaende(g)) {
    const a = lift(wand.a, basis)
    const b = lift(wand.b, basis)
    ctx.beginPath()
    ctx.moveTo(a.sx, a.sy)
    ctx.lineTo(b.sx, b.sy)
    ctx.lineTo(spitze.sx, spitze.sy)
    ctx.closePath()
    ctx.fillStyle = shade(farbe, wand.ton > 0 ? 16 : -20)
    ctx.fill()
    ctx.strokeStyle = fade('#2a120f', 0.35)
    ctx.lineWidth = 0.8
    ctx.beginPath()
    for (const t of [0.33, 0.66]) {
      const p = mix(a, b, t)
      ctx.moveTo(p.sx, p.sy)
      ctx.lineTo(spitze.sx, spitze.sy)
    }
    ctx.stroke()
  }
  ctx.fillStyle = '#e6c15a'
  ctx.beginPath()
  ctx.arc(spitze.sx, spitze.sy, 2.4, 0, Math.PI * 2)
  ctx.fill()
  return spitze
}

function banner(ctx: CanvasRenderingContext2D, anker: Point, time: number, farbe: string, salz: number): void {
  const weht = Math.sin(time * 2.4 + salz) * 4
  strich(ctx, anker.sx, anker.sy, anker.sx, anker.sy - 22, '#efe6d4', 1.6)
  ctx.fillStyle = '#e6c15a'
  ctx.beginPath()
  ctx.arc(anker.sx, anker.sy - 22, 2.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = farbe
  ctx.beginPath()
  ctx.moveTo(anker.sx, anker.sy - 20)
  ctx.quadraticCurveTo(anker.sx + 10, anker.sy - 16 + weht, anker.sx + 16, anker.sy - 18 + weht)
  ctx.lineTo(anker.sx + 12, anker.sy - 12 + weht * 0.4)
  ctx.lineTo(anker.sx + 16, anker.sy - 8 + weht)
  ctx.quadraticCurveTo(anker.sx + 8, anker.sy - 10 - weht * 0.3, anker.sx, anker.sy - 8)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = fade('#ffffff', 0.35)
  ctx.fillRect(anker.sx + 2, anker.sy - 16, 6, 1.4)
}

function bogenInWand(ctx: CanvasRenderingContext2D, a: Point, b: Point, basis: number, breite: number, hoehe: number, farbe: string): void {
  const links = lift(mix(a, b, 0.5 - breite), basis)
  const rechts = lift(mix(a, b, 0.5 + breite), basis)
  const scheitel = lift(mix(a, b, 0.5), basis + hoehe)
  const knickL = lift(mix(a, b, 0.5 - breite), basis + hoehe * 0.62)
  const knickR = lift(mix(a, b, 0.5 + breite), basis + hoehe * 0.62)
  ctx.beginPath()
  ctx.moveTo(links.sx, links.sy)
  ctx.lineTo(knickL.sx, knickL.sy)
  ctx.quadraticCurveTo(scheitel.sx, scheitel.sy, knickR.sx, knickR.sy)
  ctx.lineTo(rechts.sx, rechts.sy)
  ctx.closePath()
  ctx.fillStyle = farbe
  ctx.fill()
}

function schloss(ctx: CanvasRenderingContext2D, placed: Placed, w: number, h: number, time: number): void {
  const x = placed.x
  const y = placed.y
  quad(ctx, ...umlauf({ x: x + 0.04, y: y + 0.04, w: w - 0.08, h: h - 0.08 }), '#14375c')
  quad(ctx, ...umlauf({ x: x + 0.16, y: y + 0.16, w: w - 0.32, h: h - 0.32 }), '#8d8272')
  quad(ctx, ...umlauf({ x: x + 0.28, y: y + 0.28, w: w - 0.56, h: h - 0.56 }), '#4f8f55')
  // Weg vom Tor zum Bergfried
  quad(ctx, ...umlauf({ x: x + w * 0.42, y: y + h * 0.55, w: w * 0.16, h: h * 0.38 }), '#cbb892')

  const tw = 0.52
  const wandDicke = 0.16
  const ecken = [
    { x: x + 0.32, y: y + 0.32 },
    { x: x + w - 0.32 - tw, y: y + 0.32 },
    { x: x + 0.32, y: y + h - 0.32 - tw },
    { x: x + w - 0.32 - tw, y: y + h - 0.32 - tw },
  ]
  const mauern: Grund[] = [
    { x: x + 0.32 + tw * 0.55, y: y + 0.34, w: w - 0.64 - tw, h: wandDicke },
    { x: x + w - 0.34 - wandDicke, y: y + 0.32 + tw * 0.55, w: wandDicke, h: h - 0.64 - tw },
    { x: x + 0.34, y: y + 0.32 + tw * 0.55, w: wandDicke, h: h - 0.64 - tw },
    // Südmauer in zwei Stücken, dazwischen das Tor
    { x: x + 0.32 + tw * 0.4, y: y + h - 0.34 - wandDicke, w: w * 0.28, h: wandDicke },
    { x: x + w * 0.58, y: y + h - 0.34 - wandDicke, w: w * 0.28, h: wandDicke },
  ]
  const bergfried: Grund = { x: x + w * 0.33, y: y + h * 0.3, w: w * 0.34, h: h * 0.36 }
  const torhaus: Grund = { x: x + w * 0.36, y: y + h - 0.62, w: w * 0.28, h: 0.42 }
  const bruecke: Grund = { x: x + w * 0.43, y: y + h - 0.28, w: w * 0.14, h: 0.32 }

  const stuecke: { g: Grund; art: 'mauer' | 'turm' | 'fried' | 'tor' | 'bruecke' }[] = [
    ...mauern.map((g) => ({ g, art: 'mauer' as const })),
    ...ecken.map((e) => ({ g: { x: e.x, y: e.y, w: tw, h: tw }, art: 'turm' as const })),
    { g: bergfried, art: 'fried' },
    { g: torhaus, art: 'tor' },
    { g: bruecke, art: 'bruecke' },
  ]
  stuecke.sort((a, b) => a.g.x + a.g.y + a.g.w * 0.2 - (b.g.x + b.g.y))

  for (const teil of stuecke) {
    if (teil.art === 'bruecke') {
      const deck = umlauf(teil.g, 4)
      quad(ctx, deck[0], deck[1], deck[2], deck[3], '#8a5a32')
      ctx.strokeStyle = fade('#3d2914', 0.55)
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 1; i < 4; i++) {
        const p = mix(deck[0], deck[3], i / 4)
        const q = mix(deck[1], deck[2], i / 4)
        ctx.moveTo(p.sx, p.sy)
        ctx.lineTo(q.sx, q.sy)
      }
      ctx.stroke()
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
      const kranz: Grund = {
        x: teil.g.x - 0.05,
        y: teil.g.y - 0.05,
        w: teil.g.w + 0.1,
        h: teil.g.h + 0.1,
      }
      mauerwerk(ctx, kranz, 8, shade(STEIN, -6), 0, hoch)
      zinnen(ctx, kranz, hoch + 8, STEIN)
      const spitze = kegel(ctx, teil.g, hoch + 8, TILE_H * 0.9, DACHROT)
      banner(ctx, spitze, time, teil.g.x < x + w / 2 ? '#1a5276' : '#f4d35e', teil.g.y)
      continue
    }
    if (teil.art === 'fried') {
      const hoch = TILE_H * 2.85
      mauerwerk(ctx, teil.g, hoch, '#ddd4c4', 3)
      zinnen(ctx, teil.g, hoch, '#ddd4c4')
      const spitze = kegel(ctx, teil.g, hoch + 4, TILE_H * 1.05, DACHROT)
      banner(ctx, spitze, time, '#8c2e2a', 1.2)
      continue
    }
    const hoch = TILE_H * 1.35
    mauerwerk(ctx, teil.g, hoch, STEIN, 0)
    zinnen(ctx, teil.g, hoch, STEIN)
    const front = sichtbareWaende(teil.g).at(-1)
    if (front) {
      bogenInWand(ctx, front.a, front.b, 2, 0.22, 18, '#141820')
      // Fallgatter
      ctx.strokeStyle = '#8d6a32'
      ctx.lineWidth = 1.1
      ctx.beginPath()
      for (let i = 0; i < 4; i++) {
        const p = lift(mix(front.a, front.b, 0.38 + i * 0.08), 4)
        const q = lift(mix(front.a, front.b, 0.38 + i * 0.08), 16)
        ctx.moveTo(p.sx, p.sy)
        ctx.lineTo(q.sx, q.sy)
      }
      ctx.stroke()
      ctx.fillStyle = HOLZTOR
      const tuerL = lift(mix(front.a, front.b, 0.4), 2)
      const tuerR = lift(mix(front.a, front.b, 0.52), 2)
      quad(ctx, tuerL, tuerR, lift(tuerR, 12), lift(tuerL, 12), HOLZTOR)
    }
  }
}
