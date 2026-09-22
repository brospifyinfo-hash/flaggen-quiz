import type { Rank } from '../progression'
import { RANKS } from '../progression'

const STAR = 'M0 -6 1.76 -1.85 6 -1.85 2.47 1.05 4 6 0 3.1 -4 6 -2.47 1.05 -6 -1.85 -1.76 -1.85Z'

/** Wappen eines Rangs: Schild mit Weltkugel und einem Stern je erreichter Stufe */
export function RankCrest({ rank, size = 104 }: { rank: Rank; size?: number }) {
  const tier = RANKS.findIndex((entry) => entry.id === rank.id)
  const stars = tier + 1
  const gradient = `crest-${rank.id}`

  return (
    <svg
      className="crest"
      width={size}
      height={size * 1.12}
      viewBox="0 0 100 112"
      role="img"
      aria-label={`Rang ${rank.name}`}
    >
      <defs>
        <linearGradient id={gradient} x1="0.1" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={rank.colors[0]} />
          <stop offset="1" stopColor={rank.colors[1]} />
        </linearGradient>
        <linearGradient id={`${gradient}-glanz`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <path
        d="M50 3 94 18v36c0 26-20 44-44 54C26 98 6 80 6 54V18Z"
        fill={`url(#${gradient})`}
        stroke={rank.colors[1]}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M50 3 94 18v36c0 26-20 44-44 54Z" fill={`url(#${gradient}-glanz)`} />
      <path
        d="M50 11 86 23v31c0 21-16 36-36 45-20-9-36-24-36-45V23Z"
        fill="none"
        stroke={rank.ink}
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />

      {/* Weltkugel als Emblem */}
      <g transform="translate(50 45)" stroke={rank.ink} fill="none" strokeWidth="2.2" strokeLinecap="round">
        <circle r="17" fill={rank.ink} fillOpacity="0.12" />
        <circle r="17" />
        <ellipse rx="7.5" ry="17" />
        <path d="M-17 0h34M-14.5 -8.5h29M-14.5 8.5h29" />
      </g>

      {/* ein Stern je Stufe */}
      <g fill={rank.ink} opacity="0.9">
        {Array.from({ length: stars }, (_, index) => (
          <path
            key={index}
            d={STAR}
            transform={`translate(${50 + (index - (stars - 1) / 2) * 9.5} 80) scale(0.62)`}
          />
        ))}
      </g>
    </svg>
  )
}
