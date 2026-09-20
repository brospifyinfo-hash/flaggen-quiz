// Lernwelten: das Datenmodell. Ein Kurs ist kein Spiel, sondern eine Sammlung von Spielen
// rund um ein Fach. Alles hier ist reine Beschreibung – Inhalte, Spiellogik, Oberfläche und
// Fortschritt liegen getrennt. Ein neuer Kurs braucht nur eine Definition und Inhalte.

export type Stufe = 1 | 2 | 3 | 4 | 5
export const STUFEN: readonly Stufe[] = [1, 2, 3, 4, 5]
export const STUFE_NAME: Record<Stufe, string> = {
  1: 'Einsteiger',
  2: 'Mittelstufe',
  3: 'Fortgeschritten',
  4: 'Experte',
  5: 'Meister',
}

/** Die Spielmechaniken – jede ist eine eigene Komponente, die jeder Kurs nutzen kann */
export type MechanikId =
  | 'fehler'
  | 'dokument'
  | 'bau'
  | 'wahl'
  | 'duell'
  | 'dialog'
  | 'hoeren'
  | 'aussprache'
  | 'paare'
  | 'sortieren'
  | 'rechnen'
  | 'kasse'
  | 'kredit'
  | 'roboter'
  | 'baukasten'
  | 'netz'
  | 'fall'

/** Wie sich eine Aktivität anfühlt – daraus mischt der Planer eine abwechslungsreiche Session */
export type Tempo = 'schnell' | 'denken' | 'kontext' | 'genau'

export type Sprache = 'de-DE' | 'en-GB' | 'fr-FR'

export interface Modul {
  id: string
  titel: string
  emoji: string
  text: string
}

export interface Lernziel {
  id: string
  titel: string
  modul: string
}

export interface Bittsteller {
  name: string
  emoji: string
  rolle: string
}

export interface SpielDef {
  /** weltweit eindeutig, mit Kurs-Kürzel: 'de.detektiv' */
  id: string
  mechanik: MechanikId
  name: string
  emoji: string
  /** ein Satz auf der Karte */
  kurz: string
  /** Anleitung vor dem Start */
  anleitung: string
  tempo: Tempo
  /** Runden je Aktivität */
  runden: number
  /** erst ab dieser Kursstufe */
  ab?: Stufe
  /** liest sich lang – höchstens zwei davon je Session */
  lang?: boolean
  /** Inhalte kommen aus einem Generator; ziele sagt, welche Lernziele er abdeckt */
  generator?: { id: string; ziele: string[] }
  /** Darstellungsvariante der Mechanik, z. B. 'code' oder 'mail' */
  skin?: string
  /** Fächer beim Sortieren */
  faecher?: { name: string; emoji: string }[]
  /** Spaltentitel beim Zuordnen */
  spalten?: [string, string]
  /** Bürger in der Stadt können um genau dieses Spiel bitten */
  bitte?: { wer: Bittsteller[]; saetze: string[] }
}

export interface KursInhalt {
  items: Inhalt[]
  generatoren?: Record<string, Generator>
}

export interface KursDef {
  id: string
  titel: string
  emoji: string
  /** Leitsatz auf der Kursseite */
  claim: string
  /** Wissensgebiet, auf das der Kurs einzahlt (src/knowledge.ts) */
  domain: string
  /** "Deutsch-Wissen" */
  wissen: string
  /** Zielsprache für die Sprachausgabe */
  sprache?: Sprache
  /** CSS-Klasse für die eigene Optik */
  thema: string
  module: Modul[]
  ziele: Lernziel[]
  spiele: SpielDef[]
  /** Hinweis auf der Kursseite, z. B. dass Bankfälle erfunden sind */
  hinweis?: string
  /** Inhalte werden erst geladen, wenn man sie braucht */
  laden: () => Promise<KursInhalt>
}

// ---------- Zufall ----------

export type Rng = () => number

/** Erzeugt einen Inhalt passend zu Stufe und Lernziel – für Fälle, die man ausrechnen kann */
export type Generator = (stufe: Stufe, rng: Rng, ziel: string) => Inhalt | null

// ---------- Inhalte ----------

