import type { MarkerTemplate, PopupTemplate, ID } from '@/types';
import { defaultMarkerTemplate, defaultPopupTemplate } from './defaults';

let fallbackMarker: MarkerTemplate | null = null;
let fallbackPopup: PopupTemplate | null = null;

export function getMarkerTemplate(
  templates: MarkerTemplate[],
  id: ID | null | undefined,
  override?: Partial<MarkerTemplate> | null,
): MarkerTemplate {
  const base = (id && templates.find((t) => t.id === id)) || templates[0] || (fallbackMarker ??= defaultMarkerTemplate());
  return override ? { ...base, ...override } : base;
}

export function getPopupTemplate(
  templates: PopupTemplate[],
  id: ID | null | undefined,
  override?: Partial<PopupTemplate> | null,
): PopupTemplate {
  const base = (id && templates.find((t) => t.id === id)) || templates[0] || (fallbackPopup ??= defaultPopupTemplate());
  return override ? { ...base, ...override } : base;
}
