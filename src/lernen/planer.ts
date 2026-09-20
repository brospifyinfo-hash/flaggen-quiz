// Der Planer: baut aus einem Kurs eine Session, die sich wie eine Folge kleiner Spiele anfühlt.
// Zufällig, aber nicht beliebig – er richtet sich nach dem Lehrplan (offene Module), nach
// schwachen Lernzielen, jüngsten Fehlern, der Zeit seit dem letzten Üben, der Abwechslung
// der Spiele und der Stufe des Spielers. Schwache Ziele kommen öfter, aber jedes Mal in einem
// anderen Spiel. Alles hängt an einem Samen – jede Auswahl lässt sich nachstellen.
import { inhaltVon, spielById, type GeladenerKurs } from './kurse'
import { aktuellesModul, kursStufe, offeneModule, stufeFuer, zielWert } from './meisterschaft'
import type { Aktivitaet, AktivitaetsPlan, Inhalt, KursDef, KursStand, Rng, SpielDef, Stufe, Tempo } from './typen'
import { ableiten, gewichtet, zufall } from './zufall'

const STUNDE = 3_600_000
const TAG = 24 * STUNDE

/** Reihenfolge, die sich gut anfühlt: schnell, knobeln, im Zusammenhang, genau */
const TEMPO_FOLGE: Tempo[] = ['schnell', 'denken', 'kontext', 'genau']

export const spielOffen = (spiel: SpielDef, stufe: Stufe): boolean => !spiel.ab || stufe >= spiel.ab

/** Gibt es für dieses Spiel Inhalte zu diesem Lernziel? */
export function hatInhalt(inhalt: GeladenerKurs, spiel: SpielDef, ziel: string): boolean {
  if (spiel.generator) return spiel.generator.ziele.includes(ziel) && !!inhalt.generatoren?.[spiel.generator.id]
  return (inhalt.index.get(spiel.id)?.get(ziel)?.length ?? 0) > 0
}

/** Wie dringend ein Lernziel dran ist */
export function bedarf(
  kurs: KursDef,
  stand: KursStand | undefined,
  zielId: string,
  jetzt: number,
  offen: ReadonlySet<string>,
  aktuell: string,
  fokus: string | null,
): number {
  const ziel = kurs.ziele.find((z) => z.id === zielId)
  if (!ziel) return 0
  if (!offen.has(ziel.modul) && ziel.modul !== fokus) return 0
  const z = stand?.ziele[zielId]
  const t = z?.t ?? 0
  // Auch Gemeistertes behält etwas Gewicht – es soll ab und zu wiederkommen
  let w = 0.25 + (1 - t)
  if (fokus) w *= ziel.modul === fokus ? 1 : 0.02
  else w *= ziel.modul === aktuell ? 1 : 0.5
  w *= 1 + 0.35 * (z?.fehler ?? 0)
  if (z) {
    const tage = (jetzt - z.zuletzt) / TAG
    if (tage > 2) w *= 1 + Math.min(0.8, tage / 10)
  } else {
    w *= ziel.modul === aktuell ? 1.2 : 0.8
  }
  return w
}

export interface PlanOptionen {
  /** nur dieses Modul üben */
  modul?: string | null
  /** kursübergreifend zuletzt gespielte Spiele, neueste zuerst */
  verlauf?: readonly string[]
  jetzt?: number
}

export interface SitzungsPlan {
  plan: AktivitaetsPlan[]
  /** die Lernziele, um die es vor allem geht */
  fokus: string[]
}

/** Wie viele Aufgaben ein Spiel in den offenen Modulen überhaupt noch anbieten kann */
function vorrat(inhalt: GeladenerKurs, kurs: KursDef, spiel: SpielDef, offen: ReadonlySet<string>): number {
  if (spiel.generator) return Infinity
  const proSpiel = inhalt.index.get(spiel.id)
  if (!proSpiel) return 0
  let n = 0
  for (const ziel of kurs.ziele) if (offen.has(ziel.modul)) n += proSpiel.get(ziel.id)?.length ?? 0
  return n
}

