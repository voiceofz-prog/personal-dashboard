# Fitness Target Cycle Fix — 2026-07-02

## Root Cause

The browser accepted any existing UUID `target_id` that matched owner, Plan, exercise, and date. It did not require that target to remain active or belong to the current active Fitness review cycle. The daily entry and each workout were then written as separate REST operations, so a cycle change or stale UI cache could produce partial success and mixed-cycle links.

## Contract Change

- The UI accepts only targets from exactly one active Fitness cycle.
- The server-side `save_fitness_entry_atomic(jsonb, jsonb)` RPC locks and rechecks the sole active cycle at write time.
- Every workout must supply the exact active target for owner + Plan + `exercise_key` + effective date.
- Any stale, inactive, superseded, missing, ambiguous, or mixed target rejects the complete transaction.
- A deferred constraint trigger protects direct writes to `fitness_workouts`.
- Weight and reps are never used to choose or repair a target.

## Data Repair

The three stale links in daily entry `3a9ed006-fcdd-4a8b-bcac-9503bdf520bf` were changed only after matching the same owner, date, Plan, exact `exercise_key`, superseded source cycle, and unique active target in cycle `9ce08ae2-c5b9-495d-a8c8-4eb91cb8b209`.

| Exercise | Old cycle | New target |
|---|---|---|
| `a_row` | `235a6e4b-955b-4a14-8a3e-9310414821f4` | `f3ccef04-7518-4742-8456-38811074e059` |
| `a_lateral_raise` | `fc52ab8c-1622-4bd5-b7eb-1567975107da` | `d5b1caa8-f1fa-41be-b5c4-0542e710dfd0` |
| `a_twist` | `fc52ab8c-1622-4bd5-b7eb-1567975107da` | `e4c10191-bfd3-46d9-9e9d-f7d09e84ccea` |

Only `target_id` changed. The confirmed `a_row` actual remains 6 kg and 15/15/15/15.
