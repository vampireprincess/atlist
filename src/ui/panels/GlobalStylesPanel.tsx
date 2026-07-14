import { useProjectStore } from '@/store/projectStore';

export function GlobalStylesPanel() {
  const project = useProjectStore((s) => s.project)!;
  const mutate = useProjectStore((s) => s.mutate);
  const g = project.globalStyles;

  return (
    <div className="p-3 space-y-3">
      <div className="field">
        <label className="label">Font family</label>
        <input className="input" value={g.fontFamily} onChange={(e) => mutate('Font family', (p) => { p.globalStyles.fontFamily = e.target.value; })} />
      </div>
      <div className="field">
        <label className="label">Custom font URL (optional)</label>
        <input className="input font-mono text-xs" value={g.customFontUrl || ''} onChange={(e) => mutate('Custom font URL', (p) => { p.globalStyles.customFontUrl = e.target.value; })} placeholder="https://fonts.googleapis.com/…" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ColorField label="Primary" value={g.primaryColor} onChange={(v) => mutate('Primary color', (p) => { p.globalStyles.primaryColor = v; })} />
        <ColorField label="Secondary" value={g.secondaryColor} onChange={(v) => mutate('Secondary color', (p) => { p.globalStyles.secondaryColor = v; })} />
        <ColorField label="Text" value={g.textColor} onChange={(v) => mutate('Text color', (p) => { p.globalStyles.textColor = v; })} />
        <ColorField label="Background" value={g.backgroundColor} onChange={(v) => mutate('Background color', (p) => { p.globalStyles.backgroundColor = v; })} />
      </div>
      <div className="field">
        <label className="label">Border radius (px)</label>
        <input type="number" className="input" value={g.borderRadius} onChange={(e) => mutate('Border radius', (p) => { p.globalStyles.borderRadius = parseInt(e.target.value) || 0; })} />
      </div>
      <div className="divider" />
      <div className="text-2xs uppercase tracking-wider text-text-muted font-semibold mb-1">Advanced</div>
      <div className="field">
        <label className="label">Project custom CSS</label>
        <textarea
          className="input font-mono text-2xs"
          rows={8}
          value={project.customCode?.css || ''}
          onChange={(e) => mutate('Custom CSS', (p) => { p.customCode.css = e.target.value; })}
          placeholder=".atlist-popup { border-radius: 20px }"
        />
        <p className="text-2xs text-text-dim mt-1">Included in the exported CSS. Invalid CSS is silently ignored by the browser.</p>
      </div>
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
