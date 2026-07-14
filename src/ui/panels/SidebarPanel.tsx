import { useProjectStore } from '@/store/projectStore';

export function SidebarPanel() {
  const project = useProjectStore((s) => s.project)!;
  const mutate = useProjectStore((s) => s.mutate);
  const sb = project.sidebar;

  return (
    <div className="p-3 space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={sb.enabled}
          onChange={(e) => mutate('Toggle sidebar', (p) => { p.sidebar.enabled = e.target.checked; })}
        />
        Enable sidebar in export
      </label>

      <div className="field">
        <label className="label">Position</label>
        <select
          className="input"
          value={sb.position}
          onChange={(e) => mutate('Sidebar position', (p) => { p.sidebar.position = e.target.value as any; })}
        >
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="overlay">Overlay</option>
          <option value="bottomDrawerMobile">Bottom drawer (mobile)</option>
        </select>
      </div>

      <div className="field">
        <label className="label">Variant</label>
        <select
          className="input"
          value={sb.variant}
          onChange={(e) => mutate('Sidebar variant', (p) => { p.sidebar.variant = e.target.value as any; })}
        >
          <option value="list">List</option>
          <option value="cards">Cards</option>
          <option value="compact">Compact</option>
          <option value="imageCards">Image cards</option>
        </select>
      </div>

      <div className="field">
        <label className="label">Width (desktop, px)</label>
        <input
          type="number"
          className="input"
          value={sb.widthDesktop}
          onChange={(e) => mutate('Sidebar width', (p) => { p.sidebar.widthDesktop = parseInt(e.target.value) || 320; })}
        />
      </div>

      {(['showSearch', 'showFilters', 'showSort', 'showCount', 'showFeatured', 'showDistance', 'collapsible'] as const).map((k) => (
        <label key={k} className="flex items-center gap-2 text-sm py-0.5">
          <input
            type="checkbox"
            checked={sb[k]}
            onChange={(e) => mutate('Sidebar option', (p) => { (p.sidebar as any)[k] = e.target.checked; })}
          />
          {k.replace(/^show/, 'Show ').replace(/([A-Z])/g, ' $1').trim()}
        </label>
      ))}

      <div className="field">
        <label className="label">Empty state text</label>
        <input
          className="input"
          value={sb.emptyStateText}
          onChange={(e) => mutate('Sidebar empty text', (p) => { p.sidebar.emptyStateText = e.target.value; })}
        />
      </div>

      <div className="text-2xs text-text-dim pt-2 border-t border-panel-border">
        Sidebar renders in the exported map. Visual customization panel with drag-and-drop card layout is in Phase 2.
      </div>
    </div>
  );
}
