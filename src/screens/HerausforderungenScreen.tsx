// Alle Herausforderungen auf einen Blick: nach Bereich gruppiert, offene zuerst, mit
// Fortschritt und Belohnung. Jede lässt sich genau einmal schaffen – dann steht sie
// abgehakt am Ende ihrer Gruppe.
import { useState } from 'react'
import { IconBack } from '../components/Icons'
import { haptic } from '../haptics'
import { alleHerausforderungen, bilanz, fortschritt, gruppen, istGeschafft, type Herausforderung } from '../herausforderungen'
import { goBack } from '../router'
import type { SaveData } from '../types'

const zahl = (n: number) => n.toLocaleString('de-DE')

export function HerausforderungenScreen({ data }: { data: SaveData }) {
  const alle = alleHerausforderungen()
  const liste = gruppen().filter((g) => alle.some((h) => h.gruppe === g.id))
  const [gruppe, setGruppe] = useState(liste[0]?.id ?? 'alle')
  const stand = bilanz(data)

  const sichtbar = alle.filter((h) => h.gruppe === gruppe)
  const offen = sichtbar.filter((h) => !istGeschafft(data, h.id)).sort((a, b) => fortschritt(data, b) - fortschritt(data, a))
  const fertig = sichtbar.filter((h) => istGeschafft(data, h.id))
  const inGruppe = (id: string) => alle.filter((h) => h.gruppe === id)

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Zurück" onClick={() => goBack({ name: 'specific' })}>
          <IconBack />
        </button>
        <h1>Herausforderungen</h1>
      </header>

      <section className="hf-kopf">
        <div className="hf-kopf-zahl">
          <strong>
            {stand.geschafft}
            <small> / {stand.gesamt}</small>
          </strong>
          <span>geschafft</span>
        </div>
        <span className="bar hf-bar">
          <span style={{ width: `${stand.gesamt ? (stand.geschafft / stand.gesamt) * 100 : 0}%` }} />
        </span>
        <p className="hf-kopf-text">
          Jede Herausforderung bringt einmalig Münzen und Ziegel für deine Stadt.
          {data.city
            ? ` Noch offen: 🪙 ${zahl(stand.offen.coins)} · 🧱 ${zahl(stand.offen.materials)}.`
            : ' Sobald du eine Stadt gegründet hast, werden geschaffte Herausforderungen dort eingelöst.'}
        </p>
      </section>

      <div className="hf-tabs" role="tablist">
        {liste.map((g) => {
          const eigene = inGruppe(g.id)
          const geschafft = eigene.filter((h) => istGeschafft(data, h.id)).length
          return (
            <button
              key={g.id}
              role="tab"
              aria-selected={gruppe === g.id}
              className={`hf-tab${gruppe === g.id ? ' is-aktiv' : ''}`}
              onClick={() => {
                setGruppe(g.id)
                haptic('tick')
              }}
            >
              <span aria-hidden="true">{g.emoji}</span>
              <span>{g.name}</span>
              <small>
                {geschafft}/{eigene.length}
              </small>
            </button>
          )
        })}
      </div>

      <ul className="hf-liste">
        {offen.map((h) => (
          <Karte key={h.id} h={h} data={data} />
        ))}
        {offen.length === 0 && <li className="hf-leer">Alles geschafft – stark! 🎉</li>}
      </ul>

      {fertig.length > 0 && (
        <>
          <h2 className="section-title">Geschafft ({fertig.length})</h2>
          <ul className="hf-liste is-fertig">
            {fertig.map((h) => (
              <Karte key={h.id} h={h} data={data} fertig />
            ))}
          </ul>
        </>
      )}
    </main>
  )
}

function Karte({ h, data, fertig = false }: { h: Herausforderung; data: SaveData; fertig?: boolean }) {
  const { wert, ziel } = h.stand(data)
  const anteil = fortschritt(data, h)
  return (
    <li className={`hf-karte${fertig ? ' is-fertig' : ''}`}>
      <span className="hf-emoji" aria-hidden="true">
        {fertig ? '✓' : h.emoji}
      </span>
      <span className="hf-text">
        <strong>{h.titel}</strong>
        <small>{h.text}</small>
        {!fertig && (
          <span className="hf-stand">
            <span className="bar hf-stand-bar">
              <span style={{ width: `${anteil * 100}%` }} />
            </span>
            <em>
              {zahl(Math.min(wert, ziel))} / {zahl(ziel)}
            </em>
          </span>
        )}
      </span>
      <span className="hf-lohn">
        <span>🪙 {zahl(h.lohn.coins)}</span>
        <span>🧱 {zahl(h.lohn.materials)}</span>
      </span>
    </li>
  )
}
