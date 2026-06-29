-- Personal Dashboard PWA - initial Supabase schema and RLS policies.
-- Run in Supabase SQL Editor after creating Vinson's Auth user.

create extension if not exists pgcrypto;

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

create table if not exists public.dashboard_allowed_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

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

create table if not exists public.english_focus_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  current_focus text not null,
  cefr text,
  tags text[] not null default '{}',
  review_sentences text[] not null default '{}',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.english_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null,
  topic text not null,
  cefr text,
  main_bottleneck text,
  improvement text,
  next_focus text,
  created_at timestamptz not null default now()
);

create table if not exists public.english_problem_tracker (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem text not null,
  status text not null check (status in ('Active','Improving','Stable','Paused')),
  latest_evidence text,
  improvement_condition text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.english_review_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_type text not null check (card_type in ('commute','mistake','warmup','self_test')),
  title text not null,
  prompt text not null,
  answer_hint text,
  tags text[] not null default '{}',
  sort_order integer not null default 100,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.english_self_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_date date not null default current_date,
  answer_chain text,
  future_action text,
  note text,
  session_id uuid,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.english_review_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_card_id uuid references public.english_review_cards(id) on delete set null,
  session_id uuid not null,
  result text not null check (result in ('again','hard','mastered')),
  card_type_snapshot text not null,
  card_title_snapshot text not null,
  tags_snapshot text[] not null default '{}',
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.fitness_daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  bodyweight_kg numeric(5,2),
  training_status text not null check (training_status in ('trained','rest')),
  training_content text,
  protein text,
  carbs_food text,
  sleep_hours numeric(3,1),
  energy_score integer check (energy_score between 1 and 5),
  recovery_score integer check (recovery_score between 1 and 5),
  soreness_level text not null default 'none' check (soreness_level in ('none','mild','moderate','severe')),
  soreness_areas text[] not null default '{}',
  source text not null default 'manual' check (source in ('manual','text_import')),
  notes text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.fitness_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null default current_date,
  plan_type text,
  exercise text not null,
  weight text,
  reps text,
  sets text,
  rpe text,
  next_target text,
  daily_entry_id uuid references public.fitness_daily_entries(id) on delete cascade,
  exercise_key text,
  weight_kg numeric(6,2),
  reps_by_set integer[] not null default '{}',
  completed boolean not null default true,
  source text not null default 'manual' check (source in ('manual','text_import')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.fitness_plan_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text,
  detail text,
  sort_order integer not null default 100,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.fitness_weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  average_bodyweight_kg numeric(5,2),
  training_days integer,
  food_execution text,
  recovery_summary text,
  next_adjustment text,
  created_at timestamptz not null default now()
);

create table if not exists public.dashboard_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in ('home','english','fitness','settings')),
  title text not null,
  status text not null default 'open' check (status in ('open','done','paused')),
  due_date date,
  created_at timestamptz not null default now()
);

alter table public.dashboard_allowed_users enable row level security;
alter table public.english_focus_cards enable row level security;
alter table public.english_sessions enable row level security;
alter table public.english_problem_tracker enable row level security;
alter table public.english_review_cards enable row level security;
alter table public.english_self_checks enable row level security;
alter table public.english_review_events enable row level security;
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

drop policy if exists "english_review_events_owner_select" on public.english_review_events;
drop policy if exists "english_review_events_owner_insert" on public.english_review_events;
drop policy if exists "english_review_events_owner_update" on public.english_review_events;
drop policy if exists "english_review_events_owner_delete" on public.english_review_events;
create policy "english_review_events_owner_select" on public.english_review_events for select to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_review_events_owner_insert" on public.english_review_events for insert to authenticated with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_review_events_owner_update" on public.english_review_events for update to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user())) with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_review_events_owner_delete" on public.english_review_events for delete to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));

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

