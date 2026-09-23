// Das Postfach: Was mit jedem Update neu ist. Beim Öffnen wird alles als gelesen vermerkt,
// die bis dahin neuen Nachrichten bleiben aber so lange markiert, wie die Seite offen ist.
import { useEffect, useMemo, useState } from 'react'
import { IconBack } from '../components/Icons'
import { allesGelesen, NACHRICHTEN, ungelesen } from '../postfach'
import { goBack } from '../router'
import { setState } from '../store'
import type { SaveData } from '../types'

export function PostfachScreen({ data }: { data: SaveData }) {
  const neu = useMemo(() => new Set(ungelesen(data).map((n) => n.id)), [])
  const [offen, setOffen] = useState<string | null>(NACHRICHTEN[0]?.id ?? null)

  useEffect(() => {
    setState(allesGelesen)
  }, [])

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Zurück" onClick={() => goBack({ name: 'home' })}>
          <IconBack />
        </button>
        <h1>Postfach</h1>
      </header>

      <p className="post-einleitung">
        Bei jedem Update landet hier eine Nachricht mit allem, was neu ist. {neu.size > 0 ? `${neu.size} neu.` : 'Alles gelesen.'}
      </p>

      <ul className="post-liste">
        {NACHRICHTEN.map((n) => {
          const auf = offen === n.id
          return (
            <li key={n.id} className={`post-karte${neu.has(n.id) ? ' is-neu' : ''}${auf ? ' is-open' : ''}`}>
              <button
                className="post-kopf"
                aria-expanded={auf}
                onClick={() => setOffen(auf ? null : n.id)}
              >
                <span className="post-datum">
                  {n.datum}
                  {neu.has(n.id) && <em>Neu</em>}
                </span>
                <strong>{n.titel}</strong>
                <span className="post-text">{n.text}</span>
              </button>
              {auf && (
                <ul className="post-punkte">
                  {n.punkte.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </main>
  )
}
