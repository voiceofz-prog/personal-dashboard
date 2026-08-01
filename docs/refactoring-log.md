# Refactoring Change Log

Use one entry per bounded change. Each entry must identify the governing Roadmap goals, measured before/after state, affected files, verification evidence, risk, and rollback path.

## BC-P0-000 - Carry Forward Approved Roadmap Context

- Commit: `42a79cd`
- Goals: `S6`, `M4`
- Before: The isolated worktree started from remote `main` and did not contain the 27-line approved Roadmap platform-position and activation-context update that remained uncommitted in the primary worktree.
- After: The isolated Roadmap matches that approved primary-worktree Roadmap baseline without carrying any other modified or untracked file into the branch.
- Complexity and duplication: Documentation-only; 22 insertions and 5 deletions. No runtime code, duplicated logic, or application behavior changed.
- Affected files: `docs/refactoring-roadmap.md`.
- Verification: Exact `git diff --no-index` comparison against the approved primary-worktree Roadmap returned no difference; `git diff --check` passed.
- Risk: Low documentation-integration risk. The primary worktree remains unchanged.
- Rollback: `git revert 42a79cd` in the isolated branch.

## BC-P0-001 - Define Outcome Goals And Staged Gates

- Commit: This bounded documentation commit.
- Goals: `S1` through `S6`, `M1` through `M7`.
- Before: The Roadmap had one broad maintenance goal, architecture-oriented completion wording, no per-item goal mapping, and no explicit P0-only approval gate.
- After: The Roadmap has two highest-level outcome directions, explicit success criteria, simplicity and abstraction rules, goal IDs on every P0/P1/P2 item, a verified current deployment baseline, and a mandatory stop after P0.
- Complexity and duplication: Documentation-only. The Roadmap is longer because it now records decision constraints, evidence requirements, and rollback governance; no runtime code or duplicate implementation was added.
- Affected files: `docs/refactoring-roadmap.md`, `docs/refactoring-log.md`.
- Verification: Every numbered P0/P1/P2 item was enumerated with `rg` and has at least one goal ID; `git diff --check` passed; status contains only these two documentation files.
- Risk: Low runtime risk; medium governance risk if the staged gate or goal mapping is later bypassed.
- Rollback: Revert this bounded documentation commit; `42a79cd` remains independently reversible.

## BC-P0-002 - Add One Automated Verification Command

- Commit: This bounded verification-command commit.
- Goals: `S1`, `S2`, `S5`, `S6`, `M1`, `M2`.
- Before: JavaScript syntax, JSON parsing, three Node tests, version matching, PWA file presence, manifest icons, Service Worker app-shell coverage, and whitespace required separate manual commands or review.
- After: `node scripts/verify.mjs` discovers all root `app/*.js` files and `tests/*.test.mjs` tests, runs the checks, and returns one non-zero gate result on failure without changing project files.
- Complexity and duplication: Adds one dependency-free verification script to replace repeated command lists and manual version/asset comparisons. Application runtime code is unchanged.
- Affected files: `scripts/verify.mjs`, `docs/refactoring-log.md`.
- Verification: Run `node scripts/verify.mjs`; confirm all scripts, JSON files, tests, version checks, PWA contracts, and `git diff --check` pass.
- Risk: Low runtime risk. Main residual risk is a false sense of coverage for behavior not yet characterized in P0-3.
- Rollback: Revert this bounded commit; the previous individual checks remain available.

## BC-P0-003 - Put Verification Before Pages Deployment

- Commit: This bounded deployment-gate commit.
- Goals: `S6`, `M2`, `M4`.
- Before: The Pages workflow validated repository hygiene, generated runtime config, uploaded the app, and deployed without running the local application checks. Changes limited to tests or verification scripts did not trigger the workflow.
- After: `node scripts/verify.mjs` runs before runtime-config generation, artifact upload, and deployment. Changes under `scripts/**` and `tests/**` trigger the same gate.
- Complexity and duplication: Adds one workflow step, two path filters, and one self-check that keeps the deployment order explicit. No production runtime code changes.
- Affected files: `.github/workflows/deploy-pages.yml`, `scripts/verify.mjs`, `docs/refactoring-log.md`.
- Verification: Run `node scripts/verify.mjs`; its Pages-order check must pass. Review the workflow diff and confirm no deployment or secret-handling step changed.
- Risk: Medium CI risk because a verification defect can block deployment; production runtime risk is low because no app artifact changed.
- Rollback: Revert this bounded commit to restore the prior workflow; no production data rollback is required.

