# Setup Guide

## 1. Local Preview

From the app folder:

```powershell
cd C:\Users\vinso\Desktop\Jessica_AI_Partner_Profile\projects\05_personal-dashboard\app
python -m http.server 5177
```

Open:

```text
http://127.0.0.1:5177
```

Use localhost for PWA/service-worker testing. Opening `index.html` directly as a file will show the UI, but service worker offline cache will not register.

When testing after app updates, reload once while online so the service worker can install the latest cache version.

## 2. Supabase Setup

1. Create a Supabase project.
2. Create Vinson's Auth user in Supabase Auth.
3. In Supabase SQL Editor, run `supabase/schema.sql` or `supabase/migrations/001_initial_schema.sql`.
4. Copy Vinson's Auth user UUID.
5. Add Vinson to the dashboard allowlist:

```sql
insert into public.dashboard_allowed_users (user_id, email)
values ('VINSON_AUTH_USER_UUID', 'vinson@example.com')
on conflict (user_id) do update set email = excluded.email;
```

6. Confirm public dashboard tables have RLS enabled.
7. Confirm the schema grants dashboard table access to the `authenticated` role. RLS policies still restrict rows to `auth.uid() = user_id` and the allowlist.
8. Copy `app/config.sample.json` to `app/config.json`.
9. Fill the Supabase project URL, anon key, and Vinson email.
10. Optional: run `supabase/seed_demo.sql` after replacing `VINSON_AUTH_USER_UUID` with Vinson's real Auth user UUID.

Do not put the service role key in `config.json`.

Recommended Supabase Auth setting for this private app: disable public sign-ups after Vinson's account exists.

If an older copy of the schema was already run before the grant section existed, rerun the current `supabase/schema.sql` or run only the final `grant ... to authenticated` statements from that file in Supabase SQL Editor.

## 3. GitHub Pages Deployment

Recommended deployment target: publish the contents of `app/` as a static site from an independent GitHub repository whose root is this `05_personal-dashboard` folder.

Confirmed deployment decision:

- Repository root: `05_personal-dashboard`.
- GitHub Pages source: GitHub Actions.
- Published artifact: `app/`.
- Workflow file: `.github/workflows/deploy-pages.yml`.

Do not publish service role keys or passwords. The Supabase anon key is acceptable for browser use only when RLS is enabled and the allowlist row exists for Vinson's account.

GitHub setup:

1. Create a new GitHub repository for this dashboard.
2. Push the contents of `05_personal-dashboard` as that repository root.
3. In GitHub repository Settings -> Pages, choose GitHub Actions as the build/deploy source.
4. Run the "Deploy Personal Dashboard PWA" workflow or push changes to `main`.
5. Open the Pages URL in iPhone Safari and run the PWA test below.

Do not use `/docs` as the Pages source for this project. Do not move the files in `app/` to the repository root.

Supabase Auth redirect URLs:

After GitHub Pages gives the final URL, add both forms in Supabase Auth URL Configuration:

```text
https://<username>.github.io/<repo-name>/
https://<username>.github.io/<repo-name>/index.html
```

If a custom domain is added later, add the custom-domain URL here as well.

Repository note:

The local Jessica workspace may contain this folder inside a larger workspace, but the GitHub repository for deployment should treat `05_personal-dashboard` itself as root. In that independent repo, the existing workflow path and artifact path are already correct:

```yaml
.github/workflows/deploy-pages.yml
path: app
```

Legacy alternative if deploying from the larger Jessica repository:

1. Copy `.github/workflows/deploy-pages.yml` to the larger repository root.
2. Change workflow path filters from `app/**` to `projects/05_personal-dashboard/app/**`.
3. Change artifact path from `app` to `projects/05_personal-dashboard/app`.

This alternative is not the recommended setup.

## 4. iPhone PWA Test

1. Open the GitHub Pages URL in Safari.
2. Log in.
3. Use Share -> Add to Home Screen.
4. Open from the Home Screen icon.
5. Turn on airplane mode.
6. Confirm cached pages and demo/last cloud data open.
7. Submit a fitness entry offline.
8. Reconnect.
9. Tap Sync Pending and confirm the record appears in Supabase.

## 5. Current Limitations

- Real cloud sync cannot be verified until Supabase URL, anon key, Auth user, and allowlist row are configured.
- The app reads live Supabase rows for dashboard display after login.
- Markdown reconciliation remains manual: Jessica should summarize important Supabase records back into the relevant local project files during review.
