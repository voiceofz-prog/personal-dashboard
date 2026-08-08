# Personal Dashboard

## Core Direction

This project is Vinson's private personal Dashboard workspace.

The single authority for the current project goal, platform direction, and conflict handling is `project_brief.md`.

The current deployed implementation is a GitHub Pages + Supabase private PWA, but the long-term project goal is platform-independent:

Use the local English, Fitness/Nutrition, and other personal projects as the complete content and judgment sources, then use Skills and ChatGPT/Codex to publish curated results as a low-maintenance Dashboard optimized for phone and iPad reading.

GitHub Pages, Supabase, PWA behavior, ChatGPT Sites, and future platforms are replaceable implementation choices.

## Current Formal System

The existing formal Dashboard is still active and must not be removed or weakened without a separate decision.

| Layer | Current implementation |
|---|---|
| Frontend | Static HTML/CSS/JS PWA in `app/` |
| Hosting | GitHub Pages via GitHub Actions |
| Backend | Supabase Auth + database + RLS |
| Offline | Service worker app cache + local pending queue |
| Source records | English and Fitness/Nutrition Markdown projects remain the long-term records |

The app can be opened in Safari, added to the iPhone Home Screen, used for offline review, and synced to Supabase when online. This remains the rollback baseline while ChatGPT Sites is only a candidate display layer.

## Transformation Direction

The future evaluation path is:

`local projects -> Skill analysis -> curated Dashboard content -> display platform`

ChatGPT Sites is currently a candidate for the final display step, not a replacement for local source projects, Skills, Supabase data-integrity rules in the existing system, or historical records.

Sites Phase 1, if explicitly authorized later, is display-only. It should not collect formal data, write back formal data, read local projects directly, or become the only place where important data exists.

## Display Content Contract

The single authority for curated, platform-independent Dashboard display content is [docs/dashboard-display-contract.md](docs/dashboard-display-contract.md). It defines fixed blocks, JSON fields, source ownership, validation, examples, and pure-display exclusions without changing the current PWA data model.

## Current Modules

| Module | Current PWA features |
|---|---|
| Home | Today focus, English status, fitness status, recent personal records |
| English | Today's speaking focus, review sentences, commute cards, self-test, mistake fixes, folded analysis notes, Learning Map summary |
| Fitness | Quick-entry workspace, bodyweight, recovery, Jessica Plan A/B targets, atomic target-linked workout save |
| Settings | Login status, sync status, offline data, app version |

## Important Files

| File | Use |
|---|---|
| `project_brief.md` | Single authority for project goal, platform direction, Sites/Supabase/GitHub Pages positioning, phases, success/stop conditions, and conflict priority |
| `AGENTS.md` | Project operating rules and load order |
| `task_board.md` | Current phase and historical work log |
| `app/index.html` | Current PWA entrypoint |
| `app/dashboard.js` | Current app logic: demo mode, local queue, cached reading, Supabase REST reads/writes |
| `app/app.js` | Legacy-cache compatibility loader only |
| `app/data/demo.json` | Demo data shown before Supabase connection |
| `supabase/schema.sql` and `supabase/migrations/` | Current formal-system schema, migrations, RLS, RPC, and provenance rules |
| `docs/setup.md` | Current GitHub Pages + Supabase setup guide |
| `docs/security.md` | Current formal-system security model |
| `docs/schema.md` | Current formal-system table map and live-read/write behavior |
| `docs/refactoring-roadmap.md` | Conditional engineering roadmap if GitHub Pages remains long-term |
| `docs/continuation_prompt.md` | Handoff prompt that now points future agents to `project_brief.md` first |

## Quick Local Preview

```powershell
cd C:\Users\vinso\Desktop\Jessica_AI_Partner_Profile\projects\05_personal-dashboard\app
python -m http.server 5177
```

Open `http://127.0.0.1:5177`.

The app works in demo preview mode until `config.json` is created from `config.sample.json`; use `Open Demo Preview` on the login screen when no Supabase config exists.

## Current Behavior

- Without `config.json`, the login screen can open Demo Preview with committed low-risk demo data.
- With Supabase configured and logged in, the app reads Vinson-owned dashboard rows from Supabase.
- Fitness entries and English self-checks save directly when online.
- Offline or failed submissions are saved to the browser pending queue and shown in the UI until synced.
- Last successful cloud dashboard data is cached locally for offline reading.
- Current Supabase Auth, RLS, RPC, migration, provenance, and rollback rules remain binding while this implementation is formal.
