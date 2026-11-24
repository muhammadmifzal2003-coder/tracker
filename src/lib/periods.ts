const KL = 'Asia/Kuala_Lumpur'
const klDate = new Intl.DateTimeFormat('en-CA', { timeZone: KL, year: 'numeric', month: '2-digit', day: '2-digit' })

export type Period = 'day' | 'week' | 'month'

/** Today's date in Kuala Lumpur as YYYY-MM-DD. */
export function todayKL(now: Date): string {
  return klDate.format(now)
}

// Calendar maths on a plain date, done in UTC so no local zone leaks in.
function toUTC(ymd: string): Date {
  return new Date(`${ymd}T00:00:00Z`)
}
function fmt(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000)
}

/** Inclusive YYYY-MM-DD range in KL time. Weeks start on Monday. */
export function periodRange(period: Period, now: Date): { from: string; to: string } {
  const today = toUTC(todayKL(now))
  if (period === 'day') return { from: fmt(today), to: fmt(today) }
  if (period === 'week') {
    const sinceMonday = (today.getUTCDay() + 6) % 7
    const monday = addDays(today, -sinceMonday)
    return { from: fmt(monday), to: fmt(addDays(monday, 6)) }
  }
  const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  const last = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0))
  return { from: fmt(first), to: fmt(last) }
}
