# Setup Guide

## Position

This guide describes the current formal GitHub Pages + Supabase Dashboard setup and recovery path. It does not make GitHub Pages or Supabase permanent project requirements. For the current project goal, platform direction, ChatGPT Sites positioning, and conflict priority, follow `project_brief.md`.

## 1. Local Preview

From the app folder:

```powershell
cd C:\Users\vinso\Desktop\Jessica_AI_Partner_Profile\projects\05_personal-dashboard\app
python -m http.server 5177
```

Open:

```text
http://127.0.0.1:5177
```

Use localhost for PWA/service-worker testing. Opening `index.html` directly as a file will show the UI, but service worker offline cache will not register.

If `app/config.json` is not present, the login screen shows an `Open Demo Preview` button. That preview uses only the committed low-risk demo data and does not connect to Supabase.

When testing after app updates, reload once while online so the service worker can install the latest cache version. In Settings, confirm the displayed app version matches the deployed `dashboard.js` and service-worker cache version before testing sync.

## 2. Supabase Setup

1. Create a Supabase project.
2. Create Vinson's Auth user in Supabase Auth.
3. Follow `supabase/README.md` for the correct migration flow. Production uses only the canonical timestamped ledger in `supabase/migrations/`; do not run `supabase/schema.sql`, the pre-ledger bootstrap, or legacy numbered migrations there.
4. Copy Vinson's Auth user UUID.
5. Add Vinson to the dashboard allowlist:

```sql
insert into public.dashboard_allowed_users (user_id, email)
values ('VINSON_AUTH_USER_UUID', 'your-login-email@example.com')
on conflict (user_id) do update set email = excluded.email;
```

6. Confirm public dashboard tables have RLS enabled.
7. Confirm the schema grants dashboard table access to the `authenticated` role only. RLS policies still restrict rows to the logged-in `user_id` and the allowlist.
8. Copy `app/config.sample.json` to `app/config.json`.
9. Fill the Supabase project URL and anon key.
10. Optional: run `supabase/seed_demo.sql` after replacing `VINSON_AUTH_USER_UUID` with Vinson's real Auth user UUID.

Do not put the service role key in `config.json`. The app rejects service-role-like JWT keys at runtime, but the key should still be rotated immediately if it was ever placed in a browser file.

Recommended Supabase Auth setting for this private app: disable public sign-ups after Vinson's account exists.

For an existing database, compare its formal migration ledger with the canonical timestamped files before applying any pending migration. Do not infer state from legacy filenames or re-run historical SQL.

## 3. GitHub Pages Deployment

Recommended deployment target: publish the contents of `app/` as a static site from an independent GitHub repository whose root is this `05_personal-dashboard` folder.

Confirmed deployment decision:

- Repository root: `05_personal-dashboard`.
- GitHub Pages source: GitHub Actions.
- Published artifact: `app/`.
- Workflow file: `.github/workflows/deploy-pages.yml`.

Do not publish service role keys or passwords. The Supabase anon key is acceptable for browser use only when RLS is enabled and the allowlist row exists for Vinson's account.

GitHub setup:

1. Create a new GitHub repository for this dashboard.
2. Add GitHub Actions repository secrets under Settings -> Secrets and variables -> Actions:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Push the contents of `05_personal-dashboard` as that repository root.
4. In GitHub repository Settings -> Pages, choose GitHub Actions as the build/deploy source.
5. Run the "Deploy Personal Dashboard PWA" workflow or push changes to `main`.
6. Open the Pages URL in iPhone Safari and run the PWA test below.

The workflow generates `app/config.json` during deployment from repository secrets before uploading the `app/` artifact. Do not commit `app/config.json`. The config contains only the Supabase project URL and anon key; the login email is entered manually in the app.

Do not use `/docs` as the Pages source for this project. Do not move the files in `app/` to the repository root.

Supabase Auth redirect URLs:

After GitHub Pages gives the final URL, add both forms in Supabase Auth URL Configuration:

```text
https://<username>.github.io/<repo-name>/
https://<username>.github.io/<repo-name>/index.html
```

If a custom domain is added later, add the custom-domain URL here as well.

Repository note:

The local Jessica workspace may contain this folder inside a larger workspace, but the GitHub repository for deployment should treat `05_personal-dashboard` itself as root. In that independent repo, the existing workflow path and artifact path are already correct:

```yaml
.github/workflows/deploy-pages.yml
path: app
```

Legacy alternative if deploying from the larger Jessica repository:

1. Copy `.github/workflows/deploy-pages.yml` to the larger repository root.
2. Change workflow path filters from `app/**` to `projects/05_personal-dashboard/app/**`.
3. Change artifact path from `app` to `projects/05_personal-dashboard/app`.

This alternative is not the recommended setup.

### 2026-10-25 approved UI/accessibility release

Build `2026.10.25.1` pairs with Service Worker cache
`jessica-dashboard-v2026-10-25-1`. This release contains only the approved
non-sticky management heading, darker revision-reason boundary and two local
Traditional Chinese language roots, plus release-version metadata. The heading
and Close button scroll with the dialog content; this is the accepted tradeoff.
There is no schema, backend, authentication, domain-data or Skill Core change.

The canonical URL is `https://voiceofz-prog.github.io/personal-dashboard/`.
The words "更新與營運" are not an application route and should not be appended
to that URL. Publish only `app/` through the existing Pages workflow; private
local Skill/trial evidence is not a website artifact or part of this release.

After publishing, verify the matching Actions commit, HTTP asset responses,
runtime/cache versions and login surface. Existing installations should reopen
online and reload so the new worker can activate; confirm build `2026.10.25.1`
in Settings after sign-in. Do not clear pending drafts or local data merely to
force an update. Physical iPhone/Safari, real sign-in/data transactions and
offline/AT acceptance remain separate from a static release check.

