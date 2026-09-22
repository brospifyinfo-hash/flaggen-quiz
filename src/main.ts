import './style.css';
import { TOWN_HALL_ID, getDef } from './game/defs';
import { applyOfflineProgress, canPlace, computeReport, demolish, fmtMoney, place, renovate, tick, upgrade } from './game/sim';
import { buildingAt, clearSave, createState, load, save } from './game/state';
import type { Building, GameState } from './game/types';
import { Renderer } from './render/renderer';
import { UI } from './ui/ui';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const renderer = new Renderer(canvas);

let state: GameState = load() ?? createState();
const offline = applyOfflineProgress(state);

let selectedTool: string | null = null;
let selectedBuildingId: number | null = null;

function refreshBuildBar(): void {
  ui.renderBuildBar(state, selectedTool);
}

function selectBuilding(b: Building | null): void {
  selectedBuildingId = b ? b.id : null;
  renderer.selectedId = selectedBuildingId;
  if (b) ui.showPanel(state, b);
  else ui.hidePanel();
}

const ui = new UI({
  onSelectTool(type) {
    selectedTool = type;
    canvas.classList.toggle('placing', !!type);
    if (type) {
      selectBuilding(null);
      ui.setHint(`${getDef(type).icon} ${getDef(type).name}: Tippe auf ein freies Feld zum Bauen. Esc bricht ab.`);
    } else {
      renderer.ghost = null;
      ui.hideHint();
    }
    refreshBuildBar();
  },
  onUpgrade(b) {
    if (upgrade(state, b)) {
      ui.refreshPanel(state);
      refreshBuildBar();
      save(state);
    }
  },
  onDemolish(b) {
    const d = getDef(b.type);
    if (b.status !== 'abandoned' && (b.residents > 0 || b.level > 2) && !confirm(`${d.name} (Level ${b.level}) wirklich abreißen?`)) return;
    if (demolish(state, b)) {
      selectBuilding(null);
      refreshBuildBar();
      save(state);
    }
  },
  onRenovate(b) {
    if (renovate(state, b)) {
      ui.refreshPanel(state);
      refreshBuildBar();
      save(state);
    }
  },
  onClosePanel() {
    selectedBuildingId = null;
    renderer.selectedId = null;
  },
  onReset() {
    clearSave();
    state = createState();
    selectBuilding(null);
    selectedTool = null;
    renderer.ghost = null;
    renderer.centerOnTownHall();
    refreshBuildBar();
    ui.toast('Neue Stadt gegründet. Viel Erfolg – und nicht erwischen lassen.', 'good');
  },
  onSave() {
    save(state);
  },
});

refreshBuildBar();
if (offline > 0) ui.toast(`Willkommen zurück! Deine Stadt hat in deiner Abwesenheit ${fmtMoney(offline)} erwirtschaftet.`, 'good', 7000);

// ---------------- Eingabe ----------------

interface PointerInfo {
  x: number;
  y: number;
  startX: number;
  startY: number;
}
const pointers = new Map<number, PointerInfo>();
let dragging = false;
let pinchDist = 0;

function handleTap(sx: number, sy: number): void {
  if (ui.isModalOpen) return;
  const { gx, gy } = renderer.pick(sx, sy);
  const hit = buildingAt(state, gx, gy);

  if (selectedTool) {
    if (hit) {
      ui.toast('Hier steht schon etwas.', 'warn', 1800);
      return;
    }
    const d = getDef(selectedTool);
    if (!canPlace(state, selectedTool, gx, gy)) {
      if (state.cash < d.cost) ui.toast(`Nicht genug Geld für ${d.name} (${fmtMoney(d.cost)}).`, 'bad', 2500);
      else ui.toast('Hier kannst du nicht bauen.', 'warn', 1800);
      return;
    }
    const b = place(state, selectedTool, gx, gy);
    if (b) {
      refreshBuildBar();
      save(state);
      if (state.cash < d.cost) {
        selectedTool = null;
        canvas.classList.remove('placing');
        renderer.ghost = null;
        ui.hideHint();
        refreshBuildBar();
      }
    }
    return;
  }

  if (!hit) {
    selectBuilding(null);
    return;
  }
  if (hit.type === TOWN_HALL_ID) {
    selectBuilding(null);
    ui.hideHint();
    ui.showTownHall(state, computeReport(state));
    return;
  }
  selectBuilding(hit);
}

