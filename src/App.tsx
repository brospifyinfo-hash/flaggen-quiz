import { useEffect } from 'react'
import { getMode } from './modes/registry'
import { isContinentUnlocked, sessionKey } from './quiz'
import { navigate } from './router'
import { routeToHash } from './routes'
import { ContinentScreen } from './screens/ContinentScreen'
import { HomeScreen } from './screens/HomeScreen'
import { MathRunnerScreen } from './screens/MathRunnerScreen'
import { ModeScreen } from './screens/ModeScreen'
import { QuizScreen } from './screens/QuizScreen'
import { ResultScreen } from './screens/ResultScreen'
import { RunResultScreen } from './screens/RunResultScreen'
import { RunScreen } from './screens/RunScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { SpecificScreen } from './screens/SpecificScreen'
import { useSaveData } from './store'
import type { Route, SaveData } from './types'

/** Leitet Seiten um, die es (noch) nicht gibt – z. B. beendete Runs oder gesperrte Kontinente */
function resolveRoute(data: SaveData): Route {
  const { route } = data
  switch (route.name) {
    case 'home':
    case 'settings':
    case 'specific':
    case 'mathRunner':
      return route
    case 'mode':
      return getMode(route.id) ? route : { name: 'specific' }
    case 'run':
      if (data.run) return route
      return data.lastRun ? { name: 'runResult' } : { name: 'home' }
    case 'runResult':
      return data.lastRun ? route : { name: 'home' }
    default: {
      if (!isContinentUnlocked(data, route.id)) return { name: 'mode', id: 'flaggen' }
      if (route.name === 'quiz' && !data.sessions[sessionKey(route.id, route.mode)]) {
        return { name: 'continent', id: route.id }
      }
      if (route.name === 'result') {
        const result = data.lastResult
        if (!result || result.continent !== route.id || result.mode !== route.mode) {
          return { name: 'continent', id: route.id }
        }
      }
      return route
    }
  }
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
    case 'mathRunner':
      return <MathRunnerScreen data={data} />
    case 'specific':
      return <SpecificScreen data={data} />
    case 'mode':
      return <ModeScreen data={data} id={route.id} />
    case 'run':
      return <RunScreen key={data.run!.startedAt} run={data.run!} />
    case 'runResult':
      return <RunResultScreen data={data} result={data.lastRun!} />
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
