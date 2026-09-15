// Alle 197 Länder: 193 UN-Mitglieder + Vatikanstadt, Palästina, Kosovo, Taiwan.
// Diese Datei hat bewusst keine Imports – scripts/prepare-flags.ts liest sie direkt mit Node.

export type ContinentId = 'europa' | 'nordamerika' | 'suedamerika' | 'asien' | 'afrika' | 'ozeanien'

export interface Continent {
  id: ContinentId
  name: string
  note?: string
  /** Drei Flaggen als Symbol auf der Kontinent-Karte */
  showcase: [string, string, string]
}

export interface Country {
  /** ISO-3166-Code in Kleinbuchstaben, zugleich Dateiname der Flagge (xk = Kosovo) */
  code: string
  name: string
  continent: ContinentId
}

/** Reihenfolge = Freischalt-Reihenfolge */
export const CONTINENTS: Continent[] = [
  { id: 'europa', name: 'Europa', showcase: ['fr', 'de', 'it'] },
  { id: 'nordamerika', name: 'Nordamerika', note: 'mit Mittelamerika & Karibik', showcase: ['ca', 'us', 'mx'] },
  { id: 'suedamerika', name: 'Südamerika', showcase: ['ar', 'br', 'co'] },
  { id: 'asien', name: 'Asien', showcase: ['kr', 'jp', 'in'] },
  { id: 'afrika', name: 'Afrika', showcase: ['ng', 'za', 'ke'] },
  { id: 'ozeanien', name: 'Ozeanien', showcase: ['nz', 'au', 'fj'] },
]

