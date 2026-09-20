// Alle Inhalte des Banking-Kurses. Erfundene Fälle, echte Rechenwege.
import type { KursInhalt } from '../../typen'
import { FAELLE } from './faelle'
import { KREDITE, RECHNEN, SCHALTER } from './rechnen'
import { BELEGE, DUELLE, MASCHEN, PAARE, WISSEN } from './wissen'

export const INHALT: KursInhalt = {
  items: [...FAELLE, ...SCHALTER, ...KREDITE, ...RECHNEN, ...WISSEN, ...DUELLE, ...PAARE, ...MASCHEN, ...BELEGE],
}
