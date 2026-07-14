import clsx from 'clsx';
import { useProjectStore } from '@/store/projectStore';

export function CanvasOverlay() {
  const addMode = useProjectStore((s) => s.addLocationMode);
  const setAddMode = useProjectStore((s) => s.setAddLocationMode);
  const project = useProjectStore((s) => s.project);
  const testMode = useProjectStore((s) => s.testMode);

  if (!project) return null;

  return (
    <>
      {/* Top-center toolbar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="pointer-events-auto flex gap-2 bg-panel/95 backdrop-blur border border-panel-border rounded-lg shadow-lg px-2 py-1.5">
          <button
            className={clsx(
              'btn text-xs px-2.5 py-1',
              addMode ? 'bg-accent text-white' : 'hover:bg-panel-light text-text',
            )}
            onClick={() => setAddMode(!addMode)}
            title="Click on the map to place a new location"
          >
            {addMode ? '● Click map to place' : '+ Add location'}
          </button>
          <div className="text-2xs text-text-muted self-center px-1">
            {project.locations.length} location{project.locations.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {testMode && (
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <div className="pointer-events-auto bg-accent/90 text-white text-2xs px-3 py-1.5 rounded shadow-lg">
            ● Test Mode — clicks preview popups
          </div>
        </div>
      )}

      {addMode && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="pointer-events-auto text-2xs bg-panel/95 border border-panel-border rounded px-3 py-1.5 shadow">
            Press <kbd className="px-1 py-0.5 bg-panel-lighter rounded text-2xs">Esc</kbd> to cancel
          </div>
        </div>
      )}
    </>
  );
}
