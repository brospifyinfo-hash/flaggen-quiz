import type { BuildingDef, Category } from './types';

export const GRID = 28;
export const TOWN_HALL_ID = 'rathaus';

/** Rathausplatz: 4x4 Fläche in der Kartenmitte, auf der nur das Rathaus stehen darf */
export const PLAZA = { x: 12, y: 12, size: 4 };

/** Bevölkerung, die für jedes Stadtlevel nötig ist (Index 0 = Level 1) */
export const LEVEL_THRESHOLDS = [0, 15, 40, 90, 160, 260, 400, 600, 850, 1200, 1700, 2500];
export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export const CATEGORY_LABELS: Record<Category, string> = {
  wohnen: 'Wohnen',
  gewerbe: 'Gewerbe',
  rotlicht: 'Rotlicht & Kriminell',
  oeffentlich: 'Öffentlich',
};

export const TAX_PER_RESIDENT = 0.45;

type OptionalKeys =
  | 'income'
  | 'crime'
  | 'happiness'
  | 'radius'
  | 'capacity'
  | 'jobs'
  | 'policing'
  | 'launder'
  | 'upgradeGrowth'
  | 'incomeGrowth';

type DefInput = Omit<BuildingDef, OptionalKeys> & Partial<Pick<BuildingDef, OptionalKeys>>;

function def(p: DefInput): BuildingDef {
  return {
    income: 0,
    crime: 0,
    happiness: 0,
    radius: 2,
    capacity: 0,
    jobs: 0,
    policing: 0,
    launder: 0,
    upgradeGrowth: 1.35,
    incomeGrowth: 1.1,
    ...p,
  };
}

