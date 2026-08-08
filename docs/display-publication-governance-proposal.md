# Display Publication Governance Proposal

## Status and authority

**Status: Proposal**

This document is a governance proposal only. It is **not authoritative** and does not override `dashboard-display-contract.md`. It does not change `project_brief.md`, source-project rules, Skills, the current GitHub Pages + Supabase workflow, or Sites.

- Publisher is **not implemented**.
- No formal publication workflow is adopted by this document.
- Track A / Sites validation must **not wait for adoption** of this proposal.
- The current formal Dashboard remains the rollback baseline.

The working acceptance input for this proposal is: **PASS WITH CONDITIONS — 修正指定問題後可進入 Sites 平台驗證**. That conclusion permits controlled validation after the listed conditions are satisfied; it does not approve a formal switch or a new publisher.

## 1. Problem definition

The 2026-07-12 English artifact is a validated English-only section bundle. It contains approved English display blocks and English reminders, but it intentionally omits Fitness and other required top-level blocks. The v1 contract, by contrast, defines a complete snapshot and requires full replacement for accepted publication.

Without an explicit boundary, two different operations could be confused:

1. assembling a complete, contract-valid snapshot for a future formal publisher; and
2. temporarily replacing English sections in an existing Site to test readability and update reliability.

The proposed governance therefore separates section bundles from complete snapshots, separates artifact-generation time from source-update and accepted-publication time, and makes partial updates permissible only in a controlled validation path until a formal publisher is separately authorized.

## 2. Terminology

| Term | Proposed meaning |
|---|---|
| Source output | An approved result from the English or Fitness/Nutrition source workflow. It contains source-owned judgment and evidence boundaries. |
| English section bundle | A partial artifact containing only approved English blocks and English-owned reminders. The 2026-07-12 JSON is this kind of artifact. |
| Complete snapshot | One self-contained document satisfying every required top-level field of `personal-dashboard-display/v1`. It is the only candidate for formal full replacement. |
| Publisher | A future platform-neutral process that merges approved source outputs, validates the complete snapshot, and hands it to a renderer. It does not exist yet. |
| Accepted publication | A complete snapshot that passed formal validation and was accepted as the current display state. A generated artifact or Site edit is not automatically an accepted publication. |
| Renderer | A display implementation that presents fixed blocks. It must not infer, recalculate, or rewrite source judgment. |
| Validation Build | A reproducible test artifact and test procedure used to check content, merge safety, rendering, readback, and rollback. It is not a formal publication. |
| Controlled Sites-only update | A temporary replacement of English sections in an existing Site for usability validation, with non-English content preserved and no formal-system change. |
| Artifact generation time | When a bundle or candidate snapshot was assembled. |
| Source update time | When the source project recorded the relevant approved output. It may be unknown and must never be invented from file metadata. |
| Accepted publication time | When a future formal publisher accepts a complete snapshot after validation. |

## 3. Responsibility boundaries

| Component | Owns | Must not do |
|---|---|---|
| English source project and workflow | English wording, speaking goal, focus, Learning Map judgment, English reminders, and evidence quality | Must not let a renderer or Site become the English history or source of judgment. |
| Fitness/Nutrition source project and workflow | Recovery judgment, Plan A/B or Recovery decision, target list, safety instructions, Fitness progress, and Fitness reminders | Must not be replaced by English-only content or recomputed by a display layer. |
| Section-bundle assembler | Selects already-approved fields into an English or Fitness bundle and records source references | Must not create new CEFR, training, readiness, progression, or reminder judgment. |
| Future Publisher | Merges approved bundles, validates all v1 rules, verifies ownership and timestamps, and produces a complete snapshot | Must not fill missing source judgment, silently drop fields, merge stale blocks, or publish partial content as a complete snapshot. Not implemented. |
| Complete snapshot | Carries the latest accepted display state as one replaceable, regenerable artifact | Must not become a history archive, database, or unique source of truth. |
| Renderer / Sites | Presents fixed blocks and supports controlled readback and rollback | Must not infer content, modify source-owned fields, collect formal data, or become the only copy of important information. |

