import { useEffect, useRef, useState } from 'react'
import { IconBack, IconCheck, IconClose } from '../components/Icons'
import {
  CATEGORIES,
  ROADS,
  buildingDef,
  effectsOf,
  footprint,
  maxLevel,
  nextUpgrade,
  type Category,
} from '../city/catalog'
import { toTile } from '../city/iso'
import { cityFrame, drawCity, type Camera } from '../city/render'
import {
  available,
  canPlace,
  cityTitle,
  createCity,
  expand,
  expansionCheck,
  levelProgress,
  moveTo,
  nextExpansion,
  pave,
  paveCost,
  place,
  remove,
  roadKey,
  statsOf,
  unpave,
  upgrade,
} from '../city/state'
import { haptic } from '../haptics'
import { goBack } from '../router'
import { setState } from '../store'
import type { SaveData } from '../types'

const EMBLEMS = ['🏙️', '🌆', '🏛️', '🌳', '⚓', '⛰️', '🔭', '🎓', '🚀', '🦉']

type Mode = 'view' | 'build' | 'place' | 'select' | 'road' | 'land'

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

  const [mode, setMode] = useState<Mode>('view')
  const [category, setCategory] = useState<Category>('wohnen')
  const [pick, setPick] = useState<string | null>(null)
  const [ghost, setGhost] = useState({ x: 0, y: 0, rot: 0 as 0 | 1 | 2 | 3 })
  const [movingId, setMovingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [roadType, setRoadType] = useState('strasse')
  const [erase, setErase] = useState(false)

  const canvas = useRef<HTMLCanvasElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const size = useRef({ w: 320, h: 480 })
  const camera = useRef<Camera>({ x: 0, y: 0, zoom: 1 })
  const framed = useRef(false)
  const stroke = useRef<string[]>([])
  const live = useRef({ city, mode, ghost, pick, selected, movingId, roadType, erase })
  live.current = { city, mode, ghost, pick, selected, movingId, roadType, erase }

  const say = (text: string | null) => {
    setNotice(text)
    if (text) haptic('error')
  }

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
        camera.current = cityFrame(live.current.city, size.current)
        framed.current = true
      }
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(box)

    let raf = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const state = live.current
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
              }).ok,
            }
          : null
      drawCity(ctx, state.city, camera.current, size.current, {
        ghost: shown,
        paint: state.mode === 'road' ? { tiles: stroke.current, type: state.roadType, adding: !state.erase } : null,
        selected: state.selected,
        buildMode: state.mode !== 'view' && state.mode !== 'select',
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
    let moved = 0
    let pinch = 0
    let startZoom = 1
    let painting = false

    const tileAt = (clientX: number, clientY: number) => {
      const rect = box.getBoundingClientRect()
      const cam = camera.current
      const wx = (clientX - rect.left - size.current.w / 2) / cam.zoom + cam.x
      const wy = (clientY - rect.top - size.current.h / 2) / cam.zoom + cam.y
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
      points.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (points.size === 1) {
        moved = 0
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
        painting = false
        stroke.current = []
      }
    }

    const move = (event: PointerEvent) => {
      const previous = points.get(event.pointerId)
      if (!previous) return
      points.set(event.pointerId, { x: event.clientX, y: event.clientY })

      if (points.size >= 2) {
        const [a, b] = [...points.values()]
        const spread = Math.hypot(a.x - b.x, a.y - b.y)
        if (pinch > 0 && spread > 0) camera.current.zoom = Math.max(0.45, Math.min(2.4, (startZoom * spread) / pinch))
        moved = 999
        return
      }

      if (painting) {
        addToStroke(event.clientX, event.clientY)
        return
      }

      const dx = event.clientX - previous.x
      const dy = event.clientY - previous.y
      moved += Math.abs(dx) + Math.abs(dy)
      if (moved < 8) return
      camera.current.x -= dx / camera.current.zoom
      camera.current.y -= dy / camera.current.zoom
      const limit = live.current.city.land * 64
      camera.current.x = Math.max(-limit, Math.min(limit, camera.current.x))
      camera.current.y = Math.max(-140, Math.min(live.current.city.land * 32 + 240, camera.current.y))
    }

    const up = (event: PointerEvent) => {
      const had = points.delete(event.pointerId)
      if (points.size > 0) {
        pinch = 0
        return
      }
      if (painting) {
        finishStroke()
        return
      }
      if (!had || moved >= 8) return

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

      const hit = [...state.city.buildings]
        .sort((a, b) => b.x + b.y - (a.x + a.y))
        .find((placed) => {
          const def = buildingDef(placed.type)
          if (!def) return false
          const [w, h] = footprint(def, placed.rot)
          return tile.x >= placed.x && tile.x < placed.x + w && tile.y >= placed.y && tile.y < placed.y + h
        })
      if (hit) {
        setSelected(hit.id)
        setMode('select')
        haptic('soft')
      } else {
        setSelected(null)
        if (state.mode === 'select') setMode('view')
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
    const check = canPlace(city, type, 0, 0, 0)
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
        current.city ? { ...current, city: place(current.city, type, ghost.x, ghost.y, ghost.rot) } : current,
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
    if (!chosen) return
    const id = chosen.id
    haptic('strong')
    setState((current) => (current.city ? { ...current, city: remove(current.city, id) } : current))
    setSelected(null)
    setMode('view')
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

  const list = available(city).filter((def) => def.category === category)
  const expandOk = step ? expansionCheck(city) : null

  return (
    <main className="city">
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

        {notice && (
          <p className="city-notice" role="status">
            {notice}
          </p>
        )}

        {mode === 'view' && (
          <div className="city-bar">
            <button className="city-btn city-btn-main" onClick={() => setMode('build')}>
              🏗️ Bauen
            </button>
            <button
              className="city-btn"
              onClick={() => {
                setMode('road')
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
          <div className="city-sheet">
            <div className="city-sheet-head">
              <strong>Bauen</strong>
              <button className="city-close" aria-label="Schließen" onClick={() => setMode('view')}>
                <IconClose />
              </button>
            </div>
            <div className="city-tabs">
              {CATEGORIES.map((entry) => (
                <button
                  key={entry.id}
                  className={`city-tab${entry.id === category ? ' is-on' : ''}`}
                  onClick={() => {
                    setCategory(entry.id)
                    haptic('tick')
                  }}
                >
                  {entry.emoji} {entry.name}
                </button>
              ))}
            </div>
            <ul className="city-list">
              {list.map((def) => {
                const tooPoor = city.coins < def.coins || city.materials < def.materials
                return (
                  <li key={def.id}>
                    <button className={`city-card${tooPoor ? ' is-poor' : ''}`} onClick={() => startPlacing(def.id)}>
                      <span className="city-card-emoji">{def.emoji}</span>
                      <span className="city-card-body">
                        <strong>{def.name}</strong>
                        <span>{def.note}</span>
                      </span>
                      <span className="city-card-cost">
                        🪙 {def.coins}
                        {def.materials > 0 && <small>🧱 {def.materials}</small>}
                      </span>
                    </button>
                  </li>
                )
              })}
              {list.length === 0 && (
                <li className="city-empty">Hier gibt es noch nichts. Lass deine Stadt weiter wachsen.</li>
              )}
            </ul>
            <p className="city-hint">Gesperrte Bauwerke erscheinen, sobald deine Stadt die nötige Stufe hat.</p>
          </div>
        )}

        {mode === 'road' && (
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
                    setErase(!erase)
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
              Zieh mit dem Finger über die Karte. Mit zwei Fingern zoomst du auch hier.
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
              <span className="city-card-emoji">{chosenDef.emoji}</span>
              <span className="city-card-body">
                <strong>{chosenDef.name}</strong>
                <span>
                  Stufe {chosen.level} von {maxLevel(chosenDef)}
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
            <ul className="city-effects">
              {Object.entries(effectsOf(chosenDef, chosen.level)).map(([key, value]) => (
                <li key={key}>
                  {EFFECT_LABEL[key] ?? key} <strong>{value > 0 ? `+${value}` : value}</strong>
                </li>
              ))}
            </ul>
            <div className="city-place-row">
              <button className="city-btn" onClick={startMoving}>
                ✥ Versetzen
              </button>
              {nextUpgrade(chosenDef, chosen.level) ? (
                <button className="city-btn city-btn-main" onClick={doUpgrade}>
                  ⬆ Ausbauen · 🪙 {nextUpgrade(chosenDef, chosen.level)?.coins}
                </button>
              ) : (
                <span className="city-btn is-flat">Voll ausgebaut</span>
              )}
              <button className="city-btn city-btn-bad" onClick={doRemove}>
                Abreißen
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="city-foot">
        <span className="bar">
          <span style={{ width: `${Math.min(100, (progress.into / progress.need) * 100)}%` }} />
        </span>
        <span className="city-foot-text">
          😊 {stats.happiness}% · 🎓 {stats.education} · 🌳 {stats.environment}% · 🛣️{' '}
          {Object.keys(city.roads).length} · 🏗️ {stats.buildings}
        </span>
      </div>
    </main>
  )
}

const EFFECT_LABEL: Record<string, string> = {
  capacity: '👥 Wohnraum',
  happiness: '😊 Stimmung',
  education: '🎓 Bildung',
  environment: '🌳 Umwelt',
  income: '🪙 Einnahmen',
  jobs: '💼 Arbeit',
}