## BC-P0-004 - Characterize English And Home Composition

- Commit: This bounded characterization-test commit.
- Goals: `S1`, `S6`, `M2`, `M6`.
- Before: English review ordering, seven-day statistics, demo normalization, and Home composition were embedded in `app/dashboard.js` without direct automated behavior snapshots.
- After: A test-only VM harness executes the current functions without running Dashboard initialization or changing production code. Tests lock review priority, latest-event selection, seven-day calculations, actual demo normalization, Home summary composition, and non-mutation of source data.
- Complexity and duplication: Adds one reusable test harness plus two focused test files. The harness removes the need to copy production logic into tests and avoids adding a runtime test API.
- Affected files: `tests/helpers/dashboard-harness.mjs`, `tests/english-characterization.test.mjs`, `tests/dashboard-composition-characterization.test.mjs`, `docs/refactoring-log.md`.
- Verification: Run `node scripts/verify.mjs`; all pre-existing tests and both new characterization files must pass.
- Risk: Low production risk because `app/` is unchanged. Medium test-harness risk because the VM harness intentionally skips only the single top-level `init()` call.
- Rollback: Revert this bounded commit; the application artifact and existing verification command remain unchanged.

## BC-P0-005 - Characterize Fitness Decisions And Drafts

- Commit: This bounded Fitness-characterization commit.
- Current status: Partially superseded by `BC-P1-004`. The recommendation-mode, recovery-judgment, and Plan-advancement assertions were removed after P1 Discovery found unresolved Dashboard/Fitness authority conflicts. Safe report-formatting, draft-value, and trained-to-rest protection coverage remains.
- Goals: `S1`, `S3`, `S6`, `M2`, `M6`.
- Before: Fitness recommendation thresholds, explicit training-lock behavior, report text, numeric normalization, and trained-to-rest protection were embedded in the monolith without direct behavior snapshots.
- After: Tests lock pending, maintain, progress, conservative, recovery, and explicit-lock decisions; trained/rest report output; rest-draft field semantics; and rejection of converting a target-linked trained entry into a recovery entry.
- Complexity and duplication: Adds one focused test file that calls existing behavior through the shared test harness. No production logic or duplicate implementation is introduced.
- Affected files: `tests/fitness-characterization.test.mjs`, `docs/refactoring-log.md`.
- Verification: Run `node scripts/verify.mjs`; the new Fitness characterization test and all earlier checks must pass.
- Risk: Low production risk because `app/` is unchanged. Medium specification risk because the tests intentionally freeze current thresholds and wording for later behavior-neutral extraction.
- Rollback: Revert this bounded commit; no application or data rollback is required.

## BC-P0-006 - Characterize Queue Ownership And Atomic Outcomes

- Commit: This bounded queue-characterization commit.
- Goals: `S1`, `S2`, `S3`, `S6`, `M2`, `M6`.
- Before: Queue merge, owner filtering, pending overlays, retry classification, explicit rejection, and atomic Fitness RPC payload behavior were not covered together by local executable tests.
- After: Tests lock same-owner merge and insert-delete cancellation, cross-owner separation, current-owner overlays, pre-network owner rejection, HTTP 4xx `rejected` without queuing, HTTP 5xx `pending`, successful `syncPending()` retry, and one RPC body containing the complete daily entry plus workouts.
- Complexity and duplication: Adds one focused test file and exposes the existing `syncPending` function only inside the test VM. Production code remains unchanged and no queue logic is copied.
- Affected files: `tests/offline-queue-characterization.test.mjs`, `tests/helpers/dashboard-harness.mjs`, `docs/refactoring-log.md`.
- Verification: Run `node scripts/verify.mjs`; all queue outcomes and previous checks must pass.
- Risk: Low production risk because `app/` is unchanged. Medium test risk remains for real-browser storage events, true network interruption timing, and live Supabase/RLS behavior.
- Rollback: Revert this bounded commit; no local or remote user data is changed.

## BC-P0-007 - Separate Visual And Physical-Device Evidence

