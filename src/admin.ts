/** Einziges Konto mit Zugang zur Verwaltung. Die Prüfung dagegen passiert auf dem Server. */
export const ADMIN_EMAIL = 'devidkasbeitzer@gmail.com'

export const istAdmin = (email: string | undefined): boolean => (email ?? '').trim().toLowerCase() === ADMIN_EMAIL

/** Was die öffentliche Rangliste zeigt – ohne E-Mail und ohne Spielstand */
export interface RanglisteEintrag {
  name: string
  rangId: string
  level: number
  stadt: string
  stadtLevel: number
  einwohner: number
}

/** Eine Zeile in der Verwaltung: dasselbe plus der volle Stand */
export interface KontoZeile extends RanglisteEintrag {
  email: string
  xp: number
  muenzen: number
  ziegel: number
  gebaeude: number
  schummel: boolean
  stand: number
}
