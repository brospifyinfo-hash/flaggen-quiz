// Meisterschaft je Lernziel. Jedes Lernziel hat einen Wert t zwischen 0 und 1 – eine Schätzung,
// wie sicher es sitzt. Wie beim Schach-Elo zählt, wie schwer eine Aufgabe war: Eine gelöste
// Meisteraufgabe hebt t stark, eine verpatzte Einsteigeraufgabe senkt es spürbar. Leichte
// Aufgaben allein bringen niemanden über die Mitte – dafür braucht es die schwereren.
import type { KursDef, KursStand, Lernziel, Stufe, ZielStand } from './typen'

/** Schwierigkeit einer Stufe auf der Skala von t */
export const SCHWERE: Record<Stufe, number> = { 1: 0.05, 2: 0.25, 3: 0.45, 4: 0.65, 5: 0.85 }

/** Erwartete Trefferquote bei Beherrschung t und Aufgabenstufe s */
export function erwartung(t: number, stufe: Stufe): number {
  return 1 / (1 + Math.exp(-6 * (t - SCHWERE[stufe] + 0.2)))
}

export const LEERES_ZIEL: ZielStand = { t: 0, n: 0, ok: 0, zuletzt: 0, fehler: 0 }

/** Ein Ergebnis (0 bis 1) fließt in den Lernstand eines Ziels ein */
export function zielNachher(vorher: ZielStand | undefined, stufe: Stufe, punkte: number, jetzt: number): ZielStand {
  const z = vorher ?? LEERES_ZIEL
  const p = erwartung(z.t, stufe)
  // Am Anfang schneller einpendeln, danach ruhiger
  const k = z.n < 6 ? 0.16 : 0.1
  const t = Math.max(0, Math.min(1, z.t + k * (punkte - p)))
  return {
    t,
    n: z.n + 1,
    ok: z.ok + (punkte >= 0.7 ? 1 : 0),
    zuletzt: jetzt,
    fehler: punkte < 0.5 ? Math.min(6, z.fehler + 1) : z.fehler * 0.6,
  }
}

/** Die Stufe, bei der man etwa drei von vier Aufgaben schafft */
export function stufeFuer(t: number): Stufe {
  let beste: Stufe = 1
  let abstand = Infinity
  for (const s of [1, 2, 3, 4, 5] as Stufe[]) {
    const d = Math.abs(erwartung(t, s) - 0.74)
    if (d < abstand) {
      abstand = d
      beste = s
    }
  }
  return beste
}

export interface Band {
  name: string
  ab: number
}

/** Fortschrittsbänder – beschreiben den Weg durch den Stoff, nicht die Begabung */
export const BAENDER: Band[] = [
  { name: 'Kennenlernen', ab: 0 },
  { name: 'Im Lernen', ab: 0.2 },
  { name: 'Im Aufbau', ab: 0.4 },
  { name: 'Sicher', ab: 0.6 },
  { name: 'Fortgeschritten', ab: 0.8 },
  { name: 'Gemeistert', ab: 0.95 },
]

export function bandVon(wert: number): Band {
  let band = BAENDER[0]
  for (const b of BAENDER) if (wert >= b.ab - 1e-9) band = b
  return band
}

export const zielWert = (stand: KursStand | undefined, id: string): number => stand?.ziele[id]?.t ?? 0

/** Durchschnitt über Lernziele */
export function mittel(stand: KursStand | undefined, ziele: readonly Lernziel[]): number {
  if (ziele.length === 0) return 0
  return ziele.reduce((summe, ziel) => summe + zielWert(stand, ziel.id), 0) / ziele.length
}

export const zieleDesModuls = (kurs: KursDef, modul: string) => kurs.ziele.filter((ziel) => ziel.modul === modul)

export const modulWert = (kurs: KursDef, stand: KursStand | undefined, modul: string) =>
  mittel(stand, zieleDesModuls(kurs, modul))

/** Ab diesem Stand des vorigen Moduls öffnet sich das nächste */
export const FREI_AB = 0.3
/** Das letzte Modul (Meisterschaft) braucht alle anderen mindestens so weit */
export const MEISTER_AB = 0.5

/** Welche Module offen sind – der Lehrplan gibt die Richtung vor */
export function offeneModule(kurs: KursDef, stand: KursStand | undefined): string[] {
  const offen: string[] = []
  kurs.module.forEach((modul, i) => {
    if (i === 0) {
      offen.push(modul.id)
      return
    }
    const letztes = i === kurs.module.length - 1 && kurs.module.length > 2
    if (letztes) {
      const alle = kurs.module.slice(0, -1).every((m) => modulWert(kurs, stand, m.id) >= MEISTER_AB)
      if (alle) offen.push(modul.id)
      return
    }
    if (offen.includes(kurs.module[i - 1].id) && modulWert(kurs, stand, kurs.module[i - 1].id) >= FREI_AB) {
      offen.push(modul.id)
    }
  })
  return offen
}

/** Das Modul, an dem gerade gearbeitet wird: das erste offene, das noch nicht sicher sitzt */
export function aktuellesModul(kurs: KursDef, stand: KursStand | undefined): string {
  const offen = offeneModule(kurs, stand)
  for (const id of offen) if (modulWert(kurs, stand, id) < 0.6) return id
  return offen[offen.length - 1]
}

/** Gesamtstand des Kurses: alle Lernziele gleich gewichtet */
export const kursWert = (kurs: KursDef, stand: KursStand | undefined): number => mittel(stand, kurs.ziele)

/** Stufe des Spielers im Kurs – bestimmt, welche Spiele schon offen sind */
export function kursStufe(kurs: KursDef, stand: KursStand | undefined): Stufe {
  const wert = kursWert(kurs, stand)
  // Wer im aktuellen Modul weit ist, soll nicht auf den schwachen Rest warten
  const modul = modulWert(kurs, stand, aktuellesModul(kurs, stand))
  const bezug = Math.max(wert, modul * 0.8)
  if (bezug >= 0.8) return 5
  if (bezug >= 0.6) return 4
  if (bezug >= 0.4) return 3
  if (bezug >= 0.2) return 2
  return 1
}
