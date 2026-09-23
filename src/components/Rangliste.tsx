import type { RanglisteEintrag } from '../admin'
import { RANKS, rankById } from '../progression'
import { RankCrest } from './RankCrest'

const zahl = (n: number) => n.toLocaleString('de-DE')

/** Die fünf weitesten Spieler: Name, Rangabzeichen, Level, Stadtstufe, Einwohner. */
export function Rangliste({ spieler }: { spieler: RanglisteEintrag[] }) {
  return (
    <ol className="rang-liste">
      {spieler.map((eintrag, index) => {
        const rang = rankById(eintrag.rangId) ?? RANKS[0]
        return (
          <li key={`${eintrag.name}-${index}`} className={index === 0 ? 'rang-zeile is-eins' : 'rang-zeile'}>
            <RankCrest rank={rang} size={46} />
            <div className="rang-name">
              <strong>{eintrag.name}</strong>
              <small>
                Level {eintrag.level} · Stadtstufe {eintrag.stadtLevel}
              </small>
            </div>
            <div className="rang-zahlen">
              <b>{zahl(eintrag.einwohner)}</b>
              <span>Einwohner</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