interface Basis {
  id: string
  /** das Spiel, zu dem der Inhalt gehört */
  spiel: string
  ziel: string
  stufe: Stufe
  /** kurze Erklärung nach der Antwort */
  erklaerung?: string
  /** ausführlich, hinter „Warum?“ */
  mehr?: string
  /** Etikett für den Zusammenhang, z. B. „Geschäftsbrief“ */
  kontext?: string
}

export interface WahlOption {
  text: string
  richtig?: boolean
  /** Teilpunkte für „geht, aber nicht ideal“ (0 bis 1) */
  teil?: number
  warum?: string
  /** Aussprachehilfe */
  laut?: string
}

/** Eine Fehlerstelle im Text: angezeigt wird das Falsche, verbessern soll man es */
export interface FehlerStelle {
  zeige: string
  richtig: string
  falsch: string[]
  warum?: string
}

export type FehlerTeil = string | FehlerStelle

export interface FehlerItem extends Basis {
  art: 'fehler'
  /** Kopfzeilen, z. B. Absender und Betreff einer E-Mail */
  kopf?: [string, string][]
  titel?: string
  teile: FehlerTeil[]
  code?: boolean
}

export interface DokumentZeile {
  label: string
  wert: string
  fehler?: { richtig: string; falsch: string[]; warum: string }
}

export interface DokumentItem extends Basis {
  art: 'dokument'
  titel: string
  untertitel?: string
  auftrag: string
  zeilen: DokumentZeile[]
}

export interface BauItem extends Basis {
  art: 'bau'
  /** in der richtigen Reihenfolge */
  teile: string[]
  /** so viele Teile stehen schon am Anfang */
  fest?: number
  /** weitere richtige Reihenfolgen */
  alternativen?: string[][]
  /** Teile, die nicht hineingehören */
  extra?: string[]
  /** was der Satz bedeutet – bei Fremdsprachen */
  bedeutung?: string
  aufgabe?: string
  sprache?: Sprache
}

export interface WahlItem extends Basis {
  art: 'wahl'
  aufgabe?: string
  /** Satz mit ___ als Lücke */
  satz?: string
  /** Ausgangssatz beim Umformen und Verbessern */
  quelle?: string
  /** Zielform, z. B. „Passiv“ oder „formell“ */
  richtung?: string
  sprecher?: { name: string; emoji: string; text: string; de?: string; laut?: string }
  /** Steckbrief, z. B. eines Bankkunden */
  karte?: { titel: string; emoji?: string; zeilen: [string, string][] }
  sprache?: Sprache
  optionen: WahlOption[]
  /** zweiter Schritt: Warum? */
  begruendung?: { frage: string; optionen: WahlOption[] }
}

export interface DuellItem extends Basis {
  art: 'duell'
  a: string
  b: string
  richtig: 'a' | 'b'
  warum: string
  frage?: string
  sprache?: Sprache
}

export interface DialogAntwort {
  text: string
  de?: string
  laut?: string
  /** 2 natürlich · 1 verständlich, aber holprig · 0 passt nicht */
  guete: 0 | 1 | 2
  reaktion?: string
  reaktionDe?: string
  feedback?: string
  /** merkt sich etwas für später, z. B. das bestellte Getränk */
  setze?: Record<string, string>
  /** springt zu diesem Schritt statt zum nächsten */
  weiter?: string
}

export interface DialogSchritt {
  id?: string
  /** darf {platzhalter} aus setze enthalten */
  npc: string
  de?: string
  laut?: string
  antworten: DialogAntwort[]
}

export interface DialogItem extends Basis {
  art: 'dialog'
  ort: string
  ortEmoji: string
  auftrag: string
  person: { name: string; emoji: string }
  sprache: Sprache
  schritte: DialogSchritt[]
  abschluss?: string
  abschlussDe?: string
}

export interface HoerItem extends Basis {
  art: 'hoeren'
  sprache: Sprache
  text: string
  de?: string
  frage: string
  optionen: WahlOption[]
}

export interface AusspracheItem extends Basis {
  art: 'aussprache'
  sprache: Sprache
  wort: string
  bedeutung: string
  /** Lautschrift nach IPA – die eigentliche Aussprache */
  ipa: string
  /** ungefähre Umschrift für deutsche Ohren */
  hilfe: string
  /** falsche Umschriften zur Auswahl */
  falsch: string[]
  tipp: string
  /** 'hoeren': anhören und das Gehörte unter ähnlichen Wörtern finden */
  modus: 'lesen' | 'hoeren'
  /** beim Hören: Wörter, die ähnlich klingen */
  aehnlich?: string[]
}

