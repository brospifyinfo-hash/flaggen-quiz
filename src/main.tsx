import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/nunito'
import './styles.css'
import { App } from './App'
import { initPwa } from './pwa'
import { initRouter } from './router'

history.scrollRestoration = 'manual'
initRouter()
initPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
