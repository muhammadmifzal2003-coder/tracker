# Expense Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A personal, phone-first web app for one owner to record expenses in RM, see day/week/month totals, get monthly budget warnings and see spending by category.

**Architecture:** Next.js App Router renders pages on the server and writes through Server Actions. Supabase supplies auth (cookie sessions via `@supabase/ssr`) and Postgres, with Row Level Security so every row is owned by `auth.uid()`. Pure logic (money, dates, budget) lives in `src/lib` and is unit-tested.

**Tech Stack:** Next.js (App Router, TypeScript), Tailwind CSS, `@supabase/supabase-js` + `@supabase/ssr`, Zod, Recharts, Vitest, Semgrep, gitleaks, Vercel.

**Spec:** `docs/superpowers/specs/2026-11-24-expense-tracker-design.md`

## Global Constraints

- UI copy in Bahasa Melayu.
- RM only. Amounts are stored and passed as **integer sen**. Display format: `RM1,234.50`.
- Week starts **Monday**. All "today/week/month" boundaries use **Asia/Kuala_Lumpur**.
- Amount limits: `1 ≤ amount_sen ≤ 100000000`. Note ≤ 200 chars. Category name 1–40 chars.
- Budget warnings at **80%** (amber) and **100%** (red).
- Seed categories: Makan, Pengangkutan, Sewa, Bil & Internet, Belajar, Hiburan, Shopping, Lain-lain.
- Env vars: only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, in `.env.local` (git-ignored). `.env.example` is committed with empty values. **No `service_role` key anywhere.**
- No sign-up page or sign-up call in the code.
- `npm run scan` (Semgrep + gitleaks) must be clean before every push.
- UI visuals follow the mockup approved in workflow step 4 (frontend-design). Tasks 6–8 wait for that approval.

## Review Focus

1. **Comma or odd amount input** ("12,50", "RM 12.5", " 7 ", "0", "-5", "12.345"): comma as decimal separator is accepted. Zero, negative, more than 2 decimals and non-numbers are rejected with a Malay message. → tests in Task 2.
2. **Late-night expense near midnight KL time** (e.g. 23:30 MYT = 15:30 UTC): it must count for today in KL, not the UTC day. Sunday 23:30 MYT belongs to that week, not the next one. → tests in Task 2.
3. **No budget set yet:** the dashboard shows "Tetapkan bajet" and no warning, and does not crash or divide by zero. → test in Task 2.
4. **Deleting a category that has expenses:** blocked with a clear message (FK `restrict`) instead of a raw database error. → test in Task 5.
5. **Session expired while a form is open:** the Server Action returns an "auth" error, the UI sends the user to `/login`, and nothing is written. → test in Task 5.

---

### Task 1: Project scaffold, secrets hygiene and scanning

**Files:**
- Create: Next.js app at repo root (`create-next-app` with TypeScript, Tailwind, App Router, `src/` dir, ESLint)
- Create: `.env.example`, `vitest.config.ts`, `scripts/scan.sh`, `.githooks/pre-commit`, `.gitleaks.toml`
- Modify: `.gitignore` (ensure `.env*` ignored except `.env.example`), `next.config.ts` (security headers), `package.json` scripts
- Test: `src/lib/__tests__/sanity.test.ts`

**Interfaces:**
- Produces: `npm test` (vitest run), `npm run scan` (runs `scripts/scan.sh`), and the hook path set with `git config core.hooksPath .githooks`.

