import { isContinentId } from './quiz'
import type { Mode, Route } from './types'

const SLUG: Record<Mode, string> = { practice: 'uebung', test: 'test' }
const MODE_BY_SLUG: Partial<Record<string, Mode>> = { uebung: 'practice', test: 'test' }

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/'
    case 'settings':
      return '#/einstellungen'
    case 'continent':
      return `#/${route.id}`
    case 'quiz':
      return `#/${route.id}/${SLUG[route.mode]}`
    case 'result':
      return `#/${route.id}/${SLUG[route.mode]}/ergebnis`
  }
}

/** null, wenn die Adresse gar keinen App-Pfad enthält */
export function hashToRoute(hash: string): Route | null {
  if (!hash || hash === '#') return null
  const [first, second, third, ...rest] = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (!first) return { name: 'home' }
  if (first === 'einstellungen') return { name: 'settings' }
  if (!isContinentId(first)) return { name: 'home' }
  const mode = second ? MODE_BY_SLUG[second] : undefined
  if (!mode || rest.length > 0) return { name: 'continent', id: first }
  if (!third) return { name: 'quiz', id: first, mode }
  return third === 'ergebnis' ? { name: 'result', id: first, mode } : { name: 'continent', id: first }
}

export function isRoute(value: unknown): value is Route {
  if (typeof value !== 'object' || value === null) return false
  const route = value as Record<string, unknown>
  switch (route.name) {
    case 'home':
    case 'settings':
      return true
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
    case 'continent':
      return [{ name: 'home' }]
    case 'quiz':
    case 'result':
      return [{ name: 'home' }, { name: 'continent', id: route.id }]
  }
}

export const sameRoute = (a: Route, b: Route) => routeToHash(a) === routeToHash(b)
