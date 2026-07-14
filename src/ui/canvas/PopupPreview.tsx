import { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { getPopupTemplate } from '@/lib/lookup';
import { PopupRenderer } from './PopupRenderer';

interface Props {
  locationId: string;
  onClose: () => void;
  map: google.maps.Map | null;
}

export function PopupPreview({ locationId, onClose, map }: Props) {
  const project = useProjectStore((s) => s.project);
  const location = project?.locations.find((l) => l.id === locationId) ?? null;
  const [pxPos, setPxPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!map || !location) return;
    const project = useProjectStore.getState().project;
    if (!project) return;
    const proj = map.getProjection();
    if (!proj) return;

    const compute = () => {
      const overlay = map.getDiv();
      const rect = overlay.getBoundingClientRect();
      // Use projection: convert LatLng to point using a fake OverlayView
      // Simpler: use pixel bounds from map center
      const projection = (map as any).getProjection?.();
      if (!projection) return;
      const bounds = map.getBounds();
      if (!bounds) return;
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const lngSpan = ne.lng() - sw.lng();
      const latSpan = ne.lat() - sw.lat();
      const x = ((location.position.lng - sw.lng()) / lngSpan) * rect.width;
      const y = rect.height - ((location.position.lat - sw.lat()) / latSpan) * rect.height;
      setPxPos({ x, y });
    };

    compute();
    const listeners = [
      map.addListener('bounds_changed', compute),
      map.addListener('zoom_changed', compute),
      map.addListener('center_changed', compute),
    ];
    return () => listeners.forEach((l) => l.remove());
  }, [map, location]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!project || !location || !pxPos) return null;
  const template = getPopupTemplate(project.popupTemplates, location.popupTemplateId, location.popupOverride);

  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{ left: pxPos.x, top: pxPos.y, transform: 'translate(-50%, calc(-100% - 20px))' }}
    >
      <div className="pointer-events-auto">
        <PopupRenderer template={template} location={location} project={project} onClose={onClose} />
      </div>
    </div>
  );
}
