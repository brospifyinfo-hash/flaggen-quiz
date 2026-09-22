// Die Bewohner und ihre Fahrzeuge. Jede Figur wird aus Merkmalen zusammengesetzt –
// Größe, Statur, Haut, Frisur, Bart, Kleidung, Muster, Kopfbedeckung, Brille, Tasche,
// Begleiter – und jede Rolle hat ihre Kleidung: Uniform, Anzug, Warnweste. So sieht
// kaum ein Mensch aus wie der andere, und man erkennt trotzdem, wer wer ist.
//
// Fahrzeuge sind Kästen auf dem Boden, die in Fahrtrichtung stehen: Karosserie, Kabine
// oder Aufbau, Scheiben ringsum, Räder mit Felgen, Licht vorn und hinten – und je nach
// Bauart Blaulicht, Leiter, Taxischild, Spoiler oder Ladefläche.
import type { Klasse } from './catalog'
import { bodenSchatten, fade, groundRect, isoFrame, lift, mix, quad, roundedPath, shade, wobble, type Point } from './draw'
import { dirToScreen, toScreen } from './iso'
import type { Agent } from './life'

// ---------------------------------------------------------------------------
// Aussehen der Menschen
// ---------------------------------------------------------------------------

export type Rolle =
  | 'bewohner'
  | 'kind'
  | 'senior'
  | 'student'
  | 'geschaeft'
  | 'milliardaer'
  | 'jogger'
  | 'hundehalter'
  | 'eltern'
  | 'arbeiter'
  | 'tourist'
  | 'polizist'
  | 'feuerwehr'
  | 'sanitaeter'
  | 'obdachlos'
  | 'gangster'
  | 'lieferant'

type Frisur = 'kurz' | 'seite' | 'lang' | 'zopf' | 'dutt' | 'locken' | 'afro' | 'glatze' | 'irokese' | 'bob' | 'pony' | 'zoepfe' | 'grau'
type Oben = 'tshirt' | 'hemd' | 'pulli' | 'hoodie' | 'jacke' | 'mantel' | 'kleid' | 'anzug' | 'uniform' | 'weste' | 'sport' | 'kittel'
type Unten = 'jeans' | 'hose' | 'rock' | 'shorts' | 'leggings'
type Kopf = 'nichts' | 'cap' | 'muetze' | 'hut' | 'zylinder' | 'helm' | 'polizei' | 'feuerhelm' | 'kopftuch' | 'bauhelm' | 'stirnband'
type Tasche = 'keine' | 'rucksack' | 'handtasche' | 'aktenkoffer' | 'tuete' | 'gitarre' | 'kaffee' | 'handy' | 'wagen' | 'paket'
type Begleiter = 'keiner' | 'hund' | 'kinderwagen' | 'stock'

export interface Aussehen {
  groesse: number
  breite: number
  haut: string
  haar: string
  frisur: Frisur
  bart: 'keiner' | 'stoppel' | 'voll' | 'schnauz'
  oben: Oben
  obenFarbe: string
  muster: 'uni' | 'streifen' | 'karo'
  unten: Unten
  untenFarbe: string
  schuhe: string
  kopf: Kopf
  kopfFarbe: string
  brille: 'keine' | 'brille' | 'sonne'
  tasche: Tasche
  taschenFarbe: string
  begleiter: Begleiter
  hundFarbe: string
  gold: boolean
}

const HAUT = ['#f7d7b5', '#f1c6a0', '#e0a97a', '#c98a5c', '#a86a44', '#8a5234', '#6b3f28', '#ffe0bd']
const HAAR = ['#2b1d14', '#4a2f1c', '#6b4226', '#8a5a2b', '#c98b3a', '#e2c078', '#b5462f', '#1a1a1f', '#d9d2c5', '#7a6a5a']
const BUNT = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ff7ab5', '#34495e', '#ffffff', '#7bdcff', '#c0392b', '#16a085', '#f39c12', '#8e44ad', '#2c3e50']
const GEDECKT = ['#6b6660', '#5a5f4a', '#4a4036', '#555a60', '#6a5a48', '#3f4a3a', '#5e4e44']
const EDEL = ['#1c1f26', '#2c3140', '#3a2a2a', '#e8e0d0', '#4a3a5a', '#1f3a5a', '#5a1f2a']
const HOSEN = ['#2f3b57', '#27405c', '#3c3c46', '#1f2530', '#4b3a2a', '#5a2f46', '#6b6b6b', '#c8b89a']

const griff = <T>(liste: readonly T[], seed: number, salz: number): T =>
  liste[Math.floor(wobble(seed, salz) * liste.length) % liste.length]

/** Ein Mensch, zusammengesetzt aus seinem Samen, seiner Rolle und seinem Geldbeutel */
export function aussehenVon(seed: number, rolle: Rolle, klasse: Klasse): Aussehen {
  const w = (salz: number) => wobble(seed, salz)
  const frau = w(1) < 0.5
  const alt = rolle === 'senior'
  const kind = rolle === 'kind'
  const farben = klasse === 'arm' ? [...GEDECKT, ...BUNT.slice(0, 6)] : klasse === 'superreich' || klasse === 'reich' ? [...EDEL, ...BUNT.slice(0, 4)] : BUNT

  const frisuren: Frisur[] = frau
    ? ['lang', 'zopf', 'dutt', 'bob', 'locken', 'pony', 'zoepfe', 'afro', 'lang', 'kurz']
    : ['kurz', 'seite', 'kurz', 'locken', 'glatze', 'afro', 'irokese', 'seite', 'kurz', 'lang']

  const a: Aussehen = {
    groesse: kind ? 0.64 + w(2) * 0.08 : alt ? 0.9 + w(2) * 0.06 : 0.92 + w(2) * 0.14,
    breite: 0.86 + w(3) * 0.32,
    haut: griff(HAUT, seed, 4),
    haar: alt ? griff(['#d9d2c5', '#bdb6aa', '#ecebe6', '#8a8580'], seed, 5) : griff(HAAR, seed, 5),
    frisur: alt ? (w(6) < 0.4 ? 'glatze' : 'grau') : griff(frisuren, seed, 6),
    bart: !frau && !kind && w(7) < 0.35 ? griff(['stoppel', 'voll', 'schnauz'] as const, seed, 8) : 'keiner',
    oben: griff(frau ? (['tshirt', 'pulli', 'jacke', 'kleid', 'hemd', 'mantel', 'hoodie'] as Oben[]) : (['tshirt', 'hemd', 'pulli', 'hoodie', 'jacke', 'mantel'] as Oben[]), seed, 9),
    obenFarbe: griff(farben, seed, 10),
    muster: w(11) < 0.14 ? 'streifen' : w(11) < 0.22 ? 'karo' : 'uni',
    unten: griff(frau ? (['jeans', 'rock', 'hose', 'leggings', 'jeans', 'shorts'] as Unten[]) : (['jeans', 'hose', 'jeans', 'shorts'] as Unten[]), seed, 12),
    untenFarbe: griff(HOSEN, seed, 13),
    schuhe: griff(['#1c1c1c', '#f4f4f4', '#6b4a2f', '#c0392b', '#2c3e50', '#8a8f99'], seed, 14),
    kopf: w(15) < 0.14 ? 'cap' : w(15) < 0.2 ? 'muetze' : w(15) < 0.25 ? 'hut' : w(15) < 0.28 ? 'kopftuch' : 'nichts',
    kopfFarbe: griff(BUNT, seed, 16),
    brille: w(17) < 0.16 ? 'brille' : w(17) < 0.24 ? 'sonne' : 'keine',
    tasche:
      w(18) < 0.16
        ? 'rucksack'
        : w(18) < 0.26
          ? frau
            ? 'handtasche'
            : 'tuete'
          : w(18) < 0.33
            ? 'handy'
            : w(18) < 0.38
              ? 'kaffee'
              : w(18) < 0.41
                ? 'gitarre'
                : 'keine',
    taschenFarbe: griff(['#6b4a2f', '#1c1c1c', '#c0392b', '#2c3e50', '#e67e22', '#8e44ad'], seed, 19),
    begleiter: 'keiner',
    hundFarbe: griff(['#8a5a2b', '#1c1c1c', '#f4f0e6', '#c98b3a', '#6b6660'], seed, 20),
    gold: false,
  }

  // Rollen setzen, was zu ihnen gehört
  switch (rolle) {
    case 'kind':
      a.oben = griff(['tshirt', 'hoodie', 'pulli', 'kleid'] as Oben[], seed, 30)
      a.obenFarbe = griff(BUNT, seed, 31)
      a.bart = 'keiner'
      a.tasche = w(32) < 0.45 ? 'rucksack' : 'keine'
      a.kopf = w(33) < 0.25 ? 'cap' : 'nichts'
      break
    case 'senior':
      a.oben = griff(['mantel', 'pulli', 'jacke', 'hemd'] as Oben[], seed, 34)
      a.obenFarbe = griff(['#8a7a5a', '#5a6a7a', '#7a5a5a', '#c8b89a', '#4a5a4a'], seed, 35)
      a.begleiter = w(36) < 0.5 ? 'stock' : 'keiner'
      a.kopf = w(37) < 0.35 ? 'hut' : 'nichts'
      a.brille = w(38) < 0.6 ? 'brille' : 'keine'
      break
    case 'student':
      a.oben = w(39) < 0.6 ? 'hoodie' : 'tshirt'
      a.tasche = 'rucksack'
      break
    case 'geschaeft':
      a.oben = 'anzug'
      a.obenFarbe = griff(['#2c3140', '#1c1f26', '#4a4f58', '#1f3a5a', '#3a3a3a'], seed, 40)
      a.unten = 'hose'
      a.untenFarbe = a.obenFarbe
      a.schuhe = '#1c1c1c'
      a.tasche = w(41) < 0.6 ? 'aktenkoffer' : 'handy'
      a.kopf = 'nichts'
      break
    case 'milliardaer':
      a.oben = 'anzug'
      a.obenFarbe = griff(['#1c1f26', '#f0e8d8', '#5a1f2a', '#1f3a5a', '#2a2a2a'], seed, 42)
      a.unten = 'hose'
      a.untenFarbe = a.obenFarbe === '#f0e8d8' ? '#f0e8d8' : '#1c1f26'
      a.schuhe = '#1c1c1c'
      a.brille = 'sonne'
      a.gold = true
      a.tasche = w(43) < 0.4 ? 'handy' : 'keine'
      a.kopf = w(44) < 0.12 ? 'zylinder' : 'nichts'
      break
    case 'jogger':
      a.oben = 'sport'
      a.obenFarbe = griff(['#ff4f7a', '#2ecc71', '#f1c40f', '#3498db', '#ff9f43', '#9b59b6'], seed, 45)
      a.unten = w(46) < 0.5 ? 'shorts' : 'leggings'
      a.untenFarbe = '#1c1f26'
      a.kopf = w(47) < 0.5 ? 'stirnband' : 'nichts'
      a.tasche = 'keine'
      break
    case 'hundehalter':
      a.begleiter = 'hund'
      break
    case 'eltern':
      a.begleiter = 'kinderwagen'
      a.tasche = w(48) < 0.5 ? 'handtasche' : 'keine'
      break
    case 'arbeiter':
      a.oben = 'weste'
      a.obenFarbe = griff(['#ff8c1a', '#ffd21a'], seed, 49)
      a.unten = 'hose'
      a.untenFarbe = '#3a4a5a'
      a.kopf = 'bauhelm'
      a.kopfFarbe = griff(['#ffd21a', '#f4f4f4', '#ff8c1a'], seed, 50)
      a.schuhe = '#4a3a2a'
      break
    case 'tourist':
      a.oben = 'tshirt'
      a.obenFarbe = griff(['#ff7ab5', '#7bdcff', '#f1c40f', '#ffffff', '#2ecc71'], seed, 51)
      a.unten = 'shorts'
      a.untenFarbe = griff(['#c8b89a', '#27405c', '#6b6b6b'], seed, 52)
      a.kopf = w(53) < 0.5 ? 'hut' : 'cap'
      a.brille = 'sonne'
      a.tasche = 'rucksack'
      break
    case 'polizist':
      a.oben = 'uniform'
      a.obenFarbe = '#1f3a5a'
      a.unten = 'hose'
      a.untenFarbe = '#1c2a3e'
      a.kopf = 'polizei'
      a.kopfFarbe = '#1f3a5a'
      a.schuhe = '#1c1c1c'
      a.tasche = 'keine'
      a.begleiter = 'keiner'
      break
    case 'feuerwehr':
      a.oben = 'uniform'
      a.obenFarbe = '#2c3036'
      a.unten = 'hose'
      a.untenFarbe = '#2c3036'
      a.kopf = 'feuerhelm'
      a.kopfFarbe = '#d63a2e'
      a.schuhe = '#1c1c1c'
      a.tasche = 'keine'
      a.begleiter = 'keiner'
      break
    case 'sanitaeter':
      a.oben = 'weste'
      a.obenFarbe = '#e84a2a'
      a.unten = 'hose'
      a.untenFarbe = '#2c3e50'
      a.kopf = 'nichts'
      a.tasche = 'keine'
      a.begleiter = 'keiner'
      break
    case 'obdachlos':
      a.oben = w(54) < 0.6 ? 'mantel' : 'hoodie'
      a.obenFarbe = griff(GEDECKT, seed, 55)
      a.unten = 'hose'
      a.untenFarbe = griff(['#4a4036', '#3f4a3a', '#555a60'], seed, 56)
      a.kopf = 'muetze'
      a.kopfFarbe = griff(['#6b3a2c', '#3f4a3a', '#555a60', '#8a5a2b'], seed, 57)
      a.bart = frau ? 'keiner' : w(58) < 0.7 ? 'voll' : 'stoppel'
      a.tasche = w(59) < 0.35 ? 'wagen' : 'tuete'
      a.taschenFarbe = '#d8d0c0'
      a.begleiter = w(60) < 0.2 ? 'hund' : 'keiner'
      a.gold = false
      break
    case 'gangster':
      a.oben = 'hoodie'
      a.obenFarbe = griff(['#1c1c1c', '#2c2c34', '#3a3a3a', '#4a1f2a'], seed, 61)
      a.unten = 'jeans'
      a.untenFarbe = '#1f2530'
      a.kopf = w(62) < 0.6 ? 'cap' : 'nichts'
      a.kopfFarbe = '#1c1c1c'
      a.brille = w(63) < 0.5 ? 'sonne' : 'keine'
      a.gold = true
      a.tasche = w(64) < 0.4 ? 'handy' : 'keine'
      break
    case 'lieferant':
      a.oben = 'uniform'
      a.obenFarbe = griff(['#6b4a2f', '#f1c40f', '#2c5b8c'], seed, 65)
      a.unten = 'shorts'
      a.untenFarbe = '#3a3a3a'
      a.kopf = 'cap'
      a.kopfFarbe = a.obenFarbe
      a.tasche = 'paket'
      a.taschenFarbe = '#c9a06a'
      break
    default:
      // Reiche tragen Besseres, Arme Abgetragenes
      if (klasse === 'reich' || klasse === 'superreich') {
        if (w(66) < 0.4) a.oben = frau ? 'kleid' : 'anzug'
        if (w(67) < 0.4) a.tasche = frau ? 'handtasche' : 'aktenkoffer'
        a.gold = w(68) < 0.5
      }
      if (klasse === 'arm' && w(69) < 0.3) a.tasche = 'tuete'
  }
  return a
}

