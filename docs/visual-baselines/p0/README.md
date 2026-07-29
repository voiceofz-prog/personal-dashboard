# P0 Phone-Width Visual Baseline

## Capture Record

| Item | Value |
|---|---|
| Captured | 2026-07-29 |
| Application tree | Commit `e23f6a2ec16fc5a36736e04cfdb552583127a8a5`; build `2026.07.29.3` |
| Data mode | Local Demo Preview with no Supabase runtime config |
| Requested viewport override | 390 x 844 |
| Actual Chrome capture area | Login 390 x 367; module views 375 x 353 |
| Purpose | Phone-width layout reference only; not physical iPhone acceptance |

Chrome automatic translation was temporarily suppressed during local capture so the images preserve app-authored text. The temporary HTML marker was removed before this baseline was recorded; `app/index.html` and the complete `app/` tree have no committed P0 changes.

## Reference Files

| File | Required visual anchors |
|---|---|
| `phone-width-login.jpg` | Login card, email/password controls, Login, and Open Demo Preview remain readable without horizontal overflow. |
| `phone-width-home.jpg` | Header, Today card, English/Fitness metrics, and fixed bottom navigation remain aligned at phone width. |
| `phone-width-english.jpg` | Review card, Learning Map status, seven-day metrics, and bottom navigation remain readable. |
| `phone-width-fitness.jpg` | Body/Recovery metrics, Next Training cards, and bottom navigation remain readable without clipping. |

## Review Rules

- Compare layout hierarchy, clipping, overlap, horizontal overflow, fixed navigation, and first-screen information density.
- Do not require pixel-perfect text rendering across browsers, operating systems, or font versions.
- Recapture all four files after a structural rendering release or an intentional phone-layout change.
- Record intentional differences in the bounded-change log before replacing a baseline.
- Use [iphone-acceptance.md](../../iphone-acceptance.md) for real Safari, Home Screen, input, focus, scroll, Service Worker, and offline acceptance.
