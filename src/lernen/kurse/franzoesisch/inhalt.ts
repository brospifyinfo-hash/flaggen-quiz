// Alle Inhalte des Französischkurses an einer Stelle – wird erst geladen, wenn der Kurs
// geöffnet wird oder ein Spiel Stoff braucht.
import type { KursInhalt } from '../../typen'
import { AUSSPRACHE } from './aussprache'
import { DIALOGE } from './dialoge'
import { ANTWORTEN, DUELL, HOEREN, SATZBAU } from './uebungen'
import { GENRE, PAARE } from './wortschatz'

export const INHALT: KursInhalt = {
  items: [...AUSSPRACHE, ...DIALOGE, ...ANTWORTEN, ...HOEREN, ...SATZBAU, ...DUELL, ...PAARE, ...GENRE],
}
