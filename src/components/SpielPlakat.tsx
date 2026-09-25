// Plakate für das Spieleblatt. Eigene Zeichnungen, keine Fotos.
import { useId } from 'react'

export type PlakatArt = 'was' | 'online' | 'higher' | 'geschichte' | 'karte' | 'gemischt' | 'mathe' | 'personen' | 'zufall'

export function SpielPlakat({ art }: { art: PlakatArt }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg className="spiel-plakat" viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {art === 'was' && <Was uid={uid} />}
      {art === 'online' && <Online uid={uid} />}
      {art === 'higher' && <Higher uid={uid} />}
      {art === 'geschichte' && <Geschichte uid={uid} />}
      {art === 'karte' && <Karte uid={uid} />}
      {art === 'gemischt' && <Gemischt uid={uid} />}
      {art === 'mathe' && <Mathe uid={uid} />}
      {art === 'personen' && <Personen uid={uid} />}
      {art === 'zufall' && <Zufall uid={uid} />}
    </svg>
  )
}

function Verlauf({ id, von, bis }: { id: string; von: string; bis: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={von} />
      <stop offset="1" stopColor={bis} />
    </linearGradient>
  )
}

function Was({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={uid} von="#1c3d6e" bis="#0e1a2e" />
      <rect width="360" height="220" fill={`url(#${uid})`} />
      <rect x="28" y="36" width="86" height="58" fill="#111" />
      <rect x="28" y="36" width="86" height="20" fill="#111" />
      <rect x="28" y="56" width="86" height="19" fill="#dd0000" />
      <rect x="28" y="75" width="86" height="19" fill="#ffce00" />
      <circle cx="196" cy="78" r="34" fill="#f2c9a4" />
      <path d="M170 62c8-16 28-16 36 0" fill="#3a2418" />
      <circle cx="184" cy="76" r="3" fill="#2a2118" />
      <circle cx="208" cy="76" r="3" fill="#2a2118" />
      <path d="M250 150l28-78 28 78z" fill="#e7d3b0" />
      <path d="M278 72l6-16 6 16" fill="#c4a574" />
      <ellipse cx="96" cy="160" rx="28" ry="18" fill="#f2c14e" />
      <circle cx="96" cy="150" r="14" fill="#e0a24a" />
    </>
  )
}

function Online({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={uid} von="#243056" bis="#12182c" />
      <rect width="360" height="220" fill={`url(#${uid})`} />
      <circle cx="118" cy="100" r="46" fill="#6d8cff" />
      <circle cx="242" cy="100" r="46" fill="#f2c14e" />
      <circle cx="118" cy="88" r="16" fill="#f4d2b4" />
      <circle cx="242" cy="88" r="16" fill="#e0b08a" />
      <path d="M86 132c8-18 22-24 32-24s24 6 32 24" fill="#f7f4ee" />
      <path d="M210 132c8-18 22-24 32-24s24 6 32 24" fill="#3a2418" />
      <text x="180" y="118" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="800" fontFamily="Nunito, sans-serif">
        VS
      </text>
    </>
  )
}

function Higher({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={uid} von="#12324a" bis="#071820" />
      <rect width="360" height="220" fill={`url(#${uid})`} />
      <rect x="70" y="120" width="70" height="60" rx="8" fill="#3ecf8e" />
      <rect x="220" y="48" width="70" height="132" rx="8" fill="#7eb6ff" />
      <path d="M188 78l18-16 18 16" fill="none" stroke="#f2c14e" strokeWidth="6" strokeLinejoin="round" />
      <text x="105" y="108" textAnchor="middle" fill="#9fd7c8" fontSize="18" fontWeight="800" fontFamily="Nunito, sans-serif">
        12
      </text>
      <text x="255" y="40" textAnchor="middle" fill="#d5e6ff" fontSize="18" fontWeight="800" fontFamily="Nunito, sans-serif">
        80
      </text>
    </>
  )
}

