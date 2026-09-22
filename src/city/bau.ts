// Der Baukasten: Aus einer Stilbeschreibung im Katalog wird ein Gebäude – Baukörper,
// Fassade, Dach, Vorgarten und Zugaben. Farbe und Zugaben wählt jedes Haus anhand
// seines Namens selbst; so gleicht keins dem anderen, und keins wechselt sein Aussehen.
//
// Alles, was an einer Seite hängt – Tür, Schaufenster, Markise, Schild –, hängt an der
// Straßenseite. Was davor steht, wird vor oder hinter dem Haus gemalt, je nachdem,
// ob diese Seite gerade zum Betrachter zeigt.
import type { Extra, Fassade, Fensterart, Look, Stil, Unten } from './catalog'
import { fade, lift, mix, quad, quadPath, roundedPath, shade, wobble, type Point } from './draw'
import { zeichneAuto, type Modell } from './figures'
import {
  aussen,
  NORMALE,
  normale3,
  proj,
  schwerpunkt,
  seiteVorn,
  SEITEN,
  sichtbar3,
  licht3,
  umlauf,
  waende,
  type Grund,
  type P3,
  type Seite,
  type Wand,
} from './geo'
import { TILE_H, toScreen, zeigtNachVorn } from './iso'
import type { Placed } from './types'

export interface BauEingabe {
  placed: Placed
  look: Look
  stil: Stil
  /** das ganze Grundstück */
  lot: Grund
  stufe: number
  /** Höhe des Baukörpers in Bildpunkten, samt Wachsen nach dem Bau */
  hoehe: number
  seed: number
  time: number
  fein: boolean
  vorn: Seite
  einzug: number
}

const griff = <T>(liste: readonly T[], seed: number, salz: number): T =>
  liste[Math.floor(wobble(seed, salz) * liste.length) % liste.length]

/** Welche Zugaben dieses eine Haus hat: die festen, einige vom "vielleicht" und mit der Stufe mehr */
export function zugabenVon(stil: Stil, seed: number, stufe: number): Set<Extra> {
  const alle = new Set<Extra>(stil.extras ?? [])
  const moeglich = stil.vielleicht ?? []
  moeglich.forEach((extra, i) => {
    // Mit jeder Stufe steigt die Chance – ein ausgebautes Haus bekommt mehr dazu
    if (wobble(seed, 40 + i) < 0.42 + (stufe - 1) * 0.18) alle.add(extra)
  })
  return alle
}

/**
 * Wo der Baukörper auf dem Grundstück steht. Mit Vorgarten rückt er nach hinten,
 * weg von der Straße; ohne rückt er gleichmäßig vom Rand ein.
 */
export function koerperVon(lot: Grund, stil: Stil, vorn: Seite, stufe: number, einzug: number): Grund {
  if (!stil.koerper) {
    return { x: lot.x + einzug, y: lot.y + einzug, w: lot.w - einzug * 2, h: lot.h - einzug * 2 }
  }
  const wachs = 1 + (stufe - 1) * 0.07
  const tiefe = Math.min(0.94, stil.koerper.tiefe * wachs)
  const breite = Math.min(0.94, stil.koerper.breite * wachs)
  const rand = 0.04
  if (vorn === 'o' || vorn === 'w') {
    const d = (lot.w - rand) * tiefe
    const b = lot.h * breite
    const y = lot.y + (lot.h - b) / 2
    const x = vorn === 'o' ? lot.x + rand : lot.x + lot.w - rand - d
    return { x, y, w: d, h: b }
  }
  const d = (lot.h - rand) * tiefe
  const b = lot.w * breite
  const x = lot.x + (lot.w - b) / 2
  const y = vorn === 's' ? lot.y + rand : lot.y + lot.h - rand - d
  return { x, y, w: b, h: d }
}

/** Der Streifen zwischen Hauswand und Straße – dort stehen Säulen, Tische, Autos */
function vorgarten(lot: Grund, k: Grund, vorn: Seite): Grund | null {
  const rand = 0.05
  let g: Grund
  if (vorn === 'o') g = { x: k.x + k.w, y: lot.y + rand, w: lot.x + lot.w - (k.x + k.w) - rand, h: lot.h - rand * 2 }
  else if (vorn === 'w') g = { x: lot.x + rand, y: lot.y + rand, w: k.x - lot.x - rand, h: lot.h - rand * 2 }
  else if (vorn === 's') g = { x: lot.x + rand, y: k.y + k.h, w: lot.w - rand * 2, h: lot.y + lot.h - (k.y + k.h) - rand }
  else g = { x: lot.x + rand, y: lot.y + rand, w: lot.w - rand * 2, h: k.y - lot.y - rand }
  return g.w > 0.12 && g.h > 0.12 ? g : null
}

/** Ein Punkt im Vorgarten: u entlang der Straße (0..1), v von der Hauswand zur Straße (0..1) */
function imVorgarten(g: Grund, vorn: Seite, u: number, v: number): { x: number; y: number } {
  if (vorn === 'o') return { x: g.x + g.w * v, y: g.y + g.h * u }
  if (vorn === 'w') return { x: g.x + g.w * (1 - v), y: g.y + g.h * u }
  if (vorn === 's') return { x: g.x + g.w * u, y: g.y + g.h * v }
  return { x: g.x + g.w * u, y: g.y + g.h * (1 - v) }
}

// ---------------------------------------------------------------------------
// Fassade
// ---------------------------------------------------------------------------

interface FassadenStil {
  art: Fassade
  fenster: Fensterart
  floors: number
  seed: number
  fein: boolean
  licht: string
  vorn: boolean
  unten: Unten
  extras: Set<Extra>
  neon: string
  akzent: string
  laden: string
}

/** Linien nur innerhalb der Wandfläche ziehen */
function aufWand(ctx: CanvasRenderingContext2D, a: Point, b: Point, hoehe: number, malen: () => void): void {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(a.sx, a.sy)
  ctx.lineTo(b.sx, b.sy)
  ctx.lineTo(b.sx, b.sy - hoehe)
  ctx.lineTo(a.sx, a.sy - hoehe)
  ctx.closePath()
  ctx.clip()
  malen()
  ctx.restore()
}

/** Struktur der Wand: Fugen, Balken, Platten, Bretter, Rippen */
function oberflaeche(ctx: CanvasRenderingContext2D, a: Point, b: Point, hoehe: number, s: FassadenStil): void {
  const laenge = Math.hypot(b.sx - a.sx, b.sy - a.sy)
  if (s.art === 'putz' || laenge < 4) return
  aufWand(ctx, a, b, hoehe, () => {
    ctx.beginPath()
    if (s.art === 'ziegel' || s.art === 'stein') {
      const fuge = s.art === 'ziegel' ? 3.6 : 6
      for (let z = fuge; z < hoehe; z += fuge) {
        const p0 = lift(a, z)
        const p1 = lift(b, z)
        ctx.moveTo(p0.sx, p0.sy)
        ctx.lineTo(p1.sx, p1.sy)
      }
      // versetzte Stoßfugen – nur bei Stein, bei Ziegel wären es zu viele Striche
      if (s.art === 'stein') {
        const schritte = Math.max(2, Math.round(laenge / 10))
        for (let reihe = 0; reihe * fuge < hoehe; reihe++) {
          for (let i = 0; i < schritte; i++) {
            const t = (i + (reihe % 2 ? 0.5 : 0)) / schritte
            const p = lift(mix(a, b, t), reihe * fuge)
            ctx.moveTo(p.sx, p.sy)
            ctx.lineTo(p.sx, p.sy - fuge)
          }
        }
      }
      ctx.strokeStyle = fade('#1b1410', s.art === 'ziegel' ? 0.16 : 0.13)
      ctx.lineWidth = 0.7
      ctx.stroke()
      return
    }
    if (s.art === 'holz' || s.art === 'blech') {
      const abstand = s.art === 'holz' ? 3 : 2.2
      const n = Math.max(2, Math.round(laenge / abstand))
      for (let i = 1; i < n; i++) {
        const p = mix(a, b, i / n)
        ctx.moveTo(p.sx, p.sy)
        ctx.lineTo(p.sx, p.sy - hoehe)
      }
      ctx.strokeStyle = s.art === 'holz' ? fade('#1b1410', 0.2) : fade('#ffffff', 0.16)
      ctx.lineWidth = s.art === 'holz' ? 0.6 : 0.8
      ctx.stroke()
      return
    }
    if (s.art === 'platte') {
      const etage = hoehe / Math.max(1, s.floors)
      for (let z = etage; z < hoehe; z += etage) {
        const p0 = lift(a, z)
        const p1 = lift(b, z)
        ctx.moveTo(p0.sx, p0.sy)
        ctx.lineTo(p1.sx, p1.sy)
      }
      const n = Math.max(2, Math.round(laenge / 13))
      for (let i = 1; i < n; i++) {
        const p = mix(a, b, i / n)
        ctx.moveTo(p.sx, p.sy)
        ctx.lineTo(p.sx, p.sy - hoehe)
      }
      ctx.strokeStyle = fade('#2a2a2a', 0.22)
      ctx.lineWidth = 0.9
      ctx.stroke()
      // einzelne Platten leicht anders getönt – die Fertigteile sind nie ganz gleich
      const reihen = Math.max(1, s.floors)
      for (let r = 0; r < reihen; r++) {
        for (let i = 0; i < n; i++) {
          const w = wobble(s.seed, r * 17 + i * 5)
          if (w < 0.72) continue
          const q0 = lift(mix(a, b, i / n), r * etage)
          const q1 = lift(mix(a, b, (i + 1) / n), r * etage)
          quad(ctx, q0, q1, lift(q1, etage), lift(q0, etage), fade(w > 0.86 ? '#ffffff' : '#000000', 0.06))
        }
      }
      return
    }
    if (s.art === 'fachwerk') {
      const etage = hoehe / Math.max(1, s.floors)
      const n = Math.max(2, Math.round(laenge / 11))
      for (let i = 0; i <= n; i++) {
        const p = mix(a, b, i / n)
        ctx.moveTo(p.sx, p.sy)
        ctx.lineTo(p.sx, p.sy - hoehe)
      }
      for (let z = 0; z <= hoehe + 0.1; z += etage) {
        const p0 = lift(a, Math.min(hoehe, z))
        const p1 = lift(b, Math.min(hoehe, z))
        ctx.moveTo(p0.sx, p0.sy)
        ctx.lineTo(p1.sx, p1.sy)
      }
      // Streben in jedem zweiten Feld
      for (let r = 0; r * etage < hoehe - 1; r++) {
        for (let i = 0; i < n; i += 2) {
          const q0 = lift(mix(a, b, i / n), r * etage)
          const q1 = lift(mix(a, b, (i + 1) / n), Math.min(hoehe, (r + 1) * etage))
          ctx.moveTo(q0.sx, q0.sy)
          ctx.lineTo(q1.sx, q1.sy)
        }
      }
      ctx.strokeStyle = '#4a2e22'
      ctx.lineWidth = 1.4
      ctx.stroke()
      return
    }
    if (s.art === 'glas') {
      const n = Math.max(2, Math.round(laenge / 7))
      for (let i = 1; i < n; i++) {
        const p = mix(a, b, i / n)
        ctx.moveTo(p.sx, p.sy)
        ctx.lineTo(p.sx, p.sy - hoehe)
      }
      const etage = hoehe / Math.max(1, s.floors)
      for (let z = etage; z < hoehe; z += etage) {
        const p0 = lift(a, z)
        const p1 = lift(b, z)
        ctx.moveTo(p0.sx, p0.sy)
        ctx.lineTo(p1.sx, p1.sy)
      }
      ctx.strokeStyle = fade('#e8f4ff', 0.35)
      ctx.lineWidth = 0.8
      ctx.stroke()
      // Spiegelung: ein heller Schrägstreifen über die Scheiben
      const t0 = 0.15 + wobble(s.seed, 3) * 0.4
      quad(
        ctx,
        lift(mix(a, b, t0), 0),
        lift(mix(a, b, t0 + 0.12), 0),
        lift(mix(a, b, t0 + 0.3), hoehe),
        lift(mix(a, b, t0 + 0.18), hoehe),
        fade('#ffffff', 0.14),
      )
    }
  })
}

