# Project Brief

## Authority

This file is the single authority for the Personal Dashboard project's goal, current platform direction, phase, and document-conflict handling. Detailed transition criteria live in `docs/platform-transition-policy.md` so this frequently loaded brief stays compact.

## One-Line Goal

Use local English and Fitness/Nutrition projects as complete content and judgment sources, then publish curated results through Skills and ChatGPT/Codex to a low-maintenance personal Dashboard optimized for phone and iPad reading.

## Scope

| Area | Notes |
|---|---|
| In scope | Current private GitHub Pages + Supabase Dashboard maintenance, curated English/Fitness display content, platform-independent display contracts, phone/iPad usability, security, rollback, and a separately authorized future display-platform evaluation. |
| Out of scope | Private metaphysics records, immigration records, medical diagnosis, public sharing, multi-user collaboration, native App Store work, and an unapproved Sites cutover. |
| Success criteria | Source projects can regenerate all display content; the formal Dashboard remains safe and usable; any replacement measurably lowers maintenance without becoming a second database or losing rollback. |
| Constraints | Preserve Auth, RLS, RPC, provenance, migrations, rollback, and source-project ownership while the current Dashboard is formal. Do not modify production systems without explicit authorization. |

## Ownership Boundaries

| Owner | Responsibility |
|---|---|
| `01_language-learning` | Full English history, learning analysis, semantic judgment, and Product Acceptance Authority. |
| `02_Fitness_Nutrition` | Training records, recovery judgment, schedule state, progression logic, and executable target decisions. |
| Skills | Package approved analysis, validation, publication, readback, and handoff workflows. |
| Personal Dashboard | Present curated execution content and collect approved interaction data; do not invent source-project judgment. |
| Supabase | Current formal Dashboard's authenticated exchange, integrity, and version layer; not the unique source of truth. |

## Binding Rules

- Important data must never exist only in a presentation platform.
- Local source projects must be able to regenerate Dashboard display content.
- Publish only curated low-risk English/Fitness content; keep raw analysis and full history in source projects.
- Routine publication authority is governed centrally by root `memory_policy.md` and may not be broadened here.
- Never place service-role keys, passwords, credentials, raw private records, or full Mika transcripts in the frontend or display platform.
- While the current Dashboard is formal, its Auth, RLS, RPC, owner isolation, review-cycle provenance, atomic writes, archive rules, migrations, and rollback remain binding.
- Do not maintain two complete formal frontends long term.

## Current Platform Direction

| Phase | Status | Boundary |
|---|---|---|
| Phase 0 | Active | Maintain the current formal GitHub Pages + Supabase Dashboard; fix only current-use safety or usability problems. |
| Phase 1 | Complete | Platform-independent display contract v1 is defined in `docs/dashboard-display-contract.md`. |
| Phase 2 | Not started | Validate Sites only after Vinson explicitly starts a pure-display experiment that does not alter the formal system. |
| Phase 3 | Not started | Make a separate switch/stop decision from measured evidence; archive rather than delete the old system if a replacement succeeds. |

Sites is an experimental display candidate, not part of the formal architecture. Its success/stop criteria and Supabase/GitHub retirement boundaries are preserved in `docs/platform-transition-policy.md`.

## Conflict Priority

1. This `project_brief.md` for project direction and phase.
2. English and Fitness/Nutrition source-project ownership and semantic rules.
3. Current formal-system security, integrity, and rollback rules.
4. `docs/platform-transition-policy.md` and `docs/refactoring-roadmap.md`.
5. Older README, continuation, task-board, memory, or handoff material.

## Current Status

| Item | Summary |
|---|---|
| Status | Formal Dashboard build `2026.07.06.2` remains active; Sites is deferred and experimental. |
| Last updated | 2026-07-16 |
| Latest decision | Preserve the current formal system and platform-independent contract. Do not change Sites Git topology or begin replacement validation while its role remains unstable. |
| Next action | Maintain current usability and security. Start Phase 2 only after Vinson gives a separate explicit decision. |

## Key References

| Reference | Location | Notes |
|---|---|---|
| Current app | `app/index.html`, `app/dashboard.js`, `app/styles.css` | Formal static PWA surface. |
| Display contract | `docs/dashboard-display-contract.md` | Single schema authority for curated platform-independent display content. |
| Transition policy | `docs/platform-transition-policy.md` | Detailed Sites, Supabase, GitHub Pages, success/stop, and retirement boundaries. |
| Security | `docs/security.md` | Auth, RLS, private-data, and repository boundaries. |
| Schema | `docs/schema.md`, `supabase/schema.sql`, `supabase/migrations/` | Current data model and formal migrations. |
| Refactoring roadmap | `docs/refactoring-roadmap.md` | Conditional plan only if the current Dashboard remains long-term. |
| Continuation | `docs/continuation_prompt.md` | Handoff that must follow this brief first. |
