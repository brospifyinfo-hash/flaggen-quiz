// Plakate für das Spieleblatt. Jedes Bild ist für die kleine Karte gebaut:
// ein klares Motiv, Licht, Schatten – und nichts, was der Titel darunter verdeckt.
import { useId, type ReactNode } from 'react'

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

export function SpielPlakat({ art }: { art: PlakatArt }) {
  const uid = useId().replace(/:/g, '')
  return (
      <svg className="spiel-plakat" viewBox="0 0 360 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <filter id={`${uid}-s`} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="8" stdDeviation="5" floodColor="#061018" floodOpacity="0.38" />
        </filter>
        <radialGradient id={`${uid}-licht`} cx="50%" cy="18%" r="75%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {art === 'was' && <Was uid={uid} />}
      {art === 'online' && <Online uid={uid} />}
      {art === 'higher' && <Higher uid={uid} />}
      {art === 'geschichte' && <Geschichte uid={uid} />}
      {art === 'karte' && <Karte uid={uid} />}
      {art === 'gemischt' && <Gemischt uid={uid} />}
      {art === 'mathe' && <Mathe uid={uid} />}
      {art === 'personen' && <Personen uid={uid} />}
      {art === 'zufall' && <Zufall uid={uid} />}
      {art === 'autos' && <Autos uid={uid} />}
      {art === 'marken' && <Marken uid={uid} />}
      {art === 'orte' && <Orte uid={uid} />}
      {art === 'natur' && <Natur uid={uid} />}
      {art === 'rap' && <Rap uid={uid} />}
      <rect width="360" height="200" fill={`url(#${uid}-licht)`} />
    </svg>
  )
}

function Verlauf({ id, von, bis, x = false }: { id: string; von: string; bis: string; x?: boolean }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x ? '1' : '0'} y2={x ? '0' : '1'}>
      <stop offset="0" stopColor={von} />
      <stop offset="1" stopColor={bis} />
    </linearGradient>
  )
}

function Was({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={`${uid}-h`} von="#31407a" bis="#14182e" />
      <rect width="360" height="200" fill={`url(#${uid}-h)`} />
      <ellipse cx="180" cy="176" rx="140" ry="16" fill="#000" opacity="0.28" />
      <g filter={`url(#${uid}-s)`}>
        <g transform="translate(46 58) rotate(-8)">
          <rect x="7" y="-8" width="5" height="108" rx="2" fill="#d7b56a" />
          <rect width="92" height="58" rx="3" fill="#111" />
          <rect width="92" height="19" fill="#111" />
          <rect y="19" width="92" height="20" fill="#de1d26" />
          <rect y="39" width="92" height="19" fill="#ffce00" />
          <path d="M0 0h14c10 10 10 38 0 58z" fill="#fff" opacity="0.16" />
        </g>
        <g>
          <circle cx="214" cy="96" r="48" fill="#d7ecff" opacity="0.55" />
          <circle cx="214" cy="96" r="44" fill="#f7fbff" opacity="0.28" />
          <circle cx="214" cy="96" r="48" fill="none" stroke="#f0d48a" strokeWidth="7" />
          <path d="M196 78c18-16 36-8 40 8" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
          <path d="M248 132l34 36" stroke="#e2c27a" strokeWidth="12" strokeLinecap="round" />
          <path d="M214 78v28M214 106l16 12M214 106l-16 12" stroke="#1c2438" strokeWidth="3" fill="none" />
        </g>
        <g transform="translate(286 108)">
          <circle cy="8" r="16" fill="#f2c14e" />
          <circle r="10" fill="#6b3f1d" />
          <path d="M0 24v28" stroke="#2f7a40" strokeWidth="4" />
        </g>
      </g>
    </>
  )
}

