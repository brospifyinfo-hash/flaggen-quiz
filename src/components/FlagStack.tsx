import { Flag } from './Flag'

export function FlagStack({ codes, large = false }: { codes: readonly string[]; large?: boolean }) {
  return (
    <span className={`stack${large ? ' stack-lg' : ''}`} aria-hidden="true">
      {codes.map((code) => (
        <Flag key={code} code={code} />
      ))}
    </span>
  )
}
