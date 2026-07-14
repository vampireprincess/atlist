# Project Overview

## Purpose

Atlist is a private, single-user visual editor for building highly customized interactive Google Maps and exporting them as production-ready, self-contained bundles that can be hosted on any client website.

It is **not** a SaaS. There are no accounts, subscriptions, or shared servers. Every project lives in the browser's local storage; the owner brings their own Google Cloud project and API keys.

## High-level architecture

```
┌────────────────────────────────────────────────────────────┐
│                         React UI                            │
│  ┌───────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  TopBar   │  │   MapCanvas     │  │  RightInspector  │  │
│  │           │  │  (Google Maps)  │  │  (contextual)    │  │
│  ├───────────┼──┴──────┬──────────┴──┴──────────────────┤  │
│  │ LeftPanel (Project, Map, Locations, Markers, ...)     │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │  Zustand store     │  ← undo/redo history
                    │  (projectStore.ts) │
                    └─────────┬──────────┘
                              │
              ┌───────────────┼────────────────┐
              │               │                │
        localStorage    Google Maps      Export pipeline
        (projects,      (loader,         (standalone/single
         assets,         Advanced         HTML/embed/React)
         API cfg)        Markers)
```

- **State**: A single Zustand store holds the current `Project`, the loaded `Asset[]`, `ApiConfig`, `Selection`, UI mode (device, test mode, active panel) and `History`.
- **Persistence**: `localStorage` under versioned keys (`atlist.project.v1.*`, `atlist.assets.v1.*`, `atlist.api.v1`). Assets are stored separately from project JSON so that (a) undo/redo never destroys uploaded files, and (b) the project JSON stays small enough for quick imports/exports.
- **Google Maps**: initialized once per API key; libraries are loaded on demand via `importLibrary('maps' | 'marker' | 'geocoding' | 'places')`. No legacy `Marker` — Advanced Markers only.
- **Export pipeline** (`src/export/`): a pure function that takes `(Project, Asset[], ExportConfig)` and returns a list of `ExportedFile { path, content }` objects. The client runtime (`runtime.ts`) is a plain-JS string with **zero build-time dependencies** — it can be inlined into a single HTML file or shipped as `map.js`.

## Technologies

| Purpose            | Choice                                    |
|--------------------|-------------------------------------------|
| UI                 | React 18 + TypeScript                     |
| Build              | Vite 5                                    |
| Styling            | Tailwind CSS 3 (`dark` mode)              |
| State              | Zustand 4                                 |
| Maps loader        | `@googlemaps/js-api-loader` (`weekly`)    |
| Markers            | `google.maps.marker.AdvancedMarkerElement`|
| IDs                | `nanoid`                                  |
| Persistence        | `localStorage` (IndexedDB planned for v2) |

## Google API dependencies

The editor uses:
- **Maps JavaScript API** — required.
- **Marker library** (`importLibrary('marker')`) — required for Advanced Markers.
- **Geocoding API** — used when you "Add by address" in the Locations panel.
- **Places API (New)** — used by the "Google Places search" quick-add.

The exported client runtime uses only Maps + Marker libraries. It does not call Geocoding/Places unless the exported map does something that needs them.

## Cost-sensitive features (billable Google APIs)

| Feature                                | Panel        | API                    | Notes                                        |
|----------------------------------------|--------------|------------------------|----------------------------------------------|
| Add location by address (Geocode)      | Locations    | Geocoding              | 1 request per address                        |
| Google Places search quick-add         | Locations    | Places (New)           | 1 text-search request per query              |
| Driving/walking/bicycling/transit routes | Routes    | Directions             | Phase 3                                      |
| Places-based popup content             | Popups       | Places                 | Phase 3 (currently no Places calls in popups)|

The UI marks these actions with an inline "billable" note.

## Directory structure

