# P1-English Refactoring Gate Report

## Gate Decision

The P1-English bounded change and its startup-order fix are accepted by the main Codex final review and stopped at the P1-English Runtime Gate. Fitness, Supabase API, offline queue, database work, P2, `main` merge, production deployment, and formal Supabase changes remain unauthorized.

The English extraction commit is `b3dd100` (`refactor: isolate English domain logic`), and the standalone startup-order fix is `916abf1` (`fix: run dashboard init after EnglishDomain initialization`). Both are on `origin/refactor/p0-safety-rails-20260729`; nothing was merged or deployed.

## Runtime Gate Status

The P1-English Runtime Gate passes for the committed artifact in local Chrome with Demo Preview. A fresh origin at `http://127.0.0.1:5191/` showed Login, initialized Demo Preview, opened Home and English, loaded existing English records, produced the expected latest-event card order, displayed the empty seven-day state, preserved grouped Home records and Home summary, accepted non-submitted form input, and reinitialized after reload. The same flow passed at a `390x844` viewport with navigation, locator-driven scrolling, input, and reload.

The Dashboard-origin console had zero errors or warnings, including no undefined function or initialization error. Chrome's installed Grammarly extension produced five extension-origin messages; these were separated from application evidence. Physical iPhone and real Supabase read-only checks were not run and remain explicitly unverified. Fitness Discovery and every other refactoring stage remain paused pending new approval.

The first rerun on the previously used `5187` origin served the pre-fix script from persisted local PWA cache and reproduced the old error. The browser was then tested against unused port `5191`, which provided a clean origin for the committed files. This confirms the source fix and also preserves a deployment risk: a future release must verify cache-version/update behavior on the real origin rather than treating this fresh-origin test as PWA upgrade evidence.

## Task And Agent Split

| Phase | Owner | Model and effort | Scope and result |
|---|---|---|---|
| Planning and integration | Main Codex | Current host model; no explicit model override | Set boundaries, rejected behavior-changing Home deduplication, reviewed the actual diff, ran tests, committed, and made the gate decision. |
| Discovery | Raman | `gpt-5.6-terra`, high | Read-only responsibility/dependency analysis. Modified files: none. |
| Implementation | Chandrasekhar | `gpt-5.6-luna`, high | Modified only the three authorized files. The first result was returned for one receiver-dependency issue, then corrected within the same scope. |
| Independent validation | Locke | `gpt-5.6-sol`, xhigh | Read-only commit review and independent test run. Final result: no findings. Modified files: none. |

The model choices used the capability descriptions exposed by the active environment: balanced analysis for discovery, fast bounded implementation, and the strongest listed frontier review model for independent validation. Model selection did not replace scope, tests, or main review.

## Commits And Files

| Commit | Purpose | Files |
|---|---|---|
| `af9e491` | Record the formal P1/P2 lead-and-review governance and current approval gate. | `docs/refactoring-roadmap.md`, `docs/refactoring-log.md` |
| `b3dd100` | Isolate English pure logic and strengthen characterization evidence. | `app/dashboard.js`, `tests/english-characterization.test.mjs`, `tests/helpers/dashboard-harness.mjs` |
| `017c2f0` | Record the initial P1-English gate and stop state. | `docs/p1-english-gate-report.md`, `docs/refactoring-roadmap.md`, `docs/refactoring-log.md` |
| `916abf1` | Move the one startup call after EnglishDomain initialization and add regression coverage. | `app/dashboard.js`, `tests/english-characterization.test.mjs`, `docs/p1-english-gate-report.md`, `docs/refactoring-log.md` |
| This runtime-evidence commit | Record the clean-origin Chrome verification result. | `docs/p1-english-gate-report.md`, `docs/refactoring-log.md` |

No file under `supabase/`, `.github/`, Language, or Fitness changed. No index, Service Worker, manifest, CSS, demo-data, display-contract, API, queue, SQL, RLS, or deployment file changed.

## Responsibility Before And After

| Concern | Before | After |
|---|---|---|
| Review normalization | Three top-level functions near the general normalization helpers. | `EnglishDomain` owns card, event, and self-check normalization. |
| Card ordering | A top-level function near review-session DOM/state orchestration. | `EnglishDomain.orderReviewCards` owns latest-event selection and priority ordering; the session caller only starts the workflow. |
| Seven-day progress | A top-level function between English form orchestration and Fitness binding. | `EnglishDomain.progressStats` owns the complete deterministic calculation with an optional clock seam. |
| Session summaries | Grouping and self-check sorting were top-level helpers near rendering utilities. | Both are lexical EnglishDomain functions; Home composition only maps their results into cross-domain updates. |
| Shared review-cycle normalization | Shared by English and Fitness. | Intentionally unchanged outside EnglishDomain. |
| DOM, state, storage, network, persistence | Mixed in the same file but outside the moved functions. | Remains in existing callers; EnglishDomain has no dependency on these concerns. |

