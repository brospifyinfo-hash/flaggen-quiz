// 💻 Netzwerkfälle, Roboterprogramme und Bauteile. Die Netze sind klein genug, um sie zu
// überblicken, und groß genug, dass man wirklich vergleichen muss.
import type { BaukastenItem, Bauteil, NetzGeraet, NetzItem, RoboterItem, Stufe } from '../../typen'
import { optionen } from '../werkzeug'

// ---------- Netzwerk ----------

const g = (id: string, name: string, emoji: string, ip: string, extra: Partial<NetzGeraet> = {}): NetzGeraet => ({
  id,
  name,
  emoji,
  ip,
  maske: '255.255.255.0',
  gateway: '192.168.1.1',
  dns: '192.168.1.1',
  kabel: true,
  dhcp: true,
  ...extra,
})

function netz(
  nr: number,
  ziel: string,
  stufe: Stufe,
  symptom: string,
  geraete: NetzGeraet[],
  betroffen: string,
  fehler: NetzItem['fehler'],
  liste: string[],
  router: Partial<NetzItem['router']> = {},
): NetzItem {
  return {
    id: `it.ne.${String(nr).padStart(2, '0')}`,
    spiel: 'it.netz',
    art: 'netz',
    ziel,
    stufe,
    geraete,
    router: { ip: '192.168.1.1', dhcp: true, internet: true, ...router },
    betroffen,
    symptom,
    fehler,
    optionen: optionen(liste),
  }
}

