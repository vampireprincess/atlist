import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { uid } from '@/lib/id';
import type { Location } from '@/types';

export function ImportPanel() {
  const project = useProjectStore((s) => s.project)!;
  const mutate = useProjectStore((s) => s.mutate);
  const setError = useProjectStore((s) => s.setError);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const importCsv = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) throw new Error('CSV must have header + rows.');
      const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
      const nameIdx = header.findIndex((h) => ['name', 'title'].includes(h));
      const latIdx = header.findIndex((h) => ['lat', 'latitude'].includes(h));
      const lngIdx = header.findIndex((h) => ['lng', 'lon', 'long', 'longitude'].includes(h));
      const addrIdx = header.findIndex((h) => ['address'].includes(h));
      const descIdx = header.findIndex((h) => ['description', 'desc'].includes(h));
      if (latIdx < 0 || lngIdx < 0) throw new Error('CSV must have lat and lng columns.');

      const items: Location[] = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i]);
        const lat = parseFloat(row[latIdx]);
        const lng = parseFloat(row[lngIdx]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        items.push({
          id: uid('loc'),
          name: (nameIdx >= 0 && row[nameIdx]) || 'Location',
          address: addrIdx >= 0 ? row[addrIdx] : undefined,
          description: descIdx >= 0 ? row[descIdx] : undefined,
          position: { lat, lng },
          categoryIds: project.categories[0] ? [project.categories[0].id] : [],
          tags: [],
          featured: false,
          markerTemplateId: project.markerTemplates[0]?.id ?? null,
          popupTemplateId: project.popupTemplates[0]?.id ?? null,
          images: [],
          buttons: [],
          customFields: {},
          visible: true,
        });
      }
      mutate(`Import ${items.length} from CSV`, (p) => { p.locations.push(...items); });
      setStatus(`Imported ${items.length} location(s).`);
    } catch (err: any) {
      setError('CSV import failed: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  const importJsonOrGeoJson = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const items: Location[] = [];
      if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
        // GeoJSON
        for (const f of data.features) {
          if (f.geometry?.type !== 'Point') continue;
          const [lng, lat] = f.geometry.coordinates;
          items.push({
            id: uid('loc'),
            name: f.properties?.name || f.properties?.title || 'Location',
            description: f.properties?.description,
            address: f.properties?.address,
            position: { lat, lng },
            categoryIds: project.categories[0] ? [project.categories[0].id] : [],
            tags: [],
            featured: false,
            markerTemplateId: project.markerTemplates[0]?.id ?? null,
            popupTemplateId: project.popupTemplates[0]?.id ?? null,
            images: [],
            buttons: [],
            customFields: {},
            visible: true,
          });
        }
      } else if (Array.isArray(data)) {
        for (const item of data) {
          const lat = item.lat ?? item.latitude ?? item.position?.lat;
          const lng = item.lng ?? item.longitude ?? item.position?.lng;
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
          items.push({
            id: uid('loc'),
            name: item.name || item.title || 'Location',
            description: item.description,
            address: item.address,
            position: { lat, lng },
            categoryIds: project.categories[0] ? [project.categories[0].id] : [],
            tags: [],
            featured: false,
            markerTemplateId: project.markerTemplates[0]?.id ?? null,
            popupTemplateId: project.popupTemplates[0]?.id ?? null,
            images: [],
            buttons: [],
            customFields: {},
            visible: true,
          });
        }
      } else {
        throw new Error('Expected an array of locations or a GeoJSON FeatureCollection.');
      }
      mutate(`Import ${items.length} from JSON`, (p) => { p.locations.push(...items); });
      setStatus(`Imported ${items.length} location(s).`);
    } catch (err: any) {
      setError('Import failed: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-3 space-y-3 text-sm">
      <p className="text-text-muted text-xs">Import locations from CSV, JSON, or GeoJSON. Existing locations are preserved.</p>

      <label className="btn-secondary text-xs block cursor-pointer text-center">
        Import CSV
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])}
        />
      </label>
      <div className="text-2xs text-text-dim -mt-2">Required columns: <code>lat, lng</code>. Optional: <code>name, address, description</code>.</div>

      <label className="btn-secondary text-xs block cursor-pointer text-center">
        Import JSON / GeoJSON
        <input
          type="file"
          accept=".json,.geojson,application/json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && importJsonOrGeoJson(e.target.files[0])}
        />
      </label>

      {busy && <div className="text-2xs text-text-muted">Importing…</div>}
      {status && <div className="text-2xs text-green-400">{status}</div>}
    </div>
  );
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}
