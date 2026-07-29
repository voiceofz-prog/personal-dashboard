# P1-Fitness Test Safety-Net Gate Report

## Gate Decision

The approved test-only bounded change passes the local P1-Fitness-Test-Safety-Net Gate. Production code changed by zero lines. The branch remains stopped at this gate: Candidate 2, FitnessDomain extraction, Fitness production changes, live Supabase access, main merge, and deployment are not authorized.

The accepted starting checkpoint was `cedcf4d`. The test safety-net commit is `03a8d00`; this report and the refactoring-log update are kept in a separate documentation commit. Neither commit is pushed by this gate.

## Agent And Model Split

| Role | Agent | Model evidence | Scope and result |
| --- | --- | --- | --- |
| Test Discovery | Kepler | Explicitly assigned `gpt-5.6-terra`, high reasoning | Read existing Fitness tests and harness only; identified safe projection coverage and the old assertions that incorrectly froze disputed recommendation behavior. |
| Test Implementation | Faraday | Explicitly assigned `gpt-5.6-luna`, high reasoning | Changed only the four approved test-side files; made no commit and changed no production file. |
| Independent Validation | Dirac | Explicitly assigned `gpt-5.6-sol`, xhigh reasoning, independent context | Read-only diff and contract review; independently reran all required commands and reported no blocking finding. |
| Tech Lead and Final Reviewer | Main Codex | Host-managed model; no separately verifiable model identifier was exposed | Defined the safe and unsafe contract boundary, reviewed the actual diff, ran the full test gate, reconciled the validation finding, and made the commit decision. |

Discovery completed before implementation. Independent validation began only after implementation and main diff review. No agents wrote the same files in parallel.

## Commits And Files

### Test commit `03a8d00`

- `tests/fitness-projection-characterization.test.mjs`
- `tests/fitness-characterization.test.mjs`
- `tests/dashboard-composition-characterization.test.mjs`
- `tests/helpers/dashboard-harness.mjs`

The commit has 257 insertions and 92 deletions. This is test evidence rather than a production-code reduction metric. It adds one 234-line focused test file, removes the disputed recommendation assertions, narrows two older assertions, adds eight VM-only access points, and removes the VM export for `computeFitnessRecommendation`.

### Documentation commit

- `docs/p1-fitness-test-safety-net-gate-report.md`
- `docs/refactoring-log.md`

No file under `app/`, `supabase/`, `.github/`, Language, or the Fitness source project changed. No HTML, CSS, Service Worker, PWA cache, script order, startup asset, RPC, SQL, RLS, migration, queue, or deployment setting changed.

## Safe Contracts Locked

| Test area | Dashboard contract and regression protection | Test/runtime difference | Browser follow-up |
| --- | --- | --- | --- |
| Published target selection | `targetsForPlan` preserves Plan filtering and published `sort_order`, fails closed for no active cycle, owner mismatch, stale cycle, and no matching target, and does not mutate the read model. This is a Dashboard adapter/projection responsibility; `fitness-target-link.js` remains unchanged and retains contract authority. | Calls the real functions in a VM with fixed identifiers and no network. | Required later for rendered form binding and live read-model integration, not for this production-zero gate. |
| Exercise projection | Reviewed target id, exercise key/name, weight, reps, instructions, and display prefix project deterministically without mutating targets or workouts. This prevents field-mapping drift in the Dashboard display path. | The assertion uses reviewed targets and does not assert recovery mode, progress mode, or Plan selection. | Required later for actual form controls and DOM dataset binding. |
| Latest workout selector | Completed rows are filtered by Plan and latest distinct workout date without mutating the source array. Empty input is safe. Equal-date row order is deliberately not asserted, so no missing tie-break contract is invented. | Fixed ISO dates avoid current-time dependency; only observable selector output is asserted. | Browser rendering remains an integration check. |
| Latest entry and plan cards | Latest-entry selection, empty state, existing published detail, and Plan-card display fallback remain stable and non-mutating. These assertions do not select the next training Plan. | VM calls actual formatters with a minimal read model. | Browser card layout and event flow remain untested. |
| Fitness report formatter | An already normalized rest draft produces the current report wording; partial optional fields are safe and the input is not mutated. Fitness report wording remains separate from Home summary wording. | The VM does not submit a form or persist the result. | Form composition and copy/paste behavior need a later browser smoke test if runtime code changes. |
| Body, training, and entry summaries | Empty, partial, legacy display fallback, and completed display inputs produce stable readable summaries without mutation. A completed-row fixture is used only for display evidence, never for Plan advancement. | DOM rendering, timezone-dependent browser parsing, and persistence are outside the assertion. | Needed later for browser rendering and device/timezone integration. |
| Existing safe form guards | Report formatting, normalized safe field values, and blocking trained-to-rest conversion remain covered. The rest-draft assertion no longer asserts that preservation fields must be absent. | Form controls, UUIDs, Date, and state are stubbed by the VM harness. | Edit round-trip preservation requires a separate data-contract gate. |
| Home composition | Home still combines an English summary with a non-empty Fitness summary, but the assertion no longer declares `Plan A` to be the correct Fitness decision. | Composition runs without browser initialization. | Real Home rendering remains an integration check. |

