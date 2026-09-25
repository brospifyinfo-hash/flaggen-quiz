// Eigene Zeichnungen zu den Motiven. Keine übernommenen Logo- oder Coverdateien.
import { useId, type ReactNode } from 'react'
import { motivById } from './katalog'

export function Motiv({ id, schnitt = false }: { id: string; schnitt?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const eintrag = motivById(id)
  return (
    <svg
      className="motiv"
      viewBox="0 0 320 240"
      preserveAspectRatio={schnitt ? 'xMidYMid slice' : 'xMidYMid meet'}
      aria-hidden="true"
    >
      {eintrag ? zeichne(eintrag.gruppe, eintrag.id, uid, eintrag.titel) : <rect width="320" height="240" fill="#d9dee8" />}
    </svg>
  )
}

function zeichne(gruppe: string, id: string, uid: string, titel?: string): ReactNode {
  if (gruppe === 'autos') return <Auto id={id} uid={uid} />
  if (gruppe === 'marken') return <Marke id={id} uid={uid} />
  if (gruppe === 'orte') return <Ort id={id} uid={uid} />
  if (gruppe === 'natur') return <Natur id={id} uid={uid} />
  if (gruppe === 'rap') return <Cover id={id} uid={uid} titel={titel ?? ''} />
  return null
}

function Verlauf({ id, von, bis, senkrecht = true }: { id: string; von: string; bis: string; senkrecht?: boolean }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={senkrecht ? '0' : '1'} y2={senkrecht ? '1' : '0'}>
      <stop offset="0" stopColor={von} />
      <stop offset="1" stopColor={bis} />
    </linearGradient>
  )
}

function Himmel({ uid, von, bis, children }: { uid: string; von: string; bis: string; children: ReactNode }) {
  return (
    <>
      <Verlauf id={`${uid}-h`} von={von} bis={bis} />
      <rect width="320" height="240" fill={`url(#${uid}-h)`} />
      {children}
    </>
  )
}

function Platte({ uid, von, bis, children }: { uid: string; von: string; bis: string; children: ReactNode }) {
  return (
    <Himmel uid={uid} von={von} bis={bis}>
      <rect x="28" y="22" width="264" height="196" rx="28" fill="#10141c" opacity="0.18" />
      <rect x="36" y="28" width="248" height="184" rx="26" fill="#f7f4ee" />
      {children}
    </Himmel>
  )
}

