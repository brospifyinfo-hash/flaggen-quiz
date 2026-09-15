import { getState } from './store'

export const canVibrate = 'vibrate' in navigator

export function vibrate(pattern: number | number[]) {
  if (!canVibrate || !getState().settings.haptics) return
  try {
    navigator.vibrate(pattern)
  } catch {
    // manche Browser verbieten Vibration ohne vorherige Berührung
  }
}