- Commit: This bounded P0 acceptance-evidence commit.
- Goals: `S4`, `S5`, `S6`, `M2`, `M4`.
- Before: Phone-width reference images were not stored, and physical iPhone checks were mixed into a long verification list without a separate pass state.
- After: Four authored-text phone-width JPEGs cover Login, Home, English, and Fitness; an independent physical iPhone checklist remains explicitly not run; verification documentation separates automated, visual, and physical-device evidence.
- Complexity and duplication: Adds four binary reference files, two focused evidence documents, one documentation cross-reference, and two lightweight artifact-format checks. No application runtime code changes.
- Affected files: `docs/visual-baselines/p0/*`, `docs/iphone-acceptance.md`, `docs/verification.md`, `scripts/verify.mjs`, `docs/refactoring-log.md`.
- Verification: Confirm `app/` has no diff; run `node scripts/verify.mjs`; inspect all four JPEGs for clipping, overlap, overflow, information hierarchy, and bottom-navigation alignment.
- Risk: Medium evidence risk. Chrome's actual capture area is shorter than a full iPhone viewport, so these images prove phone-width layout only; physical Safari and Home Screen behavior remains untested.
- Rollback: Revert this bounded commit to remove the evidence artifacts and checks; no application or user data rollback is required.

## BC-P0-008 - Characterize Legacy Queue Adoption

- Commit: This bounded legacy-compatibility test commit.
- Goals: `S1`, `S2`, `S5`, `S6`, `M2`.
- Before: The current queue path was characterized, but legacy ownerless-record adoption and its table allowlist were not directly covered.
- After: Tests lock adoption of supported ownerless records to the current user, preservation of an existing different owner, rejection of unsupported/malformed records, removal of the legacy key, and persistence to the current queue key.
- Complexity and duplication: Adds one focused test and exposes the existing adoption function only inside the VM harness. Production code and storage contracts are unchanged.
- Affected files: `tests/legacy-queue-characterization.test.mjs`, `tests/helpers/dashboard-harness.mjs`, `docs/refactoring-log.md`.
- Verification: Run `node scripts/verify.mjs`; the legacy queue test and every earlier check must pass.
- Risk: Low production risk. Real historical browser payload variants outside the current allowlist remain a manual compatibility risk.
- Rollback: Revert this bounded commit; no browser storage or user data is modified by the test.

## BC-P0-009 - Record The P0 Gate

- Commit: This bounded gate-report commit.
- Goals: `S6`, `M2`, `M4`.
- Before: P0 results, uncovered risks, P1 candidates, compatibility evidence, and rollback details were spread across command output and individual change records.
- After: One gate report records the verified baseline, local/remote/deployment state, test results, complete file list, uncovered risks, proposed P1 boundaries, compatibility analysis, and rollback plan. The Roadmap is marked stopped at P0.
- Complexity and duplication: Adds one durable report, two Roadmap status lines, and one evidence-presence check. No runtime code, schema, or production system changes.
- Affected files: `docs/p0-gate-report.md`, `docs/refactoring-roadmap.md`, `scripts/verify.mjs`, `docs/refactoring-log.md`.
- Verification: Run `node scripts/verify.mjs`; confirm a clean branch, no `app/` or `supabase/` diff from `e23f6a2`, and unchanged remote `main`/latest Pages run.
- Risk: Low runtime risk. The main residual risk is treating locally passing evidence as equivalent to hosted CI, live Supabase, or physical iPhone acceptance; the report explicitly keeps those states separate.
- Rollback: Revert this bounded gate-report commit; earlier P0 commits remain independently reviewable and reversible.

## BC-P1-000 - Adopt Lead-And-Review Execution Governance

