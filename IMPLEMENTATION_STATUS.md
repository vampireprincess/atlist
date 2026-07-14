# Implementation Status

Legend: ✅ done · 🟡 partial · ⏳ planned · ❌ not started

_Last updated: 2026-07-14_

## Phase 1 — Functional core

| Feature                                        | Status | Notes                                                            |
|------------------------------------------------|--------|------------------------------------------------------------------|
| API key + Map ID setup dialog                  | ✅     | Editor + separate export keys                                    |
| Project manager (list, create, rename, delete) | ✅     | With duplicate, import, export, search, sort, tags               |
| LocalStorage persistence + autosave            | ✅     | 15 s autosave, `Ctrl+S` manual save, dirty indicator             |
| Undo / redo                                    | ✅     | Ctrl+Z / Ctrl+Shift+Z, 60 steps, does not touch assets           |
| Google Maps canvas (Advanced Markers)          | ✅     | Modular loader, on-demand `importLibrary`                        |
| Map settings panel                             | ✅     | Center, zoom range, controls, gestures, map type, Map ID         |
| Responsive per-device center/zoom overrides    | ✅     | Desktop / tablet / mobile                                        |
| Add location on map                            | ✅     | Click-to-place with Esc to cancel                                |
| Add location by coordinates                    | ✅     |                                                                  |
| Add location by address (Geocoding)            | ✅     | Billable — flagged in UI                                         |
| Add location via Places search                 | ✅     | Billable — flagged in UI                                         |
| Drag markers                                   | ✅     | Disabled in Test Mode                                            |
| Location inspector                             | ✅     | Name, address, coords, categories, description, buttons, images  |
| Marker templates (pin/emoji/text/image/svg/html) | ✅   | Width, height, scale, rotation, opacity, border, badge, label    |
| Popup templates + block editor                 | ✅     | Title/subtitle/text/image/gallery/address/hours/phone/email/button/badge/divider/html |
| Popup preview (Test Mode)                      | ✅     | Click marker in Test Mode                                        |
| Categories (colors, per-category defaults)     | ✅     |                                                                  |
| Filters (in exported map)                      | ✅     | Category pills, AND/OR logic, clear all, counts                  |
| Sidebar (in exported map)                      | ✅     | List of locations, search, filter chips, click-to-focus          |
| Assets library                                 | ✅     | Upload SVG/PNG/JPG/WebP/GIF/JSON/CSV, preview, usage count       |
| Import CSV                                     | ✅     |                                                                  |
| Import JSON / GeoJSON                          | ✅     |                                                                  |
| Import project JSON                            | ✅     |                                                                  |
| Export standalone (folder)                     | ✅     | index.html + styles.css + map.js + map-data.js + README          |
| Export single HTML                             | ✅     | Everything inlined                                               |
| Export embed snippet                           | ✅     |                                                                  |
| Export React component                         | ✅     | Self-contained `AtlistMap.jsx` file                              |
| Export config wizard (client name, key, …)     | ✅     | Inside Export panel                                              |
| Export readiness checker                       | ✅     | In Export panel + Overview panel                                 |
| Global styles (font, colors, radius, CSS)     | ✅     |                                                                  |
| Localization (default locale + strings)        | 🟡     | Schema + `en` bundle shipped; UI to edit other locales in Phase 3 |
| Analytics (GA4 or custom callback)             | ✅     | Off by default; wired into runtime for popup_open, filter_toggle |
| Test Mode                                      | ✅     | Disables dragging, enables popup preview on marker click         |
| Device preview (desktop/tablet/mobile)         | ✅     | Constrains canvas width                                          |
| Overview / validation                          | ✅     | Duplicate coords, invalid coords, missing Map ID, storage usage  |

## Phase 2 — Advanced design (⏳ planned)

| Feature                     | Status | Schema exists |
|-----------------------------|--------|---------------|
| SVG color editor            | ⏳     | via marker template |
| Marker state overrides (hover/active/selected) | 🟡 | Types exist; UI Phase 2 |
| Animation library (30+ presets) | ⏳ | Full schema in `types/Animation` |
| Random Variation            | ⏳     | Schema present            |
| `prefers-reduced-motion`    | ✅     | Global CSS respects it    |
| Interaction Builder (triggers + actions) | ⏳ | Full schema in `types/Interaction` |
| Popup Designer drag-and-drop | 🟡    | Add/remove/reorder blocks works; drag-and-drop reordering Phase 2 |
| Sidebar Designer (visual cards) | ⏳ | Basic sidebar renders in export |
| Marker clustering            | ⏳    | Schema present            |
| Responsive editor (per-mode marker/popup sizes) | 🟡 | Center/zoom overrides work today |
| Templates & presets library  | ⏳    |                            |
| Layer Manager (advanced)     | 🟡    | Basic show/hide toggles work |

## Phase 3 — Advanced maps & export (⏳ planned)

| Feature                        | Status | Schema exists |
|--------------------------------|--------|---------------|
| Routes & lines (with Directions) | ⏳    | Full schema     |
| Polygons / circles / rectangles / GeoJSON | ⏳ | Full schema |
| Data visualization (choropleth, bubbles, deck.gl module) | ⏳ | Types placeholder |
| Decorative overlays (badges, logos, floating panels) | ⏳ | Full schema |
| WordPress / Elementor export   | ⏳     | Standalone export already works inside Elementor HTML widget |
| Localization UI (edit locales) | ⏳     | Runtime supports it |
| Custom code editor UI          | 🟡     | Custom CSS field ships; JS hooks Phase 3 |
| Performance validator          | 🟡     | Basic checks in Overview panel |
| Command palette + shortcuts UI | ⏳     | Save/undo/redo/escape shortcuts already work |
| Screenshot preview             | ⏳     |                            |
| Broken-link checker            | ⏳     |                            |

## Accessibility

| Item                          | Status |
|-------------------------------|--------|
| Keyboard focus rings          | ✅ (global CSS) |
| Popup ARIA labels             | ✅     |
| `prefers-reduced-motion`      | ✅     |
| Escape closes overlays        | ✅     |
| Screen-reader friendly marker titles | ✅  |
| Full tab-order audit          | ⏳     |
| Color contrast audit          | ⏳     |

## Performance

| Item                              | Status |
|-----------------------------------|--------|
| Modular Google library loading    | ✅     |
| Marker diffing (no full re-render) | ✅   |
| Manual chunk split (vendor/maps)  | ✅     |
| Debounced search                  | ⏳ (naive `oninput` for now) |
| Cluster support                   | ⏳ (Phase 2)                 |
| Error boundaries                  | 🟡 (dialog-level try/catch)  |

## Known issues

- Popup preview positioning uses a bounds-based calculation instead of a proper `OverlayView`. Real exported maps use `InfoWindow` which is accurate.
- The React export (`AtlistMap.jsx`) uses `React.createElement` without importing `React` — this only works in classic-JSX host apps. Fix planned in Phase 3.
- No automated test suite yet. Manual smoke-tested flows: project create → add location → edit → save → reload → export → preview.
