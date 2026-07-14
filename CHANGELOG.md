# Changelog

All notable changes to Atlist are documented here.

## [Unreleased]

## [0.1.0] — 2026-07-14

Initial Phase 1 implementation.

### Added

- Project scaffold: Vite 5 + React 18 + TypeScript + Tailwind CSS 3.
- API key + Map ID setup dialog with security notice.
- Project Manager with new/open/duplicate/rename/delete/import/export/search/sort/tags.
- LocalStorage persistence for projects, assets (kept in a separate key so undo/redo does not delete them), and API config.
- Autosave every 15 s, manual save with `Ctrl+S`, dirty indicator, unsaved-changes browser warning.
- Undo / redo (`Ctrl+Z`, `Ctrl+Shift+Z`) with 60-step history.
- Editor layout: top bar, icon left nav + panel, Google Maps canvas, contextual right inspector.
- Google Maps canvas with modular loader (`importLibrary`).
- Advanced Markers with pin / emoji / text / image / SVG / HTML variants and diff-based rendering.
- Add locations by click on map, by address (Geocoding), by coordinates, or via Places search — with billable warnings.
- Location inspector with full editing (name, address, coords, categories, tags, buttons, images, contact, hours).
- Marker template editor with size/scale/rotation/opacity/anchor/z-index/label/badge.
- Popup template editor with reorderable content blocks (title, subtitle, text, image, gallery, address, hours, phone, email, button, badge, divider, custom HTML).
- Popup preview in Test Mode (click a marker to see it).
- Categories with colors and per-category default marker templates.
- Assets library (SVG/PNG/JPG/WebP/GIF/JSON/CSV upload, preview, usage counter).
- Import from CSV, JSON, GeoJSON, or Atlist project JSON.
- Map settings: center, zoom range, controls, gestures, map type, per-project Map ID.
- Responsive per-device center/zoom overrides.
- Sidebar / search / filter settings that render in the exported map.
- Legend settings (populate from categories).
- Global styles (font, palette, radius, custom CSS).
- Export pipeline:
  - Standalone (folder of files)
  - Single HTML (all inlined)
  - Embed snippet
  - React component
- Export config wizard: client name, key, Map ID, allowed domain, container ID, height, language, region, inline-assets toggle, analytics.
- Export readiness checker (duplicate coords, invalid coords, missing Map ID, etc.).
- Overview panel with per-project stats and storage usage.
- Documentation: `README.md`, `PROJECT_OVERVIEW.md`, `IMPLEMENTATION_STATUS.md`, `GOOGLE_MAPS_SETUP.md`, `EXPORT_GUIDE.md`.
- Accessibility basics: keyboard focus rings, `prefers-reduced-motion`, popup ARIA labels, Escape to cancel modes.

### Known limitations

- Advanced routes, shapes, animations, Interaction Builder, clustering, and full localization UI are Phase 2/3.
- No automated tests yet.
- Popup preview positioning is approximate; the exported map uses the real `InfoWindow`.
