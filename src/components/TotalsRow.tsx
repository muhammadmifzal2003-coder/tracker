import { formatRinggit } from '@/lib/money'

export function TotalsRow({ today, week, month }: { today: number; week: number; month: number }) {
  return (
    <dl className="stats">
      <div className="stat"><dd className="num">{formatRinggit(today)}</dd><dt>Hari ini</dt></div>
      <div className="stat"><dd className="num">{formatRinggit(week)}</dd><dt>Minggu ini</dt></div>
      <div className="stat"><dd className="num">{formatRinggit(month)}</dd><dt>Bulan ini</dt></div>
    </dl>
  )
}