The tests validate observable values and non-mutation. They do not duplicate production implementations or merely check that functions exist.

## Behavior Deliberately Not Locked

The old characterization assertions for pending, maintain, progress, caution, recovery, explicit training lock interpretation, and one-workout Plan alternation were removed. No new test treats any of the following as a correct contract:

- Dashboard-owned recovery, caution, progress, or load judgment.
- Dashboard selection or replacement of the next training Plan.
- A single completed workout as sufficient proof that a full Plan is complete.
- Missing `carbs_food` being written as `null` during edit.
- Existing `rpe`, `next_target`, or `source` being reset or lost during edit.
- Missing `target_id` or review-cycle provenance as acceptable.
- Either the Dashboard rule or Fitness source-project rule as final authority while their contract remains disputed.

The Node runner has no formal committed `todo`/`skip` governance. These disputed contracts are therefore recorded below instead of adding green tests that could be mistaken for acceptance.

## Harness And Runtime Limits

`tests/helpers/dashboard-harness.mjs` reads the real classic scripts into a Node VM and removes the single top-level `init();` before exposing selected lexical functions through `globalThis.DashboardCharacterization`. This commit changes only the export list; it does not change the source transform or stubs.

The harness uses a synthetic DOM, in-memory localStorage, blocked network fetch, immediate timers, deterministic UUIDs, a fixed Date, and no browser navigation or Service Worker. It therefore supports pure/projection behavior evidence but does not prove startup order, script loading, form event binding, rendering, focus, navigation, PWA caching, real offline reconnection, Supabase/RPC/RLS behavior, or physical-device behavior.

## Verification Results

Main Codex and the independent Validation Agent both reported passing results for the required commands:

```text
PASS node tests/fitness-characterization.test.mjs
PASS node tests/fitness-target-link.test.mjs
PASS node tests/fitness-projection-characterization.test.mjs
PASS node tests/offline-queue-characterization.test.mjs
PASS node tests/dashboard-composition-characterization.test.mjs
PASS node scripts/verify.mjs
```

`node scripts/verify.mjs` reported `Verification passed: 5 scripts, 9 tests.` It discovers only top-level files ending in `.test.mjs`. `tests/fitness-atomic-save.test.sql` is therefore still excluded and was not executed. This is a test-governance gap only; changing discovery or adding SQL execution is not part of this gate.

## Independent Validation And Final Review

Independent validation found no blocking defect and recommended acceptance. Its one residual finding is that the pre-existing offline-queue fixture does not include target/cycle provenance. That test proves transport and queue outcomes only; it must not be cited as proof of provenance preservation or real RPC acceptance.

Main Codex independently confirmed the four-file scope, reviewed each changed assertion and VM export, checked that no production asset changed, reran all required tests, and accepted the test commit. No new runtime abstraction, class, wrapper, adapter, repository pattern, shared formatter, or general framework was introduced.

## Unapproved High-Risk Workstreams

### FIT-CONTRACT-01 - Dashboard Recovery And Recommendation Responsibility

