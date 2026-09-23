/// <reference types="node" />
/**
 * Münzen und Steine, die die Verwaltung allen Konten gutschreibt.
 * Liegt am Spielstand, damit der nächste Abgleich sie dazuzählt und nicht als Schattenkasse wertet.
 */
const zahl = (wert: unknown): number => (typeof wert === 'number' && Number.isFinite(wert) ? Math.max(0, Math.floor(wert)) : 0)

const DECKEL = Number.MAX_SAFE_INTEGER
const gedeckelt = (wert: number) => Math.min(DECKEL, Math.max(0, Math.floor(wert)))

export interface Gaben {
  muenzen: number
  ziegel: number
}

export function leseGaben(wert: unknown): Gaben {
  if (!wert || typeof wert !== 'object') return { muenzen: 0, ziegel: 0 }
  const roh = wert as Record<string, unknown>
  return { muenzen: zahl(roh.muenzen), ziegel: zahl(roh.ziegel) }
}

/** Fehlende Gutschrift auf die Stadt oder, wenn es noch keine gibt, auf die Stadtkasse legen */
export function gabenAuffuellen(daten: unknown, soll: Gaben): unknown {
  if (!daten || typeof daten !== 'object') return daten
  const obj: Record<string, unknown> = { ...(daten as Record<string, unknown>) }
  const hat = leseGaben(obj.gaben)
  const addM = gedeckelt(soll.muenzen - hat.muenzen)
  const addZ = gedeckelt(soll.ziegel - hat.ziegel)
  if (addM > 0 || addZ > 0) {
    if (obj.city && typeof obj.city === 'object') {
      const stadt = { ...(obj.city as Record<string, unknown>) }
      stadt.coins = gedeckelt(zahl(stadt.coins) + addM)
      stadt.materials = gedeckelt(zahl(stadt.materials) + addZ)
      obj.city = stadt
    } else {
      const kasse =
        obj.stadtkasse && typeof obj.stadtkasse === 'object' ? { ...(obj.stadtkasse as Record<string, unknown>) } : {}
      kasse.coins = gedeckelt(zahl(kasse.coins) + addM)
      kasse.materials = gedeckelt(zahl(kasse.materials) + addZ)
      obj.stadtkasse = kasse
    }
  }
  if (soll.muenzen > 0 || soll.ziegel > 0) obj.gaben = { muenzen: soll.muenzen, ziegel: soll.ziegel }
  return obj
}
