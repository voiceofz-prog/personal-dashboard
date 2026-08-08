# Platform-Independent Dashboard Display Contract v1

## Authority And Scope

This is the single authority for the Personal Dashboard display-content contract. It defines the curated content, ownership, validation, fallback, and examples that a future renderer can use.

Project direction, platform selection, phases, and document-conflict priority remain governed by [project_brief.md](../project_brief.md). This specification does not replace that authority or modify the current formal GitHub Pages + Supabase system.

This contract is independent of Supabase table names, SQL, Auth, RLS, RPC, migrations, REST requests, GitHub Pages DOM, HTML/CSS/JavaScript, PWA cache, and ChatGPT Sites behavior.

## Purpose And Non-Goals

The contract packages the small amount of curated information Vinson needs to read on a phone or iPad. English and Fitness/Nutrition local projects remain the complete evidence and judgment sources. A display platform receives only a regenerable snapshot.

It is not:

- a database, history archive, backup, or source of truth;
- permission for a display platform to generate English or Fitness judgment;
- a replacement for current PWA writes, Auth, offline queue, provenance, or safety rules;
- a container for raw Mika transcripts, full daily logs, credentials, private data, or medical judgments.

## Current Content Inventory

This inventory is based on the active PWA markup/rendering code, current data-model document, and the approved English/Fitness source contracts.

| Current visible content | Actual evidence | Pure-display decision | Contract block |
|---|---|---|---|
| Home: today focus, compact English/Fitness summary, metrics, Fitness status, recent updates | app/index.html Home; app/dashboard.js composeDashboard and renderHome | Retain as curated summary, not browser-calculated metrics | dashboard_summary and fitness_progress_summary |
| English: focus, CEFR, tags, review sentences | app/index.html English; app/dashboard.js buildEnglishData and renderEnglish; docs/schema.md | Retain | english_today, speaking_goal, english_focus |
| Student Learning Map preview and detail | app/dashboard.js renderHomeLearningMap and renderEnglishLearningMap; English Learning Map integration contract | Retain as concise summary; full evidence remains in English | learning_map_summary |
| Commute, mistake, warm-up, self-test card libraries | app/index.html; app/dashboard.js renderReviewCardGroup | Keep only selected practice material in Phase 1 | english_today |
| Seven-day ratings, self-check, problem tracker, improvement log | app/dashboard.js englishProgressStats and renderEnglish | A single curated progress note is optional; full activity and evidence are non-essential | english_focus progress_note |
| Fitness: body/recovery, next plan, reviewed targets, review reason | app/index.html Fitness; app/dashboard.js renderFitness and computeFitnessRecommendation; Fitness 07 flow | Retain | fitness_next_plan and fitness_progress_summary |
| Plan progress and latest record | app/dashboard.js buildStructuredPlanCards and renderFitness | Retain only a short source-curated summary, not raw history | fitness_progress_summary |
| Recent Personal Records feed | app/dashboard.js buildRecentUpdates | Optional, only as a curated 1–3 item highlight list | dashboard_summary recent_highlights |
| Login, data source, sync queue, cache, online/offline, diagnostics, version | app/index.html Settings; app/dashboard.js renderSettings/renderNetwork | Current PWA/Supabase architecture only | Excluded |
| Review/self-check forms, Fitness Quick Log/editing, sync controls | app/index.html and app/dashboard.js write paths | Formal interaction/data entry, not pure display | Excluded |
| Raw evidence, complete logs, target ids, target provenance, full transcripts | English source records, Fitness 07, docs/schema.md | Source evidence or formal-system provenance | Excluded |

### Retention Classification

1. Must retain: today’s English practice, speaking goal, English focus, Learning Map summary, next reviewed Fitness plan, short Fitness progress, reminders, and publication time.
2. May retain but is not required: selected tags, one English progress note, 1–3 curated highlights, and an explicitly sourced training date.
3. Exists only because of the current architecture: authentication state, account identity, connection/sync/cache status, queue counts, diagnostics, build version, and service-worker state.
4. Not suitable for pure display: all formal writes, edit/delete controls, full raw records, history/provenance ids, formal sync, and safety decision workflows.
5. Low value in Phase 1: automated chronological record feeds, detailed card libraries, detailed tracker evidence, and full Learning Map evidence disclosure.

