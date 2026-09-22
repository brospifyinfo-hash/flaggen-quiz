// Leben in der Stadt. Niemand läuft ziellos herum: Jeder Weg beginnt an einer Haustür
// und endet an einer – zur Arbeit, zum Einkaufen, zur Schule, in den Park und wieder
// nach Hause. Gegangen wird über das Straßennetz, gefunden mit einer Breitensuche.
// Autos fahren auf ihrer Spur und parken am Ziel; Fußgänger nehmen den Gehweg.
//
// Dazu kommen Einsätze: Brände, Einbrüche, Notfälle, Razzien. Die nächste Wache mit
// Weg dorthin rückt aus – mit Blaulicht. Ohne Wache in Reichweite dauert alles länger.
import { eingangVon } from './bau'
import { einzug } from './buildings'
import { buildingDef, footprint, type BuildingDef, type Klasse } from './catalog'
import { BAUARTEN, MODELLE_NACH_KLASSE, type Modell, type Pose, type Rolle } from './figures'
import { gesellschaft, kriminalitaetBei } from './society'
import { roadAt, seiteZurStrasse, tilesOf, zugangVon, razziaMoeglich } from './state'
import type { CityState, Placed } from './types'

export type Art = 'fuss' | 'rad' | 'auto' | 'dienst'

export interface Agent {
  id: number
  art: Art
  rolle: Rolle
  klasse: Klasse
  seed: number
  modell?: Modell
  farbe: string
  /** Wegpunkte auf der Karte */
  weg: { x: number; y: number }[]
  /** welche Wegpunkte Straßenmitten sind – dort gilt die Spur */
  strasse: boolean[]
  i: number
  t: number
  /** Kacheln je Sekunde */
  tempo: number
  /** seitlicher Abstand von der Straßenmitte, rechts der Fahrtrichtung */
  spur: number
  zustand: 'unterwegs' | 'drinnen' | 'vorOrt' | 'ruht'
  /** Sekunden, die der jetzige Zustand noch dauert */
  warte: number
  hin?: string
  heim?: string
  zurueck: boolean
  einsatz?: number
  licht?: boolean
  pose?: Pose
  x: number
  y: number
  rx: number
  ry: number
}

export interface Einsatz {
  id: number
  art: 'feuer' | 'einbruch' | 'notfall' | 'razzia'
  ort: string
  seit: number
  /** bis wann es ohne Hilfe von selbst endet */
  bis: number
  zustand: 'offen' | 'anfahrt' | 'vorOrt' | 'fertig'
  helfer: number[]
  mitHilfe: boolean
}

export type Ereignis =
  | { art: 'meldung'; text: string; ort?: string }
  | { art: 'razzia'; ort: string; text: string }

type Kachel = { x: number; y: number }

interface Ort {
  placed: Placed
  def: BuildingDef
  zugang: Kachel
  tuer: Kachel
  art: 'wohnen' | 'arbeit' | 'laden' | 'schule' | 'freizeit' | 'wache' | 'unterwelt'
  gewicht: number
}

export interface Life {
  agents: Agent[]
  einsaetze: Einsatz[]
  signature: string
  /** Stand der Straßen – ändern sie sich, gelten alte Wege nicht mehr */
  wegeStand: string
  orte: Map<string, Ort>
  wege: Map<string, Kachel[] | null>
  uhr: number
  naechsteFahrt: number
  naechsterEinsatz: number
  naechsteId: number
}

const pick = <T>(liste: readonly T[]): T => liste[Math.floor(Math.random() * liste.length)]
function gewichtet<T>(liste: T[], gewicht: (e: T) => number): T | null {
  const summe = liste.reduce((s, e) => s + Math.max(0, gewicht(e)), 0)
  if (summe <= 0) return null
  let r = Math.random() * summe
  for (const e of liste) {
    r -= Math.max(0, gewicht(e))
    if (r <= 0) return e
  }
  return liste[liste.length - 1]
}

export const signatureOf = (city: CityState) =>
  `${city.buildings.length}:${city.buildings.map((b) => `${b.id}${b.x}${b.y}${b.rot}${b.level}${b.verlassen ? 'v' : ''}`).join(',')}:${Object.keys(city.roads).length}:${city.population}:${city.land}`

const wegeStandOf = (city: CityState) => Object.keys(city.roads).sort().join('|')

// ---------------------------------------------------------------------------
// Wege
// ---------------------------------------------------------------------------

