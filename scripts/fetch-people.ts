// Holt Porträts für den Modus „Berühmte Personen“ von Wikimedia Commons.
// Es werden ausschließlich frei lizenzierte Bilder übernommen (gemeinfrei, CC0, CC BY, CC BY-SA).
// Alles andere wird verworfen und am Ende aufgelistet.
// Aufruf: npm run people
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const imageDir = join(root, 'public', 'people')

const UA = 'WeltwissenQuiz/1.0 (privates Lernquiz; https://flaggen-quiz-nu.vercel.app)'
const IMAGE_WIDTH = 420

/** Name = Titel des deutschen Wikipedia-Artikels, dazu ein kurzer Steckbrief */
const PEOPLE: [title: string, role: string][] = [
  // Wissenschaft und Technik
  ['Albert Einstein', 'Physiker, Relativitätstheorie'],
  ['Isaac Newton', 'Physiker, Gesetze der Mechanik'],
  ['Marie Curie', 'Physikerin und Chemikerin, zwei Nobelpreise'],
  ['Charles Darwin', 'Naturforscher, Evolutionstheorie'],
  ['Nikola Tesla', 'Erfinder, Wechselstrom'],
  ['Thomas Alva Edison', 'Erfinder, Glühlampe'],
  ['Galileo Galilei', 'Astronom und Physiker'],
  ['Nikolaus Kopernikus', 'Astronom, Sonne im Zentrum'],
  ['Alexander Fleming', 'Entdecker des Penicillins'],
  ['Alan Turing', 'Mathematiker, Vater der Informatik'],
  ['Ada Lovelace', 'Erste Programmiererin'],
  ['Stephen Hawking', 'Astrophysiker, Schwarze Löcher'],
  ['Sigmund Freud', 'Begründer der Psychoanalyse'],
  ['Johannes Gutenberg', 'Erfinder des Buchdrucks'],
  ['Carl Benz', 'Erfinder des Automobils'],
  ['Robert Koch', 'Mediziner, Entdecker des Tuberkulose-Erregers'],
  ['Wernher von Braun', 'Raketeningenieur'],
  ['Konrad Zuse', 'Erbauer des ersten Computers'],

  // Kunst, Musik, Literatur
  ['Leonardo da Vinci', 'Maler und Erfinder der Renaissance'],
  ['Michelangelo', 'Bildhauer und Maler'],
  ['Vincent van Gogh', 'Maler des Postimpressionismus'],
  ['Pablo Picasso', 'Maler, Mitbegründer des Kubismus'],
  ['Frida Kahlo', 'Malerin aus Mexiko'],
  ['Salvador Dalí', 'Maler des Surrealismus'],
  ['Andy Warhol', 'Künstler der Pop-Art'],
  ['Ludwig van Beethoven', 'Komponist'],
  ['Wolfgang Amadeus Mozart', 'Komponist'],
  ['Johann Sebastian Bach', 'Komponist des Barock'],
  ['Johann Wolfgang von Goethe', 'Dichter, „Faust“'],
  ['Friedrich Schiller', 'Dichter und Dramatiker'],
  ['William Shakespeare', 'Dramatiker, „Hamlet“'],
  ['Astrid Lindgren', 'Kinderbuchautorin, „Pippi Langstrumpf“'],
  ['Agatha Christie', 'Krimiautorin'],
  ['Franz Kafka', 'Schriftsteller, „Die Verwandlung“'],

  // Politik und Geschichte
  ['Napoleon Bonaparte', 'Französischer Kaiser und Feldherr'],
  ['Otto von Bismarck', 'Erster deutscher Reichskanzler'],
  ['Abraham Lincoln', 'US-Präsident im Bürgerkrieg'],
  ['George Washington', 'Erster US-Präsident'],
  ['Winston Churchill', 'Britischer Premierminister'],
  ['Mahatma Gandhi', 'Führer der indischen Unabhängigkeitsbewegung'],
  ['Nelson Mandela', 'Erster schwarzer Präsident Südafrikas'],
  ['Martin Luther King', 'Bürgerrechtler, „I have a dream“'],
  ['Rosa Parks', 'Bürgerrechtlerin aus den USA'],
  ['Che Guevara', 'Revolutionär'],
  ['Martin Luther', 'Reformator, 95 Thesen'],
  ['Karl Marx', 'Philosoph, „Das Kapital“'],
  ['Elisabeth II.', 'Britische Königin, 70 Jahre auf dem Thron'],
  ['Konrad Adenauer', 'Erster Bundeskanzler der Bundesrepublik'],
  ['Willy Brandt', 'Bundeskanzler, Kniefall von Warschau'],
  ['Helmut Kohl', 'Bundeskanzler der Wiedervereinigung'],
  ['Angela Merkel', 'Bundeskanzlerin 2005 bis 2021'],
  ['Olaf Scholz', 'Bundeskanzler ab 2021'],
  ['Barack Obama', 'US-Präsident 2009 bis 2017'],
  ['Joe Biden', 'US-Präsident 2021 bis 2025'],
  ['Donald Trump', 'US-Präsident'],
  ['John F. Kennedy', 'US-Präsident, 1963 ermordet'],
  ['Wladimir Wladimirowitsch Putin', 'Russischer Präsident'],
  ['Wolodymyr Selenskyj', 'Ukrainischer Präsident'],
  ['Emmanuel Macron', 'Französischer Präsident'],
  ['Ursula von der Leyen', 'Präsidentin der EU-Kommission'],
  ['Franziskus (Papst)', 'Papst ab 2013'],
  ['Dalai Lama', 'Geistliches Oberhaupt der Tibeter'],
  ['Mutter Teresa', 'Ordensschwester, Friedensnobelpreis'],
  ['Anne Frank', 'Tagebuchschreiberin, Opfer des Holocaust'],
  ['Sophie Scholl', 'Widerstandskämpferin der Weißen Rose'],
  ['Malala Yousafzai', 'Jüngste Friedensnobelpreisträgerin'],
  ['Greta Thunberg', 'Klimaaktivistin'],

  // Sport
  ['Lionel Messi', 'Fußballer, achtfacher Weltfußballer'],
  ['Cristiano Ronaldo', 'Fußballer, Rekordtorschütze'],
  ['Franz Beckenbauer', 'Fußballer und Weltmeistertrainer'],
  ['Manuel Neuer', 'Torwart, Weltmeister 2014'],
  ['Jürgen Klopp', 'Fußballtrainer'],
  ['Michael Schumacher', 'Formel-1-Weltmeister'],
  ['Lewis Hamilton', 'Formel-1-Weltmeister'],
  ['Sebastian Vettel', 'Formel-1-Weltmeister'],
  ['Usain Bolt', 'Schnellster Sprinter der Welt'],
  ['Serena Williams', 'Tennisspielerin'],
  ['Roger Federer', 'Tennisspieler'],
  ['Steffi Graf', 'Tennisspielerin, Golden Slam'],
  ['Boris Becker', 'Tennisspieler, Wimbledonsieger'],
  ['Dirk Nowitzki', 'Basketballstar in der NBA'],
  ['Muhammad Ali', 'Boxlegende'],
  ['Michael Jordan', 'Basketball-Ikone'],

  // Film, Musik, Popkultur
  ['Elvis Presley', 'King of Rock ’n’ Roll'],
  ['Michael Jackson', 'King of Pop'],
  ['Freddie Mercury', 'Sänger von Queen'],
  ['John Lennon', 'Musiker der Beatles'],
  ['David Bowie', 'Musiker und Wandlungskünstler'],
  ['Bob Marley', 'Reggae-Musiker'],
  ['Madonna', 'Pop-Sängerin'],
  ['Beyoncé', 'Sängerin'],
  ['Taylor Swift', 'Sängerin und Songschreiberin'],
  ['Ed Sheeran', 'Sänger und Songschreiber'],
  ['Rihanna', 'Sängerin und Unternehmerin'],
  ['Lady Gaga', 'Sängerin und Schauspielerin'],
  ['Adele', 'Sängerin'],
  ['Helene Fischer', 'Schlagersängerin'],
  ['Charlie Chaplin', 'Stummfilmstar'],
  ['Marilyn Monroe', 'Hollywood-Ikone'],
  ['Audrey Hepburn', 'Schauspielerin'],
  ['Arnold Schwarzenegger', 'Bodybuilder, Schauspieler, Gouverneur'],
  ['Leonardo DiCaprio', 'Schauspieler'],
  ['Tom Hanks', 'Schauspieler'],
  ['Meryl Streep', 'Schauspielerin'],
  ['Keanu Reeves', 'Schauspieler'],
  ['Emma Watson', 'Schauspielerin'],
  ['Oprah Winfrey', 'Talkmasterin'],
  ['Steven Spielberg', 'Regisseur'],

  // Wirtschaft und Raumfahrt
  ['Steve Jobs', 'Mitgründer von Apple'],
  ['Bill Gates', 'Mitgründer von Microsoft'],
  ['Elon Musk', 'Unternehmer, Tesla und SpaceX'],
  ['Mark Zuckerberg', 'Gründer von Facebook'],
  ['Jeff Bezos', 'Gründer von Amazon'],
  ['Neil Armstrong', 'Erster Mensch auf dem Mond'],
  ['Juri Alexejewitsch Gagarin', 'Erster Mensch im All'],
  ['Alexander Gerst', 'Deutscher Astronaut'],
]