## Canonical Format

The future artifact is one UTF-8 JSON document. Its schema identifier is personal-dashboard-display/v1.

JSON is selected because Skills can parse and validate it deterministically, people can read it, and a future renderer can map it to any layout without platform semantics. This Markdown document is the human-readable specification only; no live JSON artifact or publisher is created in this task.

### Envelope Schema

| Field | Type | Required | Rule |
|---|---|---:|---|
| schema_version | string | Yes | Exactly personal-dashboard-display/v1. |
| publication_id | string | Yes | Opaque regeneration identifier; never a Supabase id or unique history record. |
| locale | string | Yes | BCP 47 value; initial value zh-TW. |
| timezone | string | Yes | IANA timezone; initial value Asia/Taipei. |
| dashboard_summary | object | Yes | Fixed block below. |
| english_today | object | Yes | Fixed block below. |
| speaking_goal | object | Yes | Fixed block below. |
| english_focus | object | Yes | Fixed block below. |
| learning_map_summary | object | Yes | Fixed block below. |
| fitness_next_plan | object | Yes | Fixed block below. |
| fitness_progress_summary | object | Yes | Fixed block below. |
| reminders | array | Yes | Zero to three items. |
| updated_at | object | Yes | Fixed block below. |
| provenance | object | Yes | Regeneration metadata only; it need not be displayed. |

Unknown top-level fields are invalid in v1. Future incompatible changes require a new schema version rather than silently changing a field’s meaning.

### Shared Rules

| Topic | Rule |
|---|---|
| Text | UTF-8 plain text, trimmed, no HTML, display instructions, credentials, tokens, or platform configuration. |
| Timestamp | ISO 8601 with offset or Z; must parse as a real time. |
| Date | YYYY-MM-DD; include only if a source record or explicit plan supplies it. Do not infer it from a normal training rhythm. |
| Absence | Unknown scalar is null; intentionally empty list is an empty array. Never use TBD, N/A, Loading, or invented values. |
| Priority | primary is phone first-screen; secondary is iPad/detail; supporting is shown only when room permits. |
| Replacement | Each accepted publication replaces the entire prior snapshot. It never merges stale content from prior snapshots. |
| Regeneration | Every populated field must be reproducible from source-project records plus the named Skill/process. |

## Fixed Block Specification

### dashboard_summary

| Property | Specification |
|---|---|
| Display purpose | A one-glance context for the most useful English/Fitness reading today. |
| User sees | Headline, short summary, optional 1–3 curated highlights. |
| Source | Completed English and Fitness/Nutrition outputs. |
| Producer | A future platform-neutral display-pack assembler after existing source Skills finish. This role is specified but not implemented here. |
| Required fields | headline, summary, display_priority. |
| Optional fields | recent_highlights array, source_status_note. |
| Types/order | Strings; highlights ordered newest first then importance. |
| Priority/limit | primary; headline <= 90 characters, summary <= 180, each highlight title <= 50/detail <= 120. |
| Fallback | Headline: 今日 Dashboard 尚待發布. Summary: 等待來源專案完成下一次整理. Empty highlights. |
| Update and surfaces | Full replacement; suitable for phone and iPad. |
| Data status | Regenerable; contains no unique data. |

Each recent_highlights item is an object with required title and detail strings.

### english_today

