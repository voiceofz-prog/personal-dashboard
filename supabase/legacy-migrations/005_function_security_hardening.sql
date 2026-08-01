-- Resolve Supabase Security Advisor function warnings.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_dashboard_user()
returns boolean
language sql
security invoker
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.dashboard_allowed_users
    where (select auth.uid()) is not null
      and user_id = (select auth.uid())
  );
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.is_dashboard_user() from public, anon;
grant execute on function public.is_dashboard_user() to authenticated;

-- This event-trigger helper must remain SECURITY DEFINER to ALTER new tables.
-- It is invoked by the event trigger, not through the Data API.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;
