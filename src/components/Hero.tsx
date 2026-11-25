import Link from 'next/link'
import { budgetStatus } from '@/lib/budget'
import { formatRinggit } from '@/lib/money'
import { plainAmount } from '@/lib/format'

/** Top panel whose colour follows the budget: green ok, turmeric at 80%, chilli red when over. */
export function Hero({ label, spentSen, budgetSen }: { label: string; spentSen: number; budgetSen: number | null }) {
  const { percent, level } = budgetStatus(spentSen, budgetSen)

  if (level === 'none' || budgetSen === null || percent === null) {
    return (
      <header className="hero none">
        <div className="hero-label">{label} · belanja bulan ini</div>
        <div className="hero-big num"><span className="rm">RM</span>{plainAmount(spentSen)}</div>
        <div className="hero-sub"><Link href="/settings">Tetapkan bajet</Link> untuk lihat baki.</div>
      </header>
    )
  }

  const left = budgetSen - spentSen
  return (
    <header className={`hero ${level}`}>
      <div className="hero-label">{label} · {left >= 0 ? 'baki bulan ini' : 'lebih bajet'}</div>
      <div className="hero-big num"><span className="rm">RM</span>{plainAmount(Math.abs(left))}</div>
      <div className="hero-sub">Dah guna {formatRinggit(spentSen)} daripada {formatRinggit(budgetSen)} ({percent}%)</div>
      <div
        className="hero-bar"
        role="meter"
        aria-label="Bajet digunakan"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(percent, 100)}
        aria-valuetext={`${percent}% bajet digunakan`}
      >
        <i style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </header>
  )
}
