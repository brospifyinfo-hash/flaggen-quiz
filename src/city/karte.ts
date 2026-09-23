// Die Stadt von oben: eine klare Karte statt der Schrägsicht. Straßen als Bänder,
// Häuser als Dachflächen in ihrer Dachform, Menschen und Wagen als Punkte und Striche.
// Gezeichnet wird in Kachelkoordinaten unter einer Drehung – dieselbe Kamera und
// derselbe Blickwinkel wie in der Schrägsicht, ein Tipper trifft dieselbe Kachel.
import { buildingDef, footprint, roadDef, type BuildingDef, RATHAUS } from './catalog'
import { fade, shade, wobble } from './draw'
import { BAUARTEN } from './figures'
import { blickJetzt, OBEN_KACHEL, setBlick, setProjektion, toScreen, toTile } from './iso'
import { lichtFuer } from './licht'
import type { Agent } from './life'
import { krimFarbe, type Camera, type DrawOptions } from './render'
import { kriminalitaetsfeld } from './society'
import { tilesOf } from './state'
import { themeById } from './themes'
import type { CityState, Placed } from './types'

const K = OBEN_KACHEL

/** Formen, die keinen Baukörper haben – sie liegen flach auf dem Boden */
const FLACH = new Set(['park', 'wasser', 'flach', 'bank', 'blumen', 'hecke', 'felsen', 'laterne', 'fahne'])

const rgb = (k: [number, number, number], a = 1) => `rgba(${Math.round(k[0])},${Math.round(k[1])},${Math.round(k[2])},${a})`

/** Rechteck in Kacheln füllen */
function rechteck(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, farbe: string): void {
  ctx.fillStyle = farbe
  ctx.fillRect(x, y, w, h)
}

/** Rechteck mit runden Ecken in Kacheln */
function rundPfad(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function boden(ctx: CanvasRenderingContext2D, city: CityState, buildMode: boolean): void {
  const theme = themeById(city.theme)
  const n = city.land
  // Umland: gedämpfte Erde, damit das Gebiet klar begrenzt ist
  rechteck(ctx, -40, -40, n + 80, n + 80, shade(theme.soil[1], -10))
  rechteck(ctx, 0, 0, n, n, theme.ground[0])
  // Wiese leicht gefleckt
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = wobble(x * 7 + 3, y * 13 + 5)
      if (t > 0.55) rechteck(ctx, x, y, 1, 1, fade(theme.ground[1], 0.18 + (t - 0.55) * 0.5))
    }
  }
  if (buildMode) {
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 1 / K
    ctx.beginPath()
    for (let i = 0; i <= n; i++) {
      ctx.moveTo(i, 0)
      ctx.lineTo(i, n)
      ctx.moveTo(0, i)
      ctx.lineTo(n, i)
    }
    ctx.stroke()
  }
  ctx.strokeStyle = theme.edge
  ctx.lineWidth = 3 / K
  ctx.strokeRect(0, 0, n, n)
}

