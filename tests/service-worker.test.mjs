import assert from "node:assert/strict";

const listeners = new Map();
const cacheWrites = [];
const appShellRequests = [];
let cachedResponse = { source: "cached" };
let fetchImplementation = async () => ({
  status: 200,
  source: "network",
  clone() {
    return { status: this.status, source: this.source };
  }
});

globalThis.self = {
  location: {
    href: "https://example.com/personal-dashboard/service-worker.js",
    origin: "https://example.com"
  },
  clients: { claim: async () => {} },
  skipWaiting() {},
  addEventListener(type, callback) {
    listeners.set(type, callback);
  }
};
globalThis.caches = {
  open: async () => ({
    addAll: async (requests) => appShellRequests.push(...requests),
    put: async (request, response) => cacheWrites.push({ request, response })
  }),
  keys: async () => [],
  delete: async () => true,
  match: async () => cachedResponse
};
globalThis.fetch = (...args) => fetchImplementation(...args);

await import("../app/service-worker.js");
const handleInstall = listeners.get("install");
const handleFetch = listeners.get("fetch");
assert.equal(typeof handleInstall, "function");
assert.equal(typeof handleFetch, "function");

let installPromise;
handleInstall({
  waitUntil(value) {
    installPromise = value;
  }
});
await installPromise;
assert.equal(appShellRequests.length, 23);
assert.ok(appShellRequests.every((request) => request.cache === "reload"));
assert.ok(appShellRequests.some((request) => request.url === "https://example.com/personal-dashboard/fitness-taste.css"), "Fitness presentation is included in the complete installed shell");
assert.ok(appShellRequests.some((request) => request.url === "https://example.com/personal-dashboard/home-journal.css"), "Home presentation is included in the complete installed shell");
assert.ok(appShellRequests.some((request) => request.url === "https://example.com/personal-dashboard/dashboard.js"));

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

const offlineFitnessStyle = await requestAppShell("https://example.com/personal-dashboard/fitness-taste.css");
assert.equal(offlineFitnessStyle.source, "complete-installed-shell");

const offlineHomeStyle = await requestAppShell("https://example.com/personal-dashboard/home-journal.css");
assert.equal(offlineHomeStyle.source, "complete-installed-shell");

console.log("service worker tests passed");
