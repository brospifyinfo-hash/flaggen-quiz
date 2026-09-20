import { lazy, Suspense, useEffect } from 'react'
import { kursById } from './lernen/kurse'
import { getMode } from './modes/registry'
import { isContinentUnlocked, sessionKey } from './quiz'
import { navigate } from './router'
import { routeToHash } from './routes'
import { CityScreen } from './screens/CityScreen'
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

// Lernwelten: Bildschirme und Spiele laden erst, wenn man sie öffnet
const KursScreen = lazy(() => import('./lernen/ui/KursScreen').then((m) => ({ default: m.KursScreen })))
const SitzungScreen = lazy(() => import('./lernen/ui/SitzungScreen').then((m) => ({ default: m.SitzungScreen })))
const ErgebnisScreen = lazy(() => import('./lernen/ui/ErgebnisScreen').then((m) => ({ default: m.ErgebnisScreen })))
const BitteScreen = lazy(() => import('./lernen/ui/BitteScreen').then((m) => ({ default: m.BitteScreen })))

const Laden = () => <main className="screen lern-laedt">Lädt …</main>

/** Leitet Seiten um, die es (noch) nicht gibt – z. B. beendete Runs oder gesperrte Kontinente */
function resolveRoute(data: SaveData): Route {
  const { route } = data
  switch (route.name) {
    case 'home':
    case 'settings':
    case 'specific':
    case 'mathRunner':
    case 'city':
      return route
    case 'mode':
      // Kurse der Lernwelten haben ihre eigene Seite
      if (route.id.startsWith('kurs:') && kursById(route.id.slice(5))) return { name: 'kurs', id: route.id.slice(5) }
      return getMode(route.id) ? route : { name: 'specific' }
    case 'kurs':
      return kursById(route.id) ? route : { name: 'home' }
    case 'kursSitzung':
      if (data.lernen?.sitzung) return route
      return data.lernen?.letzte ? { name: 'kursErgebnis' } : { name: 'home' }
    case 'kursErgebnis':
      return data.lernen?.letzte ? route : { name: 'home' }
    case 'bitte':
      // Nach dem Helfen ist die Bitte weg – die Seite zeigt dann noch den Dank und schickt selbst zurück
      return data.city ? route : { name: 'home' }
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
    case 'city':
      return <CityScreen data={data} />
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
    case 'kurs':
      return (
        <Suspense fallback={<Laden />}>
          <KursScreen data={data} id={route.id} />
        </Suspense>
      )
    case 'kursSitzung':
      return (
        <Suspense fallback={<Laden />}>
          <SitzungScreen data={data} />
        </Suspense>
      )
    case 'kursErgebnis':
      return (
        <Suspense fallback={<Laden />}>
          <ErgebnisScreen data={data} />
        </Suspense>
      )
    case 'bitte':
      return (
        <Suspense fallback={<Laden />}>
          <BitteScreen data={data} />
        </Suspense>
      )
  }
}
