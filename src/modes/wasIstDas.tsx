// „Was ist das“: Flaggen, Personen und die gezeichneten Motive in einem Spiel.
import { accuracyOf, modeProgress } from '../progression'
import { pickSubject, recordLearn, gradedMastery } from '../learn'
import { shuffle } from '../quiz'
import type { ModeQuestion, SaveData } from '../types'
import { antwortVon, KATALOG, motivById, motiveDerGruppe, type MotivGruppe } from '../erkennen/katalog'
import { Motiv } from '../erkennen/Motiv'
import { flagsMode } from './flags'
import { peopleMode } from './people'
import type { QuizMode } from './registry'

export const WAS_IST_DAS = 'was-ist-das'

export const WAS_KATEGORIEN = [
  { id: 'zufall', name: 'Zufall', text: 'Alle Kategorien durcheinander' },
  { id: 'flaggen', name: 'Flaggen', text: 'Länder an der Flagge erkennen' },
  { id: 'personen', name: 'Personen', text: 'Gesichter zuordnen' },
  { id: 'autos', name: 'Automarken', text: 'Wessen Zeichen ist das?' },
  { id: 'marken', name: 'Marken', text: 'Zeichen aus dem Alltag' },
  { id: 'orte', name: 'Sehenswürdigkeiten', text: 'Bauwerke der Welt' },
  { id: 'natur', name: 'Tiere & Pflanzen', text: 'Wer oder was ist das?' },
  { id: 'rap', name: 'Deutsche Rapper', text: 'Album-Cover dem Rapper zuordnen' },
] as const

export type WasKategorie = (typeof WAS_KATEGORIEN)[number]['id']

const GRUPPEN: WasKategorie[] = ['flaggen', 'personen', 'autos', 'marken', 'orte', 'natur', 'rap']
const MOTIV_GRUPPEN: MotivGruppe[] = ['autos', 'marken', 'orte', 'natur', 'rap']

const istGruppe = (wert: string): wert is WasKategorie => GRUPPEN.some((gruppe) => gruppe === wert)

export function wasKategorie(mode: string): WasKategorie {
  if (!mode.startsWith(`${WAS_IST_DAS}:`)) return 'zufall'
  const id = mode.slice(WAS_IST_DAS.length + 1)
  return WAS_KATEGORIEN.some((kategorie) => kategorie.id === id) ? (id as WasKategorie) : 'zufall'
}

/** Anzeigename, wenn ein Run auf eine Kategorie festgelegt ist */
export function kategorieTitel(mode: string): string | null {
  const kategorie = wasKategorie(mode)
  if (mode === WAS_IST_DAS || kategorie === 'zufall') return null
  const eintrag = WAS_KATEGORIEN.find((kategorieEintrag) => kategorieEintrag.id === kategorie)
  return eintrag ? `🔎 ${eintrag.name}` : null
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

function flaggenFrage(data: SaveData, recentKeys: readonly string[]): ModeQuestion | null {
  const alt = recentKeys
    .filter((key) => key.startsWith(`${WAS_IST_DAS}:flaggen:`))
    .map((key) => `flaggen:${key.slice(`${WAS_IST_DAS}:flaggen:`.length)}`)
  const frage = flagsMode.nextQuestion(data, alt)
  return frage ? uebernehmen(frage, 'flaggen', 'Was ist das?') : null
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

  const falsch: typeof motive = []
  for (const other of shuffle(motive)) {
    if (falsch.length >= 3) break
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

export function wasFrage(data: SaveData, recentKeys: readonly string[], kategorie: WasKategorie | string): ModeQuestion | null {
  const gruppe = naechsteGruppe(kategorie === 'zufall' || istGruppe(kategorie) ? kategorie : 'zufall', recentKeys)
  if (gruppe === 'flaggen') return flaggenFrage(data, recentKeys)
  if (gruppe === 'personen') return personenFrage(data, recentKeys)
  if (MOTIV_GRUPPEN.includes(gruppe as MotivGruppe)) return motivFrage(gruppe as MotivGruppe, data, recentKeys)
  return null
}

const katalogIds = KATALOG.map((eintrag) => `${eintrag.gruppe}:${eintrag.id}`)

export const wasIstDasMode: QuizMode = {
  id: WAS_IST_DAS,
  name: 'Was ist das',
  emoji: '🔎',
  tagline: 'Flaggen, Personen, Marken, Orte, Tiere und Rapper',

  nextQuestion: (data, recentKeys) => wasFrage(data, recentKeys, 'zufall'),

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
    const bild =
      kategorie === 'flaggen'
        ? flagsMode.renderQuestion(question, null)
        : kategorie === 'personen'
          ? peopleMode.renderQuestion(question, null)
          : (
              <div className="was-buehne" role="img" aria-label="Abbildung">
                <Motiv id={question.data.motiv} />
              </div>
            )
    return (
      <div className="was-frage">
        <p className="was-kicker">{nameVon(kategorie)}</p>
        {bild}
      </div>
    )
  },

  renderFeedback(question, picked) {
    const kategorie = question.data.kategorie
    if (kategorie === 'flaggen') return flagsMode.renderFeedback?.(question, picked) ?? null
    if (kategorie === 'personen') return peopleMode.renderFeedback?.(question, picked) ?? null
    const eintrag = motivById(question.data.motiv)
    if (!eintrag) return null
    return <p className="sheet-hint">{eintrag.hinweis}</p>
  },
}
