import { useMemo, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { buildEmbedSnippet, buildReactComponent, buildSingleHtmlExport, buildStandaloneExport, validateProjectForExport, type ExportConfig, type ExportedFile } from '@/export/exporter';

type ExportFormat = 'standalone' | 'singleHtml' | 'embed' | 'react';

export function ExportPanel() {
  const project = useProjectStore((s) => s.project)!;
  const assets = useProjectStore((s) => s.assets);
  const apiConfig = useProjectStore((s) => s.apiConfig);

  const [format, setFormat] = useState<ExportFormat>('standalone');
  const [clientName, setClientName] = useState('');
  const [apiKey, setApiKey] = useState(apiConfig?.exportApiKey ?? '');
  const [mapId, setMapId] = useState(apiConfig?.exportMapId ?? '');
  const [containerId, setContainerId] = useState('atlist-map');
  const [height, setHeight] = useState('600px');
  const [language, setLanguage] = useState('en');
  const [region, setRegion] = useState('');
  const [allowedDomain, setAllowedDomain] = useState('');
  const [inlineAssets, setInlineAssets] = useState(true);
  const [analyticsProvider, setAnalyticsProvider] = useState<'none' | 'ga4' | 'custom'>('none');
  const [gaMeasurementId, setGaMeasurementId] = useState('');
  const [result, setResult] = useState<ExportedFile[] | null>(null);

  const validation = useMemo(() => validateProjectForExport(project, apiConfig, apiKey, mapId), [project, apiConfig, apiKey, mapId]);

  const doExport = () => {
    const cfg: ExportConfig = {
      clientProjectName: clientName || project.name,
      apiKey: apiKey.trim(),
      mapId: mapId.trim(),
      containerId,
      height,
      language,
      region,
      allowedDomain,
      inlineAssets,
    };
    // Apply analytics settings
    const projectForExport = JSON.parse(JSON.stringify(project));
    projectForExport.analytics.enabled = analyticsProvider !== 'none';
    projectForExport.analytics.provider = analyticsProvider;
    projectForExport.analytics.gaMeasurementId = gaMeasurementId;

    let files: ExportedFile[] = [];
    let warnings: string[] = [];
    if (format === 'standalone') {
      const r = buildStandaloneExport(projectForExport, assets, cfg);
      files = r.files; warnings = r.warnings;
    } else if (format === 'singleHtml') {
      const r = buildSingleHtmlExport(projectForExport, assets, cfg);
      files = r.files; warnings = r.warnings;
    } else if (format === 'embed') {
      const r = buildStandaloneExport(projectForExport, assets, cfg);
      files = [...r.files, { path: 'EMBED_SNIPPET.html', content: buildEmbedSnippet(cfg) }];
      warnings = r.warnings;
    } else if (format === 'react') {
      files = [{ path: 'AtlistMap.jsx', content: buildReactComponent(projectForExport, cfg) }];
    }
    setResult(files);
    if (warnings.length) {
      useProjectStore.getState().setError(warnings.join(' · '));
    }
  };

  const downloadFile = (file: ExportedFile) => {
    const isHtml = file.path.endsWith('.html');
    const mime = isHtml ? 'text/html' : file.path.endsWith('.json') ? 'application/json' : file.path.endsWith('.js') ? 'text/javascript' : file.path.endsWith('.css') ? 'text/css' : 'text/plain';
    const blob = new Blob([file.content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    if (!result) return;
    result.forEach((f) => downloadFile(f));
  };

  const previewInNewTab = () => {
    if (!result) return;
    const html = result.find((f) => f.path.endsWith('.html'));
    if (!html) return;
    // For standalone export we need to inline everything into a single blob URL
    let combined = html.content;
    if (format === 'standalone') {
      const css = result.find((f) => f.path === 'styles.css');
      const dataJs = result.find((f) => f.path === 'map-data.js');
      const mapJs = result.find((f) => f.path === 'map.js');
      combined = combined
        .replace('<link rel="stylesheet" href="styles.css" />', `<style>${css?.content || ''}</style>`)
        .replace('<script src="map-data.js"></script>', `<script>${dataJs?.content || ''}</script>`)
        .replace('<script src="map.js"></script>', `<script>${mapJs?.content || ''}</script>`);
    }
    const blob = new Blob([combined], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <div className="p-3 space-y-3">
      {validation.errors.length > 0 && (
        <div className="bg-red-950/50 border border-red-800/50 rounded p-2 text-2xs text-red-200">
          {validation.errors.map((e, i) => <div key={i}>⚠ {e}</div>)}
        </div>
      )}
      {validation.warnings.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/40 rounded p-2 text-2xs text-amber-200">
          {validation.warnings.map((w, i) => <div key={i}>• {w}</div>)}
        </div>
      )}

      <div className="field">
        <label className="label">Export format</label>
        <select className="input" value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
          <option value="standalone">Standalone (folder)</option>
          <option value="singleHtml">Single HTML file</option>
          <option value="embed">Embed snippet</option>
          <option value="react">React component</option>
        </select>
      </div>

      <div className="field">
        <label className="label">Client project name</label>
        <input className="input" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={project.name} />
      </div>

      <div className="field">
        <label className="label">Client API key <span className="text-red-400">*</span></label>
        <input className="input font-mono text-xs" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIza…" />
      </div>
      <div className="field">
        <label className="label">Client Map ID</label>
        <input className="input font-mono text-xs" value={mapId} onChange={(e) => setMapId(e.target.value)} />
      </div>
      <div className="field">
        <label className="label">Allowed domain (documentation only)</label>
        <input className="input" value={allowedDomain} onChange={(e) => setAllowedDomain(e.target.value)} placeholder="www.client.com" />
      </div>
      <div className="field">
        <label className="label">Container ID</label>
        <input className="input font-mono text-xs" value={containerId} onChange={(e) => setContainerId(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="field">
          <label className="label">Height</label>
          <input className="input" value={height} onChange={(e) => setHeight(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Language</label>
          <input className="input" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en" />
        </div>
      </div>
      <div className="field">
        <label className="label">Region</label>
        <input className="input" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="US" />
      </div>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={inlineAssets} onChange={(e) => setInlineAssets(e.target.checked)} />
        Inline assets as data URLs (recommended)
      </label>

      <div className="divider" />
      <div className="field">
        <label className="label">Analytics</label>
        <select className="input" value={analyticsProvider} onChange={(e) => setAnalyticsProvider(e.target.value as any)}>
          <option value="none">Off</option>
          <option value="ga4">Google Analytics (GA4)</option>
          <option value="custom">Custom callback</option>
        </select>
        {analyticsProvider === 'ga4' && (
          <input className="input mt-2 font-mono text-xs" value={gaMeasurementId} onChange={(e) => setGaMeasurementId(e.target.value)} placeholder="G-XXXXXXX" />
        )}
      </div>

      <div className="bg-panel-lighter border border-panel-border rounded p-2 text-2xs text-text-muted">
        <strong>Notice:</strong> The exported browser API key is visible to end users. Restrict it by HTTP referrer,
        enable only APIs you use, and use your client's own Google Cloud project. Google Maps usage may incur charges.
      </div>

      <div className="flex gap-2">
        <button className="btn-primary text-xs flex-1" onClick={doExport}>Generate export</button>
      </div>

      {result && (
        <div className="space-y-2">
          <div className="text-2xs text-text-muted">{result.length} file(s) generated</div>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border border-panel-border rounded p-1">
            {result.map((f) => (
              <button key={f.path} className="text-left btn-ghost text-xs justify-start" onClick={() => downloadFile(f)}>
                ↓ {f.path} <span className="text-text-dim ml-auto">{Math.round(f.content.length / 1024)} KB</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-xs flex-1" onClick={downloadAll}>Download all</button>
            <button className="btn-secondary text-xs flex-1" onClick={previewInNewTab}>Preview in new tab</button>
          </div>
        </div>
      )}
    </div>
  );
}
