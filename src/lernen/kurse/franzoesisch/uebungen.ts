// 🇫🇷 Übungen: passende Antworten, Hörverstehen, Satzbau und Duelle.
// Alles Alltagsfranzösisch – das, was in einer Bäckerei in Lyon oder am Schalter in
// Montpellier wirklich gesagt wird.
import type { BauItem, DuellItem, HoerItem, Stufe, WahlItem } from '../../typen'
import { bausteine, optionen } from '../werkzeug'

// ---------- Was sagt man? ----------

function antwort(
  nr: number,
  ziel: string,
  stufe: Stufe,
  sprecher: { name: string; emoji: string; text: string; de: string },
  liste: string[],
  erklaerung: string,
): WahlItem {
  return {
    id: `fr.an.${String(nr).padStart(2, '0')}`,
    spiel: 'fr.antwort',
    art: 'wahl',
    ziel,
    stufe,
    aufgabe: 'Was antwortest du?',
    sprache: 'fr-FR',
    sprecher,
    optionen: optionen(liste),
    erklaerung,
  }
}

const CHLOE = { name: 'Chloé', emoji: '👧' }
const MARC = { name: 'Marc', emoji: '🧑‍🍳' }
const YASMINE = { name: 'Yasmine', emoji: '🧳' }
const PIERRE = { name: 'Pierre', emoji: '🧔' }

