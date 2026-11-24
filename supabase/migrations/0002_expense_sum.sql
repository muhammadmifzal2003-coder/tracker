-- Sum of the caller's expenses in a date range (inclusive), computed in SQL
-- so dashboard totals are never cut off by the API's row limit.
-- Paste into Supabase → SQL Editor after 0001_init.sql.
create or replace function public.expense_sum(p_from date, p_to date)
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(sum(amount_sen), 0)::bigint
  from public.expenses
  where spent_on between p_from and p_to;
$$;

revoke execute on function public.expense_sum(date, date) from public, anon;
grant execute on function public.expense_sum(date, date) to authenticated;
