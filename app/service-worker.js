const CACHE_NAME = "jessica-dashboard-v2026-06-30-10";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./ios-fixes.css",
  "./product.css",
  "./app.js",
  "./fitness-target-link.js",
  "./dashboard.js",
  "./manifest.webmanifest",
  "./robots.txt",
  "./data/demo.json",
  "./icons/icon.svg",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
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
