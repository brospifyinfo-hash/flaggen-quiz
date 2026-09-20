// 🇩🇪 Deutsch – Inhalte für Sprachdetektiv, Grammatik-Duell, Umformung, Satzarchitekt und Lektorat.
// Jeder Fehler ist eindeutig: Wo die Standardsprache zwei Formen zulässt, steht er nicht hier.
import type { BauItem, DuellItem, FehlerItem, Stufe, WahlItem } from '../../typen'
import { bausteine, fehlerTeile, optionen } from '../werkzeug'

// ---------- Sprachdetektiv: ein Satz, ein Fehler ----------

function f(id: string, ziel: string, stufe: Stufe, text: string, erklaerung: string, mehr?: string, kontext?: string): FehlerItem {
  return {
    id,
    spiel: 'de.detektiv',
    art: 'fehler',
    ziel,
    stufe,
    teile: fehlerTeile(text),
    erklaerung,
    ...(mehr ? { mehr } : {}),
    ...(kontext ? { kontext } : {}),
  }
}

export const DETEKTIV: FehlerItem[] = [
  // Präpositionen mit Genitiv
  f('de.det.01', 'de.genitiv', 1, '{Aufgrund dem erheblichen Zeitdruck=>Aufgrund des erheblichen Zeitdrucks|Aufgrund dem erheblichen Zeitdrucks|Aufgrund des erheblichen Zeitdruck} wurde die Entscheidung vertagt.', '„Aufgrund“ verlangt den Genitiv: aufgrund des erheblichen Zeitdrucks.', 'Wie „aufgrund“ stehen auch „anhand“, „angesichts“, „infolge“, „hinsichtlich“ und „mithilfe“ mit Genitiv – im Schriftdeutsch ohne Ausnahme.'),
  f('de.det.02', 'de.genitiv', 2, '{Angesichts den steigenden Kosten=>Angesichts der steigenden Kosten|Angesichts die steigenden Kosten|Angesichts dem steigenden Kosten} verschiebt der Verein den Umbau.', '„Angesichts“ steht mit Genitiv: angesichts der steigenden Kosten.'),
  f('de.det.03', 'de.genitiv', 2, '{Hinsichtlich Ihrem Antrag=>Hinsichtlich Ihres Antrags|Hinsichtlich Ihren Antrag|Hinsichtlich Ihrem Antrags} teilen wir Ihnen Folgendes mit.', '„Hinsichtlich“ verlangt den Genitiv: hinsichtlich Ihres Antrags.', undefined, 'Behördenbrief'),
  f('de.det.04', 'de.genitiv', 2, '{Infolge des Unwetter=>Infolge des Unwetters|Infolge dem Unwetter|Infolge den Unwetters} blieben viele Züge stehen.', 'Im Genitiv bekommt „das Unwetter“ ein -s: infolge des Unwetters.'),
  f('de.det.05', 'de.genitiv', 3, '{Mithilfe modernen Methoden=>Mithilfe moderner Methoden|Mithilfe moderne Methoden|Mithilfe modernem Methoden} konnten die Forscher das Material datieren.', '„Mithilfe“ steht mit Genitiv. Ohne Artikel trägt das Adjektiv die Endung: moderner Methoden.'),
  f('de.det.06', 'de.genitiv', 3, '{Ungeachtet dem Protest=>Ungeachtet des Protests|Ungeachtet den Protest|Ungeachtet des Protest} der Anwohner wurde der Turm gebaut.', '„Ungeachtet“ verlangt den Genitiv: ungeachtet des Protests.'),
  f('de.det.07', 'de.genitiv', 4, 'Die Stiftung sammelt Geld {zugunsten krebskranken Kindern=>zugunsten krebskranker Kinder|zugunsten krebskranke Kinder|zugunsten krebskranken Kinder}.', '„Zugunsten“ steht mit Genitiv. Ohne Artikel zeigt das Adjektiv den Fall: krebskranker Kinder.'),
  f('de.det.08', 'de.genitiv', 2, '{Anhand diesen Kriterien=>Anhand dieser Kriterien|Anhand diese Kriterien|Anhand diesem Kriterien} lässt sich die Qualität objektiv bewerten.', '„Anhand“ verlangt den Genitiv: anhand dieser Kriterien.'),

  // Verben und ihr Kasus
  f('de.det.09', 'de.rektion', 2, 'Am Sonntag gedenken wir {den Opfern=>der Opfer|die Opfer|dem Opfer} des Krieges.', '„Gedenken“ verlangt den Genitiv: der Opfer gedenken.'),
  f('de.det.10', 'de.rektion', 3, 'Die Angelegenheit bedarf {eine gründliche Prüfung=>einer gründlichen Prüfung|einer gründliche Prüfung|eine gründlichen Prüfung}.', '„Bedürfen“ steht mit Genitiv: einer gründlichen Prüfung bedürfen.'),
  f('de.det.11', 'de.rektion', 2, 'Man beschuldigte ihn {dem Diebstahl=>des Diebstahls|den Diebstahl|dem Diebstahls}.', 'Jemanden einer Sache beschuldigen – die Sache steht im Genitiv: des Diebstahls.'),
  f('de.det.12', 'de.rektion', 2, 'Sie war sich {ihrem Fehler=>ihres Fehlers|ihren Fehler|ihrem Fehlers} durchaus bewusst.', 'Sich einer Sache bewusst sein – mit Genitiv: sich ihres Fehlers bewusst.'),
  f('de.det.13', 'de.rektion', 1, 'Ich gratuliere {dich=>dir|dein|deiner} herzlich zum Abschluss.', '„Gratulieren“ verlangt den Dativ: Ich gratuliere dir.'),
  f('de.det.14', 'de.rektion', 4, 'Dieser Vorwurf entbehrt {jede Grundlage=>jeder Grundlage|jeden Grundlage|jede Grundlagen}.', '„Einer Sache entbehren“ steht mit Genitiv – fest in der Wendung „jeder Grundlage entbehren“.'),
  f('de.det.15', 'de.rektion', 4, 'Der Aufsichtsrat enthob den Manager {seinem Amt=>seines Amtes|sein Amt|seinen Amtes}.', 'Jemanden eines Amtes entheben – mit Genitiv: seines Amtes.'),
  f('de.det.16', 'de.rektion', 3, 'Er rühmte sich {seinem Erfolg=>seines Erfolgs|seinen Erfolg|seinem Erfolgs} bei jeder Gelegenheit.', 'Sich einer Sache rühmen – mit Genitiv: sich seines Erfolgs rühmen.'),

  // Adjektivdeklination
  f('de.det.17', 'de.adjektiv', 1, 'Wir suchen {einen erfahrener Projektleiter=>einen erfahrenen Projektleiter|einen erfahrene Projektleiter|einem erfahrenen Projektleiter} für unser Team.', 'Nach „einen“ (Akkusativ maskulin) endet das Adjektiv auf -en: einen erfahrenen Projektleiter.', undefined, 'Stellenanzeige'),
  f('de.det.18', 'de.adjektiv', 2, 'Am Montag werden {alle neue Mitarbeiter=>alle neuen Mitarbeiter|alle neuer Mitarbeiter|allen neuen Mitarbeitern} begrüßt.', 'Nach „alle“ wird das Adjektiv schwach dekliniert: alle neuen Mitarbeiter.'),
  f('de.det.19', 'de.adjektiv', 2, 'Sie stammt aus {einer alten, angesehener Familie=>einer alten, angesehenen Familie|einer alte, angesehene Familie|einer alten, angesehene Familie}.', 'Gleichrangige Adjektive werden gleich dekliniert: einer alten, angesehenen Familie.'),
  f('de.det.20', 'de.adjektiv', 3, '{Einige wichtigen Dokumente=>Einige wichtige Dokumente|Einige wichtigen Dokumenten|Einiger wichtiger Dokumente} fehlen noch in der Akte.', 'Nach „einige“ wird das Adjektiv stark dekliniert: einige wichtige Dokumente.', 'Anders als nach „alle“: alle wichtigen Dokumente, aber einige wichtige Dokumente.'),
  f('de.det.21', 'de.adjektiv', 4, 'Das Ergebnis {mehrerer unabhängigen Studien=>mehrerer unabhängiger Studien|mehrere unabhängigen Studien|mehrerer unabhängigem Studien} bestätigt die These.', 'Nach „mehrerer“ wird das Adjektiv stark dekliniert: mehrerer unabhängiger Studien.'),
  f('de.det.22', 'de.adjektiv', 1, 'Mit {freundlichem Grüßen=>freundlichen Grüßen|freundlicher Grüßen|freundliche Grüßen}\nAnna Weber', 'Im Dativ Plural endet das Adjektiv auf -en: mit freundlichen Grüßen.', undefined, 'Briefschluss'),

  // n-Deklination
  f('de.det.23', 'de.ndekl', 1, 'Wir haben {den Kunde=>den Kunden|dem Kunde|den Kundes} ausführlich beraten.', '„Kunde“ gehört zur n-Deklination: den Kunden, dem Kunden, des Kunden.'),
  f('de.det.24', 'de.ndekl', 1, 'Das Interview mit {dem Präsident=>dem Präsidenten|den Präsident|dem Präsidents} wurde live übertragen.', 'n-Deklination: dem Präsidenten.'),
  f('de.det.25', 'de.ndekl', 2, 'Die Meinung {des Kollegens=>des Kollegen|dem Kollegen|des Kolleges} war eindeutig.', 'n-Deklination: im Genitiv „des Kollegen“ – ohne zusätzliches -s.'),
  f('de.det.26', 'de.ndekl', 1, 'Gestern sprach ich lange mit {Herr Müller=>Herrn Müller|Herren Müller|Herrn Müllers}.', '„Herr“ wird dekliniert: mit Herrn Müller.'),
  f('de.det.27', 'de.ndekl', 4, 'Trotz {seines guten Namen=>seines guten Namens|seinem guten Namen|seines gutes Namens} fand er keinen Verlag.', '„Name“ hat im Genitiv beides: -n und -s – des Namens (ebenso: des Glaubens, des Willens).'),
  f('de.det.28', 'de.ndekl', 3, 'Das Projekt liegt ihr sehr am {Herz=>Herzen|Herzens|Herze}.', '„Herz“ wird besonders dekliniert: dem Herzen – etwas liegt jemandem am Herzen.'),

  // Konnektoren und Nebensätze
  f('de.det.29', 'de.konnektoren', 2, '{Trotzdem=>Obwohl|Deshalb|Denn} er krank war, ging er zur Arbeit.', '„Trotzdem“ ist in der Standardsprache ein Adverb. Einen Nebensatz leitet „obwohl“ ein.'),
  f('de.det.30', 'de.konnektoren', 2, 'Das Projekt scheiterte, {weil=>denn|da|obwohl} es fehlte an Geld.', 'Nach „weil“ steht das Verb am Ende. Mit „denn“ bleibt die Stellung des Hauptsatzes: …, denn es fehlte an Geld.'),
  f('de.det.31', 'de.konnektoren', 3, 'Je länger wir warten, {je teurer=>desto teurer|so teurer|umso teuer} wird es.', 'Auf „je + Komparativ“ folgt im zweiten Teil „desto“ oder „umso“ + Komparativ.'),
  f('de.det.32', 'de.konnektoren', 1, 'Er hat weder angerufen {oder=>noch|und|sowie} geschrieben.', 'Die feste Verbindung heißt „weder … noch“.'),
  f('de.det.33', 'de.konnektoren', 2, 'Sie ist nicht nur klug, {als auch=>sondern auch|aber auch|und auch} sehr fleißig.', 'Die feste Verbindung heißt „nicht nur …, sondern auch“. „Als auch“ gehört zu „sowohl … als auch“.'),
  f('de.det.34', 'de.nebensatz', 1, 'Ich weiß nicht, {ob er kommt morgen=>ob er morgen kommt|ob morgen er kommt|ob er morgen kommen}.', 'Im Nebensatz steht das finite Verb am Ende: ob er morgen kommt.'),
  f('de.det.35', 'de.nebensatz', 1, 'Das ist der Grund, {warum ich habe gekündigt=>warum ich gekündigt habe|warum habe ich gekündigt|warum ich gekündigt gehabt}.', 'Im Nebensatz rückt das finite Verb ans Ende: warum ich gekündigt habe.'),
  f('de.det.36', 'de.nebensatz', 5, 'Ich glaube, dass er das Formular {ausfüllen müssen hat=>hat ausfüllen müssen|ausfüllen gemusst hat|hat ausfüllen gemusst}.', 'Stehen zwei Infinitive am Ende (Ersatzinfinitiv), rückt das finite Verb im Nebensatz davor: …, dass er das Formular hat ausfüllen müssen.', 'Bei Modalverben im Perfekt steht der Infinitiv statt des Partizips: Er hat es tun müssen (nicht: gemusst). Im Nebensatz steht „hat“ dann vor der Infinitivgruppe.'),
  f('de.det.37', 'de.nebensatz', 4, 'Er hat das Angebot nicht {annehmen gewollt=>annehmen wollen|angenommen wollen|annehmen gewollen}.', 'Modalverb im Perfekt mit Infinitiv davor: Ersatzinfinitiv – „hat … annehmen wollen“, nicht „gewollt“.'),

  // Relativsätze
  f('de.det.38', 'de.relativ', 2, 'Das ist alles, {das=>was|welches|dass} ich darüber weiß.', 'Nach „alles“, „nichts“ und „vieles“ steht das Relativpronomen „was“.'),
  f('de.det.39', 'de.relativ', 2, 'Die Leute, {die ich geholfen habe=>denen ich geholfen habe|deren ich geholfen habe|den ich geholfen habe}, bedankten sich.', '„Helfen“ verlangt den Dativ – also Relativpronomen im Dativ Plural: denen.'),
  f('de.det.40', 'de.relativ', 2, 'Die Kinder, {dessen Eltern=>deren Eltern|denen Eltern|derer Eltern} arbeiten, werden betreut.', 'Bezugswort im Plural → Genitiv-Relativpronomen „deren“.'),
  f('de.det.41', 'de.relativ', 4, 'Die Firma, {derer Produkte=>deren Produkte|dessen Produkte|denen Produkte} wir vertreiben, sitzt in Lyon.', 'Vor einem Nomen steht als Relativpronomen „deren“. „Derer“ ist ein Demonstrativpronomen: die Namen derer, die …'),
  f('de.det.42', 'de.relativ', 1, 'Der Kunde, {mit den Sie gestern gesprochen haben=>mit dem Sie gestern gesprochen haben|mit denen Sie gestern gesprochen haben|mit dessen Sie gestern gesprochen haben}, hat zurückgerufen.', '„Der Kunde“ ist Singular, „mit“ verlangt den Dativ: mit dem.'),

  // Passiv
  f('de.det.43', 'de.passiv', 1, 'Der Vertrag muss bis Freitag {unterschreiben werden=>unterschrieben werden|unterschrieben worden|unterschreiben worden}.', 'Passiv mit Modalverb: Partizip II + „werden“ – unterschrieben werden.'),
  f('de.det.44', 'de.passiv', 2, 'Die Brücke {wurde seit Jahren gebaut worden=>wird seit Jahren gebaut|wurde seit Jahren gebaut geworden|wird seit Jahren gebaut geworden}.', 'Ein Vorgang, der seit Jahren andauert, steht im Präsens-Passiv: wird seit Jahren gebaut.'),
  f('de.det.45', 'de.passiv', 1, 'Von {die Kommission=>der Kommission|den Kommission|dem Kommission} wurde ein neuer Entwurf vorgelegt.', '„Von“ verlangt den Dativ: von der Kommission.'),
  f('de.det.46', 'de.passiv', 3, 'Das Problem {ist leicht zu lösend=>ist leicht zu lösen|ist leicht lösen|ist leicht zu gelöst}.', '„Sein + zu + Infinitiv“ drückt eine Möglichkeit aus: Das Problem ist leicht zu lösen.'),
  f('de.det.47', 'de.passiv', 3, 'Der Antrag ist inzwischen {genehmigt geworden=>genehmigt worden|genehmigt gewesen|genehmigt werden}.', 'Im Passiv-Perfekt heißt es „worden“, nicht „geworden“: ist genehmigt worden.'),

  // Konjunktiv II
  f('de.det.48', 'de.konj2', 1, 'Wenn ich mehr Zeit {würde haben=>hätte|habe|hatte}, würde ich öfter lesen.', 'Bei „haben“ nimmt man die eigene Konjunktivform: hätte – nicht „würde haben“.'),
  f('de.det.49', 'de.konj2', 2, 'Er tut so, als ob er alles {weiß=>wüsste|wusste|gewusst}.', 'Der irreale Vergleich mit „als ob“ steht im Konjunktiv: als ob er alles wüsste.'),
  f('de.det.50', 'de.konj2', 3, 'Wenn er früher losgefahren {hätte=>wäre|war|würde}, hätte er den Zug erreicht.', '„Losfahren“ bildet das Perfekt mit „sein“ – also: wäre losgefahren.'),
  f('de.det.51', 'de.konj2', 4, 'Hätte sie das gewusst, {hätte sie früher gegangen=>wäre sie früher gegangen|hätte sie früher gehen|wäre sie früher gegangen worden}.', '„Gehen“ bildet das Perfekt mit „sein“: wäre gegangen.'),

  // Konjunktiv I
  f('de.det.52', 'de.konj1', 2, 'Er sagte, er {seie=>sei|seien|sein} nicht informiert worden.', 'Die Konjunktiv-I-Form von „sein“ lautet: ich sei, du seist, er sei – „seie“ gibt es nicht.'),
  f('de.det.53', 'de.konj1', 3, 'Die Forscher behaupten, sie {haben=>hätten|habe|hatten} einen neuen Wirkstoff gefunden.', 'Klingt der Konjunktiv I wie der Indikativ (sie haben), nimmt man den Konjunktiv II: sie hätten.'),

  // Partizipialattribute
  f('de.det.54', 'de.partizip', 2, 'Die {vom Vorstand beschlossenen Maßnahme=>vom Vorstand beschlossene Maßnahme|vom Vorstand beschließende Maßnahme|vom Vorstand beschlossener Maßnahme} tritt im Mai in Kraft.', 'Das Partizip wird wie ein Adjektiv dekliniert: die … beschlossene Maßnahme (Nominativ Singular).'),
  f('de.det.55', 'de.partizip', 3, 'Die {zu prüfende Unterlagen=>zu prüfenden Unterlagen|zu prüfenen Unterlagen|zu geprüften Unterlagen} liegen auf Ihrem Tisch.', 'Nach „die“ im Plural endet das Attribut auf -en: die zu prüfenden Unterlagen.'),
  f('de.det.56', 'de.partizip', 5, 'Die {gestern stattgefundene Sitzung=>Sitzung, die gestern stattfand,|gestern stattfindende Sitzung|gestern stattgefundenen Sitzung} brachte keine Einigung.', 'Das Partizip II von Verben, die das Perfekt mit „haben“ bilden, taugt nicht als Attribut: nicht „die stattgefundene Sitzung“, sondern „die Sitzung, die stattfand“.', 'Ebenso falsch: „der zugenommene Verkehr“, „die abgenommenen Kosten“. Richtig: „der gestiegene Verkehr“ – denn „steigen“ bildet das Perfekt mit „sein“.'),

  // Kommasetzung
  f('de.det.57', 'de.komma', 1, 'Ich {hoffe dass=>hoffe, dass|hoffe dass,|hoffe; dass} du bald wieder gesund bist.', 'Ein Nebensatz mit „dass“ wird durch ein Komma abgetrennt.'),
  f('de.det.58', 'de.komma', 2, 'Sie ging nach {Hause ohne=>Hause, ohne|Hause ohne,|Hause; ohne} sich zu verabschieden.', 'Infinitivgruppen mit „ohne“, „um“, „statt“, „anstatt“, „außer“ und „als“ werden immer mit Komma abgetrennt.'),
  f('de.det.59', 'de.komma', 2, 'Der Plan, den wir gestern besprochen {haben ist=>haben, ist|haben; ist|haben – ist} gut.', 'Ein eingeschobener Relativsatz wird vorne und hinten durch Komma abgetrennt.'),
  f('de.det.60', 'de.komma', 3, 'Bitte bringen Sie Ihren {Ausweis, sowie=>Ausweis sowie|Ausweis, sowie,|Ausweis; sowie} eine Meldebescheinigung mit.', 'Vor „sowie“ steht in einer Aufzählung kein Komma – es wirkt wie „und“.'),
  f('de.det.61', 'de.komma', 3, 'Frau Klein, unsere neue {Kollegin stellt=>Kollegin, stellt|Kollegin; stellt|Kollegin: stellt} sich heute vor.', 'Eine Apposition wird vorne und hinten durch Komma eingeschlossen.'),
  f('de.det.62', 'de.komma', 2, 'Je früher du {anfängst desto=>anfängst, desto|anfängst; desto|anfängst: desto} entspannter wird es.', 'Zwischen den Teilen von „je …, desto …“ steht ein Komma.'),

  // Verwechslungsgefahr
  f('de.det.63', 'de.wortwahl', 1, 'Das ist die {einzigste=>einzige|einzigartigste|einzelne} Lösung.', '„Einzig“ lässt sich nicht steigern – es gibt nichts Einzigeres.'),
  f('de.det.64', 'de.wortwahl', 1, '{Seit=>Seid|Seiht|Sei} ihr schon fertig?', '„Seid“ ist die Form von „sein“ (ihr seid). „Seit“ ist eine Präposition der Zeit.'),
  f('de.det.65', 'de.wortwahl', 1, 'Ich habe {dass=>das|des|daß} Buch schon gelesen.', 'Hier ist „das“ der Artikel. „Dass“ leitet einen Nebensatz ein.'),
  f('de.det.66', 'de.wortwahl', 2, 'Das spricht jeder Vernunft {wieder=>wider|wiederum|widrig}.', '„Wider“ heißt „gegen“ (widersprechen), „wieder“ heißt „noch einmal“.'),
  f('de.det.67', 'de.wortwahl', 2, 'Er ist größer {wie=>als|denn|so} sein Bruder.', 'Beim Komparativ (Ungleichheit) steht „als“: größer als. „Wie“ steht bei Gleichheit: so groß wie.'),
  f('de.det.68', 'de.wortwahl', 3, 'Der Zug hat {scheinbar=>anscheinend|scheinheilig|scheinlich} Verspätung – die Anzeige wurde gerade geändert.', '„Scheinbar“ heißt: nur dem Anschein nach, in Wirklichkeit nicht. Hier ist der Zug wohl wirklich verspätet – also „anscheinend“.'),
  f('de.det.69', 'de.wortwahl', 4, 'Die neue Software arbeitet {effektiver=>effizienter|effektvoller|affektiver}: Sie erledigt dieselbe Aufgabe mit halb so viel Rechenzeit.', '„Effizient“ heißt: mit wenig Aufwand. „Effektiv“ heißt: wirksam, zielführend.'),
  f('de.det.70', 'de.wortwahl', 3, 'Ende {letztes Jahres=>letzten Jahres|letzter Jahres|letzte Jahres} zog die Firma um.', 'Vor einem Genitiv-Nomen auf -s endet das Adjektiv auf -en: Ende letzten Jahres.'),
  f('de.det.71', 'de.wortwahl', 2, 'Eine wichtige {Vorraussetzung=>Voraussetzung|Vorrausetzung|Voraussezung} ist Erfahrung im Vertrieb.', '„Voraussetzung“ kommt von „voraus“ – mit einem r.'),
  f('de.det.72', 'de.wortwahl', 3, 'Ich bin es {Leid=>leid|Leids|leidig}, immer zu warten.', 'In „es leid sein“ ist „leid“ ein Adjektiv – also klein.'),

  // Kollokationen und Redewendungen
  f('de.det.73', 'de.kollokation', 1, 'Wir müssen bis Freitag eine Entscheidung {machen=>treffen|tun|geben}.', 'Die feste Verbindung heißt „eine Entscheidung treffen“.'),
  f('de.det.74', 'de.kollokation', 1, 'Sie hat beim Amt einen Antrag auf Elterngeld {gegeben=>gestellt|getan|geführt}.', 'Einen Antrag stellt man.'),
  f('de.det.75', 'de.kollokation', 2, 'Die Regierung will neue Maßnahmen {nehmen=>ergreifen|greifen|fassen}.', 'Maßnahmen ergreift (oder trifft) man. Einen Beschluss fasst man.'),
  f('de.det.76', 'de.kollokation', 2, 'Das neue Gesetz tritt am 1. Januar in {Wirkung=>Kraft|Macht|Gang}.', 'Gesetze treten in Kraft.'),
  f('de.det.77', 'de.kollokation', 3, 'Wir werden Ihren Vorschlag in {Acht=>Betracht|Betrachtung|Achtung} ziehen.', 'Etwas „in Betracht ziehen“ = es erwägen. „Sich in Acht nehmen“ heißt dagegen: vorsichtig sein.'),
  f('de.det.78', 'de.kollokation', 2, 'Der Minister {machte=>übte|gab|führte} scharfe Kritik an dem Entwurf.', 'Kritik übt man.'),
  f('de.det.79', 'de.idiom', 1, 'Mit seiner Analyse hat er den Nagel auf den {Punkt=>Kopf|Hut|Stein} getroffen.', 'Die Redewendung lautet „den Nagel auf den Kopf treffen“ – das Wesentliche genau erfassen.'),
  f('de.det.80', 'de.idiom', 2, 'Wir sollten die Entscheidung nicht auf die lange {Straße=>Bank|Leitung|Sicht} schieben.', '„Etwas auf die lange Bank schieben“ heißt: es aufschieben.'),
  f('de.det.81', 'de.idiom', 3, 'Mit dieser Bemerkung ist er voll ins {Fettnäpfchen gesessen=>Fettnäpfchen getreten|Fettnäpfchen gefallen|Fettnäpfchen gestiegen}.', 'Man tritt ins Fettnäpfchen – blamiert sich also durch eine ungeschickte Bemerkung.'),
  f('de.det.82', 'de.idiom', 3, 'Da ist Hopfen und {Salz=>Malz|Honig|Mehl} verloren.', '„Da ist Hopfen und Malz verloren“ – da hilft nichts mehr.'),

  // Berufliche Korrespondenz
  f('de.det.83', 'de.beruf', 1, 'Sehr geehrte Damen und Herren,\n{Wir=>wir|Uns|Wir,} bedanken uns für Ihre Anfrage.', 'Nach der Anrede mit Komma geht es klein weiter – außer das erste Wort ist ein Nomen oder „Sie“.', undefined, 'Geschäftsbrief'),
  f('de.det.84', 'de.beruf', 2, 'Wir freuen uns auf Ihre Rückmeldung.\n\nMit freundlichen {Grüßen,=>Grüßen|Grüße,|Grüßen!}\nJonas Albrecht', 'Nach der Grußformel steht kein Satzzeichen.', undefined, 'Geschäftsbrief'),
  f('de.det.85', 'de.beruf', 1, 'Für Rückfragen stehe ich Ihnen gern zur {Verfügbarkeit=>Verfügung|Verfügen|Verfügbarung}.', 'Die Wendung lautet „zur Verfügung stehen“.', undefined, 'Geschäftsbrief'),

  // Feinheiten
  f('de.det.86', 'de.meister', 3, 'Die Anzahl der Teilnehmer {sind=>ist|seien|waren} deutlich gestiegen.', 'Subjekt ist „die Anzahl“ – Singular. Also: Die Anzahl … ist gestiegen.'),
  f('de.det.87', 'de.meister', 3, '{Desweiteren=>Des Weiteren|Des weiteren|Deswegen weiteren} wurde beschlossen, die Stelle neu auszuschreiben.', 'Nach heutiger Rechtschreibung schreibt man „des Weiteren“ getrennt und mit großem W.'),
  f('de.det.88', 'de.meister', 4, 'Die Kollegin ist {zur Zeit=>zurzeit|zurzeitig|zur Zeiten} im Urlaub.', '„Zurzeit“ (= derzeit) schreibt man zusammen. Getrennt nur, wenn ein Genitiv folgt: zur Zeit Goethes.'),
  f('de.det.89', 'de.meister', 4, 'Hast du {Thomas\'s Buch=>Thomas’ Buch|Thomas Buch|Thomases Buch} schon gelesen?', 'Namen auf -s, -x oder -z bekommen im Genitiv nur einen Apostroph: Thomas’ Buch.'),
  f('de.det.90', 'de.meister', 5, 'Er ist einer der wenigen, {der das versteht=>die das verstehen|der das verstehen|die das versteht}.', 'Der Relativsatz bezieht sich auf „der wenigen“ (Plural): einer der wenigen, die das verstehen.'),

  // Fehlerfreie Sätze – wer sicher ist, erkennt auch das
  f('de.det.91', 'de.genitiv', 4, 'Innerhalb dreier Wochen muss der Antrag vollständig vorliegen.', 'Richtig: „innerhalb“ mit Genitiv – „dreier Wochen“ zeigt den Fall deutlich.'),
  f('de.det.92', 'de.nebensatz', 4, 'Er bedauerte, dass er das Angebot nicht hatte annehmen können.', 'Richtig: Ersatzinfinitiv im Nebensatz – das finite Verb „hatte“ steht vor „annehmen können“.'),
  f('de.det.93', 'de.relativ', 3, 'Das ist das Beste, was ich je gegessen habe.', 'Richtig: Nach einem substantivierten Superlativ steht in der Regel „was“.'),
  f('de.det.94', 'de.konj1', 4, 'Die Sprecherin erklärte, das Unternehmen habe von den Vorwürfen nichts gewusst.', 'Richtig: indirekte Rede im Konjunktiv I – „habe … gewusst“.'),
]

