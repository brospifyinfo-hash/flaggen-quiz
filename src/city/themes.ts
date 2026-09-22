// Stadtthemen: Sie färben Boden, Himmel, Erde und Bäume. Die Bauwerke behalten ihre
// eigenen Farben, damit man sie weiter auseinanderhalten kann.

export interface Theme {
  id: string
  name: string
  emoji: string
  /** Wiese von hell nach dunkel */
  ground: [string, string]
  /** Erdschicht unter der Wiese */
  soil: [string, string]
  /** Himmel von oben nach unten */
  sky: [string, string]
  /** Bäume: Stamm, Krone, Lichtseite */
  tree: [string, string, string]
  /** Farbe der Umrandung des Gebiets */
  edge: string
}

export const THEMES: Theme[] = [
  {
    id: 'modern',
    name: 'Grünland',
    emoji: '🌆',
    ground: ['#7fc86a', '#4f9f57'],
    soil: ['#6b5136', '#57402b'],
    sky: ['#1b2a4a', '#0d1526'],
    tree: ['#6b4a2f', '#2f9e5c', '#46b972'],
    edge: 'rgba(255,255,255,0.35)',
  },
  {
    id: 'nordisch',
    name: 'Nordisch',
    emoji: '❄️',
    ground: ['#eaf2f8', '#bed3e2'],
    soil: ['#6f7681', '#565d68'],
    sky: ['#2a4160', '#101c2c'],
    tree: ['#4a3a2c', '#2b6b4a', '#eaf4f8'],
    edge: 'rgba(255,255,255,0.5)',
  },
  {
    id: 'wueste',
    name: 'Wüste',
    emoji: '🏜️',
    ground: ['#eed6a0', '#cfa869'],
    soil: ['#a8865a', '#8a6c46'],
    sky: ['#5e3f28', '#241812'],
    tree: ['#7a5a35', '#6f9a3f', '#8fbe57'],
    edge: 'rgba(255,240,200,0.4)',
  },
  {
    id: 'tropisch',
    name: 'Tropisch',
    emoji: '🌴',
    ground: ['#6fd28a', '#2f8f6f'],
    soil: ['#7a5a3a', '#5e452c'],
    sky: ['#12414f', '#07202b'],
    tree: ['#6b4a2f', '#1f9e6b', '#5fd39a'],
    edge: 'rgba(200,255,240,0.4)',
  },
  {
    id: 'abend',
    name: 'Abendrot',
    emoji: '🌇',
    ground: ['#8fbd6a', '#5b8f52'],
    soil: ['#6b4a36', '#513628'],
    sky: ['#6b3a4a', '#241426'],
    tree: ['#5e402a', '#3f8f52', '#6fb36a'],
    edge: 'rgba(255,214,180,0.45)',
  },
]

const BY_ID = new Map(THEMES.map((theme) => [theme.id, theme]))

export const DEFAULT_THEME = THEMES[0].id

export const themeById = (id: string | undefined): Theme => BY_ID.get(id ?? '') ?? THEMES[0]
