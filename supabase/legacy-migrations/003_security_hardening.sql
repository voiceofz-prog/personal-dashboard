-- Security hardening for existing Personal Dashboard Supabase projects.
-- Run after 001_initial_schema.sql and 002_english_review_cards.sql.

create or replace function public.is_dashboard_user()
returns boolean
language sql
security invoker
set search_path = public
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

alter table public.dashboard_allowed_users enable row level security;
alter table public.english_focus_cards enable row level security;
alter table public.english_sessions enable row level security;
alter table public.english_problem_tracker enable row level security;
alter table public.english_review_cards enable row level security;
alter table public.english_self_checks enable row level security;
alter table public.fitness_daily_entries enable row level security;
alter table public.fitness_workouts enable row level security;
alter table public.fitness_plan_targets enable row level security;
alter table public.fitness_weekly_reviews enable row level security;
alter table public.dashboard_tasks enable row level security;

drop policy if exists "dashboard_allowed_users_owner_select" on public.dashboard_allowed_users;
create policy "dashboard_allowed_users_owner_select"
on public.dashboard_allowed_users for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "english_focus_owner_select" on public.english_focus_cards;
drop policy if exists "english_focus_owner_insert" on public.english_focus_cards;
drop policy if exists "english_focus_owner_update" on public.english_focus_cards;
drop policy if exists "english_focus_owner_delete" on public.english_focus_cards;
create policy "english_focus_owner_select" on public.english_focus_cards for select to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_focus_owner_insert" on public.english_focus_cards for insert to authenticated with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_focus_owner_update" on public.english_focus_cards for update to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user())) with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_focus_owner_delete" on public.english_focus_cards for delete to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));

drop policy if exists "english_sessions_owner_select" on public.english_sessions;
drop policy if exists "english_sessions_owner_insert" on public.english_sessions;
drop policy if exists "english_sessions_owner_update" on public.english_sessions;
drop policy if exists "english_sessions_owner_delete" on public.english_sessions;
create policy "english_sessions_owner_select" on public.english_sessions for select to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_sessions_owner_insert" on public.english_sessions for insert to authenticated with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_sessions_owner_update" on public.english_sessions for update to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user())) with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_sessions_owner_delete" on public.english_sessions for delete to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));

drop policy if exists "english_problem_owner_select" on public.english_problem_tracker;
drop policy if exists "english_problem_owner_insert" on public.english_problem_tracker;
drop policy if exists "english_problem_owner_update" on public.english_problem_tracker;
drop policy if exists "english_problem_owner_delete" on public.english_problem_tracker;
create policy "english_problem_owner_select" on public.english_problem_tracker for select to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_problem_owner_insert" on public.english_problem_tracker for insert to authenticated with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_problem_owner_update" on public.english_problem_tracker for update to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user())) with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_problem_owner_delete" on public.english_problem_tracker for delete to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));

drop policy if exists "english_review_cards_owner_select" on public.english_review_cards;
drop policy if exists "english_review_cards_owner_insert" on public.english_review_cards;
drop policy if exists "english_review_cards_owner_update" on public.english_review_cards;
drop policy if exists "english_review_cards_owner_delete" on public.english_review_cards;
create policy "english_review_cards_owner_select" on public.english_review_cards for select to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_review_cards_owner_insert" on public.english_review_cards for insert to authenticated with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_review_cards_owner_update" on public.english_review_cards for update to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user())) with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_review_cards_owner_delete" on public.english_review_cards for delete to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));

drop policy if exists "english_self_checks_owner_select" on public.english_self_checks;
drop policy if exists "english_self_checks_owner_insert" on public.english_self_checks;
drop policy if exists "english_self_checks_owner_update" on public.english_self_checks;
drop policy if exists "english_self_checks_owner_delete" on public.english_self_checks;
create policy "english_self_checks_owner_select" on public.english_self_checks for select to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_self_checks_owner_insert" on public.english_self_checks for insert to authenticated with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_self_checks_owner_update" on public.english_self_checks for update to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user())) with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_self_checks_owner_delete" on public.english_self_checks for delete to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));

