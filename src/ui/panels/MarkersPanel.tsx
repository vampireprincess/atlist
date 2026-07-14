import { useProjectStore } from '@/store/projectStore';
import clsx from 'clsx';
import { defaultMarkerTemplate } from '@/lib/defaults';
import { uid } from '@/lib/id';

export function MarkersPanel() {
  const project = useProjectStore((s) => s.project)!;
  const selection = useProjectStore((s) => s.selection);
  const select = useProjectStore((s) => s.select);
  const mutate = useProjectStore((s) => s.mutate);
  const removeMarkerTemplate = useProjectStore((s) => s.removeMarkerTemplate);

  const add = (kind: 'pin' | 'emoji' | 'text' | 'image') => {
    const t = defaultMarkerTemplate();
    t.id = uid('mkr');
    t.name = kind === 'pin' ? 'New pin' : kind === 'emoji' ? 'New emoji marker' : kind === 'text' ? 'New text marker' : 'New image marker';
    t.kind = kind;
    if (kind === 'emoji') { t.emoji = '📍'; t.width = 36; t.height = 36; }
    if (kind === 'text') { t.text = 'Label'; t.width = 60; t.height = 24; }
    mutate('Add marker template', (p) => { p.markerTemplates.push(t); });
    select('markerTemplate', t.id);
  };

  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-2 gap-1">
        <button className="btn-secondary text-xs" onClick={() => add('pin')}>+ Pin</button>
        <button className="btn-secondary text-xs" onClick={() => add('emoji')}>+ Emoji</button>
        <button className="btn-secondary text-xs" onClick={() => add('text')}>+ Text</button>
        <button className="btn-secondary text-xs" onClick={() => add('image')}>+ Image / SVG</button>
      </div>

      <div className="text-2xs text-text-muted">{project.markerTemplates.length} templates</div>

      <div className="space-y-1">
        {project.markerTemplates.map((m) => (
          <div
            key={m.id}
            className={clsx(
              'group flex items-center gap-2 p-2 rounded cursor-pointer',
              selection.id === m.id ? 'bg-accent-muted/40 border border-accent/50' : 'hover:bg-panel-light border border-transparent',
            )}
            onClick={() => select('markerTemplate', m.id)}
          >
            <div className="w-8 h-8 flex items-center justify-center rounded bg-panel-lighter">
              {m.kind === 'emoji' ? m.emoji : m.kind === 'pin' ? '📍' : m.kind === 'text' ? 'T' : '🖼'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{m.name}</div>
              <div className="text-2xs text-text-muted">{m.kind}</div>
            </div>
            {project.markerTemplates.length > 1 && (
              <button
                className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300 px-1"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete marker template "${m.name}"?`)) removeMarkerTemplate(m.id);
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
