# Schattenstadt

Isometrisches Städtebau-Spiel im Browser – mit legalem Gewerbe, Rotlicht-Viertel und einer Hanfplantage, die vom Beet hinterm Schuppen bis zum Grow-Tower mit 100 Ausbaustufen wächst.

## Features

- **Wohnen & Bewohner**: Wohnhäuser, Reihenhäuser, Wohnblocks und Wohntürme. Bewohner ziehen ein, zahlen Steuern und haben eine Zufriedenheit, die von der Nachbarschaft abhängt.
- **Beschwerden & Auszug**: Sinkt die Zufriedenheit unter 35 %, beschweren sich die Bewohner zuerst (Sprechblase + Meldung). Bessert sich nichts, ziehen sie aus. Das Haus bleibt als **Lost Place** stehen – eingeschlagene Fenster, Bretter, Graffiti, Unkraut, Loch im Dach – und drückt die Stimmung der Nachbarn. Ruinen können abgerissen oder saniert werden.
- **Jedes Unternehmen ist ausbaubar** und liefert aktiven Cashflow pro Sekunde. Legale Betriebe brauchen Kundschaft (Nachfrage steigt mit der Bevölkerung).
- **Rotlicht & Kriminell**: Hanfplantage (100 Stufen, 5 sichtbare Ausbaustufen), Spielhalle, Hehlerei, Stripclub, illegales Wettbüro, Puff, Casino, Waschsalon (Geldwäsche), Schwarzmarkt, Schmugglerlager. Kriminelle Betriebe erzeugen **Hitze** – zu viel davon führt zu Razzien mit Strafen. Polizeiwachen und Geldwäsche senken die Hitze.
- **Rathaus**: Die Stadt-Statistiken (Kasse, Einkommensaufteilung, Bevölkerung, Zufriedenheit, Kriminalität, Gebäude, Ereignis-Log) sind nur über einen Klick auf das Rathaus erreichbar. Das Rathaus wächst mit jedem Stadtlevel (2×2 → 3×3 → 4×4 Felder, höherer Turm, Kuppel, Beleuchtung).
- **Stadtlevel** steigen mit der Bevölkerung und schalten neue Gebäude frei.
- Autosave im Browser (localStorage) mit Offline-Einkommen bei Rückkehr.

## Steuerung

- **Bauen**: Unten eine Kategorie und ein Gebäude wählen, dann auf ein freies Feld tippen. `Esc` oder Rechtsklick bricht ab.
- **Gebäude verwalten**: Auf ein Gebäude tippen → Ausbauen, Abreißen, bei Ruinen Sanieren.
- **Stadt-Statistiken**: Auf das Rathaus tippen.
- **Kamera**: Ziehen zum Verschieben, Mausrad / Pinch zum Zoomen, `⌂` springt zum Rathaus.

## Lokal starten

```bash
npm install
npm run dev
```

Der Dev-Server läuft auf [http://127.0.0.1:4821](http://127.0.0.1:4821).

```bash
npm run build     # Produktions-Build nach dist/
npm run preview   # Build lokal ansehen
```

## Technik

Vite + TypeScript, ohne Framework. Die gesamte Grafik wird prozedural auf ein Canvas gezeichnet (`src/render/`), die Spiellogik liegt in `src/game/`, die DOM-Oberfläche in `src/ui/`.
