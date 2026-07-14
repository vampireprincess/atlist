import { useProjectStore } from '@/store/projectStore';
import clsx from 'clsx';

export function TopBar() {
  const project = useProjectStore((s) => s.project);
  const dirty = useProjectStore((s) => s.dirty);
  const lastSavedAt = useProjectStore((s) => s.lastSavedAt);
  const saveNow = useProjectStore((s) => s.saveNow);
  const closeProject = useProjectStore((s) => s.closeProject);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const historyPast = useProjectStore((s) => s.history.past.length);
  const historyFuture = useProjectStore((s) => s.history.future.length);
  const deviceMode = useProjectStore((s) => s.deviceMode);
  const setDeviceMode = useProjectStore((s) => s.setDeviceMode);
  const testMode = useProjectStore((s) => s.testMode);
  const setTestMode = useProjectStore((s) => s.setTestMode);
  const renameProject = useProjectStore((s) => s.renameProject);

  if (!project) return null;

  const savedAgo = lastSavedAt ? Math.round((Date.now() - lastSavedAt) / 1000) : null;

  return (
    <div className="h-11 shrink-0 bg-panel border-b border-panel-border flex items-center px-2 gap-1 text-sm">
      <button className="btn-ghost" onClick={closeProject} title="Back to projects">
        <span className="text-accent font-semibold">Atlist</span>
      </button>
      <div className="w-px h-5 bg-panel-border mx-1" />

      <input
        className="bg-transparent hover:bg-panel-light rounded px-2 py-1 outline-none focus:bg-panel-light w-56 truncate"
        value={project.name}
        onChange={(e) => renameProject(project.id, e.target.value)}
      />

      <span className={clsx('text-2xs px-2', dirty ? 'text-amber-400' : 'text-text-dim')}>
        {dirty ? '● Unsaved changes' : savedAgo !== null ? `Saved ${savedAgo}s ago` : 'Saved'}
      </span>

      <div className="flex-1" />

      <div className="flex items-center gap-1 mr-2">
        <button className="btn-ghost text-xs" onClick={undo} disabled={historyPast === 0} title="Undo (Ctrl+Z)">↶</button>
        <button className="btn-ghost text-xs" onClick={redo} disabled={historyFuture === 0} title="Redo (Ctrl+Shift+Z)">↷</button>
      </div>

      <div className="flex items-center gap-0.5 bg-surface rounded border border-panel-border p-0.5 mr-2">
        {(['desktop', 'tablet', 'mobile'] as const).map((m) => (
          <button
            key={m}
            className={clsx(
              'px-2 py-0.5 rounded text-2xs transition-colors',
              deviceMode === m ? 'bg-accent text-white' : 'text-text-muted hover:text-text',
            )}
            onClick={() => setDeviceMode(m)}
          >
            {m}
          </button>
        ))}
      </div>

      <button
        className={clsx('btn-ghost text-xs', testMode && 'bg-accent-muted text-white')}
        onClick={() => setTestMode(!testMode)}
        title="Test Mode: try interactions without moving elements"
      >
        {testMode ? '● Test Mode' : 'Test Mode'}
      </button>

      <button className="btn-secondary text-xs" onClick={saveNow} title="Save (Ctrl+S)">Save</button>
    </div>
  );
}
