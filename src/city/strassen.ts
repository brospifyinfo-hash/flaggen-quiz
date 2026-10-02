// Straßen, Gehwege und alles, was an ihnen steht. Gezeichnet wird in Durchgängen über
// alle Kacheln – erst alle Gehwege, dann alle Bordsteine, dann alle Fahrbahnen, dann
// die Markierungen. Sonst übermalt der Nachbar die Kante, und ein Strich je Kachel
// würde die Bildrate auffressen.
//
// An Kreuzungen stehen Ampeln, entlang der Straßen Laternen; nachts leuchten beide.
import { ampelPhase, arme, istKreuzung, type AmpelFarbe } from './ampeln'
import { tree } from './buildings'
import { roadDef } from './catalog'
import { fade, lift, mix, quadPath, roundedPath, type Point } from './draw'
import { TILE_H, tileNoise, toScreen } from './iso'
import { gelaendeHoehe } from './landschaft'
import { leuchte, lichtJetzt } from './licht'
import { roadAt } from './state'
import type { Theme } from './themes'
import type { CityState } from './types'

type Kachel = { x: number; y: number; art: string }

const GEHWEG = '#b9b5ab'
const GEHWEG_FUGE = 'rgba(70,70,80,0.16)'
const BORD = '#dcd8ce'

/** Punkt auf dem Gelände: Hänge heben ihn an, damit die Straße mit dem Hang fällt */
function heb(city: CityState, x: number, y: number): Point {
  return lift(toScreen(x, y), gelaendeHoehe(city, x, y))
}

/** Mitte, Kanten und Ecken einer Kachel, alle auf der Geländehöhe */
export function gelaendeNetz(city: CityState, x: number, y: number) {
  const p = (px: number, py: number) => heb(city, px, py)
  return {
    m: p(x + 0.5, y + 0.5),
    nw: p(x, y),
    n: p(x + 0.5, y),
    no: p(x + 1, y),
    o: p(x + 1, y + 0.5),
    so: p(x + 1, y + 1),
    s: p(x + 0.5, y + 1),
    sw: p(x, y + 1),
    w: p(x, y + 0.5),
  }
}

/** Acht Dreiecke von der Mitte zu den Kanten, damit die Fläche zum Nachbarn hin abfällt */
export function netzPfad(ctx: CanvasRenderingContext2D, n: ReturnType<typeof gelaendeNetz>): void {
  const keile = [
    [n.m, n.nw, n.n],
    [n.m, n.n, n.no],
    [n.m, n.no, n.o],
    [n.m, n.o, n.so],
    [n.m, n.so, n.s],
    [n.m, n.s, n.sw],
    [n.m, n.sw, n.w],
    [n.m, n.w, n.nw],
  ]
  for (const [a, b, c] of keile) {
    ctx.moveTo(a.sx, a.sy)
    ctx.lineTo(b.sx, b.sy)
    ctx.lineTo(c.sx, c.sy)
    ctx.closePath()
  }
}

/** Ein Rechteck auf dem Boden in Kachelkoordinaten */
function bodenQuad(ctx: CanvasRenderingContext2D, city: CityState, x0: number, y0: number, x1: number, y1: number): void {
  quadPath(ctx, heb(city, x0, y0), heb(city, x1, y0), heb(city, x1, y1), heb(city, x0, y1))
}

/**
 * Gehwege: Straßen liegen in einer Kachel voller Pflaster. Die Fahrbahn wird später
 * darübergelegt, der Rest bleibt Gehweg. Fußwege bekommen keinen.
 */
