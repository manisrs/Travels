/**
 * Merges TripTemplate v3 { core, bundle? } into the legacy flat shape consumed by
 * TripPWA renderers and static build. Records defaults applied for logging.
 */

const DEFAULT_DAY_BANDS = {
  morning: { startMinute: 330, endMinute: 720 },
  afternoon: { startMinute: 720, endMinute: 1020 },
  evening: { startMinute: 1020, endMinute: 1290 },
  night: { wraps: true, startMinute: 1290, endMinute: 330 },
};

const DEFAULT_SECTIONS = [
  { id: "sec-o", slug: "overview", kind: "overview", title: "Overview" },
  { id: "sec-i", slug: "itinerary", kind: "itinerary", title: "Itinerary" },
  { id: "sec-l", slug: "lodging", kind: "lodging", title: "Lodging" },
  { id: "sec-t", slug: "transport", kind: "transport", title: "Transport" },
  { id: "sec-g", slug: "logistics", kind: "logistics", title: "Logistics" },
  { id: "sec-d", slug: "dining", kind: "dining", title: "Food" },
  { id: "sec-r", slug: "reference", kind: "reference", title: "Reference" },
];

/**
 * @param {Record<string, unknown>} pres
 * @param {{ path: string, reason: string, defaultValue: string }[]} inferences
 */
function normalizePresentation(pres, inferences) {
  const p =
    pres && typeof pres === "object" && !Array.isArray(pres)
      ? /** @type {Record<string, unknown>} */ ({ ...pres })
      : {};
  const theme = p.theme && typeof p.theme === "object" ? /** @type {any} */ (p.theme) : null;
  if (theme?.id && !p.themeId) {
    p.themeId = theme.id;
  }
  if (p.themeId == null || p.themeId === "") {
    p.themeId = "default";
    inferences.push({
      path: "bundle.presentation.themeId",
      reason: "missing or empty",
      defaultValue: "default",
    });
  }
  if (!p.daySegmentBands || typeof p.daySegmentBands !== "object") {
    p.daySegmentBands = { ...DEFAULT_DAY_BANDS };
    inferences.push({
      path: "bundle.presentation.daySegmentBands",
      reason: "missing",
      defaultValue: "standard morning/afternoon/evening/night bands",
    });
  }
  if (p.heroEmoji == null && (!p.hero || typeof p.hero !== "object" || !/** @type {any} */ (p.hero).emoji)) {
    p.heroEmoji = "🗺️";
    inferences.push({
      path: "bundle.presentation.heroEmoji",
      reason: "missing",
      defaultValue: "🗺️",
    });
  }
  return p;
}

/**
 * @param {unknown} doc
 * @returns {{ trip: Record<string, unknown>, inferences: { path: string, reason: string, defaultValue: string }[] }}
 */
export function normalizeTripDocument(doc) {
  /** @type {{ path: string, reason: string, defaultValue: string }[]} */
  const inferences = [];

  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    throw new Error("Trip document must be a non-null object");
  }

  /** @type {Record<string, unknown>} */
  const d = /** @type {Record<string, unknown>} */ (doc);

  if (d.core != null && typeof d.core === "object" && !Array.isArray(d.core)) {
    const core = /** @type {Record<string, unknown>} */ (d.core);
    const bundle =
      d.bundle != null && typeof d.bundle === "object" && !Array.isArray(d.bundle)
        ? /** @type {Record<string, unknown>} */ (d.bundle)
        : null;

    let sections = bundle?.sections;
    if (!Array.isArray(sections) || sections.length === 0) {
      sections = DEFAULT_SECTIONS;
      inferences.push({
        path: "bundle.sections",
        reason: "missing or empty",
        defaultValue: "default 7-tab shell (overview … reference)",
      });
    }

    let presentation = bundle?.presentation;
    if (presentation == null || typeof presentation !== "object" || Array.isArray(presentation)) {
      presentation = { themeId: "default", heroEmoji: "🗺️", daySegmentBands: { ...DEFAULT_DAY_BANDS } };
      inferences.push({
        path: "bundle.presentation",
        reason: "missing",
        defaultValue: "themeId default + standard hero + daySegmentBands",
      });
    }

    const registry =
      core.registry != null && typeof core.registry === "object" && !Array.isArray(core.registry)
        ? /** @type {Record<string, unknown>} */ ({ ...core.registry })
        : { places: [], assets: [] };
    if (!Array.isArray(registry.places)) registry.places = [];
    if (!Array.isArray(registry.assets)) registry.assets = [];
    if (!Array.isArray(registry.logistics)) registry.logistics = [];

    const extensions =
      core.extensions != null && typeof core.extensions === "object"
        ? core.extensions
        : d.extensions != null && typeof d.extensions === "object"
          ? d.extensions
          : {};

    const trip = {
      schemaVersion: d.schemaVersion ?? "3.0.0",
      meta: core.meta ?? {},
      registry,
      content: core.content != null && typeof core.content === "object" ? core.content : {},
      extensions,
      sections,
      presentation: normalizePresentation(
        /** @type {Record<string, unknown>} */ (presentation),
        inferences
      ),
    };

    return { trip, inferences };
  }

  /** Legacy flat v1/v2 */
  const trip = { ...d };
  if (trip.registry == null || typeof trip.registry !== "object") {
    trip.registry = { places: [], assets: [] };
  } else {
    trip.registry = { .../** @type {object} */ (trip.registry) };
    if (!Array.isArray(/** @type {any} */ (trip.registry).places))
      /** @type {any} */ (trip.registry).places = [];
    if (!Array.isArray(/** @type {any} */ (trip.registry).assets))
      /** @type {any} */ (trip.registry).assets = [];
    if (!Array.isArray(/** @type {any} */ (trip.registry).logistics))
      /** @type {any} */ (trip.registry).logistics = [];
  }
  if (trip.content == null || typeof trip.content !== "object") {
    trip.content = {};
  }
  if (!Array.isArray(trip.sections) || trip.sections.length === 0) {
    trip.sections = DEFAULT_SECTIONS;
    inferences.push({
      path: "sections",
      reason: "missing or empty on legacy document",
      defaultValue: "default 7-tab shell",
    });
  }
  trip.presentation = normalizePresentation(
    trip.presentation != null && typeof trip.presentation === "object"
      ? /** @type {Record<string, unknown>} */ (trip.presentation)
      : {},
    inferences
  );

  return { trip, inferences };
}

/**
 * Trip-level tasks plus per-day tasks (v3). Used by HTML logistics tab.
 * @param {any} content
 * @returns {any[]}
 */
export function collectAllTasks(content) {
  if (!content || typeof content !== "object") return [];
  const out = [];
  const top = content.tasks;
  if (Array.isArray(top)) {
    for (const t of top) {
      if (t && typeof t === "object") out.push({ ...t });
    }
  }
  const dayPlans = content.dayPlans;
  if (dayPlans && typeof dayPlans === "object") {
    for (const [dayKey, day] of Object.entries(dayPlans)) {
      const dayTasks = day && typeof day === "object" ? /** @type {any} */ (day).tasks : null;
      if (!Array.isArray(dayTasks)) continue;
      for (const t of dayTasks) {
        if (!t || typeof t !== "object") continue;
        const copy = { ...t };
        if (copy.relatedDayKey == null) copy.relatedDayKey = dayKey;
        out.push(copy);
      }
    }
  }
  return out;
}
