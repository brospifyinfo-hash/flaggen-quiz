// Das Licht über der Stadt. Aus der Tagesstunde wird alles abgeleitet, was der Zeichner
// über den Tag wissen muss: Himmelsfarben, Stand von Sonne und Mond, Sternenhimmel,
// wohin und wie lang die Schatten fallen, ob die Fenster leuchten und die Laternen
// brennen. Der Stand gilt für ein ganzes Bild und wird vor dem Zeichnen gesetzt.
//
// Der Stadttag hat 24 Stunden: 0–6 Morgen, 6–12 Mittag, 12–18 Abend, 18–24 Nacht.
// Die Sonne geht zur Stunde 0 auf und zur Stunde 17 unter; danach steht der Mond.

export interface Licht {
  stunde: number
  /** 0 am Tag … 1 in tiefer Nacht */
  nacht: number
  /** wie stark Morgen- oder Abendrot gerade färbt, 0..1 */
  daemmerung: number
  /** Himmel oben, am Horizont und der Dunst knapp über dem Boden */
  himmel: [string, string, string]
  /** Sonne: Lage im Bild (Anteile 0..1), Sichtbarkeit und Farbe */
  sonne: { x: number; y: number; alpha: number; farbe: string; hof: string } | null
  mond: { x: number; y: number; alpha: number } | null
  /** Sichtbarkeit der Sterne 0..1 */
  sterne: number
  /** Schattenwurf im Bild: Richtung als Einheitsvektor, Länge je Bildpunkt Höhe, Deckkraft */
  schatten: { dx: number; dy: number; laenge: number; alpha: number }
  /** Richtung zum Licht im Bild – Wände, die dorthin schauen, sind hell */
  zumLicht: { sx: number; sy: number }
  /** Anteil der Fenster, die leuchten (0..1) */
  fenster: number
  /** Laternen, Schaufenster, Scheinwerfer – 0 aus, 1 voll */
  lampen: number
  /** Allgemeine Helligkeit von Wänden und Boden: 1 am Tag */
  helligkeit: number
  /** Farbtönung über dem fertigen Bild (multiplizierend) */
  ton: { farbe: [number, number, number]; alpha: number }
  /** Kühler Schleier der Nacht, additiv über allem */
  schleier: { farbe: [number, number, number]; alpha: number }
}

type Stuetz = [number, ...number[]]

/** Linear zwischen Stützpunkten [stunde, ...werte] übergehen – der Tag ist rund, 24 = 0 */
function verlauf(punkte: Stuetz[], h: number): number[] {
  const n = punkte.length
  for (let i = 0; i < n; i++) {
    const a = punkte[i]
    const b = punkte[(i + 1) % n]
    const bh = i + 1 === n ? b[0] + 24 : b[0]
    const hh = i + 1 === n && h < a[0] ? h + 24 : h
    if (hh >= a[0] && hh <= bh) {
      const t = bh === a[0] ? 0 : (hh - a[0]) / (bh - a[0])
      return a.slice(1).map((v, k) => v + (b[k + 1] - v) * t)
    }
  }
  return punkte[0].slice(1)
}

