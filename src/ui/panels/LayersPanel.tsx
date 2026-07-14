import { useProjectStore } from '@/store/projectStore';

export function LayersPanel() {
  const project = useProjectStore((s) => s.project)!;
  const mutate = useProjectStore((s) => s.mutate);

  return (
    <div className="p-3 space-y-3">
      <p className="text-2xs text-text-muted">Toggle visibility of major project layers on the map.</p>

      <div className="space-y-1">
        <LayerRow name="Locations & markers" count={project.locations.filter((l) => l.visible).length}>
          <button
            className="btn-ghost text-xs"
            onClick={() => mutate('Toggle all locations', (p) => {
              const anyVisible = p.locations.some((l) => l.visible);
              p.locations.forEach((l) => (l.visible = !anyVisible));
            })}
          >
            {project.locations.some((l) => l.visible) ? 'Hide all' : 'Show all'}
          </button>
        </LayerRow>
        <LayerRow name="Sidebar" count={project.sidebar.enabled ? 1 : 0}>
          <button
            className="btn-ghost text-xs"
            onClick={() => mutate('Toggle sidebar', (p) => { p.sidebar.enabled = !p.sidebar.enabled; })}
          >
            {project.sidebar.enabled ? 'Disable' : 'Enable'}
          </button>
        </LayerRow>
        <LayerRow name="Legend" count={project.legend.enabled ? 1 : 0}>
          <button
            className="btn-ghost text-xs"
            onClick={() => mutate('Toggle legend', (p) => { p.legend.enabled = !p.legend.enabled; })}
          >
            {project.legend.enabled ? 'Disable' : 'Enable'}
          </button>
        </LayerRow>
        <LayerRow name="Filters" count={project.filters.enabled ? 1 : 0}>
          <button
            className="btn-ghost text-xs"
            onClick={() => mutate('Toggle filters', (p) => { p.filters.enabled = !p.filters.enabled; })}
          >
            {project.filters.enabled ? 'Disable' : 'Enable'}
          </button>
        </LayerRow>
      </div>

      <div className="text-2xs text-text-dim pt-2 border-t border-panel-border">
        Full layer manager with grouping, per-zoom visibility and locking is on the Phase 2 roadmap.
      </div>
    </div>
  );
}

function LayerRow({ name, count, children }: { name: string; count: number; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded bg-panel-light">
      <div className="flex-1 min-w-0">
        <div className="text-sm">{name}</div>
        <div className="text-2xs text-text-muted">{count} visible</div>
      </div>
      {children}
    </div>
  );
}
