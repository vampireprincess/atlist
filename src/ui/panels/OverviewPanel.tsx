import { useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { getStorageUsageBytes } from '@/lib/storage';

export function OverviewPanel() {
  const project = useProjectStore((s) => s.project)!;
  const assets = useProjectStore((s) => s.assets);
  const apiConfig = useProjectStore((s) => s.apiConfig);

  const stats = useMemo(() => ({
    locations: project.locations.length,
    invalidCoords: project.locations.filter((l) => !Number.isFinite(l.position?.lat) || !Number.isFinite(l.position?.lng)).length,
    categories: project.categories.length,
    markers: project.markerTemplates.length,
    popups: project.popupTemplates.length,
    assets: assets.length,
    totalAssetKb: Math.round(assets.reduce((s, a) => s + a.size, 0) / 1024),
    storageKb: Math.round(getStorageUsageBytes() / 1024),
    hasMapId: !!(apiConfig?.editorMapId || project.mapSettings.mapId),
  }), [project, assets, apiConfig]);

  const checks: Array<{ ok: boolean; label: string; hint?: string }> = [
    { ok: !!apiConfig, label: 'API keys configured' },
    { ok: stats.hasMapId, label: 'Map ID set (required for Advanced Markers)', hint: 'Create one in Google Cloud → Maps → Map Styles.' },
    { ok: stats.locations > 0, label: 'Has at least one location' },
    { ok: stats.invalidCoords === 0, label: 'All locations have valid coordinates', hint: stats.invalidCoords > 0 ? `${stats.invalidCoords} invalid` : undefined },
    { ok: project.markerTemplates.length > 0, label: 'Has at least one marker template' },
    { ok: project.popupTemplates.length > 0, label: 'Has at least one popup template' },
  ];

  return (
    <div className="p-3 space-y-3 text-sm">
      <div>
        <div className="text-lg font-semibold">{project.name}</div>
        {project.description && <div className="text-text-muted text-xs mt-0.5">{project.description}</div>}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Locations" value={stats.locations} />
        <Stat label="Categories" value={stats.categories} />
        <Stat label="Marker templates" value={stats.markers} />
        <Stat label="Popup templates" value={stats.popups} />
        <Stat label="Assets" value={stats.assets} />
        <Stat label="Asset size" value={`${stats.totalAssetKb} KB`} />
      </div>

      <div className="divider" />
      <div className="text-2xs uppercase tracking-wider text-text-muted font-semibold">Export readiness</div>
      <ul className="space-y-1">
        {checks.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <span className={c.ok ? 'text-green-400' : 'text-amber-400'}>{c.ok ? '✓' : '⚠'}</span>
            <div className="flex-1">
              <div>{c.label}</div>
              {!c.ok && c.hint && <div className="text-2xs text-text-dim">{c.hint}</div>}
            </div>
          </li>
        ))}
      </ul>

      <div className="divider" />
      <div className="text-2xs uppercase tracking-wider text-text-muted font-semibold">Storage</div>
      <div className="text-xs text-text-muted">
        Total local storage used across Atlist: <strong>{stats.storageKb} KB</strong>
        <br />
        <span className="text-text-dim">(Browsers typically allow 5–10 MB. Very large asset libraries should stay under ~4 MB total.)</span>
      </div>

      <div className="divider" />
      <div className="text-2xs text-text-dim leading-relaxed">
        Atlist ships with a phased roadmap. See <code>PROJECT_OVERVIEW.md</code> and
        <code> IMPLEMENTATION_STATUS.md</code> in the repository for a live status of every feature.
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-panel-light rounded p-2">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-2xs text-text-muted">{label}</div>
    </div>
  );
}
