# Continuation Prompt

Use this prompt in a fresh Codex conversation opened from:

`C:\Users\vinso\Desktop\Jessica_AI_Partner_Profile\projects\05_personal-dashboard`

```text
Vinson here. Continue the Personal Dashboard PWA project from this folder:
C:\Users\vinso\Desktop\Jessica_AI_Partner_Profile\projects\05_personal-dashboard

Goal:
Continue implementing the private phone-first PWA dashboard for English learning and fitness tracking.

Current scaffold already includes:
- AGENTS.md, project_brief.md, task_board.md
- app/index.html
- app/styles.css
- app/app.js
- app/manifest.webmanifest
- app/service-worker.js
- app/data/demo.json
- app/config.sample.json
- supabase/schema.sql
- supabase/migrations/001_initial_schema.sql
- supabase/migrations/002_english_review_cards.sql
- supabase/migrations/003_security_hardening.sql
- supabase/seed_demo.sql
- docs/setup.md
- docs/security.md
- docs/schema.md
- docs/verification.md
- .github/workflows/deploy-pages.yml

Architecture requirements:
- This is a PWA web app, not an App Store iOS app.
- GitHub Pages hosts the static frontend.
- Supabase handles Auth, database, and RLS.
- Only my account should read/write personal data.
- V1 includes English learning and fitness/nutrition only, including the English improvement log.
- Do not include Feng Shui, destiny, birth data, private metaphysics, immigration, medical diagnosis, or raw full Mika transcripts.

Please continue end-to-end:
1. Read AGENTS.md, project_brief.md, task_board.md, README.md, docs/setup.md, and docs/security.md.
2. Verify the static PWA locally.
3. Improve the UI if needed for iPhone readability.
4. Keep demo mode working when config.json is missing.
5. Test online insert, offline queue, live reads, and sync behavior after Supabase credentials are available.
6. Verify the GitHub Pages workflow or adjust it if the repository branch is not `main`.
7. Update task_board.md with completed and next steps.
8. Give me the local preview URL or file path, what was verified, and what external setup I need to provide.

If credentials are needed, ask only for the Supabase URL, anon key, Vinson login email, and confirmation that Vinson's Auth user UUID has been inserted into `dashboard_allowed_users`. Never ask for or store the Supabase service role key in frontend files.
For an existing database, make sure migrations are applied through `supabase/migrations/003_security_hardening.sql`.
```
