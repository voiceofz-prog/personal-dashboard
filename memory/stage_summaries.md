# Stage Summaries

## 2026-06-21 - Initial Scaffold

| Item | Summary |
|---|---|
| Core conclusion | Build a separate personal dashboard PWA for English and fitness, not inside the language-learning project. |
| Useful decisions | Use GitHub Pages for frontend hosting and Supabase for Auth/database/RLS. V1 excludes private metaphysics, immigration, and medical diagnosis. |
| Open questions | Supabase project credentials and GitHub Pages deployment details still need setup in the next session. |
| Next action | Open a fresh Codex conversation in this project and continue Supabase/GitHub Pages setup. |

## 2026-06-21 - Local V1 Implementation

| Item | Summary |
|---|---|
| Core conclusion | The local V1 PWA scaffold is implemented with demo mode, offline app cache, pending form queue, live Supabase read/write integration points, and phone-first tabs for Home, English, Fitness, and Settings. |
| Useful decisions | Added a Vinson-only Supabase allowlist, RLS ownership policies, versioned migration, optional low-risk seed SQL, data-model docs, and a GitHub Pages workflow template for publishing only `app/`. |
| Open questions | Real Supabase URL, anon key, Auth user UUID, and final GitHub Pages hosting repo are still external setup items. |
| Next action | Configure Supabase, add `app/config.json`, test authenticated cloud sync, then publish and verify iPhone Safari PWA behavior. |

## 2026-06-21 - V1 Surface Completion Pass

| Item | Summary |
|---|---|
| Core conclusion | The English module now includes the missing Improvement Log surface, populated by demo data and live `english_sessions` rows after Supabase login. |
| Useful decisions | Added `docs/verification.md` so local checks are repeatable even when browser automation is unavailable. Added PNG PWA icons for iPhone Home Screen and manifest installability. Tightened service worker fallback behavior so only page navigations fall back to the app shell. |
| Open questions | Browser-render, Supabase-authenticated sync, and iPhone Home Screen behavior still require available browser tooling or external Supabase/GitHub setup. |
| Next action | Run real Supabase and iPhone checks once credentials and hosting are configured. |