export const ANTWORTEN: WahlItem[] = [
  // Modul 1
  antwort(1, 'fr.greet', 1, { ...CHLOE, text: 'Bonjour ! Ça va ?', de: 'Guten Tag! Wie geht’s?' }, [
    'Ça va, merci. Et toi ?',
    '~0.5 Oui.::Verständlich, aber das Gespräch endet sofort. Gib die Frage zurück.',
    'Je suis bien.::So sagt man es nicht – auf „ça va ?“ antwortet man mit „ça va“.',
    'Bonjour aussi.::„Bonjour“ wiederholt man nicht als Antwort auf die Frage.',
  ], '„Ça va ?“ beantwortet man mit „ça va“ – und hängt „Et toi ?“ an.'),
  antwort(2, 'fr.intro', 1, { ...MARC, text: 'Comment vous appelez-vous ?', de: 'Wie heißen Sie?' }, [
    'Je m’appelle Jonas.',
    '~0.5 Jonas.::Richtig, aber der ganze Satz wirkt freundlicher.',
    'Mon nom est Jonas.::Grammatisch möglich, klingt aber nach Ausweisdokument.',
    'Je suis appelé Jonas.::Das sagt niemand.',
  ], 'Der Name kommt immer mit „je m’appelle“ – wörtlich: ich rufe mich.'),
  antwort(3, 'fr.hoeflich', 1, { ...CHLOE, text: 'Merci beaucoup !', de: 'Vielen Dank!' }, [
    'Je vous en prie.',
    '~0.6 De rien.::Passt unter Freunden; „je vous en prie“ ist höflicher.',
    'Bien sûr.::Heißt „natürlich“ – keine Antwort auf Dank.',
    'Merci à toi aussi.::Wirkt, als hättest du nicht zugehört.',
  ], '„Je vous en prie“ ist die höfliche Antwort auf Dank, „de rien“ die lockere.'),
  antwort(4, 'fr.greet', 2, { ...PIERRE, text: 'Bonne journée !', de: 'Einen schönen Tag noch!' }, [
    'Merci, vous aussi !',
    '~0.5 Merci.::Höflich, aber der Gruß bleibt unerwidert.',
    'Bonne nuit !::Das sagt man nur vor dem Schlafengehen.',
    'Oui, c’est vrai.::Passt nicht zu einem Wunsch.',
  ], 'Gute Wünsche gibt man zurück: „vous aussi“ oder „toi aussi“.'),

  // Modul 3
  antwort(5, 'fr.zahlen', 2, { ...MARC, text: 'Ça fait douze euros cinquante.', de: 'Das macht zwölf Euro fünfzig.' }, [
    'Voilà, merci.',
    '~0.5 D’accord.::Verständlich – beim Bezahlen sagt man aber „voilà“.',
    'C’est trop cher.::Nur wenn du wirklich handeln willst; in Frankreich unüblich.',
    'Douze ? Non.::Wirkt schroff.',
  ], 'Wenn man Geld übergibt, sagt man „voilà“ – das kleine Wort für „hier, bitte“.'),
  antwort(6, 'fr.uhrzeit', 2, { ...CHLOE, text: 'Il est quelle heure ?', de: 'Wie spät ist es?' }, [
    'Il est huit heures et demie.',
    '~0.5 Huit heures trente.::Richtig, klingt aber nach Fahrplan.',
    'C’est huit heures.::Die Uhrzeit beginnt mit „il est“.',
    'J’ai huit heures.::„haben“ passt hier nicht.',
  ], 'Uhrzeiten beginnen immer mit „il est“ – und die halbe Stunde ist „et demie“.'),
  antwort(7, 'fr.uhrzeit', 3, { ...PIERRE, text: 'On se voit lundi prochain ?', de: 'Sehen wir uns nächsten Montag?' }, [
    'Oui, lundi, ça me va.',
    '~0.5 Oui, d’accord.::Passt – die Wiederholung des Tages vermeidet Missverständnisse.',
    'Lundi je ne sais pas peut-être.::Zu vage, das Treffen bleibt offen.',
    'Oui, le lundi.::„le lundi“ heißt: jeden Montag.',
  ], '„Ça me va“ heißt: Das passt mir. Der Artikel „le“ vor dem Tag macht daraus eine Gewohnheit.'),
  antwort(8, 'fr.zahlen', 3, { ...YASMINE, text: 'Votre numéro, c’est le zéro six… ?', de: 'Ihre Nummer, das ist die null sechs …?' }, [
    'Zéro six, douze, trente-quatre, cinquante-six, soixante-dix-huit.',
    '~0.5 Zéro six un deux trois quatre…::Möglich, aber in Frankreich nennt man Nummern paarweise.',
    'Six zéro douze…::Die Reihenfolge stimmt nicht.',
    'Je ne sais pas mon numéro.::Hilft niemandem weiter.',
  ], 'Telefonnummern werden in Zweierpaaren gesprochen: 06 12 34 56 78.'),

  // Modul 4
  antwort(9, 'fr.cafe', 1, { ...MARC, text: 'Bonjour, vous désirez ?', de: 'Guten Tag, was möchten Sie?' }, [
    'Un café, s’il vous plaît.',
    '~0.5 Je veux un café.::Verständlich, aber „je veux“ klingt fordernd.',
    'Donnez-moi un café.::Befehlston – ohne „s’il vous plaît“ unfreundlich.',
    'Un café ?::Die Frage zurückzugeben verwirrt.',
  ], 'Bestellen geht am einfachsten mit „un …, s’il vous plaît“ – oder höflicher „je voudrais“.'),
  antwort(10, 'fr.cafe', 2, { ...MARC, text: 'Sur place ou à emporter ?', de: 'Zum Hieressen oder zum Mitnehmen?' }, [
    'Sur place, merci.',
    '~0.5 Ici.::Verstanden wird es – die feste Wendung ist „sur place“.',
    'Oui.::Bei einer Entweder-oder-Frage hilft „oui“ nicht.',
    'À emporter sur place.::Beides zusammen gibt es nicht.',
  ], '„Sur place“ heißt hier essen, „à emporter“ mitnehmen.'),
  antwort(11, 'fr.zahlenbitte', 2, { ...CHLOE, text: 'On demande l’addition ?', de: 'Fragen wir nach der Rechnung?' }, [
    'Oui, l’addition, s’il vous plaît !',
    '~0.5 Oui, on paie.::Verständlich – man bittet aber um „l’addition“.',
    'Oui, la facture.::„Facture“ ist die Rechnung im Geschäftsleben.',
    'Oui, le ticket.::Das ist der Kassenbon, nicht die Restaurantrechnung.',
  ], 'Im Lokal heißt die Rechnung „l’addition“ – im Geschäft „la facture“.'),
  antwort(12, 'fr.zahlenbitte', 3, { ...MARC, text: 'Vous payez par carte ou en espèces ?', de: 'Zahlen Sie mit Karte oder bar?' }, [
    'Par carte, s’il vous plaît.',
    '~0.5 Carte.::Reicht, klingt aber knapp.',
    'Avec cash.::Englisch – auf Französisch „en espèces“ oder „en liquide“.',
    'Par argent.::So sagt man es nicht.',
  ], 'Bar heißt „en espèces“ oder umgangssprachlich „en liquide“.'),

  // Modul 5
  antwort(13, 'fr.laden', 1, { ...MARC, text: 'Bonjour ! Qu’est-ce que ce sera ?', de: 'Guten Tag! Was darf es sein?' }, [
    'Une baguette, s’il vous plaît.',
    '~0.5 Je prends une baguette.::Passt auch – etwas direkter.',
    'Une baguette.::Ohne „s’il vous plaît“ wirkt es unhöflich.',
    'Avez-vous du pain ?::In der Bäckerei eine überflüssige Frage.',
  ], 'In Frankreich beginnt jeder Einkauf mit „Bonjour“ – und endet mit „s’il vous plaît“.'),
  antwort(14, 'fr.mengen', 2, { ...MARC, text: 'Et avec ceci ?', de: 'Und sonst noch etwas?' }, [
    'Ce sera tout, merci.',
    '~0.5 Non, merci.::Passt, die übliche Wendung ist aber „ce sera tout“.',
    'Oui, c’est ça.::Beantwortet die Frage nicht.',
    'Rien.::Klingt abweisend.',
  ], '„Ce sera tout“ heißt: Das ist alles.'),
  antwort(15, 'fr.mengen', 2, { ...CHLOE, text: 'Tu veux combien de pommes ?', de: 'Wie viele Äpfel willst du?' }, [
    'Un kilo, ça suffit.',
    '~0.5 Beaucoup.::Zu ungenau für den Marktstand.',
    'Un kilo de pomme.::Im Plural: „de pommes“.',
    'Trois kilos de pommes de terre.::Das sind Kartoffeln.',
  ], 'Mengen stehen mit „de“: un kilo de pommes, une bouteille d’eau.'),
  antwort(16, 'fr.laden', 3, { ...PIERRE, text: 'Je peux vous aider ?', de: 'Kann ich Ihnen helfen?' }, [
    'Je regarde, merci.',
    '~0.5 Non, merci.::Höflich – „je regarde“ sagt zusätzlich, was du tust.',
    'Oui, aidez-moi.::Klingt wie ein Notruf.',
    'Je cherche rien.::Die Verneinung fehlt: „je ne cherche rien“.',
  ], '„Je regarde“ ist das französische „Ich schaue nur“.'),

  // Modul 6
  antwort(17, 'fr.bahn', 2, { ...YASMINE, text: 'Le train pour Lyon part de quel quai ?', de: 'Von welchem Gleis fährt der Zug nach Lyon?' }, [
    'Voie sept, je crois.',
    '~0.5 Sept.::Richtig, aber „voie sept“ ist eindeutiger.',
    'Le train est parti.::Beantwortet die Frage nicht.',
    'Je suis aussi pour Lyon.::Interessant, hilft aber nicht.',
  ], 'Das Gleis heißt „la voie“ – der Bahnsteig „le quai“.'),
  antwort(18, 'fr.weg', 2, { ...CHLOE, text: 'Pardon, où est la gare ?', de: 'Entschuldigung, wo ist der Bahnhof?' }, [
    'Tout droit, puis à gauche.',
    '~0.5 Par là.::Mit Geste verständlich, ohne eher nicht.',
    'À droite tout droit gauche.::Zu viel auf einmal.',
    'Je suis touriste aussi.::Ehrlich – hilft aber nicht weiter.',
  ], '„Tout droit“ heißt geradeaus, „à droite“ rechts – Vorsicht, die beiden klingen ähnlich.'),
  antwort(19, 'fr.hotel', 2, { ...PIERRE, text: 'Vous avez une réservation ?', de: 'Haben Sie eine Reservierung?' }, [
    'Oui, au nom de Weber.',
    '~0.5 Oui.::Richtig, aber der Name spart eine Nachfrage.',
    'Non, je dors ici.::Klingt seltsam.',
    'Oui, j’ai réservation.::Es fehlt „une“.',
  ], 'Im Hotel nennt man sofort den Namen: „au nom de …“.'),
  antwort(20, 'fr.bahn', 3, { ...YASMINE, text: 'Ce train est direct ?', de: 'Ist das ein direkter Zug?' }, [
    'Non, il faut changer à Dijon.',
    '~0.5 Non.::Stimmt – wo man umsteigt, ist aber das Wichtige.',
    'Oui, il change à Dijon.::Widerspricht sich.',
    'Je ne sais pas le train.::Grammatisch schief.',
  ], 'Umsteigen heißt „changer“ – „il faut changer à …“.'),

  // Modul 8
  antwort(21, 'fr.beschreiben', 2, { ...CHLOE, text: 'Comment est ton appartement ?', de: 'Wie ist deine Wohnung?' }, [
    'Il est petit mais très clair.',
    '~0.5 C’est bien.::Sehr knapp – ein Adjektiv mehr macht ein Gespräch daraus.',
    'Elle est petit.::Das Adjektiv müsste sich anpassen: „petite“.',
    'Mon appartement est une chambre.::Sagt nichts über den Eindruck.',
  ], 'Adjektive richten sich nach dem Nomen – und „mais“ macht die Beschreibung lebendig.'),
  antwort(22, 'fr.meinung', 3, { ...PIERRE, text: 'Tu aimes ce film ?', de: 'Magst du diesen Film?' }, [
    'Oui, je l’ai trouvé génial.',
    '~0.5 Oui, il est bien.::Passt, ist aber blass.',
    'Oui, j’aime il.::„le/la/l’“ steht vor dem Verb.',
    'Je n’ai pas vu mais oui.::Widersprüchlich.',
  ], 'Meinungen gibt man mit „je trouve que …“ oder „je l’ai trouvé …“.'),
  antwort(23, 'fr.vorschlag', 2, { ...CHLOE, text: 'On va au cinéma ce soir ?', de: 'Gehen wir heute Abend ins Kino?' }, [
    'Bonne idée ! À quelle heure ?',
    '~0.5 Oui, d’accord.::Passt – mit einer Rückfrage wird der Plan konkret.',
    'Peut-être je ne sais pas.::Lässt alles offen.',
    'Je vais au cinéma seul.::Wirkt wie eine Absage.',
  ], '„Bonne idée !“ plus eine Rückfrage – so wird aus einem Vorschlag ein Plan.'),
  antwort(24, 'fr.vorschlag', 3, { ...PIERRE, text: 'Ça te dit, un pique-nique demain ?', de: 'Hast du morgen Lust auf ein Picknick?' }, [
    'Avec plaisir ! J’apporte le fromage.',
    '~0.5 Oui, ça me dit.::Richtig – ein Beitrag macht die Zusage wärmer.',
    'Ça me dit rien.::Das ist eine Absage.',
    'Je dis oui demain.::Klingt nach Vertagung.',
  ], '„Ça te dit ?“ heißt: Hast du Lust? Zusagen mit „avec plaisir“.'),

  // Modul 9
  antwort(25, 'fr.tuvous', 2, { ...PIERRE, text: 'On peut se tutoyer ?', de: 'Wollen wir uns duzen?' }, [
    'Oui, avec plaisir !',
    '~0.5 Si vous voulez.::Höflich – aber das „vous“ widerspricht dem Duzen.',
    'Non, jamais.::Sehr schroff.',
    'Je tutoie pas les gens.::Verneinung unvollständig und unfreundlich.',
  ], 'Wenn jemand das Du anbietet, nimmt man es an – und wechselt sofort zu „tu“.'),
  antwort(26, 'fr.bitten', 2, { ...YASMINE, text: 'Vous pouvez répéter ?', de: 'Können Sie das wiederholen?' }, [
    'Bien sûr : le train part à neuf heures.',
    '~0.5 Oui.::Die Wiederholung fehlt.',
    'Je répète pas.::Unhöflich und grammatisch unvollständig.',
    'Vous n’écoutez pas ?::Ein Vorwurf.',
  ], '„Bien sûr“ heißt: Aber natürlich – und danach wiederholt man wirklich.'),
  antwort(27, 'fr.entschuldigen', 2, { ...CHLOE, text: 'Oh pardon, je suis en retard !', de: 'Oh Entschuldigung, ich bin zu spät!' }, [
    'Ce n’est pas grave, entre.',
    '~0.5 D’accord.::Etwas kühl für eine Entschuldigung.',
    'Oui, tu es en retard.::Stimmt – wirkt aber vorwurfsvoll.',
    'Pardon aussi.::Du hast dich nicht zu entschuldigen.',
  ], '„Ce n’est pas grave“ ist die Allzweckantwort auf kleine Entschuldigungen.'),
  antwort(28, 'fr.bitten', 3, { ...YASMINE, text: 'Excusez-moi, je peux passer ?', de: 'Entschuldigung, darf ich durch?' }, [
    'Je vous en prie.',
    '~0.5 Oui.::Reicht, ist aber trocken.',
    'Non, attendez.::Nur wenn es wirklich nicht geht.',
    'Passez vite.::Klingt genervt.',
  ], '„Je vous en prie“ passt auch hier: Bitte sehr, nur zu.'),

  // Modul 10
  antwort(29, 'fr.fauxamis', 3, { ...MARC, text: 'Vous voulez une entrée ?', de: 'Möchten Sie eine Vorspeise?' }, [
    'Oui, une soupe, s’il vous plaît.',
    '~0.4 Non, je suis déjà entré.::„Entrée“ ist hier die Vorspeise, nicht der Eingang.',
    'Où est l’entrée ?::Falscher Freund – im Lokal ist „entrée“ die Vorspeise.',
    'Oui, le plat principal.::Das ist das Hauptgericht.',
  ], 'Falscher Freund: „entrée“ heißt im Restaurant Vorspeise.'),
  antwort(30, 'fr.fauxamis', 4, { ...CHLOE, text: 'Je suis très sensible au froid.', de: 'Ich bin sehr kälteempfindlich.' }, [
    'Alors prends une écharpe.',
    '~0.5 Moi aussi j’ai froid.::Passt – geht aber an der Aussage vorbei.',
    'Tu es vraiment raisonnable.::„sensible“ heißt empfindlich, nicht vernünftig.',
    'Tu es sensible comme personne.::Verfehlt den Sinn.',
  ], '„Sensible“ heißt empfindlich. Vernünftig ist „raisonnable“.'),
  antwort(31, 'fr.fallen', 3, { ...PIERRE, text: 'Tu as quel âge ?', de: 'Wie alt bist du?' }, [
    'J’ai trente ans.',
    '~0.4 Je suis trente ans.::Das Alter „hat“ man im Französischen.',
    'Mon âge est trente.::So sagt man es nicht.',
    'Trente années.::„ans“ ist hier richtig, nicht „années“.',
  ], 'Alter, Hunger, Durst: alles mit „avoir“ – j’ai trente ans, j’ai faim.'),
  antwort(32, 'fr.fallen', 4, { ...MARC, text: 'Il fait chaud aujourd’hui, non ?', de: 'Heute ist es warm, oder?' }, [
    'Oui, il fait vraiment chaud.',
    '~0.4 Oui, je suis chaud.::Heißt: Ich bin scharf – hier sagt man „j’ai chaud“.',
    'Oui, c’est chaud moi.::Grammatisch schief.',
    'Oui, il est chaud.::Beim Wetter steht „il fait“.',
  ], 'Wetter mit „il fait“, das eigene Empfinden mit „j’ai chaud / j’ai froid“.'),
]