function Online({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={`${uid}-h`} von="#24386a" bis="#101628" />
      <rect width="360" height="200" fill={`url(#${uid}-h)`} />
      <circle cx="70" cy="36" r="28" fill="#fff" opacity="0.06" />
      <circle cx="300" cy="24" r="18" fill="#fff" opacity="0.07" />
      <circle cx="40" cy="150" r="22" fill="#f2c14e" opacity="0.08" />
      <g filter={`url(#${uid}-s)`}>
        <g transform="translate(78 104) rotate(-8)">
          <Spieler haut="#f3c7a4" haar="#2a2118" kleid="#3d6dff" />
        </g>
        <g transform="translate(282 104) rotate(8)">
          <Spieler haut="#e0b08a" haar="#1a120c" kleid="#f0b429" />
        </g>
        <g transform="translate(180 96)">
          <path d="M0-34l30 16v28c0 22-30 36-30 36s-30-14-30-36V-18z" fill="#f4e2a8" />
          <path d="M0-26l22 12v20c0 16-22 26-22 26s-22-10-22-26v-20z" fill="#1a1e33" />
          <text y="8" textAnchor="middle" fill="#f4e2a8" fontSize="18" fontWeight="800" fontFamily="Nunito, sans-serif">
            VS
          </text>
        </g>
      </g>
    </>
  )
}

function Spieler({ haut, haar, kleid }: { haut: string; haar: string; kleid: string }) {
  return (
    <g>
      <path d="M-34 8c4-26 20-36 34-36s30 10 34 36v28H-34z" fill={kleid} />
      <circle cy="-18" r="22" fill={haut} />
      <path d="M-18-30c2-14 34-16 38 2-8 6-14 4-20-2-6 6-12 8-18 0z" fill={haar} />
      <circle cx="-8" cy="-18" r="2.2" fill="#24180f" />
      <circle cx="8" cy="-18" r="2.2" fill="#24180f" />
      <path d="M-6-10c4 5 10 5 14 0" fill="none" stroke="#24180f" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  )
}

function Higher({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={`${uid}-h`} von="#0e3c44" bis="#071820" />
      <rect width="360" height="200" fill={`url(#${uid}-h)`} />
      <g filter={`url(#${uid}-s)`}>
        <g transform="translate(58 36)">
          <rect width="96" height="128" rx="16" fill="#f7f4ee" />
          <rect x="28" y="78" width="40" height="32" rx="8" fill="#1fa855" />
          <text x="48" y="58" textAnchor="middle" fill="#0e3c44" fontSize="22" fontWeight="800" fontFamily="Nunito, sans-serif">
            12
          </text>
        </g>
        <g transform="translate(206 28)">
          <rect width="96" height="144" rx="16" fill="#f7f4ee" />
          <rect x="28" y="46" width="40" height="78" rx="8" fill="#2f6fd6" />
          <text x="48" y="36" textAnchor="middle" fill="#0e3c44" fontSize="22" fontWeight="800" fontFamily="Nunito, sans-serif">
            80
          </text>
        </g>
      </g>
      <path d="M168 78l14-18 14 18" fill="none" stroke="#f2c14e" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M182 64v36" stroke="#f2c14e" strokeWidth="6" strokeLinecap="round" />
    </>
  )
}

function Geschichte({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={`${uid}-h`} von="#6a4630" bis="#24160e" />
      <rect width="360" height="200" fill={`url(#${uid}-h)`} />
      <ellipse cx="180" cy="168" rx="120" ry="14" fill="#000" opacity="0.25" />
      <g filter={`url(#${uid}-s)`}>
        <path d="M54 46h252c6 0 10 8 6 14H60c-8-2-12-8-6-14z" fill="#e7d3a8" />
        <rect x="48" y="56" width="264" height="96" rx="4" fill="#f6e7c4" />
        <path d="M54 152h252c6 0 10 10 4 16H58c-8-4-10-10-4-16z" fill="#e7d3a8" />
        <path d="M78 104h204" stroke="#c4a574" strokeWidth="3" />
        <circle cx="118" cy="104" r="7" fill="#8a3030" />
        <circle cx="180" cy="104" r="7" fill="#8a3030" />
        <circle cx="246" cy="104" r="7" fill="#8a3030" />
        <text x="118" y="88" textAnchor="middle" fill="#5c3b16" fontSize="13" fontWeight="800" fontFamily="Nunito, sans-serif">
          800
        </text>
        <text x="180" y="128" textAnchor="middle" fill="#5c3b16" fontSize="13" fontWeight="800" fontFamily="Nunito, sans-serif">
          1492
        </text>
        <text x="246" y="88" textAnchor="middle" fill="#5c3b16" fontSize="13" fontWeight="800" fontFamily="Nunito, sans-serif">
          1969
        </text>
        <circle cx="286" cy="128" r="16" fill="#9c2b2b" />
        <circle cx="286" cy="128" r="8" fill="#f2c14e" opacity="0.85" />
      </g>
    </>
  )
}