function updateGhost(sx: number, sy: number): void {
  const { gx, gy } = renderer.pick(sx, sy);
  renderer.hover = { gx, gy };
  if (selectedTool) renderer.ghost = { type: selectedTool, gx, gy, ok: canPlace(state, selectedTool, gx, gy) };
  else renderer.ghost = null;
}

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
  }
  dragging = false;
});

canvas.addEventListener('pointermove', (e) => {
  const p = pointers.get(e.pointerId);
  if (!p) {
    if (e.pointerType === 'mouse') updateGhost(e.clientX, e.clientY);
    return;
  }
  const dx = e.clientX - p.x;
  const dy = e.clientY - p.y;
  p.x = e.clientX;
  p.y = e.clientY;

  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDist > 0) renderer.zoomAt(dist / pinchDist, (a.x + b.x) / 2, (a.y + b.y) / 2);
    pinchDist = dist;
    dragging = true;
    return;
  }

  if (!dragging && Math.hypot(e.clientX - p.startX, e.clientY - p.startY) > 6) dragging = true;
  if (dragging) {
    renderer.pan(dx, dy);
    renderer.ghost = null;
    renderer.hover = null;
  } else if (e.pointerType === 'mouse') updateGhost(e.clientX, e.clientY);
});

function endPointer(e: PointerEvent): void {
  const p = pointers.get(e.pointerId);
  pointers.delete(e.pointerId);
  if (!p) return;
  if (!dragging && pointers.size === 0) {
    handleTap(e.clientX, e.clientY);
    if (e.pointerType !== 'mouse') {
      renderer.hover = null;
      renderer.ghost = null;
    }
  }
  if (pointers.size === 0) dragging = false;
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', () => {
  if (pointers.size === 0) {
    renderer.hover = null;
    renderer.ghost = null;
  }
});

canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    renderer.zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY);
  },
  { passive: false },
);
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (selectedTool) {
    selectedTool = null;
    canvas.classList.remove('placing');
    renderer.ghost = null;
    ui.hideHint();
    refreshBuildBar();
  }
});

document.getElementById('zoom-in')!.addEventListener('click', () => renderer.zoomAt(1.25, renderer.size.w / 2, renderer.size.h / 2));
document.getElementById('zoom-out')!.addEventListener('click', () => renderer.zoomAt(1 / 1.25, renderer.size.w / 2, renderer.size.h / 2));
document.getElementById('center')!.addEventListener('click', () => renderer.centerOnTownHall());

window.addEventListener('resize', () => renderer.resize());
window.addEventListener('beforeunload', () => save(state));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) save(state);
});

// ---------------- Spielschleife ----------------

let last = performance.now();
let acc = 0;
let uiTimer = 0;
let saveTimer = 0;
let hintTimer = 0;
let panelTimer = 0;

function loop(now: number): void {
  const dt = Math.min(0.5, (now - last) / 1000);
  last = now;
  acc += dt;
  uiTimer += dt;
  saveTimer += dt;
  hintTimer += dt;

  let refreshBar = false;
  while (acc >= 1) {
    acc -= 1;
    const events = tick(state, 1);
    for (const e of events.logs) if (e.kind !== 'info') ui.toast(e.text, e.kind, e.kind === 'bad' ? 7000 : 5000);
    if (events.levelUp) refreshBar = true;
  }
  if (refreshBar) refreshBuildBar();

  if (uiTimer >= 0.25) {
    uiTimer = 0;
    const report = computeReport(state);
    ui.updateHud(state, report);
    ui.updateAffordability(state);
    panelTimer += 0.25;
    if (panelTimer >= 1) {
      panelTimer = 0;
      ui.refreshPanel(state);
      ui.renderTownHall(state, report);
    }
  }
  if (saveTimer >= 10) {
    saveTimer = 0;
    save(state);
  }
  if (hintTimer > 25 && !selectedTool) ui.hideHint();

  renderer.render(state, now / 1000);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
