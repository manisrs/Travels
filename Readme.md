# Travel

Personal travel planning repo: **TripTemplate**-backed data and a static **TripPWA** generator.

## Goals

- Ship as a **Progressive Web App** so trips can be opened on iPhone or Android (**Add to Home Screen**).
- **Mobile-first**: plain HTML, CSS, and JavaScript in the built output.
- **Offline-capable** after install: the service worker caches core assets so content is available without Wi‑Fi or cellular (within cache limits).

## TripPWA (build & ready-to-serve output)

All generator code, example trips, and **prebuilt sites** live under **`TravelPWA/`**.

- **Authoring / reference shape:** `TravelPWA/trip-templates/` (including `TripTemplate.v3.reference.jsonc` — single canonical copy).
- **Built PWAs (ready to serve):** `TravelPWA/dist/<slug>/` — `index.html`, `manifest.json`, `sw.js`, `trip.json`, `assets/*`.
- **How to rebuild or preview:** see **`TravelPWA/README.md`**.

To serve locally (from `TravelPWA/`):

```bash
python3 -m http.server 8765
```

Then open e.g. `http://127.0.0.1:8765/dist/lisbon-long-weekend-3d/index.html` (use **http**, not `file://`, so the service worker can register).

Regenerate all example `dist/` folders after editing templates:

```bash
cd TravelPWA && npm run build
```