function gehwege(ctx: CanvasRenderingContext2D, city: CityState, kacheln: Kachel[], fein: boolean): void {
  const licht = lichtJetzt()
  ctx.beginPath()
  for (const k of kacheln) netzPfad(ctx, gelaendeNetz(city, k.x, k.y))
  ctx.fillStyle = GEHWEG
  ctx.fill()
  // Platten: leicht unterschiedliche Helligkeit je Kachelviertel
  if (fein) {
    ctx.beginPath()
    for (const k of kacheln) {
      for (let i = 0; i < 4; i++) {
        if (tileNoise(k.x * 4 + i, k.y * 9 + i * 3) < 0.55) continue
        const qx = k.x + (i % 2) * 0.5
        const qy = k.y + Math.floor(i / 2) * 0.5
        bodenQuad(ctx, city, qx, qy, qx + 0.5, qy + 0.5)
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.07)'
    ctx.fill()
    // Fugen
    ctx.strokeStyle = GEHWEG_FUGE
    ctx.lineWidth = 0.7
    ctx.beginPath()
    for (const k of kacheln) {
      for (const t of [0.25, 0.5, 0.75]) {
        const a = heb(city, k.x + t, k.y)
        const b = heb(city, k.x + t, k.y + 1)
        ctx.moveTo(a.sx, a.sy)
        ctx.lineTo(b.sx, b.sy)
        const c = heb(city, k.x, k.y + t)
        const d = heb(city, k.x + 1, k.y + t)
        ctx.moveTo(c.sx, c.sy)
        ctx.lineTo(d.sx, d.sy)
      }
    }
    ctx.stroke()
  }
  if (licht.helligkeit < 1) {
    ctx.beginPath()
    for (const k of kacheln) netzPfad(ctx, gelaendeNetz(city, k.x, k.y))
    ctx.fillStyle = `rgba(20,26,50,${(1 - licht.helligkeit) * 0.5})`
    ctx.fill()
  }
}

/** Zebrastreifen, Haltelinien, Gullis, Flicken – die Kleinteile der Fahrbahn */
function fahrbahnDetails(ctx: CanvasRenderingContext2D, city: CityState, kacheln: Kachel[]): void {
  const zebra: [number, number, number, number][] = []
  const halte: [number, number, number, number][] = []
  const deckel: Point[] = []
  const flicken: Point[] = []
  const koerner: Point[] = []
  for (const k of kacheln) {
    const def = roadDef(k.art)
    if (!def) continue
    const halb = def.width / 2
    const a = arme(city, k.x, k.y)
    const kreuz = a.zahl >= 3 && def.marking
    const w = tileNoise(k.x * 3 + 1, k.y * 7 + 2)
    const c = heb(city, k.x + 0.5, k.y + 0.5)
    for (let i = 0; i < 4; i++) {
      koerner.push({ sx: c.sx + (tileNoise(k.x + i * 5, k.y + i * 11) - 0.5) * 30, sy: c.sy + (tileNoise(k.y + i * 7, k.x + i * 13) - 0.5) * 14 })
    }
    if (kreuz) {
      // je Arm ein Zebrastreifen quer zur Fahrbahn und eine Haltelinie auf der rechten Spur
      const streifen = 5
      const arm = (dx: number, dy: number) => {
        // Position des Übergangs: 0.36 von der Mitte weg
        const m = 0.36
        for (let i = 0; i < streifen; i++) {
          const q = -halb + (i + 0.5) * ((2 * halb) / streifen)
          const b = (halb / streifen) * 0.55
          if (dx !== 0) zebra.push([k.x + 0.5 + dx * m - 0.05, k.y + 0.5 + q - b, k.x + 0.5 + dx * m + 0.05, k.y + 0.5 + q + b])
          else zebra.push([k.x + 0.5 + q - b, k.y + 0.5 + dy * m - 0.05, k.x + 0.5 + q + b, k.y + 0.5 + dy * m + 0.05])
        }
        // Haltelinie für die ankommende Spur (rechts in Fahrtrichtung zur Kreuzung)
        const h = 0.46
        if (dx !== 0) {
          const spur = dx > 0 ? [0, halb] : [-halb, 0]
          halte.push([k.x + 0.5 + dx * h - 0.02, k.y + 0.5 + spur[0] + 0.02, k.x + 0.5 + dx * h + 0.02, k.y + 0.5 + spur[1] - 0.02])
        } else {
          const spur = dy > 0 ? [-halb, 0] : [0, halb]
          halte.push([k.x + 0.5 + spur[0] + 0.02, k.y + 0.5 + dy * h - 0.02, k.x + 0.5 + spur[1] - 0.02, k.y + 0.5 + dy * h + 0.02])
        }
      }
      if (a.n) arm(0, -1)
      if (a.s) arm(0, 1)
      if (a.o) arm(1, 0)
      if (a.w) arm(-1, 0)
    } else if (w > 0.84) {
      deckel.push({ sx: c.sx + 8, sy: c.sy + halb * TILE_H * 0.4 })
    } else if (w < 0.12) {
      flicken.push({ sx: c.sx - 6, sy: c.sy - 2 })
    }
  }
  const tupfen = (liste: Point[], rx: number, ry: number, farbe: string) => {
    if (liste.length === 0) return
    ctx.beginPath()
    for (const p of liste) {
      ctx.moveTo(p.sx + rx, p.sy)
      ctx.ellipse(p.sx, p.sy, rx, ry, 0, 0, Math.PI * 2)
    }
    ctx.fillStyle = farbe
    ctx.fill()
  }
  tupfen(koerner, 1.5, 0.8, 'rgba(255,255,255,0.05)')
  tupfen(flicken, 6, 3.2, 'rgba(0,0,0,0.14)')
  if (zebra.length) {
    ctx.beginPath()
    for (const [x0, y0, x1, y1] of zebra) bodenQuad(ctx, city, x0, y0, x1, y1)
    ctx.fillStyle = 'rgba(244,247,255,0.82)'
    ctx.fill()
  }
  if (halte.length) {
    ctx.beginPath()
    for (const [x0, y0, x1, y1] of halte) bodenQuad(ctx, city, x0, y0, x1, y1)
    ctx.fillStyle = 'rgba(244,247,255,0.8)'
    ctx.fill()
  }
  tupfen(deckel, 3.4, 1.9, 'rgba(28,34,50,0.85)')
  if (deckel.length) {
    ctx.strokeStyle = 'rgba(150,160,180,0.45)'
    ctx.lineWidth = 0.7
    ctx.beginPath()
    for (const p of deckel) {
      ctx.moveTo(p.sx + 2.2, p.sy)
      ctx.ellipse(p.sx, p.sy, 2.2, 1.2, 0, 0, Math.PI * 2)
    }
    ctx.stroke()
  }
}

// ---------------------------------------------------------------------------
// Laternen und Ampeln
// ---------------------------------------------------------------------------

const LATERNE_HOCH = 27

/** Eine Straßenlaterne: Mast, Ausleger, Kopf – und nachts der Lichtkegel */
export function laterne(ctx: CanvasRenderingContext2D, p: Point, nachRechts: number, fein: boolean): void {
  const licht = lichtJetzt()
  // Fuß
  ctx.fillStyle = '#4a505c'
  ctx.beginPath()
  ctx.ellipse(p.sx, p.sy, 3, 1.4, 0, 0, Math.PI * 2)
  ctx.fill()
  // Mast
  ctx.strokeStyle = '#5c6472'
  ctx.lineWidth = 1.8
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(p.sx, p.sy)
  ctx.lineTo(p.sx, p.sy - LATERNE_HOCH)
  ctx.quadraticCurveTo(p.sx, p.sy - LATERNE_HOCH - 5, p.sx + nachRechts * 6, p.sy - LATERNE_HOCH - 5)
  ctx.stroke()
  if (fein) {
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 0.6
    ctx.beginPath()
    ctx.moveTo(p.sx - 0.5, p.sy - 2)
    ctx.lineTo(p.sx - 0.5, p.sy - LATERNE_HOCH + 1)
    ctx.stroke()
  }
  // Kopf
  const kopf = { sx: p.sx + nachRechts * 6, sy: p.sy - LATERNE_HOCH - 5 }
  ctx.fillStyle = '#39404c'
  ctx.beginPath()
  ctx.moveTo(kopf.sx - 4.5, kopf.sy)
  ctx.lineTo(kopf.sx + 4.5, kopf.sy)
  ctx.lineTo(kopf.sx + 3, kopf.sy + 2.6)
  ctx.lineTo(kopf.sx - 3, kopf.sy + 2.6)
  ctx.closePath()
  ctx.fill()
  const an = licht.lampen
  ctx.fillStyle = an > 0.2 ? `rgba(255,236,170,${0.5 + an * 0.5})` : '#c9d0dc'
  ctx.fillRect(kopf.sx - 2.6, kopf.sy + 2.2, 5.2, 1.6)
  if (an > 0.05) {
    const staerke = an
    leuchte((c) => {
      // Lichtkegel auf dem Boden und Hof um die Lampe
      const pool = c.createRadialGradient(kopf.sx, p.sy + 1, 1, kopf.sx, p.sy + 1, 26)
      pool.addColorStop(0, `rgba(255,224,150,${0.34 * staerke})`)
      pool.addColorStop(1, 'rgba(255,224,150,0)')
      c.fillStyle = pool
      c.beginPath()
      c.ellipse(kopf.sx, p.sy + 1, 26, 12, 0, 0, Math.PI * 2)
      c.fill()
      const hof = c.createRadialGradient(kopf.sx, kopf.sy + 3, 0.5, kopf.sx, kopf.sy + 3, 10)
      hof.addColorStop(0, `rgba(255,240,190,${0.7 * staerke})`)
      hof.addColorStop(1, 'rgba(255,240,190,0)')
      c.fillStyle = hof
      c.beginPath()
      c.arc(kopf.sx, kopf.sy + 3, 10, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = `rgba(255,246,210,${0.9 * staerke})`
      c.fillRect(kopf.sx - 2.6, kopf.sy + 2.2, 5.2, 1.6)
    })
  }
}

const AMPEL_FARBEN: Record<AmpelFarbe, string> = { rot: '#ff3b3b', gelb: '#ffc21a', gruen: '#3ddc6a' }

/** Eine Ampel am Mast mit drei Lampen; `farbe` leuchtet */
function ampel(ctx: CanvasRenderingContext2D, p: Point, farbe: AmpelFarbe, nachRechts: number, fein: boolean): void {
  const hoch = 20
  ctx.fillStyle = '#4a505c'
  ctx.beginPath()
  ctx.ellipse(p.sx, p.sy, 2.4, 1.2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#5c6472'
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(p.sx, p.sy)
  ctx.lineTo(p.sx, p.sy - hoch)
  ctx.stroke()
  // Gehäuse
  const gx = p.sx + nachRechts * 1.5
  const gy = p.sy - hoch - 11
  ctx.fillStyle = '#1e222b'
  roundedPath(ctx, gx - 3, gy, 6, 12.5, 1.6)
  ctx.fill()
  if (fein) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillRect(gx - 2.4, gy + 0.6, 1, 11)
  }
  const lampen: AmpelFarbe[] = ['rot', 'gelb', 'gruen']
  lampen.forEach((f, i) => {
    const ly = gy + 2.4 + i * 4
    const an = f === farbe
    ctx.fillStyle = an ? AMPEL_FARBEN[f] : fade(AMPEL_FARBEN[f], 0.22)
    ctx.beginPath()
    ctx.arc(gx, ly, 1.4, 0, Math.PI * 2)
    ctx.fill()
    if (an) {
      const glow = AMPEL_FARBEN[f]
      leuchte((c) => {
        const g = c.createRadialGradient(gx, ly, 0.3, gx, ly, 5)
        g.addColorStop(0, fade(glow, 0.7))
        g.addColorStop(1, fade(glow, 0))
        c.fillStyle = g
        c.beginPath()
        c.arc(gx, ly, 5, 0, Math.PI * 2)
        c.fill()
        c.fillStyle = glow
        c.beginPath()
        c.arc(gx, ly, 1.4, 0, Math.PI * 2)
        c.fill()
      })
    }
  })
}

/** Etwas, das an der Straße steht und in die Malreihenfolge der Stadt eingereiht wird */
export interface Moebel {
  x: number
  y: number
  malen: (ctx: CanvasRenderingContext2D) => void
}

/** Ampeln an allen Kreuzungen: je Arm ein Mast rechts vor der Kreuzung, mit der Farbe seiner Richtung */
function ampeln(city: CityState, kacheln: Kachel[], uhr: number, fein: boolean, ziel: Moebel[]): void {
  for (const k of kacheln) {
    if (!istKreuzung(city, k.x, k.y)) continue
    const a = arme(city, k.x, k.y)
    const phase = ampelPhase(k.x, k.y, uhr)
    const def = roadDef(k.art)
    const halb = (def?.width ?? 0.6) / 2 + 0.08
    // Mast steht rechts der ankommenden Spur, kurz vor der Kreuzung
    const platz = (px: number, py: number, farbe: AmpelFarbe) => {
      const x = k.x + px
      const y = k.y + py
      const p = heb(city, x, y)
      const mitte = heb(city, k.x + 0.5, k.y + 0.5)
      const rechts = p.sx >= mitte.sx ? -1 : 1
      ziel.push({ x, y, malen: (ctx) => ampel(ctx, p, farbe, rechts, fein) })
    }
    if (a.w) platz(0.5 - halb - 0.06, 0.5 + halb, phase.ow) // kommt von Westen, fährt +x, rechts = +y
    if (a.o) platz(0.5 + halb + 0.06, 0.5 - halb, phase.ow) // kommt von Osten, fährt -x, rechts = -y
    if (a.n) platz(0.5 - halb, 0.5 - halb - 0.06, phase.ns) // kommt von Norden, fährt +y, rechts = -x
    if (a.s) platz(0.5 + halb, 0.5 + halb + 0.06, phase.ns) // kommt von Süden, fährt -y, rechts = +x
  }
}

/**
 * Laternen entlang gerader Straßenstücke, abwechselnd links und rechts, alle zwei
 * Kacheln. An Kreuzungen stehen Ampeln, dort bleibt die Laterne weg.
 */
function laternen(city: CityState, kacheln: Kachel[], fein: boolean, ziel: Moebel[]): void {
  for (const k of kacheln) {
    if ((k.x + k.y) % 2 !== 0) continue
    const a = arme(city, k.x, k.y)
    if (a.zahl >= 3) continue
    const def = roadDef(k.art)
    const halb = (def?.width ?? 0.6) / 2 + 0.1
    const waagrecht = a.o || a.w
    const senkrecht = a.n || a.s
    let px: number
    let py: number
    if (waagrecht && !senkrecht) {
      px = 0.5
      py = (k.x % 4 === 0 ? 0.5 - halb : 0.5 + halb)
    } else if (senkrecht && !waagrecht) {
      px = (k.y % 4 === 0 ? 0.5 - halb : 0.5 + halb)
      py = 0.5
    } else {
      // Kurve: Laterne an der Außenecke
      px = a.o ? 0.5 - halb : 0.5 + halb
      py = a.s ? 0.5 - halb : 0.5 + halb
    }
    // Nicht auf einen Nachbarn mit Straße stellen
    const nx = Math.floor(k.x + (px - 0.5) * 1.6 + 0.5)
    const ny = Math.floor(k.y + (py - 0.5) * 1.6 + 0.5)
    if ((nx !== k.x || ny !== k.y) && roadAt(city, nx, ny)) continue
    const x = k.x + px
    const y = k.y + py
    const p = heb(city, x, y)
    const mitte = heb(city, k.x + 0.5, k.y + 0.5)
    const rechts = p.sx >= mitte.sx ? -1 : 1
    ziel.push({ x, y, malen: (ctx) => laterne(ctx, p, rechts, fein) })
  }
}

// ---------------------------------------------------------------------------
// Alles zusammen
// ---------------------------------------------------------------------------

/** Straßen und Gehwege – ohne Masten, die kommen mit `strassenMoebel` nach dem Boden */
export function drawRoads(ctx: CanvasRenderingContext2D, city: CityState, theme: Theme, fein: boolean): void {
  const kacheln: Kachel[] = Object.entries(city.roads).map(([key, art]) => {
    const [x, y] = key.split(':').map(Number)
    return { x, y, art }
  })
  if (kacheln.length === 0) return
  const licht = lichtJetzt()

  const enden = (x: number, y: number) => {
    const list: Point[] = []
    if (roadAt(city, x, y - 1)) list.push(heb(city, x + 0.5, y))
    if (roadAt(city, x + 1, y)) list.push(heb(city, x + 1, y + 0.5))
    if (roadAt(city, x, y + 1)) list.push(heb(city, x + 0.5, y + 1))
    if (roadAt(city, x - 1, y)) list.push(heb(city, x, y + 0.5))
    return list
  }

  // Gehwege unter allen Straßen (nicht unter Fußwegen)
  gehwege(ctx, city, kacheln.filter((k) => k.art !== 'weg'), fein)

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const arten = [...new Set(kacheln.map((k) => k.art))]
  // Durchgänge: 0 Bordstein, 1 Fahrbahn, 2 Mittelstreifen
  for (const pass of [0, 1, 2]) {
    for (const art of arten) {
      const def = roadDef(art)
      if (!def) continue
      if (pass === 2 && !def.marking) continue
      const bord = art === 'weg' ? def.edge : BORD
      ctx.strokeStyle = pass === 0 ? bord : pass === 1 ? def.surface : (def.marking as string)
      ctx.lineWidth = def.width * TILE_H * (pass === 0 ? 1.3 : pass === 1 ? 1 : 0.12)
      ctx.setLineDash(pass === 2 ? [6, 8] : [])
      ctx.beginPath()
      for (const k of kacheln) {
        if (k.art !== art) continue
        const center = heb(city, k.x + 0.5, k.y + 0.5)
        const ziele = enden(k.x, k.y)
        if (ziele.length === 0) {
          ctx.moveTo(center.sx - 7, center.sy)
          ctx.lineTo(center.sx + 7, center.sy)
          continue
        }
        // Markierung nur auf gerader Strecke, nicht in der Kreuzung
        const striche = pass === 2 && ziele.length !== 2 ? [] : ziele
        for (const ziel of striche) {
          const kurz = pass === 2 ? mix(center, ziel, 0.86) : ziel
          ctx.moveTo(center.sx, center.sy)
          ctx.lineTo(kurz.sx, kurz.sy)
        }
      }
      ctx.stroke()
    }
  }
  ctx.setLineDash([])
  ctx.restore()

  if (fein) fahrbahnDetails(ctx, city, kacheln)

  // Nachts liegt die Fahrbahn im Dunkeln – die Gehwege sind schon getönt
  if (licht.helligkeit < 1) {
    ctx.save()
    ctx.lineCap = 'round'
    ctx.strokeStyle = `rgba(16,20,40,${(1 - licht.helligkeit) * 0.45})`
    ctx.beginPath()
    for (const k of kacheln) {
      const def = roadDef(k.art)
      if (!def) continue
      ctx.lineWidth = def.width * TILE_H * 1.3
      const center = heb(city, k.x + 0.5, k.y + 0.5)
      for (const ziel of enden(k.x, k.y)) {
        ctx.moveTo(center.sx, center.sy)
        ctx.lineTo(ziel.sx, ziel.sy)
      }
    }
    ctx.stroke()
    ctx.restore()
  }

  // Alleen bekommen Bäume auf den Schultern
  for (const k of kacheln) {
    const def = roadDef(k.art)
    if (!def?.trees) continue
    const frei = [
      { da: roadAt(city, k.x, k.y - 1), at: [k.x + 0.5, k.y + 0.12] },
      { da: roadAt(city, k.x, k.y + 1), at: [k.x + 0.5, k.y + 0.88] },
    ]
    for (const seite of frei) {
      if (seite.da) continue
      tree(ctx, seite.at[0] - 0.5, seite.at[1] - 0.5, { kind: 'baum', height: 0.5, wall: theme.tree[0], roof: theme.tree[2], accent: theme.tree[1] }, 0.25, fein)
    }
  }
}

/**
 * Laternen und Ampeln mit ihrem Standort – der Zeichner reiht sie nach Tiefe zwischen
 * die Häuser ein, damit ein Mast vor einem Haus auch davor bleibt.
 */
export function strassenMoebel(city: CityState, uhr: number, fein: boolean): Moebel[] {
  const kacheln: Kachel[] = []
  for (const [key, art] of Object.entries(city.roads)) {
    if (art === 'weg') continue
    const [x, y] = key.split(':').map(Number)
    kacheln.push({ x, y, art })
  }
  const liste: Moebel[] = []
  if (kacheln.length === 0) return liste
  laternen(city, kacheln, fein, liste)
  ampeln(city, kacheln, uhr, fein, liste)
  return liste
}

/** Höhe einer Laterne – für Trefferflächen und Reihenfolge */
export const LATERNE_HOEHE = LATERNE_HOCH + 8
export { lift }
