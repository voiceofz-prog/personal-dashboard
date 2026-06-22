# Supabase Data Model

## Purpose

This schema stores only V1 dashboard data for English learning summaries and fitness/nutrition tracking. It intentionally excludes raw full Mika transcripts, Feng Shui/destiny/bazi/birth data, immigration records, medical diagnosis, credentials, and service-role keys.

## Security Shape

| Control | Implementation |
|---|---|
| Auth | Supabase Auth email/password login. |
| Vinson-only access | `dashboard_allowed_users` allowlist contains Vinson's Auth user UUID. |
| Ownership | Every dashboard data row has `user_id`. |
| RLS | Every table has Row Level Security enabled. |
| Read/write checks | Policies require `auth.uid() = user_id` and `public.is_dashboard_user()`. |
| Browser key | Frontend uses only the Supabase anon key. |

## Tables

| Table | Purpose | Written by app |
|---|---|---|
| `dashboard_allowed_users` | Private allowlist for Vinson's Auth user UUID. | No; insert manually in SQL editor. |
| `english_focus_cards` | Current Mika focus, CEFR, tags, and review sentences. | No; maintained as curated dashboard summary data. |
| `english_sessions` | Curated session summaries, not raw transcripts. | No in V1 UI. |
| `english_problem_tracker` | Active / Improving / Stable problem tracker. | No in V1 UI. |
| `english_review_cards` | Commute cards, mistake cards, Mika warm-up prompts, and 30-second self-test prompts. | No; maintained as curated dashboard summary data. |
| `english_self_checks` | Self-check form submissions. | Yes. |
| `fitness_daily_entries` | Daily quick-entry fitness/nutrition tracking. | Yes. |
| `fitness_workouts` | Plan A/B exercise performance and next target details. | No in V1 UI. |
| `fitness_plan_targets` | Curated Plan A/B/Nutrition target cards. | No in V1 UI. |
| `fitness_weekly_reviews` | Weekly averages, training days, recovery summary, and next adjustment. | No in V1 UI. |
| `dashboard_tasks` | Optional dashboard module tasks. | No in V1 UI. |

## Live Dashboard Reads

After login, the app reads these tables through Supabase REST:

- `english_focus_cards`
- `english_sessions`
- `english_problem_tracker`
- `english_review_cards`
- `english_self_checks`
- `fitness_daily_entries`
- `fitness_workouts`
- `fitness_plan_targets`
- `fitness_weekly_reviews`

If live reads fail or Supabase is not configured, the app stays in demo mode or uses the last successful cached dashboard data for the active browser session.

## Manual Seed Flow

Use `supabase/seed_demo.sql` only after replacing `VINSON_AUTH_USER_UUID` with Vinson's real Supabase Auth UUID. It inserts low-risk curated demo rows so the live cloud dashboard has something visible after first login.