export const NETZE: NetzItem[] = [
  netz(1, 'it.ip', 1, 'Der Laptop im Büro hat kein Internet, die anderen Geräte schon.', [
    g('pc', 'Büro-PC', '🖥️', '192.168.1.20'),
    g('laptop', 'Laptop', '💻', '192.168.1.20'),
    g('drucker', 'Drucker', '🖨️', '192.168.1.30'),
  ], 'laptop', 'doppelt', [
    'Zwei Geräte haben dieselbe IP-Adresse::Doppelte Adressen im selben Netz führen zu genau diesem Bild: mal geht es, mal nicht.',
    '~0.5 Die IP des Laptops ist falsch vergeben::Fast – sie ist nicht ungültig, sondern schon vergeben.',
    'Das Gateway fehlt::Das Gateway ist eingetragen.',
    'Der Router ist offline::Die anderen Geräte sind online.',
  ]),
  netz(2, 'it.ip', 2, 'Der neue Rechner kommt nicht ins Netz, obwohl das Kabel steckt.', [
    g('pc', 'Büro-PC', '🖥️', '192.168.1.20'),
    g('neu', 'Neuer PC', '🖥️', '192.168.2.45', { dhcp: false }),
    g('nas', 'NAS', '🗄️', '192.168.1.50', { dhcp: false }),
  ], 'neu', 'subnetz', [
    'Die feste IP liegt in einem anderen Subnetz::192.168.2.x erreicht 192.168.1.x nicht, wenn die Maske 255.255.255.0 ist.',
    '~0.5 Die Subnetzmaske ist falsch::Die Maske passt – die Adresse liegt außerhalb.',
    'Das Kabel ist defekt::Die Verbindung steht.',
    'DHCP ist am Router aus::Der Rechner hat eine feste IP.',
  ]),
  netz(3, 'it.router', 2, 'Webseiten laden nicht, aber der Drucker im Netz funktioniert.', [
    g('pc', 'Büro-PC', '🖥️', '192.168.1.20', { dns: '10.0.0.53' }),
    g('laptop', 'Laptop', '💻', '192.168.1.21'),
    g('drucker', 'Drucker', '🖨️', '192.168.1.30'),
  ], 'pc', 'dns', [
    'Der DNS-Server ist nicht erreichbar::Ohne Namensauflösung lädt keine Webseite – im lokalen Netz geht trotzdem alles.',
    '~0.5 Das Internet ist ausgefallen::Dann wäre auch der Laptop offline.',
    'Die IP ist doppelt vergeben::Die Adressen sind eindeutig.',
    'Das Gateway ist falsch::Das Gateway stimmt.',
  ]),
  netz(4, 'it.router', 3, 'Ein Rechner erreicht die anderen im Netz, kommt aber nicht ins Internet.', [
    g('pc', 'Büro-PC', '🖥️', '192.168.1.20', { gateway: '192.168.1.99' }),
    g('laptop', 'Laptop', '💻', '192.168.1.21'),
    g('nas', 'NAS', '🗄️', '192.168.1.50'),
  ], 'pc', 'gateway', [
    'Das Gateway zeigt auf ein Gerät, das kein Router ist::Ohne richtiges Gateway bleibt der Rechner im eigenen Netz gefangen.',
    '~0.5 Der DNS ist falsch::Der DNS steht richtig – das Gateway nicht.',
    'Die Subnetzmaske ist zu klein::Die Maske passt zu allen Geräten.',
    'Der Router hat kein Internet::Die anderen Geräte sind online.',
  ]),
  netz(5, 'it.wlan', 1, 'Der Laptop zeigt „nicht verbunden“, obwohl er direkt neben dem Router steht.', [
    g('laptop', 'Laptop', '💻', '—', { kabel: false }),
    g('pc', 'Büro-PC', '🖥️', '192.168.1.20'),
    g('tablet', 'Tablet', '📱', '192.168.1.22'),
  ], 'laptop', 'kabel', [
    'Das Gerät hat gar keine Verbindung – WLAN aus oder falsches Netz::Ohne Verbindung gibt es auch keine Adresse; erst verbinden, dann weitersuchen.',
    '~0.5 Die IP fehlt::Die fehlende IP ist die Folge, nicht die Ursache.',
    'Der DNS ist falsch::Ohne Verbindung spielt der DNS keine Rolle.',
    'Der Router ist überlastet::Zwei Geräte sind problemlos online.',
  ]),
  netz(6, 'it.wlan', 3, 'Alle Geräte im Haus sind plötzlich offline.', [
    g('pc', 'Büro-PC', '🖥️', '169.254.12.4', { dhcp: true }),
    g('laptop', 'Laptop', '💻', '169.254.88.2', { dhcp: true }),
    g('tablet', 'Tablet', '📱', '169.254.4.9', { dhcp: true }),
  ], 'pc', 'dhcp', [
    'Der Router verteilt keine Adressen mehr::169.254.x.x vergibt sich ein Gerät selbst, wenn kein DHCP antwortet.',
    '~0.5 Alle Geräte haben falsche feste IPs::Sie stehen auf DHCP – die Adressen kommen vom Gerät selbst.',
    'Das Internet des Anbieters ist gestört::Dann hätten die Geräte noch gültige lokale Adressen.',
    'Drei Geräte sind zu viel für das Netz::Das ist kein Grund.',
  ], { dhcp: false }),
  netz(7, 'it.ip', 3, 'Der Drucker ist aus dem Netz verschwunden, seit er umgestellt wurde.', [
    g('pc', 'Büro-PC', '🖥️', '192.168.1.20'),
    g('drucker', 'Drucker', '🖨️', '192.168.1.30', { maske: '255.255.255.240', dhcp: false }),
    g('laptop', 'Laptop', '💻', '192.168.1.21'),
  ], 'drucker', 'subnetz', [
    'Die Subnetzmaske passt nicht zu den anderen Geräten::Mit /28 reicht sein Netz nur bis .31 – die .20 liegt außerhalb.',
    '~0.5 Die IP ist falsch::Die IP passt, die Maske nicht.',
    'Der Drucker braucht DHCP::Feste Adressen sind für Drucker üblich.',
    'Das Gateway fehlt::Es ist eingetragen.',
  ]),
  netz(8, 'it.router', 4, 'Das Tablet lädt Webseiten sehr langsam, der PC ist schnell.', [
    g('tablet', 'Tablet', '📱', '192.168.1.22', { dns: '8.8.4.4' }),
    g('pc', 'Büro-PC', '🖥️', '192.168.1.20'),
    g('laptop', 'Laptop', '💻', '192.168.1.21'),
  ], 'tablet', 'dns', [
    'Ein weit entfernter DNS-Server bremst jede Namensauflösung::Der lokale Router antwortet in Millisekunden, ein fremder Server manchmal erst nach hunderten.',
    '~0.5 Das WLAN ist zu schwach::Möglich – der Unterschied liegt hier aber in der Konfiguration.',
    'Die IP ist doppelt vergeben::Dann ginge gar nichts.',
    'Das Tablet ist zu alt::Keine Diagnose, sondern eine Vermutung.',
  ]),
  netz(9, 'it.wlan', 4, 'Nach dem Umzug des Routers bricht die Verbindung im Keller ab.', [
    g('pc', 'Keller-PC', '🖥️', '192.168.1.40', { kabel: false }),
    g('laptop', 'Laptop', '💻', '192.168.1.21'),
    g('tv', 'Fernseher', '📺', '192.168.1.25'),
  ], 'pc', 'kabel', [
    'Das Gerät ist zu weit weg – die Funkverbindung reicht nicht::Beton und Entfernung dämpfen das Signal; hier hilft ein Kabel oder ein Repeater.',
    '~0.5 Das WLAN-Passwort stimmt nicht mehr::Dann wäre es nie verbunden gewesen.',
    'Die IP ist falsch::Sie passt ins Netz.',
    'Der Router ist defekt::Die anderen Geräte funktionieren.',
  ]),
]