- Commit: This bounded P1 governance commit.
- Goals: `S6`, `M2`, `M4`.
- Before: The Roadmap required bounded changes and approval gates but did not define formal main-Codex ownership, delegated-agent scopes, ordered discovery/implementation/validation phases, parallel-write limits, or model-selection evidence.
- After: P1 and P2 require main-Codex planning and final review, single-scope agent assignments, independent validation, ordered gates, restricted parallelism, capability-based model selection, and compressed evidence reports. The current approval is limited to P1-English and stops before every later domain or deployment action.
- Complexity and duplication: Adds one governance section and updates existing status/gate text. It introduces no runtime abstraction, application code, test fixture, or production-system change.
- Affected files: `docs/refactoring-roadmap.md`, `docs/refactoring-log.md`.
- Verification: Review the documentation diff; run `node scripts/verify.mjs`; confirm no file under `app/`, `supabase/`, `.github/`, Language, or Fitness changed.
- Risk: Low runtime risk. Process risk remains if future agent prompts or main review fail to enforce the documented boundaries; each gate report must include the actual assignments and exceptions.
- Rollback: Revert this bounded governance commit. The accepted P0 checkpoint remains at commit `6a97c1e` locally and on the remote branch.

## BC-P1-001 - Isolate English Domain Logic

- Commit: `b3dd100`.
- Goals: `S6`, `M2`, `M6`.
- Before: English card/event/self-check normalization, card ordering, seven-day progress, session grouping, and self-check ordering were seven top-level functions scattered across `app/dashboard.js`. Tests exposed two individual functions through the VM harness.
- After: One internal lexical `EnglishDomain` owns those seven behaviors. Callers retain DOM, state, storage, network, persistence, and cross-domain composition. The harness exposes the one boundary, and characterization tests cover normalization, latest-event ordering, inclusive cutoff, progress, grouping, self-check ordering, and non-mutation.
- Complexity and duplication: Runtime code increases by 11 lines for the namespace and injectable clock seams; the English test increases by 117 lines and the harness decreases by one. Old top-level implementations were removed, so no wrapper or duplicate logic remains. No external script, class, adapter, build step, or Service Worker change was added.
- Affected files: `app/dashboard.js`, `tests/english-characterization.test.mjs`, `tests/helpers/dashboard-harness.mjs`.
- Verification: Main and independent agents ran `node tests/english-characterization.test.mjs`, `node tests/dashboard-composition-characterization.test.mjs`, and `node scripts/verify.mjs`; all passed. Independent validation reported no findings.
- Risk: Low runtime risk because inputs, outputs, wording, persistence, and production clock defaults are unchanged. Residual risk remains for browser/iPhone behavior and uncharacterized invalid timestamps or normalization combinations.
- Rollback: Revert `b3dd100`; no SQL, data, cache-version, or production rollback is required.

## BC-P1-002 - Record The P1-English Gate

- Commit: This bounded gate-report commit.
- Goals: `S6`, `M2`, `M4`.
- Before: Agent assignments, rejected implementation detail, final diff review, code-size evidence, validation result, remaining risks, and stop state existed only in thread/tool output.
- After: One report records the complete P1-English evidence, the Roadmap is stopped at the gate, and all later domains and production actions remain explicitly deferred.
- Complexity and duplication: Adds one report and updates existing status/log text. No runtime, test, PWA, schema, or production-system behavior changes.
- Affected files: `docs/p1-english-gate-report.md`, `docs/refactoring-roadmap.md`, `docs/refactoring-log.md`.
- Verification: Run `node scripts/verify.mjs`; review `af9e491..HEAD`; confirm the branch is clean, the remote branch remains at `6a97c1e`, and no unauthorized path changed.
- Risk: Low runtime risk. Process risk remains if a later stage treats this local gate as deployment, physical-device, or live-Supabase acceptance; the report explicitly keeps those unverified.
- Rollback: Revert this gate-report commit; `b3dd100` remains independently reviewable and reversible.

## BC-P1-003 - Fix EnglishDomain Startup Initialization Order

