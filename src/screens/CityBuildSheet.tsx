// Das Baumenü: Kategorien oben, darunter ein Raster aus Karten. Jede Karte zeigt das
// Gebäude selbst – gezeichnet vom selben Zeichner wie die Stadt –, dazu Preis und
// Wirkung. Das Raster scrollt für sich, das Blatt bleibt gleich hoch, egal wie viele
// Karten eine Kategorie hat. So springt beim Wechseln nichts.
import { useEffect, useRef } from 'react'
import { IconClose } from '../components/Icons'
import { drawBuilding, umrissPunkte } from '../city/buildings'
import { CATEGORIES, type BuildingDef, type Category, type Klasse } from '../city/catalog'
import { blickJetzt, feldJetzt, setBlick, toScreen } from '../city/iso'
import { catalogFor } from '../city/state'
import { themeById } from '../city/themes'
import type { CityState } from '../city/types'
import { haptic } from '../haptics'

export const KLASSE_NAME: Record<Klasse, string> = {
  arm: 'Einfach',
  mittel: 'Mitte',
  reich: 'Wohlhabend',
  superreich: 'Luxus',
}

const HINWEIS: Partial<Record<Category, string>> = {
  wohnen: 'Bei guter Stimmung bauen Zugezogene auch selbst – ohne dass du etwas bezahlst.',
  handel: 'Arbeitsplätze gegen Arbeitslosigkeit, Einnahmen für die Stadtkasse.',
  dienste: 'Wachen rücken in ihrer Reichweite aus, wenn etwas passiert. Sie kosten Unterhalt.',
  unterwelt: 'Bringt Schwarzgeld und zieht Kriminalität an. Die Polizei hebt aus, was in ihrer Reichweite liegt.',
}

/** Die zwei, drei Zahlen, auf die es bei diesem Gebäude ankommt */
function kurzwirkung(def: BuildingDef): string[] {
  const e = def.effects
  const liste: string[] = []
  if (e.capacity) liste.push(`👥 ${e.capacity}`)
  if (e.klasse) liste.push(KLASSE_NAME[e.klasse])
  if (e.police) liste.push(`🚓 ${e.police} Felder`)
  if (e.fire) liste.push(`🚒 ${e.fire} Felder`)
  if (e.health) liste.push(`🏥 ${e.health} Felder`)
  if (e.black) liste.push(`💰 +${e.black}`)
  if (e.crime && e.crime > 0) liste.push(`🚨 +${e.crime}`)
  if (e.income && e.income > 0) liste.push(`🪙 +${e.income}`)
  if (e.jobs) liste.push(`💼 ${e.jobs}`)
  if (e.education) liste.push(`🎓 +${e.education}`)
  if (e.happiness && liste.length < 3) liste.push(`😊 ${e.happiness > 0 ? '+' : ''}${e.happiness}`)
  if (e.environment && liste.length < 3) liste.push(`🌳 ${e.environment > 0 ? '+' : ''}${e.environment}`)
  return liste.slice(0, 3)
}

/** Das Gebäude in klein, so wie es in der Stadt steht */
function Vorschau({ def, theme }: { def: BuildingDef; theme: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const leinwand = ref.current
    if (!leinwand) return
    const breite = 140
    const hoehe = 96
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    leinwand.width = Math.round(breite * dpr)
    leinwand.height = Math.round(hoehe * dpr)
    const ctx = leinwand.getContext('2d')
    if (!ctx) return
    // Der Zeichner rechnet mit dem Blickwinkel der Stadt – für die Vorschau kurz von
    // vorn, danach wieder genau so, wie es war
    const altWinkel = blickJetzt()
    const altFeld = feldJetzt()
    try {
      setBlick(0, 4)
      const placed = { id: `vorschau-${def.id}`, type: def.id, x: 0, y: 0, rot: 0 as const, level: 1, at: 0 }
      const punkte = umrissPunkte(placed, 'o')
      const xs = punkte.map((p) => p.sx)
      const ys = punkte.map((p) => p.sy)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      const massstab = Math.min((breite - 14) / Math.max(1, maxX - minX), (hoehe - 12) / Math.max(1, maxY - minY), 1.7)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, breite, hoehe)
      ctx.translate(breite / 2, hoehe / 2 + 2)
      ctx.scale(massstab, massstab)
      ctx.translate(-(minX + maxX) / 2, -(minY + maxY) / 2)
      // Grundstück als Rasenstück, damit das Haus nicht in der Luft hängt
      const [w, h] = def.size
      const t = themeById(theme)
      const ecken = [toScreen(0, 0), toScreen(w, 0), toScreen(w, h), toScreen(0, h)]
      ctx.beginPath()
      ecken.forEach((p, i) => (i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy)))
      ctx.closePath()
      ctx.fillStyle = t.ground[1]
      ctx.fill()
      drawBuilding(ctx, placed, 0, t, true, 'o')
    } finally {
      setBlick(altWinkel, altFeld)
    }
  }, [def.id, theme])
  return <canvas ref={ref} className="bau-vorschau" aria-hidden="true" />
}

