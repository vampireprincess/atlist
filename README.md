# Atlist — Visual Google Maps Editor

Private visual editor for creating advanced interactive Google Maps and exporting them as production-ready code for client websites. Inspired by tools like Atlist, but original and fully self-hosted.

**Owner-only.** No SaaS, accounts, or billing. You bring your own Google Maps API key.

## Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- Zustand (state)
- Google Maps JavaScript API via `@googlemaps/js-api-loader` with modular `importLibrary`
- Google Advanced Markers (no deprecated APIs)
- LocalStorage persistence (projects + assets)

## Quick start

```bash
npm install
npm run dev
```

On first launch you will be asked for:

- **Editor API key** — used only inside this editor
- **Editor Map ID** — required for Advanced Markers and cloud-styled maps
- **Export API key + Map ID** — the keys that get embedded into the exported client bundles

Keys are stored in your browser's `localStorage` only. Nothing is sent to any server.

Follow [`GOOGLE_MAPS_SETUP.md`](./GOOGLE_MAPS_SETUP.md) if you need to create a key and a Map ID.

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build (`tsc -b && vite build`)
- `npm run typecheck` — TypeScript check only
- `npm run lint` — ESLint

## Documentation

- [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md) — architecture, feature list, roadmap
- [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md) — live per-feature status
- [`GOOGLE_MAPS_SETUP.md`](./GOOGLE_MAPS_SETUP.md) — how to get keys, Map ID, cost controls
- [`EXPORT_GUIDE.md`](./EXPORT_GUIDE.md) — export formats and how to give a map to a client
- [`CHANGELOG.md`](./CHANGELOG.md)

## Status

- ✅ **Phase 1** (functional core): implemented — project manager, Google Maps canvas, Advanced Markers, marker/popup editors, categories, assets, import/export, undo/redo
- ⏳ **Phase 2** (advanced design): SVG editor, animation library, Interaction Builder, sidebar builder, clustering, responsive editor, templates, Layer Manager
- ⏳ **Phase 3** (advanced maps & export): routes, shapes, GeoJSON, data viz, decorative overlays, WordPress/Elementor/React exports, localization, analytics hooks, performance validator

## License

Private, unlicensed. Not for redistribution.
