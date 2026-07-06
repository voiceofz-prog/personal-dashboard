# Security Model

## Core Rule

The dashboard is a private-login PWA. The website shell may be visible at a URL, but personal data must be protected by Supabase Auth and Row Level Security.

## Required Controls

| Control | Requirement |
|---|---|
| Authentication | Supabase Auth login for Vinson. |
| Authorization | RLS enabled on every personal data table. |
| Ownership | Every row has `user_id`. |
| Account allowlist | `dashboard_allowed_users` must contain Vinson's Auth user UUID. |
| Read policy | `auth.uid() = user_id` plus dashboard allowlist check. |
| Write policy | `auth.uid() = user_id` plus dashboard allowlist check. |
| Policy role scope | Policies use `TO authenticated`; anon has no dashboard table grants. |
| Query filter | Frontend live reads also include `user_id=eq.<current user id>` for defense-in-depth and query performance. |
| Frontend key | Supabase anon key only. |
| Forbidden key | Never expose service role key in browser files. |
| Public content | Login-first shell before authentication; no real personal cloud data before Supabase Auth. |
| Login-first UI | Unauthenticated visitors see a neutral login screen. If no Supabase runtime config exists, the app may offer Demo Preview with committed low-risk demo data only. |
| Browser hardening | `index.html` includes a restrictive CSP meta policy and no-referrer policy. |
| Search indexing | `robots.txt` disallows crawling; this is privacy hygiene, not a security boundary. |

## GitHub Security Layer

| Control | Requirement |
|---|---|
| Repository contents | The repo may contain only app source, docs, schema, demo data, and deployment workflow. No real `app/config.json`, `.env`, credentials, raw transcripts, or private records. |
| Repository visibility | Private repository is preferred. If the repository is public, treat all committed files as public and keep only low-risk curated dashboard material. |
| GitHub Secrets | Store only `SUPABASE_URL` and `SUPABASE_ANON_KEY` as Actions secrets. Never store or use the Supabase service role key for Pages deployment. |
| Workflow permissions | Pages workflow uses minimum required permissions: `contents: read`, `pages: write`, and `id-token: write`. |
| Artifact boundary | Workflow uploads only the `app/` folder as the Pages artifact. |
| Runtime config | Workflow generates `app/config.json` during deployment and fails if forbidden config files are committed or if the Supabase key looks like a service role token. The app runtime also rejects placeholder config, non-Supabase URLs, and service-role-like JWT keys. |
| Branch safety | Protect `main` before real private data is connected: require review or status checks for changes to `app/**`, `supabase/**`, `.github/**`, and `docs/security.md`. |

## Data Allowed In V1

- English learning summaries.
- Mika review problems and corrected sentences.
- Curated commute, mistake, warm-up, and self-test review cards.
- Per-card review results and editable review-session summaries.
- Jessica review-cycle provenance and structured exercise targets published from the owning domain project.
- Curated current Mika practice focus.
- Curated English improvement log entries.
- Fitness daily entries.
- Training summaries.
- Weekly fitness review summaries.

## Data Not Allowed In V1

- Raw full Mika transcripts by default.
- Feng shui, destiny, bazi, birth data, divination, or private metaphysics records.
- Immigration records.
- Medical diagnosis or sensitive medical documents.
- Passwords, recovery codes, payment data, or account secrets.

## Threat Notes

