/**
 * Die eine Schnittstelle für Konten: POST /api/konto mit { aktion, ... }.
 * Läuft als Vercel-Funktion (Node) und in der Entwicklung über das Vite-Plugin
 * in vite.config.ts, das dieselbe Funktion aufruft.
 */
import { Abgelehnt, anmelden, laden, passwortAendern, registrieren, speichern, zustand } from './_lib/konto'

const AKTIONEN = { registrieren, anmelden, laden, speichern, passwortAendern } as const
type Aktion = keyof typeof AKTIONEN

/** Einfache Bremse gegen Passwort-Raten: je Adresse höchstens 30 Anmeldeversuche in 10 Minuten */
const versuche = new Map<string, { n: number; bis: number }>()
function bremse(schluessel: string): void {
  const jetzt = Date.now()
  const eintrag = versuche.get(schluessel)
  if (!eintrag || eintrag.bis < jetzt) {
    versuche.set(schluessel, { n: 1, bis: jetzt + 10 * 60 * 1000 })
    return
  }
  eintrag.n++
  if (eintrag.n > 30) throw new Abgelehnt(429, 'Zu viele Versuche. Bitte warte ein paar Minuten.')
}

const antwort = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })

export async function GET(): Promise<Response> {
  try {
    return antwort(200, zustand())
  } catch (fehler) {
    console.error('Konto-Status:', fehler)
    return antwort(500, { fehler: fehler instanceof Error ? fehler.message : 'Status nicht verfügbar.' })
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
    if (typeof body !== 'object' || body === null) throw new Error()
  } catch {
    return antwort(400, { fehler: 'Die Anfrage war nicht lesbar.' })
  }

  const aktion = body.aktion
  if (typeof aktion !== 'string' || !(aktion in AKTIONEN)) return antwort(400, { fehler: 'Unbekannte Aktion.' })

  try {
    if (aktion === 'anmelden' || aktion === 'registrieren') {
      const adresse = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'lokal'
      bremse(adresse)
    }
    const ergebnis = await AKTIONEN[aktion as Aktion](body)
    return antwort(200, ergebnis)
  } catch (fehler) {
    if (fehler instanceof Abgelehnt) return antwort(fehler.status, { fehler: fehler.message, ...fehler.zusatz })
    console.error('Konto-Fehler:', fehler)
    return antwort(500, { fehler: 'Auf dem Server ist etwas schiefgegangen. Bitte versuche es gleich noch einmal.' })
  }
}
