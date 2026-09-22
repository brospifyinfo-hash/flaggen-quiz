// 💻 IT-Wissen: Begriffe, Aussagen, Zuordnungen und Support-Fälle.
import type { DuellItem, FallItem, KarteItem, PaarItem, Stufe, WahlItem } from '../../typen'
import { optionen } from '../werkzeug'

// ---------- IT-Wissen ----------

function frage(nr: number, ziel: string, stufe: Stufe, aufgabe: string, liste: string[], erklaerung: string): WahlItem {
  return {
    id: `it.wi.${String(nr).padStart(2, '0')}`,
    spiel: 'it.wissen',
    art: 'wahl',
    ziel,
    stufe,
    aufgabe,
    optionen: optionen(liste),
    erklaerung,
  }
}

export const WISSEN: WahlItem[] = [
  // Modul 1
  frage(1, 'it.hardware', 1, 'Was macht der Arbeitsspeicher?', [
    'Er hält Daten bereit, solange das Programm läuft',
    '~0.5 Er speichert Dateien dauerhaft::Das ist die Aufgabe von Festplatte oder SSD.',
    'Er rechnet::Das macht der Prozessor.',
    'Er verbindet die Bauteile::Das ist das Mainboard.',
  ], 'RAM ist schnell, aber flüchtig: Beim Ausschalten ist er leer. Deshalb geht Ungespeichertes verloren.'),
  frage(2, 'it.os', 1, 'Wofür ist das Betriebssystem zuständig?', [
    'Es verteilt Prozessor, Speicher und Geräte an die Programme',
    '~0.5 Es zeigt die Oberfläche an::Auch – aber das ist nur ein Teil davon.',
    'Es speichert die Dateien::Das übernimmt das Dateisystem, das zum Betriebssystem gehört.',
    'Es schützt vor Viren::Dafür gibt es eigene Programme.',
  ], 'Ohne Betriebssystem müsste jedes Programm selbst wissen, wie Tastatur, Bildschirm und Speicher funktionieren.'),
  frage(3, 'it.dateien', 1, 'Was sagt die Dateiendung aus?', [
    'Welches Format die Datei hat – welches Programm sie also lesen kann',
    '~0.5 Wie groß die Datei ist::Das steht in den Eigenschaften.',
    'Wer die Datei erstellt hat::Das sind Metadaten.',
    'Ob die Datei sicher ist::Eine Endung sagt darüber nichts aus.',
  ], 'Die Endung ist nur ein Hinweis: Man kann sie ändern, ohne dass der Inhalt sich ändert – und genau das nutzen Angreifer.'),
  frage(4, 'it.hardware', 2, 'Warum ist eine SSD schneller als eine Festplatte?', [
    'Sie hat keine beweglichen Teile und muss nichts suchen',
    '~0.5 Sie ist kleiner::Die Bauform ist nicht der Grund.',
    'Sie hat mehr Speicher::Damit hat die Geschwindigkeit nichts zu tun.',
    'Sie läuft mit mehr Strom::Eher im Gegenteil.',
  ], 'Eine Festplatte muss den Schreibkopf zur richtigen Stelle fahren; eine SSD liest elektrisch – millionenfach schneller bei vielen kleinen Zugriffen.'),

  // Modul 2
  frage(5, 'it.ip', 1, 'Wozu dient eine IP-Adresse?', [
    'Sie identifiziert ein Gerät im Netzwerk',
    '~0.5 Sie identifiziert den Nutzer::Sie gehört zum Anschluss, nicht zur Person.',
    'Sie verschlüsselt die Verbindung::Das macht TLS.',
    'Sie speichert den Namen der Webseite::Das ist der DNS-Eintrag.',
  ], 'Im Heimnetz vergibt der Router private Adressen wie 192.168.x.x – nach außen tritt nur eine öffentliche Adresse auf.'),
  frage(6, 'it.router', 2, 'Was macht ein DNS-Server?', [
    'Er übersetzt Namen wie beispiel.de in IP-Adressen',
    '~0.5 Er speichert Webseiten zwischen::Das macht ein Cache oder Proxy.',
    'Er verteilt IP-Adressen im Netz::Das ist DHCP.',
    'Er verbindet zwei Netze::Das ist der Router.',
  ], 'Wenn der DNS ausfällt, funktioniert das Netz technisch weiter – nur findet niemand mehr eine Adresse.'),
  frage(7, 'it.router', 2, 'Wofür sorgt DHCP?', [
    'Geräte bekommen automatisch eine passende IP-Adresse',
    '~0.5 Geräte bekommen Internet::Nur indirekt – ohne Adresse geht allerdings nichts.',
    'Namen werden aufgelöst::Das ist DNS.',
    'Das WLAN wird verschlüsselt::Das ist WPA.',
  ], 'Fällt DHCP aus, vergeben sich Geräte selbst eine Adresse aus 169.254.x.x – ein sicheres Zeichen für genau dieses Problem.'),
  frage(8, 'it.wlan', 2, 'Was bedeutet es, wenn ein Gerät eine Adresse mit 169.254 hat?', [
    'Es hat keine Adresse vom Router bekommen',
    '~0.5 Es ist im falschen Subnetz::Das wäre eine andere, gültige Adresse.',
    'Es ist mit dem Gastnetz verbunden::Gastnetze haben normale private Adressen.',
    'Es hat eine feste IP::Feste Adressen vergibt man selbst.',
  ], 'Diese Adressen vergibt sich ein Gerät selbst, wenn niemand antwortet. Ergebnis: Es sieht höchstens andere Geräte mit demselben Problem.'),

  // Modul 4
  frage(9, 'it.logik', 1, 'Was macht eine Schleife?', [
    'Sie wiederholt Anweisungen, solange eine Bedingung gilt',
    '~0.5 Sie ruft eine Funktion auf::Das kann sie tun – ihr Zweck ist die Wiederholung.',
    'Sie prüft eine Bedingung einmal::Das ist eine Verzweigung.',
    'Sie speichert Werte::Das sind Variablen.',
  ], 'Ohne Schleifen müsste man jeden Durchlauf einzeln hinschreiben – und bei zehntausend Einträgen wird das unmöglich.'),
  frage(10, 'it.logik', 2, 'Wozu dient eine Bedingung (if)?', [
    'Sie führt Code nur aus, wenn etwas zutrifft',
    '~0.5 Sie wiederholt Code::Das ist die Schleife.',
    'Sie beendet das Programm::Das macht return oder exit.',
    'Sie legt eine Variable an::Das ist eine Deklaration.',
  ], 'Programme unterscheiden sich von Rezepten genau darin: Sie können auf Situationen reagieren.'),
  frage(11, 'it.schleifen', 2, 'Warum lagert man wiederkehrenden Code in eine Funktion aus?', [
    'Weil man ihn dann nur an einer Stelle ändern muss',
    '~0.5 Weil das Programm schneller wird::Eher nicht – es wird verständlicher.',
    'Weil man weniger tippen muss::Angenehm, aber nicht der Grund.',
    'Weil Funktionen weniger Speicher brauchen::Damit hat es nichts zu tun.',
  ], 'Jede Kopie ist eine Stelle, die man beim nächsten Fehler vergessen kann.'),
  frage(12, 'it.schleifen', 3, 'Was ist eine Endlosschleife?', [
    'Eine Schleife, deren Bedingung nie falsch wird',
    '~0.5 Eine Schleife mit sehr vielen Durchläufen::Die endet irgendwann.',
    'Eine Schleife ohne Inhalt::Die ist nur nutzlos, nicht endlos.',
    'Eine Schleife in einer Schleife::Das ist eine verschachtelte Schleife.',
  ], 'Meistens fehlt die Änderung der Zählvariablen – oder sie wird im falschen Zweig geändert.'),

  // Modul 6
  frage(13, 'it.speichern', 1, 'Was unterscheidet JPG von PNG?', [
    'JPG komprimiert verlustbehaftet, PNG verlustfrei und mit Transparenz',
    '~0.5 PNG ist immer kleiner::Bei Fotos ist meist JPG kleiner.',
    'JPG kann keine Farben::Natürlich kann es das.',
    'PNG ist nur für Fotos::Eher umgekehrt.',
  ], 'Fotos als JPG, Grafiken mit klaren Kanten und Transparenz als PNG – beim mehrfachen Speichern verliert JPG jedes Mal Qualität.'),
  frage(14, 'it.backup', 1, 'Was ist die 3-2-1-Regel beim Backup?', [
    'Drei Kopien, zwei Medien, eine außer Haus',
    '~0.5 Drei Kopien an drei Orten::Fast – entscheidend sind auch die unterschiedlichen Medien.',
    'Drei Backups pro Woche::Eine Häufigkeit, keine Regel.',
    'Drei Jahre aufbewahren::Das ist eine Aufbewahrungsfrist.',
  ], 'Die Kopie außer Haus rettet vor Feuer, Diebstahl und Verschlüsselungstrojanern.'),
  frage(15, 'it.backup', 2, 'Warum ist ein Backup auf derselben Festplatte kein Backup?', [
    'Fällt die Platte aus, sind Original und Kopie weg',
    '~0.5 Weil es zu wenig Platz gibt::Das ist ein anderes Problem.',
    'Weil es langsamer ist::Geschwindigkeit ist hier nebensächlich.',
    'Weil Windows das verbietet::Tut es nicht.',
  ], 'Ein Backup muss den Ausfall überleben, gegen den es schützt.'),
  frage(16, 'it.speichern', 3, 'Was passiert beim Löschen einer Datei normalerweise?', [
    'Der Platz wird freigegeben, die Daten bleiben zunächst stehen',
    '~0.5 Die Datei wird überschrieben::Erst später, wenn der Platz gebraucht wird.',
    'Die Datei wird sofort vernichtet::Nur beim sicheren Löschen.',
    'Die Datei wandert in die Cloud::Nur wenn ein Dienst das tut.',
  ], 'Deshalb lassen sich gelöschte Dateien oft wiederherstellen – und deshalb reicht Löschen nicht, bevor man ein Gerät weitergibt.'),

  // Modul 7
  frage(17, 'it.passwoerter', 1, 'Was macht ein Passwort stark?', [
    'Länge und Einzigartigkeit',
    '~0.5 Sonderzeichen::Helfen, ersetzen aber keine Länge.',
    'Regelmäßiges Wechseln::Gilt heute als überholt, wenn das Passwort stark ist.',
    'Dass niemand es erraten kann::Das ist das Ziel, nicht das Mittel.',
  ], 'Vier zufällige Wörter schlagen „P@ssw0rt!“ deutlich – und ein Passwortmanager macht Einzigartigkeit erst möglich.'),
  frage(18, 'it.updates', 1, 'Warum sind Updates wichtig?', [
    'Sie schließen bekannte Sicherheitslücken',
    '~0.5 Sie bringen neue Funktionen::Angenehm, aber nicht der Sicherheitsgrund.',
    'Sie machen das Gerät schneller::Manchmal eher das Gegenteil.',
    'Sie sind Pflicht::Rechtlich meist nicht.',
  ], 'Die meisten Angriffe nutzen Lücken, für die es längst ein Update gibt.'),
  frage(19, 'it.phishing', 2, 'Woran erkennt man eine Phishing-Mail am ehesten?', [
    'An Druck, einem Link und der Aufforderung, Daten einzugeben',
    '~0.5 An Rechtschreibfehlern::Früher typisch, heute selten.',
    'Am Absendernamen::Der lässt sich fälschen.',
    'An der Uhrzeit::Kein Merkmal.',
  ], 'Das Muster zählt, nicht die Form: Dringlichkeit plus Link plus Datenabfrage.'),
  frage(20, 'it.updates', 3, 'Warum arbeitet man nicht dauerhaft als Administrator?', [
    'Weil Schadsoftware dann dieselben Rechte hätte wie man selbst',
    '~0.5 Weil man Einstellungen kaputt machen könnte::Auch, aber zweitrangig.',
    'Weil es langsamer ist::Stimmt nicht.',
    'Weil Updates sonst nicht laufen::Sie laufen gerade dann.',
  ], 'Ein eingeschränktes Konto begrenzt den Schaden auf das eigene Profil.'),

  // Modul 8
  frage(21, 'it.support', 1, 'Womit beginnt gute Fehlersuche?', [
    'Mit der Frage, was zuletzt anders war',
    '~0.5 Mit einem Neustart::Hilft oft – erklärt aber nichts.',
    'Mit dem Blick ins Protokoll::Nützlich, aber später.',
    'Mit dem Austausch der Hardware::Der teuerste erste Schritt.',
  ], 'Fast jedes Problem hat einen Auslöser: ein Update, ein Umzug, ein neues Kabel.'),
  frage(22, 'it.support', 2, 'Wie grenzt man ein Problem ein?', [
    'Indem man testet, was noch funktioniert, und den Bereich halbiert',
    '~0.5 Indem man alles neu installiert::Das löscht die Spur.',
    'Indem man alle Einstellungen zurücksetzt::Ebenfalls Holzhammer.',
    'Indem man wartet::Manchmal wirksam, aber keine Methode.',
  ], 'Funktioniert der Drucker vom Laptop, aber nicht vom PC, liegt es nicht am Drucker.'),
  frage(23, 'it.kommunikation', 2, 'Wie erklärt man einem Kunden ein technisches Problem?', [
    'In seiner Sprache: was passiert ist, was das bedeutet, was jetzt zu tun ist',
    '~0.5 So genau wie möglich::Genauigkeit hilft nur, wenn sie verstanden wird.',
    'Mit den Fachbegriffen, damit er lernt::Das überfordert.',
    'Möglichst kurz::Kurz ohne Bedeutung hilft nicht.',
  ], 'Der Kunde muss keine Technik verstehen – er muss wissen, was jetzt passiert.'),
  frage(24, 'it.kommunikation', 3, 'Was gehört in ein Ticket?', [
    'Was passiert, seit wann, bei wem, und was schon versucht wurde',
    '~0.5 Eine Fehlermeldung::Gehört dazu, reicht aber nicht.',
    'Die Vermutung des Kunden::Kann helfen, ist aber keine Grundlage.',
    'Der Name des Bearbeiters::Ergibt sich automatisch.',
  ], 'Ein gutes Ticket spart die Hälfte der Rückfragen – und macht den Fall übergabefähig.'),

  // Modul 1 – mehr Stoff für den Einstieg
  frage(25, 'it.hardware', 1, 'Wofür steht GB bei einer Festplatte?', [
    'Gigabyte – ein Maß für die Datenmenge',
    '~0.5 Gigabit – die Übertragungsgeschwindigkeit::Bit misst Geschwindigkeit, Byte die Menge.',
    'Grafikbeschleunigung::Das wäre die GPU.',
    'Gerätebezeichnung::Kein Maß.',
  ], 'Acht Bit ergeben ein Byte. Deshalb ist eine 1-Gigabit-Leitung nicht so schnell, wie die Zahl vermuten lässt.'),
  frage(26, 'it.os', 1, 'Was passiert bei einem Neustart?', [
    'Der Arbeitsspeicher wird geleert und alle Programme starten neu',
    '~0.5 Die Festplatte wird aufgeräumt::Passiert dabei nicht.',
    'Einstellungen werden zurückgesetzt::Die bleiben erhalten.',
    'Updates werden gelöscht::Eher im Gegenteil – sie werden abgeschlossen.',
  ], 'Deshalb hilft ein Neustart bei so vielen Problemen: Alles, was sich im Speicher verhakt hat, ist danach weg.'),
  frage(27, 'it.dateien', 2, 'Wozu dient ein Dateipfad?', [
    'Er beschreibt eindeutig, wo eine Datei liegt',
    '~0.5 Er zeigt das Format::Das macht die Endung.',
    'Er legt fest, wer sie öffnen darf::Das sind Berechtigungen.',
    'Er speichert die Datei::Das tut das Dateisystem.',
  ], 'Zwei Dateien können gleich heißen, solange der Pfad unterschiedlich ist.'),
  frage(28, 'it.hardware', 2, 'Warum wird ein Rechner bei Staub langsamer?', [
    'Die Wärme staut sich, Prozessor und Grafikkarte drosseln sich selbst',
    '~0.5 Der Lüfter dreht schneller::Das ist die Folge, nicht der Grund.',
    'Die Festplatte verschleißt::Damit hat Staub wenig zu tun.',
    'Der Speicher wird voll::Kein Zusammenhang.',
  ], 'Zu heiße Bauteile takten herunter, um sich zu schützen – aus Leistung wird Lautstärke.'),
]

