// 🇫🇷 Aussprache: das Herzstück des Kurses. Französisch schreibt Buchstaben, die niemand
// spricht, und verbindet Wörter, die getrennt dastehen. Jede Karte bringt beides zusammen:
// die Lautschrift für die Genauigkeit und eine Umschrift für deutsche Ohren.
import type { AusspracheItem, Stufe } from '../../typen'

function laut(
  nr: number,
  ziel: string,
  stufe: Stufe,
  wort: string,
  bedeutung: string,
  ipa: string,
  hilfe: string,
  falsch: string[],
  tipp: string,
): AusspracheItem {
  return {
    id: `fr.la.${String(nr).padStart(2, '0')}`,
    spiel: 'fr.aussprache',
    art: 'aussprache',
    ziel,
    stufe,
    sprache: 'fr-FR',
    wort,
    bedeutung,
    ipa,
    hilfe,
    falsch,
    tipp,
    modus: 'lesen',
  }
}

function hoerwort(
  nr: number,
  ziel: string,
  stufe: Stufe,
  wort: string,
  bedeutung: string,
  ipa: string,
  hilfe: string,
  aehnlich: string[],
  tipp: string,
): AusspracheItem {
  return {
    id: `fr.lh.${String(nr).padStart(2, '0')}`,
    spiel: 'fr.aussprache',
    art: 'aussprache',
    ziel,
    stufe,
    sprache: 'fr-FR',
    wort,
    bedeutung,
    ipa,
    hilfe,
    falsch: [],
    aehnlich,
    tipp,
    modus: 'hoeren',
  }
}