function Auto({ id, uid }: { id: string; uid: string }) {
  const zeichen: Record<string, ReactNode> = {
    vw: (
      <>
        <circle cx="160" cy="120" r="62" fill="#0c2340" />
        <circle cx="160" cy="120" r="52" fill="none" stroke="#e8eef6" strokeWidth="3" />
        <text x="160" y="132" textAnchor="middle" fill="#e8eef6" fontSize="42" fontWeight="800" fontFamily="Nunito, sans-serif">
          VW
        </text>
      </>
    ),
    mercedes: (
      <>
        <circle cx="160" cy="120" r="64" fill="#f4f1ea" stroke="#1c1c1c" strokeWidth="4" />
        <circle cx="160" cy="120" r="52" fill="none" stroke="#1c1c1c" strokeWidth="2" />
        <path d="M160 74v46M160 120l40 24M160 120l-40 24" fill="none" stroke="#1c1c1c" strokeWidth="3" />
        <circle cx="160" cy="120" r="5" fill="#1c1c1c" />
      </>
    ),
    bmw: (
      <>
        <circle cx="160" cy="120" r="64" fill="#1c1c1c" />
        <path d="M160 62a58 58 0 0 1 58 58H160z" fill="#1c4f9c" />
        <path d="M160 178a58 58 0 0 1-58-58h58z" fill="#1c4f9c" />
        <path d="M102 120a58 58 0 0 1 58-58v58z" fill="#f4f7fb" />
        <path d="M218 120a58 58 0 0 1-58 58v-58z" fill="#f4f7fb" />
        <circle cx="160" cy="120" r="64" fill="none" stroke="#1c1c1c" strokeWidth="8" />
      </>
    ),
    audi: (
      <>
        <circle cx="112" cy="120" r="28" fill="none" stroke="#4a5562" strokeWidth="7" />
        <circle cx="144" cy="120" r="28" fill="none" stroke="#4a5562" strokeWidth="7" />
        <circle cx="176" cy="120" r="28" fill="none" stroke="#4a5562" strokeWidth="7" />
        <circle cx="208" cy="120" r="28" fill="none" stroke="#4a5562" strokeWidth="7" />
      </>
    ),
    porsche: (
      <>
        <path d="M160 58l46 16v46c0 32-46 54-46 54s-46-22-46-54V74z" fill="#1a1a1a" />
        <path d="M160 70l34 12v36c0 24-34 40-34 40s-34-16-34-40V82z" fill="#b11226" />
        <path d="M132 96h56v8H132zm0 16h56v8H132z" fill="#f2c14e" />
        <path d="M160 118c8 0 12 8 12 16 0 6-4 10-8 14l-4 16-4-16c-4-4-8-8-8-14 0-8 4-16 12-16z" fill="#1a1a1a" />
        <text x="160" y="198" textAnchor="middle" fill="#1a1a1a" fontSize="13" fontWeight="800" fontFamily="Nunito, sans-serif">
          STUTTGART
        </text>
      </>
    ),
    opel: (
      <>
        <circle cx="160" cy="120" r="62" fill="#f4f6f8" stroke="#222" strokeWidth="6" />
        <path d="M126 146l28-62h18l-8 28h22l-46 62h-16l10-28h-8z" fill="#222" />
      </>
    ),
    ferrari: (
      <>
        <path d="M118 64h84l8 18v78l-50 24-50-24V82z" fill="#f5c400" stroke="#111" strokeWidth="4" />
        <path d="M160 96c10 2 16 10 16 18 0 8-6 12-10 16l-6 18-6-18c-4-4-10-8-10-16 0-8 6-16 16-18z" fill="#111" />
        <path d="M148 108h8l2 8h-6z" fill="#f5c400" />
        <text x="160" y="168" textAnchor="middle" fill="#111" fontSize="16" fontWeight="800" fontFamily="Nunito, sans-serif">
          SF
        </text>
      </>
    ),
    toyota: (
      <>
        <ellipse cx="160" cy="120" rx="70" ry="42" fill="none" stroke="#c8102e" strokeWidth="7" />
        <ellipse cx="138" cy="120" rx="34" ry="42" fill="none" stroke="#c8102e" strokeWidth="7" />
        <ellipse cx="182" cy="120" rx="34" ry="42" fill="none" stroke="#c8102e" strokeWidth="7" />
      </>
    ),
    ford: (
      <>
        <ellipse cx="160" cy="120" rx="86" ry="48" fill="#003478" />
        <ellipse cx="160" cy="120" rx="74" ry="38" fill="none" stroke="#fff" strokeWidth="3" />
        <text x="160" y="132" textAnchor="middle" fill="#fff" fontSize="36" fontWeight="800" fontFamily="Georgia, serif" fontStyle="italic">
          Ford
        </text>
      </>
    ),
    tesla: (
      <>
        <path d="M160 58c40 10 62 28 70 46-28 10-48 14-70 14s-42-4-70-14c8-18 30-36 70-46z" fill="#cc0000" />
        <path d="M132 118h56M160 118v52" stroke="#cc0000" strokeWidth="10" strokeLinecap="round" />
      </>
    ),
    fiat: (
      <>
        <circle cx="160" cy="120" r="62" fill="#e10600" />
        <rect x="112" y="102" width="96" height="36" rx="4" fill="#fff" />
        <text x="160" y="128" textAnchor="middle" fill="#e10600" fontSize="22" fontWeight="800" fontFamily="Nunito, sans-serif">
          FIAT
        </text>
      </>
    ),
    honda: (
      <>
        <rect x="100" y="68" width="120" height="104" rx="28" fill="none" stroke="#222" strokeWidth="8" />
        <text x="160" y="138" textAnchor="middle" fill="#222" fontSize="64" fontWeight="800" fontFamily="Nunito, sans-serif">
          H
        </text>
      </>
    ),
  }
  return (
    <Platte uid={uid} von="#2a3142" bis="#141820">
      {zeichen[id]}
    </Platte>
  )
}