/** Breitensuche über das Straßennetz. Autos meiden Fußwege. */
function suche(city: CityState, start: Kachel, ziel: Kachel, auto: boolean): Kachel[] | null {
  const key = (x: number, y: number) => y * 4096 + x
  const zielKey = key(ziel.x, ziel.y)
  const vorher = new Map<number, number>()
  vorher.set(key(start.x, start.y), -1)
  const schlange: Kachel[] = [start]
  let kopf = 0
  while (kopf < schlange.length) {
    const k = schlange[kopf++]
    if (key(k.x, k.y) === zielKey) {
      const weg: Kachel[] = []
      let c: number = zielKey
      while (c !== -1) {
        weg.push({ x: c % 4096, y: Math.floor(c / 4096) })
        c = vorher.get(c) ?? -1
      }
      return weg.reverse()
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = k.x + dx
      const ny = k.y + dy
      const typ = roadAt(city, nx, ny)
      if (!typ || (auto && typ === 'weg')) continue
      const nk = key(nx, ny)
      if (vorher.has(nk)) continue
      vorher.set(nk, key(k.x, k.y))
      schlange.push({ x: nx, y: ny })
    }
  }
  return null
}

function weg(life: Life, city: CityState, a: Kachel, b: Kachel, auto: boolean): Kachel[] | null {
  const k = `${a.x}:${a.y}>${b.x}:${b.y}${auto ? 'A' : 'F'}`
  if (life.wege.has(k)) return life.wege.get(k) ?? null
  const gefunden = suche(city, a, b, auto)
  if (life.wege.size > 600) life.wege.clear()
  life.wege.set(k, gefunden)
  return gefunden
}

// ---------------------------------------------------------------------------
// Orte
// ---------------------------------------------------------------------------

const FREIZEIT = new Set(['park', 'teich', 'brunnen', 'platz', 'kino', 'museum', 'theater', 'cafe', 'eisdiele', 'bar', 'club', 'fitness', 'statue', 'sternwarte', 'weltzentrum', 'einkaufszentrum'])

function ortVon(city: CityState, placed: Placed): Ort | null {
  const def = buildingDef(placed.type)
  if (!def) return null
  // In eine Ruine geht niemand hinein, und niemand kommt heraus
  if (placed.verlassen) return null
  const zugang = zugangVon(city, placed)
  if (!zugang) return null
  const [w, h] = footprint(def, placed.rot)
  const vorn = seiteZurStrasse(city, placed)
  const tuer = eingangVon({ x: placed.x, y: placed.y, w, h }, def.look.stil, vorn, placed.level, einzug(def.look, placed.level))
  const e = def.effects
  // Bäume, Bänke und Blumen sind kein Ziel – dort bleibt man nicht, man geht vorbei
  if ((def.category === 'natur' || def.category === 'schmuck') && !FREIZEIT.has(def.id)) return null
  let art: Ort['art'] = 'arbeit'
  let gewicht = e.jobs ?? 1
  if (def.category === 'wohnen') {
    art = 'wohnen'
    gewicht = e.capacity ?? 1
  } else if (def.category === 'unterwelt') {
    art = 'unterwelt'
    gewicht = 1
  } else if (e.police || e.fire || e.health) {
    art = 'wache'
  } else if (FREIZEIT.has(def.id)) {
    art = 'freizeit'
    gewicht = 2 + (e.happiness ?? 0) / 3
  } else if (def.category === 'bildung') {
    art = 'schule'
    gewicht = 1 + (e.education ?? 0) / 4
  } else if (def.category === 'handel') {
    art = 'laden'
    gewicht = 1 + (e.income ?? 0) / 10
  }
  return { placed, def, zugang, tuer, art, gewicht }
}

// ---------------------------------------------------------------------------
// Aufbau und Anpassung
// ---------------------------------------------------------------------------

export function createLife(city: CityState): Life {
  const life: Life = {
    agents: [],
    einsaetze: [],
    signature: '',
    wegeStand: '',
    orte: new Map(),
    wege: new Map(),
    uhr: 0,
    naechsteFahrt: 0.4,
    naechsterEinsatz: 9,
    naechsteId: 1,
  }
  anpassen(life, city)
  // Beim Öffnen ist schon etwas los: ein paar Wege fangen mittendrin an
  const g = gesellschaft(city)
  const ziel = zielZahl(city)
  for (let i = 0; i < Math.round(ziel * 0.6); i++) {
    const a = neueFahrt(life, city, g.klassen)
    if (a) {
      a.i = Math.floor(Math.random() * Math.max(1, a.weg.length - 2))
      a.t = Math.random()
    }
  }
  return life
}

/** Wie viele gleichzeitig unterwegs sind – mit der Stadt wächst der Verkehr */
const zielZahl = (city: CityState) => Math.min(64, 5 + Math.round(city.population * 0.22))

