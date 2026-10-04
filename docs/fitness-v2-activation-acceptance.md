# Fitness V2 activation acceptance — 2026-10-04

## Execution ownership and current state

Dashboard main owns backup, migration preparation, tests and browser acceptance.
The independent reviewer checks code/security and the final changes. The Fitness
representative checks source integration read-only. No source-project rules were
changed. Production V2 activation and signed-in desktop acceptance are complete;
device and future source-publication limits remain explicit below.

Vinson requested completion, automatic repair/review, and validation before
submission. The automatic approval reviewer subsequently rejected changing the
production Actions read-only variable and triggering Pages, because exact
authorization for that production switch was not recognized. No production
variable or database was changed at that point. Vinson subsequently explicitly
approved the protected production V2 switch. Both Fitness automations were paused
during cutover and restored to ACTIVE after verification, preserving their prompts,
models, schedules and existing auto-archive settings.

## Verified preparation

- Production `personal-dashboard` (`zkxluwdddssdvfbirypg`) is healthy. Its ledger
  had eleven canonical migrations through `20260801014145` before cutover.
- Preflight found 114 daily records and 241 workouts. No workout lacks a daily or
  target link, and all 241 historical provenance joins are valid. The reviewer's
  potential unlinked-legacy-row limitation therefore does not affect these rows.
- Existing migration SHA256 is unchanged:
  `C0CAF7A6FF32C0C3E49ABDDB8514BB380A024B7169C18DA1FF56191915283ECE`.
- The full local gate passed: ten scripts and thirteen test suites.

## Scoped encrypted backup and restore rehearsal

One consistent production query captured all fields of six Fitness rowsets:
114 daily records, 241 workouts, 580 exercise targets, 60 Fitness review cycles,
zero plan targets and zero weekly reviews; three existing Fitness function
definitions were retained. No Auth password/token or service-role key was exported.
Captured timestamp: `2026-10-04T01:36:41.53872+00:00`.

The ignored local file is `secrets/fitness-pre-v2-20261004.json.dpapi`. Plaintext
was removed after verified Windows CurrentUser DPAPI encryption/decryption.
Plaintext SHA256 (base64): `SS7h7Q6Epf/vIA7XgjYd1tW71gNlZo9W8/HKVCBBhXs=`.
This protects only this scoped snapshot and is recoverable by the current Windows
identity. It is not a portable/off-site backup or full Auth/Storage/database
disaster-recovery claim. Personal backup contents must never be committed.

The existing disposable project `ohvmphedogiraszdjueg` was resumed. Two attempts
encountered its restored pre-existing V2 tables/internal functions. The third
isolated both `public` and `dashboard_internal` inside a single outer transaction,
rebuilt the canonical baseline, and restored all six rowsets. All eighty column
definitions matched production; each sorted all-field JSON rowset matched the
snapshot exactly, including ownership and timestamps. Historical daily/target/
cycle provenance passed. The exact V2 migration then backfilled 355 heads and
355 original revisions, with exact original snapshots/timestamps. The complete
SQL fixture also passed. The outer ROLLBACK preserved the disposable's prior
schema, and readback found zero remaining Fitness facts and zero fixture users.
The third attempt succeeded; the three-failure pause condition was not reached.

This is Fitness data reconstruction and additive migration rehearsal, not full
database restoration. Original-data parity was refreshed before cutover and again
after signed-in acceptance. The disposable was paused after testing; explicitly
synthetic concurrency rows remain there, with no restored personal facts persisted.

## Adversarial and concurrency verification

The disposable's previously installed RPC differed from the final canonical body.
The five canonical function definitions were applied there only; normalized
`prosrc` parity was verified before concurrency testing.

Two independent SQL connections exercised the actual RPC and ordered locks:

| Case | Observed result |
|---|---|
| Two distinct requests revising expected version 1 | Exactly one commit, one `40001 FITNESS_VERSION_CONFLICT`; final revision 2, two versions/two receipts including create. |
| Two simultaneous identical requests for expected version 2 | Both succeeded; final revision 3, three versions/three receipts. Only one additional write. |

Synthetic race rows are explicitly named and belong only to the disposable.
The expanded `tests/fitness-records-v2.test.sql` passed on the actual database.
It checks activity creation, exact replay/collisions, edit/withdraw/restore,
atomic rollback, immutable provenance, linked daily withdrawal, source-only
acknowledgements, linked-date/rest rejection, null completion, blank reasons,
original overwrite rejection, owner isolation across all eight data surfaces,
anonymous rejection and non-allowlisted authenticated rejection. Tests roll back.

