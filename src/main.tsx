import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/nunito'
import './styles.css'
import { App } from './App'
// registriert alle Spielmodi – muss vor dem ersten Rendern passieren
import './modes'
import { initPwa } from './pwa'
import { initRouter } from './router'
import { starteAbgleich } from './konto'
import { subscribe } from './store'

history.scrollRestoration = 'manual'
initRouter()
initPwa()
starteAbgleich(subscribe)
// Ikonen-Schrift früh anfordern, damit Emoji-Codepunkte nie kurz als System-Emoji aufblitzen
document.fonts?.load('16px "Weltwissen Ikonen"', '\u{1FA99}').catch(() => undefined)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
