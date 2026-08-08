# AGENTS.md

This project is Vinson's private personal dashboard workspace.

`project_brief.md` is the single authority for this project's current goal, platform direction, and document-conflict handling. Read it before treating GitHub Pages, Supabase, PWA behavior, or ChatGPT Sites as long-term project commitments.

## Governance Bootstrap Gate

At the start of a new or resumed session, actively read and verify root `AGENTS.md`, then every file in its load order. A filename or reference is not proof that its body was loaded. After verification, read this project's `project_brief.md` and current `task_board.md`, begin the first substantive response with `Vinson`, and report `Governance loaded: workspace + 05_personal-dashboard`. If a required read fails, report `Governance bootstrap incomplete` and do not modify files or access external services.

## Project Scope

Use this folder for the cross-project dashboard product only.

## Workspace Boundary And Cross-Project Rules

- Dashboard is the Primary Folder and always the main working area.
- By default, modify only this folder. `01_language-learning` and `02_Fitness_Nutrition` are Additional Folders used as read-only references for contracts, APIs, schemas, data formats, and business logic.
- Additional Folders are independent projects, not Dashboard submodules and not code to refactor together.
- If a problem appears to originate in Language or Fitness, first explain the source, the reason for the proposed change, and the impact scope; obtain Vinson's explicit approval before modifying that project.
- Do not modify Language or Fitness core business logic merely to make Dashboard pass.
- For an authorized cross-project change, provide a complete plan first, then make and submit changes separately by project; do not mix a large batch of cross-project changes.
- Preserve separation of concerns so the three projects remain independently maintainable and Dashboard only integrates, presents, and coordinates.

In scope:
- Phone-first and iPad-readable dashboard presentation.
- English learning dashboard module.
- Fitness and nutrition dashboard module.
- Current GitHub Pages + Supabase Dashboard maintenance while it remains the formal system.
- Platform-independent display-content contracts for Skill-published summaries.
- A separately authorized future evaluation of ChatGPT Sites as a pure-display candidate.
- Supabase Auth, database schema, RLS policy docs, client integration, offline cache, and pending sync behavior for the current formal Dashboard only.
- GitHub Pages deployment materials for the current formal Dashboard and archive/rollback reference.

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
3. Root `00_README_INDEX.md` and `agent-hub/index.md`.
4. This project `AGENTS.md`.
5. `project_brief.md`.
6. `task_board.md`.
7. `README.md`.
8. Relevant files under `app/`, `docs/`, or `supabase/`.
9. Relevant approved files under `memory/`.

## Operating Rules

- Treat this dashboard as a private product surface, not a public website.
- Keep the presentation phone-first, iPad-readable, and iPhone Safari compatible where the current PWA remains active.
- Keep dashboard source separated from domain records: English records stay in `01_language-learning`; fitness records stay in `02_Fitness_Nutrition`.
- Publish only curated summaries to the dashboard. Do not publish raw full Mika transcripts by default.
- Store only low-risk English learning and fitness/nutrition tracking data in the current Supabase Dashboard layer.
- Never place Supabase service role keys, personal passwords, or private credentials in frontend files or presentation-platform content.
- Every Supabase table that stores personal data must use RLS and `user_id` ownership checks while the Supabase-backed Dashboard remains active.
- Use demo data until Supabase configuration is provided.
- If a change touches authentication, RLS, deployment, or private data flow, update `docs/security.md` or `docs/setup.md`.
- Do not assume future features should be integrated into the GitHub Pages + Supabase Dashboard before checking `project_brief.md`.
- For platform-independent curated display content, use `docs/dashboard-display-contract.md` as the single schema authority; do not duplicate or infer that contract from current PWA/Supabase implementation files.
- Do not start the refactoring roadmap unless the conditions in `project_brief.md` and `docs/refactoring-roadmap.md` are satisfied.
- Do not create, migrate to, or publish ChatGPT Sites from this project unless Vinson explicitly authorizes that separate work.

## File And Memory Rules

- Follow root `memory_policy.md` for preservation and privacy decisions.
- Use Markdown, SQL, HTML, CSS, JSON, and plain JavaScript for V1.
- Do not save unrelated temporary tasks in this project.
- Keep durable summaries in `memory/`, not raw private data.
