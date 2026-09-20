// 🇫🇷 Wortschatz: Wendungen mit ihrer Bedeutung – und das leidige Geschlecht der Wörter.
// „le“ oder „la“ lernt man am besten am Wort selbst, deshalb steht bei jeder Karte, woran
// man es erkennt.
import type { KarteItem, PaarItem, Stufe } from '../../typen'

function paar(nr: number, ziel: string, stufe: Stufe, links: string, rechts: string, beispiel?: string): PaarItem {
  return {
    id: `fr.pa.${String(nr).padStart(2, '0')}`,
    spiel: 'fr.paare',
    art: 'paar',
    ziel,
    stufe,
    links,
    rechts,
    sprache: 'fr-FR',
    ...(beispiel ? { erklaerung: beispiel } : {}),
  }
}

export const PAARE: PaarItem[] = [
  // Modul 1
  paar(1, 'fr.greet', 1, 'Ça va ?', 'Wie geht’s?', 'Die häufigste Begrüßung unter Bekannten.'),
  paar(2, 'fr.greet', 1, 'À bientôt !', 'Bis bald!', ''),
  paar(3, 'fr.intro', 1, 'Je m’appelle …', 'Ich heiße …', ''),
  paar(4, 'fr.hoeflich', 1, 'S’il vous plaît', 'Bitte (höflich)', 'Unter Freunden: „s’il te plaît“.'),
  paar(5, 'fr.hoeflich', 2, 'Je vous en prie.', 'Gern geschehen.', 'Die höfliche Antwort auf „merci“.'),

  // Modul 2
  paar(6, 'fr.liaison', 3, 'les amis', 'die Freunde (mit Bindung: „lesami“)', 'Das stumme s wird vor einem Vokal zu z.'),
  paar(7, 'fr.stumm', 2, 'le temps', 'die Zeit / das Wetter', 'Von „-mps“ hört man nichts.'),
  paar(8, 'fr.nasal', 2, 'le vin', 'der Wein', 'Nasal gesprochen: „wä“.'),
  paar(9, 'fr.nasal', 3, 'le pain', 'das Brot', 'Klingt genau wie „vin“ – nur mit p.'),
  paar(10, 'fr.stumm', 3, 'beaucoup', 'viel', 'Das p am Ende bleibt stumm.'),

  // Modul 3
  paar(11, 'fr.uhrzeit', 2, 'et quart', 'Viertel nach', ''),
  paar(12, 'fr.uhrzeit', 2, 'moins le quart', 'Viertel vor', ''),
  paar(13, 'fr.zahlen', 2, 'quatre-vingts', 'achtzig', 'Wörtlich: vier mal zwanzig.'),
  paar(14, 'fr.zahlen', 3, 'quatre-vingt-dix', 'neunzig', 'Vier mal zwanzig plus zehn.'),
  paar(15, 'fr.uhrzeit', 1, 'aujourd’hui', 'heute', ''),

  // Modul 4
  paar(16, 'fr.cafe', 1, 'Je voudrais …', 'Ich hätte gern …', 'Die höflichste Bestellformel.'),
  paar(17, 'fr.cafe', 2, 'sur place', 'zum Hieressen', ''),
  paar(18, 'fr.cafe', 2, 'à emporter', 'zum Mitnehmen', ''),
  paar(19, 'fr.zahlenbitte', 2, 'l’addition', 'die Rechnung', 'Nur im Lokal – sonst „la facture“.'),
  paar(20, 'fr.zahlenbitte', 3, 'en espèces', 'in bar', ''),

  // Modul 5
  paar(21, 'fr.laden', 1, 'la boulangerie', 'die Bäckerei', ''),
  paar(22, 'fr.laden', 2, 'Je regarde.', 'Ich schaue nur.', 'Antwort auf „je peux vous aider ?“'),
  paar(23, 'fr.mengen', 2, 'un kilo de …', 'ein Kilo …', 'Nach Mengen steht immer „de“.'),
  paar(24, 'fr.mengen', 2, 'C’est combien ?', 'Was kostet das?', ''),
  paar(25, 'fr.laden', 3, 'Ce sera tout.', 'Das ist alles.', ''),

  // Modul 6
  paar(26, 'fr.bahn', 2, 'un aller-retour', 'eine Hin- und Rückfahrkarte', 'Nur hin: „un aller simple“.'),
  paar(27, 'fr.bahn', 2, 'la voie', 'das Gleis', ''),
  paar(28, 'fr.weg', 1, 'tout droit', 'geradeaus', 'Nicht verwechseln mit „à droite“ (rechts).'),
  paar(29, 'fr.weg', 2, 'en face de', 'gegenüber von', ''),
  paar(30, 'fr.hotel', 2, 'une chambre double', 'ein Doppelzimmer', ''),

  // Modul 7
  paar(31, 'fr.tag', 2, 'se lever', 'aufstehen', 'Reflexiv: „je me lève“.'),
  paar(32, 'fr.wetter', 1, 'Il fait beau.', 'Das Wetter ist schön.', ''),
  paar(33, 'fr.wetter', 2, 'Il pleut.', 'Es regnet.', ''),
  paar(34, 'fr.freizeit', 2, 'Ça te dit ?', 'Hast du Lust?', ''),
  paar(35, 'fr.freizeit', 3, 'faire la grasse matinée', 'ausschlafen', 'Wörtlich: den fetten Morgen machen.'),

  // Modul 8
  paar(36, 'fr.beschreiben', 2, 'sympa', 'nett, sympathisch', 'Kurzform von „sympathique“.'),
  paar(37, 'fr.meinung', 2, 'Je trouve que …', 'Ich finde, dass …', ''),
  paar(38, 'fr.meinung', 3, 'Ça m’est égal.', 'Das ist mir egal.', ''),
  paar(39, 'fr.vorschlag', 2, 'Bonne idée !', 'Gute Idee!', ''),
  paar(40, 'fr.vorschlag', 3, 'Avec plaisir.', 'Sehr gern.', 'Die freundlichste Zusage.'),

  // Modul 9
  paar(41, 'fr.tuvous', 2, 'tutoyer', 'duzen', 'Siezen heißt „vouvoyer“.'),
  paar(42, 'fr.bitten', 2, 'Vous pourriez … ?', 'Könnten Sie … ?', 'Die höflichste Bitte.'),
  paar(43, 'fr.bitten', 2, 'plus lentement', 'langsamer', ''),
  paar(44, 'fr.entschuldigen', 1, 'Je suis désolé.', 'Es tut mir leid.', ''),
  paar(45, 'fr.entschuldigen', 2, 'Ce n’est pas grave.', 'Das macht nichts.', ''),

  // Modul 10
  paar(46, 'fr.fauxamis', 3, 'la formation', 'die Ausbildung', 'Nicht „Formation“ im deutschen Sinn.'),
  paar(47, 'fr.fauxamis', 3, 'sensible', 'empfindlich', 'Vernünftig heißt „raisonnable“.'),
  paar(48, 'fr.fauxamis', 4, 'actuellement', 'derzeit', 'Tatsächlich heißt „en fait“.'),
  paar(49, 'fr.fallen', 3, 'J’ai faim.', 'Ich habe Hunger.', 'Hunger, Durst und Alter „hat“ man.'),
  paar(50, 'fr.fallen', 4, 'Il y a deux ans', 'vor zwei Jahren', ''),
]