const FREE_LICENSE = /^(public domain|pd|cc0|cc by|cc-by|cc sa|attribution)/i

const slug = (title: string) =>
  title
    .toLowerCase()
    .replaceAll('ä', 'ae')
    .replaceAll('ö', 'oe')
    .replaceAll('ü', 'ue')
    .replaceAll('ß', 'ss')
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

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

/** Wikimedia liefert Urheber oft doppelt oder mit Dateinamen davor */
export function tidyAuthor(raw: string): string {
  let author = decode(raw).replace(/\s+/g, ' ').trim()
  author = author.replace(/^[^:]+\.(jpg|jpeg|png|webp|tif|tiff):\s*/i, '')
  if (author.length % 2 === 0 && author.slice(0, author.length / 2) === author.slice(author.length / 2)) {
    author = author.slice(0, author.length / 2)
  }
  if (/^unknown author$/i.test(author)) author = 'unbekannt'
  if (author.length > 70) author = author.slice(0, 67).trimEnd() + '…'
  return author || 'unbekannt'
}

const clean = (html: string | undefined) =>
  (html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

interface Person {
  id: string
  name: string
  role: string
  credit: { author: string; license: string; source: string }
}

const people: Person[] = []
const skipped: string[] = []

rmSync(imageDir, { recursive: true, force: true })
mkdirSync(imageDir, { recursive: true })

for (const [title, role] of PEOPLE) {
  try {
    // 1. Artikelbild suchen – pilicense=free liefert nur freie Dateien
    const page = await api(
      `https://de.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=pageimages&pilicense=free&piprop=name&titles=${encodeURIComponent(title)}`,
    )
    const file = page?.query?.pages?.[0]?.pageimage
    if (!file) {
      skipped.push(`${title}: kein freies Artikelbild`)
      continue
    }

    // 2. Lizenz auf Commons prüfen
    const info = await api(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=extmetadata|url&iiurlwidth=${IMAGE_WIDTH}&titles=${encodeURIComponent(`File:${file}`)}`,
    )
    const image = info?.query?.pages?.[0]?.imageinfo?.[0]
    const meta = image?.extmetadata ?? {}
    const license = clean(meta.LicenseShortName?.value) || clean(meta.License?.value)
    const author = tidyAuthor(clean(meta.Artist?.value))
    if (!image?.thumburl || !FREE_LICENSE.test(license)) {
      skipped.push(`${title}: Lizenz „${license || 'unbekannt'}“ nicht frei`)
      continue
    }

    // 3. Bild laden und verkleinern
    const bytes = await fetch(image.thumburl, { headers: { 'User-Agent': UA } }).then((r) => r.arrayBuffer())
    const id = slug(title)
    await sharp(Buffer.from(bytes))
      .resize(IMAGE_WIDTH, IMAGE_WIDTH, { fit: 'cover', position: 'top' })
      .webp({ quality: 78 })
      .toFile(join(imageDir, `${id}.webp`))

    people.push({
      id,
      name: title.replace(/\s*\(.*?\)\s*$/, ''),
      role,
      credit: { author, license: decode(license), source: image.descriptionurl ?? '' },
    })
    process.stdout.write('.')
  } catch (error) {
    skipped.push(`${title}: ${String(error).split('\n')[0]}`)
  }
}

const file = `// Diese Datei wird von scripts/fetch-people.ts erzeugt – nicht von Hand ändern.
// Alle Bilder stammen von Wikimedia Commons und stehen unter freien Lizenzen.

export interface Person {
  id: string
  name: string
  role: string
  credit: { author: string; license: string; source: string }
}

export const PEOPLE: Person[] = ${JSON.stringify(people, null, 2)}
`

writeFileSync(join(root, 'src', 'data', 'people.ts'), file)

console.log(`\n\n${people.length} Personen übernommen, ${skipped.length} übersprungen`)
if (skipped.length > 0) console.log(skipped.map((entry) => `  – ${entry}`).join('\n'))