export const DEFS: BuildingDef[] = [
  // ---------------- Wohnen ----------------
  def({
    id: 'wohnhaus',
    name: 'Wohnhaus',
    category: 'wohnen',
    icon: '🏠',
    desc: 'Kleines Einfamilienhaus. Bewohner zahlen Steuern – solange sie zufrieden sind.',
    cost: 500,
    maxLevel: 5,
    unlockLevel: 1,
    capacity: 4,
    upgradeGrowth: 1.5,
  }),
  def({
    id: 'reihenhaus',
    name: 'Reihenhaus',
    category: 'wohnen',
    icon: '🏘️',
    desc: 'Platz für mehrere Familien auf einem Feld.',
    cost: 2500,
    maxLevel: 6,
    unlockLevel: 3,
    capacity: 10,
    upgradeGrowth: 1.5,
  }),
  def({
    id: 'wohnblock',
    name: 'Wohnblock',
    category: 'wohnen',
    icon: '🏢',
    desc: 'Plattenbau mit vielen Wohnungen. Viel Steuer, aber die Bewohner sind empfindlich.',
    cost: 12000,
    maxLevel: 8,
    unlockLevel: 5,
    capacity: 25,
    upgradeGrowth: 1.5,
  }),
  def({
    id: 'wohnturm',
    name: 'Wohnturm',
    category: 'wohnen',
    icon: '🌆',
    desc: 'Luxus-Hochhaus. Hunderte Bewohner auf einem einzigen Feld.',
    cost: 60000,
    maxLevel: 10,
    unlockLevel: 8,
    capacity: 60,
    upgradeGrowth: 1.5,
  }),

  // ---------------- Gewerbe ----------------
  def({
    id: 'kiosk',
    name: 'Kiosk',
    category: 'gewerbe',
    icon: '🏪',
    desc: 'Zigaretten, Bier, Zeitungen. Kleiner, aber sicherer Cashflow.',
    cost: 400,
    income: 1.5,
    maxLevel: 10,
    unlockLevel: 1,
    jobs: 2,
    happiness: 2,
  }),
  def({
    id: 'baeckerei',
    name: 'Bäckerei',
    category: 'gewerbe',
    icon: '🥐',
    desc: 'Frische Brötchen für die Nachbarschaft.',
    cost: 800,
    income: 3,
    maxLevel: 10,
    unlockLevel: 1,
    jobs: 3,
    happiness: 3,
  }),
  def({
    id: 'supermarkt',
    name: 'Supermarkt',
    category: 'gewerbe',
    icon: '🛒',
    desc: 'Versorgt die ganze Stadt. Bringt Jobs und Steuern.',
    cost: 3000,
    income: 9,
    maxLevel: 10,
    unlockLevel: 2,
    jobs: 8,
    happiness: 3,
    radius: 3,
  }),
  def({
    id: 'werkstatt',
    name: 'Autowerkstatt',
    category: 'gewerbe',
    icon: '🔧',
    desc: 'Ölwechsel, Tuning und gelegentlich eine fragwürdige Fahrgestellnummer.',
    cost: 5000,
    income: 14,
    maxLevel: 10,
    unlockLevel: 3,
    jobs: 6,
    happiness: -1,
  }),
  def({
    id: 'restaurant',
    name: 'Restaurant',
    category: 'gewerbe',
    icon: '🍽️',
    desc: 'Gehobene Küche. Zieht zahlungskräftige Gäste an.',
    cost: 7000,
    income: 20,
    maxLevel: 10,
    unlockLevel: 3,
    jobs: 8,
    happiness: 4,
  }),
  def({
    id: 'buero',
    name: 'Bürokomplex',
    category: 'gewerbe',
    icon: '🏬',
    desc: 'Hunderte Schreibtische, ein Kaffeeautomat. Große Steuereinnahmen.',
    cost: 20000,
    income: 55,
    maxLevel: 12,
    unlockLevel: 5,
    jobs: 30,
  }),
  def({
    id: 'kino',
    name: 'Kino',
    category: 'gewerbe',
    icon: '🎬',
    desc: 'Popcorn-Marge von 900 %. Die Bewohner lieben es.',
    cost: 30000,
    income: 80,
    maxLevel: 12,
    unlockLevel: 6,
    jobs: 12,
    happiness: 6,
    radius: 3,
  }),
  def({
    id: 'einkaufszentrum',
    name: 'Einkaufszentrum',
    category: 'gewerbe',
    icon: '🛍️',
    desc: 'Die Mall. Legaler Cashflow auf höchstem Niveau.',
    cost: 120000,
    income: 300,
    maxLevel: 15,
    unlockLevel: 8,
    jobs: 80,
    happiness: 5,
    radius: 4,
  }),

  // ---------------- Rotlicht & Kriminell ----------------
  def({
    id: 'hanfplantage',
    name: 'Hanfplantage',
    category: 'rotlicht',
    icon: '🌿',
    desc: 'Fängt als Beet hinterm Schuppen an – und endet als Indoor-Fabrik mit 100 Ausbaustufen. Der Geruch stört die Nachbarn.',
    cost: 1500,
    income: 8,
    maxLevel: 100,
    unlockLevel: 1,
    crime: 1,
    happiness: -6,
    radius: 2,
    jobs: 2,
    upgradeGrowth: 1.15,
    incomeGrowth: 1.07,
  }),
  def({
    id: 'spielhalle',
    name: 'Spielhalle',
    category: 'rotlicht',
    icon: '🎰',
    desc: 'Blinkende Automaten, manipulierte Quoten. Läuft rund um die Uhr.',
    cost: 4000,
    income: 18,
    maxLevel: 15,
    unlockLevel: 2,
    crime: 1,
    happiness: -3,
    jobs: 3,
  }),
  def({
    id: 'hehlerei',
    name: 'Hehlerei',
    category: 'rotlicht',
    icon: '💍',
    desc: 'Pfandleihe nach vorne, Hehlerware nach hinten.',
    cost: 6000,
    income: 25,
    maxLevel: 15,
    unlockLevel: 3,
    crime: 2,
    happiness: -3,
    jobs: 3,
  }),
  def({
    id: 'stripclub',
    name: 'Stripclub',
    category: 'rotlicht',
    icon: '💃',
    desc: 'Neonlicht, Bass bis 5 Uhr morgens. Die Nachbarn beschweren sich über den Lärm.',
    cost: 15000,
    income: 60,
    maxLevel: 15,
    unlockLevel: 3,
    crime: 2,
    happiness: -5,
    radius: 2,
    jobs: 8,
  }),
  def({
    id: 'wettbuero',
    name: 'Illegales Wettbüro',
    category: 'rotlicht',
    icon: '🎲',
    desc: 'Wetten ohne Lizenz, Quoten ohne Gewissen.',
    cost: 25000,
    income: 90,
    maxLevel: 15,
    unlockLevel: 4,
    crime: 3,
    happiness: -4,
    jobs: 5,
  }),
  def({
    id: 'bordell',
    name: 'Puff',
    category: 'rotlicht',
    icon: '💋',
    desc: 'Rotes Licht im Fenster. Bringt viel Geld, aber Familien ziehen weg.',
    cost: 40000,
    income: 150,
    maxLevel: 15,
    unlockLevel: 4,
    crime: 4,
    happiness: -8,
    radius: 2,
    jobs: 10,
  }),
  def({
    id: 'waschsalon',
    name: 'Waschsalon (Geldwäsche)',
    category: 'rotlicht',
    icon: '🧺',
    desc: 'Wäscht mehr als Socken. Steigert das Einkommen aller kriminellen Betriebe und senkt die Aufmerksamkeit der Polizei.',
    cost: 50000,
    income: 40,
    maxLevel: 10,
    unlockLevel: 5,
    crime: 2,
    happiness: 0,
    jobs: 4,
    launder: 0.04,
    policing: 3,
  }),
  def({
    id: 'casino',
    name: 'Casino',
    category: 'rotlicht',
    icon: '🃏',
    desc: 'Roulette, Poker, Champagner. Glamourös – und ein Magnet für Geldströme.',
    cost: 120000,
    income: 400,
    maxLevel: 20,
    unlockLevel: 5,
    crime: 5,
    happiness: -3,
    radius: 3,
    jobs: 40,
  }),
  def({
    id: 'schwarzmarkt',
    name: 'Schwarzmarkt',
    category: 'rotlicht',
    icon: '📦',
    desc: 'Alles, was es nicht geben dürfte, gibt es hier.',
    cost: 250000,
    income: 700,
    maxLevel: 20,
    unlockLevel: 6,
    crime: 6,
    happiness: -7,
    radius: 3,
    jobs: 20,
  }),
  def({
    id: 'schmugglerlager',
    name: 'Schmugglerlager',
    category: 'rotlicht',
    icon: '🚚',
    desc: 'Container, die nie verzollt wurden. Das Herz des Syndikats.',
    cost: 600000,
    income: 1500,
    maxLevel: 25,
    unlockLevel: 8,
    crime: 8,
    happiness: -6,
    radius: 3,
    jobs: 30,
  }),

  // ---------------- Öffentlich ----------------
  def({
    id: 'park',
    name: 'Park',
    category: 'oeffentlich',
    icon: '🌳',
    desc: 'Grün, Bänke, Entenbrot. Macht die Nachbarschaft zufriedener.',
    cost: 1000,
    income: -0.5,
    maxLevel: 3,
    unlockLevel: 1,
    happiness: 8,
    radius: 2,
  }),
  def({
    id: 'polizei',
    name: 'Polizeiwache',
    category: 'oeffentlich',
    icon: '🚓',
    desc: 'Senkt die Kriminalitäts-Hitze und beruhigt Bewohner in der Nähe krimineller Betriebe.',
    cost: 8000,
    income: -3,
    maxLevel: 5,
    unlockLevel: 2,
    happiness: 4,
    radius: 3,
    policing: 8,
  }),
  def({
    id: 'schule',
    name: 'Schule',
    category: 'oeffentlich',
    icon: '🏫',
    desc: 'Familien ziehen gerne in die Nähe.',
    cost: 15000,
    income: -4,
    maxLevel: 5,
    unlockLevel: 4,
    happiness: 6,
    radius: 3,
  }),
  def({
    id: 'krankenhaus',
    name: 'Krankenhaus',
    category: 'oeffentlich',
    icon: '🏥',
    desc: 'Große Zufriedenheit im weiten Umkreis.',
    cost: 40000,
    income: -8,
    maxLevel: 5,
    unlockLevel: 6,
    happiness: 7,
    radius: 4,
  }),
  def({
    id: TOWN_HALL_ID,
    name: 'Rathaus',
    category: 'oeffentlich',
    icon: '🏛️',
    desc: 'Verwaltungssitz der Stadt. Wächst mit jedem Stadtlevel.',
    cost: 0,
    maxLevel: MAX_LEVEL,
    unlockLevel: 99,
  }),
];