## 4. Partial update rules

### 4.1 Canonical formal rule

The contract’s canonical formal unit remains the complete snapshot. A section bundle is not a standalone v1 publication and cannot replace a complete snapshot in the formal workflow.

For the proposed future flow:

`approved English output -> English section bundle -> future Publisher + current approved Fitness section -> complete snapshot -> Renderer`

the Publisher must:

1. verify that the English bundle is approved and traceable to its source map;
2. load the current approved Fitness section and the remaining required snapshot fields from an approved baseline or newly approved source outputs;
3. replace only English-owned fields and English reminders;
4. preserve Fitness fields, Fitness reminders, and non-English provenance unless a separately approved Fitness update is part of the same merge;
5. validate the resulting complete snapshot against the existing v1 contract; and
6. fail closed if any required block, source owner, timestamp, or provenance element is missing.

No publisher may silently use a stale block merely because it is convenient. If a current approved Fitness section cannot be identified, formal publication pauses.

### 4.2 Controlled Sites-only validation rule

For the temporary flow:

`temporary English section bundle -> controlled Sites-only update -> usability validation`

the update may replace only:

- `english_today`;
- `speaking_goal`;
- `english_focus`;
- `learning_map_summary`; and
- English-owned entries in `reminders`.

It must preserve the existing Home/English/Fitness routes, fixed English section order, UI components, layout, all Fitness blocks, Fitness reminders, Fitness source timestamp, and non-English provenance. It must not modify the Display Contract, API, Supabase, GitHub, Skills, or formal workflow.

This operation is validation-only. It must not be labelled as a complete v1 publication, must not imply Publisher adoption, and must not make Sites the source of truth. A before-state capture, after-state readback, and rollback path are required for each test update.

## 5. Reminders merge rules by source

1. Reminder ownership follows `source`: `english` entries come from the English source workflow; `fitness` entries come from the Fitness/Nutrition source workflow.
2. A future full merge replaces English reminders with the new approved English set and replaces Fitness reminders only when an approved Fitness update is included. It never deletes or rewrites Fitness reminders merely because the English bundle changed.
3. The Publisher must not author a new reminder, infer urgency, or promote a note from another block into a reminder.
4. After merge, the complete snapshot must contain at most three reminders and follow the v1 order: `now`, then `soon`, then `info`, with explicit dates considered only by the contract’s ordering rule.
5. If the merged result exceeds three reminders, the Publisher must fail rather than silently discard one. Any prioritization policy needs a separate project decision.
6. Within equal priority, the proposed deterministic tie-breaker is source-approved order, then stable source order. The exact cross-source tie-breaker remains undecided and should be confirmed by the project commander.
7. For a partial Sites update, only English-owned reminders may change. If the baseline reminder has no reliable source ownership, the update must pause or require an explicit mapping; it must not guess.

## 6. Timestamp semantics

Three times must be kept conceptually distinct:

| Timestamp | Meaning | Rule |
|---|---|---|
| `artifact_generated_at` | Time a bundle or candidate snapshot was assembled | Records artifact creation. It is not proof of source freshness or formal acceptance. |
| `english_source_updated_at` / `fitness_source_updated_at` | Time the relevant source output was updated | Use source-recorded time only. `null` is valid when exact time is unknown; never substitute a file modified time. |
| `accepted_published_at` | Time a future Publisher accepted a complete snapshot | Must be later than the prior accepted publication. A failed validation does not advance it. |

The current v1 contract exposes `updated_at.published_at` plus source timestamps, but does not separately name all three semantics. The 2026-07-12 source map explicitly treats the bundle’s `published_at` as validation-artifact generation time, not as an accepted full-dashboard publication. That ambiguity is a condition for any future formal publisher.

During controlled Sites-only validation, the English artifact time may be shown as validation metadata, but it must not be relabelled as `accepted_published_at`. The existing complete snapshot’s publication metadata and Fitness timestamp remain intact unless a separately approved complete publication occurs.

## 7. Validation Build rules

