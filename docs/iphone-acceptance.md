# Physical iPhone Acceptance

## Status

Defined for the P0 gate; not executed. P0 does not authorize production deployment, and desktop browser automation cannot claim a physical iPhone pass.

## Evidence Boundary

This checklist is manual physical-device evidence. It is separate from `node scripts/verify.mjs` and the phone-width visual files under `docs/visual-baselines/p0/`.

## Preconditions

- Record the candidate commit, Dashboard build version, and Service Worker cache version.
- Obtain separate authorization before deploying a candidate to the formal GitHub Pages environment.
- Confirm the device is using Vinson's intended account and that no unrelated pending record will be altered.
- Keep the previous known-good Pages commit available for rollback.

## Checklist

- [ ] Open the Pages URL in Safari while online; confirm the expected build and matching Service Worker cache version.
- [ ] Log in and confirm only the current owner's English, Fitness, and pending data is visible.
- [ ] Add or refresh the Home Screen app; close Safari, launch from Home Screen, and confirm the app shell opens.
- [ ] Switch Home, English, Fitness, and Settings; confirm each switch clears focus, returns to the top, and does not leave the keyboard open.
- [ ] Confirm all text/date/form inputs remain at least 16px, date controls stay within the viewport, and typing does not trigger unwanted zoom or horizontal scrolling.
- [ ] Complete the English reveal/rating/finish/edit-summary flow and confirm seven-day statistics update without duplicate records.
- [ ] Confirm Fitness conservative guidance keeps reviewed reduced training selectable, while an explicit `training_lock=true` cycle blocks training.
- [ ] Save a controlled Fitness entry and confirm only checked exercises/supplements are included and the daily row plus workouts behave as one atomic unit.
- [ ] Repeat one approved low-risk save while offline; confirm one understandable pending state and pending overlay appear without silent failure or duplicate rows.
- [ ] Reconnect and sync; confirm the pending operation clears once, the complete atomic bundle appears, and no partial row remains.
- [ ] Exercise an approved rejection case; confirm the UI reports rejection and recovery guidance instead of queuing a permanent contract error indefinitely.
- [ ] With a controlled pending record, verify logout warns before clearing and that a record owned by another user cannot sync under the current session.
- [ ] Reload after a Service Worker update and confirm the new shell activates without losing required offline compatibility.

## Result Record

| Item | Value |
|---|---|
| Candidate commit | Not run |
| Dashboard / cache version | Not run |
| Device / iOS / Safari | Not run |
| Online flow | Not run |
| Offline and reconnect flow | Not run |
| Issues found | Not run |
| Accepted by | Not run |