These are controlled database authorization/adversarial tests and independent
code review, not a claimed full external penetration test or Codex Security scan.
The security advisor reported only disabled leaked-password protection. Official
[password-security documentation](https://supabase.com/docs/guides/auth/password-security)
states that feature requires Pro or above; it is not a Fitness capability blocker.
No password or Auth settings were changed.

## Protected production cutover and final readback

Pages run `37172979834` deployed the existing read-only flag; the deployed runtime
and disabled save control were checked before migration. Only the reviewed V2
migration was applied. Immediately afterward, 355 heads and 355 original revisions
matched all 114 daily records and 241 workouts, including snapshots and timestamps.
All six original Fitness rowsets matched the scoped backup. Final post-acceptance
readback again confirmed all original rows unchanged and all 355 original heads
at revision 1, not withdrawn. The review-cycle comparison is restricted to the
60 Fitness cycles, rather than unrelated English cycles sharing that table.

The migration tool initially assigned ledger version `20261004034604`. Following
independent review, a guarded metadata-only repair restored canonical version
`20261003074631`; its single statement and MD5
`efcb8c76f8258e11ef129fabbf5873ca` were unchanged. The migration was not reapplied.
Live RLS, owner checks, invoker views, function search paths and execute/write
grants were independently checked. Pages run `37177511706` restored writes; the
deployed runtime flag was false. App/SW remain the previously deployed `.1` build.

## Actual browser verification and remaining limits

Vinson logged into the deployed Dashboard in Edge. Computer Use confirmed cloud
data, Fitness layout, exactly two outer management groups, original version
lookup, and disabled edit/withdraw controls before activation. After activation,
actual signed-in Supabase round trips passed for activity and Quick Log creation,
correction, version lookup, withdrawal and restoration. Dirty-close confirmation,
draft preservation, affected-date selection and focus restoration passed. Calendar
previous/next month, recorded-day selection and return to latest passed. A real
historical Plan B editor showed all five existing actions without modifying them.

Both synthetic records use `2000-01-01` and explicit QA labels. Activity
`1ccb5f2e-5095-4e49-b784-6399a891bbf1` and daily
`f605dbc4-2981-4557-963a-eda62dfbcfeb` each finished at revision 5, withdrawn.
Unmeasured weight/sleep/activity metrics remained null; required daily scores were
explicit synthetic test inputs. Final totals: 357 heads, 365 revisions, 10 receipts;
effective non-withdrawn facts remain 114 daily / 241 workouts / zero activities.
Effective views retain withdrawn rows for audit; consumers explicitly exclude them.
No synthetic
Plan workout was created. QA history must not become health or training evidence.
Ignored private screenshot `secrets/fitness-v2-live-versions.png` records the
actual version dialog. Browser viewport was 1912 pixels with no horizontal overflow.

Remaining limits: physical iPhone/Safari, production offline failure/conflict
injection and observation of the next real source review/publication were not run.
Those failure/conflict/offline cases passed in Demo and database fixtures instead.
Technical source handoff is separate from a real domain review/publication.
The source's existing blocked-missing-evidence review remains unresolved and
cannot receive a success acknowledgement merely because V2 is enabled.

Earlier in-app phone screenshot recapture remains paused after three viewport
mismatches. Physical iPhone/Safari is unverified. Existing Demo acceptance for
drafts, conflict, failures, offline queues and tablet layout remains documented
in `fitness-page-acceptance.md`.

## Recovery procedure retained

1. Temporarily pause the two existing Fitness automations and drain old runs.
2. Deploy the existing `FITNESS_RECORDS_V2_READ_ONLY=true` switch; confirm it on the
   deployed origin and prohibit user writes during maintenance.
3. Recheck ledger, migration hash, current original data and source inactivity.
   Apply only the pending canonical V2 migration, never bootstrap/schema.sql.
4. Read back original hashes, version mappings, complete invoker views/RLS/grants,
   then enable writes for signed-in acceptance using clearly marked test records.
5. Verify source fresh effective/version behavior without inventing a successful
   domain review. Restore the original automation states after safe activation.
6. On a blocking write failure, keep V2 effective history and the read-only switch;
   preserve pending requests and report the failed part. Never drop revisions or
   return to raw historical replacement semantics.

No blocking production write failure occurred. Applicable tests and final
independent review must pass before submission; the remaining device/source
limitations must accompany the completion report.

## Final independent acceptance

The independent reviewer examined all six changed files and necessary paths,
then independently read back the canonical ledger/hash, final QA versions,
original heads and effective non-withdrawn counts. No unresolved confirmed
security or functional blocker remained. The final local gate passed all ten
scripts and thirteen suites; the expanded SQL fixture also passed on PostgreSQL.
Fitness representative final owner-authenticated readback confirmed original
counts, both complete five-version QA histories, explicit withdrawal exclusion
and no QA-linked workouts. Technical handoff can proceed without releasing the
existing missing-evidence block. Source task-board activation wording is stale
and should be updated by its owner; this Dashboard-only round did not modify it.
