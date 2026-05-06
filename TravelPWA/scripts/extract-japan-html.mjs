#!/usr/bin/env node
/**
 * Extracts verbatim HTML snippets from ../../Japan2026-Guide.html for TripTemplate SSR.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..", "..");
const HTML_PATH = path.join(REPO_ROOT, "Japan2026-Guide.html");
const OUT_PATH = path.join(__dirname, "japan-html-extracted.json");

const html = fs.readFileSync(HTML_PATH, "utf8");

/** First balanced <div>...</div> starting at index of `<` */
function extractBalancedDivAt(htmlStr, idx) {
  if (idx < 0) return null;
  if (htmlStr.slice(idx).indexOf("<div") !== 0) return null;

  let depth = 1;
  let pos = idx + 4;

  while (pos < htmlStr.length && depth > 0) {
    const nextOpen = htmlStr.indexOf("<div", pos);
    const nextClose = htmlStr.indexOf("</div>", pos);
    if (nextClose < 0) return null;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      pos = nextOpen + 4;
    } else {
      depth -= 1;
      pos = nextClose + 6;
    }
  }
  return htmlStr.slice(idx, pos);
}

const dayCards = {};
for (let d = 1; d <= 12; d++) {
  const id = `day${d}`;
  const reCard = new RegExp(`<div class="day-card[^>]*\\sid="${id}"[^>]*>`, "");
  const mCard = html.match(reCard);
  if (!mCard || mCard.index === undefined) {
    console.error("Missing day-card:", id);
    process.exit(1);
  }
  const cardOuter = extractBalancedDivAt(html, mCard.index);
  if (!cardOuter) {
    console.error("Unbalanced day card:", id);
    process.exit(1);
  }
  dayCards[`day-${d}`] = cardOuter;
}

function sliceBetween(markStart, markEnd) {
  const a = html.indexOf(markStart);
  if (a < 0) return "";
  const start = a + markStart.length;
  const b = html.indexOf(markEnd, start);
  return (b >= 0 ? html.slice(start, b) : html.slice(start)).trim();
}

const trainsTabInner = sliceBetween(
  "<!-- ═══════════ TRAINS ═══════════ -->",
  "<!-- ═══════════ HOTELS ═══════════ -->"
);
const hotelsTabInner = sliceBetween(
  "<!-- ═══════════ HOTELS ═══════════ -->",
  "<!-- ═══════════ LUGGAGE ═══════════ -->"
);
const luggageTabInner = sliceBetween(
  "<!-- ═══════════ LUGGAGE ═══════════ -->",
  "<!-- ═══════════ FOOD ═══════════ -->"
);
const foodTabInner = sliceBetween(
  "<!-- ═══════════ FOOD ═══════════ -->",
  "<!-- ═══════════ MODALS ═══════════ -->"
);

const modals = {};
for (let mi = 1; mi <= 12; mi++) {
  const id = `m${mi}`;
  const anchor = `<div id="${id}"`;
  const hit = html.indexOf(anchor);
  if (hit < 0) {
    console.error("Missing modal:", id);
    process.exit(1);
  }
  const outer = extractBalancedDivAt(html, hit);
  if (!outer) {
    console.error("Unbalanced modal:", id);
    process.exit(1);
  }
  modals[id] = outer;
}

const chipRowMatch = html.match(
  /<div style="padding:14px 16px 0;display:flex[^>]*>([\s\S]*?)<\/div>\s*<div class="timeline"/
);
const itineraryChipsRowInner = chipRowMatch ? chipRowMatch[1].trim() : "";

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(
  OUT_PATH,
  JSON.stringify(
    {
      dayCards,
      itineraryChipsRowInner,
      trainsTabInner,
      hotelsTabInner,
      luggageTabInner,
      foodTabInner,
      modals,
    },
    null,
    2
  )
);
console.log("Wrote:", OUT_PATH);
