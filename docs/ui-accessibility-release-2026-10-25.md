# UI/accessibility release — 2026.10.25.1

Date: 2026-10-25, Asia/Taipei. Result: **PASS for this static release and the
bounded checks below**, not full-product, authenticated-data or accessibility
conformance acceptance.

## Authorization and published version

Vinson explicitly approved commit, push and publication after the local trial
evidence cleanup. Release commit:
[c11fb4552c74bfc0b1ab585703e609b4730db738](https://github.com/voiceofz-prog/personal-dashboard/commit/c11fb4552c74bfc0b1ab585703e609b4730db738).

[Pages run 40168375723](https://github.com/voiceofz-prog/personal-dashboard/actions/runs/40168375723)
completed successfully for that exact commit. Verification, runtime-config
creation, artifact upload and Pages deployment steps all succeeded.
Run: 14:14:07–14:14:28 Asia/Taipei; asset comparison: 14:15:33.

- Dashboard: `2026.10.25.1`.
- Worker: `jessica-dashboard-v2026-10-25-1`.
- Canonical site: https://voiceofz-prog.github.io/personal-dashboard/
- App changes: non-sticky management heading; darker revision-reason boundary;
  two local `zh-Hant` roots; paired version/cache metadata.
- Accepted tradeoff: the heading and Close button scroll with the dialog.
- No backend, schema, authentication, domain-data, dependency or Skill Core
  change. Only `app/` is the website artifact. Full local Skill/trial/cleanup
  evidence was deliberately not committed to this public repository.

## Actual checks

| Check | Observation |
| --- | --- |
| Existing local verification | Before release edits, after edits and after commit: 10 scripts / 13 test suites PASS. CI verification also succeeded. |
| Public static files | HTTP 200 and exact byte equality with the release Git tree for all 21 app-shell/worker assets, including icons and synthetic demo data. Configuration contents were not read. |
| Production login | Initialization settles to “Sign in to continue.”; email/password controls and enabled Login button present; no captured warning/error messages. No credentials entered or real login attempted. |
| Production loaded DOM/styles | Two local language roots are zh-Hant; heading computed position static; reason border rgb(102,112,133). This is not an authenticated remote dialog interaction or a repeated focus-obstruction measurement. |
| Local isolated Demo, 1280×720 | Home/English/Fitness/Settings navigation; Settings build 2026.10.25.1; June 26 daily/two-workout management edit; enabled/required reason with white fill and darker border; both language roots. No cloud configuration served. |
| Draft regression | Entered synthetic unsaved reason, Cancel prompt, Continue retained the exact draft, Close then explicit discard closed the dialog and returned focus to the management trigger. Original three revision-1 labels remained; no save action or backend write. |
| Existing-browser update | First reload retained old CSS; after update and a second settled reload, both repaired computed styles were observed. No local-data/queue clearing. |
| Worker registration/cache keys | Not Verified directly: the browser read-only inspection scope did not expose navigator.serviceWorker. Downloaded worker bytes/version were verified; do not infer cache-key or physical PWA acceptance from that. |
| Literal supplied suffix | /更新與營運 returns 404; it is not an app route. Use the canonical root above; no new route was created. |

The original two Stage D repair files remained byte-identical in the working
tree throughout release preparation. The published Git tree uses the existing
LF text policy, so HTTP byte hashes below are committed-tree hashes, not the
older CRLF working-file hashes. No repair was reverted or reformatted in place.

### Decisive published SHA256

| Asset | SHA256 |
| --- | --- |
| index.html | 066e2b7e8959ffd961692936331d54b4882aae758c5c3e349c6636a1a943d755 |
| product.css | 6cf9b7c1742a927c8d32349bc981835d8836bfb7d4175da59c27bdd3c415a684 |
| dashboard.js | f45af21cad30a21c0d858cdd9ceba854a1d769d015f4387adaab31e45af63506 |
| service-worker.js | 969ecf4a388603a113c2c0a9d7bab79ad959e5dc714ea72c7606b01091ef6c82 |

All other checked assets also matched their exact release blobs. This comparison
checks deployed bytes, not signed-in behavior, WCAG conformance or device parity.

## Operation and rollback

Reopen online and reload after the worker update; then confirm
`2026.10.25.1` in Settings after sign-in. Existing cached installations may need
the second reload observed above. Do not clear pending records/drafts simply
to refresh the site.

Physical iPhone/Safari/iPad, actual sign-in and cloud transactions, offline
transport, Home Screen, AT, zoom/text-spacing and full-product conformance were
not re-tested. Earlier trial FAIL/BLOCKED/unknowns are not upgraded by this release.
Time/token/financial cost and method-efficiency comparisons remain not_measured.

If a rollback is needed, create a new revert commit of the release changes,
run the existing gate and redeploy/read back. Previous deployed baseline:
`d2508e80ae86e33c1025b2db2b6f4fb9a33d6b84`, build `2026.10.04.1`.
No reset/force-push, database rollback or actual rollback rehearsal was performed.
