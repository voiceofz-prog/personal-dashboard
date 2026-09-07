-- Add English review cards for commute review, mistake fixes, Mika warm-up, and 30-second self tests.
-- Run after 001_initial_schema.sql on an existing Personal Dashboard Supabase project.

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

alter table public.english_review_cards enable row level security;

drop policy if exists "english_review_cards_owner_select" on public.english_review_cards;
drop policy if exists "english_review_cards_owner_insert" on public.english_review_cards;
drop policy if exists "english_review_cards_owner_update" on public.english_review_cards;
drop policy if exists "english_review_cards_owner_delete" on public.english_review_cards;

create policy "english_review_cards_owner_select"
on public.english_review_cards for select
using (auth.uid() = user_id and public.is_dashboard_user());

create policy "english_review_cards_owner_insert"
on public.english_review_cards for insert
with check (auth.uid() = user_id and public.is_dashboard_user());

create policy "english_review_cards_owner_update"
on public.english_review_cards for update
using (auth.uid() = user_id and public.is_dashboard_user())
with check (auth.uid() = user_id and public.is_dashboard_user());

create policy "english_review_cards_owner_delete"
on public.english_review_cards for delete
using (auth.uid() = user_id and public.is_dashboard_user());

drop trigger if exists english_review_cards_set_updated_at on public.english_review_cards;
create trigger english_review_cards_set_updated_at
before update on public.english_review_cards
for each row execute function public.set_updated_at();

create index if not exists english_review_cards_user_type_order_idx
on public.english_review_cards (user_id, card_type, active, sort_order);

grant select, insert, update, delete on public.english_review_cards to authenticated;
