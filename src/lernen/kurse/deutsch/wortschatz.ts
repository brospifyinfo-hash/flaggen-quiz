// 🇩🇪 Deutsch – Inhalte für Wort im Kontext, Stil-Upgrade, Expertenwortschatz und Register-Sortierer.
// Wörter werden nicht übersetzt, sondern im Zusammenhang gelernt: Bedeutung, Register, Gebrauch.
import type { KarteItem, PaarItem, Stufe, WahlItem } from '../../typen'
import { optionen } from '../werkzeug'

// ---------- Wort im Kontext ----------

function k(id: string, ziel: string, stufe: Stufe, satz: string, liste: string[], erklaerung?: string, kontext?: string): WahlItem {
  return {
    id,
    spiel: 'de.kontext',
    art: 'wahl',
    ziel,
    stufe,
    satz,
    optionen: optionen(liste),
    ...(erklaerung ? { erklaerung } : {}),
    ...(kontext ? { kontext } : {}),
  }
}

export const KONTEXT: WahlItem[] = [
  // Verben
  k('de.ko.01', 'de.verben', 2, 'Die Argumentation des Autors ___ seine ursprüngliche These: Am Ende spricht fast alles gegen sie.', [
    'konterkariert::konterkarieren = durch Gegenwirkung zunichtemachen.',
    'impliziert::implizieren = etwas mit einschließen – hier ist das Gegenteil gemeint.',
    'präzisiert::präzisieren = genauer fassen, nicht widerlegen.',
    'subsumiert::subsumieren = unter einen Oberbegriff fassen.',
  ]),
  k('de.ko.02', 'de.verben', 2, 'Mit seiner spitzen Frage ___ er, der Kollege habe die Zahlen geschönt – ohne es offen auszusprechen.', [
    'insinuiert::insinuieren = jemandem versteckt etwas Negatives unterstellen.',
    'impliziert::implizieren = logisch mit einschließen; meist mit einer Sache als Subjekt (Die Aussage impliziert …).',
    'intendiert::intendieren = beabsichtigen.',
    'antizipiert::antizipieren = vorwegnehmen.',
  ]),
  k('de.ko.03', 'de.verben', 3, 'Die neue Studie ___ die bisherigen Ergebnisse: Unter anderen Bedingungen fallen die Effekte deutlich kleiner aus.', [
    'relativiert::relativieren = in seiner Geltung einschränken.',
    'falsifiziert::falsifizieren = als falsch nachweisen – zu stark, die Effekte gibt es ja noch.',
    'verifiziert::verifizieren = bestätigen – das Gegenteil.',
    'kaschiert::kaschieren = verbergen.',
  ]),
  k('de.ko.04', 'de.verben', 3, 'Unter dem Begriff „Mobilität“ ___ die Studie Fußwege, Radfahrten und den Nahverkehr.', [
    'subsumiert::subsumieren = unter einen Oberbegriff fassen.',
    'differenziert::differenzieren = Unterschiede herausarbeiten – das Gegenteil von Zusammenfassen.',
    'tangiert::tangieren = berühren, betreffen.',
    'separiert::separieren = absondern, trennen.',
  ]),
  k('de.ko.05', 'de.verben', 3, 'Wir müssen die Zielgruppe genauer ___: Junge Familien und Rentner haben völlig andere Bedürfnisse.', [
    'differenzieren::differenzieren = Unterschiede genau beachten.',
    'subsumieren::subsumieren = zusammenfassen – hier sollen die Gruppen gerade getrennt werden.',
    'nivellieren::nivellieren = Unterschiede einebnen.',
    'relativieren::relativieren = in der Geltung einschränken.',
  ]),
  k('de.ko.06', 'de.verben', 4, 'Die Autorin ___ die Einwände ihrer Kritiker und entkräftet sie, bevor sie überhaupt erhoben werden.', [
    'antizipiert::antizipieren = vorwegnehmen, vorausahnen.',
    'rekapituliert::rekapitulieren = zusammenfassend wiederholen – setzt voraus, dass es schon gesagt wurde.',
    'repliziert::replizieren = erwidern oder (in der Forschung) wiederholen.',
    'ignoriert::Wer Einwände ignoriert, entkräftet sie nicht.',
  ]),
  k('de.ko.07', 'de.verben', 4, 'Die Behörde will den genauen Hergang zunächst ___, bevor sie entscheidet.', [
    'eruieren::eruieren = ermitteln, herausfinden.',
    'evozieren::evozieren = hervorrufen (Bilder, Gefühle).',
    'exekutieren::exekutieren = vollstrecken.',
    'echauffieren::sich echauffieren = sich aufregen.',
  ]),
  k('de.ko.08', 'de.verben', 4, 'Das Gutachten ___ lediglich, dass Mängel vorliegen – eine Bewertung nimmt es nicht vor.', [
    'konstatiert::konstatieren = feststellen.',
    'postuliert::postulieren = als gültig annehmen oder fordern.',
    'prognostiziert::prognostizieren = vorhersagen.',
    'suggeriert::suggerieren = etwas unterschwellig nahelegen.',
  ]),
  k('de.ko.09', 'de.verben', 3, 'Die alte Melodie ___ bei vielen Zuhörern Erinnerungen an ihre Kindheit.', [
    'evoziert::evozieren = hervorrufen, wachrufen.',
    'eruiert::eruieren = ermitteln.',
    'revidiert::revidieren = nach Prüfung ändern.',
    'rezipiert::rezipieren = aufnehmen, verstehen (Texte, Werke).',
  ]),
  k('de.ko.10', 'de.verben', 4, 'Nach den neuen Daten musste das Institut seine Prognose ___.', [
    'revidieren::revidieren = nach Prüfung korrigieren.',
    'rezipieren::rezipieren = aufnehmen, verstehen.',
    'reüssieren::reüssieren = Erfolg haben.',
    'repetieren::repetieren = wiederholen.',
  ]),
  k('de.ko.11', 'de.verben', 5, 'Die Theorie ___ ein bislang unbekanntes Teilchen – nachgewiesen ist es noch nicht.', [
    'postuliert::postulieren = als gegeben annehmen, ohne es schon beweisen zu können.',
    'konstatiert::konstatieren = feststellen – das hieße, es sei schon belegt.',
    'falsifiziert::falsifizieren = widerlegen.',
    'kolportiert::kolportieren = ein Gerücht verbreiten.',
  ]),
  k('de.ko.12', 'de.verben', 2, 'Die Kürzung ___ unsere Abteilung nur am Rande – die Nachbarabteilung trifft sie hart.', [
    'tangiert::tangieren = berühren, betreffen.',
    'toleriert::tolerieren = dulden.',
    'taxiert::taxieren = schätzen.',
    'tradiert::tradieren = überliefern.',
  ]),
  // Adjektive
  k('de.ko.13', 'de.adjektive', 2, 'Seine Antwort war ___: Er sagte nur „Nein“ und ging.', [
    'lapidar::lapidar = knapp, schlicht, ohne Ausschmückung.',
    'eloquent::eloquent = redegewandt – das Gegenteil.',
    'ambivalent::ambivalent = zwiespältig.',
    'redundant::redundant = überflüssig, doppelt.',
  ]),
  k('de.ko.14', 'de.adjektive', 2, 'Sie hat ___ Gefühle gegenüber ihrem alten Job: Sie vermisst die Kollegen, aber nicht den Stress.', [
    'ambivalente::ambivalent = zwiespältig, zugleich positiv und negativ.',
    'ambitionierte::ambitioniert = ehrgeizig.',
    'adäquate::adäquat = angemessen.',
    'akute::akut = dringend, plötzlich auftretend.',
  ]),
  k('de.ko.15', 'de.adjektive', 3, 'Das Faxgerät ist inzwischen ___ – kaum jemand benutzt es noch.', [
    'obsolet::obsolet = überholt, nicht mehr gebräuchlich.',
    'obskur::obskur = dunkel, zweifelhaft.',
    'obligat::obligat = unerlässlich, üblich.',
    'opportun::opportun = angebracht, günstig.',
  ]),
  k('de.ko.16', 'de.adjektive', 3, 'Die Kritik war scharf, aber ___: Sie traf den Kern in wenigen Sätzen.', [
    'prägnant::prägnant = treffend und knapp.',
    'prätentiös::prätentiös = gewollt anspruchsvoll, anmaßend.',
    'plakativ::plakativ = grob vereinfachend, auf Wirkung angelegt.',
    'pedantisch::pedantisch = übertrieben genau.',
  ]),
  k('de.ko.17', 'de.adjektive', 3, 'Die finanzielle Lage des Vereins ist ___: Ohne neue Mitglieder droht die Auflösung.', [
    'prekär::prekär = heikel, unsicher, gefährdet.',
    'pragmatisch::pragmatisch = sachbezogen, praktisch.',
    'präzise::präzise = genau.',
    'profan::profan = alltäglich, weltlich.',
  ]),
  k('de.ko.18', 'de.adjektive', 4, 'Die Beweisführung ist ___: Jeder Schritt folgt zwingend aus dem vorigen.', [
    'stringent::stringent = streng folgerichtig.',
    'sukzessiv::sukzessiv = nach und nach – sagt nichts über Logik.',
    'subtil::subtil = fein, unterschwellig.',
    'stupend::stupend = erstaunlich.',
  ]),
  k('de.ko.19', 'de.adjektive', 4, 'Der Unterschied zwischen den beiden Fassungen ist ___, aber für Fachleute entscheidend.', [
    'subtil::subtil = fein, kaum wahrnehmbar.',
    'eklatant::eklatant = offenkundig, krass – das Gegenteil.',
    'marginal::marginal = unbedeutend – widerspricht „entscheidend“.',
    'latent::latent = verborgen vorhanden.',
  ]),
  k('de.ko.20', 'de.adjektive', 4, 'Die Mängel sind ___ – das sieht jeder auf den ersten Blick.', [
    'eklatant::eklatant = offenkundig, auffällig.',
    'subtil::subtil = fein – das Gegenteil.',
    'latent::latent = verborgen.',
    'sublim::sublim = fein, erhaben.',
  ]),
  k('de.ko.21', 'de.adjektive', 5, 'Smartphones sind heute ___ – man findet sie in jedem Winkel der Welt.', [
    'ubiquitär::ubiquitär = überall verbreitet, allgegenwärtig.',
    'utopisch::utopisch = unerfüllbar, fantastisch.',
    'unilateral::unilateral = einseitig.',
    'urban::urban = städtisch.',
  ]),
  k('de.ko.22', 'de.adjektive', 4, 'Eine ___ Lösung wäre, den Termin einfach um eine Woche zu verschieben.', [
    'pragmatische::pragmatisch = sachbezogen, praktisch.',
    'dogmatische::dogmatisch = starr an Lehrsätzen festhaltend.',
    'prätentiöse::prätentiös = gewollt anspruchsvoll.',
    'pathetische::pathetisch = übertrieben feierlich.',
  ]),
  k('de.ko.23', 'de.adjektive', 5, 'Die Gefahr war lange ___ vorhanden, bevor sie plötzlich sichtbar wurde.', [
    'latent::latent = verborgen vorhanden.',
    'manifest::manifest = offenkundig – das Gegenteil.',
    'virulent::virulent = akut, heftig wirkend.',
    'marginal::marginal = geringfügig.',
  ]),
  k('de.ko.24', 'de.adjektive', 5, 'Das Thema ist derzeit äußerst ___ – es beherrscht seit Wochen die Debatte.', [
    'virulent::virulent = akut, drängend, heftig.',
    'latent::latent = verborgen – hier ist es gerade sehr sichtbar.',
    'obsolet::obsolet = überholt.',
    'redundant::redundant = überflüssig.',
  ]),
  // Nomen
  k('de.ko.25', 'de.nomen', 2, 'Zwischen dem Versprechen und der Umsetzung besteht eine deutliche ___.', [
    'Diskrepanz::Diskrepanz = Missverhältnis, Widerspruch.',
    'Diskretion::Diskretion = Verschwiegenheit.',
    'Distinktion::Distinktion = Unterscheidung, Vornehmheit.',
    'Dissertation::Dissertation = Doktorarbeit.',
  ]),
  k('de.ko.26', 'de.nomen', 3, 'Die ___ seiner Argumentation lautet: Alle Menschen handeln rational.', [
    'Prämisse::Prämisse = Voraussetzung, aus der ein Schluss gezogen wird.',
    'Prämie::Prämie = Belohnung, Zahlung.',
    'Präferenz::Präferenz = Vorliebe.',
    'Prognose::Prognose = Vorhersage.',
  ]),
  k('de.ko.27', 'de.nomen', 3, 'Die Klausel erlaubt zwei Lesarten – diese ___ sollte der Vertrag vermeiden.', [
    'Ambiguität::Ambiguität = Mehrdeutigkeit eines Ausdrucks.',
    'Ambivalenz::Ambivalenz = innere Zwiespältigkeit von Gefühlen oder Bewertungen – nicht von Formulierungen.',
    'Ambition::Ambition = Ehrgeiz.',
    'Amplitude::Amplitude = Schwingungsweite.',
  ]),
  k('de.ko.28', 'de.nomen', 3, 'Nach langer Debatte erzielte das Gremium einen ___.', [
    'Konsens::Konsens = Übereinstimmung.',
    'Dissens::Dissens = Meinungsverschiedenheit – das Gegenteil.',
    'Kontext::Kontext = Zusammenhang.',
    'Konsum::Konsum = Verbrauch.',
  ]),
  k('de.ko.29', 'de.nomen', 4, 'Dass Eisverkauf und Sonnenbrand gemeinsam steigen, ist eine ___, keine Kausalität.', [
    'Korrelation::Korrelation = statistischer Zusammenhang ohne Ursache-Wirkung.',
    'Kollision::Kollision = Zusammenstoß.',
    'Konvergenz::Konvergenz = Annäherung.',
    'Koalition::Koalition = Bündnis.',
  ]),
  k('de.ko.30', 'de.nomen', 4, 'Mehr Personal in der Pflege bleibt ein dringendes ___ der Gesundheitspolitik.', [
    'Desiderat::Desiderat = etwas Erwünschtes, das noch fehlt.',
    'Diktat::Diktat = etwas Aufgezwungenes.',
    'Dementi::Dementi = offizielles Bestreiten.',
    'Destillat::Destillat = Ergebnis einer Destillation.',
  ]),
  k('de.ko.31', 'de.nomen', 5, 'Mit dem Urteil schuf das Gericht einen ___, auf den sich künftige Verfahren berufen werden.', [
    'Präzedenzfall::Präzedenzfall = Fall, der für künftige Entscheidungen maßgeblich ist.',
    'Paradefall::Paradefall = Musterbeispiel – aber nicht rechtlich bindend.',
    'Präventivfall::Das Wort gibt es so nicht.',
    'Sündenfall::Sündenfall = folgenschwerer Fehltritt.',
  ]),
  k('de.ko.32', 'de.nomen', 5, 'Der ___ des Romans ist nüchtern und distanziert.', [
    'Duktus::Duktus = charakteristische Art des Schreibens, Stil.',
    'Tenor::Tenor = Grundhaltung, Kernaussage – nicht die Art des Schreibens.',
    'Diktum::Diktum = bekannter Ausspruch.',
    'Habitus::Habitus = Auftreten, Haltung einer Person.',
  ]),
  // Kollokationen
  k('de.ko.33', 'de.kollokation', 2, 'Die Versicherung muss für den Schaden ___.', [
    'aufkommen::Für etwas aufkommen = es bezahlen.',
    'aufgehen::Aufgehen = sich öffnen oder aufgebraucht werden.',
    'auftreten::Auftreten = erscheinen, vorkommen.',
    'aufstehen::Aufstehen = sich erheben.',
  ]),
  k('de.ko.34', 'de.kollokation', 2, 'Diesen Punkt möchte ich in der nächsten Sitzung zur ___ bringen.', [
    'Sprache::Etwas zur Sprache bringen = es ansprechen.',
    'Geltung::Etwas zur Geltung bringen = es wirkungsvoll zeigen.',
    'Rede::Jemanden zur Rede stellen = ihn zur Verantwortung ziehen.',
    'Welt::Zur Welt bringen = gebären.',
  ]),
  k('de.ko.35', 'de.kollokation', 3, 'Der Anwalt hat gegen das Urteil Einspruch ___.', [
    'eingelegt::Einspruch einlegen (oder erheben).',
    'gestellt::Einen Antrag stellt man – Einspruch legt man ein.',
    'gemacht::„Einspruch machen“ ist keine feste Verbindung.',
    'getan::„Einspruch tun“ gibt es nicht.',
  ]),
  k('de.ko.36', 'de.kollokation', 3, 'Die Kommission will die Vorwürfe ___ prüfen.', [
    'eingehend::eingehend = gründlich, ausführlich.',
    'eingängig::eingängig = leicht verständlich, einprägsam.',
    'einträglich::einträglich = gewinnbringend.',
    'einsilbig::einsilbig = wortkarg.',
  ]),
  k('de.ko.37', 'de.kollokation', 4, 'Mehrere Abgeordnete haben gegen den Entwurf Bedenken ___.', [
    'angemeldet::Bedenken anmelden (oder äußern).',
    'angestellt::Überlegungen stellt man an, Bedenken meldet man an.',
    'angebracht::„Bedenken anbringen“ ist unüblich.',
    'angetan::Angetan = begeistert.',
  ]),
  k('de.ko.38', 'de.kollokation', 4, 'Das Unternehmen will seine Marktposition in Asien weiter ___.', [
    'ausbauen::Eine Position ausbauen = verstärken.',
    'ausschöpfen::Ausschöpfen = vollständig nutzen (Potenzial, Möglichkeiten).',
    'ausheben::Ausheben = ausgraben oder auflösen (eine Bande).',
    'ausrichten::Ausrichten = veranstalten oder orientieren.',
  ]),
  // Konnektoren
  k('de.ko.39', 'de.konnektoren', 1, 'Er hat die Prüfung bestanden, ___ er kaum gelernt hatte.', [
    'obwohl::„Obwohl“ leitet einen Gegengrund ein.',
    'weil::„Weil“ nennt einen Grund – das passt nicht.',
    'sodass::„Sodass“ nennt eine Folge.',
    'indem::„Indem“ nennt ein Mittel.',
  ]),
  k('de.ko.40', 'de.konnektoren', 2, 'Er ist zwar erfahren, ___ fehlt ihm der Überblick.', [
    'doch::„Zwar …, doch/aber“ stellt zwei Aussagen gegenüber.',
    'denn::„Denn“ nennt einen Grund.',
    'sondern::„Sondern“ folgt nur auf eine Verneinung.',
    'deshalb::„Deshalb“ nennt eine Folge.',
  ]),
  k('de.ko.41', 'de.konnektoren', 3, 'Wir geben den Bericht nur frei, ___ die Zahlen stimmen.', [
    'sofern::„Sofern“ nennt eine Bedingung.',
    'sodass::„Sodass“ nennt eine Folge.',
    'obwohl::„Obwohl“ nennt einen Gegengrund.',
    'damit::„Damit“ nennt einen Zweck.',
  ]),
  k('de.ko.42', 'de.konnektoren', 4, 'Sie verbesserte ihre Aussprache, ___ sie jeden Tag Podcasts nachsprach.', [
    'indem::„Indem“ nennt das Mittel.',
    'sodass::„Sodass“ nennt eine Folge.',
    'damit::„Damit“ nennt einen Zweck.',
    'wobei::„Wobei“ fügt einen Umstand an.',
  ]),
  k('de.ko.43', 'de.konnektoren', 4, 'Die Kosten stiegen so stark, ___ das Projekt gestoppt wurde.', [
    'dass::„So …, dass“ verbindet Ursache und Folge.',
    'damit::„Damit“ nennt einen Zweck.',
    'indem::„Indem“ nennt ein Mittel.',
    'zumal::„Zumal“ nennt einen zusätzlichen Grund.',
  ]),
  k('de.ko.44', 'de.konnektoren', 5, 'Wir sollten vorsichtig sein, ___ die Datenlage noch dünn ist.', [
    'zumal::„Zumal“ = besonders da; es liefert einen zusätzlichen Grund.',
    'obgleich::„Obgleich“ = obwohl – ein Gegengrund.',
    'sodass::„Sodass“ nennt eine Folge.',
    'damit::„Damit“ nennt einen Zweck.',
  ]),
  // Relativsätze
  k('de.ko.45', 'de.relativ', 3, 'Das ist ein Thema, ___ wir uns noch lange beschäftigen werden.', [
    'mit dem::Nach einem Nomen steht „Präposition + Relativpronomen“: mit dem.',
    'womit::„Womit“ nach einem Nomen gilt als umgangssprachlich.',
    'mit das::„Mit“ verlangt den Dativ.',
    'das::Die Präposition „mit“ fehlt.',
  ]),
  k('de.ko.46', 'de.relativ', 4, 'Die Dozentin, ___ Buch alle gelesen haben, hält morgen einen Vortrag.', [
    'deren::Bezugswort feminin → Genitiv-Relativpronomen „deren“.',
    'dessen::„Dessen“ gehört zu maskulinen und neutralen Bezugswörtern.',
    'derer::„Derer“ ist Demonstrativpronomen (die Namen derer, die …).',
    'die::Vor „Buch“ braucht es den Genitiv.',
  ]),
  // Wissenschaftssprache
  k('de.ko.47', 'de.wissenschaft', 4, 'Die Ergebnisse legen ___, dass der Effekt größer ist als angenommen.', [
    'nahe::„Etwas nahelegen“ = es vermuten lassen.',
    'dar::„Darlegen“ = ausführlich erklären.',
    'fest::„Festlegen“ = bestimmen.',
    'offen::„Offenlegen“ = enthüllen.',
  ]),
  k('de.ko.48', 'de.wissenschaft', 4, 'Wie Müller (2019) zutreffend ___, lässt sich der Befund nicht verallgemeinern.', [
    'feststellt::„Zutreffend feststellen“ – ein neutrales Zitierverb.',
    'suggeriert::„Suggerieren“ unterstellt Manipulation.',
    'insinuiert::„Insinuieren“ = versteckt unterstellen.',
    'kolportiert::„Kolportieren“ = Gerüchte verbreiten.',
  ]),
  k('de.ko.49', 'de.wissenschaft', 5, 'Die Autorin räumt zwar ___, dass die Stichprobe klein ist, hält die Ergebnisse aber für belastbar.', [
    'ein::„Einräumen“ = zugeben.',
    'aus::„Ausräumen“ = beseitigen (Zweifel ausräumen).',
    'ab::„Abräumen“ = wegräumen.',
    'auf::„Aufräumen“ = Ordnung schaffen.',
  ]),
  // Register und Redewendungen
  k('de.ko.50', 'de.register', 2, 'Leider können wir Ihnen die Unterlagen erst nächste Woche ___.', [
    'zusenden::Förmlich und passend für einen Geschäftsbrief.',
    'rüberschicken::Umgangssprachlich – im Geschäftsbrief unpassend.',
    'rüberreichen::Umgangssprachlich und für Post unpassend.',
    'zuwerfen::Das wäre wörtlich zu nehmen.',
  ], undefined, 'Geschäftsbrief'),
  k('de.ko.51', 'de.idiom', 2, 'Lass uns nicht länger um den heißen ___ herumreden.', [
    'Brei::„Um den heißen Brei herumreden“ = nicht zur Sache kommen.',
    'Tee::Die Wendung heißt „Brei“.',
    'Stein::„Ein Tropfen auf den heißen Stein“ ist eine andere Wendung.',
    'Kessel::Die Wendung heißt „Brei“.',
  ]),
  k('de.ko.52', 'de.idiom', 3, 'Nach der dritten Absage warf er die Flinte ins ___.', [
    'Korn::„Die Flinte ins Korn werfen“ = vorschnell aufgeben.',
    'Feld::Die Wendung heißt „Korn“.',
    'Wasser::Die Wendung heißt „Korn“.',
    'Gras::„Ins Gras beißen“ ist eine andere Wendung.',
  ]),
  k('de.ko.53', 'de.idiom', 4, 'Mit diesem Kompromiss konnten beide Seiten ihr ___ wahren.', [
    'Gesicht::„Das Gesicht wahren“ = sich keine Blöße geben.',
    'Profil::„Profil zeigen“ ist eine andere Wendung.',
    'Haupt::„Sein Haupt erheben“ passt hier nicht.',
    'Maske::„Die Maske fallen lassen“ ist das Gegenteil.',
  ]),
  k('de.ko.74', 'de.wortwahl', 3, 'Die neue Vorschrift ___ nur für Verträge, die nach dem 1. Januar geschlossen wurden.', [
    'gilt',
    '~0.5 trifft zu::„Zutreffen“ passt zu Aussagen („Das trifft zu“), nicht zu Vorschriften.',
    'zählt::Umgangssprachlich. In einem Text steht „gilt“.',
    'wirkt::„Wirken“ heißt: Wirkung zeigen – hier geht es um den Geltungsbereich.',
  ], '„Gelten“ ist das präzise Verb für Regeln, Fristen und Preise.'),
  k('de.ko.75', 'de.stil', 3, 'Der Bericht ___ die wichtigsten Ergebnisse auf zwei Seiten.', [
    'bündelt',
    '~0.5 enthält::Richtig, sagt aber nur aus, dass etwas drinsteht.',
    'macht::Zu blass – „machen“ passt fast nie, wenn es ein genaues Verb gibt.',
    'beinhaltet::Behördendeutsch. „Enthält“ ist schlichter, „bündelt“ genauer.',
  ], 'Genaue Verben tragen die Aussage: „bündeln“ zeigt, dass etwas zusammengeführt wurde.'),
  k('de.ko.76', 'de.wortwahl', 3, 'Sie hat den Vorschlag ___, weil die Kosten zu hoch waren.', [
    'abgelehnt',
    '~0.5 zurückgewiesen::Möglich, klingt aber nach Vorwurf – als hätte der Vorschlag jemanden angegriffen.',
    'verweigert::„Verweigern“ nimmt man für Leistungen: die Aussage verweigern.',
    'verneint::„Verneinen“ bezieht sich auf Fragen, nicht auf Vorschläge.',
  ], '„Ablehnen“ ist die neutrale Form; „zurückweisen“ trägt einen Unterton.'),
  k('de.ko.77', 'de.stil', 4, 'Die Kritik ___ vor allem den zweiten Teil der Studie.', [
    'betrifft',
    '~0.5 meint::Verständlich, aber blass – und streng genommen „meinen“ Menschen etwas, nicht Kritik.',
    'angeht::„Angehen“ steht in der Wendung „was … angeht“ – nicht allein.',
    'handelt::„Handeln“ braucht „von“: Die Studie handelt von …',
  ], '„Betreffen“ verbindet eine Sache direkt mit dem, worauf sie sich bezieht – ohne Präposition.'),
]