- Commit: `916abf1`.
- Goals: `S5`, `S6`, `M2`.
- Before: `init();` executed near the top of `app/dashboard.js`. Real browser startup reached `composeDashboard` before the later lexical `EnglishDomain` constant was initialized and stopped with a `ReferenceError`; the VM tests removed `init()` and did not detect the order dependency.
- After: The same single `init();` call runs at the end of the classic script after every top-level lexical initialization. The English characterization test requires exactly one init call and verifies that EnglishDomain is initialized first. A fresh-origin local Chrome rerun passes the authorized Demo Preview Runtime Gate.
- Complexity and duplication: Moves one existing statement and adds one focused source-order assertion. It adds no runtime abstraction, fallback path, wrapper, or behavior branch.
- Affected files: `app/dashboard.js`, `tests/english-characterization.test.mjs`, `docs/p1-english-gate-report.md`, `docs/refactoring-log.md`.
- Unchanged areas: EnglishDomain function bodies, Fitness, Supabase API, offline queue, Service Worker, SQL, RPC, RLS, migrations, UI behavior, persistence, and data flow.
- Verification: `node tests/english-characterization.test.mjs`, `node tests/dashboard-composition-characterization.test.mjs`, and `node scripts/verify.mjs` passed. Local Chrome at `http://127.0.0.1:5191/` passed Login, Demo initialization, Home, English, existing and empty English data states, card ordering, seven-day statistics, grouping, Home summary, reload, and `390x844` navigation/input checks with zero Dashboard-origin console errors or warnings.
- Risk: Low code-change risk. Physical iPhone and real Supabase read-only checks remain unverified. The previously used `5187` origin served the old script from persisted PWA cache, so fresh-origin success is not same-origin deployment cache-upgrade evidence.
- Rollback: Revert this commit to return to remote checkpoint `017c2f0`; no data, SQL, cache-version, or production rollback is required.

## BC-P1-004 - Add Fitness Safe Characterization Safety Net

- Commit: `03a8d00`.
- Goals: `S1`, `S2`, `S6`, `M2`, `M6`.
- Before: Existing Fitness characterization mixed safe Dashboard projection/formatting behavior with assertions that froze disputed recovery judgment and one-row Plan advancement as correct contracts. Target projection, latest-row selectors, display fallbacks, and non-mutation had incomplete direct coverage.
- After: One focused test locks only target filtering/projection, fail-closed owner/cycle handling, distinct-date selection, report and summary fallbacks, deterministic output where a contract exists, and non-mutation. Disputed recommendation and Plan assertions are removed rather than preserved as green tests.
- Complexity and duplication: Adds 257 test-side lines and removes 92. Eight existing functions are exposed only inside the VM harness, while the disputed `computeFitnessRecommendation` export is removed. No production abstraction, copied implementation, shared formatter, class, wrapper, or framework is added.
- Affected files: `tests/fitness-projection-characterization.test.mjs`, `tests/fitness-characterization.test.mjs`, `tests/dashboard-composition-characterization.test.mjs`, `tests/helpers/dashboard-harness.mjs`.
- Verification: Main Codex and independent validation ran the four required individual tests, the new projection test, and `node scripts/verify.mjs`; all passed, with verify reporting 5 scripts and 9 tests.
- Risk: Low production risk because `app/` is unchanged. VM stubs do not prove browser startup/rendering, edit preservation, real RPC/provenance behavior, offline reconnection, timezone/device behavior, or physical iPhone behavior. The SQL atomic test remains outside verify discovery.
- Rollback: Revert `03a8d00`; production code and data remain unchanged.

## BC-P1-005 - Record The P1-Fitness Test Safety-Net Gate

- Commit: This bounded gate-report commit.
- Goals: `S1`, `S2`, `S6`, `M2`, `M4`.
- Before: Agent evidence, deliberately unlocked risky contracts, VM/runtime limits, SQL discovery gap, four independent high-risk workstreams, and the stop decision existed only in the active review context.
- After: One report records the accepted test boundary, commands and results, independent validation, main final review, remaining integration risks, rollback, and explicit rejection of Candidate 2 until the contract/data gates are resolved.
- Complexity and duplication: Adds one durable report and updates this log. It introduces no production code, test behavior, Roadmap architecture, schema, queue, PWA, or deployment change.
- Affected files: `docs/p1-fitness-test-safety-net-gate-report.md`, `docs/refactoring-log.md`.
- Verification: Run `node scripts/verify.mjs`; confirm the documentation diff is the only change after `03a8d00` and no production or cross-project path changed.
- Risk: Low runtime risk. Process risk remains if a later stage treats projection tests as approval of disputed Fitness business rules or treats VM evidence as browser, SQL, Supabase, PWA, or physical-device acceptance.
- Rollback: Revert this documentation commit; `03a8d00` remains independently reviewable and reversible.

## BC-P1-006 - Make Legacy Fitness RPC Create-Only