function strassen(ctx: CanvasRenderingContext2D, city: CityState, nacht: number): void {
  const eintraege = Object.entries(city.roads)
  if (eintraege.length === 0) return
  const kacheln = new Map<string, string>(eintraege)
  const hat = (x: number, y: number) => kacheln.has(`${x}:${y}`)
  // Erst Ränder, dann Fläche, dann Markierungen – je in einer Farbe über alle Kacheln
  for (const schicht of ['rand', 'flaeche', 'markierung'] as const) {
    for (const [key, typ] of eintraege) {
      const def = roadDef(typ)
      if (!def) continue
      const [x, y] = key.split(':').map(Number)
      const breite = def.width
      const halb = breite / 2
      const cx = x + 0.5
      const cy = y + 0.5
      const nachbarn: [number, number][] = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].filter(([dx, dy]) => hat(x + dx, y + dy)) as [number, number][]
      const alleine = nachbarn.length === 0
      if (schicht === 'rand' || schicht === 'flaeche') {
        const zugabe = schicht === 'rand' ? 0.07 : 0
        ctx.fillStyle = schicht === 'rand' ? def.edge : def.surface
        ctx.beginPath()
        ctx.rect(cx - halb - zugabe, cy - halb - zugabe, breite + zugabe * 2, breite + zugabe * 2)
        for (const [dx, dy] of nachbarn) {
          // Bis zur Kachelgrenze zum Nachbarn – der Nachbar zeichnet seine Hälfte selbst
          if (dx !== 0) ctx.rect(dx > 0 ? cx : x, cy - halb - zugabe, 0.5, breite + zugabe * 2)
          else ctx.rect(cx - halb - zugabe, dy > 0 ? cy : y, breite + zugabe * 2, 0.5)
        }
        if (alleine) {
          ctx.rect(cx - halb - zugabe, cy - halb - zugabe, breite + zugabe * 2, breite + zugabe * 2)
        }
        ctx.fill()
        continue
      }
      if (!def.marking) continue
      // Mittelstreifen gestrichelt in jede Richtung, an Kreuzungen frei
      ctx.strokeStyle = fade(def.marking, 0.75)
      ctx.lineWidth = 0.05
      ctx.setLineDash([0.16, 0.14])
      ctx.beginPath()
      const gerade = nachbarn.length === 2 && ((nachbarn[0][0] !== 0 && nachbarn[1][0] !== 0) || (nachbarn[0][1] !== 0 && nachbarn[1][1] !== 0))
      if (gerade) {
        const quer = nachbarn[0][0] !== 0
        if (quer) {
          ctx.moveTo(x, cy)
          ctx.lineTo(x + 1, cy)
        } else {
          ctx.moveTo(cx, y)
          ctx.lineTo(cx, y + 1)
        }
      } else {
        for (const [dx, dy] of nachbarn) {
          ctx.moveTo(cx + dx * halb, cy + dy * halb)
          ctx.lineTo(cx + dx * 0.5, cy + dy * 0.5)
        }
      }
      ctx.stroke()
      ctx.setLineDash([])
      // Zebrastreifen an Kreuzungen
      if (nachbarn.length >= 3) {
        ctx.fillStyle = 'rgba(240,240,235,0.85)'
        for (const [dx, dy] of nachbarn) {
          for (let i = -2; i <= 2; i++) {
            const s = i * 0.11
            const ax = cx + dx * (halb + 0.02) + (dx === 0 ? s : 0)
            const ay = cy + dy * (halb + 0.02) + (dy === 0 ? s : 0)
            if (dx !== 0) ctx.fillRect(Math.min(ax, ax + dx * 0.09), ay - 0.035, 0.09, 0.07)
            else ctx.fillRect(ax - 0.035, Math.min(ay, ay + dy * 0.09), 0.07, 0.09)
          }
        }
      }
      if (nacht > 0.1 && def.id !== 'weg' && wobble(x * 3, y * 5) > 0.5) {
        // Laternenlicht als weicher Fleck
        const g = ctx.createRadialGradient(cx + halb + 0.1, cy - halb - 0.1, 0.02, cx + halb + 0.1, cy - halb - 0.1, 0.55)
        g.addColorStop(0, `rgba(255,214,140,${0.55 * nacht})`)
        g.addColorStop(1, 'rgba(255,214,140,0)')
        ctx.fillStyle = g
        ctx.fillRect(cx + halb - 0.5, cy - halb - 0.7, 1.2, 1.2)
      }
    }
  }
}

function baum(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, krone: string, licht: string, samen: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.beginPath()
  ctx.arc(x + 0.05, y + 0.06, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = krone
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = licht
  ctx.beginPath()
  ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.5 + wobble(samen, 3) * r * 0.1, 0, Math.PI * 2)
  ctx.fill()
}