| Risk | Mitigation |
|---|---|
| Someone gets the site URL | They see the app shell only; Supabase data requires login and RLS. |
| Search engine crawls the Pages URL | `robots.txt` asks crawlers not to index the app. Login-first UI and Supabase RLS remain the actual protection. |
| Someone casually opens the public site | They see only the login screen; this is a privacy UX layer, not the security boundary. |
| Someone opens an unconfigured local/dev copy | Demo Preview can show committed low-risk sample data, but it cannot read Supabase cloud data. |
| Someone sees the anon key | Acceptable only if RLS is correct; anon key is not an admin key. |
| GitHub repository is public | Source and docs are public; keep the repository free of secrets, raw transcripts, and private records. Prefer making the repo private if GitHub Pages availability and account plan allow it. |
| Workflow secret misconfiguration | Deployment fails if config secrets are missing, placeholder-like, malformed, or service-role-like. |
| iPhone offline cache | Cached data may remain on the device. Protect the device with passcode/Face ID. |
| Explicit logout | The app clears its cached cloud dashboard data and local pending queue on logout. If unsynced records exist, logout asks for confirmation first. |
| Pending queue ownership | New pending records are tagged with the current Supabase user id and are synced only when that same user is logged in. |
| Idempotent offline writes | Client-generated UUIDs and upsert-based inserts prevent a retry from creating duplicate review, daily-entry, or workout rows. |
| Legacy pending queue | Ownerless V1 records are adopted only after a real authenticated session exists and only for the approved English self-check and fitness daily-entry tables. |
| Manual local queue clear | The Settings clear action removes only pending records visible to the current local session. |
| Wrong RLS policy | Treat as blocking; do not deploy personal data until policy tests pass. |
| Recovery form overwrites completed training | A recovery cycle forces recovery-only UI. The database provenance trigger rejects deletion or rebinding of every target-linked workout, so converting a completed training entry to recovery rolls back. |
| Service role leak | Rotate Supabase keys immediately and remove the leak from history if possible. |
| Public sign-up left open | Disable public sign-ups after Vinson's account exists; RLS still blocks non-allowlisted users from dashboard tables. |

## Required Validation Before Real Use

- Logged-out browser cannot read rows.
- A different test user cannot read Vinson's rows.
- A different test user cannot insert dashboard rows unless allowlisted.
- Inserts fail if `user_id` does not match `auth.uid()`.
- Live read requests include a `user_id` filter matching the logged-in user.
- Logout clears cached cloud data and unsynced local pending records after confirmation.
- Old pending records without local owner metadata are adopted only by the authenticated private account and only for approved writable tables.
- Settings distinguishes configured, authenticated, successful cloud read, and failed cloud write states; fixed `Ready` labels are not treated as verification.
- Fitness quick entry sends one daily entry and its complete workout set to `save_fitness_entry_atomic`; offline saves remain one local RPC bundle until sync.
- Only checked exercises are written to `fitness_workouts`; suggested exercises and supplements are not treated as completed activity.
- `english_review_events` and `english_self_checks` keep owner-scoped row writes. Fitness daily entries and workouts are written together through the authenticated, security-invoker atomic RPC.
- `jessica_review_cycles` and `fitness_exercise_targets` are owner-scoped, unavailable to anon, and read-only to the authenticated browser. Publication remains connector-only.
- Their immutable `id` columns carry the minimum UPDATE grant required for the security-invoker RPC's row locks; the absence of UPDATE RLS policies prevents browser row modification.
- A completed workout may reference `target_id`; `ON DELETE RESTRICT` preserves that historical provenance and the foreign key does not weaken either table's owner RLS.
- `fitness_workouts_protect_provenance` blocks Dashboard deletion of target-linked workouts and blocks changes to owner, daily entry, date, Plan, `exercise_key`, or `target_id` after linkage.
- The atomic RPC re-queries and locks the sole active Fitness cycle at write time. Every submitted target must be active, owned by the caller, effective for the workout date, and match the exact Plan and `exercise_key`.
- A stale UI target, inactive or superseded target, mixed-cycle batch, or zero/multiple active-cycle condition raises an explicit error and rolls back the daily entry and every workout.
- The deferred `fitness_workouts_validate_active_cycle` constraint trigger provides a database backstop for direct table writes. It does not retroactively invalidate historical rows when a review cycle is later superseded.
- Weight and reps are actual workout fields only; neither is used to infer or repair target provenance.
- Frontend files contain no service role key.
- GitHub Pages artifact contains only the static `app/` folder.
- GitHub repository settings are reviewed before real use: visibility, Pages source, branch protection, Actions secret names, and workflow permissions.

## Supabase Advisor Status

The schema, function-security, and review-archive authorization findings are resolved through migrations `004`, `005`, and `20260705031641_review_archive_hardening`. Supabase may still report leaked-password protection as disabled; that Auth feature depends on the project plan and must be enabled in the dashboard when available.
