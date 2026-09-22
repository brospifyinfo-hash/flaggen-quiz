import { GRID, PLAZA, footprint } from '../game/defs';
import { buildOccupancy, isPlaza } from '../game/state';
import type { Building, GameState } from '../game/types';
import { drawBuilding, drawGhostTile, drawHoverTile, drawRaid } from './draw';
import { TH, TW, areaCenter, diamond, hash, poly, screenToWorld, tileOrigin, worldToGrid, type Camera } from './iso';

export interface Ghost {
  type: string;
  gx: number;
  gy: number;
  ok: boolean;
}

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  cam: Camera;
  private w = 0;
  private h = 0;
  private dpr = 1;
  hover: { gx: number; gy: number } | null = null;
  ghost: Ghost | null = null;
  selectedId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    const center = areaCenter(PLAZA.x, PLAZA.y, PLAZA.size);
    this.cam = { x: center.x, y: center.y - 40, zoom: window.innerWidth < 700 ? 0.85 : 1.25 };
    this.resize();
  }

  resize(): void {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.canvas.width = Math.floor(this.w * this.dpr);
    this.canvas.height = Math.floor(this.h * this.dpr);
  }

  get size(): { w: number; h: number } {
    return { w: this.w, h: this.h };
  }

  pick(sx: number, sy: number): { gx: number; gy: number } {
    return worldToGrid(screenToWorld(sx, sy, this.cam, this.w, this.h));
  }

  pan(dx: number, dy: number): void {
    this.cam.x -= dx / this.cam.zoom;
    this.cam.y -= dy / this.cam.zoom;
    const limit = GRID * (TW / 2) + 200;
    this.cam.x = Math.max(-limit, Math.min(limit, this.cam.x));
    this.cam.y = Math.max(-100, Math.min(GRID * TH + 200, this.cam.y));
  }

  zoomAt(factor: number, sx: number, sy: number): void {
    const before = screenToWorld(sx, sy, this.cam, this.w, this.h);
    this.cam.zoom = Math.max(0.45, Math.min(2.6, this.cam.zoom * factor));
    const after = screenToWorld(sx, sy, this.cam, this.w, this.h);
    this.cam.x += before.x - after.x;
    this.cam.y += before.y - after.y;
  }

  centerOnTownHall(): void {
    const center = areaCenter(PLAZA.x, PLAZA.y, PLAZA.size);
    this.cam.x = center.x;
    this.cam.y = center.y - 40;
  }

  render(state: GameState, t: number): void {
    const ctx = this.ctx;
    const { w, h, dpr } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const grad = ctx.createLinearGradient(0, 0, 0, h * dpr);
    grad.addColorStop(0, '#141a2a');
    grad.addColorStop(1, '#1f2a3c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w * dpr, h * dpr);

    const z = this.cam.zoom * dpr;
    ctx.setTransform(z, 0, 0, z, (w / 2 - this.cam.x * this.cam.zoom) * dpr, (h / 2 - this.cam.y * this.cam.zoom) * dpr);

    const tl = screenToWorld(-80, -200, this.cam, w, h);
    const br = screenToWorld(w + 80, h + 80, this.cam, w, h);
    const visible = (x: number, y: number) => x > tl.x - TW && x < br.x + TW && y > tl.y - TH && y < br.y + TH;

    const occ = buildOccupancy(state);

    // Boden
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const o = tileOrigin(gx, gy);
        if (!visible(o.x, o.y)) continue;
        const c = { x: o.x, y: o.y + TH / 2 };
        const d = diamond(c, TW / 2, TH / 2);
        if (isPlaza(gx, gy)) {
          poly(ctx, d, (gx + gy) % 2 ? '#8e8a80' : '#9a968c', 'rgba(0,0,0,0.15)', 0.5);
          continue;
        }
        const v = hash(gx, gy);
        const base = v < 0.33 ? '#4e7d3b' : v < 0.66 ? '#52833e' : '#497739';
        poly(ctx, d, base, 'rgba(0,0,0,0.12)', 0.5);
        if (v > 0.9 && !occ[gy * GRID + gx]) {
          ctx.fillStyle = '#3e6b30';
          ctx.beginPath();
          ctx.ellipse(c.x + (v - 0.95) * 200, c.y - 2, 5, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Kartenrand (Klippe)
    const edgeL = tileOrigin(0, GRID);
    const edgeB = tileOrigin(GRID, GRID);
    const edgeR = tileOrigin(GRID, 0);
    poly(ctx, [edgeL, edgeB, { x: edgeB.x, y: edgeB.y + 14 }, { x: edgeL.x, y: edgeL.y + 14 }], '#3b4a2c');
    poly(ctx, [edgeB, edgeR, { x: edgeR.x, y: edgeR.y + 14 }, { x: edgeB.x, y: edgeB.y + 14 }], '#2f3d23');

    // Gebäude nach Tiefe sortieren
    const sorted = [...state.buildings].sort((a, b) => {
      const ka = a.x + a.y + footprint(a.type, a.level) - 1;
      const kb = b.x + b.y + footprint(b.type, b.level) - 1;
      return ka - kb || a.x - b.x;
    });

    if (this.hover && !this.ghost && !occ[this.hover.gy * GRID + this.hover.gx] && !isPlaza(this.hover.gx, this.hover.gy)) {
      drawHoverTile(ctx, this.hover.gx, this.hover.gy);
    }
    if (this.ghost) drawGhostTile(ctx, this.ghost.gx, this.ghost.gy, this.ghost.ok);

    const raided: Building[] = [];
    for (const b of sorted) {
      const o = tileOrigin(b.x, b.y);
      if (!visible(o.x, o.y)) continue;
      drawBuilding(ctx, b, { t, selected: b.id === this.selectedId });
      if (b.raidedUntil > state.time) raided.push(b);
    }
    for (const b of raided) drawRaid(ctx, b, t);

    if (this.ghost && this.ghost.ok) {
      const ghostBuilding: Building = {
        id: 0,
        type: this.ghost.type,
        x: this.ghost.gx,
        y: this.ghost.gy,
        level: 1,
        residents: 0,
        moveInProgress: 0,
        happiness: 60,
        status: 'ok',
        unhappyFor: 0,
        complaint: '',
        raidedUntil: 0,
        builtAt: 0,
      };
      drawBuilding(ctx, ghostBuilding, { t, ghost: true });
    }
  }
}
