import { useProjectStore } from '@/store/projectStore';

export function SearchPanel() {
  const project = useProjectStore((s) => s.project)!;
  const mutate = useProjectStore((s) => s.mutate);
  const s = project.search;

  return (
    <div className="p-3 space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={s.enabled}
          onChange={(e) => mutate('Toggle search', (p) => { p.search.enabled = e.target.checked; })}
        />
        Enable search in exported map
      </label>

      <div className="field">
        <label className="label">Placeholder</label>
        <input className="input" value={s.placeholder} onChange={(e) => mutate('Search placeholder', (p) => { p.search.placeholder = e.target.value; })} />
      </div>

      <div>
        <label className="label">Search these fields</label>
        {(['name', 'address', 'description', 'tags', 'categories', 'customFields'] as const).map((f) => (
          <label key={f} className="flex items-center gap-2 text-sm py-0.5">
            <input
              type="checkbox"
              checked={s.fields.includes(f)}
              onChange={(e) => mutate('Toggle search field', (p) => {
                const set = new Set(p.search.fields);
                if (e.target.checked) set.add(f); else set.delete(f);
                p.search.fields = Array.from(set) as any;
              })}
            />
            {f}
          </label>
        ))}
      </div>

      {(['autocomplete', 'centerOnResult', 'openPopupOnResult', 'showInSidebar'] as const).map((k) => (
        <label key={k} className="flex items-center gap-2 text-sm py-0.5">
          <input
            type="checkbox"
            checked={s[k]}
            onChange={(e) => mutate('Search option', (p) => { (p.search as any)[k] = e.target.checked; })}
          />
          {k}
        </label>
      ))}

      <div className="text-2xs text-text-dim pt-2 border-t border-panel-border">
        This is separate from <em>Google Places search</em> (billable) which is available in the Locations panel.
      </div>
    </div>
  );
}
