import Link from 'next/link'
import { AppNav } from '@/components/AppNav'
import { BudgetHeader } from '@/components/BudgetHeader'
import { CategoryBars } from '@/components/CategoryBars'
import { ExpenseRows } from '@/components/ExpenseRows'
import { ExpenseSheet } from '@/components/ExpenseSheet'
import { TotalsRow } from '@/components/TotalsRow'
import { getDashboard, listCategories } from '@/lib/data'
import { dayLabel, monthTitle } from '@/lib/format'
import { todayKL } from '@/lib/periods'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const now = new Date()
  const today = todayKL(now)
  const [d, categories] = await Promise.all([getDashboard(now), listCategories()])

  return (
    <main className="paper">
      <div className="row"><span className="m" /><h1 className="t">{monthTitle(today)} <small className="soft">{dayLabel(today)}</small></h1><span /></div>
      <BudgetHeader spentSen={d.month} budgetSen={d.budgetSen} />
      <TotalsRow today={d.today} week={d.week} month={d.month} />

      <div className="row"><span className="m" /><h2 className="t">Ikut kategori</h2><span /></div>
      <CategoryBars items={d.byCategory} />

      <div className="row"><span className="m" /><h2 className="t">Terkini</h2><Link className="a" href="/expenses">Lihat semua</Link></div>
      {d.recent.length > 0
        ? <ExpenseRows items={d.recent} />
        : <div className="row"><span className="m" /><span className="t soft">Tekan + Tambah untuk rekod belanja pertama.</span><span /></div>}

      <AppNav current="/" />
      <ExpenseSheet categories={categories} trigger="+ Tambah" triggerClassName="btn fab" />
    </main>
  )
}
