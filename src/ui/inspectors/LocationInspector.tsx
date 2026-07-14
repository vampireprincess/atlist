import { useProjectStore } from '@/store/projectStore';
import { uid } from '@/lib/id';
import type { LocationImage } from '@/types';

export function LocationInspector() {
  const project = useProjectStore((s) => s.project)!;
  const selectionId = useProjectStore((s) => s.selection.id);
  const updateLocation = useProjectStore((s) => s.updateLocation);
  const removeLocation = useProjectStore((s) => s.removeLocation);
  const assets = useProjectStore((s) => s.assets);
  const location = project.locations.find((l) => l.id === selectionId);

  if (!location) return <div className="p-4 text-text-muted text-sm">Location not found.</div>;

  const patch = (p: Partial<typeof location>) => updateLocation(location.id, p);

  return (
    <div className="p-3 space-y-3">
      <div className="text-2xs uppercase tracking-wider text-text-muted font-semibold">Location</div>

      <div className="field">
        <label className="label">Name</label>
        <input className="input" value={location.name} onChange={(e) => patch({ name: e.target.value })} />
      </div>
      <div className="field">
        <label className="label">Short name</label>
        <input className="input" value={location.shortName || ''} onChange={(e) => patch({ shortName: e.target.value })} />
      </div>
      <div className="field">
        <label className="label">Address</label>
        <input className="input" value={location.address || ''} onChange={(e) => patch({ address: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="field">
          <label className="label">Lat</label>
          <input type="number" step={0.0001} className="input" value={location.position.lat} onChange={(e) => patch({ position: { ...location.position, lat: parseFloat(e.target.value) || 0 } })} />
        </div>
        <div className="field">
          <label className="label">Lng</label>
          <input type="number" step={0.0001} className="input" value={location.position.lng} onChange={(e) => patch({ position: { ...location.position, lng: parseFloat(e.target.value) || 0 } })} />
        </div>
      </div>

      <div className="field">
        <label className="label">Description</label>
        <textarea className="input" rows={4} value={location.description || ''} onChange={(e) => patch({ description: e.target.value })} />
      </div>

      <div className="field">
        <label className="label">Tags (comma-separated)</label>
        <input className="input" value={location.tags.join(', ')} onChange={(e) => patch({ tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
      </div>

      <div className="field">
        <label className="label">Categories</label>
        <div className="flex flex-wrap gap-1">
          {project.categories.map((c) => {
            const active = location.categoryIds.includes(c.id);
            return (
              <button
                key={c.id}
                className="text-2xs px-2 py-1 rounded-full border transition-colors"
                style={{
                  borderColor: c.color,
                  background: active ? c.color : 'transparent',
                  color: active ? '#fff' : c.color,
                }}
                onClick={() => {
                  const next = active ? location.categoryIds.filter((id) => id !== c.id) : [...location.categoryIds, c.id];
                  patch({ categoryIds: next });
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label className="label">Marker template</label>
        <select className="input" value={location.markerTemplateId ?? ''} onChange={(e) => patch({ markerTemplateId: e.target.value || null })}>
          <option value="">(none)</option>
          {project.markerTemplates.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div className="field">
        <label className="label">Popup template</label>
        <select className="input" value={location.popupTemplateId ?? ''} onChange={(e) => patch({ popupTemplateId: e.target.value || null })}>
          <option value="">(none)</option>
          {project.popupTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={location.featured} onChange={(e) => patch({ featured: e.target.checked })} />
        Featured
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={location.visible} onChange={(e) => patch({ visible: e.target.checked })} />
        Visible on map
      </label>

      <div className="field">
        <label className="label">Phone</label>
        <input className="input" value={location.phone || ''} onChange={(e) => patch({ phone: e.target.value })} />
      </div>
      <div className="field">
        <label className="label">Email</label>
        <input className="input" value={location.email || ''} onChange={(e) => patch({ email: e.target.value })} />
      </div>
      <div className="field">
        <label className="label">Website / link</label>
        <input className="input" value={location.link || ''} onChange={(e) => patch({ link: e.target.value })} />
      </div>
      <div className="field">
        <label className="label">Hours</label>
        <input className="input" value={location.hours || ''} onChange={(e) => patch({ hours: e.target.value })} />
      </div>

      <div className="field">
        <label className="label">Images (from Asset Library)</label>
        <div className="flex flex-wrap gap-1 mb-1">
          {location.images.map((im, idx) => {
            const asset = assets.find((a) => a.id === im.assetId);
            return (
              <div key={idx} className="relative group w-16 h-12 rounded overflow-hidden bg-panel-light border border-panel-border">
                {asset ? <img src={asset.dataUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-2xs text-text-dim flex items-center justify-center h-full">missing</span>}
                <button
                  className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 bg-black/60 text-white w-4 h-4 rounded text-2xs"
                  onClick={() => patch({ images: location.images.filter((_, i) => i !== idx) })}
                >×</button>
              </div>
            );
          })}
        </div>
        <select
          className="input text-xs"
          value=""
          onChange={(e) => {
            if (!e.target.value) return;
            const im: LocationImage = { assetId: e.target.value };
            patch({ images: [...location.images, im] });
            e.target.value = '';
          }}
        >
          <option value="">+ Add image from assets…</option>
          {assets.filter((a) => ['png', 'jpg', 'webp', 'gif', 'svg'].includes(a.type)).map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="label">Buttons</label>
        {location.buttons.map((b, idx) => (
          <div key={b.id} className="border border-panel-border rounded p-2 mb-1 space-y-1">
            <input className="input text-xs" placeholder="Label" value={b.label} onChange={(e) => {
              const next = [...location.buttons];
              next[idx] = { ...b, label: e.target.value };
              patch({ buttons: next });
            }} />
            <select className="input text-xs" value={b.action || ''} onChange={(e) => {
              const next = [...location.buttons];
              next[idx] = { ...b, action: (e.target.value || undefined) as any };
              patch({ buttons: next });
            }}>
              <option value="">Open URL</option>
              <option value="openUrlNewTab">Open URL (new tab)</option>
              <option value="directions">Google Directions</option>
              <option value="callPhone">Call phone</option>
              <option value="sendEmail">Send email</option>
              <option value="copyAddress">Copy address</option>
            </select>
            {(!b.action || b.action === 'openUrl' || b.action === 'openUrlNewTab') && (
              <input className="input text-xs" placeholder="URL" value={b.href || ''} onChange={(e) => {
                const next = [...location.buttons];
                next[idx] = { ...b, href: e.target.value };
                patch({ buttons: next });
              }} />
            )}
            <button className="btn-ghost text-2xs text-red-400" onClick={() => patch({ buttons: location.buttons.filter((_, i) => i !== idx) })}>Remove</button>
          </div>
        ))}
        <button
          className="btn-secondary text-xs w-full"
          onClick={() => patch({ buttons: [...location.buttons, { id: uid('btn'), label: 'New button', style: 'primary' }] })}
        >+ Add button</button>
      </div>

      <div className="divider" />
      <button className="btn-danger text-xs w-full" onClick={() => { if (confirm(`Delete "${location.name}"?`)) removeLocation(location.id); }}>
        Delete location
      </button>
    </div>
  );
}
