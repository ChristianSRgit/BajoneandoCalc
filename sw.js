self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("fetch", e => {
  // Allow all requests (no caching yet)
});
