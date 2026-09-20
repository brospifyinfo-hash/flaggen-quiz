// 🇬🇧 Englisch – Gespräche und Situationen. Jede Antwort verändert, was das Gegenüber sagt.
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
    sprache: 'en-GB',
    schritte,
    ...(abschluss ? { abschluss: abschluss[0], abschlussDe: abschluss[1] } : {}),
    ...(erklaerung ? { erklaerung } : {}),
  }
}

export const DIALOGE: DialogItem[] = [
  // ---------- Freie Gespräche ----------
  dlg('en.dg.01', 'en.gespraech', 'en.intro', 1, 'Sprachkurs in Brighton', '📚', { name: 'Emma', emoji: '👩' },
    'Stell dich vor und finde heraus, woher Emma kommt.',
    [
      s('Hi! Is this seat taken?', 'Hi! Ist der Platz besetzt?', [
        a2('No, go ahead!', 'Nein, setz dich ruhig.', 'Thanks!', 'Danke!'),
        a1('No, it is not taken. You can sit here.', 'Nein, er ist nicht besetzt. Du kannst hier sitzen.', 'Verständlich, klingt aber nach Lehrbuch. Kürzer: „No, go ahead!“', 'Great, thanks.'),
        a0('Yes, please.', 'Ja, bitte.', '„Yes“ heißt hier: Der Platz ist besetzt.', "Oh, sorry – I'll find another seat."),
      ]),
      s("I'm Emma, by the way.", 'Ich bin übrigens Emma.', [
        a2("Nice to meet you, Emma. I'm Jonas.", 'Freut mich, Emma. Ich bin Jonas.', 'Nice to meet you too!', 'Mich auch!', { name: 'Jonas' }),
        a1('I am Jonas. How do you do?', 'Ich bin Jonas. Wie geht es Ihnen?', '„How do you do?“ ist sehr förmlich und heute selten. „Nice to meet you“ passt immer.', 'Erm… nice to meet you!'),
        a0("Emma is a nice name.", 'Emma ist ein schöner Name.', 'Hier stellt man sich einfach selbst vor.', 'Erm… thanks?'),
      ]),
      s('Where are you from, {name}?', 'Woher kommst du, {name}?', [
        a2("I'm from Germany – from a small town near Cologne.", 'Aus Deutschland – aus einer Kleinstadt bei Köln.', "Oh, I've been to Cologne! The cathedral is amazing.", 'Oh, ich war schon in Köln! Der Dom ist großartig.'),
        a1('I come from Germany.', 'Ich komme aus Deutschland.', 'Geht – „I’m from Germany“ klingt natürlicher.', 'Nice!'),
        a0('I am German people.', 'Ich bin deutsche Leute.', 'Richtig: „I’m German“ oder „I’m from Germany“.', 'Sorry?'),
      ]),
      s('How long have you been here?', 'Wie lange bist du schon hier?', [
        a2('Just two weeks. And you?', 'Erst zwei Wochen. Und du?', 'A month now. Time flies!', 'Einen Monat. Die Zeit vergeht!'),
        a1('Two weeks.', 'Zwei Wochen.', 'Richtig – mit einer Rückfrage („And you?“) bleibt das Gespräch in Gang.', 'A month for me.'),
        a0('Since two weeks I am here.', 'Seit zwei Wochen bin ich hier.', 'Richtig: „I’ve been here for two weeks.“', 'Erm, sorry?'),
      ]),
    ],
    ['See you tomorrow, {name}!', 'Bis morgen, {name}!'],
    'Kleine Rückfragen wie „And you?“ halten ein Gespräch am Laufen – das ist der wichtigste Trick beim Kennenlernen.'),

  dlg('en.dg.02', 'en.gespraech', 'en.smalltalk', 2, 'Teeküche im Büro', '☕', { name: 'Chris', emoji: '🧑‍💼' },
    'Halte zwei Minuten Small Talk aus – ohne Stille.',
    [
      s('Morning! Terrible weather again, isn’t it?', 'Morgen! Schon wieder furchtbares Wetter, oder?', [
        a2('I know! It hasn’t stopped raining all week.', 'Ich weiß! Es hat die ganze Woche nicht aufgehört zu regnen.', 'Tell me about it. My shoes are still wet.', 'Wem sagst du das. Meine Schuhe sind noch nass.'),
        a1('Yes, the weather is bad today.', 'Ja, das Wetter ist heute schlecht.', 'Stimmt – aber mit einem kleinen Zusatz wird daraus ein Gespräch.', 'Mm, true.'),
        a0('No, I like this weather very much.', 'Nein, ich mag dieses Wetter sehr.', 'Widerspruch beendet Small Talk schnell. Zustimmen und etwas ergänzen hält ihn am Laufen.', 'Oh… right.'),
      ]),
      s('Did you get up to much at the weekend?', 'Hast du am Wochenende was unternommen?', [
        a2('Not much, to be honest. I finally slept in. How about you?', 'Ehrlich gesagt nicht viel. Ich habe endlich ausgeschlafen. Und du?', 'Lucky you! I was helping my brother move house.', 'Glückspilz! Ich habe meinem Bruder beim Umzug geholfen.'),
        a1('I was at home and did nothing special.', 'Ich war zu Hause und habe nichts Besonderes gemacht.', 'Passt – mit „How about you?“ gibst du den Ball zurück.', 'Sounds relaxing.'),
        a0('That is private.', 'Das ist privat.', 'Die Frage ist nur Small Talk, keine Neugier. Eine kurze, lockere Antwort reicht.', 'Oh – sorry, I didn’t mean to pry.'),
      ]),
      s('Are you coming to the team lunch on Friday?', 'Kommst du Freitag zum Team-Essen?', [
        a2('I’d love to. What time does it start?', 'Sehr gern. Wann geht es los?', 'Half twelve, at the Italian place.', 'Um halb eins, beim Italiener.'),
        a1('Yes, I come.', 'Ja, ich komme.', 'Verständlich – natürlicher: „Yes, I’ll be there.“', 'Great!'),
        a0('I must think about it later maybe.', 'Ich muss vielleicht später darüber nachdenken.', 'Das klingt ausweichend. Zusagen, absagen oder freundlich verschieben: „Can I let you know tomorrow?“', 'Erm, okay…'),
      ]),
    ],
    ['Right, back to work. Catch you later!', 'So, zurück an die Arbeit. Bis später!'],
    'Small Talk lebt von Zustimmung plus einem kleinen Zusatz – und davon, die Frage zurückzugeben.'),

  dlg('en.dg.03', 'en.gespraech', 'en.hobbys', 2, 'Im Treppenhaus', '🏠', { name: 'Sarah', emoji: '👩‍🦱' },
    'Erzähl von deinem Hobby und frag Sarah nach ihrem.',
    [
      s('Hi! I’ve seen you with a guitar case. Do you play?', 'Hi! Ich habe dich mit einem Gitarrenkoffer gesehen. Spielst du?', [
        a2('Yeah, I do – just for fun, though.', 'Ja, schon – aber nur zum Spaß.', 'That’s the best reason. How long have you been playing?', 'Der beste Grund. Wie lange spielst du schon?'),
        a1('Yes, I play guitar since three years.', 'Ja, ich spiele seit drei Jahren Gitarre.', 'Fast! Richtig: „I’ve been playing for three years.“', 'Nice!'),
        a0('No, it is not mine.', 'Nein, sie gehört mir nicht.', 'Schade – dann endet das Gespräch schnell. (Und hier stimmt es ja auch nicht.)', 'Oh, okay.'),
      ]),
      s('How long have you been playing?', 'Wie lange spielst du schon?', [
        a2('About three years now. What about you – do you play anything?', 'Etwa drei Jahre. Und du – spielst du was?', 'I used to play the piano at school. I should start again.', 'Ich habe in der Schule Klavier gespielt. Ich sollte wieder anfangen.'),
        a1('Three years.', 'Drei Jahre.', 'Korrekt – eine Rückfrage macht mehr daraus.', 'Cool.'),
        a0('I am playing guitar since I am a child.', 'Ich spiele Gitarre, seit ich ein Kind bin.', 'Richtig: „I’ve been playing since I was a child.“', 'Sorry, since when?'),
      ]),
      s('Maybe we could play together sometime?', 'Vielleicht können wir mal zusammen spielen?', [
        a2('That would be fun! I’m usually free on Sundays.', 'Das wäre lustig! Sonntags habe ich meistens Zeit.', 'Perfect. I’ll bring the piano… well, the keyboard.', 'Perfekt. Ich bringe das Klavier mit … also das Keyboard.'),
        a1('Yes, that is possible.', 'Ja, das ist möglich.', 'Klingt kühl. „That would be fun!“ zeigt Interesse.', 'Erm, great.'),
        a0('I don’t think so.', 'Ich glaube nicht.', 'Eine klare Absage – hier war eine freundliche Einladung gemeint.', 'Oh. No problem.'),
      ]),
    ],
    ['See you around!', 'Man sieht sich!'],
    '„I’ve been playing for three years“: Für etwas, das in der Vergangenheit begann und noch andauert, nimmt man im Englischen das Present Perfect.'),

  dlg('en.dg.04', 'en.gespraech', 'en.followup', 3, 'Auf einer Party', '🎉', { name: 'Dan', emoji: '🧔' },
    'Finde heraus, was Dan beruflich macht – und halte das Gespräch in Gang.',
    [
      s('So, how do you know Lisa?', 'Und, woher kennst du Lisa?', [
        a2('We work together. And you?', 'Wir arbeiten zusammen. Und du?', 'We were at uni together, years ago.', 'Wir waren zusammen an der Uni, vor Jahren.'),
        a1('From the work.', 'Von der Arbeit.', 'Fast – „from work“ ohne „the“. Und eine Rückfrage hilft.', 'Ah, right.'),
        a0('Why do you ask?', 'Warum fragst du?', 'Das klingt abweisend – die Frage ist nur der Einstieg.', 'Just making conversation…'),
      ]),
      s('What do you do, then?', 'Und was machst du so?', [
        a2('I’m a nurse. What about you?', 'Ich bin Krankenpfleger. Und du?', 'I’m in IT – I fix things people break.', 'Ich bin in der IT – ich repariere, was andere kaputt machen.'),
        a1('I make the work in a hospital.', 'Ich mache die Arbeit in einem Krankenhaus.', 'Gemeint ist: „I work at a hospital.“', 'Oh, in a hospital?'),
        a0('I am working since 7 a.m. today.', 'Ich arbeite seit 7 Uhr heute.', 'Die Frage zielt auf den Beruf, nicht auf den heutigen Tag.', 'Erm… long day. But what’s your job?'),
      ]),
      s('IT, right. Everyone always asks me to fix their printer.', 'IT, genau. Alle bitten mich immer, ihren Drucker zu reparieren.', [
        a2('Ha! I bet. Do you actually enjoy it?', 'Ha! Das glaube ich. Macht es dir denn Spaß?', 'Most days, yes. The printers are the worst part.', 'Meistens schon. Die Drucker sind das Schlimmste.'),
        a1('That is funny.', 'Das ist lustig.', 'Richtig – aber eine Nachfrage hält das Gespräch am Leben.', 'Heh, yeah.'),
        a0('Can you fix my laptop?', 'Kannst du meinen Laptop reparieren?', 'Genau darüber hat er sich gerade beschwert.', 'Erm… I was joking about that, actually.'),
      ]),
    ],
    ['Anyway, nice talking to you!', 'Jedenfalls: Schön, mit dir zu reden!'],
    'Nachfragen („Do you actually enjoy it?“) zeigen Interesse und geben dem Gegenüber etwas zu erzählen.'),

  dlg('en.dg.05', 'en.gespraech', 'en.ending', 4, 'Im Zug nach Manchester', '🚆', { name: 'Grace', emoji: '👵' },
    'Sei freundlich – und beende das Gespräch höflich, bevor du aussteigst.',
    [
      s('Is anyone sitting here, love?', 'Sitzt hier jemand, mein Lieber?', [
        a2('No, it’s free. Please.', 'Nein, frei. Bitte.', 'Thank you. These trains get busier every year.', 'Danke. Diese Züge werden jedes Jahr voller.'),
        a1('No, nobody sits here.', 'Nein, hier sitzt niemand.', 'Verständlich – „No, it’s free“ ist die übliche Kurzform.', 'Lovely, thank you.'),
        a0('I don’t know.', 'Ich weiß nicht.', 'Auf dem Nachbarplatz weiß man es meistens – hier hilft eine klare, freundliche Antwort.', 'Well… I’ll risk it.'),
      ]),
      s('Are you going all the way to Manchester?', 'Fährst du bis Manchester durch?', [
        a2('No, I get off at Stockport. Are you?', 'Nein, ich steige in Stockport aus. Du auch?', 'All the way, I’m afraid. Visiting my grandson.', 'Bis zum Ende, leider. Ich besuche meinen Enkel.'),
        a1('No. Stockport.', 'Nein. Stockport.', 'Knapp – ein Halbsatz wirkt gleich wärmer.', 'Right you are.'),
        a0('Yes, to Manchester.', 'Ja, nach Manchester.', 'Kleine Sache, aber: Wer falsch antwortet, verwirrt später.', 'Oh, we’ll be neighbours for a while then!'),
      ]),
      s('He’s just started school. Do you have children?', 'Er kommt gerade in die Schule. Hast du Kinder?', [
        a2('Not yet, no. But my sister has two – they’re a handful!', 'Noch nicht. Aber meine Schwester hat zwei – die halten einen auf Trab!', 'Oh, I remember those days.', 'Oh, an diese Zeiten erinnere ich mich.'),
        a1('No, I have no children.', 'Nein, ich habe keine Kinder.', 'Korrekt – ein Zusatz hält das Gespräch offen.', 'Plenty of time.'),
        a0('That is none of your business.', 'Das geht dich nichts an.', 'Sehr schroff. Wer nicht antworten will, weicht freundlich aus: „Oh, that’s a long story!“', 'Oh! I’m sorry, dear.'),
      ]),
      s('It was lovely chatting to you.', 'Es war nett, mit dir zu plaudern.', [
        a2('You too! This is my stop – have a lovely trip.', 'Fand ich auch! Hier muss ich raus – gute Reise.', 'Thank you, love. Take care!', 'Danke, mein Lieber. Mach’s gut!'),
        a1('Yes. Goodbye.', 'Ja. Auf Wiedersehen.', 'Sehr knapp – ein warmer Schluss kostet nur drei Wörter mehr.', 'Bye then.'),
        a0('Okay, I must go now, bye.', 'Okay, ich muss jetzt gehen, tschüss.', 'Wirkt abrupt. Ein kurzer Rückbezug macht den Abschied rund.', 'Oh – right. Goodbye.'),
      ]),
    ],
    undefined,
    'Ein Gespräch beendet man auf Englisch mit einem Rückbezug: „It was lovely chatting to you“ – „You too!“'),

  dlg('en.dg.06', 'en.gespraech', 'en.work', 4, 'Telefon: Kollege aus London', '📞', { name: 'Priya', emoji: '👩‍💻' },
    'Kläre, wann ihr euch trefft – und bestätige den Termin.',
    [
      s('Hi, it’s Priya. Is now a good time?', 'Hi, hier ist Priya. Passt es gerade?', [
        a2('Hi Priya! Yes, go ahead.', 'Hi Priya! Ja, leg los.', 'Great. It’s about Thursday’s workshop.', 'Super. Es geht um den Workshop am Donnerstag.'),
        a1('Hello. Yes, it is a good time now.', 'Hallo. Ja, es ist gerade ein guter Zeitpunkt.', 'Verständlich – „Yes, go ahead“ ist die übliche Kurzform.', 'Right, so…'),
        a0('Who is there?', 'Wer ist da?', 'Sie hat sich gerade vorgestellt – besser mit dem Namen antworten.', 'Erm, it’s Priya. We spoke yesterday?'),
      ]),
      s('Could we move the workshop to Friday morning?', 'Können wir den Workshop auf Freitagvormittag verschieben?', [
        a2('Friday morning works for me. Shall we say ten?', 'Freitagvormittag passt mir. Sagen wir zehn?', 'Ten is perfect. I’ll send an invite.', 'Zehn ist perfekt. Ich schicke eine Einladung.'),
        a1('Yes, it is possible for me on Friday.', 'Ja, am Freitag ist es für mich möglich.', 'Geht – „Friday works for me“ ist kürzer und üblicher.', 'Brilliant.'),
        a0('I don’t know, maybe, we will see.', 'Ich weiß nicht, vielleicht, mal sehen.', 'Am Telefon braucht es eine klare Antwort – oder ein klares „Can I check and get back to you?“', 'Erm… could you check and let me know today?'),
      ]),
      s('Anything you need from me before then?', 'Brauchst du vorher noch etwas von mir?', [
        a2('Could you send me the slides beforehand?', 'Könntest du mir vorher die Folien schicken?', 'Of course, I’ll send them today.', 'Klar, ich schicke sie heute.'),
        a1('Please send the slides.', 'Bitte schick die Folien.', 'Verständlich, klingt aber nach Anweisung. „Could you …?“ ist höflicher.', 'Will do.'),
        a0('No, nothing, thank you, bye.', 'Nein, nichts, danke, tschüss.', 'Hier wäre die Gelegenheit gewesen, das Nötige zu klären.', 'Okay… speak on Friday then.'),
      ]),
    ],
    ['Perfect – see you Friday at ten!', 'Perfekt – bis Freitag um zehn!'],
    'Am Telefon zählen klare Zusagen: „Friday works for me. Shall we say ten?“'),

  dlg('en.dg.07', 'en.gespraech', 'en.recovery', 4, 'Im Supermarkt', '🛒', { name: 'Mark', emoji: '🧑' },
    'Du erkennst ihn nicht – rette das Gespräch, ohne unhöflich zu sein.',
    [
      s('Hey! Long time no see! How have you been?', 'Hey! Lange nicht gesehen! Wie geht’s dir?', [
        a2('Hi! Good, thanks – sorry, remind me where we know each other from?', 'Hi! Gut, danke – sag mal, woher kennen wir uns noch mal?', 'The Spanish course, two years ago! I’m Mark.', 'Vom Spanischkurs, vor zwei Jahren! Ich bin Mark.'),
        a1('Hello. I am fine. And you?', 'Hallo. Mir geht es gut. Und dir?', 'Höflich – aber du weißt immer noch nicht, wer er ist.', 'Can’t complain! Still teaching?'),
        a0('I don’t know you.', 'Ich kenne dich nicht.', 'Das ist schroff. Freundlich nachfragen rettet die Situation.', 'Oh… the Spanish course? Never mind.'),
      ]),
      s('The Spanish course! I sat behind you.', 'Der Spanischkurs! Ich saß hinter dir.', [
        a2('Of course – Mark! Sorry, it took me a second.', 'Natürlich – Mark! Sorry, ich brauchte kurz.', 'No worries, it’s been ages.', 'Kein Problem, ist ewig her.'),
        a1('Ah yes. Now I remember you.', 'Ah ja. Jetzt erinnere ich mich an dich.', 'Geht – eine kleine Entschuldigung macht es wärmer.', 'Good to see you!'),
        a0('Are you sure?', 'Bist du sicher?', 'Damit zweifelst du ihn an – besser freundlich einsteigen.', 'Quite sure, yes…'),
      ]),
      s('Do you still speak any Spanish?', 'Sprichst du noch Spanisch?', [
        a2('Barely! I’ve forgotten most of it. Do you?', 'Kaum! Ich habe das meiste vergessen. Du?', 'Same here. Maybe we should start again.', 'Geht mir genauso. Vielleicht sollten wir wieder anfangen.'),
        a1('No, I forgot all.', 'Nein, ich habe alles vergessen.', 'Fast: „I’ve forgotten it all.“', 'Ha, me too.'),
        a0('Yes, I speak Spanish perfect.', 'Ja, ich spreche perfekt Spanisch.', 'Klingt übertrieben – und „perfectly“ wäre die richtige Form.', '¿En serio? ¿Hablamos entonces?'),
      ]),
    ],
    ['Good to bump into you! Take care.', 'Schön, dich zu treffen! Mach’s gut.'],
    'Wenn du jemanden nicht erkennst: „Sorry, remind me where we know each other from?“ – höflich und ehrlich.'),

  // ---------- Situationen mit Ziel ----------
  dlg('en.st.01', 'en.situation', 'en.order', 1, 'Café in London', '☕', { name: 'Barista', emoji: '🧑‍🍳' },
    'Bestelle ein Getränk, nimm es mit und bezahle.',
    [
      s('Hi there! What can I get you?', 'Hallo! Was darf es sein?', [
        a2('Could I have a flat white, please?', 'Könnte ich bitte einen Flat White haben?', 'Sure. To have in or take away?', 'Klar. Hier trinken oder mitnehmen?', { getraenk: 'flat white' }),
        a1('I want a flat white.', 'Ich will einen Flat White.', '„I want“ klingt fordernd. „Could I have …, please?“ ist der Standard.', 'Right… in or take away?'),
        a0('Give me a coffee.', 'Gib mir einen Kaffee.', 'Ohne „please“ und im Befehlston – das wirkt unhöflich.', 'Erm… what kind of coffee?'),
      ]),
      s('To have in or take away?', 'Hier trinken oder mitnehmen?', [
        a2('Take away, please.', 'Zum Mitnehmen, bitte.', 'No problem. Anything else?', 'Kein Problem. Sonst noch etwas?'),
        a1('To go.', 'Zum Mitnehmen.', 'In den USA sagt man „to go“, in Großbritannien meist „take away“.', 'Take away, got it. Anything else?'),
        a0('Yes, please.', 'Ja, bitte.', 'Die Frage hat zwei Möglichkeiten – „yes“ passt hier nicht.', 'Sorry – in or away?'),
      ]),
      s('Anything else?', 'Sonst noch etwas?', [
        a2('No, that’s all, thanks.', 'Nein, das war’s, danke.', 'That’s three sixty, please.', 'Das macht 3,60, bitte.'),
        a1('No, thank you, that is everything.', 'Nein danke, das ist alles.', 'Etwas lang – „That’s all, thanks“ reicht völlig.', 'Three sixty, please.'),
        a0('I don’t know.', 'Ich weiß nicht.', 'Kurz entscheiden hilft – der Laden ist voll.', 'Take your time… but there’s a queue.'),
      ]),
      s('That’s three sixty, please.', 'Das macht 3,60, bitte.', [
        a2('Can I pay by card?', 'Kann ich mit Karte zahlen?', 'Of course. Tap whenever you’re ready.', 'Natürlich. Einfach auflegen.'),
        a1('I pay with the card.', 'Ich zahle mit der Karte.', 'Verständlich – „Can I pay by card?“ ist die übliche Frage.', 'Sure, go ahead.'),
        a0('Three sixty? That is expensive.', 'Drei sechzig? Das ist teuer.', 'Über den Preis zu klagen ist unüblich – und hilft nicht weiter.', 'That’s London, I’m afraid.'),
      ]),
    ],
    ['Here’s your {getraenk}. Have a good day!', 'Hier ist dein {getraenk}. Schönen Tag noch!'],
    '„Could I have …, please?“ öffnet in Großbritannien jede Bestellung – „I want“ klingt dagegen fordernd.'),

  dlg('en.st.02', 'en.situation', 'en.shop', 2, 'Kleidergeschäft', '🛍️', { name: 'Verkäuferin', emoji: '👩‍💼' },
    'Tausche den Pullover gegen eine größere Größe.',
    [
      s('Hi, can I help you at all?', 'Hallo, kann ich Ihnen helfen?', [
        a2('Yes, please. I bought this jumper yesterday, but it’s too small.', 'Ja, gern. Ich habe diesen Pullover gestern gekauft, aber er ist zu klein.', 'No problem. Have you got the receipt?', 'Kein Problem. Haben Sie den Kassenbon?'),
        a1('Yes. This pullover is too small for me.', 'Ja. Dieser Pullover ist mir zu klein.', 'In Großbritannien heißt er „jumper“, „pullover“ versteht man aber.', 'Let’s see – do you have the receipt?'),
        a0('No, thank you.', 'Nein, danke.', 'Damit geht sie wieder – und du stehst mit dem Pullover da.', 'Alright, just shout if you need anything.'),
      ]),
      s('Have you got the receipt?', 'Haben Sie den Kassenbon?', [
        a2('Yes, here you are.', 'Ja, hier bitte.', 'Lovely. Would you like a refund or a different size?', 'Super. Möchten Sie das Geld zurück oder eine andere Größe?'),
        a1('Yes, I have it here.', 'Ja, ich habe ihn hier.', 'Passt – beim Überreichen sagt man meist „Here you are“.', 'Thanks. Refund or exchange?'),
        a0('What is a receipt?', 'Was ist ein Kassenbon?', 'Nachfragen ist erlaubt – hier kostet es aber Zeit: receipt = Kassenbon.', 'The proof of purchase – the little paper?'),
      ]),
      s('Would you like a refund or a different size?', 'Möchten Sie das Geld zurück oder eine andere Größe?', [
        a2('A different size, please. Do you have it in a medium?', 'Eine andere Größe, bitte. Haben Sie ihn in M?', 'Let me check in the back.', 'Ich schaue im Lager nach.'),
        a1('I want size medium.', 'Ich will Größe M.', '„Do you have it in a medium?“ klingt freundlicher.', 'I’ll check.'),
        a0('I want my money and also the jumper.', 'Ich will mein Geld und auch den Pullover.', 'Das geht natürlich nicht – eins von beidem.', 'Erm… it’s one or the other, I’m afraid.'),
      ]),
      s('You’re in luck – here’s a medium.', 'Sie haben Glück – hier ist ein M.', [
        a2('Brilliant, thank you so much.', 'Klasse, vielen Dank.', 'You’re welcome. Have a nice day!', 'Gern geschehen. Schönen Tag!'),
        a1('Okay. Thank you.', 'Okay. Danke.', 'Geht – ein bisschen Wärme („Brilliant, thanks!“) kommt gut an.', 'No worries.'),
        a0('Finally.', 'Endlich.', 'Das wirkt genervt, obwohl sie dir geholfen hat.', 'Erm… you’re welcome.'),
      ]),
    ],
    undefined,
    'Im Laden gilt: „Have you got …?“ und „Could I …?“ statt „I want“. Und „Here you are“, wenn du etwas überreichst.'),

  dlg('en.st.03', 'en.situation', 'en.travel', 2, 'Check-in am Flughafen', '✈️', { name: 'Mitarbeiter', emoji: '🧑‍✈️' },
    'Checke ein, gib den Koffer auf und frag nach dem Gate.',
    [
      s('Good morning. Where are you flying to today?', 'Guten Morgen. Wohin fliegen Sie heute?', [
        a2('Good morning. To Berlin, on the eleven o’clock flight.', 'Guten Morgen. Nach Berlin, mit dem Elf-Uhr-Flug.', 'Lovely. Passport, please.', 'Sehr gut. Reisepass, bitte.'),
        a1('Berlin.', 'Berlin.', 'Reicht – ein ganzer Satz wirkt freundlicher.', 'Thank you. Passport, please.'),
        a0('I don’t know yet.', 'Ich weiß noch nicht.', 'Beim Check-in braucht man das Ziel – sonst geht es nicht weiter.', 'You’ll need to know, I’m afraid!'),
      ]),
      s('Passport, please. Are you checking in any bags?', 'Reisepass, bitte. Geben Sie Gepäck auf?', [
        a2('Just this one, please.', 'Nur diesen einen, bitte.', 'Pop it on the belt for me. It’s nineteen kilos – that’s fine.', 'Stellen Sie ihn aufs Band. 19 Kilo – das passt.'),
        a1('Yes, one bag I check in.', 'Ja, einen Koffer gebe ich auf.', 'Fast: „Yes, just one bag.“', 'On the belt, please.'),
        a0('No, I have nothing.', 'Nein, ich habe nichts.', 'Dann bliebe dein Koffer hier – hier war „just this one“ gemeint.', 'And this suitcase is…?'),
      ]),
      s('Would you like a window or an aisle seat?', 'Möchten Sie Fenster oder Gang?', [
        a2('A window seat, if possible.', 'Einen Fensterplatz, wenn möglich.', 'Done – 14A. Boarding is at half ten.', 'Erledigt – 14A. Boarding um halb elf.'),
        a1('Window, please.', 'Fenster, bitte.', 'Passt genauso.', 'Window it is – 14A.'),
        a0('I want to sit next to the toilet.', 'Ich will neben der Toilette sitzen.', 'Ungewöhnlich – und meist nicht wählbar.', 'Erm… I can’t promise that.'),
      ]),
      s('Anything else I can help with?', 'Kann ich sonst noch helfen?', [
        a2('Yes – which gate is it, please?', 'Ja – von welchem Gate geht es, bitte?', 'Gate 22, but do check the screens.', 'Gate 22, schauen Sie aber auf die Anzeigen.'),
        a1('Where is the gate?', 'Wo ist das Gate?', 'Mit „please“ klingt es freundlicher.', 'Gate 22.'),
        a0('No, thanks.', 'Nein, danke.', 'Dann fehlt dir das Gate – genau dein Ziel.', 'Have a good flight!'),
      ]),
    ],
    ['Have a good flight!', 'Guten Flug!'],
    'Am Schalter helfen kurze, klare Sätze – und „please“ am Ende jeder Bitte.'),

  dlg('en.st.04', 'en.situation', 'en.hotel', 2, 'Hotelempfang', '🏨', { name: 'Rezeption', emoji: '🛎️' },
    'Checke ein und finde heraus, wann es Frühstück gibt.',
    [
      s('Good evening! Do you have a reservation?', 'Guten Abend! Haben Sie eine Reservierung?', [
        a2('Yes, under the name Schneider.', 'Ja, auf den Namen Schneider.', 'Here it is – two nights, single room.', 'Hier ist sie – zwei Nächte, Einzelzimmer.'),
        a1('Yes. My name is Schneider.', 'Ja. Mein Name ist Schneider.', 'Passt – „under the name …“ ist die übliche Wendung.', 'Found you.'),
        a0('No.', 'Nein.', 'Dann wird es teuer – du hast aber gebucht.', 'Oh? Let me check if we have anything free…'),
      ]),
      s('Could I see your passport, please?', 'Könnte ich bitte Ihren Reisepass sehen?', [
        a2('Of course, here you are.', 'Natürlich, hier bitte.', 'Thank you. Room 214, second floor.', 'Danke. Zimmer 214, zweiter Stock.'),
        a1('Yes, I have it here somewhere.', 'Ja, ich habe ihn hier irgendwo.', 'Geht – „Here you are“ beim Überreichen.', 'No rush.'),
        a0('Why do you need that?', 'Wozu brauchen Sie den?', 'Beim Einchecken ist das üblich – Nachfragen wirkt misstrauisch.', 'It’s standard for registration, sir.'),
      ]),
      s('Anything else before I let you go?', 'Noch etwas, bevor ich Sie gehen lasse?', [
        a2('Yes – what time is breakfast served?', 'Ja – wann gibt es Frühstück?', 'From seven until ten, in the room behind you.', 'Von sieben bis zehn, im Raum hinter Ihnen.'),
        a1('When is the breakfast?', 'Wann ist das Frühstück?', 'Verständlich – „What time is breakfast?“ klingt natürlicher.', 'Seven till ten.'),
        a0('No, good night.', 'Nein, gute Nacht.', 'Dann weißt du morgen nicht, wann es Frühstück gibt.', 'Sleep well!'),
      ]),
      s('Would you like a wake-up call?', 'Möchten Sie geweckt werden?', [
        a2('No, thanks – I’ll set an alarm.', 'Nein danke – ich stelle mir einen Wecker.', 'Very good. Enjoy your stay!', 'Sehr gut. Angenehmen Aufenthalt!'),
        a1('No. I have a phone.', 'Nein. Ich habe ein Handy.', 'Etwas knapp, aber verständlich.', 'Right you are.'),
        a0('Yes, at three in the morning.', 'Ja, um drei Uhr nachts.', 'Sicher? Das klingt nach einem Versehen.', 'Three… a.m.? Are you sure?'),
      ]),
    ],
    ['Enjoy your stay!', 'Angenehmen Aufenthalt!'],
    'Im Hotel läuft fast alles über zwei Wendungen: „under the name …“ und „What time is …?“'),

  dlg('en.st.05', 'en.situation', 'en.directions', 1, 'Auf der Straße', '🗺️', { name: 'Passant', emoji: '🧓' },
    'Frag nach dem Weg zum Bahnhof – und bedanke dich.',
    [
      s('You look a bit lost – can I help?', 'Sie sehen etwas verloren aus – kann ich helfen?', [
        a2('Yes, please. How do I get to the station?', 'Ja, gern. Wie komme ich zum Bahnhof?', 'Straight on, then take the second left.', 'Geradeaus, dann die zweite links.'),
        a1('Where is the station?', 'Wo ist der Bahnhof?', 'Verständlich – „How do I get to …?“ fragt nach dem Weg, nicht nur nach dem Ort.', 'Straight on and second left.'),
        a0('No, I know everything.', 'Nein, ich weiß alles.', 'Schade – Hilfe war angeboten.', 'Suit yourself!'),
      ]),
      s('Straight on, then take the second left.', 'Geradeaus, dann die zweite links.', [
        a2('Second left – got it. Is it far?', 'Zweite links – verstanden. Ist es weit?', 'Five minutes, no more.', 'Fünf Minuten, nicht mehr.'),
        a1('Okay. Thank you.', 'Okay. Danke.', 'Passt – kurz wiederholen hilft, es sich zu merken.', 'You’re welcome.'),
        a0('Can you repeat slowly in German?', 'Können Sie es langsam auf Deutsch wiederholen?', 'Auf Englisch bitten: „Sorry, could you say that again, please?“', 'I’m afraid I don’t speak German!'),
      ]),
      s('It’s five minutes, no more.', 'Fünf Minuten, nicht mehr.', [
        a2('Brilliant – thanks a lot for your help.', 'Super – vielen Dank für die Hilfe.', 'No trouble at all. Safe travels!', 'Gern geschehen. Gute Reise!'),
        a1('Thank you very much.', 'Vielen Dank.', 'Passt immer.', 'You’re welcome.'),
        a0('Are you sure?', 'Sind Sie sicher?', 'Das klingt misstrauisch gegenüber jemandem, der gerade hilft.', 'I’ve lived here forty years!'),
      ]),
    ],
    undefined,
    '„How do I get to …?“ ist die Standardfrage nach dem Weg – „Where is …?“ fragt nur nach dem Ort.'),

  dlg('en.st.06', 'en.situation', 'en.polite', 3, 'Im Büro', '💼', { name: 'Laura', emoji: '👩‍💼' },
    'Bitte Laura um Hilfe bei der Präsentation – ohne zu drängen.',
    [
      s('Hiya, you wanted to see me?', 'Hi, du wolltest mich sprechen?', [
        a2('Yes – have you got a minute?', 'Ja – hast du kurz Zeit?', 'Sure, what’s up?', 'Klar, was gibt’s?'),
        a1('Yes, I need your help now.', 'Ja, ich brauche jetzt deine Hilfe.', '„Now“ klingt nach Druck. „Have you got a minute?“ lässt ihr die Wahl.', 'Erm, okay…'),
        a0('You have to help me.', 'Du musst mir helfen.', 'Klingt wie ein Befehl – das kommt selten gut an.', 'Do I, now?'),
      ]),
      s('Sure, what’s up?', 'Klar, was gibt’s?', [
        a2('Would you mind having a look at my slides before Friday?', 'Würdest du dir vor Freitag meine Folien ansehen?', 'Happy to. Send them over.', 'Gern. Schick sie rüber.'),
        a1('Please look at my slides.', 'Bitte schau dir meine Folien an.', 'Verständlich – „Would you mind …?“ ist die höfliche Form.', 'Sure, send them.'),
        a0('Your feedback last time was not good.', 'Dein Feedback war letztes Mal nicht gut.', 'Ein Vorwurf ist ein schlechter Anfang für eine Bitte.', 'Erm… sorry to hear that.'),
      ]),
      s('Happy to. When do you need them back?', 'Gern. Bis wann brauchst du sie zurück?', [
        a2('Thursday would be great, if that works for you.', 'Donnerstag wäre super, wenn das für dich passt.', 'Thursday’s fine.', 'Donnerstag passt.'),
        a1('Tomorrow.', 'Morgen.', 'Sehr knapp – ein „if that works for you“ macht es freundlicher.', 'That’s tight, but okay.'),
        a0('As fast as possible.', 'So schnell wie möglich.', 'Ohne Termin bleibt es vage – und klingt drängend.', 'Which is… when?'),
      ]),
    ],
    ['No problem. Send them whenever you’re ready.', 'Kein Problem. Schick sie, wenn du so weit bist.'],
    '„Would you mind …?“ und „if that works for you“ machen aus einer Forderung eine Bitte.'),

  dlg('en.st.07', 'en.situation', 'en.apology', 4, 'Im Restaurant', '🍽️', { name: 'Kellner', emoji: '🧑‍🍳' },
    'Sag freundlich Bescheid, dass das Essen kalt ist – und finde eine Lösung.',
    [
      s('Is everything alright with your meal?', 'Ist alles in Ordnung mit Ihrem Essen?', [
        a2('Actually, I’m afraid it’s a bit cold.', 'Ehrlich gesagt ist es leider etwas kalt.', 'Oh, I’m so sorry. Shall I take it back?', 'Oh, das tut mir leid. Soll ich es zurücknehmen?'),
        a1('No. The food is cold.', 'Nein. Das Essen ist kalt.', 'Verständlich – „I’m afraid …“ macht die Kritik weicher.', 'Sorry about that.'),
        a0('This is terrible, I want to speak to the manager.', 'Das ist furchtbar, ich will den Chef sprechen.', 'Viel zu scharf für ein kaltes Essen – erst freundlich ansprechen.', 'Erm… let me get you a fresh plate first?'),
      ]),
      s('Shall I take it back and bring you a fresh one?', 'Soll ich es zurückbringen und ein frisches holen?', [
        a2('That would be great, thank you.', 'Das wäre super, danke.', 'Won’t be long.', 'Dauert nicht lange.'),
        a1('Yes, do that.', 'Ja, machen Sie das.', 'Klingt knapp – ein „thank you“ wirkt Wunder.', 'Right away.'),
        a0('No, it doesn’t matter.', 'Nein, egal.', 'Damit bleibst du beim kalten Essen sitzen.', 'Are you sure? I’m happy to change it.'),
      ]),
      s('Here you are – sorry again about that.', 'Hier bitte – nochmals Entschuldigung.', [
        a2('No worries at all – thanks for sorting it.', 'Überhaupt kein Problem – danke fürs Kümmern.', 'Enjoy your meal!', 'Guten Appetit!'),
        a1('It is okay.', 'Es ist okay.', 'Geht – „No worries“ klingt natürlicher.', 'Enjoy!'),
        a0('Next time do it right.', 'Nächstes Mal macht es richtig.', 'Er hat sich gerade entschuldigt – das ist unnötig hart.', 'Erm… enjoy your meal.'),
      ]),
    ],
    undefined,
    'Kritik packt man im Englischen in Watte: „Actually, I’m afraid it’s a bit cold.“ Das wirkt höflich und wird trotzdem verstanden.'),
]
