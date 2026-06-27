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
| Status | Local V1 scaffold implemented; waiting on external Supabase/GitHub setup |
| Last updated | 2026-06-21 |
| Latest decision | Create a separate `05_personal-dashboard` project. Build a static PWA frontend hosted by GitHub Pages, with Supabase for Auth, RLS-protected data, and cloud sync. |
| Next action | Configure Supabase URL/anon key/Auth user allowlist, then test login, cloud reads, inserts, offline queue, and GitHub Pages deployment. |

## Key References

| Reference | Location | Notes |
|---|---|---|
| App shell | `app/index.html` | Static PWA entrypoint. |
| App logic | `app/app.js` | Demo data, local queue, cached reading, Supabase REST reads/writes. |
| Styling | `app/styles.css` | Phone-first UI. |
| Supabase schema | `supabase/schema.sql` and `supabase/migrations/001_initial_schema.sql` through `003_security_hardening.sql` | Tables, allowlist, RLS policies, grants, indexes, update triggers, and hardening migration. |
| Supabase seed | `supabase/seed_demo.sql` | Optional low-risk cloud demo rows after Vinson Auth UUID is known. |
| Data model | `docs/schema.md` | Table map, write paths, and live-read behavior. |
| Verification | `docs/verification.md` | Repeatable local checks and post-Supabase checks. |
| Pages workflow | `.github/workflows/deploy-pages.yml` | Project-local workflow template; publish this folder as the repo root or copy the workflow to the hosting repo root. |
| Setup guide | `docs/setup.md` | Local test, Supabase config, GitHub Pages deployment. |
| Security model | `docs/security.md` | Auth/RLS/private-data boundaries. |
