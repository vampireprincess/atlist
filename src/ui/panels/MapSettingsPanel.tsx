import { useProjectStore } from '@/store/projectStore';

export function MapSettingsPanel() {
  const project = useProjectStore((s) => s.project);
  const mutate = useProjectStore((s) => s.mutate);
  const deviceMode = useProjectStore((s) => s.deviceMode);

  if (!project) return null;
  const s = project.mapSettings;

  return (
    <div className="p-3 space-y-4">
      <section>
        <h4 className="text-2xs uppercase tracking-wider text-text-muted mb-2 font-semibold">
          {deviceMode === 'desktop' ? 'Starting position' : `Starting position (${deviceMode})`}
        </h4>
        {deviceMode === 'desktop' ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <NumField label="Center lat" value={s.center.lat} step={0.0001} onChange={(v) => mutate('Set center', (p) => { p.mapSettings.center.lat = v; })} />
              <NumField label="Center lng" value={s.center.lng} step={0.0001} onChange={(v) => mutate('Set center', (p) => { p.mapSettings.center.lng = v; })} />
            </div>
            <NumField label="Zoom" value={s.zoom} step={1} min={0} max={22} onChange={(v) => mutate('Set zoom', (p) => { p.mapSettings.zoom = v; })} />
          </>
        ) : (
          <ResponsiveOverride mode={deviceMode} />
        )}
      </section>

      <section>
        <h4 className="text-2xs uppercase tracking-wider text-text-muted mb-2 font-semibold">Zoom range</h4>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Min zoom" value={s.minZoom} min={0} max={22} step={1} onChange={(v) => mutate('Set min zoom', (p) => { p.mapSettings.minZoom = v; })} />
          <NumField label="Max zoom" value={s.maxZoom} min={0} max={22} step={1} onChange={(v) => mutate('Set max zoom', (p) => { p.mapSettings.maxZoom = v; })} />
        </div>
      </section>

      <section>
        <h4 className="text-2xs uppercase tracking-wider text-text-muted mb-2 font-semibold">Map type</h4>
        <select
          className="input"
          value={s.mapType}
          onChange={(e) => mutate('Set map type', (p) => { p.mapSettings.mapType = e.target.value as any; })}
        >
          <option value="roadmap">Roadmap</option>
          <option value="satellite">Satellite</option>
          <option value="hybrid">Hybrid</option>
          <option value="terrain">Terrain</option>
        </select>
        <div className="field mt-2">
          <label className="label">Map ID (per-project override)</label>
          <input
            className="input font-mono text-xs"
            value={s.mapId || ''}
            onChange={(e) => mutate('Set Map ID', (p) => { p.mapSettings.mapId = e.target.value; })}
            placeholder="Uses editor Map ID by default"
          />
        </div>
      </section>

      <section>
        <h4 className="text-2xs uppercase tracking-wider text-text-muted mb-2 font-semibold">Controls</h4>
        {(['zoom', 'fullscreen', 'streetView', 'mapType', 'scaleControl', 'rotateControl'] as const).map((k) => (
          <label key={k} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
            <input
              type="checkbox"
              checked={s.controls[k]}
              onChange={(e) => mutate('Toggle control', (p) => { p.mapSettings.controls[k] = e.target.checked; })}
            />
            {k}
          </label>
        ))}
      </section>

      <section>
        <h4 className="text-2xs uppercase tracking-wider text-text-muted mb-2 font-semibold">Gestures</h4>
        <div className="field">
          <label className="label">Gesture handling</label>
          <select
            className="input"
            value={s.gestures.gestureHandling}
            onChange={(e) => mutate('Set gestures', (p) => { p.mapSettings.gestures.gestureHandling = e.target.value as any; })}
          >
            <option value="auto">auto</option>
            <option value="greedy">greedy</option>
            <option value="cooperative">cooperative</option>
            <option value="none">none</option>
          </select>
        </div>
        {(['scrollwheel', 'draggable', 'disableDoubleClickZoom', 'keyboardShortcuts'] as const).map((k) => (
          <label key={k} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
            <input
              type="checkbox"
              checked={s.gestures[k] as boolean}
              onChange={(e) => mutate('Set gesture', (p) => { (p.mapSettings.gestures as any)[k] = e.target.checked; })}
            />
            {k}
          </label>
        ))}
      </section>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      <input
        className="input"
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(Number.isFinite(v) ? v : 0);
        }}
      />
    </div>
  );
}

function ResponsiveOverride({ mode }: { mode: 'tablet' | 'mobile' }) {
  const project = useProjectStore((s) => s.project)!;
  const mutate = useProjectStore((s) => s.mutate);
  const override = project.mapSettings.responsive[mode];
  const active = !!override;

  return (
    <div>
      <label className="flex items-center gap-2 text-sm mb-2">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => mutate('Toggle responsive override', (p) => {
            if (e.target.checked) {
              p.mapSettings.responsive[mode] = { center: { ...p.mapSettings.center }, zoom: p.mapSettings.zoom };
            } else {
              delete p.mapSettings.responsive[mode];
            }
          })}
        />
        Override on {mode}
      </label>
      {active && override && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <NumField label="Center lat" value={override.center?.lat ?? project.mapSettings.center.lat} step={0.0001} onChange={(v) => mutate('Set responsive lat', (p) => {
              const o = p.mapSettings.responsive[mode]!;
              o.center = { lat: v, lng: o.center?.lng ?? p.mapSettings.center.lng };
            })} />
            <NumField label="Center lng" value={override.center?.lng ?? project.mapSettings.center.lng} step={0.0001} onChange={(v) => mutate('Set responsive lng', (p) => {
              const o = p.mapSettings.responsive[mode]!;
              o.center = { lat: o.center?.lat ?? p.mapSettings.center.lat, lng: v };
            })} />
          </div>
          <NumField label="Zoom" value={override.zoom ?? project.mapSettings.zoom} min={0} max={22} step={1} onChange={(v) => mutate('Set responsive zoom', (p) => { p.mapSettings.responsive[mode]!.zoom = v; })} />
        </>
      )}
    </div>
  );
}
