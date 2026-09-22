// Beschwerden und Leerstand. Jedes Wohnhaus hat eine eigene Wohnlage: die Stimmung der
// Stadt, dazu was ringsum steht – Stripclub, Plantage und Drogenlabor drücken sie, Grün
// und Polizei heben sie. Sinkt die Wohnlage zu tief, beschweren sich die Bewohner erst
// eine Weile; ändert sich nichts, ziehen sie aus. Das Haus bleibt stehen und verfällt.
import { buildingDef, effectsOf, footprint } from './catalog'
import { abdeckungBei, kriminalitaetBei } from './society'
import type { CityState, Part, Placed } from './types'

/** Unter dieser Wohnlage beginnen die Beschwerden */
export const BESCHWERDE_AB = 38
/** Ab dieser Wohnlage beruhigen sich die Bewohner wieder */
export const BERUHIGT_AB = 48
/** So lange wird sich beschwert, bevor die Bewohner wirklich ausziehen */
export const AUSZUG_NACH = 4 * 60 * 1000
/** Ein Auszug drückt die Stimmung der Nachbarn – so weit reicht die Ruine */
export const RUINEN_REICHWEITE = 2.5

/** Worüber sich Nachbarn beschweren – je Bauwerk ein Satz, der in "… beschweren sich über" passt */
const GRUND: Record<string, string> = {
  hanfplantage: 'den Gestank der Hanfplantage',
  growhaus: 'das lila Licht aus dem Grow-Haus',
  stripclub: 'den Lärm aus dem Stripclub',
  bordell: 'das Rotlicht im Puff nebenan',
  casino: 'die Limousinen und Spieler vor dem Casino',
  spielhalle: 'die Spielhalle mit ihren Dauergästen',
  gangtreff: 'die Gang an der Ecke',
  drogenlabor: 'den Rauch aus dem Drogenlabor',
  hehlerei: 'den Schrottplatz mit der Hehlerei',
  schmuggellager: 'die nächtlichen Lastwagen am Schmugglerlager',
  waschsalon: 'die seltsamen Kunden im Waschsalon',
  wettbuero: 'die Schlägereien vor dem Wettbüro',
  rotlichtbar: 'die Rotlicht-Bar mit ihren Gästen',
  schwarzmarkt: 'den Schwarzmarkt um die Ecke',
  fabrik: 'den Qualm der Fabrik',
  brauerei: 'den Gestank der Brauerei',
  lagerhalle: 'den Lastwagenverkehr an der Lagerhalle',
  tankstelle: 'den Benzingeruch der Tankstelle',
  werkstatt: 'den Lärm der Werkstatt',
}

export interface Wohnlage {
  /** 0 bis 100 */
  wert: number
  parts: Part[]
  /** der schlimmste Störfaktor, lesbar – oder null, wenn nichts stört */
  grund: string | null
}

const mitte = (placed: Placed) => {
  const def = buildingDef(placed.type)
  const [w, h] = def ? footprint(def, placed.rot) : [1, 1]
  return { x: placed.x + w / 2, y: placed.y + h / 2 }
}

/** Ist das ein Haus, in dem Menschen wohnen (oder wohnten)? */
export function istWohnhaus(placed: Placed): boolean {
  const def = buildingDef(placed.type)
  return !!def && def.category === 'wohnen' && (def.effects.capacity ?? 0) > 0
}

/**
 * Die Wohnlage eines Hauses. `stimmung` ist die Stimmung der ganzen Stadt – sie wird
 * einmal gerechnet und hier hereingereicht, damit die Rechnung nicht im Kreis läuft.
 */
