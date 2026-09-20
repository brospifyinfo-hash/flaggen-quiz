// 🇩🇪 Deutsch – mehr Spiele schon für das erste Modul: Kasus-Sortierer, Lückensätze,
// Umformungen und Satzbau zu Präpositionen, Verben, Adjektiven und n-Deklination.
// Dazu Duelle für den Expertenwortschatz: Wird das Wort passend gebraucht?
import type { BauItem, DuellItem, KarteItem, Stufe, WahlItem } from '../../typen'
import { bausteine, optionen } from '../werkzeug'

// ---------- Kasus-Sortierer: welcher Fall? ----------

const AKK = 0
const DAT = 1
const GEN = 2

function c(nr: number, ziel: string, stufe: Stufe, text: string, detail: string, fach: 0 | 1 | 2, warum: string): KarteItem {
  return { id: `de.ka.${String(nr).padStart(2, '0')}`, spiel: 'de.kasus', art: 'karte', ziel, stufe, text, detail, fach, warum }
}

export const KASUS: KarteItem[] = [
  // Präpositionen
  c(1, 'de.genitiv', 1, 'aufgrund', 'Präposition', GEN, 'aufgrund des Wetters'),
  c(2, 'de.genitiv', 1, 'mit', 'Präposition', DAT, 'mit dem Zug'),
  c(3, 'de.genitiv', 1, 'durch', 'Präposition', AKK, 'durch den Park'),
  c(4, 'de.genitiv', 1, 'für', 'Präposition', AKK, 'für den Kunden'),
  c(5, 'de.genitiv', 1, 'seit', 'Präposition', DAT, 'seit dem Sommer'),
  c(6, 'de.genitiv', 2, 'anhand', 'Präposition', GEN, 'anhand der Unterlagen'),
  c(7, 'de.genitiv', 2, 'angesichts', 'Präposition', GEN, 'angesichts der Lage'),
  c(8, 'de.genitiv', 2, 'gegenüber', 'Präposition', DAT, 'gegenüber dem Rathaus'),
  c(9, 'de.genitiv', 2, 'ohne', 'Präposition', AKK, 'ohne den Schlüssel'),
  c(10, 'de.genitiv', 2, 'infolge', 'Präposition', GEN, 'infolge des Unfalls'),
  c(11, 'de.genitiv', 2, 'hinsichtlich', 'Präposition', GEN, 'hinsichtlich Ihres Antrags'),
  c(12, 'de.genitiv', 2, 'entgegen', 'Präposition', DAT, 'entgegen allen Erwartungen'),
  c(13, 'de.genitiv', 3, 'gemäß', 'Präposition', DAT, 'gemäß dem Vertrag'),
  c(14, 'de.genitiv', 3, 'zufolge', 'Präposition, nachgestellt: „dem Bericht …“', DAT, 'dem Bericht zufolge'),
  c(15, 'de.genitiv', 3, 'ungeachtet', 'Präposition', GEN, 'ungeachtet der Kritik'),
  c(16, 'de.genitiv', 3, 'zugunsten', 'Präposition', GEN, 'zugunsten der Kinder'),
  c(17, 'de.genitiv', 3, 'wider', 'Präposition', AKK, 'wider den Willen'),
  c(18, 'de.genitiv', 3, 'entlang', 'nachgestellt: „den Fluss …“', AKK, 'den Fluss entlang (vorangestellt meist mit Genitiv: entlang des Flusses)'),
  c(19, 'de.genitiv', 4, 'kraft', 'Präposition', GEN, 'kraft seines Amtes'),
  c(20, 'de.genitiv', 4, 'zwecks', 'Präposition', GEN, 'zwecks Klärung des Sachverhalts'),
  c(21, 'de.genitiv', 4, 'unweit', 'Präposition', GEN, 'unweit des Bahnhofs'),
  c(22, 'de.genitiv', 4, 'samt', 'Präposition', DAT, 'samt allem Gepäck'),
  // Verben
  c(23, 'de.rektion', 1, 'helfen', 'Verb: jemandem …', DAT, 'Ich helfe dem Kollegen.'),
  c(24, 'de.rektion', 1, 'fragen', 'Verb: jemanden …', AKK, 'Ich frage den Lehrer.'),
  c(25, 'de.rektion', 1, 'danken', 'Verb', DAT, 'Wir danken dem Team.'),
  c(26, 'de.rektion', 1, 'besuchen', 'Verb', AKK, 'Wir besuchen den Onkel.'),
  c(27, 'de.rektion', 2, 'gedenken', 'Verb', GEN, 'Wir gedenken der Opfer.'),
  c(28, 'de.rektion', 2, 'vertrauen', 'Verb', DAT, 'Sie vertraut dem Arzt.'),
  c(29, 'de.rektion', 2, 'anrufen', 'Verb', AKK, 'Ich rufe den Kunden an.'),
  c(30, 'de.rektion', 2, 'widersprechen', 'Verb', DAT, 'Er widerspricht dem Chef.'),
  c(31, 'de.rektion', 3, 'bedürfen', 'Verb', GEN, 'Das bedarf einer Erklärung.'),
  c(32, 'de.rektion', 3, 'begegnen', 'Verb', DAT, 'Ich bin dem Nachbarn begegnet.'),
  c(33, 'de.rektion', 4, 'sich enthalten', 'Verb', GEN, 'Sie enthielt sich der Stimme.'),
  c(34, 'de.rektion', 4, 'sich bedienen', 'Verb', GEN, 'Er bediente sich eines Tricks.'),
  // Adjektive
  c(35, 'de.rektion', 3, 'bewusst (sich … sein)', 'Adjektiv', GEN, 'sich des Risikos bewusst sein'),
  c(36, 'de.rektion', 3, 'ähnlich', 'Adjektiv: jemandem …', DAT, 'Sie ist ihrer Mutter ähnlich.'),
  c(37, 'de.rektion', 4, 'würdig', 'Adjektiv', GEN, 'eines Preises würdig'),
  c(38, 'de.rektion', 3, 'dankbar', 'Adjektiv', DAT, 'dem Team dankbar sein'),
]