A Validation Build may be prepared without adopting this proposal or implementing a Publisher. It should contain:

- the exact English bundle and source map;
- a declared baseline snapshot or Site state;
- a field-level change list;
- validation results and source references;
- a before/after visual and content comparison; and
- a rollback/readback result.

Content validation must confirm the existing English-pack conditions: exactly five unique complete sentences, no added sentence, approved Learning Map values including `next_main_module: null`, no invented CEFR or next-module judgment, no raw transcript, and no Fitness replacement.

For Sites validation, the Build must additionally check the fixed route and section order, phone and iPad readability, no layout drift, repeat-update reliability, preservation of Fitness content, and recovery after an intentional or simulated failed update. It must verify that the update path is shorter and lower-maintenance than the current formal path without creating a Sites-only data dependency.

Validation Build success does not equal formal publication success. The prior conclusion remains **PASS WITH CONDITIONS** until these conditions are checked in the controlled Sites path.

Track A may continue independently. No Track A implementation, Site validation, or usability test should wait for a decision to adopt this governance proposal.

## 8. Formal publication rules

Formal publication is future work and is not active now. If separately authorized, the minimum rules should be:

1. accept only a complete v1 snapshot, not an English-only bundle;
2. validate schema, required fields, text limits, timestamps, source ownership, Fitness completeness, reminder limits, and provenance;
3. preserve the prior accepted snapshot when validation fails;
4. replace the visible snapshot atomically from the renderer’s perspective;
5. record a new accepted publication time only after validation and readback succeed;
6. keep source history and regeneration capability outside the presentation platform; and
7. provide a clear rollback to the previous accepted snapshot.

These rules do not alter the current GitHub Pages + Supabase formal system. Any future switch from that system to Sites remains a separate project decision under `project_brief.md`.

## 9. Risks and undecided issues

- The current `published_at` name can be mistaken for formal acceptance even when it is only artifact generation time.
- v1 makes reminder `source` optional, which can make safe partial merging impossible against an older baseline.
- There may be no independently verified current Fitness section available when an English bundle arrives.
- Manual Sites editing can cause layout drift, accidental non-English changes, or loss of rollback state.
- A complete snapshot assembled from mixed-age source outputs can appear current while one domain is stale.
- A three-reminder cap may require prioritization that only source owners or the commander should decide.
- `publication_id` is an opaque regeneration identifier, not a history archive or platform id; future tooling must preserve that boundary.
- A renderer may accidentally recalculate metrics or safety decisions unless its input/output behavior is tested.
- The Sites-only path could be misreported as a formal publication if timestamp labels and validation reports are not explicit.
- No Publisher exists, so all proposed formal behavior remains unimplemented and unproven.

## 10. Minimal future Display Contract revisions

No revision is requested by this proposal. If the commander later authorizes a contract update, keep it minimal:

1. distinguish artifact generation from accepted publication in `updated_at`, for example with `artifact_generated_at` and `accepted_published_at`;
2. define whether a bundle is an input artifact or a contract-valid snapshot, preferably through an explicit artifact kind in a new compatible contract revision;
3. make reminder ownership mandatory for any mergeable reminder, or add a source-owned reminder projection that removes ambiguity;
4. define a base snapshot reference and changed-block list for controlled partial updates without making partial updates formal publications; and
5. define deterministic same-priority reminder ordering and stale-baseline behavior.

Because v1 rejects unknown top-level fields and reserves schema changes, these revisions must be versioned and reviewed rather than silently inserted into v1. The proposal does not authorize any of them.

## 11. Explicit non-goals

This proposal does not:

- implement a Publisher, assembler, API, Skill, Sites automation, or renderer;
- modify `dashboard-display-contract.md`, the English pack, Fitness content, source-project files, or formal workflow;
- change Supabase, GitHub Pages, authentication, RLS, deployment, or the current PWA;
- create a complete snapshot from missing or invented Fitness data;
- make Sites a database, source of truth, or formal write surface;
- migrate, retire, or archive the current formal Dashboard;
- approve a long-term Sites switch;
- add raw English transcripts, full training logs, medical judgments, credentials, or other excluded content; or
- block Track A or require Track A/Sites validation to wait for proposal adoption.