// ---------- Grammatik-Duell: zwei Sätze, einer stimmt ----------

function d(id: string, ziel: string, stufe: Stufe, richtig: string, falsch: string, warum: string, frage?: string, mehr?: string): DuellItem {
  return { id, spiel: 'de.duell', art: 'duell', ziel, stufe, a: richtig, b: falsch, richtig: 'a', warum, ...(frage ? { frage } : {}), ...(mehr ? { mehr } : {}) }
}

const STANDARD = 'Welcher Satz entspricht der Standardsprache?'

export const DUELL: DuellItem[] = [
  d('de.du.01', 'de.genitiv', 1, 'Aufgrund des Wetters wurde die Veranstaltung abgesagt.', 'Aufgrund dem Wetter wurde die Veranstaltung abgesagt.', '„Aufgrund“ verlangt den Genitiv.'),
  d('de.du.02', 'de.genitiv', 1, 'Wegen des Staus kam sie zu spät.', 'Wegen dem Stau kam sie zu spät.', 'In der Standardsprache steht „wegen“ mit Genitiv; der Dativ gilt als umgangssprachlich.', STANDARD),
  d('de.du.03', 'de.genitiv', 2, 'Angesichts der Lage bleiben wir vorsichtig.', 'Angesichts die Lage bleiben wir vorsichtig.', '„Angesichts“ verlangt den Genitiv.'),
  d('de.du.04', 'de.genitiv', 2, 'Statt eines Briefes schickte er eine E-Mail.', 'Statt einem Brief schickte er eine E-Mail.', '„Statt“ steht standardsprachlich mit Genitiv.', STANDARD),
  d('de.du.05', 'de.genitiv', 3, 'Innerhalb eines Jahres wurde das Gebäude saniert.', 'Innerhalb einem Jahr wurde das Gebäude saniert.', '„Innerhalb“ verlangt den Genitiv, sobald er erkennbar ist.'),
  d('de.du.06', 'de.genitiv', 4, 'Mangels Beweisen wurde der Angeklagte freigesprochen.', 'Mangels Beweise wurde der Angeklagte freigesprochen.', 'Ist der Genitiv Plural nicht erkennbar (kein Artikel, kein Adjektiv), weicht „mangels“ in den Dativ aus: mangels Beweisen.'),
  d('de.du.07', 'de.genitiv', 4, 'Die Firma spendete zugunsten krebskranker Kinder.', 'Die Firma spendete zugunsten krebskranken Kindern.', '„Zugunsten“ verlangt den Genitiv; das Adjektiv zeigt ihn: krebskranker.'),
  d('de.du.08', 'de.rektion', 1, 'Ich danke dir für deine Hilfe.', 'Ich danke dich für deine Hilfe.', '„Danken“ verlangt den Dativ.'),
  d('de.du.09', 'de.rektion', 2, 'Wir gedachten der Verstorbenen.', 'Wir gedachten den Verstorbenen.', '„Gedenken“ verlangt den Genitiv.'),
  d('de.du.10', 'de.rektion', 2, 'Sie ist sich der Risiken bewusst.', 'Sie ist sich die Risiken bewusst.', 'Sich einer Sache bewusst sein – mit Genitiv.'),
  d('de.du.11', 'de.rektion', 3, 'Das bedarf keiner weiteren Erklärung.', 'Das bedarf keine weitere Erklärung.', '„Bedürfen“ verlangt den Genitiv.'),
  d('de.du.12', 'de.rektion', 3, 'Der Lehrer fragte den Schüler nach der Lösung.', 'Der Lehrer fragte dem Schüler nach der Lösung.', '„Fragen“ verlangt den Akkusativ: jemanden fragen.'),
  d('de.du.13', 'de.rektion', 4, 'Er wurde des Betrugs überführt.', 'Er wurde dem Betrug überführt.', 'Jemanden einer Tat überführen – mit Genitiv.'),
  d('de.du.14', 'de.rektion', 4, 'Man hat ihn seines Amtes enthoben.', 'Man hat ihn von seinem Amt enthoben.', '„Entheben“ steht mit Genitiv, ohne „von“.'),
  d('de.du.15', 'de.adjektiv', 1, 'Wir suchen einen erfahrenen Mitarbeiter.', 'Wir suchen einen erfahrener Mitarbeiter.', 'Nach „einen“ endet das Adjektiv auf -en.'),
  d('de.du.16', 'de.adjektiv', 2, 'Bei schönem Wetter essen wir draußen.', 'Bei schönen Wetter essen wir draußen.', 'Ohne Artikel trägt das Adjektiv die Endung des Dativs: schönem.'),
  d('de.du.17', 'de.adjektiv', 3, 'Das ist das Ergebnis vieler kleiner Schritte.', 'Das ist das Ergebnis vieler kleinen Schritte.', 'Nach „vieler“ wird das Adjektiv stark dekliniert: kleiner.'),
  d('de.du.18', 'de.adjektiv', 3, 'Einige wichtige Fragen sind noch offen.', 'Einige wichtigen Fragen sind noch offen.', 'Nach „einige“ folgt die starke Endung: wichtige.'),
  d('de.du.19', 'de.ndekl', 1, 'Ich habe den Kunden angerufen.', 'Ich habe den Kunde angerufen.', '„Kunde“ gehört zur n-Deklination: den Kunden.'),
  d('de.du.20', 'de.ndekl', 2, 'Die Rede des Präsidenten war kurz.', 'Die Rede des Präsidents war kurz.', 'n-Deklination: des Präsidenten.'),
  d('de.du.21', 'de.ndekl', 3, 'Er hat sich den Namen notiert.', 'Er hat sich den Name notiert.', '„Name“: den Namen, dem Namen, des Namens.'),
  d('de.du.22', 'de.ndekl', 3, 'Wir sprachen lange mit Herrn Schmidt.', 'Wir sprachen lange mit Herr Schmidt.', '„Herr“ wird dekliniert: mit Herrn Schmidt.'),
  d('de.du.23', 'de.ndekl', 4, 'Ich danke Ihnen von ganzem Herzen.', 'Ich danke Ihnen von ganzem Herz.', 'Dativ von „Herz“: dem Herzen.'),
  d('de.du.24', 'de.konnektoren', 1, 'Obwohl es regnete, gingen wir spazieren.', 'Trotzdem es regnete, gingen wir spazieren.', '„Trotzdem“ als Einleitung eines Nebensatzes ist umgangssprachlich; standardsprachlich: obwohl.', STANDARD),
  d('de.du.25', 'de.konnektoren', 2, 'Er blieb zu Hause, denn er war krank.', 'Er blieb zu Hause, denn er krank war.', 'Nach „denn“ bleibt die Wortstellung des Hauptsatzes: Verb an zweiter Stelle.'),
  d('de.du.26', 'de.konnektoren', 2, 'Je mehr man übt, desto sicherer wird man.', 'Je mehr man übt, desto sicherer man wird.', 'Nach „desto + Komparativ“ folgt das Verb direkt: desto sicherer wird man.'),
  d('de.du.27', 'de.konnektoren', 3, 'Sie hat nicht nur studiert, sondern auch gearbeitet.', 'Sie hat nicht nur studiert, aber auch gearbeitet.', 'Die Verbindung heißt „nicht nur …, sondern auch“.'),
  d('de.du.28', 'de.konnektoren', 3, 'Er redet, als wüsste er alles.', 'Er redet, als ob wüsste er alles.', 'Nach „als“ folgt das Verb direkt (als wüsste er), nach „als ob“ steht es am Ende (als ob er alles wüsste).'),
  d('de.du.29', 'de.nebensatz', 1, 'Ich glaube, dass er recht hat.', 'Ich glaube, dass er hat recht.', 'Im Nebensatz steht das finite Verb am Ende.'),
  d('de.du.30', 'de.nebensatz', 4, 'Ich weiß, dass sie gestern hat arbeiten müssen.', 'Ich weiß, dass sie gestern arbeiten müssen hat.', 'Beim Ersatzinfinitiv steht das finite Verb vor den beiden Infinitiven.'),
  d('de.du.31', 'de.nebensatz', 5, 'Er gab zu, dass er es nicht hätte tun sollen.', 'Er gab zu, dass er es nicht tun sollen hätte.', 'Auch im Konjunktiv gilt: finites Verb vor die Infinitivgruppe – hätte tun sollen.'),
  d('de.du.32', 'de.relativ', 2, 'Das ist alles, was ich weiß.', 'Das ist alles, das ich weiß.', 'Nach „alles“ steht „was“.'),
  d('de.du.33', 'de.relativ', 3, 'Die Nachbarn, deren Garten verwildert ist, sind verreist.', 'Die Nachbarn, dessen Garten verwildert ist, sind verreist.', 'Bezugswort im Plural → „deren“.'),
  d('de.du.34', 'de.relativ', 3, 'Das sind die Kollegen, denen ich am meisten vertraue.', 'Das sind die Kollegen, die ich am meisten vertraue.', '„Vertrauen“ verlangt den Dativ → „denen“.'),
  d('de.du.35', 'de.wortstellung', 2, 'Ich habe es ihm gestern gegeben.', 'Ich habe ihm es gestern gegeben.', 'Zwei Pronomen: Akkusativ vor Dativ – es ihm.'),
  d('de.du.36', 'de.wortstellung', 3, 'Hast du ihr die Nachricht schon geschickt?', 'Hast du die Nachricht ihr schon geschickt?', 'Ein Pronomen steht vor einem Nomen im Mittelfeld: ihr die Nachricht.'),
  d('de.du.37', 'de.wortstellung', 1, 'Morgen wird der Bericht veröffentlicht.', 'Morgen der Bericht wird veröffentlicht.', 'Im Aussagesatz steht das finite Verb an zweiter Stelle.'),
  d('de.du.38', 'de.passiv', 1, 'Die Rechnung muss bezahlt werden.', 'Die Rechnung muss bezahlen werden.', 'Passiv mit Modalverb: Partizip II + werden.'),
  d('de.du.39', 'de.passiv', 2, 'Das Museum wurde 1905 eröffnet.', 'Das Museum ist 1905 eröffnet geworden.', 'Im Passiv-Perfekt heißt es „worden“ – schlanker ist hier das Präteritum „wurde eröffnet“.'),
  d('de.du.40', 'de.passiv', 3, 'Der Antrag ist genehmigt worden.', 'Der Antrag ist genehmigt geworden.', 'Passiv-Perfekt: „ist … worden“, nie „geworden“.'),
  d('de.du.41', 'de.passiv', 4, 'Die Unterlagen sind bis Freitag einzureichen.', 'Die Unterlagen sind bis Freitag einreichen.', '„Sein + zu + Infinitiv“: sind einzureichen.'),
  d('de.du.42', 'de.konj2', 1, 'Wenn ich Zeit hätte, käme ich mit.', 'Wenn ich Zeit habe, käme ich mit.', 'Irreale Bedingung: beide Teile im Konjunktiv II.'),
  d('de.du.43', 'de.konj2', 2, 'Er tut so, als hätte er nichts gehört.', 'Er tut so, als hat er nichts gehört.', 'Nach „als“ mit Verbzweitstellung steht der Konjunktiv: als hätte er.'),
  d('de.du.44', 'de.konj2', 3, 'Wäre ich an deiner Stelle, würde ich kündigen.', 'Würde ich an deiner Stelle sein, würde ich kündigen.', '„Würde sein“ ist schwerfällig – bei „sein“ nimmt man die eigene Form „wäre“.', 'Welcher Satz ist stilistisch besser?'),
  d('de.du.45', 'de.konj2', 4, 'Hätte sie das gewusst, wäre sie früher gegangen.', 'Hätte sie das gewusst, hätte sie früher gegangen.', '„Gehen“ bildet das Perfekt mit „sein“: wäre gegangen.'),
  d('de.du.46', 'de.konj1', 2, 'Sie sagte, sie sei müde.', 'Sie sagte, sie seie müde.', 'Konjunktiv I von „sein“: sie sei.'),
  d('de.du.47', 'de.konj1', 3, 'Die Zeugen gaben an, sie hätten nichts gesehen.', 'Die Zeugen gaben an, sie haben nichts gesehen.', 'Konjunktiv I „sie haben“ gleicht dem Indikativ – in der indirekten Rede nimmt man dann den Konjunktiv II: hätten.', 'Welcher Satz folgt der Regel für die indirekte Rede?'),
  d('de.du.48', 'de.konj1', 4, 'Der Minister erklärte, er werde zurücktreten.', 'Der Minister erklärte, er wird zurücktreten.', 'In Nachrichten steht die indirekte Rede im Konjunktiv I – so ist klar, dass es eine wiedergegebene Aussage ist.', 'Welcher Satz passt in eine Nachrichtenmeldung?'),
  d('de.du.49', 'de.partizip', 3, 'Die zu erwartenden Kosten sind hoch.', 'Die zu erwartende Kosten sind hoch.', 'Nach „die“ im Plural: zu erwartenden.'),
  d('de.du.50', 'de.partizip', 4, 'Der seit Jahren schwelende Konflikt eskalierte.', 'Der seit Jahren geschwelte Konflikt eskalierte.', 'Ein andauernder Vorgang steht im Partizip I: schwelend. „Geschwelt“ taugt nicht als Attribut.'),
  d('de.du.51', 'de.komma', 1, 'Ich hoffe, dass es klappt.', 'Ich hoffe dass es klappt.', 'Vor „dass“ steht ein Komma.'),
  d('de.du.52', 'de.komma', 2, 'Er ging, ohne sich umzudrehen.', 'Er ging ohne, sich umzudrehen.', 'Das Komma steht vor der ganzen Infinitivgruppe: , ohne sich umzudrehen.'),
  d('de.du.53', 'de.komma', 3, 'Wir brauchen Mehl, Eier sowie etwas Zucker.', 'Wir brauchen Mehl, Eier, sowie etwas Zucker.', 'Vor „sowie“ steht in Aufzählungen kein Komma.'),
  d('de.du.54', 'de.komma', 4, 'Frau Klein, unsere neue Leiterin, stellt sich vor.', 'Frau Klein, unsere neue Leiterin stellt sich vor.', 'Die Apposition wird auch hinten mit Komma geschlossen.'),
  d('de.du.55', 'de.wortwahl', 1, 'Das ist die einzige Möglichkeit.', 'Das ist die einzigste Möglichkeit.', '„Einzig“ ist nicht steigerbar.'),
  d('de.du.56', 'de.wortwahl', 1, 'Seid ihr bereit?', 'Seit ihr bereit?', '„Seid“ ist die Verbform, „seit“ die Präposition.'),
  d('de.du.57', 'de.wortwahl', 2, 'Er ist größer als ich.', 'Er ist größer wie ich.', 'Nach dem Komparativ steht „als“.'),
  d('de.du.58', 'de.wortwahl', 3, 'Er ist anscheinend krank – er hustet ständig.', 'Er ist scheinbar krank – er hustet ständig.', '„Anscheinend“: wohl wirklich so. „Scheinbar“: nur dem Anschein nach.', 'Welcher Satz sagt: Er ist vermutlich wirklich krank?'),
  d('de.du.59', 'de.kollokation', 1, 'Wir müssen bald eine Entscheidung treffen.', 'Wir müssen bald eine Entscheidung machen.', 'Eine Entscheidung trifft man.'),
  d('de.du.60', 'de.kollokation', 2, 'Sie hat beim Amt einen Antrag gestellt.', 'Sie hat beim Amt einen Antrag gemacht.', 'Beim Amt stellt man einen Antrag. „Einen Antrag machen“ meint den Heiratsantrag.'),
  d('de.du.61', 'de.kollokation', 3, 'Die Opposition übte scharfe Kritik.', 'Die Opposition machte scharfe Kritik.', 'Kritik übt man.'),
  d('de.du.62', 'de.kollokation', 4, 'Das Unternehmen zog die Konsequenzen.', 'Das Unternehmen nahm die Konsequenzen.', 'Konsequenzen zieht man (oder trägt sie).'),
  d('de.du.63', 'de.idiom', 2, 'Er hat den Nagel auf den Kopf getroffen.', 'Er hat den Nagel auf den Punkt getroffen.', 'Die Wendung lautet „den Nagel auf den Kopf treffen“. „Auf den Punkt bringen“ ist eine andere.'),
  d('de.du.64', 'de.idiom', 3, 'Sie wirft nicht gleich die Flinte ins Korn.', 'Sie wirft nicht gleich die Flinte ins Feld.', '„Die Flinte ins Korn werfen“ = vorschnell aufgeben.'),
  d('de.du.65', 'de.idiom', 4, 'Er hat sich mit fremden Federn geschmückt.', 'Er hat sich mit fremden Federn geziert.', '„Sich mit fremden Federn schmücken“ = fremde Leistungen als eigene ausgeben.'),
  d('de.du.66', 'de.meister', 3, 'Die Anzahl der Anmeldungen ist gestiegen.', 'Die Anzahl der Anmeldungen sind gestiegen.', 'Subjekt ist „die Anzahl“ (Singular).'),
  d('de.du.67', 'de.meister', 3, 'Des Weiteren wurde beschlossen, das Budget zu erhöhen.', 'Desweiteren wurde beschlossen, das Budget zu erhöhen.', '„Des Weiteren“ schreibt man getrennt und mit großem W.'),
  d('de.du.68', 'de.meister', 4, 'Die Kollegin ist zurzeit im Urlaub.', 'Die Kollegin ist zur Zeit im Urlaub.', '„Zurzeit“ = derzeit, zusammengeschrieben.'),
  d('de.du.69', 'de.meister', 5, 'Er ist einer der wenigen, die das verstehen.', 'Er ist einer der wenigen, der das versteht.', 'Der Relativsatz gehört zu „der wenigen“ (Plural).'),
  d('de.du.70', 'de.meister', 5, 'Sie ist eine der Ersten, die gekommen sind.', 'Sie ist eine der Ersten, die gekommen ist.', 'Bezugswort ist „der Ersten“ (Plural) – das Verb steht im Plural.'),
]

