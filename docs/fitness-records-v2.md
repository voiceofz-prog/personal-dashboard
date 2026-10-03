# Fitness records v2 — implementation and deployment gate

Approved scope: 2026-10-03. Candidate build: `2026.10.03.5`.

## Implemented behavior

Eight sport forms cover walking/running, hiking, cycling, swimming, ball sports,
custom strength, mobility/yoga and a named generic activity. Date/name are required;
measurements, strength sets/load, intensity, feeling and notes are optional. No
heart-rate/calorie estimates or device import. Multiple activities and Plan sessions
coexist on one date without requiring duplicate daily status entries.

All user-created Fitness facts have stable IDs, original snapshots, append-only
corrections with reasons, withdrawal/restoration and visible versions. Goals and
evaluations remain source-owned. Incorrect Plan identity/date/key is corrected by
withdrawal and a correctly linked replacement, never historical target rebinding.
Actual weight/reps/completion can be corrected against their historical targets.
Withdrawing a daily excludes its linked workouts without deleting them. Statistics
count distinct exercise dates separately from formal Plan completion. Unknown
measurements stay null; untouched legacy fields and supplementation are preserved.

Supported old create-only queues remain supported; unclassified legacy queues
stay protected. Current writes use V2 when its complete read surface exists.
Version conflicts preserve drafts for comparison/confirmation. Network-uncertain
saves retain their request ID; retry returns the existing receipt. Pending records
are owner-scoped and visibly pending, and cannot self-acknowledge a review.

## Interfaces and source integration

Migration: `supabase/migrations/20261003074631_fitness_records_v2.sql`, generated
by Supabase CLI 2.119.0. Existing migration checksums are unchanged.

`save_fitness_record_v2(p_request jsonb)` accepts exactly one of:

```json
{"request_id":"uuid","created_at":"ISO time","bundle":{"daily":{},"workouts":[]}}
```

```json
{"request_id":"uuid","created_at":"ISO time","changes":[{"kind":"daily|workout|activity","id":"uuid","operation":"create|revise|withdraw|restore","expected_version":1,"snapshot":{},"reason":"correction reason"}]}
```

Activity creates use expected version 0. Daily/workout creates use complete bundles
and existing target validation. Changes are atomic; request-ID reuse with different
content fails. `40001/FITNESS_VERSION_CONFLICT` requires a new request after
comparison. Receipts include request ID, transaction timestamp and accepted
revisions/bundle receipt. Transport failure is not proof of rollback.

New tables are `fitness_activities`, `fitness_record_heads`,
`fitness_record_revisions`, `fitness_save_receipts` and
`fitness_review_acknowledgements`. Current source reads use owner-filtered
`fitness_daily_effective`, `fitness_workouts_effective` and
`fitness_activities_effective`, with revision/withdrawal metadata. Original tables
remain immutable archives. Dashboard head/activity/acknowledgement reads paginate.

Authoritative source integration lives in project 02's
`.agents/skills/fitness-review/references/fitness-records-v2.md`, routed by the
existing execution contract. Its Skill and `07` workflow synchronize activities
and correction evidence, retain adopted versions, recompute effective events and
apply the unchanged `06` program. Exact-version source acknowledgements clear
pending review even when no new target cycle is needed. This capability remains
inactive against the legacy database. Production records/cycles were not modified.

## Security and consistency

Browser roles have SELECT only on new tables under owner/allowlist RLS. The public
RPC is invoker; a checked internal definer validates auth/allowlist, ownership,
revision, transition and original workout provenance. New views are invoker.
Original rows, revisions, receipts and acknowledgements reject update/delete.
Every V2 write acquires the legacy four-table exclusion locks in canonical order,
then activities, heads and revisions. Source fingerprints include effective
versions/withdrawals. Backfill keeps original timestamps; old creates register
original version 1 through triggers.

## Verified evidence and remaining acceptance

The existing disposable PostgreSQL 17 project `disposable-fit-data-01-20260801`
was resumed for this test. The full CLI-generated migration and synthetic SQL
fixture passed together inside an outer rollback, restoring its prior schema.
`tests/fitness-records-v2.test.sql` covers eight activity types, bundle/exact replay,
request collisions, revisions, withdrawal/restoration, stale conflicts, full-batch
rollback, RLS, original provenance, dependent exclusion and source-only review
acknowledgements. The disposable security advisor returned no findings.

