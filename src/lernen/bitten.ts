// Bürger mit Anliegen aus den Lernwelten: Eine Studentin versteht einen Satz nicht, ein
// Ingenieur hat Netzwerkprobleme, eine Touristin spricht nur Französisch. Die Aufgabe ist eine
// kurze Aktivität aus dem passenden Kurs – die Belohnung läuft über die gewohnte Kette.
import type { CityRequest } from '../city/requests'
import type { SaveData } from '../types'
import { modusVon } from './belohnung'
import { kursStand } from './fortschritt'
import { inhaltVon, KURSE } from './kurse'
import { einzelneAktivitaet } from './planer'
import { frageAus } from './quizmodus'
import type { Bittsteller } from './typen'
import { gewichtet, neuerSamen, waehle, zufall } from './zufall'

/** Eine Bitte aus einem Kurs – null, wenn gerade kein Kursinhalt geladen ist */
export function kursBitte(
  data: SaveData,
  buildingId: string,
  now = Date.now(),
  optionen: { spiel?: string; wer?: Bittsteller } = {},
): CityRequest | null {
  const kandidaten = KURSE.flatMap((kurs) =>
    inhaltVon(kurs.id) ? kurs.spiele.filter((spiel) => spiel.bitte).map((spiel) => ({ kurs, spiel })) : [],
  )
  if (kandidaten.length === 0) return null
  const rng = zufall(neuerSamen())
  // Begonnene Kurse kommen öfter – andere aber auch, damit man sie entdeckt
  const gewichte = kandidaten.map(({ kurs }) => ((kursStand(data, kurs.id)?.sitzungen ?? 0) > 0 ? 2 : 1))
  const wahl = optionen.spiel ? kandidaten.find((k) => k.spiel.id === optionen.spiel) : gewichtet(rng, kandidaten, gewichte)
  if (!wahl?.spiel.bitte) return null
  const akt = einzelneAktivitaet(wahl.kurs, kursStand(data, wahl.kurs.id), neuerSamen(), {
    spiel: wahl.spiel.id,
    kurz: true,
    jetzt: now,
  })
  if (!akt) return null
  const wer = optionen.wer ?? waehle(rng, wahl.spiel.bitte.wer)
  return {
    id: `r${now}`,
    citizen: { name: wer.name, emoji: wer.emoji, role: wer.rolle },
    story: waehle(rng, wahl.spiel.bitte.saetze),
    modeId: modusVon(wahl.kurs.id),
    question: frageAus(akt),
    buildingId,
    at: now,
  }
}

/** Ist diese Bitte eine Kurs-Aktivität? */
export const istKursBitte = (request: CityRequest | null | undefined): boolean => request?.question.input?.kind === 'aktivitaet'
