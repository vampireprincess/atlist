import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useProjectStore } from '@/store/projectStore';
import { uid } from '@/lib/id';
import type { Interaction, InteractionTrigger, InteractionActionType, InteractionAction, InteractionCondition } from '@/types';

const TRIGGER_OPTIONS: { value: InteractionTrigger; label: string; description: string }[] = [
  { value: 'click', label: 'Click', description: 'Marker or map click' },
  { value: 'dblclick', label: 'Double Click', description: 'Double-click on marker' },
  { value: 'hoverEnter', label: 'Hover Enter', description: 'Mouse enters marker' },
  { value: 'hoverLeave', label: 'Hover Leave', description: 'Mouse leaves marker' },
  { value: 'focus', label: 'Focus', description: 'Marker receives focus (keyboard)' },
  { value: 'markerSelected', label: 'Marker Selected', description: 'Marker becomes selected' },
  { value: 'popupOpened', label: 'Popup Opened', description: 'Any popup opens' },
  { value: 'popupClosed', label: 'Popup Closed', description: 'Any popup closes' },
  { value: 'zoomChanged', label: 'Zoom Changed', description: 'Map zoom level changes' },
  { value: 'enterViewport', label: 'Enter Viewport', description: 'Marker enters visible area' },
  { value: 'leaveViewport', label: 'Leave Viewport', description: 'Marker leaves visible area' },
  { value: 'filterActivated', label: 'Filter Activated', description: 'Category filter toggled' },
];

const ACTION_OPTIONS: { value: InteractionActionType; label: string; description: string; params?: string[] }[] = [
  { value: 'openPopup', label: 'Open Popup', description: 'Open popup for a marker', params: ['markerId'] },
  { value: 'closePopup', label: 'Close Popup', description: 'Close any open popup', params: [] },
  { value: 'selectMarker', label: 'Select Marker', description: 'Select/highlight a marker', params: ['markerId'] },
  { value: 'zoomToMarker', label: 'Zoom to Marker', description: 'Center and zoom to marker', params: ['markerId', 'zoom'] },
  { value: 'panToMarker', label: 'Pan to Marker', description: 'Pan map to marker', params: ['markerId'] },
  { value: 'bounceMarker', label: 'Bounce Marker', description: 'Animate marker bounce', params: ['markerId', 'duration'] },
  { value: 'startAnimation', label: 'Start Animation', description: 'Start marker animation', params: ['markerId', 'animationId'] },
  { value: 'stopAnimation', label: 'Stop Animation', description: 'Stop marker animation', params: ['markerId'] },
  { value: 'changeMarkerAppearance', label: 'Change Marker Appearance', description: 'Temporarily change marker style', params: ['markerId', 'styleOverrides'] },
  { value: 'openUrl', label: 'Open URL', description: 'Navigate to URL', params: ['url', 'newTab'] },
  { value: 'openUrlNewTab', label: 'Open URL (New Tab)', description: 'Open URL in new tab', params: ['url'] },
  { value: 'scrollToElement', label: 'Scroll to Element', description: 'Scroll to sidebar item', params: ['markerId'] },
  { value: 'openSidebarTab', label: 'Open Sidebar Tab', description: 'Switch sidebar tab', params: ['tab'] },
  { value: 'showGallery', label: 'Show Gallery', description: 'Open image gallery', params: ['markerId'] },
  { value: 'copyAddress', label: 'Copy Address', description: 'Copy marker address to clipboard', params: ['markerId'] },
  { value: 'callPhone', label: 'Call Phone', description: 'Initiate phone call', params: ['markerId'] },
  { value: 'sendEmail', label: 'Send Email', description: 'Open email client', params: ['markerId'] },
  { value: 'openDirections', label: 'Open Directions', description: 'Open Google Maps directions', params: ['markerId'] },
  { value: 'showRelated', label: 'Show Related', description: 'Show related markers', params: ['categoryId'] },
  { value: 'hideRelated', label: 'Hide Related', description: 'Hide related markers', params: ['categoryId'] },
  { value: 'toggleCategory', label: 'Toggle Category', description: 'Toggle category filter', params: ['categoryId'] },
  { value: 'playSound', label: 'Play Sound', description: 'Play audio asset', params: ['assetId'] },
  { value: 'customEvent', label: 'Custom Event', description: 'Emit custom event for JS hooks', params: ['eventName', 'data'] },
];

