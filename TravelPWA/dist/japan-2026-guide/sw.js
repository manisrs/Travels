'use strict';

const CORE = 'japan-2026-guide-trip-v1';
const ASSETS = ["./index.html","./manifest.json","./trip.json","./assets/japan-2026.css","./assets/japan-app.js","./assets/icon.svg"];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CORE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CORE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((hit) =>
      hit ||
      fetch(event.request).catch(() => caches.match('./index.html'))
    )
  );
});
