import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';

export function ApiSetupDialog() {
  const setApiConfig = useProjectStore((s) => s.setApiConfig);
  const [editorApiKey, setEditorApiKey] = useState('');
  const [editorMapId, setEditorMapId] = useState('');
  const [exportApiKey, setExportApiKey] = useState('');
  const [exportMapId, setExportMapId] = useState('');
  const [useSame, setUseSame] = useState(true);

  const canSave = editorApiKey.trim().length > 10;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setApiConfig({
      editorApiKey: editorApiKey.trim(),
      editorMapId: editorMapId.trim(),
      exportApiKey: (useSame ? editorApiKey : exportApiKey).trim(),
      exportMapId: (useSame ? editorMapId : exportMapId).trim(),
      savedAt: Date.now(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface flex items-center justify-center p-6 overflow-auto">
      <form onSubmit={submit} className="w-full max-w-lg bg-panel border border-panel-border rounded-lg p-6 shadow-2xl">
        <h1 className="text-xl font-semibold text-text mb-1">Welcome to Atlist</h1>
        <p className="text-text-muted text-sm mb-5">
          To start, connect your Google Maps API keys. Keys are stored only in your browser's local storage —
          they are never sent to any server.
        </p>

        <div className="field">
          <label className="label">Editor API key <span className="text-red-400">*</span></label>
          <input
            className="input font-mono text-xs"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={editorApiKey}
            onChange={(e) => setEditorApiKey(e.target.value)}
            placeholder="AIza…"
          />
          <p className="text-2xs text-text-dim mt-1">Used only inside this editor.</p>
        </div>

        <div className="field">
          <label className="label">Editor Map ID (optional but recommended)</label>
          <input
            className="input font-mono text-xs"
            value={editorMapId}
            onChange={(e) => setEditorMapId(e.target.value)}
            placeholder="e.g. 8f4b6e9c1a2d3e4f"
          />
          <p className="text-2xs text-text-dim mt-1">Required for Advanced Markers &amp; cloud-based map styles.</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-text mb-3 cursor-pointer">
          <input type="checkbox" checked={useSame} onChange={(e) => setUseSame(e.target.checked)} />
          Use the same key/Map ID for exported client projects
        </label>

        {!useSame && (
          <>
            <div className="field">
              <label className="label">Client (export) API key</label>
              <input
                className="input font-mono text-xs"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={exportApiKey}
                onChange={(e) => setExportApiKey(e.target.value)}
                placeholder="AIza…"
              />
            </div>
            <div className="field">
              <label className="label">Client (export) Map ID</label>
              <input
                className="input font-mono text-xs"
                value={exportMapId}
                onChange={(e) => setExportMapId(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="bg-amber-950/40 border border-amber-800/40 rounded-md p-3 text-2xs text-amber-200/90 leading-relaxed mb-4">
          <strong>Security notice:</strong> API keys used in the browser are publicly visible. Always restrict your
          keys by HTTP referrer, enable only the Google APIs you use, and use your client's own Google Cloud project
          for exports. Google Maps usage may incur charges — see the setup guide.
        </div>

        <div className="flex justify-end gap-2">
          <button type="submit" disabled={!canSave} className="btn-primary">
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}