function Karte({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={`${uid}-h`} von="#0c4a62" bis="#071820" />
      <rect width="360" height="200" fill={`url(#${uid}-h)`} />
      <circle cx="70" cy="30" r="40" fill="#fff" opacity="0.04" />
      <g filter={`url(#${uid}-s)`}>
        <circle cx="176" cy="98" r="72" fill="#1d78a8" />
        <clipPath id={`${uid}-erde`}>
          <circle cx="176" cy="98" r="72" />
        </clipPath>
        <g clipPath={`url(#${uid}-erde)`}>
          <path d="M118 58c16 6 22 24 12 38-6 8 0 18 10 24 8 14-6 26-22 22-12 8-28 2-32-12-8-2-8-18 2-26 4-14 10-28 18-36 4-6 8-12 12-10z" fill="#e4efd4" />
          <path d="M168 64c22-6 40 8 36 24 10 4 14 16 6 24-4 16 0 28-16 30-18 4-26-10-20-24 0-12-10-16-8-28 2-8 4-16 2-26z" fill="#f3f7ea" />
          <path d="M150 118c10 2 16 12 10 20-8 4-18-2-16-12 0-4 2-8 6-8z" fill="#d7e6c4" />
          <path d="M120 40h90" stroke="#fff" strokeOpacity="0.15" />
          <path d="M110 98h130" stroke="#fff" strokeOpacity="0.15" />
          <path d="M124 150h80" stroke="#fff" strokeOpacity="0.12" />
        </g>
        <circle cx="176" cy="98" r="72" fill="none" stroke="#f0d48a" strokeWidth="3" />
        <ellipse cx="150" cy="70" rx="28" ry="12" fill="#fff" opacity="0.2" />
        <g transform="translate(214 78)">
          <path d="M0 0c10 0 16 10 16 18 0 14-16 28-16 28S-16 32-16 18C-16 10-10 0 0 0z" fill="#e0456b" />
          <circle r="6" cy="16" fill="#fff" />
        </g>
      </g>
    </>
  )
}

function KarteBlatt({ dreh, farbe, children }: { dreh: number; farbe: string; children: ReactNode }) {
  return (
    <g transform={`rotate(${dreh} 180 108)`}>
      <rect x="138" y="48" width="84" height="112" rx="12" fill={farbe} />
      {children}
    </g>
  )
}

function Gemischt({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={`${uid}-h`} von="#2a2152" bis="#141022" />
      <rect width="360" height="200" fill={`url(#${uid}-h)`} />
      <g filter={`url(#${uid}-s)`}>
        <KarteBlatt dreh={-16} farbe="#f7f4ee">
          <rect x="148" y="62" width="64" height="16" fill="#111" />
          <rect x="148" y="78" width="64" height="16" fill="#de1d26" />
          <rect x="148" y="94" width="64" height="16" fill="#ffce00" />
        </KarteBlatt>
        <KarteBlatt dreh={-5} farbe="#12324a">
          <circle cx="180" cy="104" r="22" fill="#7eb6ff" />
          <path d="M168 104h24M180 92v24" stroke="#12324a" strokeWidth="3" />
        </KarteBlatt>
        <KarteBlatt dreh={7} farbe="#f6e7c4">
          <path d="M156 120h48" stroke="#8a5a32" strokeWidth="3" />
          <circle cx="168" cy="120" r="4" fill="#8a3030" />
          <circle cx="192" cy="120" r="4" fill="#8a3030" />
          <text x="180" y="100" textAnchor="middle" fill="#5c3b16" fontSize="16" fontWeight="800" fontFamily="Nunito, sans-serif">
            1492
          </text>
        </KarteBlatt>
        <KarteBlatt dreh={16} farbe="#10241c">
          <text x="180" y="112" textAnchor="middle" fill="#b6f2c8" fontSize="28" fontWeight="800" fontFamily="Nunito, sans-serif">
            7×8
          </text>
        </KarteBlatt>
      </g>
    </>
  )
}