- [ ] **Step 1:** Scaffold the app, then install `@supabase/supabase-js @supabase/ssr zod recharts` and dev `vitest`.
- [ ] **Step 2:** Write `sanity.test.ts` asserting `1 + 1 === 2`. Run `npm test`. Expected: 1 passed.
- [ ] **Step 3:** Write `scripts/scan.sh`: `semgrep scan --config auto --error --quiet` then `gitleaks detect --no-banner --redact`, `set -e`. Write `.githooks/pre-commit` running `gitleaks protect --staged --no-banner --redact`.
- [ ] **Step 4:** Add headers in `next.config.ts`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a CSP allowing `self` plus `connect-src` to the Supabase URL.
- [ ] **Step 5: Verify the scanners catch a leak.** Create a temporary `leak.txt` with a fake AWS key `AKIA` + 16 chars and run `npm run scan`. Expected: gitleaks FAIL. Delete the file and run again. Expected: exit 0.
- [ ] **Step 6:** Run `npm run build`. Expected: success.
- [ ] **Step 7:** Commit `chore: scaffold app with scanning and security headers`, then push (workflow step 6).

### Task 2: Money, period and budget logic

**Files:**
- Create: `src/lib/money.ts`, `src/lib/periods.ts`, `src/lib/budget.ts`
- Test: `src/lib/__tests__/money.test.ts`, `periods.test.ts`, `budget.test.ts`

**Interfaces:**
- Produces:
  - `parseRinggit(input: string): { ok: true; sen: number } | { ok: false; error: string }`
  - `formatRinggit(sen: number): string`
  - `periodRange(period: 'day' | 'week' | 'month', now: Date): { from: string; to: string }`. The dates are `YYYY-MM-DD` in Asia/Kuala_Lumpur, and `to` is inclusive.
  - `todayKL(now: Date): string`
  - `budgetStatus(spentSen: number, budgetSen: number | null): { percent: number | null; level: 'none' | 'ok' | 'warn' | 'over' }`
  - `crossedThreshold(beforeSen: number, afterSen: number, budgetSen: number | null): 80 | 100 | null`

- [ ] **Step 1: Write failing tests**

```ts
expect(parseRinggit('12.50')).toEqual({ ok: true, sen: 1250 })
expect(parseRinggit('12,50')).toEqual({ ok: true, sen: 1250 })
expect(parseRinggit('RM 7')).toEqual({ ok: true, sen: 700 })
expect(parseRinggit(' 12.5 ')).toEqual({ ok: true, sen: 1250 })
for (const bad of ['0', '-5', '12.345', 'abc', '', '1000001']) expect(parseRinggit(bad).ok).toBe(false)
expect(formatRinggit(123450)).toBe('RM1,234.50')

// 2026-11-29 is a Sunday; 15:30Z = 23:30 MYT
expect(todayKL(new Date('2026-11-29T15:30:00Z'))).toBe('2026-11-29')
expect(periodRange('week', new Date('2026-11-29T15:30:00Z'))).toEqual({ from: '2026-11-23', to: '2026-11-29' })
expect(periodRange('week', new Date('2026-11-29T16:30:00Z'))).toEqual({ from: '2026-11-30', to: '2026-12-06' })
expect(periodRange('month', new Date('2026-02-10T00:00:00Z'))).toEqual({ from: '2026-02-01', to: '2026-02-28' })

expect(budgetStatus(5000, null)).toEqual({ percent: null, level: 'none' })
expect(budgetStatus(7900, 10000).level).toBe('ok')
expect(budgetStatus(8000, 10000).level).toBe('warn')
expect(budgetStatus(10000, 10000).level).toBe('over')
expect(crossedThreshold(7000, 8500, 10000)).toBe(80)
expect(crossedThreshold(7000, 10500, 10000)).toBe(100)
expect(crossedThreshold(8500, 9000, 10000)).toBeNull()
expect(crossedThreshold(1, 2, null)).toBeNull()
```

- [ ] **Step 2:** Run `npm test`. Expected: FAIL (modules missing).
- [ ] **Step 3:** Implement the functions. Use `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' })` for KL dates. Do no float maths on money: split the string at the decimal separator.
- [ ] **Step 4:** Run `npm test`. Expected: all pass.
- [ ] **Step 5:** Commit `feat: money, period and budget logic`, then scan and push.

### Task 3: Database migration (tables, RLS, seed)

**Files:**
- Create: `supabase/migrations/0001_init.sql`, `supabase/checks/0001_rls_check.sql`
- Modify: `README.md` (setup section: create project, paste SQL, disable sign-up, add user)

