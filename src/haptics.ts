// Fühlbares Feedback.
// Android und Chrome können vibrieren. Safari auf dem iPhone kennt die Vibration-API nicht –
// dort löst ein versteckter iOS-Schalter (ab iOS 17.4) die System-Haptik aus.
import { getState } from './store'

export type Haptic = 'tick' | 'soft' | 'strong' | 'success' | 'error' | 'celebrate'

const PATTERNS: Record<Haptic, number[]> = {
  tick: [8],
  soft: [14],
  strong: [28],
  success: [12, 45, 20],
  error: [38, 70, 38],
  celebrate: [14, 55, 22, 55, 40],
}

const PULSES: Record<Haptic, number> = {
  tick: 1,
  soft: 1,
  strong: 1,
  success: 2,
  error: 2,
  celebrate: 3,
}

const canVibrate = typeof navigator.vibrate === 'function'

const isApple =
  /iP(hone|ad|od)/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export type HapticSupport = 'vibration' | 'ios' | 'none'

export const hapticSupport: HapticSupport = canVibrate ? 'vibration' : isApple ? 'ios' : 'none'

let tapper: HTMLLabelElement | null = null

/** Der iOS-Trick: Ein Schalter, der umgelegt wird, erzeugt System-Haptik */
function iosTap() {
  if (!tapper) {
    const label = document.createElement('label')
    label.setAttribute('aria-hidden', 'true')
    label.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    input.tabIndex = -1
    label.appendChild(input)
    document.body.appendChild(label)
    tapper = label
  }
  tapper.click()
}

let lastAt = 0

/** Kurzes Feedback. minGap verhindert Dauerrütteln, z. B. beim Schieben des Zeitstrahls. */
export function haptic(kind: Haptic = 'tick', { minGap = 30 } = {}) {
  if (hapticSupport === 'none' || !getState().settings.haptics) return
  const now = performance.now()
  if (now - lastAt < minGap) return
  lastAt = now

  try {
    if (canVibrate) {
      const pattern = PATTERNS[kind]
      navigator.vibrate(pattern.length === 1 ? pattern[0] : pattern)
      return
    }
    for (let pulse = 0; pulse < PULSES[kind]; pulse++) {
      if (pulse === 0) iosTap()
      else window.setTimeout(iosTap, pulse * 90)
    }
  } catch {
    // manche Geräte verweigern Feedback – dann bleibt es eben still
  }
}
