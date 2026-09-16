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
}

const MAX_PARTICLES = 160

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

export function updateScene(scene: Scene, game: Game, dt: number, width: number, height: number): void {
  // Himmel weich zur aktuellen Stufe überblenden
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

  // Spur hinter der Figur
  if (game.phase === 'running') {
    scene.trail -= dt
    if (scene.trail <= 0) {
      scene.trail = 0.045
      const x = laneX(game.x, width)
      const y = height * RUNNER_Y + 18
      if (scene.particles.length < MAX_PARTICLES) {
        scene.particles.push({
          x: x + (Math.random() - 0.5) * 14,
          y,
          vx: (Math.random() - 0.5) * 30,
          vy: 120 + Math.random() * 80,
          life: 0.45,
          max: 0.45,
          size: 4 + Math.random() * 4,
          color: stage.accent,
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
  ctx.shadowBlur = 18 + glow * 26
  const fill = ctx.createLinearGradient(x, y, x, y + h)
  fill.addColorStop(0, color)
  fill.addColorStop(1, 'rgba(0,0,0,0.35)')
  ctx.fillStyle = fill
  roundedPath(ctx, x, y, w, h, 20)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.lineWidth = 4
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
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

function drawRunner(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, accent: string, t: number): void {
  const bob = Math.sin(t * 11) * size * 0.08
  ctx.save()
  ctx.translate(x, y + bob)

  ctx.shadowColor = accent
  ctx.shadowBlur = 26
  ctx.fillStyle = accent
  roundedPath(ctx, -size / 2, -size * 0.7, size, size * 1.4, size * 0.42)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.beginPath()
  ctx.arc(-size * 0.17, -size * 0.18, size * 0.14, 0, Math.PI * 2)
  ctx.arc(size * 0.17, -size * 0.18, size * 0.14, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#12162a'
  ctx.beginPath()
  ctx.arc(-size * 0.15, -size * 0.16, size * 0.07, 0, Math.PI * 2)
  ctx.arc(size * 0.19, -size * 0.16, size * 0.07, 0, Math.PI * 2)
  ctx.fill()

  // Beine laufen mit
  ctx.strokeStyle = '#12162a'
  ctx.lineCap = 'round'
  ctx.lineWidth = size * 0.13
  const swing = Math.sin(t * 16) * size * 0.28
  ctx.beginPath()
  ctx.moveTo(-size * 0.16, size * 0.6)
  ctx.lineTo(-size * 0.16 + swing, size * 0.95)
  ctx.moveTo(size * 0.16, size * 0.6)
  ctx.lineTo(size * 0.16 - swing, size * 0.95)
  ctx.stroke()
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

  // Sterne, die mit der Welt nach unten ziehen
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  for (const star of scene.stars) {
    const y = ((star.y + game.scroll * star.depth * 0.25) % 1) * height
    ctx.globalAlpha = 0.25 + star.depth * 0.45
    ctx.beginPath()
    ctx.arc(star.x * width, y, star.r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // Strecke: zwei Spuren mit laufenden Pfeilen
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
    // Kurz vor der Figur leuchten die Tore auf – aber die Farbe verrät nie die Lösung
    const glow = Math.max(0, 1 - Math.abs(pair.progress - 1) * 3)
    drawGate(ctx, laneX(-1, width) - gateW / 2, centerY - gateH / 2, gateW, gateH, '#ff3fa4', String(pair.left), glow)
    drawGate(ctx, laneX(1, width) - gateW / 2, centerY - gateH / 2, gateW, gateH, '#00d9ff', String(pair.right), glow)
  }

  // Figur
  const runnerSize = Math.min(width * 0.13, 58)
  drawRunner(ctx, laneX(game.x, width), height * RUNNER_Y, runnerSize, stage.accent, t)

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

  if (scene.flash) {
    ctx.fillStyle = `rgba(${scene.flash.r},${scene.flash.g},${scene.flash.b},${scene.flash.life * 0.28})`
    ctx.fillRect(-20, -20, width + 40, height + 40)
  }

  ctx.restore()
}