// ---------- Stimmt das? ----------

function duell(nr: number, ziel: string, stufe: Stufe, richtig: string, falsch: string, warum: string): DuellItem {
  return {
    id: `it.du.${String(nr).padStart(2, '0')}`,
    spiel: 'it.duell',
    art: 'duell',
    ziel,
    stufe,
    a: richtig,
    b: falsch,
    richtig: 'a',
    warum,
    frage: 'Welche Aussage stimmt?',
  }
}

export const DUELLE: DuellItem[] = [
  // Modul 1
  duell(1, 'it.hardware', 1, 'Der Arbeitsspeicher ist beim Ausschalten leer.', 'Der Arbeitsspeicher behält Daten dauerhaft.', 'RAM ist flüchtig – dauerhaft speichern Festplatte und SSD.'),
  duell(2, 'it.hardware', 2, 'Der Prozessor rechnet, das Mainboard verbindet.', 'Das Mainboard rechnet, der Prozessor verbindet.', 'Die Rollen sind vertauscht.'),
  duell(3, 'it.os', 2, 'Ein Treiber sagt dem Betriebssystem, wie ein Gerät zu bedienen ist.', 'Ein Treiber beschleunigt das Gerät.', 'Treiber übersetzen – schneller wird dadurch nichts.'),
  duell(4, 'it.dateien', 2, 'Eine Dateiendung lässt sich ändern, ohne den Inhalt zu ändern.', 'Beim Ändern der Endung wird die Datei umgewandelt.', 'Die Endung ist nur ein Name. Umwandeln muss ein Programm.'),
  duell(5, 'it.os', 3, 'Ein 64-Bit-System kann mehr als 4 GB Arbeitsspeicher nutzen.', 'Auch 32-Bit-Systeme nutzen beliebig viel Arbeitsspeicher.', '32 Bit adressieren maximal rund 4 GB.'),

  // Modul 2
  duell(6, 'it.ip', 1, '192.168.1.10 ist eine private Adresse.', '192.168.1.10 ist eine öffentliche Adresse im Internet.', 'Der Bereich 192.168.x.x ist für private Netze reserviert.'),
  duell(7, 'it.router', 2, 'Ohne DNS lädt keine Webseite über ihren Namen.', 'Ohne DNS funktioniert das Internet gar nicht mehr.', 'Über die IP-Adresse ginge es weiterhin – nur kennt die niemand auswendig.'),
  duell(8, 'it.ip', 2, 'Zwei Geräte mit derselben IP stören sich gegenseitig.', 'Zwei Geräte dürfen dieselbe IP haben, wenn sie unterschiedliche Namen tragen.', 'Adressen müssen im Netz eindeutig sein – sonst kommen Antworten beim Falschen an.'),
  duell(9, 'it.wlan', 2, 'WLAN wird durch Wände und Entfernung schwächer.', 'WLAN ist überall in der Wohnung gleich stark.', 'Beton, Metall und Entfernung dämpfen das Signal deutlich.'),
  duell(10, 'it.router', 3, 'Das Gateway ist der Weg aus dem eigenen Netz hinaus.', 'Das Gateway verteilt die IP-Adressen.', 'Adressen verteilt DHCP; das Gateway ist der Ausgang.'),

  // Modul 5
  duell(11, 'it.lesen', 2, 'Drei Gleichheitszeichen vergleichen ohne Typumwandlung.', 'Drei Gleichheitszeichen weisen einen Wert zu.', 'Zuweisen tut ein einzelnes Gleichheitszeichen.'),
  duell(12, 'it.debuggen', 2, 'Ein Array mit drei Einträgen hat die Indizes 0 bis 2.', 'Ein Array mit drei Einträgen hat die Indizes 1 bis 3.', 'Gezählt wird ab null – daher der Klassiker „off by one“.'),
  duell(13, 'it.debuggen', 3, 'Eine Funktion ohne return liefert undefined.', 'Eine Funktion ohne return liefert den letzten berechneten Wert.', 'Das tun andere Sprachen; JavaScript nicht.'),
  duell(14, 'it.lesen', 3, 'const verhindert das Neuzuweisen der Variablen.', 'const verhindert jede Änderung am Inhalt.', 'Ein const-Objekt lässt sich sehr wohl verändern – nur nicht ersetzen.'),
  duell(15, 'it.debuggen', 4, 'Ohne await erhält man ein Promise statt des Ergebnisses.', 'Ohne await wartet das Programm automatisch.', 'Es läuft weiter – deshalb steht dort ein unerfülltes Versprechen.'),

  // Modul 6
  duell(16, 'it.speichern', 1, 'JPG verliert bei jedem Speichern etwas Qualität.', 'JPG speichert immer verlustfrei.', 'Verlustfrei ist PNG; JPG rechnet Details weg.'),
  duell(17, 'it.backup', 1, 'Ein Backup gehört auf ein anderes Medium.', 'Ein Backup auf derselben Platte reicht aus.', 'Fällt die Platte aus, ist beides weg.'),
  duell(18, 'it.speichern', 2, 'PDF bewahrt das Layout geräteunabhängig.', 'PDF lässt sich überall frei bearbeiten.', 'Bearbeiten geht nur mit passenden Programmen – der Zweck ist die feste Darstellung.'),
  duell(19, 'it.backup', 3, 'Ein Backup ist erst geprüft, wenn eine Rücksicherung geklappt hat.', 'Ein Backup ist sicher, sobald die Software „fertig“ meldet.', 'Viele Backups scheitern genau bei der Rücksicherung.'),
  duell(20, 'it.speichern', 3, 'Eine Cloud-Synchronisierung ersetzt kein Backup.', 'Eine Cloud-Synchronisierung ist ein vollwertiges Backup.', 'Gelöschtes wird mitsynchronisiert – ohne Versionen ist es weg.'),

  // Modul 7
  duell(21, 'it.passwoerter', 1, 'Länge schlägt Sonderzeichen.', 'Sonderzeichen schlagen Länge.', 'Jedes Zeichen mehr vervielfacht die Möglichkeiten; ein Ausrufezeichen am Ende nicht.'),
  duell(22, 'it.passwoerter', 2, 'Ein Passwortmanager erhöht die Sicherheit spürbar.', 'Ein Passwortmanager ist ein zusätzliches Risiko.', 'Ohne ihn werden Passwörter wiederverwendet – das ist das größere Risiko.'),
  duell(23, 'it.updates', 2, 'Zwei-Faktor-Schutz hilft auch bei geklautem Passwort.', 'Zwei-Faktor-Schutz ersetzt ein gutes Passwort.', 'Er ergänzt es – beides zusammen wirkt.'),
  duell(24, 'it.phishing', 2, 'Ein Link kann etwas anderes anzeigen, als er aufruft.', 'Der angezeigte Linktext ist immer das Ziel.', 'Genau darauf beruht Phishing.'),
  duell(25, 'it.phishing', 3, 'Auch eine echte Absenderadresse kann gefälscht sein.', 'Eine bekannte Absenderadresse beweist die Echtheit.', 'Absender lassen sich fälschen – der Weg dahinter zählt.'),

  // Modul 1 – mehr Stoff für den Einstieg
  duell(26, 'it.hardware', 1, 'Ein Byte besteht aus acht Bit.', 'Ein Bit besteht aus acht Byte.', 'Die Reihenfolge ist umgekehrt: acht Bit ergeben ein Byte.'),
  duell(27, 'it.os', 1, 'Nach einem Neustart ist der Arbeitsspeicher leer.', 'Nach einem Neustart bleibt der Arbeitsspeicher erhalten.', 'Genau deshalb hilft ein Neustart bei festgefahrenen Programmen.'),
  duell(28, 'it.dateien', 2, 'Zwei Dateien dürfen gleich heißen, wenn sie in verschiedenen Ordnern liegen.', 'Dateinamen müssen auf dem ganzen Rechner eindeutig sein.', 'Eindeutig sein muss der ganze Pfad, nicht der Name.'),
  duell(29, 'it.hardware', 2, 'Zu heiße Prozessoren drosseln sich selbst.', 'Zu heiße Prozessoren laufen einfach weiter, bis sie kaputtgehen.', 'Moderne Chips takten herunter, bevor Schaden entsteht.'),
  duell(30, 'it.os', 3, 'Ein Programm im Autostart verlängert den Systemstart.', 'Autostart-Programme laufen erst beim ersten Öffnen.', 'Genau das ist der Sinn – und der Preis – des Autostarts.'),
]