/** Die Fensterreihen einer Wand, samt Rahmen, Kreuz, Bank, Läden und Gittern */
function fenster(ctx: CanvasRenderingContext2D, a: Point, b: Point, hoehe: number, farbe: string, s: FassadenStil): void {
  if (s.fenster === 'keine') return
  const laenge = Math.hypot(b.sx - a.sx, b.sy - a.sy)
  const sockel = s.art === 'glas' ? 0 : Math.min(4, hoehe * 0.2)
  const etagen = Math.max(1, Math.min(s.floors, Math.floor((hoehe - sockel) / 12)))
  const etage = (hoehe - sockel) / etagen
  // Im Erdgeschoss der Straßenseite sitzt Laden, Tor oder Eingang statt der Fenster
  const ersteReihe = s.vorn && s.unten !== 'tuer' ? 1 : 0
  const breit = s.fenster === 'gross' ? 24 : s.fenster === 'klein' ? 14 : 18
  const spalten = Math.max(1, Math.round(laenge / breit))
  const hoch = Math.min(s.fenster === 'gross' ? 11 : s.fenster === 'klein' ? 5 : 8, etage * (s.fenster === 'gross' ? 0.66 : 0.5))
  const breiteAnteil = s.fenster === 'gross' ? 0.74 : s.fenster === 'klein' ? 0.36 : 0.48

  type F = { p0: Point; p1: Point; an: boolean; unten: boolean }
  const liste: F[] = []
  for (let r = ersteReihe; r < etagen; r++) {
    const z = sockel + etage * r + (etage - hoch) * 0.52
    if (s.fenster === 'band') {
      liste.push({ p0: lift(mix(a, b, 0.05), z), p1: lift(mix(a, b, 0.95), z), an: wobble(s.seed, r) > 0.4, unten: r === 0 })
      continue
    }
    for (let c = 0; c < spalten; c++) {
      // Bei einer Tür in der Mitte der Straßenseite bleibt dort unten eine Lücke
      if (s.vorn && s.unten === 'tuer' && r === 0 && spalten >= 2 && Math.abs((c + 0.5) / spalten - 0.5) < 0.2) continue
      const mitteT = (c + 0.5) / spalten
      const halb = breiteAnteil / spalten / 2
      liste.push({
        p0: lift(mix(a, b, mitteT - halb), z),
        p1: lift(mix(a, b, mitteT + halb), z),
        an: wobble(s.seed, r * 13 + c * 7) > 0.58,
        unten: r === 0,
      })
    }
  }
  if (liste.length === 0) return

  // Rahmen
  if (s.fein && s.fenster !== 'band') {
    ctx.beginPath()
    for (const f of liste) {
      const r0 = { sx: f.p0.sx - 1, sy: f.p0.sy + 1.2 }
      const r1 = { sx: f.p1.sx + 1, sy: f.p1.sy + 1.2 }
      quadPath(ctx, r0, r1, lift(r1, hoch + 2.4), lift(r0, hoch + 2.4))
    }
    ctx.fillStyle = s.art === 'fachwerk' ? '#4a2e22' : shade(farbe, 30)
    ctx.fill()
  }

  // Scheiben
  const dunkel = s.fenster === 'dunkel'
  for (const an of [true, false]) {
    const gruppe = liste.filter((f) => f.an === an)
    if (gruppe.length === 0) continue
    ctx.beginPath()
    for (const f of gruppe) {
      if (s.fenster === 'bogen') {
        // Rundbogen: Rechteck mit halbrundem Abschluss
        const breiteF = Math.hypot(f.p1.sx - f.p0.sx, f.p1.sy - f.p0.sy)
        const m = mix(f.p0, f.p1, 0.5)
        quadPath(ctx, f.p0, f.p1, lift(f.p1, hoch * 0.7), lift(f.p0, hoch * 0.7))
        ctx.moveTo(m.sx + breiteF / 2, m.sy - hoch * 0.7)
        ctx.ellipse(m.sx, m.sy - hoch * 0.7, breiteF / 2, breiteF / 2.4, 0, 0, Math.PI, true)
      } else {
        quadPath(ctx, f.p0, f.p1, lift(f.p1, hoch), lift(f.p0, hoch))
      }
    }
    ctx.fillStyle = dunkel ? '#18121f' : an ? s.licht : s.art === 'glas' ? 'rgba(60,96,130,0.55)' : 'rgba(92,128,172,0.7)'
    ctx.fill()
    if (dunkel) {
      // Verklebte Scheiben, aber an den Rändern leuchtet es lila – das Growlicht
      ctx.strokeStyle = fade(s.neon, 0.85)
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
  if (!s.fein) return

  // Spiegelung und Kreuz
  if (!dunkel) {
    ctx.beginPath()
    for (const f of liste) {
      const halb = mix(f.p0, f.p1, 0.45)
      quadPath(ctx, lift(f.p0, hoch * 0.55), lift(halb, hoch * 0.55), lift(halb, hoch), lift(f.p0, hoch))
    }
    ctx.fillStyle = fade('#ffffff', 0.18)
    ctx.fill()
  }
  if (s.fenster === 'normal' || s.fenster === 'bogen' || s.fenster === 'band') {
    ctx.beginPath()
    for (const f of liste) {
      if (s.fenster === 'band') {
        const n = Math.max(2, Math.round(Math.hypot(f.p1.sx - f.p0.sx, f.p1.sy - f.p0.sy) / 8))
        for (let i = 1; i < n; i++) {
          const m = mix(f.p0, f.p1, i / n)
          ctx.moveTo(m.sx, m.sy)
          ctx.lineTo(m.sx, m.sy - hoch)
        }
        continue
      }
      const m = mix(f.p0, f.p1, 0.5)
      ctx.moveTo(m.sx, m.sy)
      ctx.lineTo(m.sx, m.sy - hoch)
      const q0 = lift(f.p0, hoch * 0.55)
      const q1 = lift(f.p1, hoch * 0.55)
      ctx.moveTo(q0.sx, q0.sy)
      ctx.lineTo(q1.sx, q1.sy)
    }
    ctx.strokeStyle = fade('#1b2132', 0.42)
    ctx.lineWidth = 0.7
    ctx.stroke()
  }
  // Fensterbänke
  if (s.fenster !== 'band' && s.art !== 'glas') {
    ctx.beginPath()
    for (const f of liste) quadPath(ctx, lift(f.p0, -1.3), lift(f.p1, -1.3), f.p1, f.p0)
    ctx.fillStyle = shade(farbe, 36)
    ctx.fill()
  }
  // Fensterläden links und rechts
  if (s.extras.has('fensterlaeden') && s.fenster !== 'band') {
    const ladenFarbe = s.laden
    ctx.beginPath()
    for (const f of liste) {
      const breiteF = mix(f.p0, f.p1, 0.34)
      const d = { sx: breiteF.sx - f.p0.sx, sy: breiteF.sy - f.p0.sy }
      const l0 = { sx: f.p0.sx - d.sx, sy: f.p0.sy - d.sy }
      quadPath(ctx, l0, f.p0, lift(f.p0, hoch), lift(l0, hoch))
      const r1 = { sx: f.p1.sx + d.sx, sy: f.p1.sy + d.sy }
      quadPath(ctx, f.p1, r1, lift(r1, hoch), lift(f.p1, hoch))
    }
    ctx.fillStyle = ladenFarbe
    ctx.fill()
  }
  // Gitter vor den unteren Fenstern
  if (s.extras.has('gitter')) {
    ctx.beginPath()
    for (const f of liste) {
      if (!f.unten && liste.some((g) => g.unten)) continue
      for (let i = 1; i < 4; i++) {
        const m = mix(f.p0, f.p1, i / 4)
        ctx.moveTo(m.sx, m.sy)
        ctx.lineTo(m.sx, m.sy - hoch)
      }
    }
    ctx.strokeStyle = fade('#1c1c1c', 0.8)
    ctx.lineWidth = 0.8
    ctx.stroke()
  }
}

/** Das Erdgeschoss der Straßenseite: Tür, Eingang, Laden oder Tor */
function erdgeschoss(ctx: CanvasRenderingContext2D, w: Wand, hoehe: number, farbe: string, s: FassadenStil): void {
  const a = w.a
  const b = w.b
  const unten = Math.min(hoehe * 0.8, s.unten === 'tor' ? 18 : 14)
  if (s.unten === 'tuer') {
    tuer(ctx, mix(a, b, 0.42), mix(a, b, 0.58), Math.min(13, hoehe * 0.7), s.akzent, s.fein, w.raus)
    return
  }
  if (s.unten === 'eingang') {
    // Glastür mit Vordach und Lampe
    const t0 = mix(a, b, 0.4)
    const t1 = mix(a, b, 0.6)
    quad(ctx, t0, t1, lift(t1, unten), lift(t0, unten), 'rgba(120,170,210,0.85)')
    if (s.fein) {
      const m = mix(t0, t1, 0.5)
      ctx.strokeStyle = fade('#1c2436', 0.6)
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(m.sx, m.sy)
      ctx.lineTo(m.sx, m.sy - unten)
      ctx.stroke()
      // Vordach
      const v0 = lift(mix(a, b, 0.34), unten + 2)
      const v1 = lift(mix(a, b, 0.66), unten + 2)
      const vor = { sx: w.raus.sx * 5, sy: w.raus.sy * 5 }
      quad(ctx, v0, v1, { sx: v1.sx + vor.sx, sy: v1.sy + vor.sy }, { sx: v0.sx + vor.sx, sy: v0.sy + vor.sy }, shade(farbe, -40))
      // Lampe
      const lampe = lift(mix(a, b, 0.33), unten - 2)
      ctx.fillStyle = 'rgba(255,236,170,0.95)'
      ctx.beginPath()
      ctx.arc(lampe.sx, lampe.sy, 1.2, 0, Math.PI * 2)
      ctx.fill()
    }
    return
  }
  if (s.unten === 'laden') {
    // Schaufenster über fast die ganze Breite, Tür an der Seite
    const f0 = lift(mix(a, b, 0.08), 2)
    const f1 = lift(mix(a, b, 0.66), 2)
    quad(ctx, f0, f1, lift(f1, unten - 3), lift(f0, unten - 3), s.licht)
    const t0 = mix(a, b, 0.72)
    const t1 = mix(a, b, 0.9)
    quad(ctx, t0, t1, lift(t1, unten), lift(t0, unten), shade(s.akzent, -10))
    if (s.fein) {
      // Auslage im Fenster
      for (let i = 0; i < 4; i++) {
        const p = lift(mix(f0, f1, 0.14 + i * 0.24), 0)
        ctx.fillStyle = ['#ff7ab5', '#7bdcff', '#9dff8b', '#ffd23f'][(i + Math.floor(s.seed * 7)) % 4]
        ctx.fillRect(p.sx - 1.8, p.sy - 5, 3.6, 4)
      }
      ctx.strokeStyle = fade('#2a3348', 0.55)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(f0.sx, f0.sy)
      ctx.lineTo(f1.sx, f1.sy)
      ctx.moveTo(lift(f0, unten - 3).sx, lift(f0, unten - 3).sy)
      ctx.lineTo(lift(f1, unten - 3).sx, lift(f1, unten - 3).sy)
      ctx.stroke()
      // Klinke
      const k = lift(mix(t0, t1, 0.8), unten * 0.45)
      ctx.fillStyle = '#ffe9a8'
      ctx.beginPath()
      ctx.arc(k.sx, k.sy, 0.9, 0, Math.PI * 2)
      ctx.fill()
    }
    return
  }
  if (s.unten === 'tor' || s.unten === 'garage') {
    // Rolltore – bei der Feuerwehr rot, sonst grau
    const tore = s.unten === 'garage' ? 1 : Math.max(1, Math.min(3, Math.round(Math.hypot(b.sx - a.sx, b.sy - a.sy) / 26)))
    const torFarbe = s.neon === '#ff3b30' ? '#c62f28' : shade(farbe, -38)
    for (let i = 0; i < tore; i++) {
      const t0 = mix(a, b, (i + 0.14) / tore)
      const t1 = mix(a, b, (i + 0.86) / tore)
      quad(ctx, t0, t1, lift(t1, unten), lift(t0, unten), torFarbe)
      if (!s.fein) continue
      ctx.strokeStyle = fade('#000000', 0.2)
      ctx.lineWidth = 0.7
      ctx.beginPath()
      for (let z = 2.5; z < unten; z += 2.5) {
        const p0 = lift(t0, z)
        const p1 = lift(t1, z)
        ctx.moveTo(p0.sx, p0.sy)
        ctx.lineTo(p1.sx, p1.sy)
      }
      ctx.stroke()
      if (s.neon === '#ff3b30') {
        // Fensterband im Feuerwehrtor
        quad(ctx, lift(mix(t0, t1, 0.1), unten * 0.62), lift(mix(t0, t1, 0.9), unten * 0.62), lift(mix(t0, t1, 0.9), unten * 0.8), lift(mix(t0, t1, 0.1), unten * 0.8), 'rgba(150,200,240,0.8)')
      }
    }
  }
}

/** Tür mit Rahmen, Stufe und Klinke – auf einer Wand, deren Außenrichtung `raus` ist */
function tuer(ctx: CanvasRenderingContext2D, a: Point, b: Point, hoehe: number, farbe: string, fein: boolean, raus: Point): void {
  if (fein) {
    quad(ctx, mix(a, b, -0.14), mix(a, b, 1.14), lift(mix(a, b, 1.14), hoehe + 2), lift(mix(a, b, -0.14), hoehe + 2), shade(farbe, 40))
  }
  quad(ctx, a, b, lift(b, hoehe), lift(a, hoehe), farbe)
  if (!fein) return
  quad(ctx, lift(mix(a, b, 0.2), hoehe * 0.2), lift(mix(a, b, 0.8), hoehe * 0.2), lift(mix(a, b, 0.8), hoehe * 0.78), lift(mix(a, b, 0.2), hoehe * 0.78), shade(farbe, -22))
  const k = lift(mix(a, b, 0.78), hoehe * 0.46)
  ctx.fillStyle = '#ffe9a8'
  ctx.beginPath()
  ctx.arc(k.sx, k.sy, 1, 0, Math.PI * 2)
  ctx.fill()
  const s0 = mix(a, b, -0.1)
  const s1 = mix(a, b, 1.1)
  const vor = { sx: raus.sx * 3, sy: raus.sy * 3 }
  quad(ctx, s0, s1, { sx: s1.sx + vor.sx, sy: s1.sy + vor.sy }, { sx: s0.sx + vor.sx, sy: s0.sy + vor.sy }, 'rgba(226,226,226,0.6)')
}

/** Balkone an den oberen Etagen der Straßenseite */
function balkone(ctx: CanvasRenderingContext2D, w: Wand, hoehe: number, farbe: string, floors: number, seed: number): void {
  const etagen = Math.max(1, Math.min(floors, Math.floor(hoehe / 12)))
  if (etagen < 2) return
  const etage = hoehe / etagen
  const laenge = Math.hypot(w.b.sx - w.a.sx, w.b.sy - w.a.sy)
  const spalten = Math.max(1, Math.round(laenge / 22))
  const vor = { sx: w.raus.sx * 4.5, sy: w.raus.sy * 4.5 }
  const weg = (p: Point): Point => ({ sx: p.sx + vor.sx, sy: p.sy + vor.sy })
  ctx.beginPath()
  const gelaender: [Point, Point][] = []
  for (let r = 1; r < etagen; r++) {
    for (let c = 0; c < spalten; c++) {
      if (wobble(seed, 60 + r * 5 + c) < 0.25) continue
      const t0 = (c + 0.18) / spalten
      const t1 = (c + 0.82) / spalten
      const p0 = lift(mix(w.a, w.b, t0), r * etage)
      const p1 = lift(mix(w.a, w.b, t1), r * etage)
      quadPath(ctx, p0, p1, weg(p1), weg(p0))
      gelaender.push([weg(p0), weg(p1)])
    }
  }
  ctx.fillStyle = shade(farbe, -26)
  ctx.fill()
  ctx.beginPath()
  for (const [p0, p1] of gelaender) {
    ctx.moveTo(p0.sx, p0.sy)
    ctx.lineTo(p0.sx, p0.sy - 4.5)
    ctx.lineTo(p1.sx, p1.sy - 4.5)
    ctx.lineTo(p1.sx, p1.sy)
  }
  ctx.strokeStyle = fade('#f4f7ff', 0.65)
  ctx.lineWidth = 0.9
  ctx.stroke()
  // Pflanzen auf manchen Balkonen
  for (const [p0, p1] of gelaender) {
    if (wobble(seed, p0.sx) < 0.6) continue
    const m = mix(p0, p1, 0.3)
    ctx.fillStyle = '#4fa862'
    ctx.beginPath()
    ctx.arc(m.sx, m.sy - 5.5, 1.8, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Efeu, der an einer Hausecke hochwächst */
function efeu(ctx: CanvasRenderingContext2D, w: Wand, hoehe: number, seed: number): void {
  const links = wobble(seed, 81) < 0.5
  const basis = links ? w.a : w.b
  const nach = links ? 1 : -1
  ctx.fillStyle = 'rgba(58,128,66,0.85)'
  for (let i = 0; i < 12; i++) {
    const hochAnteil = wobble(seed, 90 + i)
    const seitlich = wobble(seed, 110 + i) * 0.35 * (1 - hochAnteil)
    const p = lift(mix(basis, links ? w.b : w.a, seitlich), hochAnteil * hoehe * 0.85)
    ctx.beginPath()
    ctx.arc(p.sx + nach * 0.5, p.sy, 1.6 + wobble(seed, 130 + i) * 1.4, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Graffiti im unteren Bereich einer Wand */
function graffiti(ctx: CanvasRenderingContext2D, w: Wand, seed: number): void {
  const farben = ['#ff4fd8', '#48dbfb', '#feca57', '#1dd1a1', '#ff6b6b', '#a29bfe']
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  for (let i = 0; i < 3; i++) {
    const t = 0.15 + wobble(seed, 150 + i) * 0.6
    const p = lift(mix(w.a, w.b, t), 3 + wobble(seed, 160 + i) * 4)
    ctx.strokeStyle = farben[Math.floor(wobble(seed, 170 + i) * farben.length)]
    ctx.beginPath()
    ctx.moveTo(p.sx - 4, p.sy)
    ctx.bezierCurveTo(p.sx - 2, p.sy - 5, p.sx + 1, p.sy + 3, p.sx + 4, p.sy - 3)
    ctx.stroke()
  }
}

/** Eine ganze Wand: Fläche, Struktur, Sockel, Fenster, Erdgeschoss und was daran hängt */
function wand(ctx: CanvasRenderingContext2D, w: Wand, hoehe: number, farbe: string, s: FassadenStil): void {
  const a = w.a
  const b = w.b
  quad(ctx, a, b, lift(b, hoehe), lift(a, hoehe), farbe)
  if (hoehe < 4) return
  if (s.fein) oberflaeche(ctx, a, b, hoehe, s)
  if (s.art !== 'glas' && s.art !== 'blech') {
    const sockel = Math.min(4, hoehe * 0.22)
    quad(ctx, a, b, lift(b, sockel), lift(a, sockel), shade(farbe, -30))
  }
  fenster(ctx, a, b, hoehe, farbe, s)
  if (s.vorn) erdgeschoss(ctx, w, hoehe, farbe, s)
  if (!s.fein) return
  if (s.extras.has('efeu')) efeu(ctx, w, hoehe, s.seed + (s.vorn ? 0 : 3))
  if (s.extras.has('graffiti') && wobble(s.seed, w.seite.charCodeAt(0)) < 0.7) graffiti(ctx, w, s.seed + w.seite.charCodeAt(0))
}

// ---------------------------------------------------------------------------
// Dächer
// ---------------------------------------------------------------------------

type Flaeche = { punkte: P3[]; n: [number, number, number]; farbe: string; dach: boolean }

/** Etwas, das auf dem Dach sitzt: an einem Kartenpunkt, auf der Höhe der Dachfläche dort */
type AufDach = { x: number; y: number; malen: (p: Point) => void }

function flaechenMalen(ctx: CanvasRenderingContext2D, flaechen: Flaeche[], mitte: P3, auf: AufDach[], hoeheBei: (x: number, y: number) => number) {
  const sichtbar = flaechen
    .map((f) => ({ ...f, n: aussen(f.n, f.punkte[0], mitte) }))
    .filter((f) => sichtbar3(f.n))
    .map((f) => ({ f, tiefe: schwerpunkt(f.punkte.map(proj)).sy }))
    .sort((a, b) => a.tiefe - b.tiefe)
  for (const { f } of sichtbar) {
    ctx.beginPath()
    f.punkte.forEach((p, i) => {
      const q = proj(p)
      if (i === 0) ctx.moveTo(q.sx, q.sy)
      else ctx.lineTo(q.sx, q.sy)
    })
    ctx.closePath()
    ctx.fillStyle = shade(f.farbe, licht3(f.n) + (f.dach ? 22 : 0))
    ctx.fill()
  }
  // Was auf dem Dach sitzt, kommt nach allen Flächen – von hinten nach vorn
  auf
    .map((ding) => ({ ding, p: lift(toScreen(ding.x, ding.y), hoeheBei(ding.x, ding.y)) }))
    .sort((a, b) => a.p.sy - b.p.sy)
    .forEach(({ ding, p }) => ding.malen(p))
}

interface DachErgebnis {
  /** Höhe der Dachfläche über einem Kartenpunkt */
  hoeheBei: (x: number, y: number) => number
  /** höchster Punkt – für Wetterhahn und Trefferfläche */
  spitze: P3
  /** Flachdach: die Fläche, auf der Dinge stehen */
  flach: boolean
}

/**
 * Ein Dach über dem Baukörper k auf der Höhe h. Die Flächen werden als Körper im Raum
 * beschrieben; gemalt wird nur, was zum Betrachter zeigt.
 */
function dach(
  ctx: CanvasRenderingContext2D,
  form: Stil['dach'],
  k: Grund,
  h: number,
  farbe: string,
  wandFarbe: string,
  vorn: Seite,
  stufe: number,
  fein: boolean,
  auf: AufDach[],
): DachErgebnis {
  const laengsX = k.w >= k.h
  const kurz = Math.min(k.w, k.h)
  const rise = TILE_H * (0.34 + 0.24 * Math.min(1.4, kurz)) + (stufe - 1) * 2.5
  const u = form === 'flach' || form === 'mansard' || form === 'saege' ? 0 : 0.07
  const r: Grund = { x: k.x - u, y: k.y - u, w: k.w + u * 2, h: k.h + u * 2 }
  const x0 = r.x
  const x1 = r.x + r.w
  const y0 = r.y
  const y1 = r.y + r.h
  const c = { x: r.x + r.w / 2, y: r.y + r.h / 2 }
  const P = (x: number, y: number, z: number): P3 => ({ x, y, z })
  const flaechen: Flaeche[] = []
  const D = (punkte: P3[]) => flaechen.push({ punkte, n: normale3(punkte[0], punkte[1], punkte[2]), farbe, dach: true })
  const W = (punkte: P3[]) => flaechen.push({ punkte, n: normale3(punkte[0], punkte[1], punkte[2]), farbe: wandFarbe, dach: false })

  if (form === 'flach') {
    const rand = 4
    const ecken = umlauf(r, h + rand)
    const [e0, e1, e2, e3] = ecken
    // Brüstung: außen hell, innen etwas dunkler – so wirkt das Dach vertieft
    quad(ctx, e0, e1, e2, e3, shade(farbe, 14))
    const innen: Grund = { x: r.x + 0.07, y: r.y + 0.07, w: r.w - 0.14, h: r.h - 0.14 }
    const [i0, i1, i2, i3] = umlauf(innen, h + rand * 0.4)
    quad(ctx, i0, i1, i2, i3, shade(farbe, -12))
    if (fein) {
      // Dachkante im Licht
      const kanten = waende(r, h + rand)
      ctx.strokeStyle = fade('#ffffff', 0.2)
      ctx.lineWidth = 1
      ctx.beginPath()
      for (const s of SEITEN) {
        if (!kanten[s].sichtbar) continue
        ctx.moveTo(kanten[s].a.sx, kanten[s].a.sy)
        ctx.lineTo(kanten[s].b.sx, kanten[s].b.sy)
      }
      ctx.stroke()
    }
    const hoeheBei = () => h + rand * 0.4
    auf
      .map((ding) => ({ ding, p: lift(toScreen(ding.x, ding.y), hoeheBei()) }))
      .sort((a, b) => a.p.sy - b.p.sy)
      .forEach(({ ding, p }) => ding.malen(p))
    return { hoeheBei, spitze: P(c.x, c.y, h + rand), flach: true }
  }

  if (form === 'sattel' || form === 'walm' || form === 'zelt') {
    const hw = kurz / 2 + u
    // Firstenden: beim Satteldach an den Giebeln, beim Walmdach eingerückt, beim Zelt in der Mitte
    let f1: P3
    let f2: P3
    if (form === 'zelt') {
      f1 = P(c.x, c.y, h + rise)
      f2 = f1
    } else if (laengsX) {
      const ein = form === 'walm' ? hw : 0
      f1 = P(Math.min(c.x, x0 + ein), c.y, h + rise)
      f2 = P(Math.max(c.x, x1 - ein), c.y, h + rise)
    } else {
      const ein = form === 'walm' ? hw : 0
      f1 = P(c.x, Math.min(c.y, y0 + ein), h + rise)
      f2 = P(c.x, Math.max(c.y, y1 - ein), h + rise)
    }
    const a0 = P(x0, y0, h)
    const a1 = P(x1, y0, h)
    const a2 = P(x1, y1, h)
    const a3 = P(x0, y1, h)
    if (laengsX || form === 'zelt') {
      D([a0, a1, f2, f1])
      D([a3, a2, f2, f1])
      if (form === 'sattel') {
        W([a0, a3, f1])
        W([a1, a2, f2])
      } else {
        D([a0, a3, f1])
        D([a1, a2, f2])
      }
    } else {
      D([a0, a3, f2, f1])
      D([a1, a2, f2, f1])
      if (form === 'sattel') {
        W([a0, a1, f1])
        W([a3, a2, f2])
      } else {
        D([a0, a1, f1])
        D([a3, a2, f2])
      }
    }
    // Entartete Flächen (Zelt: zwei Punkte fallen zusammen) sind harmlos: Dreiecke
    const hoeheBei = (x: number, y: number) => {
      const quer = laengsX || form === 'zelt' ? Math.abs(y - c.y) / (r.h / 2) : Math.abs(x - c.x) / (r.w / 2)
      const laengs = form === 'sattel' ? 0 : laengsX ? Math.max(0, Math.abs(x - c.x) - (f2.x - f1.x) / 2) / hw : Math.max(0, Math.abs(y - c.y) - (f2.y - f1.y) / 2) / hw
      return h + rise * Math.max(0, 1 - Math.max(quer, laengs))
    }
    flaechenMalen(ctx, flaechen, P(c.x, c.y, h), auf, hoeheBei)
    if (fein && form !== 'zelt') {
      const q1 = proj(f1)
      const q2 = proj(f2)
      ctx.strokeStyle = fade('#ffffff', 0.28)
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(q1.sx, q1.sy)
      ctx.lineTo(q2.sx, q2.sy)
      ctx.stroke()
    }
    return { hoeheBei, spitze: f1, flach: false }
  }

  if (form === 'pult') {
    // Hoch an der Rückseite, tief zur Straße
    const hinten = { n: 's', s: 'n', o: 'w', w: 'o' }[vorn] as Seite
    const zHinten = (x: number, y: number) => {
      const t =
        hinten === 'n' ? (y1 - y) / (y1 - y0) : hinten === 's' ? (y - y0) / (y1 - y0) : hinten === 'w' ? (x1 - x) / (x1 - x0) : (x - x0) / (x1 - x0)
      return h + rise * 0.6 * t
    }
    const e = [P(x0, y0, 0), P(x1, y0, 0), P(x1, y1, 0), P(x0, y1, 0)].map((p) => P(p.x, p.y, zHinten(p.x, p.y)))
    D(e)
    // Seitenwände unter der Schräge und die hohe Rückwand
    const boden = [P(x0, y0, h), P(x1, y0, h), P(x1, y1, h), P(x0, y1, h)]
    const kanten: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ]
    for (const [i, j] of kanten) {
      if (Math.abs(e[i].z - h) < 0.01 && Math.abs(e[j].z - h) < 0.01) continue
      W([boden[i], boden[j], e[j], e[i]])
    }
    const hoeheBei = (x: number, y: number) => zHinten(x, y)
    flaechenMalen(ctx, flaechen, P(c.x, c.y, h), auf, hoeheBei)
    return { hoeheBei, spitze: P(c.x, c.y, h + rise * 0.6), flach: false }
  }

  if (form === 'mansard') {
    // Steiler Unterteil, flacher Deckel – das Dach der Gründerzeit
    const steil = Math.min(TILE_H * 0.85, rise * 1.1)
    const m = Math.min(0.14, kurz * 0.2)
    const a = [P(x0, y0, h), P(x1, y0, h), P(x1, y1, h), P(x0, y1, h)]
    const o = [P(x0 + m, y0 + m, h + steil), P(x1 - m, y0 + m, h + steil), P(x1 - m, y1 - m, h + steil), P(x0 + m, y1 - m, h + steil)]
    D([a[0], a[1], o[1], o[0]])
    D([a[1], a[2], o[2], o[1]])
    D([a[2], a[3], o[3], o[2]])
    D([a[3], a[0], o[0], o[3]])
    D([o[0], o[1], o[2], o[3]])
    const hoeheBei = (x: number, y: number) => {
      const rand = Math.min(x - x0, x1 - x, y - y0, y1 - y)
      return h + steil * Math.min(1, Math.max(0, rand / m))
    }
    flaechenMalen(ctx, flaechen, P(c.x, c.y, h), auf, hoeheBei)
    return { hoeheBei, spitze: P(c.x, c.y, h + steil), flach: false }
  }

  // Sheddach: eine Reihe schräger Streifen mit Glas an der steilen Seite
  const zaehne = Math.max(2, Math.round((laengsX ? r.w : r.h) * 1.6))
  const zahnHoch = rise * 0.55
  const streifen: { f: Flaeche[]; tiefe: number }[] = []
  for (let i = 0; i < zaehne; i++) {
    const t0 = i / zaehne
    const t1 = (i + 1) / zaehne
    const liste: Flaeche[] = []
    const add = (punkte: P3[], f: string, istDach: boolean) =>
      liste.push({ punkte, n: normale3(punkte[0], punkte[1], punkte[2]), farbe: f, dach: istDach })
    if (laengsX) {
      const xa = x0 + r.w * t0
      const xb = x0 + r.w * t1
      add([P(xa, y0, h), P(xa, y1, h), P(xb, y1, h + zahnHoch), P(xb, y0, h + zahnHoch)], farbe, true)
      add([P(xb, y0, h), P(xb, y1, h), P(xb, y1, h + zahnHoch), P(xb, y0, h + zahnHoch)], '#9fc4dc', false)
      add([P(xa, y0, h), P(xb, y0, h), P(xb, y0, h + zahnHoch)], wandFarbe, false)
      add([P(xa, y1, h), P(xb, y1, h), P(xb, y1, h + zahnHoch)], wandFarbe, false)
      streifen.push({ f: liste, tiefe: toScreen((xa + xb) / 2, c.y).sy })
    } else {
      const ya = y0 + r.h * t0
      const yb = y0 + r.h * t1
      add([P(x0, ya, h), P(x1, ya, h), P(x1, yb, h + zahnHoch), P(x0, yb, h + zahnHoch)], farbe, true)
      add([P(x0, yb, h), P(x1, yb, h), P(x1, yb, h + zahnHoch), P(x0, yb, h + zahnHoch)], '#9fc4dc', false)
      add([P(x0, ya, h), P(x0, yb, h), P(x0, yb, h + zahnHoch)], wandFarbe, false)
      add([P(x1, ya, h), P(x1, yb, h), P(x1, yb, h + zahnHoch)], wandFarbe, false)
      streifen.push({ f: liste, tiefe: toScreen(c.x, (ya + yb) / 2).sy })
    }
  }
  streifen.sort((a, b) => a.tiefe - b.tiefe)
  for (const s of streifen) {
    const m = schwerpunkt3(s.f.flatMap((f) => f.punkte))
    flaechenMalen(ctx, s.f, m, [], () => h)
  }
  const hoeheBei = () => h + zahnHoch * 0.5
  auf
    .map((ding) => ({ ding, p: lift(toScreen(ding.x, ding.y), hoeheBei()) }))
    .sort((a, b) => a.p.sy - b.p.sy)
    .forEach(({ ding, p }) => ding.malen(p))
  return { hoeheBei, spitze: P(c.x, c.y, h + zahnHoch), flach: false }
}

function schwerpunkt3(punkte: P3[]): P3 {
  let x = 0
  let y = 0
  let z = 0
  for (const p of punkte) {
    x += p.x
    y += p.y
    z += p.z
  }
  return { x: x / punkte.length, y: y / punkte.length, z: z / punkte.length }
}

// ---------------------------------------------------------------------------
// Kleinteile auf dem Dach
// ---------------------------------------------------------------------------

function schornstein(ctx: CanvasRenderingContext2D, p: Point, hoehe: number, rauch: boolean, t: number, seed: number): void {
  ctx.fillStyle = '#8d6a55'
  ctx.fillRect(p.sx - 3, p.sy - hoehe, 6, hoehe)
  ctx.fillStyle = '#6b4f3f'
  ctx.fillRect(p.sx - 3.6, p.sy - hoehe, 7.2, 2.4)
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.fillRect(p.sx - 3, p.sy - hoehe, 2, hoehe)
  if (rauch) wolke(ctx, { sx: p.sx, sy: p.sy - hoehe }, t, seed, 0.4, '#e8eef7')
}

/** Aufsteigender Rauch */
function wolke(ctx: CanvasRenderingContext2D, p: Point, t: number, seed: number, dichte: number, farbe: string, gross = 1): void {
  for (let i = 0; i < 4; i++) {
    const phase = (t * 0.5 + i / 4 + wobble(seed, i)) % 1
    ctx.globalAlpha = (1 - phase) * dichte
    ctx.fillStyle = farbe
    ctx.beginPath()
    ctx.arc(p.sx + Math.sin(phase * 5 + i) * 4 * gross, p.sy - 3 - phase * 20 * gross, (2.2 + phase * 4) * gross, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function gaube(ctx: CanvasRenderingContext2D, p: Point, wandFarbe: string, dachFarbe: string, licht: string): void {
  ctx.fillStyle = shade(wandFarbe, -8)
  ctx.beginPath()
  ctx.moveTo(p.sx - 4.5, p.sy)
  ctx.lineTo(p.sx + 4.5, p.sy)
  ctx.lineTo(p.sx + 4.5, p.sy - 5.5)
  ctx.lineTo(p.sx - 4.5, p.sy - 5.5)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = shade(dachFarbe, -6)
  ctx.beginPath()
  ctx.moveTo(p.sx - 5.5, p.sy - 5.5)
  ctx.lineTo(p.sx + 5.5, p.sy - 5.5)
  ctx.lineTo(p.sx, p.sy - 9.5)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = licht
  ctx.fillRect(p.sx - 2.4, p.sy - 4.6, 4.8, 3.8)
}

function solar(ctx: CanvasRenderingContext2D, p: Point): void {
  ctx.fillStyle = '#233a5e'
  ctx.beginPath()
  ctx.moveTo(p.sx - 7, p.sy)
  ctx.lineTo(p.sx + 1, p.sy + 3)
  ctx.lineTo(p.sx + 7, p.sy - 1)
  ctx.lineTo(p.sx - 1, p.sy - 4)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = fade('#9fc4ff', 0.45)
  ctx.lineWidth = 0.6
  ctx.beginPath()
  ctx.moveTo(p.sx - 3, p.sy + 1.5)
  ctx.lineTo(p.sx + 3, p.sy - 2.5)
  ctx.moveTo(p.sx - 4, p.sy - 2)
  ctx.lineTo(p.sx + 4, p.sy + 1)
  ctx.stroke()
}

function antenne(ctx: CanvasRenderingContext2D, p: Point, t: number): void {
  ctx.strokeStyle = '#c9d2e0'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(p.sx, p.sy)
  ctx.lineTo(p.sx, p.sy - 18)
  ctx.moveTo(p.sx - 4, p.sy - 12)
  ctx.lineTo(p.sx + 4, p.sy - 12)
  ctx.moveTo(p.sx - 3, p.sy - 15)
  ctx.lineTo(p.sx + 3, p.sy - 15)
  ctx.stroke()
  ctx.fillStyle = Math.sin(t * 4) > 0 ? '#ff5f7a' : 'rgba(255,95,122,0.3)'
  ctx.beginPath()
  ctx.arc(p.sx, p.sy - 18, 1.6, 0, Math.PI * 2)
  ctx.fill()
}

function satellit(ctx: CanvasRenderingContext2D, p: Point): void {
  ctx.fillStyle = '#e6e9ee'
  ctx.beginPath()
  ctx.ellipse(p.sx, p.sy - 4, 3.4, 2.4, -0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#8a93a0'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(p.sx, p.sy - 4)
  ctx.lineTo(p.sx + 2, p.sy)
  ctx.stroke()
}

function hubschrauberplatz(ctx: CanvasRenderingContext2D, p: Point): void {
  ctx.fillStyle = '#3a414c'
  ctx.beginPath()
  ctx.ellipse(p.sx, p.sy, 11, 5.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#ffd23f'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.ellipse(p.sx, p.sy, 9, 4.4, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.3
  ctx.beginPath()
  ctx.moveTo(p.sx - 3, p.sy - 1.8)
  ctx.lineTo(p.sx - 3, p.sy + 1.8)
  ctx.moveTo(p.sx + 3, p.sy - 1.8)
  ctx.lineTo(p.sx + 3, p.sy + 1.8)
  ctx.moveTo(p.sx - 3, p.sy)
  ctx.lineTo(p.sx + 3, p.sy)
  ctx.stroke()
}

function blaulicht(ctx: CanvasRenderingContext2D, p: Point, t: number, farbe: string): void {
  const an = Math.sin(t * 9) > 0
  ctx.fillStyle = '#2a3140'
  ctx.fillRect(p.sx - 4, p.sy - 3, 8, 3)
  ctx.fillStyle = an ? farbe : fade(farbe, 0.35)
  ctx.fillRect(p.sx - 3.5, p.sy - 5.5, 3, 2.6)
  ctx.fillStyle = !an ? farbe : fade(farbe, 0.35)
  ctx.fillRect(p.sx + 0.5, p.sy - 5.5, 3, 2.6)
  if (an) {
    ctx.fillStyle = fade(farbe, 0.2)
    ctx.beginPath()
    ctx.arc(p.sx - 2, p.sy - 4, 7, 0, Math.PI * 2)
    ctx.fill()
  }
}

function sirene(ctx: CanvasRenderingContext2D, p: Point): void {
  ctx.fillStyle = '#9aa3ad'
  ctx.fillRect(p.sx - 0.8, p.sy - 10, 1.6, 10)
  ctx.fillStyle = '#c9d2e0'
  ctx.beginPath()
  ctx.ellipse(p.sx, p.sy - 11, 4, 2.2, 0, 0, Math.PI * 2)
  ctx.fill()
}

function dachterrasse(ctx: CanvasRenderingContext2D, p: Point, seed: number): void {
  ctx.fillStyle = '#b98a54'
  ctx.beginPath()
  ctx.moveTo(p.sx - 10, p.sy)
  ctx.lineTo(p.sx, p.sy + 5)
  ctx.lineTo(p.sx + 10, p.sy)
  ctx.lineTo(p.sx, p.sy - 5)
  ctx.closePath()
  ctx.fill()
  // Kübelpflanzen und ein Sonnenschirm
  ctx.fillStyle = '#3f8f52'
  ctx.beginPath()
  ctx.arc(p.sx - 6, p.sy - 3, 2.6, 0, Math.PI * 2)
  ctx.arc(p.sx + 5, p.sy - 4, 2.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#8a8f99'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(p.sx + 1, p.sy)
  ctx.lineTo(p.sx + 1, p.sy - 9)
  ctx.stroke()
  ctx.fillStyle = griff(['#ff7ab5', '#ffd23f', '#7bdcff', '#ffffff'], seed, 7)
  ctx.beginPath()
  ctx.ellipse(p.sx + 1, p.sy - 9, 6, 2.4, 0, Math.PI, 0)
  ctx.fill()
}

function schlot(ctx: CanvasRenderingContext2D, p: Point, t: number, seed: number): void {
  const hoch = 34
  const unten = 4.6
  const oben = 3.2
  ctx.fillStyle = '#9c5a48'
  ctx.beginPath()
  ctx.moveTo(p.sx - unten, p.sy)
  ctx.lineTo(p.sx + unten, p.sy)
  ctx.lineTo(p.sx + oben, p.sy - hoch)
  ctx.lineTo(p.sx - oben, p.sy - hoch)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  ctx.fillRect(p.sx - oben, p.sy - hoch, 1.6, hoch)
  // weiß-rote Ringe oben
  ctx.fillStyle = '#e8e8e8'
  ctx.fillRect(p.sx - oben - 0.3, p.sy - hoch + 3, oben * 2 + 0.6, 2)
  ctx.fillStyle = '#d63a2e'
  ctx.fillRect(p.sx - oben - 0.3, p.sy - hoch + 6, oben * 2 + 0.6, 2)
  wolke(ctx, { sx: p.sx, sy: p.sy - hoch }, t, seed, 0.45, '#c8ccd4', 1.4)
}

// ---------------------------------------------------------------------------
// Vorgarten und Grundstück
// ---------------------------------------------------------------------------

/** Zaun oder Hecke entlang der Grundstücksgrenze – nur eine Seite */
function zaunSeite(ctx: CanvasRenderingContext2D, a: Point, b: Point, art: 'hecke' | 'zaun' | 'stachel'): void {
  if (art === 'hecke') {
    const n = Math.max(3, Math.round(Math.hypot(b.sx - a.sx, b.sy - a.sy) / 5))
    ctx.fillStyle = '#3f8f52'
    for (let i = 0; i <= n; i++) {
      const p = mix(a, b, i / n)
      ctx.beginPath()
      ctx.arc(p.sx, p.sy - 2.6, 2.8, 0, Math.PI * 2)
      ctx.fill()
    }
    return
  }
  const hoch = art === 'stachel' ? 8 : 4.5
  ctx.strokeStyle = art === 'stachel' ? '#7a8088' : '#f2efe8'
  ctx.lineWidth = art === 'stachel' ? 0.8 : 1
  ctx.beginPath()
  const n = Math.max(2, Math.round(Math.hypot(b.sx - a.sx, b.sy - a.sy) / 5))
  for (let i = 0; i <= n; i++) {
    const p = mix(a, b, i / n)
    ctx.moveTo(p.sx, p.sy)
    ctx.lineTo(p.sx, p.sy - hoch)
  }
  ctx.moveTo(a.sx, a.sy - hoch * 0.8)
  ctx.lineTo(b.sx, b.sy - hoch * 0.8)
  ctx.moveTo(a.sx, a.sy - hoch * 0.4)
  ctx.lineTo(b.sx, b.sy - hoch * 0.4)
  ctx.stroke()
  if (art === 'stachel') {
    // Stacheldraht als Zickzack obenauf
    ctx.strokeStyle = '#9aa0a8'
    ctx.lineWidth = 0.6
    ctx.beginPath()
    const zacken = n * 3
    for (let i = 0; i <= zacken; i++) {
      const p = mix(a, b, i / zacken)
      if (i === 0) ctx.moveTo(p.sx, p.sy - hoch - (i % 2) * 1.6)
      else ctx.lineTo(p.sx, p.sy - hoch - (i % 2) * 1.6)
    }
    ctx.stroke()
  }
}

/** Ein Busch oder eine Blumengruppe */
function busch(ctx: CanvasRenderingContext2D, p: Point, seed: number): void {
  ctx.fillStyle = '#2f7d46'
  ctx.beginPath()
  ctx.arc(p.sx, p.sy - 3, 3.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#46b972'
  ctx.beginPath()
  ctx.arc(p.sx - 1, p.sy - 4, 2.4, 0, Math.PI * 2)
  ctx.fill()
  if (wobble(seed, 5) > 0.5) {
    ctx.fillStyle = griff(['#ff7ab5', '#ffd23f', '#ffffff', '#ff6b6b'], seed, 6)
    ctx.beginPath()
    ctx.arc(p.sx + 1.5, p.sy - 5, 0.9, 0, Math.PI * 2)
    ctx.arc(p.sx - 2, p.sy - 2.5, 0.9, 0, Math.PI * 2)
    ctx.fill()
  }
}

function sonnenschirmTisch(ctx: CanvasRenderingContext2D, p: Point, farbe: string): void {
  ctx.fillStyle = '#6b4a2f'
  ctx.fillRect(p.sx - 0.5, p.sy - 5, 1, 5)
  ctx.fillStyle = '#e8e2d6'
  ctx.beginPath()
  ctx.ellipse(p.sx, p.sy - 4, 3, 1.4, 0, 0, Math.PI * 2)
  ctx.fill()
  // Stühle
  ctx.fillStyle = '#5a4a3a'
  ctx.fillRect(p.sx - 5, p.sy - 3, 1.6, 3)
  ctx.fillRect(p.sx + 3.4, p.sy - 3, 1.6, 3)
  ctx.strokeStyle = '#8a8f99'
  ctx.lineWidth = 0.7
  ctx.beginPath()
  ctx.moveTo(p.sx, p.sy - 4)
  ctx.lineTo(p.sx, p.sy - 11)
  ctx.stroke()
  ctx.fillStyle = farbe
  ctx.beginPath()
  ctx.ellipse(p.sx, p.sy - 11, 6, 2.6, 0, Math.PI, 0)
  ctx.fill()
}

function fahrradAnWand(ctx: CanvasRenderingContext2D, p: Point, farbe: string): void {
  ctx.strokeStyle = '#1c2230'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.arc(p.sx - 3, p.sy - 2, 2, 0, Math.PI * 2)
  ctx.moveTo(p.sx + 5, p.sy - 2)
  ctx.arc(p.sx + 3, p.sy - 2, 2, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = farbe
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(p.sx - 3, p.sy - 2)
  ctx.lineTo(p.sx, p.sy - 5)
  ctx.lineTo(p.sx + 3, p.sy - 2)
  ctx.moveTo(p.sx, p.sy - 5)
  ctx.lineTo(p.sx + 2.5, p.sy - 5.5)
  ctx.stroke()
}

function muelltonnen(ctx: CanvasRenderingContext2D, p: Point): void {
  const farben = ['#3a4a5a', '#2f7d46', '#2e86c1']
  farben.forEach((farbe, i) => {
    const x = p.sx - 5 + i * 4
    ctx.fillStyle = farbe
    ctx.fillRect(x, p.sy - 5, 3.4, 5)
    ctx.fillStyle = shade(farbe, 20)
    ctx.fillRect(x - 0.2, p.sy - 5.8, 3.8, 1.2)
  })
}

function briefkasten(ctx: CanvasRenderingContext2D, p: Point): void {
  ctx.fillStyle = '#8a8f99'
  ctx.fillRect(p.sx - 0.5, p.sy - 5, 1, 5)
  ctx.fillStyle = '#f4d35e'
  ctx.fillRect(p.sx - 2, p.sy - 7.5, 4, 3)
}

function fahnenmast(ctx: CanvasRenderingContext2D, p: Point, t: number, farbe: string): void {
  ctx.fillStyle = '#d7dbe2'
  ctx.fillRect(p.sx - 0.7, p.sy - 26, 1.4, 26)
  const weht = Math.sin(t * 3) * 2
  ctx.fillStyle = farbe
  ctx.beginPath()
  ctx.moveTo(p.sx + 0.7, p.sy - 26)
  ctx.quadraticCurveTo(p.sx + 6, p.sy - 25 + weht, p.sx + 11, p.sy - 23 + weht)
  ctx.lineTo(p.sx + 11, p.sy - 19 + weht)
  ctx.quadraticCurveTo(p.sx + 6, p.sy - 20 - weht, p.sx + 0.7, p.sy - 19)
  ctx.closePath()
  ctx.fill()
}

function kessel(ctx: CanvasRenderingContext2D, p: Point): void {
  ctx.fillStyle = '#b87333'
  ctx.fillRect(p.sx - 4, p.sy - 14, 8, 14)
  ctx.beginPath()
  ctx.ellipse(p.sx, p.sy - 14, 4, 2, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#d4904a'
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.fillRect(p.sx - 3.2, p.sy - 13, 1.4, 12)
}

/** Zapfsäulen unter einem Dach auf Stelzen */
function tankdach(ctx: CanvasRenderingContext2D, g: Grund, farbe: string, fein: boolean): void {
  const innen: Grund = { x: g.x + g.w * 0.12, y: g.y + g.h * 0.12, w: g.w * 0.76, h: g.h * 0.76 }
  const hoch = 24
  const [b0, b1, b2, b3] = umlauf(innen)
  // Stützen
  ctx.fillStyle = '#d7dbe2'
  for (const p of [b0, b1, b2, b3]) ctx.fillRect(p.sx - 1, p.sy - hoch, 2, hoch)
  // Zapfsäulen
  const m = umlauf({ x: innen.x + innen.w * 0.3, y: innen.y + innen.h * 0.3, w: innen.w * 0.4, h: innen.h * 0.4 })
  for (const p of [m[0], m[2]]) {
    ctx.fillStyle = '#f4f4f4'
    ctx.fillRect(p.sx - 2.5, p.sy - 8, 5, 8)
    ctx.fillStyle = farbe
    ctx.fillRect(p.sx - 2.5, p.sy - 8, 5, 2)
    if (fein) {
      ctx.fillStyle = '#1c2230'
      ctx.fillRect(p.sx - 1.5, p.sy - 5.5, 3, 1.6)
    }
  }
  // Dach mit Farbstreifen
  const [d0, d1, d2, d3] = umlauf(innen, hoch)
  quad(ctx, d0, d1, d2, d3, '#f4f4f4')
  const kanten = waende(innen, hoch - 3)
  for (const s of SEITEN) {
    const k = kanten[s]
    if (!k.sichtbar) continue
    quad(ctx, k.a, k.b, lift(k.b, 3), lift(k.a, 3), farbe)
  }
  if (fein) {
    // Licht unter dem Dach
    ctx.fillStyle = 'rgba(255,248,220,0.18)'
    const [u0, u1, u2, u3] = umlauf(innen)
    quad(ctx, u0, u1, u2, u3, 'rgba(255,248,220,0.18)')
  }
}

/** Säulen vor dem Eingang, oben ein Gebälk */
function saeulen(ctx: CanvasRenderingContext2D, w: Wand, hoehe: number, farbe: string): void {
  const vor = { sx: w.raus.sx * 5, sy: w.raus.sy * 5 }
  const n = 4
  const hoch = Math.min(hoehe * 0.8, 26)
  for (let i = 0; i < n; i++) {
    const p = mix(w.a, w.b, 0.25 + (i / (n - 1)) * 0.5)
    const q = { sx: p.sx + vor.sx, sy: p.sy + vor.sy }
    ctx.fillStyle = '#f7f3ea'
    ctx.fillRect(q.sx - 1.6, q.sy - hoch, 3.2, hoch)
    ctx.fillStyle = 'rgba(0,0,0,0.12)'
    ctx.fillRect(q.sx + 0.6, q.sy - hoch, 1, hoch)
  }
  const a = lift(mix(w.a, w.b, 0.2), hoch)
  const b = lift(mix(w.a, w.b, 0.8), hoch)
  quad(ctx, a, b, { sx: b.sx + vor.sx, sy: b.sy + vor.sy }, { sx: a.sx + vor.sx, sy: a.sy + vor.sy }, shade(farbe, 12))
  quad(ctx, { sx: a.sx + vor.sx, sy: a.sy + vor.sy }, { sx: b.sx + vor.sx, sy: b.sy + vor.sy }, { sx: b.sx + vor.sx, sy: b.sy + vor.sy - 3 }, { sx: a.sx + vor.sx, sy: a.sy + vor.sy - 3 }, shade(farbe, -6))
}

/** Markise über dem Erdgeschoss */
function markise(ctx: CanvasRenderingContext2D, w: Wand, hoehe: number, farbe: string, fein: boolean): void {
  const z = Math.min(hoehe * 0.62, 16)
  const a = lift(mix(w.a, w.b, 0.06), z)
  const b = lift(mix(w.a, w.b, 0.94), z)
  const vor = { sx: w.raus.sx * 7, sy: w.raus.sy * 7 + 4.5 }
  const weg = (p: Point): Point => ({ sx: p.sx + vor.sx, sy: p.sy + vor.sy })
  quad(ctx, a, b, weg(b), weg(a), farbe)
  if (!fein) return
  for (let i = 0; i < 7; i += 2) {
    const s0 = mix(a, b, i / 8)
    const s1 = mix(a, b, (i + 1) / 8)
    quad(ctx, s0, s1, weg(s1), weg(s0), fade('#ffffff', 0.6))
  }
  // Volant: kleine Bögen an der Vorderkante
  ctx.fillStyle = shade(farbe, -18)
  const n = 8
  for (let i = 0; i < n; i++) {
    const p = weg(mix(a, b, (i + 0.5) / n))
    ctx.beginPath()
    ctx.arc(p.sx, p.sy, 1.4, 0, Math.PI)
    ctx.fill()
  }
}

/** Schild über dem Eingang, mit dem Zeichen des Ladens */
function schild(ctx: CanvasRenderingContext2D, w: Wand, hoehe: number, zeichen: string, farbe: string): void {
  const p = lift(mix(w.a, w.b, 0.5), Math.min(hoehe - 3, 21))
  ctx.fillStyle = shade(farbe, -30)
  roundedPath(ctx, p.sx - 8, p.sy - 8, 16, 9, 2)
  ctx.fill()
  ctx.fillStyle = '#fbf7ee'
  roundedPath(ctx, p.sx - 7, p.sy - 7, 14, 7, 1.5)
  ctx.fill()
  if (zeichen) {
    ctx.font = '6.5px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(zeichen, p.sx, p.sy - 3.4)
  }
}

/** Leuchtschrift: ein glimmender Balken über dem Eingang */
function leuchtschrift(ctx: CanvasRenderingContext2D, w: Wand, hoehe: number, neon: string, t: number, seed: number): void {
  const z = Math.min(hoehe - 2, 24)
  const a = lift(mix(w.a, w.b, 0.18), z)
  const b = lift(mix(w.a, w.b, 0.82), z)
  const flacker = 0.75 + 0.25 * Math.sin(t * 6 + seed * 10)
  quad(ctx, a, b, lift(b, 5), lift(a, 5), '#141018')
  // Leuchtende Buchstaben als kurze Striche
  ctx.strokeStyle = fade(neon, flacker)
  ctx.lineWidth = 1.2
  ctx.beginPath()
  const n = 6
  for (let i = 0; i < n; i++) {
    const p = lift(mix(a, b, (i + 0.5) / n), 1.2)
    ctx.moveTo(p.sx - 1.2, p.sy)
    ctx.lineTo(p.sx + 1.2, p.sy - 2.6)
  }
  ctx.stroke()
  // Schein um die Schrift
  ctx.fillStyle = fade(neon, 0.12 * flacker)
  const m = mix(a, b, 0.5)
  ctx.beginPath()
  ctx.ellipse(m.sx, m.sy - 2.5, Math.hypot(b.sx - a.sx, b.sy - a.sy) * 0.6, 7, 0, 0, Math.PI * 2)
  ctx.fill()
}

/** Ein Kreuz hoch an der Wand – rot für Ärzte, grün für die Apotheke */
function kreuz(ctx: CanvasRenderingContext2D, w: Wand, hoehe: number, farbe: string): void {
  const m = lift(mix(w.a, w.b, 0.82), Math.min(hoehe - 5, hoehe * 0.75))
  const r = { sx: (w.b.sx - w.a.sx) / Math.hypot(w.b.sx - w.a.sx, w.b.sy - w.a.sy), sy: (w.b.sy - w.a.sy) / Math.hypot(w.b.sx - w.a.sx, w.b.sy - w.a.sy) }
  const breit = 1.6
  const lang = 4.2
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(m.sx, m.sy, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = farbe
  // waagrechter Balken entlang der Wand, senkrechter nach oben
  quad(
    ctx,
    { sx: m.sx - r.sx * lang, sy: m.sy - r.sy * lang + breit },
    { sx: m.sx + r.sx * lang, sy: m.sy + r.sy * lang + breit },
    { sx: m.sx + r.sx * lang, sy: m.sy + r.sy * lang - breit },
    { sx: m.sx - r.sx * lang, sy: m.sy - r.sy * lang - breit },
    farbe,
  )
  quad(
    ctx,
    { sx: m.sx - r.sx * breit, sy: m.sy - r.sy * breit + lang },
    { sx: m.sx + r.sx * breit, sy: m.sy + r.sy * breit + lang },
    { sx: m.sx + r.sx * breit, sy: m.sy + r.sy * breit - lang },
    { sx: m.sx - r.sx * breit, sy: m.sy - r.sy * breit - lang },
    farbe,
  )
}

// ---------------------------------------------------------------------------
// Das ganze Gebäude
// ---------------------------------------------------------------------------

export function drawBau(ctx: CanvasRenderingContext2D, e: BauEingabe): void {
  const { stil, look, lot, stufe, seed, time: t, fein, vorn } = e
  const extras = zugabenVon(stil, seed, stufe)
  const wandFarbe = griff(stil.farben, seed, 1)
  const dachFarbe = griff(stil.dachfarben ?? [look.roof], seed, 2)
  const neon = stil.neon ?? '#ff4fd8'
  const k = koerperVon(lot, stil, vorn, stufe, e.einzug)
  const hof = vorgarten(lot, k, vorn)
  const hofVorn = seiteVorn(vorn)
  const H = e.hoehe
  const licht = 'rgba(255,214,132,0.92)'
  const ladenFarbe = griff(['#2f6b46', '#2c5b8c', '#6b3a2c', '#3a3f46', '#8c2c3a'], seed, 12)

  // --- Boden: Rasen, Pool, Parkplatz – flach, das Haus verdeckt davon, was es verdeckt
  if (extras.has('garten') || extras.has('pool')) {
    const [g0, g1, g2, g3] = umlauf({ x: lot.x + 0.03, y: lot.y + 0.03, w: lot.w - 0.06, h: lot.h - 0.06 })
    quad(ctx, g0, g1, g2, g3, 'rgba(90,170,90,0.55)')
  }
  if (hof && extras.has('parkplatz')) {
    const [p0, p1, p2, p3] = umlauf(hof)
    quad(ctx, p0, p1, p2, p3, '#4a4f58')
    if (fein) {
      ctx.strokeStyle = fade('#ffffff', 0.7)
      ctx.lineWidth = 0.8
      ctx.beginPath()
      for (let i = 1; i < 5; i++) {
        const a = toScreen(imVorgarten(hof, vorn, i / 5, 0.12).x, imVorgarten(hof, vorn, i / 5, 0.12).y)
        const b = toScreen(imVorgarten(hof, vorn, i / 5, 0.6).x, imVorgarten(hof, vorn, i / 5, 0.6).y)
        ctx.moveTo(a.sx, a.sy)
        ctx.lineTo(b.sx, b.sy)
      }
      ctx.stroke()
    }
  }
  if (hof && extras.has('zapfsaeulen')) {
    const [p0, p1, p2, p3] = umlauf(hof)
    quad(ctx, p0, p1, p2, p3, '#5a5f68')
  }
  if (hof && extras.has('pool')) {
    const becken: Grund = {
      x: hof.x + hof.w * 0.18,
      y: hof.y + hof.h * 0.2,
      w: hof.w * 0.64,
      h: hof.h * 0.55,
    }
    const [r0, r1, r2, r3] = umlauf({ x: becken.x - 0.04, y: becken.y - 0.04, w: becken.w + 0.08, h: becken.h + 0.08 })
    quad(ctx, r0, r1, r2, r3, '#eef2f5')
    const [w0, w1, w2, w3] = umlauf(becken)
    quad(ctx, w0, w1, w2, w3, '#3fb7e6')
    if (fein) {
      ctx.strokeStyle = fade('#ffffff', 0.55)
      ctx.lineWidth = 0.8
      const m = toScreen(becken.x + becken.w / 2, becken.y + becken.h / 2)
      ctx.beginPath()
      ctx.moveTo(m.sx - 6, m.sy + Math.sin(t * 2) * 1)
      ctx.lineTo(m.sx + 6, m.sy - Math.sin(t * 2) * 1)
      ctx.stroke()
    }
  }

  // --- Was auf dem Grundstück steht, vor oder hinter dem Haus
  const vorHaus: (() => void)[] = []
  const hinterHaus: (() => void)[] = []
  const stelle = (seite: Seite, malen: () => void) => (seiteVorn(seite) ? vorHaus : hinterHaus).push(malen)

  // Grundstücksgrenze: Hecke, Zaun oder Stacheldraht, Seite für Seite
  const zaun: 'hecke' | 'zaun' | 'stachel' | null = extras.has('stacheldraht') ? 'stachel' : extras.has('garten') ? (wobble(seed, 70) < 0.5 ? 'hecke' : 'zaun') : null
  if (zaun && fein) {
    const rand = waende({ x: lot.x + 0.03, y: lot.y + 0.03, w: lot.w - 0.06, h: lot.h - 0.06 })
    for (const s of SEITEN) {
      // Zur Straße hin bleibt eine Lücke für den Weg zur Tür
      if (s === vorn && zaun !== 'stachel') {
        stelle(s, () => {
          zaunSeite(ctx, rand[s].a, mix(rand[s].a, rand[s].b, 0.38), zaun)
          zaunSeite(ctx, mix(rand[s].a, rand[s].b, 0.62), rand[s].b, zaun)
        })
      } else {
        stelle(s, () => zaunSeite(ctx, rand[s].a, rand[s].b, zaun))
      }
    }
  }

  if (hof) {
    const imHof = (u: number, v: number) => {
      const p = imVorgarten(hof, vorn, u, v)
      return toScreen(p.x, p.y)
    }
    const hofMalen = (malen: () => void) => (hofVorn ? vorHaus : hinterHaus).push(malen)
    if (extras.has('garten') && fein) {
      hofMalen(() => {
        busch(ctx, imHof(0.12, 0.7), seed + 1)
        busch(ctx, imHof(0.88, 0.62), seed + 2)
      })
    }
    if (extras.has('tische')) {
      hofMalen(() => {
        sonnenschirmTisch(ctx, imHof(0.25, 0.45), griff(['#e74c3c', '#27ae60', '#2e86c1', '#f39c12'], seed, 20))
        sonnenschirmTisch(ctx, imHof(0.72, 0.5), griff(['#e74c3c', '#27ae60', '#2e86c1', '#f39c12'], seed, 21))
      })
    }
    if (extras.has('parkplatz')) {
      const modelle: Modell[] = ['kompakt', 'limousine', 'kombi', 'suv', 'kleinwagen', 'van']
      const farben = ['#e94f5a', '#3f9ee0', '#f2f2f2', '#2c2f36', '#7a8290', '#f2c14e', '#6ab04c']
      hofMalen(() => {
        for (let i = 0; i < 3; i++) {
          if (wobble(seed, 30 + i) < 0.35) continue
          const p = imVorgarten(hof, vorn, (i + 0.5) / 4 + 0.05, 0.36)
          const quer = vorn === 'o' || vorn === 'w' ? [1, 0] : [0, 1]
          zeichneAuto(ctx, toScreen(p.x, p.y), quer[0], quer[1], griff(modelle, seed, 31 + i), griff(farben, seed, 35 + i), {
            t,
            seed: seed + i,
            fein,
            geparkt: true,
          })
        }
      })
    }
    if (extras.has('wracks')) {
      const rost = ['#8a5a3a', '#6b6660', '#7a4a3a', '#8a7a5a']
      hofMalen(() => {
        for (let i = 0; i < 3; i++) {
          const p = imVorgarten(hof, vorn, 0.2 + i * 0.3, 0.3 + (i % 2) * 0.3)
          zeichneAuto(ctx, toScreen(p.x, p.y), i % 2 ? 1 : 0.3, i % 2 ? 0.2 : 1, i === 1 ? 'transporter' : 'limousine', griff(rost, seed, 40 + i), {
            t,
            seed: seed + i * 3,
            fein,
            geparkt: true,
            wrack: true,
          })
        }
      })
    }
    if (extras.has('kessel')) {
      hofMalen(() => {
        kessel(ctx, imHof(0.2, 0.4))
        kessel(ctx, imHof(0.38, 0.55))
      })
    }
    if (extras.has('zapfsaeulen')) {
      hofMalen(() => tankdach(ctx, hof, neon, fein))
    }
    if (extras.has('fahnenmast')) {
      hofMalen(() => fahnenmast(ctx, imHof(0.9, 0.8), t, griff(['#2e86de', '#d63a2e', '#27ae60', '#f4d35e'], seed, 50)))
    }
    if (extras.has('briefkasten') && fein) {
      hofMalen(() => briefkasten(ctx, imHof(0.3, 0.92)))
    }
  }

  // Hinter dem Haus zuerst
  for (const malen of hinterHaus) malen()

  // --- Schatten des Baukörpers, knapp darunter und nach vorn unten
  {
    const wurf = 1.4 + Math.min(2, look.height * 0.5)
    const [s0, s1, s2, s3] = umlauf(k).map((p) => ({ sx: p.sx, sy: p.sy + wurf }))
    ctx.save()
    ctx.globalAlpha = 0.26
    quad(ctx, s0, s1, s2, s3, '#0b1424')
    ctx.restore()
  }

  // --- Schlauchturm: ein schmaler Turm an der hinteren Ecke, vor oder hinter dem Haus
  const turm: Grund | null = extras.has('schlauchturm') ? { x: k.x + 0.02, y: k.y + 0.02, w: 0.28, h: 0.28 } : null
  const turmMalen = () => {
    if (!turm) return
    const hoch = H + 30
    const w4 = waende(turm)
    for (const s of SEITEN) {
      const w = w4[s]
      if (!w.sichtbar) continue
      quad(ctx, w.a, w.b, lift(w.b, hoch), lift(w.a, hoch), shade(wandFarbe, w.ton))
    }
    const [d0, d1, d2, d3] = umlauf(turm, hoch)
    quad(ctx, d0, d1, d2, d3, shade(dachFarbe, 10))
  }
  const turmVorn = turm ? toScreen(turm.x + turm.w / 2, turm.y + turm.h / 2).sy > toScreen(k.x + k.w / 2, k.y + k.h / 2).sy : false
  if (turm && !turmVorn) turmMalen()

  // --- Wände
  const fs: FassadenStil = {
    art: stil.fassade ?? 'putz',
    fenster: stil.fenster ?? 'normal',
    floors: Math.max(1, (look.floors ?? 1) + (stufe - 1)),
    seed,
    fein,
    licht,
    vorn: false,
    unten: stil.unten ?? 'tuer',
    extras,
    neon,
    akzent: look.accent,
    laden: ladenFarbe,
  }
  const alle = waende(k)
  const sichtbar = SEITEN.map((s) => alle[s])
    .filter((w) => w.sichtbar)
    .sort((a, b) => a.tiefe - b.tiefe)
  for (const w of sichtbar) {
    wand(ctx, w, H, shade(wandFarbe, w.ton), { ...fs, vorn: w.seite === vorn })
  }
  if (fein && sichtbar.length === 2 && H > 10) {
    const unten = umlauf(k).reduce((a, b) => (b.sy > a.sy ? b : a))
    ctx.strokeStyle = fade('#ffffff', 0.16)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(unten.sx, unten.sy)
    ctx.lineTo(unten.sx, unten.sy - H)
    ctx.stroke()
  }

  // Was an der Straßenseite hängt
  const front = alle[vorn]
  if (front.sichtbar) {
    if (extras.has('balkone') && fein) balkone(ctx, front, H, wandFarbe, fs.floors, seed)
    if (extras.has('markise')) markise(ctx, front, H, look.accent, fein)
    if (extras.has('kreuz')) kreuz(ctx, front, H, neon === '#2ecc71' ? '#2ecc71' : '#d63a2e')
    if (extras.has('leuchtschrift')) leuchtschrift(ctx, front, H, neon, t, seed)
    else if (extras.has('schild') && fein) schild(ctx, front, H, stil.schild ?? '', look.accent)
  }

  // --- Dach und was darauf sitzt
  const auf: AufDach[] = []
  const imK = (u: number, v: number) => ({ x: k.x + k.w * u, y: k.y + k.h * v })
  if (fein) {
    if (extras.has('schornstein')) {
      const p = imK(0.74, 0.3)
      auf.push({ ...p, malen: (q) => schornstein(ctx, q, 8 + stufe * 2, stufe >= 2 || extras.has('rauch'), t, seed) })
    }
    if (extras.has('gaube')) {
      // Gauben auf der Seite zur Straße, damit man sie sieht, wenn man davorsteht
      const v = vorn === 's' || vorn === 'o' ? 0.78 : 0.22
      const quer = vorn === 'o' || vorn === 'w'
      const orte = stufe >= 2 ? [0.3, 0.7] : [0.5]
      for (const u of orte) {
        const p = quer ? imK(v, u) : imK(u, v)
        auf.push({ ...p, malen: (q) => gaube(ctx, q, wandFarbe, dachFarbe, licht) })
      }
    }
    if (extras.has('solar')) {
      const p = imK(0.35, 0.62)
      auf.push({ ...p, malen: (q) => solar(ctx, q) })
    }
    if (extras.has('satellit')) {
      const p = imK(0.2, 0.25)
      auf.push({ ...p, malen: (q) => satellit(ctx, q) })
    }
    if (extras.has('antenne')) {
      const p = imK(0.78, 0.72)
      auf.push({ ...p, malen: (q) => antenne(ctx, q, t) })
    }
    if (extras.has('dachterrasse')) {
      const p = imK(0.42, 0.45)
      auf.push({ ...p, malen: (q) => dachterrasse(ctx, q, seed) })
    }
    if (extras.has('sirene')) {
      const p = imK(0.8, 0.2)
      auf.push({ ...p, malen: (q) => sirene(ctx, q) })
    }
  }
  if (extras.has('heli')) {
    const p = imK(0.5, 0.5)
    auf.push({ ...p, malen: (q) => hubschrauberplatz(ctx, q) })
  }
  if (extras.has('blaulicht')) {
    // An der Dachkante zur Straße
    const v = vorn === 's' || vorn === 'o' ? 0.9 : 0.1
    const quer = vorn === 'o' || vorn === 'w'
    const p = quer ? imK(v, 0.5) : imK(0.5, v)
    auf.push({ ...p, malen: (q) => blaulicht(ctx, q, t, neon) })
  }
  if (extras.has('schlot')) {
    const p = imK(0.86, 0.18)
    auf.push({ ...p, malen: (q) => schlot(ctx, q, t, seed) })
  }
  if (extras.has('rauch') && !extras.has('schlot') && !extras.has('schornstein')) {
    const p = imK(0.5, 0.5)
    auf.push({ ...p, malen: (q) => wolke(ctx, q, t, seed, 0.5, stil.neon ? fade(stil.neon, 1) : '#d8e0ea') })
  }

  // Gewächshaus: Glasdach und lila Licht im Inneren
  if (extras.has('gewaechshaus')) {
    const [i0, i1, i2, i3] = umlauf({ x: k.x + 0.05, y: k.y + 0.05, w: k.w - 0.1, h: k.h - 0.1 }, H * 0.5)
    quad(ctx, i0, i1, i2, i3, fade(neon, 0.28 + 0.06 * Math.sin(t * 1.5)))
    if (fein) {
      // Pflanzenreihen
      ctx.fillStyle = 'rgba(40,120,60,0.8)'
      for (let i = 0; i < 6; i++) {
        const p = toScreen(k.x + k.w * (0.15 + (i % 3) * 0.35), k.y + k.h * (i < 3 ? 0.3 : 0.7))
        ctx.beginPath()
        ctx.arc(p.sx, p.sy - H * 0.55, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  dach(ctx, stil.dach, k, H, dachFarbe, shade(wandFarbe, -4), vorn, stufe, fein, auf)

  if (turm && turmVorn) turmMalen()

  // Säulen und alles vor dem Haus
  if (front.sichtbar && extras.has('saeulen')) saeulen(ctx, front, H, wandFarbe)
  if (front.sichtbar && fein) {
    if (extras.has('fahrrad')) fahrradAnWand(ctx, { sx: mix(front.a, front.b, 0.18).sx + front.raus.sx * 3, sy: mix(front.a, front.b, 0.18).sy + front.raus.sy * 3 }, griff(['#e74c3c', '#2e86c1', '#27ae60', '#1c1c1c'], seed, 55))
    if (extras.has('muell')) muelltonnen(ctx, { sx: mix(front.a, front.b, 0.86).sx + front.raus.sx * 3, sy: mix(front.a, front.b, 0.86).sy + front.raus.sy * 3 })
  }
  for (const malen of vorHaus) malen()
}

/**
 * Umriss für die Trefferprüfung: das ganze Grundstück am Boden, der Baukörper bis
 * zum Dach, dazu hohe Aufbauten wie Schlot und Schlauchturm.
 */
export function umrissBau(e: Omit<BauEingabe, 'time' | 'fein'>): Point[] {
  const { stil, lot, stufe, seed, vorn } = e
  const extras = zugabenVon(stil, seed, stufe)
  const k = koerperVon(lot, stil, vorn, stufe, e.einzug)
  const H = e.hoehe
  const kurz = Math.min(k.w, k.h)
  const rise = stil.dach === 'flach' ? 5 : TILE_H * (0.34 + 0.24 * Math.min(1.4, kurz)) + (stufe - 1) * 2.5
  const punkte: Point[] = [...umlauf(lot), ...umlauf(k, H + (stil.dach === 'flach' ? 4 : 0))]
  punkte.push(lift(toScreen(k.x + k.w / 2, k.y + k.h / 2), H + rise))
  if (stil.dach === 'sattel' || stil.dach === 'walm') {
    // Firstenden
    const laengsX = k.w >= k.h
    const c = { x: k.x + k.w / 2, y: k.y + k.h / 2 }
    const f1 = laengsX ? toScreen(k.x, c.y) : toScreen(c.x, k.y)
    const f2 = laengsX ? toScreen(k.x + k.w, c.y) : toScreen(c.x, k.y + k.h)
    punkte.push(lift(f1, H + rise), lift(f2, H + rise))
  }
  if (extras.has('schlot')) punkte.push(lift(toScreen(k.x + k.w * 0.86, k.y + k.h * 0.18), H + 40))
  if (extras.has('schlauchturm')) punkte.push(lift(toScreen(k.x + 0.16, k.y + 0.16), H + 30))
  if (extras.has('antenne')) punkte.push(lift(toScreen(k.x + k.w * 0.78, k.y + k.h * 0.72), H + 18))
  if (extras.has('zapfsaeulen')) {
    const hof = vorgarten(lot, k, vorn)
    if (hof) punkte.push(...umlauf(hof, 24))
  }
  return punkte
}

/** Die Wand zur Straße: wo Menschen hinein- und hinausgehen */
export function eingangVon(lot: Grund, stil: Stil | undefined, vorn: Seite, stufe: number, einzug: number): { x: number; y: number } {
  const k = stil ? koerperVon(lot, stil, vorn, stufe, einzug) : { x: lot.x + einzug, y: lot.y + einzug, w: lot.w - 2 * einzug, h: lot.h - 2 * einzug }
  const [nx, ny] = NORMALE[vorn]
  const mitte = { x: k.x + k.w / 2, y: k.y + k.h / 2 }
  return { x: mitte.x + nx * (k.w / 2 + 0.06), y: mitte.y + ny * (k.h / 2 + 0.06) }
}

// Nur für Werkzeuge, die zeigen wollen, ob eine Seite gerade sichtbar ist
export const wandSichtbar = (seite: Seite) => zeigtNachVorn(NORMALE[seite][0], NORMALE[seite][1])
