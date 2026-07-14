import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useProjectStore } from '@/store/projectStore';
import { uid } from '@/lib/id';
import type { Animation, AnimationPreset } from '@/types';

const ANIMATION_PRESETS: { preset: AnimationPreset; label: string; description: string; category: string }[] = [
  // Entrance
  { preset: 'scaleIn', label: 'Scale In', description: 'Smooth scale from 0', category: 'Entrance' },
  { preset: 'fadeIn', label: 'Fade In', description: 'Simple opacity fade', category: 'Entrance' },
  { preset: 'slideIn', label: 'Slide In', description: 'Slide from bottom', category: 'Entrance' },
  { preset: 'popIn', label: 'Pop In', description: 'Elastic pop entrance', category: 'Entrance' },
  { preset: 'elasticEntrance', label: 'Elastic Entrance', description: 'Bouncy elastic entrance', category: 'Entrance' },

  // Attention
  { preset: 'pulse', label: 'Pulse', description: 'Classic pulsing scale', category: 'Attention' },
  { preset: 'softPulse', label: 'Soft Pulse', description: 'Gentle breathing pulse', category: 'Attention' },
  { preset: 'glowPulse', label: 'Glow Pulse', description: 'Pulse with glow effect', category: 'Attention' },
  { preset: 'bounce', label: 'Bounce', description: 'Up-down bounce', category: 'Attention' },
  { preset: 'softBounce', label: 'Soft Bounce', description: 'Subtle bounce', category: 'Attention' },
  { preset: 'attentionBounce', label: 'Attention Bounce', description: 'Sharp attention bounce', category: 'Attention' },
  { preset: 'shake', label: 'Shake', description: 'Horizontal shake', category: 'Attention' },
  { preset: 'wiggle', label: 'Wiggle', description: 'Rotational wiggle', category: 'Attention' },
  { preset: 'heartbeat', label: 'Heartbeat', description: 'Double-thump heartbeat', category: 'Attention' },
  { preset: 'blink', label: 'Blink', description: 'Opacity blink', category: 'Attention' },

  // Continuous
  { preset: 'float', label: 'Float', description: 'Gentle up-down float', category: 'Continuous' },
  { preset: 'hover', label: 'Hover', description: 'Subtle hover motion', category: 'Continuous' },
  { preset: 'swing', label: 'Swing', description: 'Pendulum swing', category: 'Continuous' },
  { preset: 'rotate', label: 'Rotate', description: 'Continuous rotation', category: 'Continuous' },
  { preset: 'slowRotate', label: 'Slow Rotate', description: 'Slow continuous rotation', category: 'Continuous' },
  { preset: 'breathing', label: 'Breathing', description: 'Slow scale breathe', category: 'Continuous' },
  { preset: 'shimmer', label: 'Shimmer', description: 'Shimmer sweep', category: 'Continuous' },
  { preset: 'ripple', label: 'Ripple', description: 'Expanding ripple ring', category: 'Continuous' },
  { preset: 'radarPulse', label: 'Radar Pulse', description: 'Radar-style expanding ring', category: 'Continuous' },
  { preset: 'expandingRing', label: 'Expanding Ring', description: 'Single expanding ring', category: 'Continuous' },

  // Special
  { preset: 'flip', label: 'Flip', description: '3D flip rotation', category: 'Special' },
  { preset: 'pathReveal', label: 'Path Reveal', description: 'SVG path drawing', category: 'Special' },
  { preset: 'randomGentle', label: 'Random Gentle', description: 'Random subtle motion', category: 'Special' },
];

const TRIGGER_OPTIONS: { value: Animation['trigger']; label: string }[] = [
  { value: 'onLoad', label: 'On Load' },
  { value: 'inViewport', label: 'In Viewport' },
  { value: 'onHover', label: 'On Hover' },
  { value: 'onClick', label: 'On Click' },
  { value: 'onSelected', label: 'On Selected' },
  { value: 'onPopupOpen', label: 'On Popup Open' },
  { value: 'onFilter', label: 'On Filter Change' },
  { value: 'onSearch', label: 'On Search' },
  { value: 'delayed', label: 'Delayed (ms)' },
  { value: 'onceSession', label: 'Once Per Session' },
];

const EASING_OPTIONS = [
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'cubic-bezier(0.68, -0.55, 0.27, 1.55)', // elastic
  'cubic-bezier(0.17, 0.67, 0.83, 0.67)', // bounce
  'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // ease-out-expo
  'cubic-bezier(0.55, 0.055, 0.675, 0.19)', // ease-in-expo
];

