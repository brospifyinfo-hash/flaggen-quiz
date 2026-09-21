// Die eigene Stadt als Kulisse hinter der Startseite. Gezeichnet wird mit demselben
// Renderer wie im Stadtbildschirm – nur ohne Bedienung: Häuser stehen, Autos und Leute
// laufen weiter. Bei „weniger Bewegung“ und im Hintergrundtab bleibt das Bild stehen.
import { useEffect, useRef } from 'react'
import { setBlick } from './iso'
import { anpassen, createLife, signatureOf, stepLife, type Life } from './life'
import { cityFrame, drawCity, type Camera } from './render'
import type { CityState } from './types'

/** Näher dran als im Stadtbildschirm: Die Kulisse darf über den Rand hinauslaufen. */
const NAEHE = 1.3
/** Halbe Bildrate reicht für eine Kulisse und schont den Akku. */
const BILDABSTAND = 33

export function StadtKulisse({ city }: { city: CityState }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const stadt = useRef(city)
  stadt.current = city

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const ctx = element.getContext('2d')
    if (!ctx) return

    const size = { w: 0, h: 0 }
    let camera: Camera = { x: 0, y: 0, zoom: 1 }
    let life: Life | null = null

    // Nur der Speicher hinter dem Bild wird gesetzt – die Größe im Layout macht CSS,
    // sonst misst sich die Fläche beim Zeichnen immer wieder selbst neu.
    const fit = () => {
      const rect = element.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      size.w = rect.width
      size.h = rect.height
      element.width = Math.round(size.w * dpr)
      element.height = Math.round(size.h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      setBlick(0, stadt.current.land)
      const passend = cityFrame(stadt.current, size)
      camera = { ...passend, zoom: Math.min(2.6, passend.zoom * NAEHE) }
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(element)

    const ruhig = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    let raf = 0
    let last = performance.now()
    let gezeichnet = 0
    let bildzeit = 16
    let detail = true

    const zeichne = (now: number) => {
      if (size.w < 1) return
      setBlick(0, stadt.current.land)
      drawCity(ctx, stadt.current, camera, size, {
        detail,
        blick: 0,
        life,
        time: now / 1000,
      })
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (now - gezeichnet < BILDABSTAND) return
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000))
      bildzeit = bildzeit * 0.9 + Math.min(200, now - gezeichnet) * 0.1
      if (detail && bildzeit > 44) detail = false
      else if (!detail && bildzeit < 30) detail = true
      last = now
      gezeichnet = now
      if (!life) life = createLife(stadt.current)
      else if (life.signature !== signatureOf(stadt.current)) anpassen(life, stadt.current)
      stepLife(life, stadt.current, dt)
      zeichne(now)
    }

    if (ruhig?.matches) zeichne(performance.now())
    else raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return <canvas ref={canvas} className="home-kulisse" aria-hidden="true" />
}