// ---------- Stil-Upgrade ----------

function s(id: string, ziel: string, stufe: Stufe, quelle: string, richtung: string, liste: string[], erklaerung: string): WahlItem {
  return { id, spiel: 'de.stil', art: 'wahl', ziel, stufe, quelle, richtung, optionen: optionen(liste), erklaerung }
}

export const STIL: WahlItem[] = [
  s('de.st.01', 'de.register', 1, 'Der Chef hat gesagt, dass die Sache ziemlich schlecht gelaufen ist.', 'förmlich – Bericht', [
    'Der Geschäftsführer erklärte, das Projekt sei deutlich hinter den Erwartungen zurückgeblieben.',
    'Der Chef meinte, dass das Ding voll danebengegangen ist.::Umgangssprachlich.',
    'Der Geschäftsführer hat erklärt, dass die Sache in einem nicht so guten Zustand gewesen ist.::Umständlich und vage.',
    'Der Geschäftsführer erklärte, das Projekt ist schlecht gelaufen worden.::Grammatisch falsch.',
  ], 'Förmlich heißt: präzise Nomen („Projekt“ statt „Sache“), indirekte Rede im Konjunktiv, keine Füllwörter.'),
  s('de.st.02', 'de.beruf', 1, 'Wir haben Ihre Mail gekriegt und schauen uns das mal an.', 'förmlich – Kundenkorrespondenz', [
    'Vielen Dank für Ihre E-Mail. Wir prüfen Ihr Anliegen und melden uns zeitnah bei Ihnen.',
    'Ihre Mail ist angekommen, wir gucken mal.::Zu salopp für Kunden.',
    'Wir haben Ihre Mail erhalten und werden uns das mal anschauen tun.::„Tun“ als Hilfsverb ist umgangssprachlich.',
    '~0.3 Hiermit bestätigen wir den Erhalt Ihrer werten elektronischen Nachricht und werden selbige einer Prüfung unterziehen.::Korrekt, aber altertümlich und gestelzt.',
  ], 'Professionell ist freundlich, klar und konkret – ohne Umgangssprache und ohne Amtsdeutsch.'),
  s('de.st.03', 'de.stil', 2, 'Es ist so, dass wir aufgrund der Tatsache, dass die Kosten gestiegen sind, die Preise erhöhen müssen.', 'knapp', [
    'Wegen gestiegener Kosten müssen wir die Preise erhöhen.',
    'Es ist so, dass die Kosten gestiegen sind, weshalb eine Erhöhung der Preise erfolgen muss.::Immer noch umständlich.',
    'Die Preise müssen erhöht werden, weil die Kosten steigend sind.::„Steigend sind“ ist unschön.',
    'Aufgrund gestiegener Kosten ergibt sich die Notwendigkeit einer Preiserhöhungsmaßnahme.::Aufgeblähter Nominalstil.',
  ], '„Es ist so, dass“ und „aufgrund der Tatsache, dass“ sind Füllformeln – sie verlängern, ohne etwas zu sagen.'),
  s('de.st.04', 'de.nominal', 2, 'Die Durchführung der Überprüfung der Unterlagen erfolgt durch die Abteilung.', 'Verbalstil', [
    'Die Abteilung prüft die Unterlagen.',
    'Die Abteilung führt eine Überprüfung der Unterlagen durch.::Noch immer nominal.',
    'Die Unterlagen werden einer Überprüfung durch die Abteilung unterzogen.::Passiv und Nominalstil.',
    'Von der Abteilung wird die Durchführung der Prüfung übernommen.::Nominalstil.',
  ], 'Wer handelt? Die Abteilung. Was tut sie? Sie prüft. Genau das sagt der beste Satz.'),
  s('de.st.05', 'de.beruf', 3, 'Wir möchten Sie bitten, dass Sie uns Bescheid geben, ob Sie kommen.', 'förmlich und knapp', [
    'Bitte teilen Sie uns mit, ob Sie teilnehmen.',
    'Geben Sie uns bitte Bescheid, ob Sie kommen tun.::„Tun“ als Hilfsverb ist umgangssprachlich.',
    'Wir würden Sie freundlichst bitten wollen, uns eine Rückmeldung bezüglich Ihrer eventuellen Teilnahme zukommen zu lassen.::Überladen.',
    'Sag Bescheid, ob du kommst.::Falsches Register – duzt und klingt nach Chat.',
  ], 'Eine Bitte in Geschäftsbriefen: direkt, höflich, kurz.'),
  s('de.st.06', 'de.wissenschaft', 3, 'Das Ergebnis ist irgendwie total wichtig für die Forschung.', 'wissenschaftlich', [
    'Das Ergebnis ist für die Forschung von erheblicher Bedeutung.',
    'Das Ergebnis ist irgendwie sehr relevant für die Forschung.::„Irgendwie“ ist vage.',
    'Das Ergebnis ist mega wichtig für die Forschung.::Umgangssprachlich.',
    'Das Ergebnis ist von einer gewissen Wichtigkeit für die Forschung irgendwie.::Vage und verdreht.',
  ], 'Wissenschaftliche Sprache vermeidet Verstärker wie „total“ und Weichmacher wie „irgendwie“.'),
  s('de.st.07', 'de.wissenschaft', 3, 'Viele Leute sagen, dass Homeoffice die Produktivität erhöht, aber das stimmt nicht immer.', 'wissenschaftlich, vorsichtig', [
    'Häufig wird angenommen, Homeoffice steigere die Produktivität; die Befundlage ist jedoch uneinheitlich.',
    'Alle wissen, dass Homeoffice die Produktivität erhöht.::Eine unbelegte Verallgemeinerung.',
    'Homeoffice erhöht die Produktivität nicht, das ist bewiesen.::Zu absolut.',
    'Viele Leute sagen so was, aber es ist halt nicht immer so.::Umgangssprachlich.',
  ], 'Vorsichtig formulieren heißt: Annahme und Beleg trennen, nicht mehr behaupten als gezeigt ist.'),
  s('de.st.08', 'de.beruf', 4, 'Wir haben ein Problem mit der Lieferung, weil der Lieferant Mist gebaut hat.', 'professionell gegenüber Kunden', [
    'Aufgrund eines Fehlers bei unserem Zulieferer verzögert sich Ihre Lieferung leider.',
    'Unser Lieferant hat Mist gebaut, deshalb kommt die Lieferung später.::Umgangssprachlich.',
    'Die Lieferung ist verspätet. Schuld hat der Lieferant, nicht wir.::Schuldzuweisung wirkt unprofessionell.',
    'Es kam zu einer Verzögerung in Bezug auf die Lieferung aufgrund von Gründen beim Lieferanten.::Umständlich – „aufgrund von Gründen“ ist doppelt.',
  ], 'Gegenüber Kunden: Problem sachlich benennen, Folge für den Kunden nennen, keine Schuldzuweisung.'),
  s('de.st.09', 'de.stil', 4, 'Die Mitarbeiter wurden von der Geschäftsleitung informiert, dass es zu einer Umstrukturierung kommen wird.', 'aktiv und direkt', [
    'Die Geschäftsleitung informierte die Mitarbeiter über die geplante Umstrukturierung.',
    'Es erfolgte eine Information der Mitarbeiter durch die Geschäftsleitung bezüglich einer Umstrukturierung.::Nominalstil.',
    'Die Mitarbeiter wurden informiert, dass eine Umstrukturierung kommen tut.::Umgangssprachlich.',
    'Die Geschäftsleitung hat die Mitarbeiter darüber in Kenntnis gesetzt worden, dass umstrukturiert wird.::Grammatisch falsch.',
  ], 'Aktiv nennt, wer handelt – das macht Texte kürzer und klarer.'),
  s('de.st.10', 'de.stil', 4, 'Das neue Gesetz ist schlecht, weil es viele Probleme macht.', 'präzise – Kommentar', [
    'Das neue Gesetz schafft zusätzliche Bürokratie, ohne das eigentliche Problem zu lösen.',
    'Das neue Gesetz ist schlecht, weil es schlecht ist.::Zirkulär – begründet nichts.',
    'Das neue Gesetz ist irgendwie problematisch, weil es Probleme macht.::Vage und zirkulär.',
    'Das Gesetz ist voll daneben.::Umgangssprachlich und ohne Begründung.',
  ], 'Präzise heißt: konkret benennen, was schlecht ist – nicht nur bewerten.'),
  s('de.st.11', 'de.stil', 5, 'Die Firma hat im letzten Jahr mehr Geld verdient als im Jahr davor, und zwar ziemlich viel mehr.', 'präzise – Geschäftsbericht', [
    'Das Unternehmen steigerte seinen Gewinn gegenüber dem Vorjahr deutlich.',
    'Die Firma hat letztes Jahr echt viel mehr Kohle gemacht.::Umgangssprachlich.',
    'Das Unternehmen hat einen gewissen Gewinnzuwachs zu verzeichnen gehabt.::„Gewissen“ ist vage, die Form umständlich.',
    'Der Gewinn des Unternehmens stieg im letzten Jahr ziemlich viel an.::„Ziemlich viel“ ist salopp und vage.',
  ], 'Im Geschäftsbericht: Fachwort („Gewinn“, „Vorjahr“), starkes Verb, klare Aussage.'),
  s('de.st.12', 'de.stil', 5, 'Man kann sagen, dass die Methode in gewisser Weise nicht ganz unproblematisch ist.', 'klar statt verschwurbelt', [
    'Die Methode weist einige Schwächen auf.',
    'Die Methode ist in gewisser Weise gewissermaßen problematisch.::Noch schwammiger.',
    'Die Methode ist total problematisch.::Übertrieben und salopp.',
    'Es lässt sich in gewisser Hinsicht konstatieren, dass die Methode nicht ganz frei von Problemen ist.::Klingt gelehrt, sagt aber nichts klarer.',
  ], 'Doppelte Verneinung („nicht unproblematisch“) und Weichmacher („in gewisser Weise“) verschleiern die Aussage.'),
  s('de.st.13', 'de.beruf', 2, 'Hallo Herr Weber, danke für die Infos, bis dann!', 'Geschäftsbrief', [
    'Sehr geehrter Herr Weber, vielen Dank für die Informationen. Mit freundlichen Grüßen',
    'Sehr geehrter Herr Weber! Danke für die Infos. MfG::Ausrufezeichen und Abkürzung wirken nachlässig.',
    'Lieber Weber, danke für Infos, Gruß::Ohne „Herr“ unhöflich.',
    'Sehr geehrter Herr Weber, Vielen Dank für die Informationen. Mit freundlichen Grüßen,::Groß nach dem Komma und Komma nach dem Gruß sind falsch.',
  ], 'Im Geschäftsbrief: vollständige Anrede, nach dem Komma klein weiter, Grußformel ohne Satzzeichen.'),
  s('de.st.14', 'de.beruf', 3, 'Ich kann den Termin am Montag nicht, können wir das verschieben?', 'höflich und professionell', [
    'Leider kann ich den Termin am Montag nicht wahrnehmen. Wäre es möglich, ihn zu verschieben?',
    'Montag geht bei mir nicht, verschieb das bitte.::Befehlston und Duzen.',
    '~0.4 Leider ist es mir am Montag nicht möglich, den Termin wahrzunehmen, weshalb ich Sie hiermit um eine Verschiebung desselben ersuchen möchte.::Korrekt, aber gestelzt.',
    'Ich kann am Montag nicht zum Termin, können wir ihn verschieben tun?::Umgangssprachlich und falsch.',
  ], 'Höflich und professionell: Bedauern, klare Aussage, Bitte im Konjunktiv.'),
  s('de.st.15', 'de.wissenschaft', 4, 'Wir haben rausgefunden, dass das Medikament wirkt.', 'wissenschaftlich', [
    'Die Daten deuten darauf hin, dass das Medikament wirksam ist.',
    'Wir haben bewiesen, dass das Medikament zu 100 Prozent wirkt.::Überzogene Gewissheit.',
    'Rausgefunden wurde, dass das Medikament wirkt.::„Rausfinden“ ist umgangssprachlich.',
    'Es wurde herausgefunden, dass das Medikament irgendwie wirkt.::„Irgendwie“ ist vage.',
  ], 'Wissenschaftlich heißt auch: sich nicht weiter festlegen, als die Daten tragen.'),
  s('de.st.16', 'de.nominal', 3, 'Nachdem die Prüfung abgeschlossen worden war, wurde das Ergebnis veröffentlicht.', 'Nominalstil – knapp', [
    'Nach Abschluss der Prüfung wurde das Ergebnis veröffentlicht.',
    'Nach dem Abgeschlossenwerden der Prüfung wurde das Ergebnis veröffentlicht.::Holprige Substantivierung.',
    'Nach Abschließung der Prüfung erfolgte die Veröffentlichung des Ergebnisses.::„Abschließung“ ist unüblich; zu viele Nomen.',
    'Nachdem die Prüfung abgeschlossen war, wurde veröffentlicht das Ergebnis.::Falsche Wortstellung.',
  ], 'Maßvoller Nominalstil verkürzt Nebensätze: „nachdem … abgeschlossen“ → „nach Abschluss“.'),
  s('de.st.17', 'de.nominal', 4, 'Wegen der Verlängerung der Frist zur Einreichung der Anträge durch die Behörde …', 'Verbalstil – verständlich', [
    'Weil die Behörde die Frist für die Anträge verlängert hat, …',
    'Durch die Behörde erfolgte eine Verlängerung der Antragsfrist, weshalb …::Noch immer nominal.',
    'Weil die Frist zur Einreichung der Anträge durch die Behörde verlängert wurde worden ist, …::Grammatisch falsch.',
    'Wegen der Behörde, die die Anträge verlängert hat, …::Sinn verändert – verlängert wurde die Frist.',
  ], 'Eine Kette aus Genitiven („der Verlängerung der Frist zur Einreichung der Anträge“) wird verbal gleich verständlich.'),
  s('de.st.18', 'de.stil', 5, 'Die Teilnehmer, die teilgenommen haben, fanden die Veranstaltung, die im März stattfand, sehr gut und bewerteten sie positiv.', 'ohne Doppelungen', [
    'Die Teilnehmer bewerteten die Veranstaltung im März sehr positiv.',
    'Die teilnehmenden Teilnehmer bewerteten die Veranstaltung positiv.::Doppelt gemoppelt.',
    'Die Teilnehmer fanden die im März stattgefundene Veranstaltung gut und positiv.::„Stattgefundene“ ist falsch, „gut und positiv“ doppelt.',
    'Die Veranstaltung im März wurde von den Teilnehmern, die teilnahmen, positiv bewertet.::Wieder eine Doppelung.',
  ], 'Pleonasmen („Teilnehmer, die teilgenommen haben“) und doppelte Wertungen streicht man.'),
]