Node tests cover input validation, unknown values, statistics, original versions,
stale offline overlays, ownership, request transport and acknowledgement behavior,
alongside existing regression suites. Browser demo acceptance verified ball-sport
creation, time correction (60→30), both versions, withdrawal/restoration and custom
strength at 12.5 kg with 10/10/8 reps. These are synthetic/demo tests.
Final build `2026.10.03.4` also verified consistent top/activity exercise-day
counts after demo saves, with a regression test for save/withdrawal recomputation.
Browser widths 390 and 768 had no horizontal overflow and no console errors.
The phone screenshot is `visual-baselines/fitness-v2-phone.jpg`; this is desktop
browser viewport evidence, not physical-device Safari evidence. The disposable
project was returned to its original paused state after testing.

## Joint source handoff acceptance

Vinson explicitly requested a Fitness representative on 2026-10-03. Execution
ownership stayed separate throughout the work:

| Execution owner | Goal and completed work | Evidence boundary |
|---|---|---|
| Fitness representative, project 02 | Loaded live governance and 06/07; checked source rules, updated capability/version semantics and source handoff state; independently judged nine shadow scenarios and ran the isolated source reducer. | Source decisions and test-only identity/version/provenance checks; no scheduled Skill run or real source publication. See project 02's `tests/fitness-records-v2-source-acceptance.md`. |
| Dashboard main agent, project 05 | Implemented consumer fixes from Fitness findings; ran twenty source-produced cases through the actual pending-review function and REST head projection; checked seven owned read surfaces, complete legacy fallback, partial-schema/permission/transport failure and pagination beyond 500 heads. | Actual local client code with mocked REST; no authenticated live round trip. |

The consumer snapshot is `tests/fixtures/fitness-source-handoff.json`, copied
without changing Fitness's expectations and carrying its source fixture SHA256.
Dashboard CI reads this portable test snapshot, not a sibling source project.
The fixture is synthetic and is never used as real training/review evidence.
Final `node scripts/verify.mjs` passed seven app scripts and twelve test suites;
the consumer snapshot was compared byte-hash/content against Fitness's canonical
fixture after both owners finished their work.

The representative found and the Dashboard agent fixed two integration gaps in
build `2026.10.03.5`: a later review time could incorrectly hide an unexamined
activity/correction, and partial V2 schema could silently fall back to raw rows.
Pending review now requires exact owner/kind/ID/revision acknowledgement or explicit
current-cycle version evidence. An unexamined activity remains pending without a
cycle. Legacy v1 daily/workout backfill remains on the legacy review path. Only
absence of all seven V2 read surfaces permits legacy fallback; failures stop reads.
The deployed checked save RPC must separately pass signed-in rollout acceptance.

Local candidate handoff is accepted; production activation remains pending. The
formal cutover execution owners are Dashboard for migration/frontend release,
Fitness for refreshed effective-source reads, real log synchronization and exact
acknowledgement/publication, and Dashboard for consumer readback and PWA checks.
Both repositories must be submitted independently. A push to Dashboard `main`
triggers Pages deployment, so it is itself part of the separately approved release.

Real authenticated REST round trips, production same-origin PWA updates and
physical iPhone/Safari remain deployment acceptance items. The standard source
Skill Python validator could not run because bundled Python lacks PyYAML;
frontmatter/reference routing and scoped whitespace were checked directly.

## Rollout and rollback

2026-10-03 release authorization: Vinson approved pushing the separately committed
Fitness and Dashboard repositories, including Dashboard's automatic Pages run.
Metadata-only production preflight confirmed all seven V2 read surfaces and the
V2 save RPC are absent. This frontend release therefore retains legacy data/save
behavior and shows activity saving as awaiting database upgrade. It does not apply
the migration or establish formal V2 activation; the cutover gates below remain.

1. Compare the real migration ledger/function/constraints with the repository;
   back up and rehearse restore in an authorized disposable database.
2. Pause source review scheduling, finish in-flight reviews and use the read-only
   switch during cutover. Apply only pending canonical migrations, ending with V2. Never
   run bootstrap/schema.sql on production. Verify version-1 counts against original
   rows, ownership, provenance, grants/RLS and complete effective views.
3. Deploy the frontend only after separate approval. Verify matching Dashboard/SW
   build on the same origin, retained old queues and physical iPhone acceptance.
4. Enable freshly loaded source V2 reads once the objects exist. Run a sourced
   activity/correction review, verify versions/acknowledgements without unintended
   Plan progression, then resume the existing review scheduling and enable writes.
5. If writes fail, set runtime `fitnessRecordsV2ReadOnly: true` (Actions variable
   `FITNESS_RECORDS_V2_READ_ONLY=true`) and deploy the V2-capable read-only frontend.
   Pending requests remain stored. Retain effective reads/history; do not restore
   a raw-row frontend, drop revisions or restore unsafe v1 replacement semantics.

Local demo: `node scripts/preview-fitness.mjs` serves `http://127.0.0.1:5204/`
without serving runtime Supabase configuration.