// ---------- Wort im Kontext: Grundlagen ----------

function k(id: string, ziel: string, stufe: Stufe, satz: string, liste: string[], erklaerung: string): WahlItem {
  return { id, spiel: 'de.kontext', art: 'wahl', ziel, stufe, satz, optionen: optionen(liste), erklaerung }
}

export const KONTEXT_GRUNDLAGEN: WahlItem[] = [
  k('de.ko.60', 'de.genitiv', 1, 'Trotz ___ Regens fand das Konzert im Freien statt.', ['des', 'dem', 'den', 'der'], '„Trotz“ steht standardsprachlich mit Genitiv: trotz des Regens.'),
  k('de.ko.61', 'de.genitiv', 1, 'Wegen ___ Streiks fielen viele Flüge aus.', ['des', 'dem', 'den', 'die'], 'In der Standardsprache steht „wegen“ mit Genitiv: wegen des Streiks.'),
  k('de.ko.62', 'de.genitiv', 2, 'Innerhalb ___ Woche müssen alle Formulare vorliegen.', ['einer', 'einem', 'eine', 'eines'], '„Innerhalb“ verlangt den Genitiv: innerhalb einer Woche.'),
  k('de.ko.63', 'de.genitiv', 3, '___ des schlechten Wetters wurde der Flug gestrichen.', ['Infolge', 'Trotz', 'Anstatt', 'Gegenüber'], '„Infolge“ nennt eine Ursache: infolge des schlechten Wetters. „Trotz“ wäre ein Gegengrund.'),
  k('de.ko.64', 'de.rektion', 1, 'Kannst du ___ neuen Kollegin bitte helfen?', ['der', 'die', 'den', 'des'], '„Helfen“ verlangt den Dativ: der neuen Kollegin.'),
  k('de.ko.65', 'de.rektion', 2, 'Die Kommission bedarf ___ Unterstützung.', ['Ihrer', 'Ihre', 'Ihren', 'Ihrem'], '„Bedürfen“ verlangt den Genitiv: Ihrer Unterstützung.'),
  k('de.ko.66', 'de.rektion', 2, 'Hast du ___ Chefin schon angerufen?', ['die', 'der', 'den', 'des'], '„Anrufen“ verlangt den Akkusativ: die Chefin anrufen.'),
  k('de.ko.67', 'de.adjektiv', 1, 'Bei ___ Wetter frühstücken wir auf dem Balkon.', ['schönem', 'schönen', 'schöner', 'schönes'], 'Ohne Artikel zeigt das Adjektiv den Fall: bei schönem Wetter (Dativ).'),
  k('de.ko.68', 'de.adjektiv', 2, 'Wir suchen ___ zuverlässige Mitarbeiterin.', ['eine', 'einer', 'einen', 'ein'], 'Akkusativ feminin: eine zuverlässige Mitarbeiterin.'),
  k('de.ko.69', 'de.adjektiv', 2, 'Das Ergebnis ___ neuen Studie überrascht.', ['der', 'die', 'den', 'dem'], 'Genitiv feminin: der neuen Studie.'),
  k('de.ko.70', 'de.adjektiv', 3, 'Alle ___ Teilnehmer erhalten ein Zertifikat.', ['angemeldeten', 'angemeldete', 'angemeldeter', 'angemeldetem'], 'Nach „alle“ wird schwach dekliniert: alle angemeldeten Teilnehmer.'),
  k('de.ko.71', 'de.ndekl', 1, 'Ich habe gestern mit dem ___ telefoniert.', ['Nachbarn', 'Nachbar', 'Nachbars', 'Nachbarns'], '„Nachbar“ gehört zur n-Deklination: mit dem Nachbarn.'),
  k('de.ko.72', 'de.ndekl', 2, 'Der Vorschlag des ___ fand breite Zustimmung.', ['Kollegen', 'Kollegens', 'Kollege', 'Kolleges'], 'n-Deklination im Genitiv: des Kollegen (ohne zusätzliches -s).'),
  k('de.ko.73', 'de.ndekl', 3, 'Die Kanzlerin empfing den französischen ___.', ['Präsidenten', 'Präsident', 'Präsidents', 'Präsidente'], 'n-Deklination im Akkusativ: den Präsidenten.'),
]

