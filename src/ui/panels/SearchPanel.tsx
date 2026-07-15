import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';

export function SearchPanel() {
  const project = useProjectStore((s) => s.project)!;
  const select = useProjectStore((s) => s.select);
  const setDeviceMode = useProjectStore((s) => s.setDeviceMode);
  const deviceMode = useProjectStore((s) => s.deviceMode);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const performSearch = (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    const lowerQ = q.toLowerCase();
    const matches: any[] = [];

    // Search locations
    project.locations.forEach(loc => {
      const text = [
        loc.name,
        loc.address,
        loc.description,
        ...(loc.tags || []),
        ...loc.categoryIds.map(cid => project.categories.find(c => c.id === cid)?.name || '')
      ].join(' ').toLowerCase();

      if (text.includes(lowerQ)) {
        matches.push({
          type: 'location',
          id: loc.id,
          title: loc.name,
          subtitle: loc.address || loc.description?.slice(0, 60),
          data: loc,
        });
      }
    });

    // Search categories
    project.categories.forEach(cat => {
      if (cat.name.toLowerCase().includes(lowerQ)) {
        matches.push({
          type: 'category',
          id: cat.id,
          title: cat.name,
          subtitle: 'Category',
          data: cat,
        });
      }
    });

    // Search routes
    project.routes.forEach(route => {
      if (route.name.toLowerCase().includes(lowerQ)) {
        matches.push({
          type: 'route',
          id: route.id,
          title: route.name,
          subtitle: `${route.points.length} points`,
          data: route,
        });
      }
    });

    setResults(matches.slice(0, 12));
  };

  const handleResultClick = (result: any) => {
    if (result.type === 'location') {
      select('location', result.id);
      // Center map on location (via store if possible)
    } else if (result.type === 'category') {
      // Filter by category (future)
      select('category', result.id);
    } else if (result.type === 'route') {
      select('route', result.id);
    }
    setQuery('');
    setResults([]);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-lg">Search</div>
        <div className="text-2xs text-text-muted">Internal project search</div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            performSearch(e.target.value);
          }}
          placeholder="Search locations, categories, routes..."
          className="input w-full pr-9"
        />
        {query && (
          <button 
            onClick={clearSearch}
            className="absolute right-2 top-2 text-text-muted hover:text-text"
          >
            ×
          </button>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="border border-panel-border rounded-lg max-h-80 overflow-auto bg-panel">
          {results.map((result, idx) => (
            <div
              key={idx}
              onClick={() => handleResultClick(result)}
              className="px-3 py-2.5 hover:bg-panel-light cursor-pointer border-b border-panel-border last:border-b-0 flex gap-3"
            >
              <div className="text-xs px-1.5 py-0.5 rounded bg-panel-lighter self-start mt-0.5">
                {result.type}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{result.title}</div>
                {result.subtitle && (
                  <div className="text-xs text-text-muted truncate">{result.subtitle}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <div className="text-center py-6 text-text-muted text-sm">
          No results found for “{query}”
        </div>
      )}

      {/* Settings (keep original) */}
      <div className="pt-4 border-t border-panel-border">
        <div className="text-xs uppercase tracking-wider text-text-muted mb-2">Export Settings</div>
        
        <label className="flex items-center gap-2 text-sm mb-2">
          <input
            type="checkbox"
            checked={project.search.enabled}
            onChange={(e) => {
              useProjectStore.getState().mutate('Toggle search', (p) => { 
                p.search.enabled = e.target.checked; 
              });
            }}
          />
          Enable search in exported map
        </label>

        <div className="text-2xs text-text-dim">
          Search works in editor and will be included in export when enabled.
        </div>
      </div>
    </div>
  );
}
