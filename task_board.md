# Task Board

## Direction Authority

Follow `project_brief.md` first for project goal, platform direction, phase priority, and conflict handling.

Current operational phase: Phase 0, maintain the existing formal GitHub Pages + Supabase Dashboard. Phase 1 display-contract specification is complete at [docs/dashboard-display-contract.md](docs/dashboard-display-contract.md). Do not start a full refactor, Sites migration, Supabase retirement, or major new feature without Vinson's explicit instruction.

## Now

- [ ] Keep the current GitHub Pages + Supabase Dashboard usable as the formal system and rollback baseline.
- [ ] Refresh the iPhone PWA and verify that low recovery warns without disabling conservative Plan B, if that current-use check is still needed.

## Next

- [ ] Phase 2, only after Vinson explicitly starts it: validate ChatGPT Sites as a pure-display candidate without changing the formal GitHub Pages + Supabase flow.
- [ ] Enable Supabase leaked-password protection if the plan exposes that Auth option and the existing Dashboard remains active.
- [ ] Add a normalized free-text fitness parser only if the current Dashboard remains a meaningful write surface.
- [ ] Automate the Jessica review trigger only after the manual cycle is proven and the target display platform is known.
- [ ] Verify Add to Home Screen and offline reopen on Vinson's physical iPhone.

## Waiting

- [ ] Physical-device acceptance after the current deployed build is refreshed in Safari.
- [ ] Sites replacement validation and Git ownership remain deferred until Vinson decides the platform is stable enough to evaluate formally.

## Done

- [x] Deployed and remotely verified formal Dashboard build `2026.07.06.2` with explicit `training_lock` behavior and the current service-worker cache.
- [x] Hardened Auth/RLS grants, owner isolation, review-cycle archive behavior, immutable provenance, atomic Fitness saves, and active-target rendering.
- [x] Implemented and verified traceable English/Fitness review cycles, curated cards/targets, and source-project ownership boundaries.
- [x] Established the phone-first PWA, offline cache/queue safeguards, iPhone fixes, demo mode, deployment validation, and security/setup documentation.
- [x] Completed Phase 1 platform-independent display contract v1 without changing the formal production workflow.
- [x] Prior implementation-level completion details remain in technical docs, migrations, tests, and Git history rather than this active board.

## Decision Log

| Date | Decision | Reason |
|---|---|---|
| 2026-06-21 | Build Dashboard as a separate project using GitHub Pages + Supabase for V1. | Keeps cross-project product code outside English and enables authenticated private data. |
| 2026-06-21 | V1 includes English and Fitness only. | These are approved low-risk domains; private destiny and immigration remain excluded. |
| 2026-06-27 | English is commute-first; Fitness is next-training-first. | Prioritizes review execution and readiness decisions. |
| 2026-07-11 | Local source projects and Skills are the durable core; presentation technology is replaceable. | Reduces long-term platform lock-in and maintenance weight. |
| 2026-07-11 | Keep GitHub Pages + Supabase formal until a separate validated switch decision. | Preserves security, rollback, and current usability. |
| 2026-07-11 | Phase 1 uses one platform-independent display contract. | Allows future renderers without binding source projects to one frontend. |
| 2026-07-16 | Defer Sites validation and Git-topology changes while the platform role is unstable. | Avoids making an experimental surface part of the formal architecture prematurely. |
