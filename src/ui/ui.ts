import { CATEGORY_LABELS, DEFS, LEVEL_THRESHOLDS, MAX_LEVEL, TAX_PER_RESIDENT, TOWN_HALL_ID, baseIncome, footprint, getDef, hanfTier, isCriminal, isResidential, upgradeCost } from '../game/defs';
import {
  buildingIncome,
  canUpgrade,
  computeHeat,
  demolishCost,
  demolishRefund,
  fmtMoney,
  happinessFor,
  houseCapacity,
  laundryBonus,
  population,
  renovateCost,
  totalJobs,
} from '../game/sim';
import type { Building, Category, CityReport, GameState, LogKind } from '../game/types';

export interface UICallbacks {
  onSelectTool(type: string | null): void;
  onUpgrade(b: Building): void;
  onDemolish(b: Building): void;
  onRenovate(b: Building): void;
  onClosePanel(): void;
  onReset(): void;
  onSave(): void;
}

const CATEGORIES: Category[] = ['wohnen', 'gewerbe', 'rotlicht', 'oeffentlich'];

const HANF_TIERS = ['Beet hinterm Schuppen', 'Gewächshaus', 'Indoor-Anlage', 'Grow-Fabrik', 'GROW CORP Tower'];
const HANF_TIER_START = [1, 5, 15, 30, 60];

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function fmtRate(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${fmtMoney(Math.abs(n))}/s`;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export class UI {
  private cb: UICallbacks;
  private category: Category = 'wohnen';
  private panelBuildingId: number | null = null;
  private modalOpen = false;
  private hintShown = true;

  private $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

  constructor(cb: UICallbacks) {
    this.cb = cb;
    this.$('modal-backdrop').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.hideModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.modalOpen) this.hideModal();
        else {
          this.cb.onSelectTool(null);
          this.hidePanel();
          this.cb.onClosePanel();
        }
      }
    });
  }

  get isModalOpen(): boolean {
    return this.modalOpen;
  }

  get openPanelBuildingId(): number | null {
    return this.panelBuildingId;
  }

  // ---------------- HUD ----------------

  updateHud(state: GameState, report: CityReport): void {
    this.$('hud-cash').textContent = fmtMoney(state.cash);
    const inc = this.$('hud-income');
    inc.textContent = fmtRate(report.incomeTotal);
    inc.classList.toggle('negative', report.incomeTotal < 0);
  }

  hideHint(): void {
    if (!this.hintShown) return;
    this.hintShown = false;
    this.$('hud-hint').classList.add('hidden');
  }

  setHint(text: string): void {
    const el = this.$('hud-hint');
    el.textContent = text;
    el.classList.remove('hidden');
    this.hintShown = true;
  }

  // ---------------- Toasts ----------------

  toast(text: string, kind: LogKind = 'info', ms = 4500): void {
    const wrap = this.$('toasts');
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.textContent = text;
    wrap.appendChild(el);
    while (wrap.children.length > 4) wrap.removeChild(wrap.firstChild!);
    setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 300);
    }, ms);
  }

  // ---------------- Build bar ----------------

  renderBuildBar(state: GameState, selectedTool: string | null): void {
    const tabs = this.$('build-tabs');
    tabs.innerHTML = '';
    for (const cat of CATEGORIES) {
      const btn = document.createElement('button');
      btn.className = `tab ${cat}${cat === this.category ? ' active' : ''}`;
      btn.textContent = CATEGORY_LABELS[cat];
      btn.addEventListener('click', () => {
        this.category = cat;
        this.renderBuildBar(state, selectedTool);
      });
      tabs.appendChild(btn);
    }

    const items = this.$('build-items');
    items.innerHTML = '';
    for (const d of DEFS) {
      if (d.category !== this.category || d.id === TOWN_HALL_ID) continue;
      const locked = d.unlockLevel > state.cityLevel;
      const unaffordable = !locked && state.cash < d.cost;
      const btn = document.createElement('button');
      btn.className = `item${selectedTool === d.id ? ' selected' : ''}${locked ? ' locked' : ''}${unaffordable ? ' unaffordable' : ''}`;
      btn.title = d.desc;
      btn.innerHTML = `<span class="icon">${d.icon}</span><span class="name">${esc(d.name)}</span><span class="cost">${
        locked ? `Ab Stadtlevel ${d.unlockLevel}` : fmtMoney(d.cost)
      }</span>${isCriminal(d) ? '<span class="tag">18+</span>' : ''}`;
      btn.disabled = locked;
      btn.dataset.type = d.id;
      btn.addEventListener('click', () => {
        if (locked) return;
        this.cb.onSelectTool(selectedTool === d.id ? null : d.id);
      });
      items.appendChild(btn);
    }
  }

  /** Aktualisiert nur die Bezahlbarkeit, ohne die Leiste neu aufzubauen (Scrollposition bleibt) */
  updateAffordability(state: GameState): void {
    this.$('build-items')
      .querySelectorAll<HTMLButtonElement>('.item:not(.locked)')
      .forEach((btn) => {
        const d = getDef(btn.dataset.type!);
        btn.classList.toggle('unaffordable', state.cash < d.cost);
      });
  }

  // ---------------- Gebäude-Panel ----------------

  showPanel(state: GameState, b: Building): void {
    this.panelBuildingId = b.id;
    this.refreshPanel(state);
    this.$('panel').hidden = false;
  }

  hidePanel(): void {
    this.panelBuildingId = null;
    this.$('panel').hidden = true;
  }

  refreshPanel(state: GameState): void {
    if (this.panelBuildingId === null) return;
    const b = state.buildings.find((x) => x.id === this.panelBuildingId);
    if (!b) {
      this.hidePanel();
      return;
    }
    const d = getDef(b.type);
    const pop = population(state);
    const jobs = totalJobs(state);
    const heat = computeHeat(state);
    const laundry = laundryBonus(state);
    const income = buildingIncome(state, b, pop, laundry);
    const panel = this.$('panel');

    let body = '';

    if (isResidential(d)) {
      const cap = houseCapacity(b);
      const hb = happinessFor(state, b, heat, jobs, pop);
      const hClass = b.happiness >= 60 ? 'good' : b.happiness >= 35 ? 'warn' : 'bad';
      body += `<div class="rows">
        <span class="k">Bewohner</span><span class="v">${b.status === 'abandoned' ? '–' : `${b.residents} / ${cap}`}</span>
        <span class="k">Steuern</span><span class="v good">${fmtRate(income)}</span>
        <span class="k">Zufriedenheit</span><span class="v ${hClass}">${b.status === 'abandoned' ? '–' : `${b.happiness} %`}</span>
        <div class="bar"><span style="width:${b.status === 'abandoned' ? 0 : b.happiness}%"></span></div>
        <span class="k">Nachbarschaft</span><span class="v ${hb.neighborhood < 0 ? 'bad' : 'good'}">${hb.neighborhood >= 0 ? '+' : ''}${Math.round(hb.neighborhood)}</span>
        <span class="k">Arbeitsplätze</span><span class="v good">+${hb.jobs}</span>
        <span class="k">Kriminalität</span><span class="v ${hb.heat < 0 ? 'bad' : ''}">${Math.round(hb.heat)}</span>
        <span class="k">Ruinen nebenan</span><span class="v ${hb.ruins < 0 ? 'bad' : ''}">${hb.ruins}</span>
      </div>`;

      if (b.status === 'abandoned') {
        body += `<div class="status bad"><strong>Lost Place.</strong> Die Bewohner sind ausgezogen. Fenster eingeschlagen, Graffiti an den Wänden, Unkraut wächst durchs Dach. Die Ruine drückt die Stimmung der Nachbarn. Du kannst sie abreißen oder sanieren.</div>`;
      } else if (b.status === 'complaining') {
        const left = Math.max(0, Math.ceil(80 - b.unhappyFor));
        body += `<div class="status warn"><strong>Beschwerde!</strong> Die Bewohner beschweren sich über ${esc(b.complaint)}. Wenn sich nichts ändert, ziehen sie in etwa <strong>${left} s</strong> aus und das Haus verfällt.</div>`;
      } else if (b.happiness < 35) {
        body += `<div class="status warn">Die Stimmung kippt. Bleibt die Zufriedenheit unter 35 %, beschweren sich die Bewohner bald${hb.worstSource ? ` – vor allem über ${esc(hb.worstSource)}` : ''}.</div>`;
      } else if (b.residents < cap) {
        body += `<div class="status good">Neue Bewohner ziehen ein. Je zufriedener die Nachbarschaft, desto schneller füllt sich das Haus.</div>`;
      } else {
        body += `<div class="status good">Voll belegt und zufrieden. Baue aus, um mehr Bewohner unterzubringen.</div>`;
      }
    } else if (b.type === TOWN_HALL_ID) {
      body += `<p class="desc">Tippe erneut auf das Rathaus, um die Stadt-Statistiken zu öffnen.</p>`;
    } else {
      const nextIncome = b.level < d.maxLevel ? baseIncome(d, b.level + 1) : null;
      body += `<div class="rows">
        <span class="k">${income < 0 ? 'Unterhalt' : 'Einkommen'}</span><span class="v ${income < 0 ? 'bad' : isCriminal(d) ? 'crime' : 'good'}">${fmtRate(income)}</span>`;
      if (nextIncome !== null && d.income > 0) {
        body += `<span class="k">Nach Ausbau</span><span class="v">${fmtRate(nextIncome * (isCriminal(d) ? 1 + laundry : Math.min(1, 0.4 + pop / 150)))}</span>`;
      }
      if (d.jobs) body += `<span class="k">Arbeitsplätze</span><span class="v">${d.jobs * b.level}</span>`;
      if (d.happiness) body += `<span class="k">Umfeld (Radius ${d.radius})</span><span class="v ${d.happiness < 0 ? 'bad' : 'good'}">${d.happiness > 0 ? '+' : ''}${Math.round(d.happiness * Math.min(3, 1 + (b.level - 1) * (isCriminal(d) ? 0.15 : 0.1)))} Zufriedenheit</span>`;
      if (d.crime) body += `<span class="k">Kriminalitäts-Hitze</span><span class="v crime">+${d.crime * b.level}</span>`;
      if (d.policing) body += `<span class="k">Hitze-Reduktion</span><span class="v good">−${d.policing * b.level}</span>`;
      if (d.launder) body += `<span class="k">Geldwäsche-Bonus</span><span class="v good">+${Math.round(d.launder * b.level * 100)} % auf kriminelles Einkommen</span>`;
      if (!isCriminal(d) && d.income > 0) body += `<span class="k">Nachfrage</span><span class="v">${Math.round(Math.min(1, 0.4 + pop / 150) * 100)} %</span>`;
      body += `</div>`;

      if (b.type === 'hanfplantage') {
        const tier = hanfTier(b.level);
        const next = tier < 5 ? HANF_TIER_START[tier] : null;
        body += `<div class="status good"><strong>Ausbaustufe ${tier}/5: ${HANF_TIERS[tier - 1]}.</strong> ${
          next ? `Ab Level ${next} wird daraus: ${HANF_TIERS[tier]}.` : 'Maximale Ausbaustufe – ein Turm aus Grow-Lampen.'
        } Weiter ausbaubar bis Level ${d.maxLevel}.</div>`;
      }
      if (isCriminal(d) && b.raidedUntil > state.time) {
        body += `<div class="status bad"><strong>Razzia!</strong> Der Betrieb ist noch ${Math.ceil(b.raidedUntil - state.time)} s geschlossen und bringt kein Geld.</div>`;
      } else if (!isCriminal(d) && d.income > 0 && pop < 90) {
        body += `<div class="status">Legale Betriebe brauchen Kundschaft: Mit mehr Bewohnern steigt die Nachfrage bis auf 100 %.</div>`;
      }
    }

    // Aktionen
    let actions = '';
    if (b.type !== TOWN_HALL_ID) {
      if (b.status === 'abandoned') {
        actions += `<button class="primary" data-act="renovate" ${state.cash < renovateCost(b) ? 'disabled' : ''}><span>Sanieren</span><small>${fmtMoney(renovateCost(b))}</small></button>`;
        actions += `<button class="danger" data-act="demolish" ${state.cash < demolishCost(b) ? 'disabled' : ''}><span>Ruine abreißen</span><small>${fmtMoney(demolishCost(b))}</small></button>`;
      } else {
        if (b.level < d.maxLevel) {
          const cost = upgradeCost(d, b.level);
          actions += `<button class="primary" data-act="upgrade" ${canUpgrade(state, b) ? '' : 'disabled'}><span>Ausbauen auf Level ${b.level + 1}</span><small>${fmtMoney(cost)}</small></button>`;
        } else {
          actions += `<button disabled><span>Maximales Level erreicht</span></button>`;
        }
        actions += `<button class="danger" data-act="demolish"><span>Abreißen</span><small>+${fmtMoney(demolishRefund(b))} Rückerstattung</small></button>`;
      }
    }

    panel.innerHTML = `
      <div class="head">
        <div>
          <h2>${d.icon} ${esc(d.name)}</h2>
          <p class="sub">Level ${b.level}${d.maxLevel > 1 && b.type !== TOWN_HALL_ID ? ` / ${d.maxLevel}` : ''} · Feld ${b.x}|${b.y}</p>
        </div>
        <button class="close" data-act="close" aria-label="Schließen">✕</button>
      </div>
      <p class="desc">${esc(d.desc)}</p>
      ${body}
      <div class="actions">${actions}</div>`;

    panel.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'close') {
          this.hidePanel();
          this.cb.onClosePanel();
        } else if (act === 'upgrade') this.cb.onUpgrade(b);
        else if (act === 'demolish') this.cb.onDemolish(b);
        else if (act === 'renovate') this.cb.onRenovate(b);
      });
    });
  }

  // ---------------- Rathaus-Modal ----------------

  showTownHall(state: GameState, report: CityReport): void {
    this.modalOpen = true;
    this.renderTownHall(state, report);
    this.$('modal-backdrop').hidden = false;
  }

  hideModal(): void {
    this.modalOpen = false;
    this.$('modal-backdrop').hidden = true;
  }

  renderTownHall(state: GameState, report: CityReport): void {
    if (!this.modalOpen) return;
    const lvl = state.cityLevel;
    const prevPop = LEVEL_THRESHOLDS[lvl - 1];
    const nextPop = report.nextLevelPop;
    const progress = nextPop === null ? 100 : Math.min(100, Math.round(((report.population - prevPop) / (nextPop - prevPop)) * 100));
    const size = footprint(TOWN_HALL_ID, lvl);
    const nextSize = lvl >= 7 ? null : lvl >= 4 ? 7 : 4;
    const unlocksNext = DEFS.filter((d) => d.unlockLevel === lvl + 1).map((d) => `${d.icon} ${d.name}`);

    const heatClass = report.heat > 60 ? 'bad' : report.heat > 25 ? 'warn' : 'good';
    const happyClass = report.avgHappiness >= 60 ? 'good' : report.avgHappiness >= 35 ? 'warn' : 'bad';

    const modal = this.$('modal');
    const modalScroll = modal.scrollTop;
    const logScroll = modal.querySelector('.log')?.scrollTop ?? 0;
    modal.innerHTML = `
      <div class="head">
        <div>
          <h2 id="modal-title">🏛️ Rathaus <span class="pill">Stadtlevel ${lvl}</span></h2>
          <p class="sub">${
            nextPop === null
              ? 'Maximales Stadtlevel erreicht.'
              : `${report.population} / ${nextPop} Bewohner bis Level ${lvl + 1}`
          } · Spielzeit ${fmtTime(state.time)}</p>
        </div>
        <button class="close" data-act="close" aria-label="Schließen">✕</button>
      </div>
      <div class="bar level"><span style="width:${progress}%"></span></div>

      <div class="grid">
        <div class="card">
          <h3>Kasse</h3>
          <div class="big">${fmtMoney(state.cash)}</div>
          <div class="rows">
            <span class="k">Gesamt</span><span class="v ${report.incomeTotal >= 0 ? 'good' : 'bad'}">${fmtRate(report.incomeTotal)}</span>
            <span class="k">Steuern</span><span class="v">${fmtRate(report.incomeTax)}</span>
            <span class="k">Legales Gewerbe</span><span class="v">${fmtRate(report.incomeLegal)}</span>
            <span class="k">Kriminelle Betriebe</span><span class="v crime">${fmtRate(report.incomeCrime)}</span>
            <span class="k">Unterhalt</span><span class="v ${report.upkeep < 0 ? 'bad' : ''}">${fmtRate(report.upkeep)}</span>
          </div>
        </div>
        <div class="card">
          <h3>Bevölkerung</h3>
          <div class="big">${report.population}</div>
          <div class="rows">
            <span class="k">Wohnraum</span><span class="v">${report.population} / ${report.capacity}</span>
            <span class="k">Arbeitsplätze</span><span class="v">${report.jobs}</span>
            <span class="k">Ø Zufriedenheit</span><span class="v ${happyClass}">${report.avgHappiness} %</span>
            <span class="k">Beschwerden</span><span class="v ${report.complaining ? 'warn' : ''}">${report.complaining}</span>
            <span class="k">Leerstehende Ruinen</span><span class="v ${report.abandoned ? 'bad' : ''}">${report.abandoned}</span>
            <span class="k">Ausgezogen (gesamt)</span><span class="v">${state.stats.movedOut}</span>
          </div>
        </div>
        <div class="card">
          <h3>Kriminalität</h3>
          <div class="big ${heatClass === 'good' ? '' : heatClass}">${Math.round(report.heat)} Hitze</div>
          <div class="rows">
            <span class="k">Razzia-Risiko</span><span class="v ${heatClass}">${report.raidChancePerMin.toFixed(1)} % / min</span>
            <span class="k">Geldwäsche-Bonus</span><span class="v good">+${Math.round(report.laundryBonus * 100)} %</span>
            <span class="k">Razzien bisher</span><span class="v">${state.stats.raids}</span>
            <span class="k">Strafen gezahlt</span><span class="v">${fmtMoney(state.stats.finesPaid)}</span>
          </div>
        </div>
        <div class="card">
          <h3>Gebäude</h3>
          <div class="big">${state.buildings.length - 1}</div>
          <div class="rows">
            <span class="k">Wohnen</span><span class="v">${report.counts.wohnen}</span>
            <span class="k">Gewerbe</span><span class="v">${report.counts.gewerbe}</span>
            <span class="k">Rotlicht & Kriminell</span><span class="v crime">${report.counts.rotlicht}</span>
            <span class="k">Öffentlich</span><span class="v">${report.counts.oeffentlich}</span>
            <span class="k">Abgerissen</span><span class="v">${state.stats.demolished}</span>
          </div>
        </div>
        <div class="card">
          <h3>Rathaus-Ausbau</h3>
          <div class="big">${size} × ${size} Felder</div>
          <div class="rows">
            <span class="k">Gesamt verdient</span><span class="v">${fmtMoney(state.stats.totalEarned)}</span>
            <span class="k">Nächster Anbau</span><span class="v">${nextSize ? `Level ${nextSize}` : 'Vollausbau'}</span>
            <span class="k">Steuersatz</span><span class="v">${fmtMoney(TAX_PER_RESIDENT)} / Bewohner / s</span>
          </div>
        </div>
        <div class="card">
          <h3>Nächste Freischaltung</h3>
          <div class="rows" style="margin-top:0">
            ${
              unlocksNext.length
                ? unlocksNext.map((u) => `<span class="k" style="grid-column:1/-1;color:var(--text)">${esc(u)}</span>`).join('')
                : `<span class="k" style="grid-column:1/-1">${lvl >= MAX_LEVEL ? 'Alles freigeschaltet.' : 'Keine neuen Gebäude auf dem nächsten Level.'}</span>`
            }
          </div>
        </div>
      </div>

      <h3 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:16px 0 8px">Ereignisse</h3>
      <ul class="log">
        ${state.log.map((e) => `<li class="${e.kind}"><time>${fmtTime(e.t)}</time>${esc(e.text)}</li>`).join('')}
      </ul>

      <div class="modal-actions">
        <button data-act="reset" class="danger">Neue Stadt gründen</button>
        <button data-act="save">Speichern</button>
        <button data-act="close" class="primary">Schließen</button>
      </div>`;

    modal.scrollTop = modalScroll;
    const logEl = modal.querySelector<HTMLElement>('.log');
    if (logEl) logEl.scrollTop = logScroll;

    modal.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'close') this.hideModal();
        else if (act === 'save') {
          this.cb.onSave();
          this.toast('Spielstand gespeichert.', 'good', 2000);
        } else if (act === 'reset') {
          if (confirm('Wirklich eine neue Stadt gründen? Der aktuelle Spielstand wird gelöscht.')) {
            this.hideModal();
            this.cb.onReset();
          }
        }
      });
    });
  }
}