function Marke({ id, uid }: { id: string; uid: string }) {
  const zeichen: Record<string, { grund: string; knoten: ReactNode }> = {
    nike: {
      grund: '#111',
      knoten: <path d="M78 150c48-8 78-28 150-62 8 22-6 40-28 52-40 22-78 28-122 10z" fill="#fff" />,
    },
    adidas: {
      grund: '#111',
      knoten: (
        <>
          <path d="M118 156l22-78 16 6-16 72z" fill="#fff" />
          <path d="M150 158l28-70 16 6-22 64z" fill="#fff" />
          <path d="M184 160l34-60 16 8-28 52z" fill="#fff" />
        </>
      ),
    },
    apple: {
      grund: '#f4f4f6',
      knoten: (
        <path
          d="M168 78c6-8 16-12 24-12-2 10-8 18-16 22-6 4-12 2-8-10zM160 96c16 0 26 10 32 10 8 0 14-6 24-6 8 0 18 6 24 16-20 12-16 40 2 52-8 16-18 28-30 28-8 0-12-6-22-6s-14 6-24 6c-14 0-26-14-34-30-12-22-8-48 8-62 8-8 16-8 20-8z"
          fill="#111"
        />
      ),
    },
    cola: {
      grund: '#e10600',
      knoten: (
        <>
          <path d="M70 132c30-28 58-28 90 0s60 28 100 0" fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" />
          <text x="160" y="118" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="800" fontFamily="Georgia, serif" fontStyle="italic">
            Cola
          </text>
        </>
      ),
    },
    mcdonalds: {
      grund: '#c8102e',
      knoten: (
        <path d="M96 168V92c0-28 22-36 28-8 6-28 28-20 28 8v76h-16v-62c0-10-6-14-12-6 6 4 8 12 8 20v48h-16v-48c0-8 2-16 8-20-6-8-12-4-12 6v62z" fill="#ffc72c" />
      ),
    },
    ikea: {
      grund: '#0058a3',
      knoten: (
        <>
          <rect x="70" y="78" width="180" height="84" fill="#ffda1a" />
          <text x="160" y="136" textAnchor="middle" fill="#0058a3" fontSize="42" fontWeight="800" fontFamily="Nunito, sans-serif">
            IKEA
          </text>
        </>
      ),
    },
    lego: {
      grund: '#e3000b',
      knoten: (
        <>
          <rect x="96" y="108" width="128" height="72" rx="6" fill="#d0000a" />
          <rect x="108" y="78" width="36" height="36" rx="8" fill="#ff2a2a" />
          <rect x="176" y="78" width="36" height="36" rx="8" fill="#ff2a2a" />
          <circle cx="126" cy="92" r="8" fill="#fff3" />
          <circle cx="194" cy="92" r="8" fill="#fff3" />
        </>
      ),
    },
    nutella: {
      grund: '#f3e2c4',
      knoten: (
        <>
          <rect x="124" y="58" width="72" height="18" rx="4" fill="#f6f1ea" />
          <path d="M118 76h84l10 110H108z" fill="#fff" />
          <rect x="116" y="108" width="88" height="46" fill="#111" />
          <rect x="116" y="108" width="88" height="14" fill="#e10600" />
          <text x="160" y="146" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="800" fontFamily="Nunito, sans-serif">
            nuss
          </text>
        </>
      ),
    },
    milka: {
      grund: '#6f4e9b',
      knoten: (
        <>
          <ellipse cx="150" cy="150" rx="48" ry="28" fill="#f4e4ff" />
          <circle cx="196" cy="132" r="22" fill="#f4e4ff" />
          <circle cx="188" cy="128" r="3" fill="#3a245c" />
          <path d="M112 146c-8-20 4-36 16-28" fill="none" stroke="#f4e4ff" strokeWidth="6" strokeLinecap="round" />
          <path d="M168 168c-6 16-2 28 8 28M150 172c-2 16 6 26 14 24" fill="none" stroke="#f4e4ff" strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="210" cy="140" rx="10" ry="6" fill="#e7c2ef" />
        </>
      ),
    },
    nivea: {
      grund: '#0033a0',
      knoten: (
        <>
          <circle cx="160" cy="120" r="68" fill="#0033a0" stroke="#fff" strokeWidth="8" />
          <text x="160" y="132" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="800" fontFamily="Nunito, sans-serif">
            NIVEA
          </text>
        </>
      ),
    },
    haribo: {
      grund: '#f6c431',
      knoten: (
        <>
          <ellipse cx="160" cy="132" rx="36" ry="42" fill="#e39b12" />
          <circle cx="128" cy="104" r="16" fill="#e39b12" />
          <circle cx="192" cy="104" r="16" fill="#e39b12" />
          <circle cx="148" cy="124" r="4" fill="#3a2408" />
          <circle cx="172" cy="124" r="4" fill="#3a2408" />
          <ellipse cx="160" cy="140" rx="8" ry="6" fill="#7a3b12" />
          <path d="M148 150c8 8 16 8 24 0" fill="none" stroke="#3a2408" strokeWidth="2" />
        </>
      ),
    },
    google: {
      grund: '#fff',
      knoten: (
        <text x="160" y="136" textAnchor="middle" fontSize="42" fontWeight="800" fontFamily="Nunito, sans-serif">
          <tspan fill="#4285f4">G</tspan>
          <tspan fill="#ea4335">o</tspan>
          <tspan fill="#fbbc05">o</tspan>
          <tspan fill="#4285f4">g</tspan>
          <tspan fill="#34a853">l</tspan>
          <tspan fill="#ea4335">e</tspan>
        </text>
      ),
    },
  }
  const bild = zeichen[id]
  if (!bild) return null
  return (
    <>
      <rect width="320" height="240" fill={bild.grund} />
      {bild.knoten}
      <Verlauf id={`${uid}-k`} von="#0000" bis="#0000" />
    </>
  )
}

