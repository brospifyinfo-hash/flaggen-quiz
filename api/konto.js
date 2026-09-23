// Dünne Hülle: lädt die eigentliche Funktion erst beim Aufruf.
// Schlägt das Laden fehl, kommt die Ursache als Antwort zurück statt eines leeren Absturzes.
async function lade() {
  return import('../server/konto.bundle.js')
}

const fehlerAntwort = (fehler) =>
  new Response(
    JSON.stringify({ fehler: fehler instanceof Error ? fehler.message : 'Die Konto-Funktion ist abgestürzt.' }),
    { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } },
  )

export async function GET(request) {
  try {
    const mod = await lade()
    return await mod.GET(request)
  } catch (fehler) {
    return fehlerAntwort(fehler)
  }
}

export async function POST(request) {
  try {
    const mod = await lade()
    return await mod.POST(request)
  } catch (fehler) {
    return fehlerAntwort(fehler)
  }
}