// ---------- Umformung: Grundlagen ----------

function u(id: string, ziel: string, stufe: Stufe, quelle: string, richtung: string, liste: string[], erklaerung: string): WahlItem {
  return { id, spiel: 'de.umformung', art: 'wahl', ziel, stufe, quelle, richtung, optionen: optionen(liste), erklaerung }
}

export const UMFORMUNG_GRUNDLAGEN: WahlItem[] = [
  u('de.um.40', 'de.genitiv', 1, 'Weil der Streik andauerte, fielen viele Züge aus.', 'mit „infolge“', [
    'Infolge des andauernden Streiks fielen viele Züge aus.',
    'Infolge dem andauernden Streik fielen viele Züge aus.::„Infolge“ verlangt den Genitiv.',
    'Infolge des andauernden Streik fielen viele Züge aus.::Im Genitiv bekommt „Streik“ ein -s.',
    'Infolge von den andauernden Streiks fielen viele Züge aus.::Das wäre Plural und umständlich.',
  ], 'Aus dem Nebensatz wird eine Präposition mit Genitiv.'),
  u('de.um.41', 'de.genitiv', 2, 'Obwohl die Kritik laut war, hielt der Rat am Plan fest.', 'mit „ungeachtet“', [
    'Ungeachtet der lauten Kritik hielt der Rat am Plan fest.',
    'Ungeachtet die laute Kritik hielt der Rat am Plan fest.::„Ungeachtet“ verlangt den Genitiv.',
    'Ungeachtet der lauten Kritik der Rat hielt am Plan fest.::Nach der Präpositionalgruppe folgt direkt das Verb.',
    'Ungeachtet dem lauten Kritik hielt der Rat am Plan fest.::Artikel und Fall stimmen nicht.',
  ], '„Ungeachtet“ drückt wie „obwohl“ einen Gegengrund aus – mit Genitiv.'),
  u('de.um.42', 'de.rektion', 3, 'Wir erinnern uns an die Opfer.', 'mit „gedenken“', [
    'Wir gedenken der Opfer.',
    'Wir gedenken den Opfern.::„Gedenken“ verlangt den Genitiv.',
    'Wir gedenken an die Opfer.::„Gedenken“ steht ohne Präposition.',
    'Wir gedenken die Opfer.::Akkusativ passt nicht.',
  ], '„Gedenken“ ist gehoben und verlangt den Genitiv.'),
  u('de.um.43', 'de.adjektiv', 2, 'Die Studie ist neu. Sie hat Aufsehen erregt.', 'ein Satz mit Adjektiv', [
    'Die neue Studie hat Aufsehen erregt.',
    'Die neuen Studie hat Aufsehen erregt.::Nach „die“ im Nominativ Singular: neue.',
    'Die neuer Studie hat Aufsehen erregt.::Diese Endung passt zu keinem Fall.',
    'Die Studie neue hat Aufsehen erregt.::Das Adjektiv steht vor dem Nomen.',
  ], 'Das Adjektiv wandert vor das Nomen und bekommt die passende Endung.'),
]

// ---------- Satzarchitekt: Grundlagen ----------

function b(id: string, ziel: string, stufe: Stufe, text: string, erklaerung: string, extra?: string[]): BauItem {
  return { id, spiel: 'de.architekt', art: 'bau', ziel, stufe, teile: bausteine(text), fest: 1, ...(extra ? { extra } : {}), erklaerung }
}

