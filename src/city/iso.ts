// Umrechnung zwischen Kacheln und Bildschirm. Die Stadt steht schräg im Raum:
// eine Kachel ist eine Raute, doppelt so breit wie hoch.

export const TILE_W = 64
export const TILE_H = 32

/** Mitte einer Kachel im Weltkoordinatensystem (vor Kamera und Zoom) */
export function toScreen(x: number, y: number): { sx: number; sy: number } {
  return { sx: (x - y) * (TILE_W / 2), sy: (x + y) * (TILE_H / 2) }
}

/** Umkehrung: Welche Kachel liegt unter diesem Punkt? */
export function toTile(sx: number, sy: number): { x: number; y: number } {
  const a = sx / (TILE_W / 2)
  const b = sy / (TILE_H / 2)
  return { x: (b + a) / 2, y: (b - a) / 2 }
}

/** Rautenpfad einer Kachel – Grundfläche für Boden, Schatten und Vorschau */
export function tilePath(ctx: CanvasRenderingContext2D, sx: number, sy: number, w = 1, h = 1): void {
  const top = toScreen(0, 0)
  const right = toScreen(w, 0)
  const bottom = toScreen(w, h)
  const left = toScreen(0, h)
  ctx.beginPath()
  ctx.moveTo(sx + top.sx, sy + top.sy)
  ctx.lineTo(sx + right.sx, sy + right.sy)
  ctx.lineTo(sx + bottom.sx, sy + bottom.sy)
  ctx.lineTo(sx + left.sx, sy + left.sy)
  ctx.closePath()
}

/** Gleichmäßiges Rauschen je Kachel, damit der Boden nicht eintönig wirkt */
export function tileNoise(x: number, y: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return value - Math.floor(value)
}