function dachForm(ctx: CanvasRenderingContext2D, def: BuildingDef, x: number, y: number, w: number, h: number, dach: string, wand: string): void {
  const form = def.look.stil?.dach ?? (def.look.kind === 'laden' || def.look.kind === 'block' ? 'flach' : 'sattel')
  const hell = shade(dach, 22)
  const dunkel = shade(dach, -18)
  const laengsX = w >= h
  if (form === 'flach' || form === 'mansard' || form === 'saege') {
    rechteck(ctx, x, y, w, h, dach)
    const m = Math.min(0.12, Math.min(w, h) * 0.18)
    rechteck(ctx, x + m, y + m, w - 2 * m, h - 2 * m, form === 'flach' ? shade(dach, -8) : hell)
    if (form === 'saege') {
      ctx.fillStyle = fade('#9fc4dc', 0.9)
      const zaehne = Math.max(2, Math.round((laengsX ? w : h) * 1.6))
      for (let i = 0; i < zaehne; i++) {
        if (laengsX) ctx.fillRect(x + m + ((w - 2 * m) * (i + 0.72)) / zaehne, y + m, (w - 2 * m) / zaehne / 4, h - 2 * m)
        else ctx.fillRect(x + m, y + m + ((h - 2 * m) * (i + 0.72)) / zaehne, w - 2 * m, (h - 2 * m) / zaehne / 4)
      }
    }
    return
  }
  if (form === 'pult') {
    const g = laengsX ? ctx.createLinearGradient(x, y, x, y + h) : ctx.createLinearGradient(x, y, x + w, y)
    g.addColorStop(0, hell)
    g.addColorStop(1, dunkel)
    ctx.fillStyle = g
    ctx.fillRect(x, y, w, h)
    return
  }
  // Sattel, Walm, Zelt: zwei Hälften, First entlang der langen Seite
  if (laengsX) {
    rechteck(ctx, x, y, w, h / 2, hell)
    rechteck(ctx, x, y + h / 2, w, h / 2, dunkel)
  } else {
    rechteck(ctx, x, y, w / 2, h, hell)
    rechteck(ctx, x + w / 2, y, w / 2, h, dunkel)
  }
  ctx.strokeStyle = fade('#ffffff', 0.5)
  ctx.lineWidth = 0.04
  ctx.beginPath()
  if (form === 'zelt') {
    ctx.moveTo(x, y)
    ctx.lineTo(x + w, y + h)
    ctx.moveTo(x + w, y)
    ctx.lineTo(x, y + h)
  } else {
    const ein = form === 'walm' ? Math.min(w, h) / 2 : 0
    if (laengsX) {
      ctx.moveTo(x + ein, y + h / 2)
      ctx.lineTo(x + w - ein, y + h / 2)
      if (ein > 0) {
        ctx.moveTo(x, y)
        ctx.lineTo(x + ein, y + h / 2)
        ctx.lineTo(x, y + h)
        ctx.moveTo(x + w, y)
        ctx.lineTo(x + w - ein, y + h / 2)
        ctx.lineTo(x + w, y + h)
      }
    } else {
      ctx.moveTo(x + w / 2, y + ein)
      ctx.lineTo(x + w / 2, y + h - ein)
      if (ein > 0) {
        ctx.moveTo(x, y)
        ctx.lineTo(x + w / 2, y + ein)
        ctx.lineTo(x + w, y)
        ctx.moveTo(x, y + h)
        ctx.lineTo(x + w / 2, y + h - ein)
        ctx.lineTo(x + w, y + h)
      }
    }
  }
  ctx.stroke()
  void wand
}

