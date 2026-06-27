# Personal Dashboard PWA

## Core Conclusion

This project is a private phone-first PWA for Vinson's personal tracking. V1 includes English learning and fitness/nutrition only.

The app is designed to be opened in Safari, added to the iPhone Home Screen, used for offline review, and synced to Supabase when online.

## Current Shape

| Layer | Decision |
|---|---|
| Frontend | Static HTML/CSS/JS PWA in `app/` |
| Hosting | GitHub Pages via GitHub Actions |
| Backend | Supabase Auth + database + RLS |
| Offline | Service worker app cache + local pending queue |
| Source records | English and fitness Markdown projects remain the curated long-term records |

## Deployment Decision

This folder, `05_personal-dashboard`, should be published as an independent GitHub repository root.

GitHub Pages should use GitHub Actions, and the workflow should publish only the static `app/` folder as the Pages artifact. Do not move `app/` to `/docs`, and do not move the app files to the repository root.

After GitHub Pages creates the final URL, add these Supabase Auth redirect URLs:

```text
https://<username>.github.io/<repo-name>/
https://<username>.github.io/<repo-name>/index.html
```

## V1 Modules

| Module | Features |
|---|---|
| Home | Today focus, English status, fitness status, recent personal records |
| English | Today's speaking focus, review sentences, commute cards, self-test, mistake fixes, folded analysis notes |
| Fitness | Quick-entry workspace, bodyweight, recovery, and Jessica Plan A/B targets |
| Settings | Login status, sync status, offline data, app version |

## Quick Local Preview

```powershell
cd C:\Users\vinso\Desktop\Jessica_AI_Partner_Profile\projects\05_personal-dashboard\app
python -m http.server 5177
```

Open `http://127.0.0.1:5177`.

The app works in demo preview mode until `config.json` is created from `config.sample.json`; use `Open Demo Preview` on the login screen when no Supabase config exists.

## Important Files

| File | Use |
|---|---|
| `app/index.html` | PWA entrypoint |
| `app/styles.css` | Phone-first interface |
| `app/app.js` | App state, demo mode, local queue, cached reading, Supabase REST reads/writes |
| `app/data/demo.json` | Demo data shown before Supabase connection |
| `app/icons/` | SVG and PNG PWA icons, including iPhone Home Screen icon |
| `supabase/schema.sql` | Runnable Supabase schema and RLS policies |
| `supabase/migrations/001_initial_schema.sql` | Versioned migration copy of the same schema |
| `supabase/seed_demo.sql` | Optional low-risk cloud demo rows after Vinson Auth UUID is known |
| `docs/setup.md` | Supabase and GitHub Pages setup |
| `docs/security.md` | Security model and boundaries |
| `docs/schema.md` | Table map and live-read/write behavior |
| `docs/verification.md` | Repeatable local checks and post-Supabase checks |
| `docs/continuation_prompt.md` | Prompt for the next Codex conversation |
| `.github/workflows/deploy-pages.yml` | GitHub Pages deployment workflow for the `app/` folder |

## Current Behavior

- Without `config.json`, the login screen can open Demo Preview with committed low-risk demo data.
- With Supabase configured and logged in, the app reads Vinson-owned dashboard rows from Supabase.
- Fitness entries and English self-checks save directly when online.
- Offline or failed submissions are saved to the browser pending queue and shown in the UI until synced.
- Last successful cloud dashboard data is cached locally for offline reading.
