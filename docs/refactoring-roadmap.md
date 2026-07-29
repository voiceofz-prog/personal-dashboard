# Official Refactoring Roadmap

## Current Position

`project_brief.md` is now the higher authority for Personal Dashboard direction.

This roadmap is the engineering improvement plan for explicitly approved work on the current GitHub Pages + Supabase Dashboard. The current platform remains the formal system during approved refactoring stages, but this does not decide that it will remain the long-term platform forever.

The technical debt recorded here remains real. The change is priority and activation condition, not denial of the findings.

## Status

| Item | Decision |
|---|---|
| Authority | Conditional roadmap under `project_brief.md`. |
| Approved | 2026-07-10 |
| Historical baseline | `main` commit `548102181d67c07dfe8c9a05985bc21f3f182bcb` and frontend build `2026.07.06.2`. |
| Reactivation baseline | Local HEAD, remote `main`, and deployed Pages build were verified on 2026-07-29 as commit `e23f6a2ec16fc5a36736e04cfdb552583127a8a5`, frontend build `2026.07.29.3`. |
| Execution status | P0 is accepted. P1-English pure-logic extraction completed locally on 2026-07-30 and is stopped at its gate after main and independent review. |
| Approval gate | Stop at the P1-English gate. Fitness, data access, offline queue, database, P2, `main` merge, and production deployment require new explicit approval. |
| Production deployment | Not authorized during P1-English. |
| Platform position | GitHub Pages + Supabase remains the formal system during this work; long-term platform selection remains open. |
| P0 gate evidence | [p0-gate-report.md](p0-gate-report.md) |
| P1-English gate evidence | [p1-english-gate-report.md](p1-english-gate-report.md) |

## Continuity Rule

If this conditional roadmap is reactivated, the platform-independent curated display-content boundary remains governed by [dashboard-display-contract.md](dashboard-display-contract.md). Do not reintroduce a second display schema through PWA refactoring work.

Use this roadmap as the basis for approved refactoring stages. Do not repeat a full-project architectural analysis before starting or continuing an item unless the architecture has materially changed.

Routine feature additions, bug fixes, copy changes, styling changes, and small schema additions do not by themselves invalidate this roadmap. Reassess only the affected sections when possible.

A broader reassessment is justified when one or more of these changes occur:

- The static HTML/CSS/JavaScript PWA is replaced by, or migrated to, a different application framework or build architecture.
- GitHub Pages, Supabase, authentication, or the deployment model is replaced.
- The English/Fitness module boundary or curated-summary publishing contract changes materially.
- The global state, offline queue, cache, or synchronization model is replaced rather than incrementally improved.
- The Supabase schema or write contract changes enough that the current API, atomic Fitness RPC, or RLS assumptions no longer apply.

## Highest-Level Refactoring Goals

Every technical choice, module boundary, abstraction, and code change must identify which goals below it advances. Architectural cleanup, file splitting, a named design pattern, or possible future use is not sufficient justification by itself.

### S - Safer And Smoother Use

- `S1 - Data integrity`: Prevent data loss, duplicate writes, incorrect overwrites, and cross-user data mixing without changing existing behavior, business rules, field meaning, or workflows.
- `S2 - Ownership and sync consistency`: Preserve owner isolation and make offline queue, synchronization, retry, rejection, pending overlays, and atomic Fitness RPC behavior consistent.
- `S3 - Recoverable failures`: Expose understandable saved, pending, rejected, and error states with a recovery path; do not fail silently.
- `S4 - Mobile flow`: Improve phone loading, view switching, form entry, scrolling, focus handling, and incremental rendering while preserving the current interaction flow.
- `S5 - Compatibility`: Preserve required PWA, Service Worker, offline, legacy-data, CSP, iPhone Safari, and deployed-entry compatibility.
- `S6 - Verification and rollback`: Give every high-risk change automated coverage, acceptance evidence, and a practical rollback path.

### M - Lower Complexity And Maintenance Cost

