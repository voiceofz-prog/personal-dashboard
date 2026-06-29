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

If `app/config.json` is not present, the login screen shows an `Open Demo Preview` button. That preview uses only the committed low-risk demo data and does not connect to Supabase.

When testing after app updates, reload once while online so the service worker can install the latest cache version. In Settings, confirm the displayed app version matches the deployed `dashboard.js` and service-worker cache version before testing sync.

## 2. Supabase Setup

1. Create a Supabase project.
2. Create Vinson's Auth user in Supabase Auth.
3. In Supabase SQL Editor, run `supabase/schema.sql` for a fresh setup. For an existing setup that already ran `001_initial_schema.sql`, run migrations `002` through `008` in filename order.
4. Copy Vinson's Auth user UUID.
5. Add Vinson to the dashboard allowlist:

```sql
insert into public.dashboard_allowed_users (user_id, email)
values ('VINSON_AUTH_USER_UUID', 'your-login-email@example.com')
on conflict (user_id) do update set email = excluded.email;
```

6. Confirm public dashboard tables have RLS enabled.
7. Confirm the schema grants dashboard table access to the `authenticated` role only. RLS policies still restrict rows to the logged-in `user_id` and the allowlist.
8. Copy `app/config.sample.json` to `app/config.json`.
9. Fill the Supabase project URL and anon key.
10. Optional: run `supabase/seed_demo.sql` after replacing `VINSON_AUTH_USER_UUID` with Vinson's real Auth user UUID.

Do not put the service role key in `config.json`. The app rejects service-role-like JWT keys at runtime, but the key should still be rotated immediately if it was ever placed in a browser file.

Recommended Supabase Auth setting for this private app: disable public sign-ups after Vinson's account exists.

If an older copy of the schema was already run, apply every migration after its current version. Migration `006` adds the traceable manual Jessica review loop and executable exercise targets; migration `007` removes unnecessary authenticated table privileges.

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
2. Add GitHub Actions repository secrets under Settings -> Secrets and variables -> Actions:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Push the contents of `05_personal-dashboard` as that repository root.
4. In GitHub repository Settings -> Pages, choose GitHub Actions as the build/deploy source.
5. Run the "Deploy Personal Dashboard PWA" workflow or push changes to `main`.
6. Open the Pages URL in iPhone Safari and run the PWA test below.

The workflow generates `app/config.json` during deployment from repository secrets before uploading the `app/` artifact. Do not commit `app/config.json`. The config contains only the Supabase project URL and anon key; the login email is entered manually in the app.

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
7. Complete English reviews or submit a fitness entry offline.
8. Reconnect.
9. Tap Sync Pending and confirm the record appears in Supabase.
10. If Sync Pending fails, read the `Last write error` shown in Settings before clearing the queue.
11. Switch between Home, English, Fitness, and Settings after scrolling; every view should open at the top without Safari zooming the form.

Logout behavior:

- If unsynced local records exist, logout asks for confirmation.
- Confirmed logout clears the cached cloud dashboard data and pending queue from that browser.
- Pending records created by one logged-in user are not synced under a different local session.
- The Settings clear action removes only pending records visible to the current local session.
- Legacy pending records created before owner tagging are assigned once to the currently authenticated account, but only for the previously supported write tables.

## 5. Current Limitations

- Settings reports English and Fitness module status separately. A successful module can refresh while the other retains its last successful cache.
- The app reads live Supabase rows after login and shows a true empty state when the account has no data.
- Jessica review is manually triggered for this phase. Follow `docs/jessica-review-loop.md`; domain records stay in projects `01` and `02`, while the Dashboard stores only published execution data and provenance.
