// Die Bewohner und ihre Fahrzeuge. Alles wird von Hand gezeichnet, in wenigen
// Bildpunkten – darum zählt jeder Strich: Beine gehen, Arme schwingen, Räder
// drehen sich, und ein Auto zeigt dorthin, wo es hinfährt.
import { bodenSchatten, groundRect, isoFrame, lift, quad, roundedPath, shade, wobble, type Point } from './draw'
import { toScreen } from './iso'
import type { Idler, Walker } from './life'

/** Hauttöne – die Stadt ist bunt bewohnt */
const HAUT = ['#f4c9a0', '#e0a97a', '#c9855a', '#a4653f', '#7a4a2c', '#ffe0bd']
/** Haarfarben */
const HAAR = ['#2b1d14', '#4a2f1c', '#8a5a2b', '#c98b3a', '#d9d2c5', '#1a1a1f', '#b5462f']
/** Hosenfarben */
const HOSE = ['#2f3b57', '#3c3c46', '#4b3a2a', '#27405c', '#5a2f46']

const griff = (liste: readonly string[], zahl: number) => liste[Math.floor(zahl * liste.length) % liste.length]

/** Eine dunkle Linie um die Gestalt – sonst verschwimmt sie mit der Wiese */
function umriss(ctx: CanvasRenderingContext2D, staerke = 0.9): void {
  ctx.strokeStyle = 'rgba(18,24,40,0.55)'
  ctx.lineWidth = staerke
  ctx.stroke()
}

/** Wo die Figur gerade steht */
export function walkerAt(walker: Walker): { x: number; y: number } {
  const x = walker.x + 0.5 + (walker.tx - walker.x) * walker.t
  const y = walker.y + 0.5 + (walker.ty - walker.y) * walker.t
  return { x: x + (walker.tx === walker.x ? walker.off : 0), y: y + (walker.ty === walker.y ? walker.off : 0) }
}

