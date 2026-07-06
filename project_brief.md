# Project Brief

## One-Line Goal

Build Vinson's private phone-first personal dashboard PWA for English learning and fitness tracking.

## Scope

| Area | Notes |
|---|---|
| In scope | PWA shell, phone-first UI, English module, fitness module, Supabase Auth/database/RLS, GitHub Pages deployment docs, offline cache, pending sync queue. |
| Out of scope | Feng shui/destiny, immigration, medical diagnosis, public sharing, native iOS app, multi-user collaboration. |
| Success criteria | Vinson can open the dashboard on iPhone after Codex is closed, log in, review English and fitness status, enter fitness/self-check data, and use cached data offline. |
| Constraints | Private by default; only Vinson can read/write data after Supabase is connected; frontend must not expose service role keys or private transcripts. |

## Current Status

| Item | Summary |
|---|---|
| Status | Live Supabase uses an atomic, active-cycle-validated Fitness save RPC. Frontend build 2026.07.06.1 also locks Quick Log to recovery-day input while an active recovery cycle has 0 targets. |
| Last updated | 2026-07-06 |
| Latest decision | A 0-target recovery cycle is valid but must not leave Plan A/B selectable. During recovery, Quick Log forces recovery day, hides both Plans, and blocks converting an existing completed training record into a recovery record. |
| Next action | Deploy build 2026.07.06.1, refresh the iPhone PWA, and verify that the recovery cycle shows a recovery-only Quick Log until executable targets are republished. |

## Key References

| Reference | Location | Notes |
|---|---|---|
| App shell | `app/index.html` | Static PWA entrypoint. |
| App logic | `app/dashboard.js` | Demo data, local queue, cached reading, Supabase REST reads/writes, and reviewed-target execution. `app/app.js` is only a legacy-cache compatibility loader. |
| Styling | `app/styles.css` | Phone-first UI. |
| Supabase schema | `supabase/schema.sql` and migrations `001` through `009` | Tables, allowlist, RLS, review-cycle provenance, executable targets, atomic Fitness RPC, minimum grants, indexes, and triggers. |
| Supabase seed | `supabase/seed_demo.sql` | Optional low-risk cloud demo rows after Vinson Auth UUID is known. |
| Data model | `docs/schema.md` | Table map, write paths, and live-read behavior. |
| Verification | `docs/verification.md` | Repeatable local checks and post-Supabase checks. |
| Pages workflow | `.github/workflows/deploy-pages.yml` | Project-local workflow template; publish this folder as the repo root or copy the workflow to the hosting repo root. |
| Setup guide | `docs/setup.md` | Local test, Supabase config, GitHub Pages deployment. |
| Security model | `docs/security.md` | Auth/RLS/private-data boundaries. |