- `M1 - Remove duplication`: Consolidate repeated logic, data transformations, condition checks, and helpers when they represent the same behavior.
- `M2 - One state authority`: Give each state and behavior one clear source of truth and one intentional update path.
- `M3 - Avoid accidental architecture`: Do not add wrappers, adapters, generic layers, or abstractions unless they solve a recorded duplication or coupling problem.
- `M4 - Reduce change radius`: Reduce coupling so a focused correction touches fewer unrelated areas and remains easy to locate and revert.
- `M5 - Remove obsolete paths safely`: Remove dead code, compatibility branches, and duplicate helpers only after usage and PWA-cache compatibility are verified.
- `M6 - Isolate pure behavior`: Consolidate scattered deterministic behavior into shared pure functions or one responsible module when this improves testing and ownership.
- `M7 - Separate mixed responsibilities`: Split long functions or files only where measured responsibilities, change coupling, or test friction justify the boundary.

### Success Standard

The refactor succeeds only when user operation is more stable and fluid, synchronization and offline behavior are safer, the same behavior has one clear authority, focused fixes have a smaller change radius, code is easier to read/test/diagnose/rollback, and all required features and business rules remain unchanged. File count, architecture names, and lower line count are not success measures.

## Execution Principles

- Add verification before moving behavior.
- Keep functional changes separate from structural changes.
- Use the simplest sufficient implementation. Never reduce line count by compressing readability, removing error handling, weakening validation, or reducing testability.
- Before adding an abstraction, record the actual duplication or coupling it removes. If total code increases, record the safety, test, or maintenance value created by the increase.
- For every bounded change, record goal IDs, before/after complexity or duplication, affected files, test results, risk, and rollback method.
- Make one bounded change at a time. Each change must use an independent commit that can be verified and reverted on its own.
- Preserve `app/dashboard.js` as the deployed compatibility entry or generated bundle so old PWA shells continue to load safely.
- Do not introduce React, Next.js, or another application framework solely to split files.
- Treat timestamped Supabase migrations as the deployment history; do not apply `schema.sql` to the live project as an ad hoc repair.
- Handle database-policy alignment in a separate change from frontend modularization.
- Do not modify Language or Fitness source-project business logic. If an issue originates in an Additional Folder, report the cross-project impact and obtain explicit approval before changing it.

## Agent Collaboration Rule For P1 And P2

P1 and P2 use a lead-and-review workflow: the main Codex is Tech Lead, Task Planner, Integration Owner, and Final Reviewer. Architecture, Governance, this Roadmap, shared contracts, cross-project boundaries, commit integration, rollback decisions, and gate decisions remain main-Codex responsibilities.

For every non-trivial bounded change:

1. A read-only Discovery Agent maps current responsibility, dependencies, duplication, side effects, and the minimum viable boundary.
2. The main Codex reviews that evidence and defines the exact implementation scope and unchanged behavior contract.
3. One Implementation Agent completes only that bounded change.
4. A separate Validation Agent that did not implement the change independently checks contracts, regression risk, Governance, tests, and diff scope.
5. The main Codex personally reviews the actual diff and evidence, resolves objections, runs or confirms final tests, and accepts, returns, or narrows the change.

Every delegated task must state one task, readable scope, writable files, prohibited areas, unchanged contracts, acceptance conditions, and the required report format. Agents may not expand scope, edit Governance/Roadmap/shared contracts, decide cross-project changes, fix incidental bugs, merge, push `main`, or deploy. Scope-out findings must be reported with evidence only.

Parallel work is permitted only when tasks have no ordering dependency and no shared file, module, state flow, data contract, migration, or fixture. Offline queue, owner isolation, Supabase API, atomic RPC, RLS, and migrations default to sequential execution. Discovery, implementation, independent validation, and main review remain ordered gates.

Choose agent models only from capability descriptions exposed by the active environment. Use the strongest available reasoning/review capability for architecture, high-risk data flows, and validation; a faster lower-cost model may handle a narrow local implementation. Prefer a different model or independent context for validation. If capability differences cannot be verified, use automatic selection and do not infer them from model names.

