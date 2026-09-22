import {
  LEVEL_THRESHOLDS,
  MAX_LEVEL,
  TAX_PER_RESIDENT,
  TOWN_HALL_ID,
  baseIncome,
  cityLevelForPopulation,
  getDef,
  isCriminal,
  isResidential,
  upgradeCost,
} from './defs';
import { addLog, canPlace, newBuilding, townHall } from './state';
import type { Building, CityReport, GameState } from './types';

export { canPlace };

const COMPLAIN_AFTER = 25;
const MOVE_OUT_AFTER = 80;
const UNHAPPY_BELOW = 35;
const RECOVER_ABOVE = 45;

const COMPLAINT_TEXT: Record<string, string> = {
  hanfplantage: 'den Gestank der Hanfplantage',
  stripclub: 'den Lärm aus dem Stripclub',
  bordell: 'das Rotlicht im Puff nebenan',
  casino: 'die Spieler und Limousinen vor dem Casino',
  spielhalle: 'die Spielhalle mit ihren Dauergästen',
  hehlerei: 'zwielichtige Gestalten vor der Hehlerei',
  wettbuero: 'die Schlägereien am Wettbüro',
  schwarzmarkt: 'den Schwarzmarkt um die Ecke',
  schmugglerlager: 'den nächtlichen LKW-Verkehr zum Schmugglerlager',
  werkstatt: 'den Lärm der Autowerkstatt',
};

export interface HappinessBreakdown {
  total: number;
  base: number;
  neighborhood: number;
  jobs: number;
  heat: number;
  ruins: number;
  worstSource: string | null;
  worstType: 'building' | 'heat' | 'ruin' | 'jobs' | null;
}

function dist(a: Building, b: Building, sizeB: number): number {
  // Chebyshev-Abstand vom Haus zur nächsten Kachel des anderen Gebäudes
  const bx = Math.min(Math.max(a.x, b.x), b.x + sizeB - 1);
  const by = Math.min(Math.max(a.y, b.y), b.y + sizeB - 1);
  return Math.max(Math.abs(a.x - bx), Math.abs(a.y - by));
}

export function computeHeat(state: GameState): number {
  let heat = 0;
  for (const b of state.buildings) {
    const d = getDef(b.type);
    if (d.crime) heat += d.crime * b.level;
    if (d.policing) heat -= d.policing * b.level;
  }
  return Math.max(0, heat);
}

export function laundryBonus(state: GameState): number {
  let bonus = 0;
  for (const b of state.buildings) {
    const d = getDef(b.type);
    if (d.launder) bonus += d.launder * b.level;
  }
  return Math.min(0.6, bonus);
}

export function population(state: GameState): number {
  return state.buildings.reduce((s, b) => s + b.residents, 0);
}

export function totalJobs(state: GameState): number {
  return state.buildings.reduce((s, b) => s + getDef(b.type).jobs * b.level, 0);
}

export function houseCapacity(b: Building): number {
  return getDef(b.type).capacity * b.level;
}

