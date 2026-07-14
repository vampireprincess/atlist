import { useProjectStore } from '@/store/projectStore';

export function CategoryInspector() {
  const project = useProjectStore((s) => s.project)!;
  const selectionId = useProjectStore((s) => s.selection.id);
  const update = useProjectStore((s) => s.updateCategory);
  const remove = useProjectStore((s) => s.removeCategory);

  const c = project.categories.find((x) => x.id === selectionId);
  if (!c) return <div className="p-4 text-text-muted text-sm">Category not found.</div>;
  const patch = (p: any) => update(c.id, p);

  return (
    <div className="p-3 space-y-3">
      <div className="text-2xs uppercase tracking-wider text-text-muted font-semibold">Category</div>
      <div className="field">
        <label className="label">Name</label>
        <input className="input" value={c.name} onChange={(e) => patch({ name: e.target.value })} />
      </div>
      <div className="field">
        <label className="label">Color</label>
        <div className="flex gap-1">
          <input type="color" className="w-9 h-8 rounded border border-panel-border cursor-pointer" value={c.color} onChange={(e) => patch({ color: e.target.value })} />
          <input className="input font-mono text-xs" value={c.color} onChange={(e) => patch({ color: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label className="label">Icon (optional emoji)</label>
        <input className="input" value={c.icon || ''} onChange={(e) => patch({ icon: e.target.value })} placeholder="🍕" />
      </div>
      <div className="field">
        <label className="label">Marker template (default for this category)</label>
        <select className="input" value={c.markerTemplateId || ''} onChange={(e) => patch({ markerTemplateId: e.target.value || null })}>
          <option value="">Use project default</option>
          {project.markerTemplates.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={c.visible} onChange={(e) => patch({ visible: e.target.checked })} />
        Visible by default
      </label>

      <div className="divider" />
      <button className="btn-danger text-xs w-full" onClick={() => { if (confirm(`Delete category "${c.name}"?`)) remove(c.id); }}>
        Delete category
      </button>
    </div>
  );
}