export interface PaarItem extends Basis {
  art: 'paar'
  links: string
  rechts: string
  sprache?: Sprache
}

export interface KarteItem extends Basis {
  art: 'karte'
  text: string
  detail?: string
  /** Index in faecher des Spiels */
  fach: number
  warum: string
}

export interface RechenItem extends Basis {
  art: 'rechnen'
  aufgabe: string
  daten?: [string, string][]
  einheit?: string
  loesung: number
  /** erlaubte Abweichung */
  toleranz: number
  rechenweg: string[]
  nachkomma?: number
}

export interface KassenItem extends Basis {
  art: 'kasse'
  typ: 'auszahlung' | 'einzahlung' | 'verfuegbar'
  kunde: { name: string; emoji: string }
  text: string
  /** gewünschter Betrag bei der Auszahlung */
  betrag?: number
  /** Scheine und Münzen bei der Einzahlung */
  buendel?: number[]
  kontostand?: number
  dispo?: number
  /** diese Scheine will der Kunde nicht */
  ohne?: number[]
  /** mit Summenanzeige? */
  summe: boolean
  loesung: number
}

export interface KreditItem extends Basis {
  art: 'kredit'
  kunde: { name: string; emoji: string; beruf: string }
  netto: number
  ausgaben: [string, number][]
  raten: number
  betrag: number
  monate: number
  zins: number
  rate: number
  ueberschuss: number
  /** 2 tragbar · 1 knapp · 0 nicht tragbar */
  urteil: 0 | 1 | 2
  rateOptionen: number[]
  risiko?: string
}

export type RoboterBefehl = 'vor' | 'links' | 'rechts' | 'f' | 'wdh' | 'wennFrei' | 'wennWandRechts' | 'wennWandLinks'

export interface RoboterItem extends Basis {
  art: 'roboter'
  titel: string
  breite: number
  hoehe: number
  /** x, y, Richtung 0 Nord · 1 Ost · 2 Süd · 3 West */
  start: [number, number, number]
  zielfeld: [number, number]
  waende: [number, number][]
  muenzen?: [number, number][]
  befehle: RoboterBefehl[]
  plaetze: number
  funktion?: number
  par: number
  tipp?: string
  /** eine Lösung, die gezeigt wird, wenn man aufgibt */
  loesung: { haupt: { b: RoboterBefehl; n?: number }[]; f?: { b: RoboterBefehl; n?: number }[] }
}

export interface Bauteil {
  id: string
  typ: 'cpu' | 'board' | 'ram' | 'gpu' | 'netzteil' | 'gehaeuse'
  name: string
  info: string
  sockel?: string
  ram?: 'DDR4' | 'DDR5'
  formfaktor?: 'ATX' | 'Micro-ATX' | 'Mini-ITX'
  passt?: ('ATX' | 'Micro-ATX' | 'Mini-ITX')[]
  watt?: number
  laenge?: number
  maxLaenge?: number
  grafik?: boolean
}

export interface BaukastenItem extends Basis {
  art: 'baukasten'
  modus: 'bauen' | 'pruefen'
  zweck: string
  /** je Platz die Auswahl; beim Prüfen ist genau ein Teil gesetzt */
  plaetze: { typ: Bauteil['typ']; optionen: Bauteil[]; gesetzt?: number }[]
  /** beim Prüfen: das Teil, das nicht passt, und warum */
  problem?: { typ: Bauteil['typ']; grund: string; falsch: string[] }
  braucht: { grafik: boolean }
}

export interface NetzGeraet {
  id: string
  name: string
  emoji: string
  ip: string
  maske: string
  gateway: string
  dns: string
  kabel: boolean
  dhcp: boolean
}

export interface NetzItem extends Basis {
  art: 'netz'
  geraete: NetzGeraet[]
  router: { ip: string; dhcp: boolean; internet: boolean }
  /** betroffenes Gerät */
  betroffen: string
  symptom: string
  fehler: 'kabel' | 'gateway' | 'subnetz' | 'dns' | 'doppelt' | 'dhcp'
  optionen: WahlOption[]
}