// ---------- Fachbegriffe ----------

function paar(nr: number, ziel: string, stufe: Stufe, links: string, rechts: string, beispiel?: string): PaarItem {
  return {
    id: `it.pa.${String(nr).padStart(2, '0')}`,
    spiel: 'it.paare',
    art: 'paar',
    ziel,
    stufe,
    links,
    rechts,
    ...(beispiel ? { erklaerung: beispiel } : {}),
  }
}

export const PAARE: PaarItem[] = [
  // Modul 1
  paar(1, 'it.hardware', 1, 'CPU', 'Prozessor – rechnet', ''),
  paar(2, 'it.hardware', 1, 'RAM', 'Arbeitsspeicher – flüchtig', ''),
  paar(3, 'it.hardware', 2, 'SSD', 'Dauerhafter Speicher ohne bewegliche Teile', ''),
  paar(4, 'it.os', 2, 'Treiber', 'Übersetzt zwischen Gerät und System', ''),
  paar(5, 'it.dateien', 2, 'Dateiendung', 'Hinweis auf das Format', '.pdf, .png, .csv'),

  // Modul 2
  paar(6, 'it.ip', 1, 'IP-Adresse', 'Adresse eines Geräts im Netz', ''),
  paar(7, 'it.router', 1, 'Router', 'Verbindet das Heimnetz mit dem Internet', ''),
  paar(8, 'it.router', 2, 'DNS', 'Übersetzt Namen in Adressen', ''),
  paar(9, 'it.router', 2, 'DHCP', 'Verteilt automatisch Adressen', ''),
  paar(10, 'it.ip', 3, 'Subnetzmaske', 'Legt fest, wer im selben Netz liegt', '255.255.255.0'),

  // Modul 3
  paar(11, 'it.bauteile', 1, 'Mainboard', 'Verbindet alle Bauteile', ''),
  paar(12, 'it.bauteile', 2, 'Netzteil', 'Liefert den Strom', 'In Watt angegeben.'),
  paar(13, 'it.kompatibel', 2, 'Sockel', 'Passform zwischen Prozessor und Board', 'AM4, AM5, LGA1700'),
  paar(14, 'it.kompatibel', 2, 'Formfaktor', 'Größe des Mainboards', 'ATX, Micro-ATX, Mini-ITX'),
  paar(15, 'it.bauteile', 3, 'GPU', 'Grafikkarte – rechnet Bilder', ''),

  // Modul 6
  paar(16, 'it.speichern', 1, 'JPG', 'Fotoformat, verlustbehaftet', ''),
  paar(17, 'it.speichern', 1, 'PNG', 'Grafikformat, verlustfrei, mit Transparenz', ''),
  paar(18, 'it.speichern', 2, 'CSV', 'Tabelle als reiner Text', ''),
  paar(19, 'it.backup', 2, '3-2-1-Regel', 'Drei Kopien, zwei Medien, eine außer Haus', ''),
  paar(20, 'it.backup', 3, 'Versionierung', 'Ältere Stände bleiben erhalten', ''),

  // Modul 7
  paar(21, 'it.passwoerter', 1, 'Passwortmanager', 'Erzeugt und merkt einzigartige Passwörter', ''),
  paar(22, 'it.updates', 1, 'Update', 'Schließt bekannte Lücken', ''),
  paar(23, 'it.updates', 2, 'Zwei-Faktor', 'Zweiter Nachweis zusätzlich zum Passwort', ''),
  paar(24, 'it.phishing', 2, 'Phishing', 'Angriff über gefälschte Nachrichten', ''),
  paar(25, 'it.phishing', 3, 'Ransomware', 'Verschlüsselt Daten und fordert Lösegeld', ''),

  // Modul 1 – mehr Stoff für den Einstieg
  paar(26, 'it.hardware', 1, 'Byte', 'Acht Bit', ''),
  paar(27, 'it.os', 1, 'Autostart', 'Programme, die beim Hochfahren mitstarten', ''),
  paar(28, 'it.dateien', 1, 'Pfad', 'Der Weg zu einer Datei', 'C:\\Projekte\\bericht.pdf'),
  paar(29, 'it.os', 2, 'Prozess', 'Ein laufendes Programm im Speicher', ''),
  paar(30, 'it.hardware', 2, 'Throttling', 'Selbstdrosselung bei zu hoher Temperatur', ''),
]