const LISTS: Record<ContinentId, [code: string, name: string][]> = {
  europa: [
    ['al', 'Albanien'], ['ad', 'Andorra'], ['be', 'Belgien'], ['by', 'Belarus'],
    ['ba', 'Bosnien und Herzegowina'], ['bg', 'Bulgarien'], ['dk', 'Dänemark'], ['de', 'Deutschland'],
    ['ee', 'Estland'], ['fi', 'Finnland'], ['fr', 'Frankreich'], ['gr', 'Griechenland'],
    ['gb', 'Großbritannien'], ['ie', 'Irland'], ['is', 'Island'], ['it', 'Italien'],
    ['xk', 'Kosovo'], ['hr', 'Kroatien'], ['lv', 'Lettland'], ['li', 'Liechtenstein'],
    ['lt', 'Litauen'], ['lu', 'Luxemburg'], ['mt', 'Malta'], ['md', 'Moldau'],
    ['mc', 'Monaco'], ['me', 'Montenegro'], ['nl', 'Niederlande'], ['mk', 'Nordmazedonien'],
    ['no', 'Norwegen'], ['at', 'Österreich'], ['pl', 'Polen'], ['pt', 'Portugal'],
    ['ro', 'Rumänien'], ['ru', 'Russland'], ['sm', 'San Marino'], ['se', 'Schweden'],
    ['ch', 'Schweiz'], ['rs', 'Serbien'], ['sk', 'Slowakei'], ['si', 'Slowenien'],
    ['es', 'Spanien'], ['cz', 'Tschechien'], ['ua', 'Ukraine'], ['hu', 'Ungarn'],
    ['va', 'Vatikanstadt'], ['cy', 'Zypern'],
  ],
  nordamerika: [
    ['ag', 'Antigua und Barbuda'], ['bs', 'Bahamas'], ['bb', 'Barbados'], ['bz', 'Belize'],
    ['cr', 'Costa Rica'], ['dm', 'Dominica'], ['do', 'Dominikanische Republik'], ['sv', 'El Salvador'],
    ['gd', 'Grenada'], ['gt', 'Guatemala'], ['ht', 'Haiti'], ['hn', 'Honduras'],
    ['jm', 'Jamaika'], ['ca', 'Kanada'], ['cu', 'Kuba'], ['mx', 'Mexiko'],
    ['ni', 'Nicaragua'], ['pa', 'Panama'], ['kn', 'St. Kitts und Nevis'], ['lc', 'St. Lucia'],
    ['vc', 'St. Vincent und die Grenadinen'], ['tt', 'Trinidad und Tobago'], ['us', 'USA'],
  ],
  suedamerika: [
    ['ar', 'Argentinien'], ['bo', 'Bolivien'], ['br', 'Brasilien'], ['cl', 'Chile'],
    ['ec', 'Ecuador'], ['gy', 'Guyana'], ['co', 'Kolumbien'], ['py', 'Paraguay'],
    ['pe', 'Peru'], ['sr', 'Suriname'], ['uy', 'Uruguay'], ['ve', 'Venezuela'],
  ],
  asien: [
    ['af', 'Afghanistan'], ['am', 'Armenien'], ['az', 'Aserbaidschan'], ['bh', 'Bahrain'],
    ['bd', 'Bangladesch'], ['bt', 'Bhutan'], ['bn', 'Brunei'], ['cn', 'China'],
    ['ge', 'Georgien'], ['in', 'Indien'], ['id', 'Indonesien'], ['iq', 'Irak'],
    ['ir', 'Iran'], ['il', 'Israel'], ['jp', 'Japan'], ['ye', 'Jemen'],
    ['jo', 'Jordanien'], ['kh', 'Kambodscha'], ['kz', 'Kasachstan'], ['qa', 'Katar'],
    ['kg', 'Kirgisistan'], ['kw', 'Kuwait'], ['la', 'Laos'], ['lb', 'Libanon'],
    ['my', 'Malaysia'], ['mv', 'Malediven'], ['mn', 'Mongolei'], ['mm', 'Myanmar'],
    ['np', 'Nepal'], ['kp', 'Nordkorea'], ['om', 'Oman'], ['tl', 'Osttimor'],
    ['pk', 'Pakistan'], ['ps', 'Palästina'], ['ph', 'Philippinen'], ['sa', 'Saudi-Arabien'],
    ['sg', 'Singapur'], ['lk', 'Sri Lanka'], ['kr', 'Südkorea'], ['sy', 'Syrien'],
    ['tj', 'Tadschikistan'], ['tw', 'Taiwan'], ['th', 'Thailand'], ['tr', 'Türkei'],
    ['tm', 'Turkmenistan'], ['uz', 'Usbekistan'], ['ae', 'Vereinigte Arabische Emirate'], ['vn', 'Vietnam'],
  ],
  afrika: [
    ['eg', 'Ägypten'], ['gq', 'Äquatorialguinea'], ['et', 'Äthiopien'], ['dz', 'Algerien'],
    ['ao', 'Angola'], ['bj', 'Benin'], ['bw', 'Botswana'], ['bf', 'Burkina Faso'],
    ['bi', 'Burundi'], ['dj', 'Dschibuti'], ['ci', 'Elfenbeinküste'], ['er', 'Eritrea'],
    ['sz', 'Eswatini'], ['ga', 'Gabun'], ['gm', 'Gambia'], ['gh', 'Ghana'],
    ['gn', 'Guinea'], ['gw', 'Guinea-Bissau'], ['cm', 'Kamerun'], ['cv', 'Kap Verde'],
    ['ke', 'Kenia'], ['km', 'Komoren'], ['cd', 'DR Kongo'], ['cg', 'Republik Kongo'],
    ['ls', 'Lesotho'], ['lr', 'Liberia'], ['ly', 'Libyen'], ['mg', 'Madagaskar'],
    ['mw', 'Malawi'], ['ml', 'Mali'], ['ma', 'Marokko'], ['mr', 'Mauretanien'],
    ['mu', 'Mauritius'], ['mz', 'Mosambik'], ['na', 'Namibia'], ['ne', 'Niger'],
    ['ng', 'Nigeria'], ['rw', 'Ruanda'], ['zm', 'Sambia'], ['st', 'São Tomé und Príncipe'],
    ['sn', 'Senegal'], ['sc', 'Seychellen'], ['sl', 'Sierra Leone'], ['zw', 'Simbabwe'],
    ['so', 'Somalia'], ['za', 'Südafrika'], ['sd', 'Sudan'], ['ss', 'Südsudan'],
    ['tz', 'Tansania'], ['tg', 'Togo'], ['td', 'Tschad'], ['tn', 'Tunesien'],
    ['ug', 'Uganda'], ['cf', 'Zentralafrikanische Republik'],
  ],
  ozeanien: [
    ['au', 'Australien'], ['fj', 'Fidschi'], ['ki', 'Kiribati'], ['mh', 'Marshallinseln'],
    ['fm', 'Mikronesien'], ['nr', 'Nauru'], ['nz', 'Neuseeland'], ['pw', 'Palau'],
    ['pg', 'Papua-Neuguinea'], ['sb', 'Salomonen'], ['ws', 'Samoa'], ['to', 'Tonga'],
    ['tv', 'Tuvalu'], ['vu', 'Vanuatu'],
  ],
}

export const COUNTRIES: Country[] = CONTINENTS.flatMap(({ id }) =>
  LISTS[id].map(([code, name]) => ({ code, name, continent: id })),
)
