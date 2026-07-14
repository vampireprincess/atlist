// Builds an export package (in memory) as a set of files ready to be zipped or delivered.
// We keep this dependency-free (no JSZip) — files are returned as an array and the UI can
// let the user download them individually or as a single HTML.

import type { ApiConfig, Asset, Project } from '@/types';
import { RUNTIME_JS } from './runtime';

export interface ExportConfig {
  clientProjectName: string;
  apiKey: string;
  mapId: string;
  containerId: string;
  language?: string;
  region?: string;
  height: string;
  allowedDomain?: string;
  inlineAssets: boolean;
}

export interface ExportedFile {
  path: string;
  content: string; // text; binary assets are represented as data URLs inside map-data.json
}

export interface ExportResult {
  files: ExportedFile[];
  warnings: string[];
}

function buildDataObject(project: Project, assets: Asset[], cfg: ExportConfig, inline: boolean) {
  const assetMap: Record<string, string> = {};
  for (const a of assets) {
    if (inline) {
      assetMap[a.id] = a.dataUrl;
    } else {
      // reference asset by relative URL
      assetMap[a.id] = `assets/${a.id}-${sanitizeFilename(a.name)}`;
    }
  }
  return {
    config: {
      apiKey: cfg.apiKey,
      mapId: cfg.mapId,
      containerId: cfg.containerId,
      language: cfg.language,
      region: cfg.region,
      height: cfg.height,
    },
    project,
    assets: assetMap,
  };
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_.-]/gi, '_');
}

export function buildStandaloneExport(project: Project, assets: Asset[], cfg: ExportConfig): ExportResult {
  const warnings: string[] = [];
  const data = buildDataObject(project, assets, cfg, true); // always inline for standalone (asset URLs kept in JSON)

  const html = `<!doctype html>
<html lang="${cfg.language || 'en'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(cfg.clientProjectName || project.name)}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div id="${cfg.containerId}" class="atlist-container"></div>

  <script src="map-data.js"></script>
  <script src="map.js"></script>
</body>
</html>
`;

  const css = `/* Atlist embed styles */
body { margin: 0; font-family: ${project.globalStyles.fontFamily || 'sans-serif'}; background: ${project.globalStyles.backgroundColor}; }
.atlist-container { width: 100%; height: ${cfg.height || '100vh'}; position: relative; }
.atlist-marker { user-select: none; -webkit-user-select: none; }
.atlist-popup a { color: ${project.globalStyles.primaryColor}; }
.atlist-sidebar { font-family: ${project.globalStyles.fontFamily || 'sans-serif'}; }
${project.customCode?.css || ''}
`;

  const dataJs = `window.ATLIST_DATA = ${JSON.stringify(data)};`;
  const dataJson = JSON.stringify(data, null, 2);

  const readme = `# ${cfg.clientProjectName || project.name}

An interactive Google Map exported from Atlist.

## Files
- \`index.html\` — entry point
- \`styles.css\` — layout styles
- \`map.js\` — runtime (vanilla JS)
- \`map-data.js\` — your map data (also available as map-data.json)
- \`config.example.js\` — example config, if you want to swap keys

## Setup
1. Upload the whole folder to your web host.
2. Open \`map-data.js\` if you ever need to update the Google Maps API key or Map ID.
3. Make sure your API key allows the domain \`${cfg.allowedDomain || 'your-domain.com'}\`.

## Google Cloud
- Enable Maps JavaScript API
- Enable Places API (only if you use Places search)
- Enable Geocoding API (only if you geocode addresses at runtime)
- Restrict your API key by HTTP referrer to your domain

## Notes
- Google Maps usage may incur charges. See https://mapsplatform.google.com/pricing/
`;

  const configExample = `// Optional: to change the API key/Map ID, edit map-data.js — this file is a reference only.
// window.ATLIST_CONFIG_OVERRIDE = { apiKey: 'YOUR_KEY', mapId: 'YOUR_MAP_ID' };
`;

  return {
    files: [
      { path: 'index.html', content: html },
      { path: 'styles.css', content: css },
      { path: 'map.js', content: RUNTIME_JS },
      { path: 'map-data.js', content: dataJs },
      { path: 'map-data.json', content: dataJson },
      { path: 'config.example.js', content: configExample },
      { path: 'README.md', content: readme },
    ],
    warnings,
  };
}

