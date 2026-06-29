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
| Read/write checks | Policies use `TO authenticated`, `(select auth.uid()) = user_id`, and `(select public.is_dashboard_user())`. |
| Data API grants | Dashboard tables are granted to `authenticated`; anon table access is revoked. |
| Browser key | Frontend uses only the Supabase anon key. |

## Tables

| Table | Purpose | Written by app |
|---|---|---|
| `dashboard_allowed_users` | Private allowlist for Vinson's Auth user UUID. | No; insert manually in SQL editor. |
| `english_focus_cards` | Current Mika focus, CEFR, tags, and review sentences. | No; maintained as curated dashboard summary data. |
| `english_sessions` | Curated session summaries, not raw transcripts. | No in V1 UI. |
| `english_problem_tracker` | Active / Improving / Stable problem tracker. | No in V1 UI. |
| `english_review_cards` | Commute cards, mistake cards, Mika warm-up prompts, and 30-second self-test prompts. | No; maintained as curated dashboard summary data. |
| `english_review_events` | One rating per reviewed card with a session id and content snapshots. | Yes; offline-capable insert. |
| `english_self_checks` | Editable completion summaries for English review sessions. | Yes; offline-capable insert/update. |
| `fitness_daily_entries` | Daily bodyweight, sleep, energy, recovery, soreness, and nutrition status. | Yes; offline-capable insert/update. |
| `fitness_workouts` | Structured Plan A/B exercise weight, reps by set, completion, and date relation. | Yes; offline-capable insert/update/delete. |
| `fitness_plan_targets` | Curated Plan A/B/Nutrition target cards. | No in V1 UI. |
| `fitness_weekly_reviews` | Weekly averages, training days, recovery summary, and next adjustment. | No in V1 UI. |
| `dashboard_tasks` | Optional dashboard module tasks. | No in V1 UI. |

## Live Dashboard Reads

After login, the app reads these tables through Supabase REST:

- `english_focus_cards`
- `english_sessions`
- `english_problem_tracker`
- `english_review_cards`
- `english_review_events`
- `english_self_checks`
- `fitness_daily_entries`
- `fitness_workouts`
- `fitness_plan_targets`
- `fitness_weekly_reviews`

Every live read includes a `user_id=eq.<current user id>` filter. RLS remains the security boundary; the explicit filter keeps the REST query aligned with the ownership rule and improves query planning.

English and Fitness load independently with settled requests. A failed module keeps its last successful cache and records its own diagnostic message without blocking the other module. An authenticated account with no rows receives a real empty state; demo values are never merged into cloud data.

## English Dashboard Display Contract

The English dashboard is a commute-first review surface. The source project should publish short, low-risk review material that is ready for phone use:

- `english_focus_cards`: one current speaking focus, CEFR setting, tags, and 3-6 natural review sentences.
- `english_review_cards`: active commute, mistake, warm-up, and 30-second self-test cards sorted by `sort_order`.
- `english_problem_tracker` and `english_sessions`: learning analysis for Jessica and progress context; these should not be treated as the first-screen review experience.

Supabase is the sync layer, not the content judge. The English learning project is responsible for turning Mika feedback into a curated commute review pack before writing rows here.

## Write And Offline Contract

- Browser-created UUIDs identify new review events, summaries, daily entries, and workouts before a network connection exists.
- Pending operations store `insert`, `update`, or `delete`, plus owner, target row id, attempts, and last error.
- Inserts use idempotent upsert semantics. An offline insert followed by edits remains one insert containing the latest values.
- Pending operations sync only for the logged-in owner.
- New fitness records write one daily status row plus only the exercises explicitly marked complete.
- Legacy `training_content` remains a read-only display fallback. New progress and recommendations use structured workout rows.

## Manual Seed Flow

Use `supabase/seed_demo.sql` only after replacing `VINSON_AUTH_USER_UUID` with Vinson's real Supabase Auth UUID. It inserts low-risk curated demo rows so the live cloud dashboard has something visible after first login.
