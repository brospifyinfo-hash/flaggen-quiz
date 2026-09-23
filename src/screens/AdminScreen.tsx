// Die Verwaltung: alle Konten mit ihrem Stand. Der Server lässt nur ein Konto hinein.
import { useCallback, useEffect, useState } from 'react'
import type { KontoZeile, RanglisteEintrag } from '../admin'
import { Rangliste } from '../components/Rangliste'
import { IconBack } from '../components/Icons'
import { KontoFehler, ladeVerwaltung } from '../konto'
import { RANKS, rankById } from '../progression'
import { RankCrest } from '../components/RankCrest'
import { goBack } from '../router'

const zahl = (n: number) => n.toLocaleString('de-DE')

function standText(stand: number): string {
  if (!stand) return 'Noch kein Stand gespeichert'
  return new Date(stand).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
}

export function AdminScreen() {
  const [konten, setKonten] = useState<KontoZeile[] | null>(null)
  const [spieler, setSpieler] = useState<RanglisteEintrag[]>([])
  const [fehler, setFehler] = useState('')
  const [laeuft, setLaeuft] = useState(false)

  const laden = useCallback(async () => {
    setLaeuft(true)
    setFehler('')
    try {
      const antwort = await ladeVerwaltung()
      setKonten(antwort.konten)
      setSpieler(antwort.spieler)
    } catch (err) {
      setKonten([])
      setSpieler([])
      setFehler(err instanceof KontoFehler ? err.message : 'Die Konten konnten nicht geladen werden.')
    } finally {
      setLaeuft(false)
    }
  }, [])

  useEffect(() => {
    void laden()
  }, [laden])

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Zurück" onClick={() => goBack({ name: 'home' })}>
          <IconBack />
        </button>
        <h1>Verwaltung</h1>
        <button className="verwaltung-neu" type="button" onClick={() => void laden()} disabled={laeuft}>
          {laeuft ? 'Lädt …' : 'Aktualisieren'}
        </button>
      </header>

      <h2 className="section-title">Rangliste</h2>
      <p className="verwaltung-hinweis">Die fünf Städte mit den meisten Einwohnern. Die Schattenkasse zählt hier nicht mit.</p>
      {spieler.length > 0 ? (
        <Rangliste spieler={spieler} />
      ) : (
        <p className="verwaltung-hinweis">{konten === null ? 'Lädt …' : 'Noch keine Stadt in der Rangliste.'}</p>
      )}

      <h2 className="section-title">Alle Konten</h2>
      {fehler && <p className="verwaltung-fehler">{fehler}</p>}
      {konten === null && !fehler && <p className="verwaltung-hinweis">Lädt …</p>}
      {konten && konten.length === 0 && !fehler && <p className="verwaltung-hinweis">Noch keine Konten.</p>}
      {konten && konten.length > 0 && (
        <ul className="list">
          {konten.map((konto) => {
            const rang = rankById(konto.rangId) ?? RANKS[0]
            return (
              <li key={konto.email} className="row verwaltung-zeile">
                <RankCrest rank={rang} size={46} />
                <div className="row-label">
                  <strong>
                    {konto.name}
                    {konto.schummel && <em className="schummel-marke">Schattenkasse</em>}
                  </strong>
                  <span>{konto.email}</span>
                  <span>
                    {rang.name} · Level {konto.level} · {zahl(konto.xp)} XP
                  </span>
                  <span>
                    {konto.stadt || 'Keine Stadt'}
                    {konto.stadtLevel > 0 ? ` · Stadtstufe ${konto.stadtLevel}` : ''} · {zahl(konto.einwohner)} Einwohner
                  </span>
                  <span>
                    {zahl(konto.muenzen)} Münzen · {zahl(konto.ziegel)} Ziegel · {konto.gebaeude} Gebäude
                  </span>
                  <span>{standText(konto.stand)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
