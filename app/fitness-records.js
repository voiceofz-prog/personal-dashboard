(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.FitnessRecords = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const forms = {
    walk_run: { label: "步行／跑步", fields: ["duration_minutes", "distance_km"] },
    hiking: { label: "登山", fields: ["duration_minutes", "elapsed_minutes", "distance_km", "elevation_m"] },
    cycling: { label: "騎車", fields: ["duration_minutes", "distance_km", "elevation_m", "environment"] },
    swimming: { label: "游泳", fields: ["duration_minutes", "distance_km", "stroke", "pool_length_m", "laps"] },
    ball: { label: "球類", fields: ["duration_minutes"] },
    strength: { label: "自訂重訓", fields: ["duration_minutes", "exercises"] },
    mobility: { label: "伸展／瑜伽", fields: ["duration_minutes"] },
    other: { label: "其他活動", fields: ["duration_minutes"] }
  };
  const labels = { duration_minutes: "運動時間（分鐘）", elapsed_minutes: "總經過時間（分鐘）", distance_km: "距離（公里）", elevation_m: "爬升（公尺）", environment: "室內／戶外", stroke: "泳姿", pool_length_m: "池長（公尺）", laps: "趟數", intensity: "主觀強度（1–10）" };
  const numericFields = ["duration_minutes", "elapsed_minutes", "distance_km", "elevation_m", "pool_length_m", "laps", "intensity"];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  function isRequest(request) {
    if (!request || typeof request !== "object" || typeof request.request_id !== "string") return false;
    if (request.bundle) return !request.changes && typeof request.bundle.daily?.id === "string" && Array.isArray(request.bundle.workouts) && request.bundle.workouts.every((w) => w && typeof w.id === "string" && Array.isArray(w.reps_by_set));
    return Array.isArray(request.changes) && request.changes.length > 0 && request.changes.length <= 50 && request.changes.every((c) => {
      if (!(c && ["daily","workout","activity"].includes(c.kind) && typeof c.id === "string" && ["create","revise","withdraw","restore"].includes(c.operation) && Number.isInteger(c.expected_version) && c.expected_version >= 0 && (c.snapshot === undefined || (c.snapshot !== null && typeof c.snapshot === "object" && !Array.isArray(c.snapshot))))) return false;
      if (c.kind === "activity" && ["create","revise"].includes(c.operation)) { try { activity(c.snapshot); } catch { return false; } }
      return true;
    });
  }
  function numeric(value, field) {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || (field === "laps" && !Number.isInteger(n)) || (field === "intensity" && (!Number.isInteger(n) || n < 1 || n > 10))) throw new Error(`${labels[field] || field}格式不正確`);
    return n;
  }
  function date(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "") || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error("請填有效日期");
    return value;
  }
  function activity(input) {
    const type = input.activity_type;
    if (!Object.hasOwn(forms,type)) throw new Error("請選活動類型");
    const name = String(input.name || "").trim();
    if (!name || name.length > 120) throw new Error("活動名稱必填，最多 120 字");
    const metrics = {};
    for (const key of [...forms[type].fields.filter((key) => numericFields.includes(key)), "intensity"]) metrics[key] = numeric(input.metrics?.[key], key);
    for (const key of ["environment", "stroke"].filter((key) => forms[type].fields.includes(key))) metrics[key] = String(input.metrics?.[key] || "").trim() || null;
    if (metrics.environment && !["indoor", "outdoor"].includes(metrics.environment)) throw new Error("請選室內或戶外");
    if (metrics.elapsed_minutes !== null && metrics.elapsed_minutes !== undefined && metrics.duration_minutes !== null && metrics.elapsed_minutes < metrics.duration_minutes) throw new Error("總經過時間不能短於運動時間");
    const exercises = type === "strength" ? (input.exercises || []).map((row) => {
      const reps = Array.isArray(row.reps_by_set) ? row.reps_by_set : String(row.reps_by_set || "").split(/[／/,\s]+/).filter(Boolean).map(Number);
      if (!String(row.name || "").trim() || !reps.length || reps.some((n) => !Number.isInteger(n) || n < 1)) throw new Error("重訓動作需要名稱與各組次數");
      return { name: String(row.name).trim(), weight_kg: numeric(row.weight_kg, "weight_kg"), reps_by_set: reps };
    }) : [];
    return { id: input.id, activity_date: date(input.activity_date), activity_type: type, name, metrics, exercises, feeling: String(input.feeling || "").trim(), notes: String(input.notes || "").trim(), source: "manual" };
  }
  function records(fitness) {
    return [
      ...(fitness._entries || []).map((row) => ({ kind: "daily", row })),
      ...(fitness._workouts || []).map((row) => ({ kind: "workout", row })),
      ...(fitness._activities || []).map((row) => ({ kind: "activity", row }))
    ];
  }
  function apply(fitness, request, pending = false, receipt = null) {
    fitness._activities ||= [];
    fitness._versions ||= [];
    if (request.bundle) {
      const data = request.bundle;
      if (!(fitness._entries || []).some((r) => r.id === data.daily.id)) fitness._entries.push({ ...clone(data.daily), revision: 1, _pending: pending, _pending_request: pending ? request.request_id : null });
      for (const row of data.workouts || []) if (!fitness._workouts.some((w) => w.id === row.id)) fitness._workouts.push({ ...clone(row), revision: 1, _pending: pending, _pending_request: pending ? request.request_id : null });
      return fitness;
    }
    for (const change of request.changes || []) {
      const key = { daily: "_entries", workout: "_workouts", activity: "_activities" }[change.kind];
      if (!key) throw new Error("Unknown Fitness record kind");
      const rows = fitness[key];
      const index = rows.findIndex((row) => row.id === change.id);
      const previous = index < 0 ? {} : rows[index];
      const baseline = Number(previous.revision || 1);
      const nextVersion = change.operation === "create" ? 1 : change.expected_version + 1;
      // A stale/conflicting draft stays in the queue, never overlays cloud truth.
      if (pending && index >= 0 && baseline > change.expected_version && change.operation !== "create") continue;
      if (pending && previous._pending_request && previous._pending_request !== request.request_id) continue;
      if (!fitness._versions.some((v) => v.record_kind === change.kind && v.record_id === change.id && v.revision === baseline) && index >= 0) fitness._versions.push({ record_kind: change.kind, record_id: change.id, revision: baseline, snapshot: clone(previous), withdrawn: Boolean(previous.withdrawn), reason: "原始紀錄", changed_at: previous.updated_at || previous.created_at });
      const stamp = receipt?.committed_at || request.created_at || new Date().toISOString();
      const next = { ...previous, ...clone(change.snapshot || previous), id: change.id, revision: nextVersion, withdrawn: change.operation === "withdraw" ? true : change.operation === "restore" ? false : Boolean(previous.withdrawn), updated_at: stamp, _pending: pending, _pending_request: pending ? request.request_id : null };
      if (index < 0) rows.push(next); else rows[index] = next;
      if (!pending && !fitness._versions.some((v) => v.request_id === request.request_id && v.record_kind === change.kind && v.record_id === change.id)) fitness._versions.push({ record_kind: change.kind, record_id: change.id, revision: nextVersion, snapshot: clone(next), withdrawn: next.withdrawn, reason: change.reason || "初次保存", changed_at: stamp, request_id: request.request_id });
    }
    return fitness;
  }
  function activeWorkouts(fitness) {
    const withdrawn = new Set((fitness._entries || []).filter((r) => r.withdrawn).map((r) => r.id));
    return (fitness._workouts || []).filter((r) => !r.withdrawn && !withdrawn.has(r.daily_entry_id));
  }
  function stats(fitness, start, end) {
    const inRange = (d) => d >= start && d <= end;
    const workouts = activeWorkouts(fitness).filter((r) => r.completed && inRange(r.workout_date));
    const activities = (fitness._activities || []).filter((r) => !r.withdrawn && inRange(r.activity_date));
    return { exerciseDays: new Set([...workouts.map((r) => r.workout_date), ...activities.map((r) => r.activity_date)]).size, activityCount: activities.length, planDays: new Set(workouts.map((r) => r.workout_date)).size };
  }
  function needsReview(fitness) {
    const evidence = fitness.jessicaReview?.evidence || {};
    const versions = evidence.record_versions || [];
    return records(fitness).some(({ kind, row }) => {
      const sameOwner = (other) => row.user_id ? other?.user_id === row.user_id : !other?.user_id;
      if ((fitness._reviewAcknowledgements || []).some((a) => sameOwner(a) && a.record_kind === kind && a.record_id === row.id && a.revision === Number(row.revision || 1))) return false;
      const adopted = sameOwner(fitness.jessicaReview) && versions.find((v) => v.kind === kind && v.id === row.id);
      if (adopted) return Number(row.revision || 1) !== adopted.revision;
      // Only exact version evidence proves adoption. Time alone never does.
      // Legacy v1 daily/workout backfill remains covered by the legacy review path.
      return Number(row.revision || 1) > 1 || kind === "activity";
    });
  }
  return { forms, labels, numeric, date, activity, isRequest, records, apply, activeWorkouts, stats, needsReview };
});
