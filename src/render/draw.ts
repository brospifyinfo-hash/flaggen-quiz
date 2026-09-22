import { TOWN_HALL_ID, footprint, hanfTier } from '../game/defs';
import type { Building } from '../game/types';
import { TH, TW, areaCenter, diamond, hash, lerp, poly, shade, up, type Pt } from './iso';

interface Style {
  wall: string;
  roof: string;
  win: string;
  lit: string;
  h: number;
  step: number;
  sign?: string;
  neon?: string;
  cols?: number;
  litChance?: number;
}

const STYLES: Record<string, Style> = {
  wohnhaus: { wall: '#e9d9b6', roof: '#a9432c', win: '#2b3550', lit: '#ffe08a', h: 16, step: 6 },
  reihenhaus: { wall: '#d9c4a0', roof: '#6d4a3a', win: '#2b3550', lit: '#ffe08a', h: 22, step: 6, cols: 3 },
  wohnblock: { wall: '#b9bcc4', roof: '#5b5e66', win: '#1e2740', lit: '#ffe9a8', h: 34, step: 9, cols: 3 },
  wohnturm: { wall: '#8fb3c9', roof: '#3b5566', win: '#182a3a', lit: '#dff4ff', h: 48, step: 13, cols: 4 },

  kiosk: { wall: '#f0b25a', roof: '#c9542a', win: '#33281a', lit: '#fff0b0', h: 14, step: 2, sign: 'KIOSK', neon: '#ffd166' },
  baeckerei: { wall: '#f3dfc1', roof: '#8d5a3a', win: '#3a2a1c', lit: '#ffe4a8', h: 18, step: 3, sign: 'BÄCKEREI', neon: '#ffb86b' },
  supermarkt: { wall: '#eef1f5', roof: '#c8323a', win: '#22334a', lit: '#e8f6ff', h: 20, step: 3, sign: 'MARKT', neon: '#ff5d6c', cols: 3 },
  werkstatt: { wall: '#9aa0a8', roof: '#4a4f57', win: '#1f2430', lit: '#ffd27a', h: 20, step: 3, sign: 'KFZ', neon: '#ffa62b' },
  restaurant: { wall: '#7a2f3f', roof: '#3a1a22', win: '#2a1a20', lit: '#ffcf8a', h: 22, step: 4, sign: 'RISTORANTE', neon: '#ffd7a3' },
  buero: { wall: '#6f8fae', roof: '#2f4459', win: '#16273a', lit: '#dbeeff', h: 46, step: 9, cols: 4, litChance: 0.7 },
  kino: { wall: '#2f2a4a', roof: '#1b1830', win: '#151226', lit: '#ffe27a', h: 36, step: 4, sign: 'KINO', neon: '#ffd23f' },
  einkaufszentrum: { wall: '#dfe3ea', roof: '#8f97a3', win: '#243447', lit: '#fff3c4', h: 40, step: 5, sign: 'MALL', neon: '#5ad1ff', cols: 4 },

  spielhalle: { wall: '#2a2f5a', roof: '#161a36', win: '#0f1230', lit: '#ffdd55', h: 20, step: 3, sign: 'SPIELHALLE', neon: '#ffd23f' },
  hehlerei: { wall: '#6b5238', roof: '#3d2d1f', win: '#1a140f', lit: '#e0b060', h: 20, step: 3, sign: 'PFAND', neon: '#e9c46a' },
  stripclub: { wall: '#3a1b4a', roof: '#22102c', win: '#150a1c', lit: '#ff5fb7', h: 24, step: 4, sign: 'STRIP', neon: '#ff3fa8' },
  wettbuero: { wall: '#1f4a3a', roof: '#12302a', win: '#0d1f1a', lit: '#9cff9c', h: 22, step: 3, sign: 'WETTEN', neon: '#5dff8a' },
  bordell: { wall: '#5a1a22', roof: '#2e0d12', win: '#1c090c', lit: '#ff3b3b', h: 26, step: 4, sign: 'EROS', neon: '#ff2d55', litChance: 0.9 },
  waschsalon: { wall: '#bfe7f2', roof: '#5b9db0', win: '#1c3a44', lit: '#e8fbff', h: 18, step: 3, sign: 'WASCHSALON', neon: '#7fe3ff' },
  casino: { wall: '#f1e3c2', roof: '#b8942f', win: '#2a2410', lit: '#fff1a8', h: 40, step: 5, sign: 'CASINO', neon: '#ffcc33', cols: 4, litChance: 0.95 },
  schwarzmarkt: { wall: '#4a4d52', roof: '#2c2e33', win: '#15161a', lit: '#ff9d3f', h: 24, step: 3, sign: 'LAGER', neon: '#ff9d3f' },
  schmugglerlager: { wall: '#5b6068', roof: '#31353b', win: '#15171b', lit: '#ffb347', h: 34, step: 3, cols: 2 },

  park: { wall: '#4f8a3c', roof: '#4f8a3c', win: '#000', lit: '#000', h: 0, step: 0 },
  polizei: { wall: '#e6ecf3', roof: '#1f4f9c', win: '#1a2740', lit: '#cfe4ff', h: 24, step: 5, sign: 'POLIZEI', neon: '#6aa8ff' },
  schule: { wall: '#c8664a', roof: '#5d3a2e', win: '#2a1d18', lit: '#ffe6a3', h: 26, step: 5, cols: 3 },
  krankenhaus: { wall: '#f4f7fa', roof: '#9fb2c4', win: '#2b3a4c', lit: '#e8f4ff', h: 34, step: 8, cols: 3, litChance: 0.8 },
  rathaus: { wall: '#e2cfa9', roof: '#8c6f4a', win: '#2c2a3a', lit: '#ffe6a8', h: 26, step: 9, cols: 4 },
};