| Property | Specification |
|---|---|
| Display purpose | A short, immediately speakable English practice pack. |
| User sees | Topic, 3–5 complete model sentences, one reminder, optional practice prompt/hints. |
| Source | 01_language-learning current speaking plan, curated Review Pack, and latest reviewed evidence. |
| Producer | Existing English after-session workflow creates/reviews content; the future assembler selects approved display fields. |
| Required fields | topic, practice_sentences, reminder, display_priority. |
| Optional fields | optional_prompt, sentence_hints. |
| Types/order | Strings; practice_sentences is a 3–5 string array ordered by speaking sequence. Hints, if used, align by sentence index. |
| Priority/limit | primary; topic <= 90, each sentence <= 180, reminder <= 120, prompt <= 160. |
| Fallback | Topic: 今日英文練習尚待整理; empty sentence list; a pending reminder. Allowed only when the English source has no approved pack. |
| Update and surfaces | Full replacement; suitable for phone and iPad. |
| Data status | Regenerable; contains no unique data. |

### speaking_goal

| Property | Specification |
|---|---|
| Display purpose | State the single observable result that makes today’s practice useful. |
| User sees | Optional CEFR setting, one goal, and 1–3 success checks. |
| Source | 01_language-learning speaking plan and Jessica review judgment. |
| Producer | Existing English planning/review flow, then future assembler. |
| Required fields | goal, success_checks, display_priority. |
| Optional fields | cefr_setting, estimated_duration_minutes. |
| Types/order | String; 1–3 ordered checks; integer 1–30 minutes. |
| Priority/limit | primary; goal <= 180, each check <= 120. |
| Fallback | Goal: 先完成一個自然、完整的英文回答. One check: 說完後再決定是否需要延伸. |
| Update and surfaces | Full replacement; suitable for phone and iPad. |
| Data status | Regenerable; contains no unique data. |

### english_focus

| Property | Specification |
|---|---|
| Display purpose | Preserve the current learning judgment in a small actionable form. |
| User sees | Focus, optional progress note, 0–4 tags, optional next-session note. |
| Source | 01_language-learning current review cycle, Review Pack, and Learning Map judgment. |
| Producer | Existing English review flow, then future assembler. |
| Required fields | focus, display_priority. |
| Optional fields | progress_note, tags, next_session_note. |
| Types/order | Strings and tag array; tags follow teaching importance. |
| Priority/limit | primary; focus <= 180; optional notes <= 180; tags <= 30 each. |
| Fallback | Focus: 等待 English 專案的下一次 evidence review. |
| Update and surfaces | Full replacement; suitable for phone and iPad. |
| Data status | Regenerable; contains no unique data. |

### learning_map_summary

| Property | Specification |
|---|---|
| Display purpose | Show learning direction/readiness without exposing the full evidence model. |
| User sees | Stage, main module, capability, readiness, next module if supported, progress, optional repetition caution. |
| Source | 01_language-learning Student Learning Map and its current reviewed output. |
| Producer | English Learning Map review/publishing flow, then future assembler. |
| Required fields | status, current_stage, current_main_module, building_capability, exit_readiness, recent_progress_summary, display_priority. |
| Optional fields | next_main_module, repetition_caution. |
| Types/order | status enum ready/pending/unavailable; readiness enum building/near/met/exited/not_available; other fields strings or null. |
| Priority/limit | secondary on phone, primary on iPad detail; short fields <= 120, progress/caution <= 220. |
| Fallback | status pending, readable pending fields, readiness not_available, and no invented next module. |
| Update and surfaces | Full replacement; compact phone card and detailed iPad card. |
| Data status | Regenerable; contains no unique data. |

### fitness_next_plan

| Property | Specification |
|---|---|
| Display purpose | Provide the next safe source-reviewed Fitness action and complete exercise targets when training is appropriate. |
| User sees | Status, Plan/recovery action, optional explicitly scheduled date, summary, reason, caution, trigger, ordered exercise list. |
| Source | 02_Fitness_Nutrition, especially Fitness 07 flow, current review worksheet, records, and approved target output. |
| Producer | Existing fitness-review creates the decision; future assembler copies it without recalculation. |
| Required fields | status, plan_label, summary, reason, display_priority, exercises. |
| Optional fields | next_training_date, caution, next_review_trigger. |
| Types/order | status ready/conservative/recovery/awaiting_review; label Plan A/Plan B/Recovery/Awaiting review; exercise order follows source sort_order. |
| Priority/limit | primary; summary/reason/caution <= 220, trigger <= 160, instruction <= 180, maximum six exercises. |
| Fallback | Status awaiting_review, Plan label Awaiting review, empty exercises, source-owned explanation. |
| Update and surfaces | Full replacement; suitable for phone and iPad. A snapshot must never combine targets from different source judgments. |
| Data status | Regenerable; formal target ids/provenance are excluded. |