**Interfaces:**
- Produces: tables `categories`, `expenses`, `budgets` exactly as in spec §5. The function `public.ensure_default_categories() returns void` (security invoker) inserts the 8 seed names for `auth.uid()` with `on conflict do nothing`. The view `public.expense_totals_by_category(from date, to date)` is an RPC function returning `(category_id uuid, name text, total_sen bigint)`.

- [ ] **Step 1:** Write `0001_init.sql`: the tables from the spec. Add `alter table … enable row level security` on all three, plus four policies per table with `using (user_id = auth.uid())` and `with check (user_id = auth.uid())`. Include the seed function and the totals function.
- [ ] **Step 2:** Write `0001_rls_check.sql`: queries that list `relrowsecurity` for the 3 tables, all expected `true`, and the count of policies, expected 12.
- [ ] **Step 3 (owner):** Paste `0001_init.sql` and then the check into the Supabase SQL Editor. Expected: 3 × `true`, 12 policies.
- [ ] **Step 4 (owner):** Authentication → Providers → Email: disable "Allow new users to sign up". Then Users → Add user (auto-confirm).
- [ ] **Step 5:** Commit `feat: database schema with RLS`, then scan and push.

### Task 4: Supabase clients, auth guard, login and logout

**Files:**
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/middleware.ts`, `src/lib/auth/guard.ts`, `src/app/login/page.tsx`, `src/app/login/actions.ts`
- Test: `src/lib/auth/__tests__/guard.test.ts`

**Interfaces:**
- Consumes: env vars from Task 1.
- Produces:
  - `createServerSupabase(): Promise<SupabaseClient>`
  - `requiredRedirect(pathname: string, isLoggedIn: boolean): string | null`. It returns `'/login'` for protected paths when logged out, `'/'` for `/login` when logged in, and `null` otherwise.
  - `signIn(formData)` and `signOut()` Server Actions.

- [ ] **Step 1: Failing tests:** `requiredRedirect('/', false) === '/login'`, `requiredRedirect('/expenses', false) === '/login'`, `requiredRedirect('/login', false) === null`, `requiredRedirect('/login', true) === '/'`, `requiredRedirect('/', true) === null`.
- [ ] **Step 2:** Run them. Expected: FAIL. Implement. Run again. Expected: PASS.
- [ ] **Step 3:** The middleware refreshes the session with `@supabase/ssr` (per its docs) and applies `requiredRedirect`. `signIn` uses `signInWithPassword`. On failure it shows "E-mel atau kata laluan salah." and does not reveal which field was wrong. `signIn` calls `ensure_default_categories()` after success.
- [ ] **Step 4:** Run `grep -rn "signUp\|service_role" src`. Expected: no matches.
- [ ] **Step 5:** Manual check against the owner's Supabase: a wrong password shows the error, and the correct one lands on `/`.
- [ ] **Step 6:** Commit `feat: login, logout and route guard`, then scan and push.

### Task 5: Validation and data actions

**Files:**
- Create: `src/lib/validation.ts`, `src/app/actions/expenses.ts`, `src/app/actions/categories.ts`, `src/app/actions/budget.ts`, `src/lib/data.ts`
- Test: `src/lib/__tests__/validation.test.ts`, `src/app/actions/__tests__/actions.test.ts` (Supabase client mocked)

**Interfaces:**
- Consumes: `parseRinggit`, `crossedThreshold`, `periodRange` (Task 2), `createServerSupabase` (Task 4).
- Produces:
  - `type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: 'auth' | 'validation' | 'in_use' | 'unknown'; message: string }`
  - `expenseSchema` (Zod: `amount: string → sen`, `categoryId: uuid`, `spentOn: YYYY-MM-DD`, `note?: ≤200`)
  - `addExpense(fd): Promise<ActionResult<{ crossed: 80 | 100 | null }>>`, `updateExpense(id, fd)`, `deleteExpense(id)`
  - `addCategory(name)`, `deleteCategory(id)`, `moveExpenses(fromId, toId)`
  - `setBudget(amount: string)`
  - `getDashboard(now: Date): Promise<{ today: number; week: number; month: number; budgetSen: number | null; byCategory: { name: string; totalSen: number }[]; recent: Expense[] }>`
  - `listExpenses({ month: 'YYYY-MM', categoryId?: string, offset: number }): Promise<Expense[]>` (page size 30)

- [ ] **Step 1: Failing tests:**
  - `expenseSchema` rejects `amount: '0'`, a bad date `'2026-13-01'`, and a 201-char note.
  - `addExpense` with `getUser()` returning no user → `{ ok: false, error: 'auth' }`, and `insert` is never called.
  - `deleteCategory` when Supabase returns error code `23503` → `{ ok: false, error: 'in_use', message: 'Kategori ini masih ada perbelanjaan. Pindahkan dahulu.' }`.
  - `addExpense` that takes the month from 7000 to 8500 sen with a 10000 budget → `data.crossed === 80`.
- [ ] **Step 2:** Run. Expected: FAIL. Implement: every action calls `auth.getUser()` first, then `revalidatePath('/')`. Run again. Expected: PASS.
- [ ] **Step 3:** Commit `feat: validated server actions`, then scan and push.

### Task 6: Dashboard UI (after step 4 mockup approval)

**Files:** `src/app/page.tsx`, `src/components/TotalsCards.tsx`, `BudgetBar.tsx`, `CategoryChart.tsx`, `RecentList.tsx`, `ExpenseForm.tsx` (sheet/modal shared with Task 7)

**Interfaces:** consumes `getDashboard`, `addExpense`, `formatRinggit`, `budgetStatus`.

- [ ] **Step 1:** Build to the approved mockup. `BudgetBar`: level `none` → "Tetapkan bajet" link to `/settings`, `warn` → amber, `over` → red. `ExpenseForm` shows a notice when `crossed` is 80 ("Anda dah guna 80% bajet bulan ini") or 100 ("Bajet bulan ini dah habis"). The date defaults to `todayKL(new Date())`. The amount input uses `inputmode="decimal"`. An `auth` error → `router.push('/login')`.
- [ ] **Step 2:** Run a Playwright check at 390×844 against the dev server with the owner's test account: add an expense in ≤ 3 taps after "+ Tambah", and the totals update.
- [ ] **Step 3:** Commit, then scan and push.

### Task 7: Expenses list

**Files:** `src/app/expenses/page.tsx`, `src/components/ExpenseRow.tsx`

- [ ] **Step 1:** Month and category filters via search params. "Muat lagi" (load more) with an offset of 30. Edit reuses `ExpenseForm`. Delete asks for confirmation first.
- [ ] **Step 2:** Manual check: edit, delete and filters work. Then commit, scan and push.

### Task 8: Settings

**Files:** `src/app/settings/page.tsx`, `src/components/CategoryManager.tsx`, `BudgetForm.tsx`

- [ ] **Step 1:** Budget form (`setBudget`). Category add and delete. On an `in_use` error, offer a "Pindah ke…" select that calls `moveExpenses` and then deletes. Logout button.
- [ ] **Step 2:** Manual check of the `in_use` flow. Then commit, scan and push.

### Task 9: Deploy to Vercel

**Files:** Modify `README.md` (deploy section)

- [ ] **Step 1 (owner):** Import the GitHub repo into Vercel. Set both `NEXT_PUBLIC_SUPABASE_*` vars. Deploy.
- [ ] **Step 2 (owner):** Supabase → Auth → URL Configuration: set Site URL to the Vercel URL.
- [ ] **Step 3:** On a phone, open the Vercel URL, log in and add an expense. Check that the response headers include the CSP and X-Frame-Options.
- [ ] **Step 4:** Run the final `npm run scan`, `npm test` and `npm run build`, all clean. Tag `v0.1.0` and push.
