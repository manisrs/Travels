import { renderJapanTripHtml } from "./render-theme-japan.mjs";
import { collectAllTasks, normalizeTripDocument } from "./normalize-trip.mjs";

const SEGMENT_ORDER = ["morning", "afternoon", "evening", "night"];

/**
 * @param {string|null|undefined} t
 */
function escapeHtml(t) {
  const s = t == null ? "" : String(t);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function labelSegment(coarse) {
  if (!coarse) return "Schedule";
  const m = String(coarse).toLowerCase();
  const map = {
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    night: "Night",
    allday: "All day",
  };
  return map[m] || coarse;
}

/** @param {string} iso YYYY-MM-DD */
function weekdayDate(iso, locale, timeZone) {
  const safe = /\d{4}-\d{2}-\d{2}/.test(iso) ? iso : "2026-01-01";
  const d = new Date(`${safe}T12:00:00`);
  return new Intl.DateTimeFormat(locale || "en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: timeZone || "UTC",
  }).format(d);
}

/** inclusive day count between ISO dates */
function tripDayCount(start, end) {
  const a = parseIsoDateParts(start);
  const b = parseIsoDateParts(end);
  if (!a || !b) return 0;
  const ms = Math.abs(b.getTime() - a.getTime());
  return Math.round(ms / 86400000) + 1;
}

