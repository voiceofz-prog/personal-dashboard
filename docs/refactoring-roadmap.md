# Official Refactoring Roadmap

## Status

| Item | Decision |
|---|---|
| Authority | This is the official refactoring roadmap for the Personal Dashboard project. |
| Approved | 2026-07-10 |
| Baseline | `main` commit `548102181d67c07dfe8c9a05985bc21f3f182bcb` and frontend build `2026.07.06.2`. |
| Execution status | Deferred. Do not start refactoring while primary product work has higher priority. |
| Start condition | Begin when the main feature set is complete or a suitable development gap is available. |

## Continuity Rule

Use this roadmap as the default basis for future refactoring work. Do not repeat a full-project architectural analysis before starting or continuing an item unless the architecture has materially changed.

Routine feature additions, bug fixes, copy changes, styling changes, and small schema additions do not by themselves invalidate this roadmap. Reassess only the affected sections when possible.

A broader reassessment is justified when one or more of these changes occur:

- The static HTML/CSS/JavaScript PWA is replaced by, or migrated to, a different application framework or build architecture.
- GitHub Pages, Supabase, authentication, or the deployment model is replaced.
- The English/Fitness module boundary or curated-summary publishing contract changes materially.
- The global state, offline queue, cache, or synchronization model is replaced rather than incrementally improved.
- The Supabase schema or write contract changes enough that the current API, atomic Fitness RPC, or RLS assumptions no longer apply.

## Goal

Reduce maintenance cost and improve module boundaries without changing current user-visible behavior, offline behavior, security boundaries, or stored-data semantics.

This is an incremental refactor, not a rewrite. Preserve the static phone-first PWA, iPhone Safari compatibility, GitHub Pages deployment, Supabase RLS, offline queue ownership, and atomic Fitness save contract unless a separate product decision explicitly changes them.

## Execution Principles

- Add verification before moving behavior.
- Keep functional changes separate from structural changes.
- Make one bounded extraction at a time and deploy only after the existing checks pass.
- Preserve `app/dashboard.js` as the deployed compatibility entry or generated bundle so old PWA shells continue to load safely.
- Do not introduce React, Next.js, or another application framework solely to split files.
- Treat timestamped Supabase migrations as the deployment history; do not apply `schema.sql` to the live project as an ad hoc repair.
- Handle database-policy alignment in a separate change from frontend modularization.

## Priority Roadmap

### P0 - Establish Safety Rails

1. Add an automated verification command covering:
   - JavaScript syntax checks.
   - JSON parsing for demo data and the web manifest.
   - Existing Fitness target-link tests.
   - App version and service-worker cache-version consistency.
   - Required PWA asset presence.
2. Run verification in GitHub Actions before the Pages deployment step.
3. Add characterization tests for current behavior before extracting it:
   - Fitness recommendation modes: pending, maintain, progress, conservative, recovery, and explicit training lock.
   - Fitness report generation and draft normalization.
   - English card ordering and seven-day progress calculations.
   - Offline queue merge, owner isolation, pending overlay, retry, and rejection behavior.
   - Demo-data normalization and the composed Home summary.
4. Record a small set of phone-width reference screenshots and repeat the physical iPhone acceptance flow after structural releases.

### P1 - Extract Pure Domain Logic

1. Extract English normalization, card ordering, progress statistics, and review-session grouping into an English domain module.
2. Extract Fitness normalization, recovery calculation, recommendation, report generation, and Plan A/B inference into a Fitness domain module.
3. Keep `fitness-target-link.js` as an independently tested contract or merge it into the Fitness domain only after equivalent tests exist.
4. Keep inputs and outputs unchanged during extraction; do not alter thresholds, wording, persistence fields, or target-selection rules in the same change.

Suggested source boundaries:

| Module | Responsibility |
|---|---|
| `domains/english` | Normalization, review ordering, seven-day statistics, session summaries. |
| `domains/fitness` | Normalization, recommendation, recovery state, report generation, Plan inference. |
| `infrastructure/supabase-api` | Auth, REST reads/writes, token refresh, atomic Fitness RPC, error classification. |
| `infrastructure/offline-queue` | Queue reduction, owner isolation, pending overlays, retry policy, legacy adoption. |
| `views/*` | DOM lookup, event binding, and module-specific rendering. |
| `main` | Initialization, state coordination, and deciding which view to update. |

If source modules require a build step, prefer a small pinned bundler configuration that produces the existing classic `app/dashboard.js` entry. Keep the generated output unminified initially for reviewability and preserve the current CSP and PWA loading behavior.

### P1 - Separate Data Access And Offline Queue

1. Move Supabase request construction and response mapping behind a small API boundary.
2. Standardize write outcomes as `saved`, `pending`, or `rejected` so UI messages do not need to infer network behavior.
3. Separate current queueable operations from legacy-migration allowlists.
4. Centralize retry classification so permanent client or contract errors are not queued indefinitely.
5. Preserve the complete Fitness entry as one atomic queued RPC bundle.

### P1 - Align Database Change Management

1. Document the mapping between repository SQL files and the timestamped migrations recorded by the live project.
2. Use CLI-generated timestamped migration filenames for all future database changes.
3. Treat `schema.sql` as a generated or explicitly versioned reference snapshot, not a second independent deployment path.
4. Add a new migration, after database tests exist, to align live RLS policies with the optimized policy forms represented in the repository.
5. Run security and performance advisors after DDL changes.
6. Keep Auth settings changes, including leaked-password protection, separate from code refactoring.

### P2 - Make Rendering Incremental

1. Build the dashboard/view model once per state transition instead of repeatedly cloning and composing it from each renderer.
2. Render only the active or affected module after local form actions, sync results, and filters.
3. Move Home, English, Fitness, and Settings DOM bindings into their own view modules.
4. Make one component responsible for each form's draft/edit lifecycle.
5. Preserve focus clearing, scroll reset, 16px iPhone inputs, and existing form-state protections.

### P2 - Remove Documentation And Version Drift

1. Keep `README.md`, setup instructions, and important-file descriptions synchronized with the actual entrypoints.
2. Use one version source where practical; otherwise enforce dashboard/service-worker version consistency in verification.
3. Remove confirmed dead code and obsolete compatibility paths only after usage and PWA-cache behavior are verified.
4. Reformat difficult-to-review source files only in isolated, behavior-neutral commits.

## Completion Criteria

The roadmap is complete when:

- `dashboard.js` is a small coordinator or generated compatibility bundle backed by cohesive source modules.
- Pure English, Fitness, queue, and mapping behavior has automated coverage.
- Pages deployment cannot proceed when verification fails.
- Frontend writes expose explicit saved, pending, and rejected states.
- Live Supabase migration history and repository migration guidance have a documented, repeatable relationship.
- No regression is observed in login, module reads, English review, Fitness Quick Log/editing, atomic target linkage, offline queue ownership, reconnection sync, service-worker update, or iPhone Home Screen use.

## Deferred Work Record

This roadmap is intentionally not active work. Feature completion remains the current priority. When capacity becomes available, start at P0 and proceed in order; do not jump directly to file splitting without the safety rails.