function Mathe({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={`${uid}-h`} von="#12352c" bis="#071610" />
      <rect width="360" height="200" fill={`url(#${uid}-h)`} />
      <g opacity="0.35" stroke="#3ecf8e" strokeWidth="2">
        <path d="M20 150h80M20 164h60M250 48h70" />
      </g>
      <g filter={`url(#${uid}-s)`} transform="translate(40 46)">
        <rect width="200" height="108" rx="18" fill="#071610" stroke="#3ecf8e" strokeWidth="3" />
        <text x="100" y="70" textAnchor="middle" fill="#f2c14e" fontSize="40" fontWeight="800" fontFamily="Nunito, sans-serif">
          7 × 8
        </text>
      </g>
      <g transform="translate(268 58)">
        <rect width="18" height="18" fill="#111" />
        <rect x="18" width="18" height="18" fill="#f7f4ee" />
        <rect y="18" width="18" height="18" fill="#f7f4ee" />
        <rect x="18" y="18" width="18" height="18" fill="#111" />
        <rect y="36" width="18" height="18" fill="#111" />
        <rect x="18" y="36" width="18" height="18" fill="#f7f4ee" />
        <path d="M36 0v54" stroke="#c9a36a" strokeWidth="3" />
      </g>
    </>
  )
}

function RahmenKopf({
  x,
  y,
  haut,
  haar,
  kleid,
  scale = 1,
}: {
  x: number
  y: number
  haut: string
  haar: string
  kleid: string
  scale?: number
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle r="40" fill="#1a120c" />
      <circle r="34" fill="#2a211c" />
      <path d="M-26 8c2-16 14-24 26-24s24 8 26 24v16h-52z" fill={kleid} />
      <circle cy="-8" r="16" fill={haut} />
      <path d="M-14-18c2-10 26-12 30 0-6 4-12 2-16-2-4 4-10 6-14 2z" fill={haar} />
      <circle cx="-5" cy="-8" r="1.5" fill="#24180f" />
      <circle cx="6" cy="-8" r="1.5" fill="#24180f" />
      <circle r="40" fill="none" stroke="#f0d48a" strokeWidth="3" />
    </g>
  )
}

function Personen({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={`${uid}-h`} von="#5a3d46" bis="#241820" />
      <rect width="360" height="200" fill={`url(#${uid}-h)`} />
      <ellipse cx="180" cy="40" rx="90" ry="40" fill="#f2c9a4" opacity="0.12" />
      <g filter={`url(#${uid}-s)`}>
        <RahmenKopf x={108} y={108} haut="#f2c9a4" haar="#2a2118" kleid="#6d4a3a" scale={0.92} />
        <RahmenKopf x={252} y={108} haut="#c48a6a" haar="#1a120c" kleid="#243056" scale={0.92} />
        <RahmenKopf x={180} y={96} haut="#e7b898" haar="#5c3b16" kleid="#8a3030" />
      </g>
    </>
  )
}

function Wuerfel({ x, y, farbe, augen }: { x: number; y: number; farbe: string; augen: number }) {
  const punkte = [
    [[0, 0]],
    [[-14, -14], [14, 14]],
    [[-14, -14], [0, 0], [14, 14]],
    [[-14, -14], [14, -14], [-14, 14], [14, 14]],
    [[-14, -14], [14, -14], [0, 0], [-14, 14], [14, 14]],
    [[-14, -16], [-14, 0], [-14, 16], [14, -16], [14, 0], [14, 16]],
  ][augen - 1]
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="5" y="8" width="76" height="76" rx="18" fill="#000" opacity="0.28" />
      <rect width="76" height="76" rx="18" fill={farbe} />
      <path d="M16 8h28c8 0 12 6 8 12H22c-6-2-10-8-6-12z" fill="#fff" opacity="0.28" />
      {punkte.map(([px, py], index) => (
        <circle key={index} cx={38 + px} cy={38 + py} r="6.5" fill="#24180f" />
      ))}
    </g>
  )
}