export interface FallItem extends Basis {
  art: 'fall'
  person: { name: string; emoji: string; rolle: string }
  anliegen: string
  pruefungen: { frage: string; befund: string; wichtig?: boolean }[]
  diagnose: { frage: string; optionen: WahlOption[] }
  schritt2?: { frage: string; optionen: WahlOption[]; mehrfach?: boolean }
}

export type Inhalt =
  | FehlerItem
  | DokumentItem
  | BauItem
  | WahlItem
  | DuellItem
  | DialogItem
  | HoerItem
  | AusspracheItem
  | PaarItem
  | KarteItem
  | RechenItem
  | KassenItem
  | KreditItem
  | RoboterItem
  | BaukastenItem
  | NetzItem
  | FallItem

// ---------- Fortschritt ----------

/** Lernstand eines Lernziels: t ist die geschätzte Beherrschung von 0 bis 1 */
export interface ZielStand {
  t: number
  n: number
  ok: number
  zuletzt: number
  /** jüngste Fehler, klingen mit jedem Erfolg ab */
  fehler: number
}

export interface ItemStand {
  n: number
  ok: number
  serie: number
  zuletzt: number
}

export interface SpielStand {
  n: number
  /** Summe der Punkte (0 bis 1 je Aktivität) */
  summe: number
  zuletzt: number
  /** -1 weniger davon · 1 mehr davon */
  mag?: number
}

export interface KursStand {
  ziele: Record<string, ZielStand>
  items: Record<string, ItemStand>
  spiele: Record<string, SpielStand>
  sitzungen: number
  perfekt: number
  aktivitaeten: number
  bestCombo: number
  zuletzt: number
  /** zuletzt gespielte Spiele, neueste zuerst */
  verlauf: string[]
  /** Tagesserie: letzter Lerntag (JJJJ-MM-TT) und Länge */
  tag?: string
  serie?: number
}

export interface RundenErgebnis {
  /** Inhalt, zu dem die Runde gehört */
  id: string
  ziel: string
  stufe: Stufe
  /** 0 bis 1 */
  punkte: number
}

export interface AktivitaetsErgebnis {
  punkte: number
  runden: RundenErgebnis[]
  /** übersprungen, weil Inhalte fehlten – zählt weder als Erfolg noch als Fehler */
  uebersprungen?: boolean
}

export interface AktivitaetsPlan {
  spiel: string
  ziel: string
}

/** Eine konkrete Aktivität: Spiel, Stufe und die ausgewählten Inhalte */
export interface Aktivitaet {
  kurs: string
  spiel: string
  ziel: string
  stufe: Stufe
  seed: number
  /** IDs vorhandener Inhalte oder erzeugte Inhalte selbst */
  items: (string | Inhalt)[]
  finale?: boolean
}

export interface AktivitaetsBilanz {
  spiel: string
  ziel: string
  stufe: Stufe
  punkte: number
  xp: number
}

export interface KursSitzung {
  kurs: string
  seed: number
  laenge: number
  modul: string | null
  plan: AktivitaetsPlan[]
  index: number
  aktuell: Aktivitaet | null
  /** die aktuelle Aktivität ist abgerechnet */
  fertig: boolean
  bilanz: AktivitaetsBilanz[]
  combo: number
  bestCombo: number
  xp: number
  muenzen: number
  material: number
  wissen: number
  vorher: { ziele: Record<string, number>; punkte: number }
  /** in dieser Session schon gezeigte Inhalte – kommen nicht noch einmal */
  gesehen: string[]
  /** in dieser Session erreichte Achievements */
  erfolge: string[]
  start: number
}

export interface SitzungsBilanz {
  kurs: string
  laenge: number
  aktivitaeten: AktivitaetsBilanz[]
  xp: number
  muenzen: number
  material: number
  wissen: number
  bestCombo: number
  perfekt: boolean
  bonus: number
  ziele: { id: string; vorher: number; nachher: number }[]
  /** Gebäude, die das neue Wissen freigeschaltet hat */
  freigeschaltet: string[]
  erfolge: string[]
  ende: number
}

export interface LernStand {
  kurse: Record<string, KursStand>
  sitzung: KursSitzung | null
  letzte: SitzungsBilanz | null
  /** kursübergreifend zuletzt gespielte Spiele – für Abwechslung im Random Mode */
  verlauf: string[]
}
