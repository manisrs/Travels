# Trip templates (TripTemplate v1)

## Files

| File | Role |
|------|------|
| `TripTemplate.v1.reference.jsonc` | Annotated exemplar documenting sections, substructures, enums, and authoring intent. Consume with a JSONC-capable loader or strip comments for strict JSON parsers. |
| `examples/*.jsonc` | Fixture trips for codegen and QA (strict JSON-compatible content). |
| `examples/japan-2026-guide.json` | **Japan 2026** — uses `presentation.themeId: "japan-2026"` and **`content.verbatimJapan`** for pixel-faithful SSR from **`Japan2026-Guide.html`**. |

## Japan 2026 bundle

Rebuild whenever **`Japan2026-Guide.html`** (repo root) changes:

```bash
cd TravelPWA && npm run build:japan
```

Output: **`dist/japan-2026-guide/`** (same UX as the static guide: itinerary / trains / hotels / luggage / food + modals).

## Approach A — one TripPWA build per slug

TripPWA source is **generic**; each **build** points at **one** template file and emits a **scoped** bundle (recommended output layout):

- `../dist/lisbon-long-weekend-3d/`
- `../dist/canadian-rockies-5d/`
- `../dist/vietnam-central-coast-7d/`

Use **manifest** `name` / `short_name` derived from `meta.title` + duration so installed icons do not collide on a device.

### Build (from `TravelPWA/` root)

```bash
node scripts/build-all.mjs
# or one trip:
TRIP_TEMPLATE=trip-templates/examples/lisbon-long-weekend-3d.jsonc TRIP_SLUG=lisbon-long-weekend-3d node scripts/build-trip.mjs
```

No `npm install` is required (JSONC comments use a vendored stripper).

### Preview

`file://` works for layout, but **service worker registration** needs HTTP. From `TravelPWA/`:

```bash
python3 -m http.server 8765
```

Then open e.g. `http://127.0.0.1:8765/dist/lisbon-long-weekend-3d/index.html`.

Japan: `http://127.0.0.1:8765/dist/japan-2026-guide/index.html`

## Example slugs (testing)

| Slug | Duration | `meta.id` |
|------|----------|-----------|
| `lisbon-long-weekend-3d` | 3 calendar days | `lisbon-long-weekend-3d` |
| `canadian-rockies-5d` | 5 calendar days | `canadian-rockies-5d` |
| `vietnam-central-coast-7d` | 7 calendar days | `vietnam-central-coast-7d` |
| `japan-2026-guide` | 12 on-trip days (+ hero range) | `japan-2026-guide` |

All dates and confirmation codes are **fictitious** unless you replace them for a real voyage.
