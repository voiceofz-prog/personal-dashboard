# Fitness page acceptance — 2026.10.03.6

## Current follow-up — 2026.10.04.1

2026-10-04 release authorization: Vinson approved pushing this reviewed frontend
candidate to Dashboard main, including its existing automatic Pages workflow.
Pre-push verification passed again (10 scripts/13 suites). This authorization
does not activate V2 or apply a production database migration; phone evidence and
authenticated production acceptance remain the documented pending gates.

Release result: implementation commit `a5904d7` was pushed to main; [Pages run
37166810644](https://github.com/voiceofz-prog/personal-dashboard/actions/runs/37166810644)
completed successfully. Direct deployed asset readback confirmed Dashboard
`2026.10.04.1` and Service Worker `jessica-dashboard-v2026-10-04-1`. This confirms
frontend publication, not production V2 activation or authenticated functionality.

Vinson requested changes only to the training/activity record browser. This
section supersedes the earlier per-row outer management layout below.
Details now show two groups and exactly two outer management controls: Quick Log
and other activities. Quick Log defaults to daily status (editing it includes
all active linked actions); a single inner selector keeps individual action
history/withdraw/restore accessible. Multiple activities use the same selector.
The existing correction/save pipeline is retained. No schema/source rules changed.

The withdrawn checkbox was enlarged by the global full-width input style; a
scoped 18px control fixes the proportions. The toolbar uses 44px previous/next
buttons and a flexible month field. Month browsing now offers clickable recorded
dates, while retaining calendar navigation and incomplete/offline warnings.
Normal success no longer displays the unhelpful “月份紀錄已取得” status.

Computer Use on loopback Demo: selected June 26 through the date shortcut;
opened Quick Log and changed the first action reps to 16/17/17/17 while preserving
the second action; saved successfully. Added two synthetic activities on June 26,
selected the second via the shared activity entry and saved 12 minutes. DOM
measured 18px checkbox, two outer management buttons, no horizontal overflow at
1280px. This round did not retry the paused responsive viewport issue and does
not claim new phone/device acceptance.

The independent reviewer found two regressions during implementation: hidden
individual-action management and stale failure callbacks exposing a menu over
another editor. Both were fixed and independently rechecked; no confirmed blocker
remains in this increment. Actual-handler regression tests cover both, and the
full 10-script/13-suite verifier passed. Dashboard/SW build is `2026.10.04.1`.
No push, deployment, production migration or production record write occurred.

Evidence: [date shortcuts](visual-baselines/fitness-record-groups-desktop.jpg)
and [two management groups](visual-baselines/fitness-record-management-groups.jpg).

Date: 2026-10-03. Dashboard main agent implements and performs Computer Use;
independent `fitness_ui_reviewer` reviews the final working-tree differences.
Fitness source rules, schema and migrations are unchanged this round.
No push, deployment or production write was performed.

## Implemented interface

Order: Body & Recovery → Next Training → Quick Log → other activities →
training/activity records → Plan A/B recent performance. Quick Log stays visible;
activity and Plan sections start collapsed. Collapsing the activity form preserves
its draft. Recovery warnings remain outside the optional review details, including
when a reviewed training target is missing.

Latest and history now share one selected-date card with whole-day counts,
expandable complete records, calendar/month selection, previous/next month,
record-date markers, back-to-latest and withdrawn-content toggle. Saving selects
the affected date; ordinary data refresh preserves selection. Only-withdrawn dates
remain accessible. Pending/conflict/re-review warnings are outside the details.

Legacy month queries use existing owner-filtered paginated reads and normalizers;
they are display-only and do not replace recommendation inputs. Unfetched/offline
dates show connection-required status rather than asserting an empty date.
Owner changes and superseded requests invalidate late responses and cached months.

Each row has one management entry. The existing correction/version/save pipeline
runs inside a native dialog: fullscreen at phone width, centered at tablet width.
Dirty close uses an in-page discard prompt. Close restores scroll and row focus,
including when render replaced the original button. V2 absence permits original
version viewing with editing/withdrawal disabled; read-only mode disables writes.

## Automated evidence

`node scripts/verify.mjs`: 10 app scripts and 13 suites passed. Includes existing
sync, immutable target/provenance, source acknowledgement and owner isolation tests.
New actual-handler tests cover whole-day grouping/all Plan rows, calendar/date
selection, withdrawn and empty states, legacy month normalization/pagination path,
offline unknown status, owner/cache request races, dirty close/focus restoration,
withdrawn conflict recovery entry and legacy version viewing without V2 calls.
Recovery-warning rendering also covers missing reviewed targets.

## Computer Use evidence

Real browser operations used local `preview-fitness.mjs`, not a model-only test.
All records below are synthetic Demo records. Phone viewport: 390×844;
tablet: 820×1180. These are desktop browser widths, not physical-device evidence.

| Case | Observed result |
|---|---|
| Add hiking on June 26 | Saved with the existing daily status and two Plan rows on the same date. |
| Collapse/reopen activity form | Activity-name draft remained. |
| Edit activity and provide reason | Revision 2 displayed on the affected date. |
| Dirty close → continue editing | In-page confirmation; original draft retained. |
| View versions | Original and correction appeared with revision/reason evidence. |
| Withdraw → show withdrawn → restore | Revision 3 hidden by default; toggle exposed it; restore produced revision 4. |
| Calendar May → June → June 24 → latest | Same date card replaced its content; latest returned to June 27. |
| Quick Log with all five Plan exercises | Saved date displayed one daily status and all five action records. |
| Phone/tablet management | 390px fullscreen / 700px centered tablet dialog; no horizontal overflow. |
| Synthetic save rejection | Actual save handler retained notes/reason and showed failure comparison entry. |
| Synthetic version conflict | Actual compare handler displayed latest snapshot and retained draft; accepting baseline retained draft. |
| Discard and close after failure | Confirmation closed the dialog; returned to the date card. |
| V2 read-only | Edit and withdraw controls disabled. |
| Legacy offline | Connection-required partial-data warning; original version view worked without V2 reads. |
| V2 offline correction | Actual queue path retained synthetic change, displayed revision 2 and always-visible pending status. |

Fault scenarios use `node scripts/preview-fitness.mjs --qa` on loopback port 5205.
The explicit QA mode serves `tests/helpers/fitness-preview-fixtures.js`, outside
`app/` and the production/SW artifact. It starts with empty runtime config, uses
only `demo-preview`, and substitutes transport failures; no live Supabase request
or real user record is used. Intentional failure responses are successful fault
acceptance, not failed repair attempts. Real reconnect/sync is not established by
these synthetic transport controls.

Screenshots:

- [Tablet management](visual-baselines/fitness-management-tablet.jpg)
- [Desktop conflict comparison](visual-baselines/fitness-conflict-desktop.jpg)

Final tablet recapture: DOM viewport 820×1180, dialog width 700px at x=52.5,
no document overflow. Screenshot output excludes some browser surface and its
pixels differ from DOM viewport; viewport dimensions refer to DOM measurements.
Phone re-capture is paused due to the tool issue below. The inconsistent phone
capture files are retained for diagnosis, not accepted visual evidence.

## Findings and corrections

Independent review led to fixes for detached focus restoration, raw legacy reps,
stale monthly cache acceptance, overlapping management reads, old saves closing a
new editor, initial month completeness, day-type summary and withdrawn conflict
recovery. Later review found the missing-target warning boundary; the final UI now
also uses measured recovery warning status. Computer Use found a browser default
dialog width cap; the explicit phone max-width fixed the fullscreen requirement.
Dashboard refresh also rejects prior-owner and superseded-request results.

One browser action initially matched two recovery-note fields; scoping to the
management dialog resolved the locator ambiguity. One offline management lookup
ran before expanding date details; expanding the visible control resolved it.
The warning regression test had two fixture setup failures before passing.
The final responsive screenshot refresh reached the three-attempt limit below.
The previous native-confirm automation interruption is distinct from disabled
production V2 functions; ordinary dirty-close confirmation now lives in the page.

Latest retry rule: pause only a part/root cause after three failed attempts,
continue independent work, and report unresolved parts without renaming retries.

### Paused part: final phone screenshot recapture

Computer Use viewport overrides stopped matching actual page dimensions.
Attempt 1: request 390×844 on existing tab, inspect after interaction: DOM remained
820×1180. Attempt 2: set dimensions in a separate call, then fresh observation:
DOM still 820×1180. Attempt 3: create a new tab after override: DOM 1280×720 and
700px desktop dialog. Requested dimensions alone are not evidence. This part is
paused; no fourth resize attempt was made. Earlier phone acceptance measured
390×844 with a 390px dialog, but the last inconsistent screenshot cannot support
that result. Impact: final phone visual evidence is incomplete; runtime test and
tablet acceptance continue. Next step: resolve the browser override behavior or
perform an authorized physical-device/manual phone-width check.

## Supabase Free compatibility and activation gap

Read-only connector preflight identified the active Dashboard project
`zkxluwdddssdvfbirypg`, healthy PostgreSQL 17.6, organization plan `free`.
Database size: 14,757,011 bytes; public tables: 2,326,528 bytes. Eleven canonical
migrations exist through `20260801014145_fitness_v1_existing_edit_guard`.
All seven V2 read surfaces and `save_fitness_record_v2(jsonb)` are absent.

The pending canonical migration is
`supabase/migrations/20261003074631_fitness_records_v2.sql`.
SHA256: `C0CAF7A6FF32C0C3E49ABDDB8514BB380A024B7169C18DA1FF56191915283ECE`.
This missing upgrade explains disabled production activity saves/edit/withdraw;
it is an inherited incomplete rollout, not evidence of a Free-plan restriction.

[Official pricing](https://supabase.com/pricing) lists dedicated Postgres,
unlimited API requests and 500 MB database storage on Free. Ordinary SQL tables,
functions and [owner RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
can support this contract without a paid feature. Current database size is below
that storage allowance. Egress usage was not measured; pricing does not prove
every quota or every authenticated function is healthy.

Free does not include automatic backups/PITR or branching; use an encrypted local
database export plus an authorized disposable restore rehearsal for the release
gate, instead of requiring paid branching/PITR. Inactivity pauses still require
restoring the project when needed; local pending writes preserve work during
temporary unavailability, but cannot substitute for authoritative cloud history.
No paid upgrade or new branch was created. No unsafe v1 edits or local-only
replacement of formal records was introduced as a workaround.

## Remaining release acceptance

Production activation is a separate pending part because the approved scope
explicitly excluded formal database migration and push/deployment. Concrete
cutover/rollback steps remain in [fitness-records-v2.md](fitness-records-v2.md).
Before activation: backup/restore rehearsal, apply only the pending canonical
migration, verify backfill/RLS/provenance invariants, authenticated create/edit/
withdraw/restore/conflict/idempotent round trips, Fitness source readback/review
acknowledgement, then separately authorized frontend release.

Not verified this round: real authentication and V2 production round trips,
production offline reconnect/sync, real scheduled Fitness publication, same-origin
PWA update and physical iPhone Safari. Demo acceptance must not be presented as
production or device acceptance.

## Final independent review

`fitness_ui_reviewer` reviewed the final runtime/test differences, independently
reran the related warning and record-browser suites, verified the migration hash,
then rechecked the corrected evidence document/task board/screenshots. No
unresolved confirmed vulnerability or blocking code issue was reported. This is
an independent manual code/security review, not an official Codex Security scan.
Phone evidence recapture and the formal activation/device gates remain incomplete;
the task board intentionally does not mark the overall work complete.