// ---------- Hören ----------

function hoer(nr: number, ziel: string, stufe: Stufe, text: string, de: string, frage: string, liste: string[], erklaerung?: string): HoerItem {
  return {
    id: `fr.ho.${String(nr).padStart(2, '0')}`,
    spiel: 'fr.hoeren',
    art: 'hoeren',
    ziel,
    stufe,
    sprache: 'fr-FR',
    text,
    de,
    frage,
    optionen: optionen(liste),
    ...(erklaerung ? { erklaerung } : {}),
  }
}

export const HOEREN: HoerItem[] = [
  // Modul 1
  hoer(1, 'fr.greet', 1, 'Bonjour, je m’appelle Chloé.', 'Guten Tag, ich heiße Chloé.', 'Was sagt die Person?', ['Sie stellt sich vor', 'Sie verabschiedet sich', 'Sie fragt nach dem Weg', 'Sie bedankt sich']),
  hoer(2, 'fr.intro', 1, 'Je viens de Lyon, et vous ?', 'Ich komme aus Lyon, und Sie?', 'Was erfahren wir?', ['Woher die Person kommt', 'Wohin die Person fährt', 'Wie alt sie ist', 'Was sie arbeitet'], '„Je viens de …“ heißt: Ich komme aus …'),
  hoer(3, 'fr.hoeflich', 1, 'Merci beaucoup, c’est très gentil.', 'Vielen Dank, das ist sehr nett.', 'Was tut die Person?', ['Sie bedankt sich', 'Sie entschuldigt sich', 'Sie beschwert sich', 'Sie lädt ein']),
  hoer(4, 'fr.greet', 2, 'À demain, bonne soirée !', 'Bis morgen, schönen Abend!', 'Wann sieht man sich wieder?', ['Morgen', 'Heute Abend', 'Nächste Woche', 'Gar nicht mehr'], '„À demain“ heißt: bis morgen.'),

  // Modul 2
  hoer(5, 'fr.stumm', 2, 'Le petit chat est gris.', 'Die kleine Katze ist grau.', 'Wie viele Endungen hört man nicht?', ['Zwei: das t von petit und das s von est', 'Keine', 'Alle', 'Nur das s'], 'Franzosen schreiben viele Endungen, die nie gesprochen werden.'),
  hoer(6, 'fr.nasal', 2, 'J’ai un grand jardin.', 'Ich habe einen großen Garten.', 'Was hat die Person?', ['Einen großen Garten', 'Einen kleinen Hund', 'Ein großes Haus', 'Keinen Garten']),
  hoer(7, 'fr.liaison', 3, 'Nous avons deux enfants.', 'Wir haben zwei Kinder.', 'Wie viele Kinder?', ['Zwei', 'Zwölf', 'Zehn', 'Keine'], 'Hier binden sich gleich zwei Wörter: „nous-zavon“ und „deu-zanfan“.'),
  hoer(8, 'fr.nasal', 3, 'Il boit du vin blanc.', 'Er trinkt Weißwein.', 'Was trinkt er?', ['Weißwein', 'Rotwein', 'Wasser', 'Milch'], '„vin blanc“ – zwei Nasale hintereinander.'),

  // Modul 3
  hoer(9, 'fr.zahlen', 1, 'Ça fait quinze euros.', 'Das macht fünfzehn Euro.', 'Wie viel kostet es?', ['15 €', '5 €', '50 €', '25 €']),
  hoer(10, 'fr.uhrzeit', 2, 'Le train part à sept heures et quart.', 'Der Zug fährt um Viertel nach sieben.', 'Wann fährt der Zug?', ['07:15', '07:45', '06:45', '07:30'], '„et quart“ ist Viertel nach, „moins le quart“ Viertel vor.'),
  hoer(11, 'fr.zahlen', 3, 'Mon numéro, c’est le zéro six, quatre-vingt-dix, douze.', 'Meine Nummer ist die 06 90 12.', 'Welche Zahl kommt nach der 06?', ['90', '80', '19', '70'], '„quatre-vingt-dix“ ist wörtlich „vier mal zwanzig plus zehn“ – also 90.'),
  hoer(12, 'fr.uhrzeit', 2, 'On se retrouve mardi matin.', 'Wir treffen uns Dienstagmorgen.', 'Wann trifft man sich?', ['Dienstagmorgen', 'Donnerstagabend', 'Montagmorgen', 'Dienstagabend']),

  // Modul 4
  hoer(13, 'fr.cafe', 1, 'Un café et un croissant, s’il vous plaît.', 'Einen Kaffee und ein Croissant, bitte.', 'Was wird bestellt?', ['Kaffee und Croissant', 'Tee und Baguette', 'Kaffee und Kuchen', 'Nur einen Kaffee']),
  hoer(14, 'fr.cafe', 2, 'Désolé, il n’y a plus de croissants.', 'Tut mir leid, es gibt keine Croissants mehr.', 'Was sagt der Verkäufer?', ['Die Croissants sind aus', 'Es gibt frische Croissants', 'Croissants kosten mehr', 'Er backt gerade welche'], '„il n’y a plus de …“ heißt: Es gibt keine … mehr.'),
  hoer(15, 'fr.zahlenbitte', 2, 'L’addition, s’il vous plaît !', 'Die Rechnung, bitte!', 'Was will der Gast?', ['Bezahlen', 'Nachbestellen', 'Sich beschweren', 'Die Karte sehen']),
  hoer(16, 'fr.zahlenbitte', 3, 'Vous pouvez payer au comptoir.', 'Sie können an der Theke bezahlen.', 'Wo bezahlt man?', ['An der Theke', 'Am Tisch', 'Online', 'Beim Kellner draußen'], '„le comptoir“ ist der Tresen – dort ist der Kaffee oft billiger.'),

  // Modul 5
  hoer(17, 'fr.laden', 1, 'Je voudrais une baguette, s’il vous plaît.', 'Ich hätte gern ein Baguette, bitte.', 'Was möchte die Person?', ['Ein Baguette', 'Zwei Baguettes', 'Ein Croissant', 'Einen Kuchen']),
  hoer(18, 'fr.mengen', 2, 'Un kilo de tomates, ça ira ?', 'Ein Kilo Tomaten, ist das recht?', 'Was wird gefragt?', ['Ob ein Kilo reicht', 'Ob Tomaten reif sind', 'Wie viel es kostet', 'Ob es Tomaten gibt']),
  hoer(19, 'fr.mengen', 3, 'C’est deux euros les trois.', 'Drei Stück kosten zwei Euro.', 'Was kosten drei Stück?', ['2 €', '3 €', '6 €', '23 €'], 'Auf Märkten hört man oft „… les trois“ – der Preis gilt für drei Stück.'),
  hoer(20, 'fr.laden', 2, 'La boulangerie ferme à treize heures.', 'Die Bäckerei schließt um 13 Uhr.', 'Wann schließt die Bäckerei?', ['Um 13 Uhr', 'Um 3 Uhr', 'Um 30 nach', 'Um 12 Uhr']),

  // Modul 6
  hoer(21, 'fr.bahn', 2, 'Le train à destination de Marseille partira voie huit.', 'Der Zug nach Marseille fährt von Gleis acht.', 'Von welchem Gleis?', ['Gleis 8', 'Gleis 18', 'Gleis 6', 'Gleis 2'], 'Bahnhofsdurchsagen beginnen oft mit „à destination de …“.'),
  hoer(22, 'fr.weg', 2, 'Prenez la première rue à droite.', 'Nehmen Sie die erste Straße rechts.', 'Was soll man tun?', ['Erste Straße rechts nehmen', 'Erste Straße links nehmen', 'Geradeaus gehen', 'Zurückgehen']),
  hoer(23, 'fr.hotel', 2, 'Le petit-déjeuner est servi de sept à dix heures.', 'Frühstück gibt es von sieben bis zehn Uhr.', 'Wann gibt es Frühstück?', ['7 bis 10 Uhr', '7 bis 11 Uhr', '8 bis 10 Uhr', 'Den ganzen Tag']),
  hoer(24, 'fr.weg', 3, 'C’est à cinq minutes à pied, en face de la poste.', 'Das ist fünf Minuten zu Fuß, gegenüber der Post.', 'Wo ist es?', ['Gegenüber der Post', 'Neben dem Bahnhof', 'Hinter der Kirche', 'Fünf Kilometer entfernt'], '„en face de“ heißt gegenüber.'),

  // Modul 9
  hoer(25, 'fr.tuvous', 2, 'Vous pouvez me tutoyer, vous savez.', 'Sie können mich ruhig duzen.', 'Was bietet die Person an?', ['Das Du', 'Einen Kaffee', 'Eine Mitfahrt', 'Ein Siezen'], 'Das Du wird oft ausdrücklich angeboten – danach gilt „tu“.'),
  hoer(26, 'fr.bitten', 2, 'Vous pourriez parler plus lentement, s’il vous plaît ?', 'Könnten Sie bitte langsamer sprechen?', 'Worum wird gebeten?', ['Langsamer zu sprechen', 'Lauter zu sprechen', 'Zu wiederholen', 'Aufzuschreiben'], 'Der wichtigste Satz für Anfänger überhaupt.'),
  hoer(27, 'fr.entschuldigen', 2, 'Je suis vraiment désolé pour le retard.', 'Es tut mir wirklich leid wegen der Verspätung.', 'Wofür entschuldigt sich die Person?', ['Für die Verspätung', 'Für einen Fehler', 'Für ein Missverständnis', 'Für den Lärm']),
  hoer(28, 'fr.tuvous', 3, 'Je vous laisse mon numéro, appelez-moi demain.', 'Ich lasse Ihnen meine Nummer da, rufen Sie mich morgen an.', 'Was soll man tun?', ['Morgen anrufen', 'Heute vorbeikommen', 'Eine Mail schreiben', 'Nichts tun'], 'Das „vous“ zeigt: Die beiden siezen sich noch.'),
]

