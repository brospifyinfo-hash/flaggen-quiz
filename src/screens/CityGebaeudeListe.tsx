/**
 * Gebäudeliste im Rathaus: jede Bauart aus dem Katalog mit der Anzahl in der Stadt,
 * aufklappbar zu den einzelnen Häusern – dort lässt sich jedes direkt ausbauen.
 */
import { useState } from 'react'
import { IconChevron } from '../components/Icons'
import { BUILDINGS, CATEGORIES, maxLevel, nextUpgrade, RATHAUS, type BuildingDef } from '../city/catalog'
import type { CityState, Placed } from '../city/types'
import { haptic } from '../haptics'
import { Vorschau } from './CityBuildSheet'

export interface GebaeudeListeProps {
  city: CityState
  /** Ein Haus um eine Stufe ausbauen */
  onAusbau: (id: string) => void
  /** Alle Häuser dieser Bauart um eine Stufe ausbauen, soweit die Kasse reicht */
  onAlleAusbauen: (ids: string[]) => void
  /** Kamera zu diesem Haus fahren */
  onZeigen: (placed: Placed) => void
}

const zahl = (n: number) => n.toLocaleString('de-DE')

/** Was der Ausbau aller Häuser dieser Art zusammen kostet – nur die, die noch wachsen können */
function sammelkosten(def: BuildingDef, haeuser: Placed[]): { coins: number; materials: number; ids: string[] } {
  let coins = 0
  let materials = 0
  const ids: string[] = []
  for (const h of haeuser) {
    if (h.verlassen) continue
    const step = nextUpgrade(def, h.level)
    if (!step) continue
    coins += step.coins
    materials += step.materials
    ids.push(h.id)
  }
  return { coins, materials, ids }
}