- Commit: `6d47ca7`.
- Goals: `S1`, `S2`, `S3`, `S6`, `M2`.
- Before: RPC v1 replaced every submitted daily/workout field and deleted omitted workouts. Existing ids and ambiguous retries could silently overwrite snapshots, hidden fields, source, and provenance-related payload values.
- After: Existing daily/workout ids and ambiguous replays fail with `FITNESS_V1_UPGRADE_REQUIRED`. Daily/workout writes are insert-only with conflict row-count checks, and omission delete reconciliation is removed. Owner, allowlist, active-cycle, target, RLS, grant, and transaction boundaries remain unchanged.
- Complexity and duplication: Adds a full replacement function migration because applied migrations remain immutable. The duplicated function body is migration history, not a new runtime abstraction; its additional lines preserve existing validation while narrowing writes to create-only.
- Affected files: `supabase/migrations/20260801014145_fitness_v1_existing_edit_guard.sql`, `tests/fitness-atomic-save.test.sql`.
- Verification: Static/main/independent diff review passed. The SQL fixture covers create, replay/edit rejection, omission preservation, workout-id rejection, and rollback evidence but is not executed because no authorized non-production PostgreSQL runtime is available.
- Risk: High until SQL runtime execution. The candidate is committed but the Safety Hotfix Gate remains open and nothing is deployed.
- Rollback: Before deployment, revert `6d47ca7`. After deployment, use a new reviewed migration; never restore unsafe v1 replacement silently.

## BC-P1-007 - Lock Existing Fitness Edit And Isolate Old Bundles

- Commit: `432197f`.
- Goals: `S1`, `S2`, `S3`, `S4`, `S5`, `S6`, `M2`.
- Before: Existing Fitness entries could enter the reduced edit form, normalize omitted fields, call RPC or queue, and replace local rows. Old atomic bundles were retried without an explicit create/edit classification.
- After: Existing-entry edit/save returns before normalization, RPC, queue, or local replacement and shows a history-protection message. New bundles carry create intent; old/unclassified bundles remain pending, do not call RPC or overlay the read model, and show a Settings warning. App/SW versions advance together to `2026.08.01.1`.
- Complexity and duplication: Adds three focused constants, one small intent predicate, two early guards, queue warning projection, and targeted tests. It adds no v2/v3 contract, class, adapter, repository, or Fitness business-rule abstraction.
- Affected files: `app/dashboard.js`, `app/service-worker.js`, `tests/fitness-edit-lock-characterization.test.mjs`, `tests/offline-queue-characterization.test.mjs`, `tests/helpers/dashboard-harness.mjs`.
- Verification: Node hotfix/Fitness/English/composition tests and `node scripts/verify.mjs` pass. Independent validation reported no blocking finding. Fresh-origin demo runtime and `390x844` smoke checks pass with no console warning/error.
- Risk: Real authenticated RPC, physical iPhone, old deployed PWA cache, and same-origin cache upgrade remain unverified. SQL execution remains the blocking gate item.
- Rollback: Revert `432197f` before deployment. If the server guard is deployed, do not remove it while reverting the client lock.

## BC-P1-008 - Record FIT-DATA-01 Safety And Production Impact Gates

- Commit: This bounded documentation commit.
- Goals: `S1`, `S2`, `S3`, `S5`, `S6`, `M2`, `M4`.
- Before: Candidate hotfix evidence, the incomplete agent attempts, aggregate production impact, runtime evidence, and the blocking SQL-runtime gap existed only in the active task context.
- After: Separate reports preserve Safety Hotfix and production read-only evidence. Security documentation records create-only v1, edit lock, and queue isolation. The Safety gate is explicitly not passed; permanent v2, merge, and deployment remain stopped.
- Complexity and duplication: Adds two evidence reports and focused security/log updates. No application, migration, test, Roadmap direction, source project, or production system changes.
- Affected files: `docs/security.md`, `docs/fit-data-01-safety-hotfix-gate-report.md`, `docs/fit-data-01-production-read-only-impact-gate-report.md`, `docs/refactoring-log.md`.
- Verification: Run `node scripts/verify.mjs`; review the documentation diff; confirm remote branch remains at `7486edc`, production migrations are unchanged, and the worktree is clean after commit.
- Risk: Evidence risk if the unexecuted SQL fixture is mistaken for a pass. Both reports explicitly keep it blocking.
- Rollback: Revert this documentation commit; candidate code commits remain independently reviewable.