const hex = (r: number, g: number, b: number) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`

/** Himmel oben, Horizont, Bodendunst – je Stunde, als r,g,b-Tripel */
const HIMMEL: Stuetz[] = [
  //  h   oben            horizont         dunst
  [0, 46, 44, 110, 246, 150, 96, 255, 200, 150],
  [1.5, 78, 122, 200, 255, 196, 140, 255, 226, 190],
  [4, 92, 160, 232, 196, 226, 250, 226, 240, 252],
  [8, 68, 146, 230, 178, 214, 248, 214, 232, 250],
  [12, 82, 150, 226, 196, 216, 240, 220, 232, 244],
  [14, 104, 128, 200, 250, 196, 130, 255, 220, 170],
  [16, 74, 62, 130, 250, 132, 88, 255, 176, 120],
  [17.5, 30, 34, 84, 112, 70, 120, 150, 100, 130],
  [19, 10, 14, 44, 24, 34, 84, 40, 52, 100],
  [22, 8, 12, 38, 22, 32, 80, 36, 48, 96],
  [23.2, 20, 22, 64, 90, 70, 110, 130, 100, 130],
]

/** Tönung über dem Bild: r,g,b,alpha */
const TON: Stuetz[] = [
  [0, 255, 176, 120, 0.14],
  [2.5, 255, 222, 180, 0.05],
  [5, 255, 255, 255, 0],
  [12, 255, 255, 255, 0],
  [14, 255, 200, 130, 0.1],
  [16, 220, 130, 130, 0.2],
  [17.5, 60, 60, 130, 0.34],
  [19, 36, 44, 110, 0.44],
  [22, 34, 42, 106, 0.46],
  [23.3, 120, 90, 120, 0.28],
]

/** Nacht (0..1), Fenster an (0..1), Lampen (0..1), Helligkeit */
const NACHT: Stuetz[] = [
  [0, 0.55, 0.55, 1, 0.78],
  [1.5, 0.25, 0.3, 0.6, 0.9],
  [3, 0.05, 0.12, 0, 1],
  [12, 0, 0.06, 0, 1],
  [14.5, 0.1, 0.2, 0.2, 0.96],
  [16, 0.35, 0.45, 0.8, 0.86],
  [17.5, 0.75, 0.68, 1, 0.66],
  [19, 1, 0.62, 1, 0.5],
  [21.5, 1, 0.4, 1, 0.46],
  [23, 0.85, 0.42, 1, 0.6],
]

const klemme = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v))

export function lichtFuer(stunde: number): Licht {
  const h = ((stunde % 24) + 24) % 24
  const [o1, o2, o3, m1, m2, m3, d1, d2, d3] = verlauf(HIMMEL, h)
  const [tr, tg, tb, ta] = verlauf(TON, h)
  const [nacht, fenster, lampen, helligkeit] = verlauf(NACHT, h)

  // Sonne: Bogen von links (Aufgang, Stunde 0) nach rechts (Untergang, Stunde 17)
  const tagAnteil = h / 17
  const sonneOben = h <= 17
  const hoehe = sonneOben ? Math.sin(Math.PI * tagAnteil) : 0
  const sonne = sonneOben
    ? {
        x: 0.12 + 0.76 * tagAnteil,
        y: 0.62 - 0.55 * hoehe,
        alpha: klemme(0.35 + hoehe * 0.9),
        farbe: hoehe < 0.3 ? hex(255, 150 + hoehe * 250, 80 + hoehe * 400) : '#fff6d6',
        hof: hoehe < 0.3 ? 'rgba(255,140,80,0.45)' : 'rgba(255,240,200,0.35)',
      }
    : null

  // Mond: von Stunde 17.5 bis 24.5, gegenläufig zur Sonne
  const mondT = h >= 17 ? (h - 17) / 7.5 : (h + 7) / 7.5
  const mondHoehe = Math.sin(Math.PI * klemme(mondT))
  const mond = nacht > 0.2 && mondT > 0 && mondT < 1 ? { x: 0.82 - 0.62 * mondT, y: 0.5 - 0.42 * mondHoehe, alpha: klemme((nacht - 0.2) * 1.6) } : null

  // Schatten: fallen von der Sonne weg, flach und lang am Morgen und Abend
  const az = Math.PI * klemme(tagAnteil) // 0 = Sonne links, π = Sonne rechts
  const sonnenSeite = { x: -Math.cos(az), y: 0 } // Bildrichtung zur Sonne (links = -1)
  const laenge = sonneOben ? klemme(0.42 / Math.max(0.2, hoehe), 0.3, 1.5) : 0.5
  const dx = sonneOben ? -sonnenSeite.x : 0.55
  const dy = 0.22 + 0.42 * (sonneOben ? Math.max(0, Math.sin(az)) : 0.5)
  const l = Math.hypot(dx, dy) || 1
  const alpha = sonneOben ? 0.44 * klemme(0.45 + hoehe) : 0.16
  // Wandlicht wandert mit der Sonne von links nach rechts – nie ganz flach, damit
  // Ecken immer Kontrast behalten
  const roh = sonneOben ? klemme(-Math.cos(az) * 0.85 + 0.3, -1, 1) : 0.6
  const zumLicht = { sx: Math.sign(roh || 1) * (0.6 + 0.4 * Math.abs(roh)), sy: -0.35 }
  const zl = 1

  const daemmerung = klemme(1 - Math.abs(hoehe) * 3.4) * (sonneOben ? 1 : klemme(1 - (nacht - 0.6) * 4))

  return {
    stunde: h,
    nacht: klemme(nacht),
    daemmerung: klemme(daemmerung),
    himmel: [hex(o1, o2, o3), hex(m1, m2, m3), hex(d1, d2, d3)],
    sonne,
    mond,
    sterne: klemme((nacht - 0.5) * 2),
    schatten: { dx: dx / l, dy: dy / l, laenge: laenge * (1 - nacht * 0.5), alpha: alpha * (1 - nacht * 0.6) + nacht * 0.08 },
    zumLicht: { sx: zumLicht.sx / zl, sy: zumLicht.sy / zl },
    fenster: klemme(fenster),
    lampen: klemme(lampen),
    helligkeit: klemme(helligkeit, 0.3, 1),
    ton: { farbe: [Math.round(tr), Math.round(tg), Math.round(tb)], alpha: ta },
    schleier: { farbe: [40, 60, 130], alpha: nacht * 0.12 },
  }
}

let aktuell: Licht = lichtFuer(9)

/** Vor jedem Bild setzen – danach lesen alle Zeichner denselben Stand */
export const setLicht = (licht: Licht): void => {
  aktuell = licht
}
export const lichtJetzt = (): Licht => aktuell

/**
 * Alles, was selbst leuchtet – Fenster, Laternen, Scheinwerfer, Leuchtschriften –
 * wird gesammelt und nach der Nachttönung noch einmal darübergelegt. Sonst würde
 * die blaue Tönung auch das warme Licht in den Fenstern dämpfen.
 */
type Leuchte = (ctx: CanvasRenderingContext2D) => void
let leuchten: Leuchte[] = []

/** Etwas Leuchtendes vormerken – nur nötig, wenn es dunkel genug ist, dass es auffällt */
export function leuchte(malen: Leuchte): void {
  if (aktuell.nacht < 0.03 && aktuell.lampen < 0.03) return
  leuchten.push(malen)
}

/** Alle vorgemerkten Leuchten malen und die Liste leeren */
export function leuchtenMalen(ctx: CanvasRenderingContext2D): void {
  const liste = leuchten
  leuchten = []
  for (const malen of liste) malen(ctx)
}

export const leuchtenLeeren = (): void => {
  leuchten = []
}

/**
 * Leuchtet dieses Fenster gerade? Jedes Fenster hat eine feste Schwelle aus seinem
 * Zufall; je dunkler es wird, desto mehr Schwellen sind überschritten. So gehen die
 * Lichter nicht alle zugleich an, sondern eines nach dem anderen.
 */
export const fensterAn = (zufall: number, licht: Licht = aktuell): boolean => zufall < licht.fenster

/** Warme Fensterfarbe – am Tag kühles Glas mit Himmelsspiegelung */
export const FENSTER_WARM = 'rgba(255,214,132,0.95)'
export const FENSTER_KALT = 'rgba(92,128,172,0.7)'
export const FENSTER_NACHT = 'rgba(28,36,60,0.9)'

/** Die dunkle Scheibe: tags himmelblau, nachts fast schwarz */
export function fensterDunkel(licht: Licht = aktuell): string {
  const n = licht.nacht
  const r = Math.round(92 + (28 - 92) * n)
  const g = Math.round(128 + (36 - 128) * n)
  const b = Math.round(172 + (60 - 172) * n)
  return `rgba(${r},${g},${b},${0.7 + 0.2 * n})`
}

/** Glasfassaden: tags spiegeln sie den Himmel, nachts sind sie tiefblau */
export function fensterGlas(licht: Licht = aktuell): string {
  const n = licht.nacht
  const r = Math.round(60 + (18 - 60) * n)
  const g = Math.round(96 + (28 - 96) * n)
  const b = Math.round(130 + (54 - 130) * n)
  return `rgba(${r},${g},${b},${0.55 + 0.3 * n})`
}

/** Warme und kühle Fenstertöne – je Haus einer, damit nicht alle gleich leuchten */
export const FENSTER_TOENE = [FENSTER_WARM, FENSTER_WARM, 'rgba(255,228,170,0.95)', 'rgba(255,200,120,0.95)', 'rgba(214,228,255,0.92)']
