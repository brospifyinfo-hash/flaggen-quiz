// Achievements der Lernwelten. Sie stehen in derselben Liste wie alle anderen (progression.ts)
// und werden vom selben Prüfer vergeben – hier steht nur, wann sie erreicht sind.
import type { SaveData } from '../types'
import { kursStand } from './fortschritt'
import { kursById } from './kurse'
import { modulWert } from './meisterschaft'
import type { KursStand } from './typen'

export interface KursErfolg {
  id: string
  kurs: string
  emoji: string
  title: string
  text: string
  reached: (data: SaveData) => boolean
}

const gespielt = (stand: KursStand | undefined, ...spiele: string[]) =>
  spiele.reduce((summe, id) => summe + (stand?.spiele[id]?.n ?? 0), 0)

/** Sicher sitzende Inhalte mit diesem ID-Anfang (zuletzt richtig) */
const sicher = (stand: KursStand | undefined, anfang: string) =>
  Object.entries(stand?.items ?? {}).filter(([id, s]) => id.startsWith(anfang) && s.serie >= 1).length

const modul = (data: SaveData, kurs: string, id: string) => {
  const def = kursById(kurs)
  return def ? modulWert(def, kursStand(data, kurs), id) : 0
}

export const KURS_ERFOLGE: KursErfolg[] = [
  // 🇩🇪 Deutsch
  { id: 'de-erste-session', kurs: 'deutsch', emoji: '🇩🇪', title: 'Sprachgefühl', text: 'Deine erste Deutsch-Session', reached: (d) => (kursStand(d, 'deutsch')?.sitzungen ?? 0) >= 1 },
  { id: 'de-woerter-50', kurs: 'deutsch', emoji: '💎', title: 'Wortschatz-Juwelier', text: '50 Expertenwörter sicher', reached: (d) => sicher(kursStand(d, 'deutsch'), 'de.w.') >= 50 },
  { id: 'de-grammatik-100', kurs: 'deutsch', emoji: '⚔️', title: 'Grammatik-Profi', text: '100 Grammatik-Challenges', reached: (d) => gespielt(kursStand(d, 'deutsch'), 'de.detektiv', 'de.duell', 'de.umformung', 'de.architekt') >= 100 },
  { id: 'de-perfekt-20', kurs: 'deutsch', emoji: '🏆', title: 'Makellos', text: '20 perfekte Deutsch-Sessions', reached: (d) => (kursStand(d, 'deutsch')?.perfekt ?? 0) >= 20 },
  { id: 'de-lektor', kurs: 'deutsch', emoji: '📝', title: 'Lektor', text: '10 Texte lektoriert', reached: (d) => gespielt(kursStand(d, 'deutsch'), 'de.lektorat') >= 10 },

  // 🇬🇧 Englisch
  { id: 'en-erstes-gespraech', kurs: 'englisch', emoji: '💬', title: 'First Conversation', text: 'Dein erstes Gespräch auf Englisch', reached: (d) => gespielt(kursStand(d, 'englisch'), 'en.gespraech', 'en.situation') >= 1 },
  { id: 'en-gespraeche-10', kurs: 'englisch', emoji: '🗣️', title: 'Chatterbox', text: '10 Gespräche auf Englisch', reached: (d) => gespielt(kursStand(d, 'englisch'), 'en.gespraech', 'en.situation') >= 10 },
  { id: 'en-smalltalk', kurs: 'englisch', emoji: '☕', title: 'Small Talk Master', text: 'Small Talk zu 80 % sicher', reached: (d) => modul(d, 'englisch', 'en.m7') >= 0.8 },

  // 🇫🇷 Französisch
  { id: 'fr-erstes-gespraech', kurs: 'franzoesisch', emoji: '🥐', title: 'Premier dialogue', text: 'Dein erstes Gespräch auf Französisch', reached: (d) => gespielt(kursStand(d, 'franzoesisch'), 'fr.cafe', 'fr.reise', 'fr.vorstellung') >= 1 },
  { id: 'fr-aussprache', kurs: 'franzoesisch', emoji: '👄', title: 'Aussprache-Entdecker', text: '10 Aussprache-Runden', reached: (d) => gespielt(kursStand(d, 'franzoesisch'), 'fr.aussprache') >= 10 },
  { id: 'fr-reisebereit', kurs: 'franzoesisch', emoji: '🧳', title: 'Prêt à partir', text: 'Unterwegs in Frankreich zu 70 % sicher', reached: (d) => modul(d, 'franzoesisch', 'fr.m6') >= 0.7 },

  // 🏦 Banking
  { id: 'bank-erster-kunde', kurs: 'bank', emoji: '🤝', title: 'Erster Kunde', text: 'Deinen ersten Kunden beraten', reached: (d) => gespielt(kursStand(d, 'bank'), 'bank.kunde') >= 1 },
  { id: 'bank-kreditfall', kurs: 'bank', emoji: '📊', title: 'Kreditfall gelöst', text: 'Einen Kreditfall durchgerechnet', reached: (d) => gespielt(kursStand(d, 'bank'), 'bank.kredit') >= 1 },
  { id: 'bank-grundlagen', kurs: 'bank', emoji: '🏦', title: 'Bank-Grundlagen', text: 'Bankgrundlagen zu 80 % sicher', reached: (d) => modul(d, 'bank', 'bank.m1') >= 0.8 },

  // 💻 IT
  { id: 'it-erster-bug', kurs: 'it', emoji: '🐛', title: 'Erster Bug gefixt', text: 'Deinen ersten Fehler im Code behoben', reached: (d) => gespielt(kursStand(d, 'it'), 'it.debugger') >= 1 },
  { id: 'it-netzwerk', kurs: 'it', emoji: '🌐', title: 'Netzwerk-Troubleshooter', text: '10 Netzwerkprobleme gelöst', reached: (d) => gespielt(kursStand(d, 'it'), 'it.netz') >= 10 },
  { id: 'it-debug-meister', kurs: 'it', emoji: '🧑‍💻', title: 'Debug-Meister', text: '50 Code-Debugger-Runden', reached: (d) => gespielt(kursStand(d, 'it'), 'it.debugger') >= 50 },
]

export const erfolgeVon = (kurs: string) => KURS_ERFOLGE.filter((e) => e.kurs === kurs)