export function happinessFor(state: GameState, house: Building, heat: number, jobs: number, pop: number): HappinessBreakdown {
  const base = 55;
  let neighborhood = 0;
  let ruins = 0;
  let worst = 0;
  let worstSource: string | null = null;
  let worstType: HappinessBreakdown['worstType'] = null;

  let police = 0;
  for (const other of state.buildings) {
    if (other === house || other.type !== 'polizei') continue;
    if (dist(house, other, 1) <= 3) police++;
  }
  const protection = police === 0 ? 1 : police === 1 ? 0.5 : 0.35;

  for (const other of state.buildings) {
    if (other === house) continue;
    const d = getDef(other.type);
    if (isResidential(d)) {
      if (other.status === 'abandoned' && dist(house, other, 1) <= 2) {
        ruins -= 5;
        if (-5 < worst) {
          worst = -5;
          worstSource = 'die verlassene Ruine nebenan';
          worstType = 'ruin';
        }
      }
      continue;
    }
    if (!d.happiness) continue;
    const size = other.type === TOWN_HALL_ID ? 4 : 1;
    if (dist(house, other, size) > d.radius) continue;
    let effect = d.happiness * Math.min(3, 1 + (other.level - 1) * (isCriminal(d) ? 0.15 : 0.1));
    if (effect < 0 && isCriminal(d)) effect *= protection;
    neighborhood += effect;
    if (effect < worst) {
      worst = effect;
      worstSource = COMPLAINT_TEXT[other.type] ?? `${d.name} in der Nachbarschaft`;
      worstType = 'building';
    }
  }
  neighborhood = Math.max(-45, Math.min(30, neighborhood));

  const jobRatio = pop > 0 ? jobs / pop : 1;
  const jobBonus = Math.round(15 * Math.min(1, jobRatio));
  if (jobRatio < 0.35 && pop > 20 && -12 < worst) {
    worst = -12;
    worstSource = 'fehlende Arbeitsplätze in der Stadt';
    worstType = 'jobs';
  }

  const heatPenalty = -Math.min(25, heat * 0.25);
  if (heatPenalty < worst && heatPenalty <= -10) {
    worst = heatPenalty;
    worstSource = 'die ausufernde Kriminalität in der Stadt';
    worstType = 'heat';
  }

  const total = Math.max(0, Math.min(100, Math.round(base + neighborhood + jobBonus + heatPenalty + ruins)));
  return { total, base, neighborhood, jobs: jobBonus, heat: heatPenalty, ruins, worstSource, worstType };
}

export function buildingIncome(state: GameState, b: Building, pop: number, laundry: number): number {
  const d = getDef(b.type);
  if (b.type === TOWN_HALL_ID) return 0;
  if (isResidential(d)) return b.status === 'abandoned' ? 0 : b.residents * TAX_PER_RESIDENT;
  const inc = baseIncome(d, b.level);
  if (inc <= 0) return inc;
  if (isCriminal(d)) {
    if (b.raidedUntil > state.time) return 0;
    return inc * (1 + laundry);
  }
  const demand = Math.min(1, 0.4 + pop / 150);
  return inc * demand;
}

export function computeReport(state: GameState): CityReport {
  const pop = population(state);
  const jobs = totalJobs(state);
  const heat = computeHeat(state);
  const laundry = laundryBonus(state);
  const counts: CityReport['counts'] = { wohnen: 0, gewerbe: 0, rotlicht: 0, oeffentlich: 0 };
  let incomeLegal = 0;
  let incomeCrime = 0;
  let incomeTax = 0;
  let upkeep = 0;
  let capacity = 0;
  let happySum = 0;
  let happyN = 0;
  let abandoned = 0;
  let complaining = 0;

  for (const b of state.buildings) {
    const d = getDef(b.type);
    if (b.type !== TOWN_HALL_ID) counts[d.category]++;
    const inc = buildingIncome(state, b, pop, laundry);
    if (isResidential(d)) {
      incomeTax += inc;
      if (b.status === 'abandoned') abandoned++;
      else {
        capacity += houseCapacity(b);
        if (b.residents > 0) {
          happySum += b.happiness;
          happyN++;
        }
        if (b.status === 'complaining') complaining++;
      }
    } else if (inc < 0) upkeep += inc;
    else if (isCriminal(d)) incomeCrime += inc;
    else incomeLegal += inc;
  }

  const chancePerSec = heat > 10 ? (heat - 10) / 15000 : 0;
  const nextIdx = state.cityLevel;
  return {
    population: pop,
    capacity,
    jobs,
    avgHappiness: happyN ? Math.round(happySum / happyN) : 60,
    heat,
    raidChancePerMin: chancePerSec * 60 * 100,
    incomeLegal,
    incomeCrime,
    incomeTax,
    upkeep,
    incomeTotal: incomeLegal + incomeCrime + incomeTax + upkeep,
    laundryBonus: laundry,
    counts,
    abandoned,
    complaining,
    nextLevelPop: nextIdx < MAX_LEVEL ? LEVEL_THRESHOLDS[nextIdx] : null,
  };
}

export interface TickEvents {
  logs: ReturnType<typeof addLog>[];
  levelUp: boolean;
}