/** Gewicht eines Spiels an einer bestimmten Stelle der Session */
function spielGewicht(
  spiel: SpielDef,
  stelle: number,
  plan: readonly AktivitaetsPlan[],
  stand: KursStand | undefined,
  verlauf: readonly string[],
  vorhanden: number,
): number {
  const vorher = plan[stelle - 1] ? spielById(plan[stelle - 1].spiel) : undefined
  if (vorher?.id === spiel.id) return 0
  let w = 1
  const schon = plan.filter((p) => p.spiel === spiel.id).length
  w *= Math.pow(0.22, schon)
  // Ein zweites Mal lohnt sich nur, wenn danach noch genug Neues übrig ist –
  // sonst bleibt von der Aktivität eine einzige Runde übrig.
  const gebraucht = spiel.runden * (schon + 1)
  if (schon > 0 && vorhanden < gebraucht) w *= Math.pow(Math.max(0, vorhanden / gebraucht), 2)
  const r = verlauf.indexOf(spiel.id)
  if (r >= 0 && r < 5) w *= 0.35 + 0.13 * r
  if (vorher && vorher.tempo === spiel.tempo) w *= 0.55
  if (spiel.lang && plan.filter((p) => spielById(p.spiel)?.lang).length >= 2) return 0
  if (spiel.tempo === TEMPO_FOLGE[stelle % TEMPO_FOLGE.length]) w *= 1.35
  const mag = stand?.spiele[spiel.id]?.mag ?? 0
  w *= 1 + 0.3 * mag
  return w
}

/** Plant eine Session: welche Spiele in welcher Reihenfolge, zu welchen Lernzielen */
export function planeSitzung(
  kurs: KursDef,
  inhalt: GeladenerKurs,
  stand: KursStand | undefined,
  laenge: number,
  rng: Rng,
  optionen: PlanOptionen = {},
): SitzungsPlan {
  const jetzt = optionen.jetzt ?? Date.now()
  const verlauf = [...(optionen.verlauf ?? []), ...(stand?.verlauf ?? [])]
  const fokus = optionen.modul ?? null
  const offen = new Set(offeneModule(kurs, stand))
  const aktuell = aktuellesModul(kurs, stand)
  const stufe = kursStufe(kurs, stand)
  const spiele = kurs.spiele.filter((s) => spielOffen(s, stufe))
  const bedarfe = new Map(kurs.ziele.map((z) => [z.id, bedarf(kurs, stand, z.id, jetzt, offen, aktuell, fokus)]))
  const vorraete = new Map(spiele.map((s) => [s.id, vorrat(inhalt, kurs, s, offen)]))

  // Ab und zu kommt Gemeistertes wieder – in der Mitte der Session, nicht am Anfang
  const gemeistert = kurs.ziele.filter((z) => zielWert(stand, z.id) >= 0.75 && (bedarfe.get(z.id) ?? 0) > 0)
  const wiederholung = laenge >= 5 && gemeistert.length > 0 && rng() < 0.6 ? 1 + Math.floor(rng() * (laenge - 2)) : -1

  // Erst das Spiel, dann das Lernziel darin. Das Spiel wird nach Abwechslung gewählt und nach
  // dem durchschnittlichen Bedarf seiner Inhalte – nicht nach ihrer Menge, sonst kämen Spiele
  // mit Stoff zu vielen Zielen ständig dran. Im Spiel entscheidet dann der Bedarf: Schwache
  // Ziele kommen öfter, aber jedes Mal in einem anderen Spiel.
  const wiederholFaktor = fokus ? 0.85 : 0.6
  const plan: AktivitaetsPlan[] = []
  for (let stelle = 0; stelle < laenge; stelle++) {
    const zielAuswahl = stelle === wiederholung ? gemeistert.map((z) => z.id) : kurs.ziele.map((z) => z.id)
    const zielWertJetzt = (ziel: string) => {
      const b = stelle === wiederholung ? 1 : (bedarfe.get(ziel) ?? 0)
      return b * Math.pow(wiederholFaktor, plan.filter((p) => p.ziel === ziel).length)
    }
    const kandidaten: { spiel: SpielDef; ziele: string[]; werte: number[] }[] = []
    const spielGewichte: number[] = []
    for (const spiel of spiele) {
      const sg = spielGewicht(spiel, stelle, plan, stand, verlauf, vorraete.get(spiel.id) ?? 0)
      if (sg <= 0) continue
      const ziele = zielAuswahl.filter((ziel) => zielWertJetzt(ziel) > 0 && hatInhalt(inhalt, spiel, ziel))
      if (ziele.length === 0) continue
      const werte = ziele.map(zielWertJetzt)
      const mittel = werte.reduce((a, b) => a + b, 0) / werte.length
      kandidaten.push({ spiel, ziele, werte })
      spielGewichte.push(sg * mittel)
    }
    let wahl: AktivitaetsPlan | null = null
    const k = gewichtet(rng, kandidaten, spielGewichte)
    if (k) {
      const ziel = gewichtet(rng, k.ziele, k.werte)
      if (ziel) wahl = { spiel: k.spiel.id, ziel }
    }
    if (!wahl) {
      // Winziger Vorrat: dann darf sich auch ein Spiel wiederholen
      const notfall: AktivitaetsPlan[] = []
      for (const spiel of spiele) {
        for (const z of kurs.ziele) {
          if ((bedarfe.get(z.id) ?? 0) > 0 && hatInhalt(inhalt, spiel, z.id)) notfall.push({ spiel: spiel.id, ziel: z.id })
        }
      }
      wahl = notfall.length ? notfall[Math.floor(rng() * notfall.length)] : null
    }
    if (!wahl) break
    plan.push(wahl)
  }

  const zaehler = new Map<string, number>()
  for (const p of plan) zaehler.set(p.ziel, (zaehler.get(p.ziel) ?? 0) + 1)
  const fokusZiele = [...zaehler.entries()]
    .sort((a, b) => b[1] - a[1] || (bedarfe.get(b[0]) ?? 0) - (bedarfe.get(a[0]) ?? 0))
    .slice(0, 2)
    .map(([id]) => id)
  return { plan, fokus: fokusZiele }
}

