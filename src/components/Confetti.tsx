import { useEffect, useRef } from 'react'

const COLORS = ['#5b6cff', '#1fa855', '#f5a524', '#e5484d', '#06b6d4', '#a855f7']
const DURATION = 3600

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    const pieces = Array.from({ length: 150 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * 0.6,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      vx: -1.5 + Math.random() * 3,
      vy: 2 + Math.random() * 3,
      angle: Math.random() * Math.PI,
      spin: -0.2 + Math.random() * 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }))

    const start = performance.now()
    let frame = 0
    const draw = (now: number) => {
      const elapsed = now - start
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      if (elapsed > DURATION) return
      ctx.globalAlpha = Math.min(1, (DURATION - elapsed) / 800)
      for (const piece of pieces) {
        piece.x += piece.vx
        piece.y += piece.vy
        piece.vy += 0.035
        piece.angle += piece.spin
        ctx.save()
        ctx.translate(piece.x, piece.y)
        ctx.rotate(piece.angle)
        ctx.fillStyle = piece.color
        ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h)
        ctx.restore()
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="confetti" aria-hidden="true" />
}
