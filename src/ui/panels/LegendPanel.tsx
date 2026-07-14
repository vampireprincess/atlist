import { useProjectStore } from '@/store/projectStore';

export function LegendPanel() {
  const project = useProjectStore((s) => s.project)!;
  const mutate = useProjectStore((s) => s.mutate);
  const legend = project.legend;

  return (
    <div className="p-3 space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={legend.enabled}
          onChange={(e) => mutate('Toggle legend', (p) => { p.legend.enabled = e.target.checked; })}
        />
        Enable legend
      </label>
      <div className="field">
        <label className="label">Title</label>
        <input className="input" value={legend.title || ''} onChange={(e) => mutate('Legend title', (p) => { p.legend.title = e.target.value; })} />
      </div>
      <div className="field">
        <label className="label">Position</label>
        <select
          className="input"
          value={legend.position}
          onChange={(e) => mutate('Legend position', (p) => { p.legend.position = e.target.value as any; })}
        >
          <option value="top-left">Top left</option>
          <option value="top-right">Top right</option>
          <option value="bottom-left">Bottom left</option>
          <option value="bottom-right">Bottom right</option>
        </select>
      </div>
      <button
        className="btn-secondary text-xs w-full"
        onClick={() => mutate('Legend from categories', (p) => {
          p.legend.items = p.categories.map((c) => ({ label: c.name, color: c.color }));
        })}
      >
        Populate from categories
      </button>
      <div className="text-2xs text-text-dim">Full drag-and-drop legend editor is on the Phase 3 roadmap.</div>
    </div>
  );
}