function Ort({ id, uid }: { id: string; uid: string }) {
  const szenen: Record<string, ReactNode> = {
    brandenburg: (
      <Himmel uid={uid} von="#f2c9a0" bis="#6ea0d4">
        <rect x="0" y="188" width="320" height="52" fill="#c4b49a" />
        <rect x="78" y="96" width="164" height="92" fill="#e7d3b0" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={92 + i * 30} y="112" width="16" height="76" fill="#d9c29a" />
        ))}
        <path d="M70 96h180l-16-18H86z" fill="#efe2c8" />
        <path d="M148 62l12 16h-8l8 10h-16l6-10h-8z" fill="#8a6a32" />
      </Himmel>
    ),
    eiffel: (
      <Himmel uid={uid} von="#ffb26b" bis="#5c6bdc">
        <rect x="0" y="200" width="320" height="40" fill="#3c4258" />
        <path d="M160 36l46 164h-18l-8-36h-40l-8 36h-18z" fill="#5c4636" />
        <path d="M132 110h56M124 146h72" stroke="#d9c3a4" strokeWidth="4" />
        <path d="M118 164h84" stroke="#3c4258" strokeWidth="6" />
        <circle cx="230" cy="58" r="14" fill="#ffe1a8" />
      </Himmel>
    ),
    kolosseum: (
      <Himmel uid={uid} von="#f6d7a8" bis="#e7eef6">
        <ellipse cx="160" cy="168" rx="110" ry="22" fill="#c4b49a" />
        <path d="M60 150c0-62 44-100 100-100s100 38 100 100v28H60z" fill="#e6d2b0" />
        <path d="M78 150c0-48 36-78 82-78s82 30 82 78v22H78z" fill="#f3e6d0" />
        {Array.from({ length: 7 }, (_, i) => (
          <path key={i} d={`M${92 + i * 24} 150v28M${100 + i * 24} 132a8 8 0 0 1 8 0`} stroke="#b08968" strokeWidth="3" fill="none" />
        ))}
        <rect x="60" y="168" width="200" height="12" fill="#c9aa84" />
      </Himmel>
    ),
    freiheit: (
      <Himmel uid={uid} von="#8fd0e6" bis="#e8f4ea">
        <rect x="0" y="190" width="320" height="50" fill="#2f6f86" />
        <path d="M148 188l8-120h8l8 120z" fill="#3e9a62" />
        <circle cx="160" cy="64" r="14" fill="#3e9a62" />
        {[-16, -8, 0, 8, 16].map((x) => (
          <path key={x} d={`M${160 + x} 52l4-14 4 14`} stroke="#d7a441" strokeWidth="3" />
        ))}
        <path d="M168 78l28-20 4 8-24 16" fill="#d7a441" />
        <circle cx="198" cy="52" r="6" fill="#f2c14e" />
      </Himmel>
    ),
    bigben: (
      <Himmel uid={uid} von="#c5d4e4" bis="#eef2f6">
        <rect x="0" y="200" width="320" height="40" fill="#8d97a3" />
        <rect x="132" y="46" width="56" height="154" fill="#c4a574" />
        <rect x="140" y="36" width="40" height="16" fill="#b89568" />
        <path d="M148 28h24l-4-12h-16z" fill="#8d97a3" />
        <circle cx="160" cy="108" r="18" fill="#f7f1e4" stroke="#333" strokeWidth="3" />
        <path d="M160 108l6-10M160 108l8 4" stroke="#222" strokeWidth="2" />
        <rect x="146" y="150" width="28" height="40" fill="#a4845c" />
      </Himmel>
    ),
    taj: (
      <Himmel uid={uid} von="#f7c9d4" bis="#f8efe4">
        <rect x="0" y="176" width="320" height="64" fill="#d7ebe8" />
        <rect x="40" y="168" width="240" height="16" fill="#f4f1ea" />
        <rect x="70" y="140" width="180" height="30" fill="#f7f4ee" />
        <path d="M120 140V96h80v44" fill="#f7f4ee" />
        <path d="M118 96h84c0-28-20-48-42-48s-42 20-42 48z" fill="#fff" />
        <circle cx="160" cy="62" r="6" fill="#e7d7a8" />
        <rect x="86" y="108" width="14" height="62" fill="#f7f4ee" />
        <rect x="220" y="108" width="14" height="62" fill="#f7f4ee" />
        <path d="M86 108h14c0-12-7-18-7-18s-7 6-7 18zM220 108h14c0-12-7-18-7-18s-7 6-7 18z" fill="#fff" />
      </Himmel>
    ),
    pyramiden: (
      <Himmel uid={uid} von="#f6d27a" bis="#f2efe6">
        <circle cx="250" cy="58" r="22" fill="#f2a33a" />
        <rect x="0" y="176" width="320" height="64" fill="#e2c27a" />
        <path d="M70 176l50-90 50 90z" fill="#c9964a" />
        <path d="M120 176l36-64 36 64z" fill="#b8873e" />
        <path d="M40 176l28-40 22 40z" fill="#d4a85c" />
      </Himmel>
    ),
    sydney: (
      <Himmel uid={uid} von="#7ec8e3" bis="#e7f3f6">
        <rect x="0" y="168" width="320" height="72" fill="#2a6f97" />
        <path d="M70 168c20-60 48-60 60 0" fill="#f7f4ee" />
        <path d="M124 168c18-78 52-78 66 0" fill="#fff" />
        <path d="M184 168c16-48 40-48 50 0" fill="#f7f4ee" />
        <rect x="96" y="168" width="130" height="10" fill="#d9d3c7" />
      </Himmel>
    ),
    mauer: (
      <Himmel uid={uid} von="#9ec0dd" bis="#e7eef2">
        <path d="M0 180l60-50 50 30 70-60 80 40 60-24v124H0z" fill="#7d8c78" />
        <path d="M20 168c40-20 40-20 70-8 30 12 40-8 70-20 28-12 40 4 70 8 24 4 40-16 70-28" fill="none" stroke="#c4b49a" strokeWidth="10" />
        <path d="M40 150v18M90 146v18M150 132v18M210 146v18M270 132v18" stroke="#a89070" strokeWidth="4" />
      </Himmel>
    ),
    neuschwanstein: (
      <Himmel uid={uid} von="#b9d4ee" bis="#f7f4ee">
        <path d="M0 200l80-70 40 24 70-50 60 30 70-20v126H0z" fill="#6e7c6a" />
        <rect x="132" y="108" width="56" height="70" fill="#f7f4ee" />
        <path d="M132 108l28-28 28 28" fill="#d7e4ee" />
        <rect x="112" y="124" width="18" height="54" fill="#efeae2" />
        <rect x="190" y="124" width="18" height="54" fill="#efeae2" />
        <path d="M112 124l9-16 9 16M190 124l9-16 9 16" fill="#c5d5e4" />
        <rect x="154" y="140" width="12" height="20" fill="#8fb4d4" />
      </Himmel>
    ),
    dom: (
      <Himmel uid={uid} von="#b7c3d1" bis="#e6ebf1">
        <rect x="0" y="196" width="320" height="44" fill="#8d97a3" />
        <path d="M118 196V70l42-40 42 40v126" fill="#4e5966" />
        <path d="M118 110l42-28 42 28" fill="none" stroke="#2e3640" strokeWidth="3" />
        <path d="M150 196V120h20v76" fill="#3c4652" />
        <path d="M96 196l22-90V70h-8l-22 40zM224 196l-22-90V70h8l22 40z" fill="#5c6772" />
      </Himmel>
    ),
    sagrada: (
      <Himmel uid={uid} von="#f2b56b" bis="#8ec6e6">
        <rect x="0" y="196" width="320" height="44" fill="#d9c3a4" />
        {[70, 110, 150, 190, 220].map((x, i) => (
          <path key={x} d={`M${x} 196c8-70 8-90 16-${120 + (i % 2) * 20} 6 16 10 40 16 ${120 + (i % 2) * 20}`} fill={i % 2 ? '#e7d3b0' : '#f3e6d0'} />
        ))}
        <circle cx="86" cy="70" r="6" fill="#6db3e0" />
        <circle cx="166" cy="52" r="7" fill="#e07a5f" />
        <circle cx="230" cy="78" r="6" fill="#81b29a" />
      </Himmel>
    ),
  }
  return szenen[id] ?? null
}

