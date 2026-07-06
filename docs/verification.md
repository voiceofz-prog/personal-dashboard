# Local Verification

## Static Checks

Run these from `projects/05_personal-dashboard`:

```powershell
Get-Content -LiteralPath .\app\data\demo.json -Raw -Encoding UTF8 | ConvertFrom-Json | Out-Null
Get-Content -LiteralPath .\app\manifest.webmanifest -Raw -Encoding UTF8 | ConvertFrom-Json | Out-Null
git diff --check
```

Expected result:

- JSON commands complete with no output.
- `git diff --check` has no whitespace errors. Windows line-ending warnings are acceptable in this workspace.

## GitHub Pages Deployment Checks

Before pushing, confirm this deployment shape:

- The GitHub repository root is this `05_personal-dashboard` folder.
- `.github/workflows/deploy-pages.yml` exists under the repository root.
- GitHub Pages source is set to GitHub Actions.
- The workflow uploads `app/` as the Pages artifact.
- The app is not deployed from `/docs`.
- The files inside `app/` are not moved to the repository root.

Workflow check:

```powershell
Get-Content -LiteralPath .\.github\workflows\deploy-pages.yml -Raw -Encoding UTF8
```

Expected workflow detail:

```yaml
with:
  path: app
```

## Local Server Checks

Start the static server:

```powershell
cd C:\Users\vinso\Desktop\Jessica_AI_Partner_Profile\projects\05_personal-dashboard\app
python -m http.server 5177
```

Then check core assets:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5177/ | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5177/dashboard.js | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5177/styles.css | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5177/product.css | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5177/manifest.webmanifest | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5177/service-worker.js | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5177/data/demo.json | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5177/icons/icon-180.png | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5177/icons/icon-192.png | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5177/icons/icon-512.png | Select-Object -ExpandProperty StatusCode
```

Expected result: each command returns `200`.

## PWA Icon Checks

- `app/index.html` should reference `icons/icon-180.png` as `apple-touch-icon`.
- `app/manifest.webmanifest` should include PNG `192x192` and `512x512` icons.
- `app/service-worker.js` should cache the SVG and PNG icons.

## Service Worker Checks

- `app/service-worker.js` should skip Supabase Auth/REST requests.
- `app/service-worker.js` should skip `config.json` so deployment config is read from the network when available.
- Navigation requests may fall back to `index.html` while offline.
- Non-navigation asset requests should return cached assets or a clean offline response, not `index.html`.

## Security Checks

```powershell
rg -n "service_role|SERVICE_ROLE|sk-" app supabase docs .github README.md project_brief.md task_board.md
rg -n "Feng|destiny|bazi|birth|immigration|medical|raw full" app supabase docs README.md project_brief.md task_board.md
rg -n "auth\\.role\\(|user_metadata|raw_user_meta_data" supabase docs app
rg -n "for select to authenticated|for insert to authenticated|for update to authenticated|for delete to authenticated" supabase/schema.sql supabase/migrations
rg -n "user_id=eq" app/dashboard.js
```

Expected result:

- No service-role key or secret value appears in frontend files. A match in this verification command list is acceptable.
- Restricted-domain words appear only in docs or comments that explicitly exclude those categories from V1.
- Supabase high-risk auth terms appear only in this verification command list unless a future migration intentionally documents a blocked pattern.
- Supabase policies use `TO authenticated` rather than unrestricted policies.
- Frontend REST reads include a current-user filter.
- Runtime config validation rejects placeholder config, non-`https://*.supabase.co` URLs, and service-role-like JWT keys before enabling login.

## Supabase Checks After Credentials Exist

These cannot be completed in demo mode:

- The GitHub Pages final URL is added to Supabase Auth redirect URLs.
- Add both `https://<username>.github.io/<repo-name>/` and `https://<username>.github.io/<repo-name>/index.html`.
- Logged-out browser cannot read dashboard rows.
- Vinson can log in with Supabase Auth.
- Vinson can read rows whose `user_id` matches his Auth UUID.
- A non-allowlisted test user cannot read or insert dashboard rows.
- Offline review events, summaries, fitness entries, and structured workouts remain pending locally, then sync after reconnecting.
- Logging out with unsynced records asks for confirmation and clears local pending records only after confirmation.
- A pending record tagged with a different local user id does not sync under the current user.
- Clearing the local queue from Settings removes only records visible to the current local session.
- A supported legacy pending record without `owner_user_id` is adopted after real login and retains any Supabase write error for diagnosis.
- Unsupported or malformed ownerless queue records are not adopted.
- English API failure does not block Fitness, and Fitness API failure does not block English; Settings identifies the failed module.
- A five-minute English flow supports reveal, all three ratings, early finish, seven-day statistics, and latest-summary editing.
- Recovery-day, maintain, and progress recommendations follow the documented thresholds and Plan A/B alternation.
- Suggested exercises and supplements begin unchecked; only explicitly checked values are stored and copied into the saved report.
- Editing the latest fitness entry reconciles the daily status and its structured exercise rows.
- An active Jessica Fitness cycle supplies a complete target set, the form uses its exact values, and saved workouts retain `target_id`.
- After multiple review cycles accumulate, refreshing Fitness still renders exactly five targets for the selected Plan; superseded-cycle targets never appear in the current form.
- A Jessica-generated workout with a blank DOM target still resolves exactly one `target_id` from user + Plan + `exercise_key` + active cycle + effective date before save.
- Stale UI state after a cycle update rejects the complete save instead of preserving a formerly valid target.
- Mixed target ids, inactive/superseded targets, and zero or multiple active-cycle candidates block the complete batch and expose an error; the app never guesses from reps or weight.
- The daily entry and all checked workouts are committed by one RPC transaction. A late workout error leaves no daily row or partial workout rows.
- Offline Fitness saves remain one RPC bundle and retry atomically. Legacy per-row Fitness queue records are blocked with instructions to reopen and resave.
- A recovery-day decision overrides reviewed exercise targets without deleting or marking them complete.
- An active 0-target recovery cycle automatically selects recovery day, disables training day, and hides both Plan A and Plan B controls.
- Attempting to convert an existing completed training entry into a recovery entry is blocked before save.
- Direct deletion or provenance rebinding of a target-linked workout is rejected by `fitness_workouts_protect_provenance` and rolls back.

Run the local target-link regression tests:

```powershell
node tests/fitness-target-link.test.mjs
```

Run `tests/fitness-atomic-save.test.sql` in the Supabase SQL editor. It covers current-cycle success, stale UI/cycle updates, mixed target ids, and rollback after a late insert failure; the outer transaction rolls back.
- English and Fitness pages show the active Jessica review date; no cycle displays an explicit awaiting-review state.
- Inputs remain at 16px or larger on iPhone Safari, date fields do not overflow, and switching tabs clears form focus and returns to the top immediately.
- Settings app version and the deployed service-worker cache version match before iPhone acceptance testing.
