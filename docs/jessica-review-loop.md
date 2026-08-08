# Jessica Review Loop

## Position

This document describes the current closed-loop workflow for the GitHub Pages + Supabase Dashboard. Its source-project ownership rules remain valid, but Supabase publication is no longer a permanent long-term assumption. For the current project goal and display-layer transition principles, follow `project_brief.md`.

## Boundary

The Dashboard is the presentation and, in the current PWA, execution/sync surface. It does not own domain judgment.

| Owner | Keeps | Current formal Dashboard path |
|---|---|---|
| `01_language-learning` | Mika evidence, CEFR decisions, learning analysis, card wording | Publishes one English review cycle, current focus, Learning Map summary, and curated review cards to Supabase |
| `02_Fitness_Nutrition` | Recovery interpretation, Plan A/B program logic, progression decisions | Publishes one Fitness review cycle and structured exercise targets to Supabase |
| `05_personal-dashboard` | Current UI, Auth, offline queue, execution records, target provenance | Reads published rows and writes review events, self-checks, daily status, and completed workouts |

Raw transcripts and full domain logs stay in their source projects.

Future pure-display paths, including ChatGPT Sites Phase 1, should preserve the same source-project ownership while replacing the final publication/display target with a fixed display-content contract. Sites must not become the only place where important history or judgment exists.

## Manual Trigger

For any later pure-display path, use [dashboard-display-contract.md](dashboard-display-contract.md) after source judgment is complete. The current Supabase closed loop remains unchanged until a separate formal decision.

Vinson can say: `Jessica，審查 Dashboard 並更新下一步。`

While the current Supabase-backed Dashboard is formal, Jessica performs both domain workflows through the authorized Supabase connector:

1. Read only evidence newer than the active cycle's `evidence.through`.
2. Ask for missing information only when it prevents a safe decision.
3. Let each source project determine its own content and targets.
4. In one transaction per domain, supersede the previous active cycle, deactivate replaced outputs, create the new cycle, and publish the new outputs with its `review_cycle_id`.
5. Read the published rows back and verify ownership, active status, counts, and target values.
6. Report what changed, what evidence was used, and when another review is due.

## Fitness Completion Contract

- A reviewed Fitness cycle must publish a complete Plan A or Plan B target set, not a partial plan.
- Recovery rules in the Dashboard may replace training with a recovery day.
- When training remains appropriate, the Dashboard uses Jessica's exact weight and reps as the ceiling.
- A completed `fitness_workouts` row stores `target_id`, connecting execution to the reviewed target.
- The next Jessica review compares target versus actual before progressing, maintaining, or reducing the target.

## English Completion Contract

- The English cycle records the reviewed evidence window and the next speaking focus.
- `english_focus_cards` and newly curated `english_review_cards` carry the cycle id.
- Review events retain the source card id and snapshot, so the next review can distinguish content difficulty from card wording changes.
- The next cycle must consider recent `again`, `hard`, and `mastered` results plus the latest self-check.

## Closed-Loop States

`evidence recorded -> Jessica reviewed -> target published -> target executed -> result recorded -> Jessica re-reviewed`

For the current formal Dashboard, the process is complete only when the published rows are read back successfully. Future display-only publishing may replace Supabase readback with a different verification step, but it must still prove that source-project judgment was preserved and the display result can be regenerated from local records.
