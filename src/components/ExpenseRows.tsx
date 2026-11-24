import type { Expense } from '@/lib/core'
import { marginDate, plainAmount } from '@/lib/format'

export function ExpenseRows({ items, renderAction }: { items: Expense[]; renderAction?: (e: Expense) => React.ReactNode }) {
  return (
    <ul className="plain">
      {items.map((e) => (
        <li key={e.id} className="row exp">
          <span className="m">{marginDate(e.spentOn)}</span>
          <span className="t">
            {renderAction ? renderAction(e) : <>{e.note || e.categoryName}{e.note && <small>{e.categoryName}</small>}</>}
          </span>
          <span className="a strong">{plainAmount(e.amountSen)}</span>
        </li>
      ))}
    </ul>
  )
}
