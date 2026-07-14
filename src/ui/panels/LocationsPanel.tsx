import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useProjectStore } from '@/store/projectStore';
import { loadGeocodingLib, loadPlacesLib } from '@/lib/gmaps';
import { uid } from '@/lib/id';
import type { Location } from '@/types';

export function LocationsPanel() {
  const project = useProjectStore((s) => s.project)!;
  const selection = useProjectStore((s) => s.selection);
  const select = useProjectStore((s) => s.select);
  const setAddMode = useProjectStore((s) => s.setAddLocationMode);
  const addLocationMode = useProjectStore((s) => s.addLocationMode);
  const mutate = useProjectStore((s) => s.mutate);
  const removeLocation = useProjectStore((s) => s.removeLocation);
  const setError = useProjectStore((s) => s.setError);
  const [q, setQ] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [addingByAddress, setAddingByAddress] = useState(false);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return project.locations;
    return project.locations.filter((l) =>
      l.name.toLowerCase().includes(n) ||
      (l.address || '').toLowerCase().includes(n) ||
      l.tags.some((t) => t.toLowerCase().includes(n)),
    );
  }, [project.locations, q]);

  const addByAddress = async () => {
    if (!addressInput.trim()) return;
    setAddingByAddress(true);
    try {
      const geo = await loadGeocodingLib();
      const geocoder = new geo.Geocoder();
      const res = await geocoder.geocode({ address: addressInput.trim() });
      if (!res.results.length) throw new Error('No results found for this address.');
      const first = res.results[0];
      const pos = first.geometry.location.toJSON();
      const cat = project.categories[0];
      const loc: Location = {
        id: uid('loc'),
        name: first.formatted_address.split(',')[0] || 'New location',
        address: first.formatted_address,
        position: pos,
        categoryIds: cat ? [cat.id] : [],
        tags: [],
        featured: false,
        markerTemplateId: project.markerTemplates[0]?.id ?? null,
        popupTemplateId: project.popupTemplates[0]?.id ?? null,
        images: [],
        buttons: [],
        customFields: {},
        visible: true,
      };
      mutate('Add location from address', (p) => { p.locations.push(loc); });
      select('location', loc.id);
      setAddressInput('');
    } catch (err: any) {
      setError('Geocoding failed: ' + err.message);
    } finally {
      setAddingByAddress(false);
    }
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex gap-1">
        <button
          className={clsx('btn text-xs flex-1', addLocationMode ? 'bg-accent text-white' : 'btn-primary')}
          onClick={() => setAddMode(!addLocationMode)}
        >
          {addLocationMode ? '● Click on map' : '+ Add on map'}
        </button>
      </div>

      <div>
        <label className="label">Add by address / place</label>
        <div className="flex gap-1">
          <input
            className="input"
            placeholder="Address or place name"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addByAddress(); }}
          />
          <button className="btn-secondary text-xs" onClick={addByAddress} disabled={addingByAddress}>
            {addingByAddress ? '…' : 'Add'}
          </button>
        </div>
        <p className="text-2xs text-text-dim mt-1">Uses Google Geocoding API (billable).</p>
      </div>

      <div>
        <label className="label">Add by coordinates</label>
        <CoordAdder />
      </div>

      <div className="divider" />

      <div>
        <input
          className="input"
          placeholder="Search locations…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="text-2xs text-text-muted">
        {filtered.length} of {project.locations.length}
      </div>

      <div className="space-y-1">
        {filtered.length === 0 && (
          <div className="text-center text-text-muted text-xs py-6">
            No locations yet. Click "Add on map" or enter an address above.
          </div>
        )}
        {filtered.map((l) => (
          <div
            key={l.id}
            className={clsx(
              'group flex items-center gap-2 p-2 rounded cursor-pointer',
              selection.id === l.id ? 'bg-accent-muted/40 border border-accent/50' : 'hover:bg-panel-light border border-transparent',
            )}
            onClick={() => select('location', l.id)}
          >
            <span className="text-lg">{l.featured ? '⭐' : '📍'}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{l.name}</div>
              {l.address && <div className="text-2xs text-text-muted truncate">{l.address}</div>}
            </div>
            <button
              className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300 px-1"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete "${l.name}"?`)) removeLocation(l.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <PlacesQuickAdd />
    </div>
  );
}

function CoordAdder() {
  const project = useProjectStore((s) => s.project)!;
  const mutate = useProjectStore((s) => s.mutate);
  const select = useProjectStore((s) => s.select);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const add = () => {
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return;
    const cat = project.categories[0];
    const loc: Location = {
      id: uid('loc'),
      name: 'New location',
      position: { lat: la, lng: ln },
      categoryIds: cat ? [cat.id] : [],
      tags: [],
      featured: false,
      markerTemplateId: project.markerTemplates[0]?.id ?? null,
      popupTemplateId: project.popupTemplates[0]?.id ?? null,
      images: [],
      buttons: [],
      customFields: {},
      visible: true,
    };
    mutate('Add location by coords', (p) => { p.locations.push(loc); });
    select('location', loc.id);
    setLat(''); setLng('');
  };

  return (
    <div className="flex gap-1">
      <input className="input" placeholder="lat" value={lat} onChange={(e) => setLat(e.target.value)} />
      <input className="input" placeholder="lng" value={lng} onChange={(e) => setLng(e.target.value)} />
      <button className="btn-secondary text-xs" onClick={add}>Add</button>
    </div>
  );
}

function PlacesQuickAdd() {
  const project = useProjectStore((s) => s.project)!;
  const mutate = useProjectStore((s) => s.mutate);
  const select = useProjectStore((s) => s.select);
  const setError = useProjectStore((s) => s.setError);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const search = async () => {
    if (!q.trim()) return;
    setBusy(true);
    try {
      const places = await loadPlacesLib();
      // Text Search (New)
      const { places: results } = await (places as any).Place.searchByText({
        textQuery: q.trim(),
        fields: ['displayName', 'formattedAddress', 'location'],
        maxResultCount: 1,
      });
      const first = results?.[0];
      if (!first) throw new Error('No places found.');
      const pos = first.location as google.maps.LatLng;
      const cat = project.categories[0];
      const loc: Location = {
        id: uid('loc'),
        name: first.displayName ?? q,
        address: first.formattedAddress ?? '',
        position: { lat: pos.lat(), lng: pos.lng() },
        categoryIds: cat ? [cat.id] : [],
        tags: [],
        featured: false,
        markerTemplateId: project.markerTemplates[0]?.id ?? null,
        popupTemplateId: project.popupTemplates[0]?.id ?? null,
        images: [],
        buttons: [],
        customFields: {},
        visible: true,
      };
      mutate('Add from Places', (p) => { p.locations.push(loc); });
      select('location', loc.id);
      setQ('');
    } catch (err: any) {
      setError('Places search failed: ' + (err?.message ?? String(err)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="divider" />
      <label className="label">Google Places search</label>
      <div className="flex gap-1">
        <input
          className="input"
          placeholder="e.g. Eiffel Tower"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
        />
        <button className="btn-secondary text-xs" onClick={search} disabled={busy}>
          {busy ? '…' : 'Find'}
        </button>
      </div>
      <p className="text-2xs text-text-dim mt-1">Uses Places API — separate from in-project search. Billable.</p>
    </div>
  );
}
