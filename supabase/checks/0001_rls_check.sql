-- Run after 0001_init.sql. Expected: rls_tables = 3, policies = 12.
select
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in ('categories', 'expenses', 'budgets') and c.relrowsecurity) as rls_tables,
  (select count(*)::int from pg_policies where schemaname = 'public' and tablename in ('categories', 'expenses', 'budgets')) as policies;
