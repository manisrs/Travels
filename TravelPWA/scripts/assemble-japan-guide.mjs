#!/usr/bin/env node
/**
 * Merges scripts/japan-html-extracted.json + metadata into TripTemplate japan-2026-guide.json.
 * Prerequisite: node scripts/extract-japan-html.mjs (when Japan2026-Guide.html changes).
 * Output: schemaVersion 3.0.0 with { core, bundle }.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const EXTRACTED = path.join(__dirname, "japan-html-extracted.json");
const OUT = path.join(
  ROOT,
  "trip-templates/examples/japan-2026-guide.json"
);

const verbatimJapan = JSON.parse(fs.readFileSync(EXTRACTED, "utf8"));

const trip = {
  schemaVersion: "3.0.0",
  core: {
    meta: {
      id: "japan-2026-guide",
      title: "Japan 2026",
      subtitle: "Cherry Blossom Adventure · Mani & Anandi",
      tagline: "",
      manifestDescription:
        "Tokyo · Hakone · Fuji · Nagoya · Kyoto · Hiroshima · Osaka — cherry blossom itinerary, trains & hotels.",
      shortName: "Japan",
      defaultTimeZone: "Asia/Tokyo",
      dateRange: { start: "2026-03-26", end: "2026-04-07", dayCount: 12 },
      travelers: ["Mani", "Anandi"],
      locale: "en-US",
      revision: 1,
    },
    registry: { places: [], assets: [], logistics: [] },
    content: {
      verbatimJapan,
    },
    extensions: {
      sourceHtml: "Japan2026-Guide.html",
      extractedFrom: "scripts/japan-html-extracted.json",
    },
  },
  bundle: {
    presentation: {
      themeId: "japan-2026",
      heroEmoji: "🌸",
      heroDatesHtml: "✈️ Mar 26 → Apr 7 &nbsp;|&nbsp; 12 Days",
      daySegmentBands: {
        morning: { startMinute: 330, endMinute: 720 },
        afternoon: { startMinute: 720, endMinute: 1020 },
        evening: { startMinute: 1020, endMinute: 1290 },
        night: { wraps: true, startMinute: 1290, endMinute: 330 },
      },
    },
    sections: [
      {
        id: "sec-itinerary",
        slug: "itinerary",
        kind: "itinerary",
        title: "Itinerary",
      },
      { id: "sec-trains", slug: "trains", kind: "transport", title: "Trains" },
      { id: "sec-hotels", slug: "hotels", kind: "lodging", title: "Hotels" },
      {
        id: "sec-luggage",
        slug: "luggage",
        kind: "logistics",
        title: "Luggage",
      },
      { id: "sec-food", slug: "food", kind: "dining", title: "Food" },
    ],
  },
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(trip, null, 2), "utf8");
console.log("Wrote", path.relative(process.cwd(), OUT));
