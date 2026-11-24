import Link from 'next/link'
import { AppNav } from '@/components/AppNav'
import { ExpenseRows } from '@/components/ExpenseRows'
import { ExpenseSheet } from '@/components/ExpenseSheet'
import { PAGE_SIZE } from '@/lib/core'
import { listCategories, listExpenses } from '@/lib/data'
import { monthTitle, plainAmount } from '@/lib/format'
import { normaliseMonth, shiftMonth } from '@/lib/months'

export const dynamic = 'force-dynamic'
const MAX_PAGES = 20

type Search = { bulan?: string; kategori?: string; halaman?: string }

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const month = normaliseMonth(sp.bulan, new Date())
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
    <main className="paper">
      <div className="row">
        <span className="m" />
        <h1 className="t">Senarai belanja</h1>
        <span />
      </div>

      <nav className="row" aria-label="Pilih bulan">
        <span className="m"><Link href={href({ bulan: shiftMonth(month, -1), halaman: '1' })} aria-label="Bulan sebelumnya">‹</Link></span>
        <span className="t month-name">{monthTitle(`${month}-01`)}</span>
        <Link className="a" href={href({ bulan: shiftMonth(month, 1), halaman: '1' })} aria-label="Bulan seterusnya">›</Link>
      </nav>

      <form className="row filter" method="get" action="/expenses">
        <span className="m" />
        <span className="t field">
          <input type="hidden" name="bulan" value={month} />
          <label htmlFor="kategori" className="sr-only">Kategori</label>
          <select id="kategori" name="kategori" defaultValue={categoryId ?? ''}>
            <option value="">Semua kategori</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </span>
        <button className="a btn-link" type="submit">Tapis</button>
      </form>

      <div className="row">
        <span className="m" />
        <span className="t soft">{items.length === 0 ? 'Tiada belanja untuk pilihan ini.' : `${items.length}${hasMore ? '+' : ''} rekod`}</span>
        {items.length > 0 && <span className="a strong">{plainAmount(items.reduce((t, e) => t + e.amountSen, 0))}</span>}
      </div>

      <ExpenseRows
        items={items}
        renderAction={(e) => (
          <ExpenseSheet
            categories={categories}
            expense={e}
            triggerClassName="row-button"
            triggerLabel={`Ubah ${e.note || e.categoryName}, ${plainAmount(e.amountSen)}`}
            trigger={<>{e.note || e.categoryName}{e.note && <small>{e.categoryName}</small>}</>}
          />
        )}
      />

      {hasMore && (
        <div className="row"><span className="m" /><Link className="t" href={href({ halaman: String(pages + 1) })} scroll={false}>Muat lagi</Link><span /></div>
      )}

      <AppNav current="/expenses" />
      <ExpenseSheet categories={categories} trigger="+ Tambah" triggerClassName="btn fab" />
    </main>
  )
}