/** Gewicht eines Inhalts: passende Stufe, lange nicht gesehen, zuletzt falsch → öfter */
function itemGewicht(item: Inhalt, stufe: Stufe, stand: KursStand | undefined, jetzt: number): number {
  const d = item.stufe - stufe
  const wStufe = d === 0 ? 1 : d === -1 ? 0.5 : d === 1 ? 0.35 : d === -2 ? 0.14 : d === 2 ? 0.08 : 0.02
  const s = stand?.items[item.id]
  if (!s) return wStufe
  const stunden = (jetzt - s.zuletzt) / STUNDE
  if (s.serie === 0) return wStufe * (stunden < 1 / 6 ? 0.03 : 1.3)
  const abstand = [0.5, 24, 72, 168, 504][Math.min(s.serie, 4)]
  return wStufe * Math.max(0.04, Math.min(1, stunden / abstand)) * 0.9
}

export interface AuswahlOptionen {
  seed: number
  /** Stufe um so viel verschieben – für Pausen nach Fehlern und die Schlussaufgabe */
  anpassung?: number
  /** in dieser Session schon gezeigt */
  gesehen?: ReadonlySet<string>
  jetzt?: number
  finale?: boolean
  /** weniger Runden als üblich – für Random Mode und Bürger-Bitten */
  runden?: number
}