export function AnimationsPanel() {
  const project = useProjectStore((s) => s.project)!;
  const selection = useProjectStore((s) => s.selection);
  const select = useProjectStore((s) => s.select);
  const mutate = useProjectStore((s) => s.mutate);
  const removeAnimation = useProjectStore((s) => {
    return (id: string) => mutate('Delete animation', (p) => {
      p.animations = p.animations.filter((a) => a.id !== id);
      p.markerTemplates = p.markerTemplates.map((m) => m.animationId === id ? { ...m, animationId: null } : m);
    });
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showRandom, setShowRandom] = useState(false);

  const animations = useMemo(() => project.animations, [project.animations]);

  const addAnimation = (preset: AnimationPreset) => {
    const anim: Animation = {
      id: uid('anim'),
      name: `${preset.charAt(0).toUpperCase() + preset.slice(1)} animation`,
      preset,
      duration: 1000,
      delay: 0,
      easing: 'ease-in-out',
      iterationCount: 'infinite',
      direction: 'normal',
      intensity: 1,
      transformOrigin: 'center center',
      trigger: 'onLoad',
      randomVariation: {
        enabled: false,
        delayMs: 200,
        durationPercent: 20,
        intensityPercent: 20,
        phasePercent: 0,
        direction: false,
        rotationDeg: 0,
        scalePercent: 0,
      },
    };
    mutate('Add animation', (p) => { p.animations.push(anim); });
    select('location', null); // selection kind doesn't have animation, but we'll use a workaround
    setEditingId(anim.id);
  };

  const updateAnimation = (id: string, patch: Partial<Animation>) => {
    mutate('Update animation', (p) => {
      const idx = p.animations.findIndex((a) => a.id === id);
      if (idx >= 0) p.animations[idx] = { ...p.animations[idx], ...patch };
    });
  };

  const getAnim = (id: string) => animations.find((a) => a.id === id);
  const anim = editingId ? getAnim(editingId) : null;

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-text">Animations</div>
        <span className="text-2xs text-text-muted">{animations.length} animations</span>
      </div>

      <div className="space-y-2">
        <label className="label">Presets</label>
        <div className="space-y-2">
          {['Entrance', 'Attention', 'Continuous', 'Special'].map((cat) => (
            <div key={cat} className="space-y-1">
              <div className="text-2xs text-text-dim uppercase tracking-wider">{cat}</div>
              <div className="grid grid-cols-3 gap-1">
                {ANIMATION_PRESETS.filter((p) => p.category === cat).map((p) => (
                  <button
                    key={p.preset}
                    className="btn-secondary text-xs text-left p-2 h-auto rounded"
                    onClick={() => addAnimation(p.preset)}
                    title={p.description}
                  >
                    <div className="font-medium">{p.label}</div>
                    <div className="text-2xs text-text-dim">{p.description}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {animations.length > 0 && (
        <div className="divider" />
      )}

      {animations.length > 0 && (
        <div className="space-y-2">
          <label className="label">Your Animations</label>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {animations.map((a) => (
              <div
                key={a.id}
                className={clsx(
                  'group flex items-center gap-2 p-2 rounded cursor-pointer transition-colors',
                  editingId === a.id ? 'bg-accent-muted/40 border border-accent/50' : 'hover:bg-panel-light border border-transparent',
                )}
                onClick={() => setEditingId(editingId === a.id ? null : a.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm truncate">{a.name}</span>
                    <span className="chip text-2xs">{a.preset}</span>
                    {a.randomVariation.enabled && <span className="chip text-2xs bg-purple-500/20 text-purple-300">Random</span>}
                  </div>
                  <div className="text-2xs text-text-muted">
                    {a.duration}ms · {a.easing} · {a.trigger} · {a.iterationCount === 'infinite' ? '∞' : a.iterationCount}x
                  </div>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300 px-1"
                  onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${a.name}"?`)) removeAnimation(a.id); }}
                >×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {anim && (
        <div className="divider" />
      )}

      {anim && (
        <div className="space-y-3 border border-panel-border rounded-lg p-3 bg-panel-light animate-slideDown">
          <div className="flex items-center justify-between">
            <div className="font-medium">Editing: {anim.name}</div>
            <button className="text-text-muted hover:text-text" onClick={() => setEditingId(null)}>×</button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Name</label>
              <input className="input" value={anim.name} onChange={(e) => updateAnimation(anim.id, { name: e.target.value })} />
            </div>
            <div>
              <label className="label">Preset</label>
              <select className="input" value={anim.preset} onChange={(e) => updateAnimation(anim.id, { preset: e.target.value as AnimationPreset })}>
                {ANIMATION_PRESETS.map((p) => <option key={p.preset} value={p.preset}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Duration (ms)</label>
              <input type="number" className="input" value={anim.duration} min={50} max={10000} step={50} onChange={(e) => updateAnimation(anim.id, { duration: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="label">Delay (ms)</label>
              <input type="number" className="input" value={anim.delay} min={0} max={5000} step={50} onChange={(e) => updateAnimation(anim.id, { delay: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="label">Easing</label>
              <select className="input" value={anim.easing} onChange={(e) => updateAnimation(anim.id, { easing: e.target.value })}>
                {EASING_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Iterations</label>
              <select className="input" value={String(anim.iterationCount)} onChange={(e) => updateAnimation(anim.id, { iterationCount: e.target.value === 'infinite' ? 'infinite' : parseInt(e.target.value) })}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="infinite">Infinite</option>
              </select>
            </div>
            <div>
              <label className="label">Direction</label>
              <select className="input" value={anim.direction} onChange={(e) => updateAnimation(anim.id, { direction: e.target.value as Animation['direction'] })}>
                <option value="normal">Normal</option>
                <option value="reverse">Reverse</option>
                <option value="alternate">Alternate</option>
                <option value="alternate-reverse">Alternate Reverse</option>
              </select>
            </div>
            <div>
              <label className="label">Intensity (0-2)</label>
              <input type="range" className="w-full" min={0} max={2} step={0.1} value={anim.intensity} onChange={(e) => updateAnimation(anim.id, { intensity: parseFloat(e.target.value) })} />
              <div className="text-2xs text-text-dim">{anim.intensity.toFixed(1)}x</div>
            </div>
            <div>
              <label className="label">Transform Origin</label>
              <input className="input" value={anim.transformOrigin} onChange={(e) => updateAnimation(anim.id, { transformOrigin: e.target.value })} placeholder="center center" />
            </div>
            <div>
              <label className="label">Trigger</label>
              <select className="input" value={anim.trigger} onChange={(e) => updateAnimation(anim.id, { trigger: e.target.value as Animation['trigger'] })}>
                {TRIGGER_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="border-t border-panel-border pt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox"
                checked={anim.randomVariation.enabled}
                onChange={(e) => updateAnimation(anim.id, { randomVariation: { ...anim.randomVariation, enabled: e.target.checked } })}
              />
              <span className="text-sm">Random Variation</span>
            </label>
            {anim.randomVariation.enabled && (
              <div className="grid grid-cols-2 gap-2 mt-2 pl-6 border-l-2 border-panel-border animate-fadeIn">
                <div>
                  <label className="label">Delay Variation (±ms)</label>
                  <input type="number" className="input" value={anim.randomVariation.delayMs || 200} min={0} max={2000} onChange={(e) => updateAnimation(anim.id, { randomVariation: { ...anim.randomVariation, delayMs: parseInt(e.target.value) } })} />
                </div>
                <div>
                  <label className="label">Duration Variation (±%)</label>
                  <input type="number" className="input" value={anim.randomVariation.durationPercent || 20} min={0} max={100} onChange={(e) => updateAnimation(anim.id, { randomVariation: { ...anim.randomVariation, durationPercent: parseInt(e.target.value) } })} />
                </div>
                <div>
                  <label className="label">Intensity Variation (±%)</label>
                  <input type="number" className="input" value={anim.randomVariation.intensityPercent || 20} min={0} max={100} onChange={(e) => updateAnimation(anim.id, { randomVariation: { ...anim.randomVariation, intensityPercent: parseInt(e.target.value) } })} />
                </div>
                <div>
                  <label className="label">Phase Variation (±%)</label>
                  <input type="number" className="input" value={anim.randomVariation.phasePercent || 0} min={0} max={100} onChange={(e) => updateAnimation(anim.id, { randomVariation: { ...anim.randomVariation, phasePercent: parseInt(e.target.value) } })} />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="checkbox" checked={anim.randomVariation.direction || false} onChange={(e) => updateAnimation(anim.id, { randomVariation: { ...anim.randomVariation, direction: e.target.checked } })} />
                    <span className="text-sm">Random Direction</span>
                  </label>
                </div>
                <div>
                  <label className="label">Rotation Variation (±deg)</label>
                  <input type="number" className="input" value={anim.randomVariation.rotationDeg || 0} min={0} max={360} onChange={(e) => updateAnimation(anim.id, { randomVariation: { ...anim.randomVariation, rotationDeg: parseInt(e.target.value) } })} />
                </div>
                <div>
                  <label className="label">Scale Variation (±%)</label>
                  <input type="number" className="input" value={anim.randomVariation.scalePercent || 0} min={0} max={100} onChange={(e) => updateAnimation(anim.id, { randomVariation: { ...anim.randomVariation, scalePercent: parseInt(e.target.value) } })} />
                </div>
              </div>
            )}
          </div>

          <div className="text-2xs text-text-dim pt-2 border-t border-panel-border">
            This animation can be assigned to marker templates in the Markers panel.
            CSS respects <code>prefers-reduced-motion</code> automatically in exports.
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slideDown { animation: slideDown 150ms ease-out; }
        .animate-fadeIn { animation: fadeIn 150ms ease-out; }
      `}</style>
    </div>
  );
}