Agent reports must be compressed into findings, changes, evidence, tests, risks, and recommendations without hiding failures, assumptions, disagreements, or unverified behavior. A sub-agent completion claim or passing-test claim is never sufficient without main-Codex diff and evidence review.

## Stage Approval And Gates

- P0 items 0 through 4 were accepted on 2026-07-30. Commit `6a97c1e` is the accepted local/remote P0 checkpoint on `refactor/p0-safety-rails-20260729`.
- Automated tests, physical iPhone acceptance, and phone-width visual baselines are separate evidence sets and must be reported separately.
- The P1-English bounded change is complete locally at commit `b3dd100` and accepted by main final review after independent validation reported no findings.
- Do not modify the Language or Fitness projects, Fitness Dashboard behavior, Supabase API, offline queue, SQL, RLS, Service Worker, deployment configuration, or shared display contract in this bounded change.
- Stop at the P1-English gate and report agent/model assignments, commits/files, before/after responsibility and code size, removed duplication, added abstractions, tests, validation objections and resolutions, remaining risks, rollback, and the recommendation on whether to authorize Fitness next.
- Do not merge `main`, deploy production, or modify the formal Supabase project without separate approval.

## Priority Roadmap

### P0 - Establish Safety Rails

0. `[S6, M4]` Verify the current local HEAD, remote `main`, historical baseline, build marker, and deployed Pages version; isolate work in a clean branch or worktree so existing uncommitted changes cannot enter refactoring commits.
1. `[S1, S2, S5, S6]` Add an automated verification command covering:
   - JavaScript syntax checks.
   - JSON parsing for demo data and the web manifest.
   - Existing Fitness target-link, session-security, and Service Worker tests.
   - App version and service-worker cache-version consistency.
   - Required PWA asset presence.
2. `[S6, M4]` Run verification in GitHub Actions before runtime-config generation, artifact upload, and the Pages deployment step.
3. `[S1, S2, S3, M2, M6]` Add characterization tests for current behavior before extracting it:
   - Fitness recommendation modes: pending, maintain, progress, conservative, recovery, and explicit training lock.
   - Fitness report generation and draft normalization.
   - English card ordering and seven-day progress calculations.
   - Offline queue merge, owner isolation, pending overlay, retry, and rejection behavior.
   - Demo-data normalization and the composed Home summary.
4. `[S4, S5, S6]` Record a small set of phone-width reference screenshots, define a separate physical iPhone acceptance checklist, and repeat both after structural releases.

### P1 - Extract Pure Domain Logic

1. `[M1, M2, M4, M6]` Extract English normalization, card ordering, progress statistics, and review-session grouping into one responsible English boundary.
2. `[S1, M1, M2, M4, M6]` Extract Fitness normalization, recovery calculation, recommendation, report generation, and Plan A/B inference into one responsible Fitness boundary.
3. `[S1, S2, S6, M3]` Keep `fitness-target-link.js` as an independently tested contract; merge it only if equivalent coverage exists and a measured duplication or coupling problem justifies the merge.
4. `[S1, S5, S6, M3]` Keep inputs and outputs unchanged during extraction; do not alter thresholds, wording, persistence fields, or target-selection rules in the same change.

Candidate source boundaries, not required architecture outcomes:

| Module | Responsibility |
|---|---|
| `domains/english` | Normalization, review ordering, seven-day statistics, session summaries. |
| `domains/fitness` | Normalization, recommendation, recovery state, report generation, Plan inference. |
| `infrastructure/supabase-api` | Auth, REST reads/writes, token refresh, atomic Fitness RPC, error classification. |
| `infrastructure/offline-queue` | Queue reduction, owner isolation, pending overlays, retry policy, legacy adoption. |
| `views/*` | DOM lookup, event binding, and module-specific rendering. |
| `main` | Initialization, state coordination, and deciding which view to update. |