```
src/
├── App.tsx                        Root component + global shortcuts
├── main.tsx                       React bootstrap
├── styles/index.css               Tailwind entry + component classes
├── types/index.ts                 All shared domain types
├── lib/
│   ├── defaults.ts                Default map/marker/popup/… factories
│   ├── gmaps.ts                   Modular Google Maps loader
│   ├── id.ts                      nanoid wrapper
│   ├── lookup.ts                  Marker/popup template lookup helpers
│   └── storage.ts                 localStorage-backed persistence
├── store/
│   ├── history.ts                 Undo/redo stack (project snapshots)
│   └── projectStore.ts            Zustand store + all mutations
├── export/
│   ├── exporter.ts                Build standalone/single-HTML/embed/React exports
│   └── runtime.ts                 The vanilla-JS runtime shipped to clients
└── ui/
    ├── canvas/                    MapCanvas, CanvasOverlay, PopupPreview, markerRenderer
    ├── common/                    Toasts, small primitives
    ├── dialogs/                   ApiSetupDialog, ProjectPicker
    ├── inspectors/                Right-panel inspectors (Location, Marker, Popup, …)
    ├── layout/                    TopBar, LeftPanel, RightInspector, EditorLayout
    └── panels/                    Left-panel screens (Project, Map, Locations, Markers, …)
```

## Data model (summary)

The top-level `Project` (see `src/types/index.ts`) contains:

- `mapSettings` — center, zoom, min/max zoom, controls, gestures, tilt, per-device overrides
- `categories`, `locations`, `markerTemplates`, `popupTemplates`
- `animations`, `interactions` — Phase 2 (schema present, editor UI coming)
- `routes`, `shapes`, `overlays`, `layers` — Phase 3 (schema present)
- `sidebar`, `search`, `legend`, `filters`, `clustering`
- `globalStyles`, `localization`, `analytics`, `customCode`

Assets are stored **separately** from the project object in a parallel `atlist.assets.v1.<projectId>` key. They are never touched by undo/redo.

## Export format

Standalone export produces:
- `index.html` — loads `styles.css`, `map-data.js`, `map.js`
- `styles.css` — layout + custom project CSS
- `map.js` — the vanilla-JS runtime (from `src/export/runtime.ts`)
- `map-data.js` — `window.ATLIST_DATA = { config, project, assets }`
- `map-data.json` — same data, for reference
- `README.md` — client-facing setup notes

Single-HTML export inlines everything into one file.
Embed export adds an `EMBED_SNIPPET.html` alongside the standalone folder.
React export produces one `AtlistMap.jsx` file that includes the runtime as a string.

## Architectural decisions

1. **Advanced Markers only.** No fallback to `google.maps.Marker`, which Google has marked deprecated. Requires a Map ID on every map (enforced by the "export readiness" check).
2. **Assets separated from Project.** Ensures undo/redo can't delete uploaded files and keeps project JSON small.
3. **Runtime as a plain string.** `runtime.ts` exports one big JS string. This gives us zero coupling between the editor's React tree and the exported map — the export never depends on React, Zustand or Tailwind being available on the client site.
4. **API key never hardcoded.** Keys are user-input only, stored in `localStorage`. The build has no `.env` for keys.
5. **Zustand over Redux.** Small footprint, minimal boilerplate for the ~20 mutation actions.
6. **No JSZip.** Standalone export returns loose files that the UI streams as separate downloads. This keeps the bundle smaller and avoids a native-ish dependency for something the user can also drag into a folder manually.

## Phased plan

See [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md) for a live checklist.

- **Phase 1 — functional core (✅ implemented)**
- **Phase 2 — advanced design (⏳ next)**
- **Phase 3 — advanced maps & export (⏳ later)**

## Known limitations (current build)

- The map "Add by address" and "Google Places search" require the Geocoding API and Places API (New) to be enabled on the editor key.
- Advanced Markers do not render if no Map ID is configured — the map will still load but markers will be invisible. The Overview panel warns about this.
- Undo/redo captures the whole project on every mutation. This is fine for typical project sizes but may feel slow with 5000+ locations — will move to structural diffs in Phase 2.
- Popup preview in Test Mode uses a manual pixel calculation for positioning instead of Google's OverlayView. Works but is not sub-pixel accurate at extreme zooms. Export uses the real `InfoWindow`.
- No IndexedDB yet — 5–10 MB local storage cap applies. The Overview panel shows current usage.
