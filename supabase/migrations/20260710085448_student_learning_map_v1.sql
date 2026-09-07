create table public.english_learning_map_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  review_cycle_id uuid not null unique references public.jessica_review_cycles(id) on delete restrict,
  current_stage text not null check (length(btrim(current_stage)) > 0),
  current_main_module text not null check (length(btrim(current_main_module)) > 0),
  building_capability text not null check (length(btrim(building_capability)) > 0),
  why_current_module text not null check (length(btrim(why_current_module)) > 0),
  demonstrated_skills jsonb not null default '[]'::jsonb check (jsonb_typeof(demonstrated_skills) = 'array'),
  remaining_skills jsonb not null default '[]'::jsonb check (jsonb_typeof(remaining_skills) = 'array'),
  exit_criteria jsonb not null default '[]'::jsonb check (jsonb_typeof(exit_criteria) = 'array'),
  exit_readiness text not null check (exit_readiness in ('building', 'near', 'met', 'exited')),
  next_main_module text null,
  recent_progress_summary text not null check (length(btrim(recent_progress_summary)) > 0),
  repetition_risk text not null check (repetition_risk in ('low', 'elevated', 'high')),
  repetition_note text not null check (length(btrim(repetition_note)) > 0),
  mika_next_focus text null,
  recommendation_disposition text not null check (recommendation_disposition in ('adopted', 'partially_adopted', 'not_adopted', 'not_provided')),
  recommendation_reason text not null check (length(btrim(recommendation_reason)) > 0),
  evidence_period jsonb not null check (jsonb_typeof(evidence_period) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index english_learning_map_snapshots_user_updated_idx
  on public.english_learning_map_snapshots (user_id, updated_at desc);

alter table public.english_learning_map_snapshots enable row level security;

grant select on public.english_learning_map_snapshots to authenticated;

create policy "english_learning_map_owner_select"
on public.english_learning_map_snapshots
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and (select public.is_dashboard_user())
);
