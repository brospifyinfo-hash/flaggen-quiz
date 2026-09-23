// Kleine Vektorzeichen für die Leinwand: das Rathaus-Symbol, die Ruinenmarke, das
// wütende Gesicht in der Sprechblase, ein Bürgerporträt. Früher standen hier Emoji,
// die je Gerät anders aussahen – jetzt zeichnet die Stadt ihre Zeichen selbst.
import { hashOf, wobble } from './draw'

export type Zeichen = 'rathaus' | 'ruine' | 'wut' | 'zorn' | 'person'

const HAUT = ['#f6d3b3', '#e8b48c', '#c68b5c', '#8d5a3b', '#f2c9a8', '#a56d47']
const HAAR = ['#2b1d16', '#6b3e2a', '#d9a066', '#1a1a1a', '#b5651d', '#8c8c8c']
const HEMD = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#14b8a6']

/** Ein Zeichen mit Mittelpunkt (x, y) und Kantenlänge `s` malen */
export function zeichen(ctx: CanvasRenderingContext2D, art: Zeichen, x: number, y: number, s: number, seed = 0): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s / 20, s / 20)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  switch (art) {
    case 'rathaus':
      rathaus(ctx)
      break
    case 'ruine':
      ruine(ctx)
      break
    case 'wut':
      wut(ctx)
      break
    case 'zorn':
      zorn(ctx)
      break
    case 'person':
      person(ctx, seed)
      break
  }
  ctx.restore()
}

/** Welches Zeichen für ein altes Emoji steht – Bürgerbilder werden zu Porträts */
export function zeichenFuerEmoji(emoji: string): Zeichen {
  if (emoji.startsWith('🏛')) return 'rathaus'
  if (emoji.startsWith('🏚')) return 'ruine'
  if (emoji === '😠' || emoji === '😡') return 'wut'
  if (emoji === '💢') return 'zorn'
  return 'person'
}

/** Ein fester Zufall aus einem Text, damit dasselbe Gesicht immer gleich aussieht */
export const seedAus = (text: string): number => hashOf(text)

// Alles Folgende ist in einem 20×20-Feld um den Ursprung gezeichnet (−10 … 10)

function rathaus(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#efe6cf'
  ctx.strokeStyle = '#6b5a3e'
  ctx.lineWidth = 1.1
  // Giebel
  ctx.beginPath()
  ctx.moveTo(-9.5, -3)
  ctx.lineTo(0, -9.5)
  ctx.lineTo(9.5, -3)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  // Gebälk
  ctx.fillRect(-9, -3, 18, 2.2)
  ctx.strokeRect(-9, -3, 18, 2.2)
  // Säulen
  for (const cx of [-6.5, -2.2, 2.2, 6.5]) {
    ctx.fillRect(cx - 1.1, -0.8, 2.2, 7.6)
    ctx.strokeRect(cx - 1.1, -0.8, 2.2, 7.6)
  }
  // Sockel
  ctx.fillRect(-9.5, 6.8, 19, 2.4)
  ctx.strokeRect(-9.5, 6.8, 19, 2.4)
  // Goldkugel auf der Spitze
  ctx.fillStyle = '#e8b830'
  ctx.beginPath()
  ctx.arc(0, -9.6, 1.4, 0, Math.PI * 2)
  ctx.fill()
}

function ruine(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#8b857a'
  ctx.strokeStyle = '#3a3733'
  ctx.lineWidth = 1.1
  // Mauer mit abgebrochener Kante
  ctx.beginPath()
  ctx.moveTo(-8, 9)
  ctx.lineTo(-8, -2)
  ctx.lineTo(-4, -2)
  ctx.lineTo(-4, -5)
  ctx.lineTo(1, -5)
  ctx.lineTo(1, -1)
  ctx.lineTo(4, -1)
  ctx.lineTo(4, 3)
  ctx.lineTo(8, 3)
  ctx.lineTo(8, 9)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  // Riss
  ctx.strokeStyle = '#2a2724'
  ctx.lineWidth = 0.9
  ctx.beginPath()
  ctx.moveTo(-2, -4)
  ctx.lineTo(-1, 0)
  ctx.lineTo(-3, 3)
  ctx.lineTo(-1.5, 8)
  ctx.stroke()
  // Dachrest
  ctx.fillStyle = '#5a4a3c'
  ctx.beginPath()
  ctx.moveTo(-9.5, -1.5)
  ctx.lineTo(-4, -8)
  ctx.lineTo(-1, -5.5)
  ctx.lineTo(-4, -2)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  // Fenster, dunkel
  ctx.fillStyle = '#1f1c1a'
  ctx.fillRect(-6.6, 1, 2.6, 3)
  ctx.fillRect(4.8, 5, 2, 2.6)
  // Unkraut
  ctx.strokeStyle = '#4e7d3a'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(6, 9)
  ctx.lineTo(7.5, 5.5)
  ctx.moveTo(-9, 9)
  ctx.lineTo(-10, 6)
  ctx.stroke()
}

