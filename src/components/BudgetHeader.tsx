import Link from 'next/link'
import { budgetStatus, WARN_AT } from '@/lib/budget'
import { formatRinggit } from '@/lib/money'
import { plainAmount } from '@/lib/format'

/** The big "Baki" number and the budget bar (spec §5 Screens). */
export function BudgetHeader({ spentSen, budgetSen }: { spentSen: number; budgetSen: number | null }) {
  const { percent, level } = budgetStatus(spentSen, budgetSen)

  if (level === 'none' || budgetSen === null || percent === null) {
    return (
      <>
        <div className="baki"><span /><div className="t">
          <div className="soft">Belanja bulan ini</div>
          <div className="baki-num num"><span className="rm">RM</span>{plainAmount(spentSen)}</div>
        </div></div>
        <div className="row"><span className="m" /><span className="t"><Link href="/settings">Tetapkan bajet</Link> untuk lihat baki.</span><span /></div>
      </>
    )
  }

  const left = budgetSen - spentSen
  return (
    <>
      <div className="baki"><span /><div className="t">
        <div className="soft">{left >= 0 ? 'Baki bulan ini' : 'Lebih bajet'}</div>
        <div className={`baki-num num ${left < 0 ? 'neg' : ''}`}><span className="rm">RM</span>{plainAmount(Math.abs(left))}</div>
      </div></div>
      <div className="row"><span className="m" /><span className="t soft spent-line">
        Dah guna <b className="num">{formatRinggit(spentSen)}</b> daripada <b className="num">{formatRinggit(budgetSen)}</b>
      </span><span /></div>
      <div
        className="budget-bar"
        role="meter"
        aria-label="Bajet digunakan"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(percent, 100)}
        aria-valuetext={`${percent}% bajet digunakan`}
      >
        <span className={`fill ${level}`} style={{ width: `calc((100% - 14px) * ${Math.min(percent, 100) / 100})` }} />
        <i style={{ left: `calc(14px + (100% - 14px) * ${WARN_AT / 100})` }} aria-hidden />
      </div>
    </>
  )
}
