// 🏦 Schalter, Kredit, Kopfrechnen. Alle Personen und Fälle sind erfunden; die Rechenwege
// sind es nicht – Annuität, Zinseszins und Haushaltsrechnung funktionieren genau so.
import type { KassenItem, KreditItem, RechenItem, Stufe } from '../../typen'

// ---------- Am Schalter ----------

function auszahlung(
  nr: number,
  ziel: string,
  stufe: Stufe,
  kunde: { name: string; emoji: string },
  text: string,
  betrag: number,
  extra: { ohne?: number[]; erklaerung?: string } = {},
): KassenItem {
  return {
    id: `bank.ka.${String(nr).padStart(2, '0')}`,
    spiel: 'bank.schalter',
    art: 'kasse',
    ziel,
    stufe,
    typ: 'auszahlung',
    kunde,
    text,
    betrag,
    summe: true,
    loesung: betrag,
    ...(extra.ohne ? { ohne: extra.ohne } : {}),
    ...(extra.erklaerung ? { erklaerung: extra.erklaerung } : {}),
  }
}

function einzahlung(nr: number, ziel: string, stufe: Stufe, kunde: { name: string; emoji: string }, text: string, buendel: number[], erklaerung?: string): KassenItem {
  return {
    id: `bank.ka.${String(nr).padStart(2, '0')}`,
    spiel: 'bank.schalter',
    art: 'kasse',
    ziel,
    stufe,
    typ: 'einzahlung',
    kunde,
    text,
    buendel,
    summe: false,
    loesung: Math.round(buendel.reduce((s, n) => s + n, 0) * 100) / 100,
    ...(erklaerung ? { erklaerung } : {}),
  }
}

function verfuegbar(nr: number, ziel: string, stufe: Stufe, kunde: { name: string; emoji: string }, text: string, kontostand: number, dispo: number, erklaerung: string): KassenItem {
  return {
    id: `bank.ka.${String(nr).padStart(2, '0')}`,
    spiel: 'bank.schalter',
    art: 'kasse',
    ziel,
    stufe,
    typ: 'verfuegbar',
    kunde,
    text,
    kontostand,
    dispo,
    summe: false,
    loesung: Math.round((kontostand + dispo) * 100) / 100,
    erklaerung,
  }
}

const FRAU_KELLER = { name: 'Frau Keller', emoji: '👩' }
const HERR_OZAN = { name: 'Herr Ozan', emoji: '🧔' }
const LINA = { name: 'Lina', emoji: '👧' }
const HERR_BRAND = { name: 'Herr Brand', emoji: '👨‍🦳' }

