// Holt Fotos für „Was ist das“ von Wikimedia.
// Nur freie Lizenzen (gemeinfrei, CC0, CC BY, CC BY-SA). Logos und Cover werden nicht kopiert.
// Aufruf: node scripts/fetch-motive.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { NEU } from './motive-neu.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const imageDir = join(root, 'public', 'motive')

const UA = 'WeltwissenQuiz/1.0 (privates Lernquiz; https://flaggen-quiz-nu.vercel.app)'
const FREE_LICENSE = /^(public domain|pd|cc0|cc by|cc-by|cc sa|attribution)/i

/** id, deutsche Wikipedia-Titel, danach eine Commons-Suche falls kein freies Foto da ist */
const ZIELE: [id: string, titel: string[], suche: string][] = [
  ['vw', ['Volkswagen Golf VIII', 'Volkswagen Golf'], 'Volkswagen Golf front photo'],
  ['mercedes', ['Mercedes-Benz Baureihe 223', 'Mercedes-Benz S-Klasse'], 'Mercedes-Benz S-Class front photo'],
  ['bmw', ['BMW G20', 'BMW 3er'], 'BMW 3 Series front photo'],
  ['audi', ['Audi A6 C8', 'Audi A4'], 'Audi A6 front photo'],
  ['porsche', ['Porsche 992', 'Porsche 911'], 'Porsche 911 front photo'],
  ['opel', ['Opel Corsa F', 'Opel Corsa'], 'Opel Corsa front photo'],
  ['ferrari', ['Ferrari 488', 'Ferrari'], 'Ferrari 488 photo'],
  ['toyota', ['Toyota Corolla'], 'Toyota Corolla front photo'],
  ['ford', ['Ford Mustang VI', 'Ford Mustang'], 'Ford Mustang front photo'],
  ['tesla', ['Tesla Model 3'], 'Tesla Model 3 front photo'],
  ['fiat', ['Fiat 500 (2007)'], 'Fiat 500 photo'],
  ['honda', ['Honda Civic'], 'Honda Civic front photo'],

  ['nike', ['Nike Air Force'], 'Nike Air Force 1 shoe'],
  ['adidas', ['Adidas Samba'], 'Adidas Samba shoe'],
  ['apple', ['IPhone 15', 'IPhone'], 'iPhone front photo'],
  ['cola', ['Coca-Cola'], 'Coca-Cola bottle'],
  ['mcdonalds', ['McDonald’s'], 'McDonalds restaurant exterior'],
  ['ikea', ['IKEA'], 'IKEA store exterior'],
  ['lego', ['Lego'], 'Lego bricks'],
  ['nutella', ['Nutella'], 'Nutella jar'],
  ['milka', ['Milka'], 'Milka chocolate'],
  ['nivea', ['Nivea'], 'Nivea creme tin'],
  ['haribo', ['Haribo'], 'Haribo Goldbears'],
  ['google', ['Google'], 'Google Headquarters in Ireland Building Sign'],

  ['brandenburg', ['Brandenburger Tor'], 'Brandenburg Gate'],
  ['eiffel', ['Eiffelturm'], 'Eiffel Tower'],
  ['kolosseum', ['Kolosseum'], 'Colosseum Rome'],
  ['freiheit', ['Freiheitsstatue'], 'Statue of Liberty'],
  ['bigben', ['Elizabeth Tower'], 'Elizabeth Tower Big Ben'],
  ['taj', ['Taj Mahal'], 'Taj Mahal'],
  ['pyramiden', ['Pyramiden von Gizeh'], 'Giza pyramids'],
  ['sydney', ['Sydney Opera House'], 'Sydney Opera House'],
  ['mauer', ['Chinesische Mauer'], 'Great Wall of China'],
  ['neuschwanstein', ['Schloss Neuschwanstein'], 'Neuschwanstein Castle'],
  ['dom', ['Kölner Dom'], 'Cologne Cathedral'],
  ['sagrada', ['Sagrada Família'], 'Sagrada Familia'],

  ['loewe', ['Löwe'], 'lion male'],
  ['panda', ['Großer Panda'], 'giant panda'],
  ['pinguin', ['Kaiserpinguin'], 'emperor penguin'],
  ['elefant', ['Afrikanischer Elefant'], 'african elephant'],
  ['giraffe', ['Giraffe'], 'giraffe'],
  ['fuchs', ['Rotfuchs'], 'red fox'],
  ['eule', ['Waldkauz'], 'tawny owl'],
  ['delfin', ['Großer Tümmler'], 'bottlenose dolphin'],
  ['rose', ['Rosen'], 'rose flower'],
  ['sonnenblume', ['Sonnenblume'], 'sunflower'],
  ['kaktus', ['Carnegiea gigantea', 'Kaktusgewächse'], 'saguaro cactus'],
  ['eiche', ['Stieleiche'], 'oak tree'],

  ['berlin', ['Capital Bra'], 'Capital Bra rapper'],
  ['anthrazit', ['RAF Camora'], 'RAF Camora'],
  ['hollywood', ['Bonez MC'], 'Bonez MC'],
  ['ich', ['Sido (Rapper)'], 'Sido rapper'],
  ['bordstein', ['Bushido'], 'Bushido rapper'],
  ['raop', ['Cro (Rapper)'], 'Cro rapper'],
  ['triebwerke', ['Alligatoah'], 'Alligatoah'],
  ['hinterland', ['Casper (Rapper)'], 'Casper rapper'],
  ['hurra', ['K.I.Z'], 'KIZ band photo'],
  ['roulette', ['Haftbefehl (Rapper)'], 'Haftbefehl rapper'],
  ['treppenhaus', ['Apache 207'], 'Apache 207'],
  ['erde', ['Kontra K'], 'Kontra K'],
]

