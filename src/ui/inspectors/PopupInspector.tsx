import { useProjectStore } from '@/store/projectStore';
import { uid } from '@/lib/id';
import type { PopupBlock, PopupBlockType } from '@/types';

const BLOCK_TYPES: { value: PopupBlockType; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'subtitle', label: 'Subtitle' },
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'address', label: 'Address' },
  { value: 'hours', label: 'Hours' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'button', label: 'Button' },
  { value: 'buttons', label: 'Buttons (from location)' },
  { value: 'badge', label: 'Badge' },
  { value: 'divider', label: 'Divider' },
  { value: 'html', label: 'Custom HTML' },
];

export function PopupInspector() {
  const project = useProjectStore((s) => s.project)!;
  const selectionId = useProjectStore((s) => s.selection.id);
  const update = useProjectStore((s) => s.updatePopupTemplate);
  const remove = useProjectStore((s) => s.removePopupTemplate);

  const t = project.popupTemplates.find((p) => p.id === selectionId);
  if (!t) return <div className="p-4 text-text-muted text-sm">Popup template not found.</div>;

  const patch = (p: any) => update(t.id, p);

  const addBlock = (type: PopupBlockType) => {
    const b: PopupBlock = { id: uid('blk'), type, props: {} };
    if (type === 'title') b.props.source = 'location.name';
    if (type === 'text') b.props.source = 'location.description';
    if (type === 'button') { b.props.label = 'Open directions'; b.props.action = 'directions'; b.props.style = 'primary'; }
    patch({ blocks: [...t.blocks, b] });
  };

  const removeBlock = (id: string) => patch({ blocks: t.blocks.filter((b) => b.id !== id) });
  const moveBlock = (id: string, delta: -1 | 1) => {
    const idx = t.blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const to = idx + delta;
    if (to < 0 || to >= t.blocks.length) return;
    const next = [...t.blocks];
    const [item] = next.splice(idx, 1);
    next.splice(to, 0, item);
    patch({ blocks: next });
  };

  return (
    <div className="p-3 space-y-3">
      <div className="text-2xs uppercase tracking-wider text-text-muted font-semibold">Popup template</div>

      <div className="field">
        <label className="label">Name</label>
        <input className="input" value={t.name} onChange={(e) => patch({ name: e.target.value })} />
      </div>

      <div className="field">
        <label className="label">Variant</label>
        <select className="input" value={t.variant} onChange={(e) => patch({ variant: e.target.value })}>
          <option value="tooltip">Tooltip</option>
          <option value="card">Card (default)</option>
          <option value="floating">Floating card</option>
          <option value="sidepanel">Side panel</option>
          <option value="modal">Modal</option>
          <option value="bottomSheet">Bottom sheet (mobile)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumField label="Width" value={t.width} onChange={(v) => patch({ width: v })} />
        <NumField label="Max width" value={t.maxWidth} onChange={(v) => patch({ maxWidth: v })} />
        <NumField label="Padding" value={t.padding} onChange={(v) => patch({ padding: v })} />
        <NumField label="Radius" value={t.borderRadius} onChange={(v) => patch({ borderRadius: v })} />
        <ColorField label="Background" value={t.background} onChange={(v) => patch({ background: v })} />
        <ColorField label="Border" value={t.borderColor} onChange={(v) => patch({ borderColor: v })} />
        <NumField label="Border width" value={t.borderWidth} onChange={(v) => patch({ borderWidth: v })} />
        <NumField label="Blur (px)" value={t.backdropBlur} onChange={(v) => patch({ backdropBlur: v })} />
      </div>

      <div className="field">
        <label className="label">Shadow (CSS)</label>
        <input className="input font-mono text-xs" value={t.shadow} onChange={(e) => patch({ shadow: e.target.value })} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={t.showArrow} onChange={(e) => patch({ showArrow: e.target.checked })} /> Show arrow
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={t.showClose} onChange={(e) => patch({ showClose: e.target.checked })} /> Show close button
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={t.closeOnOutsideClick} onChange={(e) => patch({ closeOnOutsideClick: e.target.checked })} /> Close on outside click
      </label>

      <div className="divider" />
      <div className="text-2xs uppercase tracking-wider text-text-muted font-semibold">Content blocks</div>
      <div className="space-y-1">
        {t.blocks.map((b) => (
          <div key={b.id} className="border border-panel-border rounded p-2 bg-panel-light">
            <div className="flex items-center gap-1 mb-1">
              <div className="text-xs font-medium flex-1">{BLOCK_TYPES.find((x) => x.value === b.type)?.label ?? b.type}</div>
              <button className="btn-ghost text-2xs" onClick={() => moveBlock(b.id, -1)}>↑</button>
              <button className="btn-ghost text-2xs" onClick={() => moveBlock(b.id, 1)}>↓</button>
              <button className="btn-ghost text-2xs text-red-400" onClick={() => removeBlock(b.id)}>×</button>
            </div>
            <BlockProps block={b} onChange={(props) => patch({ blocks: t.blocks.map((x) => x.id === b.id ? { ...x, props } : x) })} />
          </div>
        ))}
      </div>

      <select className="input text-xs" value="" onChange={(e) => { if (e.target.value) { addBlock(e.target.value as PopupBlockType); e.target.value = ''; } }}>
        <option value="">+ Add block…</option>
        {BLOCK_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
      </select>

      <div className="divider" />
      {project.popupTemplates.length > 1 && (
        <button className="btn-danger text-xs w-full" onClick={() => { if (confirm(`Delete popup "${t.name}"?`)) remove(t.id); }}>
          Delete popup
        </button>
      )}
    </div>
  );
}

function BlockProps({ block, onChange }: { block: PopupBlock; onChange: (props: Record<string, any>) => void }) {
  const p = block.props;
  const set = (k: string, v: any) => onChange({ ...p, [k]: v });
  switch (block.type) {
    case 'title':
    case 'subtitle':
    case 'text':
      return (
        <>
          <input className="input text-xs mb-1" placeholder="Source (e.g. location.name)" value={p.source || ''} onChange={(e) => set('source', e.target.value)} />
          <input className="input text-xs" placeholder="Or fixed text" value={p.text || ''} onChange={(e) => set('text', e.target.value)} />
        </>
      );
    case 'button':
      return (
        <>
          <input className="input text-xs mb-1" placeholder="Label" value={p.label || ''} onChange={(e) => set('label', e.target.value)} />
          <select className="input text-xs mb-1" value={p.action || ''} onChange={(e) => set('action', e.target.value)}>
            <option value="">Open URL</option>
            <option value="directions">Google Directions</option>
            <option value="callPhone">Call phone</option>
            <option value="sendEmail">Send email</option>
          </select>
          {!p.action && <input className="input text-xs mb-1" placeholder="URL" value={p.href || ''} onChange={(e) => set('href', e.target.value)} />}
          <select className="input text-xs" value={p.style || 'primary'} onChange={(e) => set('style', e.target.value)}>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="ghost">Ghost</option>
          </select>
        </>
      );
    case 'badge':
      return (
        <>
          <input className="input text-xs mb-1" placeholder="Text" value={p.text || ''} onChange={(e) => set('text', e.target.value)} />
          <input className="input text-xs" placeholder="Color (bg)" value={p.color || ''} onChange={(e) => set('color', e.target.value)} />
        </>
      );
    case 'html':
      return <textarea className="input text-2xs font-mono" rows={4} value={p.html || ''} onChange={(e) => set('html', e.target.value)} placeholder="<div>…</div>" />;
    default:
      return <div className="text-2xs text-text-dim">Uses data from the location.</div>;
  }
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      <input type="number" className="input" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} />
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
