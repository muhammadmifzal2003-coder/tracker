import Link from 'next/link'
import { AppNav } from '@/components/AppNav'
import { CategoryBars } from '@/components/CategoryBars'
import { ExpenseRows } from '@/components/ExpenseRows'
import { ExpenseSheet } from '@/components/ExpenseSheet'
import { Hero } from '@/components/Hero'
import { TotalsRow } from '@/components/TotalsRow'
import { getDashboard, listCategories } from '@/lib/data'
import { monthTitle } from '@/lib/format'
import { todayKL } from '@/lib/periods'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const now = new Date()
  const today = todayKL(now)
  const [d, categories] = await Promise.all([getDashboard(now), listCategories()])

  return (
    <main className="app">
      <Hero label={monthTitle(today)} spentSen={d.month} budgetSen={d.budgetSen} />
      <TotalsRow today={d.today} week={d.week} month={d.month} />

      <h2 className="section-title">Ikut kategori</h2>
      <CategoryBars items={d.byCategory} />

      <h2 className="section-title">Terkini <Link href="/expenses">Lihat semua</Link></h2>
      {d.recent.length > 0
        ? <ExpenseRows items={d.recent} today={today} categories={categories} />
        : <p className="empty">Tekan + Tambah untuk rekod belanja pertama.</p>}

      <AppNav current="/" />
      <ExpenseSheet categories={categories} trigger="+ Tambah" triggerClassName="btn fab" />
    </main>
  )
}