For status ready or conservative, every exercises item must include:

| Field | Type | Required | Rule |
|---|---|---:|---|
| exercise_key | string | Yes | Stable source-owned lower snake_case identity; not a database dependency. |
| name | string | Yes | Human-readable action. |
| weight_kg | number or null | Yes | Null only for bodyweight-only movement. |
| sets | positive integer array | Yes | One entry per set; never compressed text such as 3 x 15. |
| instruction | string | Yes | Current source-approved cue/caution. |
| sort_order | integer | Yes | Unique and ascending in the plan. |

For recovery or awaiting_review, exercises must be an empty array. A display platform must never invent substitute exercises.

### fitness_progress_summary

| Property | Specification |
|---|---|
| Display purpose | Give a short evidence-backed progress/recovery context without becoming a raw health log. |
| User sees | Headline, 1–3 compact items, optional next-review note. |
| Source | 02_Fitness_Nutrition approved review output and latest approved record summary. |
| Producer | fitness-review or an approved Fitness summary flow, then future assembler. |
| Required fields | headline, items, display_priority. |
| Optional fields | next_review_note. |
| Types/order | String; 1–3 objects with label/value; recovery/schedule first, then completion/progress, then bodyweight only when useful. |
| Priority/limit | secondary; headline <= 160, label <= 40, value <= 120, note <= 160. |
| Fallback | Headline: Fitness 近期摘要尚待整理; empty items; no guessed trend. |
| Update and surfaces | Full replacement; suitable for phone and iPad. |
| Data status | Regenerable; contains no unique data. |

### reminders

| Property | Specification |
|---|---|
| Display purpose | Surface only the few actions worth remembering now. |
| User sees | Zero to three concise reminders with priority and optional source/date. |
| Source | English and Fitness/Nutrition source judgments only. |
| Producer | Future assembler selects explicitly approved reminders. |
| Required item fields | priority, text. |
| Optional item fields | source, due_date. |
| Types/order | priority now/soon/info; source english/fitness; order now then soon then info, then explicit date. |
| Priority/limit | primary when a now item exists; otherwise secondary; maximum three, text <= 140. |
| Fallback | Empty array. |
| Update and surfaces | Full replacement; suitable for phone and iPad. |
| Data status | Regenerable; contains no unique data. |

### updated_at

| Property | Specification |
|---|---|
| Display purpose | Explain freshness without leaking sync internals. |
| User sees | Publication time and optional coverage note. |
| Source/producer | Future display publication process plus completed source-output times. |
| Required fields | published_at, english_source_updated_at, fitness_source_updated_at. |
| Optional fields | coverage_note. |
| Types/order | ISO timestamps, with source timestamps allowed to be null only for absent approved output. |
| Priority/limit | supporting; coverage_note <= 120. |
| Fallback | Publication time remains real; source times can be null with an explicit coverage note. |
| Update and surfaces | Full replacement; published_at must be newer than the prior accepted snapshot. Suitable for phone and iPad. |
| Data status | Regenerable; contains no unique data. |

### provenance

Provenance is validation metadata, not a required visible block.

| Field | Type | Required | Rule |
|---|---|---:|---|
| english | object | Yes | source_project, evidence_through, source_documents, generation_flow. |
| fitness | object | Yes | Same fields; evidence_through may be null only for a deliberate pending state. |
| assembler | string | Yes | Platform-neutral process name; initial value display-pack-assembler-pending-implementation. |
| regenerable | boolean | Yes | Must be true. |

