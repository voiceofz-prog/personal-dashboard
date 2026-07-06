# Task Board

## Now

- [ ] Refresh the iPhone PWA and verify that low recovery warns without disabling conservative Plan B.

## Next

- [ ] Deploy Dashboard build `2026.07.05.1`, then verify that Plan A and Plan B each render only the five targets from the sole active Fitness cycle after refresh.
- [ ] Enable Supabase leaked-password protection if the project plan exposes that Auth option.
- [ ] Add a normalized free-text fitness parser in a future phase without changing the storage contract.
- [ ] Automate the Jessica review trigger only after the manual cycle is proven with real records.
- [ ] Verify Add to Home Screen and offline reopen on Vinson's physical iPhone after deployment.

## Waiting

- [ ] Physical-device acceptance after build `2026.07.02.1` is deployed to Safari.

## Done

- [x] Deployed and remotely verified Dashboard build `2026.07.06.2`; the live bundle uses explicit `training_lock` logic and the new service-worker cache.
- [x] Split low-recovery caution from explicit safety locks: only `training_lock=true` disables training, while recovery 2/5 without red flags can retain reduced executable targets.
- [x] Closed the 0-target recovery-cycle UI gap: both Plan A and Plan B are disabled during recovery, Quick Log defaults to recovery day, and completed training records cannot be converted into recovery records.
- [x] Applied `20260705031641_review_archive_hardening` plus the minimum immutable-id lock grant in `20260705032043_atomic_review_lock_privilege`: browser writes remain blocked by RLS, connector publication remains authoritative, the atomic save RPC keeps its race-prevention locks, and referenced historical targets cannot be deleted.
- [x] Formalized the Fitness cycle lifecycle as one active execution zone plus a non-executable superseded archive; physical deletion is forbidden while workouts reference historical targets.
- [x] Fixed the long-term Fitness target rendering leak: cloud reads now request only active targets, recommendation rendering revalidates owner + active cycle + Plan, duplicate keys fail closed, and regression tests cover accumulated superseded cycles.
- [x] Replaced per-row Fitness saves with one active-cycle-validated atomic RPC, repaired the three provable 2026-07-02 stale target links without changing actuals, and verified the live readback.
- [x] Created independent personal dashboard project scaffold.
- [x] Added phone-first static PWA files.
- [x] Added demo data for English and fitness modules.
- [x] Added Supabase schema and RLS policy draft.
- [x] Added setup, security, and continuation documentation.
- [x] Added live Supabase read queries for dashboard data after login.
- [x] Added browser cache for last successful dashboard data.
- [x] Added stricter Supabase allowlist table and RLS policies.
- [x] Added versioned SQL migration file.
- [x] Added GitHub Pages deployment workflow template for the `app/` folder.
- [x] Added Supabase data-model documentation.
- [x] Added optional low-risk Supabase demo seed SQL.
- [x] Added repeatable local verification guide.
- [x] Added English improvement log UI, demo data, seed data, and live Supabase mapping.
- [x] Added PNG PWA icons for iPhone Home Screen and manifest installability.
- [x] Tightened service worker offline fallback so only page navigations fall back to the app shell.
- [x] Verified local preview server responses for the app shell and core static assets.
- [x] Verified JSON files parse and schema matches the versioned migration.
- [x] Added local login-first privacy UI that hides internal dashboard modules before authentication.
- [x] Added local English review card UI/data model draft for commute cards, mistake cards, Mika warm-up, and 30-second self tests.
- [x] Reviewed security, content boundaries, app logic, and execution flow.
- [x] Hardened live REST reads with current-user filters.
- [x] Hardened local pending queue ownership and logout clearing behavior.
- [x] Added Supabase `003_security_hardening.sql` migration with stricter authenticated policies and anon revokes.
- [x] Confirmed the deployed site was stale compared with the local 2026-06-27 build.
- [x] Added safe migration for legacy ownerless pending records and visible Supabase write errors.
- [x] Fixed iPhone Safari form zoom, grid overflow, and tab scroll reset behavior.
- [x] Applied migrations `004` and `005` to the live Supabase project.
- [x] Added commute-first English review sessions, three-way ratings, seven-day progress, and editable summaries.
- [x] Added recovery-aware Plan A/B recommendations and structured exercise tracking.
- [x] Added owner-scoped idempotent offline insert/update/delete operations.
- [x] Reorganized Home, Fitness, and Settings around user decisions instead of engineering status.
- [x] Added review-cycle provenance and structured Jessica exercise-target adoption to the Dashboard contract.
- [x] Published and read back the first real English/Fitness cycles: one active cycle per domain, 8 linked English cards, and 5 targets for each Fitness plan.
- [x] Verified owner reads/writes, non-owner zero-row reads, non-owner write denial, and target provenance in the mobile flow.
- [x] Deployed build `2026.06.30.9` and verified the live service worker, compatibility loader, and current dashboard shell.
- [x] Hardened Fitness Save Today, edit, offline queue, and retry so Jessica-generated workouts require an exact owner/Plan/exercise/cycle/date target match.
- [x] Verified the five 2026-06-30 Plan B workouts each link to one target without changing workout measurements or status.

## Decision Log

| Date | Decision | Reason |
|---|---|---|
| 2026-06-21 | Build dashboard as a separate `05_personal-dashboard` project. | `01_language-learning` is English-only and should not contain cross-project product code. |
| 2026-06-21 | Use GitHub Pages + Supabase for V1. | Static PWA frontend plus authenticated cloud data and RLS-protected writes. |
| 2026-06-21 | V1 includes English and fitness only. | These are approved low-risk long-term tracking domains; private destiny and immigration remain excluded. |
| 2026-06-27 | English is commute-first; Fitness is next-training-first. | Review execution and readiness decisions are the primary goals, while progress analysis and quick reporting remain secondary. |
