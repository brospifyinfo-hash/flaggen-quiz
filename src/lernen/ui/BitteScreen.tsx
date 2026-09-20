// Ein Bürger bittet um Hilfe – mit einer Aufgabe aus einem Kurs. Gelöst gibt es Dank, XP,
// Münzen, Wissen und bessere Stimmung (Nachbarschaftshilfe). Daneben fragt er später noch einmal.
import { useEffect, useRef, useState } from 'react'
import { makeRequest, REQUEST_XP, type CityRequest } from '../../city/requests'
import { setRequest, solveRequest } from '../../city/state'
import { IconBack } from '../../components/Icons'
import { goBack, navigate } from '../../router'
import { setState } from '../../store'
import type { SaveData } from '../../types'
import { gutschreiben, xpFuer } from '../belohnung'
import { kursBitte } from '../bitten'
import { kursById, spielById } from '../kurse'
import { aktivitaetAus } from '../quizmodus'
import { wendeErgebnisAn } from '../sitzung'
import type { AktivitaetsErgebnis } from '../typen'
import { AktivitaetSpieler } from './AktivitaetSpieler'
import { rueckmeldung } from './gemeinsam'
import './lernen.css'

/** Ab so vielen Punkten ist dem Bürger geholfen */
const GEHOLFEN_AB = 0.6

interface Dank {
  geholfen: boolean
  xp: number
  muenzen: number
  material: number
  wissen: number
}

export function BitteScreen({ data }: { data: SaveData }) {
  const request = (data.city?.request ?? null) as CityRequest | null
  const [dank, setDank] = useState<Dank | null>(null)
  const [gemerkt] = useState(request)
  const erledigt = useRef(false)
  const bitte = dank ? gemerkt : request
  const akt = bitte ? aktivitaetAus(bitte.question) : null
  const kurs = akt ? kursById(akt.kurs) : undefined
  const spiel = akt ? spielById(akt.spiel) : undefined
  const fehlt = !bitte || !akt || !kurs || !spiel

  // Keine Kurs-Bitte (mehr) offen? Dann zurück in die Stadt
  useEffect(() => {
    if (fehlt) navigate({ name: 'city' }, { replace: true })
  }, [fehlt])
  if (fehlt) return null

  const fertig = (e: AktivitaetsErgebnis) => {
    if (erledigt.current) return
    erledigt.current = true
    const jetzt = Date.now()
    const geholfen = !e.uebersprungen && e.punkte >= GEHOLFEN_AB
    let ergebnis: Dank = { geholfen, xp: 0, muenzen: 0, material: 0, wissen: 0 }
    setState((current) => {
      const offen = current.city?.request as CityRequest | null | undefined
      if (!current.city || !offen || offen.id !== bitte.id) return current
      let next = e.uebersprungen ? current : wendeErgebnisAn(current, akt, e, 0, jetzt)
      if (!geholfen) {
        // Der Bürger bleibt – und fragt später mit einer neuen Aufgabe noch einmal
        const wer = { name: bitte.citizen.name, emoji: bitte.citizen.emoji, rolle: bitte.citizen.role }
        const frisch = kursBitte(next, bitte.buildingId, jetzt, { spiel: akt.spiel, wer }) ?? makeRequest(next, bitte.buildingId, jetzt)
        return { ...next, city: setRequest(next.city!, frisch ? { ...frisch, citizen: bitte.citizen } : null, jetzt) }
      }
      const vorher = { muenzen: next.city!.coins, material: next.city!.materials }
      next = { ...next, city: solveRequest(next.city!) }
      const gut = gutschreiben(next, REQUEST_XP + xpFuer(e.punkte, akt.stufe, 0), kurs)
      ergebnis = {
        geholfen,
        xp: gut.xp,
        muenzen: (gut.data.city?.coins ?? 0) - vorher.muenzen,
        material: (gut.data.city?.materials ?? 0) - vorher.material,
        wissen: gut.wissen,
      }
      return gut.data
    })
    setDank(ergebnis)
    if (geholfen) rueckmeldung.geschafft()
  }

  return (
    <main className={`screen lern-welt ${kurs.thema} lw-bitte`}>
      <header className="topbar">
        <button className="icon-btn" aria-label="Zurück zur Stadt" onClick={() => goBack({ name: 'city' })}>
          <IconBack />
        </button>
        <h1>
          {bitte.citizen.emoji} {bitte.citizen.name}
        </h1>
      </header>

      <div className="lw-sprecher lw-bitte-kopf">
        <span className="lw-sprecher-emoji" aria-hidden="true">
          {bitte.citizen.emoji}
        </span>
        <div className="lw-blase">
          <small>
            {bitte.citizen.name} · {bitte.citizen.role}
          </small>
          <p>„{bitte.story}“</p>
          <small>
            {spiel.emoji} {spiel.name} · {kurs.emoji} {kurs.titel}
          </small>
        </div>
      </div>

      {!dank && <AktivitaetSpieler akt={akt} onFertig={fertig} />}

      {dank && (
        <section className={`lw-dank${dank.geholfen ? ' is-gut' : ''}`}>
          <span className="lw-dank-emoji" aria-hidden="true">
            {dank.geholfen ? '🎉' : '🙂'}
          </span>
          <h2>{dank.geholfen ? `${bitte.citizen.name} ist dir dankbar!` : 'Nicht ganz – aber danke fürs Versuchen'}</h2>
          {dank.geholfen ? (
            <p className="lw-dank-beute">
              ⭐ +{dank.xp} XP · 🪙 +{dank.muenzen.toLocaleString('de-DE')} · 🧱 +{dank.material} · 🧠 +{dank.wissen} {kurs.wissen}
            </p>
          ) : (
            <p className="lw-dank-beute">{bitte.citizen.name} fragt später noch einmal – mit einer neuen Aufgabe.</p>
          )}
          {dank.geholfen && <p className="lw-hinweis">😊 Nachbarschaftshilfe hebt die Stimmung in deiner Stadt.</p>}
          <button
            className="btn btn-primary"
            onClick={() => {
              rueckmeldung.tipp()
              goBack({ name: 'city' })
            }}
          >
            Zurück zur Stadt
          </button>
        </section>
      )}
    </main>
  )
}
