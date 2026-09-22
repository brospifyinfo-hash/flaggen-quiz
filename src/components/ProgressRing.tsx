import type { ReactNode } from 'react'

interface Props {
  value: number
  size?: number
  stroke?: number
  color?: string
  children?: ReactNode
}

export function ProgressRing({ value, size = 64, stroke = 8, color = 'var(--primary)', children }: Props) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(Math.max(value, 0), 1)
  return (
    <span className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        {clamped > 0 && (
          <circle
            className="ring-value"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped)}
          />
        )}
      </svg>
      <span className="ring-label">{children}</span>
    </span>
  )
}
