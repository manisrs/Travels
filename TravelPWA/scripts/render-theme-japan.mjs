import { escapeHtml } from "./html-escape.mjs";

/** @typedef {Record<string,string>} ModalMap */

/**
 * @param {unknown} trip
 */
export function renderJapanTripHtml(trip) {
  /** @type {any} */
  const t = trip;

  /** @type {any} */
  const v = t.content?.verbatimJapan;
  if (!v?.dayCards) {
    throw new Error("TripTemplate japan-2026: missing content.verbatimJapan (run assemble-japan-guide.mjs)");
  }

  const pres = t.presentation || {};
  const meta = t.meta || {};
  const title = escapeHtml(meta.title ?? "Japan 2026");
  const subtitle = escapeHtml(meta.subtitle ?? "");

  const heroDates =
    pres.heroDatesHtml ??
    `${escapeHtml(String(meta.dateRange?.start ?? ""))} → ${escapeHtml(String(meta.dateRange?.end ?? ""))}`;

  /** @type {string[]} */
  const dayFragments = [];
  for (let d = 1; d <= 12; d++) {
    const fragment = v.dayCards[`day-${d}`];
    if (!fragment) throw new Error(`Missing dayCards day-${d}`);
    dayFragments.push(fragment);
  }

  /** @type {string[]} */
  const modalFragments = [];
  for (let m = 1; m <= 12; m++) {
    modalFragments.push(v.modals[`m${m}`] || "");
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#1a1208">
<title>🌸 Japan 2026</title>
<link rel="stylesheet" href="./assets/japan-2026.css">
<link rel="manifest" href="./manifest.json">
</head>
<body>

<div class="hero">
  <div class="hero-blossom">🌸</div>
  <h1>${title}</h1>
  <div class="hero-sub">${subtitle}</div>
  <div class="hero-dates">${heroDates}</div>
</div>

<div class="nav-tabs">
  <div class="nav-tab active" onclick="showTab('itinerary',this)">📅 Itinerary</div>
  <div class="nav-tab" onclick="showTab('trains',this)">🚄 Trains</div>
  <div class="nav-tab" onclick="showTab('hotels',this)">🏨 Hotels</div>
  <div class="nav-tab" onclick="showTab('luggage',this)">🧳 Luggage</div>
  <div class="nav-tab" onclick="showTab('food',this)">🍛 Food</div>
</div>

<div id="tab-itinerary" class="section active">
  <div style="padding:14px 16px 0;display:flex;gap:8px;flex-wrap:wrap;">
${v.itineraryChipsRowInner || ""}
  </div>
  <div class="timeline">

${dayFragments.join("\n\n")}

  </div>
</div>

<!-- Extracted slices already include <div id="tab-*" class="section"> — do not wrap again
     or inner .section stays display:none and tabs look empty. -->
${v.trainsTabInner || ""}

${v.hotelsTabInner || ""}

${v.luggageTabInner || ""}

${v.foodTabInner || ""}

${modalFragments.filter(Boolean).join("\n")}

<script src="./assets/japan-app.js"></script>
</body>
</html>`;
}