export const SCHALTER: KassenItem[] = [
  auszahlung(1, 'bank.auszahlung', 1, FRAU_KELLER, 'Ich hätte gern 250 Euro.', 250),
  auszahlung(2, 'bank.auszahlung', 1, HERR_OZAN, 'Bitte 180 Euro – aber keine Fünfziger, die nimmt mein Automat nicht.', 180, { ohne: [50], erklaerung: 'Kundenwünsche zur Stückelung gehören zur Auszahlung: 180 € gehen auch als 100 + 2 × 20 + 2 × 20.' }),
  auszahlung(3, 'bank.auszahlung', 2, LINA, 'Ich brauche 75 Euro für die Klassenkasse.', 75, { erklaerung: 'Krumme Beträge gehen nur mit kleinen Scheinen auf: 50 + 20 + 5.' }),
  auszahlung(4, 'bank.auszahlung', 3, HERR_BRAND, 'Machen Sie mir bitte 1.240 Euro, gern große Scheine.', 1240, { erklaerung: 'Große Beträge zählt man von oben nach unten: 2 × 500, 2 × 100, 2 × 20.' }),
  auszahlung(5, 'bank.auszahlung', 3, FRAU_KELLER, 'Ich hätte gern 90 Euro, aber bitte keine Zwanziger.', 90, { ohne: [20], erklaerung: 'Ohne Zwanziger bleibt 50 + 10 + 10 + 10 + 10 oder 50 + 5 × 5 + …' }),
  einzahlung(6, 'bank.einzahlung', 1, HERR_OZAN, 'Das möchte ich einzahlen – wie viel ist das?', [100, 50, 20, 20, 10], 'Nachzählen ist Pflicht: 100 + 50 + 20 + 20 + 10 = 200 €.'),
  einzahlung(7, 'bank.einzahlung', 2, LINA, 'Hier ist das Geld aus der Klassenkasse.', [50, 20, 20, 10, 5, 2, 1, 0.5], 'Auch die Münzen zählen mit: 108,50 €.'),
  einzahlung(8, 'bank.einzahlung', 3, HERR_BRAND, 'Die Tageskasse meines Ladens, bitte prüfen Sie nach.', [200, 100, 100, 50, 20, 10, 10, 5, 2, 2, 1], 'Zweimal zählen, einmal buchen: 500 €.'),
  verfuegbar(9, 'bank.verfuegbar', 2, FRAU_KELLER, 'Wie viel kann ich denn heute höchstens abheben?', 340.5, 500, 'Verfügbar ist Guthaben plus eingeräumter Dispo: 340,50 € + 500 € = 840,50 €. Der Dispo kostet allerdings Zinsen.'),
  verfuegbar(10, 'bank.verfuegbar', 3, HERR_OZAN, 'Mein Konto ist im Minus – geht da überhaupt noch was?', -220, 1000, 'Auch im Minus bleibt der Rest des Dispos verfügbar: −220 € + 1.000 € = 780 €.'),
]

// ---------- Kreditfälle ----------

function kredit(
  nr: number,
  ziel: string,
  stufe: Stufe,
  kunde: { name: string; emoji: string; beruf: string },
  netto: number,
  ausgaben: [string, number][],
  raten: number,
  betrag: number,
  monate: number,
  zins: number,
  rate: number,
  urteil: 0 | 1 | 2,
  rateOptionen: number[],
  erklaerung: string,
  risiko?: string,
): KreditItem {
  const ueberschuss = Math.round((netto - ausgaben.reduce((s, [, n]) => s + n, 0) - raten - rate) * 100) / 100
  return {
    id: `bank.kr.${String(nr).padStart(2, '0')}`,
    spiel: 'bank.kredit',
    art: 'kredit',
    ziel,
    stufe,
    kunde,
    netto,
    ausgaben,
    raten,
    betrag,
    monate,
    zins,
    rate,
    ueberschuss,
    urteil,
    rateOptionen,
    erklaerung,
    ...(risiko ? { risiko } : {}),
  }
}