// ---------- Le oder la? ----------

function genre(nr: number, ziel: string, stufe: Stufe, wort: string, weiblich: boolean, warum: string, detail?: string): KarteItem {
  return {
    id: `fr.ge.${String(nr).padStart(2, '0')}`,
    spiel: 'fr.genre',
    art: 'karte',
    ziel,
    stufe,
    text: wort,
    ...(detail ? { detail } : {}),
    fach: weiblich ? 1 : 0,
    warum,
  }
}

export const GENRE: KarteItem[] = [
  // Modul 5 – einkaufen
  genre(1, 'fr.laden', 1, 'pain', false, 'le pain – Brot ist männlich.', 'das Brot'),
  genre(2, 'fr.laden', 1, 'baguette', true, 'la baguette – Wörter auf -ette sind weiblich.', 'das Baguette'),
  genre(3, 'fr.laden', 2, 'boulangerie', true, 'la boulangerie – Wörter auf -ie sind weiblich.', 'die Bäckerei'),
  genre(4, 'fr.mengen', 2, 'prix', false, 'le prix – Wörter auf -x sind meist männlich.', 'der Preis'),
  genre(5, 'fr.mengen', 2, 'monnaie', true, 'la monnaie – Endung -aie, weiblich.', 'das Kleingeld'),
  genre(6, 'fr.laden', 2, 'fromage', false, 'le fromage – Wörter auf -age sind fast immer männlich.', 'der Käse'),
  genre(7, 'fr.mengen', 3, 'bouteille', true, 'la bouteille – Endung -eille, weiblich.', 'die Flasche'),
  genre(8, 'fr.laden', 3, 'marché', false, 'le marché – Endung -é, männlich.', 'der Markt'),

  // Modul 7 – Alltag
  genre(9, 'fr.tag', 1, 'matin', false, 'le matin – Tageszeiten auf -in sind männlich.', 'der Morgen'),
  genre(10, 'fr.tag', 1, 'journée', true, 'la journée – Endung -ée, weiblich.', 'der Tag (als Zeitraum)'),
  genre(11, 'fr.wetter', 2, 'pluie', true, 'la pluie – Endung -ie, weiblich.', 'der Regen'),
  genre(12, 'fr.wetter', 2, 'soleil', false, 'le soleil – Endung -eil, männlich.', 'die Sonne'),
  genre(13, 'fr.freizeit', 2, 'musique', true, 'la musique – Endung -que, weiblich.', 'die Musik'),
  genre(14, 'fr.freizeit', 2, 'sport', false, 'le sport – Endung auf Konsonant, männlich.', 'der Sport'),
  genre(15, 'fr.tag', 3, 'semaine', true, 'la semaine – Endung -aine, weiblich.', 'die Woche'),
  genre(16, 'fr.freizeit', 3, 'week-end', false, 'le week-end – aus dem Englischen entlehnt, männlich.', 'das Wochenende'),

  // Modul 8 – Menschen und Dinge beschreiben
  genre(17, 'fr.beschreiben', 2, 'maison', true, 'la maison – Endung -on bei Dingen oft weiblich; hier merken.', 'das Haus'),
  genre(18, 'fr.beschreiben', 2, 'appartement', false, 'l’appartement – Endung -ment, männlich.', 'die Wohnung'),
  genre(19, 'fr.beschreiben', 2, 'voiture', true, 'la voiture – Endung -ure, weiblich.', 'das Auto'),
  genre(20, 'fr.beschreiben', 3, 'travail', false, 'le travail – Endung -ail, männlich.', 'die Arbeit'),
  genre(21, 'fr.meinung', 3, 'idée', true, 'l’idée – Endung -ée, weiblich.', 'die Idee'),
  genre(22, 'fr.meinung', 3, 'problème', false, 'le problème – griechischer Ursprung auf -ème, männlich.', 'das Problem'),
  genre(23, 'fr.vorschlag', 3, 'soirée', true, 'la soirée – Endung -ée, weiblich.', 'der Abend'),
  genre(24, 'fr.vorschlag', 4, 'rendez-vous', false, 'le rendez-vous – zusammengesetzt, männlich.', 'der Termin'),
]
