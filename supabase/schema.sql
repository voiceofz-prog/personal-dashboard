-- Personal Dashboard PWA - initial Supabase schema and RLS policies.
-- Run in Supabase SQL Editor after creating Vinson's Auth user.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
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
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.dashboard_allowed_users
    where user_id = auth.uid()
  );
$$;

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

create table if not exists public.english_self_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_date date not null default current_date,
  answer_chain text,
  future_action text,
  note text,
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
  notes text,
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
alter table public.english_self_checks enable row level security;
alter table public.fitness_daily_entries enable row level security;
alter table public.fitness_workouts enable row level security;
alter table public.fitness_plan_targets enable row level security;
alter table public.fitness_weekly_reviews enable row level security;
alter table public.dashboard_tasks enable row level security;

drop policy if exists "dashboard_allowed_users_owner_select" on public.dashboard_allowed_users;
create policy "dashboard_allowed_users_owner_select"
on public.dashboard_allowed_users for select
using (auth.uid() = user_id);

drop policy if exists "english_focus_owner_select" on public.english_focus_cards;
drop policy if exists "english_focus_owner_insert" on public.english_focus_cards;
drop policy if exists "english_focus_owner_update" on public.english_focus_cards;
drop policy if exists "english_focus_owner_delete" on public.english_focus_cards;
create policy "english_focus_owner_select" on public.english_focus_cards for select using (auth.uid() = user_id and public.is_dashboard_user());
create policy "english_focus_owner_insert" on public.english_focus_cards for insert with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "english_focus_owner_update" on public.english_focus_cards for update using (auth.uid() = user_id and public.is_dashboard_user()) with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "english_focus_owner_delete" on public.english_focus_cards for delete using (auth.uid() = user_id and public.is_dashboard_user());

drop policy if exists "english_sessions_owner_select" on public.english_sessions;
drop policy if exists "english_sessions_owner_insert" on public.english_sessions;
drop policy if exists "english_sessions_owner_update" on public.english_sessions;
drop policy if exists "english_sessions_owner_delete" on public.english_sessions;
create policy "english_sessions_owner_select" on public.english_sessions for select using (auth.uid() = user_id and public.is_dashboard_user());
create policy "english_sessions_owner_insert" on public.english_sessions for insert with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "english_sessions_owner_update" on public.english_sessions for update using (auth.uid() = user_id and public.is_dashboard_user()) with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "english_sessions_owner_delete" on public.english_sessions for delete using (auth.uid() = user_id and public.is_dashboard_user());

drop policy if exists "english_problem_owner_select" on public.english_problem_tracker;
drop policy if exists "english_problem_owner_insert" on public.english_problem_tracker;
drop policy if exists "english_problem_owner_update" on public.english_problem_tracker;
drop policy if exists "english_problem_owner_delete" on public.english_problem_tracker;
create policy "english_problem_owner_select" on public.english_problem_tracker for select using (auth.uid() = user_id and public.is_dashboard_user());
create policy "english_problem_owner_insert" on public.english_problem_tracker for insert with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "english_problem_owner_update" on public.english_problem_tracker for update using (auth.uid() = user_id and public.is_dashboard_user()) with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "english_problem_owner_delete" on public.english_problem_tracker for delete using (auth.uid() = user_id and public.is_dashboard_user());

drop policy if exists "english_self_checks_owner_select" on public.english_self_checks;
drop policy if exists "english_self_checks_owner_insert" on public.english_self_checks;
drop policy if exists "english_self_checks_owner_update" on public.english_self_checks;
drop policy if exists "english_self_checks_owner_delete" on public.english_self_checks;
create policy "english_self_checks_owner_select" on public.english_self_checks for select using (auth.uid() = user_id and public.is_dashboard_user());
create policy "english_self_checks_owner_insert" on public.english_self_checks for insert with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "english_self_checks_owner_update" on public.english_self_checks for update using (auth.uid() = user_id and public.is_dashboard_user()) with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "english_self_checks_owner_delete" on public.english_self_checks for delete using (auth.uid() = user_id and public.is_dashboard_user());

drop policy if exists "fitness_daily_owner_select" on public.fitness_daily_entries;
drop policy if exists "fitness_daily_owner_insert" on public.fitness_daily_entries;
drop policy if exists "fitness_daily_owner_update" on public.fitness_daily_entries;
drop policy if exists "fitness_daily_owner_delete" on public.fitness_daily_entries;
create policy "fitness_daily_owner_select" on public.fitness_daily_entries for select using (auth.uid() = user_id and public.is_dashboard_user());
create policy "fitness_daily_owner_insert" on public.fitness_daily_entries for insert with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "fitness_daily_owner_update" on public.fitness_daily_entries for update using (auth.uid() = user_id and public.is_dashboard_user()) with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "fitness_daily_owner_delete" on public.fitness_daily_entries for delete using (auth.uid() = user_id and public.is_dashboard_user());