## 12. Decisions required from the project commander

The following decisions remain with Vinson/project command:

1. Whether to adopt any part of this proposal as working governance.
2. Whether controlled Sites-only English validation may proceed using the 2026-07-12 bundle after its stated conditions are checked.
3. Whether the current `updated_at.published_at` meaning is acceptable for validation artifacts or requires a future contract revision before formal publication.
4. Whether the proposed same-priority reminder tie-breaker is acceptable.
5. What qualifies as the current approved Fitness baseline for a future complete merge.
6. Whether a future Publisher may create a complete snapshot from mixed-age but still approved English/Fitness outputs, and what freshness limit applies.
7. What formal readback, rollback, and acceptance evidence is required before a Sites publication can be considered a replacement candidate.
8. Whether formal publication, if later adopted, should target Sites, the current Dashboard, or both temporarily.
9. Whether any contract revision should be v1.x additive or a new incompatible schema version.
10. The separate Phase 3 switch decision: keep GitHub Pages formal, move the daily display to Sites, or stop the Sites replacement path.

## Appendix A — Exact 10 core governance questions and explicit answers

### 1. English-only bundle 是否需要使用完整 v1 schema_version？

不應把 English-only bundle 宣稱為完整 v1 snapshot。完整 `personal-dashboard-display/v1` 只能代表包含所有 required top-level blocks 且通過完整契約驗證的 snapshot。現有 English JSON 若保留 `schema_version: personal-dashboard-display/v1`，只能被視為對目標 Display Contract 的參照，不能被視為完整 v1 合規證明；正式 Publisher 必須拒絕把它直接當成完整 publication。

### 2. Section bundle 是否應有獨立 schema？

應有，但目前只是提案，尚未建立或採用。未來可定義獨立的 section-bundle schema，至少標示 bundle 類型、domain、bundle schema version、可更新的 blocks、source/provenance、artifact generation time，以及在需要時的 base snapshot reference。它不能沿用完整 snapshot 的語意來掩蓋缺少的 Fitness 或其他區塊；在獨立 schema 未獲批准前，不新增或修改現有 English pack。

### 3. Partial bundle 缺少 Fitness 是否應被視為錯誤？

要看使用情境：

- 對完整 v1 snapshot validation：是錯誤，必須 fail closed。
- 對 Flow A 的未來 merge：English bundle 本身可以沒有 Fitness，但只有在已辨識、已批准的 Fitness baseline 可被安全合併，並且合併後產生完整 v1 snapshot 時才可繼續；找不到 baseline 就必須停止。
- 對 Flow B 的 controlled Sites-only update：不是錯誤，前提是它明確被標記為 English-only validation bundle，且 Site 既有 Fitness、Fitness reminders、Fitness timestamp 和其他非 English 內容保持不變。這個例外不能被稱為完整 publication。

### 4. published_at、artifact generation time、accepted publication time 如何區分？

三者不可混用。artifact generation time 是 bundle 或 candidate snapshot 被產生的時間；source update time 是來源專案的實際更新時間；accepted publication time 則是未來 Publisher 在完整 snapshot 通過 validation、readback 與 acceptance 後才賦予的正式接受時間。現有 2026-07-12 source map 將 bundle 的 `updated_at.published_at` 視為 validation artifact generation time，不是 accepted publication time。未來若正式採用，應以明確欄位區分 `artifact_generated_at` 與 `accepted_published_at`；失敗的驗證不得推進 accepted publication time。

### 5. english_source_updated_at 在來源只有日期、沒有精確時間時如何表示？

不可把日期擅自轉成午夜時間，也不可使用檔案 modified time。以目前 v1 的時間欄位語意，Validation Build 應保留 `english_source_updated_at: null`，並在 `coverage_note` 與 `provenance.english.evidence_through` 記錄已知的來源日期，例如 `2026-07-11`。這是「精確來源時間未知」的保守表示，不是缺乏 English output 的意思；但目前 v1 對 null 的限制存在語意缺口，因此正式 Publisher 在契約修正前應要求精確 timestamp，或 fail closed，而不是自行補值。未來可另加 date-only 欄位與 precision 標記。