function gebaeude(ctx: CanvasRenderingContext2D, city: CityState, placed: Placed, zeit: number, nacht: number): void {
  const def = buildingDef(placed.type)
  if (!def) return
  const [w, h] = footprint(def, placed.rot)
  const theme = themeById(city.theme)
  const look = def.look
  const samen = placed.id.length * 31 + placed.x * 7 + placed.y * 13
  const x = placed.x
  const y = placed.y

  if (look.kind === 'baum') {
    baum(ctx, x + w / 2, y + h / 2, 0.3 + (placed.level - 1) * 0.04, theme.tree[1], theme.tree[2], samen)
    return
  }
  if (look.kind === 'park') {
    rechteck(ctx, x + 0.04, y + 0.04, w - 0.08, h - 0.08, shade(theme.ground[1], 8))
    ctx.strokeStyle = fade('#e9dcc0', 0.9)
    ctx.lineWidth = 0.08
    ctx.beginPath()
    ctx.moveTo(x + 0.2, y + h / 2)
    ctx.quadraticCurveTo(x + w / 2, y + 0.2, x + w - 0.2, y + h / 2)
    ctx.stroke()
    for (let i = 0; i < 4 + placed.level; i++) {
      baum(ctx, x + 0.25 + wobble(samen, i) * (w - 0.5), y + 0.25 + wobble(samen, i + 20) * (h - 0.5), 0.14 + wobble(samen, i + 40) * 0.08, theme.tree[1], theme.tree[2], samen + i)
    }
    return
  }
  if (look.kind === 'wasser') {
    rundPfad(ctx, x + 0.06, y + 0.06, w - 0.12, h - 0.12, 0.3)
    ctx.fillStyle = look.roof
    ctx.fill()
    ctx.strokeStyle = fade('#ffffff', 0.45)
    ctx.lineWidth = 0.04
    ctx.beginPath()
    for (let i = 0; i < 3; i++) {
      const yy = y + 0.3 + i * ((h - 0.6) / 2) + Math.sin(zeit * 1.2 + i) * 0.04
      ctx.moveTo(x + 0.3, yy)
      ctx.quadraticCurveTo(x + w / 2, yy - 0.08, x + w - 0.3, yy)
    }
    ctx.stroke()
    return
  }
  if (look.kind === 'brunnen') {
    ctx.fillStyle = look.wall
    ctx.beginPath()
    ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.42, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = look.roof
    ctx.beginPath()
    ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.32, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = fade('#ffffff', 0.7)
    ctx.beginPath()
    ctx.arc(x + w / 2, y + h / 2, 0.06 + Math.abs(Math.sin(zeit * 2)) * 0.04, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  if (FLACH.has(look.kind)) {
    // Kleinzeug: Bank, Laterne, Blumen, Hecke, Felsen, Fahne
    const groesse = look.kind === 'laterne' ? 0.12 : look.kind === 'bank' ? 0.3 : 0.5
    rundPfad(ctx, x + w / 2 - groesse / 2, y + h / 2 - groesse / 2, groesse, groesse, 0.1)
    ctx.fillStyle = look.kind === 'blumen' ? '#e85d8a' : look.kind === 'hecke' ? theme.tree[1] : look.roof
    ctx.fill()
    if (look.kind === 'laterne' && nacht > 0.1) {
      const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 0.02, x + w / 2, y + h / 2, 0.6)
      g.addColorStop(0, `rgba(255,214,140,${0.6 * nacht})`)
      g.addColorStop(1, 'rgba(255,214,140,0)')
      ctx.fillStyle = g
      ctx.fillRect(x + w / 2 - 0.6, y + h / 2 - 0.6, 1.2, 1.2)
    }
    return
  }

  // Baukörper: etwas eingerückt, mit weichem Schatten nach Südosten
  const ein = look.kind === 'bau' ? 0.08 : 0.1
  const bx = x + ein
  const by = y + ein
  const bw = w - 2 * ein
  const bh = h - 2 * ein
  const hoch = Math.min(0.22, 0.05 + look.height * 0.04 + (placed.level - 1) * 0.02)
  ctx.fillStyle = 'rgba(10,16,30,0.28)'
  ctx.fillRect(bx + hoch, by + hoch, bw, bh)

  const verlassen = !!placed.verlassen
  const dach = verlassen ? '#7d7a76' : look.roof
  const wand = verlassen ? '#8c8983' : look.wall
  if (look.kind === 'kuppel' || look.kind === 'statue') {
    rechteck(ctx, bx, by, bw, bh, wand)
    ctx.fillStyle = dach
    ctx.beginPath()
    ctx.arc(bx + bw / 2, by + bh / 2, Math.min(bw, bh) * 0.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = fade('#ffffff', 0.35)
    ctx.beginPath()
    ctx.arc(bx + bw / 2 - bw * 0.1, by + bh / 2 - bh * 0.1, Math.min(bw, bh) * 0.16, 0, Math.PI * 2)
    ctx.fill()
  } else {
    dachForm(ctx, def, bx, by, bw, bh, dach, wand)
  }
  // Wandkante ringsum
  ctx.strokeStyle = shade(wand, -30)
  ctx.lineWidth = 0.035
  ctx.strokeRect(bx, by, bw, bh)

  if (verlassen) {
    ctx.strokeStyle = 'rgba(40,36,34,0.7)'
    ctx.lineWidth = 0.05
    ctx.beginPath()
    ctx.moveTo(bx + bw * 0.2, by + bh * 0.25)
    ctx.lineTo(bx + bw * 0.8, by + bh * 0.75)
    ctx.moveTo(bx + bw * 0.8, by + bh * 0.25)
    ctx.lineTo(bx + bw * 0.2, by + bh * 0.75)
    ctx.stroke()
  } else if (nacht > 0.1 && (look.floors ?? 0) > 0) {
    // Ein wenig warmes Licht, das aus den Fenstern auf den Boden fällt
    ctx.fillStyle = `rgba(255,200,120,${0.18 * nacht})`
    ctx.fillRect(bx - 0.08, by + bh, bw + 0.16, 0.08)
    ctx.fillRect(bx + bw, by - 0.08, 0.08, bh + 0.16)
  }
  // Stufen als kleine Punkte am Rand
  if (placed.level > 1) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    for (let i = 0; i < placed.level - 1 && i < 4; i++) {
      ctx.beginPath()
      ctx.arc(bx + 0.14 + i * 0.16, by + bh - 0.14, 0.05, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function figuren(ctx: CanvasRenderingContext2D, agents: Agent[], nacht: number): void {
  for (const a of agents) {
    if (a.zustand === 'drinnen') continue
    if (a.art === 'auto' || a.art === 'dienst') {
      const bau = BAUARTEN[a.modell ?? 'kompakt']
      const lang = (bau?.lang ?? 20) / 45
      const breit = (bau?.breit ?? 10) / 45
      ctx.save()
      ctx.translate(a.x, a.y)
      ctx.rotate(Math.atan2(a.ry, a.rx))
      ctx.fillStyle = 'rgba(10,16,30,0.3)'
      ctx.fillRect(-lang / 2 + 0.03, -breit / 2 + 0.03, lang, breit)
      rundPfad(ctx, -lang / 2, -breit / 2, lang, breit, 0.06)
      ctx.fillStyle = a.farbe
      ctx.fill()
      // Dach/Scheiben
      ctx.fillStyle = 'rgba(20,30,50,0.55)'
      ctx.fillRect(-lang * 0.18, -breit * 0.36, lang * 0.42, breit * 0.72)
      if (a.licht) {
        ctx.fillStyle = Math.floor(performance.now() / 180) % 2 ? '#3f9ee0' : '#ff3b30'
        ctx.fillRect(-0.03, -0.05, 0.06, 0.1)
      }
      if (nacht > 0.1) {
        ctx.fillStyle = `rgba(255,240,200,${0.9 * nacht})`
        ctx.fillRect(lang / 2 - 0.03, -breit / 2 + 0.02, 0.03, 0.06)
        ctx.fillRect(lang / 2 - 0.03, breit / 2 - 0.08, 0.03, 0.06)
        ctx.fillStyle = `rgba(255,60,60,${0.9 * nacht * (a.haelt ? 1 : 0.6)})`
        ctx.fillRect(-lang / 2, -breit / 2 + 0.02, 0.03, 0.06)
        ctx.fillRect(-lang / 2, breit / 2 - 0.08, 0.03, 0.06)
      }
      ctx.restore()
      continue
    }
    const farbe = a.art === 'rad' ? '#2e86c1' : ['#e74c3c', '#f39c12', '#27ae60', '#8e44ad', '#16a085', '#d35400'][Math.floor(wobble(a.seed, 1) * 6)]
    ctx.fillStyle = 'rgba(10,16,30,0.3)'
    ctx.beginPath()
    ctx.arc(a.x + 0.02, a.y + 0.02, 0.075, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = farbe
    ctx.beginPath()
    ctx.arc(a.x, a.y, 0.075, 0, Math.PI * 2)
    ctx.fill()
    if (a.art === 'rad') {
      ctx.strokeStyle = '#1c1c1c'
      ctx.lineWidth = 0.03
      ctx.beginPath()
      ctx.moveTo(a.x - a.rx * 0.12, a.y - a.ry * 0.12)
      ctx.lineTo(a.x + a.rx * 0.12, a.y + a.ry * 0.12)
      ctx.stroke()
    }
  }
}

function marke(ctx: CanvasRenderingContext2D, x: number, y: number, farbe: string, zeit: number, puls = false): void {
  const r = 0.14 + (puls ? Math.abs(Math.sin(zeit * 3)) * 0.03 : 0)
  ctx.fillStyle = 'rgba(10,16,30,0.35)'
  ctx.beginPath()
  ctx.arc(x + 0.02, y + 0.03, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = farbe
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 0.03
  ctx.stroke()
}

/** Die Stadt von oben malen. Kamera, Blick und Größe wie bei drawCity. */
export function drawKarte(
  ctx: CanvasRenderingContext2D,
  city: CityState,
  camera: Camera,
  view: { w: number; h: number },
  options: DrawOptions = {},
): void {
  setProjektion('oben')
  setBlick(options.blick ?? 0, city.land)
  const licht = lichtFuer(options.stunde ?? 9)
  const zeit = options.time ?? 0
  const nacht = licht.nacht
  const grund = ctx.getTransform()
  try {
    ctx.fillStyle = shade(themeById(city.theme).soil[1], -10)
    ctx.fillRect(0, 0, view.w, view.h)

    ctx.save()
    ctx.translate(view.w / 2, view.h / 2)
    ctx.scale(camera.zoom, camera.zoom)
    ctx.translate(-camera.x, -camera.y)
    // Ab hier in Kacheln: Drehung um die Feldmitte, dann eine Kachel = K Bildpunkte
    ctx.rotate(blickJetzt())
    ctx.scale(K, K)
    ctx.translate(-city.land / 2, -city.land / 2)

    boden(ctx, city, options.buildMode === true)
    strassen(ctx, city, nacht)

    const paint = options.paint
    if (paint && paint.tiles.length > 0) {
      const def = roadDef(paint.type)
      ctx.fillStyle = fade(paint.adding ? (def?.surface ?? '#ffffff') : '#ff5f7a', 0.6)
      for (const key of paint.tiles) {
        const [x, y] = key.split(':').map(Number)
        ctx.fillRect(x, y, 1, 1)
      }
    }

    if (options.kriminalitaet) {
      const feld = kriminalitaetsfeld(city)
      const n = city.land
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const wert = feld[y * n + x]
          if (wert < 5) continue
          rechteck(ctx, x, y, 1, 1, krimFarbe(wert, 0.45))
        }
      }
    }

    // Flaches zuerst, dann die Häuser, nach Süden hin damit Schatten stimmen
    const sortiert = [...city.buildings].sort((a, b) => {
      const fa = FLACH.has(buildingDef(a.type)?.look.kind ?? '') || buildingDef(a.type)?.look.kind === 'park' ? 0 : 1
      const fb = FLACH.has(buildingDef(b.type)?.look.kind ?? '') || buildingDef(b.type)?.look.kind === 'park' ? 0 : 1
      return fa - fb || a.y - b.y
    })
    for (const placed of sortiert) gebaeude(ctx, city, placed, zeit, nacht)

    if (options.life) figuren(ctx, options.life.agents, nacht)

    // Auswahl, Rathaus, Beschwerden, Ruinen
    const rathaus = city.buildings.find((placed) => placed.type === RATHAUS)
    ctx.lineWidth = 0.08
    for (const placed of city.buildings) {
      const def = buildingDef(placed.type)
      if (!def) continue
      const [w, h] = footprint(def, placed.rot)
      if (placed.id === options.selected || placed === rathaus) {
        ctx.strokeStyle = placed.id === options.selected ? '#ffd23f' : fade('#ffd23f', 0.55 + 0.35 * Math.sin(zeit * 2.2))
        ctx.strokeRect(placed.x + 0.04, placed.y + 0.04, w - 0.08, h - 0.08)
      }
      if (placed.verlassen) marke(ctx, placed.x + w - 0.2, placed.y + 0.2, '#6b5a4a', zeit)
      else if (placed.beschwerde) marke(ctx, placed.x + w - 0.2, placed.y + 0.2, '#ff5f7a', zeit, true)
      if (options.bubble && options.bubble.buildingId === placed.id) marke(ctx, placed.x + w / 2, placed.y + 0.2, '#ffffff', zeit, true)
    }

    const ghost = options.ghost
    if (ghost) {
      const def = buildingDef(ghost.type)
      if (def) {
        const [w, h] = footprint(def, ghost.rot)
        ctx.save()
        ctx.globalAlpha = 0.6
        gebaeude(ctx, city, { id: 'ghost', type: ghost.type, x: ghost.x, y: ghost.y, rot: ghost.rot, level: 1, at: 0 }, zeit, nacht)
        ctx.restore()
        ctx.fillStyle = fade(ghost.ok ? '#3ce08a' : '#ff5f7a', 0.3)
        ctx.fillRect(ghost.x, ghost.y, w, h)
        ctx.strokeStyle = ghost.ok ? '#3ce08a' : '#ff5f7a'
        ctx.lineWidth = 0.08
        ctx.strokeRect(ghost.x + 0.04, ghost.y + 0.04, w - 0.08, h - 0.08)
      }
    }
    ctx.restore()

    // Licht des Tages über allem
    if (licht.ton.alpha > 0.005) {
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = rgb(licht.ton.farbe, licht.ton.alpha)
      ctx.fillRect(0, 0, view.w, view.h)
      ctx.restore()
    }

    // Der Kreis kommt nach dem Licht, sonst färbt der Tag die Kante weg
    if (options.reichweite) {
      ctx.save()
      ctx.translate(view.w / 2, view.h / 2)
      ctx.scale(camera.zoom, camera.zoom)
      ctx.translate(-camera.x, -camera.y)
      ctx.rotate(blickJetzt())
      ctx.scale(K, K)
      ctx.translate(-city.land / 2, -city.land / 2)
      reichweiteOben(ctx, options.reichweite, city, camera.zoom)
      ctx.restore()
    }
  } catch (fehler) {
    for (let i = 0; i < 64; i++) ctx.restore()
    ctx.setTransform(grund)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    console.error('Karte konnte nicht gezeichnet werden:', fehler)
  }
}

const OHNE_REICHWEITE = new Set(['natur', 'schmuck', 'wege'])

/** Kreis und Hausumrisse von oben – Strichstärke in Bildpunkten, nicht in Kacheln */
function reichweiteOben(
  ctx: CanvasRenderingContext2D,
  kreis: NonNullable<DrawOptions['reichweite']>,
  city: CityState,
  zoom: number,
): void {
  const px = (n: number) => n / (Math.max(0.35, zoom) * K)
  const bogen = () => {
    ctx.beginPath()
    ctx.arc(kreis.x, kreis.y, kreis.radius, 0, Math.PI * 2)
  }
  bogen()
  ctx.fillStyle = kreis.fuellung
  ctx.fill()
  ctx.lineJoin = 'round'
  bogen()
  ctx.strokeStyle = 'rgba(8, 12, 20, 0.92)'
  ctx.lineWidth = px(8)
  ctx.stroke()
  bogen()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = px(5)
  ctx.stroke()
  bogen()
  ctx.strokeStyle = kreis.rand
  ctx.lineWidth = px(2.6)
  ctx.stroke()

  for (const placed of city.buildings) {
    if (placed.id === kreis.selbst || placed.verlassen) continue
    const def = buildingDef(placed.type)
    if (!def || OHNE_REICHWEITE.has(def.category)) continue
    const [w, h] = footprint(def, placed.rot)
    if (Math.hypot(placed.x + w / 2 - kreis.x, placed.y + h / 2 - kreis.y) > kreis.radius) continue
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = px(4)
    ctx.strokeRect(placed.x, placed.y, w, h)
    ctx.strokeStyle = kreis.rand
    ctx.lineWidth = px(2)
    ctx.strokeRect(placed.x, placed.y, w, h)
  }
}

/** Welches Bauwerk liegt in der Ansicht von oben unter diesem Punkt? */
export function hitTestOben(city: CityState, wx: number, wy: number): Placed | null {
  const t = toTile(wx, wy)
  const x = Math.floor(t.x)
  const y = Math.floor(t.y)
  for (const placed of city.buildings) {
    if (tilesOf(placed).some((k) => k.x === x && k.y === y)) return placed
  }
  return null
}

/** Kamera so setzen, dass das ganze Gebiet von oben ins Bild passt */
export function karteFrame(city: CityState, view: { w: number; h: number }): Camera {
  setProjektion('oben')
  const ecken = [toScreen(0, 0), toScreen(city.land, 0), toScreen(city.land, city.land), toScreen(0, city.land)]
  const xs = ecken.map((c) => c.sx)
  const ys = ecken.map((c) => c.sy)
  const links = Math.min(...xs)
  const rechts = Math.max(...xs)
  const oben = Math.min(...ys)
  const unten = Math.max(...ys)
  const fit = Math.min(view.w / (rechts - links + 30), view.h / (unten - oben + 30))
  return { x: (links + rechts) / 2, y: (oben + unten) / 2, zoom: Math.max(0.45, Math.min(2.4, fit)) }
}
