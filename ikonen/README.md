# Weltwissen Ikonen

Eigene Farbschrift, die im ganzen Spiel die System-Emoji ersetzt. Jeder Emoji-Codepunkt,
der im Quellcode vorkommt, bekommt ein selbst gezeichnetes, flaches Piktogramm.

- `generate.py` zeichnet alle Glyphen als SVG (128×128, nur Flächen und Linien, keine Verläufe) nach `svg/`.
- `build.sh` baut daraus mit [nanoemoji](https://github.com/googlefonts/nanoemoji) eine COLRv0-Schrift
  und schreibt `public/fonts/Ikonen.woff2`.
- `src/styles.css` bindet die Schrift per `@font-face` mit `unicode-range` ein, sodass sie nur für
  Emoji-Codepunkte greift; normaler Text bleibt in Nunito.

Voraussetzungen: `pip install nanoemoji fonttools brotli`, dann `npm run ikonen`.

Neues Emoji im Code? Eintrag in `generate.py` ergänzen (`z('<codepunkt>', …)`), Schrift neu bauen.
