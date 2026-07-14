import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { initLoader, loadMapsLib, loadMarkerLib } from '@/lib/gmaps';
import { CanvasOverlay } from './CanvasOverlay';
import { renderMarkerDom } from './markerRenderer';
import { getMarkerTemplate } from '@/lib/lookup';
import { PopupPreview } from './PopupPreview';

const DEVICE_WIDTH: Record<string, number | null> = {
  desktop: null,
  tablet: 900,
  mobile: 420,
};

export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [previewingPopupFor, setPreviewingPopupFor] = useState<string | null>(null);

  const apiConfig = useProjectStore((s) => s.apiConfig);
  const project = useProjectStore((s) => s.project);
  const selection = useProjectStore((s) => s.selection);
  const addLocationMode = useProjectStore((s) => s.addLocationMode);
  const setAddLocationMode = useProjectStore((s) => s.setAddLocationMode);
  const addLocationAt = useProjectStore((s) => s.addLocationAt);
  const updateLocation = useProjectStore((s) => s.updateLocation);
  const deviceMode = useProjectStore((s) => s.deviceMode);
  const testMode = useProjectStore((s) => s.testMode);
  const setError = useProjectStore((s) => s.setError);

  // Initialize the map exactly once per API key.
  useEffect(() => {
    if (!apiConfig || !containerRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        initLoader({ apiKey: apiConfig.editorApiKey });
        await loadMapsLib();
        await loadMarkerLib();
        if (cancelled || !containerRef.current) return;

        const settings = project?.mapSettings;
        const map = new google.maps.Map(containerRef.current, {
          center: settings?.center ?? { lat: 44.7866, lng: 20.4489 },
          zoom: settings?.zoom ?? 12,
          minZoom: settings?.minZoom,
          maxZoom: settings?.maxZoom,
          mapId: apiConfig.editorMapId || undefined,
          mapTypeId: settings?.mapType ?? 'roadmap',
          zoomControl: settings?.controls.zoom ?? true,
          fullscreenControl: settings?.controls.fullscreen ?? true,
          streetViewControl: settings?.controls.streetView ?? false,
          mapTypeControl: settings?.controls.mapType ?? true,
          scaleControl: settings?.controls.scaleControl ?? false,
          rotateControl: settings?.controls.rotateControl ?? false,
          gestureHandling: settings?.gestures.gestureHandling ?? 'auto',
          scrollwheel: settings?.gestures.scrollwheel ?? true,
          draggable: settings?.gestures.draggable ?? true,
          disableDoubleClickZoom: settings?.gestures.disableDoubleClickZoom ?? false,
          keyboardShortcuts: settings?.gestures.keyboardShortcuts ?? true,
          clickableIcons: false,
        });
        mapRef.current = map;

        // Click on map handles "add location" mode
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          const state = useProjectStore.getState();
          if (state.addLocationMode && e.latLng) {
            const loc = addLocationAt(e.latLng.toJSON());
            void loc;
            setAddLocationMode(false);
          } else {
            state.clearSelection();
          }
        });

        setLoaded(true);
      } catch (err: any) {
        const message = err?.message ?? String(err);
        console.error('[MapCanvas] Google Maps failed to load:', err);
        setLoadError(message);
        setError('Failed to load Google Maps: ' + message);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only re-initialize on API key/Map ID change — everything else is synced by the
    // effects below to avoid tearing down the Google Map on unrelated state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiConfig?.editorApiKey, apiConfig?.editorMapId]);

  // Sync core map options with project settings
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !project) return;
    const s = project.mapSettings;
    map.setOptions({
      minZoom: s.minZoom,
      maxZoom: s.maxZoom,
      mapTypeId: s.mapType,
      zoomControl: s.controls.zoom,
      fullscreenControl: s.controls.fullscreen,
      streetViewControl: s.controls.streetView,
      mapTypeControl: s.controls.mapType,
      scaleControl: s.controls.scaleControl,
      rotateControl: s.controls.rotateControl,
      gestureHandling: s.gestures.gestureHandling,
      scrollwheel: s.gestures.scrollwheel,
      draggable: s.gestures.draggable,
      disableDoubleClickZoom: s.gestures.disableDoubleClickZoom,
      keyboardShortcuts: s.gestures.keyboardShortcuts,
    });
    if (s.bounds) {
      const b = new google.maps.LatLngBounds(s.bounds.sw, s.bounds.ne);
      map.setOptions({ restriction: { latLngBounds: b, strictBounds: false } });
    }
    // We intentionally depend on the mapSettings object identity plus `loaded`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.mapSettings, loaded]);

  // Render / diff markers when locations change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !project || !loaded) return;
    const templates = project.markerTemplates;
    const currentIds = new Set(project.locations.filter((l) => l.visible).map((l) => l.id));

    // Remove markers that no longer exist
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.map = null;
        markersRef.current.delete(id);
      }
    });

    // Add or update
    for (const loc of project.locations) {
      if (!loc.visible) continue;
      const template = getMarkerTemplate(templates, loc.markerTemplateId, loc.markerOverride);
      const domEl = renderMarkerDom(template, {
        selected: selection.kind === 'location' && selection.id === loc.id,
      });

      let marker = markersRef.current.get(loc.id);
      if (!marker) {
        marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: loc.position,
          content: domEl,
          gmpDraggable: !testMode,
          title: loc.name,
          zIndex: template.zIndex ?? 1,
        });
        markersRef.current.set(loc.id, marker);
        marker.addListener('click', () => {
          const st = useProjectStore.getState();
          st.select('location', loc.id);
          if (st.testMode) {
            setPreviewingPopupFor(loc.id);
          }
        });
        marker.addListener('dragend', () => {
          const pos = marker!.position;
          if (!pos) return;
          const latLng = pos instanceof google.maps.LatLng ? pos.toJSON() : (pos as google.maps.LatLngLiteral);
          updateLocation(loc.id, { position: { lat: latLng.lat, lng: latLng.lng } });
        });
      } else {
        marker.position = loc.position;
        marker.content = domEl;
        marker.title = loc.name;
        marker.gmpDraggable = !testMode;
        marker.zIndex = template.zIndex ?? 1;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.locations, project?.markerTemplates, selection, loaded, testMode, updateLocation]);

  // Change cursor when in "add location" mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setOptions({ draggableCursor: addLocationMode ? 'crosshair' : undefined });
  }, [addLocationMode]);

  const width = DEVICE_WIDTH[deviceMode];

  return (
    <div className="absolute inset-0 flex items-stretch justify-center bg-black">
      <div
        className="relative h-full transition-all duration-200"
        style={width ? { width: `${width}px`, maxWidth: '100%' } : { width: '100%' }}
      >
        <div ref={containerRef} className="absolute inset-0" />
        {!loaded && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted bg-surface">
            <div className="text-center">
              <div className="animate-pulse mb-2">◐</div>
              Loading Google Maps…
            </div>
          </div>
        )}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface p-6">
            <div className="max-w-md text-center">
              <div className="text-red-400 text-4xl mb-3">⚠</div>
              <div className="text-text font-medium mb-2">Google Maps failed to load</div>
              <div className="text-text-muted text-sm mb-4">{loadError}</div>
              <div className="text-2xs text-text-dim">
                Check that your API key is valid, that Maps JavaScript API is enabled, and that your key's HTTP referrer
                restrictions allow this page.
              </div>
            </div>
          </div>
        )}
        {loaded && <CanvasOverlay />}
        {loaded && previewingPopupFor && (
          <PopupPreview locationId={previewingPopupFor} onClose={() => setPreviewingPopupFor(null)} map={mapRef.current} />
        )}
      </div>
    </div>
  );
}
