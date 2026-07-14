import clsx from 'clsx';
import { useProjectStore } from '@/store/projectStore';

export function ResponsivePanel() {
  const project = useProjectStore((s) => s.project)!;
  const deviceMode = useProjectStore((s) => s.deviceMode);
  const setDeviceMode = useProjectStore((s) => s.setDeviceMode);
  const mutate = useProjectStore((s) => s.mutate);

  return (
    <div className="p-3 space-y-3">
      <div>
        <label className="label">Preview mode</label>
        <div className="flex gap-1">
          {(['desktop', 'tablet', 'mobile'] as const).map((m) => (
            <button
              key={m}
              className={clsx('flex-1 btn text-xs py-1', deviceMode === m ? 'bg-accent text-white' : 'btn-secondary')}
              onClick={() => setDeviceMode(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="divider" />

      <div className="text-sm font-medium">Per-device map override</div>
      {(['tablet', 'mobile'] as const).map((mode) => {
        const active = !!project.mapSettings.responsive[mode];
        return (
          <label key={mode} className="flex items-center gap-2 text-sm">
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
            Override {mode}
          </label>
        );
      })}

      <div className="text-2xs text-text-dim pt-2 border-t border-panel-border">
        The exported map picks the right override automatically based on the visitor's viewport size (mobile &lt; 640 px,
        tablet &lt; 1024 px, desktop otherwise).
      </div>
    </div>
  );
}
