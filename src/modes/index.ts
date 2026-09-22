// Hier werden alle Spielmodi registriert. Ein neuer Modus braucht nur eine Datei
// und eine Zeile hier – danach erscheint er automatisch im Specific Mode, im Random Mode,
// in den Statistiken, in der Mastery und in den Achievements.
import { KURSE } from '../lernen/kurse'
import { kursModus } from '../lernen/quizmodus'
import { flagsMode } from './flags'
import { higherLowerMode } from './higherLower'
import { historyMode } from './history'
import { mapMode } from './map'
import { peopleMode } from './people'
import { registerMode } from './registry'

registerMode(flagsMode)
registerMode(higherLowerMode)
registerMode(historyMode)
registerMode(peopleMode)
registerMode(mapMode)
// Lernwelten: jeder Kurs ist zugleich ein Modus – für Random Mode, Bürger-Bitten und Statistik
for (const kurs of KURSE) registerMode(kursModus(kurs))

export { flagsMode, higherLowerMode, historyMode, mapMode, peopleMode }
