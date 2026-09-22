// 🏦 Wissen: Begriffe, Aussagen, Belege und die Frage, ob eine Nachricht echt ist.
// Keine Produktwerbung – nur das, was man verstanden haben sollte, bevor man unterschreibt.
import type { DokumentItem, DuellItem, KarteItem, PaarItem, Stufe, WahlItem } from '../../typen'
import { optionen } from '../werkzeug'

// ---------- Bankwissen (Auswahl) ----------

function frage(nr: number, ziel: string, stufe: Stufe, aufgabe: string, liste: string[], erklaerung: string, kontext?: string): WahlItem {
  return {
    id: `bank.wi.${String(nr).padStart(2, '0')}`,
    spiel: 'bank.wissen',
    art: 'wahl',
    ziel,
    stufe,
    aufgabe,
    optionen: optionen(liste),
    erklaerung,
    ...(kontext ? { kontext } : {}),
  }
}

export const WISSEN: WahlItem[] = [
  // Modul 1
  frage(1, 'bank.konto', 1, 'Was ist eine IBAN?', [
    'Die internationale Kontonummer aus Länderkennung, Prüfziffer, Bankleitzahl und Kontonummer',
    '~0.5 Die Kontonummer in internationaler Schreibweise::Fast – die IBAN enthält zusätzlich Länderkennung und Prüfziffer.',
    'Ein Sicherheitscode für Onlinebanking::Das wäre eine TAN.',
    'Die Nummer der Bankfiliale::Das wäre die Bankleitzahl, die in der IBAN steckt.',
  ], 'Die deutsche IBAN ist immer 22 Zeichen lang: DE + Prüfziffer + 8 Ziffern Bankleitzahl + 10 Ziffern Kontonummer.'),
  frage(2, 'bank.konto', 2, 'Was passiert bei einer Lastschrift?', [
    'Der Empfänger zieht das Geld ein – mit Mandat des Zahlers',
    '~0.5 Der Zahler überweist automatisch jeden Monat::Das wäre ein Dauerauftrag.',
    'Die Bank bucht Gebühren ab::Das ist nur ein Sonderfall.',
    'Das Geld wird für einige Tage gesperrt::Das ist eine Vormerkung.',
  ], 'Dauerauftrag: Der Zahler schickt. Lastschrift: Der Empfänger holt – und der Zahler kann acht Wochen lang widersprechen.'),
  frage(3, 'bank.begriffe', 2, 'Was bedeutet „Valuta“ auf dem Kontoauszug?', [
    'Das Datum, ab dem der Betrag Zinsen bringt oder kostet',
    '~0.5 Das Buchungsdatum::Das ist der Tag der Buchung – die Valuta kann davon abweichen.',
    'Die Währung des Betrags::Der Begriff stammt zwar daher, meint aber das Wertstellungsdatum.',
    'Der Verwendungszweck::Das ist ein eigenes Feld.',
  ], 'Wertstellung (Valuta) und Buchung sind zwei verschiedene Daten – für Zinsen zählt die Valuta.'),
  frage(4, 'bank.beleg', 2, 'Woran erkennt man eine unplausible Überweisung am schnellsten?', [
    'IBAN, Betrag und Verwendungszweck passen nicht zusammen',
    '~0.5 Der Betrag ist ungewöhnlich hoch::Ein Anhaltspunkt, aber allein kein Befund.',
    'Der Empfängername ist unbekannt::Kommt bei Erstkontakt ständig vor.',
    'Das Formular ist handschriftlich::Das ist völlig normal.',
  ], 'Prüfen heißt vergleichen: Stimmen Empfänger, IBAN und Zweck zueinander – und zum Auftrag des Kunden?'),

  // Modul 2
  frage(5, 'bank.verfuegbar', 1, 'Was ist der „verfügbare Betrag“?', [
    'Guthaben plus eingeräumter Dispo minus Vormerkungen',
    '~0.5 Das Guthaben auf dem Konto::Ohne Dispo und Vormerkungen ist das unvollständig.',
    'Alles, was das Tageslimit der Karte zulässt::Das Limit begrenzt zusätzlich, ist aber etwas anderes.',
    'Der Kontostand vom Vortag::Der sagt über heute wenig aus.',
  ], 'Verfügbar ist, was tatsächlich abgehoben werden kann – Dispo zählt dazu, kostet aber Zinsen.'),
  frage(6, 'bank.auszahlung', 2, 'Ein Kunde möchte 180 € und ausdrücklich keine Fünfziger. Was tust du?', [
    'Stückelung ohne Fünfziger zusammenstellen und kurz bestätigen',
    '~0.5 Nachfragen, warum::Kann man, ist aber nicht nötig – der Wunsch reicht.',
    'Trotzdem einen Fünfziger geben, es ist ja derselbe Betrag::Der Betrag stimmt, die Auszahlung nicht.',
    'Auf den Automaten verweisen::Am Schalter ist genau das die Aufgabe.',
  ], 'Der Betrag ist die eine Hälfte der Aufgabe, die gewünschte Stückelung die andere.'),
  frage(7, 'bank.einzahlung', 2, 'Warum wird Bargeld bei der Einzahlung zweimal gezählt?', [
    'Weil Zähl- und Übertragungsfehler sonst niemandem mehr zuzuordnen sind',
    '~0.5 Weil die Kasse am Abend stimmen muss::Richtig, aber der Zeitpunkt der Kontrolle ist die Annahme.',
    'Weil Falschgeld dabei sein könnte::Das ist eine zusätzliche Prüfung, kein Zählgrund.',
    'Weil die Bank so Zinsen spart::Damit hat es nichts zu tun.',
  ], 'Zweimal zählen, einmal buchen – danach steht Aussage gegen Aussage.'),
  frage(8, 'bank.verfuegbar', 3, 'Das Konto steht bei −220 €, der Dispo beträgt 1.000 €. Wie viel ist verfügbar?', [
    '780 €',
    '~0.5 1.000 €::Der Dispo ist schon teilweise genutzt.',
    '1.220 €::Das wäre Dispo plus Minus – falsch herum gerechnet.',
    '220 €::Das ist die Überziehung, nicht der Rahmen.',
  ], 'Vom Rahmen wird abgezogen, was schon in Anspruch genommen ist: 1.000 − 220 = 780 €.'),

  // Modul 3
  frage(9, 'bank.effektiv', 2, 'Was steckt im Effektivzins, das im Nominalzins fehlt?', [
    'Die Kosten des Kredits: Bearbeitungsweise, Zahlungstermine, teils Gebühren',
    '~0.5 Nur die Bearbeitungsgebühr::Ein Teil davon – auch Zahlungsrhythmus und Auszahlungskurs zählen.',
    'Die Inflation::Die spielt beim Effektivzins keine Rolle.',
    'Die Restschuldversicherung immer::Nur wenn sie Pflicht für den Kredit ist.',
  ], 'Vergleichen lassen sich Kredite nur über den effektiven Jahreszins – er ist gesetzlich definiert.'),
  frage(10, 'bank.zins', 1, 'Was heißt „3,5 % p. a.“?', [
    '3,5 % pro Jahr',
    '~0.5 3,5 % für die gesamte Laufzeit::Nein, „p. a.“ bezieht sich immer auf ein Jahr.',
    '3,5 % pro Monat::Das wäre „p. m.“ – und ein Wucherzins.',
    '3,5 % nach Abzug der Steuer::Das wäre die Nettorendite.',
  ], '„per annum“ = pro Jahr. Für kürzere Zeiträume wird anteilig gerechnet.'),
  frage(11, 'bank.zinseszins', 3, 'Warum wächst Zinseszins schneller als einfacher Zins?', [
    'Weil die Zinsen selbst wieder verzinst werden',
    '~0.5 Weil der Zinssatz steigt::Der Satz bleibt gleich – die Basis wächst.',
    'Weil die Bank jährlich nachbessert::Das ist keine Regel.',
    'Weil die Inflation dazukommt::Die hat damit nichts zu tun.',
  ], 'Deshalb steht die Laufzeit im Exponenten – und deshalb wirkt früh anfangen stärker als viel einzahlen.'),
  frage(12, 'bank.zins', 3, 'Ein Sparkonto bringt 2 %, die Inflation liegt bei 4 %. Was passiert real?', [
    'Die Kaufkraft sinkt um rund 2 % im Jahr',
    '~0.5 Man gewinnt nominal, verliert aber real::Genau das – der reale Verlust liegt bei rund 2 %.',
    'Man gewinnt 2 %::Nur nominal, nicht real.',
    'Es gleicht sich aus::Nur bei gleicher Höhe von Zins und Inflation.',
  ], 'Realzins = Zins − Inflation. Bei 2 % zu 4 % ist er negativ.'),

  // Modul 4
  frage(13, 'bank.sparen', 1, 'Was unterscheidet Tagesgeld von Festgeld?', [
    'Tagesgeld ist jederzeit verfügbar, Festgeld ist für die Laufzeit gebunden',
    '~0.5 Festgeld bringt mehr Zinsen::Meistens ja – der Unterschied ist aber die Bindung.',
    'Tagesgeld ist nicht abgesichert::Beides fällt unter die Einlagensicherung.',
    'Festgeld gibt es nur für Firmen::Das stimmt nicht.',
  ], 'Wer Flexibilität braucht, nimmt Tagesgeld; wer den Zeitpunkt kennt, bekommt beim Festgeld mehr.'),
  frage(14, 'bank.risiko', 2, 'Was bedeutet Streuung (Diversifikation)?', [
    'Das Geld auf viele verschiedene Werte verteilen, damit ein Ausfall nicht alles trifft',
    '~0.5 In mehrere Fonds derselben Branche investieren::Das streut kaum – die Risiken hängen zusammen.',
    'Jeden Monat gleich viel anlegen::Das ist der Durchschnittskosteneffekt.',
    'Nur in sichere Anlagen gehen::Das ist Risikovermeidung, nicht Streuung.',
  ], 'Streuung senkt das Risiko einzelner Werte – das Marktrisiko bleibt.'),
  frage(15, 'bank.risiko', 3, 'Welche Aussage über Rendite und Risiko stimmt?', [
    'Höhere Renditechancen gehen mit höheren Verlustrisiken einher',
    '~0.5 Mehr Risiko bringt mehr Rendite::Nur die Chance darauf – garantiert ist nichts.',
    'Risiko lässt sich durch gute Auswahl ausschalten::Auswahl kann streuen, nicht ausschalten.',
    'Sichere Anlagen bringen langfristig mehr::Historisch nicht der Fall.',
  ], 'Wer sichere hohe Rendite verspricht, verspricht zu viel – das ist das älteste Warnsignal überhaupt.'),
  frage(16, 'bank.inflation', 2, 'Wobei hilft die Einlagensicherung?', [
    'Sie schützt Guthaben bis 100.000 € je Kunde und Bank, falls die Bank ausfällt',
    '~0.5 Sie schützt vor Kursverlusten::Nein, nur vor dem Ausfall der Bank.',
    'Sie schützt vor Inflation::Kaufkraftverlust ist nicht abgesichert.',
    'Sie ersetzt Geld bei Betrug::Dafür gelten andere Regeln.',
  ], 'Die gesetzliche Sicherung gilt pro Kunde und Institut – Wertpapiere fallen nicht darunter, sie gehören dem Kunden ohnehin.'),

  // Modul 6
  frage(17, 'bank.giro', 1, 'Was unterscheidet Debit- von Kreditkarte?', [
    'Bei der Debitkarte wird sofort vom Konto abgebucht, bei der Kreditkarte gesammelt abgerechnet',
    '~0.5 Die Kreditkarte hat ein Limit::Beide haben Limits.',
    'Die Debitkarte funktioniert nicht im Ausland::Meistens schon.',
    'Die Kreditkarte ist immer kostenlos::Das stimmt nicht.',
  ], 'Der Unterschied liegt im Zeitpunkt der Belastung – und darin, wer wem kurzfristig Geld leiht.'),
  frage(18, 'bank.dispo', 2, 'Wann ist ein Dispo sinnvoll?', [
    'Für kurze Überbrückungen von wenigen Tagen',
    '~0.5 Für größere Anschaffungen, wenn er billiger ist als ein Kredit::Er ist fast nie billiger.',
    'Als Dauerlösung, wenn das Gehalt knapp ist::Dann wird er zur Dauerbelastung.',
    'Gar nicht – man sollte ihn abschaffen::Als Puffer hat er seinen Sinn.',
  ], 'Als Puffer gut, als Dauerzustand teuer: Dispozinsen liegen meist weit über Ratenkreditzinsen.'),
  frage(19, 'bank.gebuehren', 2, 'Was steht im Preis- und Leistungsverzeichnis?', [
    'Alle Entgelte für Kontoführung, Karten und Sonderleistungen',
    '~0.5 Nur die Kontoführungsgebühr::Es steht deutlich mehr drin.',
    'Die Zinssätze für Kredite::Die stehen im Preisaushang oder im Vertrag.',
    'Die Öffnungszeiten::Das gehört nicht hinein.',
  ], 'Wer wissen will, was eine Ersatzkarte oder eine Auslandsabhebung kostet, findet es dort.'),
  frage(20, 'bank.giro', 3, 'Was ist ein Pfändungsschutzkonto (P-Konto)?', [
    'Ein Girokonto, auf dem ein Grundfreibetrag vor Pfändung geschützt ist',
    '~0.5 Ein Konto, das nicht gepfändet werden kann::Gepfändet werden kann es – nur der Freibetrag bleibt.',
    'Ein Sparkonto für Schuldner::Es ist ein normales Girokonto mit Schutzfunktion.',
    'Ein Konto ohne Gebühren::Gebühren dürfen anfallen, nur nicht höher als beim normalen Konto.',
  ], 'Jedes Girokonto lässt sich in ein P-Konto umwandeln – das ist ein Rechtsanspruch.'),

  // Modul 7
  frage(21, 'bank.daten', 1, 'Wonach fragt eine Bank niemals?', [
    'Nach PIN oder TAN',
    '~0.5 Nach dem Geburtsdatum::Danach wird zur Identifikation durchaus gefragt.',
    'Nach der Kontonummer::Die ist der Bank ohnehin bekannt.',
    'Nach dem Grund einer Überweisung::Bei Auffälligkeiten ist das erlaubt.',
  ], 'PIN und TAN gehören niemandem außer dem Kunden – auch keinem Mitarbeiter.'),
  frage(22, 'bank.betrug', 2, 'Was ist typisch für Phishing-Nachrichten?', [
    'Zeitdruck, Drohung mit Sperrung und ein Link zur „Bestätigung“',
    '~0.5 Rechtschreibfehler::Früher typisch, heute oft perfekt formuliert.',
    'Eine unbekannte Absenderadresse::Adressen lassen sich fälschen.',
    'Anhänge im PDF-Format::Kommt vor, ist aber kein Erkennungsmerkmal.',
  ], 'Nicht der Fehler verrät die Masche, sondern das Muster: Druck plus Link plus Datenabfrage.'),
  frage(23, 'bank.reaktion', 2, 'Was ist der erste Schritt nach einer Phishing-Eingabe?', [
    'Onlinebanking-Zugang sofort sperren lassen',
    '~0.5 Die Bank anrufen und schildern::Richtig – zuerst zählt aber die Sperrung.',
    'Passwort ändern::Gut, aber wirkungslos, wenn schon Aufträge laufen.',
    'Abwarten, ob etwas passiert::Genau das nutzen Täter aus.',
  ], 'Sperren, dann reklamieren, dann anzeigen – in dieser Reihenfolge.'),
  frage(24, 'bank.betrug', 3, 'Ein Kunde soll für einen „Testkauf“ Geld weiterleiten. Was ist das?', [
    'Geldwäsche – der Kunde wäre Finanzagent und macht sich strafbar',
    '~0.5 Ein unseriöses, aber legales Angebot::Es ist strafbar, auch bei gutem Glauben.',
    'Ein normales Nebeneinkommen::Seriöse Arbeitgeber leiten kein Geld über Privatkonten.',
    'Ein Test der Bank::Banken machen so etwas nicht.',
  ], '„Zahlungen über Ihr Konto abwickeln“ ist nie ein Job, sondern immer eine Straftat.'),

  // Modul 8
  frage(25, 'bank.gespraech', 2, 'Womit beginnt ein gutes Beratungsgespräch?', [
    'Mit offenen Fragen nach Ziel, Zeitraum und bisherigen Erfahrungen',
    '~0.5 Mit einer Übersicht der Produkte::Erst der Bedarf, dann das Produkt.',
    'Mit dem aktuellen Zinsangebot::Das ist ein Verkaufsstart, kein Beratungsstart.',
    'Mit der Frage nach dem Anlagebetrag::Wichtig, aber nicht als Erstes.',
  ], 'Wer zuerst fragt, verkauft am Ende das Passende – und muss weniger überreden.'),
  frage(26, 'bank.bedarf', 3, 'Ein Kunde will „möglichst hohe Rendite ohne Risiko“. Was tust du?', [
    'Den Widerspruch ansprechen und den Zielkonflikt erklären',
    '~0.5 Nach dem Zeithorizont fragen::Wichtig – der Widerspruch bleibt trotzdem stehen.',
    'Das renditestärkste Produkt zeigen::Das ignoriert die Hälfte des Wunsches.',
    'Nur Tagesgeld anbieten::Beantwortet den Renditewunsch nicht.',
  ], 'Diesen Zielkonflikt auszusprechen ist keine Absage, sondern der Kern der Beratung.'),
  frage(27, 'bank.bedarf', 3, 'Wozu dient das Beratungsprotokoll?', [
    'Es hält Bedarf, Empfehlung und Begründung nachvollziehbar fest',
    '~0.5 Es schützt die Bank vor Haftung::Ein Nebeneffekt – der Zweck ist Nachvollziehbarkeit.',
    'Es ersetzt den Vertrag::Das tut es nicht.',
    'Es ist freiwillig::Bei Anlageberatung ist die Dokumentation Pflicht.',
  ], 'Wer später fragt, warum genau das empfohlen wurde, findet im Protokoll die Antwort.'),
  frage(28, 'bank.gespraech', 4, 'Der Kunde schweigt nach deiner Empfehlung. Was ist die beste Reaktion?', [
    'Die Stille aushalten und dann offen nachfragen, was ihn zögern lässt',
    '~0.5 Die Empfehlung noch einmal erklären::Kann helfen – oft ist es aber ein ungeklärter Einwand.',
    'Ein zweites Produkt zeigen::Erhöht die Verwirrung.',
    'Auf den Abschluss drängen::Der sicherste Weg zu einem Widerruf.',
  ], 'Schweigen ist selten Zustimmung – meistens ist es ein Einwand, der noch keine Worte hat.'),

  // Modul 1 – mehr Stoff für den Einstieg
  frage(29, 'bank.konto', 1, 'Wie lange dauert eine normale SEPA-Überweisung innerhalb Deutschlands?', [
    'Spätestens am nächsten Bankarbeitstag',
    '~0.5 Wenige Sekunden::Das gilt für Echtzeitüberweisungen.',
    'Bis zu drei Werktage::Das war vor der SEPA-Umstellung so.',
    'Sofort, aber nur werktags::Sofort ist nur die Echtzeitüberweisung.',
  ], 'Seit SEPA gilt: ein Bankarbeitstag. Echtzeitüberweisungen sind in Sekunden da und rund um die Uhr möglich.'),
  frage(30, 'bank.konto', 2, 'Was ist der Unterschied zwischen Buchungs- und Wertstellungsdatum?', [
    'Die Buchung ist der Tag der Verarbeitung, die Wertstellung zählt für die Zinsen',
    '~0.5 Die Wertstellung liegt immer später::Sie kann auch früher liegen.',
    'Beides ist dasselbe::Dann bräuchte es keine zwei Spalten.',
    'Die Buchung gilt nur für Lastschriften::Sie gilt für alle Umsätze.',
  ], 'Auf dem Auszug stehen beide – nur die Valuta entscheidet über Zinsen.'),
  frage(31, 'bank.begriffe', 1, 'Was ist ein Kontoauszug?', [
    'Eine Aufstellung aller Umsätze eines Zeitraums mit Anfangs- und Endsaldo',
    '~0.5 Eine Liste der letzten Buchungen::Fast – Saldo und Zeitraum gehören dazu.',
    'Der aktuelle Kontostand::Das ist nur eine Zahl daraus.',
    'Ein Nachweis über das Guthaben::Dafür gibt es die Saldenbestätigung.',
  ], 'Der Auszug ist der lückenlose Nachweis – deshalb sind Nummerierung und Saldo wichtig.'),
  frage(32, 'bank.beleg', 1, 'Der Kunde schreibt einen Betrag als „1.250,00“ und in Worten „einhundertfünfzig“. Was tust du?', [
    'Nachfragen – bei Abweichung zählt nichts, bevor es geklärt ist',
    '~0.5 Den Betrag in Worten nehmen::Traditionell gilt die Wortangabe, im Zahlungsverkehr wird aber nachgefragt.',
    'Den Zahlbetrag nehmen, der ist eindeutiger::Auch das ist geraten.',
    'Den Beleg zurückweisen::Zu bürokratisch – eine Frage genügt.',
  ], 'Widersprüchliche Belege werden nicht interpretiert, sondern geklärt.'),
]