/**
 * Die Stadt hat sich verändert: Orte neu bestimmen, wer sein Ziel oder seinen Weg
 * verloren hat, geht nach Hause – statt durch eine neue Wand zu laufen.
 */
export function anpassen(life: Life, city: CityState): void {
  life.signature = signatureOf(city)
  const stand = wegeStandOf(city)
  const wegeNeu = stand !== life.wegeStand
  if (wegeNeu) {
    life.wege.clear()
    life.wegeStand = stand
  }
  life.orte.clear()
  for (const placed of city.buildings) {
    const ort = ortVon(city, placed)
    if (ort) life.orte.set(placed.id, ort)
  }
  const gibtEs = new Set(city.buildings.map((b) => b.id))
  life.agents = life.agents.filter((a) => {
    if (a.zustand === 'ruht') return false
    if (a.hin && !gibtEs.has(a.hin) && a.art !== 'dienst') return false
    if (a.heim && !gibtEs.has(a.heim) && a.art !== 'dienst') return false
    if (wegeNeu) {
      // Liegt der Rest des Weges noch auf Straßen?
      for (let i = a.i; i < a.weg.length; i++) {
        if (!a.strasse[i]) continue
        const p = a.weg[i]
        if (!roadAt(city, Math.floor(p.x), Math.floor(p.y))) return false
      }
    }
    return true
  })
  life.einsaetze = life.einsaetze.filter((e) => gibtEs.has(e.ort) || e.zustand === 'fertig')
  verweilende(life, city)
}

/** Menschen, die sich an einem Ort aufhalten – nie in einem Haus, immer davor oder im Freien */
function verweilende(life: Life, city: CityState): void {
  const g = gesellschaft(city)
  const neu = (x: number, y: number, rolle: Rolle, klasse: Klasse, pose: Pose, blickX = 1, blickY = 0) => {
    const a: Agent = {
      id: life.naechsteId++,
      art: 'fuss',
      rolle,
      klasse,
      seed: Math.random() * 1000,
      farbe: '#ffffff',
      weg: [{ x, y }],
      strasse: [false],
      i: 0,
      t: 0,
      tempo: 0,
      spur: 0,
      zustand: 'ruht',
      warte: Infinity,
      zurueck: false,
      pose,
      x,
      y,
      rx: blickX,
      ry: blickY,
    }
    life.agents.push(a)
  }
  let obdachlos = Math.min(14, g.obdachlose)
  const plaetze: { x: number; y: number; art: 'bank' | 'park' | 'laden' }[] = []

  for (const placed of city.buildings) {
    const def = buildingDef(placed.type)
    if (!def) continue
    const [w, h] = footprint(def, placed.rot)
    const zufall = () => 0.15 + Math.random() * 0.7
    if (def.id === 'park') {
      const anzahl = 2 + Math.floor(Math.random() * 3)
      for (let i = 0; i < anzahl; i++) {
        const rolle = pick<Rolle>(['bewohner', 'kind', 'kind', 'senior', 'hundehalter', 'eltern', 'student'])
        neu(placed.x + zufall() * w, placed.y + zufall() * h, rolle, 'mittel', Math.random() < 0.3 ? 'sitzt' : 'steht', Math.random() < 0.5 ? 1 : -1, 0)
      }
      plaetze.push({ x: placed.x + 0.12, y: placed.y + h * 0.5, art: 'park' })
    } else if (def.id === 'platz' || def.id === 'brunnen' || def.id === 'statue') {
      if (Math.random() < 0.7) neu(placed.x + zufall(), placed.y + zufall(), pick<Rolle>(['bewohner', 'tourist', 'senior', 'student']), 'mittel', 'steht', 1, 0)
    } else if (def.id === 'bank') {
      plaetze.push({ x: placed.x + 0.5, y: placed.y + 0.55, art: 'bank' })
      if (Math.random() < 0.5) neu(placed.x + 0.5, placed.y + 0.5, pick<Rolle>(['senior', 'bewohner', 'student']), 'mittel', 'sitzt', 1, 0)
    } else if (def.category === 'handel' || def.category === 'unterwelt') {
      const ort = life.orte.get(placed.id)
      if (!ort) continue
      if (def.look.stil?.extras?.includes('tische')) {
        // Gäste an den Tischen vor dem Café – im Vorgarten, zur Straße hin
        for (let i = 0; i < 2; i++) {
          if (Math.random() < 0.3) continue
          const x = (ort.tuer.x + ort.zugang.x + 0.5) / 2 + (Math.random() - 0.5) * 0.3
          const y = (ort.tuer.y + ort.zugang.y + 0.5) / 2 + (Math.random() - 0.5) * 0.3
          neu(x, y, pick<Rolle>(['bewohner', 'student', 'tourist', 'senior']), 'mittel', 'sitzt', Math.random() < 0.5 ? 1 : -1, 0)
        }
      }
      if (def.category === 'unterwelt') {
        // Zwei stehen immer vor der Tür herum
        for (let i = 0; i < 2; i++) {
          neu(ort.tuer.x + (Math.random() - 0.5) * 0.4, ort.tuer.y + (Math.random() - 0.5) * 0.4, 'gangster', 'arm', 'steht', Math.random() < 0.5 ? 1 : -1, 0)
        }
      } else {
        plaetze.push({ x: ort.tuer.x, y: ort.tuer.y, art: 'laden' })
      }
    }
  }

  // Obdachlose: auf Bänken, am Parkrand, vor Ladentüren
  const gemischt = plaetze.sort(() => Math.random() - 0.5)
  for (const platz of gemischt) {
    if (obdachlos <= 0) break
    const pose: Pose = platz.art === 'laden' ? 'sitzt' : 'liegt'
    neu(platz.x + (Math.random() - 0.5) * 0.2, platz.y + (Math.random() - 0.5) * 0.2, 'obdachlos', 'arm', pose, Math.random() < 0.5 ? 1 : -1, 0)
    obdachlos--
  }
}