### 6. reminders 應如何按 source 合併？

English bundle 只替換 `source: english` 的 reminders；Fitness reminders 只有在同一次合併含有新的已批准 Fitness output 時才可替換。Publisher 不得自行創造、改寫 urgency、從其他 block 推導 reminder，或因 English 更新而刪除 Fitness reminder。完整 snapshot 合併後最多三項，依 v1 的 `now`、`soon`、`info` 規則排序；若超過三項且沒有已批准的裁切規則，必須報錯而非靜默丟棄。若舊 baseline 缺少可靠 source ownership，partial merge 必須暫停，不得猜測。

### 7. Publisher 如何避免把新 English 與舊 Fitness 錯誤混合？

Publisher 必須以明確的 baseline snapshot、source ownership、各 domain 的 approval 狀態與 source timestamps 建立 candidate；不得從零散舊欄位拼接一個看似完整的 Fitness section。Flow A 只有在 current approved Fitness section 可辨識、其 provenance 與 source judgment 完整、且不違反另行決定的 freshness policy 時才可 merge。合併後必須重新驗證完整 snapshot，確認 Fitness plan/exercises 來自同一個 approved judgment，並在驗證與 readback 成功後才進行整體替換；任何 baseline、來源、時間或 provenance 不一致都 fail closed。

### 8. Full snapshot 的替換語意如何保留？

正式 publication 是「整份 snapshot replace」，不是跨多次 publication 的逐欄 merge。Publisher 先產生完整 candidate；驗證成功後，Renderer 一次性切換到該 candidate，先前 accepted snapshot 不再提供未明確包含的 stale block。驗證失敗、readback 失敗或更新中斷時，舊 accepted snapshot 必須保持不變。Flow B 的 English-only Sites update 只是受控的 section-level validation 例外，必須保留 baseline、做 before/after readback 並可 rollback，不能改寫 full snapshot replace 的正式語意。

### 9. Validation Build 與正式 publication 如何區分？

Validation Build 是測試包與測試程序：可以使用 English-only bundle、受控 Sites-only update、視覺/內容 diff、readback 與 rollback，且不改變 formal accepted state。正式 publication 則必須使用完整 v1 snapshot，通過 schema、required fields、source ownership、Fitness completeness、reminder limit、timestamp、provenance、readback 與 rollback gates，並在 acceptance 後才記錄新的 accepted publication time。Validation Build 通過只代表可繼續 Sites usability validation，不代表 Publisher 已採用或 Sites 已成為正式展示層。

### 10. 什麼條件下才允許把 Sites 發布步驟包進正式 Skill？

目前不允許；Publisher、formal publication 與 Sites formal Skill 都尚未實作。只有在以下條件全部成立，並取得 project commander 對正式 Skill 的明確授權後，才可考慮包裝：

1. Phase 2 Sites validation 證明同一 Site 可重複、精準更新固定 blocks，且沒有 layout drift；
2. 完整 snapshot 可由來源專案重新產生，Sites 不保存唯一重要資料，也不繞過 English/Fitness judgment；
3. 手機與 iPad 可讀性、更新路徑長度、維護成本與 rollback/readback 均達到 `project_brief.md` 的 success conditions，且未觸發 stop conditions；
4. Skill 的輸入、完整 snapshot validation、timestamp 語意、錯誤 fail-closed、readback、rollback 與權限邊界已書面固定；以及
5. Vinson 已作出 Phase 3 的獨立 switch decision，決定是否讓 Sites 成為 daily display entry，並保留目前 GitHub Pages + Supabase formal baseline 直到切換完成。

即使獲准，正式 Skill 也只能包裝已批准的出版步驟，不得讓 Sites 變成 source of truth、直接讀取未批准的 local records、修改來源判斷，或在 validation 失敗時自行猜測發布。Track A 與受控 Sites usability validation 不必等待這項正式 Skill 授權。
