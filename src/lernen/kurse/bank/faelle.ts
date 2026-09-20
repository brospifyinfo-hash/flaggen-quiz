// 🏦 Kundenfälle: erfundene Menschen mit echten Fragen. Erst prüfen, dann entscheiden –
// und die wichtigen Befunde nicht überspringen.
import type { FallItem, Stufe } from '../../typen'
import { optionen } from '../werkzeug'

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
    id: `bank.fa.${String(nr).padStart(2, '0')}`,
    spiel: 'bank.kunde',
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
  // ---------- Modul 5: Kredit ----------
  fall(1, 'bank.tragfaehig', 2, { name: 'Herr Wendt', emoji: '🧑‍🏭', rolle: 'Lagerist, 34' },
    'Ich brauche 8.000 Euro für ein Auto – geht das schnell?',
    [
      { frage: 'Einkommen prüfen', befund: 'Netto 2.480 €, unbefristet seit sechs Jahren.', wichtig: true },
      { frage: 'Feste Ausgaben aufnehmen', befund: 'Miete 760 €, Lebenshaltung 650 €, Versicherungen 120 €.', wichtig: true },
      { frage: 'Laufende Kredite abfragen', befund: 'Noch eine Ratenzahlung über 95 € für ein Handy, 14 Monate Restlaufzeit.', wichtig: true },
      { frage: 'Nach dem Auto fragen', befund: 'Gebrauchtwagen, 7.500 € plus Anmeldung und Reifen.' },
      { frage: 'Kontoauszüge durchsehen', befund: 'Kein Dispo genutzt, regelmäßige Sparbuchung von 100 €.' },
    ],
    {
      frage: 'Wie beurteilst du den Fall?',
      liste: [
        'Tragbar – es bleiben nach Rate und Altkredit über 700 € übrig::Nach allen Ausgaben bleiben 855 €, die Rate liegt bei rund 190 €.',
        '~0.5 Tragbar, aber nur mit längerer Laufzeit::Nicht nötig – der Haushalt trägt auch 48 Monate.',
        'Nicht tragbar, weil noch ein Kredit läuft::Ein kleiner Altkredit schließt nichts aus; entscheidend ist, was übrig bleibt.',
        'Erst entscheiden, wenn die Schufa da ist::Die Auskunft gehört dazu, ersetzt aber die Haushaltsrechnung nicht.',
      ],
    },
    {
      frage: 'Was schlägst du vor?',
      liste: [
        '8.000 € über 48 Monate, Rate rund 190 €',
        '~0.5 8.000 € über 24 Monate, Rate rund 360 €::Machbar, aber die Reserve schrumpft ohne Not.',
        '12.000 € – dann ist gleich Geld für Reparaturen da::Mehr Kredit als nötig ist keine Beratung, sondern Verkauf.',
        'Dispo nutzen, das geht sofort::Dispozinsen sind ein Vielfaches – für 8.000 € völlig unpassend.',
      ],
    },
  ),
  fall(2, 'bank.tragfaehig', 4, { name: 'Frau Sahin', emoji: '👩‍🎨', rolle: 'Selbstständige Grafikerin, 41' },
    'Ich möchte 20.000 Euro für neue Technik – mein letztes Jahr war stark.',
    [
      { frage: 'Einkommen der letzten drei Jahre ansehen', befund: 'Gewinn: 62.000 €, 28.000 €, 35.000 € – stark schwankend.', wichtig: true },
      { frage: 'Steuerrücklagen prüfen', befund: 'Keine Rücklage gebildet, Nachzahlung von 9.000 € steht an.', wichtig: true },
      { frage: 'Private Fixkosten aufnehmen', befund: 'Miete 1.100 €, Lebenshaltung 900 €, Kranken- und Altersvorsorge 780 €.' },
      { frage: 'Auftragslage besprechen', befund: 'Zwei feste Kunden, ein dritter ist gerade abgesprungen.', wichtig: true },
      { frage: 'Nach Sicherheiten fragen', befund: 'Keine – Technik verliert schnell an Wert.' },
    ],
    {
      frage: 'Wie beurteilst du den Fall?',
      liste: [
        'Zu riskant in dieser Form – Steuerlast und schwankende Einnahmen sind ungedeckt::Bei Selbstständigen zählt der Durchschnitt, nicht das beste Jahr.',
        '~0.5 Nur mit geringerem Betrag und Sicherheit::Richtige Richtung – die offene Steuernachzahlung bleibt trotzdem das Kernproblem.',
        'Tragbar – im besten Jahr waren es 62.000 €::Das beste Jahr ist keine Grundlage; die Nachzahlung ist schon terminiert.',
        'Ablehnen, weil Selbstständige kein Einkommen nachweisen::Das stimmt so nicht – Gewinnermittlungen sind ein anerkannter Nachweis.',
      ],
    },
    {
      frage: 'Was besprichst du mit ihr?',
      liste: [
        'Erst Steuerrücklage klären, dann kleinerer Betrag mit längerer Laufzeit',
        '~0.5 Leasing der Technik statt Kredit prüfen::Eine Möglichkeit – die Steuerlast bleibt aber zu klären.',
        'Warten, bis ein neuer Großkunde unterschrieben hat::Vertröstet, ohne das eigentliche Problem zu lösen.',
        'Dispo auf 20.000 € erhöhen::Teuerste aller Varianten.',
      ],
    },
  ),

  // ---------- Modul 6: Karten und Konten ----------
  fall(3, 'bank.dispo', 2, { name: 'Jonas', emoji: '🧑‍🎓', rolle: 'Student, 23' },
    'Mein Konto ist ständig im Minus, ich verstehe die Abbuchungen nicht.',
    [
      { frage: 'Kontoauszüge durchgehen', befund: 'Sechs Abos: zwei Streamingdienste, Fitness, Cloud, Musik, Spiele – zusammen 68 € im Monat.', wichtig: true },
      { frage: 'Dispozinsen nachrechnen', befund: 'Dauerhaft rund 600 € im Minus, 11,9 % – etwa 6 € im Monat.', wichtig: true },
      { frage: 'Kontomodell prüfen', befund: 'Normalkonto mit 4,90 € Gebühr; es gäbe ein kostenloses Studentenkonto.' },
      { frage: 'Einnahmen ansehen', befund: 'BAföG und Nebenjob, zusammen 1.050 € – Eingang schwankt um den Monatswechsel.' },
    ],
    {
      frage: 'Was ist hier das Hauptproblem?',
      liste: [
        'Dauerhafte Dispo-Nutzung plus viele kleine Abos::Beides zusammen frisst jeden Monat rund 74 € – bei 1.050 € Einnahmen ist das viel.',
        '~0.5 Die Kontogebühr::Sie fällt auf, ist aber der kleinste Posten.',
        'Zu niedriges Einkommen::Mit 1.050 € lässt sich haushalten – die Struktur ist das Problem.',
        'Falsche Kartenart::Die Karte hat damit nichts zu tun.',
      ],
    },
    {
      frage: 'Was empfiehlst du? (mehrere)',
      liste: [
        'Auf das kostenlose Studentenkonto wechseln',
        'Abos durchgehen und die ungenutzten kündigen',
        'Dispo schrittweise zurückführen, Ziel: Konto wieder im Plus',
        'Ratenkredit über 1.000 € aufnehmen, um den Dispo abzulösen::Bei 600 € Minus ist das übertrieben – erst die Ursachen abstellen.',
      ],
      mehrfach: true,
    },
  ),
  fall(4, 'bank.giro', 3, { name: 'Frau Kunz', emoji: '👩‍🦰', rolle: 'Angestellte, 52' },
    'Meine Karte wurde im Urlaub abgelehnt, obwohl Geld drauf war.',
    [
      { frage: 'Karte prüfen', befund: 'Debitkarte, gültig, nicht gesperrt.' },
      { frage: 'Auslandsfreigabe ansehen', befund: 'Zahlungen außerhalb Europas sind im Kartenprofil gesperrt.', wichtig: true },
      { frage: 'Verfügungsrahmen prüfen', befund: 'Tageslimit 500 €, der Hotelbetrag lag bei 620 €.', wichtig: true },
      { frage: 'Kontostand ansehen', befund: '3.400 € Guthaben – Deckung war kein Problem.' },
    ],
    {
      frage: 'Woran lag es?',
      liste: [
        'An Geo-Sperre und Tageslimit – nicht am Guthaben::Beides greift unabhängig vom Kontostand.',
        '~0.5 Nur am Tageslimit::Das allein erklärt nicht, warum auch kleine Beträge scheiterten.',
        'Die Karte war abgelaufen::Sie war gültig.',
        'Das Konto war nicht gedeckt::3.400 € lagen drauf.',
      ],
    },
    {
      frage: 'Was tust du jetzt?',
      liste: [
        'Länderfreigabe aktivieren und Limit für die Reisezeit anheben',
        '~0.5 Nur das Limit anheben::Die Geo-Sperre bliebe bestehen.',
        'Neue Karte bestellen::Löst das Problem nicht und dauert Tage.',
        'Kreditkarte verkaufen, weil sie mehr Umsatz bringt::Das wäre Verkauf statt Beratung.',
      ],
    },
  ),

  // ---------- Modul 7: Sicherheit ----------
  fall(5, 'bank.betrug', 2, { name: 'Herr Dorn', emoji: '👴', rolle: 'Rentner, 71' },
    'Die Bank hat angerufen, ich soll meine TAN durchgeben, sonst wird das Konto gesperrt.',
    [
      { frage: 'Nachfragen, wer angerufen hat', befund: 'Angeblich „Sicherheitsabteilung“, Rückrufnummer im Display war die echte Filialnummer.', wichtig: true },
      { frage: 'Prüfen, ob eine TAN erzeugt wurde', befund: 'Ja – vor zehn Minuten eine TAN für eine Überweisung über 2.400 €.', wichtig: true },
      { frage: 'Kontobewegungen ansehen', befund: 'Noch keine Buchung – der Auftrag liegt aber vor.', wichtig: true },
      { frage: 'Fragen, ob er die TAN genannt hat', befund: 'Nein, er hat aufgelegt und ist sofort in die Filiale gekommen.' },
    ],
    {
      frage: 'Was liegt hier vor?',
      liste: [
        'Ein Betrugsversuch mit gefälschter Rufnummer::Nummern lassen sich fälschen. Keine Bank fragt nach TAN oder PIN.',
        '~0.5 Ein Betrugsversuch, aber ungefährlich, weil nichts gebucht wurde::Gefährlich war es sehr wohl – der Auftrag liegt vor.',
        'Eine echte Sicherheitsprüfung der Bank::Banken fragen niemals nach TANs.',
        'Ein technischer Fehler im Onlinebanking::Der TAN-Auftrag kam von außen.',
      ],
    },
    {
      frage: 'Was tust du sofort? (mehrere)',
      liste: [
        'Den offenen Überweisungsauftrag stoppen',
        'Onlinebanking-Zugang sperren und neu freischalten',
        'Mit ihm Anzeige bei der Polizei besprechen',
        'Ihm raten, beim nächsten Anruf die TAN nur langsam vorzulesen::Eine TAN wird nie am Telefon genannt – auch nicht langsam.',
      ],
      mehrfach: true,
    },
  ),
  fall(6, 'bank.reaktion', 3, { name: 'Frau Ritter', emoji: '👩‍💻', rolle: 'Bürokauffrau, 38' },
    'Ich habe auf einen Link geklickt und meine Zugangsdaten eingegeben. Jetzt ist mir schlecht.',
    [
      { frage: 'Fragen, wann das war', befund: 'Vor etwa 20 Minuten.', wichtig: true },
      { frage: 'Prüfen, ob Überweisungen laufen', befund: 'Eine Echtzeitüberweisung über 1.850 € ist ausgeführt.', wichtig: true },
      { frage: 'Gerät ansehen', befund: 'Handy, Banking-App installiert, keine fremde App erkennbar.' },
      { frage: 'Fragen, ob eine TAN freigegeben wurde', befund: 'Ja – sie dachte, es sei die Anmeldebestätigung.', wichtig: true },
    ],
    {
      frage: 'Was ist die richtige Reihenfolge?',
      liste: [
        'Zugang sperren, Überweisung reklamieren, Anzeige erstatten::Erst die Blutung stoppen, dann dokumentieren.',
        '~0.5 Überweisung reklamieren, dann Zugang sperren::Richtig gedacht – solange der Zugang offen ist, kann aber weiter abgeräumt werden.',
        'Erst Anzeige, dann alles Weitere::Die Anzeige hilft später, stoppt aber nichts.',
        'Abwarten, ob das Geld zurückkommt::Bei Echtzeitüberweisungen zählt jede Minute.',
      ],
    },
    {
      frage: 'Was sagst du ihr zur Erstattung?',
      liste: [
        'Die Bank prüft den Fall; bei grober Fahrlässigkeit kann die Erstattung entfallen – Zusagen gibt es jetzt keine',
        '~0.5 Das Geld kommt in der Regel zurück::Eine Zusage, die niemand halten kann.',
        'Die Bank haftet immer::Stimmt so nicht.',
        'Die Kundin hat keinerlei Chance::Auch das ist unzutreffend – jeder Fall wird geprüft.',
      ],
    },
  ),

  // ---------- Modul 8: Beratung ----------
  fall(7, 'bank.bedarf', 2, { name: 'Frau Peters', emoji: '👩‍🏫', rolle: 'Lehrerin, 29' },
    'Ich habe 12.000 Euro auf dem Girokonto liegen. Was soll ich damit machen?',
    [
      { frage: 'Nach dem Zeithorizont fragen', befund: 'In zwei Jahren ist ein Umzug geplant, das Geld wird dann gebraucht.', wichtig: true },
      { frage: 'Nach vorhandener Rücklage fragen', befund: 'Keine weitere Reserve vorhanden.', wichtig: true },
      { frage: 'Risikobereitschaft besprechen', befund: 'Möchte „auf keinen Fall Verluste sehen“.', wichtig: true },
      { frage: 'Nach Schulden fragen', befund: 'Keine.' },
      { frage: 'Nach Erfahrung mit Wertpapieren fragen', befund: 'Keine.' },
    ],
    {
      frage: 'Was passt zu diesem Bedarf?',
      liste: [
        'Notgroschen auf dem Tagesgeld, Rest als Festgeld bis zum Umzug::Kurzer Horizont plus keine Verlusttoleranz – das schließt Kursrisiko aus.',
        '~0.5 Alles aufs Tagesgeld::Sicher und flexibel, lässt aber Zinsen liegen.',
        'Breiter Aktienfonds, weil er langfristig mehr bringt::Bei zwei Jahren Horizont ist das kein Anlagevorschlag, sondern ein Risiko.',
        'Einzelaktien mit guter Dividende::Widerspricht allem, was sie gesagt hat.',
      ],
    },
    {
      frage: 'Was gehört ins Protokoll?',
      liste: [
        'Zeithorizont, Risikobereitschaft und dass sie keine Erfahrung mit Wertpapieren hat',
        '~0.5 Nur die empfohlene Anlage::Zu wenig – nachvollziehbar wird erst die Begründung.',
        'Die Höhe der Provision::Gehört ins Preisverzeichnis, nicht ins Bedarfsprotokoll.',
        'Nichts – das Gespräch war informell::Beratung wird dokumentiert.',
      ],
    },
  ),
  fall(8, 'bank.gespraech', 4, { name: 'Herr Falk', emoji: '👨‍🔬', rolle: 'Laborleiter, 47' },
    'Mein Nachbar hat mit Krypto viel verdient. Ich will 40.000 Euro anlegen, möglichst renditestark.',
    [
      { frage: 'Nach dem Anlageziel fragen', befund: 'Altersvorsorge, Horizont 18 Jahre.', wichtig: true },
      { frage: 'Reaktion auf Verluste besprechen', befund: 'Hat 2022 einen Fonds nach −15 % verkauft.', wichtig: true },
      { frage: 'Bestehende Anlagen ansehen', befund: 'Betriebsrente, 20.000 € Tagesgeld, keine Wertpapiere.' },
      { frage: 'Nach Liquiditätsbedarf fragen', befund: 'Kein kurzfristiger Bedarf, Rücklage ist vorhanden.' },
    ],
    {
      frage: 'Wie gehst du mit dem Krypto-Wunsch um?',
      liste: [
        'Ernst nehmen, aber einordnen: langer Horizont spricht für breite Streuung, nicht für einen Trend::Das Verkaufsverhalten 2022 zeigt, dass Schwankungen ihm schwerfallen.',
        '~0.5 Vom Thema abraten und zum Tagesgeld raten::Zu vorsichtig für 18 Jahre Horizont.',
        'Den Wunsch erfüllen – der Kunde entscheidet::Beratung heißt einordnen, nicht abnicken.',
        'Das Gespräch beenden, weil Krypto nicht im Angebot ist::Lässt den Kunden ohne Orientierung zurück.',
      ],
    },
    {
      frage: 'Was schlägst du konkret vor?',
      liste: [
        'Breit gestreuter Fondssparplan als Kern, kleiner Betrag für Spekulation getrennt davon',
        '~0.5 Alles in einen breiten Fonds, Krypto ganz weglassen::Sauber, geht aber am Kundenwunsch vorbei.',
        'Die Hälfte in Kryptowerte::Widerspricht seiner Verlustreaktion völlig.',
        'Einzelaktien nach Tipps aus dem Bekanntenkreis::Weder gestreut noch begründet.',
      ],
    },
  ),

  // ---------- Modul 1: Grundlagen ----------
  fall(9, 'bank.konto', 1, { name: 'Frau Adler', emoji: '👩‍🦱', rolle: 'Kundin, 44' },
    'Meine Überweisung ist nicht angekommen – seit drei Tagen nichts.',
    [
      { frage: 'Auftrag im System suchen', befund: 'Überweisung über 340 € ist ausgeführt, Valuta vor drei Tagen.', wichtig: true },
      { frage: 'IBAN mit der Rechnung vergleichen', befund: 'Die letzten beiden Ziffern sind vertauscht – die IBAN gehört zu einem anderen Konto.', wichtig: true },
      { frage: 'Empfängernamen prüfen', befund: 'Name stimmt mit der Rechnung überein, passt aber nicht zur eingegebenen IBAN.' },
      { frage: 'Nach dem Zahlungsweg fragen', befund: 'Per Onlinebanking, IBAN von Hand abgetippt.' },
    ],
    {
      frage: 'Was ist passiert?',
      liste: [
        'Das Geld ging an ein falsches Konto – gebucht wird nach IBAN, nicht nach Name::Deshalb warnen Banken heute, wenn Name und IBAN nicht zusammenpassen.',
        '~0.5 Die Überweisung hängt noch in der Verarbeitung::Sie ist ausgeführt – das zeigt die Valuta.',
        'Der Empfänger hat das Konto gewechselt::Dafür gibt es keinen Hinweis.',
        'Die Bank hat einen Fehler gemacht::Der Auftrag wurde so ausgeführt, wie er erteilt wurde.',
      ],
    },
    {
      frage: 'Was tust du für die Kundin?',
      liste: [
        'Rücküberweisung anstoßen und der Kundin erklären, dass der Empfänger zustimmen muss',
        '~0.5 Die Überweisung stornieren::Nach Ausführung gibt es keine Stornierung mehr.',
        'Den Betrag sofort gutschreiben::Das Geld gehört jetzt jemand anderem.',
        'Sie an den Empfänger verweisen, den sie nicht kennt::Die Bank vermittelt – dafür gibt es ein Verfahren.',
      ],
    },
  ),
  fall(10, 'bank.begriffe', 2, { name: 'Herr Simon', emoji: '🧓', rolle: 'Kunde, 68' },
    'Auf meinem Auszug steht etwas von Wertstellung. Habe ich jetzt Zinsen verloren?',
    [
      { frage: 'Auszug ansehen', befund: 'Bareinzahlung am Freitagabend, Buchung Freitag, Wertstellung Montag.', wichtig: true },
      { frage: 'Kontomodell prüfen', befund: 'Girokonto ohne Guthabenverzinsung.', wichtig: true },
      { frage: 'Nach dem Anlass fragen', befund: 'Er hat von einem Zeitungsartikel über Wertstellungen gelesen.' },
    ],
    {
      frage: 'Was sagst du ihm?',
      liste: [
        'Hier entsteht kein Nachteil: Das Konto wird nicht verzinst, die Valuta ändert daran nichts::Wertstellung wirkt nur dort, wo Zinsen anfallen – im Guthaben oder im Soll.',
        '~0.5 Bareinzahlungen müssen taggleich wertgestellt werden::Stimmt grundsätzlich – hier hätte es ohnehin keine Zinswirkung.',
        'Er hat drei Tage Zinsen verloren::Ohne Guthabenzins gibt es nichts zu verlieren.',
        'Wertstellung ist nur ein technischer Vermerk ohne Bedeutung::Im Soll oder bei verzinsten Konten hat sie sehr wohl Bedeutung.',
      ],
    },
  ),
]
