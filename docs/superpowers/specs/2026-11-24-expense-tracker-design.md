# Expense Tracker: Design

Date: 2026-11-24
Status: Draft, waiting for owner approval

## 1. Intent and the why

A personal web app for **one person (the owner)** to record and total their
spending in Malaysian Ringgit (RM). It should show how much they spent per
day, week and month, warn them before a monthly budget runs out, and show
spending per category in a chart. The data lives in the cloud, so it can be
opened from a phone or a laptop.

Success: the owner records spending in a few seconds from a phone and can
see at a glance where the money went this month and how much budget is left.

## 2. Goals, non-goals, anti-goals

**Goals (MVP)**
1. Add, edit and delete expenses: amount (RM), category, date, optional note.
2. Totals for today, this week and this month.
3. One monthly budget (total), with warnings at 80% and 100%.
4. A chart of this month's spending by category.
5. Custom categories, seeded with: Makan, Pengangkutan, Sewa, Bil & Internet,
   Belajar, Hiburan, Shopping, Lain-lain.
6. Email + password login. Public sign-up is closed from the start.
7. Deployed to Vercel (free) so the owner can open it from a phone.

**Non-goals (later, not in MVP)**
- Income tracking
- CSV/PDF export
- Split bills and other users
- Multiple currencies
- Budgets per category

**Anti-goals (a failure even if it "works")**
- Anyone other than the owner can read or change the data.
- Secrets (API keys, passwords) end up in git or in GitHub.
- Adding an expense on a phone takes more than a few taps.

## 3. Constraints

- UI language: Bahasa Melayu.
- Currency: RM only. Store amounts as **integer sen** (e.g. RM12.50 → 1250)
  to avoid floating-point errors.
- Week starts on **Monday**. Time zone **Asia/Kuala_Lumpur**.
- Responsive web app, phone first.
- Secrets live only in `.env.local`, which is git-ignored. A committed
  `.env.example` lists the variable names with no values.
- Every change is scanned with **Semgrep** and **gitleaks** before it is pushed.
- Push to a **private** GitHub repo `expense-tracker` each time a working step is done.

## 4. Approaches considered

| Approach | Trade-off | Decision |
|---|---|---|
| **A. Next.js + Supabase cloud** | Cloud data and login, and Row Level Security comes built in. The owner needs a free Supabase account. | **Chosen.** It is the only option that keeps the data in the cloud and leaves auth and security to a proven service. |
| B. Next.js + Supabase local (Docker) | No account needed, but it is heavy and the data is not in the cloud. | Rejected: it conflicts with "data in the cloud". |
| C. Next.js + SQLite + Auth.js | Lightest, but we would write our own auth and need separate hosting. | Rejected: more hand-written security code means more risk. |

## 5. Decided parts of the how

### Stack
- Next.js (App Router, TypeScript) + Tailwind CSS
- `@supabase/ssr` for auth via cookies, with server-side checks
- Recharts for the category chart
- Vitest for unit tests (date ranges, money formatting, budget %)

### Database (Supabase Postgres)

```sql
-- categories: seeded per user on first login; the user can add more
create table categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name        text not null check (char_length(name) between 1 and 40),
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

create table expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade default auth.uid(),
  category_id  uuid not null references categories(id) on delete restrict,
  amount_sen   integer not null check (amount_sen > 0 and amount_sen <= 100000000),
  spent_on     date not null,
  note         text check (char_length(note) <= 200),
  created_at   timestamptz not null default now()
);
create index on expenses (user_id, spent_on);

-- one row per user: the monthly budget
create table budgets (
  user_id             uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  monthly_amount_sen  integer not null check (monthly_amount_sen > 0),
  updated_at          timestamptz not null default now()
);
```

- A category that still has expenses cannot be deleted (`on delete restrict`).
  The UI says so and offers to move those expenses to another category first.
- The seeded categories are created by a SQL function on first login, so the
  owner does not start with an empty list.

### Security
1. **Row Level Security ON for all three tables.** Policies on select, insert,
   update and delete: `user_id = auth.uid()`. This protects the data even if
   the anon key leaks, since the anon key is public by design.
2. **Sign-up closed from the start:** "Allow new users to sign up" is turned
   off in the Supabase dashboard. The owner's account is created by the owner
   in the dashboard (Authentication → Add user, auto-confirm). The app has
   **no sign-up page at all**. *(Builder's call.)*
3. **Secrets:** only `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used. The `service_role` key is
   **never** put in the app or in `.env`.
4. **Server-side checks:** middleware refreshes the session and redirects
   logged-out users to `/login`. Server Actions call `supabase.auth.getUser()`
   before any write. Input is validated with Zod (amount > 0, valid date,
   note length).
5. **Scanning:** `semgrep --config auto` and `gitleaks detect` run before every
   push, and also from a git pre-commit hook. A finding blocks the push until
   it is fixed.
6. HTTP security headers (CSP, X-Frame-Options, Referrer-Policy) set in
   `next.config`.

### Screens (detailed visual design happens in step 4 with frontend-design)
- `/login`: email and password
- `/` (Dashboard): today / week / month totals, budget bar (80% amber, 100% red),
  category chart, recent expenses, and a large "+ Tambah" button.
  Budget warning: the bar turns amber at 80% and red at 100%, and a small notice
  appears when saving an expense that crosses 80% or 100%. *(Builder's call.)*
- `/expenses`: list filterable by month and category, with edit and delete
- `/settings`: monthly budget, manage categories, log out

### Setup and delivery (decided by the owner)
- **Supabase:** the owner creates a free project at supabase.com and gives the
  URL and anon key. The builder writes SQL files in `supabase/migrations/`
  (committed), and the owner pastes each one into the Supabase **SQL Editor**.
  No Supabase access token or service_role key is used.
- **GitHub:** the owner creates a private repo `expense-tracker` and gives
  `username/expense-tracker`. The builder pushes after each working step,
  once Semgrep and gitleaks are clean.
- **Vercel:** the owner connects Vercel to the GitHub repo and sets the two
  `NEXT_PUBLIC_SUPABASE_*` variables in Vercel's settings. In Supabase Auth,
  add the Vercel URL as the Site URL and as a redirect URL.
- The owner's overall workflow: (1) skills installed, (2) Grill-Me interview,
  (3) this plan, (4) visual design with frontend-design, shown before building,
  (5) `.env` and scans, (6) push each time it works.

## 6. Left to the builder
- Folder structure and component breakdown
- Exact Zod schemas and error messages (in Malay)
- Chart type (donut or bar), to be settled in the design step
- Pagination of the expense list (simple "load more" is fine)
