// Aussprache: Französisch schreibt anders, als es klingt. Hier geht es nur um den Klang –
// entweder man sieht ein Wort und wählt, wie es gesprochen wird, oder man hört eines und
// findet es unter ähnlich klingenden wieder. Nach der Antwort steht die Lautschrift da.
import { useEffect, useMemo, useState } from 'react'
import { beiStimmen, hatStimme, kannSprechen, sprich } from '../../sprache'
import type { AusspracheItem, RundenErgebnis } from '../../typen'
import { ableiten, mische, zufall } from '../../zufall'
import { Erklaerung, Rueckmeldung, Rundenpunkte, rueckmeldung, useEinmal, type MechanikProps } from '../gemeinsam'

export function Aussprache({ items, seed, onFertig }: MechanikProps<AusspracheItem>) {
  const fertig = useEinmal(onFertig)
  const [runde, setRunde] = useState(0)
  const [ergebnisse, setErgebnisse] = useState<RundenErgebnis[]>([])
  const item = items[runde]

  const weiter = (e: RundenErgebnis) => {
    const alle = [...ergebnisse, e]
    setErgebnisse(alle)
    if (runde + 1 < items.length) setRunde(runde + 1)
    else fertig({ punkte: alle.reduce((s, x) => s + x.punkte, 0) / alle.length, runden: alle })
  }

  return (
    <div className="lw-spiel lw-aussprache">
      <Rundenpunkte gesamt={items.length} ergebnisse={ergebnisse.map((e) => e.punkte)} aktuell={runde} />
      <AusspracheRunde key={item.id} item={item} seed={ableiten(seed, runde)} onFertig={weiter} />
    </div>
  )
}

function AusspracheRunde({ item, seed, onFertig }: { item: AusspracheItem; seed: number; onFertig: (e: RundenErgebnis) => void }) {
  // Im Hörmodus sucht man das gehörte Wort, sonst die richtige Umschrift
  const hoermodus = item.modus === 'hoeren' && (item.aehnlich?.length ?? 0) > 0
  const richtig = hoermodus ? item.wort : item.hilfe
  const auswahl = useMemo(
    () => mische(zufall(seed), [richtig, ...(hoermodus ? (item.aehnlich ?? []) : item.falsch)]),
    [item, seed, hoermodus, richtig],
  )
  const [gewaehlt, setGewaehlt] = useState<string | null>(null)
  const [stimme, setStimme] = useState(() => kannSprechen() && hatStimme(item.sprache))
  const [gehoert, setGehoert] = useState(0)

  useEffect(() => beiStimmen(() => setStimme(kannSprechen() && hatStimme(item.sprache))), [item.sprache])

  // Im Hörmodus einmal von selbst vorlesen – sonst erst auf Wunsch
  useEffect(() => {
    if (!hoermodus || !stimme) return
    const t = window.setTimeout(() => {
      sprich(item.wort, item.sprache)
      setGehoert((n) => n + 1)
    }, 350)
    return () => window.clearTimeout(t)
  }, [item, stimme, hoermodus])

  const hoeren = (langsam: boolean) => {
    sprich(item.wort, item.sprache, { langsam })
    setGehoert((n) => n + 1)
    rueckmeldung.tipp()
  }

  const waehle = (o: string) => {
    if (gewaehlt) return
    setGewaehlt(o)
    if (o === richtig) rueckmeldung.richtig()
    else rueckmeldung.falsch()
  }

  const punkte = gewaehlt === richtig ? 1 : 0

  return (
    <>
      {item.kontext && <p className="lw-etikett">{item.kontext}</p>}

      {hoermodus && !stimme && (
        <p className="lw-hinweis">Dein Gerät hat keine französische Stimme – hier steht das Wort.</p>
      )}

      <div className="lw-wortkarte">
        {hoermodus && stimme && !gewaehlt ? (
          <p className="lw-wort is-verdeckt" aria-label="verdecktes Wort">
            ？
          </p>
        ) : (
          <p className="lw-wort" lang="fr">
            {item.wort}
          </p>
        )}
        {(!hoermodus || gewaehlt) && <p className="lw-bedeutung">{item.bedeutung}</p>}
        {gewaehlt && <p className="lw-ipa">[{item.ipa}]</p>}
        {stimme && (
          <div className="lw-hoerzeile">
            <button className="lw-hoerknopf" onClick={() => hoeren(false)} aria-label="Anhören">
              🔊
            </button>
            <button className="lw-hoerknopf is-klein" onClick={() => hoeren(true)} aria-label="Langsam anhören">
              🐢
            </button>
            {gehoert > 0 && <small>{gehoert}× gehört</small>}
          </div>
        )}
      </div>

      <p className="lw-aufgabe">{hoermodus ? 'Welches Wort hast du gehört?' : 'Wie klingt das?'}</p>

      <div className="options lw-optionen lw-lautliste">
        {auswahl.map((o) => {
          const zustand = !gewaehlt ? '' : o === richtig ? ' is-correct' : o === gewaehlt ? ' is-wrong' : ' is-dim'
          return (
            <button key={o} className={`option lw-option${zustand}`} aria-disabled={gewaehlt !== null} onClick={() => waehle(o)}>
              <span lang={hoermodus ? 'fr' : undefined}>{hoermodus ? o : `„${o}“`}</span>
            </button>
          )
        })}
      </div>

      {gewaehlt && (
        <Rueckmeldung
          gut={punkte === 1}
          titel={punkte === 1 ? '✓ Genau so klingt es' : 'Klingt anders'}
          weiter={() => onFertig({ id: item.id, ziel: item.ziel, stufe: item.stufe, punkte })}
        >
          <p className="lw-loesung" lang="fr">
            {item.wort}
            <small className="lw-uebersetzung">
              [{item.ipa}] · ungefähr „{item.hilfe}“ · {item.bedeutung}
            </small>
          </p>
          <Erklaerung text={item.tipp} mehr={item.mehr ?? item.erklaerung} />
        </Rueckmeldung>
      )}
    </>
  )
}
