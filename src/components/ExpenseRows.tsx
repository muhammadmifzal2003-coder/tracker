import type { Category, Expense } from '@/lib/core'
import { categoryStyle } from '@/lib/category-style'
import { plainAmount, relativeDay } from '@/lib/format'
import { ExpenseSheet } from './ExpenseSheet'

function RowContent({ e, today }: { e: Expense; today: string }) {
  const s = categoryStyle(e.categoryName)
  return (
    <>
      <span className="icon-box" style={{ '--tint': s.tint } as React.CSSProperties} aria-hidden>{s.icon}</span>
      <span className="item-main">
        <span>{e.note || e.categoryName}</span>
        <small>{relativeDay(e.spentOn, today)} · {e.categoryName}</small>
      </span>
      <span className="item-amt num">-{plainAmount(e.amountSen)}</span>
    </>
  )
}

/** Expense rows; with `categories`, each row opens the edit sheet. */
export function ExpenseRows({ items, today, categories }: { items: Expense[]; today: string; categories?: Category[] }) {
  return (
    <ul className="plain card list">
      {items.map((e) => (
        <li key={e.id}>
          {categories ? (
            <ExpenseSheet
              categories={categories}
              expense={e}
              triggerClassName="item"
              triggerLabel={`Ubah ${e.note || e.categoryName}, RM${plainAmount(e.amountSen)}`}
              trigger={<RowContent e={e} today={today} />}
            />
          ) : (
            <div className="item"><RowContent e={e} today={today} /></div>
          )}
        </li>
      ))}
    </ul>
  )
}
