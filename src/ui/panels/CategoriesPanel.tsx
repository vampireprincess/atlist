import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import clsx from 'clsx';

const DEFAULT_COLORS = ['#5b8def', '#f43f5e', '#22c55e', '#eab308', '#a855f7', '#06b6d4', '#f97316', '#ec4899'];

export function CategoriesPanel() {
  const project = useProjectStore((s) => s.project)!;
  const selection = useProjectStore((s) => s.selection);
  const select = useProjectStore((s) => s.select);
  const addCategory = useProjectStore((s) => s.addCategory);
  const removeCategory = useProjectStore((s) => s.removeCategory);
  const [name, setName] = useState('');

  const add = () => {
    if (!name.trim()) return;
    const color = DEFAULT_COLORS[project.categories.length % DEFAULT_COLORS.length];
    const c = addCategory(name.trim(), color);
    setName('');
    select('category', c.id);
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex gap-1">
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
        />
        <button className="btn-primary text-xs" onClick={add}>+</button>
      </div>

      <div className="space-y-1">
        {project.categories.map((c) => {
          const count = project.locations.filter((l) => l.categoryIds.includes(c.id)).length;
          return (
            <div
              key={c.id}
              className={clsx(
                'group flex items-center gap-2 p-2 rounded cursor-pointer',
                selection.id === c.id ? 'bg-accent-muted/40 border border-accent/50' : 'hover:bg-panel-light border border-transparent',
              )}
              onClick={() => select('category', c.id)}
            >
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: c.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{c.name}</div>
                <div className="text-2xs text-text-muted">{count} location{count !== 1 ? 's' : ''}</div>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300 px-1"
                onClick={(e) => { e.stopPropagation(); if (confirm(`Delete category "${c.name}"?`)) removeCategory(c.id); }}
              >×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