// ---------- Expertenwortschatz: Wort und Bedeutung ----------

function w(nr: number, ziel: string, stufe: Stufe, wort: string, bedeutung: string, beispiel: string): PaarItem {
  return {
    id: `de.w.${String(nr).padStart(2, '0')}`,
    spiel: 'de.wortschatz',
    art: 'paar',
    ziel,
    stufe,
    links: wort,
    rechts: bedeutung,
    erklaerung: beispiel,
  }
}

export const WORTSCHATZ: PaarItem[] = [
  // Verben
  w(1, 'de.verben', 2, 'implizieren', 'mit einschließen, zur Folge haben', '„Der Plan impliziert höhere Kosten.“'),
  w(2, 'de.verben', 2, 'insinuieren', 'versteckt etwas unterstellen', '„Er insinuierte, sie habe gelogen.“'),
  w(3, 'de.verben', 2, 'intendieren', 'beabsichtigen', '„Dieser Effekt war nicht intendiert.“'),
  w(4, 'de.verben', 3, 'konterkarieren', 'durch Gegenwirkung zunichtemachen', '„Die Kürzungen konterkarieren das Ziel.“'),
  w(5, 'de.verben', 3, 'subsumieren', 'unter einen Oberbegriff fassen', '„Das lässt sich unter ‚Betrug‘ subsumieren.“'),
  w(6, 'de.verben', 1, 'präzisieren', 'genauer fassen', '„Bitte präzisieren Sie Ihre Frage.“'),
  w(7, 'de.verben', 2, 'differenzieren', 'Unterschiede genau beachten', '„Man muss zwischen Ursache und Anlass differenzieren.“'),
  w(8, 'de.verben', 2, 'relativieren', 'in seiner Geltung einschränken', '„Neue Daten relativieren den Befund.“'),
  w(9, 'de.verben', 3, 'antizipieren', 'vorwegnehmen, vorausahnen', '„Sie antizipierte jeden Einwand.“'),
  w(10, 'de.verben', 4, 'evozieren', 'hervorrufen (Bilder, Gefühle)', '„Der Duft evoziert Kindheitserinnerungen.“'),
  w(11, 'de.verben', 3, 'konstatieren', 'feststellen', '„Der Bericht konstatiert erhebliche Mängel.“'),
  w(12, 'de.verben', 4, 'postulieren', 'als gültig annehmen oder fordern', '„Die Theorie postuliert ein neues Teilchen.“'),
  w(13, 'de.verben', 2, 'revidieren', 'nach Prüfung ändern', '„Er revidierte sein Urteil.“'),
  w(14, 'de.verben', 3, 'verifizieren', 'als richtig bestätigen', '„Die Angaben müssen verifiziert werden.“'),
  w(15, 'de.verben', 4, 'falsifizieren', 'als falsch nachweisen', '„Ein Gegenbeispiel kann die These falsifizieren.“'),
  w(16, 'de.verben', 4, 'eruieren', 'ermitteln, herausfinden', '„Wir eruieren gerade die Ursache.“'),
  w(17, 'de.verben', 3, 'tangieren', 'berühren, betreffen', '„Das tangiert unsere Pläne nicht.“'),
  w(18, 'de.verben', 5, 'kolportieren', 'ein Gerücht verbreiten', '„Die Zeitung kolportierte seinen Rücktritt.“'),
  w(19, 'de.verben', 3, 'rekapitulieren', 'zusammenfassend wiederholen', '„Lassen Sie uns kurz rekapitulieren.“'),
  w(20, 'de.verben', 5, 'prolongieren', 'verlängern (Frist, Vertrag)', '„Der Kredit wurde prolongiert.“'),
  w(21, 'de.verben', 3, 'negieren', 'verneinen, bestreiten', '„Er negierte jede Verantwortung.“'),
  w(22, 'de.verben', 2, 'kaschieren', 'verbergen, verdecken', '„Die Farbe kaschiert kleine Schäden.“'),
  w(23, 'de.verben', 5, 'oktroyieren', 'aufzwingen', '„Die Regeln wurden ihnen oktroyiert.“'),
  w(24, 'de.verben', 5, 'perpetuieren', 'fortdauern lassen', '„Solche Bilder perpetuieren Klischees.“'),
  w(25, 'de.verben', 4, 'sich echauffieren', 'sich aufregen, empören', '„Sie echauffierte sich über den Ton.“'),
  // Adjektive
  w(26, 'de.adjektive', 2, 'ambivalent', 'zwiespältig', '„Sie hat ambivalente Gefühle.“'),
  w(27, 'de.adjektive', 2, 'obsolet', 'überholt, nicht mehr gebräuchlich', '„Die Regel ist obsolet.“'),
  w(28, 'de.adjektive', 2, 'prekär', 'heikel, unsicher', '„Die Lage ist prekär.“'),
  w(29, 'de.adjektive', 2, 'redundant', 'überflüssig, mehrfach vorhanden', '„Der letzte Satz ist redundant.“'),
  w(30, 'de.adjektive', 3, 'stringent', 'streng folgerichtig', '„eine stringente Argumentation“'),
  w(31, 'de.adjektive', 3, 'kohärent', 'zusammenhängend, in sich stimmig', '„ein kohärentes Konzept“'),
  w(32, 'de.adjektive', 3, 'eklatant', 'offenkundig, krass', '„ein eklatanter Fehler“'),
  w(33, 'de.adjektive', 2, 'subtil', 'fein, unterschwellig', '„ein subtiler Unterschied“'),
  w(34, 'de.adjektive', 3, 'lapidar', 'knapp und schlicht', '„eine lapidare Antwort“'),
  w(35, 'de.adjektive', 1, 'pragmatisch', 'sachbezogen, praktisch', '„eine pragmatische Lösung“'),
  w(36, 'de.adjektive', 3, 'rigoros', 'streng, unnachgiebig', '„rigorose Sparmaßnahmen“'),
  w(37, 'de.adjektive', 5, 'ubiquitär', 'überall verbreitet', '„Smartphones sind ubiquitär.“'),
  w(38, 'de.adjektive', 3, 'marginal', 'am Rande, geringfügig', '„ein marginaler Effekt“'),
  w(39, 'de.adjektive', 4, 'virulent', 'akut, drängend', '„ein virulentes Thema“'),
  w(40, 'de.adjektive', 3, 'latent', 'verborgen vorhanden', '„eine latente Gefahr“'),
  w(41, 'de.adjektive', 4, 'opportun', 'angebracht, zweckmäßig', '„Eine Klage scheint jetzt nicht opportun.“'),
  w(42, 'de.adjektive', 2, 'adäquat', 'angemessen', '„eine adäquate Reaktion“'),
  w(43, 'de.adjektive', 4, 'diffizil', 'schwierig, heikel', '„eine diffizile Aufgabe“'),
  w(44, 'de.adjektive', 4, 'konzis', 'knapp und präzise', '„ein konziser Bericht“'),
  w(45, 'de.adjektive', 4, 'elaboriert', 'sorgfältig ausgearbeitet', '„ein elaborierter Plan“'),
  w(46, 'de.adjektive', 4, 'prätentiös', 'anmaßend, gewollt anspruchsvoll', '„ein prätentiöser Stil“'),
  w(47, 'de.adjektive', 3, 'plakativ', 'grob vereinfachend, auf Wirkung aus', '„eine plakative Parole“'),
  w(48, 'de.adjektive', 4, 'dezidiert', 'entschieden, bestimmt', '„eine dezidierte Meinung“'),
  w(49, 'de.adjektive', 5, 'inhärent', 'innewohnend', '„ein dem System inhärentes Risiko“'),
  w(50, 'de.adjektive', 2, 'kontrovers', 'umstritten, gegensätzlich', '„ein kontroverses Thema“'),
  // Nomen
  w(51, 'de.nomen', 2, 'Diskrepanz', 'Missverhältnis, Widerspruch', '„eine Diskrepanz zwischen Plan und Wirklichkeit“'),
  w(52, 'de.nomen', 3, 'Prämisse', 'Voraussetzung eines Schlusses', '„Die Prämisse ist falsch.“'),
  w(53, 'de.nomen', 3, 'Paradigma', 'grundlegendes Denkmuster', '„ein Paradigmenwechsel in der Medizin“'),
  w(54, 'de.nomen', 4, 'Ambiguität', 'Mehrdeutigkeit', '„die Ambiguität einer Formulierung“'),
  w(55, 'de.nomen', 3, 'Implikation', 'mitgemeinte Folge', '„die Implikationen einer Entscheidung“'),
  w(56, 'de.nomen', 1, 'Konsens', 'Übereinstimmung', '„Es gibt einen breiten Konsens.“'),
  w(57, 'de.nomen', 3, 'Dissens', 'Meinungsverschiedenheit', '„Der Dissens blieb bestehen.“'),
  w(58, 'de.nomen', 3, 'Kausalität', 'Ursache-Wirkungs-Zusammenhang', '„Korrelation ist nicht Kausalität.“'),
  w(59, 'de.nomen', 3, 'Korrelation', 'statistischer Zusammenhang', '„eine starke Korrelation“'),
  w(60, 'de.nomen', 5, 'Desiderat', 'Erwünschtes, das noch fehlt', '„ein Desiderat der Forschung“'),
  w(61, 'de.nomen', 5, 'Diktum', 'bekannter, zugespitzter Ausspruch', '„das berühmte Diktum des Philosophen“'),
  w(62, 'de.nomen', 5, 'Duktus', 'charakteristische Art des Schreibens', '„der nüchterne Duktus des Romans“'),
  w(63, 'de.nomen', 4, 'Habitus', 'Auftreten, Haltung', '„ein selbstbewusster Habitus“'),
  w(64, 'de.nomen', 2, 'Nuance', 'feiner Unterschied', '„eine Nuance zu laut“'),
  w(65, 'de.nomen', 4, 'Präzedenzfall', 'Musterfall für künftige Entscheidungen', '„Das Urteil schafft einen Präzedenzfall.“'),
  w(66, 'de.nomen', 4, 'Axiom', 'unbeweisbarer Grundsatz', '„ein Axiom der Geometrie“'),
  w(67, 'de.nomen', 3, 'Maxime', 'Leitsatz des Handelns', '„Ehrlichkeit ist ihre Maxime.“'),
  w(68, 'de.nomen', 4, 'Tenor', 'Grundhaltung, Kernaussage', '„Der Tenor der Kritik war positiv.“'),
  w(69, 'de.nomen', 2, 'Dilemma', 'Zwangslage zwischen zwei Übeln', '„in einem Dilemma stecken“'),
  w(70, 'de.nomen', 3, 'Euphemismus', 'beschönigender Ausdruck', '„‚Freisetzung‘ ist ein Euphemismus für Entlassung.“'),
  // Redewendungen
  w(71, 'de.idiom', 1, 'etwas auf die lange Bank schieben', 'etwas aufschieben', '„Schieb die Steuererklärung nicht auf die lange Bank.“'),
  w(72, 'de.idiom', 1, 'den Nagel auf den Kopf treffen', 'das Wesentliche genau erfassen', '„Mit dieser Analyse triffst du den Nagel auf den Kopf.“'),
  w(73, 'de.idiom', 2, 'ins Fettnäpfchen treten', 'sich ungeschickt blamieren', '„Mit der Frage trat er ins Fettnäpfchen.“'),
  w(74, 'de.idiom', 2, 'jemandem reinen Wein einschenken', 'jemandem die Wahrheit sagen', '„Ich muss dir reinen Wein einschenken.“'),
  w(75, 'de.idiom', 2, 'die Flinte ins Korn werfen', 'vorschnell aufgeben', '„Wirf nicht gleich die Flinte ins Korn.“'),
  w(76, 'de.idiom', 2, 'zwischen den Zeilen lesen', 'das Unausgesprochene verstehen', '„Man muss zwischen den Zeilen lesen.“'),
  w(77, 'de.idiom', 3, 'etwas unter den Teppich kehren', 'etwas vertuschen', '„Der Skandal wurde unter den Teppich gekehrt.“'),
  w(78, 'de.idiom', 2, 'Öl ins Feuer gießen', 'einen Streit verschärfen', '„Sein Kommentar goss Öl ins Feuer.“'),
  w(79, 'de.idiom', 1, 'um den heißen Brei herumreden', 'nicht zur Sache kommen', '„Red nicht um den heißen Brei herum.“'),
  w(80, 'de.idiom', 3, 'sich mit fremden Federn schmücken', 'fremde Leistung als eigene ausgeben', '„Er schmückt sich mit fremden Federn.“'),
  w(81, 'de.idiom', 3, 'auf dem Holzweg sein', 'sich irren', '„Mit dieser Annahme bist du auf dem Holzweg.“'),
  w(82, 'de.idiom', 4, 'etwas aus dem Stegreif tun', 'ohne Vorbereitung', '„Sie hielt die Rede aus dem Stegreif.“'),
  // Kollokationen: Nomen und Verb
  w(83, 'de.kollokation', 1, 'eine Entscheidung …', 'treffen', '„Wir müssen eine Entscheidung treffen.“'),
  w(84, 'de.kollokation', 2, 'Maßnahmen …', 'ergreifen', '„Die Stadt ergreift Maßnahmen gegen Lärm.“'),
  w(85, 'de.kollokation', 2, 'Kritik …', 'üben', '„Sie übte Kritik am Entwurf.“'),
  w(86, 'de.kollokation', 1, 'einen Antrag …', 'stellen', '„Er stellte einen Antrag auf Förderung.“'),
  w(87, 'de.kollokation', 3, 'Bedenken …', 'anmelden', '„Der Rat meldete Bedenken an.“'),
  w(88, 'de.kollokation', 2, 'einen Beitrag …', 'leisten', '„Jeder kann einen Beitrag leisten.“'),
  w(89, 'de.kollokation', 2, 'Rücksicht …', 'nehmen', '„Bitte nehmen Sie Rücksicht auf die Nachbarn.“'),
  w(90, 'de.kollokation', 3, 'etwas in Betracht …', 'ziehen', '„Wir ziehen eine Verschiebung in Betracht.“'),
  w(91, 'de.kollokation', 3, 'Einspruch …', 'erheben', '„Die Verteidigung erhob Einspruch.“'),
  w(92, 'de.kollokation', 4, 'eine Frist …', 'wahren', '„Um die Frist zu wahren, faxen wir das Schreiben.“'),
]

