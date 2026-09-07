-- Manual Jessica review loop with traceable, executable targets.
-- Apply after 005_function_security_hardening.sql.

create table if not exists public.jessica_review_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null check (domain in ('english','fitness')),
  status text not null default 'active' check (status in ('active','superseded','completed')),
  evidence jsonb not null default '{}'::jsonb,
  summary text not null,
  next_focus text not null,
  reviewed_by text not null default 'jessica' check (reviewed_by = 'jessica'),
  reviewed_at timestamptz not null default now(),
  next_review_after timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.fitness_exercise_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_cycle_id uuid not null references public.jessica_review_cycles(id) on delete cascade,
  plan_type text not null check (plan_type in ('Plan A','Plan B')),
  exercise_key text not null,
  exercise_name text not null,
  weight_kg numeric(6,2),
  reps_by_set integer[] not null default '{}',
  instructions text,
  sort_order integer not null default 100,
  active boolean not null default true,
  effective_from date not null default current_date,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.english_focus_cards
  add column if not exists review_cycle_id uuid references public.jessica_review_cycles(id) on delete set null;

alter table public.english_review_cards
  add column if not exists review_cycle_id uuid references public.jessica_review_cycles(id) on delete set null;

alter table public.fitness_workouts
  add column if not exists target_id uuid references public.fitness_exercise_targets(id) on delete set null;

alter table public.jessica_review_cycles enable row level security;
alter table public.fitness_exercise_targets enable row level security;

drop policy if exists "jessica_review_cycles_owner_select" on public.jessica_review_cycles;
drop policy if exists "jessica_review_cycles_owner_insert" on public.jessica_review_cycles;
drop policy if exists "jessica_review_cycles_owner_update" on public.jessica_review_cycles;
drop policy if exists "jessica_review_cycles_owner_delete" on public.jessica_review_cycles;
create policy "jessica_review_cycles_owner_select"
on public.jessica_review_cycles for select to authenticated
using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "jessica_review_cycles_owner_insert"
on public.jessica_review_cycles for insert to authenticated
with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "jessica_review_cycles_owner_update"
on public.jessica_review_cycles for update to authenticated
using ((select auth.uid()) = user_id and (select public.is_dashboard_user()))
with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "jessica_review_cycles_owner_delete"
on public.jessica_review_cycles for delete to authenticated
using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));

drop policy if exists "fitness_exercise_targets_owner_select" on public.fitness_exercise_targets;
drop policy if exists "fitness_exercise_targets_owner_insert" on public.fitness_exercise_targets;
drop policy if exists "fitness_exercise_targets_owner_update" on public.fitness_exercise_targets;
drop policy if exists "fitness_exercise_targets_owner_delete" on public.fitness_exercise_targets;
create policy "fitness_exercise_targets_owner_select"
on public.fitness_exercise_targets for select to authenticated
using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "fitness_exercise_targets_owner_insert"
on public.fitness_exercise_targets for insert to authenticated
with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "fitness_exercise_targets_owner_update"
on public.fitness_exercise_targets for update to authenticated
using ((select auth.uid()) = user_id and (select public.is_dashboard_user()))
with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "fitness_exercise_targets_owner_delete"
on public.fitness_exercise_targets for delete to authenticated
using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));

drop trigger if exists jessica_review_cycles_set_updated_at on public.jessica_review_cycles;
create trigger jessica_review_cycles_set_updated_at
before update on public.jessica_review_cycles
for each row execute function public.set_updated_at();

drop trigger if exists fitness_exercise_targets_set_updated_at on public.fitness_exercise_targets;
create trigger fitness_exercise_targets_set_updated_at
before update on public.fitness_exercise_targets
for each row execute function public.set_updated_at();

create unique index if not exists jessica_review_cycles_one_active_domain
  on public.jessica_review_cycles (user_id, domain)
  where status = 'active';
create index if not exists jessica_review_cycles_user_reviewed_idx
  on public.jessica_review_cycles (user_id, domain, reviewed_at desc);
create unique index if not exists fitness_exercise_targets_active_key
  on public.fitness_exercise_targets (user_id, plan_type, exercise_key)
  where active;
create index if not exists fitness_exercise_targets_cycle_idx
  on public.fitness_exercise_targets (review_cycle_id);
create index if not exists fitness_workouts_target_idx
  on public.fitness_workouts (target_id);

revoke all on public.jessica_review_cycles, public.fitness_exercise_targets from anon;
grant select, insert, update, delete on public.jessica_review_cycles, public.fitness_exercise_targets to authenticated;