// ---------- Roboter ----------

function bot(
  nr: number,
  ziel: string,
  stufe: Stufe,
  titel: string,
  breite: number,
  hoehe: number,
  start: [number, number, number],
  zielfeld: [number, number],
  waende: [number, number][],
  befehle: RoboterItem['befehle'],
  plaetze: number,
  par: number,
  loesung: RoboterItem['loesung'],
  extra: { muenzen?: [number, number][]; funktion?: number; tipp?: string } = {},
): RoboterItem {
  return {
    id: `it.ro.${String(nr).padStart(2, '0')}`,
    spiel: 'it.roboter',
    art: 'roboter',
    ziel,
    stufe,
    titel,
    breite,
    hoehe,
    start,
    zielfeld,
    waende,
    befehle,
    plaetze,
    par,
    loesung,
    ...(extra.muenzen ? { muenzen: extra.muenzen } : {}),
    ...(extra.funktion ? { funktion: extra.funktion } : {}),
    ...(extra.tipp ? { tipp: extra.tipp } : {}),
  }
}

export const ROBOTER: RoboterItem[] = [
  bot(1, 'it.logik', 1, 'Bring den Roboter zur Flagge.', 4, 3, [0, 2, 0], [0, 0], [], ['vor', 'links', 'rechts'], 6, 2, {
    haupt: [{ b: 'vor', n: 2 }],
  }, { tipp: 'Der Roboter schaut nach oben. Zweimal „vor“ genügt – Drehen kostet nur Befehle.' }),
  bot(2, 'it.logik', 2, 'Um die Wand herum zur Flagge.', 4, 4, [0, 3, 0], [3, 0], [[1, 1], [1, 2]], ['vor', 'links', 'rechts'], 9, 7, {
    haupt: [{ b: 'vor', n: 3 }, { b: 'rechts' }, { b: 'vor', n: 3 }],
  }, { tipp: 'Erst ganz nach oben, dann nach rechts – die Wand steht nur in der Mitte.' }),
  bot(3, 'it.schleifen', 2, 'Sammle beide Münzen und geh zur Flagge.', 5, 3, [0, 2, 0], [4, 0], [], ['vor', 'links', 'rechts', 'wdh'], 9, 7, {
    haupt: [{ b: 'vor', n: 2 }, { b: 'rechts' }, { b: 'vor', n: 4 }],
  }, { muenzen: [[0, 1], [2, 0]], tipp: '„×2“ verdoppelt den nächsten Befehl – damit wird aus vier Befehlen einer plus einer.' }),
  bot(4, 'it.schleifen', 3, 'Der lange Gang: Nutze die Funktion F.', 6, 3, [0, 1, 1], [5, 1], [], ['vor', 'links', 'rechts', 'f', 'wdh'], 5, 5, {
    haupt: [{ b: 'f' }, { b: 'f' }, { b: 'vor' }],
    f: [{ b: 'vor', n: 2 }],
  }, { funktion: 3, tipp: 'Schreib in F, was sich wiederholt – und ruf F dann mehrfach auf.' }),
  bot(5, 'it.logik', 3, 'Zickzack durch die Kammern.', 4, 4, [0, 3, 0], [3, 3], [[1, 3], [2, 2]], ['vor', 'links', 'rechts', 'wdh'], 11, 9, {
    haupt: [{ b: 'vor', n: 2 }, { b: 'rechts' }, { b: 'vor', n: 3 }, { b: 'rechts' }, { b: 'vor', n: 2 }],
  }, { tipp: 'Erst hoch, dann quer, dann runter – die Wände zwingen den Umweg.' }),
  bot(6, 'it.schleifen', 4, 'Bedingungen: Fahr nur, wenn der Weg frei ist.', 5, 4, [0, 3, 0], [4, 0], [[2, 2]], ['vor', 'links', 'rechts', 'wennFrei', 'f', 'wdh'], 10, 8, {
    haupt: [{ b: 'vor', n: 3 }, { b: 'rechts' }, { b: 'vor', n: 4 }],
  }, { funktion: 3, tipp: '„wenn frei“ gilt nur für den nächsten Befehl – so lassen sich Wände abfangen.' }),
]

