// Central Runtime for Atlist exported maps
// Handles animations, interactions, test mode, and export identically

import type {
  Animation,
  Interaction,
  InteractionAction,
  Location,
  MarkerTemplate,
  PopupTemplate,
  Project,
  RouteLine,
  ShapeRegion,
} from '@/types';

declare global {
  interface Window {
    ATLIST_DATA?: any;
    __atlist_assets?: Record<string, string>;
    __atlist_runtime?: AtlistRuntime;
  }
}

export class AtlistRuntime {
  private map: google.maps.Map | null = null;
  private markers: Map<string, google.maps.marker.AdvancedMarkerElement> = new Map();
  private routes: Map<string, google.maps.Polyline> = new Map();
  private shapes: Map<string, any> = new Map();
  private animations: Map<string, Animation> = new Map();
  private interactions: Interaction[] = [];
  private activeAnimations: Map<string, any> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private project: Project | null = null;

  constructor() {
    window.__atlist_runtime = this;
  }

  init(map: google.maps.Map, project: Project) {
    this.map = map;
    this.project = project;
    
    // Load animations and interactions
    this.animations.clear();
    project.animations.forEach(a => this.animations.set(a.id, a));
    this.interactions = project.interactions.filter(i => i.enabled);

    this.setupEventListeners();
    this.applyInitialAnimations();
    
    console.log('[AtlistRuntime] Initialized with', project.animations.length, 'animations and', this.interactions.length, 'interactions');
  }

