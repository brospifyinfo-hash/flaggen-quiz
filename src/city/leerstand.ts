// Beschwerden und Leerstand. Jedes Wohnhaus hat eine eigene Wohnlage: die Stimmung der
// Stadt, dazu was ringsum steht – Stripclub, Plantage und Drogenlabor drücken sie, Grün
// und Polizei heben sie. Sinkt die Wohnlage zu tief, beschweren sich die Bewohner erst
// eine Weile; ändert sich nichts, ziehen sie aus. Das Haus bleibt stehen und verfällt.
import { buildingDef, effectsOf, footprint } from './catalog'
import { abdeckungBei, kriminalitaetBei } from './society'
import type { CityState, Part, Placed } from './types'

/** Unter dieser Wohnlage beginnen die Beschwerden */
export const BESCHWERDE_AB = 35
/** Ab dieser Wohnlage beruhigen sich die Bewohner wieder */
export const BERUHIGT_AB = 45
/** So lange wird sich beschwert, bevor die Bewohner wirklich ausziehen */
export const AUSZUG_NACH = 6 * 60 * 1000
/** Ein Auszug drückt die Stimmung der Nachbarn – so weit reicht die Ruine */
export const RUINEN_REICHWEITE = 2
/** Mehr als dieser Anteil der Häuser steht nie leer – irgendwo müssen die Leute ja wohnen */
export const LEERSTAND_MAX = 0.12

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
  // Die Stadtstimmung zählt nur zur Hälfte: Ob jemand auszieht, entscheidet die
  // Nachbarschaft, nicht die Laune der ganzen Stadt – dafür gibt es den Wegzug bei
  // schlechter Stimmung schon an anderer Stelle
  const parts: Part[] = [{ label: 'Stimmung in der Stadt', value: Math.round(50 + (stimmung - 50) * 0.5) }]
  const m = mitte(placed)

  const krim = kriminalitaetBei(city, m.x, m.y)
  if (krim >= 20) parts.push({ label: 'Kriminalität im Viertel', value: -Math.min(15, Math.round((krim - 20) * 0.25)) })

  // Polizei in Reichweite nimmt den dunklen Nachbarn einen Teil ihres Schreckens
  const schutz = 1 - 0.4 * abdeckungBei(city, m.x, m.y, 'police')

  let dunkel = 0
  let dreck = 0
  let gruen = 0
  let ruinen = 0
  let schlimmstes = 0
  let grund: string | null = null
  const merke = (wert: number, text: string) => {
    // Ein Störenfried am Rand der Reichweite ist kein Grund zum Auszug
    if (wert < schlimmstes && wert <= -5) {
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
      // Ruinen stören, aber sie reißen nicht das nächste Haus mit – sonst kippt ein Viertel
      // wie Dominosteine. Sie zählen deshalb nicht als Grund für eine Beschwerde.
      if (d <= RUINEN_REICHWEITE) ruinen += -2 * (1 - d / (RUINEN_REICHWEITE + 1))
      continue
    }
    if (def.category === 'unterwelt') {
      if (d <= 3.5) {
        const wert = -(6 + (e.crime ?? 0) * 0.5) * (1 - d / 4.5) * schutz
        dunkel += wert
        merke(wert, GRUND[def.id] ?? `${def.name} nebenan`)
      }
      continue
    }
    if ((e.environment ?? 0) < 0 && d <= 2.5) {
      const wert = (e.environment ?? 0) * 0.5 * (1 - d / 3.5)
      dreck += wert
      merke(wert, GRUND[def.id] ?? `den Dreck von ${def.name}`)
      continue
    }
    if ((def.category === 'natur' || def.id === 'park') && d <= 3) {
      gruen += Math.max(0.5, (e.happiness ?? 1) * 0.35) * (1 - d / 4)
    }
  }

  if (dunkel < 0) parts.push({ label: 'Dunkle Nachbarschaft', value: Math.max(-35, Math.round(dunkel)) })
  if (dreck < 0) parts.push({ label: 'Dreck und Lärm', value: Math.max(-15, Math.round(dreck)) })
  if (gruen > 0) parts.push({ label: 'Grün in der Nähe', value: Math.min(12, Math.round(gruen)) })
  if (ruinen < 0) parts.push({ label: 'Ruinen nebenan', value: Math.max(-6, Math.round(ruinen)) })

  const wert = Math.max(0, Math.min(100, parts.reduce((s, p) => s + p.value, 0)))
  // Ohne einen greifbaren Störenfried in der Nachbarschaft gibt es keine Beschwerde:
  // Allgemeine Unzufriedenheit regelt der Wegzug bei schlechter Stimmung, nicht der Leerstand
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
export function leerstandSchritt(city: CityState, now: number, stimmung: number, maxAuszuege = 1): LeerstandSchritt {
  if (city.population <= 0) return { city, meldungen: [] }
  const meldungen: string[] = []
  let kapazitaet = 0
  let haeuser = 0
  let ruinen = 0
  for (const placed of city.buildings) {
    const def = buildingDef(placed.type)
    if (!def || !istWohnhaus(placed)) continue
    haeuser++
    if (placed.verlassen) ruinen++
    else kapazitaet += effectsOf(def, placed.level).capacity ?? 0
  }
  const belegung = kapazitaet > 0 ? Math.min(1, city.population / kapazitaet) : 0
  // Es darf nie mehr als ein Fünftel der Häuser leer stehen – ab da bleiben die Leute
  // murrend wohnen, bis sich etwas bessert
  const auszugErlaubt = ruinen < Math.max(1, Math.floor(haeuser * LEERSTAND_MAX))

  let auszuege = 0
  let neueBeschwerden = 0
  let population = city.population
  let geaendert = false
  const buildings = city.buildings.map((placed) => {
    if (!istWohnhaus(placed) || placed.verlassen) return placed
    const lage = wohnlageVon(city, placed, stimmung)

    if (placed.beschwerde) {
      // Der Anlass ist weg oder die Lage hat sich erholt: Ruhe kehrt ein
      if (lage.wert >= BERUHIGT_AB || !lage.grund) {
        geaendert = true
        meldungen.push(`🙂 ${hausName(placed)}: Die Bewohner haben sich beruhigt.`)
        const { beschwerde: _weg, ...ruhig } = placed
        return ruhig
      }
      if (auszugErlaubt && now - placed.beschwerde.seit >= AUSZUG_NACH && auszuege < maxAuszuege) {
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

    // Beschwert wird sich nur über einen konkreten Nachbarn – und nicht alle auf einmal
    if (lage.wert < BESCHWERDE_AB && lage.grund && neueBeschwerden < 2) {
      neueBeschwerden++
      geaendert = true
      meldungen.push(`😠 ${hausName(placed)}: Die Bewohner beschweren sich über ${lage.grund}.`)
      return { ...placed, beschwerde: { seit: now, grund: lage.grund } }
    }
    return placed
  })

  if (!geaendert) return { city, meldungen }
  return { city: { ...city, buildings, population }, meldungen }
}

/**
 * Reparatur für Stände aus der ersten Fassung des Leerstands: Dort kippten ganze Viertel
 * auf einmal. Alle Ruinen werden wieder bewohnbar, Beschwerden gelöscht, und die
 * Ausgezogenen kommen zurück.
 */
export function leerstandZuruecksetzen(city: CityState): CityState {
  let zurueck = 0
  const buildings = city.buildings.map((placed) => {
    if (!placed.verlassen && !placed.beschwerde) return placed
    const def = buildingDef(placed.type)
    if (placed.verlassen && def) zurueck += effectsOf(def, placed.level).capacity ?? 0
    const { verlassen: _v, beschwerde: _b, ...frisch } = placed
    return frisch
  })
  if (zurueck === 0 && buildings.every((b, i) => b === city.buildings[i])) return city
  return { ...city, buildings, population: city.population + Math.round(zurueck * 0.85) }
}

/** Wie viele Häuser leer stehen */
export const leerstandVon = (city: CityState): number => city.buildings.filter((b) => !!b.verlassen).length

/** Wie viele Häuser sich gerade beschweren */
export const beschwerdenVon = (city: CityState): number => city.buildings.filter((b) => !!b.beschwerde && !b.verlassen).length
