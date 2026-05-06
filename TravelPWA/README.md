# TravelPWA

Static **TripPWA** generator: one **TripTemplate** file (JSON or JSONC) becomes a self-contained folder under `dist/<slug>/`—HTML shell, installable manifest, service worker, and a normalized data snapshot.

No `npm install` is required for builds; only **Node.js** (with `node` on your PATH).

---

## How source templates relate to `dist/…/trip.json`

| | Source (authoring) | `dist/<slug>/trip.json` |
|---|-------------------|-------------------------|
| **What it is** | Your trip file under `trip-templates/examples/` (e.g. `*.jsonc`) or a generated `japan-2026-guide.json` | **Output** of the build: strict JSON, pretty-printed |
| **Comments** | JSONC allows `//` and `/* … */` in `.jsonc` | Comments are **not** copied over; only data survives |
| **Shape** | Often TripTemplate **v3** with `core` + `bundle` | **Normalized “flat” trip**: `normalizeTripDocument()` merges `core` + `bundle` into one object (e.g. top-level `meta`, `registry`, `content`, `sections`, `presentation`) that the HTML renderer expects |

So **`trip.json` is not a verbatim copy of the `.jsonc`**. It is the **canonical trip payload after parsing and normalization**—the same object `build-trip.mjs` uses to render `index.html`. If you change only the source file, `dist/…/trip.json` stays stale until you run a build.

**Optional debugging:** open `trip.json` in the dist folder to inspect exactly what the PWA was built from (including any inferred defaults—see build stderr).

---

## When a template changes: how to regenerate the PWA

1. **Edit** the source file (e.g. `trip-templates/examples/lisbon-long-weekend-3d.jsonc`).
2. **Rebuild** from the `TravelPWA` directory (pick one):

   **One example (fast iteration)**  
   Set `TRIP_TEMPLATE` (path relative to `TravelPWA/`) and `TRIP_SLUG` (folder name under `dist/`):

   ```bash
   TRIP_TEMPLATE=trip-templates/examples/lisbon-long-weekend-3d.jsonc \
   TRIP_SLUG=lisbon-long-weekend-3d \
   node scripts/build-trip.mjs
   ```

   **All bundled examples** (Lisbon, Canadian Rockies, Vietnam, Japan):

   ```bash
   npm run build
   ```
   equivalent to `node scripts/build-all.mjs`.

3. **Preview** over **HTTP** (not `file://`) so the service worker can register—see [Preview](#preview).
4. After a rebuild, **hard-refresh** or clear site data if an old service worker keeps serving cached assets during development.

There is no separate “sync” step: **`trip.json`, `index.html`, `manifest.json`, `sw.js`, and `assets/*` are all rewritten** each time `build-trip.mjs` runs for that slug.

---

## Japan 2026 guide (special pipeline)

Japan is built from **`trip-templates/examples/japan-2026-guide.json`** (not a hand-edited `.jsonc` for the full guide). That JSON is assembled from extracted HTML.

The full Japan pipeline expects **`Japan2026-Guide.html`** at the **repository root** (parent of `TravelPWA/`), as used by `extract-japan-html.mjs` / `extract-japan-assets.mjs`.

- **Rebuild Japan only from existing JSON** (after `japan-2026-guide.json` is already updated):

  ```bash
  TRIP_TEMPLATE=trip-templates/examples/japan-2026-guide.json \
  TRIP_SLUG=japan-2026-guide \
  node scripts/build-trip.mjs
  ```

- **Full refresh from source HTML / theme assets** (re-extract, re-assemble, rebuild):

  ```bash
  npm run build:japan
  ```

That script runs `extract-japan-html.mjs` → `assemble-japan-guide.mjs` → `extract-japan-assets.mjs` → `build-trip.mjs` for `japan-2026-guide`.

---

## Build-time notes

- **JSONC:** `.jsonc` files are read with `strip-json-comments.mjs` (no external package).
- **v3 `core` / `bundle`:** If the document uses `core` and `bundle`, the builder flattens them before rendering. Missing bundle pieces (e.g. default tabs or `daySegmentBands`) may be filled in; watch **stderr** for lines like `[TripPWA] Inferred defaults…`.
- **Themes:** `presentation.themeId === "japan-2026"` selects the Japan CSS/JS theme; other trips use `src/styles.css` and `src/app.js`.

---

## Preview

Service workers need a real origin (HTTP/HTTPS):

```bash
cd TravelPWA
python3 -m http.server 8765
```

Then open (adjust port if needed):

- http://127.0.0.1:8765/dist/lisbon-long-weekend-3d/index.html  
- http://127.0.0.1:8765/dist/canadian-rockies-5d/index.html  
- http://127.0.0.1:8765/dist/vietnam-central-coast-7d/index.html  
- http://127.0.0.1:8765/dist/japan-2026-guide/index.html  

Installing as a PWA works best from the same origin you use day-to-day (many browsers treat `localhost` and `127.0.0.1` subtly differently for install prompts).

---

## Project layout

| Path | Role |
|------|------|
| `trip-templates/TripTemplate.v3.reference.jsonc` | Annotated **v3** reference (`core` + `bundle`) |
| `trip-templates/examples/*.jsonc` | Example fixtures (default shell) |
| `trip-templates/examples/japan-2026-guide.json` | Japan guide (assembled JSON) |
| `scripts/build-trip.mjs` | Single-trip build: read template → normalize → write `dist/<slug>/` |
| `scripts/build-all.mjs` | Builds every listed example |
| `scripts/normalize-trip.mjs` | v3 merge + defaults + task collection helpers |
| `scripts/render-html.mjs` | `index.html` generator |
| `scripts/strip-json-comments.mjs` | JSONC → JSON parse helper |
| `src/styles.css`, `src/app.js` | Default trip shell (tabs, day accordion, SW registration) |
| `src/themes/japan-2026.css`, `japan-app.js` | Japan-specific UI |
| `dist/<slug>/` | **Generated** site (safe to delete; regenerate with build) |

---

## npm scripts (reference)

| Script | What it runs |
|--------|----------------|
| `npm run build` | All examples → `dist/*` |
| `npm run build:trip` | **Requires env:** `TRIP_TEMPLATE` and `TRIP_SLUG` (same as `node scripts/build-trip.mjs`) |
| `npm run build:japan` | Full Japan extract + assemble + assets + single trip build |

---

## Quick “how to use” checklist

1. Copy or author a trip under `trip-templates/` (see v3 reference for structure).
2. Run `build-trip.mjs` with the correct `TRIP_TEMPLATE` and `TRIP_SLUG`.
3. Serve `TravelPWA/` over HTTP and open `dist/<slug>/index.html`.
4. Treat **`dist/` as build output**—edit sources under `trip-templates/`, then rebuild.
