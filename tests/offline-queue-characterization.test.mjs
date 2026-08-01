import assert from "node:assert/strict";
import { loadDashboardHarness } from "./helpers/dashboard-harness.mjs";

const { api, document, navigator, setFetch, snapshot } = loadDashboardHarness();
const userA = "08dc15cb-aa8e-40fe-bfdf-0ef659292e0e";
const userB = "11111111-1111-4111-8111-111111111111";

function resetState() {
  Object.assign(api.state, {
    authResolved: false,
    config: {
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "test-anon-key-longer-than-twenty-characters"
    },
    data: api.emptyDashboard(),
    lastWriteError: null,
    pending: [],
    session: {
      access_token: "access-token",
      demo: false,
      user: { id: userA, email: "vinson@example.com" }
    },
    supabaseReady: true
  });
  navigator.onLine = true;
}

function queued(overrides = {}) {
  return {
    id: overrides.id || "queue-1",
    operation: "insert",
    table: "english_self_checks",
    row_id: "row-1",
    payload: { id: "row-1", answer_chain: "3" },
    owner_user_id: userA,
    queued_at: "2026-07-29T12:00:00.000Z",
    ...overrides
  };
}

resetState();
api.upsertPendingOperation(queued());
api.upsertPendingOperation(queued({
  id: "queue-2",
  operation: "update",
  payload: { id: "row-1", future_action: "4" }
}));
assert.equal(api.state.pending.length, 1);
assert.equal(api.state.pending[0].operation, "insert");
assert.deepEqual(snapshot(api.state.pending[0].payload), {
  id: "row-1",
  answer_chain: "3",
  future_action: "4"
});

api.upsertPendingOperation(queued({ id: "queue-b", owner_user_id: userB }));
assert.equal(api.state.pending.length, 2);
assert.deepEqual(snapshot(api.pendingForCurrentUser().map((item) => item.owner_user_id)), [userA]);

api.upsertPendingOperation(queued({ id: "queue-delete", operation: "delete", payload: {} }));
assert.equal(api.state.pending.length, 1);
assert.equal(api.state.pending[0].owner_user_id, userB);

resetState();
const dailyId = "22222222-2222-4222-8222-222222222222";
const workoutId = "33333333-3333-4333-8333-333333333333";
const bundle = queued({
  id: "bundle-a",
  operation: "rpc",
  intent: api.FITNESS_CREATE_INTENT,
  table: "fitness_entry_bundle",
  row_id: dailyId,
  payload: {
    daily: {
      id: dailyId,
      entry_date: "2026-07-29",
      bodyweight_kg: 72,
      training_status: "trained",
      sleep_hours: 7,
      energy_score: 4,
      recovery_score: 4,
      soreness_level: "none",
      soreness_areas: []
    },
    workouts: [{
      id: workoutId,
      daily_entry_id: dailyId,
      workout_date: "2026-07-29",
      plan_type: "Plan A",
      exercise_key: "a_pushup",
      completed: true
    }]
  }
});
api.state.pending = [bundle, { ...bundle, id: "bundle-b", owner_user_id: userB }];
const overlay = api.emptyDashboard();
api.applyPendingOperations(overlay);
assert.equal(overlay.fitness._entries.length, 1);
assert.equal(overlay.fitness._entries[0].id, dailyId);
assert.equal(overlay.fitness._entries[0]._pending, true);
assert.equal(overlay.fitness._workouts.length, 1);
assert.equal(overlay.fitness._workouts[0]._pending, true);

let networkCalls = 0;
setFetch(async () => {
  networkCalls += 1;
  return response(204);
});
await assert.rejects(
  api.executeOperation({ ...bundle, owner_user_id: userB }),
  /not owned by this session/
);
assert.equal(networkCalls, 0);

resetState();
const unknownBundle = { ...bundle, last_error: "temporary network failure" };
delete unknownBundle.intent;
api.state.pending = [unknownBundle];
const unknownOverlay = api.emptyDashboard();
api.applyPendingOperations(unknownOverlay);
assert.equal(unknownOverlay.fitness._entries.length, 0);
assert.equal(unknownOverlay.fitness._workouts.length, 0);
api.renderSettings();
assert.match(document.getElementById("syncStatus").textContent, /older build.*cannot be synced safely/i);
assert.match(document.getElementById("syncStatus").textContent, /temporary network failure/i);

