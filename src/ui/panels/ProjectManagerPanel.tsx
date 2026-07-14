import { useProjectStore } from '@/store/projectStore';
import { loadProject } from '@/lib/storage';

export function ProjectManagerPanel() {
  const project = useProjectStore((s) => s.project);
  const saveNow = useProjectStore((s) => s.saveNow);
  const dirty = useProjectStore((s) => s.dirty);
  const lastSavedAt = useProjectStore((s) => s.lastSavedAt);
  const closeProject = useProjectStore((s) => s.closeProject);
  const renameProject = useProjectStore((s) => s.renameProject);
  const mutate = useProjectStore((s) => s.mutate);

  if (!project) return null;

  const exportJson = () => {
    const p = loadProject(project.id) ?? project;
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.atlist.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 space-y-3">
      <div className="field">
        <label className="label">Project name</label>
        <input
          className="input"
          value={project.name}
          onChange={(e) => renameProject(project.id, e.target.value)}
        />
      </div>
      <div className="field">
        <label className="label">Description</label>
        <textarea
          className="input"
          rows={3}
          value={project.description || ''}
          onChange={(e) => mutate('Update description', (p) => { p.description = e.target.value; })}
        />
      </div>
      <div className="field">
        <label className="label">Tags (comma-separated)</label>
        <input
          className="input"
          value={project.tags.join(', ')}
          onChange={(e) =>
            mutate('Update tags', (p) => {
              p.tags = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
            })
          }
          placeholder="e.g. travel, wedding, restaurants"
        />
      </div>

      <div className="divider" />

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary text-xs" onClick={saveNow}>💾 Save now</button>
        <button className="btn-secondary text-xs" onClick={exportJson}>Export .json</button>
        <button className="btn-ghost text-xs" onClick={closeProject}>← All projects</button>
      </div>

      <div className="text-2xs text-text-muted">
        {dirty ? '● Unsaved changes' : lastSavedAt ? `Last saved ${new Date(lastSavedAt).toLocaleTimeString()}` : 'No changes yet'}
      </div>

      <div className="divider" />

      <div className="text-2xs text-text-dim leading-relaxed">
        <div>Created {new Date(project.createdAt).toLocaleString()}</div>
        <div>Updated {new Date(project.updatedAt).toLocaleString()}</div>
        <div>ID: <span className="font-mono">{project.id}</span></div>
      </div>
    </div>
  );
}
