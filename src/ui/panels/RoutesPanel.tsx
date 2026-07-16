import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useProjectStore } from '@/store/projectStore';
import { useDrawingStore } from '@/store/drawingStore';
import { loadDirectionsLib } from '@/lib/gmaps';
import { uid } from '@/lib/id';
import type { RouteLine, LatLng } from '@/types';

const ROUTE_KINDS: { value: RouteLine['kind']; label: string; description: string; billable: boolean }[] = [
  { value: 'straight', label: 'Straight Line', description: 'Direct line between two points', billable: false },
  { value: 'polyline', label: 'Custom Polyline', description: 'Multi-point custom path', billable: false },
  { value: 'driving', label: 'Driving Route', description: 'Road-optimized driving directions', billable: true },
  { value: 'walking', label: 'Walking Route', description: 'Pedestrian-optimized path', billable: true },
  { value: 'bicycling', label: 'Bicycling Route', description: 'Bike-friendly route', billable: true },
  { value: 'transit', label: 'Transit Route', description: 'Public transit directions', billable: true },
];

const PATTERN_OPTIONS: { value: RouteLine['pattern']; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'segmented', label: 'Segmented' },
  { value: 'animated', label: 'Animated Flow' },
  { value: 'glow', label: 'Glow Effect' },
];

