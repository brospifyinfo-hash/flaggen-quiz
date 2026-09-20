// Ein vorgemerktes Gebäude: „Jetzt bauen“ in einer Kurs-Bilanz öffnet die Stadt direkt im
// Platzieren. Liegt nur im Speicher der laufenden App – nach dem Neustart ist nichts vorgemerkt.
let vorgemerkt: string | null = null

export function merkeBau(type: string): void {
  vorgemerkt = type
}

/** Holt das vorgemerkte Gebäude und vergisst es dabei */
export function nimmVorgemerkt(): string | null {
  const type = vorgemerkt
  vorgemerkt = null
  return type
}