// ---------------------------------------------------------------------------
// Fahrten
// ---------------------------------------------------------------------------

/** Einen Weg von Tür zu Tür bauen: zur Straße, übers Netz, zur Zieltür */
function tuerZuTuer(life: Life, city: CityState, von: Ort, nach: Ort, auto: boolean): { weg: Kachel[]; strasse: boolean[] } | null {
  const netz = weg(life, city, von.zugang, nach.zugang, auto)
  if (!netz || netz.length === 0) return null
  const mitte = netz.map((k) => ({ x: k.x + 0.5, y: k.y + 0.5 }))
  if (auto) return { weg: mitte, strasse: mitte.map(() => true) }
  return {
    weg: [von.tuer, ...mitte, nach.tuer],
    strasse: [false, ...mitte.map(() => true), false],
  }
}

function neuerAgent(life: Life, teil: Partial<Agent> & Pick<Agent, 'art' | 'rolle' | 'klasse' | 'weg' | 'strasse' | 'tempo' | 'spur' | 'farbe'>): Agent {
  const a: Agent = {
    id: life.naechsteId++,
    seed: Math.random() * 1000,
    i: 0,
    t: 0,
    zustand: 'unterwegs',
    warte: 0,
    zurueck: false,
    x: teil.weg[0].x,
    y: teil.weg[0].y,
    rx: 1,
    ry: 0,
    ...teil,
  }
  life.agents.push(a)
  return a
}

