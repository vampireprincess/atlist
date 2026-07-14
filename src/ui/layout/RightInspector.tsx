import { useProjectStore } from '@/store/projectStore';
import { LocationInspector } from '../inspectors/LocationInspector';
import { MarkerInspector } from '../inspectors/MarkerInspector';
import { PopupInspector } from '../inspectors/PopupInspector';
import { CategoryInspector } from '../inspectors/CategoryInspector';
import { RouteInspector } from '../inspectors/RouteInspector';
import { ShapeInspector } from '../inspectors/ShapeInspector';
import { OverlayInspector } from '../inspectors/OverlayInspector';

export function RightInspector() {
  const selection = useProjectStore((s) => s.selection);

  return (
    <aside className="w-80 shrink-0 border-l border-panel-border bg-panel h-full overflow-y-auto flex flex-col">
      <div className="px-3 py-2 border-b border-panel-border flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-text-muted font-semibold">Inspector</div>
        <div className="text-2xs text-text-dim">{selection.kind ?? 'nothing selected'}</div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!selection.kind && (
          <div className="p-6 text-center text-text-muted text-sm">
            <div className="text-3xl mb-2 opacity-40">◇</div>
            Select an element on the map or in a panel to edit its properties.
          </div>
        )}
        {selection.kind === 'location' && <LocationInspector />}
        {selection.kind === 'markerTemplate' && <MarkerInspector />}
        {selection.kind === 'popupTemplate' && <PopupInspector />}
        {selection.kind === 'category' && <CategoryInspector />}
        {selection.kind === 'route' && <RouteInspector />}
        {selection.kind === 'shape' && <ShapeInspector />}
        {selection.kind === 'overlay' && <OverlayInspector />}
      </div>
    </aside>
  );
}
