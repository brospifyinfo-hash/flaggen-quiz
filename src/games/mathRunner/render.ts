// Zeichnet den Math Runner auf ein Canvas: Hintergrund, Strecke, Tore, Figur, Partikel.
// Alles in einem Bild – so bleibt das DOM leer und die Bildrate hoch.
import { stageAt } from './config'
import type { Game } from './engine'

/** Höhe der Figur im Bild (Anteil der Spielfläche) */
export const RUNNER_Y = 0.74
/** Abstand der Spuren von der Mitte */
const LANE_OFFSET = 0.24

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
  text?: string
}

export interface Scene {
  particles: Particle[]
  stars: { x: number; y: number; r: number; depth: number }[]
  /** Farben, die weich zur aktuellen Stufe überblenden */
  sky: [number, number, number][]
  shake: number
  flash: { r: number; g: number; b: number; life: number } | null
  trail: number
  /** Gesichtsausdruck der Figur */
  mood: { kind: 'happy' | 'hurt'; life: number } | null
  /** 0 bis 1, steigt wenn es brenzlig wird */
  danger: number
  /** Tempogefühl: 0 bis 1 */
  rush: number
}

const MAX_PARTICLES = 170

const hexToRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]

const rgb = (c: [number, number, number], alpha = 1) =>
  alpha >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha})`

export function createScene(): Scene {
  const stars: Scene['stars'] = []
  for (let i = 0; i < 46; i++) {
    stars.push({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 2.4, depth: 0.3 + Math.random() * 0.9 })
  }
  const start = stageAt(0)
  return {
    particles: [],
    stars,
    sky: [hexToRgb(start.sky[0]), hexToRgb(start.sky[1])],
    shake: 0,
    flash: null,
    trail: 0,
    mood: null,
    danger: 0,
    rush: 0,
  }
}

export const laneX = (lane: number, width: number) => width * (0.5 + lane * LANE_OFFSET)

export function burst(scene: Scene, x: number, y: number, color: string, count: number, power = 1): void {
  for (let i = 0; i < count; i++) {
    if (scene.particles.length >= MAX_PARTICLES) scene.particles.shift()
    const angle = Math.random() * Math.PI * 2
    const speed = (60 + Math.random() * 260) * power
    const life = 0.5 + Math.random() * 0.7
    scene.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      life,
      max: life,
      size: 3 + Math.random() * 6 * power,
      color,
    })
  }
}

export function floatText(scene: Scene, x: number, y: number, text: string, color: string): void {
  if (scene.particles.length >= MAX_PARTICLES) scene.particles.shift()
  scene.particles.push({ x, y, vx: 0, vy: -90, life: 1, max: 1, size: 26, color, text })
}

export function shake(scene: Scene, amount: number): void {
  scene.shake = Math.max(scene.shake, amount)
}

export function flash(scene: Scene, color: string): void {
  const [r, g, b] = hexToRgb(color)
  scene.flash = { r, g, b, life: 1 }
}

export function mood(scene: Scene, kind: 'happy' | 'hurt'): void {
  scene.mood = { kind, life: kind === 'hurt' ? 1.1 : 0.8 }
}

export function updateScene(scene: Scene, game: Game, dt: number, width: number, height: number): void {
  const stage = stageAt(game.stage)
  const target = [hexToRgb(stage.sky[0]), hexToRgb(stage.sky[1])]
  for (let i = 0; i < 2; i++) {
    for (let c = 0; c < 3; c++) {
      scene.sky[i][c] += (target[i][c] - scene.sky[i][c]) * Math.min(1, dt * 1.6)
    }
  }

  for (let i = scene.particles.length - 1; i >= 0; i--) {
    const p = scene.particles[i]
    p.life -= dt
    if (p.life <= 0) {
      scene.particles.splice(i, 1)
      continue
    }
    p.x += p.vx * dt
    p.y += p.vy * dt
    if (!p.text) p.vy += 420 * dt
  }

  scene.shake = Math.max(0, scene.shake - dt * 3.2)
  if (scene.flash) {
    scene.flash.life -= dt * 2.4
    if (scene.flash.life <= 0) scene.flash = null
  }
  if (scene.mood) {
    scene.mood.life -= dt
    if (scene.mood.life <= 0) scene.mood = null
  }

  // Gefahr und Tempo werden weich nachgeführt, damit nichts springt
  scene.danger += ((game.danger && game.phase === 'running' ? 1 : 0) - scene.danger) * Math.min(1, dt * 3)
  scene.rush += (Math.min(1, (stage.flow - 0.55) / 0.6) - scene.rush) * Math.min(1, dt * 2)

  if (game.phase === 'running') {
    scene.trail -= dt
    if (scene.trail <= 0) {
      scene.trail = 0.035
      const x = laneX(game.x, width)
      const y = height * RUNNER_Y + 22
      if (scene.particles.length < MAX_PARTICLES) {
        scene.particles.push({
          x: x + (Math.random() - 0.5) * 16,
          y,
          vx: (Math.random() - 0.5) * 40,
          vy: 150 + Math.random() * 120,
          life: 0.4,
          max: 0.4,
          size: 3 + Math.random() * 5,
          color: Math.random() < 0.5 ? stage.accent : '#ffffff',
        })
      }
    }
  }
}

function roundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function drawGate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  label: string,
  glow: number,
): void {
  ctx.save()
  ctx.shadowColor = color
  ctx.shadowBlur = 18 + glow * 30
  const fill = ctx.createLinearGradient(x, y, x, y + h)
  fill.addColorStop(0, color)
  fill.addColorStop(1, 'rgba(0,0,0,0.35)')
  ctx.fillStyle = fill
  roundedPath(ctx, x, y, w, h, 20)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.lineWidth = 4
  ctx.strokeStyle = `rgba(255,255,255,${0.7 + glow * 0.3})`
  roundedPath(ctx, x + 2, y + 2, w - 4, h - 4, 18)
  ctx.stroke()
  ctx.restore()

  // Die Zahl muss immer lesbar sein – deshalb weiß mit dunkler Kontur
  ctx.save()
  const size = Math.min(w * 0.42, h * 0.55, 54)
  ctx.font = `900 ${size}px "Nunito Variable", system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = Math.max(4, size * 0.14)
  ctx.strokeStyle = 'rgba(12,16,32,0.75)'
  ctx.lineJoin = 'round'
  ctx.strokeText(label, x + w / 2, y + h / 2 + 1)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(label, x + w / 2, y + h / 2 + 1)
  ctx.restore()
}