drop trigger if exists english_focus_cards_set_updated_at on public.english_focus_cards;
create trigger english_focus_cards_set_updated_at
before update on public.english_focus_cards
for each row execute function public.set_updated_at();

drop trigger if exists english_problem_tracker_set_updated_at on public.english_problem_tracker;
create trigger english_problem_tracker_set_updated_at
before update on public.english_problem_tracker
for each row execute function public.set_updated_at();

drop trigger if exists english_review_cards_set_updated_at on public.english_review_cards;
create trigger english_review_cards_set_updated_at
before update on public.english_review_cards
for each row execute function public.set_updated_at();

drop trigger if exists fitness_plan_targets_set_updated_at on public.fitness_plan_targets;
create trigger fitness_plan_targets_set_updated_at
before update on public.fitness_plan_targets
for each row execute function public.set_updated_at();

drop trigger if exists english_self_checks_set_updated_at on public.english_self_checks;
create trigger english_self_checks_set_updated_at
before update on public.english_self_checks
for each row execute function public.set_updated_at();

drop trigger if exists fitness_daily_entries_set_updated_at on public.fitness_daily_entries;
create trigger fitness_daily_entries_set_updated_at
before update on public.fitness_daily_entries
for each row execute function public.set_updated_at();

drop trigger if exists fitness_workouts_set_updated_at on public.fitness_workouts;
create trigger fitness_workouts_set_updated_at
before update on public.fitness_workouts
for each row execute function public.set_updated_at();

create index if not exists english_problem_tracker_user_status_idx on public.english_problem_tracker (user_id, status);
create index if not exists english_review_cards_user_type_order_idx on public.english_review_cards (user_id, card_type, active, sort_order);
create index if not exists english_self_checks_user_date_idx on public.english_self_checks (user_id, check_date desc);
create index if not exists english_review_events_user_reviewed_idx on public.english_review_events (user_id, reviewed_at desc);
create index if not exists english_review_events_card_idx on public.english_review_events (review_card_id);
create index if not exists english_review_events_user_session_idx on public.english_review_events (user_id, session_id);
create unique index if not exists english_self_checks_user_session_unique on public.english_self_checks (user_id, session_id) where session_id is not null;
create index if not exists fitness_daily_entries_user_date_idx on public.fitness_daily_entries (user_id, entry_date desc);
create index if not exists fitness_workouts_user_date_idx on public.fitness_workouts (user_id, workout_date desc);
create index if not exists fitness_workouts_daily_entry_idx on public.fitness_workouts (daily_entry_id);
create index if not exists fitness_workouts_user_plan_exercise_idx on public.fitness_workouts (user_id, plan_type, exercise_key, workout_date desc);
create unique index if not exists fitness_workouts_user_entry_exercise_unique on public.fitness_workouts (user_id, daily_entry_id, exercise_key) where daily_entry_id is not null and exercise_key is not null;
create index if not exists fitness_plan_targets_user_order_idx on public.fitness_plan_targets (user_id, sort_order);

grant usage on schema public to authenticated;
grant execute on function public.is_dashboard_user() to authenticated;
revoke all on
  public.dashboard_allowed_users,
  public.english_focus_cards,
  public.english_sessions,
  public.english_problem_tracker,
  public.english_review_cards,
  public.english_self_checks,
  public.english_review_events,
  public.fitness_daily_entries,
  public.fitness_workouts,
  public.fitness_plan_targets,
  public.fitness_weekly_reviews,
  public.dashboard_tasks
from anon;
grant select on public.dashboard_allowed_users to authenticated;
grant select, insert, update, delete on
  public.english_focus_cards,
  public.english_sessions,
  public.english_problem_tracker,
  public.english_review_cards,
  public.english_self_checks,
  public.english_review_events,
  public.fitness_daily_entries,
  public.fitness_workouts,
  public.fitness_plan_targets,
  public.fitness_weekly_reviews,
  public.dashboard_tasks
to authenticated;
