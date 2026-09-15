// Erzeugt App-Icons und Favicon aus scripts/icon.svg. Aufruf: npm run icons
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(root, 'scripts', 'icon.svg'), 'utf8')
const pub = join(root, 'public')
mkdirSync(join(pub, 'icons'), { recursive: true })

// Maskable-Icons werden rund oder als Squircle beschnitten – das Motiv etwas kleiner setzen
const maskable = svg.replace('translate(262 262)', 'translate(260 262) scale(0.82)')
// Favicon mit abgerundeten Ecken
const favicon = svg.replace('<rect width="512" height="512"', '<rect width="512" height="512" rx="112"')

const render = (source: string, size: number, file: string) =>
  sharp(Buffer.from(source)).resize(size, size).png().toFile(join(pub, file))

await Promise.all([
  render(svg, 192, 'icons/icon-192.png'),
  render(svg, 512, 'icons/icon-512.png'),
  render(maskable, 512, 'icons/icon-maskable-512.png'),
  render(svg, 180, 'apple-touch-icon.png'),
])
writeFileSync(join(pub, 'favicon.svg'), favicon)
console.log('Icons erstellt')
