import assert from "node:assert/strict";
import "../app/session-security.js";

const {
  normalizeStoredSession,
  isVerifiedUser,
  verifyStoredSession,
  createOwnedCache,
  readOwnedCache
} = globalThis.DashboardSessionSecurity;

const session = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  expires_at: 1800000000,
  user: { id: "user-a", email: "vinson@example.com" }
};

assert.deepEqual(normalizeStoredSession(session), session);
assert.equal(normalizeStoredSession({ ...session, access_token: "" }), null);
assert.equal(normalizeStoredSession({ ...session, refresh_token: "" }), null);
assert.equal(normalizeStoredSession({ ...session, expires_at: 0 }), null);
assert.equal(normalizeStoredSession({ ...session, user: {} }), null);
assert.equal(normalizeStoredSession({ ...session, demo: true }), null);

assert.equal(isVerifiedUser(session, { id: "user-a" }), true);
assert.equal(isVerifiedUser(session, { id: "user-b" }), false);
assert.equal(isVerifiedUser(session, null), false);

assert.deepEqual(await verifyStoredSession(session, {
  refreshSession: async (candidate) => candidate,
  getUser: async () => ({ id: "user-a", email: "verified@example.com" })
}), {
  ...session,
  user: { id: "user-a", email: "verified@example.com" }
});
assert.equal(await verifyStoredSession(session, {
  refreshSession: async (candidate) => candidate,
  getUser: async () => ({ id: "user-b" })
}), null);
let malformedSessionReachedNetwork = false;
assert.equal(await verifyStoredSession({ ...session, access_token: "" }, {
  refreshSession: async (candidate) => candidate,
  getUser: async () => {
    malformedSessionReachedNetwork = true;
    return { id: "user-a" };
  }
}), null);
assert.equal(malformedSessionReachedNetwork, false);

const cachedData = { english: { currentFocus: "Practice" }, fitness: {} };
const envelope = createOwnedCache(cachedData, "user-a", "2026-07-17T00:00:00.000Z");
assert.deepEqual(readOwnedCache(envelope, "user-a"), cachedData);
assert.equal(readOwnedCache(envelope, "user-b"), null);
assert.equal(readOwnedCache(cachedData, "user-a"), null);
assert.equal(readOwnedCache({ ...envelope, cache_version: 2 }, "user-a"), null);

console.log("session security tests passed");
