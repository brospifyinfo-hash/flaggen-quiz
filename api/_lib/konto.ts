/**
 * Konten: Registrieren, Anmelden, Spielstand sichern und laden.
 *
 * Ein Konto liegt unter konten/<sha256(E-Mail)>.json mit Salz und scrypt-Hash des Passworts.
 * Der Spielstand liegt unter daten/<Konto-Kennung>.json mit einem „Stand“ (Zeitstempel).
 * Wer speichert, nennt den Stand, den er zuletzt gesehen hat – stimmt er nicht mehr,
 * bekommt er den Serverstand zurück und führt beides erst zusammen.
 *
 * Sitzungen sind signierte Zeichen ohne Serverzustand: <id>.<ablauf>.<hmac>.
 */
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { KonfliktFehler, speicher } from './speicher'

export class Abgelehnt extends Error {
  constructor(
    public status: number,
    nachricht: string,
    public zusatz: Record<string, unknown> = {},
  ) {
    super(nachricht)
  }
}

interface Konto {
  id: string
  email: string
  name: string
  salz: string
  hash: string
  erstellt: number
}

interface Ablage {
  stand: number
  gespeichert: number
  daten: unknown
}

const EIN_JAHR = 365 * 24 * 60 * 60 * 1000
const DATEN_MAX = 2 * 1024 * 1024

const geheimnis = (): string => {
  const g = process.env.KONTO_GEHEIMNIS ?? process.env.KONTO_GITHUB_TOKEN
  if (g) return g
  if (process.env.NODE_ENV === 'production') throw new Abgelehnt(503, 'Der Server ist nicht eingerichtet (KONTO_GEHEIMNIS fehlt).')
  return 'weltwissen-entwicklung'
}

const b64 = (b: Buffer) => b.toString('base64url')
const sha = (text: string) => createHash('sha256').update(text).digest('hex')

export const normEmail = (email: string) => email.trim().toLowerCase()
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function pruefeEmail(email: unknown): string {
  if (typeof email !== 'string' || !EMAIL.test(normEmail(email)) || email.length > 200) {
    throw new Abgelehnt(400, 'Bitte gib eine gültige E-Mail-Adresse an.')
  }
  return normEmail(email)
}

export function pruefePasswort(passwort: unknown): string {
  if (typeof passwort !== 'string' || passwort.length < 6) throw new Abgelehnt(400, 'Das Passwort braucht mindestens 6 Zeichen.')
  if (passwort.length > 200) throw new Abgelehnt(400, 'Das Passwort ist zu lang.')
  return passwort
}

export function pruefeName(name: unknown): string {
  const sauber = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : ''
  if (sauber.length < 1) throw new Abgelehnt(400, 'Wie sollen wir dich nennen? Bitte gib einen Namen an.')
  if (sauber.length > 30) throw new Abgelehnt(400, 'Der Name darf höchstens 30 Zeichen haben.')
  return sauber
}

const kontoPfad = (email: string) => `konten/${sha(email)}.json`
const datenPfad = (id: string) => `daten/${id}.json`

function ablage() {
  const s = speicher()
  if (!s) throw new Abgelehnt(503, 'Auf dem Server ist noch kein Speicher für Konten eingerichtet.')
  return s
}

// ---------- Passwörter und Sitzungen ----------

const hashe = (passwort: string, salz: string) => b64(scryptSync(passwort.normalize('NFKC'), salz, 64, { N: 16384, r: 8, p: 1 }))

