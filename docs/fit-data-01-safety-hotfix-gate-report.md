# FIT-DATA-01 Safety Hotfix Gate Report

## Gate Decision

The candidate Safety Hotfix is implemented, independently reviewed, committed in bounded changes, and passes the available Node and fresh-origin browser checks. The Safety Hotfix Gate is **not yet passed** because the SQL fixture could not be executed against an authorized non-production PostgreSQL/Supabase runtime.

No commit is pushed. `main`, production GitHub Pages, and production Supabase remain unchanged. Permanent RPC v2, queue v3, correction/revision schema, source split, Fitness business rules, merge, and deployment remain stopped.

## Baseline And Commits

- Starting safe checkpoint: `7486edc` on `refactor/p0-safety-rails-20260729`.
- Server candidate: `6d47ca7` (`fix(fitness): make v1 atomic save create-only`).
- Client candidate: `432197f` (`fix(fitness): block unsafe existing-entry edits`).
- Documentation: this report, the separate production read-only report, `docs/security.md`, and `docs/refactoring-log.md` are a separate bounded documentation change.

## Agent And Review Split

| Role | Agent/model | Result |
| --- | --- | --- |
| Discovery | Sartre, `gpt-5.6-sol`, xhigh | Read-only. Tool quota prevented a complete SQL/race review; Main Codex did not adopt the incomplete proposal and independently completed the function, queue, and client analysis. |
| Production read-only query design | Leibniz, `gpt-5.6-sol`, xhigh | Did not produce a usable report before shutdown. Main Codex designed and reviewed the aggregate-only SQL, then executed it through the approved Supabase read-only connector. |
| Implementation | Peirce, `gpt-5.6-sol`, xhigh | Wrote only the approved candidate code/tests and stopped without claiming tests passed. Main Codex reviewed and tightened the partial diff. |
| First validation attempt | Averroes, `gpt-5.6-terra`, ultra | Made no changes but timed out without a report; it is not counted as evidence. |
| Independent validation | Pauli, `gpt-5.5`, xhigh, independent context | Read-only diff review and independent Node/verify rerun; no blocking finding. Explicitly kept SQL and browser runtime unverified. |
| Final reviewer | Main Codex | Reviewed the full diff, race/rollback paths, tests, production parity/aggregates, and browser runtime. Kept the gate open because SQL was not executed. |

No agents wrote the same files in parallel. Architecture, scope, production-query approval, commit boundaries, and final decision remained with Main Codex.

## Server Guard

The new migration keeps `save_fitness_entry_atomic(jsonb, jsonb)` security-invoker, owner-scoped, allowlist-protected, and target/cycle validated.

- Existing caller-owned daily ids fail before replacement or reconciliation with `FITNESS_V1_UPGRADE_REQUIRED`.
- Existing caller-owned workout ids fail before insert.
- Daily and workout writes use insert-only `ON CONFLICT DO NOTHING`; a zero row count raises the same upgrade token. This closes the concurrent-create race that a pre-insert `EXISTS` check alone would leave open.
- Exact and ambiguous v1 replays are rejected because v1 has no reliable request identity.
- Workout omission delete/reconciliation and both replacement `DO UPDATE` paths are absent.
- A conflict or later workout error raises inside the same function transaction, so earlier inserts roll back.
- Function execute grants remain revoked from public/anon and granted to authenticated.

## Client And Queue Guard

- Existing Fitness entries remain visible. The edit control displays `Editing Temporarily Paused`; activating it shows the full history-protection message and does not enter edit mode.
- `saveFitnessEntry` checks existing-edit state before normalization. A blocked save does not fetch, enqueue, replace local rows, update save state, or display success.
- New current-build Fitness bundles carry an explicit create intent. Direct and offline create payloads retain the existing RPC body.
- Old or unclassified Fitness bundles fail before the RPC, remain owner-scoped and pending, do not overlay untrusted edits onto the read model, and display a re-confirmation warning in Settings.
- The existing rejection of legacy separate daily/workout queue rows remains unchanged.
- App and Service Worker versions move together from `2026.07.29.3` to `2026.08.01.1` for a future deployment cache gate. This gate did not deploy them.

