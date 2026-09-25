// „Was ist das“: Flaggen, Personen und Fotos in einem Spiel.
import { useState } from 'react'
import { accuracyOf, modeProgress, xpForAnswer } from '../progression'
import { pickSubject, recordLearn, gradedMastery } from '../learn'
import { CONTINENTS, COUNTRIES, type ContinentId } from '../data/countries'
import { PEOPLE } from '../data/people'
import { codesOf, countryName, makeQuestion, pickCountryForRun, shuffle } from '../quiz'
import type { ModeQuestion, SaveData } from '../types'
import { bildVon } from '../erkennen/bilder'
import { antwortVon, KATALOG, motivById, motiveDerGruppe, type MotivGruppe } from '../erkennen/katalog'
import { Motiv } from '../erkennen/Motiv'
import { normTipp, tippPasst } from '../erkennen/tipp'
import { flagsMode } from './flags'
import { peopleMode } from './people'
import type { QuizMode } from './registry'

export const WAS_IST_DAS = 'was-ist-das'

export const WAS_KATEGORIEN = [
  { id: 'zufall', name: 'Zufall', text: 'Alle Kategorien durcheinander' },
  { id: 'flaggen', name: 'Flaggen', text: 'Länder an der Flagge erkennen' },
  { id: 'personen', name: 'Personen', text: 'Gesichter zuordnen' },
  { id: 'autos', name: 'Automarken', text: 'Welche Marke ist das?' },
  { id: 'marken', name: 'Marken', text: 'Welche Marke ist das?' },
  { id: 'orte', name: 'Sehenswürdigkeiten', text: 'Bauwerke der Welt' },
  { id: 'natur', name: 'Tiere & Pflanzen', text: 'Wer oder was ist das?' },
  { id: 'rap', name: 'Deutsche Rapper', text: 'Welcher Rapper ist das?' },
] as const

export type WasKategorie = (typeof WAS_KATEGORIEN)[number]['id']

const GRUPPEN: WasKategorie[] = ['flaggen', 'personen', 'autos', 'marken', 'orte', 'natur', 'rap']
const MOTIV_GRUPPEN: MotivGruppe[] = ['autos', 'marken', 'orte', 'natur', 'rap']

const istGruppe = (wert: string): wert is WasKategorie => GRUPPEN.some((gruppe) => gruppe === wert)

export type WasStufe = 'easy' | 'hard'

const ohneStufe = (mode: string) => mode.replace(/:(easy|hard)$/, '')

/** Leicht oder schwer, wenn der Run darauf festgelegt ist */
export function wasStufe(mode: string): WasStufe | null {
  if (mode.endsWith(':hard')) return 'hard'
  if (mode.endsWith(':easy')) return 'easy'
  return null
}

export function wasKategorie(mode: string): WasKategorie {
  const basis = ohneStufe(mode)
  if (!basis.startsWith(`${WAS_IST_DAS}:`)) return 'zufall'
  const id = basis.slice(WAS_IST_DAS.length + 1).split(':')[0]
  return WAS_KATEGORIEN.some((kategorie) => kategorie.id === id) ? (id as WasKategorie) : 'zufall'
}

/** Kontinent, wenn der Flaggen-Run darauf festgelegt ist, z. B. was-ist-das:flaggen:europa */
export function flaggenKontinent(mode: string): ContinentId | null {
  const basis = ohneStufe(mode)
  if (!basis.startsWith(`${WAS_IST_DAS}:flaggen:`)) return null
  const id = basis.slice(`${WAS_IST_DAS}:flaggen:`.length)
  return CONTINENTS.some((kontinent) => kontinent.id === id) ? (id as ContinentId) : null
}

