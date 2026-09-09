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
| Execution status | P0, P1-English, and the recorded Fitness safety fixes were integrated in accepted Universal Rebaseline Candidate `36217ba`; independent validation is complete and current `main` contains that commit. |
| Approval gate | Universal Rebaseline v1.1 authorizes this isolated candidate. Product-semantic ambiguity, production deployment, external-account access, and changes to source projects remain separate boundaries. |
| Production deployment | Not authorized by the Universal Rebaseline. |
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

This is an incremental refactor, not a rewrite. Preserve the static phone-first PWA, iPhone Safari compatibility, GitHub Pages deployment, Supabase RLS, offline queue ownership, and atomic Fitness save contract while the current Dashboard remains the formal system unless a separate product decision explicitly changes them.

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

## Agent Collaboration Rule

The main Codex owns architecture, contracts, invariants, scope, integration, rollback, and the final decision. It may perform discovery and implementation directly when the work is small or tightly coupled. Delegate only a bounded task when separate execution improves speed, cost, isolation, or review quality.

Acceptance for a non-trivial candidate requires an independent Validator that did not implement the candidate. The Validator receives the baseline, candidate, contracts, invariants, and acceptance conditions, and attempts to prove the candidate should be rejected. The main Codex reviews the actual diff and evidence, resolves objections, and repeats independent validation after any material fix.

Delegated tasks must state scope, allowed files, prohibited areas, unchanged contracts, and acceptance conditions. Delegates may not expand the target, change architecture or product semantics, modify source projects, merge, deploy, or access production. Parallel work is permitted only for tasks without shared state or ordering dependencies.

This role rule is capability-based; it does not require a permanent model chain or a separate agent for every discovery and implementation step.

## Stage Approval And Gates

- P0 items 0 through 4 were accepted on 2026-07-30. Commit `6a97c1e` is the accepted local/remote P0 checkpoint on `refactor/p0-safety-rails-20260729`.
- Automated tests, physical iPhone acceptance, and phone-width visual baselines are separate evidence sets and must be reported separately.
- The P1-English bounded change is complete locally at commit `b3dd100` and accepted by main final review after independent validation reported no findings.
- Later work must use the narrowest gate appropriate to its risk. Product-semantic conflicts require Vinson's decision; production, external-account, deployment, and source-project changes require separate authority.
- Do not treat an audit, plan, agent report, or passing development test as acceptance. Preserve a rollback reference and obtain independent validation for a non-trivial candidate.

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

P0 and P1-English retain their recorded validation evidence. The Fitness safety fixes are preserved as repository history and pass local Node/static checks, but their SQL fixture was not executed in this Rebaseline and no live database claim is made. Further Fitness recommendation or Plan-advancement refactoring remains deferred because source-project and Dashboard semantics are not yet reconciled. Supabase API restructuring, additional database work, P2 rendering changes, production deployment, and Sites evaluation require a new evidence-backed scope or separate authority. Do not jump directly to file splitting or technology migration.