export const KREDITE: KreditItem[] = [
  kredit(1, 'bank.haushalt', 2, { name: 'Familie Voss', emoji: '👨‍👩‍👧', beruf: 'Pflegekraft und Techniker' }, 3950,
    [['Miete warm', 1280], ['Lebenshaltung', 1100], ['Versicherungen', 210], ['Auto', 260]], 0,
    9000, 48, 6.9, 215.1, 2, [149.5, 187.5, 215.1, 264.0],
    'Rate rund 215 €, danach bleiben gut 880 € im Monat. Das trägt der Haushalt bequem.',
  ),
  kredit(2, 'bank.tragfaehig', 3, { name: 'Herr Petrow', emoji: '🧑‍🔧', beruf: 'Kfz-Mechaniker' }, 2280,
    [['Miete warm', 820], ['Lebenshaltung', 700], ['Versicherungen', 140], ['Mobilität', 180]], 190,
    4500, 24, 8.9, 205.37, 1, [162.4, 187.5, 205.37, 241.9],
    'Nach der neuen Rate bleiben rund 45 € übrig – rechnerisch tragbar, aber ohne jede Reserve.',
    'Eine kaputte Waschmaschine kippt diesen Haushalt. Längere Laufzeit oder kleinerer Betrag wäre ehrlicher.',
  ),
  kredit(3, 'bank.tragfaehig', 3, { name: 'Frau Aydin', emoji: '👩‍⚕️', beruf: 'Ärztin in Teilzeit' }, 3100,
    [['Miete warm', 1150], ['Lebenshaltung', 900], ['Kita', 280], ['Versicherungen', 160]], 320,
    15000, 60, 5.4, 285.83, 0, [219.4, 250.0, 285.83, 312.5],
    'Vor dem Kredit bleiben 290 €, die neue Rate liegt bei 286 € – es bliebe fast nichts.',
    'Wer bei null landet, finanziert die nächste Reparatur über den Dispo. Das ist der Anfang der Schuldenspirale.',
  ),
  kredit(4, 'bank.rate', 4, { name: 'Herr Lang', emoji: '👨‍🍳', beruf: 'Koch, unbefristet' }, 2650,
    [['Miete warm', 700], ['Lebenshaltung', 650], ['Versicherungen', 120], ['Mobilität', 90]], 0,
    6000, 36, 7.5, 186.64, 2, [166.7, 186.64, 205.0, 231.2],
    'Rate knapp 187 €, danach bleiben rund 900 €. Sehr solide.',
  ),
  kredit(5, 'bank.tragfaehig', 4, { name: 'Familie Brenner', emoji: '👩‍👦', beruf: 'Verkäuferin, ein Kind' }, 2400,
    [['Miete warm', 890], ['Lebenshaltung', 780], ['Versicherungen', 130], ['Mobilität', 150]], 120,
    12000, 60, 6.2, 233.11, 0, [200.0, 218.4, 233.11, 262.9],
    'Es bleiben vor dem Kredit 330 €. Mit 233 € Rate wären es 97 € – zu wenig für einen Haushalt mit Kind.',
    'Kinder machen Haushalte schwankungsanfällig: Klassenfahrt, neue Schuhe, kranke Woche.',
  ),
  kredit(6, 'bank.tragfaehig', 5, { name: 'Herr Nowak', emoji: '🧑‍💻', beruf: 'IT-Freiberufler' }, 5200,
    [['Miete warm', 1400], ['Lebenshaltung', 1200], ['Versicherungen', 620], ['Rücklage Steuer', 900]], 0,
    25000, 84, 4.5, 347.5, 1, [297.6, 322.0, 347.5, 391.3],
    'Auf dem Papier bleiben nach der Rate rund 730 €. Bei schwankendem Einkommen zählt aber der schlechte Monat.',
    'Bei Selbstständigen rechnet man mit dem Durchschnitt der letzten drei Jahre – und prüft die Steuerrücklage.',
  ),
]

// ---------- Kopfrechnen ----------

function rechne(
  nr: number,
  ziel: string,
  stufe: Stufe,
  aufgabe: string,
  daten: [string, string][],
  loesung: number,
  rechenweg: string[],
  extra: { einheit?: string; toleranz?: number; nachkomma?: number; erklaerung?: string } = {},
): RechenItem {
  return {
    id: `bank.re.${String(nr).padStart(2, '0')}`,
    spiel: 'bank.rechner',
    art: 'rechnen',
    ziel,
    stufe,
    aufgabe,
    daten,
    loesung,
    toleranz: extra.toleranz ?? 0.01,
    rechenweg,
    einheit: extra.einheit ?? '€',
    ...(extra.nachkomma !== undefined ? { nachkomma: extra.nachkomma } : {}),
    ...(extra.erklaerung ? { erklaerung: extra.erklaerung } : {}),
  }
}

