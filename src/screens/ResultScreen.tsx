import { useEffect } from 'react'
import { Confetti } from '../components/Confetti'
import { Flag } from '../components/Flag'
import { ProgressRing } from '../components/ProgressRing'
import { countryName, discardSession, getContinent, nextContinent, startSession } from '../quiz'
import { goBack, navigate } from '../router'
import { haptic } from '../haptics'
import { setState } from '../store'
import type { Mode, RoundResult } from '../types'

export function ResultScreen({ result }: { result: RoundResult }) {
  const { continent: id, mode, total, correct, passed } = result
  const continent = getContinent(id)
  const unlocked = result.unlockedContinent ? getContinent(result.unlockedContinent) : null
  const mistakes = [...new Map(result.mistakes.map((mistake) => [mistake.code, mistake])).values()]
  const share = correct / total
  const [emoji, title, subtitle] = headline(result, continent.name, share)

  useEffect(() => {
    haptic(passed || share === 1 ? 'celebrate' : 'soft')
  }, [passed, share])

  const play = (nextMode: Mode) => {
    haptic('soft')
    setState((data) => startSession(discardSession(data, id, nextMode), id, nextMode))
    navigate({ name: 'quiz', id, mode: nextMode }, { replace: true })
  }
  const overview = () => goBack({ name: 'continent', id })

  return (
    <main className="screen result">
      {passed && <Confetti />}

      <section className="result-hero">
        <div className="result-emoji" aria-hidden="true">
          {emoji}
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </section>

      <section className="score">
        <ProgressRing value={share} size={76} stroke={9} color={share === 1 ? 'var(--good)' : 'var(--primary)'}>
          {Math.round(share * 100)}%
        </ProgressRing>
        <div className="score-text">
          <strong>
            {correct} von {total}
          </strong>
          <span>{mode === 'practice' ? 'beim ersten Versuch richtig' : 'richtig beantwortet'}</span>
        </div>
      </section>

      {result.testUnlocked && (
        <Unlock title="Abschlusstest freigeschaltet!" text={`Du hattest jede Flagge von ${continent.name} einmal.`} />
      )}
      {unlocked && (
        <Unlock title={`${unlocked.name} ist freigeschaltet!`} text={`Als Nächstes warten die Flaggen von ${unlocked.name}.`} />
      )}

      <div className="actions">
        {mode === 'practice' ? (
          result.testUnlocked ? (
            <>
              <button className="btn btn-test" onClick={() => play('test')}>
                Zum Abschlusstest
              </button>
              <button className="btn btn-secondary" onClick={() => play('practice')}>
                Weiter üben
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => play('practice')}>
              Nächste Runde
            </button>
          )
        ) : passed ? (
          unlocked ? (
            <button
              className="btn btn-primary"
              onClick={() => navigate({ name: 'continent', id: unlocked.id }, { replace: true })}
            >
              Weiter zu {unlocked.name}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={overview}>
              Zur Übersicht
            </button>
          )
        ) : (
          <>
            <button className="btn btn-test" onClick={() => play('test')}>
              Test wiederholen
            </button>
            <button className="btn btn-secondary" onClick={() => play('practice')}>
              Erst noch üben
            </button>
          </>
        )}
        {!(mode === 'test' && passed && !unlocked) && (
          <button className="btn btn-ghost" onClick={overview}>
            Zur Übersicht
          </button>
        )}
      </div>

      {mistakes.length > 0 && (
        <section>
          <h2 className="section-title">Diese Flaggen solltest du dir merken</h2>
          <ul className="mistakes">
            {mistakes.map((mistake) => (
              <li key={mistake.code} className="mistake">
                <span className="mistake-flag">
                  <Flag code={mistake.code} />
                </span>
                <span className="mistake-text">
                  <strong>{countryName(mistake.code)}</strong>
                  <span>getippt: {countryName(mistake.picked)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

function headline(result: RoundResult, continentName: string, share: number): [string, string, string] {
  if (result.mode === 'practice') {
    const subtitle = `${continentName} · Übungsrunde`
    if (share === 1) return ['🌟', 'Perfekte Runde!', subtitle]
    return [share >= 0.7 ? '🎉' : '💪', 'Runde geschafft!', subtitle]
  }
  if (result.passed) {
    return nextContinent(result.continent)
      ? ['🏆', 'Test bestanden!', `${continentName} · Abschlusstest`]
      : ['🌍', 'Alle Kontinente gemeistert!', 'Du kennst jetzt alle Flaggen der Welt.']
  }
  const subtitle = 'Zum Freischalten brauchst du alle richtig.'
  return share >= 0.9 ? ['😤', 'Knapp daneben!', subtitle] : ['📚', 'Weiter üben!', subtitle]
}

function Unlock({ title, text }: { title: string; text: string }) {
  return (
    <section className="unlock">
      <span className="unlock-emoji" aria-hidden="true">
        🔓
      </span>
      <div className="unlock-text">
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </section>
  )
}
