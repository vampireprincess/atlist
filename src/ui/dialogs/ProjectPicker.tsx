import { useMemo, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { loadProject, saveProject } from '@/lib/storage';
import { uid } from '@/lib/id';

export function ProjectPicker() {
  const projectIndex = useProjectStore((s) => s.projectIndex);
  const newProject = useProjectStore((s) => s.newProject);
  const openProject = useProjectStore((s) => s.openProject);
  const duplicateProject = useProjectStore((s) => s.duplicateProject);
  const renameProject = useProjectStore((s) => s.renameProject);
  const deleteProject = useProjectStore((s) => s.deleteProjectById);
  const clearApi = useProjectStore((s) => s.clearApi);
  const setError = useProjectStore((s) => s.setError);

  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'updated' | 'created' | 'name'>('updated');
  const [name, setName] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = projectIndex.filter((p) =>
      !needle ||
      p.name.toLowerCase().includes(needle) ||
      (p.description ?? '').toLowerCase().includes(needle) ||
      p.tags.some((t) => t.toLowerCase().includes(needle)),
    );
    if (sort === 'name') rows.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'created') rows.sort((a, b) => b.createdAt - a.createdAt);
    else rows.sort((a, b) => b.updatedAt - a.updatedAt);
    return rows;
  }, [projectIndex, q, sort]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.id || !data.name || !Array.isArray(data.locations)) {
        throw new Error('This does not look like an Atlist project JSON.');
      }
      data.id = uid('prj');
      data.name = data.name + ' (imported)';
      data.createdAt = Date.now();
      data.updatedAt = Date.now();
      saveProject(data);
      useProjectStore.getState().refreshIndex();
    } catch (err: any) {
      setError('Import failed: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };

  const exportProject = (id: string) => {
    const p = loadProject(id);
    if (!p) return;
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.atlist.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-40 bg-surface p-6 overflow-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-text">Your projects</h1>
            <p className="text-text-muted text-sm">Create a new map or open an existing one.</p>
          </div>
          <div className="flex gap-2">
            <label className="btn-secondary cursor-pointer">
              Import JSON
              <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
            </label>
            <button className="btn-ghost text-text-muted text-xs" onClick={() => { if (confirm('Reconfigure API keys? Your projects are preserved.')) clearApi(); }}>
              API settings
            </button>
          </div>
        </div>

        <div className="bg-panel border border-panel-border rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <input
              className="input flex-1"
              placeholder="New project name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  newProject(name.trim());
                  setName('');
                }
              }}
            />
            <button
              className="btn-primary"
              onClick={() => {
                newProject(name.trim() || 'Untitled project');
                setName('');
              }}
            >
              + New project
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <input
            className="input flex-1"
            placeholder="Search projects…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="input w-40" value={sort} onChange={(e) => setSort(e.target.value as any)}>
            <option value="updated">Last updated</option>
            <option value="created">Created</option>
            <option value="name">Name</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center text-text-muted py-16">
            {projectIndex.length === 0 ? 'No projects yet — create your first map above.' : 'No projects match your search.'}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-panel border border-panel-border rounded-lg p-4 flex flex-col hover:border-accent transition-colors">
                <div className="font-medium text-text truncate">{p.name}</div>
                {p.description && <div className="text-2xs text-text-muted mt-1 line-clamp-2">{p.description}</div>}
                <div className="text-2xs text-text-dim mt-2">Updated {new Date(p.updatedAt).toLocaleString()}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {p.tags.map((t) => <span key={t} className="chip">{t}</span>)}
                </div>
                <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-panel-border">
                  <button className="btn-primary text-xs" onClick={() => openProject(p.id)}>Open</button>
                  <button className="btn-ghost text-xs" onClick={() => duplicateProject(p.id)}>Duplicate</button>
                  <button className="btn-ghost text-xs" onClick={() => exportProject(p.id)}>Export</button>
                  <button
                    className="btn-ghost text-xs"
                    onClick={() => {
                      const nn = prompt('Rename project', p.name);
                      if (nn && nn.trim()) renameProject(p.id, nn.trim());
                    }}
                  >
                    Rename
                  </button>
                  <button
                    className="btn-ghost text-xs text-red-400 hover:text-red-300"
                    onClick={() => {
                      if (confirm(`Delete project "${p.name}"? This cannot be undone.`)) deleteProject(p.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