function Natur({ id, uid }: { id: string; uid: string }) {
  const bilder: Record<string, ReactNode> = {
    loewe: (
      <Himmel uid={uid} von="#f2c14e" bis="#e7efe2">
        <ellipse cx="160" cy="200" rx="120" ry="28" fill="#c4a15a" />
        <circle cx="160" cy="118" r="46" fill="#e0a24a" />
        <circle cx="160" cy="124" r="28" fill="#f0c27a" />
        <circle cx="150" cy="120" r="4" fill="#3a2408" />
        <circle cx="172" cy="120" r="4" fill="#3a2408" />
        <path d="M154 136h12l-6 8z" fill="#c47a3a" />
        <path d="M120 100c-16-28 8-36 20-16M200 100c16-28-8-36-20-16" fill="#c9842e" />
      </Himmel>
    ),
    panda: (
      <Himmel uid={uid} von="#dfe8df" bis="#f7f4ee">
        <circle cx="160" cy="124" r="52" fill="#fff" />
        <circle cx="122" cy="86" r="16" fill="#222" />
        <circle cx="198" cy="86" r="16" fill="#222" />
        <ellipse cx="144" cy="120" rx="14" ry="16" fill="#222" />
        <ellipse cx="176" cy="120" rx="14" ry="16" fill="#222" />
        <circle cx="146" cy="118" r="4" fill="#fff" />
        <circle cx="178" cy="118" r="4" fill="#fff" />
        <ellipse cx="160" cy="140" rx="8" ry="6" fill="#222" />
      </Himmel>
    ),
    pinguin: (
      <Himmel uid={uid} von="#d7e8f5" bis="#f7fbff">
        <ellipse cx="160" cy="210" rx="70" ry="16" fill="#c5d5e4" />
        <ellipse cx="160" cy="132" rx="36" ry="52" fill="#222" />
        <ellipse cx="160" cy="142" rx="22" ry="36" fill="#fff" />
        <circle cx="150" cy="104" r="3" fill="#222" />
        <circle cx="170" cy="104" r="3" fill="#222" />
        <path d="M156 114h8l-4 6z" fill="#f2a33a" />
        <path d="M124 140l-20 16 22 4M196 140l20 16-22 4" fill="#222" />
      </Himmel>
    ),
    elefant: (
      <Himmel uid={uid} von="#e7eef2" bis="#d5e2c8">
        <ellipse cx="168" cy="140" rx="58" ry="42" fill="#9aa7b2" />
        <circle cx="214" cy="120" r="28" fill="#aeb8c2" />
        <ellipse cx="236" cy="108" rx="16" ry="10" fill="#9aa7b2" />
        <path d="M206 132c8 28 4 48-8 58" fill="none" stroke="#8d9aa6" strokeWidth="10" strokeLinecap="round" />
        <path d="M150 112c-8-24 10-30 16-8M196 100c6-22 22-16 16 6" fill="#9aa7b2" />
        <circle cx="224" cy="116" r="3" fill="#222" />
      </Himmel>
    ),
    giraffe: (
      <Himmel uid={uid} von="#f6e7b2" bis="#cfe3c4">
        <rect x="0" y="190" width="320" height="50" fill="#d2b48a" />
        <path d="M150 190V78h16v112" fill="#e2b15a" />
        <circle cx="158" cy="64" r="18" fill="#e2b15a" />
        <circle cx="150" cy="60" r="3" fill="#5c3b16" />
        <path d="M148 70h8l-2 8h-4z" fill="#5c3b16" />
        <path d="M146 48l4-12M166 50l6-12" stroke="#5c3b16" strokeWidth="3" />
        <circle cx="156" cy="110" r="5" fill="#c4842a" />
        <circle cx="154" cy="150" r="6" fill="#c4842a" />
      </Himmel>
    ),
    fuchs: (
      <Himmel uid={uid} von="#f2d2b2" bis="#efe6da">
        <path d="M118 150l42-70 42 70-42 22z" fill="#e07a3d" />
        <path d="M138 150l22-36 22 36-22 12z" fill="#f7f4ee" />
        <path d="M112 96l20 20-8 8zM208 96l-20 20 8 8z" fill="#e07a3d" />
        <circle cx="148" cy="128" r="3" fill="#222" />
        <circle cx="172" cy="128" r="3" fill="#222" />
        <path d="M156 140h8l-4 6z" fill="#222" />
      </Himmel>
    ),
    eule: (
      <Himmel uid={uid} von="#1d2a44" bis="#41556e">
        <circle cx="70" cy="48" r="10" fill="#f2e7c2" opacity="0.8" />
        <ellipse cx="160" cy="132" rx="48" ry="58" fill="#8d6b43" />
        <circle cx="144" cy="120" r="16" fill="#f3e6c8" />
        <circle cx="176" cy="120" r="16" fill="#f3e6c8" />
        <circle cx="144" cy="120" r="6" fill="#222" />
        <circle cx="176" cy="120" r="6" fill="#222" />
        <path d="M154 136h12l-6 10z" fill="#e0a24a" />
        <path d="M120 100l-16-28 28 16M200 100l16-28-28 16" fill="#6e5232" />
      </Himmel>
    ),
    delfin: (
      <Himmel uid={uid} von="#7ec8e3" bis="#e7f6fb">
        <path d="M0 150c40 20 80 20 320 0v90H0z" fill="#2a6f97" />
        <path d="M70 140c40-10 70-40 110-28 20 6 30 6 48-8-30 28-60 24-90 28-28 4-48 16-68 8z" fill="#9fd7ea" />
        <path d="M150 112l10-28 8 24" fill="#7ec0dc" />
        <circle cx="196" cy="112" r="3" fill="#1c3d55" />
      </Himmel>
    ),
    rose: (
      <Himmel uid={uid} von="#f8e1ea" bis="#f7f4ee">
        <path d="M160 150v62" stroke="#3e8f4e" strokeWidth="6" />
        <path d="M160 180l-18 10M160 196l16 8" stroke="#3e8f4e" strokeWidth="3" />
        <circle cx="160" cy="112" r="18" fill="#c4234a" />
        <circle cx="142" cy="124" r="16" fill="#e0456b" />
        <circle cx="178" cy="124" r="16" fill="#e0456b" />
        <circle cx="150" cy="100" r="14" fill="#d43358" />
        <circle cx="172" cy="98" r="14" fill="#d43358" />
      </Himmel>
    ),
    sonnenblume: (
      <Himmel uid={uid} von="#cfe7f6" bis="#f7f4ee">
        <path d="M160 150v70" stroke="#3e8f4e" strokeWidth="6" />
        {Array.from({ length: 12 }, (_, i) => {
          const winkel = (i / 12) * Math.PI * 2
          const x = 160 + Math.cos(winkel) * 36
          const y = 112 + Math.sin(winkel) * 36
          return <ellipse key={i} cx={x} cy={y} rx="10" ry="18" fill="#f2c14e" transform={`rotate(${(i * 30)} ${x} ${y})`} />
        })}
        <circle cx="160" cy="112" r="20" fill="#6b3f1d" />
      </Himmel>
    ),
    kaktus: (
      <Himmel uid={uid} von="#f6d7a2" bis="#f2efe6">
        <rect x="0" y="190" width="320" height="50" fill="#e2c27a" />
        <path d="M148 190V90c0-20 24-20 24 0v100" fill="#3e9a62" />
        <path d="M148 130h-28v-28c0-14 16-14 16 4v24zM172 146h28v-24c0-14-16-14-16 4z" fill="#3e9a62" />
        <path d="M156 100v6M168 118v6M140 112v6" stroke="#1f6b40" strokeWidth="2" />
      </Himmel>
    ),
    eiche: (
      <Himmel uid={uid} von="#cfe3f2" bis="#e7f0df">
        <rect x="150" y="150" width="20" height="70" fill="#8a5a32" />
        <circle cx="140" cy="120" r="36" fill="#3e8f4e" />
        <circle cx="180" cy="116" r="34" fill="#2f7a40" />
        <circle cx="160" cy="96" r="30" fill="#4ea35e" />
        <ellipse cx="122" cy="168" rx="8" ry="10" fill="#c4a15a" />
        <ellipse cx="196" cy="160" rx="8" ry="10" fill="#c4a15a" />
      </Himmel>
    ),
  }
  return bilder[id] ?? null
}

