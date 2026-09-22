// Die Kurse als Modi in der Registry: So kann der Random Mode zwischen Flaggen, Geschichte
// und einer Mini-Aktivität aus einem Kurs wechseln, und Bürger in der Stadt können um Hilfe
// bei einem Kursspiel bitten. Die Aktivität selbst spielt die gleiche Komponente wie in einer
// Session – nur kürzer.
import { lazy, Suspense } from 'react'
import type { QuizMode } from '../modes/registry'
import type { Judgement, ModeQuestion } from '../types'
import { GESCHAFFT_AB, modusVon, wertung, xpFuer } from './belohnung'
import { kursStand, lernen } from './fortschritt'
import { kursById, spielById } from './kurse'
import { bandVon, kursStufe, kursWert } from './meisterschaft'
import { einzelneAktivitaet } from './planer'
import { umfangVon, wendeErgebnisAn } from './sitzung'
import { STUFE_NAME, type Aktivitaet, type AktivitaetsErgebnis, type KursDef } from './typen'
import { neuerSamen } from './zufall'

const AktivitaetImRun = lazy(() => import('./ui/AktivitaetImRun'))

/** Eine Aktivität als Frage verpacken – speicherbar wie jede andere Frage */
export function frageAus(akt: Aktivitaet): ModeQuestion {
  const spiel = spielById(akt.spiel)
  const erstes = akt.items[0]
  const erstesId = typeof erstes === 'string' ? erstes : erstes.id
  return {
    modeId: modusVon(akt.kurs),
    key: `${akt.spiel}:${erstesId}`,
    prompt: spiel?.anleitung ?? '',
    data: { kurs: akt.kurs, spiel: akt.spiel },
    options: [],
    correctId: '',
    input: { kind: 'aktivitaet', daten: JSON.stringify(akt) },
  }
}

/** Die Aktivität aus einer gespeicherten Frage – null, wenn etwas nicht passt */
export function aktivitaetAus(question: ModeQuestion): Aktivitaet | null {
  if (question.input?.kind !== 'aktivitaet') return null
  try {
    const akt = JSON.parse(question.input.daten) as Aktivitaet
    if (!akt || typeof akt.kurs !== 'string' || typeof akt.spiel !== 'string' || !Array.isArray(akt.items)) return null
    if (!kursById(akt.kurs) || !spielById(akt.spiel)) return null
    return akt
  } catch {
    return null
  }
}

export function ergebnisAus(antwort: string): AktivitaetsErgebnis | null {
  try {
    const e = JSON.parse(antwort) as AktivitaetsErgebnis
    if (!e || typeof e.punkte !== 'number' || !Array.isArray(e.runden)) return null
    return { punkte: Math.max(0, Math.min(1, e.punkte)), runden: e.runden, ...(e.uebersprungen ? { uebersprungen: true } : {}) }
  } catch {
    return null
  }
}

export function kursModus(kurs: KursDef): QuizMode {
  return {
    id: modusVon(kurs.id),
    name: kurs.titel,
    emoji: kurs.emoji,
    tagline: kurs.claim,
    gewicht: 0.3,
    lernwelt: kurs.id,
    zaehlt: (data) => (kursStand(data, kurs.id)?.aktivitaeten ?? 0) > 0,

    nextQuestion: (data) => {
      const akt = einzelneAktivitaet(kurs, kursStand(data, kurs.id), neuerSamen(), {
        verlauf: lernen(data).verlauf,
        kurz: true,
      })
      return akt ? frageAus(akt) : null
    },

    judge: (question, picked, combo): Judgement => {
      const akt = aktivitaetAus(question)
      const e = ergebnisAus(picked)
      if (!akt || !e) return { correct: false, xp: 0, headline: 'Das hat nicht geklappt' }
      if (e.uebersprungen) return { correct: false, xp: 0, headline: 'Übersprungen' }
      return { correct: e.punkte >= GESCHAFFT_AB, xp: xpFuer(e.punkte, akt.stufe, combo, umfangVon(akt)), headline: wertung(e.punkte).titel }
    },

    recordAnswer: (data, question, picked, _correct, now) => {
      const akt = aktivitaetAus(question)
      const e = ergebnisAus(picked)
      return akt && e && !e.uebersprungen ? wendeErgebnisAn(data, akt, e, 0, now, { statistik: false }) : data
    },

    mastery: (data) => kursWert(kurs, kursStand(data, kurs.id)),

    summary: (data) => {
      const stand = kursStand(data, kurs.id)
      return [
        { label: 'Stufe', value: STUFE_NAME[kursStufe(kurs, stand)] },
        { label: 'Sessions', value: String(stand?.sitzungen ?? 0) },
        { label: 'Stand', value: bandVon(kursWert(kurs, stand)).name },
      ]
    },

    renderQuestion: (question) => {
      const akt = aktivitaetAus(question)
      const spiel = akt ? spielById(akt.spiel) : undefined
      if (!akt || !spiel) return null
      return (
        <div className={`lern-kopf ${kurs.thema}`}>
          <span className="lern-kopf-emoji" aria-hidden="true">
            {spiel.emoji}
          </span>
          <span className="lern-kopf-text">
            <small>
              {kurs.emoji} {kurs.titel} · {STUFE_NAME[akt.stufe]}
            </small>
            <strong>{spiel.name}</strong>
          </span>
        </div>
      )
    },

    renderInput: (question, picked, submit) => {
      if (question.input?.kind !== 'aktivitaet') return null
      return (
        <Suspense fallback={<p className="lern-laedt">Lädt …</p>}>
          <AktivitaetImRun key={question.input.daten.length + question.key} daten={question.input.daten} picked={picked} onFertig={(e) => submit(JSON.stringify(e))} />
        </Suspense>
      )
    },

    renderFeedback: (_question, picked) => {
      const e = ergebnisAus(picked)
      if (!e || e.runden.length === 0) return null
      const richtig = e.runden.filter((r) => r.punkte >= GESCHAFFT_AB).length
      return (
        <p className="sheet-hint">
          {richtig} von {e.runden.length} {e.runden.length === 1 ? 'Aufgabe' : 'Aufgaben'} gelöst · {Math.round(e.punkte * 100)} %
        </p>
      )
    },
  }
}
