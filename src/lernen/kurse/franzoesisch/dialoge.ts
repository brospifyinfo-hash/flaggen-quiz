// 🇫🇷 Gespräche: Vorstellen, Café, unterwegs. Jede Antwort verändert, was das Gegenüber sagt.
// guete 2 = so sagt man es · 1 = verständlich, aber holprig · 0 = passt nicht, noch einmal.
import type { DialogAntwort, DialogItem, DialogSchritt, Stufe } from '../../typen'

const a2 = (text: string, de: string, reaktion?: string, reaktionDe?: string, setze?: Record<string, string>): DialogAntwort => ({
  text,
  de,
  guete: 2,
  ...(reaktion ? { reaktion, ...(reaktionDe ? { reaktionDe } : {}) } : {}),
  ...(setze ? { setze } : {}),
})

const a1 = (text: string, de: string, feedback: string, reaktion?: string): DialogAntwort => ({
  text,
  de,
  guete: 1,
  feedback,
  ...(reaktion ? { reaktion } : {}),
})

const a0 = (text: string, de: string, feedback: string, reaktion: string): DialogAntwort => ({ text, de, guete: 0, feedback, reaktion })

const s = (npc: string, de: string, antworten: DialogAntwort[]): DialogSchritt => ({ npc, de, antworten })

function dlg(
  id: string,
  spiel: string,
  ziel: string,
  stufe: Stufe,
  ort: string,
  ortEmoji: string,
  person: { name: string; emoji: string },
  auftrag: string,
  schritte: DialogSchritt[],
  abschluss?: [string, string],
  erklaerung?: string,
): DialogItem {
  return {
    id,
    spiel,
    art: 'dialog',
    ziel,
    stufe,
    ort,
    ortEmoji,
    person,
    auftrag,
    sprache: 'fr-FR',
    schritte,
    ...(abschluss ? { abschluss: abschluss[0], abschlussDe: abschluss[1] } : {}),
    ...(erklaerung ? { erklaerung } : {}),
  }
}

