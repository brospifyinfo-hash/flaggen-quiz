import { useEffect } from 'react'
import { isContinentUnlocked, sessionKey } from './quiz'
import { navigate } from './router'
import { routeToHash } from './routes'
import { ContinentScreen } from './screens/ContinentScreen'
import { HomeScreen } from './screens/HomeScreen'
import { QuizScreen } from './screens/QuizScreen'
import { ResultScreen } from './screens/ResultScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { useSaveData } from './store'
import type { Route, SaveData } from './types'

/** Leitet Seiten um, die es (noch) nicht gibt – z. B. gesperrte Kontinente oder beendete Runden */
function resolveRoute(data: SaveData): Route {
  const { route } = data
  if (route.name === 'home' || route.name === 'settings') return route
  if (!isContinentUnlocked(data, route.id)) return { name: 'home' }
  if (route.name === 'quiz' && !data.sessions[sessionKey(route.id, route.mode)]) {
    return { name: 'continent', id: route.id }
  }
  if (route.name === 'result') {
    const result = data.lastResult
    if (!result || result.continent !== route.id || result.mode !== route.mode) return { name: 'continent', id: route.id }
  }
  return route
}

export function App() {
  const data = useSaveData()
  const route = resolveRoute(data)
  const target = routeToHash(route)
  const saved = routeToHash(data.route)

  useEffect(() => {
    if (target !== saved) navigate(route, { replace: true })
    // route ändert sich genau dann, wenn sich target ändert
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, saved])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [target])

  switch (route.name) {
    case 'home':
      return <HomeScreen data={data} />
    case 'settings':
      return <SettingsScreen data={data} />
    case 'continent':
      return <ContinentScreen data={data} id={route.id} />
    case 'quiz': {
      const session = data.sessions[sessionKey(route.id, route.mode)]!
      return <QuizScreen key={`${route.id}:${route.mode}:${session.startedAt}`} session={session} />
    }
    case 'result':
      return <ResultScreen result={data.lastResult!} />
  }
}