export function tick(state: GameState, dt: number): TickEvents {
  const events: TickEvents = { logs: [], levelUp: false };
  state.time += dt;

  const pop = population(state);
  const jobs = totalJobs(state);
  const heat = computeHeat(state);
  const laundry = laundryBonus(state);

  let income = 0;
  for (const b of state.buildings) income += buildingIncome(state, b, pop, laundry);
  state.cash += income * dt;
  if (income > 0) state.stats.totalEarned += income * dt;

  for (const b of state.buildings) {
    const d = getDef(b.type);
    if (!isResidential(d) || b.status === 'abandoned') continue;

    const hb = happinessFor(state, b, heat, jobs, pop);
    b.happiness = hb.total;
    const cap = houseCapacity(b);

    if (b.happiness < UNHAPPY_BELOW) {
      b.unhappyFor += dt;
      if (b.status === 'ok' && b.unhappyFor >= COMPLAIN_AFTER) {
        b.status = 'complaining';
        b.complaint = hb.worstSource ?? 'die Zustände in der Stadt';
        events.logs.push(addLog(state, `Bewohner im ${d.name} (${b.x}|${b.y}) beschweren sich über ${b.complaint}.`, 'warn'));
      }
      if (b.status === 'complaining') {
        b.moveInProgress -= 0.25 * dt;
        if (b.moveInProgress <= -1 && b.residents > 0) {
          b.residents--;
          b.moveInProgress = 0;
          state.stats.movedOut++;
        }
        if (b.unhappyFor >= MOVE_OUT_AFTER) {
          state.stats.movedOut += b.residents;
          b.residents = 0;
          b.status = 'abandoned';
          b.moveInProgress = 0;
          events.logs.push(addLog(state, `Die Bewohner des ${d.name} (${b.x}|${b.y}) sind ausgezogen. Das Haus steht jetzt leer und verfällt.`, 'bad'));
        }
      }
    } else {
      if (b.happiness >= RECOVER_ABOVE) {
        b.unhappyFor = Math.max(0, b.unhappyFor - 2 * dt);
        if (b.status === 'complaining' && b.unhappyFor === 0) {
          b.status = 'ok';
          b.complaint = '';
          events.logs.push(addLog(state, `Die Bewohner im ${d.name} (${b.x}|${b.y}) haben sich beruhigt.`, 'good'));
        }
        if (b.residents < cap) {
          b.moveInProgress += ((b.happiness - 35) / 40) * (0.6 + 0.4 * b.level) * dt;
          while (b.moveInProgress >= 1 && b.residents < cap) {
            b.moveInProgress -= 1;
            b.residents++;
          }
        } else b.moveInProgress = 0;
      }
    }
  }

  // Razzia
  const chance = heat > 10 ? ((heat - 10) / 15000) * dt : 0;
  if (chance > 0 && Math.random() < chance) {
    const targets = state.buildings.filter((b) => isCriminal(getDef(b.type)) && b.raidedUntil <= state.time);
    if (targets.length) {
      const t = targets[Math.floor(Math.random() * targets.length)];
      const d = getDef(t.type);
      const fine = Math.min(state.cash * 0.5, Math.round(baseIncome(d, t.level) * (1 + laundry) * 90));
      state.cash -= Math.max(0, fine);
      state.stats.finesPaid += Math.max(0, fine);
      state.stats.raids++;
      t.raidedUntil = state.time + 60;
      events.logs.push(addLog(state, `RAZZIA! Die Polizei hat ${d.name} (${t.x}|${t.y}) hochgenommen. Strafe: ${Math.round(fine).toLocaleString('de-DE')} €. 60 Sekunden geschlossen.`, 'bad'));
    }
  }

  // Stadtlevel
  const newPop = population(state);
  const lvl = cityLevelForPopulation(newPop);
  if (lvl > state.cityLevel) {
    state.cityLevel = lvl;
    townHall(state).level = lvl;
    events.levelUp = true;
    events.logs.push(addLog(state, `Stadtlevel ${lvl} erreicht! Das Rathaus wird ausgebaut und neue Gebäude sind freigeschaltet.`, 'good'));
  }

  return events;
}