export function wohnlageVon(city: CityState, placed: Placed, stimmung: number): Wohnlage {
  const parts: Part[] = [{ label: 'Stimmung in der Stadt', value: stimmung }]
  const m = mitte(placed)

  const krim = kriminalitaetBei(city, m.x, m.y)
  if (krim >= 10) parts.push({ label: 'Kriminalität im Viertel', value: -Math.round(krim * 0.45) })

  // Polizei in Reichweite nimmt den dunklen Nachbarn einen Teil ihres Schreckens
  const schutz = 1 - 0.4 * abdeckungBei(city, m.x, m.y, 'police')

  let dunkel = 0
  let dreck = 0
  let gruen = 0
  let ruinen = 0
  let schlimmstes = 0
  let grund: string | null = null
  const merke = (wert: number, text: string) => {
    if (wert < schlimmstes) {
      schlimmstes = wert
      grund = text
    }
  }

  for (const other of city.buildings) {
    if (other.id === placed.id) continue
    const def = buildingDef(other.type)
    if (!def) continue
    const o = mitte(other)
    const d = Math.hypot(o.x - m.x, o.y - m.y)
    if (d > 4) continue
    const e = effectsOf(def, other.level)

    if (def.category === 'wohnen' && other.verlassen) {
      if (d <= RUINEN_REICHWEITE) {
        const wert = -4 * (1 - d / (RUINEN_REICHWEITE + 1))
        ruinen += wert
        merke(wert, 'die verlassene Ruine nebenan')
      }
      continue
    }
    if (def.category === 'unterwelt') {
      if (d <= 4) {
        const wert = -(7 + (e.crime ?? 0) * 0.6) * (1 - d / 5) * schutz
        dunkel += wert
        merke(wert, GRUND[def.id] ?? `${def.name} nebenan`)
      }
      continue
    }
    if ((e.environment ?? 0) < 0 && d <= 3) {
      const wert = (e.environment ?? 0) * 0.6 * (1 - d / 4)
      dreck += wert
      merke(wert, GRUND[def.id] ?? `den Dreck von ${def.name}`)
      continue
    }
    if ((def.category === 'natur' || def.id === 'park') && d <= 3) {
      gruen += Math.max(0.5, (e.happiness ?? 1) * 0.35) * (1 - d / 4)
    }
  }

  if (dunkel < 0) parts.push({ label: 'Dunkle Nachbarschaft', value: Math.max(-40, Math.round(dunkel)) })
  if (dreck < 0) parts.push({ label: 'Dreck und Lärm', value: Math.max(-20, Math.round(dreck)) })
  if (gruen > 0) parts.push({ label: 'Grün in der Nähe', value: Math.min(12, Math.round(gruen)) })
  if (ruinen < 0) parts.push({ label: 'Ruinen nebenan', value: Math.max(-12, Math.round(ruinen)) })

  const wert = Math.max(0, Math.min(100, parts.reduce((s, p) => s + p.value, 0)))
  // Ist die ganze Stadt schlecht gelaunt, ist das der Grund – auch ohne dunklen Nachbarn
  if (!grund && stimmung < BESCHWERDE_AB) grund = 'die miese Stimmung in der Stadt'
  if (!grund && krim >= 30) grund = 'die Kriminalität im Viertel'
  return { wert, parts, grund }
}

export interface LeerstandSchritt {
  city: CityState
  /** was passiert ist, in Sätzen für Meldungen */
  meldungen: string[]
}

/** "Wohnhaus (4|7)" – damit man das Haus auf der Karte findet */
export const hausName = (placed: Placed): string => `${buildingDef(placed.type)?.name ?? placed.type} (${placed.x}|${placed.y})`

/**
 * Ein Schritt: Beschwerden beginnen, enden oder werden zum Auszug. Höchstens `maxAuszuege`
 * Häuser auf einmal, damit es nicht wie ein Erdrutsch wirkt – Menschen gehen nach und nach.
 */
export function leerstandSchritt(city: CityState, now: number, stimmung: number, maxAuszuege = 2): LeerstandSchritt {
  if (city.population <= 0) return { city, meldungen: [] }
  const meldungen: string[] = []
  let kapazitaet = 0
  for (const placed of city.buildings) {
    const def = buildingDef(placed.type)
    if (def && istWohnhaus(placed) && !placed.verlassen) kapazitaet += effectsOf(def, placed.level).capacity ?? 0
  }
  const belegung = kapazitaet > 0 ? Math.min(1, city.population / kapazitaet) : 0

  let auszuege = 0
  let neueBeschwerden = 0
  let population = city.population
  let geaendert = false
  const buildings = city.buildings.map((placed) => {
    if (!istWohnhaus(placed) || placed.verlassen) return placed
    const lage = wohnlageVon(city, placed, stimmung)

    if (placed.beschwerde) {
      if (lage.wert >= BERUHIGT_AB) {
        geaendert = true
        meldungen.push(`🙂 ${hausName(placed)}: Die Bewohner haben sich beruhigt.`)
        const { beschwerde: _weg, ...ruhig } = placed
        return ruhig
      }
      if (now - placed.beschwerde.seit >= AUSZUG_NACH && auszuege < maxAuszuege) {
        auszuege++
        geaendert = true
        const def = buildingDef(placed.type)!
        const bewohner = Math.round((effectsOf(def, placed.level).capacity ?? 0) * belegung)
        population = Math.max(0, population - bewohner)
        meldungen.push(
          `🏚️ ${hausName(placed)}: Die Bewohner sind ausgezogen – sie haben sich zu lange über ${placed.beschwerde.grund} beschwert. Das Haus steht jetzt leer.`,
        )
        const { beschwerde: _weg, ...leer } = placed
        return { ...leer, verlassen: now }
      }
      return placed
    }

    if (lage.wert < BESCHWERDE_AB && neueBeschwerden < 3) {
      neueBeschwerden++
      geaendert = true
      const grund = lage.grund ?? 'die Zustände im Viertel'
      meldungen.push(`😠 ${hausName(placed)}: Die Bewohner beschweren sich über ${grund}.`)
      return { ...placed, beschwerde: { seit: now, grund } }
    }
    return placed
  })

  if (!geaendert) return { city, meldungen }
  return { city: { ...city, buildings, population }, meldungen }
}

/** Wie viele Häuser leer stehen */
export const leerstandVon = (city: CityState): number => city.buildings.filter((b) => !!b.verlassen).length

/** Wie viele Häuser sich gerade beschweren */
export const beschwerdenVon = (city: CityState): number => city.buildings.filter((b) => !!b.beschwerde && !b.verlassen).length
