import { kursById } from './lernen/kurse'
import { isContinentId } from './quiz'
import type { Mode, Route } from './types'

const SLUG: Record<Mode, string> = { practice: 'uebung', test: 'test' }
const MODE_BY_SLUG: Partial<Record<string, Mode>> = { uebung: 'practice', test: 'test' }
const FLAGS = 'flaggen'

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/'
    case 'settings':
      return '#/einstellungen'
    case 'specific':
      return '#/waehlen'
    case 'mathRunner':
      return '#/math'
    case 'city':
      return '#/stadt'
    case 'run':
      return '#/run'
    case 'runResult':
      return '#/run/ergebnis'
    case 'mode':
      return `#/m/${route.id}`
    case 'continent':
      return `#/m/${FLAGS}/${route.id}`
    case 'quiz':
      return `#/m/${FLAGS}/${route.id}/${SLUG[route.mode]}`
    case 'result':
      return `#/m/${FLAGS}/${route.id}/${SLUG[route.mode]}/ergebnis`
    case 'kurs':
      return `#/lernen/${route.id}`
    case 'kursSitzung':
      return '#/lernen/session'
    case 'kursErgebnis':
      return '#/lernen/bilanz'
    case 'bitte':
      return '#/stadt/bitte'
  }
}

/** null, wenn die Adresse gar keinen App-Pfad enthält */
export function hashToRoute(hash: string): Route | null {
  if (!hash || hash === '#') return null
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  const [first, second, third, fourth] = parts
  if (!first) return { name: 'home' }
  if (first === 'einstellungen') return { name: 'settings' }
  if (first === 'waehlen') return { name: 'specific' }
  if (first === 'math') return { name: 'mathRunner' }
  if (first === 'stadt') return second === 'bitte' ? { name: 'bitte' } : { name: 'city' }
  if (first === 'lernen') {
    if (second === 'session') return { name: 'kursSitzung' }
    if (second === 'bilanz') return { name: 'kursErgebnis' }
    return second && kursById(second) ? { name: 'kurs', id: second } : { name: 'home' }
  }
  if (first === 'run') return second === 'ergebnis' ? { name: 'runResult' } : { name: 'run' }

  if (first === 'm') {
    if (!second) return { name: 'specific' }
    if (second !== FLAGS || !third) return { name: 'mode', id: second }
    return flagsRoute(third, fourth)
  }

  // alte Adressen aus der ersten Version: #/europa/uebung
  if (isContinentId(first)) return flagsRoute(first, second, parts[2])
  return { name: 'home' }
}

function flagsRoute(continent: string, modeSlug?: string, tail?: string): Route {
  if (!isContinentId(continent)) return { name: 'mode', id: FLAGS }
  const mode = modeSlug ? MODE_BY_SLUG[modeSlug] : undefined
  if (!mode) return { name: 'continent', id: continent }
  return tail === 'ergebnis' ? { name: 'result', id: continent, mode } : { name: 'quiz', id: continent, mode }
}

export function isRoute(value: unknown): value is Route {
  if (typeof value !== 'object' || value === null) return false
  const route = value as Record<string, unknown>
  switch (route.name) {
    case 'home':
    case 'settings':
    case 'specific':
    case 'mathRunner':
    case 'city':
    case 'run':
    case 'runResult':
    case 'kursSitzung':
    case 'kursErgebnis':
    case 'bitte':
      return true
    case 'kurs':
      return typeof route.id === 'string' && !!kursById(route.id)
    case 'mode':
      return typeof route.id === 'string' && route.id.length > 0
    case 'continent':
      return isContinentId(route.id)
    case 'quiz':
    case 'result':
      return isContinentId(route.id) && (route.mode === 'practice' || route.mode === 'test')
    default:
      return false
  }
}

/** Die Seiten „darunter“ – daraus wird beim Wiedereröffnen der Zurück-Verlauf aufgebaut */
export function parentsOf(route: Route): Route[] {
  switch (route.name) {
    case 'home':
      return []
    case 'settings':
    case 'specific':
    case 'mathRunner':
    case 'city':
    case 'run':
    case 'runResult':
    case 'kurs':
    case 'kursSitzung':
    case 'kursErgebnis':
      return [{ name: 'home' }]
    case 'bitte':
      return [{ name: 'home' }, { name: 'city' }]
    case 'mode':
      return [{ name: 'home' }, { name: 'specific' }]
    case 'continent':
      return [{ name: 'home' }, { name: 'specific' }, { name: 'mode', id: FLAGS }]
    case 'quiz':
    case 'result':
      return [
        { name: 'home' },
        { name: 'specific' },
        { name: 'mode', id: FLAGS },
        { name: 'continent', id: route.id },
      ]
  }
}

export const sameRoute = (a: Route, b: Route) => routeToHash(a) === routeToHash(b)
