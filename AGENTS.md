# AGENTS.md

This project is Vinson's private personal dashboard PWA workspace.

## Project Scope

Use this folder for the cross-project dashboard product only.

In scope:
- Phone-first PWA interface.
- English learning dashboard module.
- Fitness and nutrition dashboard module.
- Supabase Auth, database schema, RLS policy docs, and client integration.
- GitHub Pages deployment materials.
- Offline cache and pending sync behavior.

Out of scope for V1:
- Feng shui, destiny, bazi, birth data, divination, or private metaphysics records.
- Immigration strategy records.
- Medical diagnosis.
- Public sharing pages.
- Multi-user collaboration.
- App Store native iOS application.

## Load Order

When working in this project, read files in this order:
1. Root `AGENTS.md`.
2. Root `agent_rules.md`, `memory_policy.md`, and `workflow_rules.md`.
3. This project `AGENTS.md`.
4. `project_brief.md`.
5. `task_board.md`.
6. `README.md`.
7. Relevant files under `app/`, `docs/`, or `supabase/`.
8. Relevant approved files under `memory/`.

## Operating Rules

- Treat this dashboard as a private product surface, not a public website.
- Keep the app phone-first and iPhone Safari compatible.
- Keep dashboard source separated from domain records: English records stay in `01_language-learning`; fitness records stay in `02_Fitness_Nutrition`.
- Publish only curated summaries to the dashboard. Do not publish raw full Mika transcripts by default.
- Store only low-risk English learning and fitness/nutrition tracking data in Supabase.
- Never place Supabase service role keys, personal passwords, or private credentials in frontend files.
- Every Supabase table that stores personal data must use RLS and `user_id` ownership checks.
- Use demo data until Supabase configuration is provided.
- If a change touches authentication, RLS, deployment, or private data flow, update `docs/security.md` or `docs/setup.md`.

## File And Memory Rules

- Follow root `memory_policy.md` for preservation and privacy decisions.
- Use Markdown, SQL, HTML, CSS, JSON, and plain JavaScript for V1.
- Do not save unrelated temporary tasks in this project.
- Keep durable summaries in `memory/`, not raw private data.
