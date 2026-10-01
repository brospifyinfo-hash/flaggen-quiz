// Die Landschaft liegt fest in der Welt. Das gekaufte Gebiet ist nur ein Ausschnitt:
// Fluss, See und Berg bleiben, wenn man eine Seite dazukauft oder umzieht.
import type { CityState } from './types'

export type Boden = 'wiese' | 'hang' | 'fluss' | 'see' | 'berg'
export type Rand = 'n' | 'o' | 's' | 'w'

/** So viele Kacheln hat ein gekaufter Streifen */
export const STREIFEN = 6
/** Weiter wächst eine Seite nicht */
export const MAX_SEITE = 54
/** So weit sieht man die Landschaft über den Zaun hinaus */
export const AUSBLICK = 7

export const RAND_NAME: Record<Rand, string> = { n: 'Norden', o: 'Osten', s: 'Süden', w: 'Westen' }

export function masse(city: { land: number; breite?: number; hoehe?: number }): { w: number; h: number } {
  const w = city.breite && city.breite > 0 ? city.breite : city.land
  const h = city.hoehe && city.hoehe > 0 ? city.hoehe : city.land
  return { w, h }
}

function hash(saat: number, x: number, y: number): number {
  let n = Math.imul(saat ^ Math.imul(x, 374761393), 668265263) ^ Math.imul(y, 1274126177)
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295
}

/** Weiches Rauschen. `gitter` ist die Zellengröße in Kacheln. */
function wert(saat: number, x: number, y: number, gitter: number): number {
  const gx = x / gitter
  const gy = y / gitter
  const x0 = Math.floor(gx)
  const y0 = Math.floor(gy)
  const fx = gx - x0
  const fy = gy - y0
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const a = hash(saat, x0, y0)
  const b = hash(saat, x0 + 1, y0)
  const c = hash(saat, x0, y0 + 1)
  const d = hash(saat, x0 + 1, y0 + 1)
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}

function flussAchse(saat: number, y: number): number {
  const mitte = (saat % 48) - 12
  return mitte + Math.sin(y * 0.16 + saat * 0.001) * 8 + Math.sin(y * 0.047 + 1.7) * 5
}

function amFluss(saat: number, x: number, y: number): boolean {
  const dx = Math.abs(x + 0.5 - flussAchse(saat, y + 0.5))
  if (dx < 1.05) return true
  // Ein Nebenarm, versetzt, schmaler
  const arm = flussAchse(saat + 19, x + 0.5) * 0.35 + 18
  return Math.abs(y + 0.5 - arm) < 0.7 && hash(saat + 4, Math.floor(x / 3), 3) > 0.55
}

function hoeheBei(saat: number, x: number, y: number): number {
  return wert(saat + 1, x, y, 14) * 0.72 + wert(saat + 2, x, y, 6) * 0.28
}

function feuchteBei(saat: number, x: number, y: number): number {
  return wert(saat + 3, x, y, 18)
}

/** Boden einer Weltkachel. Die Lichtung bleibt Wiese, egal was der Zufall sagt. */
export function bodenAn(saat: number, wx: number, wy: number, lichtung?: readonly string[] | ReadonlySet<string>): Boden {
  if (lichtung && ('has' in lichtung ? lichtung.has(`${wx}:${wy}`) : lichtung.includes(`${wx}:${wy}`))) return 'wiese'
  if (amFluss(saat, wx, wy)) return 'fluss'
  const hoehe = hoeheBei(saat, wx, wy)
  const feuchte = feuchteBei(saat, wx, wy)
  // Seen sind Mulden, keine einzelnen nassen Kacheln
  if (feuchte > 0.64 && hoehe < 0.58) {
    const ring =
      feuchteBei(saat, wx + 2, wy) +
      feuchteBei(saat, wx - 2, wy) +
      feuchteBei(saat, wx, wy + 2) +
      feuchteBei(saat, wx, wy - 2)
    if (ring > 2.3) return 'see'
  }
  // Berge stehen in Gruppen, Hänge darum herum
  if (hoehe > 0.66) {
    const ring =
      hoeheBei(saat, wx + 1, wy) + hoeheBei(saat, wx - 1, wy) + hoeheBei(saat, wx, wy + 1) + hoeheBei(saat, wx, wy - 1)
    if (hoehe > 0.72 && ring > 2.45) return 'berg'
    return 'hang'
  }
  if (hoehe > 0.58) return 'hang'
  return 'wiese'
}