Source documents are relative document references only. They must not contain raw content, credentials, tokenized URLs, platform ids, or Supabase table names.

## Representative JSON Example

The following values are illustrative and resemble the current workflow. They are not a write to live data and do not claim the current live personal state.

~~~json
{
  "schema_version": "personal-dashboard-display/v1",
  "publication_id": "2026-07-11-display-example",
  "locale": "zh-TW",
  "timezone": "Asia/Taipei",
  "dashboard_summary": {
    "headline": "今天先完成一個完整英文建議，再依恢復狀態安排下一次訓練。",
    "summary": "English 練習兩個理由與一個具體第一步；Fitness 下一次為已審查的 Plan A。",
    "recent_highlights": [
      {"title": "English", "detail": "近期故事表達與短 retell 有進步，接下來改用 Persuasion / Opinion 交叉訓練。"},
      {"title": "Fitness", "detail": "維持兩練一休與 Plan A/B 交替；只有實際完成才推進下一次 Plan。"}
    ],
    "display_priority": "primary"
  },
  "english_today": {
    "topic": "Recommend a healthy restart to a friend after a difficult week",
    "practice_sentences": [
      "I would suggest starting with one small habit that feels realistic.",
      "It can help because a simple routine is easier to keep after a difficult week.",
      "For example, you could take a short walk and prepare one healthy meal.",
      "If you feel tired, do less instead of giving up completely.",
      "What I mean is, progress can start with a very small first step."
    ],
    "sentence_hints": ["先給建議", "補上一個原因", "給具體做法", "低能量時的選擇", "用 recovery phrase 繼續"],
    "reminder": "先完整說完一個想法，再補充細節；卡住時用 What I mean is... 繼續。",
    "optional_prompt": "What healthy restart would you recommend, and why?",
    "display_priority": "primary"
  },
  "speaking_goal": {
    "cefr_setting": "B1 developing",
    "goal": "用 5–6 句提出一個健康重啟建議，包含兩個理由、一個具體第一步與一個 recovery phrase。",
    "success_checks": [
      "先獨立完成主要回答，再接受細節追問。",
      "至少使用一次 because 或 so 連接原因。",
      "卡住時用完整句子恢復並繼續。"
    ],
    "estimated_duration_minutes": 10,
    "display_priority": "primary"
  },
  "english_focus": {
    "focus": "Answer Development：把主意、理由、例子與下一步連成一個完整回答。",
    "progress_note": "近期能完成有意義的故事與 retell，但第一輪獨立回答仍容易變成數個短句。",
    "tags": ["because", "one small first step", "What I mean is"],
    "next_session_note": "以 Persuasion / Opinion 取代連續故事題，避免練習型態重複。",
    "display_priority": "primary"
  },
  "learning_map_summary": {
    "status": "ready",
    "current_stage": "B1 developing: building independent connected answers",
    "current_main_module": "Answer Development",
    "building_capability": "在少量提示下，獨立說出 3–5 句有連接的主回答。",
    "exit_readiness": "near",
    "next_main_module": null,
    "recent_progress_summary": "能建立清楚的故事弧與簡短 retell；下一步是提升第一輪回答長度、時態與自然句塊控制。",
    "repetition_caution": "chronological story practice 已有重複風險，暫以 recommendation 題型交叉訓練。",
    "display_priority": "secondary"
  },
  "fitness_next_plan": {
    "status": "ready",
    "plan_label": "Plan A",
    "next_training_date": null,
    "summary": "7/9 Plan A 與 7/11 Plan B 已完成兩練；先休息，休息後執行 Plan A。",
    "reason": "Plan A/B 依實際完整完成交替；休息日不消耗待執行 Plan。",
    "caution": "保留 2–3 下餘力；若出現刺痛、關節痛、持續痛、麻或放射痛，停止並回到來源專案審查。",
    "next_review_trigger": "完成此 Plan，或恢復、睡眠、疼痛狀態改變時。",
    "exercises": [
      {"exercise_key": "a_row", "name": "單臂啞鈴划船", "weight_kg": 6, "sets": [16,16,16,16], "instruction": "每側頂端停 1 秒並控制下放；不適加劇時停止。", "sort_order": 10},
      {"exercise_key": "a_lateral_raise", "name": "啞鈴側平舉", "weight_kg": 5, "sets": [15,15,15], "instruction": "維持不聳肩與慢下放，不增加次數。", "sort_order": 20},
      {"exercise_key": "a_floor_press", "name": "啞鈴地板臥推", "weight_kg": 5, "sets": [12,12,12], "instruction": "雙手各 5 kg；上臂輕觸地面、停 1 秒再推起。", "sort_order": 30},
      {"exercise_key": "a_curl", "name": "二頭彎舉", "weight_kg": 5, "sets": [16,16,16], "instruction": "避免借力；手臂不適加劇時停止。", "sort_order": 40},
      {"exercise_key": "a_twist", "name": "俄羅斯轉體", "weight_kg": 5, "sets": [30,30,30], "instruction": "維持軀幹控制，不以甩動完成。", "sort_order": 50}
    ],
    "display_priority": "primary"
  },
  "fitness_progress_summary": {
    "headline": "以實際完成紀錄推進 Plan A/B 與兩練一休，不以預定日期推進。",
    "items": [
      {"label": "目前節奏", "value": "下一次待執行 Plan A；額外休息只順延，不跳過 Plan。"},
      {"label": "本輪原則", "value": "先看恢復，再決定維持或小幅進步；同一 cycle 最多一個主動作進步。"}
    ],
    "next_review_note": "完成下一次 Plan 或恢復狀態改變後重新審查。",
    "display_priority": "secondary"
  },
  "reminders": [
    {"priority": "now", "text": "英文先完成 5–6 句建議，再接受追問。", "source": "english"},
    {"priority": "soon", "text": "訓練前確認恢復；不適時可休息，不消耗下一個 Plan。", "source": "fitness"}
  ],
  "updated_at": {
    "published_at": "2026-07-11T09:30:00+08:00",
    "english_source_updated_at": "2026-07-10T21:00:00+08:00",
    "fitness_source_updated_at": "2026-07-11T08:00:00+08:00",
    "coverage_note": "English 與 Fitness 均使用最近一次已完成的來源整理。"
  },
  "provenance": {
    "english": {
      "source_project": "01_language-learning",
      "evidence_through": "2026-07-10",
      "source_documents": ["language_learning/speaking_plan.md", "language_learning/feedback_review_dashboard.md", "language_learning/student_learning_map.md"],
      "generation_flow": "english-after-session review output"
    },
    "fitness": {
      "source_project": "02_Fitness_Nutrition",
      "evidence_through": "2026-07-11",
      "source_documents": ["健身飲食/01_每日紀錄.md", "健身飲食/02_訓練紀錄.md", "健身飲食/07_Jessica_Fitness審查與發布流程.md"],
      "generation_flow": "fitness-review output"
    },
    "assembler": "display-pack-assembler-pending-implementation",
    "regenerable": true
  }
}
~~~

