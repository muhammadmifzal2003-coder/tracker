import { categoryStyle } from '@/lib/category-style'
import { plainAmount } from '@/lib/format'

/** Spending by category as tinted cards that scroll sideways, largest first. */
export function CategoryBars({ items }: { items: { name: string; totalSen: number }[] }) {
  if (items.length === 0) return <p className="empty">Belum ada belanja bulan ini.</p>
  const sorted = [...items].sort((a, b) => b.totalSen - a.totalSen)
  return (
    <ul className="plain cats" aria-label="Belanja ikut kategori">
      {sorted.map((c) => {
        const s = categoryStyle(c.name)
        return (
          <li key={c.name} className="cat" style={{ '--tint': s.tint } as React.CSSProperties}>
            <div className="ic" aria-hidden>{s.icon}</div>
            <b className="num">{plainAmount(c.totalSen)}</b>
            <small>{c.name}</small>
          </li>
        )
      })}
    </ul>
  )
}