/** Jemand macht sich auf den Weg – mit Grund und Ziel */
function neueFahrt(life: Life, city: CityState, klassen: Record<Klasse, number>): Agent | null {
  const orte = [...life.orte.values()]
  const heime = orte.filter((o) => o.art === 'wohnen')
  if (heime.length === 0) return null
  const heim = gewichtet(heime, (o) => o.gewicht)
  if (!heim) return null
  const klasse: Klasse = heim.def.effects.klasse ?? 'mittel'
  void klassen

  // Lieferverkehr: von Laden zu Laden, mit Transporter oder Lkw
  const laeden = orte.filter((o) => o.art === 'laden' || o.art === 'arbeit')
  if (laeden.length >= 2 && Math.random() < 0.08) {
    const von = pick(laeden)
    const nach = pick(laeden.filter((o) => o !== von))
    const pfad = tuerZuTuer(life, city, von, nach, true)
    if (!pfad || pfad.weg.length < 3) return null
    const modell: Modell = /fabrik|lager|brauerei/.test(von.def.id + nach.def.id) ? 'lkw' : Math.random() < 0.2 ? 'muell' : 'transporter'
    return neuerAgent(life, {
      art: 'auto',
      rolle: 'lieferant',
      klasse: 'mittel',
      modell,
      farbe: pick(BAUARTEN[modell].farben),
      ...pfad,
      tempo: 1.4,
      spur: 0.17,
      heim: von.placed.id,
      hin: nach.placed.id,
    })
  }

  // Wohin? Arbeit, Einkauf, Freizeit, Schule oder zu Besuch
  const schulen = orte.filter((o) => o.art === 'schule')
  const zweck = gewichtet(
    [
      { z: 'arbeit' as const, w: 0.34 },
      { z: 'laden' as const, w: 0.28 },
      { z: 'freizeit' as const, w: 0.22 },
      { z: 'schule' as const, w: schulen.length ? 0.12 : 0 },
      { z: 'wohnen' as const, w: 0.06 },
    ],
    (e) => e.w,
  )!.z
  const ziele = orte.filter((o) => (zweck === 'arbeit' ? o.art === 'arbeit' || o.art === 'laden' || o.art === 'wache' : o.art === zweck) && o !== heim)
  const ziel = gewichtet(ziele, (o) => o.gewicht / (1 + Math.hypot(o.zugang.x - heim.zugang.x, o.zugang.y - heim.zugang.y) * 0.15))
  if (!ziel) return null

  const fuss = tuerZuTuer(life, city, heim, ziel, false)
  if (!fuss) return null
  const laenge = fuss.weg.length

  // Rolle nach Zweck und Geldbeutel
  let rolle: Rolle = 'bewohner'
  if (zweck === 'schule') rolle = ziel.def.id === 'schule' ? 'kind' : 'student'
  else if (zweck === 'arbeit') rolle = /buero|buroturm|geldhaus|hotel|polizei/.test(ziel.def.id) ? 'geschaeft' : /fabrik|lager|werkstatt|tankstelle|brauerei/.test(ziel.def.id) ? 'arbeiter' : 'bewohner'
  else if (zweck === 'freizeit') rolle = ziel.def.id === 'park' ? pick<Rolle>(['jogger', 'hundehalter', 'eltern', 'senior', 'bewohner']) : pick<Rolle>(['bewohner', 'tourist', 'student', 'senior'])
  else if (zweck === 'laden') rolle = pick<Rolle>(['bewohner', 'eltern', 'senior', 'bewohner'])
  if (klasse === 'superreich') rolle = 'milliardaer'
  else if (klasse === 'reich' && Math.random() < 0.4) rolle = 'geschaeft'

  // Womit? Kurze Wege zu Fuß, lange mit dem Rad oder Auto – Reiche fahren fast immer
  const autoAnteil = klasse === 'superreich' ? 0.95 : klasse === 'reich' ? 0.8 : klasse === 'arm' ? 0.25 : 0.5
  const kinder = rolle === 'kind' || rolle === 'jogger' || rolle === 'hundehalter' || rolle === 'eltern'
  const mitAuto = !kinder && laenge > 6 && Math.random() < autoAnteil
  if (mitAuto) {
    const fahrt = tuerZuTuer(life, city, heim, ziel, true)
    if (fahrt && fahrt.weg.length >= 2) {
      let modell = pick(MODELLE_NACH_KLASSE[klasse])
      if (Math.random() < 0.05) modell = 'taxi'
      const schnell = modell === 'sport' || modell === 'super' ? 0.6 : 0
      return neuerAgent(life, {
        art: 'auto',
        rolle,
        klasse,
        modell,
        farbe: pick(BAUARTEN[modell].farben),
        ...fahrt,
        tempo: 1.6 + Math.random() * 0.5 + schnell,
        spur: 0.17,
        heim: heim.placed.id,
        hin: ziel.placed.id,
      })
    }
  }
  const mitRad = !kinder && laenge > 5 && Math.random() < (klasse === 'arm' ? 0.35 : 0.22)
  return neuerAgent(life, {
    art: mitRad ? 'rad' : 'fuss',
    rolle,
    klasse,
    farbe: '#ffffff',
    ...fuss,
    tempo: mitRad ? 0.95 + Math.random() * 0.3 : rolle === 'jogger' ? 0.8 : rolle === 'senior' ? 0.3 : 0.42 + Math.random() * 0.12,
    spur: mitRad ? 0.27 : (Math.random() < 0.5 ? 1 : -1) * 0.36,
    heim: heim.placed.id,
    hin: ziel.placed.id,
  })
}

// ---------------------------------------------------------------------------
// Einsätze
// ---------------------------------------------------------------------------

const DIENST: Record<Einsatz['art'], { effekt: 'police' | 'fire' | 'health'; modell: Modell; rolle: Rolle; dauer: number; ohne: number }> = {
  feuer: { effekt: 'fire', modell: 'feuerwehr', rolle: 'feuerwehr', dauer: 9, ohne: 32 },
  einbruch: { effekt: 'police', modell: 'polizei', rolle: 'polizist', dauer: 6, ohne: 14 },
  notfall: { effekt: 'health', modell: 'rettung', rolle: 'sanitaeter', dauer: 7, ohne: 22 },
  razzia: { effekt: 'police', modell: 'polizei', rolle: 'polizist', dauer: 8, ohne: 0 },
}