function zeilenVon(titel: string): string[] {
  if (titel.length <= 16) return [titel]
  const teile = titel.split(' ')
  let a = ''
  const rest: string[] = []
  for (const wort of teile) {
    if (!a || `${a} ${wort}`.length <= 16) a = a ? `${a} ${wort}` : wort
    else rest.push(wort)
  }
  const b = rest.join(' ')
  return b ? [a, b] : [titel]
}

function Cover({ id, uid, titel }: { id: string; uid: string; titel: string }) {
  const stil: Record<string, { von: string; bis: string; form: ReactNode }> = {
    berlin: {
      von: '#1c1c1c',
      bis: '#3a0d16',
      form: (
        <>
          <rect x="70" y="36" width="8" height="168" fill="#e10600" />
          <rect x="242" y="36" width="8" height="168" fill="#e10600" />
          <circle cx="160" cy="92" r="26" fill="none" stroke="#f2c14e" strokeWidth="4" />
        </>
      ),
    },
    anthrazit: {
      von: '#2a2e33',
      bis: '#0e1012',
      form: (
        <>
          <path d="M40 180l70-90 40 50 50-70 80 110z" fill="#4a515a" />
          <path d="M40 200l90-70 50 40 100-80v80z" fill="#1c2126" />
        </>
      ),
    },
    hollywood: {
      von: '#140b24',
      bis: '#3a1460',
      form: (
        <>
          <rect x="96" y="48" width="128" height="78" rx="4" fill="#f2c14e" />
          <path d="M64 126h192l-20 16H84z" fill="#d7a441" />
          <circle cx="70" cy="70" r="3" fill="#fff" />
          <circle cx="250" cy="84" r="2" fill="#fff" />
          <circle cx="40" cy="100" r="2" fill="#fff" />
        </>
      ),
    },
    ich: {
      von: '#111',
      bis: '#111',
      form: <circle cx="160" cy="96" r="34" fill="none" stroke="#fff" strokeWidth="6" />,
    },
    bordstein: {
      von: '#1a1a1a',
      bis: '#2c2416',
      form: (
        <>
          <path d="M0 150h320" stroke="#f2c14e" strokeWidth="8" />
          <path d="M40 150l40-70 30 40 20-28 36 58" fill="none" stroke="#cfc6b8" strokeWidth="4" />
        </>
      ),
    },
    raop: {
      von: '#101820',
      bis: '#101820',
      form: (
        <>
          <circle cx="160" cy="96" r="40" fill="#f2f2f2" />
          <circle cx="146" cy="88" r="5" fill="#111" />
          <circle cx="174" cy="88" r="5" fill="#111" />
          <path d="M148 108c8 8 16 8 24 0" fill="none" stroke="#111" strokeWidth="3" />
          <rect x="118" y="70" width="84" height="10" fill="#111" />
        </>
      ),
    },
    triebwerke: {
      von: '#0d1b2a',
      bis: '#1b3a4b',
      form: (
        <>
          <path d="M150 120l10-70 10 70-28 10z" fill="#e0e7ef" />
          <path d="M120 130c20-20 60-20 80 0" fill="none" stroke="#f25c54" strokeWidth="6" />
          <circle cx="60" cy="50" r="2" fill="#fff" />
          <circle cx="250" cy="70" r="2" fill="#fff" />
        </>
      ),
    },
    hinterland: {
      von: '#1e3a34',
      bis: '#0e1c18',
      form: (
        <>
          <path d="M0 150l50-40 40 24 60-50 50 30 70-36 50 28v40z" fill="#163028" />
          <circle cx="236" cy="64" r="16" fill="#f2e7c2" />
        </>
      ),
    },
    hurra: {
      von: '#2b0a3a',
      bis: '#6b1d3a',
      form: (
        <>
          <circle cx="110" cy="80" r="18" fill="#f2c14e" />
          <circle cx="210" cy="70" r="10" fill="#7ec8e3" />
          <path d="M70 140c30-20 50-20 80 0s50 20 100 0" fill="none" stroke="#fff" strokeWidth="4" />
        </>
      ),
    },
    roulette: {
      von: '#3a0d12',
      bis: '#140608',
      form: (
        <>
          <circle cx="160" cy="96" r="42" fill="#111" stroke="#d4af37" strokeWidth="6" />
          <circle cx="160" cy="96" r="8" fill="#d4af37" />
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x="156" y="58" width="8" height="16" fill={i % 2 ? '#e10600' : '#f4f1ea'} transform={`rotate(${i * 45} 160 96)`} />
          ))}
        </>
      ),
    },
    treppenhaus: {
      von: '#242018',
      bis: '#10100e',
      form: (
        <>
          <path d="M70 160h36v-24h36v-24h36v-24h36" fill="none" stroke="#f2e7c2" strokeWidth="8" />
          <rect x="150" y="48" width="20" height="112" fill="#3a342c" />
        </>
      ),
    },
    erde: {
      von: '#3a2a18',
      bis: '#1a120c',
      form: (
        <>
          <circle cx="160" cy="92" r="36" fill="#6b4a2a" />
          <path d="M140 80c10 8 8 20-4 26 16 2 28-6 32-18 2 16-10 30-28 32 8-6 10-18 0-40z" fill="#8d6b43" />
          <path d="M120 160h80" stroke="#e7d3b0" strokeWidth="6" />
        </>
      ),
    },
  }
  const bild = stil[id]
  const zeilen = zeilenVon(titel)
  return (
    <>
      <Verlauf id={`${uid}-c`} von={bild?.von ?? '#222'} bis={bild?.bis ?? '#111'} />
      <rect width="320" height="240" fill={`url(#${uid}-c)`} />
      {bild?.form}
      <rect x="0" y="168" width="320" height="72" fill="#000" opacity="0.45" />
      {zeilen.map((zeile, index) => (
        <text
          key={zeile}
          x="160"
          y={198 + index * 20 - (zeilen.length - 1) * 10}
          textAnchor="middle"
          fill="#fff"
          fontSize={zeile.length > 18 ? 15 : 20}
          fontWeight="800"
          fontFamily="Nunito, sans-serif"
        >
          {zeile}
        </text>
      ))}
    </>
  )
}
