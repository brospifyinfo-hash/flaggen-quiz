// Kurze Töne für den Math Runner – erzeugt im Browser, ohne Audiodateien.
// Ohne Web Audio oder mit ausgeschaltetem Ton passiert einfach nichts.
import { getState } from '../../store'

export type Cue = 'correct' | 'wrong' | 'combo' | 'level' | 'highscore' | 'over'

type Note = [freq: number, start: number, dur: number, type: OscillatorType, volume: number]

const CUES: Record<Cue, Note[]> = {
  correct: [
    [880, 0, 0.08, 'triangle', 0.5],
    [1320, 0.07, 0.1, 'triangle', 0.45],
  ],
  wrong: [
    [180, 0, 0.16, 'sawtooth', 0.35],
    [120, 0.1, 0.18, 'sawtooth', 0.3],
  ],
  combo: [
    [660, 0, 0.07, 'square', 0.3],
    [880, 0.06, 0.07, 'square', 0.3],
    [1320, 0.12, 0.12, 'square', 0.3],
  ],
  level: [
    [523, 0, 0.1, 'triangle', 0.4],
    [659, 0.09, 0.1, 'triangle', 0.4],
    [784, 0.18, 0.16, 'triangle', 0.4],
  ],
  highscore: [
    [784, 0, 0.1, 'square', 0.35],
    [988, 0.1, 0.1, 'square', 0.35],
    [1175, 0.2, 0.1, 'square', 0.35],
    [1568, 0.3, 0.26, 'square', 0.4],
  ],
  over: [
    [392, 0, 0.16, 'sawtooth', 0.35],
    [311, 0.15, 0.18, 'sawtooth', 0.35],
    [233, 0.32, 0.34, 'sawtooth', 0.35],
  ],
}

let audio: AudioContext | null = null
let broken = false

/** Muss aus einer echten Berührung heraus aufgerufen werden – sonst bleibt iOS stumm */
export function initSound(): void {
  if (audio || broken) return
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) {
      broken = true
      return
    }
    audio = new Ctor()
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
  if (!audio) return
  resumeSound()

  const now = audio.currentTime
  for (const [freq, start, dur, type, volume] of CUES[cue]) {
    try {
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, now + start)
      gain.gain.setValueAtTime(0.0001, now + start)
      gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur)
      osc.connect(gain).connect(audio.destination)
      osc.start(now + start)
      osc.stop(now + start + dur + 0.02)
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
}
