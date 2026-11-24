import { todayKL } from './periods'

/** "YYYY-MM" moved by delta months. */
export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return d.toISOString().slice(0, 7)
}

/** A valid "YYYY-MM" from a query string, or the current month in KL. */
export function normaliseMonth(input: string | undefined, now: Date): string {
  if (input && /^\d{4}-(0[1-9]|1[0-2])$/.test(input)) return input
  return todayKL(now).slice(0, 7)
}
