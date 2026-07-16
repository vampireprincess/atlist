import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useProjectStore } from '@/store/projectStore';
import { useDrawingStore } from '@/store/drawingStore';
import { uid } from '@/lib/id';
import type { ShapeRegion, LatLng } from '@/types';

const SHAPE_KINDS: { value: ShapeRegion['kind']; label: string; description: string }[] = [
  { value: 'polygon', label: 'Polygon', description: 'Custom multi-point shape' },
  { value: 'circle', label: 'Circle', description: 'Radius-based circle (meters)' },
  { value: 'rectangle', label: 'Rectangle', description: 'Bounds-based rectangle' },
  { value: 'geojson', label: 'GeoJSON', description: 'Import GeoJSON FeatureCollection' },
];

export function ShapesPanel() {
  const project = useProjectStore((s) => s.project)!;
  const select = useProjectStore((s) => s.select);
  const mutate = useProjectStore((s) => s.mutate);
  const removeShape = useProjectStore((s) => s.removeShape);
  const updateShape = useProjectStore((s) => s.updateShape);
  const drawingStore = useDrawingStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingKind, setAddingKind] = useState<ShapeRegion['kind'] | null>(null);
  const [circleCenter, setCircleCenter] = useState<LatLng | null>(null);
  const [circleRadius, setCircleRadius] = useState(1000);
  const [rectBounds, setRectBounds] = useState<{ ne: LatLng; sw: LatLng } | null>(null);
  const [geojsonInput, setGeojsonInput] = useState('');

  const shapes = useMemo(() => project.shapes, [project.shapes]);

  const addShape = (kind: ShapeRegion['kind']) => {
    if (kind === 'polygon') {
      setAddingKind('polygon');
      drawingStore.startDrawing('draw-polygon');
    } else if (kind === 'circle') {
      setAddingKind('circle');
      drawingStore.startDrawing('draw-circle');
    } else if (kind === 'rectangle') {
      setAddingKind('rectangle');
      drawingStore.startDrawing('draw-rectangle');
    } else if (kind === 'geojson') {
      setAddingKind('geojson');
      setGeojsonInput('');
    }
  };

  const finishPolygon = () => {
    if (drawingStore.previewPoints.length < 3) {
      alert('Need at least 3 points for a polygon.');
      return;
    }
    const newShape: ShapeRegion = {
      id: uid('shp'),
      name: 'Polygon',
      kind: 'polygon',
      paths: drawingStore.previewPoints,
      fillColor: '#5b8def',
      fillOpacity: 0.3,
      strokeColor: '#5b8def',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      zIndex: 5,
      visible: true,
    };
    mutate('Add shape', (p) => { p.shapes.push(newShape); });
    select('shape', newShape.id);
    setEditingId(newShape.id);
    setAddingKind(null);
    drawingStore.finishDrawing();
  };

  // Note: setCircleCenterPoint is available for future map integration
  void setCircleCenterPoint;

  const finishCircle = () => {
    if (!circleCenter) return;
    const newShape: ShapeRegion = {
      id: uid('shp'),
      name: 'Circle',
      kind: 'circle',
      center: circleCenter,
      radius: circleRadius,
      fillColor: '#5b8def',
      fillOpacity: 0.3,
      strokeColor: '#5b8def',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      zIndex: 5,
      visible: true,
    };
    mutate('Add shape', (p) => { p.shapes.push(newShape); });
    select('shape', newShape.id);
    setEditingId(newShape.id);
    setAddingKind(null);
    setCircleCenter(null);
  };

  const finishRectangle = () => {
    if (!rectBounds) return;
    const newShape: ShapeRegion = {
      id: uid('shp'),
      name: 'Rectangle',
      kind: 'rectangle',
      bounds: rectBounds,
      fillColor: '#5b8def',
      fillOpacity: 0.3,
      strokeColor: '#5b8def',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      zIndex: 5,
      visible: true,
    };
    mutate('Add shape', (p) => { p.shapes.push(newShape); });
    select('shape', newShape.id);
    setEditingId(newShape.id);
    setAddingKind(null);
    setRectBounds(null);
  };

  const finishGeojson = () => {
    try {
      const data = JSON.parse(geojsonInput);
      if (!data || (data.type !== 'FeatureCollection' && data.type !== 'Feature' && data.type !== 'Polygon' && data.type !== 'MultiPolygon')) {
        throw new Error('Invalid GeoJSON. Must be FeatureCollection, Feature, Polygon, or MultiPolygon.');
      }
      const newShape: ShapeRegion = {
        id: uid('shp'),
        name: 'GeoJSON Import',
        kind: 'geojson',
        geojson: data,
        fillColor: '#5b8def',
        fillOpacity: 0.3,
        strokeColor: '#5b8def',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        zIndex: 5,
        visible: true,
      };
      mutate('Add shape', (p) => { p.shapes.push(newShape); });
      select('shape', newShape.id);
      setEditingId(newShape.id);
      setAddingKind(null);
      setGeojsonInput('');
    } catch (err: any) {
      alert('Invalid GeoJSON: ' + err.message);
    }
  };

  const getShape = (id: string) => shapes.find((s) => s.id === id);
  const shape = editingId ? getShape(editingId) : null;

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-text">Shapes &amp; Regions</div>
        <span className="text-2xs text-text-muted">{shapes.length} shapes</span>
      </div>

      {/* Drawing modes */}
      {addingKind === 'polygon' && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 space-y-2 animate-slideDown">
          <div className="font-medium text-blue-300">Drawing Polygon</div>
          <div className="text-sm text-text-muted">Click map to add vertices. {drawingStore.previewPoints.length} point{drawingStore.previewPoints.length !== 1 ? 's' : ''} added.</div>
          <div className="flex gap-1">
            <button className="btn-primary text-xs flex-1" onClick={finishPolygon} disabled={drawingStore.previewPoints.length < 3}>Finish Polygon</button>
            <button className="btn-secondary text-xs" onClick={() => { setAddingKind(null); drawingStore.finishDrawing(); }}>Cancel</button>
          </div>
          {drawingStore.previewPoints.length > 0 && (
            <button className="btn-ghost text-xs" onClick={() => drawingStore.removeLastPreviewPoint()}>Undo Last Point</button>
          )}
        </div>
      )}

      {addingKind === 'circle' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded p-3 space-y-2 animate-slideDown">
          <div className="font-medium text-green-300">Drawing Circle</div>
          <div className="text-sm text-text-muted">
            {circleCenter ? `Center set. Click map to confirm, or adjust radius.` : 'Click map to set center.'}
          </div>
          <div>
            <label className="label">Radius (meters)</label>
            <input type="number" className="input" min={10} max={100000} value={circleRadius} onChange={(e) => setCircleRadius(parseInt(e.target.value))} />
          </div>
          <div className="flex gap-1">
            <button className="btn-primary text-xs flex-1" onClick={finishCircle} disabled={!circleCenter}>Create Circle</button>
            <button className="btn-secondary text-xs" onClick={() => { setAddingKind(null); setCircleCenter(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {addingKind === 'rectangle' && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3 space-y-2 animate-slideDown">
          <div className="font-medium text-purple-300">Drawing Rectangle</div>
          <div className="text-sm text-text-muted">
            {rectBounds ? 'Both corners set.' : !rectBounds ? 'Click for first corner (SW).' : 'Click for second corner (NE).'}
          </div>
          <div className="flex gap-1">
            <button className="btn-primary text-xs flex-1" onClick={finishRectangle} disabled={!rectBounds}>Create Rectangle</button>
            <button className="btn-secondary text-xs" onClick={() => { setAddingKind(null); setRectBounds(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {addingKind === 'geojson' && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3 space-y-2 animate-slideDown">
          <div className="font-medium text-orange-300">Import GeoJSON</div>
          <div className="text-sm text-text-muted">Paste FeatureCollection, Feature, Polygon, or MultiPolygon.</div>
          <textarea
            className="input font-mono text-xs"
            rows={6}
            placeholder='{ "type": "FeatureCollection", "features": [...] }'
            value={geojsonInput}
            onChange={(e) => setGeojsonInput(e.target.value)}
          />
          <div className="flex gap-1">
            <button className="btn-primary text-xs flex-1" onClick={finishGeojson} disabled={!geojsonInput.trim()}>Import</button>
            <button className="btn-secondary text-xs" onClick={() => { setAddingKind(null); setGeojsonInput(''); }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="label">Add Shape</label>
        <div className="grid grid-cols-2 gap-1">
          {SHAPE_KINDS.map((k) => (
            <button
              key={k.value}
              className="btn-secondary text-xs text-left p-2 h-auto rounded"
              onClick={() => addShape(k.value)}
              title={k.description}
            >
              <div className="font-medium">{k.label}</div>
              <div className="text-2xs text-text-dim">{k.description}</div>
            </button>
          ))}
        </div>
      </div>

      {shapes.length > 0 && <div className="divider" />}

      {shapes.length > 0 && (
        <div className="space-y-2">
          <label className="label">Your Shapes</label>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {shapes.map((s) => (
              <div
                key={s.id}
                className={clsx(
                  'group flex items-center gap-2 p-2 rounded cursor-pointer transition-colors',
                  editingId === s.id ? 'bg-accent-muted/40 border border-accent/50' : 'hover:bg-panel-light border border-transparent',
                  !s.visible && 'opacity-50',
                )}
                onClick={() => setEditingId(editingId === s.id ? null : s.id)}
              >
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={s.visible}
                  onChange={(e) => { e.stopPropagation(); updateShape(s.id, { visible: e.target.checked }); }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm truncate">{s.name}</span>
                    <span className="chip text-2xs">{s.kind}</span>
                  </div>
                  <div className="text-2xs text-text-muted">
                    {s.kind === 'polygon' && `${s.paths?.length || 0} vertices`}
                    {s.kind === 'circle' && `r=${Math.round(s.radius || 0)}m`}
                    {s.kind === 'rectangle' && 'bounds'}
                    {s.kind === 'geojson' && 'GeoJSON'}
                  </div>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300 px-1"
                  onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${s.name}"?`)) removeShape(s.id); }}
                >×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {shape && (
        <div className="divider" />
      )}

      {shape && (
        <div className="space-y-3 border border-panel-border rounded-lg p-3 bg-panel-light animate-slideDown">
          <div className="flex items-center justify-between">
            <div className="font-medium">Editing: {shape.name}</div>
            <button className="text-text-muted hover:text-text" onClick={() => setEditingId(null)}>×</button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Name</label>
              <input className="input" value={shape.name} onChange={(e) => updateShape(shape.id, { name: e.target.value })} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={shape.kind} onChange={(e) => updateShape(shape.id, { kind: e.target.value as ShapeRegion['kind'] })}>
                {SHAPE_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fill Color</label>
              <input type="color" className="input h-8 cursor-pointer" value={shape.fillColor} onChange={(e) => updateShape(shape.id, { fillColor: e.target.value })} />
            </div>
            <div>
              <label className="label">Fill Opacity</label>
              <input type="range" className="w-full" min={0} max={1} step={0.05} value={shape.fillOpacity} onChange={(e) => updateShape(shape.id, { fillOpacity: parseFloat(e.target.value) })} />
              <div className="text-2xs text-text-dim">{Math.round(shape.fillOpacity * 100)}%</div>
            </div>
            <div>
              <label className="label">Stroke Color</label>
              <input type="color" className="input h-8 cursor-pointer" value={shape.strokeColor} onChange={(e) => updateShape(shape.id, { strokeColor: e.target.value })} />
            </div>
            <div>
              <label className="label">Stroke Opacity</label>
              <input type="range" className="w-full" min={0} max={1} step={0.05} value={shape.strokeOpacity} onChange={(e) => updateShape(shape.id, { strokeOpacity: parseFloat(e.target.value) })} />
              <div className="text-2xs text-text-dim">{Math.round(shape.strokeOpacity * 100)}%</div>
            </div>
            <div>
              <label className="label">Stroke Weight</label>
              <input type="number" className="input" min={0} max={10} step={0.5} value={shape.strokeWeight} onChange={(e) => updateShape(shape.id, { strokeWeight: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className="label">Z-Index</label>
              <input type="number" className="input" min={0} max={1000} value={shape.zIndex} onChange={(e) => updateShape(shape.id, { zIndex: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="checkbox" checked={shape.visible} onChange={(e) => updateShape(shape.id, { visible: e.target.checked })} />
                <span className="text-sm">Visible</span>
              </label>
            </div>
            <div className="col-span-2">
              <label className="label">Hover Fill Color (optional)</label>
              <input type="color" className="input h-8 cursor-pointer" value={shape.hoverFillColor || shape.fillColor} onChange={(e) => updateShape(shape.id, { hoverFillColor: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Label (optional)</label>
              <input className="input" placeholder="Shape label" value={shape.label || ''} onChange={(e) => updateShape(shape.id, { label: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Popup Template (optional)</label>
              <select className="input" value={shape.popupTemplateId || ''} onChange={(e) => updateShape(shape.id, { popupTemplateId: e.target.value || null })}>
                <option value="">— None —</option>
                {project.popupTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {/* Kind-specific fields */}
            {shape.kind === 'polygon' && (
              <div className="col-span-2">
                <label className="label">Vertices ({shape.paths?.length || 0})</label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {shape.paths?.map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs bg-panel rounded p-1">
                      <span className="text-text-dim w-6 text-center">{idx + 1}</span>
                      <input type="number" step="0.000001" className="input text-xs w-20" value={pt.lat} onChange={(e) => {
                        const pts = [...(shape.paths || [])]; pts[idx] = { ...pts[idx], lat: parseFloat(e.target.value) }; updateShape(shape.id, { paths: pts });
                      }} />
                      <input type="number" step="0.000001" className="input text-xs w-20" value={pt.lng} onChange={(e) => {
                        const pts = [...(shape.paths || [])]; pts[idx] = { ...pts[idx], lng: parseFloat(e.target.value) }; updateShape(shape.id, { paths: pts });
                      }} />
                      {shape.paths && shape.paths.length > 3 && (
                        <button className="text-red-400 hover:text-red-300 text-xs px-1" onClick={() => {
                          const pts = (shape.paths || []).filter((_, i) => i !== idx); updateShape(shape.id, { paths: pts });
                        }}>×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {shape.kind === 'circle' && (
              <div className="col-span-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Center Lat</label>
                  <input type="number" step="0.000001" className="input" value={shape.center?.lat || 0} onChange={(e) => updateShape(shape.id, { center: { ...(shape.center || { lat: 0, lng: 0 }), lat: parseFloat(e.target.value) } })} />
                </div>
                <div>
                  <label className="label">Center Lng</label>
                  <input type="number" step="0.000001" className="input" value={shape.center?.lng || 0} onChange={(e) => updateShape(shape.id, { center: { ...(shape.center || { lat: 0, lng: 0 }), lng: parseFloat(e.target.value) } })} />
                </div>
                <div>
                  <label className="label">Radius (meters)</label>
                  <input type="number" className="input" min={10} max={100000} value={shape.radius || 1000} onChange={(e) => updateShape(shape.id, { radius: parseInt(e.target.value) })} />
                </div>
              </div>
            )}

            {shape.kind === 'rectangle' && (
              <div className="col-span-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="label">NE Lat</label>
                  <input type="number" step="0.000001" className="input" value={shape.bounds?.ne.lat || 0} onChange={(e) => updateShape(shape.id, { bounds: { ...(shape.bounds || { ne: { lat: 0, lng: 0 }, sw: { lat: 0, lng: 0 } }), ne: { ...(shape.bounds?.ne || { lat: 0, lng: 0 }), lat: parseFloat(e.target.value) } } })} />
                </div>
                <div>
                  <label className="label">NE Lng</label>
                  <input type="number" step="0.000001" className="input" value={shape.bounds?.ne.lng || 0} onChange={(e) => updateShape(shape.id, { bounds: { ...(shape.bounds || { ne: { lat: 0, lng: 0 }, sw: { lat: 0, lng: 0 } }), ne: { ...(shape.bounds?.ne || { lat: 0, lng: 0 }), lng: parseFloat(e.target.value) } } })} />
                </div>
                <div>
                  <label className="label">SW Lat</label>
                  <input type="number" step="0.000001" className="input" value={shape.bounds?.sw.lat || 0} onChange={(e) => updateShape(shape.id, { bounds: { ...(shape.bounds || { ne: { lat: 0, lng: 0 }, sw: { lat: 0, lng: 0 } }), sw: { ...(shape.bounds?.sw || { lat: 0, lng: 0 }), lat: parseFloat(e.target.value) } } })} />
                </div>
                <div>
                  <label className="label">SW Lng</label>
                  <input type="number" step="0.000001" className="input" value={shape.bounds?.sw.lng || 0} onChange={(e) => updateShape(shape.id, { bounds: { ...(shape.bounds || { ne: { lat: 0, lng: 0 }, sw: { lat: 0, lng: 0 } }), sw: { ...(shape.bounds?.sw || { lat: 0, lng: 0 }), lng: parseFloat(e.target.value) } } })} />
                </div>
              </div>
            )}

            {shape.kind === 'geojson' && (
              <div className="col-span-2">
                <label className="label">GeoJSON Data</label>
                <textarea
                  className="input font-mono text-xs"
                  rows={8}
                  value={JSON.stringify(shape.geojson, null, 2)}
                  onChange={(e) => {
                    try { updateShape(shape.id, { geojson: JSON.parse(e.target.value) }); } catch {}
                  }}
                />
              </div>
            )}
          </div>

          <div className="text-2xs text-text-dim pt-2 border-t border-panel-border">
            Shapes render as Google Maps Polygon/Circle/Rectangle/Data layer in exports.
            Polygons support holes via GeoJSON MultiPolygon.
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