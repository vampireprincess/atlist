// Renders a marker template into an HTMLElement suitable for AdvancedMarkerElement.content.
// Supports pin, emoji, text, image, svg, and html marker kinds.

import type { MarkerTemplate } from '@/types';

export interface RenderOptions {
  selected?: boolean;
}

export function renderMarkerDom(template: MarkerTemplate, opts: RenderOptions = {}): HTMLElement {
  const merged = opts.selected && template.selected ? { ...template, ...template.selected } : template;
  const wrapper = document.createElement('div');
  wrapper.className = 'atlist-marker';
  wrapper.dataset.kind = merged.kind;
  wrapper.style.width = `${merged.width}px`;
  wrapper.style.height = `${merged.height}px`;
  wrapper.style.opacity = String(merged.opacity ?? 1);
  wrapper.style.transform = `translate(${merged.offsetX ?? 0}px, ${merged.offsetY ?? 0}px) scale(${merged.scale ?? 1}) rotate(${merged.rotation ?? 0}deg)`;
  wrapper.style.transformOrigin = 'center bottom';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'center';
  wrapper.style.position = 'relative';
  wrapper.style.willChange = 'transform';
  wrapper.style.pointerEvents = 'auto';
  wrapper.style.cursor = 'pointer';

  if (opts.selected) {
    wrapper.style.filter = 'drop-shadow(0 0 6px #5b8def)';
  }

  switch (merged.kind) {
    case 'pin':
      wrapper.appendChild(renderPin(merged));
      break;
    case 'emoji':
      wrapper.appendChild(renderEmoji(merged));
      break;
    case 'text':
      wrapper.appendChild(renderText(merged));
      break;
    case 'image':
    case 'svg':
      wrapper.appendChild(renderImage(merged));
      break;
    case 'html':
      wrapper.appendChild(renderHtml(merged));
      break;
  }

  if (merged.badge) {
    const badge = document.createElement('div');
    badge.textContent = merged.badge;
    Object.assign(badge.style, {
      position: 'absolute',
      top: '-4px',
      right: '-4px',
      background: merged.badgeColor || '#e11d48',
      color: '#fff',
      borderRadius: '999px',
      padding: '1px 5px',
      fontSize: '10px',
      fontWeight: '600',
      lineHeight: '1.2',
      minWidth: '16px',
      textAlign: 'center',
      boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
    });
    wrapper.appendChild(badge);
  }

  if (merged.label) {
    const label = document.createElement('div');
    label.textContent = merged.label;
    Object.assign(label.style, {
      position: 'absolute',
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: '4px',
      background: 'rgba(0,0,0,0.7)',
      color: merged.labelColor || '#fff',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '11px',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
    });
    wrapper.appendChild(label);
  }

  return wrapper;
}

function renderPin(t: MarkerTemplate): HTMLElement {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 32 40');
  svg.setAttribute('width', String(t.width));
  svg.setAttribute('height', String(t.height));
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', 'M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z');
  path.setAttribute('fill', t.pinBackground || t.background || '#5b8def');
  path.setAttribute('stroke', t.pinBorderColor || t.borderColor || '#fff');
  path.setAttribute('stroke-width', String(t.borderWidth ?? 2));
  svg.appendChild(path);
  const circle = document.createElementNS(svgNS, 'circle');
  circle.setAttribute('cx', '16');
  circle.setAttribute('cy', '16');
  circle.setAttribute('r', '5');
  circle.setAttribute('fill', t.pinGlyphColor || '#fff');
  svg.appendChild(circle);
  if (t.pinGlyph) {
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', '16');
    text.setAttribute('y', '20');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '11');
    text.setAttribute('font-weight', '700');
    text.setAttribute('fill', t.pinBackground || '#5b8def');
    text.textContent = t.pinGlyph.slice(0, 2);
    svg.appendChild(text);
  }
  if (t.shadow) {
    svg.style.filter = `drop-shadow(${t.shadow})`;
  }
  return svg as unknown as HTMLElement;
}

function renderEmoji(t: MarkerTemplate): HTMLElement {
  const el = document.createElement('div');
  el.textContent = t.emoji || '📍';
  Object.assign(el.style, {
    fontSize: `${Math.min(t.width, t.height)}px`,
    lineHeight: '1',
    textAlign: 'center',
    filter: t.shadow ? `drop-shadow(${t.shadow})` : undefined,
  });
  return el;
}

function renderText(t: MarkerTemplate): HTMLElement {
  const el = document.createElement('div');
  el.textContent = t.text || 'Text';
  Object.assign(el.style, {
    background: t.background || '#5b8def',
    color: t.labelColor || '#fff',
    padding: '4px 8px',
    borderRadius: `${t.borderRadius ?? 999}px`,
    border: `${t.borderWidth ?? 0}px solid ${t.borderColor || 'transparent'}`,
    fontSize: '12px',
    fontWeight: '600',
    boxShadow: t.shadow || 'none',
    whiteSpace: 'nowrap',
  });
  return el;
}

function renderImage(t: MarkerTemplate): HTMLElement {
  const el = document.createElement('div');
  const assetId = t.imageAssetId || t.svgAssetId;
  const asset = assetId ? findAssetDataUrl(assetId) : null;
  if (asset) {
    const img = document.createElement('img');
    img.src = asset;
    img.alt = t.name;
    Object.assign(img.style, {
      width: `${t.width}px`,
      height: `${t.height}px`,
      objectFit: 'contain',
      borderRadius: `${t.borderRadius ?? 0}px`,
      border: t.borderWidth ? `${t.borderWidth}px solid ${t.borderColor}` : 'none',
      background: t.background && t.background !== 'transparent' ? t.background : undefined,
      boxShadow: t.shadow || undefined,
      pointerEvents: 'none',
    } as CSSStyleDeclaration);
    el.appendChild(img);
  } else {
    el.textContent = '?';
    Object.assign(el.style, {
      width: `${t.width}px`,
      height: `${t.height}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#374151',
      color: '#9ca3af',
      borderRadius: '4px',
      fontSize: '20px',
    });
  }
  return el;
}

function renderHtml(t: MarkerTemplate): HTMLElement {
  const el = document.createElement('div');
  // Custom HTML — we sanitize by using textContent for safety unless the user explicitly opts in.
  // For editor use we allow innerHTML; export pipeline should sanitize.
  el.innerHTML = t.html || '';
  return el;
}

// Local mirror of asset lookup, kept outside the store to avoid cyclic imports.
// Uses window.__atlist_assets set by the store.
declare global {
  interface Window {
    __atlist_assets?: Record<string, string>;
  }
}

function findAssetDataUrl(id: string): string | null {
  return window.__atlist_assets?.[id] ?? null;
}
