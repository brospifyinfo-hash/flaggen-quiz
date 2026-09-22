// Die Tagesuhr der Stadt. Sie zeigt keine Uhrzeit, nur die Tageszeit: Morgen, Mittag,
// Abend, Nacht – vier Viertel eines Rings, ein Zeiger, der einmal am Tag herumgeht.
// Steht er oben, ist Tagesabschluss. Alles ist gezeichnet, kein Bild, kein Emoji.
import { useEffect, useState } from 'react'
import type { CityState } from '../city/types'
import type { Tagesphase, Tageszeit } from '../city/zeit'
import { phaseInfo, tageszeit } from '../city/zeit'

/** Die Tageszeit der Stadt, laufend nachgeführt */
export function useTageszeit(city: CityState | undefined, takt = 10_000): Tageszeit | null {
  const [jetzt, setJetzt] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setJetzt(Date.now()), takt)
    return () => window.clearInterval(t)
  }, [takt])
  return city ? tageszeit(city, jetzt) : null
}

const M = 50
const R_AUSSEN = 46
const R_INNEN = 30

/** Punkt auf dem Kreis – 0° oben, im Uhrzeigersinn */
function punkt(grad: number, r: number): [number, number] {
  const a = ((grad - 90) * Math.PI) / 180
  return [M + r * Math.cos(a), M + r * Math.sin(a)]
}

/** Ringsegment von Winkel a bis b */
function segment(a: number, b: number, r0: number, r1: number): string {
  const [ax, ay] = punkt(a, r1)
  const [bx, by] = punkt(b, r1)
  const [cx, cy] = punkt(b, r0)
  const [dx, dy] = punkt(a, r0)
  return `M${ax} ${ay} A${r1} ${r1} 0 0 1 ${bx} ${by} L${cx} ${cy} A${r0} ${r0} 0 0 0 ${dx} ${dy} Z`
}

const VIERTEL: { id: Tagesphase; von: number; farben: [string, string] }[] = [
  { id: 'morgen', von: 0, farben: ['#ffd39a', '#ff9f6e'] },
  { id: 'mittag', von: 90, farben: ['#9fe0ff', '#ffe98a'] },
  { id: 'abend', von: 180, farben: ['#ff8f5c', '#8e56b0'] },
  { id: 'nacht', von: 270, farben: ['#2a2f6e', '#0f1233'] },
]

/** Kleine Sinnbilder in den Vierteln – Sonnenaufgang, Sonne, Sonnenuntergang, Mond */
function Sinnbild({ phase, x, y, s }: { phase: Tagesphase; x: number; y: number; s: number }) {
  switch (phase) {
    case 'morgen':
      return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <path d="M-4 1 A4 4 0 0 1 4 1 Z" fill="#fff3d6" />
          <line x1="-6" y1="1.6" x2="6" y2="1.6" stroke="#fff3d6" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="0" y1="-6.2" x2="0" y2="-4.6" stroke="#fff3d6" strokeWidth="1" strokeLinecap="round" />
          <line x1="-4.6" y1="-4.4" x2="-3.5" y2="-3.3" stroke="#fff3d6" strokeWidth="1" strokeLinecap="round" />
          <line x1="4.6" y1="-4.4" x2="3.5" y2="-3.3" stroke="#fff3d6" strokeWidth="1" strokeLinecap="round" />
        </g>
      )
    case 'mittag':
      return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <circle r="3.2" fill="#fff8d0" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4
            return (
              <line
                key={i}
                x1={Math.cos(a) * 4.6}
                y1={Math.sin(a) * 4.6}
                x2={Math.cos(a) * 6.2}
                y2={Math.sin(a) * 6.2}
                stroke="#fff8d0"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            )
          })}
        </g>
      )
    case 'abend':
      return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <path d="M-4 1 A4 4 0 0 1 4 1 Z" fill="#ffd9b8" />
          <line x1="-6" y1="1.6" x2="6" y2="1.6" stroke="#ffd9b8" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="-6" y1="3.8" x2="-2" y2="3.8" stroke="#ffd9b8" strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
          <line x1="1" y1="3.8" x2="5" y2="3.8" stroke="#ffd9b8" strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
        </g>
      )
    case 'nacht':
      return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <path d="M1.5 -5 A5 5 0 1 0 1.5 5 A3.9 3.9 0 1 1 1.5 -5 Z" fill="#f2f4ff" />
          <circle cx="5.2" cy="-3.6" r="0.7" fill="#f2f4ff" />
          <circle cx="4.4" cy="3.4" r="0.5" fill="#f2f4ff" opacity="0.8" />
        </g>
      )
  }
}

