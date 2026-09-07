import assert from "node:assert/strict";
import { loadDashboardHarness } from "./helpers/dashboard-harness.mjs";

const legacyQueueKey = "jessica-dashboard-pending-v1";
const currentQueueKey = "jessica-dashboard-pending-v2";
const currentUser = "08dc15cb-aa8e-40fe-bfdf-0ef659292e0e";
const otherUser = "11111111-1111-4111-8111-111111111111";
const legacy = [
  {
    table: "english_self_checks",
    payload: { id: "row-a", answer_chain: "3" },
    queued_at: "2026-07-01T00:00:00.000Z"
  },
  {
    table: "english_review_events",
    payload: { id: "row-b", result: "hard" },
    owner_user_id: otherUser
  },
  {
    table: "unsupported_table",
    payload: { id: "ignored" }
  },
  {
    table: "fitness_daily_entries"
  }
];
const { api, localStorage, snapshot } = loadDashboardHarness({
  storage: { [legacyQueueKey]: JSON.stringify(legacy) }
});

api.state.session = {
  access_token: "access-token",
  demo: false,
  user: { id: currentUser, email: "vinson@example.com" }
};
api.adoptLegacyPendingRecords();

assert.equal(api.state.pending.length, 2);
assert.equal(localStorage.getItem(legacyQueueKey), null);
assert.equal(JSON.parse(localStorage.getItem(currentQueueKey)).length, 2);
assert.deepEqual(snapshot(api.pendingForCurrentUser().map((item) => ({
  operation: item.operation,
  owner_user_id: item.owner_user_id,
  row_id: item.row_id,
  table: item.table
}))), [{
  operation: "insert",
  owner_user_id: currentUser,
  row_id: "row-a",
  table: "english_self_checks"
}]);
assert.equal(api.state.pending.find((item) => item.row_id === "row-b").owner_user_id, otherUser);
assert.equal(api.state.pending.some((item) => item.row_id === "ignored"), false);

console.log("Legacy queue characterization tests passed");
