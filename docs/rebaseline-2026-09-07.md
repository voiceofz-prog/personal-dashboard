# Universal Rebaseline 2026-09-07

## Scope And Isolation

- Target: `05_personal-dashboard` only.
- Related evidence: `01_language-learning` and `02_Fitness_Nutrition` remain read-only contract owners.
- Legacy baseline: commit `e6389a10a665f3a619768a30a746b7288cdd8a77`, also mounted as detached worktree `.cache/rebaseline-legacy`.
- Candidate: branch `codex/rebaseline-2026-09-07` integrating the already isolated and remotely preserved `7494787` safety/refactor line with the current project-governance line.
- No deployment, live Supabase access, external write, Sites migration, or source-project modification is included.

## Preserved Truth, Contracts, And Invariants

- English and Fitness source projects own complete history and semantic judgment.
- The Dashboard presents curated content and records only approved interactions.
- The current GitHub Pages + Supabase PWA remains the formal system and rollback baseline.
- Auth, RLS, owner isolation, RPC atomicity, provenance, canonical migration history, offline ownership, PWA compatibility, and the display contract remain binding.
- Fitness recommendation and Plan-advancement semantics remain unchanged because their ownership evidence is unresolved.
- `SECURITY_REVIEW_REQUIRED`: the integrated history includes Auth/session, RLS/migration, queue-ownership, and atomic-write safety changes. This Rebaseline validates repository behavior locally but does not claim a live security review.

## Classification And Change Manifest

| Legacy mechanism | Class | Decision | Candidate and evidence |
|---|---|---|---|
| Ad hoc manual verification commands | Procedure / historical workaround | Replace | One dependency-free verification gate discovers scripts/tests and checks versions, assets, migration layout, deployment order, and whitespace. |
| Untested monolithic behavior | Implementation | Simplify | Preserve the classic entry while adding characterization coverage and an internal English responsibility boundary; no framework or build chain. |
| Unsafe Fitness edit/legacy queue paths | Implementation / compatibility | Replace | Fail closed for existing-entry edits and unsafe legacy queue items; retain atomic create behavior and provenance guards. |
| Numbered production migrations mixed with the live ledger | Procedure / historical workaround | Replace | Preserve numbered files as legacy history and use a canonical timestamped production ledger plus a separate blank-rebuild bootstrap. |
| Long continuation prompt repeating project rules | Redundant governance / handoff | Simplify | A short recovery pointer now loads authoritative files on demand. |
| `NEXT_STEPS.md` duplicating project direction and setup | Redundant procedure | Simplify | Compatibility pointer routes state to `task_board.md`, authority to `project_brief.md`, and operations to focused docs. |
| Permanent Discovery → Implementation → Validation agent chain | Historical capability compensation | Replace | Main agent may perform tightly coupled work; delegation is value-based; independent adversarial validation remains mandatory for non-trivial acceptance. |
| P1 stop gate after accepted work | Temporary | Replace | Preserve historical gate evidence; current explicit Rebaseline authority permits integration while semantic, production, external, and cross-project boundaries remain. |
| `app/app.js` legacy cache loader | Compatibility | Keep | Service Worker history still references the deployed entry; deletion lacks safe real-client cache evidence. |
| Fitness recommendation / next-Plan logic | Unknown semantic contract | Keep | Existing evidence conflicts with source-project authority; no safe implementation change is justified. |
| Sites preview | Experimental implementation | Keep isolated | Sites evaluation and cutover are not authorized by this Rebaseline. |

## Acceptance Conditions

1. Candidate preserves every listed invariant and contains no writes outside the target.
2. Candidate passes the unified local verification gate and all Legacy checks.
3. Candidate introduces no conflict marker, secret, runtime dependency, framework, or deployment action.
4. Canonical migration verification passes and historical SQL remains recoverable.
5. Independent validation actively searches for functional, structural, boundary, and rollback regressions and lists rejection reasons.
6. Candidate must be at least equal to Legacy behavior and materially better in verification coverage, unsafe-write handling, migration clarity, or governance burden.

## Development Evidence

- Legacy: five JavaScript syntax checks, three available Node regression tests, and whitespace check passed.
- Candidate: five JavaScript syntax checks, two JSON checks, canonical migration-layout check, ten Node tests, version/asset/cache/deployment checks, visual-baseline file checks, and whitespace check passed.
- Live Supabase, deployed same-origin Service Worker upgrade, and physical iPhone acceptance were not run and remain separate evidence lanes.
