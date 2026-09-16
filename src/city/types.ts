// Der Spielstand der Stadt. Eigene Datei, eigene Version – die Stadt soll über Jahre
// wachsen können, ohne dass alte Stände unlesbar werden.

export const CITY_VERSION = 1

/** Eine Kachel ist der kleinste Bauplatz. Gebäude belegen ein Rechteck aus Kacheln. */
export interface Placed {
  id: string
  /** Bauwerk aus dem Katalog */
  type: string
  /** linke obere Kachel */
  x: number
  y: number
  /** 0 bis 3, jeweils eine Vierteldrehung */
  rot: 0 | 1 | 2 | 3
  /** Ausbaustufe, ab 1 */
  level: number
  /** wann gebaut – für die Bauanimation */
  at: number
}

export interface CityState {
  version: number
  name: string
  motto: string
  emblem: string
  /** Kantenlänge des freigeschalteten Gebiets in Kacheln */
  land: number
  level: number
  coins: number
  materials: number
  buildings: Placed[]
  nextId: number
  foundedAt: number
}

/** Was die Stadt gerade leistet – wird aus den Gebäuden gerechnet, nie gespeichert */
export interface CityStats {
  population: number
  capacity: number
  happiness: number
  education: number
  environment: number
  income: number
  jobs: number
  buildings: number
}