/** Ein Mensch auf zwei Beinen, von der Seite gesehen */
function person(
  ctx: CanvasRenderingContext2D,
  p: Point,
  seed: number,
  shirt: string,
  schritt: number,
  blick: number,
  groesse = 1,
): void {
  const haut = griff(HAUT, wobble(seed, 1))
  const haar = griff(HAAR, wobble(seed, 2))
  const hose = griff(HOSE, wobble(seed, 3))
  const hut = wobble(seed, 4) > 0.82
  const rucksack = wobble(seed, 5) > 0.72
  const zopf = wobble(seed, 6) > 0.6
  const s = groesse

  const fuss = p.sy
  const beinLang = 4.4 * s
  const rumpfHoch = 6.2 * s
  const schulter = fuss - beinLang - rumpfHoch
  const schwung = Math.sin(schritt) * 2.1 * s
  const gegen = -schwung

  // Beine – eines vor, eines zurück
  ctx.strokeStyle = hose
  ctx.lineWidth = 1.9 * s
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(p.sx, fuss - beinLang)
  ctx.lineTo(p.sx + schwung * blick, fuss)
  ctx.moveTo(p.sx, fuss - beinLang)
  ctx.lineTo(p.sx + gegen * blick, fuss)
  ctx.stroke()

  // Rucksack liegt hinter dem Rumpf
  if (rucksack) {
    ctx.fillStyle = shade(shirt, -46)
    roundedPath(ctx, p.sx - blick * 2.6 * s - 1.3 * s, schulter + 0.8 * s, 2.6 * s, 4.4 * s, 1.1 * s)
    ctx.fill()
  }

  // Rumpf
  ctx.fillStyle = shirt
  roundedPath(ctx, p.sx - 1.9 * s, schulter, 3.8 * s, rumpfHoch + 0.6 * s, 1.5 * s)
  ctx.fill()
  umriss(ctx, 0.7 * s)

  // Arme
  ctx.strokeStyle = shirt === '#ffffff' ? shade(shirt, -40) : shade(shirt, -28)
  ctx.lineWidth = 1.5 * s
  ctx.beginPath()
  ctx.moveTo(p.sx - 1.4 * s, schulter + 1.2 * s)
  ctx.lineTo(p.sx - 1.4 * s + gegen * blick * 0.8, schulter + 4.6 * s)
  ctx.moveTo(p.sx + 1.4 * s, schulter + 1.2 * s)
  ctx.lineTo(p.sx + 1.4 * s + schwung * blick * 0.8, schulter + 4.6 * s)
  ctx.stroke()
  // Hände
  ctx.fillStyle = haut
  ctx.beginPath()
  ctx.arc(p.sx - 1.4 * s + gegen * blick * 0.8, schulter + 4.9 * s, 0.8 * s, 0, Math.PI * 2)
  ctx.arc(p.sx + 1.4 * s + schwung * blick * 0.8, schulter + 4.9 * s, 0.8 * s, 0, Math.PI * 2)
  ctx.fill()

  // Kopf
  const kopf = schulter - 2.3 * s
  ctx.fillStyle = haut
  ctx.beginPath()
  ctx.arc(p.sx, kopf, 2.3 * s, 0, Math.PI * 2)
  ctx.fill()
  umriss(ctx, 0.7 * s)

  // Haare: Kappe oben, bei Bedarf ein Zopf im Nacken
  ctx.fillStyle = haar
  ctx.beginPath()
  ctx.arc(p.sx, kopf - 0.5 * s, 2.3 * s, Math.PI * 1.05, Math.PI * 2.05)
  ctx.fill()
  if (zopf) {
    ctx.beginPath()
    ctx.ellipse(p.sx - blick * 2.2 * s, kopf + 0.7 * s, 0.9 * s, 2 * s, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  if (hut) {
    ctx.fillStyle = shade(shirt, -20)
    ctx.beginPath()
    ctx.ellipse(p.sx, kopf - 1.8 * s, 3.3 * s, 0.8 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    roundedPath(ctx, p.sx - 1.9 * s, kopf - 3.6 * s, 3.8 * s, 2 * s, 0.8 * s)
    ctx.fill()
  }
  // Nase in Blickrichtung – winzig, aber sie gibt dem Gesicht eine Seite
  ctx.fillStyle = shade(haut, -34)
  ctx.beginPath()
  ctx.arc(p.sx + blick * 2.1 * s, kopf + 0.2 * s, 0.55 * s, 0, Math.PI * 2)
  ctx.fill()
}

/** Ein Rad mit Speichen */
function rad(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, drehung: number): void {
  ctx.strokeStyle = 'rgba(22,28,44,0.9)'
  ctx.lineWidth = 1.3
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 0.6
  ctx.strokeStyle = 'rgba(210,220,240,0.7)'
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const a = drehung + (i * Math.PI) / 4
    ctx.moveTo(x - Math.cos(a) * r * 0.85, y - Math.sin(a) * r * 0.85)
    ctx.lineTo(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85)
  }
  ctx.stroke()
}

/** Fahrrad samt Fahrer */
function radfahrer(ctx: CanvasRenderingContext2D, p: Point, walker: Walker, t: number, blick: number): void {
  const seed = walker.seed
  const drehung = t * 9 + seed * 6
  const hinten = { sx: p.sx - 4.2 * blick, sy: p.sy - 2.2 }
  const vorne = { sx: p.sx + 4.2 * blick, sy: p.sy - 2.2 }

  rad(ctx, hinten.sx, hinten.sy, 2.9, drehung)
  rad(ctx, vorne.sx, vorne.sy, 2.9, drehung)

  // Rahmen
  ctx.strokeStyle = walker.color
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(hinten.sx, hinten.sy)
  ctx.lineTo(p.sx - 0.4 * blick, p.sy - 6.4)
  ctx.lineTo(vorne.sx, vorne.sy)
  ctx.moveTo(p.sx - 0.4 * blick, p.sy - 6.4)
  ctx.lineTo(p.sx + 1.2 * blick, p.sy - 2.4)
  ctx.lineTo(hinten.sx, hinten.sy)
  ctx.stroke()
  // Lenker
  ctx.beginPath()
  ctx.moveTo(vorne.sx, vorne.sy)
  ctx.lineTo(vorne.sx - 0.8 * blick, p.sy - 8.2)
  ctx.lineTo(vorne.sx + 1.4 * blick, p.sy - 8.6)
  ctx.stroke()

  // Fahrer: leicht nach vorn gebeugt, Beine treten
  const haut = griff(HAUT, wobble(seed, 1))
  const tritt = drehung
  ctx.strokeStyle = griff(HOSE, wobble(seed, 3))
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.moveTo(p.sx - 0.6 * blick, p.sy - 9.4)
  ctx.lineTo(p.sx + Math.cos(tritt) * 2.2 * blick, p.sy - 4.6 + Math.sin(tritt) * 1.6)
  ctx.moveTo(p.sx - 0.6 * blick, p.sy - 9.4)
  ctx.lineTo(p.sx - Math.cos(tritt) * 2.2 * blick, p.sy - 4.6 - Math.sin(tritt) * 1.6)
  ctx.stroke()

  ctx.fillStyle = walker.color
  ctx.save()
  ctx.translate(p.sx, p.sy - 12)
  ctx.rotate(blick * 0.28)
  roundedPath(ctx, -1.9, 0, 3.8, 6.4, 1.6)
  ctx.fill()
  umriss(ctx, 0.7)
  ctx.restore()

  // Arm zum Lenker
  ctx.strokeStyle = shade(walker.color, -30)
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(p.sx + 0.8 * blick, p.sy - 11)
  ctx.lineTo(vorne.sx + 0.4 * blick, p.sy - 8.4)
  ctx.stroke()

  const kopf = p.sy - 14.6
  ctx.fillStyle = haut
  ctx.beginPath()
  ctx.arc(p.sx + 1 * blick, kopf, 2.2, 0, Math.PI * 2)
  ctx.fill()
  umriss(ctx, 0.7)
  // Helm
  ctx.fillStyle = shade(walker.color, 30)
  ctx.beginPath()
  ctx.arc(p.sx + 1 * blick, kopf - 0.4, 2.4, Math.PI * 1.02, Math.PI * 2.05)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(p.sx + 1 * blick + 2.3 * blick, kopf - 0.6)
  ctx.lineTo(p.sx + 1 * blick + 3.8 * blick, kopf + 0.3)
  ctx.lineTo(p.sx + 1 * blick + 2.2 * blick, kopf + 0.5)
  ctx.closePath()
  ctx.fill()
}

/** Bauart eines Wagens – jedes Auto behält seine, weil sie am Samen hängt */
type Wagen = 'limousine' | 'kombi' | 'lieferwagen' | 'taxi' | 'flitzer'

function wagenArt(seed: number): Wagen {
  const z = wobble(seed, 11)
  if (z > 0.86) return 'taxi'
  if (z > 0.7) return 'lieferwagen'
  if (z > 0.55) return 'flitzer'
  if (z > 0.3) return 'kombi'
  return 'limousine'
}

/** Ein Kasten, der auf dem Wagen sitzt: Kabine, Ladefläche, Dachschild */
function aufsatz(
  ctx: CanvasRenderingContext2D,
  mitte: Point,
  frame: { vor: Point; quer: Point },
  versatz: number,
  lang: number,
  breit: number,
  hoehe: number,
  basis: number,
  farbe: string,
): { deckel: [Point, Point, Point, Point]; fuss: [Point, Point, Point, Point] } {
  const ort = {
    sx: mitte.sx + frame.vor.sx * versatz,
    sy: mitte.sy + frame.vor.sy * versatz - basis,
  }
  const fuss = groundRect(ort, frame, lang, breit)
  const deckel = fuss.map((p) => lift(p, hoehe)) as [Point, Point, Point, Point]
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
      const dunkel = i === 1 || i === 2 ? -26 : -10
      quad(ctx, fuss[i], fuss[j], deckel[j], deckel[i], shade(farbe, dunkel))
    })
  quad(ctx, deckel[0], deckel[1], deckel[2], deckel[3], shade(farbe, 16))
  return { deckel, fuss }
}

