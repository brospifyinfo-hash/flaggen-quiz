export const TW = 64;
export const TH = 32;

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Pt {
  x: number;
  y: number;
}

/** Oberer Eckpunkt der Kachel in Weltkoordinaten */
export function tileOrigin(gx: number, gy: number): Pt {
  return { x: (gx - gy) * (TW / 2), y: (gx + gy) * (TH / 2) };
}

/** Mittelpunkt einer s×s-Fläche in Weltkoordinaten */
export function areaCenter(gx: number, gy: number, s: number): Pt {
  const o = tileOrigin(gx, gy);
  return { x: o.x, y: o.y + s * (TH / 2) };
}

export function screenToWorld(sx: number, sy: number, cam: Camera, w: number, h: number): Pt {
  return { x: (sx - w / 2) / cam.zoom + cam.x, y: (sy - h / 2) / cam.zoom + cam.y };
}

export function worldToGrid(p: Pt): { gx: number; gy: number } {
  const wy = p.y - TH / 2;
  const gx = (p.x / (TW / 2) + wy / (TH / 2)) / 2;
  const gy = (wy / (TH / 2) - p.x / (TW / 2)) / 2;
  return { gx: Math.round(gx), gy: Math.round(gy) };
}

export function diamond(c: Pt, hw: number, hh: number): [Pt, Pt, Pt, Pt] {
  return [
    { x: c.x, y: c.y - hh },
    { x: c.x + hw, y: c.y },
    { x: c.x, y: c.y + hh },
    { x: c.x - hw, y: c.y },
  ];
}

export function hash(a: number, b: number, c = 0): number {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 10000) / 10000;
}

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  if (amt >= 0) {
    r = Math.round(r + (255 - r) * amt);
    g = Math.round(g + (255 - g) * amt);
    b = Math.round(b + (255 - b) * amt);
  } else {
    r = Math.round(r * (1 + amt));
    g = Math.round(g * (1 + amt));
    b = Math.round(b * (1 + amt));
  }
  return `rgb(${r},${g},${b})`;
}

export function poly(ctx: CanvasRenderingContext2D, pts: Pt[], fill: string, stroke?: string, lineWidth = 1): void {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function up(p: Pt, h: number): Pt {
  return { x: p.x, y: p.y - h };
}
