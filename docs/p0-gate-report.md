# P0 Refactoring Gate Report

## Gate Decision

P0 items 0 through 4 are complete on the isolated `refactor/p0-safety-rails-20260729` branch and stopped at the P0 gate. P1 and P2 are not authorized. Nothing was pushed or deployed to production.

## Verified Baseline Relationship

| Item | Verified result |
|---|---|
| Historical Roadmap baseline | Commit `548102181d67c07dfe8c9a05985bc21f3f182bcb`, build `2026.07.06.2` |
| Relationship to current main | Historical baseline is an ancestor and is 6 commits behind current `main` |
| Local HEAD before P0 | `e23f6a2ec16fc5a36736e04cfdb552583127a8a5` |
| Remote `main` | `e23f6a2ec16fc5a36736e04cfdb552583127a8a5` |
| Formal Pages deployment | Build `2026.07.29.3`; Dashboard and Service Worker version markers match semantically |
| Latest production Pages run | Run `30461534770`, success, head `e23f6a2ec16fc5a36736e04cfdb552583127a8a5` |
| P0 isolation | Ignored worktree `.cache/refactor-p0`, branch `refactor/p0-safety-rails-20260729` |
| Primary worktree | Existing modified and untracked files remained untouched; none entered P0 commits |

## Gate Results

| Gate | Result | Evidence |
|---|---|---|
| Unified local verification | Pass | `node scripts/verify.mjs`: 5 application scripts and 8 Node test files passed |
| JSON and syntax | Pass | All root `app/*.js`, demo JSON, and manifest JSON passed |
| Existing contracts | Pass | Fitness target-link, session-security, and Service Worker tests passed |
| Characterization coverage | Pass | English, Home/demo, Fitness, current queue, atomic outcomes, and legacy queue adoption passed |
| Version and PWA assets | Pass | Dashboard/Service Worker versions, manifest icons, required files, and app-shell coverage passed |
| Workflow gate order | Pass locally | Verification is before runtime config, upload, and deploy; hosted branch run not executed because the branch was not pushed |
| Local HTTP preview | Pass | `/`, Dashboard, Service Worker, manifest, demo data, and three PNG icons returned HTTP 200 |
| Phone-width visual baseline | Pass with limitation | Four JPEGs inspected; no first-screen overlap or horizontal clipping; capture area is shorter than a full iPhone viewport |
| Physical iPhone acceptance | Not run | Defined in [iphone-acceptance.md](iphone-acceptance.md); production deployment was not authorized |
| Live Supabase/RLS/SQL tests | Not run | No database change was made and production-system testing was not authorized |
| Production deployment | Not run | Remote `main` and latest Pages run remain at the pre-P0 commit |

## Added Or Modified Files

### Governance And Evidence

- `docs/refactoring-roadmap.md`
- `docs/refactoring-log.md`
- `docs/p0-gate-report.md`
- `docs/verification.md`
- `docs/iphone-acceptance.md`
- `docs/visual-baselines/p0/README.md`
- `docs/visual-baselines/p0/phone-width-login.jpg`
- `docs/visual-baselines/p0/phone-width-home.jpg`
- `docs/visual-baselines/p0/phone-width-english.jpg`
- `docs/visual-baselines/p0/phone-width-fitness.jpg`

### Verification And CI

- `scripts/verify.mjs`
- `.github/workflows/deploy-pages.yml`

### Characterization Tests

- `tests/helpers/dashboard-harness.mjs`
- `tests/dashboard-composition-characterization.test.mjs`
- `tests/english-characterization.test.mjs`
- `tests/fitness-characterization.test.mjs`
- `tests/offline-queue-characterization.test.mjs`
- `tests/legacy-queue-characterization.test.mjs`

No file under `app/`, `supabase/`, Language, or Fitness was changed by P0.

## Uncovered Risks

- The new workflow has passed local structural checks but has not run on GitHub-hosted Actions because the branch was not pushed.
- Physical iPhone Safari, Home Screen launch, keyboard/focus, full-height scrolling, real Service Worker upgrade, and real offline/reconnect flows remain unexecuted.
- The phone-width images use Chrome's available 375-390px capture area, not a complete 390 x 844 iPhone viewport.
- The VM tests intentionally skip Dashboard `init()`, so complete DOM event wiring and async startup ordering are not end-to-end browser tested.
- Real browser storage quota, multi-tab storage events, abrupt network interruption timing, and unknown historical payload variants remain outside current automated coverage.
- Live RLS ownership, SQL rollback behavior, and `tests/fitness-atomic-save.test.sql` were not executed against Supabase.
- The primary worktree still contains pre-existing uncommitted platform and documentation work. Reconciliation must remain separate before any merge.

## Proposed P1 Boundaries

These are candidates only. P1 requires new approval and each boundary must first show the measured duplication, responsibility mix, or change coupling it resolves.

| Candidate | Existing behavior to own | Current test safety rail |
|---|---|---|
| English pure boundary | Review-card normalization/order, seven-day statistics, self-check ordering, review-session grouping | English and Home characterization tests |
| Fitness pure boundary | Entry/workout normalization, recovery calculation, recommendation, report generation, Plan A/B inference | Fitness characterization and target-link tests |
| Supabase API boundary | Authenticated request construction, response mapping, token refresh, error classification, atomic RPC transport | Session-security and queue outcome tests; live RLS remains required separately |
| Offline queue boundary | Same-owner reduction, owner filtering, pending overlays, retry/rejection, legacy adoption, atomic bundle persistence | Current and legacy queue characterization tests |
| Database change-management track | Migration history mapping, schema snapshot authority, future RLS alignment | Separate approval and database tests required; do not combine with frontend extraction |

`fitness-target-link.js` should remain an independently tested contract unless later evidence proves that merging it removes real duplication without weakening target ownership or atomic-save guarantees.

## Compatibility Analysis

| Area | Preserved evidence | Remaining limitation |
|---|---|---|
| Offline data | Same-owner merge, insert-delete cancellation, pending overlay, 5xx pending, successful retry, and legacy adoption are characterized | Real storage quota, abrupt browser termination, and physical offline mode are not exercised |
| Owner isolation | Current-owner filtering, different-owner separation, owned cache tests, and pre-network owner rejection pass | Live RLS and cross-account browser acceptance remain untested |
| Atomic RPC | One pending item retains the complete daily entry plus workouts; retry posts one `save_fitness_entry_atomic` request body | SQL transaction/rollback test was not run against live Supabase |
| RLS | No schema, migration, Auth, or policy file changed; current production boundary is untouched | Repository/live-policy alignment was not revalidated during P0 |
| PWA cache | Service Worker test, app-shell coverage, asset presence, version consistency, and HTTP 200 checks pass; `app/` is unchanged | Real Safari update activation and Home Screen offline reopen remain manual |

## Rollback

- Production rollback: none required; P0 was not pushed or deployed and changed no database or runtime application file.
- Whole local P0 rollback: abandon the isolated branch/worktree after preserving any desired evidence; the primary worktree and remote `main` remain unchanged.
- Bounded rollback: use `git revert` on one commit at a time in reverse order. The sequence is recorded in `docs/refactoring-log.md` and Git history.
- If these commits are later merged, revert the affected bounded commit and rerun `node scripts/verify.mjs` before any deployment decision.
