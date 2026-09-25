// Kleine Zeichen für die Spielekarten. Eine Form, dieselbe Strichstärke wie die übrigen Icons.
import type { ReactNode } from 'react'

export type PlakatArt =
  | 'was'
  | 'online'
  | 'higher'
  | 'geschichte'
  | 'karte'
  | 'gemischt'
  | 'mathe'
  | 'personen'
  | 'zufall'
  | 'autos'
  | 'marken'
  | 'orte'
  | 'natur'
  | 'rap'

export function SpielZeichen({ art }: { art: PlakatArt }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      {ZEICHEN[art]}
    </svg>
  )
}

const strich = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const ZEICHEN: Record<PlakatArt, ReactNode> = {
  was: (
    <>
      <circle cx="21" cy="21" r="10" {...strich} />
      <path d="M29 29l8 8" {...strich} />
    </>
  ),
  online: (
    <>
      <circle cx="16" cy="20" r="6" {...strich} />
      <path d="M8 34c1.2-5 4-7.5 8-7.5S22.8 29 24 34" {...strich} />
      <circle cx="32" cy="20" r="6" {...strich} />
      <path d="M24 34c1.2-5 4-7.5 8-7.5S38.8 29 40 34" {...strich} />
    </>
  ),
  higher: (
    <>
      <path d="M14 30V18M24 30V12M34 30v-8" {...strich} />
      <path d="M10 34h28" {...strich} />
    </>
  ),
  geschichte: (
    <>
      <circle cx="24" cy="24" r="12" {...strich} />
      <path d="M24 16v9l6 3" {...strich} />
    </>
  ),
  karte: (
    <>
      <circle cx="24" cy="24" r="13" {...strich} />
      <path d="M24 11c4 4 6 8 6 13s-2 9-6 13c-4-4-6-8-6-13s2-9 6-13z" {...strich} />
      <path d="M12 24h24" {...strich} />
    </>
  ),
  gemischt: (
    <>
      <rect x="8" y="8" width="14" height="14" rx="3" {...strich} />
      <rect x="26" y="8" width="14" height="14" rx="3" {...strich} />
      <rect x="8" y="26" width="14" height="14" rx="3" {...strich} />
      <rect x="26" y="26" width="14" height="14" rx="3" {...strich} />
    </>
  ),
  mathe: (
    <text x="24" y="30" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="800" fontFamily="Nunito, sans-serif" stroke="none">
      7×8
    </text>
  ),
  personen: (
    <>
      <circle cx="24" cy="16" r="6" {...strich} />
      <path d="M12 36c1.4-7 6-10 12-10s10.6 3 12 10" {...strich} />
    </>
  ),
  zufall: (
    <>
      <rect x="10" y="10" width="28" height="28" rx="7" {...strich} />
      <circle cx="18" cy="18" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="24" cy="24" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="30" cy="30" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="30" cy="18" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="18" cy="30" r="1.8" fill="currentColor" stroke="none" />
    </>
  ),
  autos: (
    <>
      <path d="M8 30h32l-3.5-9H14z" {...strich} />
      <path d="M16 21l2-6h12l3 6" {...strich} />
      <circle cx="16" cy="32" r="2.4" {...strich} />
      <circle cx="32" cy="32" r="2.4" {...strich} />
    </>
  ),
  marken: (
    <>
      <path d="M14 22l10-10h12v12L24 36z" {...strich} />
      <circle cx="31" cy="17" r="1.8" fill="currentColor" stroke="none" />
    </>
  ),
  orte: (
    <>
      <path d="M8 36l8-20 8 20" {...strich} />
      <path d="M14 24h4" {...strich} />
      <path d="M26 36V18h12v18" {...strich} />
      <path d="M26 18l6-6 6 6" {...strich} />
    </>
  ),
  natur: (
    <>
      <path d="M24 40V22" {...strich} />
      <path d="M24 28c-8 1-14-6-12-14 8 1 13 7 12 14z" {...strich} />
      <path d="M24 24c8-1 14-8 12-16-8 1-13 8-12 16z" {...strich} />
    </>
  ),
  rap: (
    <>
      <circle cx="24" cy="24" r="13" {...strich} />
      <circle cx="24" cy="24" r="4" {...strich} />
    </>
  ),
}
