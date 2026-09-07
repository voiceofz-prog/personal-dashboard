# Personal Dashboard

This private, phone-first Dashboard presents curated English and Fitness/Nutrition results while the source projects retain complete history and judgment authority. [project_brief.md](project_brief.md) is the single authority for project direction, platform phase, and conflicts.

## Current Formal System

| Layer | Current implementation |
|---|---|
| Frontend | Static HTML/CSS/JavaScript PWA in `app/` |
| Hosting | GitHub Pages via GitHub Actions |
| Backend | Supabase Auth, database, RLS, and atomic RPC |
| Offline | Service Worker app shell, owned read cache, and pending queue |
| Source records | `01_language-learning` and `02_Fitness_Nutrition` remain independent sources of truth |

GitHub Pages, Supabase, PWA behavior, Sites, and future presentation layers are replaceable implementation choices. The current system remains formal and recoverable until a separately authorized replacement passes validation.

## Binding Boundaries

- Use [docs/dashboard-display-contract.md](docs/dashboard-display-contract.md) as the only platform-independent curated display schema.
- Publish only low-risk curated summaries; never publish raw full Mika transcripts, credentials, or local-private records.
- Preserve Auth, RLS, owner filters, review-cycle provenance, atomic Fitness saves, migrations, and rollback while this system is formal.
- Do not let the Dashboard invent English or Fitness judgment owned by the source projects.
- Do not create, migrate, or publish a Sites replacement without separate authorization.

## Important Files

| File | Use |
|---|---|
| `AGENTS.md` | Project rules and load order |
| `project_brief.md` | Goal, ownership, platform direction, and conflict authority |
| `task_board.md` | Current execution state |
| `app/index.html`, `app/dashboard.js` | Formal PWA entry and runtime logic |
| `app/session-security.js`, `app/fitness-target-link.js` | Independently tested security and Fitness-link contracts |
| `scripts/verify.mjs` | Dependency-free local verification gate |
| `supabase/README.md`, `supabase/migrations/` | Production migration procedure and canonical ledger |
| `supabase/bootstrap/pre_ledger_baseline.sql` | Disposable blank rebuild only; never a production migration |
| `docs/setup.md`, `docs/security.md`, `docs/schema.md` | Formal-system operations and boundaries |
| `docs/refactoring-roadmap.md` | Conditional, evidence-gated engineering work |

## Local Preview

From `app/`, run a local static server and open it in a browser. Without a valid local `config.json`, use Demo Preview with committed low-risk sample data.

Before integration, run:

```powershell
node scripts/verify.mjs
```

The automated gate does not replace live Supabase checks, visual review, or physical iPhone Safari/Home Screen acceptance.
