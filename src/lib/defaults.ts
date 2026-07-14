import type {
  MarkerTemplate,
  PopupTemplate,
  Project,
  MapSettings,
  SidebarSettings,
  SearchSettings,
  LegendSettings,
  FilterSettings,
  ClusteringSettings,
  GlobalStyles,
  Localization,
  AnalyticsSettings,
  Category,
} from '@/types';
import { uid } from './id';

export function defaultMapSettings(): MapSettings {
  return {
    center: { lat: 44.7866, lng: 20.4489 }, // Belgrade default
    zoom: 12,
    minZoom: 2,
    maxZoom: 21,
    bounds: null,
    mapType: 'roadmap',
    colorScheme: 'LIGHT',
    mapId: '',
    controls: {
      zoom: true,
      fullscreen: true,
      streetView: false,
      mapType: true,
      scaleControl: false,
      rotateControl: false,
    },
    gestures: {
      gestureHandling: 'auto',
      scrollwheel: true,
      draggable: true,
      disableDoubleClickZoom: false,
      keyboardShortcuts: true,
    },
    tilt: 0,
    heading: 0,
    responsive: {},
  };
}

export function defaultSidebar(): SidebarSettings {
  return {
    enabled: true,
    position: 'left',
    variant: 'cards',
    showSearch: true,
    showFilters: true,
    showSort: false,
    showCount: true,
    showFeatured: true,
    showDistance: false,
    collapsible: true,
    widthDesktop: 340,
    emptyStateText: 'No locations match your filters.',
    loadingStateText: 'Loading map…',
  };
}

export function defaultSearch(): SearchSettings {
  return {
    enabled: true,
    fields: ['name', 'address', 'description', 'tags'],
    autocomplete: true,
    centerOnResult: true,
    openPopupOnResult: true,
    showInSidebar: true,
    placeholder: 'Search locations…',
  };
}

export function defaultLegend(): LegendSettings {
  return {
    enabled: false,
    position: 'bottom-right',
    title: 'Legend',
    items: [],
  };
}

export function defaultFilters(): FilterSettings {
  return {
    enabled: true,
    variant: 'pills',
    logic: 'OR',
    showCounts: true,
    showClearAll: true,
    showSelectAll: false,
    animateMarkers: true,
    syncUrl: true,
  };
}

export function defaultClustering(): ClusteringSettings {
  return {
    enabled: false,
    minPoints: 3,
    maxZoom: 15,
    gridSize: 60,
    color: '#5b8def',
    textColor: '#ffffff',
    useCategoryColor: false,
  };
}

export function defaultGlobalStyles(): GlobalStyles {
  return {
    fontFamily: 'Inter, system-ui, sans-serif',
    primaryColor: '#5b8def',
    secondaryColor: '#7aa3ff',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    borderRadius: 12,
  };
}

export function defaultLocalization(): Localization {
  return {
    defaultLocale: 'en',
    strings: {
      en: {
        search: 'Search',
        clear: 'Clear',
        filters: 'Filters',
        allLocations: 'All locations',
        noResults: 'No results',
        openDirections: 'Open directions',
        viewDetails: 'View details',
        close: 'Close',
        showMap: 'Show map',
        showList: 'Show list',
        loading: 'Loading…',
        error: 'Something went wrong.',
        callPhone: 'Call',
        sendEmail: 'Email',
        copyAddress: 'Copy address',
        results: 'results',
      },
    },
  };
}

export function defaultAnalytics(): AnalyticsSettings {
  return {
    enabled: false,
    provider: 'none',
    events: {
      markerClick: false,
      popupOpen: false,
      filterUse: false,
      directionsClick: false,
    },
  };
}

export function defaultMarkerTemplate(name = 'Default pin'): MarkerTemplate {
  return {
    id: uid('mkr'),
    name,
    kind: 'pin',
    width: 32,
    height: 40,
    scale: 1,
    rotation: 0,
    opacity: 1,
    offsetX: 0,
    offsetY: 0,
    anchor: 'bottom',
    zIndex: 1,
    collisionBehavior: 'REQUIRED',
    background: '#5b8def',
    borderColor: '#ffffff',
    borderWidth: 2,
    borderRadius: 999,
    shadow: '0 2px 6px rgba(0,0,0,0.3)',
    glow: '',
    pinBackground: '#5b8def',
    pinBorderColor: '#ffffff',
    pinGlyph: '',
    pinGlyphColor: '#ffffff',
    animationId: null,
  };
}

export function defaultPopupTemplate(name = 'Default popup'): PopupTemplate {
  return {
    id: uid('pop'),
    name,
    variant: 'card',
    width: 320,
    maxWidth: 360,
    padding: 16,
    background: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 12,
    shadow: '0 12px 32px rgba(0,0,0,0.18)',
    backdropBlur: 0,
    showArrow: true,
    showClose: true,
    offsetX: 0,
    offsetY: -8,
    entranceAnimation: 'fadeIn',
    exitAnimation: 'fadeOut',
    closeOnOutsideClick: true,
    blocks: [
      { id: uid('blk'), type: 'title', props: { source: 'location.name' } },
      { id: uid('blk'), type: 'address', props: { source: 'location.address' } },
      { id: uid('blk'), type: 'text', props: { source: 'location.description' } },
      { id: uid('blk'), type: 'button', props: { action: 'directions', label: 'Open directions', style: 'primary' } },
    ],
  };
}

export function defaultCategory(name: string, color: string): Category {
  return {
    id: uid('cat'),
    name,
    color,
    visible: true,
    parentId: null,
    markerTemplateId: null,
  };
}

export function createEmptyProject(name = 'Untitled project'): Project {
  const defaultMarker = defaultMarkerTemplate('Default pin');
  const defaultPopup = defaultPopupTemplate('Default popup');
  const now = Date.now();
  return {
    id: uid('prj'),
    name,
    description: '',
    tags: [],
    createdAt: now,
    updatedAt: now,
    version: 1,
    mapSettings: defaultMapSettings(),
    categories: [
      defaultCategory('General', '#5b8def'),
    ],
    locations: [],
    markerTemplates: [defaultMarker],
    popupTemplates: [defaultPopup],
    animations: [],
    interactions: [],
    routes: [],
    shapes: [],
    overlays: [],
    layers: [],
    sidebar: defaultSidebar(),
    search: defaultSearch(),
    legend: defaultLegend(),
    filters: defaultFilters(),
    clustering: defaultClustering(),
    globalStyles: defaultGlobalStyles(),
    localization: defaultLocalization(),
    analytics: defaultAnalytics(),
    customCode: {},
    assets: [],
  };
}