drop policy if exists "fitness_workouts_owner_select" on public.fitness_workouts;
drop policy if exists "fitness_workouts_owner_insert" on public.fitness_workouts;
drop policy if exists "fitness_workouts_owner_update" on public.fitness_workouts;
drop policy if exists "fitness_workouts_owner_delete" on public.fitness_workouts;
create policy "fitness_workouts_owner_select" on public.fitness_workouts for select using (auth.uid() = user_id and public.is_dashboard_user());
create policy "fitness_workouts_owner_insert" on public.fitness_workouts for insert with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "fitness_workouts_owner_update" on public.fitness_workouts for update using (auth.uid() = user_id and public.is_dashboard_user()) with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "fitness_workouts_owner_delete" on public.fitness_workouts for delete using (auth.uid() = user_id and public.is_dashboard_user());

drop policy if exists "fitness_plan_targets_owner_select" on public.fitness_plan_targets;
drop policy if exists "fitness_plan_targets_owner_insert" on public.fitness_plan_targets;
drop policy if exists "fitness_plan_targets_owner_update" on public.fitness_plan_targets;
drop policy if exists "fitness_plan_targets_owner_delete" on public.fitness_plan_targets;
create policy "fitness_plan_targets_owner_select" on public.fitness_plan_targets for select using (auth.uid() = user_id and public.is_dashboard_user());
create policy "fitness_plan_targets_owner_insert" on public.fitness_plan_targets for insert with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "fitness_plan_targets_owner_update" on public.fitness_plan_targets for update using (auth.uid() = user_id and public.is_dashboard_user()) with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "fitness_plan_targets_owner_delete" on public.fitness_plan_targets for delete using (auth.uid() = user_id and public.is_dashboard_user());

drop policy if exists "fitness_weekly_owner_select" on public.fitness_weekly_reviews;
drop policy if exists "fitness_weekly_owner_insert" on public.fitness_weekly_reviews;
drop policy if exists "fitness_weekly_owner_update" on public.fitness_weekly_reviews;
drop policy if exists "fitness_weekly_owner_delete" on public.fitness_weekly_reviews;
create policy "fitness_weekly_owner_select" on public.fitness_weekly_reviews for select using (auth.uid() = user_id and public.is_dashboard_user());
create policy "fitness_weekly_owner_insert" on public.fitness_weekly_reviews for insert with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "fitness_weekly_owner_update" on public.fitness_weekly_reviews for update using (auth.uid() = user_id and public.is_dashboard_user()) with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "fitness_weekly_owner_delete" on public.fitness_weekly_reviews for delete using (auth.uid() = user_id and public.is_dashboard_user());

drop policy if exists "dashboard_tasks_owner_select" on public.dashboard_tasks;
drop policy if exists "dashboard_tasks_owner_insert" on public.dashboard_tasks;
drop policy if exists "dashboard_tasks_owner_update" on public.dashboard_tasks;
drop policy if exists "dashboard_tasks_owner_delete" on public.dashboard_tasks;
create policy "dashboard_tasks_owner_select" on public.dashboard_tasks for select using (auth.uid() = user_id and public.is_dashboard_user());
create policy "dashboard_tasks_owner_insert" on public.dashboard_tasks for insert with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "dashboard_tasks_owner_update" on public.dashboard_tasks for update using (auth.uid() = user_id and public.is_dashboard_user()) with check (auth.uid() = user_id and public.is_dashboard_user());
create policy "dashboard_tasks_owner_delete" on public.dashboard_tasks for delete using (auth.uid() = user_id and public.is_dashboard_user());

drop trigger if exists english_focus_cards_set_updated_at on public.english_focus_cards;
create trigger english_focus_cards_set_updated_at
before update on public.english_focus_cards
for each row execute function public.set_updated_at();

drop trigger if exists english_problem_tracker_set_updated_at on public.english_problem_tracker;
create trigger english_problem_tracker_set_updated_at
before update on public.english_problem_tracker
for each row execute function public.set_updated_at();

drop trigger if exists fitness_plan_targets_set_updated_at on public.fitness_plan_targets;
create trigger fitness_plan_targets_set_updated_at
before update on public.fitness_plan_targets
for each row execute function public.set_updated_at();

create index if not exists english_problem_tracker_user_status_idx on public.english_problem_tracker (user_id, status);
create index if not exists english_self_checks_user_date_idx on public.english_self_checks (user_id, check_date desc);
create index if not exists fitness_daily_entries_user_date_idx on public.fitness_daily_entries (user_id, entry_date desc);
create index if not exists fitness_workouts_user_date_idx on public.fitness_workouts (user_id, workout_date desc);
create index if not exists fitness_plan_targets_user_order_idx on public.fitness_plan_targets (user_id, sort_order);