/** Anzeigename, wenn ein Run auf eine Kategorie festgelegt ist */
export function kategorieTitel(mode: string): string | null {
  const stufe = wasStufe(mode)
  const zusatz = stufe === 'easy' ? ' · Leicht' : stufe === 'hard' ? ' · Schwer' : ''
  const kontinent = flaggenKontinent(mode)
  if (kontinent) {
    const name = CONTINENTS.find((eintrag) => eintrag.id === kontinent)?.name
    return `${name ? `🔎 Flaggen · ${name}` : '🔎 Flaggen'}${zusatz}`
  }
  const kategorie = wasKategorie(mode)
  if ((ohneStufe(mode) === WAS_IST_DAS || kategorie === 'zufall') && !zusatz) return null
  if (kategorie === 'zufall') return `🔎 Was ist das${zusatz}`
  const eintrag = WAS_KATEGORIEN.find((kategorieEintrag) => kategorieEintrag.id === kategorie)
  return eintrag ? `🔎 ${eintrag.name}${zusatz}` : null
}

const nameVon = (id: string) => WAS_KATEGORIEN.find((kategorie) => kategorie.id === id)?.name ?? 'Was ist das'

/** Fach für die Stadt: Geografie, Menschen oder Kultur */
export function wissensModus(question: { modeId: string; data?: Record<string, string> }): string {
  if (question.modeId !== WAS_IST_DAS) return question.modeId
  const kategorie = question.data?.kategorie
  if (kategorie === 'flaggen' || kategorie === 'orte') return 'flaggen'
  if (kategorie === 'personen') return 'personen'
  return 'was-kultur'
}

function naechsteGruppe(kategorie: WasKategorie, recentKeys: readonly string[]): WasKategorie {
  if (kategorie !== 'zufall' && istGruppe(kategorie)) return kategorie
  const letzte = recentKeys.map((key) => key.split(':')[1]).find((gruppe): gruppe is WasKategorie => !!gruppe && istGruppe(gruppe))
  const pool = GRUPPEN.filter((gruppe) => gruppe !== letzte)
  const liste = pool.length > 0 ? pool : GRUPPEN
  return liste[Math.floor(Math.random() * liste.length)]
}

function uebernehmen(frage: ModeQuestion, kategorie: string, prompt: string): ModeQuestion {
  return {
    ...frage,
    modeId: WAS_IST_DAS,
    key: `${WAS_IST_DAS}:${frage.key}`,
    prompt,
    data: { ...frage.data, kategorie },
  }
}

function flaggenFrage(data: SaveData, recentKeys: readonly string[], kontinent: ContinentId | null): ModeQuestion | null {
  const kuerzel = recentKeys
    .filter((key) => key.startsWith(`${WAS_IST_DAS}:flaggen:`))
    .map((key) => key.slice(`${WAS_IST_DAS}:flaggen:`.length))
  if (!kontinent) {
    const frage = flagsMode.nextQuestion(
      data,
      kuerzel.map((code) => `flaggen:${code}`),
    )
    return frage ? uebernehmen(frage, 'flaggen', 'Was ist das?') : null
  }
  const code = pickCountryForRun(data, kuerzel, codesOf(kontinent))
  if (!code) return null
  const frage = makeQuestion(code, kontinent)
  return {
    modeId: WAS_IST_DAS,
    key: `${WAS_IST_DAS}:flaggen:${code}`,
    prompt: 'Was ist das?',
    data: { code, kategorie: 'flaggen' },
    options: frage.options.map((option) => ({ id: option, label: countryName(option) })),
    correctId: code,
  }
}

function personenFrage(data: SaveData, recentKeys: readonly string[]): ModeQuestion | null {
  const alt = recentKeys
    .filter((key) => key.startsWith(`${WAS_IST_DAS}:personen:`))
    .map((key) => `personen:${key.slice(`${WAS_IST_DAS}:personen:`.length)}`)
  const frage = peopleMode.nextQuestion(data, alt)
  return frage ? uebernehmen(frage, 'personen', 'Wer ist das?') : null
}