function Zufall({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={`${uid}-h`} von="#4a2158" bis="#1a1024" />
      <rect width="360" height="200" fill={`url(#${uid}-h)`} />
      <ellipse cx="180" cy="168" rx="130" ry="18" fill="#000" opacity="0.28" />
      <g filter={`url(#${uid}-s)`}>
        <Wuerfel x={28} y={62} farbe="#f7f4ee" augen={2} />
        <Wuerfel x={142} y={46} farbe="#f2c14e" augen={5} />
        <Wuerfel x={252} y={66} farbe="#f7f4ee" augen={6} />
      </g>
    </>
  )
}

function Autos({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={`${uid}-h`} von="#3a414c" bis="#15181e" x />
      <rect width="360" height="200" fill={`url(#${uid}-h)`} />
      <path d="M0 150h360" stroke="#fff" strokeOpacity="0.06" />
      <g filter={`url(#${uid}-s)`}>
        <g transform="translate(70 100)">
          <circle r="42" fill="#f4f1ea" stroke="#111" strokeWidth="4" />
          <circle r="32" fill="none" stroke="#111" strokeWidth="2" />
          <path d="M0-26v22M0-4l22 14M0-4l-22 14" stroke="#111" strokeWidth="2.4" fill="none" />
        </g>
        <g transform="translate(180 100)">
          <circle r="42" fill="#111" />
          <path d="M0-36a36 36 0 0 1 36 36H0z" fill="#1c4f9c" />
          <path d="M0 36a36 36 0 0 1-36-36H0z" fill="#1c4f9c" />
          <path d="M-36 0a36 36 0 0 1 36-36V0z" fill="#f7f4ee" />
          <path d="M36 0a36 36 0 0 1-36 36V0z" fill="#f7f4ee" />
          <circle r="42" fill="none" stroke="#111" strokeWidth="6" />
        </g>
        <g transform="translate(290 100)">
          <path d="M-28-36h56l6 14v48l-34 16-34-16v-48z" fill="#f5c400" stroke="#111" strokeWidth="3" />
          <path d="M0-8c8 0 12 8 12 14 0 6-4 8-8 12l-4 10-4-10c-4-4-8-6-8-12 0-6 4-14 12-14z" fill="#111" />
        </g>
      </g>
    </>
  )
}

function Marken({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={`${uid}-h`} von="#f7f1e8" bis="#e7dfd2" />
      <rect width="360" height="200" fill={`url(#${uid}-h)`} />
      <g filter={`url(#${uid}-s)`}>
        <circle cx="78" cy="100" r="48" fill="#111" />
        <path d="M48 112c28-6 46-20 78-40 4 14-4 24-16 32-22 12-42 16-62 8z" fill="#fff" />
        <circle cx="180" cy="100" r="48" fill="#111" />
        <path
          d="M180 78c8 0 14 6 18 6 4 0 8-4 14-4 6 0 12 4 14 10-12 8-8 22 2 30-6 10-12 16-18 16-4 0-6-4-12-4s-8 4-14 4c-8 0-16-8-20-18-6-12-4-26 6-34 4-4 8-6 10-6z"
          fill="#fff"
        />
        <path d="M186 70c4-6 10-8 14-6-2 6-6 10-10 12-2 2-6 0-4-6z" fill="#fff" />
        <circle cx="282" cy="100" r="48" fill="#c8102e" />
        <path d="M258 124V86c0-16 12-20 16-4 4-16 16-12 16 4v38h-8v-28c0-6-4-8-8-2 4 2 6 8 6 12v18h-8v-18c0-4 2-10 6-12-4-6-8-4-8 2v28z" fill="#ffc72c" />
      </g>
    </>
  )
}