let unknownNetworkCalls = 0;
api.state.session.refresh_token = "unknown-refresh-token";
api.state.session.expires_at = 0;
setFetch(async () => {
  unknownNetworkCalls += 1;
  return response(204);
});
await api.syncPending();
assert.equal(unknownNetworkCalls, 0);
assert.equal(api.state.pending.length, 1);
assert.match(api.state.pending[0].last_error, /older build.*cannot be synced safely/i);
assert.match(api.state.pending[0].last_error, /temporary network failure/i);
assert.match(api.state.lastWriteError, /older build.*cannot be synced safely/i);
api.renderSettings();
assert.match(document.getElementById("syncStatus").textContent, /older build.*cannot be synced safely/i);
assert.match(document.getElementById("syncStatus").textContent, /temporary network failure/i);
const stableUnknownWarning = api.state.pending[0].last_error;
await api.syncPending();
assert.equal(unknownNetworkCalls, 0);
assert.equal(api.state.pending[0].last_error, stableUnknownWarning);

resetState();
const legacyDaily = queued({
  id: "legacy-daily",
  operation: "update",
  table: "fitness_daily_entries",
  row_id: dailyId,
  payload: { id: dailyId, entry_date: "2026-07-29", training_status: "trained" }
});
const legacyWorkout = queued({
  id: "legacy-workout",
  operation: "update",
  table: "fitness_workouts",
  row_id: workoutId,
  payload: { id: workoutId, daily_entry_id: dailyId, exercise_key: "a_pushup", completed: true }
});
api.state.pending = [legacyDaily, legacyWorkout];
const legacyOverlay = api.emptyDashboard();
api.applyPendingOperations(legacyOverlay);
assert.equal(legacyOverlay.fitness._entries.length, 0);
assert.equal(legacyOverlay.fitness._workouts.length, 0);
api.renderSettings();
assert.match(document.getElementById("syncStatus").textContent, /older build.*cannot be synced safely/i);

let legacyNetworkCalls = 0;
api.state.session.refresh_token = "legacy-refresh-token";
api.state.session.expires_at = 0;
setFetch(async () => {
  legacyNetworkCalls += 1;
  return response(204);
});
await assert.rejects(api.executeOperation(legacyDaily), /older build.*cannot be synced safely/i);
assert.equal(legacyNetworkCalls, 0);
await api.syncPending();
assert.equal(legacyNetworkCalls, 0);
assert.equal(api.state.pending.length, 2);
assert.deepEqual(snapshot(api.state.pending.map((item) => item.id)), ["legacy-daily", "legacy-workout"]);
assert.ok(api.state.pending.every((item) => !Object.hasOwn(item, "save_status")));
assert.ok(api.state.pending.every((item) => /older build.*cannot be synced safely/i.test(item.last_error)));
assert.match(api.state.lastWriteError, /older build.*cannot be synced safely/i);
api.renderSettings();
assert.match(document.getElementById("syncStatus").textContent, /older build.*cannot be synced safely/i);

const draft = {
  daily: bundle.payload.daily,
  exercises: bundle.payload.workouts
};
const requests = [];
resetState();
setFetch(async (url, options) => {
  requests.push({ url, options });
  return response(500, { code: "XX500", message: "temporary failure" });
});
const pendingResult = await api.saveFitnessBundle(draft, api.FITNESS_CREATE_INTENT);
assert.equal(pendingResult.save_status, "pending");
assert.equal(api.state.pending.length, 1);
assert.equal(api.state.pending[0].table, "fitness_entry_bundle");
assert.match(requests[0].url, /\/rest\/v1\/rpc\/save_fitness_entry_atomic$/);
assert.deepEqual(JSON.parse(requests[0].options.body), {
  p_daily_entry: draft.daily,
  p_workouts: draft.exercises
});

setFetch(async (url, options) => {
  requests.push({ url, options });
  return response(204);
});
await api.syncPending();
assert.equal(api.state.pending.length, 0);
assert.equal(api.state.lastWriteError, null);
assert.equal(requests.length, 2);
assert.deepEqual(JSON.parse(requests[1].options.body), {
  p_daily_entry: draft.daily,
  p_workouts: draft.exercises
});

resetState();
setFetch(async () => response(400, { code: "PGRST100", message: "invalid contract" }));
const rejectedResult = await api.saveFitnessBundle(draft, api.FITNESS_CREATE_INTENT);
assert.equal(rejectedResult.save_status, "rejected");
assert.match(rejectedResult.last_error, /invalid contract/);
assert.equal(api.state.pending.length, 0);

resetState();
setFetch(async () => response(204));
const savedResult = await api.saveFitnessBundle(draft, api.FITNESS_CREATE_INTENT);
assert.equal(savedResult.save_status, "saved");
assert.equal(api.state.pending.length, 0);

function response(status, payload = null) {
  const body = payload ? JSON.stringify(payload) : "";
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 400 ? "Bad Request" : status === 500 ? "Server Error" : "No Content",
    headers: {
      get(name) {
        return name.toLowerCase() === "content-length" ? String(body.length) : null;
      }
    },
    async json() {
      return payload;
    },
    async text() {
      return body;
    }
  };
}

console.log("Offline queue characterization tests passed");
