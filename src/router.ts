// Hash-Routing: Die Zurück-Geste des Handys funktioniert, und die aktuelle Seite
// wird zusätzlich im Fortschritt gespeichert, damit die App genau dort wieder aufgeht.
import { hashToRoute, parentsOf, routeToHash, sameRoute } from './routes'
import { getState, setState } from './store'
import type { Route } from './types'

/** Position im App-Verlauf – 0 heißt: hinter uns liegt keine App-Seite */
let depth = 0

const readDepth = () => {
  const value = (history.state as { depth?: unknown } | null)?.depth
  return typeof value === 'number' ? value : 0
}

const applyRoute = (route: Route) => setState((data) => (sameRoute(data.route, route) ? data : { ...data, route }))

export function navigate(route: Route, { replace = false } = {}) {
  if (replace) {
    history.replaceState({ depth }, '', routeToHash(route))
  } else {
    depth += 1
    history.pushState({ depth }, '', routeToHash(route))
  }
  applyRoute(route)
}

export function goBack(fallback: Route) {
  if (depth > 0) history.back()
  else navigate(fallback, { replace: true })
}

export function initRouter() {
  const fromUrl = hashToRoute(location.hash)
  if (fromUrl) {
    // Neu geladen oder Tab wiederhergestellt: Die Adresse gibt die Seite vor
    depth = readDepth()
    history.replaceState({ depth }, '', routeToHash(fromUrl))
    applyRoute(fromUrl)
  } else {
    // App frisch geöffnet: zuletzt besuchte Seite samt Zurück-Verlauf wiederherstellen
    const saved = getState().route
    const chain = [...parentsOf(saved), saved]
    history.replaceState({ depth: 0 }, '', routeToHash(chain[0]))
    chain.slice(1).forEach((route, index) => history.pushState({ depth: index + 1 }, '', routeToHash(route)))
    depth = chain.length - 1
  }

  window.addEventListener('popstate', () => {
    depth = readDepth()
    applyRoute(hashToRoute(location.hash) ?? { name: 'home' })
  })
}
