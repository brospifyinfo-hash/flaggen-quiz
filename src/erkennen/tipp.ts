// Freie Eingabe im schweren „Was ist das“: gleiche Schreibung, Umlaute und kleine Tippfehler.

const UMLAUT: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss', æ: 'ae', ø: 'oe', å: 'a' }

/** Klein, ohne Akzente, ohne Leerzeichen und Satzzeichen. */
export function normTipp(wert: string): string {
  const klein = wert.trim().toLowerCase()
  let aus = ''
  for (const zeichen of klein) aus += UMLAUT[zeichen] ?? zeichen
  return aus
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '')
}

function abstand(a: string, b: string, maximum: number): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > maximum) return maximum + 1
  const zeilen = Array.from({ length: a.length + 1 }, (_, i) => i)
  for (let j = 1; j <= b.length; j++) {
    let vorher = zeilen[0]
    zeilen[0] = j
    let kleinste = zeilen[0]
    for (let i = 1; i <= a.length; i++) {
      const alt = zeilen[i]
      const kosten = a[i - 1] === b[j - 1] ? 0 : 1
      zeilen[i] = Math.min(zeilen[i] + 1, zeilen[i - 1] + 1, vorher + kosten)
      vorher = alt
      if (zeilen[i] < kleinste) kleinste = zeilen[i]
    }
    if (kleinste > maximum) return maximum + 1
  }
  return zeilen[a.length]
}

function toleranz(laenge: number): number {
  if (laenge <= 4) return 1
  if (laenge <= 10) return 1
  return 2
}

/**
 * Stimmt die Eingabe mit der Lösung überein?
 * Ein Tippfehler zählt, solange die Eingabe keiner anderen Antwort näher kommt.
 */
export function tippPasst(eingabe: string, loesung: string, andere: readonly string[] = []): boolean {
  const a = normTipp(eingabe)
  const b = normTipp(loesung)
  if (!a || !b) return false
  if (a === b) return true
  // Bei ganz kurzen Namen nur ein ersetzter Buchstabe, kein fehlendes Zeichen
  if (b.length <= 3 && a.length !== b.length) return false
  const maximum = toleranz(b.length)
  const distanz = abstand(a, b, maximum)
  if (distanz > maximum) return false
  for (const fremd of andere) {
    const form = normTipp(fremd)
    if (!form || form === b) continue
    if (abstand(a, form, distanz) <= distanz) return false
  }
  return true
}
