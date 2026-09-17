// Der Spielstand der Stadt. Eigene Datei, eigene Version – die Stadt soll über Jahre
// wachsen können, ohne dass alte Stände unlesbar werden.

// Version 2: Wege sind keine Bauwerke mehr, sondern ein eigenes Straßennetz.
// Version 3: Die Einwohnerzahl wird nicht mehr gerechnet, sondern gelebt – Menschen
//            ziehen zu und weg, und die Stadt verdient in Zyklen.
// Version 4: Bürger bitten um Hilfe.
// Version 5: Die Stadt hat ein Thema und Schmuck.
export const CITY_VERSION = 5

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
  /** Aussehen der Stadt, siehe src/city/themes.ts */
  theme: string
  /** Kantenlänge des freigeschalteten Gebiets in Kacheln */
  land: number
  level: number
  coins: number
  materials: number
  buildings: Placed[]
  /** Straßennetz: Kachel "x:y" → Straßenart. Als Karte, damit Nachbarn schnell gefunden werden. */
  roads: Record<string, string>
  /** Menschen, die wirklich hier wohnen – höchstens so viele wie Wohnraum da ist */
  population: number
  /** Zeitpunkt des letzten Wirtschaftszyklus */
  lastTick: number
  /** offene Bitte eines Bürgers, siehe src/city/requests.ts */
  request: unknown
  /** wie oft schon geholfen wurde */
  helped: number
  /** wann zuletzt eine Bitte entstanden ist */
  lastRequest: number
  nextId: number
  foundedAt: number
}

/** Ein Posten in der Aufschlüsselung von Stimmung oder Einnahmen */
export interface Part {
  label: string
  value: number
}

/** Was seit dem letzten Besuch passiert ist */
export interface CycleReport {
  cycles: number
  coins: number
  movedIn: number
  movedOut: number
  income: Part[]
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