export function RoutesPanel() {
  const project = useProjectStore((s) => s.project)!;
  const select = useProjectStore((s) => s.select);
  const mutate = useProjectStore((s) => s.mutate);
  const removeRoute = useProjectStore((s) => s.removeRoute);
  const updateRoute = useProjectStore((s) => s.updateRoute);
  const drawingStore = useDrawingStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingKind, setAddingKind] = useState<RouteLine['kind'] | null>(null);
  const [calculating, setCalculating] = useState(false);

  const routes = useMemo(() => project.routes, [project.routes]);
  const locations = project.locations.filter((l) => l.visible);

  const addRoute = async (kind: RouteLine['kind']) => {
    if (kind === 'driving' || kind === 'walking' || kind === 'bicycling' || kind === 'transit') {
      if (locations.length < 2) {
        alert('Need at least 2 locations for directions-based routes.');
        return;
      }
      setCalculating(true);
      try {
        const directions = await loadDirectionsLib();
        const directionsService = new directions.DirectionsService();
        
        const waypoints = locations.slice(1, -1).map((l) => ({
          location: l.position,
          stopover: true,
        }));

        const result = await directionsService.route({
          origin: locations[0].position,
          destination: locations[locations.length - 1].position,
          waypoints: waypoints.length > 0 ? waypoints : undefined,
          travelMode: kind.charAt(0).toUpperCase() + kind.slice(1) as google.maps.TravelMode,
          optimizeWaypoints: true,
        });

        const route = result.routes[0];
        const path: LatLng[] = [];
        route.overview_path.forEach((p) => path.push({ lat: p.lat(), lng: p.lng() }));

        const newRoute: RouteLine = {
          id: uid('rte'),
          name: `${kind.charAt(0).toUpperCase() + kind.slice(1)} route`,
          kind,
          points: path,
          color: '#5b8def',
          opacity: 0.8,
          weight: 4,
          pattern: 'solid',
          showArrows: kind !== 'straight',
          label: '',
          zIndex: 10,
          visible: true,
        };
        mutate('Add route', (p) => { p.routes.push(newRoute); });
        select('route', newRoute.id);
        setEditingId(newRoute.id);
      } catch (err: any) {
        alert('Directions request failed: ' + err.message);
      } finally {
        setCalculating(false);
      }
    } else if (kind === 'straight' && locations.length >= 2) {
      const newRoute: RouteLine = {
        id: uid('rte'),
        name: 'Straight line',
        kind: 'straight',
        points: [locations[0].position, locations[1].position],
        color: '#5b8def',
        opacity: 0.8,
        weight: 4,
        pattern: 'solid',
        showArrows: true,
        label: '',
        zIndex: 10,
        visible: true,
      };
      mutate('Add route', (p) => { p.routes.push(newRoute); });
      select('route', newRoute.id);
      setEditingId(newRoute.id);
    } else if (kind === 'polyline') {
      // Use global drawing store for real map drawing
      drawingStore.startDrawing('draw-polyline');
      setAddingKind(null);
    }
  };

  const addPolylinePoint = (point: LatLng) => {
    drawingStore.addPreviewPoint(point);
  };

  const finishPolyline = () => {
    if (previewCoords.length < 2) {
      alert('Need at least 2 points for a polyline.');
      return;
    }
    const newRoute: RouteLine = {
      id: uid('rte'),
      name: 'Custom polyline',
      kind: 'polyline',
      points: previewCoords,
      color: '#5b8def',
      opacity: 0.8,
      weight: 4,
      pattern: 'solid',
      showArrows: false,
      label: '',
      zIndex: 10,
      visible: true,
    };
    mutate('Add route', (p) => { p.routes.push(newRoute); });
    select('route', newRoute.id);
    setEditingId(newRoute.id);
    setAddingKind(null);
    setPreviewCoords([]);
  };

  const getRoute = (id: string) => routes.find((r) => r.id === id);
  const route = editingId ? getRoute(editingId) : null;

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-text">Routes &amp; Lines</div>
        <span className="text-2xs text-text-muted">{routes.length} routes</span>
      </div>

      {drawingStore.isDrawing && drawingStore.mode === 'draw-polyline' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3 space-y-2 animate-slideDown">
          <div className="font-medium text-amber-300">Drawing Polyline on Map</div>
          <div className="text-sm text-text-muted">
            Click on the map to add points. {drawingStore.previewPoints.length} point{drawingStore.previewPoints.length !== 1 ? 's' : ''} added.
          </div>
          <div className="flex gap-1">
            <button 
              className="btn-primary text-xs flex-1" 
              onClick={() => {
                if (drawingStore.previewPoints.length >= 2) {
                  const newRoute: RouteLine = {
                    id: uid('rte'),
                    name: 'Custom polyline',
                    kind: 'polyline',
                    points: [...drawingStore.previewPoints],
                    color: '#5b8def',
                    opacity: 0.8,
                    weight: 4,
                    pattern: 'solid',
                    showArrows: false,
                    label: '',
                    zIndex: 10,
                    visible: true,
                  };
                  mutate('Add route', (p) => { p.routes.push(newRoute); });
                  select('route', newRoute.id);
                  setEditingId(newRoute.id);
                  drawingStore.finishDrawing();
                }
              }} 
              disabled={drawingStore.previewPoints.length < 2}
            >
              Finish Polyline
            </button>
            <button 
              className="btn-secondary text-xs" 
              onClick={() => drawingStore.cancelDrawing()}
            >
              Cancel
            </button>
          </div>
          {drawingStore.previewPoints.length > 0 && (
            <button 
              className="btn-ghost text-xs" 
              onClick={() => {
                const pts = [...drawingStore.previewPoints];
                pts.pop();
                // We need to manually update because drawingStore doesn't expose setter directly
                // In a real implementation we'd expose a better API
                drawingStore.previewPoints = pts;
              }}
            >
              Undo Last Point
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="label">Add Route</label>
        <div className="grid grid-cols-2 gap-1">
          {ROUTE_KINDS.map((k) => (
            <button
              key={k.value}
              className={clsx('btn-secondary text-xs text-left p-2 h-auto rounded', k.billable && 'border-l-2 border-amber-500/50')}
              onClick={() => addRoute(k.value)}
              disabled={calculating || (k.value !== 'polyline' && locations.length < 2)}
              title={k.description + (k.billable ? ' (Billable API call)' : '')}
            >
              <div className="flex items-center gap-1">
                <span>{k.label}</span>
                {k.billable && <span className="chip text-2xs bg-amber-500/20 text-amber-300">$</span>}
              </div>
              <div className="text-2xs text-text-dim">{k.description}</div>
            </button>
          ))}
        </div>
        {calculating && <div className="text-xs text-accent">Calculating route…</div>}
        {(locations.length < 2 && !addingKind) && <p className="text-2xs text-text-dim">Add at least 2 locations to enable directions-based routes.</p>}
      </div>

      {routes.length > 0 && <div className="divider" />}

      {routes.length > 0 && (
        <div className="space-y-2">
          <label className="label">Your Routes</label>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {routes.map((r) => (
              <div
                key={r.id}
                className={clsx(
                  'group flex items-center gap-2 p-2 rounded cursor-pointer transition-colors',
                  editingId === r.id ? 'bg-accent-muted/40 border border-accent/50' : 'hover:bg-panel-light border border-transparent',
                  !r.visible && 'opacity-50',
                )}
                onClick={() => setEditingId(editingId === r.id ? null : r.id)}
              >
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={r.visible}
                  onChange={(e) => { e.stopPropagation(); updateRoute(r.id, { visible: e.target.checked }); }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm truncate">{r.name}</span>
                    <span className="chip text-2xs">{r.kind}</span>
                    {r.pattern !== 'solid' && <span className="chip text-2xs">{r.pattern}</span>}
                  </div>
                  <div className="text-2xs text-text-muted">
                    {r.points.length} points · {r.weight}px · {Math.round(r.opacity * 100)}% opacity
                  </div>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300 px-1"
                  onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${r.name}"?`)) removeRoute(r.id); }}
                >×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {route && (
        <div className="divider" />
      )}

      {route && (
        <div className="space-y-3 border border-panel-border rounded-lg p-3 bg-panel-light animate-slideDown">
          <div className="flex items-center justify-between">
            <div className="font-medium">Editing: {route.name}</div>
            <button className="text-text-muted hover:text-text" onClick={() => setEditingId(null)}>×</button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Name</label>
              <input className="input" value={route.name} onChange={(e) => updateRoute(route.id, { name: e.target.value })} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={route.kind} onChange={(e) => updateRoute(route.id, { kind: e.target.value as RouteLine['kind'] })}>
                {ROUTE_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Color</label>
              <input type="color" className="input h-8 cursor-pointer" value={route.color} onChange={(e) => updateRoute(route.id, { color: e.target.value })} />
            </div>
            <div>
              <label className="label">Opacity</label>
              <input type="range" className="w-full" min={0} max={1} step={0.05} value={route.opacity} onChange={(e) => updateRoute(route.id, { opacity: parseFloat(e.target.value) })} />
              <div className="text-2xs text-text-dim">{Math.round(route.opacity * 100)}%</div>
            </div>
            <div>
              <label className="label">Weight (px)</label>
              <input type="number" className="input" min={1} max={20} value={route.weight} onChange={(e) => updateRoute(route.id, { weight: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="label">Pattern</label>
              <select className="input" value={route.pattern} onChange={(e) => updateRoute(route.id, { pattern: e.target.value as RouteLine['pattern'] })}>
                {PATTERN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Z-Index</label>
              <input type="number" className="input" min={0} max={1000} value={route.zIndex} onChange={(e) => updateRoute(route.id, { zIndex: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="checkbox" checked={route.showArrows} onChange={(e) => updateRoute(route.id, { showArrows: e.target.checked })} />
                <span className="text-sm">Show direction arrows</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="checkbox" checked={route.visible} onChange={(e) => updateRoute(route.id, { visible: e.target.checked })} />
                <span className="text-sm">Visible</span>
              </label>
            </div>
            <div className="col-span-2">
              <label className="label">Label (optional)</label>
              <input className="input" placeholder="Route label" value={route.label || ''} onChange={(e) => updateRoute(route.id, { label: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Points ({route.points.length})</label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {route.points.map((pt, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-xs bg-panel rounded p-1">
                    <span className="text-text-dim w-6 text-center">{idx + 1}</span>
                    <input type="number" step="0.000001" className="input text-xs w-20" value={pt.lat} onChange={(e) => {
                      const pts = [...route.points]; pts[idx] = { ...pts[idx], lat: parseFloat(e.target.value) }; updateRoute(route.id, { points: pts });
                    }} />
                    <input type="number" step="0.000001" className="input text-xs w-20" value={pt.lng} onChange={(e) => {
                      const pts = [...route.points]; pts[idx] = { ...pts[idx], lng: parseFloat(e.target.value) }; updateRoute(route.id, { points: pts });
                    }} />
                    {route.points.length > 2 && (
                      <button className="text-red-400 hover:text-red-300 text-xs px-1" onClick={() => {
                        const pts = route.points.filter((_, i) => i !== idx); updateRoute(route.id, { points: pts });
                      }}>×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-2xs text-text-dim pt-2 border-t border-panel-border">
            Driving/walking/bicycling/transit routes use Google Directions API (billable).
            Polylines and straight lines are free client-side.
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 150ms ease-out; }
      `}</style>
    </div>
  );
}