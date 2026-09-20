// 💻 Debugger: kurze Code-Stücke mit genau einem Fehler. Die Sprache ist JavaScript,
// die Fehler sind die, die wirklich passieren – Vergleich statt Zuweisung, ein Index zu
// weit, ein vergessenes await.
// Achtung beim Schreiben: Innerhalb einer Fehlerstelle dürfen weder { } noch => stehen,
// sonst verschluckt die Auszeichnung den Code. Pfeilfunktionen also außerhalb lassen.
import type { FehlerItem, Stufe } from '../../typen'
import { fehlerTeile } from '../werkzeug'

function code(nr: number, ziel: string, stufe: Stufe, kontext: string, text: string, erklaerung: string, mehr?: string): FehlerItem {
  return {
    id: `it.co.${String(nr).padStart(2, '0')}`,
    spiel: 'it.debugger',
    art: 'fehler',
    ziel,
    stufe,
    kontext,
    code: true,
    teile: fehlerTeile(text),
    erklaerung,
    ...(mehr ? { mehr } : {}),
  }
}

export const CODE: FehlerItem[] = [
  code(1, 'it.debuggen', 1, 'Die Schleife läuft einmal zu oft.',
    `for (let i = 0; {i <= namen.length=>i < namen.length|i > namen.length|i <= namen.length + 1}; i++) {
  console.log(namen[i])
}`,
    'Bei „<=“ greift die Schleife auf den Index hinter dem letzten Eintrag zu – dort steht undefined.',
    'Ein Array mit drei Einträgen hat die Indizes 0, 1 und 2. „length“ ist 3, die Bedingung muss also „i < length“ lauten.',
  ),
  code(2, 'it.debuggen', 1, 'Die Bedingung trifft immer zu.',
    `if ({name = "Anna"=>name === "Anna"|name := "Anna"|name equals "Anna"}) {
  gruessen()
}`,
    'Ein einfaches Gleichheitszeichen weist zu, statt zu vergleichen – danach ist die Bedingung immer wahr.',
    'Verglichen wird mit drei Gleichheitszeichen. Zwei vergleichen zwar auch, wandeln dabei aber Typen um.',
  ),
  code(3, 'it.lesen', 2, 'Der Preis stimmt nicht.',
    `const preis = "10"
const gesamt = {preis + 5=>Number(preis) + 5|preis + "5"|preis * "5"}
// erwartet: 15`,
    'Steht links ein Text, hängt das Pluszeichen nur an: Aus "10" und 5 wird "105".',
    'Zahlen aus Eingabefeldern sind immer Text. Erst mit Number(...) umwandeln, dann rechnen.',
  ),
  code(4, 'it.debuggen', 2, 'Die Funktion gibt nichts zurück.',
    `function doppelt(x) {
  {x * 2=>return x * 2|console.log(x * 2)|x = x * 2}
}
const y = doppelt(4)`,
    'Ohne „return“ liefert die Funktion undefined – der Wert wird berechnet und weggeworfen.',
  ),
  code(5, 'it.lesen', 2, 'Der Tippfehler kostet eine halbe Stunde.',
    `if (liste.{lenght=>length|size|count} > 0) {
  zeige(liste)
}`,
    'JavaScript meldet nichts: liste.lenght ist einfach undefined, und undefined ist nicht größer als 0.',
    'Deshalb springt der Block nie an. Solche Tippfehler findet ein Linter sofort.',
  ),
  code(6, 'it.debuggen', 3, 'Das Ergebnis ist ein Versprechen, kein Text.',
    `async function laden() {
  const antwort = {fetch(url)=>await fetch(url)|new fetch(url)|fetch.url}
  return antwort.status
}`,
    'Ohne „await“ steht in der Variablen das Versprechen auf ein Ergebnis, nicht das Ergebnis selbst.',
  ),
  code(7, 'it.lesen', 3, 'Die Schleife bricht zu früh ab.',
    `for (const n of zahlen) {
  if (n > 100) {
    {return n=>continue|return|exit}
  }
  summe += n
}`,
    'Mit „return“ verlässt man die ganze Funktion. Wer nur diesen Durchlauf überspringen will, nimmt „continue“.',
    '„break“ beendet die Schleife, „continue“ springt zum nächsten Eintrag – der Unterschied entscheidet über das Ergebnis.',
  ),
  code(8, 'it.debuggen', 3, 'Die Konstante lässt sich nicht ändern.',
    `{const=>let|final|static} zaehler = 0
for (const k of kunden) {
  zaehler = zaehler + 1
}`,
    'Eine mit „const“ angelegte Variable lässt sich nicht neu zuweisen – dafür braucht es „let“.',
  ),
  code(9, 'it.lesen', 4, 'Der Vergleich geht schief.',
    `const eingabe = "0"
if ({eingabe == 0=>eingabe === 0|eingabe >= 0|eingabe != 0}) {
  console.log("leer")
}`,
    'Mit zwei Gleichheitszeichen wandelt JavaScript "0" in 0 um – die Meldung erscheint, obwohl eine Eingabe da ist.',
    'Regel: immer drei Gleichheitszeichen. Das erspart genau diese Überraschungen.',
  ),
  code(10, 'it.debuggen', 4, 'Jeder zweite Eintrag wird übersprungen.',
    `for (let i = 0; i < liste.length; i++) {
  if (!liste[i].aktiv) {
    liste.{splice(i, 1)=>splice(i--, 1)|slice(i, 1)|pop()}
  }
}`,
    'Wer beim Durchlaufen löscht, verschiebt alle folgenden Einträge nach vorn – der Index muss zurück.',
    'Sauberer wäre liste.filter(...): Das baut eine neue Liste, statt an der alten zu schrauben.',
  ),
  code(11, 'it.lesen', 4, 'Die Zahlen stehen in der falschen Reihenfolge.',
    `const sortiert = zahlen.sort(function (a, b) {
  return {a > b=>a - b|a|b}
})
// erwartet: 2, 10, 30`,
    'Sortieren erwartet eine Zahl: negativ, null oder positiv. Ein Wahrheitswert reicht nicht.',
    'Ohne Vergleichsfunktion sortiert JavaScript sogar als Text – dann käme 10 vor 2.',
  ),
  code(12, 'it.debuggen', 5, 'Die Anzeige aktualisiert sich nicht.',
    `function merken(liste, eintrag) {
  {liste.push(eintrag)=>return [...liste, eintrag]|liste = [eintrag]|liste.concat(eintrag)}
  return liste
}`,
    'Die übergebene Liste wird verändert. Überall dort, wo auf neue Referenzen geprüft wird, bleibt die Anzeige dann stehen.',
    'concat gäbe zwar eine neue Liste zurück, hier fehlte aber die Rückgabe – die Schreibweise mit drei Punkten macht beides in einem Schritt.',
  ),
]