/** @param {string} iso */
function parseIsoDateParts(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** @param {Record<string,{name?:string}|undefined>} placeById */
function placeName(placeById, id) {
  if (!id || !placeById[id]) return "";
  const p = /** @type {{name?:string}} */ (placeById[id]);
  return p?.name ?? "";
}

/**
 * @param {unknown} trip
 */
export function renderDocument(trip) {
  const raw = trip || {};
  let t;
  try {
    t = normalizeTripDocument(raw).trip;
  } catch {
    t = raw;
  }
  /** @type {any} */
  t = t || {};
  if (String(t.presentation?.themeId) === "japan-2026" && t.content?.verbatimJapan) {
    return renderJapanTripHtml(trip);
  }

  const meta = t.meta || {};
  const content = t.content || {};
  const registry = t.registry || {};
  const places = registry.places || [];
  /** @type {Record<string,{name:string}>} */
  const placeById = {};
  places.forEach((/** @type {any} */ p) => {
    if (p?.id) placeById[String(p.id)] = p;
  });

  const sections = Array.isArray(t.sections) ? t.sections : [];
  const tz = meta.defaultTimeZone || "UTC";
  const locale = meta.locale || "en-US";

  const supported = ["overview", "itinerary", "lodging", "transport", "logistics", "dining", "reference"];
  const tabs = sections.filter((/** @type {any} */ s) => supported.includes(String(s.kind).toLowerCase()));

  const title = escapeHtml(meta.title || "Trip");
  const subtitle = escapeHtml(meta.subtitle || "");
  const tagline = escapeHtml(meta.tagline || "");
  const emoji = escapeHtml((t.presentation && t.presentation.heroEmoji) || "🧭");

  const start = meta.dateRange?.start || "";
  const end = meta.dateRange?.end || "";
  const nDays =
    typeof meta.dateRange?.dayCount === "number"
      ? meta.dateRange.dayCount
      : tripDayCount(start, end);
  const travelers = meta.travelers?.length
    ? escapeHtml(meta.travelers.join(" · "))
    : "";

  const tabButtons = tabs
    .map((/** @type {any} */ s) => {
      const slug = escapeHtml(String(s.slug));
      const label = escapeHtml(String(s.title || s.slug || "?"));
      return `<button type="button" class="nav-tab" data-trip-tab="${slug}" aria-selected="false" role="tab">${label}</button>`;
    })
    .join("\n");

  const sectionsHtml = tabs
    .map((/** @type {any} */ s) => {
      const slug = String(s.slug);
      switch (String(s.kind).toLowerCase()) {
        case "overview":
          return `<section id="sec-${escapeHtml(slug)}" data-trip-section="${escapeHtml(slug)}" class="section" hidden>${renderOverview(content)}</section>`;
        case "itinerary":
          return `<section id="sec-${escapeHtml(slug)}" data-trip-section="${escapeHtml(slug)}" class="section" hidden>${renderItinerary(
            content.dayPlans || {},
            placeById,
            locale,
            tz
          )}</section>`;
        case "lodging":
          return `<section id="sec-${escapeHtml(slug)}" data-trip-section="${escapeHtml(slug)}" class="section" hidden>${renderLodging(
            content.lodgingStays || [],
            placeById
          )}</section>`;
        case "transport":
          return `<section id="sec-${escapeHtml(slug)}" data-trip-section="${escapeHtml(slug)}" class="section" hidden>${renderTransport(
            content.transportSegments || [],
            placeById
          )}</section>`;
        case "logistics":
          return `<section id="sec-${escapeHtml(slug)}" data-trip-section="${escapeHtml(slug)}" class="section" hidden>${renderLogistics(
            collectAllTasks(content)
          )}</section>`;
        case "dining":
          return `<section id="sec-${escapeHtml(slug)}" data-trip-section="${escapeHtml(slug)}" class="section" hidden>${renderDining(
            content
          )}</section>`;
        case "reference":
          return `<section id="sec-${escapeHtml(slug)}" data-trip-section="${escapeHtml(slug)}" class="section" hidden>${renderReference(
            content.richPanels || {}
          )}</section>`;
        default:
          return "";
      }
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${escapeHtml(locale.slice(0, 2))}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#2c5282">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>${title}</title>
<link rel="stylesheet" href="./assets/styles.css">
<link rel="manifest" href="./manifest.json">
<link rel="icon" type="image/svg+xml" href="./assets/icon.svg">
</head>
<body>
<header class="hero">
  <div class="hero__emoji">${emoji}</div>
  <h1 class="hero__title">${title}</h1>
  ${subtitle ? `<p class="hero__subtitle">${subtitle}</p>` : ""}
  ${tagline ? `<p class="hero__tagline">${tagline}</p>` : ""}
  ${travelers ? `<p class="hero__subtitle" style="margin-top:.5rem">${travelers}</p>` : ""}
  ${start && end ? `<div class="hero__dates">📅 ${escapeHtml(start)} → ${escapeHtml(end)}${nDays ? ` · ${nDays} days` : ""}</div>` : ""}
</header>

<nav class="nav-tabs" role="tablist" aria-label="Trip sections">${tabButtons}</nav>

<div class="trip-sections">${sectionsHtml}</div>

<p class="footer-mini">TripPWA · TripTemplate schema ${escapeHtml(String(t.schemaVersion || "?"))}${meta.revision != null ? ` · rev ${escapeHtml(String(meta.revision))}` : ""}</p>

<script defer src="./assets/app.js"></script>
</body>
</html>`;
}

/** @param {Record<string,{introPlain?:string,bullets?:string[]}|undefined>} content */
function renderOverview(content) {
  const ov = content.overview;
  const intro = escapeHtml((ov?.introPlain || "").trim());
  const bullets = Array.isArray(ov?.bullets) ? ov.bullets : [];
  let html =
    `<h2 class="section-h">Overview</h2>` +
    `<p class="section--intro">${intro}</p>` +
    `<ul class="bullets section--intro">${bullets
      .map((b) => `<li>${escapeHtml(String(b || ""))}</li>`)
      .join("")}</ul>`;

  /* If template placed dining notes only in bullets, still renders */
  if (!intro && !bullets.length) {
    html = `<p class="empty-hint">No overview text in TripTemplate.</p>`;
  }
  return html;
}

/**
 * @param {Record<string,any>} dayPlans
 * @param {Record<string,{name:string}>} placeById
 */
function renderItinerary(dayPlans, placeById, locale, tz) {
  const keys = Object.keys(dayPlans).sort();
  if (!keys.length) {
    return `<p class="empty-hint section--intro">No day plans.</p>`;
  }
  let out = `<h2 class="section-h">Itinerary</h2><div class="timeline">`;
  keys.forEach((iso) => {
    const plan = dayPlans[iso] || {};
    const ord = typeof plan.dayOrdinal === "number" ? plan.dayOrdinal : keys.indexOf(iso) + 1;
    const summary = plan.summary || {};
    const title = escapeHtml(String(summary.title || iso));
    const primary = placeName(placeById, summary.primaryPlaceId);
    const dayLine = weekdayDate(iso, locale, tz);

    const id = `day-${escapeHtml(iso).replace(/\s/g, "-")}`;
    let body = "";

    /** @type {Record<string, any[]>} */
    const buckets = {};
    const items = Array.isArray(plan.scheduledItems) ? plan.scheduledItems : [];

    [...items].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)).forEach((si) => {
      const coarse = si.daySegmentCoarse ? String(si.daySegmentCoarse) : "_unset";
      if (!buckets[coarse]) buckets[coarse] = [];
      buckets[coarse].push(si);
    });

    const orderedKeys = SEGMENT_ORDER.filter((k) => buckets[k]?.length).concat(
      Object.keys(buckets).filter((k) => !SEGMENT_ORDER.includes(k || "") && k !== "_unset"),
      buckets._unset?.length ? ["_unset"] : []
    );

    orderedKeys.forEach((gk) => {
      const bis = buckets[gk];
      if (!bis?.length) return;
      body += `<div class="segment"><div class="segment__ttl">${escapeHtml(labelSegment(gk === "_unset" ? null : gk))}</div>`;
      bis.forEach((si) => {
        body += renderScheduledRow(si);
      });
      body += "</div>";
    });

    /* callouts */
    const cos = Array.isArray(plan.callouts) ? plan.callouts : [];
    cos.forEach((c) => {
      const variant = ["info", "warn", "danger", "ok"].includes(String(c.variant)) ? String(c.variant) : "info";
      body += `<div class="callout ${variant}">${c.icon ? `<span>${escapeHtml(String(c.icon))}</span>` : ""}<div>${escapeHtml(String(c.body || "")).replace(/\n/g, "<br>")}</div></div>`;
    });

    out += `
<article class="day-card" id="${id}">
<button type="button" class="day-header" data-toggle-day="${id}" aria-expanded="false">
  <div class="day-badge"><span>${ord}</span><span class="day-badge__lbl">DAY</span></div>
  <div class="day-meta">
    <div class="day-date-line">${escapeHtml(dayLine)}</div>
    <h2 class="day-title">${title}</h2>
    ${primary ? `<span class="day-place">${escapeHtml(primary)}</span>` : ""}
  </div>
  <span class="day-chevron" aria-hidden="true">›</span>
</button>
<div class="day-body">${body}</div>
</article>`;
  });

  out += "</div>";
  return out;

  /** @param {Record<string, any>} si */
  function renderScheduledRow(si) {
    const timeLabel = escapeHtml(String(si.timeLabel || si.timeWindow || ""));
    const titleTxt = escapeHtml(String(si.title || ""));
    const det = escapeHtml(String(si.detail || "")).trim();
    const labels = Array.isArray(si.labels) ? si.labels : [];

    /** @type {string[]} */
    const chips = [...labels];

    /** @deprecated */
    if (si.daySegmentFine)
      chips.push(String(si.daySegmentFine).replace(/([A-Z])/g, " $1").trim());

    const lblHtml = chips
      .slice(0, 8)
      .map((lbl) => `<span class="si-chip">${escapeHtml(lbl)}</span>`)
      .join("");
    let linkTxt = "";
    if (si.linkUrl) {
      const href = encodeURI(String(si.linkUrl));
      const ll = escapeHtml(String(si.linkLabel || "Open link"));
      linkTxt += `<div class="si-detail" style="margin-top:.25rem;"><a href="${href}" target="_blank" rel="noopener">${ll}</a></div>`;
    }
    const detailBlock = det ? `<div class="si-detail">${det.replace(/\n/g, "<br>")}</div>` : "";

    return `<div class="si"><div class="si-time">${timeLabel}</div><div class="si-dot" aria-hidden="true"></div>
<div class="si-body"><div class="si-title">${titleTxt}</div>${detailBlock}${lblHtml ? `<div class="si-labels">${lblHtml}</div>` : ""}${linkTxt}</div></div>`;
  }
}

/** @param {any[]} stays @param {Record<string,{name?:string}>} placeById */
function renderLodging(stays, placeById) {
  if (!stays.length) return `<h2 class="section-h">Lodging</h2><p class="empty-hint">No lodging stays.</p>`;

  /** @type {any[]} */
  const sorted = [...stays];
  sorted.sort((a, b) => String(a.checkInDate).localeCompare(String(b.checkInDate)));
  let h = `<h2 class="section-h">Lodging</h2><div class="card-list">`;
  sorted.forEach((s) => {
    const name = escapeHtml(String(s.name || ""));
    const pl = s.placeId ? placeName(placeById, String(s.placeId)) : "";
    const inD = escapeHtml(String(s.checkInDate || ""));
    const outD = escapeHtml(String(s.checkOutDate || ""));
    const conf = s.confirmation ? `<div class="info-meta">${escapeHtml(String(s.confirmation))}</div>` : "";
    const ch = s.bookingChannel ? `<div class="info-meta">${escapeHtml(String(s.bookingChannel))}</div>` : "";
    let notesHtml = "";
    if (Array.isArray(s.notes) && s.notes.length)
      notesHtml = `<div class="info-meta">${s.notes.map((n) => escapeHtml(String(n))).join("<br>")}</div>`;
    else if (s.notes != null && String(s.notes).trim())
      notesHtml = `<div class="info-meta">${escapeHtml(String(s.notes)).replace(/\n/g, "<br>")}</div>`;

    h += `<article class="info-card"><h3>${name}</h3>${pl ? `<div class="info-meta">${escapeHtml(pl)}</div>` : ""}${ch}<div class="info-meta">${inD} → ${outD}</div>${conf}${notesHtml}</article>`;
  });
  return h + "</div>";
}

/** @param {any[]} segments @param {Record<string,{name?:string}>} placeById */
function renderTransport(segments, placeById) {
  if (!segments.length) return `<h2 class="section-h">Transport</h2><p class="empty-hint">No transport segments.</p>`;

  /** @type {any[]} */
  const sorted = [...segments];
  sorted.sort((a, b) =>
    `${a.date}-${a.departTimeLocal||""}`.localeCompare(`${b.date}-${b.departTimeLocal||""}`)
  );

  let h = `<h2 class="section-h">Transport</h2><div class="card-list">`;
  sorted.forEach((tr) => {
    const lbl = escapeHtml(String(tr.label || tr.mode || "Segment"));
    const dateLine = escapeHtml(String(tr.date || ""));
    const dn = placeName(placeById, tr.departPlaceId ? String(tr.departPlaceId) : "");
    const an = placeName(placeById, tr.arrivePlaceId ? String(tr.arrivePlaceId) : "");
    const fromStation = escapeHtml(String(tr.departStation || ""));
    const toStation = escapeHtml(String(tr.arriveStation || ""));
    let routeBits = dn && an ? `${dn} → ${an}` : dn || an || "";
    if (!routeBits && fromStation && toStation)
      routeBits = `${fromStation} → ${toStation}`;
    else if (!routeBits && (fromStation || toStation))
      routeBits = [fromStation, toStation].filter(Boolean).join(" → ");
    const route = escapeHtml(routeBits);
    const dept = escapeHtml(String(tr.departTimeLocal || ""));
    const arrv = escapeHtml(String(tr.arriveTimeLocal || ""));
    const svc = escapeHtml(String(tr.serviceName || ""));
    const car = escapeHtml(String(tr.carrier || ""));
    const seat = tr.seatInfo ? `<div class="info-meta">${escapeHtml(String(tr.seatInfo))}</div>` : "";
    const conf = tr.confirmation ? `<div class="info-meta">${escapeHtml(String(tr.confirmation))}</div>` : "";
    const nt = tr.notes ? `<div class="si-detail">${escapeHtml(String(tr.notes))}</div>` : "";

    h += `<article class="info-card"><h3>${lbl}</h3>${car ? `<div class="info-meta">${car}${svc ? ` · ${svc}` : ""}</div>` : svc ? `<div class="info-meta">${svc}</div>` : ""}<div class="info-meta">${dateLine}${dept || arrv ? ` · ${dept}${arrv ? `–${arrv}` : ""}` : ""}</div>${route ? `<div class="info-meta">${route}</div>` : ""}${seat}${conf}${nt}</article>`;
  });
  return h + "</div>";
}

/** @param {any[]} tasks */
function renderLogistics(tasks) {
  if (!tasks.length) return `<h2 class="section-h">Logistics</h2><p class="empty-hint">No tasks recorded.</p>`;

  /** @type {any[]} */
  const sorted = [...tasks];
  sorted.sort((a, b) =>
    `${a.priority || "z"}-${a.dueDate || ""}`.localeCompare(`${b.priority || "z"}-${b.dueDate || ""}`)
  );

  let h = `<h2 class="section-h">Logistics & tasks</h2><div class="card-list">`;
  sorted.forEach((tk) => {
    const done = String(tk.state ?? tk.status).toLowerCase() === "done";
    const pr = tk.priority ? ` · ${escapeHtml(String(tk.priority))}` : "";
    const due = tk.dueDate ? ` · due ${escapeHtml(String(tk.dueDate))}` : "";
    h += `<div class="task${done ? " task--done" : ""}"><strong>${escapeHtml(String(tk.text || tk.title || "?"))}</strong><div class="info-meta">${pr}${due}</div></div>`;
  });
  return h + "</div>";
}

/** @param {Record<string, any>} content */
function renderDining(content) {
  const ovBullets =
    Array.isArray(content?.overview?.bullets) ?
      /** @type {string[]} */
      content.overview.bullets.filter(Boolean)
    : [];
  let h =
    `<h2 class="section-h">Food</h2><p class="section--intro">Meal cues often live inline on each itinerary day.<br>For cross-cutting reminders, reuse overview bullets:</p>`;
  if (ovBullets.length) {
    h += `<ul class="bullets section--intro">${ovBullets
      .map((b) => `<li>${escapeHtml(String(b))}</li>`)
      .join("")}</ul>`;
  } else {
    h += `<p class="empty-hint section--intro">No dedicated dining list in TripTemplate v1 fixtures.</p>`;
  }
  return h;
}

/** @param {Record<string,{format:string,body:string}|undefined>} richPanels */
function renderReference(richPanels) {
  const keys = Object.keys(richPanels || {});
  if (!keys.length) return `<h2 class="section-h">Reference</h2><p class="empty-hint">No rich panels.</p>`;

  let h = `<h2 class="section-h">Reference</h2><div class="card-list">`;
  keys.forEach((k) => {
    const p = richPanels[k];
    const body = escapeHtml(String(p?.body || "")).trim();
    const format = String(p?.format || "markdown");
    h += `<article class="info-card"><h3>${escapeHtml(k)}</h3><div class="md-body"${format === "markdown" ? ' data-kind="markdown"' : ""}>${body.replace(/\n/g, "<br>")}</div></article>`;
  });
  return h + "</div>";
}
