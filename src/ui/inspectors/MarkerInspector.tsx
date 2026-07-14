import { useProjectStore } from '@/store/projectStore';

export function MarkerInspector() {
  const project = useProjectStore((s) => s.project)!;
  const selectionId = useProjectStore((s) => s.selection.id);
  const update = useProjectStore((s) => s.updateMarkerTemplate);
  const remove = useProjectStore((s) => s.removeMarkerTemplate);
  const assets = useProjectStore((s) => s.assets);

  const m = project.markerTemplates.find((t) => t.id === selectionId);
  if (!m) return <div className="p-4 text-text-muted text-sm">Marker template not found.</div>;

  const patch = (p: any) => update(m.id, p);

  return (
    <div className="p-3 space-y-3">
      <div className="text-2xs uppercase tracking-wider text-text-muted font-semibold">Marker template</div>

      <div className="field">
        <label className="label">Name</label>
        <input className="input" value={m.name} onChange={(e) => patch({ name: e.target.value })} />
      </div>

      <div className="field">
        <label className="label">Kind</label>
        <select className="input" value={m.kind} onChange={(e) => patch({ kind: e.target.value })}>
          <option value="pin">Pin (SVG)</option>
          <option value="emoji">Emoji</option>
          <option value="text">Text label</option>
          <option value="image">Image (PNG/JPG/WebP/GIF)</option>
          <option value="svg">SVG asset</option>
          <option value="html">Custom HTML</option>
        </select>
      </div>

      {m.kind === 'pin' && (
        <>
          <ColorField label="Fill" value={m.pinBackground || m.background} onChange={(v) => patch({ pinBackground: v, background: v })} />
          <ColorField label="Border" value={m.pinBorderColor || m.borderColor} onChange={(v) => patch({ pinBorderColor: v, borderColor: v })} />
          <div className="field">
            <label className="label">Glyph (letter or emoji)</label>
            <input className="input" maxLength={2} value={m.pinGlyph || ''} onChange={(e) => patch({ pinGlyph: e.target.value })} />
          </div>
        </>
      )}

      {m.kind === 'emoji' && (
        <div className="field">
          <label className="label">Emoji</label>
          <input className="input text-2xl" value={m.emoji || ''} onChange={(e) => patch({ emoji: e.target.value })} placeholder="📍" />
        </div>
      )}

      {m.kind === 'text' && (
        <>
          <div className="field">
            <label className="label">Text</label>
            <input className="input" value={m.text || ''} onChange={(e) => patch({ text: e.target.value })} />
          </div>
          <ColorField label="Background" value={m.background} onChange={(v) => patch({ background: v })} />
          <ColorField label="Text color" value={m.labelColor || '#ffffff'} onChange={(v) => patch({ labelColor: v })} />
        </>
      )}

      {(m.kind === 'image' || m.kind === 'svg') && (
        <div className="field">
          <label className="label">Asset</label>
          <select
            className="input"
            value={m.imageAssetId || m.svgAssetId || ''}
            onChange={(e) => patch(m.kind === 'svg' ? { svgAssetId: e.target.value } : { imageAssetId: e.target.value })}
          >
            <option value="">(none)</option>
            {assets
              .filter((a) => (m.kind === 'svg' ? a.type === 'svg' : ['png', 'jpg', 'webp', 'gif', 'svg'].includes(a.type)))
              .map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <p className="text-2xs text-text-dim mt-1">Upload files in the Assets panel.</p>
        </div>
      )}

      {m.kind === 'html' && (
        <div className="field">
          <label className="label">HTML template</label>
          <textarea className="input font-mono text-2xs" rows={6} value={m.html || ''} onChange={(e) => patch({ html: e.target.value })} placeholder="<div class='my-marker'>…</div>" />
        </div>
      )}

      <div className="divider" />

      <div className="grid grid-cols-2 gap-2">
        <NumField label="Width (px)" value={m.width} onChange={(v) => patch({ width: v })} min={4} max={400} />
        <NumField label="Height (px)" value={m.height} onChange={(v) => patch({ height: v })} min={4} max={400} />
        <NumField label="Scale" value={m.scale} onChange={(v) => patch({ scale: v })} step={0.1} min={0.1} max={5} />
        <NumField label="Rotation°" value={m.rotation} onChange={(v) => patch({ rotation: v })} step={1} min={-360} max={360} />
        <NumField label="Opacity" value={m.opacity} onChange={(v) => patch({ opacity: v })} step={0.05} min={0} max={1} />
        <NumField label="z-index" value={m.zIndex} onChange={(v) => patch({ zIndex: v })} step={1} />
        <NumField label="Offset X" value={m.offsetX} onChange={(v) => patch({ offsetX: v })} step={1} />
        <NumField label="Offset Y" value={m.offsetY} onChange={(v) => patch({ offsetY: v })} step={1} />
      </div>

      <div className="field">
        <label className="label">Anchor</label>
        <select className="input" value={m.anchor} onChange={(e) => patch({ anchor: e.target.value })}>
          <option value="bottom">Bottom (pin default)</option>
          <option value="center">Center</option>
          <option value="top">Top</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>

      <div className="field">
        <label className="label">Label (below marker)</label>
        <input className="input" value={m.label || ''} onChange={(e) => patch({ label: e.target.value })} />
      </div>
      <div className="field">
        <label className="label">Badge (top-right)</label>
        <input className="input" value={m.badge || ''} onChange={(e) => patch({ badge: e.target.value })} />
      </div>

      <div className="divider" />
      {project.markerTemplates.length > 1 && (
        <button className="btn-danger text-xs w-full" onClick={() => { if (confirm(`Delete "${m.name}"?`)) remove(m.id); }}>
          Delete template
        </button>
      )}
    </div>
  );
}

function NumField({ label, value, onChange, step = 1, min, max }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      <input
        type="number"
        className="input"
        step={step}
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      <div className="flex gap-1">
        <input type="color" className="w-9 h-8 rounded border border-panel-border bg-transparent cursor-pointer" value={value} onChange={(e) => onChange(e.target.value)} />
        <input className="input font-mono text-xs" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
