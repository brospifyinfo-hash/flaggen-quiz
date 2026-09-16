// Töne für den Math Runner – im Browser erzeugt, ohne eine einzige Audiodatei.
// Ohne Web Audio oder mit ausgeschaltetem Ton passiert einfach nichts.
import { getState } from '../../store'

export type Cue = 'correct' | 'wrong' | 'combo' | 'level' | 'highscore' | 'over' | 'count' | 'go' | 'danger'

interface Note {
  /** Startton in Hertz */
  freq: number
  /** Zielton, falls der Ton gleiten soll */
  to?: number
  /** Sekunden nach dem Auslösen */
  at: number
  dur: number
  type: OscillatorType
  vol: number
}

const CUES: Record<Cue, Note[]> = {
  // heller Zweiklang, der nach oben zieht
  correct: [
    { freq: 784, at: 0, dur: 0.09, type: 'triangle', vol: 0.5 },
    { freq: 1175, at: 0.06, dur: 0.12, type: 'triangle', vol: 0.45 },
    { freq: 1568, at: 0.12, dur: 0.14, type: 'sine', vol: 0.3 },
  ],
  // tiefer Rutscher nach unten
  wrong: [
    { freq: 220, to: 90, at: 0, dur: 0.26, type: 'sawtooth', vol: 0.4 },
    { freq: 110, to: 60, at: 0.04, dur: 0.3, type: 'square', vol: 0.22 },
  ],
  // kleine Fanfare, die mit der Combo mitwächst
  combo: [
    { freq: 659, at: 0, dur: 0.08, type: 'square', vol: 0.32 },
    { freq: 880, at: 0.07, dur: 0.08, type: 'square', vol: 0.32 },
    { freq: 1175, at: 0.14, dur: 0.1, type: 'square', vol: 0.32 },
    { freq: 1568, at: 0.22, dur: 0.22, type: 'triangle', vol: 0.38 },
  ],
  level: [
    { freq: 392, to: 784, at: 0, dur: 0.3, type: 'sawtooth', vol: 0.3 },
    { freq: 1047, at: 0.24, dur: 0.22, type: 'triangle', vol: 0.4 },
  ],
  highscore: [
    { freq: 784, at: 0, dur: 0.11, type: 'square', vol: 0.36 },
    { freq: 988, at: 0.1, dur: 0.11, type: 'square', vol: 0.36 },
    { freq: 1319, at: 0.2, dur: 0.11, type: 'square', vol: 0.36 },
    { freq: 1568, at: 0.3, dur: 0.3, type: 'triangle', vol: 0.45 },
    { freq: 2093, at: 0.36, dur: 0.3, type: 'sine', vol: 0.25 },
  ],
  over: [
    { freq: 392, at: 0, dur: 0.2, type: 'sawtooth', vol: 0.36 },
    { freq: 311, at: 0.18, dur: 0.22, type: 'sawtooth', vol: 0.36 },
    { freq: 233, to: 110, at: 0.38, dur: 0.6, type: 'sawtooth', vol: 0.4 },
  ],
  count: [{ freq: 660, at: 0, dur: 0.09, type: 'square', vol: 0.3 }],
  go: [
    { freq: 880, at: 0, dur: 0.1, type: 'square', vol: 0.4 },
    { freq: 1319, at: 0.08, dur: 0.24, type: 'triangle', vol: 0.4 },
  ],
  // zwei dumpfe Herzschläge, wenn es eng wird
  danger: [
    { freq: 150, to: 90, at: 0, dur: 0.16, type: 'sine', vol: 0.5 },
    { freq: 150, to: 90, at: 0.26, dur: 0.16, type: 'sine', vol: 0.45 },
  ],
}

let audio: AudioContext | null = null
let master: GainNode | null = null
let broken = false

/** Muss aus einer echten Berührung heraus aufgerufen werden – sonst bleibt iOS stumm */
export function initSound(): void {
  if (audio || broken) return
  try {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) {
      broken = true
      return
    }
    audio = new Ctor()
    master = audio.createGain()
    master.gain.value = 0.55
    master.connect(audio.destination)
    // iOS hält den Ton an, bis eine Berührung ihn weckt
    void audio.resume()
  } catch {
    broken = true
  }
}

export function resumeSound(): void {
  if (audio?.state === 'suspended') void audio.resume()
}

export function playCue(cue: Cue): void {
  if (!getState().settings.sound) return
  initSound()
  if (!audio || !master) return
  resumeSound()

  const now = audio.currentTime
  for (const note of CUES[cue]) {
    try {
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      const start = now + note.at
      osc.type = note.type
      osc.frequency.setValueAtTime(note.freq, start)
      if (note.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, note.to), start + note.dur)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(note.vol, start + 0.014)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur)
      osc.connect(gain).connect(master)
      osc.start(start)
      osc.stop(start + note.dur + 0.03)
    } catch {
      // ein stummer Ton darf das Spiel nie stoppen
      return
    }
  }
}

/** Beim Verlassen des Spiels aufräumen */
export function closeSound(): void {
  try {
    void audio?.close()
  } catch {
    // egal
  }
  audio = null
  master = null
}
