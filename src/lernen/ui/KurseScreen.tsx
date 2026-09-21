// Alle Lernkurse auf einen Blick – jede Karte gleich gebaut: Fach, Fortschritt, was es zu
// holen gibt. Welcher Kurs, entscheidet der Geschmack, nicht die Gestaltung.
import { IconBack, IconChevron } from '../../components/Icons'
import { haptic } from '../../haptics'
import { domainById, knowledgeLevel, pointsOf } from '../../knowledge'
import { PERFEKT_LOHN_KURS } from '../../progression'
import { goBack, navigate } from '../../router'
import type { SaveData } from '../../types'
import { naechstesStadtZiel } from '../belohnung'
import { kursStand } from '../fortschritt'
import { KURSE, ladeKurs } from '../kurse'
import { bandVon, kursStufe, kursWert } from '../meisterschaft'
import { STUFE_NAME } from '../typen'
import { breite, prozent } from './gemeinsam'
import './lernen.css'

const zahl = (n: number) => n.toLocaleString('de-DE')

export function KurseScreen({ data }: { data: SaveData }) {
  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Zurück" onClick={() => goBack({ name: 'home' })}>
          <IconBack />
        </button>
        <h1>Lernkurse</h1>
      </header>

      <p className="kurse-intro">
        Ein Kurs ist kein Quiz: Jede Session mischt verschiedene Spiele – und was als Nächstes kommt, bleibt eine
        Überraschung.
      </p>

      <ul className="kurs-liste">
        {KURSE.map((kurs) => {
          const stand = kursStand(data, kurs.id)
          const wert = kursWert(kurs, stand)
          const stufe = kursStufe(kurs, stand)
          const punkte = pointsOf(data, kurs.domain)
          const wissen = knowledgeLevel(punkte)
          const stadt = naechstesStadtZiel(data, kurs)
          const begonnen = (stand?.aktivitaeten ?? 0) > 0
          return (
            <li key={kurs.id}>
              <button
                className={`kurs-zeile ${kurs.thema}`}
                onPointerDown={() => void ladeKurs(kurs.id).catch(() => undefined)}
                onClick={() => {
                  haptic('soft')
                  navigate({ name: 'kurs', id: kurs.id })
                }}
              >
                <span className="kurs-zeile-emoji" aria-hidden="true">
                  {kurs.emoji}
                </span>
                <span className="kurs-zeile-text">
                  <strong>{kurs.titel}</strong>
                  <small className="kurs-zeile-claim">{kurs.claim}</small>
                  <span className="bar kurs-zeile-bar">
                    <span style={{ width: breite(wert) }} />
                  </span>
                  <small className="kurs-zeile-stand">
                    {begonnen ? `${prozent(wert)} · ${bandVon(wert).name} · Stufe ${STUFE_NAME[stufe]}` : 'Neu · jetzt starten'}
                  </small>
                  <span className="kurs-zeile-fakten">
                    <span className="kurs-chip">{kurs.spiele.length} Spiele</span>
                    <span className="kurs-chip">{kurs.module.length} Module</span>
                    <span className="kurs-chip">
                      🧠 {zahl(punkte)} {domainById(kurs.domain)?.name ?? kurs.titel} · Stufe {wissen.level}
                    </span>
                  </span>
                  <small className="kurs-zeile-lohn">
                    🪙 {zahl(PERFEKT_LOHN_KURS.coins)} · 🧱 {zahl(PERFEKT_LOHN_KURS.materials)} für eine fehlerfreie Session
                    {stadt ? ` · baut ${stadt.def.name}` : ''}
                  </small>
                </span>
                <IconChevron className="continent-arrow" />
              </button>
            </li>
          )
        })}
      </ul>

      <p className="footnote">
        Jede Session zahlt XP für den Rang, Münzen und Steine für die Stadt und Wissen für das Fach – eine fehlerfreie
        Session zusätzlich den Jackpot.
      </p>
    </main>
  )
}
