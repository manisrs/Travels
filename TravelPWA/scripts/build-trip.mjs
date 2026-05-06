#!/usr/bin/env node
/**
 * Builds one TripPWA bundle into dist/<slug>/ from a TripTemplate .json / .jsonc file.
 *
 * TRIP_TEMPLATE  — relative to TravelPWA root or absolute
 * TRIP_SLUG      — folder name under dist/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import stripJsonComments from "./strip-json-comments.mjs";
import { renderDocument } from "./render-html.mjs";
import { normalizeTripDocument } from "./normalize-trip.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const templateArg = process.env.TRIP_TEMPLATE;
const slugEnv = process.env.TRIP_SLUG;

if (!templateArg || !slugEnv) {
  console.error(
    "Set TRIP_TEMPLATE and TRIP_SLUG (relative to TravelPWA/). Example:\n  TRIP_TEMPLATE=trip-templates/examples/lisbon-long-weekend-3d.jsonc TRIP_SLUG=lisbon-long-weekend-3d node scripts/build-trip.mjs"
  );
  process.exit(1);
}

const absTemplate = path.isAbsolute(templateArg)
  ? templateArg
  : path.join(ROOT, templateArg);

let trip;
try {
  const raw = fs.readFileSync(absTemplate, "utf8");
  try {
    trip = JSON.parse(raw);
  } catch {
    trip = JSON.parse(stripJsonComments(raw));
  }
} catch (e) {
  console.error("Failed reading template:", absTemplate, e);
  process.exit(1);
}

let inferences = [];
try {
  const n = normalizeTripDocument(trip);
  trip = n.trip;
  inferences = n.inferences;
} catch (e) {
  console.error("Invalid trip document:", e);
  process.exit(1);
}

if (inferences.length) {
  console.error("[TripPWA] Inferred defaults (bundle/core incomplete):");
  for (const inf of inferences) {
    console.error(`  · ${inf.path}: ${inf.reason} → ${inf.defaultValue}`);
  }
}

const slug =
  slugEnv.trim() ||
  (trip.meta?.id &&
    String(trip.meta.id)
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-"));

const isJapan = String(trip.presentation?.themeId) === "japan-2026";

const outDir = path.join(ROOT, "dist", slug);

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, "assets"), { recursive: true });

fs.writeFileSync(path.join(outDir, "index.html"), renderDocument(trip), "utf8");

if (isJapan) {
  fs.copyFileSync(
    path.join(ROOT, "src/themes/japan-2026.css"),
    path.join(outDir, "assets/japan-2026.css")
  );
  fs.copyFileSync(
    path.join(ROOT, "src/themes/japan-app.js"),
    path.join(outDir, "assets/japan-app.js")
  );
} else {
  fs.copyFileSync(path.join(ROOT, "src/styles.css"), path.join(outDir, "assets/styles.css"));
  fs.copyFileSync(path.join(ROOT, "src/app.js"), path.join(outDir, "assets/app.js"));
}

fs.writeFileSync(
  path.join(outDir, "trip.json"),
  JSON.stringify(trip, null, 2),
  "utf8"
);

const iconSvg = isJapan
  ? `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect fill="#c0392b" width="128" height="128" rx="24"/><path fill="#ffffff" opacity="0.95" d="M64 18L43 104l21-37 21 37z"/></svg>`
  : `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect fill="#2c5282" width="128" height="128" rx="24"/><path fill="#ffffff" opacity="0.95" d="M64 18L43 104l21-37 21 37z"/></svg>`;
fs.writeFileSync(path.join(outDir, "assets/icon.svg"), iconSvg);

const manifest = {
  id: `./${slug}-pwa`,
  name: trip.meta?.title || slug,
  short_name: shorten(trip.meta?.shortName || trip.meta?.title || slug, 16),
  description:
    trip.meta?.manifestDescription || trip.meta?.tagline || trip.meta?.description || "",
  start_url: "./index.html",
  scope: `./`,
  display: "standalone",
  background_color: isJapan ? "#fdf8f0" : "#f9f6f2",
  theme_color: isJapan ? "#1a1208" : "#2c5282",
  icons: [
    {
      src: "./assets/icon.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any",
    },
  ],
};
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

const assetList = isJapan
  ? [
      "./index.html",
      "./manifest.json",
      "./trip.json",
      "./assets/japan-2026.css",
      "./assets/japan-app.js",
      "./assets/icon.svg",
    ]
  : [
      "./index.html",
      "./manifest.json",
      "./trip.json",
      "./assets/styles.css",
      "./assets/app.js",
      "./assets/icon.svg",
    ];

const ASSETS_LITERAL = JSON.stringify(assetList);

const swJs =
  `'use strict';

const CORE = '${slug}-trip-v1';
const ASSETS = ${ASSETS_LITERAL};

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
`;
fs.writeFileSync(path.join(outDir, "sw.js"), swJs, "utf8");

console.log("Built TripPWA →", path.relative(ROOT, outDir));

/** @param {string} str @param {number} max */
function shorten(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}
