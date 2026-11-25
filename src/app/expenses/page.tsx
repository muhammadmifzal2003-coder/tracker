import Link from 'next/link'
import { AppNav } from '@/components/AppNav'
import { ExpenseRows } from '@/components/ExpenseRows'
import { ExpenseSheet } from '@/components/ExpenseSheet'
import { PAGE_SIZE } from '@/lib/core'
import { listCategories, listExpenses } from '@/lib/data'
import { monthTitle, plainAmount } from '@/lib/format'
import { normaliseMonth, shiftMonth } from '@/lib/months'
import { todayKL } from '@/lib/periods'

export const dynamic = 'force-dynamic'
const MAX_PAGES = 20

type Search = { bulan?: string; kategori?: string; halaman?: string }

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const now = new Date()
  const month = normaliseMonth(sp.bulan, now)
  const categories = await listCategories()
  const categoryId = categories.some((c) => c.id === sp.kategori) ? sp.kategori : undefined
  const pages = Math.min(MAX_PAGES, Math.max(1, Number.parseInt(sp.halaman ?? '1', 10) || 1))

  const chunks = await Promise.all(
    Array.from({ length: pages }, (_, i) => listExpenses({ month, categoryId, offset: i * PAGE_SIZE })),
  )
  const items = chunks.flat()
  const hasMore = chunks[chunks.length - 1].length === PAGE_SIZE && pages < MAX_PAGES

  const href = (q: Partial<Record<'bulan' | 'kategori' | 'halaman', string>>) => {
    const params = new URLSearchParams({ bulan: month, ...(categoryId ? { kategori: categoryId } : {}), ...q })
    return `/expenses?${params}`
  }

  return (
    <main className="app">
      <div className="page-head"><h1>Senarai belanja</h1></div>

      <nav className="month-switch" aria-label="Pilih bulan">
        <Link href={href({ bulan: shiftMonth(month, -1), halaman: '1' })} aria-label="Bulan sebelumnya"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg></Link>
        <strong>{monthTitle(`${month}-01`)}</strong>
        <Link href={href({ bulan: shiftMonth(month, 1), halaman: '1' })} aria-label="Bulan seterusnya"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 6l6 6-6 6" /></svg></Link>
      </nav>

      <form className="filter field inline" method="get" action="/expenses">
        <input type="hidden" name="bulan" value={month} />
        <label htmlFor="kategori" className="sr-only">Kategori</label>
        <select id="kategori" name="kategori" defaultValue={categoryId ?? ''}>
          <option value="">Semua kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn btn-ghost" type="submit">Tapis</button>
      </form>

      <div className="summary">
        <span className="soft">{items.length === 0 ? 'Tiada belanja untuk pilihan ini.' : `${items.length}${hasMore ? '+' : ''} rekod · tekan untuk ubah`}</span>
        {items.length > 0 && <b>RM{plainAmount(items.reduce((t, e) => t + e.amountSen, 0))}</b>}
      </div>

      {items.length > 0 && <ExpenseRows items={items} today={todayKL(now)} categories={categories} />}
      {hasMore && <Link className="more" href={href({ halaman: String(pages + 1) })} scroll={false}>Muat lagi</Link>}

      <AppNav current="/expenses" />
      <ExpenseSheet categories={categories} trigger="+ Tambah" triggerClassName="btn fab" />
    </main>
  )
}