export const ARCHITEKT_GRUNDLAGEN: BauItem[] = [
  b('de.ar.40', 'de.genitiv', 1, 'Aufgrund | des | starken | Regens | fiel | das Spiel | aus.', '„Aufgrund“ mit Genitiv, danach das Verb an zweiter Stelle.'),
  b('de.ar.41', 'de.rektion', 2, 'Wir | gedenken | heute | der Opfer | des Krieges.', '„Gedenken“ mit Genitiv: der Opfer.'),
  b('de.ar.42', 'de.ndekl', 1, 'Der Kunde | bat | den Präsidenten | um | ein kurzes | Gespräch.', 'n-Deklination: den Präsidenten.'),
  b('de.ar.43', 'de.genitiv', 2, 'Trotz | des | schlechten | Wetters | kamen | viele | Gäste.', '„Trotz“ mit Genitiv: trotz des schlechten Wetters.', ['dem']),
  b('de.ar.44', 'de.adjektiv', 3, 'Mit | großem | Interesse | habe | ich | Ihre Anzeige | gelesen.', 'Ohne Artikel trägt das Adjektiv die Endung: mit großem Interesse.', ['großen']),
]

// ---------- Duelle zum Expertenwortschatz ----------

function d(id: string, ziel: string, stufe: Stufe, richtig: string, falsch: string, warum: string): DuellItem {
  return { id, spiel: 'de.duell', art: 'duell', ziel, stufe, a: richtig, b: falsch, richtig: 'a', warum, frage: 'In welchem Satz passt das Wort?' }
}

export const DUELL_WORTSCHATZ: DuellItem[] = [
  d('de.du.80', 'de.adjektive', 2, 'Seine Antwort war lapidar: ein knappes Nein.', 'Seine Antwort war lapidar: eine zweistündige, blumige Rede.', '„Lapidar“ heißt knapp und schlicht.'),
  d('de.du.81', 'de.adjektive', 2, 'Die Regel ist obsolet – sie ist längst überholt.', 'Die Regel ist obsolet – sie wurde gestern neu eingeführt.', '„Obsolet“ heißt überholt, nicht mehr gebräuchlich.'),
  d('de.du.82', 'de.verben', 3, 'Die Zeugin insinuierte, der Nachbar habe etwas zu verbergen.', 'Die Zeugin insinuierte den Sachverhalt klar und offen.', '„Insinuieren“ heißt versteckt unterstellen – nicht offen darlegen.'),
  d('de.du.83', 'de.verben', 4, 'Der Bericht konstatiert erhebliche Mängel.', 'Der Bericht konstatiert, dass es morgen vielleicht regnet.', '„Konstatieren“ heißt feststellen – eine Vermutung stellt man nicht fest.'),
  d('de.du.84', 'de.nomen', 3, 'Zwischen Plan und Ergebnis klafft eine Diskrepanz.', 'Zwischen den Freunden herrscht Diskrepanz und Harmonie.', '„Diskrepanz“ ist ein Missverhältnis – das passt nicht zu Harmonie.'),
  d('de.du.85', 'de.nomen', 3, 'Nach dem Streit herrschte Dissens im Team.', 'Nach der Einigung herrschte Dissens im Team.', '„Dissens“ heißt Meinungsverschiedenheit – nach einer Einigung passt „Konsens“.'),
  d('de.du.86', 'de.verben', 4, 'Die Kürzungen konterkarieren das Ziel, mehr Lehrkräfte einzustellen.', 'Die zusätzlichen Mittel konterkarieren das Ziel, mehr Lehrkräfte einzustellen.', '„Konterkarieren“ heißt durchkreuzen – zusätzliche Mittel unterstützen das Ziel eher.'),
  d('de.du.87', 'de.adjektive', 5, 'Das Risiko ist dem System inhärent.', 'Das Risiko wurde dem System nachträglich inhärent hinzugefügt.', '„Inhärent“ heißt innewohnend – was von Anfang an dazugehört, wird nicht hinzugefügt.'),
  d('de.du.88', 'de.verben', 4, 'Er antizipierte die Frage und hatte die Antwort schon parat.', 'Er antizipierte die Frage, nachdem sie längst gestellt war.', '„Antizipieren“ heißt vorwegnehmen – das geht nur vorher.'),
  d('de.du.89', 'de.adjektive', 5, 'Das Thema ist virulent und beherrscht die Debatte.', 'Das Thema ist virulent – niemand interessiert sich dafür.', '„Virulent“ heißt akut, drängend.'),
]