Seven implementations that were scattered from the review-session area through the general-helper area now have one lexical responsibility source. The old top-level implementations were removed; no compatibility wrappers or duplicate copies remain.

No semantic duplicate was removed because Discovery found that the superficially similar grouping/session-count behaviors and cloud/demo adapters have different contracts. Home summary deduplication was explicitly rejected because its displayed wording differs from the composed data wording; changing it would have been unauthorized behavior drift.

## Abstraction And Code Size

The only new abstraction is one internal IIFE namespace, `EnglishDomain`. It is necessary to establish a single testable responsibility boundary while preserving the deployed classic `app/dashboard.js` entry. A separate source file would require an app-shell/Service Worker or build-pipeline change that was outside this authorization. No class, adapter, wrapper, repository pattern, framework, external import, or build step was added.

| File | Before | After | Change |
|---|---:|---:|---:|
| `app/dashboard.js` | 2,437 lines | 2,448 lines | +11 |
| `tests/english-characterization.test.mjs` | 47 lines | 164 lines | +117 |
| `tests/helpers/dashboard-harness.mjs` | 190 lines | 189 lines | -1 |
| Total | 2,674 lines | 2,801 lines | +127 |

The runtime increase is the namespace and injectable time seams. Most added code is characterization evidence for normalization, grouping, inclusive cutoff behavior, latest self-check selection, and input non-mutation. Line count is observational and was not used as the acceptance criterion.

## Test And Review Results

| Command or review | Result |
|---|---|
| `node tests/english-characterization.test.mjs` | Pass |
| `node tests/dashboard-composition-characterization.test.mjs` | Pass |
| `node scripts/verify.mjs` | Pass: 5 application scripts and 8 test files, plus PWA/version/cache/deployment-order/whitespace checks |
| Main Codex forbidden-dependency scan | Pass: no DOM, state, storage, network, Supabase, or Fitness reference inside EnglishDomain |
| Independent Validation Agent | No High, Medium, or Low findings |
| Local Chrome, Demo Preview, desktop viewport | Pass: Login, Home, English, data, sort, seven-day empty state, grouping, Home summary, form input/cancel, and reload |
| Local Chrome, `390x844` viewport | Pass: Home/English navigation, locator-driven scroll, form input/cancel, and reload |
| Dashboard-origin console | Pass: 0 errors and 0 warnings |

The main Codex rejected the first implementation because `progressStats` depended on `this.sortedSelfChecks`, which made the function receiver-dependent. The Implementation Agent replaced it with lexical named functions and added the missing cutoff/self-check tests. The main Codex then reviewed the revised diff and reran all commands before commit. The independent Validation Agent reviewed the commit afterward and raised no further objections.

## Remaining Risks

- Physical iPhone Safari was not run. The `390x844` Chrome check is phone-width evidence only and does not replace it.
- Real Supabase read-only access was not run because this flow used Demo Preview. No live Auth, RLS, owner-isolation, RPC, or persistence claim is made.
- The old `5187` origin retained the pre-fix asset through local PWA cache. Fresh-origin `5191` proves the committed source behavior but not a same-origin deployed cache upgrade.
- Chrome's Grammarly extension emitted its own warnings/errors. The Dashboard origin emitted none, but a browser profile without unrelated extensions was not available through the connected Chrome session.
- Tests do not exhaust every equal-priority tie, invalid timestamp, or falsy normalization combination. These paths are statically unchanged but not individually characterized.
- Supabase persistence was not exercised. Payloads, tables, write orchestration, owner isolation, queue behavior, RPC, and RLS were not changed.
- The internal boundary improves responsibility ownership and tests but does not yet reduce the physical size of the deployed monolith. Creating an external source module would require a separately justified PWA/build compatibility change.
- An offline client can temporarily retain an older cached artifact until it reconnects; no release or cache-version change occurred because deployment was not authorized.

## Rollback

No database or production rollback is required. The remote pre-fix checkpoint is `017c2f0`. Revert `916abf1` to return to that checkpoint, then revert `b3dd100` only if the complete EnglishDomain extraction must also be withdrawn. Revert `af9e491` separately only if the formal agent-governance rule itself should also be removed.

## Next Recommendation

The local Demo Preview Runtime Gate now supports asking Vinson to re-approve Fitness Discovery. Do not begin it without that explicit approval. Physical iPhone, real Supabase read-only access, and same-origin PWA cache upgrade acceptance remain separate evidence and cannot be replaced by phone-width fresh-origin testing.