function passtPasswort(konto: Konto, passwort: string): boolean {
  const a = Buffer.from(hashe(passwort, konto.salz))
  const b = Buffer.from(konto.hash)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function neuesToken(id: string): string {
  const ablauf = Date.now() + EIN_JAHR
  const kern = `${id}.${ablauf}`
  return `${kern}.${b64(createHmac('sha256', geheimnis()).update(kern).digest())}`
}

export function pruefeToken(token: unknown): string {
  if (typeof token !== 'string') throw new Abgelehnt(401, 'Bitte melde dich an.')
  const teile = token.split('.')
  if (teile.length !== 3) throw new Abgelehnt(401, 'Bitte melde dich neu an.')
  const [id, ablauf, sig] = teile
  const kern = `${id}.${ablauf}`
  const soll = Buffer.from(b64(createHmac('sha256', geheimnis()).update(kern).digest()))
  const ist = Buffer.from(sig)
  if (soll.length !== ist.length || !timingSafeEqual(soll, ist)) throw new Abgelehnt(401, 'Bitte melde dich neu an.')
  if (Number(ablauf) < Date.now()) throw new Abgelehnt(401, 'Deine Anmeldung ist abgelaufen – bitte melde dich neu an.')
  if (!/^[a-f0-9]{24}$/.test(id)) throw new Abgelehnt(401, 'Bitte melde dich neu an.')
  return id
}

// ---------- Konten ----------

async function leseKonto(email: string): Promise<{ konto: Konto; marke?: string } | null> {
  const gelesen = await ablage().lesen(kontoPfad(email))
  if (!gelesen) return null
  return { konto: JSON.parse(gelesen.inhalt) as Konto, marke: gelesen.marke }
}

async function leseDaten(id: string): Promise<{ ablage: Ablage; marke?: string } | null> {
  const gelesen = await ablage().lesen(datenPfad(id))
  if (!gelesen) return null
  return { ablage: JSON.parse(gelesen.inhalt) as Ablage, marke: gelesen.marke }
}

function pruefeDaten(daten: unknown): unknown {
  if (typeof daten !== 'object' || daten === null) throw new Abgelehnt(400, 'Es kamen keine Spieldaten an.')
  const text = JSON.stringify(daten)
  if (text.length > DATEN_MAX) throw new Abgelehnt(413, 'Der Spielstand ist zu groß.')
  return daten
}

const oeffentlich = (konto: Konto) => ({ id: konto.id, email: konto.email, name: konto.name })

export async function registrieren(eingabe: Record<string, unknown>) {
  const email = pruefeEmail(eingabe.email)
  const passwort = pruefePasswort(eingabe.passwort)
  const name = pruefeName(eingabe.name)

  if (await leseKonto(email)) throw new Abgelehnt(409, 'Zu dieser E-Mail-Adresse gibt es schon ein Konto. Melde dich an.')

  const salz = b64(randomBytes(16))
  const konto: Konto = {
    id: randomBytes(12).toString('hex'),
    email,
    name,
    salz,
    hash: hashe(passwort, salz),
    erstellt: Date.now(),
  }
  await ablage().schreiben(kontoPfad(email), JSON.stringify(konto))

  let stand = 0
  if (eingabe.daten !== undefined && eingabe.daten !== null) {
    stand = Date.now()
    const inhalt: Ablage = { stand, gespeichert: stand, daten: pruefeDaten(eingabe.daten) }
    await ablage().schreiben(datenPfad(konto.id), JSON.stringify(inhalt))
  }
  return { konto: oeffentlich(konto), token: neuesToken(konto.id), stand }
}

export async function anmelden(eingabe: Record<string, unknown>) {
  const email = pruefeEmail(eingabe.email)
  const passwort = pruefePasswort(eingabe.passwort)
  const gefunden = await leseKonto(email)
  if (!gefunden || !passtPasswort(gefunden.konto, passwort)) {
    throw new Abgelehnt(401, 'E-Mail oder Passwort stimmen nicht.')
  }
  const daten = await leseDaten(gefunden.konto.id)
  return {
    konto: oeffentlich(gefunden.konto),
    token: neuesToken(gefunden.konto.id),
    stand: daten?.ablage.stand ?? 0,
    daten: daten?.ablage.daten ?? null,
  }
}

export async function laden(eingabe: Record<string, unknown>) {
  const id = pruefeToken(eingabe.token)
  const daten = await leseDaten(id)
  return { stand: daten?.ablage.stand ?? 0, daten: daten?.ablage.daten ?? null }
}

export async function speichern(eingabe: Record<string, unknown>) {
  const id = pruefeToken(eingabe.token)
  const daten = pruefeDaten(eingabe.daten)
  const bekannt = typeof eingabe.stand === 'number' ? eingabe.stand : 0

  for (let versuch = 0; versuch < 2; versuch++) {
    const jetzt = await leseDaten(id)
    if (jetzt && jetzt.ablage.stand !== bekannt && !eingabe.erzwingen) {
      throw new Abgelehnt(409, 'Auf dem Server liegt ein neuerer Stand.', {
        stand: jetzt.ablage.stand,
        daten: jetzt.ablage.daten,
      })
    }
    const stand = Math.max(Date.now(), (jetzt?.ablage.stand ?? 0) + 1)
    const inhalt: Ablage = { stand, gespeichert: Date.now(), daten }
    try {
      await ablage().schreiben(datenPfad(id), JSON.stringify(inhalt), jetzt?.marke)
      return { stand }
    } catch (fehler) {
      if (!(fehler instanceof KonfliktFehler) || versuch === 1) throw fehler
    }
  }
  throw new Abgelehnt(409, 'Der Stand konnte nicht gesichert werden – bitte noch einmal.')
}

export async function passwortAendern(eingabe: Record<string, unknown>) {
  const id = pruefeToken(eingabe.token)
  const email = pruefeEmail(eingabe.email)
  const altes = pruefePasswort(eingabe.altesPasswort)
  const neues = pruefePasswort(eingabe.neuesPasswort)
  const gefunden = await leseKonto(email)
  if (!gefunden || gefunden.konto.id !== id || !passtPasswort(gefunden.konto, altes)) {
    throw new Abgelehnt(401, 'Das bisherige Passwort stimmt nicht.')
  }
  const salz = b64(randomBytes(16))
  const konto: Konto = { ...gefunden.konto, salz, hash: hashe(neues, salz) }
  await ablage().schreiben(kontoPfad(email), JSON.stringify(konto), gefunden.marke)
  return { ok: true }
}

export function zustand() {
  const s = speicher()
  return { ok: s !== null, speicher: s?.art ?? 'keiner' }
}