// ---------- Stimmt das? ----------

function duell(nr: number, ziel: string, stufe: Stufe, richtig: string, falsch: string, warum: string, frageText?: string): DuellItem {
  return {
    id: `bank.du.${String(nr).padStart(2, '0')}`,
    spiel: 'bank.duell',
    art: 'duell',
    ziel,
    stufe,
    a: richtig,
    b: falsch,
    richtig: 'a',
    warum,
    frage: frageText ?? 'Welche Aussage stimmt?',
  }
}

export const DUELLE: DuellItem[] = [
  // Modul 1
  duell(1, 'bank.konto', 1, 'Eine Lastschrift kann man acht Wochen lang zurückholen.', 'Eine Lastschrift ist sofort endgültig.', 'Bei SEPA-Basislastschriften gilt eine Widerspruchsfrist von acht Wochen.'),
  duell(2, 'bank.konto', 2, 'Beim Dauerauftrag bestimmt der Zahler Betrag und Termin.', 'Beim Dauerauftrag zieht der Empfänger das Geld ein.', 'Einziehen kann nur, wer eine Lastschrift nutzt.'),
  duell(3, 'bank.begriffe', 2, 'Die deutsche IBAN hat 22 Stellen.', 'Die deutsche IBAN hat 20 Stellen.', 'DE + 2 Prüfziffern + 8 Stellen Bankleitzahl + 10 Stellen Kontonummer = 22.'),
  duell(4, 'bank.begriffe', 3, 'Der Verwendungszweck ist für die Buchung nicht entscheidend.', 'Ohne passenden Verwendungszweck kommt die Überweisung nicht an.', 'Gebucht wird nach IBAN. Der Zweck hilft dem Empfänger beim Zuordnen – mehr nicht.'),
  duell(5, 'bank.beleg', 3, 'Bei Überweisungen wird der Empfängername in vielen Fällen mit der IBAN abgeglichen.', 'Der Empfängername wird nie geprüft.', 'Seit der Umstellung auf die Empfängerüberprüfung gleichen Banken Name und IBAN ab und warnen bei Abweichung.'),

  // Modul 3
  duell(6, 'bank.zins', 1, '„p. a.“ bedeutet pro Jahr.', '„p. a.“ bedeutet pro Anlage.', 'Von lateinisch „per annum“.'),
  duell(7, 'bank.effektiv', 2, 'Kredite vergleicht man über den effektiven Jahreszins.', 'Kredite vergleicht man über den Nominalzins.', 'Nur der Effektivzins enthält die Kostenbestandteile und ist damit vergleichbar.'),
  duell(8, 'bank.zinseszins', 3, 'Beim Zinseszins wächst das Kapital exponentiell.', 'Beim Zinseszins wächst das Kapital linear.', 'Weil die Zinsen mitverzinst werden, steht die Zeit im Exponenten.'),
  duell(9, 'bank.zins', 3, 'Bei 2 % Zins und 4 % Inflation verliert das Guthaben real an Wert.', 'Bei 2 % Zins und 4 % Inflation bleibt der Wert gleich.', 'Realzins = Zins minus Inflation, hier also −2 %.'),
  duell(10, 'bank.effektiv', 4, 'Eine Restschuldversicherung muss in den Effektivzins, wenn sie Pflicht für den Kredit ist.', 'Eine Restschuldversicherung bleibt immer außen vor.', 'Ist sie Voraussetzung für den Vertrag, gehört sie in die Gesamtkosten.'),

  // Modul 4
  duell(11, 'bank.sparen', 1, 'Festgeld ist für die Laufzeit gebunden.', 'Festgeld ist jederzeit verfügbar.', 'Jederzeit verfügbar ist Tagesgeld.'),
  duell(12, 'bank.risiko', 2, 'Streuung senkt das Risiko einzelner Werte.', 'Streuung beseitigt jedes Risiko.', 'Das Marktrisiko bleibt auch bei bester Streuung bestehen.'),
  duell(13, 'bank.risiko', 3, 'Nach einem Verlust von 50 % braucht es +100 %, um wieder bei null zu sein.', 'Nach einem Verlust von 50 % reicht +50 % zum Ausgleich.', 'Aus 100 werden 50; um zurück auf 100 zu kommen, muss sich der Wert verdoppeln.'),
  duell(14, 'bank.inflation', 2, 'Die Einlagensicherung greift, wenn die Bank ausfällt.', 'Die Einlagensicherung greift bei Kursverlusten.', 'Kursrisiken sind nicht versichert – abgesichert sind Einlagen bis 100.000 € je Kunde und Institut.'),
  duell(15, 'bank.sparen', 4, 'Wertpapiere im Depot gehören auch bei einer Bankpleite dem Kunden.', 'Wertpapiere im Depot fallen in die Insolvenzmasse der Bank.', 'Depotwerte sind Sondervermögen beziehungsweise Eigentum des Kunden – die Bank verwahrt sie nur.'),

  // Modul 6
  duell(16, 'bank.giro', 1, 'Bei der Debitkarte wird sofort vom Konto abgebucht.', 'Bei der Debitkarte wird monatlich gesammelt abgerechnet.', 'Gesammelt abgerechnet wird bei der Kreditkarte.'),
  duell(17, 'bank.dispo', 2, 'Dispozinsen sind meist deutlich höher als Ratenkreditzinsen.', 'Dispozinsen sind meist günstiger als Ratenkredite.', 'Der Dispo ist bequem, aber fast immer die teuerste Form der Finanzierung.'),
  duell(18, 'bank.gebuehren', 2, 'Gebühren stehen im Preis- und Leistungsverzeichnis.', 'Gebühren müssen nicht veröffentlicht werden.', 'Das Verzeichnis ist Pflicht und muss zugänglich sein.'),
  duell(19, 'bank.giro', 3, 'Jeder hat Anspruch auf ein Basiskonto.', 'Banken dürfen frei entscheiden, wem sie ein Konto geben.', 'Seit dem Zahlungskontengesetz gibt es einen Anspruch auf ein Basiskonto – auch ohne festen Wohnsitz.'),
  duell(20, 'bank.dispo', 3, 'Die Bank darf den Dispo kündigen oder kürzen.', 'Ein eingeräumter Dispo gilt unbefristet.', 'Der Dispo ist eine Kreditlinie – sie kann angepasst werden.'),

  // Modul 7
  duell(21, 'bank.daten', 1, 'Die Bank fragt nie nach der TAN.', 'Die Bank darf die TAN zur Prüfung erfragen.', 'Niemand außer dem Kunden braucht eine TAN – auch die Bank nicht.'),
  duell(22, 'bank.betrug', 2, 'Rufnummern im Display lassen sich fälschen.', 'Wenn die Filialnummer im Display steht, ruft die Bank an.', 'Call-ID-Spoofing ist einfach – die angezeigte Nummer beweist nichts.'),
  duell(23, 'bank.reaktion', 2, 'Nach einer Phishing-Eingabe wird zuerst der Zugang gesperrt.', 'Nach einer Phishing-Eingabe wartet man erst die Buchungen ab.', 'Solange der Zugang offen ist, können weitere Aufträge folgen.'),
  duell(24, 'bank.betrug', 3, 'Wer Geld für Fremde über sein Konto weiterleitet, macht sich strafbar.', 'Geld für Fremde weiterzuleiten ist erlaubt, solange man nichts behält.', 'Das ist Geldwäsche – auch ohne Gewinn und ohne Vorsatz drohen Strafe und Haftung.'),
  duell(25, 'bank.daten', 3, 'Auch Mitarbeitende der Bank sehen die PIN nicht.', 'Mitarbeitende der Bank können die PIN im System nachsehen.', 'Die PIN liegt nur verschlüsselt vor – niemand kann sie auslesen.'),

  // Modul 1 – mehr Stoff für den Einstieg
  duell(26, 'bank.konto', 1, 'Eine Echtzeitüberweisung ist in Sekunden beim Empfänger.', 'Eine Echtzeitüberweisung dauert einen Bankarbeitstag.', 'Genau das unterscheidet sie von der normalen Überweisung.'),
  duell(27, 'bank.konto', 2, 'Eine Überweisung kann nach der Ausführung nicht einfach zurückgeholt werden.', 'Überweisungen lassen sich acht Wochen lang zurückholen.', 'Acht Wochen gelten für Lastschriften. Bei Überweisungen bleibt nur die Bitte um Rücküberweisung.'),
  duell(28, 'bank.begriffe', 2, 'Der Saldo ist der Stand des Kontos zu einem Zeitpunkt.', 'Der Saldo ist die Summe aller Eingänge.', 'Saldo heißt Verrechnung von Eingängen und Ausgängen.'),
  duell(29, 'bank.beleg', 2, 'Bei widersprüchlichen Beträgen auf einem Beleg wird nachgefragt.', 'Bei widersprüchlichen Beträgen gilt immer die Zahl in Ziffern.', 'Widersprüche werden geklärt, nicht ausgelegt.'),
  duell(30, 'bank.begriffe', 3, 'Ein Freistellungsauftrag schützt Kapitalerträge bis zum Sparerpauschbetrag vor Steuerabzug.', 'Ein Freistellungsauftrag befreit dauerhaft von der Einkommensteuer.', 'Er wirkt nur auf Kapitalerträge und nur bis zum Pauschbetrag – darüber wird Abgeltungsteuer einbehalten.'),
]