/** Ein Auto, das in Fahrtrichtung steht */
function auto(ctx: CanvasRenderingContext2D, p: Point, walker: Walker, t: number): void {
  const frame = isoFrame(walker.tx - walker.x, walker.ty - walker.y)
  const art = wagenArt(walker.seed)
  const farbe = art === 'taxi' ? '#f2c14e' : walker.color

  const lang = art === 'lieferwagen' ? 25 : art === 'kombi' ? 23 : art === 'flitzer' ? 21 : 22
  const breit = art === 'lieferwagen' ? 12.5 : 11
  const tief = art === 'flitzer' ? 4.4 : 5.4
  const radHoch = 2.6

  // Räder zuerst – sie stecken unter dem Blech und schauen darunter hervor
  const ecke = (langAnteil: number, querAnteil: number, hoch = 0): Point => ({
    sx: p.sx + frame.vor.sx * (lang / 2) * langAnteil + frame.quer.sx * (breit / 2) * querAnteil,
    sy: p.sy + frame.vor.sy * (lang / 2) * langAnteil + frame.quer.sy * (breit / 2) * querAnteil - hoch,
  })
  for (const a of [0.66, -0.66]) {
    for (const s of [0.9, -0.9]) {
      const r = ecke(a, s)
      ctx.fillStyle = 'rgba(16,20,32,0.95)'
      ctx.beginPath()
      ctx.ellipse(r.sx, r.sy - 1.9, 3.1, 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(196,206,226,0.75)'
      ctx.beginPath()
      ctx.ellipse(r.sx, r.sy - 2, 1.2, 1, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Karosserie
  const koerper = aufsatz(ctx, p, frame, 0, lang, breit, tief, radHoch, farbe)

  if (art === 'lieferwagen') {
    // Kastenwagen: hoher Laderaum hinten, niedrigeres Haus vorn
    const laden = aufsatz(ctx, p, frame, -lang * 0.16, lang * 0.62, breit * 0.94, 10, radHoch + tief, shade(farbe, 22))
    const haus = aufsatz(ctx, p, frame, lang * 0.3, lang * 0.34, breit * 0.9, 6.4, radHoch + tief, shade(farbe, 4))
    // Frontscheibe
    quad(ctx, haus.deckel[0], haus.deckel[1], lift(haus.fuss[1], 1.6), lift(haus.fuss[0], 1.6), 'rgba(150,200,240,0.9)')
    // Seitenfenster
    quad(ctx, lift(haus.fuss[1], 5.2), lift(haus.fuss[2], 5.2), lift(haus.fuss[2], 2.2), lift(haus.fuss[1], 2.2), 'rgba(96,142,186,0.8)')
    void laden
  } else {
    // Kabine, leicht nach hinten gesetzt
    const kabineLang = art === 'flitzer' ? lang * 0.46 : lang * 0.52
    const kabineHoch = art === 'flitzer' ? 4 : 5
    const kabine = aufsatz(ctx, p, frame, -lang * 0.06, kabineLang, breit * 0.9, kabineHoch, radHoch + tief, shade(farbe, -4))

    // Frontscheibe: die geneigte Fläche zwischen Motorhaube und Kabinendach
    const haubeVorn: [Point, Point] = [
      { sx: koerper.deckel[0].sx, sy: koerper.deckel[0].sy },
      { sx: koerper.deckel[1].sx, sy: koerper.deckel[1].sy },
    ]
    quad(ctx, haubeVorn[0], haubeVorn[1], kabine.deckel[1], kabine.deckel[0], 'rgba(158,206,244,0.92)')
    // Heckscheibe
    quad(ctx, koerper.deckel[3], koerper.deckel[2], kabine.deckel[2], kabine.deckel[3], 'rgba(120,170,214,0.8)')
    // Seitenfenster
    quad(
      ctx,
      lift(kabine.fuss[1], kabineHoch * 0.86),
      lift(kabine.fuss[2], kabineHoch * 0.86),
      lift(kabine.fuss[2], kabineHoch * 0.2),
      lift(kabine.fuss[1], kabineHoch * 0.2),
      'rgba(92,138,182,0.85)',
    )
    quad(
      ctx,
      lift(kabine.fuss[3], kabineHoch * 0.86),
      lift(kabine.fuss[0], kabineHoch * 0.86),
      lift(kabine.fuss[0], kabineHoch * 0.2),
      lift(kabine.fuss[3], kabineHoch * 0.2),
      'rgba(126,174,216,0.85)',
    )

    if (art === 'taxi') {
      const oben = { sx: (kabine.deckel[0].sx + kabine.deckel[2].sx) / 2, sy: (kabine.deckel[0].sy + kabine.deckel[2].sy) / 2 }
      ctx.fillStyle = '#1c2438'
      roundedPath(ctx, oben.sx - 4.4, oben.sy - 4, 8.8, 3.6, 1.2)
      ctx.fill()
      ctx.fillStyle = '#ffe9a8'
      roundedPath(ctx, oben.sx - 3.6, oben.sy - 3.5, 7.2, 2.4, 0.9)
      ctx.fill()
    }
  }

  // Stoßstangen und Lichter
  const licht = (weite: number, seite: number, farbeLicht: string, r: number) => {
    const punkt = ecke(weite, seite, radHoch + tief * 0.55)
    ctx.fillStyle = farbeLicht
    ctx.beginPath()
    ctx.ellipse(punkt.sx, punkt.sy, r, r * 0.8, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  licht(0.99, 0.62, 'rgba(255,248,206,0.98)', 1.6)
  licht(0.99, -0.62, 'rgba(255,248,206,0.98)', 1.6)
  licht(-0.99, 0.62, 'rgba(255,86,86,0.95)', 1.4)
  licht(-0.99, -0.62, 'rgba(255,86,86,0.95)', 1.4)
  void t
}

/** Eine Figur auf der Straße */
export function drawWalker(ctx: CanvasRenderingContext2D, walker: Walker, t: number): void {
  const at = walkerAt(walker)
  const p = toScreen(at.x, at.y)
  const richtung = toScreen(walker.tx - walker.x, walker.ty - walker.y)
  const blick = richtung.sx >= 0 ? 1 : -1

  if (walker.kind === 'auto') {
    bodenSchatten(ctx, p, 12, 6, 0.26)
    auto(ctx, p, walker, t)
    return
  }

  bodenSchatten(ctx, p, walker.kind === 'rad' ? 6 : 3.6, walker.kind === 'rad' ? 2.6 : 2.2)

  if (walker.kind === 'rad') {
    radfahrer(ctx, p, walker, t, blick)
    return
  }

  const schritt = t * 7.4 + walker.seed * 9
  const huepf = Math.abs(Math.sin(schritt)) * 0.7
  const kind = wobble(walker.seed, 9) > 0.86
  person(ctx, { sx: p.sx, sy: p.sy - huepf }, walker.seed, walker.color, schritt, blick, kind ? 0.72 : 1)
}

/** Jemand, der sich an einem Ort aufhält – steht, wippt, schaut */
export function drawIdler(ctx: CanvasRenderingContext2D, idler: Idler, t: number): void {
  const p = toScreen(idler.x, idler.y)
  const wippe = Math.sin(t * 1.6 + idler.phase) * 0.8
  const blick = Math.sin(idler.phase) >= 0 ? 1 : -1
  bodenSchatten(ctx, p, 3.4, 2, 0.2)
  person(ctx, { sx: p.sx, sy: p.sy - Math.abs(wippe) }, idler.seed, idler.color, wippe * 0.5, blick, 0.92)
}