Create a candidate boundary only when its bounded-change record identifies the repeated behavior, mixed responsibility, or change coupling it resolves. If source modules require a build step, justify that added complexity first; then prefer a small pinned bundler configuration that produces the existing classic `app/dashboard.js` entry. Keep generated output unminified initially for reviewability and preserve current CSP and PWA loading behavior.

### P1 - Separate Data Access And Offline Queue

1. `[M2, M4, M6]` Move duplicated Supabase request construction and response mapping behind one small API boundary.
2. `[S3, M2]` Standardize write outcomes as `saved`, `pending`, or `rejected` so UI messages do not infer network behavior.
3. `[S1, S2, M1, M2]` Separate current queueable operations from legacy-migration allowlists.
4. `[S1, S3, M1, M2]` Centralize retry classification so permanent client or contract errors are not queued indefinitely.
5. `[S1, S2, S5]` Preserve the complete Fitness entry as one atomic queued RPC bundle.

### P1 - Align Database Change Management

1. `[S1, S2, M2]` Document the mapping between repository SQL files and timestamped migrations recorded by the live project.
2. `[S1, S6, M2]` Use CLI-generated timestamped migration filenames for all future database changes.
3. `[S1, M2, M5]` Treat `schema.sql` as a generated or explicitly versioned reference snapshot, not a second independent deployment path.
4. `[S1, S2, S6]` Add a new migration, only after database tests exist and a separate P1 approval is granted, to align live RLS policies with the optimized policy forms represented in the repository.
5. `[S1, S6]` Run security and performance advisors after DDL changes.
6. `[S1, S6, M4]` Keep Auth settings changes, including leaked-password protection, separate from code refactoring.

### P2 - Make Rendering Incremental

1. `[S4, M1, M2, M4]` Build the dashboard/view model once per state transition instead of repeatedly cloning and composing it from each renderer.
2. `[S4, M4]` Render only the active or affected module after local form actions, sync results, and filters.
3. `[S4, M4, M7]` Move Home, English, Fitness, and Settings DOM bindings into separate view boundaries only where measured coupling and mixed responsibilities justify them.
4. `[S1, S4, M2, M4]` Give each form draft/edit lifecycle one responsible update path.
5. `[S4, S5, S6]` Preserve focus clearing, scroll reset, 16px iPhone inputs, and existing form-state protections.

### P2 - Remove Documentation And Version Drift

1. `[M2, M4]` Keep `README.md`, setup instructions, and important-file descriptions synchronized with actual entrypoints.
2. `[S5, S6, M2]` Use one version source where practical; otherwise enforce dashboard/service-worker version consistency in verification.
3. `[S5, M5]` Remove confirmed dead code and obsolete compatibility paths only after usage and PWA-cache behavior are verified.
4. `[M4, M7]` Reformat source only when a recorded readability, review, or diagnosis problem justifies it; otherwise skip it. Keep any approved reformat in an isolated behavior-neutral commit.

## Completion Criteria

The roadmap is complete when:

- User operations are measurably stable and fluid on phone and iPad.
- Offline data, synchronization, owner isolation, retry/rejection, and atomic Fitness writes remain safe and understandable.
- Each shared behavior and state has one clear responsibility source and update path.
- Focused fixes touch fewer unrelated areas than before, with the before/after change radius recorded.
- Code is easier to read, test, diagnose, and roll back; any added code has documented safety, test, or maintenance value.
- All required features, business rules, field meanings, persistence behavior, and user workflows remain unchanged.
- Pure English, Fitness, queue, mapping, and composition behavior has automated coverage, and Pages deployment cannot proceed when verification fails.
- No regression is observed in login, module reads, English review, Fitness Quick Log/editing, atomic target linkage, offline queue ownership, reconnection sync, Service Worker update, or iPhone Home Screen use.

## Deferred Work Record

P0 items 0 through 4 and the local P1-English bounded change are accepted. Work is stopped at the P1-English gate. Fitness, Supabase API, offline queue, database work, P2, `main` merge, and production deployment remain deferred pending explicit approval. Do not jump directly to file splitting without Discovery evidence and main-Codex boundary approval.
