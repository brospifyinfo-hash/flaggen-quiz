export type Category = 'wohnen' | 'gewerbe' | 'rotlicht' | 'oeffentlich';

export interface BuildingDef {
  id: string;
  name: string;
  category: Category;
  icon: string;
  desc: string;
  /** Baukosten */
  cost: number;
  /** Einkommen pro Sekunde auf Stufe 1 (negativ = Unterhalt) */
  income: number;
  maxLevel: number;
  /** Kostenfaktor pro Ausbaustufe */
  upgradeGrowth: number;
  /** Einkommensfaktor pro Ausbaustufe (zusätzlich zur linearen Skalierung) */
  incomeGrowth: number;
  /** Ab welchem Stadtlevel baubar */
  unlockLevel: number;
  /** Kriminalitäts-Hitze pro Stufe */
  crime: number;
  /** Zufriedenheitseffekt auf Wohnhäuser in der Nähe */
  happiness: number;
  /** Radius (in Feldern) des Zufriedenheitseffekts */
  radius: number;
  /** Bewohner pro Stufe (nur Wohnen) */
  capacity: number;
  /** Arbeitsplätze pro Stufe */
  jobs: number;
  /** Polizeiwache: Hitze-Reduktion pro Stufe */
  policing: number;
  /** Geldwäsche: Bonus auf kriminelles Einkommen pro Stufe */
  launder: number;
}

export type HouseStatus = 'ok' | 'complaining' | 'abandoned';

export interface Building {
  id: number;
  type: string;
  x: number;
  y: number;
  level: number;
  residents: number;
  moveInProgress: number;
  happiness: number;
  status: HouseStatus;
  unhappyFor: number;
  complaint: string;
  raidedUntil: number;
  builtAt: number;
}

export type LogKind = 'info' | 'good' | 'warn' | 'bad';

export interface LogEntry {
  t: number;
  text: string;
  kind: LogKind;
}

export interface GameState {
  version: number;
  cash: number;
  time: number;
  cityLevel: number;
  nextId: number;
  buildings: Building[];
  log: LogEntry[];
  stats: {
    totalEarned: number;
    movedOut: number;
    raids: number;
    demolished: number;
    finesPaid: number;
  };
  savedAt: number;
}

export interface CityReport {
  population: number;
  capacity: number;
  jobs: number;
  avgHappiness: number;
  heat: number;
  raidChancePerMin: number;
  incomeLegal: number;
  incomeCrime: number;
  incomeTax: number;
  upkeep: number;
  incomeTotal: number;
  laundryBonus: number;
  counts: Record<Category, number>;
  abandoned: number;
  complaining: number;
  nextLevelPop: number | null;
}