export function buildSingleHtmlExport(project: Project, assets: Asset[], cfg: ExportConfig): ExportResult {
  const warnings: string[] = [];
  const data = buildDataObject(project, assets, cfg, true);
  const totalSize = JSON.stringify(data).length;
  if (totalSize > 2_000_000) {
    warnings.push('Single-HTML export is larger than 2 MB — consider the standalone export for better caching.');
  }

  const css = `body{margin:0;font-family:${project.globalStyles.fontFamily || 'sans-serif'};background:${project.globalStyles.backgroundColor};}
#${cfg.containerId}{width:100%;height:${cfg.height || '100vh'};position:relative;}
.atlist-marker{user-select:none;-webkit-user-select:none;}
.atlist-popup a{color:${project.globalStyles.primaryColor};}
${project.customCode?.css || ''}`;

  const html = `<!doctype html>
<html lang="${cfg.language || 'en'}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(cfg.clientProjectName || project.name)}</title>
<style>${css}</style>
</head>
<body>
<div id="${cfg.containerId}"></div>
<script>window.ATLIST_DATA = ${JSON.stringify(data)};</script>
<script>${RUNTIME_JS}</script>
</body>
</html>
`;

  return {
    files: [{ path: 'index.html', content: html }],
    warnings,
  };
}

export function buildEmbedSnippet(cfg: ExportConfig): string {
  return `<!-- Atlist embed -->
<div id="${cfg.containerId}" style="width:100%;height:${cfg.height};"></div>
<script src="./map-data.js"></script>
<script src="./map.js"></script>`;
}

export function buildReactComponent(project: Project, cfg: ExportConfig): string {
  // Small, self-contained React component. Uses the runtime under the hood.
  return `import { useEffect, useRef } from 'react';

// Auto-generated by Atlist.
const ATLIST_DATA = ${JSON.stringify({
    config: {
      apiKey: cfg.apiKey,
      mapId: cfg.mapId,
      containerId: cfg.containerId,
      language: cfg.language,
      region: cfg.region,
      height: cfg.height,
    },
    project,
  }, null, 2)};

const RUNTIME = ${JSON.stringify(RUNTIME_JS)};

export default function AtlistMap({ style } = {}) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const id = 'atlist-map-' + Math.random().toString(36).slice(2, 8);
    ref.current.id = id;
    ATLIST_DATA.config.containerId = id;
    (window).ATLIST_DATA = ATLIST_DATA;
    const s = document.createElement('script');
    s.text = RUNTIME;
    document.body.appendChild(s);
    return () => { s.remove(); };
  }, []);
  return React.createElement('div', { ref, style: { width: '100%', height: '${cfg.height}', ...style } });
}
`;
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export function validateProjectForExport(project: Project, apiConfig: ApiConfig | null, exportKey: string, exportMapId: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!exportKey || exportKey.trim().length < 10) errors.push('Client API key is missing or too short.');
  if (!exportMapId) warnings.push('No Map ID — Advanced Markers require a Map ID.');
  if (project.locations.length === 0) warnings.push('Project has no locations — the exported map will be empty.');
  const invalid = project.locations.filter((l) => !Number.isFinite(l.position?.lat) || !Number.isFinite(l.position?.lng));
  if (invalid.length) warnings.push(`${invalid.length} location(s) have invalid coordinates.`);
  const dup = new Map<string, number>();
  project.locations.forEach((l) => {
    const k = `${l.position.lat.toFixed(5)},${l.position.lng.toFixed(5)}`;
    dup.set(k, (dup.get(k) || 0) + 1);
  });
  const duplicates = Array.from(dup.values()).filter((c) => c > 1).length;
  if (duplicates) warnings.push(`${duplicates} coordinate group(s) contain duplicate locations.`);
  if (!apiConfig) warnings.push('No API config saved in the editor.');
  return { errors, warnings };
}
