(function (root) {
  const R = root.FitnessRecords;
  const $ = (id) => document.getElementById(id);
  const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const A = () => root.DashboardFitnessAdapter;
  let editor = null, busy = false, lastOwner = null;
  const dailyLabels = { entry_date: "日期", bodyweight_kg: "空腹體重（公斤）", sleep_hours: "睡眠時數", energy_score: "精神（1–5）", recovery_score: "恢復（1–5）", soreness_level: "痠痛程度", soreness_areas: "痠痛部位（以逗號分隔）", protein: "實際補給", carbs_food: "其他主食／補給", notes: "恢復備註" };
  const input = (name, label, value = "", type = "text", readonly = false) => `<label>${escape(label)}<input name="${escape(name)}" type="${type}" ${type === "number" ? 'step="any" min="0"' : ""} value="${escape(value)}" ${readonly ? "readonly" : ""}></label>`;
  const select = (name, label, items, value = "") => `<label>${escape(label)}<select name="${name}">${items.map(([key, text]) => `<option value="${key}" ${key === value ? "selected" : ""}>${text}</option>`).join("")}</select></label>`;
  function activityFields(type, row = {}) {
    const metrics = row.metrics || {};
    return R.forms[type].fields.map((field) => {
      if (field === "exercises") return `<div data-activity-exercises>${(row.exercises || []).map(strengthRow).join("")}</div><button type="button" class="secondary-action" data-add-strength>新增動作</button>`;
      if (field === "environment") return select(field, R.labels[field], [["", "未提供"], ["indoor", "室內"], ["outdoor", "戶外"]], metrics[field] || "");
      return input(field, R.labels[field], metrics[field] ?? "", field === "stroke" ? "text" : "number");
    }).join("");
  }
  function strengthRow(row = {}) {
    return `<fieldset class="activity-strength-row"><legend>重訓動作</legend>${input("strength_name", "動作名稱", row.name)}${input("strength_weight", "重量公斤（選填）", row.weight_kg ?? "", "number")}${input("strength_reps", "各組次數，例如 10/10/8", (row.reps_by_set || []).join("/"))}<button type="button" class="secondary-action" data-remove-strength>移除此動作</button></fieldset>`;
  }
  function readActivity(form, id) {
    const metrics = {};
    for (const field of [...R.forms[form.elements.activity_type.value].fields, "intensity"]) if (form.elements[field]) metrics[field] = form.elements[field].value;
    return R.activity({ id, activity_date: form.elements.activity_date.value, activity_type: form.elements.activity_type.value, name: form.elements.name.value, metrics,
      exercises: Array.from(form.querySelectorAll(".activity-strength-row")).map((row) => ({ name: row.querySelector('[name="strength_name"]').value, weight_kg: row.querySelector('[name="strength_weight"]').value, reps_by_set: row.querySelector('[name="strength_reps"]').value })),
      feeling: form.elements.feeling.value, notes: form.elements.notes.value });
  }
  function bind() {
    root.FitnessRecordBrowserUI?.bind();
    root.FitnessRecordDialog?.bind();
    $("fitnessManagementGroup").addEventListener("change",(event)=>{
      const choice=event.target.selectedOptions?.[0];
      if (choice) managementActions(choice.dataset.kind,choice.value);
    });
    $("fitnessManagementMenu").addEventListener("click", async (event) => {
      const button=event.target.closest("[data-record-action]");
      if (!button) return;
      const owner=A().getState().session?.user?.id;
      const operation=openEditor(button.dataset.kind,button.dataset.id,button.dataset.recordAction);
      const token=root.FitnessRecordDialog.token();
      try { await operation; } catch(error) {
        if (owner!==A().getState().session?.user?.id || token!==root.FitnessRecordDialog.token()) return;
        A().toast(error.message);$("fitnessManagementMenu").hidden=false;$("fitnessManagementGroup").hidden=!$("fitnessManagementGroup").innerHTML;
      }
    });
    const form = $("fitnessActivityForm");
    form.elements.activity_date.value = A().today();
    $("activityFields").innerHTML = activityFields("walk_run");
    form.addEventListener("change", (event) => {
      if (event.target.name === "activity_type") $("activityFields").innerHTML = activityFields(event.target.value);
    });
    form.addEventListener("click", strengthControls);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (busy || !form.reportValidity()) return;
      try {
        const id = crypto.randomUUID();
        const snapshot = readActivity(form, id);
        const result = await save({ changes: [{ kind: "activity", id, operation: "create", expected_version: 0, snapshot }] });
        if (["saved","pending"].includes(result)) { form.reset(); form.elements.activity_date.value = A().today(); $("activityFields").innerHTML = activityFields("walk_run"); }
      } catch (error) { A().toast(error.message); }
    });
    $("fitnessRecordList").addEventListener("click", async (event) => {
      const button = event.target.closest("[data-record-action]");
      if (!button) return;
      try { openManage(button); } catch (error) { A().toast(error.message); }
    });
    $("fitnessRevisionForm").addEventListener("click", strengthControls);
    $("fitnessRevisionForm").addEventListener("change", (event) => {
      if (event.target.name === "activity_type") $("revisionActivityFields").innerHTML = activityFields(event.target.value);
    });
    $("cancelFitnessRevision").addEventListener("click", () => root.FitnessRecordDialog.close());
    $("fitnessRevisionForm").addEventListener("submit", submitRevision);
    $("compareFitnessConflict").addEventListener("click", compareConflict);
    $("acceptFitnessConflict").addEventListener("click", () => {
      if (!editor?.latest) return;
      editor.base = editor.latest;
      editor.latest = null;
      $("fitnessConflict").hidden = true;
      A().toast("已採用最新版本作為基準；草稿仍保留，請檢查後再次保存");
    });
  }
  function strengthControls(event) {
    if (event.target.closest("[data-add-strength]")) {
      const target = event.target.closest("form").querySelector("[data-activity-exercises]");
      target.insertAdjacentHTML("beforeend", strengthRow());
    }
    const remove = event.target.closest("[data-remove-strength]");
    if (remove) remove.closest("fieldset").remove();
  }
  function summary(row, kind) {
    if (kind === "daily") return (row.training_status === "trained" ? "訓練日 · " : row.training_status === "rest" ? "恢復日 · " : "") + Object.keys(dailyLabels).filter((k) => !["entry_date"].includes(k)).map((k) => row[k] === null || row[k] === "" || row[k] === undefined ? null : `${dailyLabels[k]}：${Array.isArray(row[k]) ? row[k].join("、") : row[k]}`).filter(Boolean).join(" · ");
    if (kind === "workout") return `${row.exercise}：${row.weight_kg ?? "未提供"} kg，${(row.reps_by_set || []).join("/")}，${row.completed ? "完成" : "未完成"}`;
    return [row.name, ...Object.entries(row.metrics || {}).filter(([, v]) => v !== null && v !== "").map(([k, v]) => `${R.labels[k] || k}：${v === "indoor" ? "室內" : v === "outdoor" ? "戶外" : v}`), ...(row.exercises || []).map((r) => `${r.name} ${r.weight_kg ?? "未提供"} kg ${(r.reps_by_set || []).join("/")}`), row.feeling, row.notes].filter(Boolean).join(" · ");
  }
  function render(fitness) {
    const owner = A().getState().session?.user?.id || null;
    if (lastOwner !== owner) {
      root.FitnessRecordDialog?.close(true);
      editor = null; lastOwner = owner;
      $("fitnessRevisionEditor").hidden = true; $("fitnessVersionPanel").hidden = true;
      $("fitnessRevisionFields").innerHTML = ""; $("fitnessVersionList").innerHTML = "";
      $("fitnessActivityForm").reset(); $("fitnessActivityForm").elements.activity_date.value = A().today();
      $("activityFields").innerHTML = activityFields("walk_run");
    }
    const ready = Boolean(A().getState().session?.demo || fitness.recordsV2Ready);
    const readOnly = Boolean(A().getState().config?.fitnessRecordsV2ReadOnly);
    $("fitnessV2Status").textContent = ready ? "可記錄與更正" : "活動保存功能待資料庫升級";
    $("saveFitnessActivity").disabled = !ready || busy || readOnly;
    $("saveFitnessEntry").disabled = readOnly;
    const stats = R.stats(fitness, weekStart(), A().today());
    $("fitnessActivityStats").textContent = `本週運動 ${stats.exerciseDays} 天 · 其他活動 ${stats.activityCount} 次 · Plan 完成進度請見下方`;
    const needsReview = R.needsReview(fitness);
    $("fitnessReReview").hidden = !needsReview;
    $("fitnessReReview").textContent = "紀錄資料已更新，Jessica 回顧待重新審查。既有評估保留當時使用的版本。";
    root.FitnessRecordBrowserUI?.render();
  }
  function openManage(button) {
    const {kind,id}=button.dataset;
    if (kind==='group') {
      const choices=root.FitnessRecordBrowserUI.groupRecords(id);
      if (!choices.length) throw new Error("這天沒有這類紀錄");
      root.FitnessRecordDialog.open(button);
      $("fitnessManagementTitle").textContent=id==='activity'?'管理其他運動／活動':'管理 Quick Log';
      $("fitnessManagementGroup").innerHTML=choices.length>1 ? `<label>選擇要微調的紀錄<select>${choices.map((r)=>`<option value="${escape(r.row.id)}" data-kind="${r.kind}">${escape(r.kind==='daily'?'每日狀態與 Plan 動作':r.kind==='workout'?r.row.exercise:r.row.name)}${r.row.withdrawn?'（已撤回）':''}</option>`).join('')}</select></label>` : '';
      $("fitnessManagementGroup").hidden=choices.length<=1;
      managementActions(choices[0].kind,choices[0].row.id);return;
    }
    const row=root.FitnessRecordBrowserUI.records().find((r)=>r.kind===kind && r.row.id===id)?.row;
    if (!row) throw new Error("找不到紀錄");
    root.FitnessRecordDialog.open(button);
    $("fitnessManagementTitle").textContent='管理紀錄';
    $("fitnessManagementGroup").innerHTML='';$("fitnessManagementGroup").hidden=true;
    managementActions(kind,id);
  }
  function managementActions(kind,id) {
    const row=root.FitnessRecordBrowserUI.records().find((r)=>r.kind===kind && r.row.id===id)?.row;
    if (!row) throw new Error("找不到紀錄");
    $("fitnessManagementMenu").hidden=false;
    const state=A().getState(), ready=state.session?.demo || A().getFitness().recordsV2Ready;
    const pending=state.pending.find((p)=>p.owner_user_id===state.session?.user?.id && p.payload.changes?.some((c)=>c.kind===kind && c.id===id));
    const disabled=!ready || state.config?.fitnessRecordsV2ReadOnly || pending && !pending.conflict;
    const actions=[["history","查看版本"],[pending?.conflict?"resolve":row.withdrawn?"restore":"revise",pending?.conflict?"處理版本衝突":row.withdrawn?"恢復":"編輯"],...(pending?.conflict && row.withdrawn?[["restore","先恢復紀錄"]]:[]),...(!row.withdrawn?[["withdraw","撤回"]]:[])];
    $("fitnessManagementMenu").innerHTML=actions.map(([action,label])=>`<button type="button" class="secondary-action" data-record-action="${action}" data-kind="${kind}" data-id="${escape(id)}" ${action!=="history" && (disabled || pending?.conflict && action==="withdraw") ? "disabled":""}>${label}</button>`).join("");
  }

  function weekStart() {
    const d = new Date(`${A().today()}T12:00:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function recordDate(row) { return row.activity_date || row.entry_date || row.workout_date || ""; }
  function dailyValue(field,row) {
    if (field === "protein") return String(row.training_content || "").match(/^今日補給\s+(.+)$/m)?.[1] || row.protein || "";
    return Array.isArray(row[field]) ? row[field].join(",") : row[field] ?? "";
  }
  async function head(kind, id) {
    const fitness = A().getFitness();
    const local = (root.FitnessRecordBrowserUI?.records() || R.records(fitness)).find((r) => r.kind === kind && r.row.id === id)?.row;
    if (!local) throw new Error("找不到這筆紀錄");
    if (A().cloud() && fitness.recordsV2Ready) {
      const rows = await A().select("fitness_record_heads", `select=*&record_kind=eq.${kind}&record_id=eq.${encodeURIComponent(id)}`);
      if (rows.length !== 1) throw new Error("找不到可編輯的版本");
      return rows[0];
    }
    const snapshot = A().clone(local);
    for (const key of ["revision", "withdrawn", "_pending", "_pending_request"]) delete snapshot[key];
    return { record_kind: kind, record_id: id, revision: local.revision || 1, snapshot, withdrawn: Boolean(local.withdrawn) };
  }
  async function openEditor(kind, id, operation) {
    const owner = A().getState().session?.user?.id;
    const token = root.FitnessRecordDialog?.begin();
    const valid = () => owner === A().getState().session?.user?.id && token === root.FitnessRecordDialog?.token();
    $("fitnessManagementMenu").hidden=true;
    $("fitnessManagementGroup").hidden=true;
    const base = await head(kind, id);
    if (!valid()) throw new Error("帳號已變更，請重新開啟紀錄");
    if (operation !== "history" && (!A().getState().session?.demo && !A().getFitness().recordsV2Ready || A().getState().config?.fitnessRecordsV2ReadOnly)) throw new Error("目前只提供唯讀查閱");
    let obsoleteRequest = null, draftChange = null;
    if (operation === "resolve") {
      const state = A().getState();
      const pending = state.pending.find((p) => p.owner_user_id === state.session.user.id && p.conflict && p.payload.changes?.some((c) => c.id === id && c.kind === kind));
      if (!pending) throw new Error("找不到待處理草稿");
      draftChange = pending.payload.changes.find((c) => c.id === id && c.kind === kind);
      obsoleteRequest = pending.row_id; operation = draftChange.operation;
      if ((base.withdrawn && operation === "withdraw") || (!base.withdrawn && operation === "restore")) {
        if (!window.confirm("最新紀錄已符合這次草稿的撤回／恢復狀態。確認將已遭版本衝突拒絕的這個待處理請求清除？既有紀錄與版本會保留。")) return;
        state.pending = state.pending.filter((p) => !(p.owner_user_id === owner && p.row_id === obsoleteRequest));
        A().saveQueue(); A().render(); A().toast("已確認最新狀態，歷史版本保留"); return;
      }
      if (base.withdrawn && operation === "revise") throw new Error("最新紀錄已撤回；請先決定是否恢復，再處理這次草稿");
    }
    $("fitnessManagementMenu").hidden=true;
    if (operation === "history") {
      let versions = (A().getFitness()._versions || []).filter((v) => v.record_kind === kind && v.record_id === id);
      if (A().cloud() && A().getFitness().recordsV2Ready) versions = await A().selectAll("fitness_record_revisions", `select=*&record_kind=eq.${kind}&record_id=eq.${encodeURIComponent(id)}&order=revision.desc`);
      if (!valid()) throw new Error("帳號已變更，請重新開啟紀錄");
      if (!versions.length) versions = [{ revision: base.revision, snapshot: base.snapshot, changed_at: base.snapshot.updated_at, reason: "原始紀錄", withdrawn: base.withdrawn }];
      $("fitnessVersionList").innerHTML = versions.sort((a,b) => b.revision-a.revision).map((v) => `<article class="list-card"><h3>第 ${v.revision} 版${v.withdrawn ? " · 已撤回" : ""}</h3><p>${escape(summary(v.snapshot, kind))}</p><p class="muted">${escape(v.reason)} · ${escape(v.changed_at || "")}</p></article>`).join("");
      $("fitnessRevisionEditor").hidden = true; $("fitnessVersionPanel").hidden = false; return;
    }
    editor = { kind, id, operation, base, workouts: [], obsoleteRequest };
    const row = draftChange?.snapshot || base.snapshot;
    let markup = "";
    if (operation === "revise" && kind === "activity") {
      markup = input("activity_date", "日期", row.activity_date, "date") + select("activity_type", "活動類型", Object.entries(R.forms).map(([k,v]) => [k,v.label]), row.activity_type) + input("name", "活動名稱", row.name) + `<div id="revisionActivityFields">${activityFields(row.activity_type,row)}</div>` + input("intensity", R.labels.intensity, row.metrics?.intensity ?? "", "number") + input("feeling", "活動後感受", row.feeling) + input("notes", "備註", row.notes);
    } else if (operation === "revise" && kind === "daily") {
      const linked = (root.FitnessRecordBrowserUI?.records() || R.records(A().getFitness())).filter((r) => r.kind === "workout" && r.row.daily_entry_id === id && !r.row.withdrawn);
      editor.workouts = await Promise.all(linked.map((r) => head("workout",r.row.id)));
      if (!valid()) throw new Error("帳號已變更，請重新開啟紀錄");
      editor.latestWorkoutComparison = editor.workouts.map((h) => summary(h.snapshot,"workout")).join("；");
      if (obsoleteRequest) {
        const pending = A().getState().pending.find((p) => p.row_id === obsoleteRequest);
        editor.workouts = editor.workouts.map((h) => ({...h, snapshot: pending.payload.changes.find((c) => c.kind === "workout" && c.id === h.record_id)?.snapshot || h.snapshot}));
      }
      markup = Object.entries(dailyLabels).map(([field,label]) => {
        if (field === "soreness_level") return select(field,label,[["none","無"],["mild","輕微"],["moderate","中度"],["severe","嚴重"]],row[field]);
        return input(field,label,dailyValue(field,row), field === "entry_date" ? "date" : ["bodyweight_kg","sleep_hours","energy_score","recovery_score"].includes(field) ? "number" : "text", field === "entry_date" && linked.length>0);
      }).join("") + editor.workouts.map((h,i) => workoutFields(h.snapshot,i)).join("");
      if (linked.length) markup += '<p class="muted">Plan 日期與動作身份保留原關聯；填錯身份時請撤回後另建正確紀錄。</p>';
    } else if (operation === "revise" && kind === "workout") markup = workoutFields(row,0);
    else markup = `<p>${escape(summary(row,kind))}</p><p>此操作保留歷史版本；${operation === "withdraw" ? "紀錄退出目前統計與回顧" : "紀錄重新納入目前統計與回顧"}。</p>`;
    $("fitnessRevisionFields").innerHTML = markup;
    if (obsoleteRequest) $("fitnessRevisionFields").insertAdjacentHTML("afterbegin", `<p class="muted">最新第 ${base.revision} 版：${escape(summary(base.snapshot,kind))} ${escape(editor.latestWorkoutComparison || "")}。下方保留原草稿，保存即確認以最新版本為基準建立更正。</p>`);
    $("fitnessRevisionTitle").textContent = operation === "revise" ? "更正 Fitness 紀錄" : operation === "withdraw" ? "撤回紀錄" : "恢復紀錄";
    $("fitnessRevisionForm").elements.reason.value = draftChange?.reason || "";
    $("fitnessConflict").hidden = true;
    $("acceptFitnessConflict").hidden = true;
    $("fitnessVersionPanel").hidden = true;
    $("fitnessRevisionEditor").hidden = false;
    root.FitnessRecordDialog?.markClean();
  }
  function workoutFields(row,i) {
    return `<fieldset><legend>${escape(row.plan_type)} · ${escape(row.exercise)}</legend>${input(`w${i}_weight`,"重量公斤（選填）",row.weight_kg ?? "","number")}${input(`w${i}_reps`,"各組次數",(row.reps_by_set || []).join("/"))}${input(`w${i}_rpe`,"原紀錄 RPE（選填）",row.rpe || "")}<label><input name="w${i}_completed" type="checkbox" ${row.completed ? "checked" : ""}>已完成</label></fieldset>`;
  }
  function readWorkout(form,h,i) {
    const snap = A().clone(h.snapshot);
    const weightText = form.elements[`w${i}_weight`].value;
    if (weightText !== String(snap.weight_kg ?? "")) {
      snap.weight_kg = R.numeric(weightText,"weight_kg");
      snap.weight = snap.weight_kg === null ? "" : `${snap.weight_kg} kg`;
    }
    const text = form.elements[`w${i}_reps`].value.trim();
    if (!/^\d+(\s*[／/,]\s*\d+)*$/.test(text)) throw new Error("各組次數格式不正確");
    const reps = text.split(/[／/,]/).map(Number);
    if (reps.some((n) => !Number.isInteger(n) || n<1)) throw new Error("各組次數須為正整數");
    if (text !== (snap.reps_by_set || []).join("/")) {snap.reps_by_set=reps;snap.reps=reps.join("/");snap.sets=String(reps.length);}
    const rpe = form.elements[`w${i}_rpe`].value.trim();
    if (rpe !== String(snap.rpe || "")) snap.rpe = rpe;
    snap.completed = form.elements[`w${i}_completed`].checked;
    return snap;
  }
  async function submitRevision(event) {
    event.preventDefault(); if (!editor || busy || !event.target.reportValidity()) return;
    const form = event.target, e = editor, token=root.FitnessRecordDialog?.token();
    try {
      const reason = form.elements.reason.value.trim(); if (!reason) throw new Error("請填寫修改原因");
      let snapshot = A().clone(e.base.snapshot);
      if (e.operation === "revise") {
        if (e.kind === "activity") snapshot = { ...snapshot, ...readActivity(form,e.id) };
        if (e.kind === "workout") snapshot = readWorkout(form,e.base,0);
        if (e.kind === "daily") {
          for (const field of Object.keys(dailyLabels)) {
            const val = form.elements[field].value;
            if (val === String(dailyValue(field,e.base.snapshot))) continue;
            snapshot[field] = ["bodyweight_kg","sleep_hours","energy_score","recovery_score"].includes(field) ? R.numeric(val,field) : field === "soreness_areas" ? val.split(/[,、]/).map((s) => s.trim()).filter(Boolean) : val;
          }
          R.date(snapshot.entry_date);
          if (snapshot.soreness_level === "none") snapshot.soreness_areas = [];
          if (form.elements.protein.value !== String(dailyValue("protein",e.base.snapshot))) {
            const supplements = String(snapshot.protein || "");
            if (/^今日補給.*$/m.test(snapshot.training_content || "")) snapshot.training_content = snapshot.training_content.replace(/^今日補給.*$/m, supplements ? `今日補給 ${supplements}` : "");
            else if (supplements) snapshot.training_content = `${snapshot.training_content || ""}\n今日補給 ${supplements}`.trim();
          }
        }
      }
      const changes = [{kind:e.kind,id:e.id,operation:e.operation,expected_version:e.base.revision,snapshot,reason}];
      if (e.operation === "revise") e.workouts.forEach((h,i) => changes.push({kind:"workout",id:h.record_id,operation:"revise",expected_version:h.revision,snapshot:readWorkout(form,h,i),reason}));
      const result = await save({changes}, e.obsoleteRequest);
      if (editor!==e || token!==root.FitnessRecordDialog?.token()) return;
      if (result === "rejected") { $("fitnessConflict").hidden = false; return; }
      if (result === "session_changed") return;
      root.FitnessRecordDialog?.markClean();
      root.FitnessRecordDialog?.close(); editor = null;
    } catch (error) { A().toast(error.message); }
  }
  async function compareConflict() {
    if (!editor || !A().cloud()) { A().toast("連線後才能讀取最新版本"); return; }
    const current=editor, owner=A().getState().session?.user?.id, token=root.FitnessRecordDialog?.token();
    try {
      const latest=await head(current.kind,current.id);
      if (editor!==current || owner!==A().getState().session?.user?.id || token!==root.FitnessRecordDialog?.token()) return;
      editor.latest=latest;
      const latestWorkouts = await Promise.all(editor.workouts.map((h) => head("workout",h.record_id)));
      if (editor!==current || owner!==A().getState().session?.user?.id || token!==root.FitnessRecordDialog?.token()) return;
      editor.workouts = latestWorkouts;
      $("fitnessConflictComparison").textContent = `最新第 ${editor.latest.revision} 版：${summary(editor.latest.snapshot,editor.kind)} ${latestWorkouts.map((h) => summary(h.snapshot,"workout")).join("；")}。請與保留的草稿比較，確認後才保存。`;
      $("acceptFitnessConflict").hidden = false;
    } catch (error) { A().toast(error.message); }
  }
  async function save(draft, obsoleteRequest = null) {
    if (busy) return "rejected";
    const affectedDate = draft.bundle?.daily?.entry_date || recordDate(draft.changes?.[0]?.snapshot || {});
    const state = A().getState();
    if (state.config?.fitnessRecordsV2ReadOnly) { A().toast("目前為唯讀模式，草稿未保存"); return "rejected"; }
    if (!state.session || (!state.session.demo && !A().getFitness().recordsV2Ready)) throw new Error("活動與更正功能尚待資料庫升級");
    const request = {request_id:crypto.randomUUID(),created_at:new Date().toISOString(),...draft};
    const item = {id:request.request_id,table:"fitness_records_v2",operation:"rpc",intent:"fitness-records/v2",row_id:request.request_id,payload:request,owner_user_id:state.session.user.id,queued_at:request.created_at};
    busy = true;
    $("saveFitnessActivity").disabled = true; $("saveFitnessRevision").disabled = true;
    try {
      let receipt = null;
      if (!state.session.demo && !A().cloud()) {
        if (obsoleteRequest) throw new Error("版本衝突需要連線確認後保存");
        A().enqueue(item); A().toast("已保留於此裝置，待連線同步"); root.FitnessRecordBrowserUI?.changed(affectedDate); A().render(); return "pending";
      }
      if (!state.session.demo) {
        await A().refreshToken();
        if (state.session?.user?.id !== item.owner_user_id) return "session_changed";
        try { receipt = await A().send(item); }
        catch (error) {
          if (state.session?.user?.id !== item.owner_user_id) return "session_changed";
          if (error.status && error.status < 500) { A().toast(`未保存：${error.message}`); return "rejected"; }
          A().enqueue({...item,last_error:error.message,last_attempt_at:new Date().toISOString()});
          A().toast("保存結果尚待確認，請連線後同步；草稿已保留"); root.FitnessRecordBrowserUI?.changed(affectedDate); A().render(); return "pending";
        }
      }
      if (state.session?.user?.id !== item.owner_user_id) return "session_changed";
      if (request.bundle) {
        const daily = request.bundle.daily;
        state.data.fitness._entries.push({...daily,revision:1,updated_at:receipt?.committed_at || request.created_at});
        state.data.fitness._workouts.push(...request.bundle.workouts.map((w) => ({...w,revision:1})));
      } else R.apply(state.data.fitness,request,false,receipt);
      if (obsoleteRequest) { state.pending = state.pending.filter((p) => !(p.owner_user_id === state.session.user.id && p.row_id === obsoleteRequest)); A().saveQueue(); }
      root.FitnessRecordBrowserUI?.changed(affectedDate);
      A().toast("已保存；歷史版本保留");
      if (A().cloud()) await A().refresh(); else A().render();
      return "saved";
    } finally { busy = false; $("saveFitnessRevision").disabled = false; A().render(); }
  }
  root.FitnessRecordsUI = {bind,render,save,summary,openEditor,clearEditor:()=>{editor=null;}};
})(globalThis);
