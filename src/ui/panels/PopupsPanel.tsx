import { useProjectStore } from '@/store/projectStore';
import clsx from 'clsx';
import { defaultPopupTemplate } from '@/lib/defaults';

export function PopupsPanel() {
  const project = useProjectStore((s) => s.project)!;
  const selection = useProjectStore((s) => s.selection);
  const select = useProjectStore((s) => s.select);
  const mutate = useProjectStore((s) => s.mutate);
  const removePopupTemplate = useProjectStore((s) => s.removePopupTemplate);

  const add = () => {
    const t = defaultPopupTemplate('New popup');
    mutate('Add popup template', (p) => { p.popupTemplates.push(t); });
    select('popupTemplate', t.id);
  };

  return (
    <div className="p-3 space-y-3">
      <button className="btn-primary text-xs w-full" onClick={add}>+ New popup template</button>
      <div className="space-y-1">
        {project.popupTemplates.map((t) => (
          <div
            key={t.id}
            className={clsx(
              'group flex items-center gap-2 p-2 rounded cursor-pointer',
              selection.id === t.id ? 'bg-accent-muted/40 border border-accent/50' : 'hover:bg-panel-light border border-transparent',
            )}
            onClick={() => select('popupTemplate', t.id)}
          >
            <span>💬</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{t.name}</div>
              <div className="text-2xs text-text-muted">{t.variant} · {t.blocks.length} blocks</div>
            </div>
            {project.popupTemplates.length > 1 && (
              <button
                className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300 px-1"
                onClick={(e) => { e.stopPropagation(); if (confirm(`Delete popup "${t.name}"?`)) removePopupTemplate(t.id); }}
              >×</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
