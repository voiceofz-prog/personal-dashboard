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
| Frontend key | Supabase anon key only. |
| Forbidden key | Never expose service role key in browser files. |
| Public content | Demo UI, labels, and non-sensitive app shell only. |

## Data Allowed In V1

- English learning summaries.
- Mika review problems and corrected sentences.
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
| Someone sees the anon key | Acceptable only if RLS is correct; anon key is not an admin key. |
| iPhone offline cache | Cached data may remain on the device. Protect the device with passcode/Face ID. |
| Explicit logout | The app clears its cached cloud dashboard data on logout. |
| Wrong RLS policy | Treat as blocking; do not deploy personal data until policy tests pass. |
| Service role leak | Rotate Supabase keys immediately and remove the leak from history if possible. |
| Public sign-up left open | Disable public sign-ups after Vinson's account exists; RLS still blocks non-allowlisted users from dashboard tables. |

## Required Validation Before Real Use

- Logged-out browser cannot read rows.
- A different test user cannot read Vinson's rows.
- A different test user cannot insert dashboard rows unless allowlisted.
- Inserts fail if `user_id` does not match `auth.uid()`.
- Frontend files contain no service role key.
- GitHub Pages artifact contains only the static `app/` folder.
