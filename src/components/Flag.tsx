import type { CSSProperties } from 'react'
import ratios from '../data/flag-ratios.json'

const RATIOS: Record<string, number> = ratios

/** Nicht rechteckige Flaggen bekommen einen Schatten entlang der Form statt eines Rahmens */
const SHAPED = new Set(['np'])

export function Flag({ code, className }: { code: string; className?: string }) {
  return (
    <img
      className={['flag', SHAPED.has(code) && 'flag-shaped', className].filter(Boolean).join(' ')}
      src={`/flags/${code}.svg`}
      alt=""
      draggable={false}
      decoding="async"
      style={{ '--r': RATIOS[code] ?? 1.5 } as CSSProperties}
    />
  )
}
