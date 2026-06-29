-- Commute review events and structured fitness tracking.
-- Apply after 003_security_hardening.sql.

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

alter table public.english_self_checks
  add column if not exists session_id uuid,
  add column if not exists updated_at timestamptz not null default now();

alter table public.fitness_daily_entries
  add column if not exists recovery_score integer check (recovery_score between 1 and 5),
  add column if not exists soreness_level text not null default 'none'
    check (soreness_level in ('none','mild','moderate','severe')),
  add column if not exists soreness_areas text[] not null default '{}',
  add column if not exists source text not null default 'manual'
    check (source in ('manual','text_import')),
  add column if not exists updated_at timestamptz not null default now();

alter table public.fitness_workouts
  add column if not exists daily_entry_id uuid references public.fitness_daily_entries(id) on delete cascade,
  add column if not exists exercise_key text,
  add column if not exists weight_kg numeric(6,2),
  add column if not exists reps_by_set integer[] not null default '{}',
  add column if not exists completed boolean not null default true,
  add column if not exists source text not null default 'manual'
    check (source in ('manual','text_import')),
  add column if not exists updated_at timestamptz not null default now();

alter table public.english_review_events enable row level security;

drop policy if exists "english_review_events_owner_select" on public.english_review_events;
drop policy if exists "english_review_events_owner_insert" on public.english_review_events;
drop policy if exists "english_review_events_owner_update" on public.english_review_events;
drop policy if exists "english_review_events_owner_delete" on public.english_review_events;
create policy "english_review_events_owner_select"
on public.english_review_events for select
to authenticated
using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_review_events_owner_insert"
on public.english_review_events for insert
to authenticated
with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_review_events_owner_update"
on public.english_review_events for update
to authenticated
using ((select auth.uid()) = user_id and (select public.is_dashboard_user()))
with check ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy "english_review_events_owner_delete"
on public.english_review_events for delete
to authenticated
using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));

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

create index if not exists english_review_events_user_reviewed_idx
  on public.english_review_events (user_id, reviewed_at desc);
create index if not exists english_review_events_card_idx
  on public.english_review_events (review_card_id);
create index if not exists english_review_events_user_session_idx
  on public.english_review_events (user_id, session_id);
create unique index if not exists english_self_checks_user_session_unique
  on public.english_self_checks (user_id, session_id)
  where session_id is not null;
create index if not exists fitness_workouts_daily_entry_idx
  on public.fitness_workouts (daily_entry_id);
create index if not exists fitness_workouts_user_plan_exercise_idx
  on public.fitness_workouts (user_id, plan_type, exercise_key, workout_date desc);
create unique index if not exists fitness_workouts_user_entry_exercise_unique
  on public.fitness_workouts (user_id, daily_entry_id, exercise_key)
  where daily_entry_id is not null and exercise_key is not null;

revoke all on public.english_review_events from anon;
grant select, insert, update, delete on public.english_review_events to authenticated;
