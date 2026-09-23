/**
 * Das Postfach: Nachrichten an alle Spielerinnen und Spieler – vor allem die Liste dessen,
 * was mit jedem Update neu ist. Die Einträge stehen fest im Code; wer eine Kennung noch
 * nicht als gelesen gespeichert hat, sieht sie als neu.
 *
 * Neue Updates kommen OBEN dazu. Kennung: Datum plus Buchstabe, damit sie eindeutig bleibt.
 */
import type { SaveData } from './types'

export interface Nachricht {
  id: string
  /** Anzeigedatum, z. B. „23. September 2026“ */
  datum: string
  titel: string
  /** Kurzer Einstieg */
  text: string
  /** Was im Einzelnen neu ist */
  punkte: string[]
}

export const NACHRICHTEN: Nachricht[] = [
  {
    id: '2026-09-23-h',
    datum: '23. September 2026',
    titel: 'Menü oben links',
    text: 'Stadtname und Tageszeit haben wieder Platz. Einstellungen, Neuigkeiten und die Rangliste liegen hinter einem Menü.',
    punkte: [
      'Oben links ist nur noch ein kleines Menü. Darin: Einstellungen, Neuigkeiten und Rang.',
      'Ein roter Punkt am Menü bedeutet neue Neuigkeiten oder einen neuen ersten Platz in der Rangliste.',
    ],
  },
  {
    id: '2026-09-23-g',
    datum: '23. September 2026',
    titel: 'Die Rangliste hat ein Podest',
    text: 'Die größten Städte stehen auf einer Bühne. Auf der Startseite öffnest du sie nur noch über den Pokal.',
    punkte: [
      'Platz eins thront in der Mitte, daneben Platz zwei und drei. Darunter folgen die weiteren Plätze.',
      'Zu sehen sind der Pokal, der Name, der Rang, das Level, die Stadtstufe und die Einwohner.',
      'Auf der Startseite liegt die Rangliste im Menü oben links, unter Rang.',
    ],
  },
  {
    id: '2026-09-23-f',
    datum: '23. September 2026',
    titel: 'Gutschrift für ein einzelnes Konto',
    text: 'Die Verwaltung kann Münzen und Steine jetzt auch nur einem Konto gutschreiben.',
    punkte: [
      'In der Kontoliste steht bei jedem Namen ein eigener Knopf. Die Gutschrift gilt dann nur für dieses Konto.',
      'Gutgeschriebene Münzen und Steine zählen nicht als Schattenkasse.',
    ],
  },
  {
    id: '2026-09-23-e',
    datum: '23. September 2026',
    titel: 'Gutschrift von der Verwaltung',
    text: 'Die Verwaltung kann allen Städten Münzen und Steine gutschreiben. Sie kommen mit dem nächsten Abgleich in die Kasse.',
    punkte: [
      'Eine Gutschrift gilt für jedes Konto, auch wenn die Stadt noch nicht gegründet ist. Dann wartet sie in der Stadtkasse auf die Gründung.',
      'Gutgeschriebene Münzen und Steine zählen nicht als Schattenkasse und werfen niemanden aus der Rangliste.',
    ],
  },
  {
    id: '2026-09-23-d',
    datum: '23. September 2026',
    titel: 'Rangliste auf eigener Seite',
    text: 'Die größten Städte stehen nicht mehr mitten auf der Startseite. Du öffnest sie über den Knopf Rangliste.',
    punkte: [
      'Die Rangliste hat eine eigene Seite. Auf der Startseite bleibt nur der Knopf dorthin.',
      'Wer die Schattenkasse benutzt und danach schon einen Teil ausgegeben hat, bleibt trotzdem draußen.',
    ],
  },
  {
    id: '2026-09-23-c',
    datum: '23. September 2026',
    titel: 'Rangliste und schärfere Häuser',
    text: 'Die fünf größten Städte haben eine eigene Seite. Wer näher heranzoomt, sieht die Häuser durchgehend im Detail.',
    punkte: [
      'Rangliste: Über den Knopf auf der Startseite. Neben dem Namen stehen das Rangabzeichen, das Level, die Stadtstufe und die Einwohnerzahl. Oben steht, wer die meisten Einwohner hat.',
      'Wer die Schattenkasse benutzt hat, erscheint nicht in der Rangliste.',
      'Verwaltung: Das Verwaltungskonto sieht alle Konten mit ihrem Stand, einschließlich der Städte, die nicht in der Rangliste stehen.',
      'Nahansicht: Häuser bleiben detailliert, wenn man heranzoomt, und springen nicht mehr zwischen fein und grob.',
    ],
  },
  {
    id: '2026-09-23-b',
    datum: '23. September 2026',
    titel: 'Konten, Postfach, Ansicht von oben',
    text: 'Das größte Update seit dem Tag der Stadt. Dein Fortschritt und deine Welt liegen jetzt sicher in deinem Konto.',
    punkte: [
      'Konto-Pflicht: Jede Spielerin und jeder Spieler legt sich ein Konto an. Fortschritt und Stadt werden darin gespeichert und auf jedem Gerät weitergeführt.',
      'Postfach: Hier liest du bei jedem Update, was neu ist. Auf der Startseite zeigt ein Punkt ungelesene Nachrichten an.',
      'Ansicht von oben: Über den Knopf rechts oben in der Stadt wechselst du zwischen der schrägen Ansicht und einer Karte von oben. Drehen, tippen und bauen geht in beiden.',
      'Rathaus: Ein neuer Reiter listet alle Bauarten mit ihrer Anzahl. Jedes einzelne Haus und Gewerbe lässt sich dort direkt ausbauen, auch alle einer Art auf einmal.',
      'Der Stadttag dauert jetzt 6 Stunden statt 24.',
      'Bewohner beschweren sich früher und ziehen schneller aus, wenn sich nichts ändert. Neue Bewohner ziehen dafür langsamer nach.',
      'Häuser zeigen in jeder Drehung dieselbe Zahl Fenster, nachts leuchten wieder mehr davon, und zwischen Dach und Wand klafft kein Spalt mehr.',
      'Häuser stecken nicht mehr ineinander: Die Zeichenreihenfolge richtet sich nach der tatsächlichen Überdeckung.',
      'Autos fahren nicht mehr ineinander und warten, bis die Straße frei ist. Radfahrer sitzen richtig in Fahrtrichtung.',
      'Verlassene Häuser werden wieder als Ruine gezeichnet.',
    ],
  },
  {
    id: '2026-09-23-a',
    datum: '23. September 2026',
    titel: 'Licht, Schatten und eigene Zeichen',
    text: 'Die Stadt hat ein Lichtsystem bekommen und alle Zeichen sind jetzt selbst gezeichnet.',
    punkte: [
      'Tageszeiten mit Sonnenstand, Schattenwurf, Laternen und leuchtenden Fenstern in der Nacht.',
      'Gehwege, Ampeln und Verkehr, der an roten Ampeln hält.',
      'Alle Symbole der App kommen aus einer eigenen Zeichenschrift statt aus den System-Emoji.',
      'Fehler beim Zeichnen auf älteren iPhones behoben: Die Stadt lässt sich wieder betreten und wird nicht mehr mehrfach nebeneinander gezeigt.',
    ],
  },
  {
    id: '2026-09-22-a',
    datum: '22. September 2026',
    titel: 'Der Tag der Stadt und Herausforderungen',
    text: 'Die Stadt lebt jetzt in Tagen. Am Tagesabschluss gibt es Ziegel, Steuern und den Bericht.',
    punkte: [
      'Tagesuhr auf der Startseite und in der Stadt.',
      'Ziegel kommen von Lehmgrube, Ziegelei, Steinbruch und Baustoffwerk.',
      'Quiz und Kurse bringen Zeitvorsprung statt Münzen.',
      'Herausforderungen: einmalige Aufgaben mit Münzen und Ziegeln als Lohn.',
      'Rathaus mit Stadtbericht, Steuersatz, Beschwerden und Leerstand.',
    ],
  },
]

/** Nachrichten, die noch nicht als gelesen gespeichert sind – neueste zuerst */
export function ungelesen(data: SaveData): Nachricht[] {
  const gelesen = new Set(data.postfach?.gelesen ?? [])
  return NACHRICHTEN.filter((n) => !gelesen.has(n.id))
}

/** Alles als gelesen eintragen */
export function allesGelesen(data: SaveData): SaveData {
  const bisher = data.postfach?.gelesen ?? []
  const alle = new Set([...bisher, ...NACHRICHTEN.map((n) => n.id)])
  if (alle.size === bisher.length) return data
  return { ...data, postfach: { gelesen: [...alle] } }
}
