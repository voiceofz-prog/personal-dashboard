# Sites English 更新指令 — 2026-07-12

## Scope

只更新既有 Sites 的 English 內容區塊。不要修改 UI、路由、元件、CSS、Display Contract、Fitness、Supabase、GitHub、API 或正式流程。

## Update command

請使用 [english-display-pack-2026-07-12.json](english-display-pack-2026-07-12.json) 作為 English-only block update source。

只替換以下既有區塊：

- `english_today`
- `speaking_goal`
- `english_focus`
- `learning_map_summary`
- English source reminders in `reminders`

保留不變：

- Home／English／Fitness 路由
- English 頁面的六段順序：Learning Map → Today’s Practice → Speaking Goal → Today’s Sentences → Practice Prompt → Review
- 所有 UI 元件、卡片、字體、色彩、間距與底部導覽
- `fitness_next_plan`
- `fitness_progress_summary`
- Fitness reminders
- 現有 Fitness `updated_at.fitness_source_updated_at`
- `provenance` 中任何非 English 的既有內容

## Content rules

- 不改寫五句 English practice sentences。
- 不增加第六句。
- 不自行補 CEFR、時間、下一主模組或新的學習判斷。
- `next_main_module` 保持 `null`，因來源明確表示證據不足以責任地指定下一主模組。
- Learning Map 只呈現 current stage、current module、skill being built、next step；其餘欄位維持既有 Review 展示規則。
- Practice Prompt 保持獨立的「現在開始說」節點。
- 本 JSON 是 English-only update bundle，不是可獨立取代整份 Dashboard v1 snapshot 的完整出版包；正式合併時必須保留既有 Fitness 區塊與 Fitness timestamp。

## Validation before any future Sites update

1. Confirm the five sentences are unchanged and unique.
2. Confirm all five sentences come from the 2026-07-12 approved warm-up model set in `speaking_plan.md`.
3. Confirm Learning Map remains `B1 developing` / `Answer Development` / `near` / `next_main_module: null`.
4. Confirm no Fitness field is replaced by this English bundle.
5. Confirm `published_at` is newer than the previous accepted snapshot.
6. If an exact English source publication timestamp is available later, replace the current `english_source_updated_at: null`; do not invent a time from a file modified timestamp.
