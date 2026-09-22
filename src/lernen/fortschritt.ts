// Der Lernstand im Spielstand: lesen, fortschreiben, prüfen und zusammenführen.
// Alles bleibt auf dem Gerät – im selben JSON wie Stadt, XP und Flaggen, auch offline.
import type { SaveData } from '../types'
import type {
  Aktivitaet,
  AktivitaetsBilanz,
  ItemStand,
  KursSitzung,
  KursStand,
  LernStand,
  SitzungsBilanz,
  SpielStand,
  Stufe,
  ZielStand,
} from './typen'

export const LEERER_KURS: KursStand = {
  ziele: {},
  items: {},
  spiele: {},
  sitzungen: 0,
  perfekt: 0,
  aktivitaeten: 0,
  bestCombo: 0,
  zuletzt: 0,
  verlauf: [],
}

export const LEERES_LERNEN: LernStand = { kurse: {}, sitzung: null, letzte: null, verlauf: [] }

export const lernen = (data: SaveData): LernStand => data.lernen ?? LEERES_LERNEN
export const kursStand = (data: SaveData, kurs: string): KursStand | undefined => data.lernen?.kurse[kurs]

export function mitKurs(data: SaveData, kurs: string, neu: (stand: KursStand) => KursStand): SaveData {
  const l = lernen(data)
  return { ...data, lernen: { ...l, kurse: { ...l.kurse, [kurs]: neu(l.kurse[kurs] ?? LEERER_KURS) } } }
}

export function mitLernen(data: SaveData, neu: (l: LernStand) => LernStand): SaveData {
  return { ...data, lernen: neu(lernen(data)) }
}

export function itemNachher(vorher: ItemStand | undefined, punkte: number, jetzt: number): ItemStand {
  const ok = punkte >= 0.7
  return {
    n: (vorher?.n ?? 0) + 1,
    ok: (vorher?.ok ?? 0) + (ok ? 1 : 0),
    serie: ok ? (vorher?.serie ?? 0) + 1 : 0,
    zuletzt: jetzt,
  }
}

export function spielNachher(vorher: SpielStand | undefined, punkte: number, jetzt: number): SpielStand {
  return {
    ...(vorher?.mag ? { mag: vorher.mag } : {}),
    n: (vorher?.n ?? 0) + 1,
    summe: (vorher?.summe ?? 0) + Math.max(0, Math.min(1, punkte)),
    zuletzt: jetzt,
  }
}