export interface TagesuhrProps {
  zeit: Tageszeit
  size?: number
  /** Mit Sinnbildern und Beschriftung – für die große Ansicht */
  detail?: boolean
  onClick?: () => void
  className?: string
  title?: string
}

export function Tagesuhr({ zeit, size = 44, detail = false, onClick, className, title }: TagesuhrProps) {
  const grad = zeit.anteil * 360
  const [zx, zy] = punkt(grad, R_AUSSEN - 4)
  const [zx0, zy0] = punkt(grad + 180, 6)
  const info = phaseInfo(zeit.phase)
  const kennung = `tu${size}${detail ? 'd' : ''}`
  const inhalt = (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`tagesuhr${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={title ?? `Tageszeit: ${info.name}`}
    >
      <defs>
        {VIERTEL.map((v) => (
          <linearGradient key={v.id} id={`${kennung}-${v.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={v.farben[0]} />
            <stop offset="1" stopColor={v.farben[1]} />
          </linearGradient>
        ))}
        <radialGradient id={`${kennung}-glas`} cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#1d2340" />
          <stop offset="1" stopColor="#0a0d1c" />
        </radialGradient>
        <filter id={`${kennung}-schatten`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0.6" stdDeviation="0.8" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* der Ring aus vier Tageszeiten */}
      {VIERTEL.map((v) => (
        <path key={v.id} d={segment(v.von, v.von + 90, R_INNEN, R_AUSSEN)} fill={`url(#${kennung}-${v.id})`} />
      ))}
      {/* Sterne in der Nacht */}
      {[
        [300, 38, 0.9],
        [318, 42.5, 0.6],
        [334, 35, 0.7],
        [350, 40, 0.5],
        [285, 33, 0.55],
      ].map(([g, r, s], i) => {
        const [x, y] = punkt(g, r)
        return <circle key={i} cx={x} cy={y} r={s} fill="#fff" opacity="0.85" />
      })}
      {/* Fugen zwischen den Vierteln */}
      {VIERTEL.map((v) => {
        const [x0, y0] = punkt(v.von, R_INNEN)
        const [x1, y1] = punkt(v.von, R_AUSSEN)
        return <line key={v.id} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#0a0d1c" strokeWidth="1.4" opacity="0.7" />
      })}
      {/* der aktive Abschnitt leuchtet */}
      <path
        d={segment(VIERTEL.find((v) => v.id === zeit.phase)!.von, VIERTEL.find((v) => v.id === zeit.phase)!.von + 90, R_INNEN, R_AUSSEN)}
        fill="none"
        stroke="#fff"
        strokeWidth="1.2"
        opacity="0.75"
      />
      <circle cx={M} cy={M} r={R_AUSSEN} fill="none" stroke="#0a0d1c" strokeWidth="2" />

      {detail &&
        VIERTEL.map((v) => {
          const [x, y] = punkt(v.von + 45, (R_INNEN + R_AUSSEN) / 2)
          return <Sinnbild key={v.id} phase={v.id} x={x} y={y} s={1} />
        })}

      {/* Glas in der Mitte */}
      <circle cx={M} cy={M} r={R_INNEN - 1} fill={`url(#${kennung}-glas)`} stroke="#0a0d1c" strokeWidth="1.5" />

      {/* Marke oben: Tagesabschluss */}
      <path d={`M${M} ${M - R_AUSSEN - 1} l3.2 3.6 l-3.2 3.6 l-3.2 -3.6 Z`} fill="#ffd166" stroke="#0a0d1c" strokeWidth="0.8" />

      {detail && (
        <>
          <text x={M} y={M + 1} textAnchor="middle" className="tagesuhr-phase">
            {info.name}
          </text>
          <text x={M} y={M + 9} textAnchor="middle" className="tagesuhr-klein">
            Tag der Stadt
          </text>
        </>
      )}

      {/* Zeiger */}
      <g filter={`url(#${kennung}-schatten)`}>
        <line x1={zx0} y1={zy0} x2={zx} y2={zy} stroke="#ffffff" strokeWidth={detail ? 2.2 : 3} strokeLinecap="round" />
        <circle cx={zx} cy={zy} r={detail ? 2.4 : 3} fill="#ffd166" stroke="#0a0d1c" strokeWidth="0.8" />
        <circle cx={M} cy={M} r={detail ? 3.2 : 4} fill="#ffd166" stroke="#0a0d1c" strokeWidth="1" />
      </g>
    </svg>
  )
  if (!onClick) return inhalt
  return (
    <button type="button" className="tagesuhr-knopf" onClick={onClick} aria-label={title ?? `Tageszeit: ${info.name} – antippen für den Tagesabschluss`}>
      {inhalt}
    </button>
  )
}
