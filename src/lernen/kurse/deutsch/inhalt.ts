// Alle Inhalte des Deutschkurses – werden erst geladen, wenn man den Kurs öffnet.
import type { KursInhalt } from '../../typen'
import { ARCHITEKT, DETEKTIV, DUELL, LEKTORAT, UMFORMUNG } from './grammatik'
import { ARCHITEKT_GRUNDLAGEN, DUELL_WORTSCHATZ, KASUS, KONTEXT_GRUNDLAGEN, UMFORMUNG_GRUNDLAGEN } from './grundlagen'
import { KONTEXT, REGISTER, STIL, WORTSCHATZ } from './wortschatz'

export const INHALT: KursInhalt = {
  items: [
    ...DETEKTIV,
    ...DUELL,
    ...DUELL_WORTSCHATZ,
    ...UMFORMUNG,
    ...UMFORMUNG_GRUNDLAGEN,
    ...ARCHITEKT,
    ...ARCHITEKT_GRUNDLAGEN,
    ...LEKTORAT,
    ...KONTEXT,
    ...KONTEXT_GRUNDLAGEN,
    ...STIL,
    ...WORTSCHATZ,
    ...REGISTER,
    ...KASUS,
  ],
}