function wut(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createRadialGradient(-2, -3, 1, 0, 0, 10)
  g.addColorStop(0, '#ff8a5c')
  g.addColorStop(1, '#e0402a')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, 9.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#7a1e12'
  ctx.lineWidth = 1
  ctx.stroke()
  // Brauen, nach innen gezogen
  ctx.strokeStyle = '#4a120a'
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(-6, -4.5)
  ctx.lineTo(-1.5, -2.5)
  ctx.moveTo(6, -4.5)
  ctx.lineTo(1.5, -2.5)
  ctx.stroke()
  // Augen
  ctx.fillStyle = '#2a0c06'
  ctx.beginPath()
  ctx.arc(-3.5, -0.5, 1.3, 0, Math.PI * 2)
  ctx.arc(3.5, -0.5, 1.3, 0, Math.PI * 2)
  ctx.fill()
  // Mund
  ctx.strokeStyle = '#4a120a'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(0, 6.5, 3.6, Math.PI * 1.18, Math.PI * 1.82)
  ctx.stroke()
}

function zorn(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = '#e63946'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const w = (i / 4) * Math.PI * 2 + Math.PI / 4
    const dx = Math.cos(w)
    const dy = Math.sin(w)
    ctx.moveTo(dx * 3.5, dy * 3.5)
    ctx.quadraticCurveTo(dx * 7 - dy * 2, dy * 7 + dx * 2, dx * 9.5, dy * 9.5)
  }
  ctx.stroke()
}

function person(ctx: CanvasRenderingContext2D, seed: number): void {
  const haut = HAUT[Math.floor(wobble(seed, 1) * HAUT.length)]
  const haar = HAAR[Math.floor(wobble(seed, 2) * HAAR.length)]
  const hemd = HEMD[Math.floor(wobble(seed, 3) * HEMD.length)]
  const lang = wobble(seed, 4) > 0.5
  // Schultern
  ctx.fillStyle = hemd
  ctx.beginPath()
  ctx.moveTo(-9, 10)
  ctx.quadraticCurveTo(-9, 2.5, -3, 2.5)
  ctx.lineTo(3, 2.5)
  ctx.quadraticCurveTo(9, 2.5, 9, 10)
  ctx.closePath()
  ctx.fill()
  // Hals
  ctx.fillStyle = haut
  ctx.fillRect(-1.8, 0, 3.6, 3.5)
  // Kopf
  ctx.beginPath()
  ctx.ellipse(0, -3.5, 5, 5.6, 0, 0, Math.PI * 2)
  ctx.fill()
  // Haar
  ctx.fillStyle = haar
  ctx.beginPath()
  if (lang) {
    ctx.moveTo(-5.4, -3)
    ctx.quadraticCurveTo(-5.6, -10.5, 0, -10)
    ctx.quadraticCurveTo(5.6, -10.5, 5.4, -3)
    ctx.lineTo(5.6, 3)
    ctx.lineTo(3.2, 3)
    ctx.lineTo(3.6, -3)
    ctx.quadraticCurveTo(2, -6.5, -1, -6.4)
    ctx.quadraticCurveTo(-3.4, -6, -3.6, -3)
    ctx.lineTo(-3.2, 3)
    ctx.lineTo(-5.6, 3)
    ctx.closePath()
  } else {
    ctx.moveTo(-5.2, -4)
    ctx.quadraticCurveTo(-5, -10, 0, -9.6)
    ctx.quadraticCurveTo(5, -10, 5.2, -4)
    ctx.quadraticCurveTo(3, -6.8, 0, -6.6)
    ctx.quadraticCurveTo(-3, -6.8, -5.2, -4)
    ctx.closePath()
  }
  ctx.fill()
  // Augen und Mund
  ctx.fillStyle = '#26160f'
  ctx.beginPath()
  ctx.arc(-1.9, -3.2, 0.7, 0, Math.PI * 2)
  ctx.arc(1.9, -3.2, 0.7, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#6b3a2c'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.arc(0, -1.2, 1.6, Math.PI * 0.15, Math.PI * 0.85)
  ctx.stroke()
}