Rollback, if this release fails, is a new revert commit of the release changes
followed by the same verification/deploy/readback sequence. The prior remote
baseline is `d2508e80ae86e33c1025b2db2b6f4fb9a33d6b84`, build
`2026.10.04.1`; do not reset shared history or touch backend data. No rollback
is claimed unless actually executed.

### 2026-11-05 Fitness presentation release

Build `2026.11.05.1` pairs with worker `jessica-dashboard-v2026-11-05-1`.
Only the active authenticated Fitness view uses the Jessica journal presentation:
Jessica wordmark, 每日練習・訓練手札, 記錄今天, then training, recovery and the
existing record form. Home, English, Settings and login retain their presentation.
On 2026-11-05 the integrated app passed rendered 320/390/768/1440 checks,
navigation, keyboard focus and Demo-only draft/revision/withdraw/restore checks;
the existing production account baseline was read-only. The native gate passed
10 scripts and 13 test suites. Physical iPhone/Safari, assistive technology and
full WCAG conformance remain NOT VERIFIED.

Open https://voiceofz-prog.github.io/personal-dashboard/#fitness online and sign
in normally. The Fitness bookmark selects the screen before the existing login
gate is resolved, without bypassing it. The root URL still starts at Home; choose
**Fitness** in the bottom navigation when using that URL. Other fragments and the
record-form anchor retain their behavior.
Confirm the visible journal elements as well as the build in Settings. If an
already-open PWA still shows the old interface, preserve any open draft, reconnect
and reload or close/reopen the app. The existing worker refreshes the shell from
the network; do not clear Local Storage, pending operations or all browser data.
No worker algorithm, Auth, backend, data contract or domain logic changed.

The pre-release rollback tree is `d68ac0b25ed8e103107a4e96c249f1221705cbe5`
(build `2026.10.25.1`). Roll back through a new scoped revert commit with fresh
paired app/cache versions, run the same gate, deploy, then inspect the actual
Fitness screen and account data. Never reset shared history or alter database
records for a presentation rollback. Rollback execution is NOT TESTED here.

### Home presentation release preparation — 2026-11-05

Build 2026.11.05.2 pairs with worker jessica-dashboard-v2026-11-05-2.
Vinson accepted the Home candidate and explicitly authorized Home integration
and publication on 2026-11-05. Deployment still requires pre-push gates and actual
post-deploy verification. The scoped change adds
the accepted Home presentation and the locally cached home-journal.css only.
Synthetic fixtures, preview controls, bootstrap and candidate labels are excluded.
Existing Fitness, English, Settings, login, Auth and domain/data logic are retained.
The dashboard JS changes only VERSION; the worker changes only paired version and
app-shell CSS membership.

Enter Home through the root URL or bottom navigation. Confirm Jessica,
每日練習・今日手札, the English/Fitness entries and the build in Settings. Preserve
real drafts/pending operations during normal online reload; do not clear browser
data. Retained behavior: Home refreshes after an English summary is saved; rating
alone does not immediately refresh the previous Home render. Long focus text and
physical Safari/PWA/assistive technology remain explicit acceptance limits.

Rollback baseline: 825e800a1aa1cf1516bdac711fa9820b5948a432, build 2026.11.05.1.
Use a new scoped revert with fresh paired versions and the same gate/deploy/actual
render checks. No database changes or shared-history reset. Rollback is untested.

## 4. iPhone PWA Test

1. Open the GitHub Pages URL in Safari.
2. Log in.
3. Use Share -> Add to Home Screen.
4. Open from the Home Screen icon.
5. Turn on airplane mode.
6. Confirm cached pages and demo/last cloud data open.
7. Complete English reviews or submit a fitness entry offline.
8. Reconnect.
9. Tap Sync Pending and confirm the record appears in Supabase.
10. If Sync Pending fails, read the `Last write error` shown in Settings before clearing the queue.
11. Switch between Home, English, Fitness, and Settings after scrolling; every view should open at the top without Safari zooming the form.

Logout behavior:

- If unsynced local records exist, logout asks for confirmation.
- Confirmed logout clears the cached cloud dashboard data and pending queue from that browser.
- Pending records created by one logged-in user are not synced under a different local session.
- The Settings clear action removes only pending records visible to the current local session.
- Legacy pending records created before owner tagging are assigned once to the currently authenticated account, but only for the previously supported write tables.
- Fitness workout sync sends the complete daily entry and workouts through one RPC transaction. The server revalidates the sole active Fitness cycle and every target; stale, inactive, superseded, mixed, zero-candidate, or multi-candidate input is rejected in full with a visible error.
- Pending Fitness rows created by older builds are not replayed because their intent cannot be proven safely. The current app cannot re-confirm or import them; keep the source record, review it before clearing the local item, and create only a genuinely new current entry.

## Fitness records v2 candidate setup

See [Fitness records v2](fitness-records-v2.md) for the canonical migration,
verification evidence and gated rollout. For local demo run
`node scripts/preview-fitness.mjs`; this excludes runtime cloud configuration.
The optional Actions variable `FITNESS_RECORDS_V2_READ_ONLY=true` generates
`fitnessRecordsV2ReadOnly: true` for a rollback that preserves effective reads and
stored pending drafts. Never roll back to unsafe history replacement or discard
version tables. No production migration/deployment occurred during implementation.

### Legacy limitations

- Settings reports English and Fitness module status separately. A successful module can refresh while the other retains its last successful cache.
- The app reads live Supabase rows after login and shows a true empty state when the account has no data.
- Jessica review is manually triggered for this phase. Follow `docs/jessica-review-loop.md`; domain records stay in projects `01` and `02`, while the Dashboard stores only published execution data and provenance.
