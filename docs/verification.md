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
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5177/app.js | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5177/styles.css | Select-Object -ExpandProperty StatusCode
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
```

Expected result:

- No service-role key or secret value appears in frontend files.
- Restricted-domain words appear only in docs or comments that explicitly exclude those categories from V1.

## Supabase Checks After Credentials Exist

These cannot be completed in demo mode:

- The GitHub Pages final URL is added to Supabase Auth redirect URLs.
- Add both `https://<username>.github.io/<repo-name>/` and `https://<username>.github.io/<repo-name>/index.html`.
- Logged-out browser cannot read dashboard rows.
- Vinson can log in with Supabase Auth.
- Vinson can read rows whose `user_id` matches his Auth UUID.
- A non-allowlisted test user cannot read or insert dashboard rows.
- Offline fitness/self-check submissions remain pending locally, then sync after reconnecting.