// ---------- Register-Sortierer ----------

function r(nr: number, stufe: Stufe, text: string, fach: 0 | 1 | 2, warum: string): KarteItem {
  return { id: `de.re.${String(nr).padStart(2, '0')}`, spiel: 'de.register', art: 'karte', ziel: 'de.register', stufe, text, fach, warum }
}

export const REGISTER: KarteItem[] = [
  r(1, 1, 'Wir bitten um Ihr Verständnis.', 0, 'Typische Formel aus Geschäftsbriefen und Durchsagen.'),
  r(2, 1, 'Hiermit bestätigen wir den Eingang Ihres Schreibens.', 0, '„Hiermit“ und „Eingang Ihres Schreibens“ gehören in den Geschäftsbrief.'),
  r(3, 3, 'Ich erlaube mir, Sie auf Folgendes hinzuweisen.', 0, 'Sehr förmlich – so schreibt man an Behörden oder Vorgesetzte.'),
  r(4, 2, 'Bitte lassen Sie uns die Unterlagen zukommen.', 0, '„Zukommen lassen“ ist förmlich für „schicken“.'),
  r(5, 1, 'Für Rückfragen stehe ich Ihnen gern zur Verfügung.', 0, 'Feste Schlussformel im Geschäftsbrief.'),
  r(6, 2, 'Wir sehen Ihrer Antwort mit Interesse entgegen.', 0, 'Förmliche Wendung: „einer Sache entgegensehen“.'),
  r(7, 4, 'Mit vorzüglicher Hochachtung', 0, 'Äußerst förmliche, heute seltene Grußformel – etwa an hohe Amtsträger.'),
  r(8, 3, 'Vor diesem Hintergrund erscheint eine Verschiebung geboten.', 0, '„Geboten erscheinen“ ist gehobene Amts- und Wissenschaftssprache.'),
  r(9, 2, 'Dürfte ich Sie um einen Moment Ihrer Zeit bitten?', 0, 'Sehr höflicher Konjunktiv – förmlich.'),
  r(10, 3, 'Wir bedauern, Ihnen mitteilen zu müssen, dass …', 0, 'Klassische förmliche Absageformel.'),
  r(11, 1, 'Das Treffen beginnt um zehn Uhr.', 1, 'Sachlich und ohne besondere Höflichkeitsformeln – neutral.'),
  r(12, 1, 'Ich habe die Datei angehängt.', 1, 'Alltäglich, korrekt, weder steif noch salopp.'),
  r(13, 1, 'Vielen Dank für deine Nachricht.', 1, 'Freundlich und neutral – das Du macht es noch nicht salopp.'),
  r(14, 1, 'Die Kosten sind gestiegen.', 1, 'Nüchterne Feststellung – neutral.'),
  r(15, 1, 'Kannst du das bitte prüfen?', 1, 'Höfliche Alltagsbitte – neutral.'),
  r(16, 2, 'Viele Grüße', 1, 'Übliche, neutrale Grußformel – weniger förmlich als „Mit freundlichen Grüßen“.'),
  r(17, 2, 'Ich melde mich morgen bei Ihnen.', 1, 'Höflich, aber alltäglich – neutral.'),
  r(18, 1, 'Das ist eine gute Idee.', 1, 'Neutral.'),
  r(19, 2, 'Wie geht es Ihnen?', 1, 'Höfliche Alltagsfrage – neutral.'),
  r(20, 2, 'Ich komme etwas später.', 1, 'Alltäglich und korrekt – neutral.'),
  r(21, 1, 'Das ist voll krass.', 2, '„Voll“ als Verstärker und „krass“ sind jugendsprachlich-salopp.'),
  r(22, 1, 'Hau rein!', 2, 'Saloppe Verabschiedung.'),
  r(23, 1, 'Ich hab null Bock.', 2, '„Null Bock“ ist salopp für „keine Lust“.'),
  r(24, 2, 'Das kriegen wir schon hin.', 2, '„Kriegen“ ist umgangssprachlich für „bekommen/schaffen“.'),
  r(25, 1, 'Was geht ab?', 2, 'Salopper Gruß.'),
  r(26, 2, 'Der Typ nervt.', 2, '„Typ“ für Person und „nerven“ sind umgangssprachlich.'),
  r(27, 1, 'Das war echt mega.', 2, '„Echt mega“ ist Umgangssprache.'),
  r(28, 2, 'Kein Ding!', 2, 'Salopp für „gern geschehen“.'),
  r(29, 2, 'Ich check das nicht.', 2, '„Checken“ ist salopp für „verstehen“.'),
  r(30, 2, 'Die Kohle reicht nicht.', 2, '„Kohle“ ist salopp für Geld.'),
  r(31, 2, 'Mach dir keinen Kopf.', 2, 'Salopp für „mach dir keine Sorgen“.'),
  r(32, 3, 'Das geht mir auf den Keks.', 2, 'Umgangssprachliche Wendung für „das nervt mich“.'),
  r(33, 3, 'Na, alles klar bei dir?', 2, 'Lockerer, umgangssprachlicher Gruß.'),
  r(34, 3, 'Anbei erhalten Sie die gewünschten Unterlagen.', 0, '„Anbei“ ist typisch für förmliche Schreiben.'),
  r(35, 4, 'Wir wären Ihnen für eine zeitnahe Rückmeldung verbunden.', 0, '„Jemandem verbunden sein“ = dankbar sein – förmlich.'),
  r(36, 2, 'Ich rufe Sie später zurück.', 1, 'Höflich, aber alltäglich – neutral.'),
  r(37, 3, 'Ich schick dir das nachher rüber.', 2, 'Verkürztes „schick“ und „rüber“ sind umgangssprachlich.'),
  r(38, 4, 'Die Sitzung ist hiermit eröffnet.', 0, 'Formelhafte, förmliche Sitzungssprache.'),
]