## Responsibility Boundary

| Owner | Owns | Must not do |
|---|---|---|
| 01_language-learning | Full English history, Mika evidence, CEFR, speaking goal, sentence wording, focus, Learning Map readiness/module/risk, and evidence quality. | A renderer must not infer readiness, CEFR, next module, corrections, or sentence wording from activity. |
| 02_Fitness_Nutrition | Full daily/training history, A/B schedule, recovery/pain interpretation, progression decision, reviewed targets, and next-review trigger. | A renderer must not calculate training safety/progression, consume a Plan, or infer schedule from dates. |
| Existing Skills/source workflows | Analyze evidence, apply existing contracts, validate source judgment, create approved outputs. | They must not make a platform or frontend the only long-term output contract. This document does not modify current Skills. |
| Future display-pack assembler | Select contract fields after source judgment, validate JSON, stamp updated_at, preserve provenance references. | Must not perform analysis, alter targets, rewrite sentences, fabricate timestamps, or merge stale blocks. |
| Dashboard project | Own this document and, only if separately authorized, adapt a renderer/publisher to consume it. | Must not own full English/Fitness history or recreate analysis. |
| Display platform | Render fixed blocks responsively and replace its visible snapshot with a validated publication. | Must not store unique history, accept formal Phase 1 writes, derive judgment, or modify source-owned fields. |