## Files

Runtime and migration:

- `app/dashboard.js`
- `app/service-worker.js`
- `supabase/migrations/20260801014145_fitness_v1_existing_edit_guard.sql`

Tests:

- `tests/fitness-atomic-save.test.sql`
- `tests/fitness-edit-lock-characterization.test.mjs`
- `tests/offline-queue-characterization.test.mjs`
- `tests/helpers/dashboard-harness.mjs`

Documentation:

- `docs/security.md`
- `docs/fit-data-01-safety-hotfix-gate-report.md`
- `docs/fit-data-01-production-read-only-impact-gate-report.md`
- `docs/refactoring-log.md`

No HTML, CSS, `fitness-target-link.js`, recommendation, Plan inference, completion rule, schema contract v2, source project, Language project, RLS policy, Service Worker strategy, deployment workflow, or existing migration changed.

## Automated Verification

Main Codex ran and passed:

```text
node tests/fitness-edit-lock-characterization.test.mjs
node tests/fitness-characterization.test.mjs
node tests/fitness-target-link.test.mjs
node tests/offline-queue-characterization.test.mjs
node tests/dashboard-composition-characterization.test.mjs
node tests/english-characterization.test.mjs
node scripts/verify.mjs
```

`verify.mjs` reported `Verification passed: 5 scripts, 10 tests.` Independent validation reran the five hotfix/composition tests and `verify.mjs` with the same passing result.

`tests/fitness-atomic-save.test.sql` now covers new create, existing daily edit, identical replay, omitted-workout preservation, existing workout-id reuse, unchanged original linkage, and no partial daily row. It was **not executed**. SQL remains outside `verify.mjs` by the previously recorded independent test-governance decision.

## Browser Runtime

- Server: `python -m http.server 5194 --bind 127.0.0.1` from the isolated `app/` directory.
- Browser: Codex in-app Chromium surface on fresh origin `http://127.0.0.1:5194/`.
- Passed: Login shell, Demo initialization, Home, English, Fitness read-only rendering, visible edit lock, unchanged create form after blocked edit, demo new recovery create, Settings build `2026.08.01.1`, reload initialization, and no horizontal overflow at `390x844`.
- Phone-width passed navigation Home -> English -> Fitness, textarea input, and long-page scrolling.
- Console warnings/errors: none.

The browser gate used demo data only. It did not prove real RPC, RLS, migration execution, a real old queue payload, physical iPhone behavior, or same-origin production PWA cache upgrade.

## Blocking And Remaining Risks

- **Blocking:** no local Docker, Podman, `psql`, or previously authorized non-production Supabase runtime was available. Production was read-only by decision. The SQL fixture therefore remains unexecuted, and the Safety Hotfix Gate cannot pass.
- Production still runs the unsafe baseline v1 RPC until a later deployment approval applies the reviewed migration.
- Real old-PWA and queue payload variants are characterized in VM tests, not exercised in a deployed browser origin.
- Physical iPhone, real authenticated Supabase runtime, and same-origin PWA cache upgrade remain unverified Integration/Deployment Gate items.
- The section badge still reflects the pre-existing generic `editable` label while the actionable control and toast clearly state the temporary lock; this is non-blocking presentation debt, not a persistence bypass.

## Rollback

Before any deployment, revert `432197f` to remove the client lock candidate and revert `6d47ca7` to remove the server migration candidate. No production data or cache rollback is required because nothing was pushed or deployed.

If a future approved deployment applies the migration, database rollback must be a new reviewed migration; do not silently restore unsafe v1 replacement semantics. Client rollback must preserve a server-side fail-closed guard until RPC v2 is accepted.

## Next Decision

Do not start permanent v2, queue v3, corrections, merge, or deployment. The next required evidence is an authorized disposable/local Supabase runtime that can apply repository migrations and execute `tests/fitness-atomic-save.test.sql`. After that passes, rerun the fresh-origin runtime gate and return for explicit approval.