function Orte({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={`${uid}-h`} von="#f2a65a" bis="#6a3a6a" />
      <rect width="360" height="200" fill={`url(#${uid}-h)`} />
      <circle cx="300" cy="42" r="16" fill="#ffe1a8" />
      <path d="M0 132h360v68H0z" fill="#1c3a4e" />
      <g fill="#2a160e">
        <path d="M36 132l22-70 22 70z" />
        <path d="M48 86h20M44 100h28M40 114h36" stroke="#f2c9a0" strokeWidth="2" />
        <rect x="108" y="52" width="22" height="80" />
        <circle cx="119" cy="78" r="7" fill="#f6e7c4" />
        <path d="M104 52h30l-4-10h-22z" />
        <path d="M168 132V86h36v46" />
        <path d="M166 86h40c0-22-10-34-20-34s-20 12-20 34z" />
        <rect x="248" y="70" width="10" height="62" />
        <circle cx="253" cy="58" r="8" />
        <path d="M253 50l16-16 3 4-14 14" />
      </g>
      <path d="M0 150c40-10 80 8 120-4s80 6 120-8 80 4 120 6v56H0z" fill="#143246" opacity="0.45" />
      <path d="M0 132h360" stroke="#ffe1a8" strokeOpacity="0.45" />
    </>
  )
}

function Natur({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={`${uid}-h`} von="#e7f0df" bis="#8fb573" />
      <rect width="360" height="200" fill={`url(#${uid}-h)`} />
      <circle cx="250" cy="36" r="18" fill="#ffe1a8" />
      <ellipse cx="180" cy="176" rx="150" ry="22" fill="#2f6a3a" opacity="0.35" />
      <g filter={`url(#${uid}-s)`}>
        <g transform="translate(118 108)">
          {Array.from({ length: 10 }, (_, i) => (
            <ellipse key={i} cx="0" cy="-6" rx="8" ry="16" fill="#f2c14e" transform={`rotate(${i * 36}) translate(0 -22)`} />
          ))}
          <circle r="14" fill="#6b3f1d" />
          <path d="M0 16v36" stroke="#2f7a40" strokeWidth="5" />
        </g>
        <g transform="translate(230 96)">
          <circle r="36" fill="#e0a24a" />
          <circle r="20" fill="#f0c27a" />
          <path d="M-28-8c-10-18 6-24 14-8M28-8c10-18-6-24-14-8" fill="#c9842e" />
          <circle cx="-7" cy="-2" r="2.4" fill="#3a2408" />
          <circle cx="8" cy="-2" r="2.4" fill="#3a2408" />
          <path d="M-4 10h8l-4 5z" fill="#c47a3a" />
        </g>
        <g transform="translate(70 120)">
          <path d="M0 20c-16-4-18-24-4-28 2-12 20-14 24-2 12-2 18 12 8 22-2 8-16 12-28 8z" fill="#3e9a62" />
          <path d="M8 8c6 10 4 22-2 28" fill="none" stroke="#e0456b" strokeWidth="4" />
          <circle cx="4" cy="4" r="6" fill="#e0456b" />
        </g>
      </g>
    </>
  )
}

function Rap({ uid }: { uid: string }) {
  return (
    <>
      <Verlauf id={`${uid}-h`} von="#2a1218" bis="#10080c" />
      <rect width="360" height="200" fill={`url(#${uid}-h)`} />
      <g filter={`url(#${uid}-s)`}>
        <rect x="118" y="28" width="150" height="150" rx="8" fill="#8a1e2b" />
        <path d="M138 48h110" stroke="#f2c14e" strokeWidth="6" />
        <circle cx="168" cy="96" r="18" fill="none" stroke="#f7f4ee" strokeWidth="3" />
        <path d="M150 130h90" stroke="#f7f4ee" strokeOpacity="0.7" strokeWidth="3" />
        <path d="M150 144h64" stroke="#f7f4ee" strokeOpacity="0.45" strokeWidth="3" />
        <g transform="translate(132 108)">
          <circle r="58" fill="#111" />
          <circle r="50" fill="none" stroke="#2a2a2a" strokeWidth="8" />
          <circle r="34" fill="none" stroke="#222" strokeWidth="6" />
          <circle r="16" fill="#f2c14e" />
          <circle r="4" fill="#1a120c" />
          <path d="M-4-40a58 58 0 0 1 28-16" stroke="#fff" strokeOpacity="0.25" strokeWidth="6" fill="none" />
        </g>
      </g>
    </>
  )
}