// ---------- Fachbegriffe ----------

function paar(nr: number, ziel: string, stufe: Stufe, links: string, rechts: string, beispiel?: string): PaarItem {
  return {
    id: `bank.pa.${String(nr).padStart(2, '0')}`,
    spiel: 'bank.paare',
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
  paar(1, 'bank.konto', 1, 'Dauerauftrag', 'Der Zahler schickt regelmäßig', 'Miete, Vereinsbeitrag.'),
  paar(2, 'bank.konto', 1, 'Lastschrift', 'Der Empfänger zieht ein', 'Strom, Handyrechnung.'),
  paar(3, 'bank.begriffe', 2, 'Valuta', 'Wertstellungsdatum', 'Ab diesem Tag zählt der Betrag für Zinsen.'),
  paar(4, 'bank.begriffe', 2, 'BIC', 'Internationale Bankkennung', 'Innerhalb der EU meist nicht mehr nötig.'),
  paar(5, 'bank.beleg', 3, 'Vormerkung', 'Reservierter, noch nicht gebuchter Betrag', 'Typisch nach dem Tanken oder beim Hotel.'),

  // Modul 3
  paar(6, 'bank.zins', 1, 'p. a.', 'pro Jahr', ''),
  paar(7, 'bank.effektiv', 2, 'Effektivzins', 'Vergleichbarer Gesamtpreis eines Kredits', ''),
  paar(8, 'bank.zinseszins', 3, 'Zinseszins', 'Zinsen, die selbst wieder Zinsen bringen', ''),
  paar(9, 'bank.zins', 3, 'Realzins', 'Zins minus Inflation', ''),
  paar(10, 'bank.effektiv', 4, 'Annuität', 'Gleichbleibende Rate aus Zins und Tilgung', 'Am Anfang mehr Zins, später mehr Tilgung.'),

  // Modul 4
  paar(11, 'bank.sparen', 1, 'Tagesgeld', 'Jederzeit verfügbar', ''),
  paar(12, 'bank.sparen', 1, 'Festgeld', 'Für die Laufzeit gebunden', ''),
  paar(13, 'bank.risiko', 2, 'Diversifikation', 'Streuung über viele Werte', ''),
  paar(14, 'bank.risiko', 3, 'Volatilität', 'Stärke der Kursschwankungen', ''),
  paar(15, 'bank.inflation', 2, 'Einlagensicherung', 'Schutz von Guthaben bis 100.000 €', 'Je Kunde und Institut.'),

  // Modul 6
  paar(16, 'bank.giro', 1, 'Debitkarte', 'Belastung sofort vom Konto', ''),
  paar(17, 'bank.giro', 1, 'Kreditkarte', 'Sammelabrechnung, meist monatlich', ''),
  paar(18, 'bank.dispo', 2, 'Dispo', 'Eingeräumte Überziehung des Girokontos', ''),
  paar(19, 'bank.dispo', 3, 'Geduldete Überziehung', 'Minus über den Dispo hinaus – besonders teuer', ''),
  paar(20, 'bank.gebuehren', 2, 'Preis- und Leistungsverzeichnis', 'Übersicht aller Entgelte', ''),

  // Modul 8
  paar(21, 'bank.gespraech', 2, 'Offene Frage', 'Frage, die nicht mit Ja oder Nein endet', '„Was ist Ihnen dabei wichtig?“'),
  paar(22, 'bank.gespraech', 3, 'Beratungsprotokoll', 'Dokumentation von Bedarf und Empfehlung', ''),
  paar(23, 'bank.bedarf', 2, 'Anlagehorizont', 'Zeitraum bis zum Bedarf des Geldes', ''),
  paar(24, 'bank.bedarf', 3, 'Risikotragfähigkeit', 'Wie viel Verlust jemand aushalten kann', 'Wirtschaftlich – und nervlich.'),
  paar(25, 'bank.gespraech', 4, 'Zielkonflikt', 'Zwei Wünsche, die sich widersprechen', '„Hohe Rendite ohne Risiko.“'),

  // Modul 1 – mehr Stoff für den Einstieg
  paar(26, 'bank.konto', 1, 'IBAN', 'Internationale Kontonummer', 'In Deutschland 22 Stellen.'),
  paar(27, 'bank.konto', 2, 'Echtzeitüberweisung', 'In Sekunden beim Empfänger', 'Rund um die Uhr, auch am Wochenende.'),
  paar(28, 'bank.begriffe', 1, 'Saldo', 'Kontostand nach Verrechnung', ''),
  paar(29, 'bank.begriffe', 3, 'Freistellungsauftrag', 'Kapitalerträge bis zum Pauschbetrag ohne Steuerabzug', ''),
  paar(30, 'bank.beleg', 2, 'Verwendungszweck', 'Hinweis für den Empfänger, wofür das Geld ist', 'Für die Buchung selbst zählt die IBAN.'),
]

// ---------- Echt oder Masche? ----------

function nachricht(nr: number, ziel: string, stufe: Stufe, text: string, masche: boolean, warum: string, detail?: string): KarteItem {
  return {
    id: `bank.ma.${String(nr).padStart(2, '0')}`,
    spiel: 'bank.masche',
    art: 'karte',
    ziel,
    stufe,
    text,
    ...(detail ? { detail } : {}),
    fach: masche ? 1 : 0,
    warum,
  }
}

export const MASCHEN: KarteItem[] = [
  nachricht(1, 'bank.betrug', 1, 'Ihr Konto wird in 24 Stunden gesperrt. Jetzt hier bestätigen.', true, 'Zeitdruck plus Link – das klassische Muster.', 'SMS mit Kurzlink'),
  nachricht(2, 'bank.daten', 1, 'Bitte nennen Sie mir zur Freigabe Ihre TAN.', true, 'Nach einer TAN fragt keine Bank – nie.', 'Anruf'),
  nachricht(3, 'bank.betrug', 1, 'Ihre Karte läuft nächsten Monat ab. Die neue kommt automatisch per Post.', false, 'Reine Information ohne Handlungsdruck und ohne Datenabfrage.', 'Brief der Bank'),
  nachricht(4, 'bank.daten', 2, 'Zur Aktualisierung Ihrer Daten laden Sie bitte den Anhang herunter.', true, 'Banken verschicken keine Formulare zum Öffnen – und drängen nicht zur Eile.', 'E-Mail mit Anhang'),
  nachricht(5, 'bank.betrug', 2, 'Guten Tag, hier ist Ihre Filiale. Zur Terminvereinbarung rufen Sie uns bitte unter der Nummer auf Ihrer Karte zurück.', false, 'Verweist auf die bekannte Nummer, statt Daten zu erfragen.', 'Mailbox-Nachricht'),
  nachricht(6, 'bank.daten', 2, 'Wir haben eine ungewöhnliche Abbuchung bemerkt. Bitte prüfen Sie im Onlinebanking – ohne Link, über Ihre gewohnte App.', false, 'Weist auf den eigenen, bekannten Weg – kein Link, keine Datenabfrage.', 'Postfach im Onlinebanking'),
  nachricht(7, 'bank.betrug', 2, 'Ihr Paket konnte nicht zugestellt werden. Zahlen Sie 2,99 € Nachgebühr.', true, 'Kleinbetrag als Köder für die Kartendaten.', 'SMS'),
  nachricht(8, 'bank.reaktion', 3, 'Ein Mitarbeiter kommt gleich vorbei und holt Ihre Karte zur Sicherheit ab.', true, 'Niemand holt Karten ab – eine der häufigsten Maschen bei älteren Menschen.', 'Anruf'),
  nachricht(9, 'bank.betrug', 3, 'Sie haben im Gewinnspiel 5.000 € gewonnen. Für die Auszahlung brauchen wir Ihre Kontodaten und eine Gebühr.', true, 'Vorkasse für einen Gewinn – immer Betrug.', 'E-Mail'),
  nachricht(10, 'bank.daten', 3, 'Ihre Zugangsdaten wurden zurückgesetzt. Falls Sie das nicht waren, rufen Sie uns an – Nummer siehe Rückseite Ihrer Karte.', false, 'Warnung ohne Link, mit Verweis auf die bekannte Nummer.', 'Brief'),
  nachricht(11, 'bank.betrug', 3, 'Ihr Konto wurde für Geldwäsche missbraucht. Überweisen Sie Ihr Guthaben zur Sicherung auf dieses Treuhandkonto.', true, 'Ein „Sicherheitskonto“ gibt es nicht. Kein Amt und keine Bank verlangt Überweisungen zur Sicherung.', 'Anruf, angeblich Polizei'),
  nachricht(12, 'bank.reaktion', 4, 'Hallo Papa, mein Handy ist kaputt, das ist meine neue Nummer. Kannst du kurz eine Rechnung für mich bezahlen?', true, 'Der Enkeltrick per Messenger: neue Nummer, Zeitdruck, Geldbitte.', 'WhatsApp'),
  nachricht(13, 'bank.daten', 4, 'Für Ihre Überweisung ins Ausland brauchen wir eine Freigabe in der App. Bitte prüfen Sie Betrag und Empfänger sorgfältig.', false, 'Genau so funktioniert eine echte Freigabe – Prüfhinweis statt Datenabfrage.', 'Push-Nachricht der Banking-App'),
  nachricht(14, 'bank.betrug', 4, 'Support-Mitarbeiter benötigt Fernzugriff auf Ihren Rechner, um ein Banking-Problem zu lösen.', true, 'Fernwartung fürs Onlinebanking gibt es nicht – so räumen Täter Konten leer.', 'Anruf'),
  nachricht(15, 'bank.reaktion', 4, 'Wir haben Ihre Kartenzahlung über 890 € in Warschau gestoppt. Bitte melden Sie sich über die bekannte Servicenummer.', false, 'Information über eine Sperrung ohne Link und ohne Datenabfrage.', 'SMS der Bank'),
]

// ---------- Belege prüfen ----------

function beleg(
  nr: number,
  ziel: string,
  stufe: Stufe,
  titel: string,
  untertitel: string,
  auftrag: string,
  zeilen: { label: string; wert: string; fehler?: { richtig: string; falsch: string[]; warum: string } }[],
): DokumentItem {
  return {
    id: `bank.be.${String(nr).padStart(2, '0')}`,
    spiel: 'bank.beleg',
    art: 'dokument',
    ziel,
    stufe,
    titel,
    untertitel,
    auftrag,
    zeilen,
  }
}

export const BELEGE: DokumentItem[] = [
  beleg(1, 'bank.beleg', 2, 'Überweisungsauftrag', 'Beleg 4711 · Schalter', 'Der Kunde will 1.250 € Miete an seine Vermieterin überweisen. Finde den Fehler.', [
    { label: 'Empfänger', wert: 'Marlene Ostwald' },
    { label: 'IBAN', wert: 'DE12 3456 7890 1234 5678 9' },
    { label: 'Betrag', wert: '12.500,00 €', fehler: { richtig: '1.250,00 €', falsch: ['125,00 €', '1.025,00 €', '12,50 €'], warum: 'Ein Komma zu weit rechts – aus 1.250 € werden 12.500 €. Der Klassiker unter den Belegfehlern.' } },
    { label: 'Verwendungszweck', wert: 'Miete August' },
    { label: 'Datum', wert: '28.07.' },
  ]),
  beleg(2, 'bank.beleg', 3, 'Kontoauszug', 'Auszug 07 · Girokonto', 'Der Kunde sagt, er habe den Betrag zweimal bezahlt. Finde die Auffälligkeit.', [
    { label: '02.07. Lastschrift', wert: 'Stadtwerke 89,00 €' },
    { label: '05.07. Kartenzahlung', wert: 'Supermarkt 46,20 €' },
    { label: '09.07. Lastschrift', wert: 'Stadtwerke 89,00 €', fehler: { richtig: 'Doppelte Lastschrift – Rückgabe möglich', falsch: ['Normale Abschlagszahlung', 'Gebühr der Bank', 'Gutschrift des Versorgers'], warum: 'Zweimal derselbe Einzieher mit identischem Betrag binnen einer Woche: Das ist eine Doppelbuchung – acht Wochen lang zurückzugeben.' } },
    { label: '15.07. Gutschrift', wert: 'Gehalt 2.480,00 €' },
    { label: '20.07. Dauerauftrag', wert: 'Miete 780,00 €' },
  ]),
  beleg(3, 'bank.beleg', 3, 'Überweisungsauftrag', 'Beleg 4820 · Onlinebanking', 'Der Kunde überweist an einen neuen Handwerker. Was passt nicht?', [
    { label: 'Empfänger', wert: 'Elektro Bergmann GmbH' },
    { label: 'IBAN', wert: 'FR76 3000 6000 0112 3456 7890 189', fehler: { richtig: 'DE-IBAN des Betriebs erfragen', falsch: ['IBAN ist korrekt', 'BIC ergänzen', 'Betrag senken'], warum: 'Ein Handwerksbetrieb aus der Nachbarschaft mit französischer IBAN – typisches Muster bei gefälschten Rechnungen. Vor der Zahlung beim Betrieb nachfragen, mit bekannter Nummer.' } },
    { label: 'Betrag', wert: '1.840,00 €' },
    { label: 'Verwendungszweck', wert: 'Rechnung 2024-318' },
  ]),
  beleg(4, 'bank.beleg', 4, 'Kreditvertrag (Auszug)', 'Ratenkredit · Entwurf', 'Prüfe den Entwurf, bevor er zum Kunden geht.', [
    { label: 'Nettokreditbetrag', wert: '9.000,00 €' },
    { label: 'Laufzeit', wert: '48 Monate' },
    { label: 'Sollzins', wert: '6,90 % p. a.' },
    { label: 'Monatsrate', wert: '215,10 €' },
    { label: 'Effektiver Jahreszins', wert: '6,90 %', fehler: { richtig: '7,12 % (mit Kontoführungsentgelt)', falsch: ['6,45 %', '6,90 % ist korrekt', '13,80 %'], warum: 'Der Effektivzins liegt über dem Sollzins, sobald Kosten dazukommen. Steht dort derselbe Wert, fehlt etwas – hier das Kontoführungsentgelt.' } },
    { label: 'Gesamtbetrag', wert: '10.324,80 €' },
  ]),
]
