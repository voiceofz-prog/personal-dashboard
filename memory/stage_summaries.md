# Stage Summaries

## 2026-06-21 - Initial Scaffold

| Item | Summary |
|---|---|
| Core conclusion | Historical V1 decision: build a separate personal dashboard PWA for English and fitness, not inside the language-learning project. |
| Useful decisions | Use GitHub Pages for frontend hosting and Supabase for Auth/database/RLS. V1 excludes private metaphysics, immigration, and medical diagnosis. |
| Open questions | Supabase project credentials and GitHub Pages deployment details still need setup in the next session. |
| Next action | Historical next action, superseded by the 2026-07-11 direction reposition below. |

## 2026-06-21 - Local V1 Implementation

| Item | Summary |
|---|---|
| Core conclusion | The local V1 PWA scaffold is implemented with demo mode, offline app cache, pending form queue, live Supabase read/write integration points, and phone-first tabs for Home, English, Fitness, and Settings. |
| Useful decisions | Added a Vinson-only Supabase allowlist, RLS ownership policies, versioned migration, optional low-risk seed SQL, data-model docs, and a GitHub Pages workflow template for publishing only `app/`. |
| Open questions | Real Supabase URL, anon key, Auth user UUID, and final GitHub Pages hosting repo are still external setup items. |
| Next action | Historical next action for V1 setup, superseded by the 2026-07-11 direction reposition below. |

## 2026-06-21 - V1 Surface Completion Pass

| Item | Summary |
|---|---|
| Core conclusion | The English module now includes the missing Improvement Log surface, populated by demo data and live `english_sessions` rows after Supabase login. |
| Useful decisions | Added `docs/verification.md` so local checks are repeatable even when browser automation is unavailable. Added PNG PWA icons for iPhone Home Screen and manifest installability. Tightened service worker fallback behavior so only page navigations fall back to the app shell. |
| Open questions | Browser-render, Supabase-authenticated sync, and iPhone Home Screen behavior still require available browser tooling or external Supabase/GitHub setup. |
| Next action | Historical next action for V1 validation, superseded by the 2026-07-11 direction reposition below except when maintaining the current formal Dashboard. |

## 2026-07-11 - Direction Reposition

| Item | Summary |
|---|---|
| Core conclusion | Personal Dashboard is now governed as a source-project-driven, Skill/Codex-published display project rather than a permanent GitHub Pages + Supabase expansion project. |
| Useful decisions | `project_brief.md` became the single authority for project goal, platform direction, Sites positioning, Supabase/GitHub Pages positioning, phases, success/stop conditions, rollback, and conflict priority. The existing GitHub Pages + Supabase Dashboard remains the formal usable system and rollback baseline until Sites passes replacement validation and Vinson makes a separate switch decision. |
| Open questions | ChatGPT Sites capability, fixed-block update stability, phone/iPad reading quality, version/rollback behavior, and actual maintenance reduction remain unverified. |
| Next action | Maintain the current formal system, define a platform-independent display-content contract, and do not start Sites migration, Supabase retirement, or the original refactoring roadmap without explicit authorization. |