// ---------- Satzbau ----------

function bau(nr: number, ziel: string, stufe: Stufe, text: string, bedeutung: string, erklaerung: string, extra?: string[]): BauItem {
  return {
    id: `fr.sb.${String(nr).padStart(2, '0')}`,
    spiel: 'fr.satzbau',
    art: 'bau',
    ziel,
    stufe,
    teile: bausteine(text),
    fest: 1,
    bedeutung,
    sprache: 'fr-FR',
    ...(extra ? { extra } : {}),
    erklaerung,
  }
}

export const SATZBAU: BauItem[] = [
  // Modul 1
  bau(1, 'fr.intro', 1, 'Je | m’appelle | Jonas | et | je | viens | d’Allemagne.', 'Ich heiße Jonas und komme aus Deutschland.', 'Die Standardvorstellung: erst der Name, dann die Herkunft mit „venir de“.'),
  bau(2, 'fr.greet', 1, 'Bonjour, | comment | allez-vous | aujourd’hui ?', 'Guten Tag, wie geht es Ihnen heute?', 'In der höflichen Frage steht das Verb vor dem „vous“ – mit Bindestrich.'),
  bau(3, 'fr.hoeflich', 2, 'Est-ce que | vous | pouvez | m’aider, | s’il vous plaît ?', 'Können Sie mir bitte helfen?', '„Est-ce que“ macht aus jedem Satz eine Frage – die Wortfolge bleibt gleich.'),

  // Modul 3
  bau(4, 'fr.uhrzeit', 2, 'Le rendez-vous | est | à | quatorze heures | trente.', 'Der Termin ist um 14:30 Uhr.', 'Offizielle Zeiten laufen bis 24 Uhr – „quatorze heures trente“ ist halb drei.'),
  bau(5, 'fr.zahlen', 2, 'Il y a | vingt et un | élèves | dans | la classe.', 'Es sind 21 Schüler in der Klasse.', 'Bei 21, 31, 41 steht ein „et“ vor der Eins: vingt et un.'),
  bau(6, 'fr.uhrzeit', 3, 'Je | travaille | du | lundi | au | vendredi.', 'Ich arbeite von Montag bis Freitag.', 'Zeitspannen mit „du … au …“.'),

  // Modul 4
  bau(7, 'fr.cafe', 1, 'Je | voudrais | un café | et | une eau, | s’il vous plaît.', 'Ich hätte gern einen Kaffee und ein Wasser, bitte.', '„Je voudrais“ ist die höflichste Art zu bestellen.'),
  bau(8, 'fr.cafe', 2, 'Est-ce que | vous | avez | une table | pour deux ?', 'Haben Sie einen Tisch für zwei?', 'Die Personenzahl steht mit „pour“ am Ende.'),
  bau(9, 'fr.zahlenbitte', 3, 'On | peut | payer | par carte | ici ?', 'Kann man hier mit Karte zahlen?', 'Zahlungsart mit „par“: par carte, par chèque.', ['avec']),

  // Modul 6
  bau(10, 'fr.bahn', 2, 'Un | aller-retour | pour Paris, | s’il vous plaît.', 'Eine Hin- und Rückfahrkarte nach Paris, bitte.', 'Hin und zurück heißt „aller-retour“, nur hin „aller simple“.'),
  bau(11, 'fr.weg', 2, 'Pardon, | où | est | la station | de métro ?', 'Entschuldigung, wo ist die Metro-Station?', 'Höfliche Fragen beginnen mit „pardon“ – die Metro-Station ist „la station“.'),
  bau(12, 'fr.hotel', 3, 'Je | voudrais | réserver | une chambre | pour | deux nuits.', 'Ich möchte ein Zimmer für zwei Nächte reservieren.', 'Nach „voudrais“ steht das Verb in der Grundform.'),

  // Modul 7
  bau(13, 'fr.tag', 2, 'Le matin, | je | prends | le bus | pour aller | au travail.', 'Morgens nehme ich den Bus zur Arbeit.', 'Steht die Zeitangabe vorn, bleibt die Wortfolge sonst gleich.'),
  bau(14, 'fr.wetter', 2, "Aujourd’hui, | il | fait | beau | et | il | ne | pleut | pas.", 'Heute ist schönes Wetter und es regnet nicht.', 'Die Verneinung klammert das Verb ein: „ne … pas“.'),
  bau(15, 'fr.freizeit', 3, 'Le week-end, | j’aime | aller | à la piscine | avec | mes amis.', 'Am Wochenende gehe ich gern mit Freunden ins Schwimmbad.', 'Nach „aimer“ folgt die Grundform – „j’aime aller“.'),

  // Modul 8
  bau(16, 'fr.meinung', 3, 'Je | trouve | que | ce film | est | vraiment | bien.', 'Ich finde, dass dieser Film richtig gut ist.', 'Meinungen mit „je trouve que …“ – danach ein ganzer Satz.'),
  bau(17, 'fr.beschreiben', 2, 'Ma sœur | est | plus | grande | que | moi.', 'Meine Schwester ist größer als ich.', 'Vergleiche mit „plus … que“.'),
  bau(18, 'fr.vorschlag', 3, 'Si | tu | veux, | on | peut | se voir | demain soir.', 'Wenn du willst, können wir uns morgen Abend treffen.', '„Si tu veux“ macht aus einem Vorschlag eine Einladung ohne Druck.'),
]