/** Datum als JJJJ-MM-TT in Ortszeit – für die Tagesserie */
export function tagVon(zeit: number): string {
  const d = new Date(zeit)
  const zwei = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`
}

/** Tagesserie fortschreiben: heute schon gelernt, gestern gelernt oder neu anfangen */
export function serieNachher(stand: KursStand, jetzt: number): Pick<KursStand, 'tag' | 'serie'> {
  const heute = tagVon(jetzt)
  if (stand.tag === heute) return { tag: heute, serie: stand.serie ?? 1 }
  const gestern = tagVon(jetzt - 86_400_000)
  return { tag: heute, serie: stand.tag === gestern ? (stand.serie ?? 0) + 1 : 1 }
}

// ---------- Prüfen beim Laden ----------

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const zahl = (value: unknown, max = Number.MAX_SAFE_INTEGER): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.min(max, value) : 0
const text = (value: unknown, max = 80): string | null =>
  typeof value === 'string' && value.length > 0 && value.length <= max ? value : null
const stufe = (value: unknown): Stufe => (value === 2 || value === 3 || value === 4 || value === 5 ? value : 1)
const texte = (value: unknown, max: number): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.length <= 80).slice(0, max) : []

function leseZiele(value: unknown): Record<string, ZielStand> {
  const aus: Record<string, ZielStand> = {}
  if (!isObject(value)) return aus
  for (const [id, z] of Object.entries(value)) {
    if (!isObject(z) || id.length > 80) continue
    aus[id] = { t: zahl(z.t, 1), n: zahl(z.n), ok: zahl(z.ok), zuletzt: zahl(z.zuletzt), fehler: zahl(z.fehler, 6) }
  }
  return aus
}

function leseItems(value: unknown): Record<string, ItemStand> {
  const aus: Record<string, ItemStand> = {}
  if (!isObject(value)) return aus
  for (const [id, z] of Object.entries(value)) {
    if (!isObject(z) || id.length > 80) continue
    aus[id] = { n: zahl(z.n), ok: zahl(z.ok), serie: zahl(z.serie), zuletzt: zahl(z.zuletzt) }
  }
  return aus
}

function leseSpiele(value: unknown): Record<string, SpielStand> {
  const aus: Record<string, SpielStand> = {}
  if (!isObject(value)) return aus
  for (const [id, z] of Object.entries(value)) {
    if (!isObject(z) || id.length > 80) continue
    const mag = z.mag === 1 || z.mag === -1 ? z.mag : undefined
    aus[id] = { n: zahl(z.n), summe: zahl(z.summe), zuletzt: zahl(z.zuletzt), ...(mag ? { mag } : {}) }
  }
  return aus
}

function leseKurs(value: unknown): KursStand | null {
  if (!isObject(value)) return null
  const tag = typeof value.tag === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.tag) ? value.tag : undefined
  return {
    ziele: leseZiele(value.ziele),
    items: leseItems(value.items),
    spiele: leseSpiele(value.spiele),
    sitzungen: zahl(value.sitzungen),
    perfekt: zahl(value.perfekt),
    aktivitaeten: zahl(value.aktivitaeten),
    bestCombo: zahl(value.bestCombo),
    zuletzt: zahl(value.zuletzt),
    verlauf: texte(value.verlauf, 12),
    ...(tag ? { tag, serie: Math.max(1, zahl(value.serie)) } : {}),
  }
}

function leseBilanz(value: unknown): AktivitaetsBilanz | null {
  if (!isObject(value)) return null
  const spiel = text(value.spiel)
  const ziel = text(value.ziel)
  if (!spiel || !ziel) return null
  return { spiel, ziel, stufe: stufe(value.stufe), punkte: zahl(value.punkte, 1), xp: zahl(value.xp) }
}

/**
 * Eine laufende Aktivität: Inhalte sind IDs oder erzeugte Objekte. Erzeugte Inhalte werden
 * nur grob geprüft – die Spiele prüfen beim Anzeigen, ob sie damit etwas anfangen können.
 */
function leseAktivitaet(value: unknown): Aktivitaet | null {
  if (!isObject(value)) return null
  const kurs = text(value.kurs)
  const spiel = text(value.spiel)
  const ziel = text(value.ziel)
  if (!kurs || !spiel || !ziel || !Array.isArray(value.items) || value.items.length === 0) return null
  const items = value.items.filter(
    (item): item is Aktivitaet['items'][number] =>
      (typeof item === 'string' && item.length <= 80) || (isObject(item) && typeof item.id === 'string' && typeof item.art === 'string'),
  )
  if (items.length !== value.items.length) return null
  return {
    kurs,
    spiel,
    ziel,
    stufe: stufe(value.stufe),
    seed: zahl(value.seed) >>> 0,
    items,
    ...(value.finale === true ? { finale: true } : {}),
  }
}

function leseSitzung(value: unknown): KursSitzung | null {
  if (!isObject(value)) return null
  const kurs = text(value.kurs)
  if (!kurs || !Array.isArray(value.plan) || value.plan.length === 0 || value.plan.length > 12) return null
  const plan = value.plan
    .map((p) => (isObject(p) && text(p.spiel) && text(p.ziel) ? { spiel: p.spiel as string, ziel: p.ziel as string } : null))
    .filter((p): p is { spiel: string; ziel: string } => p !== null)
  if (plan.length !== value.plan.length) return null
  const index = Math.floor(zahl(value.index, plan.length))
  const bilanz = Array.isArray(value.bilanz)
    ? value.bilanz.map(leseBilanz).filter((b): b is AktivitaetsBilanz => b !== null)
    : []
  const vorher = isObject(value.vorher) ? value.vorher : {}
  const vorherZiele: Record<string, number> = {}
  if (isObject(vorher.ziele)) {
    for (const [id, t] of Object.entries(vorher.ziele)) if (typeof t === 'number' && id.length <= 80) vorherZiele[id] = zahl(t, 1)
  }
  return {
    kurs,
    seed: zahl(value.seed) >>> 0,
    laenge: plan.length,
    modul: text(value.modul),
    plan,
    index,
    aktuell: leseAktivitaet(value.aktuell),
    fertig: value.fertig === true,
    bilanz,
    combo: zahl(value.combo),
    bestCombo: zahl(value.bestCombo),
    xp: zahl(value.xp),
    muenzen: zahl(value.muenzen),
    material: zahl(value.material),
    wissen: zahl(value.wissen),
    vorher: { ziele: vorherZiele, punkte: zahl(vorher.punkte) },
    gesehen: texte(value.gesehen, 120),
    erfolge: texte(value.erfolge, 40),
    start: zahl(value.start),
  }
}

function leseErgebnis(value: unknown): SitzungsBilanz | null {
  if (!isObject(value)) return null
  const kurs = text(value.kurs)
  if (!kurs) return null
  const ziele = Array.isArray(value.ziele)
    ? value.ziele
        .filter((z): z is Record<string, unknown> => isObject(z) && typeof z.id === 'string')
        .map((z) => ({ id: z.id as string, vorher: zahl(z.vorher, 1), nachher: zahl(z.nachher, 1) }))
    : []
  return {
    kurs,
    laenge: zahl(value.laenge, 12),
    aktivitaeten: Array.isArray(value.aktivitaeten)
      ? value.aktivitaeten.map(leseBilanz).filter((b): b is AktivitaetsBilanz => b !== null)
      : [],
    xp: zahl(value.xp),
    muenzen: zahl(value.muenzen),
    material: zahl(value.material),
    wissen: zahl(value.wissen),
    bestCombo: zahl(value.bestCombo),
    perfekt: value.perfekt === true,
    bonus: zahl(value.bonus),
    ziele,
    freigeschaltet: texte(value.freigeschaltet, 20),
    erfolge: texte(value.erfolge, 40),
    ende: zahl(value.ende),
  }
}

/** Geprüfte Fassung aus dem Speicher – undefined, wenn noch nie gelernt wurde */
export function leseLernen(value: unknown): LernStand | undefined {
  if (!isObject(value)) return undefined
  const kurse: Record<string, KursStand> = {}
  if (isObject(value.kurse)) {
    for (const [id, stand] of Object.entries(value.kurse)) {
      const kurs = leseKurs(stand)
      if (kurs && id.length <= 40) kurse[id] = kurs
    }
  }
  return {
    kurse,
    sitzung: leseSitzung(value.sitzung),
    letzte: leseErgebnis(value.letzte),
    verlauf: texte(value.verlauf, 12),
  }
}

/** Zwei Stände zusammenführen (beiseitegelegte Sicherung): nichts geht verloren, nichts zählt doppelt */
export function fuehreZusammen(a: LernStand | undefined, b: LernStand | undefined): LernStand | undefined {
  if (!a || !b) return a ?? b
  const kurse: Record<string, KursStand> = { ...b.kurse }
  for (const [id, x] of Object.entries(a.kurse)) {
    const y = kurse[id]
    if (!y) {
      kurse[id] = x
      continue
    }
    const neuer = x.zuletzt >= y.zuletzt ? x : y
    const ziele = { ...y.ziele }
    for (const [zid, z] of Object.entries(x.ziele)) {
      const w = ziele[zid]
      ziele[zid] = !w || z.zuletzt >= w.zuletzt ? { ...z, n: Math.max(z.n, w?.n ?? 0), ok: Math.max(z.ok, w?.ok ?? 0) } : { ...w, n: Math.max(z.n, w.n), ok: Math.max(z.ok, w.ok) }
    }
    const items = { ...y.items }
    for (const [iid, z] of Object.entries(x.items)) {
      const w = items[iid]
      items[iid] = !w || z.zuletzt >= w.zuletzt ? { ...z, n: Math.max(z.n, w?.n ?? 0), ok: Math.max(z.ok, w?.ok ?? 0) } : { ...w, n: Math.max(z.n, w.n), ok: Math.max(z.ok, w.ok) }
    }
    const spiele = { ...y.spiele }
    for (const [sid, z] of Object.entries(x.spiele)) {
      const w = spiele[sid]
      spiele[sid] = !w || z.n >= w.n ? z : w
    }
    kurse[id] = {
      ...neuer,
      ziele,
      items,
      spiele,
      sitzungen: Math.max(x.sitzungen, y.sitzungen),
      perfekt: Math.max(x.perfekt, y.perfekt),
      aktivitaeten: Math.max(x.aktivitaeten, y.aktivitaeten),
      bestCombo: Math.max(x.bestCombo, y.bestCombo),
      zuletzt: Math.max(x.zuletzt, y.zuletzt),
    }
  }
  return {
    kurse,
    sitzung: a.sitzung ?? b.sitzung,
    letzte: a.letzte ?? b.letzte,
    verlauf: a.verlauf.length ? a.verlauf : b.verlauf,
  }
}