const namensGenitiv = (def: BuildingDef) => def.name

function einsatzText(e: Einsatz, def: BuildingDef, stufe: 'beginn' | 'hilfe' | 'ende'): string {
  const n = namensGenitiv(def)
  if (e.art === 'feuer') {
    if (stufe === 'beginn') return e.helfer.length ? `🔥 Brand: ${n} – die Feuerwehr rückt aus.` : `🔥 Brand: ${n} – keine Feuerwehr in Reichweite!`
    return e.mitHilfe ? `🚒 Das Feuer bei ${n} ist gelöscht.` : `🔥 Das Feuer bei ${n} ist von selbst ausgegangen – eine Feuerwache hätte geholfen.`
  }
  if (e.art === 'einbruch') {
    if (stufe === 'beginn') return e.helfer.length ? `🚨 Einbruch: ${n} – die Polizei ist unterwegs.` : `🚨 Einbruch: ${n} – keine Polizei in Reichweite!`
    return e.mitHilfe ? `🚓 Die Einbrecher bei ${n} sind gefasst.` : `🦹 Die Einbrecher bei ${n} sind entkommen.`
  }
  if (e.art === 'notfall') {
    if (stufe === 'beginn') return e.helfer.length ? `🚑 Notfall: ${n} – der Rettungswagen kommt.` : `🚑 Notfall: ${n} – kein Rettungswagen in Reichweite!`
    return e.mitHilfe ? `🏥 Der Notfall bei ${n} ist versorgt.` : `🚑 Beim Notfall (${n}) hat es lange gedauert – ein Krankenhaus hätte geholfen.`
  }
  return stufe === 'beginn' ? `🚔 Razzia: Die Polizei rückt bei ${n} an.` : `🚔 Razzia: ${n} ist ausgehoben.`
}

/** Die nächste Wache der passenden Art, die auf der Straße hinkommt */
function naechsteWache(life: Life, city: CityState, art: Einsatz['art'], ziel: Ort): { wache: Ort; weg: Kachel[] } | null {
  const effekt = DIENST[art].effekt
  let best: { wache: Ort; weg: Kachel[] } | null = null
  for (const ort of life.orte.values()) {
    const reichweite = ort.def.effects[effekt] ?? 0
    if (!reichweite) continue
    const d = Math.hypot(ort.zugang.x - ziel.zugang.x, ort.zugang.y - ziel.zugang.y)
    // Außerhalb der Reichweite fährt man nicht hin – dafür ist eine andere Wache da
    if (d > reichweite + 1) continue
    const w = weg(life, city, ort.zugang, ziel.zugang, true)
    if (!w) continue
    if (!best || w.length < best.weg.length) best = { wache: ort, weg: w }
  }
  return best
}

function einsatzStarten(life: Life, city: CityState, art: Einsatz['art'], ort: Ort, ereignisse: Ereignis[]): void {
  if (life.einsaetze.some((e) => e.ort === ort.placed.id && e.zustand !== 'fertig')) return
  const d = DIENST[art]
  const e: Einsatz = {
    id: life.naechsteId++,
    art,
    ort: ort.placed.id,
    seit: life.uhr,
    bis: life.uhr + d.ohne,
    zustand: 'offen',
    helfer: [],
    mitHilfe: false,
  }
  const wagen = art === 'razzia' ? 2 : 1
  const hilfe = naechsteWache(life, city, art, ort)
  if (hilfe) {
    for (let i = 0; i < wagen; i++) {
      const pfad = hilfe.weg.map((k) => ({ x: k.x + 0.5, y: k.y + 0.5 }))
      const a = neuerAgent(life, {
        art: 'dienst',
        rolle: d.rolle,
        klasse: 'mittel',
        modell: d.modell,
        farbe: BAUARTEN[d.modell].farben[0],
        weg: pfad,
        strasse: pfad.map(() => true),
        tempo: 2.6 + i * 0.1,
        spur: 0.17,
        heim: hilfe.wache.placed.id,
        hin: ort.placed.id,
        einsatz: e.id,
        licht: true,
      })
      // Der zweite Wagen fährt ein Stück hinterher
      a.t = -0.8 * i
      e.helfer.push(a.id)
    }
    e.zustand = 'anfahrt'
  } else if (art === 'razzia') {
    return
  }
  life.einsaetze.push(e)
  ereignisse.push({ art: 'meldung', text: einsatzText(e, ort.def, 'beginn'), ort: ort.placed.id })
}

