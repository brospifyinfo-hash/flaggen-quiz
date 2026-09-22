// Sprachausgabe für Englisch und Französisch – über die Stimmen des Geräts (Web Speech API).
// Getrennt vom Ton der Oberfläche: eigener Schalter, eigenes Tempo, eigene Lautstärke.
// Später können Inhalte echte Aufnahmen mitbringen; dann haben die Vorrang.
import { getState } from '../store'
import type { Sprache } from './typen'

const synth: SpeechSynthesis | null = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null

let stimmen: SpeechSynthesisVoice[] = []
const hoerer = new Set<() => void>()

function stimmenLaden() {
  if (!synth) return
  try {
    stimmen = synth.getVoices()
  } catch {
    stimmen = []
  }
  hoerer.forEach((h) => h())
}

if (synth) {
  stimmenLaden()
  try {
    synth.addEventListener?.('voiceschanged', stimmenLaden)
  } catch {
    // ältere Browser kennen das Ereignis nicht – dann bleibt es bei der ersten Liste
  }
}

/** Kann das Gerät überhaupt sprechen? */
export const kannSprechen = (): boolean => synth !== null

/** Gibt es eine Stimme für diese Sprache? */
export function hatStimme(sprache: Sprache): boolean {
  if (!synth) return false
  const kurz = sprache.slice(0, 2)
  return stimmen.some((v) => v.lang.replace('_', '-').toLowerCase().startsWith(kurz))
}

/** Die beste Stimme: genau passende Region, lokal vor Netz, bekannte gute Stimmen zuerst */
function stimmeFuer(sprache: Sprache): SpeechSynthesisVoice | null {
  const kurz = sprache.slice(0, 2)
  const passend = stimmen.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(kurz))
  if (passend.length === 0) return null
  const gut = ['Daniel', 'Kate', 'Serena', 'Thomas', 'Amélie', 'Amelie', 'Audrey', 'Google UK English', 'Google français']
  const bewertung = (v: SpeechSynthesisVoice) =>
    (v.lang.replace('_', '-').toLowerCase() === sprache.toLowerCase() ? 4 : 0) +
    (v.localService ? 2 : 0) +
    (gut.some((name) => v.name.includes(name)) ? 1 : 0)
  return [...passend].sort((a, b) => bewertung(b) - bewertung(a))[0]
}

export const spracheAn = (): boolean => getState().settings.stimme !== false

/** Spricht einen Text. langsam: deutlich langsamer, zum Mitsprechen. */
export function sprich(text: string, sprache: Sprache, { langsam = false } = {}): boolean {
  if (!synth || !spracheAn()) return false
  try {
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = sprache
    const stimme = stimmeFuer(sprache)
    if (stimme) u.voice = stimme
    const grund = getState().settings.langsam ? 0.8 : 0.95
    u.rate = langsam ? 0.62 : grund
    u.pitch = 1
    u.volume = 1
    synth.speak(u)
    return true
  } catch {
    return false
  }
}

export function verstumme(): void {
  try {
    synth?.cancel()
  } catch {
    // nichts zu tun
  }
}

/** Für Oberflächen, die auf nachgeladene Stimmen warten */
export function beiStimmen(h: () => void): () => void {
  hoerer.add(h)
  return () => {
    hoerer.delete(h)
  }
}
