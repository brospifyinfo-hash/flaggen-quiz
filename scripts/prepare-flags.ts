// Kopiert die Flaggen aller Länder aus svg-country-flags (gemeinfrei) nach public/flags,
// ersetzt veraltete Flaggen durch scripts/flag-overrides, verkleinert die SVGs
// und schreibt die Seitenverhältnisse nach src/data/flag-ratios.json.
// Aufruf: npm run flags
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { optimize } from 'svgo'
import { COUNTRIES } from '../src/data/countries.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(dirname(createRequire(import.meta.url).resolve('svg-country-flags/package.json')), 'svg')
const overrides = join(root, 'scripts', 'flag-overrides')
const target = join(root, 'public', 'flags')

rmSync(target, { recursive: true, force: true })
mkdirSync(target, { recursive: true })

const ratios: Record<string, number> = {}
const sizes: [string, number][] = []

for (const { code } of COUNTRIES) {
  const override = join(overrides, `${code}.svg`)
  const input = readFileSync(existsSync(override) ? override : join(source, `${code}.svg`), 'utf8')
  const { data } = optimize(input, { multipass: true })

  const viewBox = data.match(/viewBox="([^"]+)"/)?.[1]
  if (!viewBox) throw new Error(`${code}: Flagge ohne viewBox`)
  const [, , width, height] = viewBox.trim().split(/[\s,]+/).map(Number)
  ratios[code] = Math.round((width / height) * 1000) / 1000

  writeFileSync(join(target, `${code}.svg`), data)
  sizes.push([code, data.length])
}

writeFileSync(join(root, 'src', 'data', 'flag-ratios.json'), `${JSON.stringify(ratios)}\n`)

const total = sizes.reduce((sum, [, size]) => sum + size, 0)
const largest = sizes.sort((a, b) => b[1] - a[1]).slice(0, 5).map(([code, size]) => `${code} ${Math.round(size / 1024)} KB`)
console.log(`${sizes.length} Flaggen, zusammen ${Math.round(total / 1024)} KB (größte: ${largest.join(', ')})`)