/** Ab und zu passiert etwas – je nach Stadt mehr oder weniger */
function einsaetzePruefen(life: Life, city: CityState, ereignisse: Ereignis[]): void {
  if (life.einsaetze.filter((e) => e.zustand !== 'fertig').length >= 3) return
  const g = gesellschaft(city)
  const orte = [...life.orte.values()]
  const mitKoerper = orte.filter((o) => !['natur', 'schmuck', 'wege'].includes(o.def.category))
  if (mitKoerper.length === 0) return

  if (Math.random() < 0.22 * Math.min(1, mitKoerper.length / 18) * (1 - 0.5 * g.abdeckung.feuer)) {
    einsatzStarten(life, city, 'feuer', pick(mitKoerper), ereignisse)
    return
  }
  if (Math.random() < (g.kriminalitaet / 100) * 0.55) {
    const ziele = orte.filter((o) => o.art === 'wohnen' || o.art === 'laden')
    const ziel = gewichtet(ziele, (o) => 1 + kriminalitaetBei(city, o.placed.x, o.placed.y))
    if (ziel) einsatzStarten(life, city, 'einbruch', ziel, ereignisse)
    return
  }
  if (Math.random() < Math.min(0.35, city.population / 420)) {
    const heime = orte.filter((o) => o.art === 'wohnen')
    if (heime.length) einsatzStarten(life, city, 'notfall', pick(heime), ereignisse)
    return
  }
  const dunkel = orte.filter((o) => o.art === 'unterwelt' && razziaMoeglich(city, o.placed))
  if (dunkel.length && Math.random() < 0.3) einsatzStarten(life, city, 'razzia', pick(dunkel), ereignisse)
}

// ---------------------------------------------------------------------------
// Bewegung
// ---------------------------------------------------------------------------

/** Wo steht jemand gerade – auf seiner Spur, an Ecken weich übergeblendet */
function lage(a: Agent): void {
  const n = a.weg.length
  if (n === 1) {
    a.x = a.weg[0].x
    a.y = a.weg[0].y
    return
  }
  const i = Math.max(0, Math.min(n - 2, a.i))
  const t = Math.max(0, Math.min(1, a.t))
  const p = a.weg[i]
  const q = a.weg[i + 1]
  const dx = q.x - p.x
  const dy = q.y - p.y
  const l = Math.hypot(dx, dy) || 1
  const rx = dx / l
  const ry = dy / l
  // rechts der Fahrtrichtung
  let nx = -ry
  let ny = rx
  let spur = a.strasse[i] && a.strasse[i + 1] ? a.spur : 0
  if (i > 0 && t < 0.35) {
    // Übergang aus dem letzten Stück
    const o = a.weg[i - 1]
    const ol = Math.hypot(p.x - o.x, p.y - o.y) || 1
    const pnx = -(p.y - o.y) / ol
    const pny = (p.x - o.x) / ol
    const vorherSpur = a.strasse[i - 1] && a.strasse[i] ? a.spur : 0
    const f = t / 0.35
    nx = pnx + (nx - pnx) * f
    ny = pny + (ny - pny) * f
    const nl = Math.hypot(nx, ny) || 1
    nx /= nl
    ny /= nl
    spur = vorherSpur + (spur - vorherSpur) * f
  }
  a.x = p.x + dx * t + nx * spur
  a.y = p.y + dy * t + ny * spur
  a.rx = rx
  a.ry = ry
}

function umkehren(a: Agent): void {
  a.weg = [...a.weg].reverse()
  a.strasse = [...a.strasse].reverse()
  a.i = 0
  a.t = 0
  a.zurueck = true
}

