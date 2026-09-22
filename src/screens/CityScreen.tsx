import { useCallback, useEffect, useRef, useState } from 'react'
import { IconBack, IconCheck, IconClose } from '../components/Icons'
import {
  RATHAUS,
  ROADS,
  buildingDef,
  effectsOf,
  footprint,
  maxLevel,
  nextUpgrade,
  roadDef,
  unlockInfo,
  type Category,
} from '../city/catalog'
import { AUSZUG_NACH, beschwerdenVon, leerstandSchritt, leerstandVon, wohnlageVon } from '../city/leerstand'
import { nimmVorgemerkt } from '../city/vormerkung'
import { istKursBitte } from '../lernen/bitten'
import { ladeAlle } from '../lernen/kurse'
import { blickJetzt, setBlick, toScreen, toTile, type Blick } from '../city/iso'
import { cityFrame, drawCity, hitTest, type Camera } from '../city/render'
import {
  canPlace,
  cityTitle,
  createCity,
  expand,
  expansionCheck,
  happinessBreakdown,
  incomeBreakdown,
  levelProgress,
  moveTo,
  nextExpansion,
  pave,
  paveCost,
  place,
  problemsOf,
  rathausVon,
  remove,
  rename,
  roadKey,
  sanieren,
  sanierungsKosten,
  setTheme,
  statsOf,
  unpave,
  upgrade,
} from '../city/state'
import { THEMES } from '../city/themes'
import {
  artikel,
  dunkelWaechst,
  MOVE_IN_MOOD,
  razzia,
  razziaMoeglich,
  runCycles,
  setRequest,
  setTax,
  solveRequest,
  wachsen,
  wachstumsTakt,
  wohnplatz,
} from '../city/state'
import { anpassen, createLife, signatureOf, stepLife, type Ereignis, type Life } from '../city/life'
import { bewohnerVon, euro, gesellschaft, KLASSEN, STEUER_MAX, STEUER_MIN } from '../city/society'
import { BauBlatt, KLASSE_NAME } from './CityBuildSheet'
import {
  REQUEST_COINS,
  REQUEST_MATERIALS,
  REQUEST_XP,
  dueRequest,
  judgeRequest,
  makeRequest,
  type CityRequest,
} from '../city/requests'
import type { CycleReport, Placed } from '../city/types'
import { DOMAINS, knowledgeLevel, levels as knowledgeLevels, pointsOf } from '../knowledge'
import { getMode } from '../modes/registry'
import { creditXp } from '../progression'
import { haptic } from '../haptics'
import { goBack, navigate } from '../router'
import { getState, setState } from '../store'
import type { SaveData } from '../types'

const EMBLEMS = ['🏙️', '🌆', '🏛️', '🌳', '⚓', '⛰️', '🔭', '🎓', '🚀', '🦉']

type Mode = 'view' | 'build' | 'place' | 'select' | 'road' | 'roadPick' | 'land' | 'report'

export function CityScreen({ data }: { data: SaveData }) {
  if (!data.city) return <CitySetup />
  return <CityWorld data={data} />
}

// ---------- Gründung ----------

function CitySetup() {
  const [name, setName] = useState('')
  const [motto, setMotto] = useState('')
  const [emblem, setEmblem] = useState(EMBLEMS[0])

  const found = () => {
    const chosen = name.trim() || 'Neustadt'
    haptic('celebrate')
    setState((current) => ({ ...current, city: createCity(chosen, motto, emblem) }))
  }

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Zurück" onClick={() => goBack({ name: 'home' })}>
          <IconBack />
        </button>
        <h1>Deine Stadt</h1>
      </header>

      <section className="city-intro">
        <p className="city-intro-emblem" aria-hidden="true">
          {emblem}
        </p>
        <p className="city-intro-text">
          Hier entsteht deine eigene Stadt. Alles, was du in den Spielen verdienst, fließt in sie hinein. Wie soll sie
          heißen?
        </p>
      </section>

      <section className="list">
        <div className="row row-stack">
          <label className="city-label" htmlFor="city-name">
            Name der Stadt
          </label>
          <input
            id="city-name"
            className="city-input"
            value={name}
            maxLength={24}
            placeholder="Novara"
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="row row-stack">
          <label className="city-label" htmlFor="city-motto">
            Wahlspruch (frei lassen geht auch)
          </label>
          <input
            id="city-motto"
            className="city-input"
            value={motto}
            maxLength={60}
            placeholder="Wissen baut die Zukunft."
            onChange={(event) => setMotto(event.target.value)}
          />
        </div>
        <div className="row row-stack">
          <span className="city-label">Wappen</span>
          <div className="city-emblems">
            {EMBLEMS.map((entry) => (
              <button
                key={entry}
                className={`city-emblem${entry === emblem ? ' is-on' : ''}`}
                aria-pressed={entry === emblem}
                onClick={() => {
                  setEmblem(entry)
                  haptic('tick')
                }}
              >
                {entry}
              </button>
            ))}
          </div>
        </div>
      </section>

      <button className="btn btn-primary city-found" onClick={found}>
        Stadt gründen
      </button>
      <p className="footnote">
        Du startest mit einer kleinen Siedlung, 2.500 Münzen und 40 Materialien. Umbenennen kannst du sie später
        jederzeit.
      </p>
    </main>
  )
}

// ---------- Die Stadt ----------

