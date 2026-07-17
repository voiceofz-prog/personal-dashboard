import assert from "node:assert/strict";

const listeners = new Map();
const cacheWrites = [];
let cachedResponse = { source: "cached" };
let fetchImplementation = async () => ({
  status: 200,
  source: "network",
  clone() {
    return { status: this.status, source: this.source };
  }
});

globalThis.self = {
  location: { origin: "https://example.com" },
  clients: { claim: async () => {} },
  skipWaiting() {},
  addEventListener(type, callback) {
    listeners.set(type, callback);
  }
};
globalThis.caches = {
  open: async () => ({
    addAll: async () => {},
    put: async (request, response) => cacheWrites.push({ request, response })
  }),
  keys: async () => [],
  delete: async () => true,
  match: async () => cachedResponse
};
globalThis.fetch = (...args) => fetchImplementation(...args);

await import("../app/service-worker.js");
const handleFetch = listeners.get("fetch");
assert.equal(typeof handleFetch, "function");

async function requestAppShell(url, mode = "same-origin") {
  let responsePromise;
  handleFetch({
    request: { method: "GET", url, mode },
    respondWith(value) {
      responsePromise = value;
    }
  });
  return responsePromise;
}

const networkResponse = await requestAppShell("https://example.com/personal-dashboard/dashboard.js");
assert.equal(networkResponse.source, "network");
assert.equal(cacheWrites.length, 1);

fetchImplementation = async () => {
  throw new Error("offline");
};
cachedResponse = { source: "complete-installed-shell" };
const offlineResponse = await requestAppShell("https://example.com/personal-dashboard/dashboard.js");
assert.equal(offlineResponse.source, "complete-installed-shell");

console.log("service worker tests passed");