Only source projects can generate:

- English CEFR, goal, success checks, sentence wording, focus/progress interpretation, Learning Map readiness/module/risk, and English reminders.
- Fitness status, plan label/date, summary/reason, targets/instructions, caution, next-review trigger, and Fitness reminders.

## Publication And Validation Rules

Before a future publisher provides a new snapshot to any renderer, it must:

1. Parse JSON and require schema_version personal-dashboard-display/v1.
2. Require every top-level block and reject unknown top-level keys.
3. Require non-blank required text and valid timestamps/dates.
4. Require updated_at.published_at to be later than the prior accepted publication; otherwise fail rather than reuse stale output.
5. Enforce each block’s text/list limit.
6. Require exactly 3–5 non-empty, non-duplicate complete English practice sentences. Reject fragments and placeholders.
7. Require 1–3 speaking success checks.
8. Validate Learning Map enums. If the map is not ready, do not retain an older map as current.
9. Validate Fitness:
   - ready/conservative has a complete ordered exercise list from one source-approved Plan;
   - each exercise has key, name, nullable numeric weight, positive per-set integers, instruction, and unique ascending order;
   - recovery/awaiting_review has no exercises;
   - target ids, Supabase ids, and browser-derived recommendations are absent.
10. Limit reminders to three and require their order and source-approved action.
11. Reject blank fields, Loading, TBD, demo-only content, stale sample dates, and generic placeholders outside explicit fallback states.
12. Reject raw full transcripts, complete daily/training logs, evidence dumps, credentials, tokens, private metaphysics, immigration records, medical diagnosis, and account details.
13. Require provenance.regenerable true, valid source projects/evidence dates, and enough listed source documents/flows to rebuild every populated block.
14. Keep only the latest accepted display snapshot on the presentation platform. The complete history remains local.

A validation failure leaves the prior accepted display snapshot untouched. The publisher reports the failing field; it never guesses a missing source judgment.

## Source-Contract Follow-Up (Not Changed Here)

No source-project rule is changed by this document.

| Source project | Existing condition | Future alignment recommendation |
|---|---|---|
| English | English AGENTS currently requires routine publication to Personal Dashboard Supabase tables. The Learning Map integration contract is table/cycle-specific. | Later add a platform-neutral export layer that can produce this contract in addition to formal Supabase publication while the PWA is active. Keep English evidence ownership unchanged. |
| Fitness/Nutrition | Fitness 07 currently publishes structured cycles/targets to Supabase and defines database-linked provenance. | Later define a display-only projection of the approved plan that excludes target ids/provenance but preserves source-owned recovery and schedule judgment. Keep the atomic current path unchanged until a separate retirement decision. |
| Dashboard | Current PWA derives Home metrics/recent updates from browser reads and has interactive writes. | A later display renderer should consume this artifact rather than recompute judgment; preserve current PWA behavior during validation. |

## Relationship To Other Documents

| Document | Relationship |
|---|---|
| project_brief.md | Project authority; links here without duplicating this schema. |
| task_board.md | Execution state; records Phase 1 completion and links here. |
| README.md | Orientation/current system; links here for display content. |
| docs/jessica-review-loop.md | Current Supabase loop remains binding; future pure display uses this contract after source judgment. |
| docs/schema.md | Current formal Supabase model only; not a platform-neutral display schema. |
| docs/continuation_prompt.md | Directs future agents here for display-content work. |

## Status

- Version: v1
- Defined: 2026-07-11
- Phase: Phase 1 specification completed
- Implementation status: no publisher, Skill change, display renderer, Sites build, Supabase change, deployment change, or formal workflow change has been made
