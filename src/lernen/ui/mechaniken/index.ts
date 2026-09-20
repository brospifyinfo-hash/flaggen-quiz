// Welche Komponente welche Mechanik spielt. Ein neues Spiel für einen Kurs braucht meist keine
// neue Mechanik – nur Inhalte und einen Eintrag in der Kursdefinition.
import type { ComponentType } from 'react'
import type { MechanikId } from '../../typen'
import type { MechanikProps } from '../gemeinsam'
import { Aussprache } from './Aussprache'
import { Auswahl } from './Auswahl'
import { Dialog } from './Dialog'
import { Dokument } from './Dokument'
import { Duell } from './Duell'
import { Fall } from './Fall'
import { Kasse } from './Kasse'
import { Kredit } from './Kredit'
import { Rechnen } from './Rechnen'
import { Hoeren } from './Hoeren'
import { Fehlersuche } from './Fehlersuche'
import { Paare } from './Paare'
import { Satzbau } from './Satzbau'
import { Sortieren } from './Sortieren'

// Die Komponenten erwarten jeweils ihren Inhaltstyp; der Spieler reicht passende Inhalte durch
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MECHANIKEN: Partial<Record<MechanikId, ComponentType<MechanikProps<any>>>> = {
  fehler: Fehlersuche,
  bau: Satzbau,
  wahl: Auswahl,
  duell: Duell,
  dialog: Dialog,
  hoeren: Hoeren,
  aussprache: Aussprache,
  paare: Paare,
  sortieren: Sortieren,
  dokument: Dokument,
  rechnen: Rechnen,
  kasse: Kasse,
  kredit: Kredit,
  fall: Fall,
}

/** Welche Inhaltsart zu welcher Mechanik passt – was nicht passt, wird aussortiert */
export const ART_FUER: Record<MechanikId, string> = {
  fehler: 'fehler',
  dokument: 'dokument',
  bau: 'bau',
  wahl: 'wahl',
  duell: 'duell',
  dialog: 'dialog',
  hoeren: 'hoeren',
  aussprache: 'aussprache',
  paare: 'paar',
  sortieren: 'karte',
  rechnen: 'rechnen',
  kasse: 'kasse',
  kredit: 'kredit',
  roboter: 'roboter',
  baukasten: 'baukasten',
  netz: 'netz',
  fall: 'fall',
}