export function applyOfflineProgress(state: GameState): number {
  const elapsed = Math.min(4 * 3600, Math.max(0, (Date.now() - state.savedAt) / 1000));
  if (elapsed < 30) return 0;
  const report = computeReport(state);
  const earned = Math.max(0, report.incomeTotal) * elapsed * 0.5;
  state.cash += earned;
  state.stats.totalEarned += earned;
  if (earned > 0) addLog(state, `Während deiner Abwesenheit (${Math.round(elapsed / 60)} Min) hat die Stadt ${fmtMoney(earned)} eingebracht.`, 'good');
  return earned;
}

// ---------------- Spieleraktionen ----------------

export function place(state: GameState, type: string, x: number, y: number): Building | null {
  if (!canPlace(state, type, x, y)) return null;
  const d = getDef(type);
  state.cash -= d.cost;
  const b = newBuilding(state, type, x, y);
  state.buildings.push(b);
  if (isCriminal(d) && state.buildings.filter((o) => isCriminal(getDef(o.type))).length === 1) {
    addLog(state, `Dein erster krimineller Betrieb: ${d.name}. Die Kriminalitäts-Hitze steigt ab jetzt – Polizeiwachen und Geldwäsche halten sie im Griff.`, 'warn');
  }
  return b;
}

export function canUpgrade(state: GameState, b: Building): boolean {
  const d = getDef(b.type);
  if (b.type === TOWN_HALL_ID) return false;
  if (b.level >= d.maxLevel) return false;
  if (b.status === 'abandoned') return false;
  return state.cash >= upgradeCost(d, b.level);
}

export function upgrade(state: GameState, b: Building): boolean {
  if (!canUpgrade(state, b)) return false;
  const d = getDef(b.type);
  state.cash -= upgradeCost(d, b.level);
  b.level++;
  return true;
}

export function demolishCost(b: Building): number {
  const d = getDef(b.type);
  if (b.status === 'abandoned') return Math.round(d.cost * 0.15);
  return 0;
}

export function demolishRefund(b: Building): number {
  const d = getDef(b.type);
  if (b.status === 'abandoned') return 0;
  return Math.round(d.cost * 0.3);
}

export function demolish(state: GameState, b: Building): boolean {
  if (b.type === TOWN_HALL_ID) return false;
  const cost = demolishCost(b);
  if (state.cash < cost) return false;
  state.cash -= cost;
  state.cash += demolishRefund(b);
  if (b.residents > 0) state.stats.movedOut += b.residents;
  state.buildings = state.buildings.filter((o) => o !== b);
  state.stats.demolished++;
  const d = getDef(b.type);
  addLog(state, b.status === 'abandoned' ? `Die Ruine des ${d.name} (${b.x}|${b.y}) wurde abgerissen.` : `${d.name} (${b.x}|${b.y}) abgerissen.`, 'info');
  return true;
}

export function renovateCost(b: Building): number {
  return Math.round(getDef(b.type).cost * 0.5);
}

export function renovate(state: GameState, b: Building): boolean {
  if (b.status !== 'abandoned') return false;
  const cost = renovateCost(b);
  if (state.cash < cost) return false;
  state.cash -= cost;
  b.status = 'ok';
  b.unhappyFor = 0;
  b.complaint = '';
  b.moveInProgress = 0;
  addLog(state, `${getDef(b.type).name} (${b.x}|${b.y}) wurde saniert. Neue Bewohner können einziehen – wenn die Nachbarschaft passt.`, 'good');
  return true;
}

export function fmtMoney(n: number): string {
  const abs = Math.abs(n);
  let s: string;
  if (abs >= 1e9) s = (n / 1e9).toFixed(2).replace('.', ',') + ' Mrd.';
  else if (abs >= 1e6) s = (n / 1e6).toFixed(2).replace('.', ',') + ' Mio.';
  else if (abs >= 1e4) s = Math.round(n).toLocaleString('de-DE');
  else s = (Math.round(n * 10) / 10).toLocaleString('de-DE', { maximumFractionDigits: 1 });
  return s + ' €';
}