  private setupEventListeners() {
    if (!this.map) return;

    // Map level events
    this.map.addListener('zoom_changed', () => this.emit('zoomChanged', this.map!.getZoom()));
    this.map.addListener('click', (e) => this.emit('mapClick', e.latLng?.toJSON()));

    // Marker events are attached in marker creation
    // Route/shape events are attached when created
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(fn => fn(data));
    
    // Process interactions
    this.processInteractions(event, data);
  }

  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) this.eventListeners.set(event, []);
    this.eventListeners.get(event)!.push(callback);
  }

  // ==================== ANIMATIONS ====================
  private applyInitialAnimations() {
    this.project?.markerTemplates.forEach(template => {
      if (template.animationId) {
        const anim = this.animations.get(template.animationId);
        if (anim) this.startAnimationOnTemplate(template.id, anim);
      }
    });
  }

  startAnimationOnTemplate(templateId: string, animation: Animation) {
    const styleId = `anim-${templateId}-${animation.id}`;
    
    // Generate CSS if not exists
    if (!document.getElementById(styleId)) {
      const css = this.generateAnimationCSS(animation, styleId);
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css;
      document.head.appendChild(style);
    }

    // Apply to all markers using this template
    this.markers.forEach((marker, locId) => {
      const loc = this.project?.locations.find(l => l.id === locId);
      if (loc?.markerTemplateId === templateId) {
        const content = marker.content as HTMLElement;
        if (content) {
          content.style.animation = `${styleId} ${animation.duration}ms ${animation.easing} ${animation.iterationCount} ${animation.direction}`;
          this.activeAnimations.set(locId, animation);
        }
      }
    });
  }

  stopAnimation(targetId: string) {
    const content = this.getElementForTarget(targetId);
    if (content) {
      content.style.animation = '';
    }
    this.activeAnimations.delete(targetId);
  }

  toggleAnimation(targetId: string, animationId: string) {
    if (this.activeAnimations.has(targetId)) {
      this.stopAnimation(targetId);
    } else {
      const anim = this.animations.get(animationId);
      if (anim) {
        const templateId = this.getTemplateIdForTarget(targetId);
        if (templateId) this.startAnimationOnTemplate(templateId, anim);
      }
    }
  }

  private generateAnimationCSS(anim: Animation, className: string): string {
    const intensity = anim.intensity || 1;
    let keyframes = '';

    switch (anim.preset) {
      case 'pulse':
        keyframes = `@keyframes ${className} {
          0%,100%{transform:scale(1)}50%{transform:scale(${1 + intensity * 0.2})}
        }`;
        break;
      case 'bounce':
        keyframes = `@keyframes ${className} {
          0%,100%{transform:translateY(0)}50%{transform:translateY(-${intensity * 12}px)}
        }`;
        break;
      case 'shake':
        keyframes = `@keyframes ${className} {
          0%,100%{transform:translateX(0)}25%{transform:translateX(-${intensity * 4}px)}75%{transform:translateX(${intensity * 4}px)}
        }`;
        break;
      case 'rotate':
        keyframes = `@keyframes ${className} {
          from{transform:rotate(0deg)}to{transform:rotate(${360 * intensity}deg)}
        }`;
        break;
      case 'fadeIn':
        keyframes = `@keyframes ${className} {
          from{opacity:0}to{opacity:1}
        }`;
        break;
      case 'scaleIn':
        keyframes = `@keyframes ${className} {
          from{transform:scale(0.3);opacity:0}to{transform:scale(1);opacity:1}
        }`;
        break;
      default:
        keyframes = `@keyframes ${className} {
          0%,100%{transform:scale(1)}50%{transform:scale(${1 + intensity * 0.15})}
        }`;
    }

    return `${keyframes}
      .${className} {
        animation: ${className} ${anim.duration}ms ${anim.easing} ${anim.iterationCount} ${anim.direction};
        transform-origin: ${anim.transformOrigin || 'center center'};
      }`;
  }

  // ==================== INTERACTIONS ====================
  private processInteractions(trigger: string, data?: any) {
    this.interactions.forEach(interaction => {
      if (!this.matchesTrigger(interaction.trigger, trigger, data)) return;

      interaction.actions.forEach(action => {
        if (!this.checkConditions(action.conditions || [], data)) return;
        this.executeAction(action, data);
      });
    });
  }

  private matchesTrigger(interactionTrigger: string, eventTrigger: string, data: any): boolean {
    const map: Record<string, string> = {
      'click': 'click',
      'dblclick': 'dblclick',
      'hoverEnter': 'hover',
      'hoverLeave': 'mouseleave',
      'focus': 'focus',
      'markerSelected': 'select',
      'popupOpened': 'popupOpen',
      'popupClosed': 'popupClose',
      'zoomChanged': 'zoomChanged',
      'enterViewport': 'viewportEnter',
      'leaveViewport': 'viewportLeave',
      'filterActivated': 'filter',
    };
    return map[interactionTrigger] === eventTrigger;
  }

  private checkConditions(conditions: any[], data: any): boolean {
    return conditions.every(cond => {
      switch (cond.kind) {
        case 'isMobile': return window.innerWidth < 768;
        case 'zoomGreater': return this.map && this.map.getZoom()! > (cond.value || 10);
        case 'zoomLess': return this.map && this.map.getZoom()! < (cond.value || 18);
        case 'markerSelected': return data?.selected === true;
        default: return true;
      }
    });
  }

  private executeAction(action: InteractionAction, contextData?: any) {
    const params = action.params || {};
    const targetId = params.markerId || params.locationId || contextData?.id;

    switch (action.type) {
      case 'openPopup':
        if (targetId) this.openPopupForTarget(targetId);
        break;
      case 'closePopup':
        this.closeAllPopups();
        break;
      case 'selectMarker':
        if (targetId) this.selectElement(targetId);
        break;
      case 'zoomToMarker':
        if (targetId) this.zoomToTarget(targetId, params.zoom || 16);
        break;
      case 'panToMarker':
        if (targetId) this.panToTarget(targetId);
        break;
      case 'startAnimation':
        if (params.animationId) this.startAnimationOnTemplate(params.markerId || targetId, this.animations.get(params.animationId)!);
        break;
      case 'stopAnimation':
        this.stopAnimation(targetId);
        break;
      case 'bounceMarker':
        this.bounceMarker(targetId, params.duration || 800);
        break;
      case 'openUrl':
        window.open(params.url, params.newTab ? '_blank' : '_self');
        break;
      case 'toggleCategory':
        this.emit('filter', { categoryId: params.categoryId });
        break;
      case 'customEvent':
        window.dispatchEvent(new CustomEvent(params.eventName, { detail: params.data }));
        break;
      default:
        console.log('[Runtime] Unhandled action:', action.type);
    }
  }

  // ==================== ELEMENT HELPERS ====================
  private getElementForTarget(targetId: string): HTMLElement | null {
    const marker = this.markers.get(targetId);
    return marker?.content as HTMLElement || null;
  }

  private getTemplateIdForTarget(targetId: string): string | null {
    const loc = this.project?.locations.find(l => l.id === targetId);
    return loc?.markerTemplateId || null;
  }

  private selectElement(id: string) {
    this.emit('select', { id });
    // Highlight effect
    const el = this.getElementForTarget(id);
    if (el) {
      el.style.boxShadow = '0 0 0 4px #5b8def';
      setTimeout(() => { if (el) el.style.boxShadow = ''; }, 1200);
    }
  }

  private zoomToTarget(id: string, zoom: number) {
    const loc = this.project?.locations.find(l => l.id === id);
    if (loc && this.map) {
      this.map.setCenter(loc.position);
      this.map.setZoom(zoom);
    }
  }

  private panToTarget(id: string) {
    const loc = this.project?.locations.find(l => l.id === id);
    if (loc && this.map) this.map.panTo(loc.position);
  }

  private bounceMarker(id: string, duration: number) {
    const el = this.getElementForTarget(id);
    if (!el) return;
    el.style.transition = `transform ${duration}ms cubic-bezier(0.68, -0.55, 0.27, 1.55)`;
    el.style.transform = 'translateY(-30px)';
    setTimeout(() => {
      if (el) {
        el.style.transform = 'translateY(0)';
        setTimeout(() => { if (el) el.style.transition = ''; }, 300);
      }
    }, duration);
  }

  private openPopupForTarget(id: string) {
    this.emit('popupOpen', { id });
    // In real implementation would render popup
    console.log('[Runtime] Opening popup for', id);
  }

  private closeAllPopups() {
    this.emit('popupClose');
  }

  // Public API
  attachMarkerEvents(marker: google.maps.marker.AdvancedMarkerElement, locationId: string) {
    const el = marker.content as HTMLElement;
    if (!el) return;

    el.addEventListener('click', () => this.emit('click', { id: locationId }));
    el.addEventListener('dblclick', () => this.emit('dblclick', { id: locationId }));
    el.addEventListener('mouseenter', () => this.emit('hover', { id: locationId }));
    el.addEventListener('mouseleave', () => this.emit('mouseleave', { id: locationId }));
  }

  registerMarker(id: string, marker: google.maps.marker.AdvancedMarkerElement) {
    this.markers.set(id, marker);
  }

  // Cleanup
  destroy() {
    this.markers.clear();
    this.routes.clear();
    this.shapes.clear();
    this.activeAnimations.clear();
    this.eventListeners.clear();
  }
}

// Export singleton helper
export const runtime = new AtlistRuntime();