const api = async (url: string) => {
  const response = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip' } })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return response.json() as Promise<any>
}

const decode = (text: string) =>
  text
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')

const clean = (html: string | undefined) =>
  (html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

function tidyAuthor(raw: string): string {
  let author = decode(raw).replace(/\s+/g, ' ').trim()
  author = author.replace(/^[^:]+\.(jpg|jpeg|png|webp|tif|tiff|svg):\s*/i, '')
  if (author.length % 2 === 0 && author.slice(0, author.length / 2) === author.slice(author.length / 2)) {
    author = author.slice(0, author.length / 2)
  }
  if (/^unknown author$/i.test(author)) author = 'unbekannt'
  if (author.length > 80) author = author.slice(0, 77).trimEnd() + '…'
  return author || 'unbekannt'
}

interface Fund {
  thumburl: string
  license: string
  author: string
  source: string
}

function ausInfo(image: any): Fund | null {
  if (!image?.thumburl) return null
  const mime = String(image.mime ?? '')
  if (mime && !/^image\/(jpeg|png|webp)$/.test(mime)) return null
  const meta = image.extmetadata ?? {}
  const license = clean(meta.LicenseShortName?.value) || clean(meta.License?.value)
  if (!FREE_LICENSE.test(license)) return null
  return {
    thumburl: image.thumburl,
    license: decode(license),
    author: tidyAuthor(clean(meta.Artist?.value)),
    source: image.descriptionurl ?? '',
  }
}

const FEST: Record<string, string> = {
  google: 'File:Google Headquarters in Ireland Building Sign.jpg',
  haribo: 'File:Haribo Goldbears (3549536631).jpg',
  hurra: 'File:KIZ 1.jpg',
}

async function vonDatei(titel: string): Promise<Fund | null> {
  const info = await api(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=extmetadata|url|mime&iiurlwidth=960&titles=${encodeURIComponent(titel)}`,
  )
  return ausInfo(info?.query?.pages?.[0]?.imageinfo?.[0])
}

async function vonWikipedia(titel: string): Promise<Fund | null> {
  const page = await api(
    `https://de.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=pageimages&pilicense=free&piprop=name&titles=${encodeURIComponent(titel)}`,
  )
  const file = page?.query?.pages?.[0]?.pageimage as string | undefined
  if (!file || /\.svg$/i.test(file)) return null
  const info = await api(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=extmetadata|url|mime&iiurlwidth=960&titles=${encodeURIComponent(`File:${file}`)}`,
  )
  return ausInfo(info?.query?.pages?.[0]?.imageinfo?.[0])
}

async function vonCommons(suche: string): Promise<Fund | null> {
  const info = await api(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&generator=search&gsrsearch=${encodeURIComponent(suche)}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=extmetadata|url|mime&iiurlwidth=960`,
  )
  const pages = (info?.query?.pages ?? []) as any[]
  for (const page of pages) {
    const fund = ausInfo(page.imageinfo?.[0])
    if (fund) return fund
  }
  return null
}

interface Bild {
  id: string
  urheber: string
  lizenz: string
  quelle: string
}

mkdirSync(imageDir, { recursive: true })
const bilder: Bild[] = []
const skipped: string[] = []
const neuGeschafft: { id: string }[] = []

let alt: Bild[] = []
try {
  const quelle = readFileSync(join(root, 'src/erkennen/bilder.ts'), 'utf8')
  const treffer = quelle.match(/BILDER: MotivBild\[\] = (\[[\s\S]*?\n\])/)
  if (treffer) alt = JSON.parse(treffer[1]) as Bild[]
} catch {
  alt = []
}
const altNachId = new Map(alt.map((bild) => [bild.id, bild]))

const ziele: [string, string[], string][] = [
  ...ZIELE,
  ...NEU.map((eintrag) => [eintrag.id, eintrag.titel, eintrag.suche] as [string, string[], string]),
]

for (const [id, titel, suche] of ziele) {
  try {
    const datei = join(imageDir, `${id}.webp`)
    const bekannt = altNachId.get(id)
    if (bekannt && existsSync(datei)) {
      bilder.push(bekannt)
      continue
    }
    let fund: Fund | null = FEST[id] ? await vonDatei(FEST[id]) : null
    for (const name of titel) {
      if (fund) break
      fund = await vonWikipedia(name)
      if (fund) break
    }
    if (!fund) fund = await vonCommons(suche)
    if (!fund) {
      skipped.push(`${id}: kein freies Foto`)
      continue
    }
    const bytes = await fetch(fund.thumburl, { headers: { 'User-Agent': UA } }).then((response) => {
      if (!response.ok) throw new Error(`${response.status}`)
      return response.arrayBuffer()
    })
    await sharp(Buffer.from(bytes))
      .rotate()
      .resize(840, 840, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 76 })
      .toFile(join(imageDir, `${id}.webp`))
    bilder.push({ id, urheber: fund.author, lizenz: fund.license, quelle: fund.source })
    if (NEU.some((eintrag) => eintrag.id === id)) neuGeschafft.push({ id })
    process.stdout.write('.')
  } catch (error) {
    skipped.push(`${id}: ${String(error).split('\n')[0]}`)
  }
}