const ABANDONED: Style = { wall: '#6e6b63', roof: '#3d3b36', win: '#141418', lit: '#141418', h: 0, step: 0 };

export function buildingHeight(b: Building): number {
  if (b.type === 'hanfplantage') {
    const tier = hanfTier(b.level);
    if (tier === 1) return 10;
    if (tier === 2) return 16;
    if (tier === 3) return 26 + b.level * 0.6;
    if (tier === 4) return 40 + b.level * 0.9;
    return 70 + b.level * 1.3;
  }
  const s = STYLES[b.type] ?? STYLES.wohnhaus;
  return s.h + s.step * (b.level - 1);
}

interface Box {
  T: Pt;
  R: Pt;
  B: Pt;
  L: Pt;
  h: number;
}

function drawBox(ctx: CanvasRenderingContext2D, c: Pt, hw: number, hh: number, h: number, wall: string, roof: string, alpha = 1): Box {
  const [T, R, B, L] = diamond(c, hw, hh);
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * alpha;
  poly(ctx, [L, B, up(B, h), up(L, h)], shade(wall, -0.3));
  poly(ctx, [B, R, up(R, h), up(B, h)], shade(wall, -0.08));
  poly(ctx, [up(T, h), up(R, h), up(B, h), up(L, h)], roof, shade(roof, -0.25), 0.8);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(B.x, B.y);
  ctx.lineTo(B.x, B.y - h);
  ctx.stroke();
  ctx.globalAlpha = prev;
  return { T, R, B, L, h };
}

function drawWindows(
  ctx: CanvasRenderingContext2D,
  A: Pt,
  B: Pt,
  h: number,
  cols: number,
  rows: number,
  dark: string,
  lit: string,
  seed: number,
  t: number,
  litChance = 0.55,
  yFrom = 0.12,
  yTo = 0.92,
): void {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t0 = (c + 0.2) / cols;
      const t1 = (c + 0.8) / cols;
      const y0 = h * (yFrom + ((yTo - yFrom) * (r + 0.15)) / rows);
      const y1 = h * (yFrom + ((yTo - yFrom) * (r + 0.8)) / rows);
      const rnd = hash(seed, r * 31 + 7, c * 17 + 3);
      const flicker = hash(seed, r, c + Math.floor(t / 4)) > 0.9;
      const on = rnd < litChance !== flicker;
      poly(ctx, [up(lerp(A, B, t0), y0), up(lerp(A, B, t1), y0), up(lerp(A, B, t1), y1), up(lerp(A, B, t0), y1)], on ? lit : dark);
    }
  }
}

