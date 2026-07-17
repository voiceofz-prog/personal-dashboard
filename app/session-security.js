(function attachDashboardSessionSecurity(root) {
  "use strict";

  const CACHE_VERSION = 1;

  function normalizeStoredSession(value) {
    if (!value || typeof value !== "object" || value.demo) return null;
    if (!isNonEmptyString(value.access_token) || !isNonEmptyString(value.refresh_token)) return null;
    if (!value.user || !isNonEmptyString(value.user.id)) return null;
    const expiresAt = Number(value.expires_at);
    if (!Number.isFinite(expiresAt) || expiresAt <= 0) return null;
    return {
      access_token: value.access_token,
      refresh_token: value.refresh_token,
      expires_at: expiresAt,
      user: value.user
    };
  }

  function isVerifiedUser(session, user) {
    return Boolean(session?.user?.id && user?.id && session.user.id === user.id);
  }

  async function verifyStoredSession(value, { refreshSession, getUser }) {
    let session = normalizeStoredSession(value);
    if (!session) return null;
    session = normalizeStoredSession(await refreshSession(session));
    if (!session) return null;
    const user = await getUser(session.access_token);
    if (!isVerifiedUser(session, user)) return null;
    return { ...session, user };
  }

  function createOwnedCache(data, userId, cachedAt = new Date().toISOString()) {
    if (!isNonEmptyString(userId) || !data || typeof data !== "object") return null;
    return {
      cache_version: CACHE_VERSION,
      owner_user_id: userId,
      cached_at: cachedAt,
      data
    };
  }

  function readOwnedCache(value, userId) {
    if (!value || typeof value !== "object") return null;
    if (value.cache_version !== CACHE_VERSION || value.owner_user_id !== userId) return null;
    if (!value.data || typeof value.data !== "object") return null;
    return value.data;
  }

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  root.DashboardSessionSecurity = {
    normalizeStoredSession,
    isVerifiedUser,
    verifyStoredSession,
    createOwnedCache,
    readOwnedCache
  };
})(globalThis);
