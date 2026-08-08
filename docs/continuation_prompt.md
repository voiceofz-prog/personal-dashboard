# Continuation Prompt

Use this prompt in a fresh Codex conversation opened from:

`C:\Users\vinso\Desktop\Jessica_AI_Partner_Profile\projects\05_personal-dashboard`

```text
Vinson here. Continue the Personal Dashboard project from this folder:
C:\Users\vinso\Desktop\Jessica_AI_Partner_Profile\projects\05_personal-dashboard

First read AGENTS.md, then project_brief.md, task_board.md, README.md, and only then the relevant docs under docs/, app/, or supabase/.

Current authority:
project_brief.md is the single authority for the project goal, platform direction, phase priority, and conflict handling.

Current project goal:
Use the local English, Fitness/Nutrition, and other personal projects as the complete content and judgment sources, then use Skills and ChatGPT/Codex to publish curated results as a low-maintenance personal Dashboard optimized for phone and iPad reading.

Current formal system:
The deployed GitHub Pages + Supabase private PWA remains the formal usable Dashboard, comparison baseline, and rollback option until ChatGPT Sites passes replacement validation and Vinson makes a separate switch decision.

Current direction:
- Do not assume GitHub Pages or Supabase are permanent project cores.
- Do not start a full refactor by default.
- Do not create, migrate, or publish ChatGPT Sites unless Vinson explicitly authorizes that separate task.
- Do not stop, delete, or weaken the existing Supabase-backed Dashboard.
- Do not modify production code, Supabase schema, migrations, Auth, RLS, RPC, GitHub Actions, Skills, source-project rules, data, or formal workflows unless Vinson explicitly asks.

Current phase:
Phase 0: keep the current formal Dashboard usable.
Phase 1: completed. docs/dashboard-display-contract.md is the single authority for platform-independent curated display content, including fixed blocks, JSON schema, ownership boundary, validation, examples, and display exclusions.
Phase 2: do not start ChatGPT Sites validation unless Vinson explicitly authorizes it.

If asked to work on the current PWA:
- Preserve demo mode when config.json is missing.
- Preserve Supabase Auth, RLS, owner filters, offline queue ownership, and atomic Fitness save behavior.
- Preserve Fitness target provenance, review cycles, archive behavior, and rollback rules.
- Use docs/setup.md, docs/security.md, docs/schema.md, and docs/verification.md as current-system references.

If asked to evaluate ChatGPT Sites:
- Treat Sites as a pure-display candidate first.
- Do not connect it to formal writes.
- Do not let it become the only place where important data exists.
- Keep the current GitHub Pages + Supabase Dashboard unchanged during validation.
- Use the success and stop conditions in project_brief.md.
- Use docs/dashboard-display-contract.md as the only display-content schema; do not recreate source judgment from Supabase rows, browser state, or Site content.

Restricted content remains excluded:
Do not include Feng Shui, destiny, birth data, private metaphysics, immigration, medical diagnosis, or raw full Mika transcripts by default.

If credentials are ever needed for current PWA work, ask only for the Supabase URL, anon key, Vinson login email, and confirmation that Vinson's Auth user UUID has been inserted into dashboard_allowed_users. Never ask for or store the Supabase service role key in frontend files.
```

## Historical Note

Older continuation prompts treated GitHub Pages + Supabase expansion as the default next step. That is now superseded by `project_brief.md`. The old architecture remains valid only as the current formal system and rollback baseline.