export const RECHNEN: RechenItem[] = [
  // Modul 3 – Zinsen
  rechne(1, 'bank.zins', 1, 'Wie viel Zinsen bringt das Guthaben in einem Jahr?', [['Guthaben', '2.500 €'], ['Zinssatz', '3,2 % p. a.']], 80, [
    '2.500 € × 3,2 % = 2.500 × 0,032',
    '= 80 € Zinsen im Jahr',
  ], { erklaerung: '„p. a.“ heißt „pro Jahr“ – der Satz gilt für zwölf Monate.' }),
  rechne(2, 'bank.zins', 2, 'Wie viel Zinsen fallen für drei Monate an?', [['Guthaben', '6.000 €'], ['Zinssatz', '2,0 % p. a.'], ['Zeitraum', '3 Monate']], 30, [
    'Jahreszins: 6.000 € × 2,0 % = 120 €',
    'Drei Monate sind ein Viertel: 120 € ÷ 4',
    '= 30 €',
  ], { erklaerung: 'Für Teilzeiträume wird der Jahreszins anteilig gerechnet.' }),
  rechne(3, 'bank.zinseszins', 3, 'Wie viel liegt nach drei Jahren auf dem Konto?', [['Einlage', '8.000 €'], ['Zinssatz', '2,5 % p. a.'], ['Laufzeit', '3 Jahre'], ['Zinsen bleiben liegen', 'ja']], 8615.12, [
    'Jahr 1: 8.000 × 1,025 = 8.200,00 €',
    'Jahr 2: 8.200 × 1,025 = 8.405,00 €',
    'Jahr 3: 8.405 × 1,025 = 8.615,13 €',
    'Kurz: 8.000 × 1,025³',
  ], { toleranz: 0.6, erklaerung: 'Zinseszins heißt: Die Zinsen verzinsen sich mit. Deshalb steht die Laufzeit im Exponenten.' }),
  rechne(4, 'bank.zinseszins', 4, 'Wie viel Zinsertrag bringt die Anlage insgesamt?', [['Einlage', '5.000 €'], ['Zinssatz', '1,8 % p. a.'], ['Laufzeit', '5 Jahre']], 466.49, [
    'Endwert: 5.000 × 1,018⁵ = 5.466,49 €',
    'Ertrag: 5.466,49 € − 5.000 € ',
    '= 466,49 €',
  ], { toleranz: 0.5, erklaerung: 'Gefragt ist der Ertrag, nicht der Endwert – die Einlage gehört abgezogen.' }),

  // Modul 4 – Sparen und Inflation
  rechne(5, 'bank.inflation', 3, 'Was sind 10.000 € in vier Jahren noch wert?', [['Betrag heute', '10.000 €'], ['Inflation', '3,0 % pro Jahr']], 8884.87, [
    'Kaufkraft = 10.000 ÷ 1,03⁴',
    '1,03⁴ = 1,1255',
    '= 8.884,87 €',
  ], { toleranz: 1, erklaerung: 'Inflation frisst Kaufkraft: Derselbe Betrag kauft später weniger. Deshalb ist ein Sparzins unter der Inflationsrate ein realer Verlust.' }),
  rechne(6, 'bank.sparen', 3, 'Wie viel ist nach zehn Jahren Sparplan zusammengekommen?', [['Monatlich', '300 €'], ['Rendite', '4,0 % p. a.'], ['Laufzeit', '10 Jahre']], 44174.94, [
    'Eingezahlt: 300 € × 120 Monate = 36.000 €',
    'Verzinst: 300 × ((1,00333¹²⁰ − 1) ÷ 0,00333)',
    '= 44.174,94 €',
  ], { toleranz: 30, erklaerung: 'Rund 8.000 € kommen allein durch die Rendite dazu – deshalb lohnt früh anfangen.' }),
  rechne(7, 'bank.risiko', 2, 'Wie viel Verlust bedeutet das für die Anlage?', [['Anlage', '12.000 €'], ['Kursverlust', '18 %']], 2160, [
    '12.000 € × 18 % = 12.000 × 0,18',
    '= 2.160 € Verlust',
  ], { erklaerung: 'Prozent vom Kurswert – bei Aktien ist das keine Ausnahme, sondern der Normalfall in schlechten Jahren.' }),
  rechne(8, 'bank.risiko', 4, 'Um wie viel Prozent muss der Kurs steigen, um den Verlust auszugleichen?', [['Verlust', '20 %'], ['Aus 100 € wurden', '80 €']], 25, [
    'Von 80 € zurück auf 100 €: 20 € Gewinn nötig',
    '20 ÷ 80 = 0,25',
    '= 25 %',
  ], { einheit: '%', nachkomma: 0, toleranz: 0.5, erklaerung: 'Verluste wiegen schwerer als gleich große Gewinne – nach −50 % braucht es +100 %.' }),

  // Modul 5 – Kredit und Haushalt
  rechne(9, 'bank.haushalt', 2, 'Wie viel bleibt dem Haushalt im Monat übrig?', [['Netto', '2.850 €'], ['Miete warm', '980 €'], ['Lebenshaltung', '820 €'], ['Versicherungen', '150 €'], ['Mobilität', '220 €']], 680, [
    'Ausgaben: 980 + 820 + 150 + 220 = 2.170 €',
    '2.850 € − 2.170 €',
    '= 680 €',
  ], { erklaerung: 'Diese Zahl ist der Kern jeder Kreditprüfung: Was bleibt, bevor überhaupt eine Rate dazukommt?' }),
  rechne(10, 'bank.rate', 3, 'Wie hoch ist die Monatsrate ohne Zinsen?', [['Kreditbetrag', '7.200 €'], ['Laufzeit', '36 Monate'], ['Zins', '0 % (Aktion)']], 200, [
    '7.200 € ÷ 36 Monate',
    '= 200 €',
  ], { erklaerung: 'Bei einem echten Nullprozentkredit ist die Rate schlicht der Betrag geteilt durch die Monate – Vorsicht bei Gebühren, die trotzdem anfallen.' }),
  rechne(11, 'bank.rate', 4, 'Wie viel zahlt der Kunde insgesamt zurück?', [['Rate', '215,10 €'], ['Laufzeit', '48 Monate'], ['Kreditbetrag', '9.000 €']], 10324.8, [
    '215,10 € × 48 = 10.324,80 €',
    'Davon Zinsen: 10.324,80 − 9.000 = 1.324,80 €',
  ], { toleranz: 0.5, erklaerung: 'Rate mal Laufzeit zeigt, was der Kredit wirklich kostet. Die Differenz zum Betrag sind die Zinsen.' }),
  rechne(12, 'bank.dispo', 3, 'Wie viel Dispozinsen fallen an?', [['Überziehung', '1.200 €'], ['Dispozins', '11,9 % p. a.'], ['Dauer', '25 Tage']], 9.78, [
    'Jahreszins: 1.200 € × 11,9 % = 142,80 €',
    'Für 25 Tage: 142,80 × 25 ÷ 365',
    '= 9,78 €',
  ], { toleranz: 0.1, erklaerung: 'Dispozinsen werden taggenau berechnet. Klingt wenig – dauerhaft genutzt sind es über 140 € im Jahr.' }),

  // Modul 6 – Karten und Konten
  rechne(13, 'bank.gebuehren', 2, 'Was kostet das Konto im Jahr?', [['Kontoführung', '4,90 € im Monat'], ['Ersatzkarte', '15,00 € einmalig'], ['Auslandsabhebungen', '4 × 5,50 €']], 95.8, [
    'Kontoführung: 4,90 € × 12 = 58,80 €',
    'Abhebungen: 4 × 5,50 € = 22,00 €',
    'Plus Ersatzkarte 15,00 €',
    '= 95,80 €',
  ], { erklaerung: 'Gebühren fallen einzeln kaum auf – in der Jahressumme schon.' }),
  rechne(14, 'bank.giro', 3, 'Wie viel kostet die Kreditkarte im ersten Jahr wirklich?', [['Jahresgebühr', '39,00 €'], ['Fremdwährungsentgelt', '1,75 % auf 1.200 € Umsatz'], ['Bargeldabhebung', '2 × 3,90 €']], 67.8, [
    'Fremdwährung: 1.200 € × 1,75 % = 21,00 €',
    'Bargeld: 2 × 3,90 € = 7,80 €',
    'Plus Jahresgebühr 39,00 €',
    '= 67,80 €',
  ], { erklaerung: 'Nicht die Jahresgebühr entscheidet, sondern wie man die Karte nutzt.' }),
]