// ---------- Umformung ----------

function u(id: string, ziel: string, stufe: Stufe, quelle: string, richtung: string, liste: string[], erklaerung: string, mehr?: string): WahlItem {
  return { id, spiel: 'de.umformung', art: 'wahl', ziel, stufe, quelle, richtung, optionen: optionen(liste), erklaerung, ...(mehr ? { mehr } : {}) }
}

export const UMFORMUNG: WahlItem[] = [
  u('de.um.01', 'de.passiv', 1, 'Der Techniker repariert die Heizung.', 'Passiv, Präsens', [
    'Die Heizung wird vom Techniker repariert.',
    'Die Heizung wurde vom Techniker repariert.::Das ist Präteritum – verlangt war Präsens.',
    'Die Heizung ist vom Techniker repariert.::Das ist Zustandspassiv: Es beschreibt das Ergebnis, nicht den Vorgang.',
    'Die Heizung wird vom Techniker repariert worden.::„Worden“ gehört ins Perfekt, nicht ins Präsens.',
  ], 'Vorgangspassiv im Präsens: werden + Partizip II.'),
  u('de.um.02', 'de.passiv', 2, 'Man hat den Vertrag gestern unterschrieben.', 'Passiv, Perfekt', [
    'Der Vertrag ist gestern unterschrieben worden.',
    'Der Vertrag ist gestern unterschrieben geworden.::Im Passiv heißt es „worden“.',
    'Der Vertrag wurde gestern unterschrieben worden.::„Wurde“ und „worden“ passen nicht zusammen.',
    'Der Vertrag hat gestern unterschrieben werden.::Das Passiv-Perfekt bildet man mit „sein“.',
  ], 'Passiv-Perfekt: sein + Partizip II + worden.'),
  u('de.um.03', 'de.passiv', 3, 'Man muss die Anträge bis Freitag einreichen.', 'Passiv mit Modalverb', [
    'Die Anträge müssen bis Freitag eingereicht werden.',
    'Die Anträge müssen bis Freitag eingereicht worden.::Nach dem Modalverb steht der Passiv-Infinitiv: eingereicht werden.',
    'Die Anträge werden bis Freitag eingereicht müssen.::Die Reihenfolge stimmt nicht.',
    'Die Anträge müssen bis Freitag einreichen werden.::Es braucht das Partizip: eingereicht.',
  ], 'Modalverb + Partizip II + werden.'),
  u('de.um.04', 'de.passiv', 3, 'Die Aufgabe kann leicht gelöst werden.', 'Passiversatz mit „sich lassen“', [
    'Die Aufgabe lässt sich leicht lösen.',
    'Die Aufgabe lässt sich leicht gelöst.::Nach „sich lassen“ steht der Infinitiv.',
    'Die Aufgabe lässt leicht lösen.::Das Reflexivpronomen „sich“ fehlt.',
    'Die Aufgabe lässt sich leicht zu lösen.::Nach „lassen“ steht der Infinitiv ohne „zu“.',
  ], '„Sich lassen + Infinitiv“ drückt eine Möglichkeit aus wie das Passiv mit „können“.'),
  u('de.um.05', 'de.passiv', 4, 'Die Rechnung muss sofort bezahlt werden.', 'Passiversatz mit „sein + zu“', [
    'Die Rechnung ist sofort zu bezahlen.',
    'Die Rechnung ist sofort bezahlen.::Es fehlt das „zu“.',
    'Die Rechnung hat sofort zu bezahlen.::„Haben + zu“ hieße: Die Rechnung selbst muss zahlen.',
    'Die Rechnung ist sofort zu bezahlt.::Nach „zu“ steht der Infinitiv.',
  ], '„Sein + zu + Infinitiv“ ersetzt das Passiv mit „müssen“ oder „können“.'),
  u('de.um.06', 'de.passiv', 4, 'Diese Handschrift kann man kaum lesen.', 'Adjektiv auf -bar', [
    'Diese Handschrift ist kaum lesbar.',
    'Diese Handschrift ist kaum zu gelesen.::Nach „zu“ steht der Infinitiv.',
    'Diese Handschrift lässt kaum lesen.::Hier fehlt „sich“.',
    'Diese Handschrift ist kaum lesend.::Das Partizip I hätte aktive Bedeutung.',
  ], 'Adjektive auf -bar drücken eine passive Möglichkeit aus: lesbar = kann gelesen werden.'),
  u('de.um.07', 'de.passiv', 5, 'Man hätte das Problem früher erkennen müssen.', 'Passiv', [
    'Das Problem hätte früher erkannt werden müssen.',
    'Das Problem hätte früher erkannt worden müssen.::Der Passiv-Infinitiv heißt „erkannt werden“.',
    'Das Problem müsste früher erkannt worden sein.::Das wäre eine Vermutung – der Sinn ändert sich.',
    'Das Problem hätte früher erkennen werden müssen.::Es braucht das Partizip: erkannt.',
  ], 'Konjunktiv II Vergangenheit mit Modalverb im Passiv: hätte + Partizip II + werden + müssen.'),
  u('de.um.08', 'de.konj2', 1, 'Ich habe kein Geld, deshalb kaufe ich das Auto nicht.', 'Irreale Bedingung (Gegenwart)', [
    'Wenn ich Geld hätte, würde ich das Auto kaufen.',
    'Wenn ich Geld habe, kaufe ich das Auto.::Das ist eine reale Bedingung.',
    'Wenn ich Geld hatte, würde ich das Auto kaufen.::„Hatte“ ist Indikativ Präteritum.',
    'Wenn ich Geld hätte, hätte ich das Auto kaufen.::„Hätte … kaufen“ ist keine Form.',
  ], 'Irreal in der Gegenwart: Konjunktiv II in beiden Teilen.'),
  u('de.um.09', 'de.konj2', 2, 'Er ist nicht rechtzeitig gekommen, deshalb hat er den Anfang verpasst.', 'Irreale Bedingung (Vergangenheit)', [
    'Wenn er rechtzeitig gekommen wäre, hätte er den Anfang nicht verpasst.',
    'Wenn er rechtzeitig gekommen hätte, hätte er den Anfang nicht verpasst.::„Kommen“ bildet das Perfekt mit „sein“.',
    'Wenn er rechtzeitig käme, verpasste er den Anfang nicht.::Das ist Gegenwart, nicht Vergangenheit.',
    'Wenn er rechtzeitig gekommen wäre, wäre er den Anfang nicht verpasst.::„Verpassen“ bildet das Perfekt mit „haben“.',
  ], 'Irreal in der Vergangenheit: wäre/hätte + Partizip II.'),
  u('de.um.10', 'de.konj2', 2, 'Kannst du mir helfen?', 'Höfliche Bitte', [
    'Könntest du mir bitte helfen?',
    'Konntest du mir helfen?::Das ist Präteritum, keine Höflichkeitsform.',
    'Kannst du mir helfen würden?::Das ist keine Form.',
    'Würdest du mir helfen können haben?::Das ist verdreht.',
  ], 'Der Konjunktiv II macht eine Bitte höflicher: könntest, würdest, hättest.'),
  u('de.um.11', 'de.konj2', 3, 'Es ist schade, dass ich das nicht weiß.', 'Wunschsatz', [
    'Wenn ich das doch wüsste!',
    'Wenn ich das doch wusste!::„Wusste“ ist Indikativ.',
    'Wenn ich das doch weiß!::Wunschsätze stehen im Konjunktiv II.',
    'Wenn ich das doch gewusst hätte!::Das bezieht sich auf die Vergangenheit.',
  ], 'Irreale Wünsche stehen im Konjunktiv II.'),
  u('de.um.12', 'de.konj2', 4, 'Er tut so. Angeblich hat er alles verstanden.', 'Vergleichssatz mit „als“', [
    'Er tut so, als hätte er alles verstanden.',
    'Er tut so, als ob hätte er alles verstanden.::Nach „als ob“ steht das Verb am Ende.',
    'Er tut so, als er hätte alles verstanden.::Nach „als“ folgt direkt das Verb.',
    'Er tut so, als hat er alles verstanden.::Der irreale Vergleich verlangt den Konjunktiv.',
  ], 'Irrealer Vergleich: „als + Verb“ oder „als ob … + Verb am Ende“, jeweils im Konjunktiv.'),
  u('de.um.13', 'de.konj1', 2, 'Sie sagt: „Ich bin krank.“', 'Indirekte Rede', [
    'Sie sagt, sie sei krank.',
    'Sie sagt, ich sei krank.::Das Pronomen muss sich anpassen: sie.',
    'Sie sagt, sie seie krank.::„Seie“ gibt es nicht.',
    'Sie sagt, sie wäre gewesen krank.::Zeit und Wortstellung stimmen nicht.',
  ], 'Indirekte Rede: Pronomen anpassen, Verb in den Konjunktiv I.'),
  u('de.um.14', 'de.konj1', 3, 'Der Minister sagte: „Wir werden die Steuern nicht erhöhen.“', 'Indirekte Rede', [
    'Der Minister sagte, sie würden die Steuern nicht erhöhen.',
    'Der Minister sagte, wir werden die Steuern nicht erhöhen.::Das Pronomen passt nicht zur indirekten Rede.',
    'Der Minister sagte, sie werden die Steuern nicht erhöhen.::„Sie werden“ gleicht dem Indikativ – dann nimmt man den Konjunktiv II.',
    'Der Minister sagte, sie wären die Steuern nicht erhöhen.::„Wären … erhöhen“ ist keine Form.',
  ], 'Wenn der Konjunktiv I dem Indikativ gleicht (sie werden), weicht man in den Konjunktiv II aus (sie würden).'),
  u('de.um.15', 'de.konj1', 3, 'Die Firma teilte mit: „Der Fehler wurde behoben.“', 'Indirekte Rede', [
    'Die Firma teilte mit, der Fehler sei behoben worden.',
    'Die Firma teilte mit, der Fehler wurde behoben worden.::Vergangenheit in indirekter Rede: sei … worden.',
    'Die Firma teilte mit, der Fehler würde behoben.::Das klingt nach Zukunft oder Bedingung.',
    'Die Firma teilte mit, der Fehler sei behoben geworden.::Im Passiv heißt es „worden“.',
  ], 'Vergangenheit im Konjunktiv I: sei/habe + Partizip II; im Passiv: sei … worden.'),
  u('de.um.16', 'de.konj1', 4, 'Er fragte: „Wann beginnt die Sitzung?“', 'Indirekte Frage', [
    'Er fragte, wann die Sitzung beginne.',
    'Er fragte, wann beginne die Sitzung.::In der indirekten Frage steht das Verb am Ende.',
    'Er fragte, ob die Sitzung wann beginne.::„Ob“ gehört zu Ja-Nein-Fragen.',
    'Er fragte, wann die Sitzung beginne?::Eine indirekte Frage endet mit Punkt.',
  ], 'Indirekte W-Frage: Fragewort bleibt, Verb am Ende, Konjunktiv I, Punkt statt Fragezeichen.'),
  u('de.um.17', 'de.konj1', 4, 'Die Ärztin riet: „Nehmen Sie das Medikament zweimal täglich!“', 'Indirekte Aufforderung', [
    'Die Ärztin riet, er solle das Medikament zweimal täglich nehmen.',
    'Die Ärztin riet, er nehme das Medikament zweimal täglich.::Ohne „sollen“ geht die Aufforderung verloren.',
    'Die Ärztin riet, nehmen Sie das Medikament zweimal täglich.::Das ist direkte Rede ohne Anführungszeichen.',
    'Die Ärztin riet, er soll nehmen das Medikament zweimal täglich.::Wortstellung und Modus stimmen nicht.',
  ], 'Aufforderungen gibt man in der indirekten Rede mit „sollen“ (oder „mögen“) wieder.'),
  u('de.um.18', 'de.konj1', 5, 'Die Zeugen erklärten: „Wir haben den Mann nie gesehen.“', 'Indirekte Rede', [
    'Die Zeugen erklärten, sie hätten den Mann nie gesehen.',
    'Die Zeugen erklärten, sie haben den Mann nie gesehen.::„Sie haben“ gleicht dem Indikativ – Ersatzform „hätten“.',
    'Die Zeugen erklärten, wir hätten den Mann nie gesehen.::Das Pronomen muss sich anpassen.',
    'Die Zeugen erklärten, sie seien den Mann nie gesehen.::„Sehen“ bildet das Perfekt mit „haben“.',
  ], '3. Person Plural: Konjunktiv I „haben“ = Indikativ → Konjunktiv II „hätten“.'),
  u('de.um.19', 'de.partizip', 3, 'Der Plan, der vom Vorstand beschlossen wurde, tritt im Mai in Kraft.', 'Partizipialattribut', [
    'Der vom Vorstand beschlossene Plan tritt im Mai in Kraft.',
    'Der vom Vorstand beschließende Plan tritt im Mai in Kraft.::Partizip I wäre aktiv: Der Plan beschließt selbst.',
    'Der vom Vorstand beschlossener Plan tritt im Mai in Kraft.::Nach „der“ endet das Attribut auf -e.',
    'Der Plan vom Vorstand beschlossen tritt im Mai in Kraft.::Das Attribut steht vor dem Nomen.',
  ], 'Aus dem Relativsatz wird ein vorangestelltes Partizip II mit Adjektivendung.'),
  u('de.um.20', 'de.partizip', 4, 'Die Unterlagen, die noch geprüft werden müssen, liegen im Büro.', 'Gerundiv (zu + Partizip I)', [
    'Die noch zu prüfenden Unterlagen liegen im Büro.',
    'Die noch zu geprüften Unterlagen liegen im Büro.::Das Gerundiv bildet man mit dem Partizip I.',
    'Die noch prüfenden Unterlagen liegen im Büro.::Ohne „zu“ wären die Unterlagen die Prüfenden.',
    'Die noch zu prüfende Unterlagen liegen im Büro.::Nach „die“ im Plural endet das Attribut auf -en.',
  ], '„Zu + Partizip I“ drückt eine Notwendigkeit oder Möglichkeit aus: die zu prüfenden Unterlagen.'),
  u('de.um.21', 'de.partizip', 5, 'Die Preise, die seit Monaten steigen, belasten die Haushalte.', 'Partizipialattribut', [
    'Die seit Monaten steigenden Preise belasten die Haushalte.',
    'Die seit Monaten gestiegenen Preise belasten die Haushalte.::„Gestiegen“ klingt abgeschlossen – gemeint ist ein andauernder Vorgang.',
    'Die seit Monaten steigende Preise belasten die Haushalte.::Nach „die“ im Plural: steigenden.',
    'Die seit Monaten steigenden Preisen belasten die Haushalte.::„Preise“ ist hier Nominativ.',
  ], 'Ein andauernder Vorgang wird zum Partizip I: die steigenden Preise.'),
  u('de.um.22', 'de.nominal', 3, 'Weil es stark regnete, wurde das Spiel abgesagt.', 'Nominalstil', [
    'Wegen starken Regens wurde das Spiel abgesagt.',
    'Wegen stark Regen wurde das Spiel abgesagt.::Das Adjektiv braucht eine Endung.',
    'Wegen des starken Regnens wurde das Spiel abgesagt.::Umständlich – das Nomen heißt „Regen“.',
    'Wegen starkem Regens wurde das Spiel abgesagt.::Genitiv maskulin mit -s am Nomen: starken Regens.',
  ], 'Aus dem Nebensatz wird eine Präpositionalgruppe: wegen starken Regens.'),
  u('de.um.23', 'de.nominal', 4, 'Bevor der Vertrag unterzeichnet wird, prüfen wir alle Klauseln.', 'Nominalstil', [
    'Vor Unterzeichnung des Vertrags prüfen wir alle Klauseln.',
    'Vor der Unterzeichnen des Vertrags prüfen wir alle Klauseln.::Das Nomen heißt „Unterzeichnung“.',
    'Vor Unterzeichnung vom Vertrag wir prüfen alle Klauseln.::Wortstellung und Genitiv stimmen nicht.',
    'Bevor Unterzeichnung des Vertrags prüfen wir alle Klauseln.::„Bevor“ ist eine Konjunktion, keine Präposition.',
  ], '„Bevor …“ wird zu „vor + Nomen“.'),
  u('de.um.24', 'de.nominal', 4, 'Nach Rücksprache mit der Leitung genehmigen wir den Antrag.', 'Verbalstil', [
    'Nachdem wir mit der Leitung gesprochen haben, genehmigen wir den Antrag.',
    'Nachdem wir mit der Leitung Rücksprache gehalten werden, genehmigen wir den Antrag.::Hier ist ein Passiv hineingeraten.',
    'Nach wir mit der Leitung gesprochen haben, genehmigen wir den Antrag.::„Nach“ ist eine Präposition – es braucht „nachdem“.',
    'Nachdem mit der Leitung zurückgesprochen wurde, genehmigen wir den Antrag.::„Zurücksprechen“ ist hier kein passendes Verb.',
  ], 'Verbalstil macht Texte lebendiger: Aus „nach Rücksprache“ wird „nachdem wir gesprochen haben“.'),
  u('de.um.25', 'de.konnektoren', 2, 'Es regnete. Wir gingen trotzdem spazieren.', 'Ein Satz mit „obwohl“', [
    'Obwohl es regnete, gingen wir spazieren.',
    'Obwohl es regnete, wir gingen spazieren.::Nach dem Nebensatz steht das Verb des Hauptsatzes vorn.',
    'Obwohl regnete es, gingen wir spazieren.::Im Nebensatz steht das Verb am Ende.',
    'Obwohl es regnete, gingen wir trotzdem nicht spazieren.::Der Sinn ist umgedreht.',
  ], 'Der Nebensatz steht vorn, danach folgt direkt das Verb des Hauptsatzes.'),
  u('de.um.26', 'de.konnektoren', 3, 'Sie übte täglich. Dadurch wurde sie besser.', 'Mit „indem“', [
    'Sie wurde besser, indem sie täglich übte.',
    'Sie wurde besser, indem übte sie täglich.::Im Nebensatz steht das Verb am Ende.',
    'Indem sie besser wurde, übte sie täglich.::Mittel und Ergebnis sind vertauscht.',
    'Sie wurde besser, indem dass sie täglich übte.::„Indem“ braucht kein „dass“.',
  ], '„Indem“ nennt das Mittel: Wie wurde sie besser? Indem sie übte.'),
  u('de.um.27', 'de.konnektoren', 4, 'Die Nachfrage steigt. Die Preise steigen entsprechend.', 'Mit „je … desto“', [
    'Je stärker die Nachfrage steigt, desto höher steigen die Preise.',
    'Je stärker die Nachfrage steigt, desto die Preise steigen höher.::Nach „desto“ folgt der Komparativ, dann das Verb.',
    'Je stärker steigt die Nachfrage, desto höher steigen die Preise.::Nach „je“ steht das Verb am Ende.',
    'Desto stärker die Nachfrage steigt, je höher steigen die Preise.::Die Teile sind vertauscht.',
  ], '„Je + Komparativ … Verb am Ende, desto + Komparativ + Verb …“'),
]