/** Ein Zeitschritt. Gibt zurück, was passiert ist – für Meldungen und Razzien. */
export function stepLife(life: Life, city: CityState, dt: number): Ereignis[] {
  const ereignisse: Ereignis[] = []
  life.uhr += dt

  // Neue Wege, bis genug los ist
  life.naechsteFahrt -= dt
  if (life.naechsteFahrt <= 0) {
    life.naechsteFahrt = 0.25 + Math.random() * 0.9
    const unterwegs = life.agents.filter((a) => a.zustand !== 'ruht' && a.art !== 'dienst').length
    if (unterwegs < zielZahl(city)) neueFahrt(life, city, gesellschaft(city).klassen)
  }

  life.naechsterEinsatz -= dt
  if (life.naechsterEinsatz <= 0) {
    life.naechsterEinsatz = 8 + Math.random() * 10
    einsaetzePruefen(life, city, ereignisse)
  }

  const weg: number[] = []
  for (const a of life.agents) {
    if (a.zustand === 'ruht') continue
    if (a.zustand === 'drinnen' || a.zustand === 'vorOrt') {
      a.warte -= dt
      if (a.warte > 0) continue
      if (a.zustand === 'vorOrt' && a.einsatz !== undefined) {
        const e = life.einsaetze.find((x) => x.id === a.einsatz)
        if (e && e.zustand !== 'fertig') {
          e.zustand = 'fertig'
          e.mitHilfe = true
          const def = buildingDef(city.buildings.find((b) => b.id === e.ort)?.type ?? '')
          if (def) {
            if (e.art === 'razzia') ereignisse.push({ art: 'razzia', ort: e.ort, text: einsatzText(e, def, 'ende') })
            else ereignisse.push({ art: 'meldung', text: einsatzText(e, def, 'ende'), ort: e.ort })
          }
        }
        // Helfer steigen wieder ein
        life.agents = life.agents.filter((b) => !(b.zustand === 'ruht' && b.einsatz === a.einsatz))
        a.licht = false
      }
      if (a.zurueck) {
        weg.push(a.id)
        continue
      }
      umkehren(a)
      a.zustand = 'unterwegs'
      continue
    }

    // unterwegs
    const n = a.weg.length
    if (n < 2) {
      weg.push(a.id)
      continue
    }
    let rest = a.tempo * dt
    while (rest > 0 && a.i < n - 1) {
      const p = a.weg[a.i]
      const q = a.weg[a.i + 1]
      const l = Math.hypot(q.x - p.x, q.y - p.y) || 0.001
      const noch = (1 - a.t) * l
      if (rest < noch) {
        a.t += rest / l
        rest = 0
      } else {
        rest -= noch
        a.i++
        a.t = 0
      }
    }
    if (a.i >= n - 1) {
      a.i = n - 2
      a.t = 1
      lage(a)
      // angekommen
      if (a.art === 'dienst' && !a.zurueck) {
        a.zustand = 'vorOrt'
        const e = life.einsaetze.find((x) => x.id === a.einsatz)
        a.warte = DIENST[e?.art ?? 'einbruch'].dauer
        if (e && e.zustand === 'anfahrt') {
          e.zustand = 'vorOrt'
          // Zwei steigen aus und stehen am Wagen
          for (let k = 0; k < 2; k++) {
            const helfer: Agent = {
              id: life.naechsteId++,
              art: 'fuss',
              rolle: DIENST[e.art].rolle,
              klasse: 'mittel',
              seed: Math.random() * 1000,
              farbe: '#ffffff',
              weg: [{ x: a.x + a.ry * 0.35 * (k ? 1 : -1) + a.rx * 0.2, y: a.y - a.rx * 0.35 * (k ? 1 : -1) + a.ry * 0.2 }],
              strasse: [false],
              i: 0,
              t: 0,
              tempo: 0,
              spur: 0,
              zustand: 'ruht',
              warte: Infinity,
              zurueck: false,
              einsatz: e.id,
              pose: 'steht',
              x: 0,
              y: 0,
              rx: a.rx,
              ry: a.ry,
            }
            helfer.x = helfer.weg[0].x
            helfer.y = helfer.weg[0].y
            life.agents.push(helfer)
          }
        }
        continue
      }
      if (a.zurueck) {
        weg.push(a.id)
        continue
      }
      a.zustand = 'drinnen'
      a.warte = a.art === 'auto' ? 10 + Math.random() * 18 : 6 + Math.random() * 16
      continue
    }
    if (a.t >= 0) lage(a)
  }
  if (weg.length) {
    const raus = new Set(weg)
    life.agents = life.agents.filter((a) => !raus.has(a.id))
  }

  // Einsätze ohne Hilfe enden von selbst
  for (const e of life.einsaetze) {
    if (e.zustand === 'offen' && life.uhr >= e.bis) {
      e.zustand = 'fertig'
      const def = buildingDef(city.buildings.find((b) => b.id === e.ort)?.type ?? '')
      if (def) ereignisse.push({ art: 'meldung', text: einsatzText(e, def, 'ende'), ort: e.ort })
    }
  }
  life.einsaetze = life.einsaetze.filter((e) => e.zustand !== 'fertig' || life.uhr - e.seit < 60)
  return ereignisse
}

/** Brennt es hier gerade? Für Flammen und Rauch über dem Haus */
export function brennt(life: Life | null | undefined, id: string): boolean {
  return !!life?.einsaetze.some((e) => e.ort === id && e.art === 'feuer' && e.zustand !== 'fertig')
}

/** Alle Kacheln eines Bauwerks – für Werkzeuge, die wissen wollen, wo Menschen nicht stehen dürfen */
export const belegteKacheln = (city: CityState) => new Set(city.buildings.flatMap((b) => tilesOf(b).map((t) => `${t.x}:${t.y}`)))