export interface BauBlattProps {
  city: CityState
  levels: Record<string, number>
  category: Category
  onCategory: (category: Category) => void
  onPick: (type: string) => void
  onClose: () => void
  say: (text: string) => void
}

export function BauBlatt({ city, levels, category, onCategory, onPick, onClose, say }: BauBlattProps) {
  const raster = useRef<HTMLDivElement>(null)
  const reiter = useRef<HTMLDivElement>(null)
  const liste = catalogFor(city, levels, category)

  // Neue Kategorie: von oben anfangen, und der gewählte Reiter rückt ins Bild
  useEffect(() => {
    raster.current?.scrollTo({ top: 0 })
    const leiste = reiter.current
    const an = leiste?.querySelector<HTMLElement>('.is-on')
    if (leiste && an) {
      const a = an.getBoundingClientRect()
      const l = leiste.getBoundingClientRect()
      const ziel = leiste.scrollLeft + a.left - l.left - (leiste.clientWidth - a.width) / 2
      leiste.scrollTo({ left: Math.max(0, ziel), behavior: 'smooth' })
    }
  }, [category])

  return (
    <div className="city-sheet bau-blatt" role="dialog" aria-label="Bauen">
      <div className="city-sheet-head">
        <strong>Bauen</strong>
        <span className="bau-kasse">
          🪙 {city.coins.toLocaleString('de-DE')} · 🧱 {city.materials.toLocaleString('de-DE')}
        </span>
        <button className="city-close" aria-label="Schließen" onClick={onClose}>
          <IconClose />
        </button>
      </div>

      <div className="city-tabs" role="tablist" ref={reiter}>
        {CATEGORIES.map((entry) => {
          const frei = catalogFor(city, levels, entry.id).filter((e) => e.lock.ok).length
          return (
            <button
              key={entry.id}
              role="tab"
              aria-selected={entry.id === category}
              className={`city-tab${entry.id === category ? ' is-on' : ''}`}
              onClick={() => {
                onCategory(entry.id)
                haptic('tick')
              }}
            >
              {entry.emoji} {entry.name}
              <small>{frei}</small>
            </button>
          )
        })}
      </div>

      <div className="bau-raster" ref={raster}>
        {liste.map(({ def, lock }) => {
          const fehltGeld = city.coins < def.coins
          const fehltMaterial = city.materials < def.materials
          const zuTeuer = fehltGeld || fehltMaterial
          return (
            <button
              key={def.id}
              className={`bau-karte${!lock.ok ? ' is-locked' : zuTeuer ? ' is-poor' : ''}`}
              onClick={() => {
                if (!lock.ok) {
                  say(`Dafür fehlt dir noch: ${lock.missing.join(', ')}.`)
                  return
                }
                if (zuTeuer) {
                  const teile: string[] = []
                  if (fehltGeld) teile.push(`${(def.coins - city.coins).toLocaleString('de-DE')} Münzen`)
                  if (fehltMaterial) teile.push(`${def.materials - city.materials} Materialien`)
                  say(`Für ${def.name} fehlen dir noch ${teile.join(' und ')}.`)
                  return
                }
                onPick(def.id)
              }}
            >
              <Vorschau def={def} theme={city.theme} />
              {!lock.ok && (
                <span className="bau-schloss" aria-hidden="true">
                  🔒
                </span>
              )}
              <span className="bau-name">{def.name}</span>
              <span className="bau-preis">
                <span className={fehltGeld ? 'fehlt' : ''}>🪙 {def.coins.toLocaleString('de-DE')}</span>
                {def.materials > 0 && <span className={fehltMaterial ? 'fehlt' : ''}>🧱 {def.materials}</span>}
              </span>
              <span className="bau-wirkung">
                {lock.ok ? (
                  kurzwirkung(def).map((text) => <span key={text}>{text}</span>)
                ) : (
                  <span className="bau-grund">{lock.missing.join(' · ')}</span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <p className="city-hint">
        {HINWEIS[category] ?? 'Gesperrtes schaltet sich frei, wenn deine Stadt wächst – oder wenn du im passenden Fach dazulernst.'}
      </p>
    </div>
  )
}
