const CACHE_NAME = "jessica-dashboard-v2026-10-03-5";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./ios-fixes.css",
  "./product.css",
  "./app.js",
  "./session-security.js",
  "./fitness-target-link.js",
  "./fitness-records.js",
  "./fitness-records-ui.js",
  "./dashboard.js",
  "./manifest.webmanifest",
  "./robots.txt",
  "./data/demo.json",
  "./icons/icon.svg",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

async function cacheFreshAppShell() {
  const cache = await caches.open(CACHE_NAME);
  const requests = APP_SHELL.map((path) => new Request(
    new URL(path, self.location.href),
    { cache: "reload" }
  ));
  await cache.addAll(requests);
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheFreshAppShell());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/auth/v1/") || event.request.url.includes("/rest/v1/")) return;
  if (event.request.url.endsWith("/config.json")) return;

  const url = new URL(event.request.url);
  const isAppShellRequest = event.request.mode === "navigate"
    || (url.origin === self.location.origin && APP_SHELL.some((path) => url.pathname.endsWith(path.replace("./", "/"))));

  if (isAppShellRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === "navigate") return caches.match("./index.html");
          return new Response("", { status: 504, statusText: "Offline" });
        }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && event.request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (cached) return cached;
          if (event.request.mode === "navigate") return caches.match("./index.html");
          return new Response("", { status: 504, statusText: "Offline" });
        });
      return cached || fetched;
    })
  );
});