/** Die konkrete Aktivität zu einem Planeintrag: Stufe bestimmen, Inhalte auswählen oder erzeugen */
export function aktivitaetFuer(
  kurs: KursDef,
  inhalt: GeladenerKurs,
  stand: KursStand | undefined,
  eintrag: AktivitaetsPlan,
  optionen: AuswahlOptionen,
): Aktivitaet | null {
  const spiel = spielById(eintrag.spiel)
  if (!spiel) return null
  const rng = zufall(optionen.seed)
  const jetzt = optionen.jetzt ?? Date.now()
  const grund = stufeFuer(zielWert(stand, eintrag.ziel))
  const gewuenscht = Math.max(1, Math.min(5, grund + (optionen.anpassung ?? 0))) as Stufe
  const runden = Math.max(1, Math.min(spiel.runden, optionen.runden ?? spiel.runden))

  if (spiel.generator) {
    const erzeuge = inhalt.generatoren?.[spiel.generator.id]
    if (!erzeuge) return null
    const items: Inhalt[] = []
    for (let i = 0; i < runden; i++) {
      const item = erzeuge(gewuenscht, zufall(ableiten(optionen.seed, i)), eintrag.ziel)
      if (item) items.push({ ...item, id: `gen:${spiel.id}:${optionen.seed}:${i}`, spiel: spiel.id, ziel: item.ziel || eintrag.ziel })
    }
    if (items.length === 0) return null
    return { kurs: kurs.id, spiel: spiel.id, ziel: eintrag.ziel, stufe: gewuenscht, seed: optionen.seed, items, ...(optionen.finale ? { finale: true } : {}) }
  }

  const proSpiel = inhalt.index.get(spiel.id)
  if (!proSpiel) return null
  const gesehen = optionen.gesehen ?? new Set<string>()
  // Erst das gewünschte Lernziel, dann Nachbarn aus demselben Modul, dann der Rest der offenen Module
  const modul = kurs.ziele.find((z) => z.id === eintrag.ziel)?.modul
  const offen = new Set(offeneModule(kurs, stand))
  const stufen: Inhalt[][] = [
    proSpiel.get(eintrag.ziel) ?? [],
    kurs.ziele.filter((z) => z.modul === modul && z.id !== eintrag.ziel).flatMap((z) => proSpiel.get(z.id) ?? []),
    kurs.ziele.filter((z) => z.modul !== modul && offen.has(z.modul)).flatMap((z) => proSpiel.get(z.id) ?? []),
  ]
  // Ein gemeinsamer Vorrat: das eigene Lernziel zählt voll, Nachbarn im Modul ein Viertel,
  // der Rest wenig. Gerade Gemeistertes weicht so Stoff aus demselben Zusammenhang.
  const faktoren = [1, 0.25, 0.06]
  const pool: Inhalt[] = []
  const gewichte: number[] = []
  stufen.forEach((schicht, i) => {
    for (const item of schicht) {
      if (gesehen.has(item.id)) continue
      pool.push(item)
      gewichte.push(itemGewicht(item, gewuenscht, stand, jetzt) * faktoren[i])
    }
  })
  const gewaehlt: Inhalt[] = []
  while (gewaehlt.length < runden && pool.length > 0) {
    const item = gewichtet(rng, pool, gewichte)
    if (!item) break
    const i = pool.indexOf(item)
    pool.splice(i, 1)
    gewichte.splice(i, 1)
    gewaehlt.push(item)
  }
  // Alles schon gesehen? Dann lieber Bekanntes wiederholen als gar nichts spielen
  if (gewaehlt.length === 0) {
    const alle = proSpiel.get(eintrag.ziel) ?? []
    if (alle.length === 0) return null
    gewaehlt.push(alle[Math.floor(rng() * alle.length)])
  }
  const mittel = Math.round(gewaehlt.reduce((s, item) => s + item.stufe, 0) / gewaehlt.length) as Stufe
  return {
    kurs: kurs.id,
    spiel: spiel.id,
    ziel: eintrag.ziel,
    stufe: Math.max(1, Math.min(5, mittel)) as Stufe,
    seed: optionen.seed,
    items: gewaehlt.map((item) => item.id),
    ...(optionen.finale ? { finale: true } : {}),
  }
}

/** Eine einzelne Aktivität – für Random Mode und Bürger-Bitten */
export function einzelneAktivitaet(
  kurs: KursDef,
  stand: KursStand | undefined,
  seed: number,
  optionen: { verlauf?: readonly string[]; spiel?: string; jetzt?: number; kurz?: boolean } = {},
): Aktivitaet | null {
  const inhalt = inhaltVon(kurs.id)
  if (!inhalt) return null
  const rng = zufall(seed)
  let eintrag: AktivitaetsPlan | null = null
  if (optionen.spiel) {
    const spiel = spielById(optionen.spiel)
    if (!spiel) return null
    const jetzt = optionen.jetzt ?? Date.now()
    const offen = new Set(offeneModule(kurs, stand))
    const aktuell = aktuellesModul(kurs, stand)
    const ziele = kurs.ziele.filter((z) => hatInhalt(inhalt, spiel, z.id))
    const gewichte = ziele.map((z) => bedarf(kurs, stand, z.id, jetzt, offen, aktuell, null) || 0.05)
    const ziel = gewichtet(rng, ziele, gewichte)
    if (ziel) eintrag = { spiel: spiel.id, ziel: ziel.id }
  } else {
    eintrag = planeSitzung(kurs, inhalt, stand, 1, rng, { verlauf: optionen.verlauf, jetzt: optionen.jetzt }).plan[0] ?? null
  }
  if (!eintrag) return null
  const spiel = spielById(eintrag.spiel)
  const runden = optionen.kurz && spiel ? Math.max(1, Math.ceil(spiel.runden / 2)) : undefined
  return aktivitaetFuer(kurs, inhalt, stand, eintrag, { seed: ableiten(seed, 99), jetzt: optionen.jetzt, runden })
}
