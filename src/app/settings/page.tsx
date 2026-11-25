import { signOut } from '@/app/login/actions'
import { AppNav } from '@/components/AppNav'
import { BudgetForm } from '@/components/BudgetForm'
import { CategoryManager } from '@/components/CategoryManager'
import { getBudget, listCategories } from '@/lib/data'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [categories, budgetSen] = await Promise.all([listCategories(), getBudget()])
  return (
    <main className="app">
      <div className="page-head"><h1>Tetapan</h1></div>

      <h2 className="section-title">Bajet bulanan</h2>
      <BudgetForm currentSen={budgetSen} />

      <h2 className="section-title">Kategori</h2>
      <CategoryManager categories={categories} />

      <form action={signOut} style={{ margin: '28px 16px 0' }}>
        <button className="btn btn-ghost" type="submit">Log keluar</button>
      </form>

      <AppNav current="/settings" />
    </main>
  )
}
