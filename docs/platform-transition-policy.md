# Dashboard Platform Transition Policy

This file preserves the detailed transition rules moved out of `project_brief.md` on 2026-07-16. It does not authorize Phase 2, a Sites publication, a Git-topology change, Supabase retirement, or a production cutover.

## Core Position

Local English and Fitness/Nutrition projects, their complete history, Jessica/Mika/Fitness judgment, and validated Skills are the durable core. GitHub Pages, Supabase, PWA mechanics, Sites, and future frontends are replaceable implementation choices.

The display platform must:

- contain no unique important data,
- be reproducible from local source projects,
- receive only curated results,
- use fixed blocks and publishing contracts,
- remain replaceable,
- preserve security and rollback,
- reduce actual maintenance rather than merely moving it.

## Current Formal System

GitHub Pages + Supabase remains the formal usable Dashboard, comparison baseline, rollback option, executable data-contract reference, and system history.

While formal, preserve:

- Supabase Auth, RLS, grants, RPC, migrations, owner isolation, and data integrity,
- Fitness target provenance, atomic writes, review cycles, and archive protections,
- GitHub repository, deployment materials, documentation, and last deployable version,
- current source-project-to-Dashboard publication and verification contracts.

Do not delete, stop, or weaken Supabase or GitHub Pages because Sites is being considered.

## Experimental Sites Position

The candidate simplification is:

`local projects -> Skill analysis -> ChatGPT/Codex updates Sites -> Sites display`

The experiment is pure display only:

- no formal data input,
- no direct local-project reads,
- no real-time update requirement,
- no assumed Supabase connection,
- no unique historical data,
- no database role,
- no replacement of current Auth, RLS, RPC, or sync behavior during validation.

Expected fixed blocks may include English practice sentences, speaking goal, English focus, Learning Map summary, next Fitness plan, progress summary, reminders, and updated time.

## Roadmap

### Phase 0 — Maintain

Keep the current formal system working. Fix current-use problems only. Do not start a full refactor, dismantle the current system, retire Supabase, or alter formal publishing.

### Phase 1 — Contract

Define platform-independent display needs and source ownership. This phase is complete in `docs/dashboard-display-contract.md`.

### Phase 2 — Validate

Start only after Vinson explicitly authorizes it. Test whether one Site can be updated reliably without changing the formal GitHub Pages + Supabase flow.

### Phase 3 — Decide

If Sites succeeds, make a separate switch decision, redirect display publishing, stop new legacy feature work, and archive rather than delete the old Dashboard. Evaluate Supabase retirement only later.

If Sites fails, stop the replacement path, keep the existing Dashboard formal, and resume only engineering work justified by current maintenance or mobile needs.

## Success Conditions

- The same Site can be updated reliably without layout drift.
- Fixed content blocks can be updated precisely.
- Local data can rebuild the full display.
- Sites stores no unique important data.
- Phone and iPad reading are clearly better.
- Skill publishing is clearly shorter than the current path.
- Most updates no longer require heavy frontend engineering.
- Errors can be recovered quickly.
- Overall maintenance cost decreases.
- A Supabase-like data layer is not recreated inside Sites.
- Two complete frontends do not require long-term maintenance.

## Stop Conditions

Stop the Sites replacement path if any two occur:

- The same Site cannot be updated reliably.
- Updates often damage layout.
- Fixed blocks cannot be updated precisely.
- Phone or iPad reading is not clearly better.
- Publishing is not shorter.
- Rollback is unacceptable.
- Sites becomes another heavily manual system.
- Both frontends must remain complete long term.
- Important data exists only inside Sites.
- Platform limits, pricing, or dependency are unacceptable.
- Almost the full Supabase + GitHub Pages flow must remain.

## Retirement Boundary

If a replacement succeeds, the old Dashboard enters archive mode: stop routine feature growth, fix only serious safety/usability issues, preserve repository/docs/migrations/history/last deployable build, and keep a recovery path.

Any Supabase retirement, Git repository ownership change, history rewrite, remote change, or physical deletion requires a separate explicit architecture decision.
