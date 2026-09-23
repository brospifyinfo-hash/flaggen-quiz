// Die Verwaltung: alle Konten mit ihrem Stand. Der Server lässt nur ein Konto hinein.
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { KontoZeile, RanglisteEintrag } from '../admin'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Rangliste } from '../components/Rangliste'
import { IconBack } from '../components/Icons'
import { gutschreiben, KontoFehler, ladeVerwaltung } from '../konto'
import { RANKS, rankById } from '../progression'
import { RankCrest } from '../components/RankCrest'
import { goBack } from '../router'

const zahl = (n: number) => n.toLocaleString('de-DE')
const muenzText = (n: number) => `${zahl(n)} ${n === 1 ? 'Münze' : 'Münzen'}`
const steinText = (n: number) => `${zahl(n)} ${n === 1 ? 'Stein' : 'Steine'}`

function standText(stand: number): string {
  if (!stand) return 'Noch kein Stand gespeichert'
  return new Date(stand).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
}

function ganzeZahl(text: string): number | null {
  const roh = text.trim().replace(/\./g, '').replace(/\s/g, '')
  if (!/^\d+$/.test(roh)) return null
  const n = Number(roh)
  if (!Number.isSafeInteger(n)) return null
  return n
}

export function AdminScreen() {
  const [konten, setKonten] = useState<KontoZeile[] | null>(null)
  const [spieler, setSpieler] = useState<RanglisteEintrag[]>([])
  const [fehler, setFehler] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  const [muenzen, setMuenzen] = useState('')
  const [steine, setSteine] = useState('')
  const [gabeFehler, setGabeFehler] = useState('')
  const [gabeHinweis, setGabeHinweis] = useState('')
  const [gabeLaeuft, setGabeLaeuft] = useState(false)
  const [offen, setOffen] = useState<string | null>(null)
  const [einzelnMuenzen, setEinzelnMuenzen] = useState('')
  const [einzelnSteine, setEinzelnSteine] = useState('')
  const [bestaetigen, setBestaetigen] = useState<{ muenzen: number; ziegel: number; email?: string; name?: string } | null>(null)

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

  const vorbereiten = (event: FormEvent) => {
    event.preventDefault()
    setGabeFehler('')
    setGabeHinweis('')
    const muenzenZahl = ganzeZahl(muenzen)
    const steineZahl = ganzeZahl(steine)
    if (muenzenZahl === null || steineZahl === null) {
      setGabeFehler('Münzen und Steine müssen ganze Zahlen ab 0 sein.')
      return
    }
    if (muenzenZahl === 0 && steineZahl === 0) {
      setGabeFehler('Trag ein, wie viele Münzen oder Steine dazukommen sollen.')
      return
    }
    setBestaetigen({ muenzen: muenzenZahl, ziegel: steineZahl })
  }

  const einzelnVorbereiten = (event: FormEvent, konto: KontoZeile) => {
    event.preventDefault()
    setGabeFehler('')
    setGabeHinweis('')
    const muenzenZahl = ganzeZahl(einzelnMuenzen)
    const steineZahl = ganzeZahl(einzelnSteine)
    if (muenzenZahl === null || steineZahl === null) {
      setGabeFehler('Münzen und Steine müssen ganze Zahlen ab 0 sein.')
      return
    }
    if (muenzenZahl === 0 && steineZahl === 0) {
      setGabeFehler('Trag ein, wie viele Münzen oder Steine dazukommen sollen.')
      return
    }
    setBestaetigen({ muenzen: muenzenZahl, ziegel: steineZahl, email: konto.email, name: konto.name })
  }

  const ausfuehren = async () => {
    if (!bestaetigen) return
    const plan = bestaetigen
    setBestaetigen(null)
    setGabeLaeuft(true)
    setGabeFehler('')
    try {
      const antwort = await gutschreiben(plan.muenzen, plan.ziegel, plan.email)
      const name = antwort.name || plan.name
      setGabeHinweis(
        plan.email
          ? `${name} hat ${muenzText(antwort.muenzen)} und ${steinText(antwort.ziegel)} bekommen.`
          : `${muenzText(antwort.muenzen)} und ${steinText(antwort.ziegel)} an ${zahl(antwort.anzahl)} Konten gutgeschrieben.`,
      )
      if (plan.email) {
        setEinzelnMuenzen('')
        setEinzelnSteine('')
        setOffen(null)
      } else {
        setMuenzen('')
        setSteine('')
      }
      await laden()
    } catch (err) {
      setGabeFehler(err instanceof KontoFehler ? err.message : 'Die Gutschrift ist nicht angekommen.')
    } finally {
      setGabeLaeuft(false)
    }
  }

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

      <h2 className="section-title">Allen gutschreiben</h2>
      <p className="verwaltung-hinweis">
        Kommt auf jedes Konto, auch ohne Stadt. Eine Gutschrift zählt nicht als Schattenkasse. Wer gerade spielt, sieht sie nach dem nächsten Abgleich.
      </p>
      <form className="list gutschrift" onSubmit={vorbereiten}>
        <div className="row row-stack">
          <label className="city-label" htmlFor="gabe-muenzen">
            Münzen
          </label>
          <input
            id="gabe-muenzen"
            className="city-input"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={muenzen}
            onChange={(event) => setMuenzen(event.target.value)}
          />
        </div>
        <div className="row row-stack">
          <label className="city-label" htmlFor="gabe-steine">
            Steine
          </label>
          <input
            id="gabe-steine"
            className="city-input"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={steine}
            onChange={(event) => setSteine(event.target.value)}
          />
        </div>
        {gabeFehler && !offen && <p className="verwaltung-fehler gutschrift-meldung">{gabeFehler}</p>}
        {gabeHinweis && !offen && <p className="verwaltung-hinweis gutschrift-meldung">{gabeHinweis}</p>}
        <div className="row row-stack">
          <button className="btn btn-primary" type="submit" disabled={gabeLaeuft || konten === null}>
            {gabeLaeuft ? 'Wird gutgeschrieben …' : 'Allen gutschreiben'}
          </button>
        </div>
      </form>

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
                <div className="verwaltung-kopf">
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
                      {zahl(konto.muenzen)} Münzen · {zahl(konto.ziegel)} Steine · {konto.gebaeude} Gebäude
                    </span>
                    <span>{standText(konto.stand)}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary gutschrift-knopf"
                    aria-expanded={offen === konto.email}
                    aria-label={`Gutschreiben an ${konto.name}`}
                    onClick={() => {
                      setGabeFehler('')
                      setGabeHinweis('')
                      setEinzelnMuenzen('')
                      setEinzelnSteine('')
                      setOffen(offen === konto.email ? null : konto.email)
                    }}
                  >
                    {offen === konto.email ? 'Schließen' : 'Gutschreiben'}
                  </button>
                </div>
                {offen === konto.email && (
                  <form className="verwaltung-gabe" onSubmit={(event) => einzelnVorbereiten(event, konto)}>
                    <label className="city-label" htmlFor={`gabe-m-${konto.email}`}>
                      Münzen
                      <input
                        id={`gabe-m-${konto.email}`}
                        className="city-input"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="0"
                        value={einzelnMuenzen}
                        onChange={(event) => setEinzelnMuenzen(event.target.value)}
                      />
                    </label>
                    <label className="city-label" htmlFor={`gabe-s-${konto.email}`}>
                      Steine
                      <input
                        id={`gabe-s-${konto.email}`}
                        className="city-input"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="0"
                        value={einzelnSteine}
                        onChange={(event) => setEinzelnSteine(event.target.value)}
                      />
                    </label>
                    <button className="btn btn-primary" type="submit" disabled={gabeLaeuft}>
                      {gabeLaeuft ? '…' : 'Nur diesem Konto'}
                    </button>
                    {gabeFehler && <p className="verwaltung-fehler gutschrift-meldung">{gabeFehler}</p>}
                  </form>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {bestaetigen && (
        <ConfirmDialog
          title={bestaetigen.email ? `${bestaetigen.name} gutschreiben?` : 'Allen gutschreiben?'}
          text={
            bestaetigen.email
              ? `${bestaetigen.name} bekommt ${muenzText(bestaetigen.muenzen)} und ${steinText(bestaetigen.ziegel)}. Das lässt sich nicht zurücknehmen.`
              : `${muenzText(bestaetigen.muenzen)} und ${steinText(bestaetigen.ziegel)} kommen auf jedes Konto. Das lässt sich nicht zurücknehmen.`
          }
          confirmLabel="Gutschreiben"
          onConfirm={() => void ausfuehren()}
          onCancel={() => setBestaetigen(null)}
        />
      )}
    </main>
  )
}