function Geschichte({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={uid} von="#6a4328" bis="#2a1c12" />
      <rect width="360" height="220" fill={`url(#${uid})`} />
      <rect x="40" y="36" width="280" height="148" rx="8" fill="#f3e6c8" />
      <path d="M70 110h220" stroke="#b08968" strokeWidth="4" />
      <circle cx="110" cy="110" r="8" fill="#8a3a2a" />
      <circle cx="180" cy="110" r="8" fill="#8a3a2a" />
      <circle cx="250" cy="110" r="8" fill="#8a3a2a" />
      <text x="110" y="86" textAnchor="middle" fill="#5c3b16" fontSize="14" fontWeight="800" fontFamily="Nunito, sans-serif">
        800
      </text>
      <text x="180" y="146" textAnchor="middle" fill="#5c3b16" fontSize="14" fontWeight="800" fontFamily="Nunito, sans-serif">
        1492
      </text>
      <text x="250" y="86" textAnchor="middle" fill="#5c3b16" fontSize="14" fontWeight="800" fontFamily="Nunito, sans-serif">
        1969
      </text>
    </>
  )
}

function Karte({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={uid} von="#0e4d6e" bis="#083044" />
      <rect width="360" height="220" fill={`url(#${uid})`} />
      <path d="M70 70l40-16 36 20 20-18 48 10 30 28-16 30-40 8-28-16-36 18-30-20z" fill="#d7e2c4" />
      <path d="M150 120l24 8 10 22-20 6z" fill="#e7d3b0" />
      <circle cx="168" cy="96" r="6" fill="#e0456b" />
      <path d="M168 78v12" stroke="#e0456b" strokeWidth="3" />
    </>
  )
}

function Gemischt({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={uid} von="#2a2150" bis="#141228" />
      <rect width="360" height="220" fill={`url(#${uid})`} />
      <rect x="36" y="36" width="130" height="70" rx="12" fill="#dd0000" />
      <rect x="36" y="36" width="130" height="24" fill="#111" />
      <rect x="194" y="36" width="130" height="70" rx="12" fill="#f2c14e" />
      <circle cx="259" cy="70" r="18" fill="#6b3f1d" />
      <rect x="36" y="120" width="130" height="64" rx="12" fill="#3e9a62" />
      <rect x="194" y="120" width="130" height="64" rx="12" fill="#7eb6ff" />
      <text x="259" y="160" textAnchor="middle" fill="#12324a" fontSize="28" fontWeight="800" fontFamily="Nunito, sans-serif">
        ?
      </text>
    </>
  )
}

function Mathe({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={uid} von="#12324a" bis="#0c3d36" />
      <rect width="360" height="220" fill={`url(#${uid})`} />
      <text x="70" y="130" fill="#f2c14e" fontSize="64" fontWeight="800" fontFamily="Nunito, sans-serif">
        7
      </text>
      <text x="130" y="120" fill="#fff" fontSize="42" fontWeight="800" fontFamily="Nunito, sans-serif">
        ×
      </text>
      <text x="180" y="130" fill="#7eb6ff" fontSize="64" fontWeight="800" fontFamily="Nunito, sans-serif">
        8
      </text>
      <path d="M250 150c20-40 50-40 60-10" fill="none" stroke="#3ecf8e" strokeWidth="6" strokeLinecap="round" />
    </>
  )
}

function Personen({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={uid} von="#3a2458" bis="#1a1430" />
      <rect width="360" height="220" fill={`url(#${uid})`} />
      <circle cx="110" cy="92" r="28" fill="#f2c9a4" />
      <path d="M78 168c6-28 20-40 32-40s26 12 32 40" fill="#d7c4b0" />
      <circle cx="180" cy="100" r="32" fill="#e0b08a" />
      <path d="M142 176c8-32 24-44 38-44s30 12 38 44" fill="#c4a574" />
      <path d="M156 78c10-8 28-6 34 6" fill="#3a2418" />
      <circle cx="252" cy="96" r="26" fill="#c48a6a" />
      <path d="M222 168c6-26 18-36 30-36s24 10 30 36" fill="#8d6b43" />
    </>
  )
}

function Zufall({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={uid} von="#3d2a86" bis="#1a1440" />
      <rect width="360" height="220" fill={`url(#${uid})`} />
      <rect x="118" y="48" width="124" height="124" rx="24" fill="#f7f4ee" transform="rotate(8 180 110)" />
      <circle cx="168" cy="100" r="10" fill="#5a5cf0" />
      <circle cx="196" cy="100" r="10" fill="#5a5cf0" />
      <circle cx="168" cy="128" r="10" fill="#5a5cf0" />
      <circle cx="196" cy="128" r="10" fill="#e07a3d" />
      <circle cx="182" cy="114" r="10" fill="#5a5cf0" />
    </>
  )
}
