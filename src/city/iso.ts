// Umrechnung zwischen Kacheln und Bildschirm. Die Stadt steht schräg im Raum:
// eine Kachel ist eine Raute, doppelt so breit wie hoch.
//
// Dazu kommt der Blickwinkel: Man kann die Stadt mit zwei Fingern frei drehen.
// Gedreht wird nicht das Bild, sondern der Boden – jede Kachel wird um die
// Feldmitte gedreht, bevor sie auf den Bildschirm gerechnet wird. So gilt die
// Drehung überall zugleich: für Häuser, Straßen, Menschen, für die Kamera und
// für jeden Tipper. Bei Winkel 0 ist alles wie immer.

export const TILE_W = 64
export const TILE_H = 32

/** Blickwinkel im Bogenmaß */
export type Blick = number

let winkel: Blick = 0
let cos = 1
let sin = 0
/** Drehpunkt: die Mitte des Feldes */
let mitte = 6

/** Blickwinkel und Feldgröße setzen. Wird vor jedem Bild aufgerufen. */
export function setBlick(neu: Blick, land: number): void {
  winkel = Number.isFinite(neu) ? neu : 0
  cos = Math.cos(winkel)
  sin = Math.sin(winkel)
  mitte = land / 2
}

export const blickJetzt = (): Blick => winkel

/** Eine Kachel in die Blickrichtung drehen */
export function dreh(x: number, y: number): { x: number; y: number } {
  const dx = x - mitte
  const dy = y - mitte
  return { x: mitte + dx * cos - dy * sin, y: mitte + dx * sin + dy * cos }
}

/** Die Umkehrung: aus der gedrehten Kachel wieder die echte machen */
export function entdreh(x: number, y: number): { x: number; y: number } {
  const dx = x - mitte
  const dy = y - mitte
  return { x: mitte + dx * cos + dy * sin, y: mitte - dx * sin + dy * cos }
}

/**
 * Eine Richtung drehen – ohne den Drehpunkt. Eine Fahrtrichtung hat keinen Ort,
 * nur ein Woher und Wohin; würde man sie wie eine Kachel drehen, zeigte jedes
 * Auto zur Feldmitte.
 */
export function drehRichtung(dx: number, dy: number): { x: number; y: number } {
  return { x: dx * cos - dy * sin, y: dx * sin + dy * cos }
}

/** Mitte einer Kachel im Weltkoordinatensystem (vor Kamera und Zoom) */
export function toScreen(x: number, y: number): { sx: number; sy: number } {
  const d = dreh(x, y)
  return { sx: (d.x - d.y) * (TILE_W / 2), sy: (d.x + d.y) * (TILE_H / 2) }
}

/** Eine Richtung auf den Bildschirm rechnen, ohne Ort */
export function dirToScreen(dx: number, dy: number): { sx: number; sy: number } {
  const d = drehRichtung(dx, dy)
  return { sx: (d.x - d.y) * (TILE_W / 2), sy: (d.x + d.y) * (TILE_H / 2) }
}

/** Umkehrung: Welche Kachel liegt unter diesem Punkt? */
export function toTile(sx: number, sy: number): { x: number; y: number } {
  const a = sx / (TILE_W / 2)
  const b = sy / (TILE_H / 2)
  return entdreh((b + a) / 2, (b - a) / 2)
}

/**
 * Wie weit vorn liegt dieser Punkt im Bild? Danach richtet sich die Reihenfolge
 * beim Malen: Was weiter hinten liegt, kommt zuerst.
 */
export function tiefe(x: number, y: number): number {
  const d = dreh(x, y)
  return d.x + d.y
}

/** Zeigt eine Wand mit dieser Außenrichtung zum Betrachter? */
export function zeigtNachVorn(nx: number, ny: number): boolean {
  return dirToScreen(nx, ny).sy > 1e-6
}

/**
 * Wie sehr eine Fläche mit dieser Außenrichtung nach rechts schaut: 1 ganz nach
 * rechts, -1 ganz nach links. Das Licht kommt von rechts – danach wird schattiert.
 */
export function nachRechts(nx: number, ny: number): number {
  const r = dirToScreen(nx, ny)
  const laenge = Math.hypot(r.sx, r.sy)
  return laenge > 0 ? r.sx / laenge : 0
}

/** Gleichmäßiges Rauschen je Kachel, damit der Boden nicht eintönig wirkt */
export function tileNoise(x: number, y: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return value - Math.floor(value)
}