const CONDITION_KINDS: { value: InteractionCondition['kind']; label: string; needsValue: boolean }[] = [
  { value: 'isMobile', label: 'Is Mobile Device', needsValue: false },
  { value: 'categoryActive', label: 'Category Active', needsValue: true },
  { value: 'zoomGreater', label: 'Zoom Greater Than', needsValue: true },
  { value: 'zoomLess', label: 'Zoom Less Than', needsValue: true },
  { value: 'markerSelected', label: 'Marker Selected', needsValue: false },
  { value: 'popupClosed', label: 'Popup Closed', needsValue: false },
];

export function InteractionsPanel() {
  const project = useProjectStore((s) => s.project)!;
  const select = useProjectStore((s) => s.select);
  const mutate = useProjectStore((s) => s.mutate);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingAction, setAddingAction] = useState<string | null>(null);
  const [newActionType, setNewActionType] = useState<InteractionActionType>('openPopup');

  const interactions = useMemo(() => project.interactions, [project.interactions]);

  const addInteraction = () => {
    const interaction: Interaction = {
      id: uid('inter'),
      name: 'New Interaction',
      trigger: 'click',
      actions: [],
      enabled: true,
    };
    mutate('Add interaction', (p) => { p.interactions.push(interaction); });
    setEditingId(interaction.id);
  };

  const removeInteraction = (id: string) => {
    if (confirm('Delete this interaction?')) {
      mutate('Delete interaction', (p) => { p.interactions = p.interactions.filter((i) => i.id !== id); });
      if (editingId === id) setEditingId(null);
    }
  };

  const updateInteraction = (id: string, patch: Partial<Interaction>) => {
    mutate('Update interaction', (p) => {
      const idx = p.interactions.findIndex((i) => i.id === id);
      if (idx >= 0) p.interactions[idx] = { ...p.interactions[idx], ...patch };
    });
  };

  const addAction = (interactionId: string, type: InteractionActionType) => {
    const action: InteractionAction = {
      id: uid('act'),
      type,
      params: {},
      conditions: [],
    };
    mutate('Add action', (p) => {
      const idx = p.interactions.findIndex((i) => i.id === interactionId);
      if (idx >= 0) p.interactions[idx].actions.push(action);
    });
    setAddingAction(null);
  };

  const removeAction = (interactionId: string, actionId: string) => {
    mutate('Remove action', (p) => {
      const idx = p.interactions.findIndex((i) => i.id === interactionId);
      if (idx >= 0) p.interactions[idx].actions = p.interactions[idx].actions.filter((a) => a.id !== actionId);
    });
  };

  const updateAction = (interactionId: string, actionId: string, patch: Partial<InteractionAction>) => {
    mutate('Update action', (p) => {
      const iIdx = p.interactions.findIndex((i) => i.id === interactionId);
      if (iIdx >= 0) {
        const aIdx = p.interactions[iIdx].actions.findIndex((a) => a.id === actionId);
        if (aIdx >= 0) p.interactions[iIdx].actions[aIdx] = { ...p.interactions[iIdx].actions[aIdx], ...patch };
      }
    });
  };

  const addCondition = (interactionId: string, actionId: string) => {
    updateAction(interactionId, actionId, {
      conditions: [
        ...(interactions.find((i) => i.id === interactionId)?.actions.find((a) => a.id === actionId)?.conditions || []),
        { kind: 'isMobile', value: undefined },
      ],
    });
  };

  const removeCondition = (interactionId: string, actionId: string, conditionIndex: number) => {
    const action = interactions.find((i) => i.id === interactionId)?.actions.find((a) => a.id === actionId);
    if (action) {
      const newConditions = action.conditions.filter((_, idx) => idx !== conditionIndex);
      updateAction(interactionId, actionId, { conditions: newConditions });
    }
  };

  const updateCondition = (interactionId: string, actionId: string, conditionIndex: number, patch: Partial<InteractionCondition>) => {
    const action = interactions.find((i) => i.id === interactionId)?.actions.find((a) => a.id === actionId);
    if (action) {
      const newConditions = action.conditions.map((c, idx) => idx === conditionIndex ? { ...c, ...patch } : c);
      updateAction(interactionId, actionId, { conditions: newConditions });
    }
  };

  const getInteraction = (id: string) => interactions.find((i) => i.id === id);
  const interaction = editingId ? getInteraction(editingId) : null;

  const markers = project.locations.filter((l) => l.visible);
  const categories = project.categories;

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-text">Interactions</div>
        <span className="text-2xs text-text-muted">{interactions.length} interactions</span>
      </div>

      <div className="flex gap-1">
        <button className="btn-primary text-xs flex-1" onClick={addInteraction}>+ Add Interaction</button>
      </div>

      <p className="text-2xs text-text-dim">
        Build complex behaviors: triggers → conditions → actions. Chain multiple actions per trigger.
      </p>

      {interactions.length > 0 && (
        <div className="divider" />
      )}

      {interactions.length > 0 && (
        <div className="space-y-2">
          <label className="label">Your Interactions</label>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {interactions.map((i) => (
              <div
                key={i.id}
                className={clsx(
                  'group flex items-center gap-2 p-2 rounded cursor-pointer transition-colors',
                  editingId === i.id ? 'bg-accent-muted/40 border border-accent/50' : 'hover:bg-panel-light border border-transparent',
                  !i.enabled && 'opacity-50',
                )}
                onClick={() => setEditingId(editingId === i.id ? null : i.id)}
              >
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={i.enabled}
                  onChange={(e) => { e.stopPropagation(); updateInteraction(i.id, { enabled: e.target.checked }); }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm truncate">{i.name}</span>
                    <span className="chip text-2xs">{i.trigger}</span>
                    <span className="text-2xs text-text-muted">→ {i.actions.length} action{s(i.actions.length)}</span>
                  </div>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300 px-1"
                  onClick={(e) => { e.stopPropagation(); removeInteraction(i.id); }}
                >×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {interaction && (
        <div className="divider" />
      )}

      {interaction && (
        <div className="space-y-3 border border-panel-border rounded-lg p-3 bg-panel-light animate-slideDown">
          <div className="flex items-center justify-between">
            <div className="font-medium">Editing: {interaction.name}</div>
            <button className="text-text-muted hover:text-text" onClick={() => setEditingId(null)}>×</button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Name</label>
              <input className="input" value={interaction.name} onChange={(e) => updateInteraction(interaction.id, { name: e.target.value })} />
            </div>
            <div>
              <label className="label">Trigger</label>
              <select className="input" value={interaction.trigger} onChange={(e) => updateInteraction(interaction.id, { trigger: e.target.value as InteractionTrigger })}>
                {TRIGGER_OPTIONS.map((t) => <option key={t.value} value={t.value} title={t.description}>{t.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Trigger Description</label>
              <div className="text-sm text-text-muted p-2 bg-panel rounded">
                {TRIGGER_OPTIONS.find((t) => t.value === interaction.trigger)?.description}
              </div>
            </div>
          </div>

          <div className="border-t border-panel-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Actions ({interaction.actions.length})</div>
              <div className="flex gap-1">
                <select
                  className="input text-xs w-auto"
                  value={newActionType}
                  onChange={(e) => setNewActionType(e.target.value as InteractionActionType)}
                >
                  {ACTION_OPTIONS.map((a) => <option key={a.value} value={a.value} title={a.description}>{a.label}</option>)}
                </select>
                <button className="btn-primary text-xs" onClick={() => setAddingAction(interaction.id)}>Add</button>
              </div>
            </div>

            {interaction.actions.length === 0 && (
              <div className="text-center text-text-dim py-4 text-sm">No actions yet. Add an action above.</div>
            )}

            {interaction.actions.map((action) => (
              <div key={action.id} className="border border-panel-border rounded p-2 bg-panel mb-2 animate-slideDown">
                <div className="flex items-center justify-between mb-2">
                  <select
                    className="input text-sm flex-1 mr-2"
                    value={action.type}
                    onChange={(e) => updateAction(interaction.id, action.id, { type: e.target.value as InteractionActionType })}
                  >
                    {ACTION_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                  <button
                    className="text-red-400 hover:text-red-300 text-xs px-2"
                    onClick={() => removeAction(interaction.id, action.id)}
                  >Remove</button>
                </div>

                {/* Action Parameters */}
                {ACTION_OPTIONS.find((a) => a.value === action.type)?.params?.map((param) => (
                  <div key={param} className="mb-2">
                    <label className="label text-xs capitalize">{param.replace(/([A-Z])/g, ' $1').replace('Id', ' ID')}</label>
                    {param === 'markerId' && (
                      <select className="input" value={action.params?.[param] || ''} onChange={(e) => updateAction(interaction.id, action.id, { params: { ...action.params, [param]: e.target.value } })}>
                        <option value="">— Current marker —</option>
                        {markers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    )}
                    {param === 'categoryId' && (
                      <select className="input" value={action.params?.[param] || ''} onChange={(e) => updateAction(interaction.id, action.id, { params: { ...action.params, [param]: e.target.value } })}>
                        <option value="">— Select category —</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    )}
                    {param === 'animationId' && (
                      <select className="input" value={action.params?.[param] || ''} onChange={(e) => updateAction(interaction.id, action.id, { params: { ...action.params, [param]: e.target.value } })}>
                        <option value="">— Select animation —</option>
                        {project.animations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    )}
                    {param === 'assetId' && (
                      <select className="input" value={action.params?.[param] || ''} onChange={(e) => updateAction(interaction.id, action.id, { params: { ...action.params, [param]: e.target.value } })}>
                        <option value="">— Select audio asset —</option>
                        {project.assets.filter((a) => a.type === 'audio').map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    )}
                    {param === 'url' && (
                      <input className="input" placeholder="https://example.com" value={action.params?.[param] || ''} onChange={(e) => updateAction(interaction.id, action.id, { params: { ...action.params, [param]: e.target.value } })} />
                    )}
                    {param === 'zoom' && (
                      <input type="number" className="input" min={1} max={21} value={action.params?.[param] || 15} onChange={(e) => updateAction(interaction.id, action.id, { params: { ...action.params, [param]: parseInt(e.target.value) } })} />
                    )}
                    {param === 'duration' && (
                      <input type="number" className="input" min={100} max={5000} value={action.params?.[param] || 500} onChange={(e) => updateAction(interaction.id, action.id, { params: { ...action.params, [param]: parseInt(e.target.value) } })} />
                    )}
                    {param === 'newTab' && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="checkbox" checked={action.params?.[param] || false} onChange={(e) => updateAction(interaction.id, action.id, { params: { ...action.params, [param]: e.target.checked } })} />
                        <span className="text-sm">Open in new tab</span>
                      </label>
                    )}
                    {param === 'eventName' && (
                      <input className="input" placeholder="custom_event_name" value={action.params?.[param] || ''} onChange={(e) => updateAction(interaction.id, action.id, { params: { ...action.params, [param]: e.target.value } })} />
                    )}
                    {param === 'data' && (
                      <textarea className="input" rows={2} placeholder='{"key": "value"}' value={action.params?.[param] || ''} onChange={(e) => updateAction(interaction.id, action.id, { params: { ...action.params, [param]: e.target.value } })} />
                    )}
                    {param === 'styleOverrides' && (
                      <textarea className="input" rows={2} placeholder='{"background": "#ff0000", "scale": 1.5}' value={action.params?.[param] || ''} onChange={(e) => updateAction(interaction.id, action.id, { params: { ...action.params, [param]: e.target.value } })} />
                    )}
                    {param === 'tab' && (
                      <select className="input" value={action.params?.[param] || 'list'} onChange={(e) => updateAction(interaction.id, action.id, { params: { ...action.params, [param]: e.target.value } })}>
                        <option value="list">List</option>
                        <option value="map">Map</option>
                        <option value="filters">Filters</option>
                      </select>
                    )}
                  </div>
                ))}

                {/* Conditions */}
                <div className="border-t border-panel-border pt-2 mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-xs">Conditions (all must pass)</div>
                    <button className="btn-ghost text-xs" onClick={() => addCondition(interaction.id, action.id)}>+ Add Condition</button>
                  </div>
                  {action.conditions.length === 0 && (
                    <div className="text-2xs text-text-dim text-center py-2">No conditions — action always runs</div>
                  )}
                  {action.conditions.map((cond, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2 mb-1">
                      <select
                        className="input text-xs flex-1"
                        value={cond.kind}
                        onChange={(e) => updateCondition(interaction.id, action.id, cIdx, { kind: e.target.value as InteractionCondition['kind'] })}
                      >
                        {CONDITION_KINDS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      {CONDITION_KINDS.find((c) => c.value === cond.kind)?.needsValue && (
                        <input
                          className="input text-xs w-32"
                          type={cond.kind === 'zoomGreater' || cond.kind === 'zoomLess' ? 'number' : 'text'}
                          placeholder={cond.kind === 'categoryActive' ? 'Category ID' : 'Value'}
                          value={cond.value || ''}
                          onChange={(e) => updateCondition(interaction.id, action.id, cIdx, { value: e.target.value })}
                        />
                      )}
                      <button className="text-red-400 hover:text-red-300 text-xs" onClick={() => removeCondition(interaction.id, action.id, cIdx)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-2xs text-text-dim pt-2 border-t border-panel-border">
            Interactions are evaluated in the exported map runtime. Complex chains execute sequentially.
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 150ms ease-out; }
      `}</style>
    </div>
  );
}

function s(n: number) { return n === 1 ? '' : 's'; }