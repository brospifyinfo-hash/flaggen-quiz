// Alle Kurse an einer Stelle. Die Beschreibungen (Module, Lernziele, Spiele) sind klein und
// immer da; die Inhalte werden erst geladen, wenn man einen Kurs öffnet oder ein Spiel sie
// braucht. Ein neuer Kurs: Definition anlegen, hier eintragen – fertig.
import { useEffect, useSyncExternalStore } from 'react'
import { BANK } from './kurse/bank'
import { DEUTSCH } from './kurse/deutsch'
import { ENGLISCH } from './kurse/englisch'
import { FRANZOESISCH } from './kurse/franzoesisch'
import { IT } from './kurse/it'
import type { Inhalt, KursDef, KursInhalt, SpielDef } from './typen'

export const KURSE: readonly KursDef[] = [DEUTSCH, ENGLISCH, FRANZOESISCH, BANK, IT]

export const kursById = (id: string): KursDef | undefined => KURSE.find((kurs) => kurs.id === id)

const SPIELE = new Map<string, { kurs: KursDef; spiel: SpielDef }>()
for (const kurs of KURSE) for (const spiel of kurs.spiele) SPIELE.set(spiel.id, { kurs, spiel })

export const spielById = (id: string): SpielDef | undefined => SPIELE.get(id)?.spiel
export const kursVonSpiel = (id: string): KursDef | undefined => SPIELE.get(id)?.kurs
export const zielById = (kurs: KursDef, id: string) => kurs.ziele.find((ziel) => ziel.id === id)

// ---------- Inhalte nachladen ----------

export interface GeladenerKurs extends KursInhalt {
  /** Inhalte nach ID */
  nachId: Map<string, Inhalt>
  /** spiel → ziel → Inhalte */
  index: Map<string, Map<string, Inhalt[]>>
}

const geladen = new Map<string, GeladenerKurs>()
const laeuft = new Map<string, Promise<GeladenerKurs>>()
const hoerer = new Set<() => void>()
/** zählt hoch, sobald neue Inhalte da sind – für React */
let stand = 0
const melden = () => {
  stand++
  hoerer.forEach((h) => h())
}

function aufbereiten(inhalt: KursInhalt): GeladenerKurs {
  const nachId = new Map<string, Inhalt>()
  const index = new Map<string, Map<string, Inhalt[]>>()
  for (const item of inhalt.items) {
    nachId.set(item.id, item)
    let proSpiel = index.get(item.spiel)
    if (!proSpiel) index.set(item.spiel, (proSpiel = new Map()))
    const liste = proSpiel.get(item.ziel)
    if (liste) liste.push(item)
    else proSpiel.set(item.ziel, [item])
  }
  return { ...inhalt, nachId, index }
}

/** Inhalte eines Kurses – sofort, wenn schon geladen, sonst null */
export const inhaltVon = (kurs: string): GeladenerKurs | null => geladen.get(kurs) ?? null

export function ladeKurs(id: string): Promise<GeladenerKurs> {
  const fertig = geladen.get(id)
  if (fertig) return Promise.resolve(fertig)
  const offen = laeuft.get(id)
  if (offen) return offen
  const kurs = kursById(id)
  if (!kurs) return Promise.reject(new Error(`Unbekannter Kurs: ${id}`))
  const promise = kurs
    .laden()
    .then((inhalt) => {
      const aufbereitet = aufbereiten(inhalt)
      geladen.set(id, aufbereitet)
      laeuft.delete(id)
      melden()
      return aufbereitet
    })
    .catch((fehler: unknown) => {
      laeuft.delete(id)
      throw fehler
    })
  laeuft.set(id, promise)
  return promise
}

/** Alle Kurse im Hintergrund laden – für Random Mode und Bürger-Bitten */
export function ladeAlle(): Promise<void> {
  return Promise.all(KURSE.map((kurs) => ladeKurs(kurs.id).catch(() => null))).then(() => undefined)
}

/** Für Tests und Werkzeuge: Inhalte direkt setzen */
export function setzeInhalt(id: string, inhalt: KursInhalt): GeladenerKurs {
  const aufbereitet = aufbereiten(inhalt)
  geladen.set(id, aufbereitet)
  melden()
  return aufbereitet
}

const abonnieren = (h: () => void) => {
  hoerer.add(h)
  return () => {
    hoerer.delete(h)
  }
}

/**
 * React: Inhalte eines Kurses, sobald sie da sind. useSyncExternalStore prüft nach dem
 * Anmelden noch einmal nach – so geht auch ein Laden nicht verloren, das genau zwischen
 * Anzeigen und Anmelden fertig wurde.
 */
export function useKursInhalt(id: string | null): GeladenerKurs | null {
  useSyncExternalStore(abonnieren, () => stand)
  useEffect(() => {
    if (id) void ladeKurs(id).catch(() => undefined)
  }, [id])
  return id ? inhaltVon(id) : null
}

/** Ein Inhalt aus einer Aktivität: ID nachschlagen oder erzeugtes Objekt nehmen */
export function aufloesen(kurs: string, ref: string | Inhalt): Inhalt | null {
  if (typeof ref !== 'string') return ref
  return inhaltVon(kurs)?.nachId.get(ref) ?? null
}