export const DEF_MAP: Record<string, BuildingDef> = Object.fromEntries(DEFS.map((d) => [d.id, d]));

export function getDef(id: string): BuildingDef {
  const d = DEF_MAP[id];
  if (!d) throw new Error(`Unbekanntes Gebäude: ${id}`);
  return d;
}

/** Grundfläche in Feldern; das Rathaus wächst mit dem Stadtlevel */
export function footprint(type: string, level: number): number {
  if (type === TOWN_HALL_ID) {
    if (level >= 7) return 4;
    if (level >= 4) return 3;
    return 2;
  }
  return 1;
}

export function upgradeCost(d: BuildingDef, level: number): number {
  return Math.round(d.cost * 0.75 * Math.pow(d.upgradeGrowth, level));
}

/** Brutto-Einkommen pro Sekunde einer Stufe (ohne Nachfrage/Geldwäsche) */
export function baseIncome(d: BuildingDef, level: number): number {
  if (d.income <= 0) return d.income * level;
  return d.income * level * Math.pow(d.incomeGrowth, level - 1);
}

export function isCriminal(d: BuildingDef): boolean {
  return d.category === 'rotlicht';
}

export function isResidential(d: BuildingDef): boolean {
  return d.category === 'wohnen';
}

/** Ausbaustufe der Hanfplantage bestimmt das Aussehen */
export function hanfTier(level: number): number {
  if (level >= 60) return 5;
  if (level >= 30) return 4;
  if (level >= 15) return 3;
  if (level >= 5) return 2;
  return 1;
}

export function cityLevelForPopulation(pop: number): number {
  let lvl = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (pop >= LEVEL_THRESHOLDS[i]) lvl = i + 1;
  }
  return lvl;
}