function motivFrage(gruppe: MotivGruppe, data: SaveData, recentKeys: readonly string[]): ModeQuestion | null {
  const motive = motiveDerGruppe(gruppe)
  const subjects = motive.map((eintrag) => `${gruppe}:${eintrag.id}`)
  const recent = recentKeys
    .filter((key) => key.startsWith(`${WAS_IST_DAS}:${gruppe}:`))
    .map((key) => `${gruppe}:${key.slice(`${WAS_IST_DAS}:${gruppe}:`.length)}`)
  const subject = pickSubject(subjects, data, WAS_IST_DAS, recent)
  const eintrag = subject ? motivById(subject.slice(gruppe.length + 1)) : null
  if (!eintrag) return null

  const falschZiel = motive.length > 16 ? 5 : 3
  const falsch: typeof motive = []
  for (const other of shuffle(motive)) {
    if (falsch.length >= falschZiel) break
    if (other.id === eintrag.id) continue
    if (antwortVon(other) === antwortVon(eintrag)) continue
    if (falsch.some((haben) => antwortVon(haben) === antwortVon(other))) continue
    falsch.push(other)
  }

  return {
    modeId: WAS_IST_DAS,
    key: `${WAS_IST_DAS}:${gruppe}:${eintrag.id}`,
    prompt: gruppe === 'rap' ? 'Welcher Rapper?' : 'Was ist das?',
    data: { kategorie: gruppe, motiv: eintrag.id },
    options: shuffle([eintrag, ...falsch]).map((option) => ({ id: antwortVon(option), label: option.name })),
    correctId: antwortVon(eintrag),
  }
}

function loesungVon(frage: ModeQuestion): string {
  if (frage.data.kategorie === 'flaggen') return countryName(frage.data.code)
  if (frage.data.kategorie === 'personen') return PEOPLE.find((person) => person.id === frage.data.person)?.name ?? ''
  return motivById(frage.data.motiv)?.name ?? ''
}

function andereNamen(frage: ModeQuestion, name: string): string[] {
  const kategorie = frage.data.kategorie
  if (kategorie === 'flaggen') return COUNTRIES.map((land) => land.name).filter((land) => land !== name)
  if (kategorie === 'personen') return PEOPLE.map((person) => person.name).filter((person) => person !== name)
  if (MOTIV_GRUPPEN.includes(kategorie as MotivGruppe)) {
    return motiveDerGruppe(kategorie as MotivGruppe)
      .map((eintrag) => eintrag.name)
      .filter((eintrag) => eintrag !== name)
  }
  return []
}

function mitStufe(frage: ModeQuestion | null, stufe: WasStufe | null): ModeQuestion | null {
  if (!frage || !stufe) return frage
  const name = loesungVon(frage)
  if (stufe === 'easy') return { ...frage, data: { ...frage.data, stufe, name } }
  return { ...frage, data: { ...frage.data, stufe, name }, options: [], input: { kind: 'text' } }
}

export function wasFrage(
  data: SaveData,
  recentKeys: readonly string[],
  kategorie: WasKategorie | string,
  kontinent: ContinentId | null = null,
  stufe: WasStufe | null = null,
): ModeQuestion | null {
  const gruppe = naechsteGruppe(kategorie === 'zufall' || istGruppe(kategorie) ? kategorie : 'zufall', recentKeys)
  const frage =
    gruppe === 'flaggen'
      ? flaggenFrage(data, recentKeys, kategorie === 'flaggen' ? kontinent : null)
      : gruppe === 'personen'
        ? personenFrage(data, recentKeys)
        : MOTIV_GRUPPEN.includes(gruppe as MotivGruppe)
          ? motivFrage(gruppe as MotivGruppe, data, recentKeys)
          : null
  return mitStufe(frage, stufe)
}

const katalogIds = KATALOG.map((eintrag) => `${eintrag.gruppe}:${eintrag.id}`)

