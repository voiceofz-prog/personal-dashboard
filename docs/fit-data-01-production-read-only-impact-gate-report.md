# FIT-DATA-01 Production Read-Only Impact Gate Report

## Decision

The approved first-stage production read-only investigation is complete. It used only PostgreSQL catalog definitions and aggregate counts. No production row was inserted, updated, deleted, repaired, migrated, or returned with an identifier, date, health value, note, workout value, or raw text.

The deployed function is semantically aligned with repository baseline migration `009_atomic_fitness_workout_save.sql`, so aggregate interpretation was allowed to continue. The Safety Hotfix migration is not deployed; production still runs the unsafe replacement-style v1 function at the time of this report.

## Deployed Contract Parity

- Project: `personal-dashboard`; status was healthy.
- Deployed migration history includes `20260701232908_atomic_fitness_workout_save` and `20260706125725_protect_fitness_workout_provenance`.
- `public.save_fitness_entry_atomic(jsonb, jsonb)` matches baseline v1 semantics: authenticated Dashboard owner check, active Fitness cycle and target validation, daily/workout replacement upserts, and omission-based workout reconciliation.
- Deployed triggers match the repository contract: daily/workout updated-at triggers, target-linked provenance protection, and deferred active-cycle validation.

No repository/deployment mismatch was found, so the stop-on-parity-difference rule was not triggered.

## Aggregate Impact

| Aggregate | Result |
| --- | ---: |
| Daily rows | 50 |
| Workout rows | 87 |
| Daily `source` in fixed `manual` bucket | 50 |
| Workout `source` in fixed `manual` bucket | 87 |
| Daily rows with legacy `training_content` snapshot | 34 |
| Daily rows with non-empty `carbs_food` | 0 |
| Workout rows with non-empty `rpe` | 0 |
| Workout rows with non-empty `next_target` | 0 |
| Workout rows with `target_id` | 87 |
| Target owner match | 87 |
| Target-cycle owner/domain match | 87 |
| Unlinked workouts | 0 |
| Unlinked heuristic candidates | 0 |

The source query used only fixed buckets (`missing`, `manual`, `non_manual_other`); it did not return raw unexpected source values. Candidate analysis used Plan/exercise/date relationships internally and returned counts only.

## Interpretation

- The current production data does not expose non-empty `carbs_food`, `rpe`, or `next_target` values in aggregate, but that does not make replacement edit semantics safe or approve deleting those fields from the contract.
- Thirty-four daily rows contain legacy snapshots that an ordinary v1 edit can replace. This is enough production impact to keep the Safety Hotfix urgent.
- All 87 workouts currently have owner-consistent target/cycle linkage. No second-stage detail query is recommended now, because there is no unlinked candidate population to reconcile in this gate.
- Aggregate evidence cannot prove future payload safety, queue replay safety, or correctness of the permanent v2 field contract.

## Boundaries And Rollback

This gate made no repository or production change, so there is no data rollback. Its SQL can be rerun read-only if aggregate counts need refresh, but raw-row or second-stage detail access requires a separate approval. Permanent v2, queue v3, corrections, source-schema changes, repair, merge, and deployment remain unapproved.
