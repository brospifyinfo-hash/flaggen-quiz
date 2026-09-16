// Umkehrung der Natural-Earth-1-Projektion: aus einem Tipper auf der Karte werden
// echte Koordinaten und damit echte Kilometer. Die Formeln sind dieselben wie in d3-geo,
// scripts/prepare-map.ts prüft beim Erzeugen der Daten, dass beide Wege übereinstimmen.

const EPS = 1e-10
const DEG = 180 / Math.PI

/** Kartenpunkt → [Breitengrad, Längengrad] */
export function mapToLatLon(x: number, y: number, k: number, dx: number, dy: number): [number, number] {
  const px = (x - dx) / k
  const py = (dy - y) / k

  // Der y-Anteil hängt nur vom Breitengrad ab und lässt sich in wenigen Schritten lösen
  let phi = py
  for (let step = 0; step < 25; step++) {
    const phi2 = phi * phi
    const phi4 = phi2 * phi2
    const value = phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4))) - py
    const slope =
      1.007226 + phi2 * (0.015085 * 3 + phi4 * (-0.044475 * 7 + 0.028874 * 9 * phi2 - 0.005916 * 11 * phi4))
    const delta = value / slope
    phi -= delta
    if (Math.abs(delta) < EPS) break
  }

  const phi2 = phi * phi
  const lambda =
    px / (0.8707 + phi2 * (-0.131979 + phi2 * (-0.013791 + phi2 * phi2 * phi2 * (0.003971 - 0.001529 * phi2))))
  return [phi * DEG, lambda * DEG]
}

/** Luftlinie in Kilometern */
export function distanceKm(latA: number, lonA: number, latB: number, lonB: number): number {
  const R = 6371
  const rad = Math.PI / 180
  const dLat = (latB - latA) * rad
  const dLon = (lonB - lonA) * rad
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(latA * rad) * Math.cos(latB * rad) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}