- Problem: Dashboard currently computes recovery/caution/progress modes and can replace published training presentation with a local recovery decision.
- Evidence: `app/dashboard.js` owns `computeFitnessRecommendation` and its consumers; `docs/jessica-review-loop.md` also says source projects determine their own targets while separately permitting Dashboard recovery replacement. The accepted Discovery Gate identified this authority conflict.
- Possible impact: Dashboard display or form defaults can diverge from the reviewed Fitness recommendation and alter the apparent next action.
- Required decision or source contract: Product owner plus the Fitness source-project contract authority must define which layer owns safety judgment and published recommendation interpretation.
- Suggested next gate: FIT-CONTRACT-01 Contract Authority Gate, limited to evidence reconciliation and an explicit ownership decision.

### FIT-CONTRACT-02 - Full-Plan Completion And Next-Plan Advancement

- Problem: `inferNextPlanFromFitness` can alternate Plans from any latest completed workout row, while the accepted Discovery evidence says the source contract may require completion of the full Plan.
- Evidence: `app/dashboard.js` selects one latest completed row in `inferNextPlanFromFitness`; existing save validation proves at least one completed exercise, not the source project's full-plan completion rule.
- Possible impact: A partial session can make the Dashboard present the wrong next Plan and affect subsequent target selection.
- Required decision or source contract: The Fitness source owner and product owner must define the authoritative completion unit and advancement evidence.
- Suggested next gate: FIT-CONTRACT-02 Completion Contract Gate before any selector or recommendation refactor.

### FIT-DATA-01 - Edit Round-Trip And Payload Field Preservation

- Problem: Current edit/form composition does not visibly preserve every persisted field, including `carbs_food`, `rpe`, `next_target`, and `source`.
- Evidence: `app/dashboard.js` normalizes these fields on read but its draft composition supplies a reduced field set; the atomic Fitness RPC upserts omitted or empty payload fields into persisted columns.
- Possible impact: A visually successful edit can silently null, reset, or replace previously stored data.
- Required decision or source contract: The shared Dashboard/Fitness payload contract owner and Supabase data owner must define round-trip preservation semantics for omitted and unchanged fields.
- Suggested next gate: FIT-DATA-01 Read-Only Round-Trip Evidence And Payload Contract Gate.

### FIT-DATA-02 - 2026-07-27 Target Provenance Reconciliation

- Problem: Accepted Discovery evidence records three 2026-07-27 exercise rows with unresolved target/cycle provenance.
- Evidence: The Fitness source-project task-board evidence was read during Discovery, but no live Supabase readback or reconciliation was authorized or performed in this gate.
- Possible impact: Historical execution may not be traceable to the exact reviewed target, weakening auditability and future recommendation evidence.
- Required decision or source contract: Fitness source owner, Dashboard integration owner, and Supabase data owner must confirm the expected target/cycle relationships from authoritative records.
- Suggested next gate: FIT-DATA-02 Read-Only Provenance Reconciliation Gate; no production write is implied by this registration.

## Remaining Risks

- Browser initialization, rendering, form binding, edit round-trip, offline reconnection, and actual RPC provenance enforcement are not covered by this VM test change.
- Real Supabase read-only behavior, live RLS/RPC response shapes, and the 2026-07-27 provenance state remain unverified.
- Physical iPhone acceptance remains unverified; phone-width simulation cannot replace it.
- Same-origin production PWA cache upgrade remains unverified; fresh-origin P1-English evidence cannot replace a deployment cache gate.
- `tests/fitness-atomic-save.test.sql` remains outside `verify.mjs` discovery and was not run.
- Fixed VM time and Node date behavior do not prove all browser/timezone combinations.

## Rollback

Revert the documentation commit to remove this gate record without changing tests. Revert `03a8d00` separately to restore the accepted `cedcf4d` test baseline. No application asset, SQL object, Supabase row, browser cache, or deployed version requires rollback.

## Next Recommendation

Do not approve Candidate 2 (`recommendedExercises` simplification) or a FitnessDomain extraction now. The safety net is useful, but FIT-CONTRACT-01, FIT-CONTRACT-02, FIT-DATA-01, and FIT-DATA-02 should receive explicit independent gates before any Fitness runtime refactor can safely define or preserve those behaviors.