const file = `// Diese Datei wird von scripts/fetch-motive.ts erzeugt – nicht von Hand ändern.
// Alle Bilder stammen von Wikimedia und stehen unter freien Lizenzen.

export interface MotivBild {
  id: string
  urheber: string
  lizenz: string
  quelle: string
}

export const BILDER: MotivBild[] = ${JSON.stringify(bilder, null, 2)}

const NACH_ID = new Map(BILDER.map((bild) => [bild.id, bild]))

export const bildVon = (id: string): MotivBild | null => NACH_ID.get(id) ?? null
`

writeFileSync(join(root, 'src/erkennen/bilder.ts'), file)

const geschafft = new Set(neuGeschafft.map((eintrag) => eintrag.id).concat(
  NEU.filter((eintrag) => existsSync(join(imageDir, `${eintrag.id}.webp`))).map((eintrag) => eintrag.id),
))
const zusatz = NEU.filter((eintrag) => geschafft.has(eintrag.id)).map((eintrag) => ({
  id: eintrag.id,
  name: eintrag.name,
  gruppe: eintrag.gruppe,
  hinweis: eintrag.hinweis,
  ...(eintrag.antwort ? { antwort: eintrag.antwort } : {}),
}))
writeFileSync(
  join(root, 'src/erkennen/zusatz.ts'),
  `import type { MotivEintrag } from './katalog'

export const ZUSATZ: MotivEintrag[] = ${JSON.stringify(zusatz, null, 2)}
`,
)
console.log(`\n\n${bilder.length} Fotos übernommen, ${zusatz.length} neue Motive, ${skipped.length} ohne Foto`)
if (skipped.length > 0) console.log(skipped.map((entry) => `  – ${entry}`).join('\n'))