drop policy if exists "fitness_daily_owner_select" on public.fitness_daily_entries;
drop policy if exists "fitness_daily_owner_insert" on public.fitness_daily_entries;
drop policy if exists "fitness_daily_owner_update" on public.fitness_daily_entries;
drop policy if exists "fitness_daily_owner_delete" on public.fitness_daily_entries;
create policy "fitness_daily_owner_select" on public.fitness_daily_entries for select to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "fitness_daily_owner_insert" on public.fitness_daily_entries for insert to authenticated with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "fitness_daily_owner_update" on public.fitness_daily_entries for update to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user())) with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "fitness_daily_owner_delete" on public.fitness_daily_entries for delete to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));

drop policy if exists "fitness_workouts_owner_select" on public.fitness_workouts;
drop policy if exists "fitness_workouts_owner_insert" on public.fitness_workouts;
drop policy if exists "fitness_workouts_owner_update" on public.fitness_workouts;
drop policy if exists "fitness_workouts_owner_delete" on public.fitness_workouts;
create policy "fitness_workouts_owner_select" on public.fitness_workouts for select to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "fitness_workouts_owner_insert" on public.fitness_workouts for insert to authenticated with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "fitness_workouts_owner_update" on public.fitness_workouts for update to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user())) with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "fitness_workouts_owner_delete" on public.fitness_workouts for delete to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));

drop policy if exists "fitness_plan_targets_owner_select" on public.fitness_plan_targets;
drop policy if exists "fitness_plan_targets_owner_insert" on public.fitness_plan_targets;
drop policy if exists "fitness_plan_targets_owner_update" on public.fitness_plan_targets;
drop policy if exists "fitness_plan_targets_owner_delete" on public.fitness_plan_targets;
create policy "fitness_plan_targets_owner_select" on public.fitness_plan_targets for select to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "fitness_plan_targets_owner_insert" on public.fitness_plan_targets for insert to authenticated with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "fitness_plan_targets_owner_update" on public.fitness_plan_targets for update to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user())) with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "fitness_plan_targets_owner_delete" on public.fitness_plan_targets for delete to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));

drop policy if exists "fitness_weekly_owner_select" on public.fitness_weekly_reviews;
drop policy if exists "fitness_weekly_owner_insert" on public.fitness_weekly_reviews;
drop policy if exists "fitness_weekly_owner_update" on public.fitness_weekly_reviews;
drop policy if exists "fitness_weekly_owner_delete" on public.fitness_weekly_reviews;
create policy "fitness_weekly_owner_select" on public.fitness_weekly_reviews for select to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "fitness_weekly_owner_insert" on public.fitness_weekly_reviews for insert to authenticated with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "fitness_weekly_owner_update" on public.fitness_weekly_reviews for update to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user())) with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "fitness_weekly_owner_delete" on public.fitness_weekly_reviews for delete to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));

drop policy if exists "dashboard_tasks_owner_select" on public.dashboard_tasks;
drop policy if exists "dashboard_tasks_owner_insert" on public.dashboard_tasks;
drop policy if exists "dashboard_tasks_owner_update" on public.dashboard_tasks;
drop policy if exists "dashboard_tasks_owner_delete" on public.dashboard_tasks;
create policy "dashboard_tasks_owner_select" on public.dashboard_tasks for select to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "dashboard_tasks_owner_insert" on public.dashboard_tasks for insert to authenticated with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "dashboard_tasks_owner_update" on public.dashboard_tasks for update to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user())) with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "dashboard_tasks_owner_delete" on public.dashboard_tasks for delete to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));

revoke all on
  public.dashboard_allowed_users,
  public.english_focus_cards,
  public.english_sessions,
  public.english_problem_tracker,
  public.english_review_cards,
  public.english_self_checks,
  public.fitness_daily_entries,
  public.fitness_workouts,
  public.fitness_plan_targets,
  public.fitness_weekly_reviews,
  public.dashboard_tasks
from anon;

grant usage on schema public to authenticated;
grant select on public.dashboard_allowed_users to authenticated;
grant select, insert, update, delete on
  public.english_focus_cards,
  public.english_sessions,
  public.english_problem_tracker,
  public.english_review_cards,
  public.english_self_checks,
  public.fitness_daily_entries,
  public.fitness_workouts,
  public.fitness_plan_targets,
  public.fitness_weekly_reviews,
  public.dashboard_tasks
to authenticated;
