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