export const bebauen = (boden: Boden): boolean => boden === 'wiese' || boden === 'hang'

/** Wie hoch ein Berg im Bild aufragt, in Bildpunkten */
export function bergHoehe(saat: number, wx: number, wy: number): number {
  return 28 + Math.floor(wert(saat + 9, wx, wy, 4) * 42)
}

let lichtCache: { city: CityState; set: ReadonlySet<string> | null } | null = null

function lichtungVon(city: CityState): ReadonlySet<string> | undefined {
  if (lichtCache?.city === city) return lichtCache.set ?? undefined
  const set = city.lichtung && city.lichtung.length > 0 ? new Set(city.lichtung) : null
  lichtCache = { city, set }
  return set ?? undefined
}

export function bodenVon(city: CityState, x: number, y: number): Boden {
  return bodenAn(city.saat ?? 1, (city.weltX ?? 0) + x, (city.weltY ?? 0) + y, lichtungVon(city))
}

/** Weltkoordinate, an der eine 12×12-Siedlung Wasser und Berg im Blick hat */
export function sucheUrsprung(saat: number, kante: number): { x: number; y: number } {
  let best = { x: 4, y: 4, score: -1 }
  for (let i = 0; i < 64; i++) {
    const oy = Math.floor(hash(saat, i, 12) * 90) - 36
    const achse = flussAchse(saat, oy + kante / 2)
    // Das Fenster liegt am Fluss, aber nicht mit der Siedlung mittendrin
    const ox = Math.floor(achse - kante * (0.2 + hash(saat, i, 9) * 0.55))
    let fluss = 0
    let see = 0
    let berge = 0
    let wiese = 0
    for (let y = -4; y < kante + 4; y++) {
      for (let x = -4; x < kante + 4; x++) {
        const b = bodenAn(saat, ox + x, oy + y)
        if (b === 'fluss') fluss++
        else if (b === 'see') see++
        else if (b === 'berg') berge++
        else if (b === 'wiese') wiese++
      }
    }
    // Fluss im Blick, dazu ein See und ein Gebirge – die Wiese bleibt die Fläche
    const score =
      (fluss >= 6 && fluss <= 28 ? 70 : -20) +
      (see >= 6 && see <= 40 ? 60 : -Math.abs(see - 12)) +
      (berge >= 4 && berge <= 28 ? 50 : -10) +
      wiese * 0.15
    if (score > best.score) best = { x: ox, y: oy, score }
  }
  return { x: best.x, y: best.y }
}

export function streifenPreis(city: CityState, seite: Rand): { coins: number; materials: number } {
  const { w, h } = masse(city)
  const flaeche = (seite === 'n' || seite === 's' ? w : h) * STREIFEN
  const schon = w * h
  return {
    coins: 350 + flaeche * (12 + Math.floor(schon / 90)),
    materials: 6 + Math.floor(flaeche / 10),
  }
}

export function seiteOffen(city: CityState, seite: Rand): boolean {
  const { w, h } = masse(city)
  if (seite === 'o' || seite === 'w') return w + STREIFEN <= MAX_SEITE
  return h + STREIFEN <= MAX_SEITE
}

/** Das Rechteck, das ein Kauf an dieser Seite dazunehmen würde, in Ortskoordinaten */
export function streifenKacheln(city: CityState, seite: Rand): { x: number; y: number; w: number; h: number } | null {
  if (!seiteOffen(city, seite)) return null
  const { w, h } = masse(city)
  if (seite === 'o') return { x: w, y: 0, w: STREIFEN, h }
  if (seite === 'w') return { x: -STREIFEN, y: 0, w: STREIFEN, h }
  if (seite === 's') return { x: 0, y: h, w, h: STREIFEN }
  return { x: 0, y: -STREIFEN, w, h: STREIFEN }
}
