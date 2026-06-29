# Jessica Review Loop

## Boundary

The Dashboard is the execution and sync surface. It does not own domain judgment.

| Owner | Keeps | Publishes to Supabase |
|---|---|---|
| `01_language-learning` | Mika evidence, CEFR decisions, learning analysis, card wording | One English review cycle, current focus, and curated review cards |
| `02_Fitness_Nutrition` | Recovery interpretation, Plan A/B program logic, progression decisions | One Fitness review cycle and structured exercise targets |
| `05_personal-dashboard` | UI, Auth, offline queue, execution records, target provenance | Review events, self-checks, daily status, and completed workouts |

Raw transcripts and full domain logs stay in their source projects.

## Manual Trigger

Vinson can say: `Jessica，審查 Dashboard 並更新下一步。`

Jessica then performs both domain workflows through the authorized Supabase connector:

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

The process is complete only when the published rows are read back successfully. Automation must preserve these same states and checks.
