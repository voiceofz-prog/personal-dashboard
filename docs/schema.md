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
| `jessica_review_cycles` | Traceable English/Fitness evidence review, conclusion, and next focus. | Jessica publishes through the authorized connector; browser role is read-only. |
| `fitness_daily_entries` | Daily bodyweight, sleep, energy, recovery, soreness, and nutrition status. | Yes; offline-capable insert/update. |
| `fitness_workouts` | Structured Plan A/B exercise weight, reps by set, completion, date relation, and reviewed target provenance. | Only through the atomic Fitness RPC in the V1 UI. |
| `fitness_exercise_targets` | Jessica-reviewed executable weight/reps targets for each Plan A/B exercise. | Jessica publishes through the authorized connector; browser role is read-only. |
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
- `jessica_review_cycles`
- `fitness_daily_entries`
- `fitness_workouts`
- `fitness_exercise_targets`
- `fitness_plan_targets`
- `fitness_weekly_reviews`

Every live read includes a `user_id=eq.<current user id>` filter. RLS remains the security boundary; the explicit filter keeps the REST query aligned with the ownership rule and improves query planning.

English and Fitness load independently with settled requests. A failed module keeps its last successful cache and records its own diagnostic message without blocking the other module. An authenticated account with no rows receives a real empty state; demo values are never merged into cloud data.

Fitness executable-target reads also require `active=eq.true`. Rendering then revalidates target owner, the sole active Fitness review cycle, selected Plan, and unique `exercise_key`. Superseded targets remain available as history in Supabase but must never appear as selectable current exercises.

Historical workout provenance is protected at the database boundary: authenticated browser sessions have no write RLS policies for review cycles/targets, and referenced targets cannot be physically deleted because `fitness_workouts.target_id` uses `ON DELETE RESTRICT`. The only write-shaped grant is UPDATE on immutable `id`, which PostgreSQL requires for the atomic RPC's row locks and which RLS does not permit the browser to use for row modification.

## Fitness Cycle Lifecycle And Archive Contract

Fitness review data has two logical storage zones:

| Zone | Cycle state | Target state | Allowed use |
|---|---|---|---|
| Execution | exactly one `status = active` Fitness cycle | `active = true` | Current Dashboard display and new workout execution only |
| Archive | `status = superseded` or `completed` | `active = false` | Read-only provenance for historical workouts and Jessica reviews |

- Publishing a replacement cycle must move the previous cycle and all of its targets from Execution to Archive in the same transaction.
- Dashboard operational reads must never load Archive rows into the current Plan form.
- Archived cycles and targets must not be physically deleted while any `fitness_workouts.target_id` references them.
- Historical targets preserve the exact recommendation that produced a completed workout; they are evidence, not reusable templates.
- If physical cold storage is introduced later, it requires an explicit migration that preserves workout provenance and verified readback. Row deletion or `target_id = null` is not an acceptable archival method.

## English Dashboard Display Contract

The English dashboard is a commute-first review surface. The source project should publish short, low-risk review material that is ready for phone use:

- `english_focus_cards`: one current speaking focus, CEFR setting, tags, and 3-6 natural review sentences.
- `english_review_cards`: active commute, mistake, warm-up, and 30-second self-test cards sorted by `sort_order`.
- `english_problem_tracker` and `english_sessions`: learning analysis for Jessica and progress context; these should not be treated as the first-screen review experience.

Supabase is the sync layer, not the content judge. The English learning project is responsible for turning Mika feedback into a curated commute review pack before writing rows here.

## Write And Offline Contract

- Browser-created UUIDs identify new review events, summaries, daily entries, and workouts before a network connection exists.
- Pending operations store the complete Fitness daily entry and workout array as one owner-scoped RPC bundle.
- Inserts use idempotent upsert semantics. An offline insert followed by edits remains one insert containing the latest values.
- Pending operations sync only for the logged-in owner.
- `save_fitness_entry_atomic(jsonb, jsonb)` writes or updates one daily status row, reconciles its checked workouts, and commits them in one transaction.
- Before any trained-day write, the RPC locks and rechecks exactly one active Fitness review cycle. Every supplied `target_id` must be the sole active target for the same owner, Plan, `exercise_key`, and effective date.
- A stale, inactive, superseded, missing, mixed-cycle, or ambiguous target rejects the complete batch. The database never rebinds by comparing weight or reps.
- A deferred database trigger protects direct table writes from introducing stale or mixed-cycle target links.
- Completed historical workout rows retain their reviewed `target_id`; a new save must use targets from the currently active cycle.
- Legacy `training_content` remains a read-only display fallback. New progress and recommendations use structured workout rows.

## Manual Seed Flow

Use `supabase/seed_demo.sql` only after replacing `VINSON_AUTH_USER_UUID` with Vinson's real Supabase Auth UUID. It inserts low-risk curated demo rows so the live cloud dashboard has something visible after first login.