// ---------- Satzarchitekt ----------

function b(
  id: string,
  ziel: string,
  stufe: Stufe,
  text: string,
  erklaerung: string,
  extra?: { fest?: number; alternativen?: string[]; extra?: string[] },
): BauItem {
  return {
    id,
    spiel: 'de.architekt',
    art: 'bau',
    ziel,
    stufe,
    teile: bausteine(text),
    fest: extra?.fest ?? 1,
    ...(extra?.alternativen ? { alternativen: extra.alternativen.map(bausteine) } : {}),
    ...(extra?.extra ? { extra: extra.extra } : {}),
    erklaerung,
  }
}

export const ARCHITEKT: BauItem[] = [
  b('de.ar.01', 'de.nebensatz', 1, 'Ich weiß nicht, | ob | er | morgen | kommt.', 'Im Nebensatz mit „ob“ steht das Verb am Ende.'),
  b('de.ar.02', 'de.wortstellung', 1, 'Gestern | hat | mir | meine Kollegin | ein Buch | geschenkt.', 'Das Verb steht an zweiter Stelle, das Partizip am Ende. Pronomen stehen meist früh im Mittelfeld.', {
    alternativen: ['Gestern | hat | meine Kollegin | mir | ein Buch | geschenkt.'],
  }),
  b('de.ar.03', 'de.nebensatz', 2, 'Obwohl | es | stark | regnete, | fand | das Konzert | statt.', 'Nach dem Nebensatz steht zuerst das Verb des Hauptsatzes.'),
  b('de.ar.04', 'de.konnektoren', 2, 'Er | kam | zu spät, | weil | sein Zug | Verspätung | hatte.', 'Nach „weil“ wandert das Verb ans Ende.'),
  b('de.ar.05', 'de.passiv', 2, 'Der Vertrag | muss | bis Freitag | unterschrieben | werden.', 'Passiv mit Modalverb: Partizip und „werden“ bilden die Klammer am Ende.'),
  b('de.ar.06', 'de.relativ', 3, 'Das ist | die Kollegin, | deren | Vorschlag | wir | angenommen | haben.', '„Deren“ bezieht sich auf „die Kollegin“; im Relativsatz steht das Verb am Ende.'),
  b('de.ar.07', 'de.konj2', 3, 'Wenn | ich | das | gewusst | hätte, | wäre | ich | gekommen.', 'Irreale Bedingung der Vergangenheit: hätte gewusst – wäre gekommen.'),
  b('de.ar.08', 'de.wortstellung', 3, 'Hast du | ihr | die Nachricht | schon | geschickt?', 'Pronomen vor Nomen im Mittelfeld.', {
    alternativen: ['Hast du | ihr | schon | die Nachricht | geschickt?'],
  }),
  b('de.ar.09', 'de.konj1', 3, 'Sie sagte, | dass | sie | den Bericht | morgen | abgeben | werde.', 'Indirekte Rede mit „dass“: Verbgruppe am Ende, Konjunktiv I „werde“.', {
    alternativen: ['Sie sagte, | dass | sie | morgen | den Bericht | abgeben | werde.'],
  }),
  b('de.ar.10', 'de.nebensatz', 4, 'Ich glaube, | dass | er | das Formular | hat | ausfüllen | müssen.', 'Ersatzinfinitiv: Das finite Verb „hat“ steht vor den beiden Infinitiven.', { extra: ['gemusst'] }),
  b('de.ar.11', 'de.partizip', 4, 'Die | vom Vorstand | beschlossene | Maßnahme | tritt | im Mai | in Kraft.', 'Das erweiterte Attribut steht zwischen Artikel und Nomen.', { extra: ['beschlossenen'] }),
  b('de.ar.12', 'de.konj1', 4, 'Der Sprecher | erklärte, | das Unternehmen | habe | von den Vorwürfen | nichts | gewusst.', 'Indirekte Rede ohne „dass“: Verb an zweiter Stelle, Konjunktiv I.', {
    fest: 2,
    alternativen: ['Der Sprecher | erklärte, | das Unternehmen | habe | nichts | von den Vorwürfen | gewusst.'],
    extra: ['hat'],
  }),
  b('de.ar.13', 'de.nebensatz', 5, 'Er bedauerte, | dass | er | das Angebot | nicht | hatte | annehmen | können.', 'Ersatzinfinitiv im Plusquamperfekt: hatte annehmen können.', { extra: ['gekonnt'] }),
  b('de.ar.14', 'de.partizip', 5, 'Die | seit Jahren | zu Unrecht | vernachlässigte | Region | erhält | endlich Fördermittel.', 'Ein langes Attribut: alles zwischen „Die“ und „Region“ beschreibt die Region.', {
    alternativen: ['Die | zu Unrecht | seit Jahren | vernachlässigte | Region | erhält | endlich Fördermittel.'],
  }),
  b('de.ar.15', 'de.konnektoren', 2, 'Sie | ist | nicht nur | klug, | sondern auch | sehr | fleißig.', '„Nicht nur …, sondern auch“ verbindet zwei Eigenschaften.'),
  b('de.ar.16', 'de.konnektoren', 3, 'Je | länger | wir | warten, | desto | teurer | wird | es.', 'Nach „je“ steht das Verb am Ende, nach „desto + Komparativ“ direkt dahinter.'),
  b('de.ar.17', 'de.wortstellung', 1, 'Morgen | fahre | ich | mit dem Zug | nach Berlin.', 'Verb an zweiter Stelle; die Art („mit dem Zug“) vor dem Ziel („nach Berlin“).'),
  b('de.ar.18', 'de.passiv', 2, 'Das Museum | wurde | im Jahr 1905 | von der Stadt | eröffnet.', 'Passiv im Präteritum: „wurde“ an zweiter Stelle, Partizip am Ende.', {
    alternativen: ['Das Museum | wurde | von der Stadt | im Jahr 1905 | eröffnet.'],
  }),
  b('de.ar.19', 'de.konnektoren', 4, 'Wir | verschieben | den Start, | zumal | die Daten | noch | unvollständig | sind.', '„Zumal“ leitet einen Nebensatz ein, der einen zusätzlichen Grund nennt.'),
  b('de.ar.20', 'de.relativ', 3, 'Das ist | alles, | was | ich | darüber | weiß.', 'Nach „alles“ steht „was“, das Verb am Ende.'),
  b('de.ar.21', 'de.wissenschaft', 4, 'Die Ergebnisse | legen | nahe, | dass | der Effekt | unterschätzt | wurde.', '„Etwas nahelegen“ ist typisch für vorsichtige wissenschaftliche Aussagen.'),
  b('de.ar.22', 'de.meister', 5, 'Es | ist | einer der wenigen | Fälle, | die | bis heute | ungeklärt | sind.', 'Der Relativsatz bezieht sich auf „Fälle“ – daher „die … sind“.', { extra: ['ist.'] }),
  b('de.ar.23', 'de.beruf', 3, 'Für Rückfragen | stehe | ich | Ihnen | gern | zur Verfügung.', 'Eine feste Schlussformel in Geschäftsbriefen.'),
  b('de.ar.24', 'de.konj2', 2, 'Könnten | Sie | mir | bitte | die Unterlagen | schicken?', 'Höfliche Bitte mit Konjunktiv II.', {
    alternativen: ['Könnten | Sie | mir | die Unterlagen | bitte | schicken?'],
  }),
]

