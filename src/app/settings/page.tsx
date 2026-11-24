import { signOut } from '@/app/login/actions'
import { AppNav } from '@/components/AppNav'
import { BudgetForm } from '@/components/BudgetForm'
import { CategoryManager } from '@/components/CategoryManager'
import { getBudget, listCategories } from '@/lib/data'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [categories, budgetSen] = await Promise.all([listCategories(), getBudget()])
  return (
    <main className="paper">
      <div className="row"><span className="m" /><h1 className="t">Tetapan</h1><span /></div>

      <div className="row"><span className="m" /><h2 className="t">Bajet bulanan</h2><span /></div>
      <BudgetForm currentSen={budgetSen} />

      <div className="row"><span className="m" /><h2 className="t">Kategori</h2><span /></div>
      <CategoryManager categories={categories} />

      <form action={signOut} className="indent" style={{ marginTop: 32 }}>
        <button className="btn btn-ghost" type="submit">Log keluar</button>
      </form>

      <AppNav current="/settings" />
    </main>
  )
}