// ---------- Welcher Satz stimmt? ----------

function duell(nr: number, ziel: string, stufe: Stufe, richtig: string, falsch: string, warum: string, frage?: string): DuellItem {
  return {
    id: `fr.du.${String(nr).padStart(2, '0')}`,
    spiel: 'fr.duell',
    art: 'duell',
    ziel,
    stufe,
    a: richtig,
    b: falsch,
    richtig: 'a',
    warum,
    sprache: 'fr-FR',
    frage: frage ?? 'Welcher Satz stimmt?',
  }
}

export const DUELL: DuellItem[] = [
  // Modul 1
  duell(1, 'fr.intro', 1, 'Je m’appelle Marie.', 'Je m’appelle est Marie.', 'Das Verb steckt schon in „m’appelle“ – ein zweites „est“ ist zu viel.'),
  duell(2, 'fr.greet', 1, 'Bonjour, madame.', 'Bonjour, la madame.', 'Vor der Anrede steht kein Artikel.'),
  duell(3, 'fr.hoeflich', 1, 'Merci, c’est gentil.', 'Merci, ça est gentil.', 'Vor „est“ wird „ça“ zu „c’“ – daraus wird „c’est“.'),
  duell(4, 'fr.intro', 2, 'Je suis allemand.', 'Je suis un allemand.', 'Nationalitäten und Berufe stehen ohne Artikel.'),
  duell(5, 'fr.greet', 2, 'Comment allez-vous ?', 'Comment vous allez ?', 'In der höflichen Frage werden Verb und Pronomen getauscht.', 'Welche Frage ist die förmliche?'),

  // Modul 2
  duell(6, 'fr.liaison', 3, 'Nous avons un chien.', 'Nous avons un chien, mit Pause vor „avons“.', 'Zwischen „nous“ und „avons“ wird gebunden: „nu-zavon“ – ohne Pause.', 'Was klingt französisch?'),
  duell(7, 'fr.stumm', 2, 'Il est étudiant.', 'Il est étudiante.', 'Für einen Mann ohne „e“ – das wäre die weibliche Form.'),
  duell(8, 'fr.nasal', 3, 'Je voudrais du pain.', 'Je voudrais du peine.', '„pain“ ist Brot, „peine“ heißt Mühe.'),
  duell(9, 'fr.liaison', 4, 'C’est un grand ami.', 'C’est un grand-e ami.', 'Vor einem Vokal klingt das „d“ wie „t“ – geschrieben ändert sich nichts.'),
  duell(10, 'fr.stumm', 3, 'Les enfants jouent dehors.', 'Les enfants jouentes dehors.', 'Die Endung „-ent“ im Plural bleibt stumm – und ohne zusätzliches s.'),

  // Modul 5
  duell(11, 'fr.laden', 2, 'Je voudrais du fromage.', 'Je voudrais de fromage.', 'Vor männlichen Wörtern steht „du“ als Teilungsartikel.'),
  duell(12, 'fr.mengen', 2, 'Un litre de lait, s’il vous plaît.', 'Un litre du lait, s’il vous plaît.', 'Nach Mengenangaben steht schlicht „de“.'),
  duell(13, 'fr.laden', 3, 'Je n’ai pas de monnaie.', 'Je n’ai pas de la monnaie.', 'In der Verneinung wird aus „de la“ ein einfaches „de“.'),
  duell(14, 'fr.mengen', 3, 'Il y a beaucoup de gens.', 'Il y a beaucoup des gens.', 'Nach „beaucoup“ steht immer „de“.'),
  duell(15, 'fr.laden', 2, 'C’est combien ?', 'C’est combien de prix ?', '„C’est combien ?“ reicht – alles andere ist zu viel.'),

  // Modul 7
  duell(16, 'fr.wetter', 2, 'Il fait froid aujourd’hui.', 'Il est froid aujourd’hui.', 'Wetter beschreibt man mit „il fait“.'),
  duell(17, 'fr.tag', 2, 'Je me lève à sept heures.', 'Je lève à sept heures.', 'Aufstehen ist reflexiv: „se lever“.'),
  duell(18, 'fr.freizeit', 2, 'Je joue au football.', 'Je joue le football.', 'Sportarten mit „jouer à“, Instrumente mit „jouer de“.'),
  duell(19, 'fr.freizeit', 3, 'Je joue du piano.', 'Je joue au piano.', 'Instrumente stehen mit „de“: jouer du piano, de la guitare.'),
  duell(20, 'fr.tag', 3, 'J’ai mangé à midi.', 'J’ai mangé à midi heures.', '„midi“ steht allein – ohne „heures“.'),

  // Modul 8
  duell(21, 'fr.beschreiben', 2, 'Une belle maison.', 'Une belle maison au féminin: „un beau maison“.', 'Vor einem weiblichen Nomen heißt es „belle“.', 'Welche Form passt zu „maison“?'),
  duell(22, 'fr.beschreiben', 3, 'Elle est plus petite que lui.', 'Elle est plus petite comme lui.', 'Der Vergleich läuft mit „que“, nicht mit „comme“.'),
  duell(23, 'fr.meinung', 3, "J'aime beaucoup ce livre.", 'J’aime ce livre beaucoup.', '„beaucoup“ steht direkt hinter dem Verb.'),
  duell(24, 'fr.meinung', 4, 'Je pense que c’est une bonne idée.', 'Je pense c’est une bonne idée.', 'Nach „penser“ folgt „que“.'),
  duell(25, 'fr.vorschlag', 3, 'On se voit demain ?', 'On voit nous demain ?', 'Sich treffen ist reflexiv: „se voir“.'),

  // Modul 9
  duell(26, 'fr.tuvous', 2, 'Vous êtes prêt, monsieur ?', 'Tu es prêt, monsieur ?', 'Zu „monsieur“ gehört das höfliche „vous“.', 'Was passt zur förmlichen Anrede?'),
  duell(27, 'fr.bitten', 2, 'Pouvez-vous m’aider ?', 'Pouvez-vous aider moi ?', 'Das Pronomen steht vor dem Verb: „m’aider“.'),
  duell(28, 'fr.entschuldigen', 2, 'Excusez-moi de vous déranger.', 'Excusez-moi que je vous dérange.', 'Nach „excusez-moi de“ folgt die Grundform.'),
  duell(29, 'fr.bitten', 3, 'Je voudrais un renseignement.', 'Je veux un renseignement.', '„Je voudrais“ ist höflich, „je veux“ klingt fordernd.', 'Welcher Satz klingt höflich?'),
  duell(30, 'fr.entschuldigen', 3, 'Ce n’est pas de ma faute.', 'Ce n’est pas ma faute de moi.', 'Die feste Wendung heißt „de ma faute“.'),

  // Modul 10
  duell(31, 'fr.fauxamis', 3, 'Je vais au magasin.', 'Je vais au magazine.', '„magasin“ ist das Geschäft, „magazine“ die Zeitschrift.'),
  duell(32, 'fr.fauxamis', 4, 'Il a une bonne formation.', 'Il a une bonne éducation pour le travail.', '„formation“ ist die Ausbildung, „éducation“ die Erziehung.'),
  duell(33, 'fr.fallen', 3, 'J’ai faim.', 'Je suis faim.', 'Hunger „hat“ man im Französischen.'),
  duell(34, 'fr.fallen', 4, 'Il y a deux ans que j’habite ici.', 'Il y a deux ans que j’habitais ici depuis.', 'Die Zeitspanne steht mit „il y a … que“ – ohne zusätzliches „depuis“.'),
  duell(35, 'fr.fauxamis', 5, 'Je suis déçu du résultat.', 'Je suis déception du résultat.', '„déçu“ ist enttäuscht, „déception“ die Enttäuschung.'),
]