// ---------- Lektorat: ganze Texte mit mehreren Fehlern ----------

function l(id: string, ziel: string, stufe: Stufe, kontext: string, kopf: [string, string][] | undefined, text: string, erklaerung: string): FehlerItem {
  return { id, spiel: 'de.lektorat', art: 'fehler', ziel, stufe, kontext, ...(kopf ? { kopf } : {}), teile: fehlerTeile(text), erklaerung }
}

export const LEKTORAT: FehlerItem[] = [
  l('de.lek.01', 'de.beruf', 2, 'E-Mail an einen Kunden', [['Von', 'Julia Brandt'], ['An', 'Herr Kowalski'], ['Betreff', 'Ihre Bestellung']],
    'Sehr geehrter Herr Kowalski,\n{Vielen=>vielen|Viele|Vielem::Nach dem Komma der Anrede geht es klein weiter.} Dank für Ihre Bestellung. {Aufgrund einem=>Aufgrund eines|Aufgrund einen|Aufgrund ein::„Aufgrund“ verlangt den Genitiv.} Lieferengpasses verzögert sich der Versand leider um zwei Tage. Für Rückfragen stehe ich Ihnen gern zur {Verfügbarkeit=>Verfügung|Verfügen|Verfügbarung::Die Wendung lautet „zur Verfügung stehen“.}.\n\nMit freundlichen {Grüßen,=>Grüßen|Grüße,|Grüßen!::Nach der Grußformel steht kein Satzzeichen.}\nJulia Brandt',
    'Kleine Fehler in Kundenmails wirken schnell unprofessionell – Anrede, Kasus und Grußformel sind die häufigsten Stolperstellen.'),
  l('de.lek.02', 'de.beruf', 3, 'Bewerbung', [['An', 'Personalabteilung'], ['Betreff', 'Bewerbung als Projektassistentin']],
    'Sehr geehrte Damen und Herren,\nmit großem Interesse habe ich Ihre Stellenanzeige gelesen. {Seid=>Seit|Seiht|Seidt::„Seit“ ist die Präposition der Zeit.} drei Jahren arbeite ich als Assistentin im Vertrieb. Besonders liegt mir die Zusammenarbeit mit {internationalem Teams=>internationalen Teams|internationale Teams|internationaler Teams::Dativ Plural ohne Artikel: internationalen Teams.} am Herzen. Ich bin {überzeugt dass=>überzeugt, dass|überzeugt dass,|überzeugt: dass::Vor „dass“ steht ein Komma.} ich Ihr Team bereichern kann.\n\nMit freundlichen Grüßen\nLea Hartmann',
    'In Bewerbungen fallen Flüchtigkeitsfehler besonders auf. Präposition, Adjektivendung und Komma vor „dass“ sind Klassiker.'),
  l('de.lek.03', 'de.wissenschaft', 3, 'Abstract einer Hausarbeit', undefined,
    'Die vorliegende Arbeit untersucht, inwiefern soziale Medien das Wahlverhalten junger Menschen beeinflussen. Anhand {mehreren Umfragen=>mehrerer Umfragen|mehrere Umfragen|mehrerem Umfragen::„Anhand“ verlangt den Genitiv: mehrerer Umfragen.} wird gezeigt, dass der Einfluss je nach Plattform variiert. Die Ergebnisse legen {nahe, das=>nahe, dass|nahe das|nahe, daß::Die Konjunktion schreibt man „dass“.} klassische Medien weiterhin eine wichtige Rolle {spielen tun=>spielen|spielen würden|spielten::„Tun“ als Hilfsverb ist umgangssprachlich.}.',
    'Wissenschaftliche Texte verlangen Genauigkeit – auch bei Kasus, „das/dass“ und Umgangssprache.'),
  l('de.lek.04', 'de.komma', 2, 'Rundmail im Büro', [['Von', 'Orga-Team'], ['An', 'Alle'], ['Betreff', 'Sommerfest']],
    'Liebe Kolleginnen und Kollegen,\nam Freitag findet unser Sommerfest {statt zu=>statt, zu|statt zu,|statt; zu::Der Relativsatz wird mit Komma abgetrennt.} dem wir euch herzlich einladen. Bitte teilt uns bis Mittwoch {mit ob=>mit, ob|mit ob,|mit: ob::Vor „ob“ steht ein Komma.} ihr teilnehmt. Wer {möchte kann=>möchte, kann|möchte; kann|möchte kann,::Zwischen den beiden Teilsätzen steht ein Komma.} gern einen Salat mitbringen.\n\nViele Grüße\nEuer Orga-Team',
    'Nebensätze und Relativsätze werden immer durch Komma abgetrennt – auch in lockeren Rundmails.'),
  l('de.lek.05', 'de.konj1', 3, 'Zeitungsmeldung', undefined,
    'Die Sanierung des {Rathaus=>Rathauses|Rathauses’|Rathausen::Genitiv: des Rathauses.} ist seit Jahren überfällig. Der Bürgermeister erklärte am Montag, die Stadt {hat=>habe|hätte|haben::In der indirekten Rede steht der Konjunktiv I: habe.} ausreichend Mittel eingeplant. Kritiker halten dagegen, die Kosten {werden=>würden|wurden|werde::„Sie werden“ gleicht dem Indikativ – Ersatzform Konjunktiv II: würden.} deutlich höher ausfallen.',
    'Nachrichten geben Aussagen im Konjunktiv I wieder. Wo er wie der Indikativ klingt, springt der Konjunktiv II ein.'),
  l('de.lek.06', 'de.stil', 4, 'Quartalsbericht', undefined,
    'Die Umsätze sind im zweiten Quartal um zwölf Prozent gestiegen. Das Ergebnis ist {scheinbar=>anscheinend|scheinheilig|scheinlich::Die Zahlen bestätigen es – also nicht nur scheinbar.} besser als erwartet, wie die vorläufigen Zahlen bestätigen. Die {einzigste=>einzige|einzigartige|einzelne::„Einzig“ lässt sich nicht steigern.} Alternative zur Expansion wäre eine Fusion. Wir müssen daher bis Ende des Monats eine Entscheidung {machen=>treffen|tun|geben::Eine Entscheidung trifft man.}.',
    'In Berichten zählen Präzision und feste Wendungen: Wörter wie „scheinbar“ oder „einzigste“ verwässern die Aussage.'),
  l('de.lek.07', 'de.adjektiv', 3, 'Produkttext', undefined,
    'Unser neuer Rucksack besteht aus recyceltem Kunststoff. Er eignet sich für alle{, dessen=>, deren|, derer|, denen::Bezugswort „alle“ ist Plural: deren.} Alltag viel Bewegung verlangt. Der Rucksack ist in {drei verschiedene Farben=>drei verschiedenen Farben|drei verschiedener Farben|drei verschiedenen Farbe::Nach „in“ (Dativ) Plural: verschiedenen Farben.} erhältlich. Wir gewähren eine Garantie von {fünf Jahre=>fünf Jahren|fünf Jahr|fünfen Jahren::„Von“ verlangt den Dativ: fünf Jahren.}.',
    'Werbetexte werden oft schnell geschrieben – Relativpronomen und Dativ-Endungen rutschen dabei gern durch.'),
  l('de.lek.08', 'de.meister', 5, 'Sitzungsprotokoll', [['Sitzung', '12. März'], ['Anwesend', 'Dr. Lehmann, Yilmaz, Ost']],
    '1. Die {gestern stattgefundene=>am Vortag abgehaltene|gestern stattfindende|gestern stattgefundenen::„Stattfinden“ bildet das Perfekt mit „haben“ – das Partizip taugt nicht als Attribut.} Begehung ergab keine Mängel.\n2. Frau Ost wies darauf hin, dass die Anzahl der Beschwerden deutlich {gestiegen seien=>gestiegen sei|gestiegen sind|gestiegen wären::Subjekt ist „die Anzahl“ (Singular), indirekte Rede: gestiegen sei.}.\n3. {Des weiteren=>Des Weiteren|Desweiteren|Des weitern::Heute: „des Weiteren“ mit großem W.} wurde beschlossen, die Stelle neu auszuschreiben.',
    'Protokolle verdichten viel Grammatik: Partizipien, Kongruenz und indirekte Rede auf engem Raum.'),
  l('de.lek.09', 'de.ndekl', 3, 'Pressemitteilung', undefined,
    'Die Stadtwerke begrüßen {den neuen Präsident=>den neuen Präsidenten|den neuen Präsidents|dem neuen Präsidenten::n-Deklination: den Präsidenten.} des Aufsichtsrats. Herr Albers bringt {langjähriger Erfahrung=>langjährige Erfahrung|langjährigen Erfahrung|langjährigem Erfahrung::Akkusativ ohne Artikel: langjährige Erfahrung.} in der Energiewirtschaft mit. Wir wünschen {Herr Albers=>Herrn Albers|Herren Albers|Herrn Alberse::„Herr“ wird dekliniert: Herrn Albers.} viel Erfolg.',
    'Titel, Namen und „Herr“ stolpern oft über die n-Deklination.'),
  l('de.lek.10', 'de.wissenschaft', 5, 'Diskussion einer Studie', undefined,
    'Die Befunde {stehen im Einklang zu=>stehen im Einklang mit|stehen in Einklang zu|stehen im Einklang an::Die Wendung lautet „im Einklang mit“.} früheren Studien. Gleichwohl sollte die geringe Stichprobengröße berücksichtigt werden. {Aufgrund dessen, das=>Aufgrund dessen, dass|Aufgrund dem, dass|Aufgrund dessen das::Die Konjunktion heißt „dass“.} die Daten nur aus einer Region stammen, {lässt sich die Ergebnisse=>lassen sich die Ergebnisse|lässt sich das Ergebnisse|lassen die Ergebnisse sich::Subjekt „die Ergebnisse“ ist Plural: lassen sich.} nicht ohne Weiteres verallgemeinern.',
    'In Diskussionsteilen stecken lange Sätze – dort verrutschen Kongruenz und feste Wendungen besonders leicht.'),
]