// ---------- Rechner bauen ----------

const T = (id: string, typ: Bauteil['typ'], name: string, info: string, rest: Partial<Bauteil> = {}): Bauteil => ({ id, typ, name, info, ...rest })

function baukasten(
  nr: number,
  ziel: string,
  stufe: Stufe,
  modus: 'bauen' | 'pruefen',
  zweck: string,
  plaetze: BaukastenItem['plaetze'],
  braucht: { grafik: boolean },
  erklaerung: string,
  problem?: BaukastenItem['problem'],
): BaukastenItem {
  return {
    id: `it.ba.${String(nr).padStart(2, '0')}`,
    spiel: 'it.bauen',
    art: 'baukasten',
    ziel,
    stufe,
    modus,
    zweck,
    plaetze,
    braucht,
    erklaerung,
    ...(problem ? { problem } : {}),
  }
}

export const BAUKASTEN: BaukastenItem[] = [
  baukasten(1, 'it.kompatibel', 2, 'pruefen', 'Büro-Rechner', [
    { typ: 'cpu', optionen: [T('c1', 'cpu', 'Ryzen 5 5600', 'Sockel AM4 · 65 W · keine Grafik', { sockel: 'AM4', watt: 65 })], gesetzt: 0 },
    { typ: 'board', optionen: [T('b1', 'board', 'B550M', 'Sockel AM4 · DDR4 · Micro-ATX', { sockel: 'AM4', ram: 'DDR4', formfaktor: 'Micro-ATX' })], gesetzt: 0 },
    { typ: 'ram', optionen: [T('r1', 'ram', '16 GB DDR5', 'DDR5-5600', { ram: 'DDR5', watt: 8 })], gesetzt: 0 },
    { typ: 'netzteil', optionen: [T('n1', 'netzteil', '450 W', 'ausreichend für Bürorechner', { watt: 450 })], gesetzt: 0 },
  ], { grafik: false },
    'Sockel und Speichertyp sind die zwei häufigsten Stolperstellen. Ein DDR5-Riegel passt physisch nicht in einen DDR4-Steckplatz.',
    { typ: 'ram', grund: 'Das Board nimmt DDR4, der Riegel ist DDR5.', falsch: ['cpu', 'board', 'netzteil'] },
  ),
  baukasten(2, 'it.kompatibel', 3, 'pruefen', 'Spiele-Rechner', [
    { typ: 'cpu', optionen: [T('c2', 'cpu', 'Core i5-13400', 'Sockel LGA1700 · 65 W · mit Grafik', { sockel: 'LGA1700', watt: 65, grafik: true })], gesetzt: 0 },
    { typ: 'board', optionen: [T('b2', 'board', 'B760 ATX', 'Sockel LGA1700 · DDR5 · ATX', { sockel: 'LGA1700', ram: 'DDR5', formfaktor: 'ATX' })], gesetzt: 0 },
    { typ: 'ram', optionen: [T('r2', 'ram', '32 GB DDR5', 'DDR5-6000', { ram: 'DDR5', watt: 10 })], gesetzt: 0 },
    { typ: 'gpu', optionen: [T('g2', 'gpu', 'RTX 4070', '285 mm lang · 200 W', { laenge: 285, watt: 200 })], gesetzt: 0 },
    { typ: 'gehaeuse', optionen: [T('h2', 'gehaeuse', 'Kompakt-Gehäuse', 'Micro-ATX · max. 250 mm Grafikkarte', { passt: ['Micro-ATX', 'Mini-ITX'], maxLaenge: 250 })], gesetzt: 0 },
    { typ: 'netzteil', optionen: [T('n2', 'netzteil', '650 W', 'genug Reserve', { watt: 650 })], gesetzt: 0 },
  ], { grafik: true },
    'Auch Maße gehören zur Kompatibilität: Formfaktor des Boards und Länge der Grafikkarte stehen in jedem Datenblatt.',
    { typ: 'gehaeuse', grund: 'Ein ATX-Board passt nicht hinein, und die Grafikkarte ist 35 mm zu lang.', falsch: ['gpu', 'board', 'netzteil'] },
  ),
  baukasten(3, 'it.bauteile', 2, 'bauen', 'Rechner fürs Büro, ohne Spiele', [
    {
      typ: 'cpu',
      optionen: [
        T('c3a', 'cpu', 'Ryzen 5 5600G', 'Sockel AM4 · 65 W · mit Grafik', { sockel: 'AM4', watt: 65, grafik: true }),
        T('c3b', 'cpu', 'Core i5-13400', 'Sockel LGA1700 · 65 W · mit Grafik', { sockel: 'LGA1700', watt: 65, grafik: true }),
      ],
    },
    {
      typ: 'board',
      optionen: [
        T('b3a', 'board', 'B550M', 'Sockel AM4 · DDR4 · Micro-ATX', { sockel: 'AM4', ram: 'DDR4', formfaktor: 'Micro-ATX' }),
        T('b3b', 'board', 'B760M', 'Sockel LGA1700 · DDR5 · Micro-ATX', { sockel: 'LGA1700', ram: 'DDR5', formfaktor: 'Micro-ATX' }),
      ],
    },
    {
      typ: 'ram',
      optionen: [
        T('r3a', 'ram', '16 GB DDR4', 'DDR4-3200', { ram: 'DDR4', watt: 8 }),
        T('r3b', 'ram', '16 GB DDR5', 'DDR5-5600', { ram: 'DDR5', watt: 8 }),
      ],
    },
    {
      typ: 'netzteil',
      optionen: [
        T('n3a', 'netzteil', '400 W', 'schlank', { watt: 400 }),
        T('n3b', 'netzteil', '750 W', 'viel Reserve', { watt: 750 }),
      ],
    },
  ], { grafik: false },
    'Zwei Wege führen zum Ziel – beide müssen in sich stimmig sein: AM4 mit DDR4 oder LGA1700 mit DDR5.',
  ),
  baukasten(4, 'it.bauteile', 4, 'bauen', 'Rechner für Bildbearbeitung mit Grafikkarte', [
    {
      typ: 'cpu',
      optionen: [
        T('c4a', 'cpu', 'Ryzen 7 7700', 'Sockel AM5 · 65 W', { sockel: 'AM5', watt: 65 }),
        T('c4b', 'cpu', 'Ryzen 5 5600', 'Sockel AM4 · 65 W', { sockel: 'AM4', watt: 65 }),
      ],
    },
    {
      typ: 'board',
      optionen: [
        T('b4a', 'board', 'B650 ATX', 'Sockel AM5 · DDR5 · ATX', { sockel: 'AM5', ram: 'DDR5', formfaktor: 'ATX' }),
        T('b4b', 'board', 'B550 ATX', 'Sockel AM4 · DDR4 · ATX', { sockel: 'AM4', ram: 'DDR4', formfaktor: 'ATX' }),
      ],
    },
    {
      typ: 'ram',
      optionen: [
        T('r4a', 'ram', '32 GB DDR5', 'DDR5-6000', { ram: 'DDR5', watt: 10 }),
        T('r4b', 'ram', '32 GB DDR4', 'DDR4-3600', { ram: 'DDR4', watt: 10 }),
      ],
    },
    {
      typ: 'gpu',
      optionen: [
        T('g4a', 'gpu', 'RTX 4060', '240 mm · 115 W', { laenge: 240, watt: 115 }),
        T('g4b', 'gpu', 'RTX 4080', '340 mm · 320 W', { laenge: 340, watt: 320 }),
      ],
    },
    {
      typ: 'gehaeuse',
      optionen: [
        T('h4a', 'gehaeuse', 'Midi-Tower', 'ATX · max. 330 mm', { passt: ['ATX', 'Micro-ATX', 'Mini-ITX'], maxLaenge: 330 }),
        T('h4b', 'gehaeuse', 'Mini-ITX-Würfel', 'Mini-ITX · max. 220 mm', { passt: ['Mini-ITX'], maxLaenge: 220 }),
      ],
    },
    {
      typ: 'netzteil',
      optionen: [
        T('n4a', 'netzteil', '550 W', 'reicht für Mittelklasse', { watt: 550 }),
        T('n4b', 'netzteil', '350 W', 'sehr knapp', { watt: 350 }),
      ],
    },
  ], { grafik: true },
    'Rechne die Wattzahlen zusammen, bevor du das Netzteil wählst – und miss die Grafikkarte gegen das Gehäuse.',
  ),
]
