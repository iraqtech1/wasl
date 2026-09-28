"use strict";
const BASE = new URL("./", self.location.href);
const PREFIX = "wasel-vue-" + BASE.pathname + "-";
const CACHE = PREFIX + "__VERSION__";
const FILES = __FILES__.map((file) => new URL(file, BASE).href);
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== CACHE &&
                (key.startsWith(PREFIX) ||
                  key.startsWith("wasel-pages-" + BASE.pathname + "-") ||
                  (BASE.pathname === "/" &&
                    (key.startsWith("wasel-platform-") ||
                      key.startsWith("wasel-shell-")))),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url),
    relative = url.pathname.slice(BASE.pathname.length);
  if (
    event.request.method !== "GET" ||
    url.origin !== BASE.origin ||
    !url.pathname.startsWith(BASE.pathname) ||
    relative.startsWith("api/")
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(event.request, { cache: "no-store" });
        if (response.ok)
          await cache.put(event.request, response.clone()).catch(() => {});
        return response;
      } catch {
        const saved = await cache.match(event.request);
        if (saved) return saved;
        if (
          event.request.mode === "navigate" &&
          [
            "",
            "index.html",
            "merchant/",
            "courier/",
            "merchant",
            "courier",
          ].includes(relative)
        )
          return (
            (await cache.match(new URL("index.html", BASE).href)) ||
            new Response("Offline", { status: 503 })
          );
        return new Response("Offline", { status: 503 });
      }
    })(),
  );
});