export const wasIstDasMode: QuizMode = {
  id: WAS_IST_DAS,
  name: 'Was ist das',
  emoji: '🔎',
  tagline: 'Flaggen, Personen, Marken, Orte, Tiere und Rapper',

  nextQuestion: (data, recentKeys) => wasFrage(data, recentKeys, 'zufall', null, null),

  judge(question, picked, combo) {
    if (question.input?.kind === 'text') {
      const name = question.data.name
      const richtig = tippPasst(picked, name, andereNamen(question, name))
      const exakt = normTipp(picked) === normTipp(name)
      return {
        correct: richtig,
        xp: richtig ? xpForAnswer(combo) : 0,
        headline: richtig ? (exakt ? 'Richtig!' : 'Knapp!') : 'Leider falsch',
      }
    }
    const richtig = picked === question.correctId
    if (question.data.stufe === 'easy') {
      return { correct: richtig, xp: richtig ? 1 : 0, headline: richtig ? 'Richtig!' : 'Leider falsch' }
    }
    return { correct: richtig, xp: richtig ? xpForAnswer(combo) : 0, headline: richtig ? 'Richtig!' : 'Leider falsch' }
  },

  recordAnswer(data, question, picked, correct, now) {
    const kategorie = question.data.kategorie
    if (kategorie === 'flaggen') return flagsMode.recordAnswer?.(data, question, picked, correct, now) ?? data
    if (kategorie === 'personen') return peopleMode.recordAnswer?.(data, question, picked, correct, now) ?? data
    const motiv = question.data.motiv
    if (!motiv) return data
    return recordLearn(data, WAS_IST_DAS, `${kategorie}:${motiv}`, correct, now)
  },

  mastery: (data) => (flagsMode.mastery(data) + peopleMode.mastery(data) + gradedMastery(data, WAS_IST_DAS, katalogIds)) / 3,

  summary(data) {
    const progress = modeProgress(data, WAS_IST_DAS)
    return [
      { label: 'Kategorien', value: `${GRUPPEN.length}` },
      { label: 'Beste Combo', value: `${progress.bestCombo}` },
      { label: 'Fragen', value: `${progress.answered}` },
      { label: 'Trefferquote', value: progress.answered > 0 ? `${Math.round(accuracyOf(progress) * 100)} %` : '–' },
    ]
  },

  renderQuestion(question) {
    const kategorie = question.data.kategorie
    const foto = bildVon(question.data.motiv)
    const bild =
      kategorie === 'flaggen'
        ? flagsMode.renderQuestion(question, null)
        : kategorie === 'personen'
          ? peopleMode.renderQuestion(question, null)
          : (
              <div className="was-buehne" role="img" aria-label="Abbildung">
                <Motiv id={question.data.motiv} />
                {foto && <p className="credit">Foto: {foto.urheber} · {foto.lizenz}</p>}
              </div>
            )
    return (
      <div className="was-frage">
        <p className="was-kicker">
          {nameVon(kategorie)}
          {question.data.stufe === 'easy' ? ' · Leicht' : question.data.stufe === 'hard' ? ' · Schwer' : ''}
        </p>
        {bild}
      </div>
    )
  },

  renderInput: (question, picked, submit) =>
    question.input?.kind === 'text' && picked === null ? <TippFeld onSubmit={submit} /> : null,

  renderFeedback(question, picked) {
    const kategorie = question.data.kategorie
    const knapp =
      question.input?.kind === 'text' &&
      question.data.name &&
      normTipp(picked) !== normTipp(question.data.name) &&
      tippPasst(picked, question.data.name, [])
    const hinweis =
      kategorie === 'flaggen'
        ? question.input?.kind === 'text'
          ? null
          : (flagsMode.renderFeedback?.(question, picked) ?? null)
        : kategorie === 'personen'
          ? (peopleMode.renderFeedback?.(question, picked) ?? null)
          : motivById(question.data.motiv)?.hinweis
    return (
      <>
        {knapp && (
          <p className="sheet-text">
            Gemeint ist <strong>{question.data.name}</strong>
          </p>
        )}
        {typeof hinweis === 'string' ? <p className="sheet-hint">{hinweis}</p> : hinweis}
      </>
    )
  },
}

function TippFeld({ onSubmit }: { onSubmit: (answer: string) => void }) {
  const [text, setText] = useState('')
  return (
    <form
      className="was-tipp"
      onSubmit={(event) => {
        event.preventDefault()
        const wert = text.trim()
        if (wert) onSubmit(wert)
      }}
    >
      <input
        autoFocus
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        maxLength={80}
        placeholder="Antwort eintippen"
        aria-label="Antwort"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <button className="btn btn-primary" type="submit" disabled={!text.trim()}>
        Prüfen
      </button>
    </form>
  )
}
