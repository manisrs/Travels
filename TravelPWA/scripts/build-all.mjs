#!/usr/bin/env node
/**
 * Builds all example TripTemplates under dist/<slug>/ (Approach A).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const jobs = [
  {
    slug: "lisbon-long-weekend-3d",
    template: "trip-templates/examples/lisbon-long-weekend-3d.jsonc",
  },
  {
    slug: "canadian-rockies-5d",
    template: "trip-templates/examples/canadian-rockies-5d.jsonc",
  },
  {
    slug: "vietnam-central-coast-7d",
    template: "trip-templates/examples/vietnam-central-coast-7d.jsonc",
  },
  {
    slug: "japan-2026-guide",
    template: "trip-templates/examples/japan-2026-guide.json",
  },
];

for (const { slug, template } of jobs) {
  const r = spawnSync(process.execPath, ["scripts/build-trip.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, TRIP_TEMPLATE: template, TRIP_SLUG: slug },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log(
  "All example TripPWAs built under dist/*. Serve over HTTP for service worker / install (see README)."
);
