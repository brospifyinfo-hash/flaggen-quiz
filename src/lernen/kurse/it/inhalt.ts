// Alle Inhalte des IT-Kurses.
import type { KursInhalt } from '../../typen'
import { CODE } from './code'
import { BAUKASTEN, NETZE, ROBOTER } from './technik'
import { DUELLE, FAELLE, KARTEN, PAARE, WISSEN } from './wissen'

export const INHALT: KursInhalt = {
  items: [...CODE, ...NETZE, ...ROBOTER, ...BAUKASTEN, ...FAELLE, ...WISSEN, ...DUELLE, ...PAARE, ...KARTEN],
}
