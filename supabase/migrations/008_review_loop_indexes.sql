-- Cover review-loop foreign keys and existing owner foreign keys reported by the advisor.
-- Apply after 007_review_loop_grant_hardening.sql.

create index if not exists english_focus_cards_user_idx
  on public.english_focus_cards (user_id);
create index if not exists english_focus_cards_review_cycle_idx
  on public.english_focus_cards (review_cycle_id);
create index if not exists english_review_cards_review_cycle_idx
  on public.english_review_cards (review_cycle_id);
create index if not exists english_sessions_user_idx
  on public.english_sessions (user_id);
create index if not exists fitness_weekly_reviews_user_idx
  on public.fitness_weekly_reviews (user_id);
create index if not exists dashboard_tasks_user_idx
  on public.dashboard_tasks (user_id);