// ---------------------------------------------------------------------------
// Menschen zeichnen
// ---------------------------------------------------------------------------

export type Pose = 'geht' | 'rennt' | 'steht' | 'sitzt' | 'liegt'

function umriss(ctx: CanvasRenderingContext2D, staerke: number): void {
  ctx.strokeStyle = 'rgba(18,24,40,0.5)'
  ctx.lineWidth = staerke
  ctx.stroke()
}

function hund(ctx: CanvasRenderingContext2D, p: Point, farbe: string, schritt: number, blick: number, s: number): void {
  const huepf = Math.abs(Math.sin(schritt * 1.3)) * 0.8
  ctx.fillStyle = farbe
  ctx.beginPath()
  ctx.ellipse(p.sx, p.sy - 3.2 * s - huepf, 3.4 * s, 1.8 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(p.sx + blick * 3.4 * s, p.sy - 4.6 * s - huepf, 1.6 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = shade(farbe, -30)
  ctx.beginPath()
  ctx.ellipse(p.sx + blick * 2.9 * s, p.sy - 5.6 * s - huepf, 0.7 * s, 1.1 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = shade(farbe, -20)
  ctx.lineWidth = 0.9 * s
  ctx.beginPath()
  const bein = Math.sin(schritt * 1.3) * 1.2 * s
  for (const x of [-2, 2]) {
    ctx.moveTo(p.sx + x * s, p.sy - 2.4 * s - huepf)
    ctx.lineTo(p.sx + x * s + bein, p.sy)
  }
  ctx.moveTo(p.sx - blick * 3.2 * s, p.sy - 3.6 * s - huepf)
  ctx.lineTo(p.sx - blick * 4.6 * s, p.sy - 5.4 * s - huepf + Math.sin(schritt * 3) * 0.6)
  ctx.stroke()
}

function kinderwagen(ctx: CanvasRenderingContext2D, p: Point, farbe: string, s: number): void {
  ctx.strokeStyle = '#1c2230'
  ctx.lineWidth = 0.8 * s
  ctx.beginPath()
  ctx.arc(p.sx - 2.4 * s, p.sy - 1.3 * s, 1.3 * s, 0, Math.PI * 2)
  ctx.moveTo(p.sx + 3.7 * s, p.sy - 1.3 * s)
  ctx.arc(p.sx + 2.4 * s, p.sy - 1.3 * s, 1.3 * s, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = farbe
  ctx.beginPath()
  ctx.moveTo(p.sx - 4 * s, p.sy - 3 * s)
  ctx.lineTo(p.sx + 4 * s, p.sy - 3 * s)
  ctx.lineTo(p.sx + 3.4 * s, p.sy - 7 * s)
  ctx.quadraticCurveTo(p.sx - 3 * s, p.sy - 10 * s, p.sx - 4 * s, p.sy - 5 * s)
  ctx.closePath()
  ctx.fill()
  umriss(ctx, 0.5 * s)
}

function einkaufswagen(ctx: CanvasRenderingContext2D, p: Point, s: number, seed: number): void {
  ctx.strokeStyle = '#9aa3ad'
  ctx.lineWidth = 0.8 * s
  ctx.beginPath()
  ctx.moveTo(p.sx - 4 * s, p.sy - 7 * s)
  ctx.lineTo(p.sx + 4 * s, p.sy - 7 * s)
  ctx.lineTo(p.sx + 3 * s, p.sy - 2.5 * s)
  ctx.lineTo(p.sx - 3.4 * s, p.sy - 2.5 * s)
  ctx.closePath()
  ctx.moveTo(p.sx - 3 * s, p.sy - 2.5 * s)
  ctx.lineTo(p.sx - 3 * s, p.sy)
  ctx.moveTo(p.sx + 2.6 * s, p.sy - 2.5 * s)
  ctx.lineTo(p.sx + 2.6 * s, p.sy)
  ctx.stroke()
  const farben = ['#d8d0c0', '#6b8c5a', '#8a5a3a', '#3a5a8a', '#c9a06a']
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = griff(farben, seed, 80 + i)
    ctx.beginPath()
    ctx.arc(p.sx - 2 * s + i * 2 * s, p.sy - 7.5 * s - wobble(seed, 90 + i) * 1.5 * s, 1.8 * s, 0, Math.PI * 2)
    ctx.fill()
  }
}

/**
 * Ein Mensch. p ist der Punkt zwischen den Füßen, blick +1 nach rechts, -1 nach links.
 * `schritt` treibt Beine und Arme; die Pose entscheidet, ob er geht, steht, sitzt oder liegt.
 */
export function zeichnePerson(
  ctx: CanvasRenderingContext2D,
  p: Point,
  a: Aussehen,
  pose: Pose,
  schritt: number,
  blick: number,
  fein: boolean,
  seed: number,
): void {
  const s = a.groesse
  const b = a.breite
  if (pose === 'liegt') {
    liegend(ctx, p, a, fein, seed)
    return
  }

  const sitzt = pose === 'sitzt'
  const beinLang = (sitzt ? 2.6 : 5) * s
  const rumpfHoch = 6.4 * s
  const hueftY = p.sy - (sitzt ? 3.2 * s : beinLang)
  const schulter = hueftY - rumpfHoch
  const kopfR = 2.5 * Math.max(0.9, s)
  const kopfY = schulter - kopfR * 0.9
  const weite = pose === 'rennt' ? 2.8 : pose === 'geht' ? 2 : 0.2
  const schwung = Math.sin(schritt) * weite * s
  const gegen = -schwung

  if (a.begleiter === 'hund') hund(ctx, { sx: p.sx + blick * 7 * s, sy: p.sy + 1.5 }, a.hundFarbe, schritt, blick, s)

  // Rucksack hinten, Gitarre auf dem Rücken
  if (a.tasche === 'rucksack') {
    ctx.fillStyle = a.taschenFarbe
    roundedPath(ctx, p.sx - blick * 2.4 * s * b - 1.5 * s, schulter + 0.8 * s, 3 * s, 4.8 * s, 1.2 * s)
    ctx.fill()
  } else if (a.tasche === 'gitarre') {
    ctx.fillStyle = '#6b3a1f'
    ctx.beginPath()
    ctx.ellipse(p.sx - blick * 2.6 * s, schulter + 5 * s, 2.2 * s, 2.8 * s, blick * 0.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#4a2a14'
    ctx.lineWidth = 1 * s
    ctx.beginPath()
    ctx.moveTo(p.sx - blick * 2.2 * s, schulter + 3 * s)
    ctx.lineTo(p.sx + blick * 0.4 * s, schulter - 3 * s)
    ctx.stroke()
  }

  // Beine und Schuhe
  if (sitzt) {
    ctx.strokeStyle = a.untenFarbe
    ctx.lineWidth = 2 * s
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(p.sx, hueftY)
    ctx.lineTo(p.sx + blick * 3.4 * s, hueftY)
    ctx.lineTo(p.sx + blick * 3.4 * s, p.sy)
    ctx.stroke()
    ctx.fillStyle = a.schuhe
    ctx.beginPath()
    ctx.ellipse(p.sx + blick * 3.9 * s, p.sy - 0.4, 1.4 * s, 0.8 * s, 0, 0, Math.PI * 2)
    ctx.fill()
  } else {
    for (const x of [schwung, gegen]) {
      const fuss = { sx: p.sx + x * blick, sy: p.sy }
      const nackt = a.unten === 'rock' || a.oben === 'kleid'
      ctx.strokeStyle = nackt ? a.haut : a.untenFarbe
      ctx.lineWidth = 2 * s * b
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(p.sx, hueftY)
      ctx.lineTo(fuss.sx, fuss.sy - 1)
      ctx.stroke()
      if (a.unten === 'shorts') {
        ctx.strokeStyle = a.haut
        ctx.lineWidth = 1.5 * s
        ctx.beginPath()
        const knie = mix({ sx: p.sx, sy: hueftY }, fuss, 0.45)
        ctx.moveTo(knie.sx, knie.sy)
        ctx.lineTo(fuss.sx, fuss.sy - 1)
        ctx.stroke()
      }
      ctx.fillStyle = a.schuhe
      ctx.beginPath()
      ctx.ellipse(fuss.sx + blick * 0.5 * s, fuss.sy - 0.4, 1.4 * s, 0.8 * s, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Rumpf je nach Oberteil
  const breit = 4 * s * b
  const lang = a.oben === 'mantel' || a.oben === 'kittel' ? rumpfHoch + 3 * s : a.oben === 'kleid' ? rumpfHoch + 3.4 * s : rumpfHoch + 0.6 * s
  ctx.fillStyle = a.obenFarbe
  if (a.oben === 'kleid') {
    ctx.beginPath()
    ctx.moveTo(p.sx - breit * 0.42, schulter)
    ctx.lineTo(p.sx + breit * 0.42, schulter)
    ctx.lineTo(p.sx + breit * 0.7, schulter + lang)
    ctx.lineTo(p.sx - breit * 0.7, schulter + lang)
    ctx.closePath()
  } else if (a.unten === 'rock' && !sitzt) {
    // Oberteil und darunter der Rock als Trapez
    roundedPath(ctx, p.sx - breit / 2, schulter, breit, rumpfHoch * 0.75, 1.6 * s)
    ctx.fill()
    ctx.fillStyle = a.untenFarbe
    ctx.beginPath()
    ctx.moveTo(p.sx - breit * 0.46, schulter + rumpfHoch * 0.7)
    ctx.lineTo(p.sx + breit * 0.46, schulter + rumpfHoch * 0.7)
    ctx.lineTo(p.sx + breit * 0.66, hueftY + 2.4 * s)
    ctx.lineTo(p.sx - breit * 0.66, hueftY + 2.4 * s)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    roundedPath(ctx, p.sx - breit / 2, schulter, breit, rumpfHoch * 0.75, 1.6 * s)
  } else {
    roundedPath(ctx, p.sx - breit / 2, schulter, breit, lang, 1.6 * s)
  }
  ctx.fillStyle = a.obenFarbe
  ctx.fill()
  if (fein) umriss(ctx, 0.6 * s)

  if (fein) {
    if (a.muster === 'streifen') {
      ctx.strokeStyle = fade('#ffffff', 0.5)
      ctx.lineWidth = 0.7 * s
      ctx.beginPath()
      for (let y = schulter + 1.6 * s; y < schulter + lang - 0.5; y += 1.6 * s) {
        ctx.moveTo(p.sx - breit / 2 + 0.4, y)
        ctx.lineTo(p.sx + breit / 2 - 0.4, y)
      }
      ctx.stroke()
    } else if (a.muster === 'karo') {
      ctx.strokeStyle = fade('#1c1c1c', 0.28)
      ctx.lineWidth = 0.6 * s
      ctx.beginPath()
      for (let y = schulter + 1.8 * s; y < schulter + lang - 0.5; y += 1.8 * s) {
        ctx.moveTo(p.sx - breit / 2 + 0.4, y)
        ctx.lineTo(p.sx + breit / 2 - 0.4, y)
      }
      for (let x = -breit / 2 + 1.4 * s; x < breit / 2; x += 1.6 * s) {
        ctx.moveTo(p.sx + x, schulter + 0.5)
        ctx.lineTo(p.sx + x, schulter + lang - 0.5)
      }
      ctx.stroke()
    }
    if (a.oben === 'anzug') {
      ctx.fillStyle = '#f4f4f4'
      ctx.beginPath()
      ctx.moveTo(p.sx - 1.2 * s, schulter)
      ctx.lineTo(p.sx + 1.2 * s, schulter)
      ctx.lineTo(p.sx, schulter + 2.6 * s)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = a.gold ? '#b8962e' : griff(['#c0392b', '#2c3e50', '#8e44ad', '#16a085'], seed, 70)
      ctx.fillRect(p.sx - 0.5 * s, schulter + 0.8 * s, 1 * s, 3.6 * s)
    } else if (a.oben === 'hemd') {
      ctx.fillStyle = shade(a.obenFarbe, 30)
      ctx.beginPath()
      ctx.moveTo(p.sx - 1.3 * s, schulter)
      ctx.lineTo(p.sx + 1.3 * s, schulter)
      ctx.lineTo(p.sx, schulter + 1.6 * s)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = fade('#1c1c1c', 0.35)
      for (let i = 1; i < 4; i++) ctx.fillRect(p.sx - 0.3, schulter + i * 1.6 * s, 0.6, 0.6)
    } else if (a.oben === 'hoodie') {
      ctx.fillStyle = shade(a.obenFarbe, -18)
      ctx.beginPath()
      ctx.ellipse(p.sx - blick * 1.2 * s, schulter + 0.4, 2.4 * s, 1.4 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(p.sx - 1.6 * s, schulter + rumpfHoch * 0.55, 3.2 * s, 1.8 * s)
    } else if (a.oben === 'jacke') {
      ctx.fillStyle = shade(a.obenFarbe, 50)
      ctx.fillRect(p.sx - 0.6 * s, schulter + 0.5, 1.2 * s, lang - 1)
    } else if (a.oben === 'uniform') {
      if (a.kopf === 'feuerhelm') {
        ctx.fillStyle = '#e8f07a'
        ctx.fillRect(p.sx - breit / 2, schulter + rumpfHoch * 0.55, breit, 1.2 * s)
        ctx.fillRect(p.sx - breit / 2, schulter + rumpfHoch * 0.85, breit, 1 * s)
      } else {
        ctx.fillStyle = '#f4d35e'
        ctx.beginPath()
        ctx.arc(p.sx + blick * 1 * s, schulter + 2 * s, 0.8 * s, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = fade('#ffffff', 0.5)
        ctx.fillRect(p.sx - breit / 2, schulter + 0.4, breit, 0.7 * s)
      }
    } else if (a.oben === 'weste') {
      ctx.fillStyle = fade('#f4f4f4', 0.85)
      ctx.fillRect(p.sx - breit / 2, schulter + rumpfHoch * 0.45, breit, 1 * s)
      ctx.fillRect(p.sx - breit / 2, schulter + rumpfHoch * 0.75, breit, 1 * s)
    } else if (a.oben === 'sport') {
      ctx.fillStyle = fade('#ffffff', 0.6)
      ctx.fillRect(p.sx - breit / 2, schulter + 1.5 * s, 0.9 * s, lang - 2)
    } else if (a.oben === 'kittel') {
      ctx.fillStyle = '#e8eef4'
      ctx.fillRect(p.sx - 0.4, schulter + 0.5, 0.8, lang - 1)
    }
    if (a.gold) {
      ctx.fillStyle = '#e8c547'
      ctx.beginPath()
      ctx.arc(p.sx, schulter + 1.2 * s, 0.8 * s, 0, Math.PI)
      ctx.fill()
    }
  }

  // Arme
  const kurzarm = a.oben === 'tshirt' || a.oben === 'kleid' || a.oben === 'weste' || a.oben === 'sport'
  const armFarbe = kurzarm ? a.haut : shade(a.obenFarbe, -20)
  const armSchwung = sitzt ? 0 : schwung * 0.9
  const ansatzHinten = { sx: p.sx - blick * (breit / 2 - 0.4), sy: schulter + 1.2 * s }
  const ansatzVorne = { sx: p.sx + blick * (breit / 2 - 0.4), sy: schulter + 1.2 * s }
  const hinten = { sx: ansatzHinten.sx - armSchwung * blick, sy: schulter + 5 * s }
  const schiebt = a.begleiter === 'kinderwagen' || a.tasche === 'wagen'
  const vorne = schiebt
    ? { sx: p.sx + blick * 3.4 * s, sy: schulter + 4 * s }
    : a.tasche === 'handy'
      ? { sx: p.sx + blick * 2.2 * s, sy: kopfY + 1 * s }
      : { sx: ansatzVorne.sx + armSchwung * blick, sy: schulter + 5 * s }
  ctx.strokeStyle = armFarbe
  ctx.lineWidth = 1.5 * s
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(ansatzHinten.sx, ansatzHinten.sy)
  ctx.lineTo(hinten.sx, hinten.sy)
  ctx.moveTo(ansatzVorne.sx, ansatzVorne.sy)
  ctx.lineTo(vorne.sx, vorne.sy)
  ctx.stroke()
  if (kurzarm && fein && a.oben === 'tshirt') {
    // Ärmel bis zum Ellbogen
    ctx.strokeStyle = a.obenFarbe
    ctx.lineWidth = 1.7 * s
    ctx.beginPath()
    const e1 = mix(ansatzHinten, hinten, 0.4)
    const e2 = mix(ansatzVorne, vorne, 0.4)
    ctx.moveTo(ansatzHinten.sx, ansatzHinten.sy)
    ctx.lineTo(e1.sx, e1.sy)
    ctx.moveTo(ansatzVorne.sx, ansatzVorne.sy)
    ctx.lineTo(e2.sx, e2.sy)
    ctx.stroke()
  }
  ctx.fillStyle = a.haut
  ctx.beginPath()
  ctx.arc(hinten.sx, hinten.sy, 0.85 * s, 0, Math.PI * 2)
  ctx.arc(vorne.sx, vorne.sy, 0.85 * s, 0, Math.PI * 2)
  ctx.fill()

  // Was in der Hand ist
  if (a.tasche === 'aktenkoffer') {
    ctx.fillStyle = '#2a2018'
    ctx.fillRect(hinten.sx - 1.8 * s, hinten.sy + 0.4, 3.6 * s, 2.6 * s)
  } else if (a.tasche === 'tuete') {
    ctx.fillStyle = a.taschenFarbe === '#d8d0c0' ? '#d8d0c0' : '#f4efe4'
    ctx.fillRect(hinten.sx - 1.3 * s, hinten.sy + 0.2, 2.6 * s, 3.2 * s)
  } else if (a.tasche === 'handtasche') {
    ctx.fillStyle = a.taschenFarbe
    roundedPath(ctx, hinten.sx - 1.6 * s, hinten.sy - 2.8 * s, 3.2 * s, 2.4 * s, 0.8 * s)
    ctx.fill()
  } else if (a.tasche === 'kaffee') {
    ctx.fillStyle = '#f4f4f4'
    ctx.fillRect(vorne.sx - 0.8 * s, vorne.sy - 2.2 * s, 1.6 * s, 2 * s)
    ctx.fillStyle = '#6b4a2f'
    ctx.fillRect(vorne.sx - 0.8 * s, vorne.sy - 1.6 * s, 1.6 * s, 0.6 * s)
  } else if (a.tasche === 'handy') {
    ctx.fillStyle = '#1c1c1c'
    ctx.fillRect(vorne.sx - 0.5 * s, vorne.sy - 1.4 * s, 1 * s, 2 * s)
  } else if (a.tasche === 'paket') {
    ctx.fillStyle = a.taschenFarbe
    ctx.fillRect(p.sx + blick * 1 * s - 2 * s, schulter + 2.4 * s, 4 * s, 3.2 * s)
  }
  if (a.begleiter === 'stock') {
    ctx.strokeStyle = '#6b4a2f'
    ctx.lineWidth = 0.9 * s
    ctx.beginPath()
    ctx.moveTo(vorne.sx, vorne.sy)
    ctx.lineTo(vorne.sx + blick * 1.2 * s, p.sy)
    ctx.stroke()
  }
  if (a.begleiter === 'hund' && fein) {
    ctx.strokeStyle = fade('#c0392b', 0.9)
    ctx.lineWidth = 0.6
    ctx.beginPath()
    ctx.moveTo(vorne.sx, vorne.sy)
    ctx.quadraticCurveTo(p.sx + blick * 5 * s, p.sy - 2 * s, p.sx + blick * 9.4 * s, p.sy - 3.6 * s)
    ctx.stroke()
  }

  // Kopf, Haare, Gesicht
  ctx.fillStyle = a.haut
  ctx.beginPath()
  ctx.arc(p.sx, kopfY, kopfR, 0, Math.PI * 2)
  ctx.fill()
  if (fein) umriss(ctx, 0.6 * s)
  haare(ctx, p.sx, kopfY, kopfR, a, blick, s)
  if (fein) {
    ctx.fillStyle = '#1c1c1c'
    ctx.beginPath()
    ctx.arc(p.sx + blick * 1.1 * s, kopfY - 0.2 * s, 0.38 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = shade(a.haut, -30)
    ctx.beginPath()
    ctx.arc(p.sx + blick * 2.3 * s, kopfY + 0.4 * s, 0.5 * s, 0, Math.PI * 2)
    ctx.fill()
    if (a.bart !== 'keiner') {
      ctx.fillStyle = a.bart === 'stoppel' ? fade(a.haar, 0.45) : a.haar
      ctx.beginPath()
      if (a.bart === 'schnauz') ctx.ellipse(p.sx + blick * 1.5 * s, kopfY + 1 * s, 1 * s, 0.45 * s, 0, 0, Math.PI * 2)
      else ctx.arc(p.sx + blick * 0.6 * s, kopfY + 0.9 * s, kopfR * 0.82, 0.1 * Math.PI, 0.9 * Math.PI)
      ctx.fill()
    }
    if (a.brille !== 'keine') {
      ctx.fillStyle = a.brille === 'sonne' ? '#141414' : 'rgba(210,230,255,0.5)'
      ctx.strokeStyle = '#1c1c1c'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.ellipse(p.sx + blick * 1.3 * s, kopfY - 0.2 * s, 1.1 * s, 0.75 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  }
  kopfbedeckung(ctx, p.sx, kopfY, kopfR, a, blick, s)

  if (a.begleiter === 'kinderwagen') kinderwagen(ctx, { sx: p.sx + blick * 6 * s, sy: p.sy + 0.5 }, griff(['#2c3e50', '#8e44ad', '#16a085', '#c0392b'], seed, 71), s)
  if (a.tasche === 'wagen') einkaufswagen(ctx, { sx: p.sx + blick * 6 * s, sy: p.sy + 0.5 }, s, seed)
}

function haare(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: Aussehen, blick: number, s: number): void {
  if (a.kopf === 'kopftuch') return
  ctx.fillStyle = a.haar
  switch (a.frisur) {
    case 'glatze':
      ctx.beginPath()
      ctx.arc(x - blick * r * 0.5, y + 0.2, r * 0.7, Math.PI * 0.6, Math.PI * 1.3)
      ctx.fill()
      return
    case 'lang':
      ctx.beginPath()
      ctx.arc(x, y - 0.4 * s, r * 1.02, Math.PI, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(x - blick * r - (blick < 0 ? 0 : 1.2 * s), y - 0.4 * s, 1.8 * s, r * 2)
      return
    case 'zopf':
      ctx.beginPath()
      ctx.arc(x, y - 0.4 * s, r, Math.PI, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(x - blick * r * 1.05, y + 1.2 * s, 0.9 * s, 2.2 * s, blick * 0.3, 0, Math.PI * 2)
      ctx.fill()
      return
    case 'zoepfe':
      ctx.beginPath()
      ctx.arc(x, y - 0.4 * s, r, Math.PI, Math.PI * 2)
      ctx.fill()
      for (const seite of [-1, 1]) {
        ctx.beginPath()
        ctx.ellipse(x + seite * r * 0.95, y + 1.6 * s, 0.7 * s, 1.8 * s, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      return
    case 'dutt':
      ctx.beginPath()
      ctx.arc(x, y - 0.4 * s, r, Math.PI, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x - blick * 0.4 * s, y - r - 0.6 * s, 1.3 * s, 0, Math.PI * 2)
      ctx.fill()
      return
    case 'locken':
      for (let i = 0; i < 6; i++) {
        const w = Math.PI + (i / 5) * Math.PI
        ctx.beginPath()
        ctx.arc(x + Math.cos(w) * r * 0.85, y - 0.3 * s + Math.sin(w) * r * 0.85, 1 * s, 0, Math.PI * 2)
        ctx.fill()
      }
      return
    case 'afro':
      ctx.beginPath()
      ctx.arc(x - blick * 0.3 * s, y - 0.9 * s, r * 1.35, Math.PI * 0.85, Math.PI * 2.15)
      ctx.fill()
      return
    case 'irokese':
      ctx.fillRect(x - 0.6 * s, y - r - 1.8 * s, 1.2 * s, 2.4 * s)
      return
    case 'bob':
      ctx.beginPath()
      ctx.arc(x, y - 0.2 * s, r * 1.08, Math.PI * 0.95, Math.PI * 2.05)
      ctx.fill()
      ctx.fillRect(x - r * 1.05, y - 0.2 * s, r * 0.5, r * 0.9)
      ctx.fillRect(x + r * 0.55, y - 0.2 * s, r * 0.5, r * 0.9)
      return
    case 'pony':
      ctx.beginPath()
      ctx.arc(x, y - 0.4 * s, r * 1.02, Math.PI, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(x + blick * 0.2 * s - r * 0.7, y - r * 0.5, r * 1.4, 0.9 * s)
      ctx.fillRect(x - blick * r - (blick < 0 ? 0 : 1.2 * s), y - 0.4 * s, 1.6 * s, r * 1.8)
      return
    case 'seite':
      ctx.beginPath()
      ctx.arc(x, y - 0.5 * s, r, Math.PI * 1.02, Math.PI * 2.02)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(x + blick * 0.8 * s, y - r * 0.85, r * 0.8, 0.8 * s, blick * 0.2, 0, Math.PI * 2)
      ctx.fill()
      return
    default:
      ctx.beginPath()
      ctx.arc(x, y - 0.5 * s, r, Math.PI * 1.05, Math.PI * 2.05)
      ctx.fill()
  }
}

function kopfbedeckung(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: Aussehen, blick: number, s: number): void {
  const f = a.kopfFarbe
  switch (a.kopf) {
    case 'cap':
      ctx.fillStyle = f
      ctx.beginPath()
      ctx.arc(x, y - 0.6 * s, r * 1.02, Math.PI, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(x + (blick > 0 ? 0 : -3.2 * s), y - 0.9 * s, 3.2 * s, 0.9 * s)
      return
    case 'muetze':
      ctx.fillStyle = f
      ctx.beginPath()
      ctx.arc(x, y - 0.4 * s, r * 1.06, Math.PI * 0.95, Math.PI * 2.05)
      ctx.fill()
      ctx.fillStyle = shade(f, 30)
      ctx.fillRect(x - r, y - 0.9 * s, r * 2, 0.9 * s)
      return
    case 'hut':
      ctx.fillStyle = f
      ctx.beginPath()
      ctx.ellipse(x, y - r * 0.7, r * 1.6, 0.7 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      roundedPath(ctx, x - r * 0.8, y - r * 1.7, r * 1.6, r * 1.1, 0.6 * s)
      ctx.fill()
      return
    case 'zylinder':
      ctx.fillStyle = '#141414'
      ctx.beginPath()
      ctx.ellipse(x, y - r * 0.7, r * 1.5, 0.6 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(x - r * 0.75, y - r * 2.6, r * 1.5, r * 2)
      ctx.fillStyle = '#c0392b'
      ctx.fillRect(x - r * 0.75, y - r * 1, r * 1.5, 0.6 * s)
      return
    case 'polizei':
      ctx.fillStyle = f
      ctx.beginPath()
      ctx.ellipse(x, y - r * 0.9, r * 1.2, r * 0.55, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#141414'
      ctx.fillRect(x + (blick > 0 ? -0.2 * s : -2.6 * s), y - r * 0.6, 2.8 * s, 0.7 * s)
      ctx.fillStyle = '#f4d35e'
      ctx.fillRect(x - 0.4 * s, y - r * 1.15, 0.8 * s, 0.8 * s)
      return
    case 'feuerhelm':
    case 'helm':
    case 'bauhelm':
      ctx.fillStyle = f
      ctx.beginPath()
      ctx.arc(x, y - 0.5 * s, r * 1.12, Math.PI, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(x - r * 1.3, y - 0.8 * s, r * 2.6, 0.8 * s)
      if (a.kopf === 'feuerhelm') {
        ctx.fillStyle = '#e8f07a'
        ctx.fillRect(x - r * 1.1, y - r * 0.9, r * 2.2, 0.6 * s)
      }
      return
    case 'kopftuch':
      ctx.fillStyle = f
      ctx.beginPath()
      ctx.arc(x, y - 0.1 * s, r * 1.12, Math.PI * 0.75, Math.PI * 2.25)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(x - blick * r * 0.8, y + r * 0.9, r * 0.7, r * 0.9, 0, 0, Math.PI * 2)
      ctx.fill()
      return
    case 'stirnband':
      ctx.fillStyle = f
      ctx.fillRect(x - r, y - r * 0.55, r * 2, 0.8 * s)
      return
    default:
  }
}

/** Jemand, der auf der Straße schläft: Pappe, Schlafsack, Mütze, ein Becher */
function liegend(ctx: CanvasRenderingContext2D, p: Point, a: Aussehen, fein: boolean, seed: number): void {
  const s = a.groesse
  ctx.fillStyle = '#b89a6a'
  ctx.beginPath()
  ctx.ellipse(p.sx, p.sy - 0.5, 9 * s, 3 * s, -0.12, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = griff(['#3f5a3a', '#5a3a2c', '#2c3e50', '#6b5a3a', '#4a3a5a'], seed, 95)
  ctx.beginPath()
  ctx.ellipse(p.sx - 1 * s, p.sy - 2.2 * s, 7 * s, 2.4 * s, -0.12, 0, Math.PI * 2)
  ctx.fill()
  if (fein) {
    ctx.strokeStyle = fade('#000000', 0.2)
    ctx.lineWidth = 0.5
    ctx.beginPath()
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(p.sx + i * 2.2 * s, p.sy - 4.2 * s)
      ctx.lineTo(p.sx + i * 2.2 * s + 0.4, p.sy - 0.4 * s)
    }
    ctx.stroke()
  }
  ctx.fillStyle = a.haut
  ctx.beginPath()
  ctx.arc(p.sx + 6.4 * s, p.sy - 3.4 * s, 2.2 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = a.kopfFarbe
  ctx.beginPath()
  ctx.arc(p.sx + 6.6 * s, p.sy - 4 * s, 2.3 * s, Math.PI * 1.1, Math.PI * 2.1)
  ctx.fill()
  ctx.fillStyle = '#e8e2d6'
  ctx.fillRect(p.sx + 9 * s, p.sy - 2.2 * s, 1.6 * s, 2 * s)
}

// ---------------------------------------------------------------------------
// Fahrzeuge
// ---------------------------------------------------------------------------

export type Modell =
  | 'kleinwagen'
  | 'kompakt'
  | 'limousine'
  | 'kombi'
  | 'suv'
  | 'gelaende'
  | 'pickup'
  | 'van'
  | 'transporter'
  | 'cabrio'
  | 'sport'
  | 'super'
  | 'oldtimer'
  | 'stretch'
  | 'elektro'
  | 'taxi'
  | 'polizei'
  | 'feuerwehr'
  | 'rettung'
  | 'bus'
  | 'lkw'
  | 'muell'
  | 'rostlaube'
  | 'motorrad'
  | 'roller'

type Zusatz = 'blaulicht' | 'leiter' | 'kreuz' | 'taxi' | 'spoiler' | 'dachbox' | 'streifen' | 'rost' | 'chrom' | 'ladeflaeche' | 'offen' | 'reserverad' | 'lamellen'

interface Bauart {
  lang: number
  breit: number
  hoch: number
  /** Kabine: Anteil der Länge, Höhe, Versatz nach vorn (Anteil) */
  kabine?: [number, number, number]
  /** Aufbau hinter dem Fahrerhaus: Anteil der Länge, Höhe, Versatz */
  aufbau?: [number, number, number]
  rad: number
  zusatz: Zusatz[]
  farben: string[]
}

const LACK = ['#e94f5a', '#3f9ee0', '#f2f2f2', '#2c2f36', '#7a8290', '#f2c14e', '#6ab04c', '#a97bff', '#1f3a5a', '#8c2c3a', '#d9d4c7', '#ff8c42']

export const BAUARTEN: Record<Modell, Bauart> = {
  kleinwagen: { lang: 16, breit: 10, hoch: 5, kabine: [0.58, 5, -0.02], rad: 2.3, zusatz: [], farben: LACK },
  kompakt: { lang: 19, breit: 10.5, hoch: 5.2, kabine: [0.52, 4.8, -0.04], rad: 2.5, zusatz: [], farben: LACK },
  limousine: { lang: 22, breit: 11, hoch: 5, kabine: [0.46, 4.6, -0.04], rad: 2.6, zusatz: [], farben: LACK },
  kombi: { lang: 22, breit: 11, hoch: 5, kabine: [0.6, 4.8, -0.1], rad: 2.6, zusatz: [], farben: LACK },
  suv: { lang: 21, breit: 12, hoch: 6.4, kabine: [0.56, 5.4, -0.06], rad: 3, zusatz: [], farben: LACK },
  gelaende: { lang: 20, breit: 12, hoch: 7, kabine: [0.54, 6, -0.08], rad: 3.2, zusatz: ['reserverad', 'dachbox'], farben: ['#3f5a3a', '#2c2f36', '#d9d4c7', '#8a5a3a', '#f2f2f2'] },
  pickup: { lang: 24, breit: 11.5, hoch: 6, kabine: [0.34, 5.4, 0.18], rad: 3, zusatz: ['ladeflaeche'], farben: ['#e94f5a', '#2c2f36', '#f2f2f2', '#3f5a3a', '#1f3a5a'] },
  van: { lang: 22, breit: 11.5, hoch: 6.4, kabine: [0.78, 6.4, -0.04], rad: 2.6, zusatz: [], farben: LACK },
  transporter: { lang: 25, breit: 12.5, hoch: 6, kabine: [0.26, 6.6, 0.34], aufbau: [0.64, 11, -0.16], rad: 2.8, zusatz: [], farben: ['#f2f2f2', '#d9d4c7', '#f2c14e', '#3f9ee0', '#6b4a2f'] },
  cabrio: { lang: 20, breit: 10.5, hoch: 4.4, rad: 2.5, zusatz: ['offen'], farben: ['#e94f5a', '#f2c14e', '#3f9ee0', '#f2f2f2', '#1c1c1c'] },
  sport: { lang: 21, breit: 11, hoch: 3.8, kabine: [0.4, 3.6, -0.02], rad: 2.6, zusatz: ['spoiler'], farben: ['#e94f5a', '#f2c14e', '#ff8c42', '#1c1c1c', '#3f9ee0'] },
  super: { lang: 22, breit: 11.5, hoch: 3.4, kabine: [0.36, 3.2, -0.02], rad: 2.7, zusatz: ['spoiler', 'chrom'], farben: ['#f2c14e', '#e94f5a', '#9dff8b', '#1c1c1c', '#ff4fd8'] },
  oldtimer: { lang: 20, breit: 10.5, hoch: 5.2, kabine: [0.44, 5, -0.04], rad: 2.6, zusatz: ['chrom'], farben: ['#8c2c3a', '#2f5a4a', '#d9c9a4', '#1f3a5a', '#f2f2f2'] },
  stretch: { lang: 34, breit: 11.5, hoch: 5, kabine: [0.72, 4.6, -0.04], rad: 2.6, zusatz: ['chrom'], farben: ['#141414', '#f2f2f2', '#2c2f36'] },
  elektro: { lang: 16, breit: 10, hoch: 5.4, kabine: [0.62, 5.2, 0], rad: 2.3, zusatz: [], farben: ['#9dff8b', '#7bdcff', '#f2f2f2', '#ff7ab5', '#f2c14e'] },
  taxi: { lang: 22, breit: 11, hoch: 5, kabine: [0.46, 4.6, -0.04], rad: 2.6, zusatz: ['taxi'], farben: ['#f2d34e'] },
  polizei: { lang: 22, breit: 11, hoch: 5.2, kabine: [0.58, 4.8, -0.08], rad: 2.6, zusatz: ['blaulicht', 'streifen'], farben: ['#eef2f6'] },
  feuerwehr: { lang: 34, breit: 14, hoch: 9, kabine: [0.24, 5, 0.38], rad: 3.4, zusatz: ['blaulicht', 'leiter', 'lamellen'], farben: ['#d63a2e'] },
  rettung: { lang: 27, breit: 13, hoch: 6, kabine: [0.24, 6, 0.36], aufbau: [0.66, 12, -0.16], rad: 3, zusatz: ['blaulicht', 'kreuz', 'streifen'], farben: ['#f6f6f2'] },
  bus: { lang: 44, breit: 14, hoch: 15, rad: 3.4, zusatz: [], farben: ['#f2c14e', '#3f9ee0', '#e94f5a', '#f2f2f2'] },
  lkw: { lang: 38, breit: 14, hoch: 6, kabine: [0.22, 9, 0.38], aufbau: [0.72, 14, -0.12], rad: 3.4, zusatz: [], farben: ['#3f9ee0', '#e94f5a', '#f2f2f2', '#2c2f36', '#6ab04c'] },
  muell: { lang: 32, breit: 14, hoch: 6, kabine: [0.24, 8, 0.36], aufbau: [0.68, 12, -0.14], rad: 3.4, zusatz: ['lamellen'], farben: ['#ff8c1a'] },
  rostlaube: { lang: 19, breit: 10.5, hoch: 5.2, kabine: [0.52, 4.8, -0.04], rad: 2.5, zusatz: ['rost'], farben: ['#8a7a5a', '#6b7a6a', '#8a5a4a', '#7a7a8a'] },
  motorrad: { lang: 12, breit: 4, hoch: 4, rad: 2.6, zusatz: [], farben: ['#1c1c1c', '#e94f5a', '#3f9ee0', '#f2c14e'] },
  roller: { lang: 10, breit: 4, hoch: 4, rad: 2, zusatz: [], farben: ['#7bdcff', '#ff7ab5', '#f2f2f2', '#9dff8b', '#e94f5a'] },
}

/** Welche Wagen zu welchem Geldbeutel passen */
export const MODELLE_NACH_KLASSE: Record<Klasse, Modell[]> = {
  arm: ['rostlaube', 'kleinwagen', 'kompakt', 'roller', 'rostlaube', 'kleinwagen'],
  mittel: ['kompakt', 'limousine', 'kombi', 'van', 'suv', 'kleinwagen', 'elektro', 'pickup', 'motorrad', 'kombi'],
  reich: ['suv', 'limousine', 'sport', 'cabrio', 'gelaende', 'oldtimer', 'elektro'],
  superreich: ['super', 'stretch', 'sport', 'oldtimer', 'cabrio'],
}

type Viereck = [Point, Point, Point, Point]

/** Ein Kasten auf dem Boden, in Fahrtrichtung: Seiten nach Tiefe sortiert, Deckel obenauf */
function kasten(
  ctx: CanvasRenderingContext2D,
  mitte: Point,
  frame: { vor: Point; quer: Point },
  versatz: number,
  lang: number,
  breit: number,
  hoch: number,
  basis: number,
  farbe: string,
): { deckel: Viereck; fuss: Viereck } {
  const ort = { sx: mitte.sx + frame.vor.sx * versatz, sy: mitte.sy + frame.vor.sy * versatz - basis }
  const fuss = groundRect(ort, frame, lang, breit)
  const deckel = fuss.map((q) => lift(q, hoch)) as Viereck
  const seiten: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ]
  seiten
    .map(([i, j]) => ({ i, j, tiefe: (fuss[i].sy + fuss[j].sy) / 2 }))
    .sort((a, b) => a.tiefe - b.tiefe)
    .forEach(({ i, j }) => {
      // Die nach rechts gewandte Seite fängt das Licht
      const mx = (fuss[i].sx + fuss[j].sx) / 2 - ort.sx
      quad(ctx, fuss[i], fuss[j], deckel[j], deckel[i], shade(farbe, mx > 0 ? -8 : -28))
    })
  quad(ctx, deckel[0], deckel[1], deckel[2], deckel[3], shade(farbe, 16))
  return { deckel, fuss }
}

export interface AutoOptionen {
  t: number
  seed: number
  fein: boolean
  geparkt?: boolean
  wrack?: boolean
  /** Blaulicht an – im Einsatz */
  blaulicht?: boolean
}

/** Ein Fahrzeug, das in Richtung (dx, dy) auf der Karte steht */
export function zeichneAuto(
  ctx: CanvasRenderingContext2D,
  p: Point,
  dx: number,
  dy: number,
  modell: Modell,
  farbe: string,
  o: AutoOptionen,
): void {
  const bau = BAUARTEN[modell]
  if (modell === 'motorrad' || modell === 'roller') {
    zweirad(ctx, p, dx, dy, modell, farbe, o)
    return
  }
  const frame = isoFrame(dx, dy)
  const radHoch = bau.rad
  const lang = bau.lang
  const breit = bau.breit
  const rost = bau.zusatz.includes('rost') || !!o.wrack
  const lack = o.wrack ? shade(farbe, -20) : farbe

  bodenSchatten(ctx, p, lang * 0.55, breit * 0.45, 0.24)

  const ecke = (l: number, q: number, z = 0): Point => ({
    sx: p.sx + frame.vor.sx * (lang / 2) * l + frame.quer.sx * (breit / 2) * q,
    sy: p.sy + frame.vor.sy * (lang / 2) * l + frame.quer.sy * (breit / 2) * q - z,
  })
  // Räder mit Felgen – beim Wrack fehlt eins
  const achsen = modell === 'bus' || modell === 'lkw' || modell === 'feuerwehr' ? [0.7, -0.35, -0.72] : [0.64, -0.64]
  let nr = 0
  for (const l of achsen) {
    for (const q of [0.9, -0.9]) {
      nr++
      if (o.wrack && nr === 2) continue
      const r = ecke(l, q)
      ctx.fillStyle = '#121620'
      ctx.beginPath()
      ctx.ellipse(r.sx, r.sy - radHoch * 0.72, radHoch * 1.15, radHoch * 0.95, 0, 0, Math.PI * 2)
      ctx.fill()
      if (o.fein) {
        ctx.fillStyle = bau.zusatz.includes('chrom') ? '#e8ecf2' : '#aeb6c4'
        ctx.beginPath()
        ctx.ellipse(r.sx, r.sy - radHoch * 0.74, radHoch * 0.5, radHoch * 0.42, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  const unten = radHoch * 0.9

  // Bus: ein langer Kasten mit Fensterband, Türen und Liniennummer
  if (modell === 'bus') {
    const k = kasten(ctx, p, frame, 0, lang, breit, bau.hoch, unten, lack)
    fensterband(ctx, k.fuss, bau.hoch, 0, o.fein)
    lichter(ctx, ecke, unten + 3, o.fein)
    if (o.fein) {
      const schild = lift(mix(k.fuss[0], k.fuss[1], 0.5), bau.hoch - 2)
      ctx.fillStyle = '#141414'
      ctx.fillRect(schild.sx - 4, schild.sy - 2, 8, 3)
      ctx.fillStyle = '#ffb000'
      ctx.fillRect(schild.sx - 3.4, schild.sy - 1.5, 6.8, 2)
    }
    return
  }

  // Karosserie
  const koerper = kasten(ctx, p, frame, 0, lang, breit, bau.hoch, unten, lack)
  if (rost && o.fein) {
    ctx.fillStyle = 'rgba(122,70,30,0.55)'
    for (let i = 0; i < 4; i++) {
      const q = mix(koerper.deckel[i], koerper.deckel[(i + 1) % 4], wobble(o.seed, i))
      ctx.beginPath()
      ctx.arc(q.sx, q.sy + 2, 1.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  if (bau.zusatz.includes('streifen')) {
    const f = koerper.fuss
    const d = koerper.deckel
    const streifen = modell === 'polizei' ? '#1f5fbf' : '#e84a2a'
    for (const [i, j] of [
      [0, 3],
      [1, 2],
    ] as [number, number][]) {
      quad(ctx, mix(f[i], d[i], 0.4), mix(f[j], d[j], 0.4), mix(f[j], d[j], 0.72), mix(f[i], d[i], 0.72), streifen)
    }
  }

  // Aufbau: Kastenwagen, Lkw, Müllwagen, Rettungswagen
  if (bau.aufbau) {
    const [anteil, hoch, versatz] = bau.aufbau
    const farbeAufbau = modell === 'lkw' ? '#f2f2f2' : modell === 'muell' ? '#ff8c1a' : modell === 'rettung' ? '#f6f6f2' : shade(lack, 10)
    const auf = kasten(ctx, p, frame, lang * versatz, lang * anteil, breit * 0.98, hoch, unten + bau.hoch, farbeAufbau)
    if (o.fein && (modell === 'rettung' || modell === 'lkw')) {
      const f = auf.fuss
      const d = auf.deckel
      for (const [i, j] of [
        [0, 3],
        [1, 2],
      ] as [number, number][]) {
        quad(ctx, mix(f[i], d[i], 0.2), mix(f[j], d[j], 0.2), mix(f[j], d[j], 0.34), mix(f[i], d[i], 0.34), modell === 'rettung' ? '#e84a2a' : lack)
      }
    }
    if (bau.zusatz.includes('kreuz')) {
      const m = mix(mix(auf.deckel[1], auf.deckel[2], 0.5), mix(auf.fuss[1], auf.fuss[2], 0.5), 0.45)
      ctx.fillStyle = '#e84a2a'
      ctx.fillRect(m.sx - 3, m.sy - 1, 6, 2)
      ctx.fillRect(m.sx - 1, m.sy - 3, 2, 6)
    }
    if (bau.zusatz.includes('lamellen') && o.fein) {
      ctx.strokeStyle = fade('#000000', 0.25)
      ctx.lineWidth = 0.6
      ctx.beginPath()
      for (let i = 1; i < 6; i++) {
        const a0 = mix(auf.fuss[1], auf.fuss[2], i / 6)
        ctx.moveTo(a0.sx, a0.sy)
        ctx.lineTo(a0.sx, a0.sy - hoch)
      }
      ctx.stroke()
    }
  }

  // Kabine, Fahrerhaus oder offener Innenraum
  let kabine: { deckel: Viereck; fuss: Viereck } | null = null
  if (bau.zusatz.includes('offen')) {
    const sitz = kasten(ctx, p, frame, -lang * 0.05, lang * 0.34, breit * 0.8, 1.6, unten + bau.hoch, '#3a2a24')
    const kopf = mix(sitz.deckel[0], sitz.deckel[2], 0.5)
    ctx.fillStyle = griff(HAUT, o.seed, 3)
    ctx.beginPath()
    ctx.arc(kopf.sx, kopf.sy - 3, 2.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = griff(HAAR, o.seed, 4)
    ctx.beginPath()
    ctx.arc(kopf.sx, kopf.sy - 3.4, 2.2, Math.PI, Math.PI * 2)
    ctx.fill()
    const w0 = mix(koerper.deckel[0], koerper.deckel[3], 0.28)
    const w1 = mix(koerper.deckel[1], koerper.deckel[2], 0.28)
    quad(ctx, w0, w1, lift(w1, 3), lift(w0, 3), 'rgba(160,210,244,0.75)')
  } else if (bau.kabine) {
    const [anteil, hoch, versatz] = bau.kabine
    const kabineFarbe = modell === 'feuerwehr' ? '#d63a2e' : modell === 'polizei' ? '#eef2f6' : shade(lack, -4)
    kabine = kasten(ctx, p, frame, lang * versatz, lang * anteil, breit * 0.9, hoch, unten + bau.hoch, kabineFarbe)
    scheiben(ctx, koerper, kabine, hoch, o.fein, !!o.geparkt)
  }

  if (bau.zusatz.includes('ladeflaeche')) {
    const f = koerper.deckel
    quad(ctx, mix(f[3], f[0], 0.08), mix(f[2], f[1], 0.08), mix(f[2], f[1], 0.52), mix(f[3], f[0], 0.52), '#2a2e36')
  }
  if (bau.zusatz.includes('spoiler') && o.fein) {
    const f = koerper.deckel
    const a0 = mix(f[3], f[2], 0.1)
    const b0 = mix(f[3], f[2], 0.9)
    quad(ctx, lift(a0, 2.5), lift(b0, 2.5), lift(b0, 3.6), lift(a0, 3.6), shade(lack, -30))
  }
  if (bau.zusatz.includes('dachbox') && kabine) {
    const m = mix(kabine.deckel[0], kabine.deckel[2], 0.5)
    ctx.fillStyle = '#2a2e36'
    roundedPath(ctx, m.sx - 5, m.sy - 3, 10, 3, 1.4)
    ctx.fill()
  }
  if (bau.zusatz.includes('leiter')) {
    const f = koerper.deckel
    ctx.strokeStyle = '#d7dbe2'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    const l0 = lift(mix(f[3], f[0], 0.1), 3)
    const l1 = lift(mix(f[0], f[3], 0.08), 3)
    const r0 = lift(mix(f[2], f[1], 0.1), 3)
    const r1 = lift(mix(f[1], f[2], 0.08), 3)
    const links0 = mix(l0, r0, 0.3)
    const links1 = mix(l1, r1, 0.3)
    const rechts0 = mix(l0, r0, 0.7)
    const rechts1 = mix(l1, r1, 0.7)
    ctx.moveTo(links0.sx, links0.sy)
    ctx.lineTo(links1.sx, links1.sy)
    ctx.moveTo(rechts0.sx, rechts0.sy)
    ctx.lineTo(rechts1.sx, rechts1.sy)
    for (let i = 1; i < 8; i++) {
      const a0 = mix(links0, links1, i / 8)
      const b0 = mix(rechts0, rechts1, i / 8)
      ctx.moveTo(a0.sx, a0.sy)
      ctx.lineTo(b0.sx, b0.sy)
    }
    ctx.stroke()
    if (o.fein) {
      ctx.strokeStyle = fade('#000000', 0.25)
      ctx.lineWidth = 0.6
      ctx.beginPath()
      for (let i = 1; i < 6; i++) {
        const a0 = mix(koerper.fuss[1], koerper.fuss[2], i / 7 + 0.1)
        ctx.moveTo(a0.sx, a0.sy)
        ctx.lineTo(a0.sx, a0.sy - bau.hoch)
      }
      ctx.stroke()
    }
  }
  if (bau.zusatz.includes('reserverad')) {
    const hinten = mix(mix(koerper.fuss[2], koerper.fuss[3], 0.5), mix(koerper.deckel[2], koerper.deckel[3], 0.5), 0.5)
    ctx.fillStyle = '#121620'
    ctx.beginPath()
    ctx.ellipse(hinten.sx, hinten.sy, 2.6, 2.2, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Taxischild und Blaulicht
  const dachMitte = kabine ? mix(kabine.deckel[0], kabine.deckel[2], 0.5) : mix(koerper.deckel[0], koerper.deckel[2], 0.5)
  if (bau.zusatz.includes('taxi')) {
    ctx.fillStyle = '#1c2438'
    roundedPath(ctx, dachMitte.sx - 4.4, dachMitte.sy - 3.8, 8.8, 3.6, 1.2)
    ctx.fill()
    ctx.fillStyle = '#ffe9a8'
    roundedPath(ctx, dachMitte.sx - 3.6, dachMitte.sy - 3.3, 7.2, 2.4, 0.9)
    ctx.fill()
  }
  if (bau.zusatz.includes('blaulicht')) {
    const im = !!o.blaulicht
    const an = im && Math.sin(o.t * 12 + o.seed) > 0
    const blau = '#2e86ff'
    const m = kabine && (modell === 'feuerwehr' || modell === 'rettung') ? mix(kabine.deckel[0], kabine.deckel[1], 0.5) : dachMitte
    ctx.fillStyle = '#2a3140'
    roundedPath(ctx, m.sx - 5, m.sy - 2.6, 10, 2.6, 1)
    ctx.fill()
    ctx.fillStyle = an ? blau : fade(blau, im ? 0.3 : 0.55)
    roundedPath(ctx, m.sx - 4.6, m.sy - 4.4, 4, 2.2, 0.8)
    ctx.fill()
    ctx.fillStyle = im && !an ? blau : fade(blau, im ? 0.3 : 0.55)
    roundedPath(ctx, m.sx + 0.6, m.sy - 4.4, 4, 2.2, 0.8)
    ctx.fill()
    if (im) {
      // Schein, der über die Straße wandert
      ctx.fillStyle = fade(blau, 0.16)
      ctx.beginPath()
      ctx.ellipse(m.sx + (an ? -3 : 3), m.sy - 3, 14, 8, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  if (!o.wrack) lichter(ctx, ecke, unten + bau.hoch * 0.55, o.fein)
}

/** Scheiben einer Kabine: Frontscheibe schräg, Seitenfenster mit Säule, Heckscheibe */
function scheiben(
  ctx: CanvasRenderingContext2D,
  koerper: { deckel: Viereck; fuss: Viereck },
  kabine: { deckel: Viereck; fuss: Viereck },
  hoch: number,
  fein: boolean,
  geparkt: boolean,
): void {
  const kd = kabine.deckel
  const kf = kabine.fuss
  quad(ctx, koerper.deckel[0], koerper.deckel[1], kd[1], kd[0], 'rgba(158,206,244,0.92)')
  quad(ctx, koerper.deckel[3], koerper.deckel[2], kd[2], kd[3], 'rgba(120,170,214,0.82)')
  for (const [i, j] of [
    [1, 2],
    [3, 0],
  ] as [number, number][]) {
    quad(ctx, lift(kf[i], hoch * 0.86), lift(kf[j], hoch * 0.86), lift(kf[j], hoch * 0.22), lift(kf[i], hoch * 0.22), 'rgba(96,142,186,0.86)')
    if (!fein) continue
    const m = mix(kf[i], kf[j], 0.52)
    ctx.strokeStyle = 'rgba(30,36,50,0.7)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(m.sx, m.sy - hoch * 0.22)
    ctx.lineTo(m.sx, m.sy - hoch * 0.86)
    ctx.stroke()
    if (!geparkt && i === 1) {
      const kopf = lift(mix(kf[i], kf[j], 0.28), hoch * 0.6)
      ctx.fillStyle = 'rgba(30,24,20,0.55)'
      ctx.beginPath()
      ctx.arc(kopf.sx, kopf.sy, 1.7, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  if (fein) {
    ctx.fillStyle = 'rgba(30,36,50,0.8)'
    for (const i of [0, 1]) {
      const sp = lift(kf[i], hoch * 0.35)
      ctx.beginPath()
      ctx.arc(sp.sx, sp.sy, 0.9, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function fensterband(ctx: CanvasRenderingContext2D, fuss: Viereck, hoch: number, unten: number, fein: boolean): void {
  for (const [i, j] of [
    [1, 2],
    [3, 0],
  ] as [number, number][]) {
    const a = lift(fuss[i], unten + hoch * 0.45)
    const b = lift(fuss[j], unten + hoch * 0.45)
    quad(ctx, a, b, lift(b, hoch * 0.4), lift(a, hoch * 0.4), 'rgba(96,142,186,0.88)')
    if (!fein) continue
    ctx.strokeStyle = 'rgba(30,36,50,0.55)'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    for (let k = 1; k < 7; k++) {
      const m = mix(a, b, k / 7)
      ctx.moveTo(m.sx, m.sy)
      ctx.lineTo(m.sx, m.sy - hoch * 0.4)
    }
    ctx.stroke()
  }
  const f0 = lift(fuss[0], unten + hoch * 0.4)
  const f1 = lift(fuss[1], unten + hoch * 0.4)
  quad(ctx, f0, f1, lift(f1, hoch * 0.5), lift(f0, hoch * 0.5), 'rgba(158,206,244,0.92)')
}

function lichter(ctx: CanvasRenderingContext2D, ecke: (l: number, q: number, z?: number) => Point, z: number, fein: boolean): void {
  const licht = (l: number, q: number, farbe: string, r: number) => {
    const p = ecke(l, q, z)
    ctx.fillStyle = farbe
    ctx.beginPath()
    ctx.ellipse(p.sx, p.sy, r, r * 0.8, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  licht(0.99, 0.6, 'rgba(255,248,206,0.98)', 1.6)
  licht(0.99, -0.6, 'rgba(255,248,206,0.98)', 1.6)
  licht(-0.99, 0.6, 'rgba(255,70,70,0.95)', 1.3)
  licht(-0.99, -0.6, 'rgba(255,70,70,0.95)', 1.3)
  if (fein) {
    for (const l of [1, -1]) {
      const p = ecke(l, 0, z - 1.5)
      ctx.fillStyle = '#f4f4f4'
      ctx.fillRect(p.sx - 1.8, p.sy - 0.8, 3.6, 1.6)
    }
  }
}

/** Motorrad und Roller: schmal, mit Fahrer und Helm */
function zweirad(ctx: CanvasRenderingContext2D, p: Point, dx: number, dy: number, modell: Modell, farbe: string, o: AutoOptionen): void {
  const richtung = dirToScreen(dx, dy)
  const blick = richtung.sx >= 0 ? 1 : -1
  const gross = modell === 'motorrad' ? 1 : 0.85
  bodenSchatten(ctx, p, 7 * gross, 2.4, 0.22)
  const drehung = o.t * 12
  for (const x of [-4.4, 4.4]) {
    ctx.strokeStyle = '#121620'
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.arc(p.sx + x * blick * gross, p.sy - 2.6, 2.4 * gross, 0, Math.PI * 2)
    ctx.stroke()
    if (o.fein) {
      ctx.strokeStyle = 'rgba(200,210,230,0.6)'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(p.sx + x * blick * gross + Math.cos(drehung) * 1.8, p.sy - 2.6 + Math.sin(drehung) * 1.8)
      ctx.lineTo(p.sx + x * blick * gross - Math.cos(drehung) * 1.8, p.sy - 2.6 - Math.sin(drehung) * 1.8)
      ctx.stroke()
    }
  }
  ctx.fillStyle = farbe
  ctx.beginPath()
  ctx.moveTo(p.sx - 5 * blick * gross, p.sy - 4)
  ctx.lineTo(p.sx + 3 * blick * gross, p.sy - 4.6)
  ctx.lineTo(p.sx + 4.4 * blick * gross, p.sy - 8)
  ctx.lineTo(p.sx - 1 * blick * gross, p.sy - 7)
  ctx.closePath()
  ctx.fill()
  const a = aussehenVon(o.seed, 'bewohner', 'mittel')
  ctx.fillStyle = a.obenFarbe
  roundedPath(ctx, p.sx - 2, p.sy - 14, 4, 6.5, 1.6)
  ctx.fill()
  ctx.strokeStyle = a.untenFarbe
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.moveTo(p.sx, p.sy - 8)
  ctx.lineTo(p.sx + 2 * blick, p.sy - 5)
  ctx.stroke()
  ctx.fillStyle = griff(['#1c1c1c', '#f4f4f4', '#e94f5a', '#3f9ee0'], o.seed, 7)
  ctx.beginPath()
  ctx.arc(p.sx + 0.6 * blick, p.sy - 16.2, 2.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(40,60,90,0.8)'
  ctx.fillRect(p.sx + (blick > 0 ? 0.8 : -3), p.sy - 17, 2.2, 1.6)
  ctx.fillStyle = 'rgba(255,248,206,0.98)'
  ctx.beginPath()
  ctx.arc(p.sx + 4.8 * blick * gross, p.sy - 7.6, 1, 0, Math.PI * 2)
  ctx.fill()
}

// ---------------------------------------------------------------------------
// Figuren aus dem Leben der Stadt
// ---------------------------------------------------------------------------

/** Radfahrer mit Rahmen, Speichen, Korb und Helm */
function radfahrer(ctx: CanvasRenderingContext2D, p: Point, agent: Agent, t: number, blick: number, fein: boolean): void {
  const seed = agent.seed
  const drehung = t * 9 + seed * 6
  const hinten = { sx: p.sx - 4.4 * blick, sy: p.sy - 2.8 }
  const vorne = { sx: p.sx + 4.4 * blick, sy: p.sy - 2.8 }
  bodenSchatten(ctx, p, 6, 2.4)
  for (const r of [hinten, vorne]) {
    ctx.strokeStyle = 'rgba(22,28,44,0.92)'
    ctx.lineWidth = 1.3
    ctx.beginPath()
    ctx.arc(r.sx, r.sy, 2.9, 0, Math.PI * 2)
    ctx.stroke()
    if (fein) {
      ctx.lineWidth = 0.5
      ctx.strokeStyle = 'rgba(210,220,240,0.65)'
      ctx.beginPath()
      for (let i = 0; i < 3; i++) {
        const w = drehung + (i * Math.PI) / 3
        ctx.moveTo(r.sx - Math.cos(w) * 2.5, r.sy - Math.sin(w) * 2.5)
        ctx.lineTo(r.sx + Math.cos(w) * 2.5, r.sy + Math.sin(w) * 2.5)
      }
      ctx.stroke()
    }
  }
  const rahmen = griff(['#e74c3c', '#2e86c1', '#27ae60', '#1c1c1c', '#f39c12', '#ecf0f1', '#8e44ad'], seed, 3)
  ctx.strokeStyle = rahmen
  ctx.lineWidth = 1.4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(hinten.sx, hinten.sy)
  ctx.lineTo(p.sx - 0.4 * blick, p.sy - 7)
  ctx.lineTo(vorne.sx, vorne.sy)
  ctx.moveTo(p.sx - 0.4 * blick, p.sy - 7)
  ctx.lineTo(p.sx + 1.2 * blick, p.sy - 3)
  ctx.lineTo(hinten.sx, hinten.sy)
  ctx.moveTo(vorne.sx, vorne.sy)
  ctx.lineTo(vorne.sx - 0.8 * blick, p.sy - 9)
  ctx.lineTo(vorne.sx + 1.4 * blick, p.sy - 9.4)
  ctx.stroke()
  if (fein && wobble(seed, 4) < 0.3) {
    ctx.fillStyle = '#b98a54'
    ctx.fillRect(vorne.sx - 1.2 + blick, p.sy - 10.6, 3, 2.2)
  }
  const a = aussehenVon(seed, agent.rolle, agent.klasse)
  const kopf = { sx: p.sx + 1 * blick, sy: p.sy - 15.6 }
  ctx.strokeStyle = a.untenFarbe
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.moveTo(p.sx - 0.6 * blick, p.sy - 9.6)
  ctx.lineTo(p.sx + Math.cos(drehung) * 2.2 * blick, p.sy - 4.8 + Math.sin(drehung) * 1.6)
  ctx.moveTo(p.sx - 0.6 * blick, p.sy - 9.6)
  ctx.lineTo(p.sx - Math.cos(drehung) * 2.2 * blick, p.sy - 4.8 - Math.sin(drehung) * 1.6)
  ctx.stroke()
  ctx.fillStyle = a.obenFarbe
  ctx.save()
  ctx.translate(p.sx, p.sy - 12.6)
  ctx.rotate(blick * 0.3)
  roundedPath(ctx, -2, 0, 4, 6.4, 1.6)
  ctx.fill()
  ctx.restore()
  ctx.strokeStyle = a.haut
  ctx.lineWidth = 1.3
  ctx.beginPath()
  ctx.moveTo(p.sx + 0.8 * blick, p.sy - 11.6)
  ctx.lineTo(vorne.sx + 0.4 * blick, p.sy - 9.2)
  ctx.stroke()
  ctx.fillStyle = a.haut
  ctx.beginPath()
  ctx.arc(kopf.sx, kopf.sy, 2.3, 0, Math.PI * 2)
  ctx.fill()
  if (wobble(seed, 8) < 0.6) {
    ctx.fillStyle = griff(['#e74c3c', '#f1c40f', '#ecf0f1', '#2ecc71', '#3498db'], seed, 9)
    ctx.beginPath()
    ctx.arc(kopf.sx, kopf.sy - 0.4, 2.5, Math.PI * 1.02, Math.PI * 2.05)
    ctx.fill()
  } else {
    haare(ctx, kopf.sx, kopf.sy, 2.3, a, blick, 1)
  }
}

/** Eine Figur der Stadt, wie sie gerade unterwegs ist */
export function drawAgent(ctx: CanvasRenderingContext2D, agent: Agent, t: number, fein: boolean): void {
  if (agent.zustand === 'drinnen') return
  const p = toScreen(agent.x, agent.y)
  const richtung = dirToScreen(agent.rx, agent.ry)
  const blick = richtung.sx >= 0 ? 1 : -1

  if (agent.art === 'auto' || agent.art === 'dienst') {
    zeichneAuto(ctx, p, agent.rx, agent.ry, agent.modell ?? 'kompakt', agent.farbe, {
      t,
      seed: agent.seed,
      fein,
      blaulicht: !!agent.licht,
      geparkt: agent.zustand !== 'unterwegs',
    })
    return
  }
  if (agent.art === 'rad') {
    radfahrer(ctx, p, agent, t, blick, fein)
    return
  }

  const a = aussehenVon(agent.seed, agent.rolle, agent.klasse)
  if (agent.pose !== 'liegt') bodenSchatten(ctx, p, 3.6 * a.groesse, 1.9 * a.groesse, 0.2)
  const pose: Pose = agent.pose ?? (agent.zustand === 'unterwegs' ? (agent.rolle === 'jogger' ? 'rennt' : 'geht') : 'steht')
  const tempo = pose === 'rennt' ? 12 : 7.4
  const schritt = pose === 'steht' || pose === 'sitzt' ? Math.sin(t * 1.4 + agent.seed) * 0.4 : t * tempo + agent.seed * 9
  const huepf = pose === 'geht' || pose === 'rennt' ? Math.abs(Math.sin(schritt)) * (pose === 'rennt' ? 1.2 : 0.6) : 0
  zeichnePerson(ctx, { sx: p.sx, sy: p.sy - huepf }, a, pose, schritt, blick, fein, agent.seed)
}