export function GebaeudeListe({ city, onAusbau, onAlleAusbauen, onZeigen }: GebaeudeListeProps) {
  const [offen, setOffen] = useState<string | null>(null)
  const [nurGebaute, setNurGebaute] = useState(true)

  const proTyp = new Map<string, Placed[]>()
  for (const placed of city.buildings) {
    const liste = proTyp.get(placed.type) ?? []
    liste.push(placed)
    proTyp.set(placed.type, liste)
  }
  const gesamt = city.buildings.length

  const gruppen = CATEGORIES.filter((k) => k.id !== 'wege')
    .map((kategorie) => {
      const arten = BUILDINGS.filter((def) => def.category === kategorie.id).map((def) => ({
        def,
        haeuser: [...(proTyp.get(def.id) ?? [])].sort((a, b) => b.level - a.level || a.y - b.y || a.x - b.x),
      }))
      const sichtbar = nurGebaute ? arten.filter((a) => a.haeuser.length > 0) : arten
      return { kategorie, arten: sichtbar, anzahl: arten.reduce((n, a) => n + a.haeuser.length, 0) }
    })
    .filter((g) => g.arten.length > 0)

  return (
    <div className="gebaeude-liste">
      <div className="gebaeude-kopf">
        <span>
          <strong>{zahl(gesamt)}</strong> Bauwerke in {city.name}
        </span>
        <button
          className={`city-tab${nurGebaute ? '' : ' is-on'}`}
          aria-pressed={!nurGebaute}
          onClick={() => {
            setNurGebaute((v) => !v)
            haptic('tick')
          }}
        >
          {nurGebaute ? 'Alle Bauarten zeigen' : 'Nur Gebaute zeigen'}
        </button>
      </div>

      {gruppen.length === 0 && <p className="city-empty">Noch steht hier nichts außer dem Rathaus.</p>}

      {gruppen.map(({ kategorie, arten, anzahl }) => (
        <section key={kategorie.id} className="gebaeude-gruppe">
          <p className="city-label-line">
            {kategorie.name} <span className="gebaeude-zaehler">{zahl(anzahl)}</span>
          </p>
          {arten.map(({ def, haeuser }) => {
            const auf = offen === def.id
            const anzahl = haeuser.length
            const max = maxLevel(def)
            const sammel = def.id === RATHAUS ? { coins: 0, materials: 0, ids: [] as string[] } : sammelkosten(def, haeuser)
            const stufenSumme = haeuser.reduce((n, h) => n + h.level, 0)
            return (
              <div key={def.id} className={`gebaeude-art${auf ? ' is-open' : ''}${anzahl === 0 ? ' is-none' : ''}`}>
                <button
                  className="gebaeude-zeile"
                  aria-expanded={auf}
                  disabled={anzahl === 0}
                  onClick={() => {
                    setOffen(auf ? null : def.id)
                    haptic('tick')
                  }}
                >
                  <span className="gebaeude-bild">
                    <Vorschau def={def} theme={city.theme} />
                  </span>
                  <span className="gebaeude-text">
                    <strong>{def.name}</strong>
                    <span>
                      {anzahl === 0
                        ? 'noch nicht gebaut'
                        : max > 1
                          ? `Stufe ${stufenSumme === anzahl * max ? max : `${(stufenSumme / anzahl).toFixed(1).replace('.', ',')} im Schnitt`} von ${max}`
                          : 'kein Ausbau möglich'}
                    </span>
                  </span>
                  <span className="gebaeude-anzahl">
                    <strong>{zahl(anzahl)}</strong>
                    <small>Stück</small>
                  </span>
                  {anzahl > 0 && (
                    <span className="gebaeude-pfeil" aria-hidden="true">
                      <IconChevron />
                    </span>
                  )}
                </button>

                {auf && (
                  <div className="gebaeude-details">
                    {sammel.ids.length > 1 && (
                      <button
                        className={`city-btn${city.coins >= sammel.coins && city.materials >= sammel.materials ? ' city-btn-main' : ''}`}
                        onClick={() => {
                          onAlleAusbauen(sammel.ids)
                        }}
                      >
                        Alle {sammel.ids.length} ausbauen · {zahl(sammel.coins)} Münzen
                        {sammel.materials > 0 ? ` · ${zahl(sammel.materials)} Ziegel` : ''}
                      </button>
                    )}
                    <ul className="gebaeude-haeuser">
                      {haeuser.map((h, i) => {
                        const step = def.id === RATHAUS || h.verlassen ? null : nextUpgrade(def, h.level)
                        const reicht = step ? city.coins >= step.coins && city.materials >= step.materials : false
                        return (
                          <li key={h.id} className={h.verlassen ? 'is-ruine' : ''}>
                            <button
                              className="gebaeude-haus"
                              onClick={() => {
                                onZeigen(h)
                              }}
                              aria-label={`${def.name} ${i + 1} auf der Karte zeigen`}
                            >
                              <strong>
                                {def.name} {anzahl > 1 ? i + 1 : ''}
                              </strong>
                              <span>
                                {h.verlassen
                                  ? 'verlassen – im Haus sanieren'
                                  : max > 1
                                    ? `Stufe ${h.level} von ${max}`
                                    : 'voll ausgebaut'}
                                {' · '}
                                {h.x}|{h.y}
                              </span>
                            </button>
                            {step ? (
                              <button
                                className={`gebaeude-ausbau${reicht ? ' is-ok' : ''}`}
                                onClick={() => {
                                  onAusbau(h.id)
                                }}
                                aria-label={`${def.name} auf Stufe ${h.level + 1} ausbauen`}
                              >
                                <strong>Ausbauen</strong>
                                <span>
                                  {zahl(step.coins)} Münzen{step.materials > 0 ? ` · ${zahl(step.materials)} Ziegel` : ''}
                                </span>
                              </button>
                            ) : (
                              <span className="gebaeude-fertig">{h.verlassen ? 'Ruine' : def.id === RATHAUS ? 'wächst mit der Stadt' : 'Höchststufe'}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </section>
      ))}
      <p className="city-hint">
        Tippe eine Bauart an, um jedes einzelne Haus zu sehen. Der Ausbau kostet Münzen und Ziegel und bringt mehr Wohnungen,
        Einnahmen oder Wirkung – je nach Gebäude.
      </p>
    </div>
  )
}
