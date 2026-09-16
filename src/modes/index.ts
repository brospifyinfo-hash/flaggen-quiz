// Hier werden alle Spielmodi registriert. Ein neuer Modus braucht nur eine Datei
// und eine Zeile hier – danach erscheint er automatisch im Specific Mode, im Random Mode,
// in den Statistiken, in der Mastery und in den Achievements.
import { flagsMode } from './flags'
import { higherLowerMode } from './higherLower'
import { historyMode } from './history'
import { peopleMode } from './people'
import { registerMode } from './registry'

registerMode(flagsMode)
registerMode(higherLowerMode)
registerMode(historyMode)
registerMode(peopleMode)

export { flagsMode, higherLowerMode, historyMode, peopleMode }
