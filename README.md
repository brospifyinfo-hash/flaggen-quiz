# Weltwissen

Quiz und isometrische Stadt. Lernen bringt der Stadt Zeit, die Stadt wächst mit dem Wissen.

## Starten

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 4821
```

Dann im Browser `http://127.0.0.1:4821` öffnen.

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4822
```

## Konto

Ohne Konto geht das Spiel nicht weiter: Fortschritt und Stadt werden dem Konto zugeordnet.

- In der Entwicklung liegen die Konten im Ordner `.konto-daten` (nicht im Git). Die Funktion dafür wird beim Bauen nach `server/konto.bundle.js` gepackt.
- Auf dem Server (Vercel) liegen sie in einem privaten GitHub-Repository. Dafür braucht die Funktion diese Variablen:
  - `KONTO_GITHUB_TOKEN` – Zugriff auf das Repository
  - `KONTO_GITHUB_REPO` – `besitzer/name`
  - `KONTO_GEHEIMNIS` – Schlüssel für die Anmeldung, mindestens 32 Zeichen

Eine Zurücksetzung des Passworts per E-Mail gibt es nicht. Wer das Passwort vergisst, braucht ein neues Konto.

Der Stand wird gebündelt gesichert: spätestens 90 Sekunden nach einer Änderung und sofort, wenn die App in den Hintergrund geht. Öffnet man sie auf einem zweiten Gerät, werden beide Stände zusammengeführt.