// ---------- Hardware oder Software? ----------

function karte(nr: number, ziel: string, stufe: Stufe, text: string, software: boolean, warum: string, detail?: string): KarteItem {
  return {
    id: `it.ka.${String(nr).padStart(2, '0')}`,
    spiel: 'it.sortieren',
    art: 'karte',
    ziel,
    stufe,
    text,
    ...(detail ? { detail } : {}),
    fach: software ? 1 : 0,
    warum,
  }
}

export const KARTEN: KarteItem[] = [
  karte(1, 'it.hardware', 1, 'Grafikkarte', false, 'Ein Bauteil zum Anfassen.'),
  karte(2, 'it.os', 1, 'Windows', true, 'Ein Betriebssystem – also Software.'),
  karte(3, 'it.hardware', 1, 'Arbeitsspeicher', false, 'Steckt als Riegel auf dem Board.'),
  karte(4, 'it.os', 1, 'Browser', true, 'Ein Programm.'),
  karte(5, 'it.hardware', 1, 'Netzteil', false, 'Liefert Strom – Hardware.'),
  karte(6, 'it.os', 2, 'Treiber', true, 'Software, auch wenn sie zu einem Gerät gehört.', 'gehört zum Gerät'),
  karte(7, 'it.hardware', 2, 'Mainboard', false, 'Die Platine, auf der alles sitzt.'),
  karte(8, 'it.dateien', 2, 'PDF-Datei', true, 'Daten sind keine Hardware.'),
  karte(9, 'it.hardware', 2, 'SSD', false, 'Der Datenträger selbst ist Hardware.'),
  karte(10, 'it.os', 2, 'Virenscanner', true, 'Ein Programm.'),
  karte(11, 'it.hardware', 3, 'Lüfter', false, 'Bewegt Luft – eindeutig Hardware.'),
  karte(12, 'it.os', 3, 'BIOS/UEFI', true, 'Firmware ist Software, die fest auf einem Chip liegt.', 'liegt auf einem Chip'),
  karte(13, 'it.hardware', 3, 'USB-Kabel', false, 'Verbindung zum Anfassen.'),
  karte(14, 'it.dateien', 3, 'Dateisystem', true, 'Eine Ordnung, kein Gegenstand.', 'NTFS, ext4, APFS'),
  karte(15, 'it.hardware', 4, 'Prozessorkühler', false, 'Hardware – und oft der lauteste Teil.'),
]

