/** Welcher Name zuletzt als Platz eins auf der Rangliste angesehen wurde. Nur dieses Gerät. */
const SCHLUESSEL = 'weltwissen:platz-eins'

export function gelesenerPlatz(): string | null {
  try {
    return localStorage.getItem(SCHLUESSEL)
  } catch {
    return null
  }
}

export function platzGelesen(name: string): void {
  if (!name) return
  try {
    localStorage.setItem(SCHLUESSEL, name)
  } catch {
    // ohne Speicher bleibt der Hinweis stehen
  }
}
