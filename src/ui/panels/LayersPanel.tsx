import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import type { Layer } from '@/types';

export function LayersPanel() {
  const project = useProjectStore((s) => s.project)!;
  const mutate = useProjectStore((s) => s.mutate);
  const select = useProjectStore((s) => s.select);
  const selection = useProjectStore((s) => s.selection);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleLayerVisibility = (layerId: string) => {
    mutate('Toggle layer visibility', (p) => {
      const layer = p.layers.find(l => l.id === layerId);
      if (layer) layer.visible = !layer.visible;
    });
  };

  const toggleLayerLock = (layerId: string) => {
    mutate('Toggle layer lock', (p) => {
      const layer = p.layers.find(l => l.id === layerId);
      if (layer) layer.locked = !layer.locked;
    });
  };

  const renameLayer = (layerId: string, newName: string) => {
    mutate('Rename layer', (p) => {
      const layer = p.layers.find(l => l.id === layerId);
      if (layer) layer.name = newName;
    });
  };

  const deleteLayer = (layerId: string) => {
    if (!confirm('Delete this layer?')) return;
    mutate('Delete layer', (p) => {
      p.layers = p.layers.filter(l => l.id !== layerId);
    });
  };

  const duplicateLayer = (layerId: string) => {
    mutate('Duplicate layer', (p) => {
      const orig = p.layers.find(l => l.id === layerId);
      if (!orig) return;
      const copy: Layer = {
        ...JSON.parse(JSON.stringify(orig)),
        id: 'layer-' + Date.now(),
        name: orig.name + ' copy'
      };
      p.layers.push(copy);
    });
  };

  const moveLayer = (fromIndex: number, toIndex: number) => {
    mutate('Reorder layers', (p) => {
      const [moved] = p.layers.splice(fromIndex, 1);
      p.layers.splice(toIndex, 0, moved);
    });
  };

  const updateLayerZoom = (layerId: string, field: 'minZoom' | 'maxZoom', value: number) => {
    mutate('Update layer zoom', (p) => {
      const layer = p.layers.find(l => l.id === layerId);
      if (layer) layer[field] = value;
    });
  };

  const toggleDeviceVisibility = (layerId: string, device: 'desktop' | 'tablet' | 'mobile') => {
    mutate('Toggle layer device visibility', (p) => {
      const layer = p.layers.find(l => l.id === layerId);
      if (layer) {
        layer.visibleOn[device] = !layer.visibleOn[device];
      }
    });
  };

  const selectLayer = (layerId: string) => {
    select('layer', layerId);
  };

  // Auto-create default layers if none exist
  if (project.layers.length === 0) {
    mutate('Initialize default layers', (p) => {
      p.layers = [
        { id: 'layer-locations', name: 'Locations & Markers', kind: 'markers', visible: true, locked: false, opacity: 1, visibleOn: { desktop: true, tablet: true, mobile: true }, categoryId: null, childIds: [] },
        { id: 'layer-routes', name: 'Routes & Lines', kind: 'routes', visible: true, locked: false, opacity: 1, visibleOn: { desktop: true, tablet: true, mobile: true }, categoryId: null, childIds: [] },
        { id: 'layer-shapes', name: 'Shapes & Regions', kind: 'shapes', visible: true, locked: false, opacity: 1, visibleOn: { desktop: true, tablet: true, mobile: true }, categoryId: null, childIds: [] },
        { id: 'layer-overlays', name: 'Overlays', kind: 'overlays', visible: true, locked: false, opacity: 1, visibleOn: { desktop: true, tablet: true, mobile: true }, categoryId: null, childIds: [] },
      ];
    });
  }

  return (
    <div className="p-3 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Layers ({project.layers.length})</div>
        <button 
          className="btn-ghost text-xs px-2" 
          onClick={() => {
            mutate('Add new layer', (p) => {
              p.layers.push({
                id: 'layer-' + Date.now(),
                name: 'New Layer',
                kind: 'custom',
                visible: true,
                locked: false,
                opacity: 1,
                visibleOn: { desktop: true, tablet: true, mobile: true },
                categoryId: null,
                childIds: []
              });
            });
          }}
        >
          + Add Layer
        </button>
      </div>

      <div className="space-y-1 max-h-[420px] overflow-auto pr-1">
        {project.layers.map((layer, index) => (
          <div 
            key={layer.id} 
            className={`border rounded p-2 transition-all ${selection.kind === 'layer' && selection.id === layer.id ? 'border-accent bg-accent/5' : 'border-panel-border hover:bg-panel-light'}`}
          >
            <div className="flex items-center gap-2">
              {/* Visibility toggle */}
              <input 
                type="checkbox" 
                checked={layer.visible} 
                onChange={() => toggleLayerVisibility(layer.id)}
                className="checkbox"
              />

              {/* Lock toggle */}
              <button 
                onClick={() => toggleLayerLock(layer.id)}
                className="text-xs px-1"
                title={layer.locked ? 'Unlock' : 'Lock'}
              >
                {layer.locked ? '🔒' : '🔓'}
              </button>

              {/* Name */}
              <input 
                value={layer.name} 
                onChange={(e) => renameLayer(layer.id, e.target.value)}
                className="input text-sm flex-1 py-0.5 h-7"
                onClick={() => selectLayer(layer.id)}
              />

              {/* Actions */}
              <div className="flex gap-0.5">
                <button onClick={() => duplicateLayer(layer.id)} className="btn-ghost text-xs px-1" title="Duplicate">⎘</button>
                <button onClick={() => deleteLayer(layer.id)} className="btn-ghost text-xs px-1 text-red-400" title="Delete">×</button>
                
                {index > 0 && (
                  <button onClick={() => moveLayer(index, index - 1)} className="btn-ghost text-xs px-1">↑</button>
                )}
                {index < project.layers.length - 1 && (
                  <button onClick={() => moveLayer(index, index + 1)} className="btn-ghost text-xs px-1">↓</button>
                )}
              </div>
            </div>

            {/* Advanced options */}
            <div className="mt-2 pl-7 text-xs space-y-2">
              <div className="flex items-center gap-2 text-text-muted">
                <span>Opacity</span>
                <input 
                  type="range" 
                  min="0" max="1" step="0.1" 
                  value={layer.opacity} 
                  onChange={(e) => mutate('Update layer opacity', p => {
                    const l = p.layers.find(x => x.id === layer.id); 
                    if (l) l.opacity = parseFloat(e.target.value);
                  })} 
                  className="flex-1"
                />
                <span className="w-8 text-right">{Math.round(layer.opacity * 100)}%</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-text-muted mb-0.5">Min Zoom</div>
                  <input 
                    type="number" 
                    value={layer.minZoom ?? 0} 
                    onChange={(e) => updateLayerZoom(layer.id, 'minZoom', parseInt(e.target.value))} 
                    className="input text-xs w-full py-0.5" 
                  />
                </div>
                <div>
                  <div className="text-text-muted mb-0.5">Max Zoom</div>
                  <input 
                    type="number" 
                    value={layer.maxZoom ?? 21} 
                    onChange={(e) => updateLayerZoom(layer.id, 'maxZoom', parseInt(e.target.value))} 
                    className="input text-xs w-full py-0.5" 
                  />
                </div>
              </div>

              <div>
                <div className="text-text-muted mb-1">Visible on</div>
                <div className="flex gap-3 text-xs">
                  {(['desktop', 'tablet', 'mobile'] as const).map(dev => (
                    <label key={dev} className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={layer.visibleOn[dev]} 
                        onChange={() => toggleDeviceVisibility(layer.id, dev)} 
                      />
                      <span>{dev}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-2xs text-text-dim pt-2 border-t border-panel-border">
        Click layer to select. Changes sync to map and survive save/reload.
      </div>
    </div>
  );
}
