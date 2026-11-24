-- Expense tracker: initial schema.
-- Paste into Supabase → SQL Editor and run once.
-- Every row belongs to auth.uid(); Row Level Security enforces it.

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

create table public.expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id  uuid not null references public.categories(id) on delete restrict,
  amount_sen   integer not null check (amount_sen > 0 and amount_sen <= 100000000),
  spent_on     date not null,
  note         text check (char_length(note) <= 200),
  created_at   timestamptz not null default now()
);
create index expenses_user_spent_on on public.expenses (user_id, spent_on);

create table public.budgets (
  user_id             uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  monthly_amount_sen  integer not null check (monthly_amount_sen > 0 and monthly_amount_sen <= 100000000),
  updated_at          timestamptz not null default now()
);

-- Row Level Security: owner only, for every operation.
alter table public.categories enable row level security;
alter table public.expenses   enable row level security;
alter table public.budgets    enable row level security;

create policy categories_select on public.categories for select to authenticated using (user_id = auth.uid());
create policy categories_insert on public.categories for insert to authenticated with check (user_id = auth.uid());
create policy categories_update on public.categories for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy categories_delete on public.categories for delete to authenticated using (user_id = auth.uid());

create policy expenses_select on public.expenses for select to authenticated using (user_id = auth.uid());
create policy expenses_insert on public.expenses for insert to authenticated with check (
  user_id = auth.uid()
  and exists (select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid())
);
create policy expenses_update on public.expenses for update to authenticated using (user_id = auth.uid()) with check (
  user_id = auth.uid()
  and exists (select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid())
);
create policy expenses_delete on public.expenses for delete to authenticated using (user_id = auth.uid());

create policy budgets_select on public.budgets for select to authenticated using (user_id = auth.uid());
create policy budgets_insert on public.budgets for insert to authenticated with check (user_id = auth.uid());
create policy budgets_update on public.budgets for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy budgets_delete on public.budgets for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.categories, public.expenses, public.budgets to authenticated;
revoke all on public.categories, public.expenses, public.budgets from anon;

-- Seed the default categories for the caller (safe to call on every login).
create or replace function public.ensure_default_categories()
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.categories (user_id, name)
  select auth.uid(), n
  from unnest(array['Makan', 'Pengangkutan', 'Sewa', 'Bil & Internet', 'Belajar', 'Hiburan', 'Shopping', 'Lain-lain']) as n
  where auth.uid() is not null
  on conflict (user_id, name) do nothing;
$$;

-- Totals per category for a date range (inclusive). RLS limits it to the caller.
create or replace function public.expense_totals_by_category(p_from date, p_to date)
returns table (category_id uuid, name text, total_sen bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select c.id, c.name, sum(e.amount_sen)::bigint
  from public.expenses e
  join public.categories c on c.id = e.category_id
  where e.spent_on between p_from and p_to
  group by c.id, c.name
  order by 3 desc;
$$;

revoke execute on function public.ensure_default_categories() from public, anon;
revoke execute on function public.expense_totals_by_category(date, date) from public, anon;
grant execute on function public.ensure_default_categories() to authenticated;
grant execute on function public.expense_totals_by_category(date, date) to authenticated;
