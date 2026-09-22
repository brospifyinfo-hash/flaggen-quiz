// Werkzeuge zum Schreiben von Inhalten – kurz und lesbar statt tief verschachtelter Objekte.
// Nur für Kursdateien gedacht; die Spiele sehen am Ende ganz normale Inhaltsobjekte.
import type { FehlerTeil, Stufe, WahlOption } from '../typen'

/**
 * Text mit Fehlerstellen: „Aufgrund {dem Wetter=>des Wetters|dem Wetters|des Wetter} fiel …“
 * Links vom Pfeil steht, was im Text zu sehen ist, rechts die richtige Fassung, danach die
 * falschen Vorschläge. Nach „::“ darf eine kurze Begründung folgen.
 */
export function fehlerTeile(text: string): FehlerTeil[] {
  const teile: FehlerTeil[] = []
  const muster = /\{([^{}]+?)=>([^{}]+?)\}/g
  let pos = 0
  let treffer: RegExpExecArray | null
  while ((treffer = muster.exec(text))) {
    if (treffer.index > pos) teile.push(text.slice(pos, treffer.index))
    const [rest, warum] = treffer[2].split('::')
    const [richtig, ...falsch] = rest.split('|')
    teile.push({ zeige: treffer[1], richtig, falsch, ...(warum ? { warum } : {}) })
    pos = treffer.index + treffer[0].length
  }
  if (pos < text.length) teile.push(text.slice(pos))
  return teile
}

/**
 * Antwortmöglichkeiten: Die erste ist richtig. „~0.5 Text“ gibt Teilpunkte,
 * „Text::Begründung“ erklärt, warum eine Antwort (nicht) passt.
 */
export function optionen(liste: readonly string[]): WahlOption[] {
  return liste.map((eintrag, i) => {
    const [kopf, warum] = eintrag.split('::')
    const teil = kopf.match(/^~(\d(?:\.\d+)?)\s+/)
    const text = teil ? kopf.slice(teil[0].length) : kopf
    return {
      text,
      ...(i === 0 ? { richtig: true } : {}),
      ...(teil ? { teil: Number(teil[1]) } : {}),
      ...(warum ? { warum } : {}),
    }
  })
}

/** Bausteine: „Ich weiß nicht, | ob | er | morgen | kommt.“ */
export const bausteine = (text: string): string[] => text.split('|').map((t) => t.trim()).filter(Boolean)

export const stufe = (n: number): Stufe => Math.max(1, Math.min(5, Math.round(n))) as Stufe
