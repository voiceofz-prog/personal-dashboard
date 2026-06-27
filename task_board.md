# Task Board

## Now

- [ ] Review and approve security/content/logic/execution hardening changes.
- [ ] Apply `supabase/migrations/002_english_review_cards.sql` and `supabase/migrations/003_security_hardening.sql` after approval.
- [ ] Test authenticated cloud sync with the new English review cards table and hardened RLS policies.

## Next

- [ ] Create a Supabase project, create Vinson's Auth user, and run `supabase/schema.sql`.
- [ ] If the database already ran older migrations, apply `supabase/migrations/003_security_hardening.sql`.
- [ ] Insert Vinson's Auth user UUID into `dashboard_allowed_users`.
- [ ] Optional: run `supabase/seed_demo.sql` after replacing `VINSON_AUTH_USER_UUID`.
- [ ] Copy `app/config.sample.json` to `app/config.json` and fill the Supabase project URL, anon key, and Vinson email.
- [ ] Test local login, live reads, online insert behavior, offline queue, and pending sync.
- [ ] Configure GitHub Pages deployment for the `app/` static site from an independent repo root or copied root workflow.
- [ ] Verify iPhone Safari, Add to Home Screen, offline cache, and pending sync.

## Waiting

- [ ] Supabase project URL and anon key from Vinson.
- [ ] Vinson's Supabase Auth user UUID allowlist setup.
- [ ] GitHub Pages deployment choice from the next execution session.

## Done

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

## Decision Log

| Date | Decision | Reason |
|---|---|---|
| 2026-06-21 | Build dashboard as a separate `05_personal-dashboard` project. | `01_language-learning` is English-only and should not contain cross-project product code. |
| 2026-06-21 | Use GitHub Pages + Supabase for V1. | Static PWA frontend plus authenticated cloud data and RLS-protected writes. |
| 2026-06-21 | V1 includes English and fitness only. | These are approved low-risk long-term tracking domains; private destiny and immigration remain excluded. |