/** Die Figur: eine Rakete mit Visier, Flamme und Combo-Ring */
function drawRunner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  accent: string,
  t: number,
  tilt: number,
  scene: Scene,
  combo: number,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(tilt)

  // Combo-Ring: dreht sich, wächst mit der Serie
  if (combo >= 5) {
    const ringR = size * (0.95 + Math.min(combo, 30) * 0.012)
    const dots = combo >= 20 ? 12 : combo >= 10 ? 8 : 5
    ctx.save()
    ctx.rotate(t * (combo >= 20 ? 3 : 1.6))
    for (let i = 0; i < dots; i++) {
      const angle = (i / dots) * Math.PI * 2
      ctx.fillStyle = i % 2 === 0 ? '#ffd23f' : accent
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.arc(Math.cos(angle) * ringR, Math.sin(angle) * ringR, size * 0.09, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    ctx.globalAlpha = 1
  }

  // Flamme
  const flicker = 0.55 + Math.abs(Math.sin(t * 24)) * 0.3 + scene.rush * 0.3
  const flame = size * flicker
  const fire = ctx.createLinearGradient(0, size * 0.45, 0, size * 0.45 + flame)
  fire.addColorStop(0, '#fffbe0')
  fire.addColorStop(0.45, accent)
  fire.addColorStop(1, 'rgba(255,90,0,0)')
  ctx.fillStyle = fire
  ctx.beginPath()
  ctx.moveTo(-size * 0.28, size * 0.42)
  ctx.quadraticCurveTo(0, size * 0.45 + flame, size * 0.28, size * 0.42)
  ctx.closePath()
  ctx.fill()

  const bob = Math.sin(t * 9) * size * 0.04
  ctx.translate(0, bob)

  // Rumpf
  ctx.shadowColor = accent
  ctx.shadowBlur = 26
  const body = ctx.createLinearGradient(-size * 0.4, -size * 0.9, size * 0.4, size * 0.6)
  body.addColorStop(0, '#ffffff')
  body.addColorStop(0.4, accent)
  body.addColorStop(1, '#161b38')
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.92)
  ctx.quadraticCurveTo(size * 0.6, -size * 0.2, size * 0.44, size * 0.48)
  ctx.quadraticCurveTo(0, size * 0.28, -size * 0.44, size * 0.48)
  ctx.quadraticCurveTo(-size * 0.6, -size * 0.2, 0, -size * 0.92)
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0

  // Flügel
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.beginPath()
  ctx.moveTo(-size * 0.44, size * 0.1)
  ctx.lineTo(-size * 0.78, size * 0.55)
  ctx.lineTo(-size * 0.3, size * 0.44)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(size * 0.44, size * 0.1)
  ctx.lineTo(size * 0.78, size * 0.55)
  ctx.lineTo(size * 0.3, size * 0.44)
  ctx.closePath()
  ctx.fill()

  // Visier
  const hurt = scene.mood?.kind === 'hurt'
  const happy = scene.mood?.kind === 'happy'
  ctx.fillStyle = '#10142c'
  roundedPath(ctx, -size * 0.34, -size * 0.44, size * 0.68, size * 0.42, size * 0.18)
  ctx.fill()

  ctx.fillStyle = hurt ? '#ff6b7d' : happy ? '#8cffc8' : '#8be9ff'
  ctx.shadowColor = ctx.fillStyle
  ctx.shadowBlur = 12
  if (hurt) {
    // zusammengekniffene Augen
    ctx.fillRect(-size * 0.24, -size * 0.27, size * 0.18, size * 0.05)
    ctx.fillRect(size * 0.06, -size * 0.27, size * 0.18, size * 0.05)
  } else {
    ctx.beginPath()
    ctx.arc(-size * 0.15, -size * 0.24, size * 0.08, 0, Math.PI * 2)
    ctx.arc(size * 0.15, -size * 0.24, size * 0.08, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0
  ctx.restore()
}

export function draw(
  ctx: CanvasRenderingContext2D,
  game: Game,
  scene: Scene,
  width: number,
  height: number,
  t: number,
): void {
  const stage = stageAt(game.stage)
  ctx.save()
  if (scene.shake > 0.01) {
    ctx.translate((Math.random() - 0.5) * scene.shake * 16, (Math.random() - 0.5) * scene.shake * 16)
  }

  // Himmel
  const sky = ctx.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, rgb(scene.sky[0]))
  sky.addColorStop(1, rgb(scene.sky[1]))
  ctx.fillStyle = sky
  ctx.fillRect(-20, -20, width + 40, height + 40)

  // Sterne
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  for (const star of scene.stars) {
    const y = ((star.y + game.scroll * star.depth * 0.25) % 1) * height
    ctx.globalAlpha = 0.25 + star.depth * 0.45
    ctx.beginPath()
    ctx.arc(star.x * width, y, star.r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // Tempolinien – je schneller die Stufe, desto mehr Zug im Bild
  if (scene.rush > 0.05) {
    ctx.strokeStyle = `rgba(255,255,255,${0.1 + scene.rush * 0.18})`
    ctx.lineWidth = 2
    for (let i = 0; i < 14; i++) {
      const lx = ((i * 97) % 100) / 100
      const ly = ((i * 37) / 100 + game.scroll * 1.6) % 1
      const len = 40 + scene.rush * 90
      ctx.beginPath()
      ctx.moveTo(lx * width, ly * height)
      ctx.lineTo(lx * width, ly * height + len)
      ctx.stroke()
    }
  }

  // Strecke
  const trackW = width * (LANE_OFFSET * 2 + 0.36)
  const trackX = (width - trackW) / 2
  ctx.fillStyle = 'rgba(8,12,28,0.28)'
  ctx.fillRect(trackX, 0, trackW, height)
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(width / 2, 0)
  ctx.lineTo(width / 2, height)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255,255,255,0.22)'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  const step = height / 5
  const offset = (game.scroll * 260) % step
  for (let i = -1; i < 6; i++) {
    const y = i * step + offset
    for (const lane of [-1, 1]) {
      const cx = laneX(lane, width)
      ctx.beginPath()
      ctx.moveTo(cx - 18, y + 16)
      ctx.lineTo(cx, y)
      ctx.lineTo(cx + 18, y + 16)
      ctx.stroke()
    }
  }

  // Tore
  const pair = game.pair
  if (pair) {
    const gateW = Math.min(width * 0.38, 190)
    const gateH = Math.min(gateW * 0.62, height * 0.2)
    const travel = height * RUNNER_Y + gateH
    const centerY = -gateH / 2 + pair.progress * travel
    const glow = Math.max(0, 1 - Math.abs(pair.progress - 1) * 3)
    drawGate(ctx, laneX(-1, width) - gateW / 2, centerY - gateH / 2, gateW, gateH, '#ff3fa4', String(pair.left), glow)
    drawGate(ctx, laneX(1, width) - gateW / 2, centerY - gateH / 2, gateW, gateH, '#00d9ff', String(pair.right), glow)
  }

  // Figur
  const runnerSize = Math.min(width * 0.14, 62)
  const tilt = Math.max(-0.4, Math.min(0.4, (game.lane - game.x) * 0.55))
  drawRunner(ctx, laneX(game.x, width), height * RUNNER_Y, runnerSize, stage.accent, t, tilt, scene, game.combo)

  // Partikel
  for (const p of scene.particles) {
    const alpha = Math.max(0, p.life / p.max)
    if (p.text) {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.font = `900 ${p.size}px "Nunito Variable", system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.lineWidth = 6
      ctx.lineJoin = 'round'
      ctx.strokeStyle = 'rgba(12,16,32,0.8)'
      ctx.strokeText(p.text, p.x, p.y)
      ctx.fillStyle = p.color
      ctx.fillText(p.text, p.x, p.y)
      ctx.restore()
      continue
    }
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // Es wird eng: roter Puls am Rand
  if (scene.danger > 0.02) {
    const pulse = 0.55 + Math.sin(t * 7) * 0.45
    const edge = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.25,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75,
    )
    edge.addColorStop(0, 'rgba(255,0,60,0)')
    edge.addColorStop(1, `rgba(255,0,60,${0.55 * scene.danger * pulse})`)
    ctx.fillStyle = edge
    ctx.fillRect(-20, -20, width + 40, height + 40)
  }

  if (scene.flash) {
    ctx.fillStyle = `rgba(${scene.flash.r},${scene.flash.g},${scene.flash.b},${scene.flash.life * 0.28})`
    ctx.fillRect(-20, -20, width + 40, height + 40)
  }

  ctx.restore()
}