export const AUSSPRACHE: AusspracheItem[] = [
  // ---------- Modul 1: Bonjour! ----------
  laut(1, 'fr.greet', 1, 'bonjour', 'guten Tag', 'bɔ̃ʒuʁ', 'bonschuur', ['bonn-jour', 'bondschur', 'bohn-juhr'], 'Das „j“ klingt wie das „g“ in „Garage“, das „on“ wird durch die Nase gesprochen.'),
  laut(2, 'fr.greet', 1, 'salut', 'hallo / tschüss', 'saly', 'ssalü', ['salut mit t', 'ssalutt', 'ssaluh'], 'Das End-t bleibt stumm, und „u“ ist das spitze ü.'),
  laut(3, 'fr.intro', 1, 'enchanté', 'sehr erfreut', 'ɑ̃ʃɑ̃te', 'anschanteh', ['en-chan-teh', 'entschantee', 'ankanteh'], 'Zweimal ein nasales „an“ – und „ch“ klingt wie „sch“.'),
  laut(4, 'fr.hoeflich', 1, 'merci', 'danke', 'mɛʁsi', 'mär-ssi', ['mertschi', 'mer-ki', 'mär-zi'], 'Das „c“ vor „i“ klingt wie ein scharfes s, nie wie „k“ oder „tsch“.'),
  laut(5, 'fr.intro', 2, "s'il vous plaît", 'bitte', 'sil vu plɛ', 'ssil wu plä', ['ssil wuhs pläht', 'ssil fu plei', 'ssilwu-plait'], 'Das „s“ von „vous“ bleibt hier stumm, „plaît“ endet auf ein offenes ä.'),
  laut(6, 'fr.greet', 2, 'au revoir', 'auf Wiedersehen', 'o ʁəvwaʁ', 'o rewoa', ['au-revoir', 'oh-rewuar', 'o-refoir'], '„au“ ist ein schlichtes o, „oi“ klingt immer wie „oa“.'),

  // ---------- Modul 2: Klang und Schrift ----------
  laut(7, 'fr.stumm', 1, 'petit', 'klein', 'pəti', 'pöti', ['petitt', 'pe-tit', 'peteet'], 'Ein „t“ am Wortende bleibt stumm – fast immer.'),
  laut(8, 'fr.stumm', 2, 'beaucoup', 'viel', 'boku', 'boku', ['beau-kupp', 'bo-kuup', 'böküp'], '„eau“ ist ein einziges o, das „p“ am Ende schweigt.'),
  laut(9, 'fr.stumm', 2, 'temps', 'Zeit / Wetter', 'tɑ̃', 'tan', ['temps mit s', 'tämps', 'tong'], 'Von vier Buchstaben am Ende hört man keinen: Es bleibt ein nasales „an“.'),
  laut(10, 'fr.nasal', 2, 'vin', 'Wein', 'vɛ̃', 'wä (nasal)', ['win', 'wien', 'fin'], 'Das „in“ wird nasal gesprochen – die Zunge bleibt unten, die Luft geht durch die Nase.'),
  laut(11, 'fr.nasal', 2, 'pain', 'Brot', 'pɛ̃', 'pä (nasal)', ['pain wie Pein', 'pa-in', 'peng'], '„ain“ klingt genau wie „in“ – beides ein nasales ä.'),
  laut(12, 'fr.nasal', 3, 'brun', 'braun', 'bʁœ̃', 'brö (nasal)', ['brunn', 'brühn', 'bruhn'], 'Das nasale „un“ liegt zwischen ö und ä – auf keinen Fall ein deutsches u.'),
  laut(13, 'fr.liaison', 3, 'les amis', 'die Freunde', 'lez‿ami', 'lesami', ['le ami', 'less amie', 'leh amih'], 'Vor einem Vokal wird das stumme „s“ lebendig und klingt wie „z“ – das ist die Liaison.'),
  laut(14, 'fr.liaison', 3, 'vous avez', 'Sie haben', 'vuz‿ave', 'wusawe', ['wu awe', 'wuhs awee', 'fusawee'], 'Auch hier bindet das „s“ ans nächste Wort – man hört „wu-sawe“.'),
  laut(15, 'fr.liaison', 4, 'grand homme', 'großer Mann', 'gʁɑ̃t‿ɔm', 'grantom', ['gran homm', 'grand-homme', 'grang om'], 'Ein „d“ in der Liaison klingt wie „t“: „gran-tomm“.'),
  laut(16, 'fr.stumm', 3, 'restaurant', 'Restaurant', 'ʁɛstoʁɑ̃', 'rästoran', ['restaurant wie deutsch', 'räs-tau-rant', 'restorantt'], 'Kein „t“ am Ende, dafür ein nasales „an“ – und das „r“ kommt aus dem Rachen.'),

  // ---------- Modul 3: Zahlen und Zeit ----------
  laut(17, 'fr.zahlen', 1, 'deux', 'zwei', 'dø', 'dö', ['döx', 'deuks', 'dü'], 'Das „x“ bleibt stumm, „eu“ ist ein geschlossenes ö.'),
  laut(18, 'fr.zahlen', 2, 'six', 'sechs', 'sis', 'ssiss', ['ssiks', 'sieks', 'ssih'], 'Allein stehend klingt „six“ wie „ssiss“ – vor einem Nomen wird das x oft zu z oder verschwindet.'),
  laut(19, 'fr.zahlen', 3, 'quatre-vingts', 'achtzig', 'katʁə vɛ̃', 'katrö wä', ['kwatre wings', 'katr-wingts', 'kwatrö-wäng'], 'Wörtlich „vier mal zwanzig“ – und „vingts“ endet nasal, ohne t und s.'),
  laut(20, 'fr.uhrzeit', 2, 'aujourd’hui', 'heute', 'oʒuʁdɥi', 'oschurdwi', ['au-jour-dui', 'oschurd-huih', 'aujurdui'], 'Das „h“ spricht man nie; „ui“ klingt wie ein schnelles „wi“.'),

  // ---------- Modul 4: Im Café ----------
  laut(21, 'fr.cafe', 1, 'croissant', 'Croissant', 'kʁwasɑ̃', 'kroassan', ['kruassant', 'kroissant', 'kwassong'], '„oi“ wird zu „oa“, das Ende ist nasal – und das t schweigt.'),
  laut(22, 'fr.cafe', 2, 'un café, s’il vous plaît', 'einen Kaffee, bitte', 'œ̃ kafe sil vu plɛ', 'ö kafe ssil wu plä', ['ünn kafeh', 'ang kaffee', 'öng kafeh'], '„un“ ist nasal, „café“ betont man hinten – wie fast jedes französische Wort.'),
  laut(23, 'fr.zahlenbitte', 3, 'l’addition', 'die Rechnung', 'ladisjɔ̃', 'ladissjon', ['ladditschion', 'la-dischn', 'laditsion'], '„ti“ klingt hier wie „ssi“, das Ende ist nasal.'),
  laut(24, 'fr.cafe', 2, 'le thé', 'der Tee', 'lə te', 'lö teh', ['le the', 'lö thee', 'lä tä'], 'Das „h“ nach t ist nur Schreibweise – gesprochen wird schlicht „te“.'),

  // ---------- Modul 5: Einkaufen ----------
  laut(25, 'fr.laden', 1, 'la boulangerie', 'die Bäckerei', 'la bulɑ̃ʒʁi', 'la bulanschri', ['bulangerie', 'bu-lan-ge-rieh', 'bulanscherih'], 'Das „g“ vor „e“ klingt weich wie in „Garage“.'),
  laut(26, 'fr.mengen', 2, 'un kilo', 'ein Kilo', 'œ̃ kilo', 'ö kilo', ['ünn kilo', 'ang kiloh', 'öng kiloo'], '„un“ ist nasal – und die Betonung liegt auf der letzten Silbe.'),
  laut(27, 'fr.laden', 3, 'les œufs', 'die Eier', 'lez‿ø', 'lesö', ['les öfs', 'lä-söf', 'les-ös'], 'Im Plural verschwindet das „f“: ein Ei ist „un œuf“ (öf), viele sind „les œufs“ (lesö).'),
  laut(28, 'fr.mengen', 3, 'combien', 'wie viel', 'kɔ̃bjɛ̃', 'konbjä', ['kombien', 'kom-bienn', 'konbien'], 'Zwei Nasale in einem Wort – „on“ und „ien“.'),

  // ---------- Modul 6: Unterwegs ----------
  laut(29, 'fr.bahn', 2, 'la gare', 'der Bahnhof', 'la gaʁ', 'la gar', ['la gare mit e', 'la ga-re', 'la gäär'], 'Das End-e ist stumm, das „r“ kommt aus dem Rachen.'),
  laut(30, 'fr.bahn', 3, 'le billet', 'die Fahrkarte', 'lə bijɛ', 'lö bijä', ['bil-lett', 'biljet', 'bije-t'], '„ill“ klingt wie „j“, das t am Ende schweigt.'),
  laut(31, 'fr.weg', 2, 'à droite', 'nach rechts', 'a dʁwat', 'a droat', ['a droite mit e', 'a droa-te', 'a drwatt'], '„oi“ ist „oa“ – und das e am Ende bleibt stumm.'),
  laut(32, 'fr.hotel', 2, 'la chambre', 'das Zimmer', 'la ʃɑ̃bʁ', 'la schanbr', ['la tschambre', 'la kambr', 'la schambre'], '„ch“ ist immer „sch“, danach folgt ein nasales „an“.'),

  // ---------- Modul 7: Alltag ----------
  laut(33, 'fr.wetter', 2, 'il pleut', 'es regnet', 'il plø', 'il plö', ['il pleutt', 'il plöht', 'il plüh'], 'Das „t“ am Ende schweigt, „eu“ ist ein ö.'),
  laut(34, 'fr.tag', 2, 'je travaille', 'ich arbeite', 'ʒə tʁavaj', 'schö trawaj', ['je trawalle', 'schö trawajö', 'sche trawail'], 'Auch hier wird „ill“ zu „j“ – und „je“ klingt wie ein weiches „schö“.'),
  laut(35, 'fr.freizeit', 3, 'la musique', 'die Musik', 'la myzik', 'la müsik', ['la mu-sique', 'la musikö', 'la müsikö'], '„u“ ist das spitze ü, „s“ zwischen Vokalen klingt wie ein weiches s.'),
  laut(36, 'fr.freizeit', 3, 'j’aime bien', 'ich mag', 'ʒɛm bjɛ̃', 'schäm bjä', ['jäme bien', 'schaime bienn', 'schäm bien'], '„ai“ ist ein offenes ä, „ien“ endet nasal.'),

  // ---------- Modul 10: Feinheiten ----------
  laut(37, 'fr.fauxamis', 4, 'la monnaie', 'das Kleingeld', 'la mɔnɛ', 'la monä', ['la monnaje', 'la monneh', 'la monnäi'], 'Nicht „Münze“ im engeren Sinn: „monnaie“ ist das Wechselgeld.'),
  laut(38, 'fr.fallen', 4, 'je voudrais', 'ich hätte gern', 'ʒə vudʁɛ', 'schö wudrä', ['schö wudreis', 'je wudrais', 'schö wud-räh'], 'Die höflichste Bestellformel überhaupt – das „s“ am Ende bleibt stumm.'),
  laut(39, 'fr.fallen', 4, 'qu’est-ce que c’est', 'was ist das', 'kɛs kə sɛ', 'käss kö ßä', ['küest-sö-kö-säh', 'käst-se-ke-set', 'kwes kö sä'], 'Klingt kurz, sieht lang aus: „käss-kö-ßä“.'),
  laut(40, 'fr.fauxamis', 5, 'actuellement', 'derzeit', 'aktɥɛlmɑ̃', 'aktüälman', ['aktuell-ment', 'aktschuellmang', 'aktuelmont'], 'Falscher Freund: Es heißt „derzeit“, nicht „tatsächlich“.'),

  // ---------- Hörmodus: ähnliche Wörter unterscheiden ----------
  hoerwort(1, 'fr.nasal', 3, 'pain', 'Brot', 'pɛ̃', 'pä', ['pont', 'peine', 'pan'], 'Nasale klingen ähnlich – „pain“ (pä) gegen „pont“ (pon).'),
  hoerwort(2, 'fr.nasal', 3, 'blanc', 'weiß', 'blɑ̃', 'blan', ['blond', 'blague', 'plan'], '„an“ klingt dunkler als „on“ – der Mund ist weiter offen.'),
  hoerwort(3, 'fr.stumm', 3, 'vert', 'grün', 'vɛʁ', 'wär', ['verre', 'vers', 'ver'], 'Diese vier Wörter klingen fast gleich – hier hilft nur der Zusammenhang.'),
  hoerwort(4, 'fr.liaison', 4, 'ils ont', 'sie haben', 'ilz‿ɔ̃', 'ilson', ['ils sont', 'il est', 'ils vont'], 'Mit Liaison klingt „ils ont“ wie „il-son“ – „ils sont“ klingt genauso. Der Satz entscheidet.'),
  hoerwort(5, 'fr.zahlen', 2, 'deux', 'zwei', 'dø', 'dö', ['douze', 'dix', 'de'], '„deux“ (dö) und „douze“ (dus) werden oft verwechselt.'),
  hoerwort(6, 'fr.zahlen', 3, 'seize', 'sechzehn', 'sɛz', 'ßäs', ['seize ans', 'treize', 'six'], '„seize“ (ßäs) gegen „treize“ (träs) – nur der erste Laut unterscheidet sie.'),
  hoerwort(7, 'fr.cafe', 3, 'le pain', 'das Brot', 'lə pɛ̃', 'lö pä', ['le bain', 'le pont', 'le banc'], '„pain“ und „bain“ (Bad) trennt nur p gegen b.'),
  hoerwort(8, 'fr.fallen', 4, 'dessus', 'darüber', 'dəsy', 'dössü', ['dessous', 'dessin', 'dedans'], '„dessus“ (darüber) und „dessous“ (darunter) klingen fast gleich – ü gegen u.'),
]