export const DIALOGE: DialogItem[] = [
  // ---------- Erste Begegnung ----------
  dlg('fr.dg.01', 'fr.vorstellung', 'fr.intro', 1, 'Sprachschule in Nantes', '📚', { name: 'Chloé', emoji: '👧' },
    'Stell dich vor und finde heraus, woher Chloé kommt.',
    [
      s('Bonjour ! Tu es nouveau ici ?', 'Guten Tag! Bist du neu hier?', [
        a2('Oui, c’est mon premier jour.', 'Ja, mein erster Tag.', 'Bienvenue alors !', 'Dann herzlich willkommen!'),
        a1('Oui, je suis nouveau ici aujourd’hui.', 'Ja, ich bin heute neu hier.', 'Verständlich – kürzer klingt natürlicher: „c’est mon premier jour“.', 'D’accord !'),
        a0('Non, je suis vieux.', 'Nein, ich bin alt.', '„nouveau“ heißt hier: neu an diesem Ort, nicht jung.', 'Euh… pardon ?'),
      ]),
      s('Moi c’est Chloé. Et toi ?', 'Ich bin Chloé. Und du?', [
        a2('Je m’appelle Jonas, enchanté.', 'Ich heiße Jonas, sehr erfreut.', 'Enchantée, Jonas !', 'Sehr erfreut, Jonas!', { name: 'Jonas' }),
        a1('Jonas.', 'Jonas.', 'Richtig – mit „je m’appelle“ und „enchanté“ wirkt es freundlicher.', 'Enchantée !'),
        a0('Mon nom est appelé Jonas.', 'Mein Name wird Jonas genannt.', 'Zu viel auf einmal: „je m’appelle Jonas“ reicht.', 'Pardon ?'),
      ]),
      s('Tu viens d’où, {name} ?', 'Woher kommst du, {name}?', [
        a2('Je viens d’Allemagne, de Hambourg.', 'Aus Deutschland, aus Hamburg.', 'J’adore Hambourg, il y a le port !', 'Ich liebe Hamburg, mit dem Hafen!'),
        a1('Je suis d’Allemagne.', 'Ich bin aus Deutschland.', 'Geht – üblicher ist „je viens de …“.', 'Ah, super !'),
        a0('Je vais à l’Allemagne.', 'Ich fahre nach Deutschland.', '„venir de“ ist die Herkunft, „aller à“ das Ziel.', 'Tu pars déjà ?'),
      ]),
      s('Et tu restes combien de temps ?', 'Und wie lange bleibst du?', [
        a2('Trois mois. Et toi, tu es d’ici ?', 'Drei Monate. Und du, bist du von hier?', 'Non, je suis de Lyon, mais j’habite ici.', 'Nein, ich komme aus Lyon, wohne aber hier.'),
        a1('Trois mois.', 'Drei Monate.', 'Richtig – eine Rückfrage hält das Gespräch am Laufen.', 'Ça passe vite !'),
        a0('Depuis trois mois je reste.', 'Seit drei Monaten bleibe ich.', 'Gefragt war die Zukunft: „je reste trois mois“.', 'Hein ?'),
      ]),
    ],
    ['Allez, à demain {name} !', 'Also dann, bis morgen {name}!'],
    'Zwei Sätze reichen für den Anfang: „je m’appelle …“ und „je viens de …“ – und dann die Frage zurückgeben.'),

  dlg('fr.dg.02', 'fr.vorstellung', 'fr.greet', 2, 'Bei den Nachbarn', '🏡', { name: 'Madame Leroy', emoji: '👵' },
    'Begrüße deine Nachbarin höflich und sag, wer du bist.',
    [
      s('Bonjour ! Vous êtes le nouveau voisin ?', 'Guten Tag! Sind Sie der neue Nachbar?', [
        a2('Bonjour madame, oui, je viens d’emménager.', 'Guten Tag, ja, ich bin gerade eingezogen.', 'Ah, bienvenue dans l’immeuble !', 'Ah, willkommen im Haus!'),
        a1('Oui, c’est moi.', 'Ja, der bin ich.', 'Richtig – ein „bonjour madame“ davor gehört in Frankreich dazu.', 'Enchantée.'),
        a0('Salut ! Ouais.', 'Hi! Jep.', 'Zu salopp: Einer älteren Nachbarin sagt man „bonjour madame“ und siezt sie.', 'Hm. Bonjour…'),
      ]),
      s('Vous venez de loin ?', 'Kommen Sie von weit her?', [
        a2('D’Allemagne. Je travaille ici pour un an.', 'Aus Deutschland. Ich arbeite ein Jahr hier.', 'Un an, c’est bien !', 'Ein Jahr, das ist schön!'),
        a1('Oui, loin.', 'Ja, weit.', 'Verständlich – ein Satz mehr macht das Gespräch freundlich.', 'Ah bon ?'),
        a0('Non, j’habite ici.', 'Nein, ich wohne hier.', 'Das widerspricht dem Einzug gerade eben.', 'Mais vous venez d’arriver, non ?'),
      ]),
      s('Si vous avez besoin de quelque chose, n’hésitez pas.', 'Wenn Sie etwas brauchen, sagen Sie ruhig Bescheid.', [
        a2('C’est très gentil, merci beaucoup.', 'Das ist sehr nett, vielen Dank.', 'Je vous en prie !', 'Gern geschehen!'),
        a1('Merci.', 'Danke.', 'Passt – „c’est très gentil“ macht es wärmer.', 'De rien.'),
        a0('Oui, j’ai besoin de sucre maintenant.', 'Ja, ich brauche jetzt Zucker.', 'Das Angebot ist höflich gemeint – man nimmt es nicht sofort wörtlich.', 'Euh… tout de suite ?'),
      ]),
    ],
    ['Bonne installation, et à bientôt !', 'Gutes Einleben, und bis bald!'],
    'Im Französischen beginnt jedes Gespräch mit „bonjour“ plus Anrede – das ist keine Höflichkeitsfloskel, sondern Pflicht.'),

  // ---------- Im Café ----------
  dlg('fr.dg.03', 'fr.cafe', 'fr.cafe', 2, 'Café de la Gare', '☕', { name: 'Marc', emoji: '🧑‍🍳' },
    'Bestelle etwas zu trinken und zu essen – und bezahle am Ende.',
    [
      s('Bonjour ! Vous désirez ?', 'Guten Tag! Was möchten Sie?', [
        a2('Bonjour ! Je voudrais un café, s’il vous plaît.', 'Guten Tag! Ich hätte gern einen Kaffee, bitte.', 'Un café, très bien.', 'Einen Kaffee, sehr gut.', { getraenk: 'café' }),
        a1('Un café.', 'Einen Kaffee.', 'Ohne „bonjour“ und „s’il vous plaît“ wirkt es schroff.', 'D’accord…'),
        a0('Donnez-moi un café tout de suite.', 'Geben Sie mir sofort einen Kaffee.', 'Das ist ein Befehl – in Frankreich bestellt man mit „je voudrais“.', 'Euh, un instant.'),
      ]),
      s('Et avec ceci ?', 'Und sonst noch etwas?', [
        a2('Un croissant, s’il vous plaît.', 'Ein Croissant, bitte.', 'Parfait.', 'Perfekt.'),
        a1('Non.', 'Nein.', 'Ein „non merci“ oder „ce sera tout“ klingt freundlicher.', 'Très bien.'),
        a0('Qu’est-ce que vous avez ?', 'Was haben Sie?', 'Die Karte liegt auf dem Tisch – jetzt wird es umständlich.', 'Tout est sur la carte, monsieur.'),
      ]),
      s('Sur place ou à emporter ?', 'Zum Hieressen oder zum Mitnehmen?', [
        a2('Sur place, merci.', 'Zum Hieressen, danke.', 'Installez-vous, je vous apporte ça.', 'Setzen Sie sich, ich bringe es Ihnen.'),
        a1('Ici.', 'Hier.', 'Verstanden wird es – die Wendung heißt „sur place“.', 'Très bien.'),
        a0('Oui.', 'Ja.', 'Bei einer Entweder-oder-Frage hilft „oui“ nicht.', 'Sur place ou à emporter ?'),
      ]),
      s('Voilà votre {getraenk}. Autre chose ?', 'Hier ist Ihr {getraenk}. Sonst noch etwas?', [
        a2('Non merci, l’addition, s’il vous plaît.', 'Nein danke, die Rechnung, bitte.', 'Trois euros quatre-vingts.', 'Drei Euro achtzig.'),
        a1('Non. Je paie.', 'Nein. Ich zahle.', 'Verständlich – man bittet um „l’addition“.', 'Bien sûr.'),
        a0('Oui, un autre {getraenk} et l’addition.', 'Ja, noch ein {getraenk} und die Rechnung.', 'Beides zusammen verwirrt – erst nachbestellen, dann zahlen.', 'Alors… l’addition après ?'),
      ]),
    ],
    ['Merci et bonne journée !', 'Danke und einen schönen Tag!'],
    'Im Café gilt die Reihenfolge: bonjour – je voudrais – s’il vous plaît – l’addition. Damit kommt man überall durch.'),

  dlg('fr.dg.04', 'fr.cafe', 'fr.zahlenbitte', 3, 'Kleine Brasserie', '🍽️', { name: 'Sophie', emoji: '👩‍🍳' },
    'Iss zu Mittag und zahle getrennt von deiner Begleitung.',
    [
      s('Vous avez choisi ?', 'Haben Sie gewählt?', [
        a2('Oui, le plat du jour, s’il vous plaît.', 'Ja, das Tagesgericht, bitte.', 'Excellent choix.', 'Ausgezeichnete Wahl.'),
        a1('Oui, je prends ça.', 'Ja, ich nehme das.', 'Mit Geste verständlich – der Name des Gerichts ist eindeutiger.', 'Très bien.'),
        a0('Non, pas encore, revenez demain.', 'Nein, noch nicht, kommen Sie morgen wieder.', 'Das ist unhöflich – „encore une minute, s’il vous plaît“ wäre richtig.', 'Pardon ?'),
      ]),
      s('Et comme boisson ?', 'Und zu trinken?', [
        a2('Une carafe d’eau, s’il vous plaît.', 'Eine Karaffe Wasser, bitte.', 'Je vous apporte ça.', 'Ich bringe es Ihnen.'),
        a1('De l’eau.', 'Wasser.', 'Passt – in Frankreich bestellt man meist „une carafe d’eau“, die kostet nichts.', 'D’accord.'),
        a0('Rien, j’ai ma bouteille.', 'Nichts, ich habe meine Flasche.', 'Eigene Getränke sind im Lokal nicht üblich.', 'Euh, ce n’est pas possible ici.'),
      ]),
      s('Tout s’est bien passé ?', 'War alles recht?', [
        a2('C’était très bon, merci.', 'Es war sehr gut, danke.', 'Merci beaucoup !', 'Vielen Dank!'),
        a1('Oui, ça va.', 'Ja, geht so.', 'Klingt lustlos – ein Lob kostet nichts.', 'Bien.'),
        a0('Non, mais ce n’est pas grave.', 'Nein, aber macht nichts.', 'Wenn etwas nicht stimmt, sag es freundlich und konkret.', 'Ah… qu’est-ce qui n’allait pas ?'),
      ]),
      s('Je vous mets tout ensemble ?', 'Mache ich alles zusammen?', [
        a2('Séparément, s’il vous plaît.', 'Getrennt, bitte.', 'Pas de problème.', 'Kein Problem.'),
        a1('Non, chacun paie.', 'Nein, jeder zahlt.', 'Verständlich – die Wendung heißt „séparément“.', 'Très bien.'),
        a0('Oui, ensemble, mais je paie ma part.', 'Ja, zusammen, aber ich zahle meinen Teil.', 'Das widerspricht sich.', 'Alors ensemble ou séparément ?'),
      ]),
    ],
    ['Merci, bon après-midi !', 'Danke, einen schönen Nachmittag!'],
    '„Séparément“ oder „ensemble“ – diese beiden Wörter entscheiden am Ende jedes Restaurantbesuchs.'),

  // ---------- Unterwegs ----------
  dlg('fr.dg.05', 'fr.reise', 'fr.bahn', 3, 'Gare de Lyon', '🚄', { name: 'Yasmine', emoji: '🧳' },
    'Kauf eine Fahrkarte nach Avignon und finde heraus, wann der Zug fährt.',
    [
      s('Bonjour, je vous écoute.', 'Guten Tag, was kann ich für Sie tun?', [
        a2('Bonjour, un aller-retour pour Avignon, s’il vous plaît.', 'Guten Tag, eine Hin- und Rückfahrkarte nach Avignon, bitte.', 'Pour aujourd’hui ?', 'Für heute?'),
        a1('Un billet pour Avignon.', 'Eine Fahrkarte nach Avignon.', 'Passt – hin und zurück heißt „aller-retour“, nur hin „aller simple“.', 'Aller simple ?'),
        a0('Je voudrais aller à Avignon en voiture.', 'Ich möchte mit dem Auto nach Avignon.', 'Am Bahnschalter verkauft man keine Autos.', 'Ici, c’est le train, monsieur.'),
      ]),
      s('Vous partez quand ?', 'Wann fahren Sie?', [
        a2('Demain matin, si possible.', 'Morgen früh, wenn möglich.', 'Il y a un train à sept heures dix.', 'Es gibt einen Zug um 7:10 Uhr.'),
        a1('Demain.', 'Morgen.', 'Richtig – die Tageszeit hilft beim Suchen.', 'À quelle heure ?'),
        a0('Je ne sais pas encore.', 'Ich weiß noch nicht.', 'Ohne Datum kann sie kein Ticket verkaufen.', 'Revenez quand vous saurez.'),
      ]),
      s('Sept heures dix, ça vous va ?', 'Sieben Uhr zehn, passt Ihnen das?', [
        a2('Parfait. Il arrive à quelle heure ?', 'Perfekt. Wann kommt er an?', 'À dix heures vingt-cinq.', 'Um 10:25 Uhr.'),
        a1('Oui, d’accord.', 'Ja, einverstanden.', 'Gut – nach der Ankunft zu fragen, erspart Überraschungen.', 'Très bien.'),
        a0('Sept heures du soir ?', 'Sieben Uhr abends?', '„Sept heures dix“ am Morgen – abends hieße es „dix-neuf heures“.', 'Non, du matin.'),
      ]),
      s('Le train part voie douze. Autre chose ?', 'Der Zug fährt von Gleis zwölf. Sonst noch etwas?', [
        a2('Non, c’est tout. Merci beaucoup !', 'Nein, das ist alles. Vielen Dank!', 'Bon voyage !', 'Gute Reise!'),
        a1('Non.', 'Nein.', 'Ein „merci“ gehört dazu.', 'Bonne journée.'),
        a0('Oui, où est l’aéroport ?', 'Ja, wo ist der Flughafen?', 'Am Bahnschalter mit dem Flughafen anzufangen, verwirrt.', 'Euh, ce n’est pas ici.'),
      ]),
    ],
    ['Bon voyage à Avignon !', 'Gute Reise nach Avignon!'],
    'Am Schalter reichen drei Angaben: Ziel, aller-retour oder simple, und wann.'),

  dlg('fr.dg.06', 'fr.reise', 'fr.weg', 2, 'Auf der Straße in Bordeaux', '🗺️', { name: 'Pierre', emoji: '🧔' },
    'Frag nach dem Weg zum Museum und vergewissere dich, dass du es verstanden hast.',
    [
      s('Oui ? Je peux vous aider ?', 'Ja? Kann ich Ihnen helfen?', [
        a2('Pardon, je cherche le musée. C’est loin ?', 'Entschuldigung, ich suche das Museum. Ist es weit?', 'Non, dix minutes à pied.', 'Nein, zehn Minuten zu Fuß.'),
        a1('Où est le musée ?', 'Wo ist das Museum?', 'Verständlich – mit „pardon“ beginnt man höflicher.', 'Par là, tout droit.'),
        a0('Musée ?', 'Museum?', 'Ein einzelnes Wort wirkt unfreundlich.', 'Pardon ?'),
      ]),
      s('Vous allez tout droit, puis vous tournez à gauche après la banque.', 'Sie gehen geradeaus und biegen nach der Bank links ab.', [
        a2('Tout droit, puis à gauche après la banque. C’est ça ?', 'Geradeaus, dann links nach der Bank. Richtig?', 'Exactement !', 'Genau!'),
        a1('D’accord, merci.', 'In Ordnung, danke.', 'Wiederholen schützt vor Umwegen.', 'Bonne visite !'),
        a0('À droite après la banque ?', 'Rechts nach der Bank?', '„gauche“ ist links – „droite“ wäre rechts.', 'Non, à gauche !'),
      ]),
      s('Le musée est fermé le lundi, vous savez ?', 'Das Museum ist montags geschlossen, wissen Sie das?', [
        a2('Ah, bon à savoir. Merci de me le dire !', 'Ah, gut zu wissen. Danke für den Hinweis!', 'Je vous en prie !', 'Gern geschehen!'),
        a1('Ah oui ?', 'Ach ja?', 'Passt – ein Dank für den Hinweis wäre freundlicher.', 'Oui, oui.'),
        a0('Ce n’est pas grave, j’entre quand même.', 'Macht nichts, ich gehe trotzdem rein.', 'Bei geschlossener Tür geht das nicht.', 'Euh… ce sera fermé.'),
      ]),
    ],
    ['Bonne visite, et bonne journée !', 'Viel Spaß beim Besuch und einen schönen Tag!'],
    'Wiederhole den Weg mit eigenen Worten – so merkst du sofort, ob du alles verstanden hast.'),

  dlg('fr.dg.07', 'fr.reise', 'fr.hotel', 3, 'Hôtel du Parc', '🛎️', { name: 'Yasmine', emoji: '🧳' },
    'Checke ein und finde heraus, wann es Frühstück gibt.',
    [
      s('Bonsoir, vous avez une réservation ?', 'Guten Abend, haben Sie eine Reservierung?', [
        a2('Bonsoir, oui, au nom de Weber.', 'Guten Abend, ja, auf den Namen Weber.', 'Weber… voilà, deux nuits.', 'Weber… hier, zwei Nächte.'),
        a1('Oui.', 'Ja.', 'Richtig – der Name spart eine Nachfrage.', 'À quel nom ?'),
        a0('Non, mais je veux la meilleure chambre.', 'Nein, aber ich will das beste Zimmer.', 'Ohne Reservierung und mit Forderung wird es schwierig.', 'Je vais voir ce qui reste…'),
      ]),
      s('Voici votre clé, chambre vingt-trois, au deuxième étage.', 'Hier ist Ihr Schlüssel, Zimmer 23, im zweiten Stock.', [
        a2('Merci. Le petit-déjeuner est à quelle heure ?', 'Danke. Wann gibt es Frühstück?', 'De sept heures à dix heures, au rez-de-chaussée.', 'Von sieben bis zehn, im Erdgeschoss.'),
        a1('Merci beaucoup.', 'Vielen Dank.', 'Höflich – die Frage nach dem Frühstück fehlt noch.', 'Bonne soirée !'),
        a0('Vingt-trois ? Je préfère le rez-de-chaussée.', 'Dreiundzwanzig? Ich hätte lieber das Erdgeschoss.', 'Der Wunsch kommt zu spät und klingt fordernd.', 'C’est complet, désolée.'),
      ]),
      s('Vous avez besoin d’autre chose ?', 'Brauchen Sie sonst noch etwas?', [
        a2('Le code du wifi, s’il vous plaît.', 'Das WLAN-Passwort, bitte.', 'Il est au dos de la clé.', 'Es steht auf der Rückseite des Schlüssels.'),
        a1('Non, merci.', 'Nein, danke.', 'Passt – das WLAN fragt man besser gleich.', 'Bonne nuit !'),
        a0('Oui, un taxi pour demain matin à midi.', 'Ja, ein Taxi für morgen früh um zwölf.', '„Morgen früh“ und „um zwölf“ passen nicht zusammen.', 'Le matin ou à midi ?'),
      ]),
    ],
    ['Bon séjour à l’hôtel !', 'Einen schönen Aufenthalt!'],
    'Beim Einchecken hilft die Reihenfolge: Name nennen, Schlüssel nehmen, nach Frühstück und WLAN fragen.'),

  dlg('fr.dg.08', 'fr.vorstellung', 'fr.hoeflich', 2, 'Pause im Sprachkurs', '🥐', { name: 'Théo', emoji: '🧑' },
    'Bedanke dich, lehne höflich ab und stell dich trotzdem vor.',
    [
      s('Tu veux un morceau de gâteau ? C’est moi qui l’ai fait.', 'Willst du ein Stück Kuchen? Den habe ich gebacken.', [
        a2('Avec plaisir, merci beaucoup !', 'Sehr gern, vielen Dank!', 'Alors sers-toi !', 'Dann greif zu!'),
        a1('Oui, je veux.', 'Ja, ich will.', '„Je veux“ klingt fordernd – „avec plaisir“ ist die freundliche Zusage.', 'Voilà.'),
        a0('Non, je n’aime pas les gâteaux faits maison.', 'Nein, ich mag keinen selbstgebackenen Kuchen.', 'Das trifft ihn – eine Absage geht freundlicher: „non merci, j’ai déjà mangé“.', 'Ah… d’accord.'),
      ]),
      s('Au fait, moi c’est Théo. Tu es dans quel groupe ?', 'Übrigens, ich bin Théo. In welcher Gruppe bist du?', [
        a2('Moi c’est Jonas, groupe B. Enchanté !', 'Ich bin Jonas, Gruppe B. Freut mich!', 'Enchanté ! On est voisins alors.', 'Freut mich! Dann sind wir Nachbarn.', { name: 'Jonas' }),
        a1('Groupe B.', 'Gruppe B.', 'Richtig – dein Name fehlt noch.', 'Et tu t’appelles… ?'),
        a0('Je ne sais pas mon groupe.', 'Ich weiß meine Gruppe nicht.', 'Das beendet das Gespräch, bevor es beginnt.', 'Ah, d’accord…'),
      ]),
      s('Tu prends un café avec nous après le cours, {name} ?', 'Trinkst du nach dem Kurs einen Kaffee mit uns, {name}?', [
        a2('Volontiers, mais je dois partir à cinq heures.', 'Gern, aber ich muss um fünf los.', 'Pas de souci, on y va tout de suite après.', 'Kein Problem, wir gehen gleich danach.'),
        a1('Oui.', 'Ja.', 'Passt – ein Zusatz macht die Zusage verbindlich.', 'Super !'),
        a0('Peut-être, je ne sais pas, on verra.', 'Vielleicht, ich weiß nicht, mal sehen.', 'Drei Ausweichfloskeln hintereinander wirken abweisend.', 'Euh… comme tu veux.'),
      ]),
    ],
    ['À tout à l’heure, {name} !', 'Bis gleich, {name}!'],
    'Höflich ablehnen oder zusagen heißt in Frankreich: „merci“ zuerst, Begründung danach.'),

  dlg('fr.dg.09', 'fr.cafe', 'fr.cafe', 1, 'Bar am Morgen', '🥐', { name: 'Marc', emoji: '🧑‍🍳' },
    'Bestelle ein Frühstück am Tresen und frag, was es kostet.',
    [
      s('Bonjour ! Qu’est-ce que je vous sers ?', 'Guten Tag! Was darf ich Ihnen bringen?', [
        a2('Bonjour ! Un crème et une tartine, s’il vous plaît.', 'Guten Tag! Einen Milchkaffee und ein Butterbrot, bitte.', 'Un crème, une tartine. Ça marche.', 'Ein Milchkaffee, ein Butterbrot. Geht klar.', { getraenk: 'crème' }),
        a1('Un café au lait et du pain.', 'Einen Milchkaffee und Brot.', 'Verstanden – am Tresen sagt man kurz „un crème“ und „une tartine“.', 'D’accord.'),
        a0('Je prends le petit-déjeuner anglais.', 'Ich nehme das englische Frühstück.', 'Das gibt es in einer französischen Bar nicht.', 'Ici, c’est café et tartine, monsieur.'),
      ]),
      s('Au comptoir ou en terrasse ?', 'Am Tresen oder auf der Terrasse?', [
        a2('Au comptoir, merci.', 'Am Tresen, danke.', 'Parfait, c’est moins cher.', 'Perfekt, das ist günstiger.'),
        a1('En terrasse.', 'Auf der Terrasse.', 'Auch gut – draußen kostet in Frankreich oft mehr.', 'Très bien, installez-vous.'),
        a0('Oui.', 'Ja.', 'Bei einer Entweder-oder-Frage hilft „oui“ nicht.', 'Comptoir ou terrasse ?'),
      ]),
      s('Voilà votre {getraenk}.', 'Hier ist Ihr {getraenk}.', [
        a2('Merci ! Je vous dois combien ?', 'Danke! Was schulde ich Ihnen?', 'Quatre euros vingt.', 'Vier Euro zwanzig.'),
        a1('Merci. C’est combien ?', 'Danke. Was kostet das?', 'Passt – „je vous dois combien ?“ ist am Tresen die übliche Formel.', 'Quatre euros vingt.'),
        a0('Merci, au revoir !', 'Danke, auf Wiedersehen!', 'Bezahlt ist noch nicht.', 'Euh, et l’addition ?'),
      ]),
    ],
    ['Bonne journée, et à demain !', 'Einen schönen Tag, und bis morgen!'],
    'Am Tresen ist der Kaffee fast überall billiger als am Tisch – und „un crème“ heißt Milchkaffee.'),
]