function drawSign(ctx: CanvasRenderingContext2D, at: Pt, text: string, color: string, t: number, seed: number, size = 8): void {
  const flick = hash(seed, Math.floor(t * 6), 0) > 0.97 ? 0.4 : 1;
  ctx.save();
  ctx.font = `bold ${size}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 10 * flick;
  ctx.globalAlpha *= flick;
  ctx.fillStyle = color;
  ctx.fillText(text, at.x, at.y);
  ctx.restore();
}

function neonEdge(ctx: CanvasRenderingContext2D, box: Box, color: string, t: number, offset = 0): void {
  const pulse = 0.7 + 0.3 * Math.sin(t * 3 + offset);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8 * pulse;
  ctx.globalAlpha *= 0.6 + 0.4 * pulse;
  ctx.beginPath();
  ctx.moveTo(box.L.x, box.L.y - box.h);
  ctx.lineTo(box.B.x, box.B.y - box.h);
  ctx.lineTo(box.R.x, box.R.y - box.h);
  ctx.stroke();
  ctx.restore();
}

function glowCircle(ctx: CanvasRenderingContext2D, p: Pt, r: number, color: string, blur = 10): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTree(ctx: CanvasRenderingContext2D, p: Pt, size: number, seed: number): void {
  ctx.fillStyle = '#5a3d25';
  ctx.fillRect(p.x - 1, p.y - size * 0.6, 2, size * 0.6);
  const g = hash(seed, 1) > 0.5 ? '#3f8a3a' : '#2f7a45';
  ctx.fillStyle = shade(g, -0.15);
  ctx.beginPath();
  ctx.arc(p.x, p.y - size * 0.9, size * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x - size * 0.15, p.y - size, size * 0.42, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlant(ctx: CanvasRenderingContext2D, p: Pt, size: number, color: string): void {
  ctx.strokeStyle = shade(color, -0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x, p.y - size);
  ctx.stroke();
  ctx.fillStyle = color;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(p.x + i * size * 0.25, p.y - size * 0.75 - Math.abs(i) * size * 0.05, size * 0.14, size * 0.4, (i * Math.PI) / 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function chimney(ctx: CanvasRenderingContext2D, p: Pt, h: number): void {
  poly(ctx, [p, { x: p.x + 4, y: p.y + 2 }, { x: p.x + 4, y: p.y + 2 - h }, { x: p.x, y: p.y - h }], '#6b5a55');
  poly(ctx, [{ x: p.x - 4, y: p.y + 2 }, p, { x: p.x, y: p.y - h }, { x: p.x - 4, y: p.y + 2 - h }], '#4d3f3c');
  poly(ctx, [{ x: p.x, y: p.y - h - 2 }, { x: p.x + 4, y: p.y - h }, { x: p.x, y: p.y - h + 2 }, { x: p.x - 4, y: p.y - h }], '#3a2f2d');
}

export interface DrawOpts {
  t: number;
  ghost?: boolean;
  selected?: boolean;
}

export function drawBuilding(ctx: CanvasRenderingContext2D, b: Building, opts: DrawOpts): void {
  const t = opts.t;
  const s = footprint(b.type, b.level);
  const c = areaCenter(b.x, b.y, s);
  const inset = b.type === TOWN_HALL_ID ? 0.86 : 0.8;
  const hw = s * (TW / 2) * inset;
  const hh = s * (TH / 2) * inset;
  const seed = b.id * 7919 + b.x * 31 + b.y;

  ctx.save();
  if (opts.ghost) ctx.globalAlpha = 0.6;

  if (opts.selected) {
    const d = diamond(areaCenter(b.x, b.y, s), s * (TW / 2), s * (TH / 2));
    poly(ctx, d, 'rgba(255,220,90,0.18)', '#ffd85a', 1.5);
  }

  switch (b.type) {
    case 'hanfplantage':
      drawHanf(ctx, b, c, hw, hh, seed, t);
      break;
    case 'park':
      drawPark(ctx, c, hw, hh, seed, b.level);
      break;
    case TOWN_HALL_ID:
      drawTownHall(ctx, b, c, hw, hh, seed, t);
      break;
    case 'schmugglerlager':
      drawSmuggler(ctx, b, c, hw, hh, seed, t);
      break;
    default:
      if (b.status === 'abandoned') drawAbandoned(ctx, b, c, hw, hh, seed, t);
      else drawGeneric(ctx, b, c, hw, hh, seed, t);
  }

  const h = buildingHeight(b);
  const top = { x: c.x, y: c.y - hh - h };

  if (b.status === 'complaining') drawComplaintBubble(ctx, top, t, seed);
  ctx.restore();
}

export function drawRaid(ctx: CanvasRenderingContext2D, b: Building, t: number): void {
  const s = footprint(b.type, b.level);
  const c = areaCenter(b.x, b.y, s);
  const hw = s * (TW / 2) * 0.8;
  const hh = s * (TH / 2) * 0.8;
  const h = buildingHeight(b);
  const [T, R, B, L] = diamond(c, hw, hh);
  const blue = Math.floor(t * 4) % 2 === 0;
  glowCircle(ctx, up(T, h + 6), 3, blue ? '#4c8dff' : '#ff4040', 14);
  ctx.save();
  ctx.strokeStyle = '#ffd400';
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(L.x, L.y - 8);
  ctx.lineTo(B.x, B.y - 8);
  ctx.lineTo(R.x, R.y - 8);
  ctx.stroke();
  ctx.strokeStyle = '#111';
  ctx.lineDashOffset = 4;
  ctx.stroke();
  ctx.restore();
  drawSign(ctx, up(B, h / 2), 'RAZZIA', '#ff4040', t, 0, 7);
}

function drawComplaintBubble(ctx: CanvasRenderingContext2D, top: Pt, t: number, seed: number): void {
  const bob = Math.sin(t * 3 + seed) * 2;
  const x = top.x;
  const y = top.y - 16 + bob;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x - 8, y - 8, 16, 14, 4);
  ctx.moveTo(x - 3, y + 6);
  ctx.lineTo(x, y + 11);
  ctx.lineTo(x + 3, y + 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c0392b';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', x, y);
  ctx.restore();
}

function drawGeneric(ctx: CanvasRenderingContext2D, b: Building, c: Pt, hw: number, hh: number, seed: number, t: number): void {
  const st = STYLES[b.type] ?? STYLES.wohnhaus;
  const h = buildingHeight(b);
  const box = drawBox(ctx, c, hw, hh, h, st.wall, st.roof);
  const cols = st.cols ?? 2;
  const rows = Math.max(1, Math.round(h / 12));
  const litChance = st.litChance ?? 0.55;
  drawWindows(ctx, box.L, box.B, h, cols, rows, st.win, st.lit, seed, t, litChance);
  drawWindows(ctx, box.B, box.R, h, cols, rows, st.win, shade(st.lit, 0.1), seed + 1, t, litChance);

  const isHouse = b.type === 'wohnhaus' || b.type === 'reihenhaus';
  if (isHouse) {
    chimney(ctx, { x: box.T.x + hw * 0.35, y: box.T.y - h + hh * 0.35 }, 6);
    // Tür
    const door = lerp(box.B, box.R, 0.5);
    poly(ctx, [up(door, 0), up(lerp(box.B, box.R, 0.62), 0), up(lerp(box.B, box.R, 0.62), 9), up(door, 9)], '#5a3a25');
  }

  if (st.neon) {
    if (b.type === 'stripclub' || b.type === 'bordell' || b.type === 'casino' || b.type === 'spielhalle') neonEdge(ctx, box, st.neon, t, seed);
    if (b.type === 'casino') {
      const colors = ['#ffcc33', '#ff5f9e', '#5ad1ff', '#9dff5a'];
      for (let i = 0; i < 6; i++) {
        const p = up(lerp(box.L, box.B, (i + 0.5) / 6), h * 0.55);
        glowCircle(ctx, p, 1.5, colors[(i + Math.floor(t * 5)) % colors.length], 6);
      }
    }
    if (b.type === 'bordell') {
      const lamp = up(lerp(box.B, box.R, 0.5), 12);
      glowCircle(ctx, lamp, 2 + Math.sin(t * 2) * 0.5, '#ff2d55', 16);
    }
    if (b.type === 'stripclub') {
      const sway = Math.sin(t * 2.5) * 3;
      const p = up(lerp(box.L, box.B, 0.5), h * 0.6);
      ctx.save();
      ctx.strokeStyle = '#ff3fa8';
      ctx.shadowColor = '#ff3fa8';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x - 6 + sway, p.y + 6);
      ctx.lineTo(p.x, p.y - 4);
      ctx.lineTo(p.x + 6 - sway, p.y + 6);
      ctx.stroke();
      ctx.restore();
    }
    if (st.sign) drawSign(ctx, up(box.T, h + 7), st.sign, st.neon, t, seed, b.type === 'kiosk' || b.type === 'baeckerei' ? 6 : 7);
  }

  if (b.type === 'polizei') {
    const p = up(box.T, h + 4);
    glowCircle(ctx, { x: p.x - 4, y: p.y }, 2, Math.floor(t * 3) % 2 ? '#4c8dff' : '#20305a', 8);
    glowCircle(ctx, { x: p.x + 4, y: p.y }, 2, Math.floor(t * 3) % 2 ? '#20305a' : '#ff4040', 8);
  }
  if (b.type === 'krankenhaus') {
    ctx.fillStyle = '#e03131';
    const p = up(box.T, h + 1);
    ctx.fillRect(p.x - 1.5, p.y - 5, 3, 10);
    ctx.fillRect(p.x - 5, p.y - 1.5, 10, 3);
  }
  if (b.type === 'schule') {
    const p = up(lerp(box.L, box.B, 0.5), h * 0.75);
    ctx.fillStyle = '#f5f1e8';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, p.y - 3);
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 2, p.y);
    ctx.stroke();
  }
  if (b.type === 'wohnturm' || b.type === 'buero') {
    glowCircle(ctx, up(box.T, h + 3), 1.5, Math.floor(t) % 2 ? '#ff3030' : '#601010', 6);
  }
  if (b.type === 'waschsalon') {
    ctx.fillStyle = '#2f6f7f';
    ctx.font = 'bold 8px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('$', lerp(box.B, box.R, 0.5).x, box.B.y - h * 0.35);
  }
}

function drawAbandoned(ctx: CanvasRenderingContext2D, b: Building, c: Pt, hw: number, hh: number, seed: number, t: number): void {
  const h = buildingHeight(b);
  // Unkraut & Schutt rund ums Haus
  const [T, R, B, L] = diamond(c, hw * 1.15, hh * 1.15);
  poly(ctx, [T, R, B, L], 'rgba(60,55,40,0.45)');
  const box = drawBox(ctx, c, hw, hh, h, ABANDONED.wall, ABANDONED.roof);
  const cols = 2;
  const rows = Math.max(1, Math.round(h / 12));
  // Fenster: eingeschlagen oder mit Brettern vernagelt
  const walls: [Pt, Pt][] = [
    [box.L, box.B],
    [box.B, box.R],
  ];
  walls.forEach(([A, Bp], wi) => {
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const t0 = (col + 0.2) / cols;
        const t1 = (col + 0.8) / cols;
        const y0 = h * (0.12 + (0.8 * (r + 0.15)) / rows);
        const y1 = h * (0.12 + (0.8 * (r + 0.8)) / rows);
        const rnd = hash(seed, r + wi * 10, col);
        const q = [up(lerp(A, Bp, t0), y0), up(lerp(A, Bp, t1), y0), up(lerp(A, Bp, t1), y1), up(lerp(A, Bp, t0), y1)];
        poly(ctx, q, '#101014');
        if (rnd < 0.45) {
          ctx.strokeStyle = '#6a4d2f';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(q[0].x, q[0].y + 1);
          ctx.lineTo(q[2].x, q[2].y - 1);
          ctx.moveTo(q[3].x, q[3].y - 1);
          ctx.lineTo(q[1].x, q[1].y + 1);
          ctx.stroke();
        } else if (rnd < 0.75) {
          ctx.strokeStyle = '#8a8f99';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          const m = lerp(q[0], q[2], 0.5);
          ctx.moveTo(q[0].x, q[0].y);
          ctx.lineTo(m.x, m.y);
          ctx.lineTo(q[1].x, q[2].y);
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(q[3].x, q[3].y);
          ctx.stroke();
        }
      }
    }
  });
  // Loch im Dach
  const rc = up(c, h + hh * 0.1);
  poly(
    ctx,
    [
      { x: rc.x - hw * 0.25, y: rc.y - hh * 0.1 },
      { x: rc.x + hw * 0.1, y: rc.y - hh * 0.35 },
      { x: rc.x + hw * 0.3, y: rc.y + hh * 0.05 },
      { x: rc.x, y: rc.y + hh * 0.3 },
    ],
    '#17161a',
  );
  // Graffiti
  const colors = ['#d23fb0', '#3fd26a', '#f2d33f', '#3fa9f5'];
  for (let i = 0; i < 3; i++) {
    const tt = 0.2 + 0.6 * hash(seed, 100 + i, 1);
    const y = h * (0.08 + 0.3 * hash(seed, 200 + i, 2));
    const p = up(lerp(box.L, box.B, tt), y);
    ctx.save();
    ctx.globalAlpha *= 0.85;
    ctx.strokeStyle = colors[(seed + i) % colors.length];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x - 4, p.y);
    ctx.quadraticCurveTo(p.x - 1, p.y - 5, p.x + 2, p.y - 1);
    ctx.quadraticCurveTo(p.x + 4, p.y + 3, p.x + 6, p.y - 2);
    ctx.stroke();
    ctx.restore();
  }
  // Unkraut
  for (let i = 0; i < 7; i++) {
    const edge = i % 2 === 0 ? lerp(box.L, box.B, hash(seed, 300 + i, 0)) : lerp(box.B, box.R, hash(seed, 300 + i, 0));
    const sz = 3 + hash(seed, 400 + i, 0) * 4;
    ctx.strokeStyle = i % 3 === 0 ? '#6f8f2f' : '#4f7a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(edge.x, edge.y + 1);
    ctx.lineTo(edge.x - sz * 0.4, edge.y - sz);
    ctx.moveTo(edge.x, edge.y + 1);
    ctx.lineTo(edge.x + sz * 0.3, edge.y - sz * 1.1);
    ctx.moveTo(edge.x, edge.y + 1);
    ctx.lineTo(edge.x + sz * 0.1, edge.y - sz * 0.7);
    ctx.stroke();
  }
  // Ein einsamer Vogel dreht Runden
  const bx = c.x + Math.cos(t * 0.8 + seed) * hw * 0.9;
  const by = c.y - hh - h - 14 + Math.sin(t * 1.6 + seed) * 3;
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx - 3, by);
  ctx.lineTo(bx, by - 2);
  ctx.lineTo(bx + 3, by);
  ctx.stroke();
}

function drawPark(ctx: CanvasRenderingContext2D, c: Pt, hw: number, hh: number, seed: number, level: number): void {
  const [T, R, B, L] = diamond(c, hw * 1.2, hh * 1.2);
  poly(ctx, [T, R, B, L], '#5f9a45');
  // Teich
  ctx.fillStyle = '#4d9ad1';
  ctx.beginPath();
  ctx.ellipse(c.x + hw * 0.25, c.y + hh * 0.15, hw * 0.28, hh * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Weg
  ctx.strokeStyle = '#c9b48a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(L.x + 6, L.y);
  ctx.quadraticCurveTo(c.x - 4, c.y + 6, R.x - 6, R.y);
  ctx.stroke();
  const n = 2 + level * 2;
  for (let i = 0; i < n; i++) {
    const p = { x: c.x + (hash(seed, i, 1) - 0.5) * hw * 1.4, y: c.y + (hash(seed, i, 2) - 0.5) * hh * 1.4 };
    drawTree(ctx, p, 8 + hash(seed, i, 3) * 6, seed + i);
  }
  // Bank
  ctx.fillStyle = '#7a4f2a';
  ctx.fillRect(c.x - hw * 0.5, c.y - hh * 0.2, 8, 2);
}

function drawHanf(ctx: CanvasRenderingContext2D, b: Building, c: Pt, hw: number, hh: number, seed: number, t: number): void {
  const tier = hanfTier(b.level);
  const h = buildingHeight(b);
  const [T, R, B, L] = diamond(c, hw * 1.1, hh * 1.1);

  if (tier === 1) {
    // Beet mit Pflanzenreihen und Schuppen
    poly(ctx, [T, R, B, L], '#5a3e26', '#3d2a18', 0.8);
    const rows = 2 + Math.min(2, b.level - 1);
    for (let r = 0; r < rows; r++) {
      for (let i = 0; i < 4; i++) {
        const p = lerp(lerp(L, T, 0.25 + r * 0.2), lerp(B, R, 0.25 + r * 0.2), 0.15 + i * 0.23);
        drawPlant(ctx, { x: p.x, y: p.y + 3 }, 6 + b.level, '#4caf50');
      }
    }
    const shedC = { x: c.x + hw * 0.5, y: c.y - hh * 0.45 };
    drawBox(ctx, shedC, hw * 0.28, hh * 0.28, 10, '#7a5a3a', '#4a3a2a');
    return;
  }

  if (tier === 2) {
    // Gewächshaus: Pflanzen unter Glas
    poly(ctx, [T, R, B, L], '#4e5a3a');
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < 4; i++) {
        const p = lerp(lerp(L, T, 0.3 + r * 0.2), lerp(B, R, 0.3 + r * 0.2), 0.2 + i * 0.2);
        drawPlant(ctx, { x: p.x, y: p.y + 3 }, 7, '#5ccc5a');
      }
    }
    ctx.save();
    ctx.globalAlpha *= 0.55;
    drawBox(ctx, c, hw, hh, h, '#a8e0e8', '#c8f0f5');
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 0.7;
    const [bT, bR, bB, bL] = diamond(c, hw, hh);
    for (let i = 1; i < 4; i++) {
      const a = lerp(bL, bB, i / 4);
      const d = lerp(bB, bR, i / 4);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x, a.y - h);
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x, d.y - h);
      ctx.stroke();
    }
    glowCircle(ctx, up(bT, h + 2), 1.5, '#ff9de2', 6);
    return;
  }

  // Tier 3-5: Indoor-Anlage, Lagerhalle bis Fabrikturm
  const wall = tier === 3 ? '#6d7278' : tier === 4 ? '#4b4f57' : '#2f3340';
  const roof = tier === 3 ? '#3f434a' : tier === 4 ? '#2b2e35' : '#1b1d26';
  const box = drawBox(ctx, c, hw, hh, h, wall, roof);
  const cols = tier === 3 ? 2 : 3;
  const rows = Math.max(1, Math.round(h / 11));
  const purple = tier === 5 ? '#c77dff' : '#b04cff';
  drawWindows(ctx, box.L, box.B, h, cols, rows, '#1a1024', purple, seed, t, 0.85);
  drawWindows(ctx, box.B, box.R, h, cols, rows, '#1a1024', shade(purple, 0.15), seed + 1, t, 0.85);

  // Lüftungsrohre
  const vents = tier === 3 ? 1 : tier === 4 ? 2 : 3;
  for (let i = 0; i < vents; i++) {
    const p = { x: box.T.x + (i - (vents - 1) / 2) * 10, y: box.T.y - h + hh * 0.5 };
    poly(ctx, [p, { x: p.x + 3, y: p.y + 1.5 }, { x: p.x + 3, y: p.y - 6 }, { x: p.x, y: p.y - 7.5 }], '#8a8f99');
    poly(ctx, [{ x: p.x - 3, y: p.y + 1.5 }, p, { x: p.x, y: p.y - 7.5 }, { x: p.x - 3, y: p.y - 6 }], '#6a6f78');
    // Dampf
    ctx.save();
    ctx.globalAlpha *= 0.35;
    ctx.fillStyle = '#ffffff';
    const puff = (t * 0.7 + i * 0.4) % 1;
    ctx.beginPath();
    ctx.arc(p.x + puff * 4, p.y - 9 - puff * 10, 2 + puff * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (tier >= 4) {
    neonEdge(ctx, box, '#9d4edd', t, seed);
    // Rohrleitungen an der Wand
    ctx.strokeStyle = '#9aa0a8';
    ctx.lineWidth = 1.5;
    const a = up(lerp(box.B, box.R, 0.15), 0);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(a.x, a.y - h * 0.9);
    ctx.stroke();
  }
  if (tier === 5) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 2);
    glowCircle(ctx, up(box.T, h + 12), 3 + pulse * 2, '#c77dff', 20);
    drawSign(ctx, up(box.T, h + 12), '✦', '#e0aaff', t, seed, 8);
  }
  const label = tier === 3 ? 'GROW' : tier === 4 ? 'GROW OP' : 'GROW CORP';
  drawSign(ctx, up(box.B, h * 0.5), label, '#b5f56a', t, seed, 6);
}

function drawSmuggler(ctx: CanvasRenderingContext2D, b: Building, c: Pt, hw: number, hh: number, seed: number, t: number): void {
  const st = STYLES.schmugglerlager;
  const h = buildingHeight(b);
  const box = drawBox(ctx, c, hw, hh, h, st.wall, st.roof);
  drawWindows(ctx, box.L, box.B, h, 2, 1, st.win, st.lit, seed, t, 0.6, 0.55, 0.85);
  // Rolltor
  poly(ctx, [box.B, lerp(box.B, box.R, 0.5), up(lerp(box.B, box.R, 0.5), h * 0.5), up(box.B, h * 0.5)], '#3a3d44');
  // Container davor / oben
  const colors = ['#c0392b', '#2e86c1', '#d68910', '#1e8449'];
  const n = Math.min(4, 1 + Math.floor(b.level / 5));
  for (let i = 0; i < n; i++) {
    const cc = { x: box.T.x + (i - (n - 1) / 2) * 12, y: box.T.y - h + hh * 0.7 };
    drawBox(ctx, cc, 7, 3.5, 6, colors[(i + seed) % colors.length], shade(colors[(i + seed) % colors.length], -0.2));
  }
  drawSign(ctx, up(box.T, h + 12), 'LOGISTIK', '#ffb347', t, seed, 6);
}

function drawTownHall(ctx: CanvasRenderingContext2D, b: Building, c: Pt, hw: number, hh: number, seed: number, t: number): void {
  const st = STYLES.rathaus;
  const h = buildingHeight(b);
  const s = footprint(b.type, b.level);
  // Sockel
  const [pT, pR, pB, pL] = diamond(c, hw * 1.08, hh * 1.08);
  poly(ctx, [pT, pR, pB, pL], '#b6a58a');
  const box = drawBox(ctx, c, hw, hh, h, st.wall, st.roof);
  const cols = 2 + s;
  const rows = Math.max(1, Math.round(h / 13));
  drawWindows(ctx, box.L, box.B, h, cols, rows, st.win, st.lit, seed, t, 0.5, 0.2, 0.9);
  drawWindows(ctx, box.B, box.R, h, cols, rows, st.win, st.lit, seed + 3, t, 0.5, 0.2, 0.9);
  // Säulen an der Front
  ctx.fillStyle = shade(st.wall, 0.25);
  for (let i = 0; i <= cols; i++) {
    const p = lerp(box.B, box.R, i / cols);
    ctx.fillRect(p.x - 1, p.y - h * 0.9, 2, h * 0.9);
  }
  // Eingang
  poly(ctx, [lerp(box.B, box.R, 0.42), lerp(box.B, box.R, 0.58), up(lerp(box.B, box.R, 0.58), 12), up(lerp(box.B, box.R, 0.42), 12)], '#3a2c22');
  // Uhrturm
  const towerH = 18 + b.level * 4;
  const tc = { x: c.x, y: c.y - h - hh * 0.15 };
  const tower = drawBox(ctx, tc, hw * 0.22, hh * 0.22, towerH, shade(st.wall, 0.05), '#6b4f3a');
  // Uhr
  const clock = up(lerp(tower.B, tower.R, 0.5), towerH * 0.65);
  ctx.fillStyle = '#f7f2e8';
  ctx.beginPath();
  ctx.arc(clock.x, clock.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(clock.x, clock.y);
  ctx.lineTo(clock.x + Math.cos(t / 10) * 2.5, clock.y + Math.sin(t / 10) * 2.5);
  ctx.moveTo(clock.x, clock.y);
  ctx.lineTo(clock.x, clock.y - 2.5);
  ctx.stroke();
  // Kuppel ab Level 7
  if (b.level >= 7) {
    const dc = up(tower.T, towerH - hh * 0.22);
    ctx.fillStyle = '#2f8f7a';
    ctx.beginPath();
    ctx.ellipse(dc.x, dc.y, hw * 0.24, hh * 0.5, 0, Math.PI, 0);
    ctx.fill();
  }
  // Fahne
  const fx = tower.T.x;
  const fy = tower.T.y - towerH - (b.level >= 7 ? hh * 0.5 : 0);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx, fy - 14);
  ctx.stroke();
  const wave = Math.sin(t * 4) * 1.5;
  poly(ctx, [{ x: fx, y: fy - 14 }, { x: fx + 9, y: fy - 12 + wave }, { x: fx, y: fy - 8 }], '#c0392b');
  // Beleuchtung bei hohen Levels
  if (b.level >= 4) {
    for (let i = 0; i < 3; i++) glowCircle(ctx, up(lerp(box.B, box.R, (i + 0.5) / 3), 3), 1.2, '#ffe9a8', 8);
  }
  drawSign(ctx, up(box.B, h + hh * 0.05 + 6), 'RATHAUS', '#f7ecd2', t, seed, 6 + s);
}

export function drawGhostTile(ctx: CanvasRenderingContext2D, gx: number, gy: number, ok: boolean, s = 1): void {
  const c = areaCenter(gx, gy, s);
  const d = diamond(c, s * (TW / 2), s * (TH / 2));
  poly(ctx, d, ok ? 'rgba(80,220,120,0.35)' : 'rgba(230,70,70,0.4)', ok ? '#5ad17a' : '#ff5c5c', 1.5);
}

export function drawHoverTile(ctx: CanvasRenderingContext2D, gx: number, gy: number): void {
  const c = areaCenter(gx, gy, 1);
  poly(ctx, diamond(c, TW / 2, TH / 2), 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.7)', 1);
}