function CityWorld({ data }: { data: SaveData }) {
  const city = data.city!
  const stats = statsOf(city)
  const progress = levelProgress(city)
  const step = nextExpansion(city)
  const levels = knowledgeLevels(data)

  const [mode, setMode] = useState<Mode>('view')
  const [category, setCategory] = useState<Category>('wohnen')
  const [pick, setPick] = useState<string | null>(null)
  const [ghost, setGhost] = useState({ x: 0, y: 0, rot: 0 as 0 | 1 | 2 | 3 })
  const [movingId, setMovingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [roadType, setRoadType] = useState('strasse')
  const [erase, setErase] = useState(false)
  const [cycle, setCycle] = useState<CycleReport | null>(null)
  const [shownRequest, setShownRequest] = useState<CityRequest | null>(null)
  const [answer, setAnswer] = useState<string | null>(null)
  const [reward, setReward] = useState<{ coins: number; materials: number } | null>(null)
  const [newName, setNewName] = useState(city.name)
  const [newMotto, setNewMotto] = useState(city.motto)
  /** Kurzes Willkommen beim Betreten – wer es eilig hat, tippt es weg */
  const [eintritt, setEintritt] = useState(true)
  const request = city.request as CityRequest | null
  /** Meldungen aus der Stadt: Brände, Razzien, neue Häuser – sie verschwinden von selbst */
  const [meldungen, setMeldungen] = useState<{ id: number; text: string }[]>([])
  const meldungsNr = useRef(1)
  /** Kriminalität als Tönung auf der Karte */
  const [krimKarte, setKrimKarte] = useState(false)
  /** Blickwinkel im Bogenmaß – bleibt, wenn man die Stadt verlässt und wiederkommt */
  const winkel = useRef<Blick>(blickJetzt())
  /** Zurückdrehen nach Norden, wenn der Kompass angetippt wurde */
  const heimweg = useRef<{ von: Blick; start: number } | null>(null)
  const kompass = useRef<HTMLButtonElement>(null)

  const canvas = useRef<HTMLCanvasElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const size = useRef({ w: 320, h: 480 })
  const camera = useRef<Camera>({ x: 0, y: 0, zoom: 1 })
  const framed = useRef(false)
  const stroke = useRef<string[]>([])
  const life = useRef<Life | null>(null)
  const live = useRef({ city, mode, ghost, pick, selected, movingId, roadType, erase, levels, krimKarte })
  live.current = { city, mode, ghost, pick, selected, movingId, roadType, erase, levels, krimKarte }

  const melde = useCallback((text: string) => {
    const id = meldungsNr.current++
    setMeldungen((liste) => [...liste.slice(-2), { id, text }])
    window.setTimeout(() => setMeldungen((liste) => liste.filter((m) => m.id !== id)), 5200)
  }, [])

  /** Was das Leben der Stadt meldet: Einsätze, und Razzien, die ein Gebäude kosten */
  const aufEreignisse = useRef<(liste: Ereignis[]) => void>(() => {})
  aufEreignisse.current = (liste) => {
    for (const e of liste) {
      if (e.art === 'razzia') {
        let beute = 0
        let zerstoert = true
        let name = ''
        setState((current) => {
          if (!current.city) return current
          name = buildingDef(current.city.buildings.find((b) => b.id === e.ort)?.type ?? '')?.name ?? ''
          const r = razzia(current.city, e.ort)
          beute = r.beute
          zerstoert = r.zerstoert
          return r.beute > 0 ? { ...current, city: r.city } : current
        })
        if (beute > 0 && !zerstoert) melde(`🚔 Razzia: ${name} verliert eine Ausbaustufe, ${beute} 🪙 beschlagnahmt.`)
        else melde(beute > 0 ? `${e.text} ${beute} 🪙 beschlagnahmt.` : e.text)
        haptic('success')
      } else {
        melde(e.text)
      }
    }
  }

  /** Kompass angetippt: in einer kurzen Bewegung zurück nach Norden */
  const nachNorden = () => {
    // den kürzeren Weg nehmen
    const von = Math.atan2(Math.sin(winkel.current), Math.cos(winkel.current))
    winkel.current = von
    heimweg.current = { von, start: performance.now() }
    haptic('tick')
  }

  const say = (text: string | null) => {
    setNotice(text)
    if (text) haptic('error')
  }

  // ---------- Was in der Zwischenzeit passiert ist ----------
  useEffect(() => {
    let report: CycleReport | null = null
    setState((current) => {
      if (!current.city) return current
      const result = runCycles(current.city)
      report = result.report
      return { ...current, city: result.city }
    })
    if (report) {
      setCycle(report)
      haptic('success')
    }

    // Vielleicht wartet jemand mit einer Bitte
    setState((current) => {
      const neu = dueRequest(current)
      return neu && current.city ? { ...current, city: setRequest(current.city, neu) } : current
    })
  }, [])

  // ---------- Die Stadt wächst, während man zusieht ----------
  // Bei guter Stimmung ziehen laufend Menschen zu, und wenn der Wohnraum knapp wird,
  // bauen sie selbst. Wo Armut und fehlende Bildung zusammenkommen, eröffnet ab und zu
  // jemand ein dunkles Geschäft.
  useEffect(() => {
    const start = performance.now()
    let naechsterZuzug = start + 12_000
    let naechsterBau = start + 18_000
    let naechsteUnterwelt = start + 100_000
    let naechsteBeschwerde = start + 20_000
    const takt = window.setInterval(() => {
      const jetzt = performance.now()
      const stadt = getState().city
      if (!stadt) return
      const stimmung = happinessBreakdown(stadt).total

      // Wo die Wohnlage nicht stimmt, wird gemurrt – und wer lange genug murrt, geht
      if (jetzt >= naechsteBeschwerde) {
        naechsteBeschwerde = jetzt + 25_000
        const schritt = leerstandSchritt(stadt, Date.now(), stimmung)
        if (schritt.city !== stadt) {
          setState((current) => (current.city === stadt ? { ...current, city: schritt.city } : current))
          for (const text of schritt.meldungen) melde(text)
          if (schritt.meldungen.some((m) => m.startsWith('🏚️'))) haptic('strong')
        }
      }

      if (jetzt >= naechsterZuzug) {
        naechsterZuzug = jetzt + 15_000
        const platz = wohnplatz(stadt)
        if (stimmung >= MOVE_IN_MOOD && stadt.population < platz) {
          const neu = Math.min(platz - stadt.population, 1 + Math.floor((stimmung - MOVE_IN_MOOD) / 15))
          setState((current) => (current.city ? { ...current, city: { ...current.city, population: current.city.population + neu } } : current))
        }
      }

      const abstand = wachstumsTakt(stimmung)
      if (abstand !== null && jetzt >= naechsterBau) {
        naechsterBau = jetzt + abstand * 1000
        const schritt = wachsen(stadt, Date.now())
        if (schritt.gebaut) {
          const def = buildingDef(schritt.gebaut.type)
          const bewohner = Math.round((def?.effects.capacity ?? 0) * 0.6)
          setState((current) =>
            current.city === stadt ? { ...current, city: { ...schritt.city, population: schritt.city.population + bewohner } } : current,
          )
          melde(`🏡 Zugezogene haben ${artikel(schritt.gebaut.type)} gebaut.`)
          haptic('soft')
        }
      } else if (abstand === null) {
        naechsterBau = jetzt + 20_000
      }

      if (jetzt >= naechsteUnterwelt) {
        naechsteUnterwelt = jetzt + 120_000
        const schritt = dunkelWaechst(stadt, Date.now())
        if (schritt.gebaut) {
          setState((current) => (current.city === stadt ? { ...current, city: schritt.city } : current))
          melde(`🕶️ Im Viertel ist ${artikel(schritt.gebaut.type)} entstanden.`)
        }
      }
    }, 1000)
    return () => window.clearInterval(takt)
  }, [melde])

  // ---------- Zeichnen ----------
  useEffect(() => {
    const element = canvas.current
    const box = wrap.current
    if (!element || !box) return
    const ctx = element.getContext('2d')
    if (!ctx) return

    const fit = () => {
      const rect = box.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      size.current = { w: Math.max(200, rect.width), h: Math.max(200, rect.height) }
      element.width = Math.round(size.current.w * dpr)
      element.height = Math.round(size.current.h * dpr)
      element.style.width = `${size.current.w}px`
      element.style.height = `${size.current.h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (!framed.current) {
        setBlick(winkel.current, live.current.city.land)
        camera.current = cityFrame(live.current.city, size.current)
        framed.current = true
      }
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(box)

    let raf = 0
    let last = performance.now()
    // Gleitender Mittelwert der Bildzeit. Wird es zäh, fallen die Kleinteile weg;
    // läuft es wieder rund, kommen sie zurück. Der Abstand dazwischen verhindert,
    // dass die Stadt bei jedem Bild ihr Aussehen wechselt.
    let bildzeit = 16
    let detail = true
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000))
      bildzeit = bildzeit * 0.9 + Math.min(200, now - last) * 0.1
      if (detail && bildzeit > 34) detail = false
      else if (!detail && bildzeit < 22) detail = true
      last = now
      const state = live.current

      // Zurück nach Norden: der Punkt in der Bildmitte bleibt in der Bildmitte
      if (heimweg.current) {
        const t = Math.min(1, (now - heimweg.current.start) / 320)
        const weich = 1 - (1 - t) ** 3
        const mitte = toTile(camera.current.x, camera.current.y)
        winkel.current = heimweg.current.von * (1 - weich)
        setBlick(winkel.current, state.city.land)
        const ziel = toScreen(mitte.x, mitte.y)
        camera.current = { ...camera.current, x: ziel.sx, y: ziel.sy }
        if (t >= 1) {
          winkel.current = 0
          heimweg.current = null
        }
      }

      // Kompass: zeigt, wie weit gedreht ist, und verschwindet bei Norden
      const nadel = kompass.current
      if (nadel) {
        const rest = Math.atan2(Math.sin(winkel.current), Math.cos(winkel.current))
        const zeigen = Math.abs(rest) > 0.03
        if (nadel.hidden === zeigen) nadel.hidden = !zeigen
        if (zeigen) nadel.style.setProperty('--dreh', `${rest}rad`)
      }

      // Leben anpassen, wenn sich die Stadt verändert hat – wer unterwegs ist, bleibt es,
      // solange sein Weg und sein Ziel noch da sind
      if (!life.current) life.current = createLife(state.city)
      else if (life.current.signature !== signatureOf(state.city)) anpassen(life.current, state.city)
      const ereignisse = stepLife(life.current, state.city, dt)
      if (ereignisse.length) aufEreignisse.current(ereignisse)
      const shown =
        state.mode === 'place' && state.pick
          ? {
              type: state.pick,
              x: state.ghost.x,
              y: state.ghost.y,
              rot: state.ghost.rot,
              ok: canPlace(state.city, state.pick, state.ghost.x, state.ghost.y, state.ghost.rot, {
                ignore: state.movingId ?? undefined,
                free: state.movingId !== null,
                levels: state.levels,
              }).ok,
            }
          : null
      const bitte = state.city.request as CityRequest | null
      drawCity(ctx, state.city, camera.current, size.current, {
        ghost: shown,
        paint: state.mode === 'road' ? { tiles: stroke.current, type: state.roadType, adding: !state.erase } : null,
        selected: state.selected,
        buildMode: state.mode !== 'view' && state.mode !== 'select',
        detail,
        blick: winkel.current,
        life: life.current,
        kriminalitaet: state.krimKarte,
        bubble: bitte ? { buildingId: bitte.buildingId, emoji: bitte.citizen.emoji } : null,
        time: now / 1000,
      })
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  // ---------- Kamera, Tippen, Straßen ziehen ----------
  useEffect(() => {
    const box = wrap.current
    if (!box) return
    const points = new Map<number, { x: number; y: number }>()
    /** Abstand zum Startpunkt – nicht die gelaufene Strecke, sonst zählt jedes Zittern mit */
    let far = 0
    let startX = 0
    let startY = 0
    let pinch = 0
    let startZoom = 1
    /** Winkel zwischen den beiden Fingern beim letzten Schritt */
    let fingerWinkel = 0
    /** Der Bodenpunkt, der unter den Fingern bleiben soll */
    let anker = { x: 0, y: 0 }
    let painting = false
    /** So weit darf der Finger wandern, damit es ein Tipper bleibt */
    const TAP = 16
    /** Ab hier wird geschoben */
    const PAN = 8

    /** Punkt auf dem Bildschirm → Punkt in der Weltzeichnung */
    const worldAt = (clientX: number, clientY: number) => {
      const rect = box.getBoundingClientRect()
      const cam = camera.current
      return {
        wx: (clientX - rect.left - size.current.w / 2) / cam.zoom + cam.x,
        wy: (clientY - rect.top - size.current.h / 2) / cam.zoom + cam.y,
      }
    }

    const tileAt = (clientX: number, clientY: number) => {
      const { wx, wy } = worldAt(clientX, clientY)
      const tile = toTile(wx, wy)
      return { x: Math.floor(tile.x), y: Math.floor(tile.y) }
    }

    const addToStroke = (clientX: number, clientY: number) => {
      const tile = tileAt(clientX, clientY)
      const state = live.current
      if (tile.x < 0 || tile.y < 0 || tile.x >= state.city.land || tile.y >= state.city.land) return
      const key = roadKey(tile.x, tile.y)
      if (stroke.current.includes(key)) return
      stroke.current = [...stroke.current, key]
      haptic('tick', { minGap: 80 })
    }

    const finishStroke = () => {
      const tiles = stroke.current.map((key) => {
        const [x, y] = key.split(':').map(Number)
        return { x, y }
      })
      stroke.current = []
      painting = false
      if (tiles.length === 0) return
      const state = live.current

      if (state.erase) {
        setState((current) => (current.city ? { ...current, city: unpave(current.city, tiles) } : current))
        haptic('soft')
        return
      }
      const cost = paveCost(state.city, tiles, state.roadType)
      if (cost.count === 0) {
        say('Auf diesen Kacheln kann keine Straße liegen.')
        return
      }
      if (cost.coins > state.city.coins || cost.materials > state.city.materials) {
        say(`Dafür brauchst du ${cost.coins} Münzen und ${cost.materials} Materialien.`)
        return
      }
      setState((current) =>
        current.city ? { ...current, city: pave(current.city, tiles, state.roadType) } : current,
      )
      setNotice(null)
      haptic('success')
    }

    const down = (event: PointerEvent) => {
      // Nur die Leinwand ist Karte. Was darüber liegt – Karten, Leisten, Knöpfe – gehört
      // der Bedienung. Zählte ein Tipper dort auch als Tipper auf die Wiese, hübe er die
      // Auswahl auf, die Karte verschwände, und der Knopf wäre fort, bevor sein Klick kommt.
      if (event.target !== canvas.current) return
      points.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (points.size === 1) {
        far = 0
        startX = event.clientX
        startY = event.clientY
        if (live.current.mode === 'road') {
          painting = true
          stroke.current = []
          addToStroke(event.clientX, event.clientY)
        }
      }
      if (points.size === 2) {
        const [a, b] = [...points.values()]
        pinch = Math.hypot(a.x - b.x, a.y - b.y)
        startZoom = camera.current.zoom
        fingerWinkel = Math.atan2(b.y - a.y, b.x - a.x)
        // Wer selbst dreht, hält die Rückkehr nach Norden an
        heimweg.current = null
        const mitte = worldAt((a.x + b.x) / 2, (a.y + b.y) / 2)
        anker = toTile(mitte.wx, mitte.wy)
        painting = false
        stroke.current = []
      }
    }

    const move = (event: PointerEvent) => {
      const previous = points.get(event.pointerId)
      if (!previous) return
      points.set(event.pointerId, { x: event.clientX, y: event.clientY })

      if (points.size >= 2) {
        // Zwei Finger: zoomen, drehen und schieben in einem – wie bei einer Karte.
        const [a, b] = [...points.values()]
        const spread = Math.hypot(a.x - b.x, a.y - b.y)
        if (pinch > 0 && spread > 0) camera.current.zoom = Math.max(0.45, Math.min(2.4, (startZoom * spread) / pinch))

        // Drehung schrittweise aufsummieren, damit der Sprung von +180° auf -180° nichts ausmacht
        const jetzt = Math.atan2(b.y - a.y, b.x - a.x)
        const schritt = Math.atan2(Math.sin(jetzt - fingerWinkel), Math.cos(jetzt - fingerWinkel))
        fingerWinkel = jetzt
        winkel.current += schritt
        setBlick(winkel.current, live.current.city.land)

        // Der Bodenpunkt, der beim Aufsetzen unter den Fingern lag, bleibt dort
        const rect = box.getBoundingClientRect()
        const ziel = toScreen(anker.x, anker.y)
        const mx = (a.x + b.x) / 2 - rect.left - size.current.w / 2
        const my = (a.y + b.y) / 2 - rect.top - size.current.h / 2
        camera.current.x = ziel.sx - mx / camera.current.zoom
        camera.current.y = ziel.sy - my / camera.current.zoom
        far = 999
        return
      }

      if (painting) {
        addToStroke(event.clientX, event.clientY)
        return
      }

      const dx = event.clientX - previous.x
      const dy = event.clientY - previous.y
      far = Math.hypot(event.clientX - startX, event.clientY - startY)
      if (far < PAN) return
      camera.current.x -= dx / camera.current.zoom
      camera.current.y -= dy / camera.current.zoom
      const limit = live.current.city.land * 64
      camera.current.x = Math.max(-limit, Math.min(limit, camera.current.x))
      camera.current.y = Math.max(-140, Math.min(live.current.city.land * 32 + 240, camera.current.y))
    }

    const up = (event: PointerEvent) => {
      const had = points.delete(event.pointerId)
      // Diese Berührung hat auf der Bedienung begonnen – die Karte lässt sie in Ruhe.
      if (!had) return
      if (points.size > 0) {
        pinch = 0
        return
      }
      if (painting) {
        finishStroke()
        return
      }
      if (far > TAP) return

      const tile = tileAt(event.clientX, event.clientY)
      const state = live.current

      if (state.mode === 'place' && state.pick) {
        const def = buildingDef(state.pick)
        if (!def) return
        const [w, h] = footprint(def, state.ghost.rot)
        if (tile.x < 0 || tile.y < 0 || tile.x + w > state.city.land || tile.y + h > state.city.land) {
          setNotice('Das liegt außerhalb deines Gebiets.')
          haptic('error')
          return
        }
        setGhost((current) => ({ ...current, x: tile.x, y: tile.y }))
        setNotice(null)
        haptic('tick')
        return
      }

      // Trifft die sichtbare Gestalt, nicht nur die Bodenkachel
      const punkt = worldAt(event.clientX, event.clientY)
      const hit = hitTest(state.city, punkt.wx, punkt.wy)
      if (hit) {
        setSelected(hit.id)
        // Das Rathaus öffnet den Stadtbericht – der einzige Weg dorthin
        setMode(hit.type === RATHAUS ? 'report' : 'select')
        haptic('soft')
      } else {
        setSelected(null)
        if (state.mode === 'select' || state.mode === 'report') setMode('view')
      }
    }

    box.addEventListener('pointerdown', down)
    box.addEventListener('pointermove', move)
    box.addEventListener('pointerup', up)
    box.addEventListener('pointercancel', up)
    return () => {
      box.removeEventListener('pointerdown', down)
      box.removeEventListener('pointermove', move)
      box.removeEventListener('pointerup', up)
      box.removeEventListener('pointercancel', up)
    }
  }, [])

  // ---------- Aktionen ----------
  const startPlacing = (type: string) => {
    const def = buildingDef(type)
    if (!def) return
    const check = canPlace(city, type, 0, 0, 0, { levels })
    if (check.reason?.startsWith('Dir fehlen')) {
      say(check.reason)
      return
    }
    const middle = Math.floor(city.land / 2) - 1
    setPick(type)
    setMovingId(null)
    setGhost({ x: middle, y: middle, rot: 0 })
    setMode('place')
    setNotice(null)
    haptic('soft')
  }

  const rotate = () => {
    setGhost((current) => ({ ...current, rot: ((current.rot + 1) % 4) as 0 | 1 | 2 | 3 }))
    haptic('tick')
  }

  const confirm = () => {
    if (!pick) return
    const check = canPlace(city, pick, ghost.x, ghost.y, ghost.rot, {
      ignore: movingId ?? undefined,
      free: movingId !== null,
      levels,
    })
    if (!check.ok) {
      say(check.reason ?? 'Das geht hier nicht.')
      return
    }
    haptic('success')
    if (movingId) {
      const id = movingId
      setState((current) =>
        current.city ? { ...current, city: moveTo(current.city, id, ghost.x, ghost.y, ghost.rot) } : current,
      )
    } else {
      const type = pick
      setState((current) =>
        current.city
          ? { ...current, city: place(current.city, type, ghost.x, ghost.y, ghost.rot, { levels }) }
          : current,
      )
    }
    setPick(null)
    setMovingId(null)
    setMode('view')
    setNotice(null)
  }

  const cancel = () => {
    setPick(null)
    setMovingId(null)
    setMode('view')
    setNotice(null)
    haptic('tick')
  }

  const chosen = selected ? city.buildings.find((entry) => entry.id === selected) : undefined
  const chosenDef = chosen ? buildingDef(chosen.type) : undefined

  const startMoving = () => {
    if (!chosen || !chosenDef) return
    setPick(chosen.type)
    setMovingId(chosen.id)
    setGhost({ x: chosen.x, y: chosen.y, rot: chosen.rot })
    setMode('place')
    haptic('soft')
  }

  const doUpgrade = () => {
    if (!chosen || !chosenDef) return
    const next = nextUpgrade(chosenDef, chosen.level)
    if (!next) return
    if (city.coins < next.coins || city.materials < next.materials) {
      say(
        `Dafür fehlen dir ${Math.max(0, next.coins - city.coins)} Münzen und ${Math.max(0, next.materials - city.materials)} Materialien.`,
      )
      return
    }
    const id = chosen.id
    haptic('celebrate')
    setState((current) => (current.city ? { ...current, city: upgrade(current.city, id) } : current))
  }

  const doRemove = () => {
    if (!chosen || chosen.type === RATHAUS) return
    const id = chosen.id
    haptic('strong')
    setState((current) => (current.city ? { ...current, city: remove(current.city, id) } : current))
    setSelected(null)
    setMode('view')
  }

  const doSanieren = () => {
    if (!chosen || !chosen.verlassen) return
    const kosten = sanierungsKosten(chosen)
    if (city.coins < kosten.coins || city.materials < kosten.materials) {
      say(`Für die Sanierung fehlen dir ${Math.max(0, kosten.coins - city.coins)} Münzen und ${Math.max(0, kosten.materials - city.materials)} Materialien.`)
      return
    }
    const id = chosen.id
    haptic('celebrate')
    setState((current) => (current.city ? { ...current, city: sanieren(current.city, id) } : current))
    melde('🔨 Das Haus ist saniert. Bei guter Wohnlage ziehen bald wieder Menschen ein.')
  }

  /** Kamera zum Rathaus – dort ist der Stadtbericht */
  const zumRathaus = () => {
    const rathaus = rathausVon(city)
    if (!rathaus) return
    const ziel = toScreen(rathaus.x + 1, rathaus.y + 1)
    camera.current = { x: ziel.sx, y: ziel.sy - 20, zoom: Math.max(camera.current.zoom, 1.4) }
    setSelected(rathaus.id)
    haptic('tick')
  }

  const doExpand = () => {
    const check = expansionCheck(city)
    if (!check.ok) {
      say(check.reason ?? 'Das geht noch nicht.')
      return
    }
    haptic('celebrate')
    setState((current) => (current.city ? { ...current, city: expand(current.city) } : current))
    setMode('view')
    setNotice(null)
    // Kamera zeigt das neue, größere Gebiet
    window.setTimeout(() => {
      const grown = live.current.city
      camera.current = { ...cityFrame(grown, size.current), zoom: cityFrame(grown, size.current).zoom * 0.7 }
    }, 60)
  }

  const look = () => {
    camera.current = cityFrame(city, size.current)
    haptic('tick')
  }

  // Bürger bitten auch um Kurs-Aufgaben – deren Inhalte laden im Hintergrund
  useEffect(() => {
    void ladeAlle()
  }, [])

  // ---------- Aus einer Kurs-Bilanz: „Jetzt bauen“ ----------
  useEffect(() => {
    const vor = nimmVorgemerkt()
    const def = vor ? buildingDef(vor) : undefined
    if (!vor || !def) return
    const lock = unlockInfo(def, city.level, levels)
    const check = canPlace(city, vor, 0, 0, 0, { levels })
    if (lock.ok && !check.reason?.startsWith('Dir fehlen')) {
      startPlacing(vor)
      return
    }
    // Noch nicht baubar: das Baumenü an der richtigen Stelle öffnen und sagen, was fehlt
    setCategory(def.category)
    setMode('build')
    say(lock.ok ? (check.reason ?? '') : `Dafür fehlt dir noch: ${lock.missing.join(', ')}.`)
    // nur beim Öffnen der Stadt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- Bitten der Bürger ----------
  const openRequest = () => {
    if (!request) return
    // Aufgaben aus den Lernwelten sind ganze Mini-Spiele – dafür gibt es eine eigene Seite
    if (istKursBitte(request)) {
      haptic('soft')
      navigate({ name: 'bitte' })
      return
    }
    setShownRequest(request)
    setAnswer(null)
    setMode('view')
    haptic('soft')
  }

  const reply = (id: string) => {
    if (!shownRequest || answer) return
    setAnswer(id)
    if (judgeRequest(shownRequest, id)) {
      haptic('celebrate')
      const vorher = { coins: city.coins, materials: city.materials }
      setState((current) =>
        current.city ? creditXp({ ...current, city: solveRequest(current.city) }, REQUEST_XP) : current,
      )
      // Genau das anzeigen, was wirklich ankam – die XP werden ja selbst zu Münzen
      const jetzt = getState().city
      if (jetzt) setReward({ coins: jetzt.coins - vorher.coins, materials: jetzt.materials - vorher.materials })
    } else {
      haptic('error')
    }
  }

  const closeRequest = () => {
    // Falsch beantwortet? Dann bleibt der Bürger – aber mit einer neuen Frage.
    if (shownRequest && answer && !judgeRequest(shownRequest, answer)) {
      setState((current) => {
        if (!current.city) return current
        const frisch = makeRequest(current, shownRequest.buildingId)
        return {
          ...current,
          city: setRequest(current.city, frisch ? { ...frisch, citizen: shownRequest.citizen } : null, 0),
        }
      })
    }
    setShownRequest(null)
    setAnswer(null)
    setReward(null)
    haptic('tick')
  }

  const expandOk = step ? expansionCheck(city) : null

  return (
    <main className="city">
      {eintritt && (
        <div className="city-eintritt" onAnimationEnd={() => setEintritt(false)} onPointerDown={() => setEintritt(false)}>
          <span className="city-eintritt-emblem" aria-hidden="true">
            {city.emblem}
          </span>
          <strong>{city.name}</strong>
          {city.motto && <em>„{city.motto}“</em>}
          <small>
            {cityTitle(city.level)} · 👥 {stats.population.toLocaleString('de-DE')}
          </small>
        </div>
      )}

      <div className="city-top">
        <button className="city-icon" aria-label="Zurück" onClick={() => goBack({ name: 'home' })}>
          <IconBack />
        </button>
        <div className="city-title">
          <strong>
            {city.emblem} {city.name}
          </strong>
          <span>
            {cityTitle(city.level)} · Stufe {city.level} · 👥 {stats.population.toLocaleString('de-DE')}
          </span>
        </div>
        <div className="city-purse">
          <span>🪙 {city.coins.toLocaleString('de-DE')}</span>
          <span>🧱 {city.materials.toLocaleString('de-DE')}</span>
        </div>
      </div>

      <div className="city-stage" ref={wrap}>
        <canvas ref={canvas} className="city-canvas" />

        <button
          ref={kompass}
          className="city-compass"
          onClick={nachNorden}
          aria-label="Nach Norden ausrichten"
          hidden
        >
          <span className="city-compass-needle" aria-hidden="true" />
        </button>

        {notice && (
          <p className="city-notice" role="status">
            {notice}
          </p>
        )}

        {krimKarte && (
          <div className="city-legende" role="note">
            <span aria-hidden="true">🚨</span>
            <span>sicher</span>
            <span className="city-legende-skala" aria-hidden="true" />
            <span>gefährlich</span>
            <button
              className="city-legende-zu"
              aria-label="Kriminalitätskarte ausblenden"
              onClick={() => {
                setKrimKarte(false)
                haptic('tick')
              }}
            >
              ✕
            </button>
          </div>
        )}

        {meldungen.length > 0 && !notice && (
          <div className={`city-meldungen${krimKarte ? ' unter-legende' : ''}`} aria-live="polite">
            {meldungen.map((m) => (
              <p key={m.id} className="city-meldung">
                {m.text}
              </p>
            ))}
          </div>
        )}

        {mode === 'view' && request && !shownRequest && !cycle && (
          <button className="city-call" onClick={openRequest}>
            <span className="city-call-emoji" aria-hidden="true">
              {request.citizen.emoji}
            </span>
            <span className="city-call-body">
              <strong>{request.citizen.name} braucht Hilfe</strong>
              <span>{request.citizen.role}</span>
            </span>
            <span className="city-call-go">Helfen</span>
          </button>
        )}

        {shownRequest && (
          <div className="city-sheet city-ask">
            <div className="city-detail-head">
              <span className="city-card-emoji">{shownRequest.citizen.emoji}</span>
              <span className="city-card-body">
                <strong>{shownRequest.citizen.name}</strong>
                <span>{shownRequest.citizen.role}</span>
              </span>
              <button className="city-close" aria-label="Schließen" onClick={closeRequest}>
                <IconClose />
              </button>
            </div>
            {!answer && <p className="city-story">„{shownRequest.story}“</p>}
            <div className="city-ask-body">
              {getMode(shownRequest.modeId)?.renderQuestion(shownRequest.question, answer)}
              <p className="question">{shownRequest.question.prompt}</p>
              <div className="options">
                {shownRequest.question.options.map((option) => {
                  const richtig = option.id === shownRequest.question.correctId
                  const gewaehlt = option.id === answer
                  const zustand = !answer ? '' : richtig ? ' is-correct' : gewaehlt ? ' is-wrong' : ' is-dim'
                  return (
                    <button
                      key={option.id}
                      className={`option${zustand}`}
                      aria-disabled={answer !== null}
                      onClick={() => reply(option.id)}
                    >
                      <span>{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            {answer && (
              <div className="city-ask-end">
                {judgeRequest(shownRequest, answer) ? (
                  <p className="city-summary">
                    🎉 Danke! 🪙 +{(reward?.coins ?? REQUEST_COINS).toLocaleString('de-DE')} · 🧱 +
                    {reward?.materials ?? REQUEST_MATERIALS} · ⭐ +{REQUEST_XP} XP
                  </p>
                ) : (
                  <p className="city-summary">
                    Nicht ganz. {shownRequest.citizen.name} fragt später noch einmal.
                  </p>
                )}
                <button className="city-btn city-btn-main" onClick={closeRequest}>
                  <IconCheck /> Weiter
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'view' && !shownRequest && !cycle && (
          <div className="city-bar">
            <button className="city-btn city-btn-main" onClick={() => setMode('build')}>
              🏗️ Bauen
            </button>
            <button
              className="city-btn"
              onClick={() => {
                setMode('roadPick')
                setErase(false)
                haptic('soft')
              }}
            >
              🛣️ Straßen
            </button>
            {step && (
              <button className="city-btn" onClick={() => setMode('land')}>
                🗺️ Land
              </button>
            )}
            <button className="city-btn" onClick={look}>
              🔭
            </button>
          </div>
        )}

        {mode === 'build' && (
          <BauBlatt
            city={city}
            levels={levels}
            category={category}
            onCategory={setCategory}
            onPick={startPlacing}
            onClose={() => setMode('view')}
            say={say}
          />
        )}

        {mode === 'road' && (
          <div className="city-place">
            <p className="city-place-text">
              {erase
                ? '🧹 Zieh über Straßen, um sie aufzunehmen.'
                : `${roadDef(roadType)?.emoji ?? ''} ${roadDef(roadType)?.name ?? ''} · 🪙 ${roadDef(roadType)?.coins ?? 0} je Kachel – zieh über die Karte.`}
            </p>
            <div className="city-place-row">
              <button className="city-btn" onClick={() => setMode('roadPick')}>
                Art wechseln
              </button>
              <button
                className="city-btn city-btn-main"
                onClick={() => {
                  setMode('view')
                  haptic('tick')
                }}
              >
                <IconCheck /> Fertig
              </button>
            </div>
          </div>
        )}

        {mode === 'roadPick' && (
          <div className="city-sheet">
            <div className="city-sheet-head">
              <strong>Straßen ziehen</strong>
              <button className="city-close" aria-label="Schließen" onClick={() => setMode('view')}>
                <IconClose />
              </button>
            </div>
            <ul className="city-list">
              {ROADS.map((def) => (
                <li key={def.id}>
                  <button
                    className={`city-card${def.id === roadType && !erase ? ' is-on' : ''}`}
                    onClick={() => {
                      setRoadType(def.id)
                      setErase(false)
                      setMode('road')
                      haptic('tick')
                    }}
                  >
                    <span className="city-card-emoji">{def.emoji}</span>
                    <span className="city-card-body">
                      <strong>{def.name}</strong>
                      <span>{def.note}</span>
                    </span>
                    <span className="city-card-cost">
                      🪙 {def.coins}
                      <small>je Kachel</small>
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  className={`city-card${erase ? ' is-on' : ''}`}
                  onClick={() => {
                    setErase(true)
                    setMode('road')
                    haptic('tick')
                  }}
                >
                  <span className="city-card-emoji">🧹</span>
                  <span className="city-card-body">
                    <strong>Aufnehmen</strong>
                    <span>Straße entfernen, die Hälfte kommt zurück</span>
                  </span>
                </button>
              </li>
            </ul>
            <p className="city-hint">
              Nach der Wahl schließt sich das Menü, damit du freie Sicht auf die Karte hast. Mit zwei Fingern zoomst du
              auch beim Ziehen.
            </p>
          </div>
        )}

        {mode === 'land' && step && (
          <div className="city-detail">
            <div className="city-detail-head">
              <span className="city-card-emoji">🗺️</span>
              <span className="city-card-body">
                <strong>Gebiet erweitern</strong>
                <span>
                  {city.land} × {city.land} → {step.land} × {step.land} Kacheln
                </span>
              </span>
              <button className="city-close" aria-label="Schließen" onClick={() => setMode('view')}>
                <IconClose />
              </button>
            </div>
            <ul className="city-effects">
              <li>
                🏙️ Stadt-Stufe <strong>{step.level}</strong>
              </li>
              <li>
                🪙 <strong>{step.coins.toLocaleString('de-DE')}</strong>
              </li>
              <li>
                🧱 <strong>{step.materials}</strong>
              </li>
            </ul>
            {expandOk && !expandOk.ok && <p className="city-hint">{expandOk.reason}</p>}
            <div className="city-place-row">
              <button className="city-btn" onClick={() => setMode('view')}>
                Später
              </button>
              <button className="city-btn city-btn-main" onClick={doExpand}>
                <IconCheck /> Erweitern
              </button>
            </div>
          </div>
        )}

        {cycle && (
          <div className="city-detail">
            <div className="city-detail-head">
              <span className="city-card-emoji">🕒</span>
              <span className="city-card-body">
                <strong>Während du weg warst</strong>
                <span>
                  {cycle.cycles} {cycle.cycles === 1 ? 'Zyklus' : 'Zyklen'} à 3 Stunden
                </span>
              </span>
            </div>
            <ul className="city-effects">
              {cycle.income.map((part) => (
                <li key={part.label}>
                  {part.label} <strong>{part.value > 0 ? `+${part.value}` : part.value}</strong>
                </li>
              ))}
            </ul>
            <p className="city-summary">
              🪙 <strong>+{cycle.coins.toLocaleString('de-DE')}</strong> Münzen
              {cycle.movedIn > 0 && (
                <>
                  {' · '}👥 <strong>+{cycle.movedIn}</strong> zugezogen
                </>
              )}
              {cycle.movedOut > 0 && (
                <>
                  {' · '}👋 <strong>−{cycle.movedOut}</strong> weggezogen
                </>
              )}
            </p>
            {cycle.gebaut.length > 0 && (
              <p className="city-hint">🏡 Zugezogene haben gebaut: {zusammenfassen(cycle.gebaut)}.</p>
            )}
            {cycle.meldungen.length > 0 && (
              <ul className="city-problems">
                {cycle.meldungen.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            )}
            {cycle.movedOut > 0 && (
              <p className="city-hint">
                Bürger ziehen weg, wenn die Stimmung unter 35 % fällt – oder wenn ihnen die Steuern zu hoch sind.
              </p>
            )}
            <div className="city-place-row">
              <button className="city-btn city-btn-main" onClick={() => setCycle(null)}>
                <IconCheck /> Weiter
              </button>
            </div>
          </div>
        )}

        {mode === 'report' && !cycle && (
          <div className="city-sheet">
            <div className="city-sheet-head">
              <strong>🏛️ Rathaus · Stadtbericht</strong>
              <button
                className="city-close"
                aria-label="Schließen"
                onClick={() => {
                  setSelected(null)
                  setMode('view')
                }}
              >
                <IconClose />
              </button>
            </div>
            <div className="city-list">
              <p className="city-hint">
                {cityTitle(city.level)} · Stufe {city.level} · Rathaus-Ausbau {rathausVon(city)?.level ?? 1} von{' '}
                {maxLevel(buildingDef(RATHAUS)!)}. Das Rathaus wächst alle drei Stadt-Stufen um einen Anbau.
              </p>

              <p className="city-label-line">😊 Stimmung {stats.happiness} %</p>
              <ul className="city-effects">
                {happinessBreakdown(city).parts.map((part) => (
                  <li key={part.label}>
                    {part.label} <strong>{part.value > 0 ? `+${part.value}` : part.value}</strong>
                  </li>
                ))}
              </ul>

              <p className="city-label-line">🪙 Einnahmen je Zyklus</p>
              <ul className="city-effects">
                {incomeBreakdown(city).parts.map((part) => (
                  <li key={part.label}>
                    {part.label} <strong>{part.value > 0 ? `+${part.value}` : part.value}</strong>
                  </li>
                ))}
                <li>
                  Zusammen <strong>{incomeBreakdown(city).total}</strong>
                </li>
              </ul>

              <p className="city-label-line">💸 Steuern</p>
              <div className="city-steuer">
                <div className="city-steuer-zeile">
                  <strong>{city.tax} %</strong>
                  <span>
                    {incomeBreakdown(city).total.toLocaleString('de-DE')} 🪙 je Zyklus · Stimmung {stats.happiness} %
                  </span>
                </div>
                <input
                  className="city-regler"
                  type="range"
                  min={STEUER_MIN}
                  max={STEUER_MAX}
                  step={1}
                  value={city.tax}
                  aria-label="Steuersatz in Prozent"
                  onChange={(event) => {
                    const satz = Number(event.target.value)
                    setState((current) => (current.city ? { ...current, city: setTax(current.city, satz) } : current))
                    haptic('tick', { minGap: 60 })
                  }}
                />
                <p className="city-hint">
                  Niedrige Steuern machen froh, hohe füllen die Kasse. Ab 12 % ziehen die ersten Reichen weg, ab 20 % wird es für
                  viele eng.
                </p>
              </div>

              <p className="city-label-line">👥 Wer hier wohnt</p>
              {(() => {
                const g = gesellschaft(city)
                const summe = Math.max(1, KLASSEN.reduce((n, k) => n + g.klassen[k], 0))
                return (
                  <div className="city-gesellschaft">
                    <div className="city-klassen">
                      {KLASSEN.map((k) => (
                        <span key={k} className={`city-klasse klasse-${k}`}>
                          <strong>{g.klassen[k].toLocaleString('de-DE')}</strong>
                          {KLASSE_NAME[k]}
                        </span>
                      ))}
                    </div>
                    <div className="city-klassen-balken" aria-hidden="true">
                      {KLASSEN.map((k) => (
                        <span key={k} className={`klasse-${k}`} style={{ width: `${(g.klassen[k] / summe) * 100}%` }} />
                      ))}
                    </div>
                    <ul className="city-effects">
                      {g.reichster && (
                        <li>
                          💎 Reichste Person <strong>{g.reichster.name}</strong>
                        </li>
                      )}
                      {g.reichster && (
                        <li>
                          Vermögen <strong>{euro(g.reichster.vermoegen)}</strong>
                        </li>
                      )}
                      <li>
                        💎 Milliardäre <strong>{g.milliardaere}</strong>
                      </li>
                      <li>
                        🛏️ Obdachlos <strong>{g.obdachlose}</strong>
                      </li>
                      <li>
                        💼 Arbeitslos <strong>{g.arbeitslose}</strong>
                      </li>
                      <li>
                        🎓 Bildung <strong>{g.bildung} %</strong>
                      </li>
                    </ul>
                  </div>
                )
              })()}

              <p className="city-label-line">🚨 Sicherheit und Versorgung</p>
              {(() => {
                const g = gesellschaft(city)
                const zeilen: [string, number, string][] = [
                  ['Kriminalität', g.kriminalitaet, g.kriminalitaet >= 40 ? '#ff5f7a' : g.kriminalitaet >= 20 ? '#ffb020' : '#3ce08a'],
                  ['🚓 Polizei', Math.round(g.abdeckung.polizei * 100), '#2e86ff'],
                  ['🚒 Feuerwehr', Math.round(g.abdeckung.feuer * 100), '#ff5a1f'],
                  ['🏥 Ärzte', Math.round(g.abdeckung.gesundheit * 100), '#e8f4ff'],
                ]
                return (
                  <div className="city-sicherheit">
                    {zeilen.map(([name, wert, farbe]) => (
                      <div key={name} className="city-sicherheit-zeile">
                        <span>{name}</span>
                        <span className="bar">
                          <span style={{ width: `${wert}%`, background: farbe }} />
                        </span>
                        <strong>{wert} %</strong>
                      </div>
                    ))}
                    <p className="city-hint">Polizei, Feuerwehr und Ärzte: Anteil der Wohnungen in Reichweite einer Wache.</p>
                    <button
                      className={`city-btn${krimKarte ? ' city-btn-main' : ''}`}
                      onClick={() => {
                        setKrimKarte((an) => !an)
                        haptic('tick')
                      }}
                    >
                      {krimKarte ? '✓ Kriminalität auf der Karte' : '🗺️ Kriminalität auf der Karte zeigen'}
                    </button>
                  </div>
                )
              })()}

              <p className="city-label-line">🧠 Dein Wissen baut die Stadt</p>
              <ul className="city-knowledge">
                {DOMAINS.map((domain) => {
                  const stand = knowledgeLevel(pointsOf(data, domain.id))
                  return (
                    <li key={domain.id}>
                      <span>
                        {domain.emoji} {domain.name}
                      </span>
                      <strong>Stufe {stand.level}</strong>
                      <span className="bar">
                        <span
                          style={{
                            width: `${Math.min(100, (stand.into / stand.need) * 100)}%`,
                            background: domain.color,
                          }}
                        />
                      </span>
                    </li>
                  )
                })}
              </ul>

              <p className="city-label-line">🏚️ Wohnen und Leerstand</p>
              <ul className="city-effects">
                <li>
                  👥 Bewohner <strong>{stats.population.toLocaleString('de-DE')}</strong>
                </li>
                <li>
                  🏠 Wohnraum <strong>{stats.capacity.toLocaleString('de-DE')}</strong>
                </li>
                <li>
                  😠 Häuser mit Beschwerden <strong>{beschwerdenVon(city)}</strong>
                </li>
                <li>
                  🏚️ Leerstehende Häuser <strong>{leerstandVon(city)}</strong>
                </li>
              </ul>
              <p className="city-hint">
                Wer sich beschwert, zieht nach ein paar Minuten aus, wenn sich nichts ändert. Das Haus bleibt als Ruine stehen –
                du kannst es sanieren oder abreißen.
              </p>

              <p className="city-label-line">
                👥 {stats.population.toLocaleString('de-DE')} von {stats.capacity.toLocaleString('de-DE')} Plätzen belegt
              </p>
              {problemsOf(city).length > 0 ? (
                <ul className="city-problems">
                  {problemsOf(city).map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              ) : (
                <p className="city-hint">In deiner Stadt läuft gerade alles rund.</p>
              )}

              <p className="city-label-line">🎨 Aussehen der Stadt</p>
              <div className="city-themes">
                {THEMES.map((entry) => (
                  <button
                    key={entry.id}
                    className={`city-theme${city.theme === entry.id ? ' is-on' : ''}`}
                    onClick={() => {
                      haptic('tick')
                      setState((current) => (current.city ? { ...current, city: setTheme(current.city, entry.id) } : current))
                    }}
                  >
                    <span className="city-theme-emoji">{entry.emoji}</span>
                    <span>{entry.name}</span>
                  </button>
                ))}
              </div>

              <p className="city-label-line">✏️ Name, Wahlspruch und Wappen</p>
              <div className="city-rename">
                <input
                  className="city-input"
                  value={newName}
                  maxLength={24}
                  aria-label="Name der Stadt"
                  onChange={(event) => setNewName(event.target.value)}
                />
                <input
                  className="city-input"
                  value={newMotto}
                  maxLength={60}
                  placeholder="Wahlspruch"
                  aria-label="Wahlspruch"
                  onChange={(event) => setNewMotto(event.target.value)}
                />
                <div className="city-emblems">
                  {EMBLEMS.map((entry) => (
                    <button
                      key={entry}
                      className={`city-emblem${entry === city.emblem ? ' is-on' : ''}`}
                      aria-pressed={entry === city.emblem}
                      onClick={() => {
                        haptic('tick')
                        setState((current) =>
                          current.city
                            ? { ...current, city: rename(current.city, newName, newMotto, entry) }
                            : current,
                        )
                      }}
                    >
                      {entry}
                    </button>
                  ))}
                </div>
                <button
                  className="city-btn city-btn-main"
                  onClick={() => {
                    haptic('success')
                    setState((current) =>
                      current.city
                        ? { ...current, city: rename(current.city, newName, newMotto, current.city.emblem) }
                        : current,
                    )
                  }}
                >
                  <IconCheck /> Übernehmen
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === 'place' && pick && (
          <div className="city-place">
            <p className="city-place-text">
              {movingId ? 'Tippe auf den neuen Platz.' : `Tippe auf die Karte, wo ${buildingDef(pick)?.name} stehen soll.`}
            </p>
            <div className="city-place-row">
              <button className="city-btn" onClick={cancel}>
                Abbrechen
              </button>
              <button className="city-btn" onClick={rotate}>
                ↻ Drehen
              </button>
              <button className="city-btn city-btn-main" onClick={confirm}>
                <IconCheck /> {movingId ? 'Hierhin' : 'Bauen'}
              </button>
            </div>
          </div>
        )}

        {mode === 'select' && chosen && chosenDef && (
          <div className="city-detail">
            <div className="city-detail-head">
              <span className="city-card-emoji">{chosen.verlassen ? '🏚️' : chosenDef.emoji}</span>
              <span className="city-card-body">
                <strong>{chosen.verlassen ? `${chosenDef.name} – verlassen` : chosenDef.name}</strong>
                <span>
                  {chosen.verlassen
                    ? `Leer seit ${dauerText(Date.now() - chosen.verlassen)}`
                    : `Stufe ${chosen.level} von ${maxLevel(chosenDef)}`}
                </span>
              </span>
              <button
                className="city-close"
                aria-label="Schließen"
                onClick={() => {
                  setSelected(null)
                  setMode('view')
                }}
              >
                <IconClose />
              </button>
            </div>
            {chosen.verlassen ? (
              <p className="city-hint">
                🏚️ Die Bewohner sind ausgezogen. Das Haus bringt nichts mehr, zieht Gesindel an und drückt die Stimmung der Nachbarn.
                Sanieren kostet die Hälfte des Neupreises – danach ziehen wieder Menschen ein, wenn die Wohnlage stimmt.
              </p>
            ) : (
              <ul className="city-effects">
                {wirkungsListe(effectsOf(chosenDef, chosen.level)).map(([label, wert]) => (
                  <li key={label}>
                    {label} <strong>{wert}</strong>
                  </li>
                ))}
                {nextUpgrade(chosenDef, chosen.level) && chosen.type !== RATHAUS && (
                  <li className="city-naechste-stufe">
                    ⬆ Nächste Stufe:{' '}
                    {wirkungsListe(nextUpgrade(chosenDef, chosen.level)!.effects)
                      .filter(([l]) => /Einnahmen|Schwarzgeld|Wohnraum|Arbeit|Bildung|Reichweite/.test(l))
                      .slice(0, 3)
                      .map(([l, w]) => `${l.replace(/^\S+\s/, '')} ${w}`)
                      .join(' · ')}
                  </li>
                )}
              </ul>
            )}
            {!chosen.verlassen && chosenDef.category === 'wohnen' && chosenDef.effects.capacity && (
              <WohnlageZeile city={city} placed={chosen} stimmung={stats.happiness} />
            )}
            {!chosen.verlassen && chosenDef.category === 'wohnen' && chosenDef.effects.klasse && (
              <ul className="city-bewohner">
                {[0, 1].map((nr) => {
                  const b = bewohnerVon(chosen, nr, chosenDef.effects.klasse!)
                  return (
                    <li key={nr}>
                      <span>👤 {b.name}</span>
                      <strong>{euro(b.vermoegen)}</strong>
                    </li>
                  )
                })}
                <li className="city-bewohner-klasse">{WOHNLAGE[chosenDef.effects.klasse]}</li>
              </ul>
            )}
            {chosen.auto && !chosen.verlassen && <p className="city-hint">🏡 Von Zugezogenen selbst gebaut.</p>}
            {chosenDef.category === 'unterwelt' && (
              <p className="city-hint">
                {razziaMoeglich(city, chosen)
                  ? chosen.level > 1
                    ? '🚔 Eine Polizeiwache ist in Reichweite – bei einer Razzia verliert der Betrieb eine Ausbaustufe.'
                    : '🚔 Eine Polizeiwache ist in Reichweite – hier droht eine Razzia.'
                  : '🕶️ Keine Polizei in Reichweite. Noch.'}
              </p>
            )}
            {chosen.type === RATHAUS ? (
              <div className="city-place-row">
                <button className="city-btn" onClick={startMoving}>
                  ✥ Versetzen
                </button>
                <button className="city-btn city-btn-main" onClick={() => setMode('report')}>
                  📊 Stadtbericht
                </button>
              </div>
            ) : chosen.verlassen ? (
              <div className="city-place-row">
                <button className="city-btn city-btn-main" onClick={doSanieren}>
                  🔨 Sanieren · 🪙 {sanierungsKosten(chosen).coins}
                  {sanierungsKosten(chosen).materials > 0 && ` · 🧱 ${sanierungsKosten(chosen).materials}`}
                </button>
                <button className="city-btn city-btn-bad" onClick={doRemove}>
                  Abreißen
                </button>
              </div>
            ) : (
              <div className="city-place-row">
                <button className="city-btn" onClick={startMoving}>
                  ✥ Versetzen
                </button>
                {nextUpgrade(chosenDef, chosen.level) ? (
                  <button className="city-btn city-btn-main" onClick={doUpgrade}>
                    ⬆ Ausbauen · 🪙 {nextUpgrade(chosenDef, chosen.level)?.coins.toLocaleString('de-DE')}
                  </button>
                ) : (
                  <span className="city-btn is-flat">Voll ausgebaut</span>
                )}
                <button className="city-btn city-btn-bad" onClick={doRemove}>
                  Abreißen
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <button className="city-foot" onClick={zumRathaus} aria-label="Zum Rathaus – dort steht der Stadtbericht">
        <span className="bar">
          <span style={{ width: `${Math.min(100, (progress.into / progress.need) * 100)}%` }} />
        </span>
        <span className="city-foot-text">
          🏛️ Stadtbericht im Rathaus · 😊 {stats.happiness}% · 🪙 {stats.income}/Zyklus
          {beschwerdenVon(city) > 0 && ` · 😠 ${beschwerdenVon(city)}`}
          {leerstandVon(city) > 0 && ` · 🏚️ ${leerstandVon(city)}`}
        </span>
      </button>
    </main>
  )
}

/** Die Wohnlage eines Hauses, aufgeschlüsselt – und ob die Bewohner murren */
function WohnlageZeile({ city, placed, stimmung }: { city: NonNullable<SaveData['city']>; placed: Placed; stimmung: number }) {
  const lage = wohnlageVon(city, placed, stimmung)
  const farbe = lage.wert >= 48 ? '#3ce08a' : lage.wert >= 38 ? '#ffb020' : '#ff5f7a'
  const rest = placed.beschwerde ? Math.max(0, AUSZUG_NACH - (Date.now() - placed.beschwerde.seit)) : 0
  return (
    <div className="city-wohnlage">
      <div className="city-sicherheit-zeile">
        <span>🏡 Wohnlage</span>
        <span className="bar">
          <span style={{ width: `${lage.wert}%`, background: farbe }} />
        </span>
        <strong>{lage.wert} %</strong>
      </div>
      <ul className="city-effects">
        {lage.parts.map((part) => (
          <li key={part.label}>
            {part.label} <strong>{part.value > 0 ? `+${part.value}` : part.value}</strong>
          </li>
        ))}
      </ul>
      {placed.beschwerde ? (
        <p className="city-hint city-hint-warn">
          😠 Die Bewohner beschweren sich über {placed.beschwerde.grund}. Ändert sich nichts, ziehen sie in etwa{' '}
          {dauerText(rest)} aus.
        </p>
      ) : lage.wert < 48 ? (
        <p className="city-hint">Die Wohnlage ist knapp. Sinkt sie unter 38 %, beginnen die Beschwerden.</p>
      ) : null}
    </div>
  )
}

/** "3 Minuten", "40 Sekunden", "2 Stunden" */
function dauerText(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s} Sekunden`
  const m = Math.round(s / 60)
  if (m < 60) return m === 1 ? 'einer Minute' : `${m} Minuten`
  const h = Math.round(m / 60)
  if (h < 48) return h === 1 ? 'einer Stunde' : `${h} Stunden`
  return `${Math.round(h / 24)} Tagen`
}

/** Was ein Gebäude bewirkt, lesbar – Klasse und Reichweiten eigens beschrieben */
function wirkungsListe(e: ReturnType<typeof effectsOf>): [string, string][] {
  const zahl = (n: number) => (n > 0 ? `+${n}` : String(n))
  const liste: [string, string][] = []
  if (e.capacity) liste.push(['👥 Wohnraum', zahl(e.capacity)])
  if (e.jobs) liste.push(['💼 Arbeit', zahl(e.jobs)])
  if (e.income) liste.push([e.income > 0 ? '🪙 Einnahmen' : '🪙 Unterhalt', zahl(e.income)])
  if (e.black) liste.push(['💰 Schwarzgeld', zahl(e.black)])
  if (e.education) liste.push(['🎓 Bildung', zahl(e.education)])
  if (e.happiness) liste.push(['😊 Stimmung', zahl(e.happiness)])
  if (e.environment) liste.push(['🌳 Umwelt', zahl(e.environment)])
  if (e.crime) liste.push(['🚨 Kriminalität ringsum', zahl(e.crime)])
  if (e.police) liste.push(['🚓 Reichweite', `${e.police} Kacheln`])
  if (e.fire) liste.push(['🚒 Reichweite', `${e.fire} Kacheln`])
  if (e.health) liste.push(['🏥 Reichweite', `${e.health} Kacheln`])
  return liste
}

const WOHNLAGE: Record<string, string> = {
  arm: 'Einfache Wohnlage',
  mittel: 'Mittlere Wohnlage',
  reich: 'Gehobene Wohnlage',
  superreich: 'Luxuslage',
}

/** "2× Doppelhaus, Bungalow" */
function zusammenfassen(namen: string[]): string {
  const zahl = new Map<string, number>()
  for (const n of namen) zahl.set(n, (zahl.get(n) ?? 0) + 1)
  return [...zahl.entries()].map(([n, k]) => (k > 1 ? `${k}× ${n}` : n)).join(', ')
}
