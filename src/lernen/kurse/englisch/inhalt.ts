// Alle Inhalte des Englischkurses – geladen, sobald man den Kurs öffnet.
import type { KursInhalt } from '../../typen'
import { DIALOGE } from './dialoge'
import { ANTWORTEN, HOEREN, NATUERLICH, PAARE, RETTEN, SATZBAU } from './uebungen'

export const INHALT: KursInhalt = {
  items: [...DIALOGE, ...ANTWORTEN, ...RETTEN, ...NATUERLICH, ...HOEREN, ...SATZBAU, ...PAARE],
}
