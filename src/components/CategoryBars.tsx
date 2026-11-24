import { plainAmount } from '@/lib/format'
import { groupCategories } from '@/lib/group'

/** Spending by category as ledger rows with a bar (spec: chart by category). */
export function CategoryBars({ items }: { items: { name: string; totalSen: number }[] }) {
  if (items.length === 0) {
    return <div className="row"><span className="m" /><span className="t soft">Belum ada belanja bulan ini.</span><span /></div>
  }
  const rows = groupCategories(items)
  const max = Math.max(...rows.map((r) => r.totalSen))
  return (
    <ul className="plain">
      {rows.map((r) => (
        <li key={r.name} className="row cat">
          <span className="m" />
          <span className="t">
            <span className="cat-name">{r.name}</span>
            <span className="cat-track" aria-hidden>
              <span className="cat-bar" style={{ width: `${Math.max(4, (r.totalSen / max) * 100)}%` }} />
            </span>
          </span>
          <span className="a">{plainAmount(r.totalSen)}</span>
        </li>
      ))}
    </ul>
  )
}