// ---------- Support-Fälle ----------

function fall(
  nr: number,
  ziel: string,
  stufe: Stufe,
  person: { name: string; emoji: string; rolle: string },
  anliegen: string,
  pruefungen: { frage: string; befund: string; wichtig?: boolean }[],
  diagnose: { frage: string; liste: string[] },
  schritt2?: { frage: string; liste: string[]; mehrfach?: boolean },
): FallItem {
  return {
    id: `it.fa.${String(nr).padStart(2, '0')}`,
    spiel: 'it.support',
    art: 'fall',
    ziel,
    stufe,
    person,
    anliegen,
    pruefungen,
    diagnose: { frage: diagnose.frage, optionen: optionen(diagnose.liste) },
    ...(schritt2 ? { schritt2: { frage: schritt2.frage, optionen: optionen(schritt2.liste), ...(schritt2.mehrfach ? { mehrfach: true } : {}) } } : {}),
  }
}

export const FAELLE: FallItem[] = [
  fall(1, 'it.support', 2, { name: 'Frau Berg', emoji: '👩‍💼', rolle: 'Buchhaltung' },
    'Mein Rechner ist seit heute Morgen unerträglich langsam.',
    [
      { frage: 'Fragen, was sich geändert hat', befund: 'Gestern Abend lief ein großes Update.', wichtig: true },
      { frage: 'Task-Manager ansehen', befund: 'Die Festplatte ist dauerhaft bei 100 %, ein Indexdienst läuft.', wichtig: true },
      { frage: 'Speicherplatz prüfen', befund: '40 GB frei – kein Engpass.' },
      { frage: 'Nach Fehlermeldungen fragen', befund: 'Keine.' },
    ],
    {
      frage: 'Was ist die wahrscheinlichste Ursache?',
      liste: [
        'Nacharbeiten des Updates belegen die Platte::Nach großen Updates laufen Indexierung und Aufräumarbeiten – oft stundenlang.',
        '~0.5 Ein Virus::Möglich, aber ohne Hinweis die unwahrscheinlichere Erklärung.',
        'Die Festplatte ist defekt::Dann gäbe es Fehler im Protokoll.',
        'Zu wenig Arbeitsspeicher::Der Engpass liegt sichtbar bei der Platte.',
      ],
    },
    {
      frage: 'Was sagst du der Kundin?',
      liste: [
        'Rechner laufen lassen, in ein bis zwei Stunden noch einmal schauen',
        '~0.5 Neu starten::Startet die Arbeiten nur neu.',
        'Sofort neu installieren::Völlig unverhältnismäßig.',
        'Nichts, das gibt sich schon::Ohne Erklärung bleibt sie ratlos.',
      ],
    },
  ),
  fall(2, 'it.support', 3, { name: 'Herr Osei', emoji: '🧑‍🏫', rolle: 'Lehrer' },
    'Der Beamer zeigt kein Bild, der Laptop läuft aber.',
    [
      { frage: 'Kabel prüfen', befund: 'HDMI steckt fest an beiden Enden.' },
      { frage: 'Eingangsquelle am Beamer prüfen', befund: 'Der Beamer steht auf HDMI 2, das Kabel steckt in HDMI 1.', wichtig: true },
      { frage: 'Anzeigeeinstellungen am Laptop ansehen', befund: 'Zweiter Bildschirm wird erkannt, Modus „Erweitern“.', wichtig: true },
      { frage: 'Anderen Laptop testen', befund: 'Zeigt dasselbe Bild – also kein Laptop-Problem.' },
    ],
    {
      frage: 'Woran liegt es?',
      liste: [
        'Der Beamer zeigt den falschen Eingang::Erkannt wird der Beamer, nur schaut er auf den anderen Anschluss.',
        '~0.5 Der Laptop spiegelt nicht::Im Modus „Erweitern“ käme trotzdem ein Bild.',
        'Das Kabel ist defekt::Dann würde der zweite Bildschirm nicht erkannt.',
        'Der Beamer ist kaputt::Er läuft und reagiert.',
      ],
    },
    {
      frage: 'Was tust du?',
      liste: [
        'Am Beamer auf HDMI 1 umschalten',
        '~0.5 Kabel auf HDMI 2 umstecken::Führt auch zum Ziel, dauert nur länger.',
        'Laptop neu starten::Ändert nichts.',
        'Anderen Beamer holen::Unnötig.',
      ],
    },
  ),
  fall(3, 'it.support', 3, { name: 'Lea', emoji: '👩‍🎓', rolle: 'Studentin' },
    'Mein Laptop verbindet sich nicht mehr mit dem Uni-WLAN.',
    [
      { frage: 'Fragen, seit wann', befund: 'Seit dem Passwortwechsel im Uni-Portal.', wichtig: true },
      { frage: 'Andere Netze testen', befund: 'Zu Hause funktioniert das WLAN.', wichtig: true },
      { frage: 'Gespeichertes Netzprofil ansehen', befund: 'Das alte Profil mit den alten Zugangsdaten ist noch hinterlegt.', wichtig: true },
      { frage: 'Flugmodus prüfen', befund: 'Aus.' },
    ],
    {
      frage: 'Was ist das Problem?',
      liste: [
        'Das gespeicherte Profil hat noch die alten Zugangsdaten::Beim Eduroam-Anmeldeverfahren merkt sich das Gerät Nutzer und Passwort.',
        '~0.5 Das Passwort ist falsch::Fast – es ist nicht falsch, sondern veraltet gespeichert.',
        'Die WLAN-Karte ist defekt::Zu Hause funktioniert sie.',
        'Die Uni sperrt das Gerät::Dafür gibt es keinen Hinweis.',
      ],
    },
    {
      frage: 'Was empfiehlst du? (mehrere)',
      liste: [
        'Netzprofil löschen und neu anlegen',
        'Neues Passwort verwenden',
        'Zertifikat der Uni bestätigen',
        'Neuen Laptop anschaffen::Ein kaputtes Profil ist kein Grund für neue Hardware.',
      ],
      mehrfach: true,
    },
  ),
  fall(4, 'it.kommunikation', 4, { name: 'Herr Vogt', emoji: '👨‍🔧', rolle: 'Werkstattleiter' },
    'Ihr habt gestern was gemacht, seitdem findet niemand die Aufträge.',
    [
      { frage: 'Nachfragen, was genau fehlt', befund: 'Der Ordner „Aufträge“ ist auf dem Desktop verschwunden.', wichtig: true },
      { frage: 'Prüfen, was gestern geändert wurde', befund: 'Umstellung auf zentrale Ablage im Netzlaufwerk.', wichtig: true },
      { frage: 'Netzlaufwerk ansehen', befund: 'Alle Aufträge liegen dort, vollständig.' },
      { frage: 'Fragen, wer eingewiesen wurde', befund: 'Nur zwei von sieben Mitarbeitenden.', wichtig: true },
    ],
    {
      frage: 'Was ist hier wirklich passiert?',
      liste: [
        'Die Daten sind da – die Umstellung wurde nur nicht erklärt::Ein Kommunikationsproblem, kein technisches.',
        '~0.5 Die Verknüpfung auf dem Desktop fehlt::Das ist das Symptom, nicht die Ursache.',
        'Die Daten sind verloren::Sie liegen vollständig im Netzlaufwerk.',
        'Jemand hat die Ordner gelöscht::Kein Hinweis darauf.',
      ],
    },
    {
      frage: 'Was tust du zuerst?',
      liste: [
        'Sagen, dass nichts weg ist, Verknüpfung anlegen und kurz zeigen, wo alles liegt',
        '~0.5 Verknüpfung anlegen::Gut – die Erklärung fehlt aber.',
        'Eine Rundmail mit dem neuen Pfad schicken::Besser als nichts, löst die Aufregung aber nicht.',
        'Die Umstellung rückgängig machen::Wirft das Projekt zurück, ohne das Problem zu lösen.',
      ],
    },
  ),
  fall(5, 'it.phishing', 3, { name: 'Frau Dahl', emoji: '👩‍💻', rolle: 'Sachbearbeiterin' },
    'Ich habe eine Rechnung im Anhang geöffnet, jetzt ist der Bildschirm komisch.',
    [
      { frage: 'Fragen, was auf dem Bildschirm steht', befund: 'Eine Meldung verlangt Zahlung, Dateien seien verschlüsselt.', wichtig: true },
      { frage: 'Netzwerkverbindung prüfen', befund: 'Der Rechner hängt am Firmennetz, Laufwerke sind verbunden.', wichtig: true },
      { frage: 'Fragen, wann das war', befund: 'Vor etwa fünf Minuten.', wichtig: true },
      { frage: 'Backup prüfen', befund: 'Nächtliches Backup von gestern liegt offline vor.' },
    ],
    {
      frage: 'Was ist der erste Schritt?',
      liste: [
        'Gerät sofort vom Netz trennen::Solange es hängt, verschlüsselt es weiter – auch auf den Netzlaufwerken.',
        '~0.5 Gerät herunterfahren::Trennt auch, kann aber laufende Wiederherstellungsdaten zerstören.',
        'Virenscanner starten::Zu spät und zu langsam.',
        'Lösegeld prüfen::Nie der erste Schritt.',
      ],
    },
    {
      frage: 'Was gehört danach dazu? (mehrere)',
      liste: [
        'Vorfall melden und dokumentieren',
        'Backup-Stand prüfen, bevor irgendetwas überschrieben wird',
        'Betroffene Netzlaufwerke prüfen',
        'Rechner neu aufsetzen und sofort weiterarbeiten::Vor der Analyse vernichtet das die Spuren.',
      ],
      mehrfach: true,
    },
  ),
  fall(6, 'it.support', 4, { name: 'Herr Klein', emoji: '🧓', rolle: 'Kunde' },
    'Mein Drucker druckt nur noch weiße Seiten.',
    [
      { frage: 'Füllstände prüfen', befund: 'Schwarz zu 60 % gefüllt.' },
      { frage: 'Testseite am Drucker selbst drucken', befund: 'Ebenfalls weiß – ohne Beteiligung des Rechners.', wichtig: true },
      { frage: 'Fragen, wie oft gedruckt wird', befund: 'Alle paar Monate einmal.', wichtig: true },
      { frage: 'Treiber prüfen', befund: 'Aktuell.' },
    ],
    {
      frage: 'Was liegt nahe?',
      liste: [
        'Eingetrocknete Düsen durch lange Standzeit::Bei Tintendruckern der häufigste Grund – Reinigungsprogramm hilft oft.',
        '~0.5 Leere Patrone::Der Füllstand spricht dagegen.',
        'Falscher Treiber::Die Testseite kommt vom Drucker selbst.',
        'Defektes Kabel::Dann käme gar nichts.',
      ],
    },
    {
      frage: 'Was empfiehlst du?',
      liste: [
        'Düsenreinigung starten, danach Testseite – und künftig monatlich eine Seite drucken',
        '~0.5 Patrone tauschen::Hilft manchmal, kostet aber unnötig.',
        'Drucker einschicken::Zu früh.',
        'Neuen Drucker kaufen::Deutlich zu früh.',
      ],
    },
  ),
  fall(7, 'it.passwoerter', 3, { name: 'Herr Mahr', emoji: '🧑‍🔬', rolle: 'Laborleiter' },
    'Ich komme seit heute nicht mehr in mein Konto, obwohl das Passwort stimmt.',
    [
      { frage: 'Fragen, was genau passiert', befund: 'Passwort wird angenommen, dann kommt eine Abfrage nach einem Code.', wichtig: true },
      { frage: 'Nach dem zweiten Faktor fragen', befund: 'Die Authenticator-App war auf dem alten Handy, das Gerät wurde getauscht.', wichtig: true },
      { frage: 'Nach Wiederherstellungscodes fragen', befund: 'Beim Einrichten ausgedruckt, liegen im Büroschrank.', wichtig: true },
      { frage: 'Kontosperrung prüfen', befund: 'Konto ist aktiv, keine Sperre.' },
    ],
    {
      frage: 'Was ist das Problem?',
      liste: [
        'Der zweite Faktor ist mit dem alten Gerät verloren gegangen::Das Passwort stimmt – es fehlt der zweite Nachweis.',
        '~0.5 Das Passwort ist abgelaufen::Dann käme eine andere Meldung.',
        'Das Konto wurde gehackt::Dafür gibt es keinen Hinweis.',
        'Der Dienst ist gestört::Andere melden sich normal an.',
      ],
    },
    {
      frage: 'Wie geht es weiter? (mehrere)',
      liste: [
        'Mit einem Wiederherstellungscode anmelden',
        'Danach die App auf dem neuen Gerät neu einrichten',
        'Neue Wiederherstellungscodes erzeugen und sicher ablegen',
        'Zwei-Faktor-Schutz abschalten, das spart Ärger::Das senkt die Sicherheit deutlich – der Ärger war lösbar.',
      ],
      mehrfach: true,
    },
  ),
]
