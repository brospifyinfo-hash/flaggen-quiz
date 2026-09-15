// Flaggen, die leicht zu verwechseln sind. Sie werden bevorzugt als falsche Antwortmöglichkeiten
// gezeigt – aber nur, wenn sie zum selben Kontinent gehören.
const GROUPS: string[][] = [
  // Europa
  ['ro', 'ad', 'md'], ['si', 'sk', 'ru', 'rs'], ['nl', 'lu', 'hr', 'fr'], ['pl', 'mc', 'mt'],
  ['ie', 'it', 'hu', 'bg'], ['be', 'de'], ['no', 'is', 'dk', 'fi', 'se'], ['at', 'lv'],
  ['al', 'me'], ['cy', 'xk', 'ba'], ['ua', 'se'], ['gr', 'fi'], ['es', 'ad'], ['ch', 'dk'],
  // Nordamerika
  ['hn', 'ni', 'sv', 'gt'], ['cu', 'pa', 'do'], ['kn', 'tt', 'jm'], ['vc', 'gd', 'dm'],
  ['bb', 'bs'], ['ag', 'lc'],
  // Südamerika
  ['co', 'ec', 've'], ['ar', 'uy'], ['br', 'gy'], ['py', 'cl'], ['bo', 'pe'],
  // Asien
  ['id', 'sg'], ['jp', 'bd', 'kr'], ['ae', 'jo', 'ps', 'kw'], ['iq', 'sy', 'ye'], ['qa', 'bh'],
  ['cn', 'vn'], ['th', 'kh', 'la'], ['ir', 'tj', 'in'], ['pk', 'tm', 'mv'], ['tr', 'az', 'uz'],
  ['kz', 'kg', 'mn'], ['am', 'az'], ['tl', 'ph'], ['sa', 'af'], ['my', 'lk'], ['np', 'bt'],
  // Afrika
  ['ml', 'gn', 'sn', 'cm'], ['td', 'ml', 'gn'], ['ci', 'ne'], ['gh', 'gw', 'bf', 'et'],
  ['eg', 'sd', 'ly'], ['cd', 'cg', 'tz'], ['ke', 'ss', 'mw'], ['dz', 'tn', 'mr'],
  ['bw', 'sl', 'ga'], ['zw', 'ug'], ['rw', 'ga'], ['bj', 'gw', 'mg'], ['so', 'dj'],
  ['ng', 'zm'], ['cv', 'km'], ['st', 'gq'],
  // Ozeanien
  ['au', 'nz', 'tv', 'fj'], ['ws', 'to'], ['nr', 'fm', 'pw'], ['sb', 'vu', 'mh'], ['ki', 'pg'],
]

const MAP = new Map<string, Set<string>>()
for (const group of GROUPS) {
  for (const code of group) {
    const set = MAP.get(code) ?? new Set<string>()
    for (const other of group) if (other !== code) set.add(other)
    MAP.set(code, set)
  }
}

export function lookalikesOf(code: string): string[] {
  return [...(MAP.get(code) ?? [])]
}
