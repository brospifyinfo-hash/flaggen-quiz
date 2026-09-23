// Die fünf größten Städte auf einem Podest. Der Pokal ist das einzige Zeichen.
import { useEffect, useId, useState } from 'react'
import type { RanglisteEintrag } from '../admin'
import { IconBack } from '../components/Icons'
import { ladeRangliste } from '../konto'
import { RANKS, rankById } from '../progression'
import { goBack } from '../router'

const zahl = (n: number) => n.toLocaleString('de-DE')

const FARBEN: Record<number, [string, string, string]> = {
  1: ['#fff4c8', '#f0b429', '#8a5a08'],
  2: ['#ffffff', '#b7c4d6', '#5c6b80'],
  3: ['#ffe0c2', '#e08a45', '#7a3e16'],
  4: ['#e4e9ff', '#8b93d6', '#3d4578'],
  5: ['#e7ebf5', '#9aa3b8', '#4a5368'],
}

function Pokal({ platz, gross = false }: { platz: number; gross?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [hell, mitte, dunkel] = FARBEN[platz] ?? FARBEN[5]
  const size = gross ? 104 : 72
  return (
    <svg className="pokal" width={size} height={size} viewBox="0 0 80 88" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-metall`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={hell} />
          <stop offset="0.45" stopColor={mitte} />
          <stop offset="1" stopColor={dunkel} />
        </linearGradient>
        <linearGradient id={`${id}-glanz`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="80" rx="24" ry="5" fill="#000" opacity="0.28" />
      <path
        d="M22 18h-6c-7 0-10 10-6 16 3 4 8 5 12 4"
        fill="none"
        stroke={`url(#${id}-metall)`}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M58 18h6c7 0 10 10 6 16-3 4-8 5-12 4"
        fill="none"
        stroke={`url(#${id}-metall)`}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M22 12h36v12c0 16-8 28-18 32-10-4-18-16-18-32V12z" fill={`url(#${id}-metall)`} />
      <path d="M26 14h14c-2 10-2 20-6 32-4-2-8-8-8-18V14z" fill={`url(#${id}-glanz)`} />
      <path d="M22 12h36v6H22z" fill={hell} />
      <path d="M34 56h12v10H34z" fill={`url(#${id}-metall)`} />
      <path d="M22 66h36v6H22z" fill={`url(#${id}-metall)`} />
      <path d="M16 72h48v8H16z" fill={`url(#${id}-metall)`} />
      <path d="M16 72h48v2H16z" fill="#fff" opacity="0.45" />
    </svg>
  )
}

function PlatzKarte({ eintrag, platz, gross = false }: { eintrag: RanglisteEintrag; platz: number; gross?: boolean }) {
  const rang = rankById(eintrag.rangId) ?? RANKS[0]
  return (
    <article className={`platz-karte platz-${platz}${gross ? ' is-gross' : ''}`}>
      <Pokal platz={platz} gross={gross} />
      <b className="platz-nr">{platz}</b>
      <strong>{eintrag.name}</strong>
      <small>
        {rang.name} · Level {eintrag.level}
        <br />
        Stadtstufe {eintrag.stadtLevel}
      </small>
      <em>
        {zahl(eintrag.einwohner)}
        <span>Einwohner</span>
      </em>
    </article>
  )
}

export function RanglisteScreen() {
  const [spieler, setSpieler] = useState<RanglisteEintrag[] | null>(null)
  const [fehler, setFehler] = useState(false)

  useEffect(() => {
    let weg = false
    ladeRangliste()
      .then((liste) => {
        if (!weg) setSpieler(liste)
      })
      .catch(() => {
        if (!weg) {
          setSpieler([])
          setFehler(true)
        }
      })
    return () => {
      weg = true
    }
  }, [])

  const podium = spieler?.slice(0, 3) ?? []
  const rest = spieler?.slice(3) ?? []

  return (
    <main className="rangliste-buehne">
      <div className="rangliste-inhalt">
        <header className="topbar">
          <button className="icon-btn" aria-label="Zurück" onClick={() => goBack({ name: 'home' })}>
            <IconBack />
          </button>
          <h1>Rangliste</h1>
        </header>

        <p className="rangliste-unter">Die fünf größten Städte. Oben steht, wer die meisten Einwohner hat.</p>

        {spieler === null && <p className="rangliste-unter">Lädt …</p>}
        {spieler && spieler.length === 0 && (
          <p className="rangliste-unter">
            {fehler ? 'Die Rangliste ist gerade nicht erreichbar.' : 'Sobald Städte wachsen, stehen hier die fünf größten.'}
          </p>
        )}

        {podium.length > 0 && (
          <ol className="podest" data-anzahl={podium.length}>
            {podium.map((eintrag, index) => (
              <li key={`${eintrag.name}-${index}`} className={`podest-slot platz-${index + 1}`}>
                <PlatzKarte eintrag={eintrag} platz={index + 1} gross={index === 0} />
              </li>
            ))}
          </ol>
        )}

        {rest.length > 0 && (
          <ol className="rangliste-rest">
            {rest.map((eintrag, index) => (
              <li key={`${eintrag.name}-${index + 3}`}>
                <PlatzKarte eintrag={eintrag} platz={index + 4} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  )
}
