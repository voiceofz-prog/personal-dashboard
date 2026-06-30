# Fitness target linkage fix — 2026-06-30

## Result

Fitness workout saves no longer rely only on the rendered `data-target-id`. Before direct save or pending sync, a Jessica-generated workout must resolve exactly one target using the authenticated owner, exact Plan, `exercise_key`, active Fitness review cycle, and target effective date.

Existing linked workouts preserve their historical target only when owner, Plan, `exercise_key`, and workout date remain compatible. Missing or ambiguous matches stop the write; reps and weight are never used for target matching.

## Verified linkage

| workout_id | target_id |
|---|---|
| `e1f1d76a-2cc1-40bc-b298-83cd1356a0fb` | `c5bfceb5-73be-44bb-b1d5-53c01d96e044` |
| `ffc9851e-d755-4f9e-8f26-2ac09a343adb` | `737e0d22-e640-49dd-9ebb-4dd0ccf7afc5` |
| `6f76f387-1199-494c-a3c2-30203cab0360` | `7113bce7-b415-49fa-9abb-41cc6b840392` |
| `ef2309c3-2893-4546-8375-f05a33293cc8` | `dff19e33-bc1e-407c-97ed-15301af9940f` |
| `3bb57607-6a54-49cc-a5ba-fe16a5429c29` | `f2b2b263-a3f5-457d-b51b-77d6539f739d` |

The live readback confirmed one candidate per workout under Fitness cycle `fc52ab8c-1622-4bd5-b7eb-1567975107da`. This file intentionally omits workout reps, weight, completion details, and other raw fitness content.
