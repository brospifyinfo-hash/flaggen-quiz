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
    id: '2026-10-02-b',
    datum: '2. Oktober 2026',
    titel: 'Wasser, Brücken und Autobahnen',
    text: 'Man kann Gewässer anlegen und kleine wieder zuschütten. Über dem Wasser liegen Brücken, und die Stadt kann viel weiter wachsen.',
    punkte: [
      'Gewässer anlegen gräbt Teiche und Kanäle. Zuschütten macht aus Fluss, See und Teich wieder Wiese. Das Meer bleibt.',
      'Neu: Landstraße, Bundesstraße, Autobahn, Brücke und Autobahnbrücke. Ampeln nur noch an doppelspurigen Kreuzungen.',
      'Jede Seite lässt sich bis 300 Kacheln kaufen.',
    ],
  },
  {
    id: '2026-10-02-a',
    datum: '2. Oktober 2026',
    titel: 'Berge abtragen, Straßen am Hang',
    text: 'Gipfel lassen sich abtragen. Eine Straße über einen Hügel folgt dem Gefälle und läuft zur Wiese hinunter.',
    punkte: [
      'Unter Straßen ziehen gibt es Berg abtragen. Eine Kachel kostet 40 Münzen und 1 Material und wird zu Wiese.',
      'Straßen, Gehwege und Laternen liegen auf der Höhe des Hangs und fallen zur tieferen Nachbarkachel ab.',
    ],
  },
  {
    id: '2026-10-01-c',
    datum: '1. Oktober 2026',
    titel: 'Die Landschaft hat ein Gesicht',
    text: 'Wiese, Wasser und Berge sind neu gezeichnet. Man sieht Ufer, Wellen, Hügel und Gipfel, und auf den Hängen stehen Bäume.',
    punkte: [
      'Sand am Wasser, Schaum an der Kante, Wellen auf Fluss und See.',
      'Hügel heben sich ab, Gipfel haben Fels und Schnee.',
      'Außerhalb der Siedlung wachsen Laubbäume und Tannen.',
    ],
  },
  {
    id: '2026-10-01-b',
    datum: '1. Oktober 2026',
    titel: 'Flüsse, Seen und Berge',
    text: 'Die Stadt steht in einer Landschaft. Über den Zaun hinaus siehst du, wie es weitergeht, und kaufst dort eine Seite dazu.',
    punkte: [
      'Jede neue Stadt bekommt Fluss, See und Berge. Auf Wasser und Gipfeln kann man nicht bauen.',
      'Land kauft man an einer Seite, nicht mehr rundherum auf einmal.',
      'In neue Stadt umziehen nimmt alle Gebäude ins Inventar mit. Die Bewohner kommen auch mit.',
    ],
  },
  {
    id: '2026-10-01-a',
    datum: '1. Oktober 2026',
    titel: 'Häuser von jeder Seite',
    text: 'Die besonderen Bauten sind Körper. Drehst du die Stadt, siehst du die andere Wand, nicht dieselbe Fassade noch einmal.',
    punkte: [
      'Tür, Fensterläden und Balkon bleiben an ihrer Seite. Hinten ist unten keine Tür.',
      'Riesenrad, Windrad, Apfel, UFO, Wal, Palme und die Rakete haben eine Kante, sobald du von der Seite schaust.',
    ],
  },
  {
    id: '2026-09-30-c',
    datum: '30. September 2026',
    titel: 'Dieselbe Grafik wie die übrigen Häuser',
    text: 'Die besonderen Bauten sind noch einmal gezeichnet. Sie haben jetzt Wände, Fensterrahmen und Ziegeldächer, so wie der Rest der Stadt.',
    punkte: [
      'Schloss, Palas und Kapelle mit Ziegeln auf den Dächern, Mauern und Zinnen.',
      'Riesenrad, Rakete, Leuchtturm, UFO, Iglu, Pilzhaus und das Haus auf dem Kopf stehen im selben Raster.',
      'Statuen stehen auf Steinsockeln: Apfel, Wal, Einhorn, Moai, Roboter, Obelisk.',
    ],
  },
  {
    id: '2026-09-30-b',
    datum: '30. September 2026',
    titel: 'Das Schloss ist eine Burg',
    text: 'Die großen Stücke sind nachgezeichnet. Das Schloss hat jetzt Mauern, Zinnen, Türme mit Spitzdächern, ein Tor und eine Brücke.',
    punkte: [
      'Schloss: Ringmauer, vier Ecktürme, Bergfried, Fallgatter und Zugbrücke über den Graben.',
      'Riesenrad mit Gondeln, Apfel mit Stiel und Blatt, Pilzhaus mit Lamellen.',
    ],
  },
  {
    id: '2026-09-30-a',
    datum: '30. September 2026',
    titel: 'Schloss, Rad und echte Figuren',
    text: 'Ein Teil der neuen Bauten hat jetzt eine eigene Form. Das Riesenrad ist ein Rad, der Apfel ist ein Apfel, und das Schloss kostet eine Million.',
    punkte: [
      'Schloss, 3×3, eine Million Münzen, mit Türmen, Tor und Fahnen.',
      'Riesenrad, Windrad, Geisterbahn, Pilzhaus, Iglu, Jurte, Rakete und das Haus auf dem Kopf sind keine Kästen mehr.',
      'Statuen: Apfel, Wal, Einhorn, Zwerg, Moai, Drache, Roboter, Stuhl, Astronaut.',
    ],
  },
  {
    id: '2026-09-29-a',
    datum: '29. September 2026',
    titel: 'Neue Häuser, Gewerbe und Deko',
    text: 'Im Baumenü liegen über hundert neue Stücke. Jedes hat einen Zweck, manche sehen trotzdem aus, als hätten sie sich verlaufen.',
    punkte: [
      'Wohnen: von der Jurte und dem Hausboot bis zur Marmorvilla und dem UFO-Haus.',
      'Gewerbe: Höfe, Werkstätten, Farmen, Klärwerk, Riesenrad und ein Haus, das auf dem Kopf steht.',
      'Deko: Bäume, Beete, Skulpturen, Strandkorb, Litfaßsäule und ein Walskelett.',
    ],
  },
  {
    id: '2026-09-25-d',
    datum: '25. September 2026',
    titel: 'Mehr Bilder, vier Antworten',
    text: 'Was ist das hat deutlich mehr Fotos, und die Fragen wiederholen sich nicht mehr sofort.',
    punkte: [
      'Jede Frage hat genau vier Antworten.',
      'Im schweren Modus bleibt das Foto stehen, das Feld schiebt die Seite nicht mehr nach unten.',
      'Filialen und Schilder, auf denen der Markenname steht, sind raus. Dafür gibt es viel mehr Sehenswürdigkeiten, Tiere, Pflanzen, Autos und Rapper.',
    ],
  },
  {
    id: '2026-09-25-c',
    datum: '25. September 2026',
    titel: 'Leicht und schwer',
    text: 'In Was ist das wählst du vor dem Start, wie schwer es wird.',
    punkte: [
      'Leicht: die Antworten stehen da. Dafür gibt es nur 1 XP, ohne Combo-Bonus und ohne Perfektlauf.',
      'Schwer: du tippst die Antwort selbst. Kleine Tippfehler zählen noch, die XP sind voll.',
      'Das gilt für jede Kategorie, auch für Flaggen, Personen und Zufall.',
    ],
  },
  {
    id: '2026-09-25-b',
    datum: '25. September 2026',
    titel: 'Was ist das',
    text: 'Flaggen und Personen stecken jetzt in einem Spiel. Unten rechts steht Spielen, daraus fährt die Auswahl nach oben.',
    punkte: [
      'Was ist das: eine Kategorie oder Zufall. Neu dabei sind Automarken, Marken, Sehenswürdigkeiten, Tiere und Pflanzen.',
      'Bei den Album-Covern deutscher Rapper ordnest du den Rapper zu. Der Titel steht auf dem Cover.',
      'Online, Higher or Lower, Geschichte, Weltkarte, Gemischt und der Mathe-Lauf liegen auf derselben Tafel.',
    ],
  },
  {
    id: '2026-09-25-a',
    datum: '25. September 2026',
    titel: 'Online gegeneinander',
    text: 'Erstell eine Lobby, gib den vierstelligen Code weiter und spiel acht Fragen gegen eine andere Person.',
    punkte: [
      'Auf der Startseite liegt der Weg unter Online spielen.',
      'Der Host wählt das Spiel und startet, sobald beide in der Lobby sind.',
      'Punkte gibt es für richtige Antworten, schnelle noch ein paar mehr. Nach 20 Sekunden geht die Frage weiter.',
    ],
  },
  {
    id: '2026-09-23-l',
    datum: '23. September 2026',
    titel: 'Reichweite nur auf Knopfdruck',
    text: 'Schule und illegale Geschäfte haben denselben Kreis wie die Wachen. Er erscheint erst, wenn du am Gebäude auf „Reichweite zeigen“ tippst.',
    punkte: [
      'Schule: 7 Kacheln, im Kreis sinkt die Kriminalität.',
      'Illegale Gebäude: 6 Kacheln, im Kreis steigt sie.',
      'Polizei, Feuerwehr und Krankenhaus blenden den Kreis genauso nur auf Knopfdruck ein.',
    ],
  },
  {
    id: '2026-09-23-k',
    datum: '23. September 2026',
    titel: 'Der Kreis der Wachen ist scharf',
    text: 'Polizei, Feuerwehr und Krankenhaus zeichnen ihre Reichweite als klaren Rand über die Dächer. Jedes Haus im Kreis hat denselben Umriss.',
    punkte: ['Der Rand bleibt weiß umrandet und in der Farbe der Wache, auch über Häusern und bei jedem Zoom.'],
  },
  {
    id: '2026-09-23-j',
    datum: '23. September 2026',
    titel: 'Wachen, Brände und die Uhr der Beschwerden',
    text: 'Polizei, Feuerwehr und Krankenhaus zeigen, wie weit sie reichen. Ohne sie kann ein Haus abbrennen oder jemand sterben. Beschwerden laufen nur, solange du in der Stadt bist.',
    punkte: [
      'Tippe eine Wache an: ein Kreis zeigt die Reichweite, dazu wie viele Häuser und Wohnhäuser darin liegen.',
      'Brennt es und keine Feuerwehr kommt hin, brennt das Haus ab. Ein Notfall ohne Krankenhaus kann einen Bewohner das Leben kosten.',
      'Die zwei Minuten einer Beschwerde zählen nur, während die Stadt offen ist.',
    ],
  },
  {
    id: '2026-09-23-i',
    datum: '23. September 2026',
    titel: 'Gewerbe zahlt sich aus',
    text: 'Läden, Büros und Fabriken bringen pro Tag deutlich mehr ein. Auf der Tagesuhr steht, welches Haus das Geld verdient.',
    punkte: [
      'Gewerbe wirft sechsmal so viele Münzen pro Tag ab.',
      'Tagesuhr und Tagesabschluss listen jedes Geschäft einzeln auf, dazu Steuern und Abzüge.',
    ],
  },
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
