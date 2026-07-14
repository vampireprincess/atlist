import { useRef } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { uid } from '@/lib/id';
import type { Asset } from '@/types';

const ACCEPTED = 'image/svg+xml,image/png,image/jpeg,image/webp,image/gif,application/json,text/csv';

async function fileToAsset(file: File): Promise<Asset> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const typeMap: Record<string, Asset['type']> = {
    svg: 'svg', png: 'png', jpg: 'jpg', jpeg: 'jpg', webp: 'webp', gif: 'gif',
    json: 'json', geojson: 'geojson', csv: 'csv',
  };
  let width: number | undefined;
  let height: number | undefined;
  if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
    try {
      const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = reject;
        img.src = dataUrl;
      });
      width = dims.w; height = dims.h;
    } catch {}
  }
  return {
    id: uid('ast'),
    name: file.name,
    type: typeMap[ext] ?? 'png',
    dataUrl,
    size: file.size,
    width,
    height,
    tags: [],
    createdAt: Date.now(),
  };
}

export function AssetsPanel() {
  const assets = useProjectStore((s) => s.assets);
  const addAsset = useProjectStore((s) => s.addAsset);
  const removeAsset = useProjectStore((s) => s.removeAsset);
  const setError = useProjectStore((s) => s.setError);
  const project = useProjectStore((s) => s.project)!;
  const mutate = useProjectStore((s) => s.mutate);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      try {
        if (f.size > 4 * 1024 * 1024) {
          setError(`"${f.name}" is larger than 4 MB — consider optimizing before uploading.`);
        }
        const asset = await fileToAsset(f);
        addAsset(asset);
      } catch (err: any) {
        setError('Failed to import ' + f.name + ': ' + err.message);
      }
    }
  };

  const usageOf = (assetId: string) => {
    let count = 0;
    for (const l of project.locations) {
      if (l.images.some((i) => i.assetId === assetId)) count++;
    }
    for (const m of project.markerTemplates) {
      if (m.imageAssetId === assetId || m.svgAssetId === assetId) count++;
    }
    return count;
  };

  return (
    <div className="p-3 space-y-3">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        multiple
        accept={ACCEPTED}
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
      <button className="btn-primary text-xs w-full" onClick={() => fileRef.current?.click()}>
        Upload files
      </button>

      <div className="text-2xs text-text-muted">{assets.length} asset{assets.length !== 1 ? 's' : ''}</div>

      {assets.length === 0 && (
        <div className="text-center text-text-muted text-xs py-6">
          No assets yet. Upload SVG, PNG, WebP, GIF, JSON, or CSV.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {assets.map((a) => {
          const usage = usageOf(a.id);
          const isImg = ['svg', 'png', 'jpg', 'webp', 'gif'].includes(a.type);
          return (
            <div key={a.id} className="border border-panel-border rounded p-1.5 bg-panel-light">
              <div className="aspect-square bg-surface rounded flex items-center justify-center overflow-hidden">
                {isImg ? (
                  <img src={a.dataUrl} alt={a.name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="text-text-muted text-xs uppercase">{a.type}</div>
                )}
              </div>
              <div className="mt-1 text-2xs truncate" title={a.name}>{a.name}</div>
              <div className="text-2xs text-text-dim">{Math.round(a.size / 1024)} KB · used {usage}×</div>
              <div className="flex gap-0.5 mt-1">
                {isImg && (
                  <button
                    className="btn-ghost text-2xs flex-1"
                    onClick={() => {
                      const t = { ...project.markerTemplates[0], id: 'preview' };
                      void t;
                      // create a new image marker using this asset
                      const newMarker = { ...project.markerTemplates[0] };
                      const copy = JSON.parse(JSON.stringify(newMarker));
                      copy.id = uid('mkr');
                      copy.name = `From ${a.name}`;
                      copy.kind = a.type === 'svg' ? 'svg' : 'image';
                      copy.imageAssetId = a.id;
                      copy.svgAssetId = a.type === 'svg' ? a.id : undefined;
                      copy.width = 40; copy.height = 40;
                      copy.background = 'transparent';
                      mutate('Marker from asset', (p) => { p.markerTemplates.push(copy); });
                    }}
                    title="Create marker from this asset"
                  >
                    → Marker
                  </button>
                )}
                <button
                  className="btn-ghost text-2xs text-red-400"
                  onClick={() => {
                    if (usage > 0) {
                      if (!confirm(`This asset is used ${usage} time(s). Delete anyway?`)) return;
                    }
                    removeAsset(a.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
