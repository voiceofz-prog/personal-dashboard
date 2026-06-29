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
| Status | Manual cross-project Jessica review loop implemented and published; awaiting build 2026.06.30.9 deployment and next Plan B execution. |
| Last updated | 2026-06-21 |
| Latest decision | Create a separate `05_personal-dashboard` project. Build a static PWA frontend hosted by GitHub Pages, with Supabase for Auth, RLS-protected data, and cloud sync. |
| Next action | Record the next Plan B execution, then let `02_Fitness_Nutrition` compare target versus actual and publish the second reviewed cycle. |

## Key References

| Reference | Location | Notes |
|---|---|---|
| App shell | `app/index.html` | Static PWA entrypoint. |
| App logic | `app/dashboard.js` | Demo data, local queue, cached reading, Supabase REST reads/writes, and reviewed-target execution. `app/app.js` is only a legacy-cache compatibility loader. |
| Styling | `app/styles.css` | Phone-first UI. |
| Supabase schema | `supabase/schema.sql` and migrations `001` through `008` | Tables, allowlist, RLS, review-cycle provenance, executable targets, minimum grants, indexes, and triggers. |
| Supabase seed | `supabase/seed_demo.sql` | Optional low-risk cloud demo rows after Vinson Auth UUID is known. |
| Data model | `docs/schema.md` | Table map, write paths, and live-read behavior. |
| Verification | `docs/verification.md` | Repeatable local checks and post-Supabase checks. |
| Pages workflow | `.github/workflows/deploy-pages.yml` | Project-local workflow template; publish this folder as the repo root or copy the workflow to the hosting repo root. |
| Setup guide | `docs/setup.md` | Local test, Supabase config, GitHub Pages deployment. |
| Security model | `docs/security.md` | Auth/RLS/private-data boundaries. |
