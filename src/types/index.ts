// Core domain types for the Atlist visual map editor.
// These types are shared between editor UI, project store, and export pipeline.

export type ID = string;

export type LatLng = {
  lat: number;
  lng: number;
};

export type ResponsiveValue<T> = {
  desktop: T;
  tablet?: T;
  mobile?: T;
};

/** ---------- Categories ---------- */
export interface Category {
  id: ID;
  name: string;
  color: string;
  icon?: string; // emoji or short label
  parentId?: ID | null;
  markerTemplateId?: ID | null;
  visible: boolean;
}

/** ---------- Markers ---------- */
export type MarkerKind =
  | 'pin' // Google default pin
  | 'emoji'
  | 'text'
  | 'image' // PNG/WebP/GIF/JPG from Asset Library
  | 'svg' // uploaded SVG
  | 'html'; // free-form HTML template

export interface MarkerTemplate {
  id: ID;
  name: string;
  kind: MarkerKind;
  // Visual
  width: number;
  height: number;
  scale: number;
  rotation: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
  anchor: 'center' | 'bottom' | 'top' | 'left' | 'right';
  zIndex: number;
  collisionBehavior: 'REQUIRED' | 'OPTIONAL_AND_HIDES_LOWER_PRIORITY' | 'REQUIRED_AND_HIDES_OPTIONAL';
  // Styling
  background: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  shadow: string;
  glow: string;
  // Content
  emoji?: string;
  text?: string;
  imageAssetId?: ID;
  svgAssetId?: ID;
  html?: string;
  // Pin
  pinBackground?: string;
  pinBorderColor?: string;
  pinGlyph?: string;
  pinGlyphColor?: string;
  // Label / badge
  label?: string;
  labelColor?: string;
  badge?: string;
  badgeColor?: string;
  // Animation binding
  animationId?: ID | null;
  // States (partial overrides)
  hover?: Partial<MarkerTemplate>;
  active?: Partial<MarkerTemplate>;
  selected?: Partial<MarkerTemplate>;
}

/** ---------- Locations ---------- */
export interface LocationButton {
  id: ID;
  label: string;
  href?: string;
  action?: 'openUrl' | 'openUrlNewTab' | 'directions' | 'copyAddress' | 'callPhone' | 'sendEmail';
  style?: 'primary' | 'secondary' | 'ghost';
}

export interface LocationImage {
  assetId: ID;
  alt?: string;
  caption?: string;
}

export interface Location {
  id: ID;
  name: string;
  shortName?: string;
  address?: string;
  position: LatLng;
  description?: string;
  categoryIds: ID[];
  tags: string[];
  featured: boolean;
  markerTemplateId: ID | null;
  markerOverride?: Partial<MarkerTemplate> | null;
  popupTemplateId?: ID | null;
  popupOverride?: Partial<PopupTemplate> | null;
  images: LocationImage[];
  video?: string;
  buttons: LocationButton[];
  link?: string;
  phone?: string;
  email?: string;
  hours?: string;
  customFields: Record<string, string>;
  accessibilityLabel?: string;
  sidebarOrder?: number;
  visible: boolean;
  publishAt?: string | null;
}

/** ---------- Popups ---------- */
export type PopupBlockType =
  | 'title'
  | 'subtitle'
  | 'text'
  | 'image'
  | 'gallery'
  | 'video'
  | 'address'
  | 'hours'
  | 'phone'
  | 'email'
  | 'button'
  | 'buttons'
  | 'divider'
  | 'badge'
  | 'rating'
  | 'price'
  | 'status'
  | 'social'
  | 'customField'
  | 'html';

export interface PopupBlock {
  id: ID;
  type: PopupBlockType;
  props: Record<string, any>;
}

export interface PopupTemplate {
  id: ID;
  name: string;
  variant: 'tooltip' | 'card' | 'floating' | 'sidepanel' | 'modal' | 'bottomSheet';
  width: number;
  maxWidth: number;
  padding: number;
  background: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  shadow: string;
  backdropBlur: number;
  showArrow: boolean;
  showClose: boolean;
  offsetX: number;
  offsetY: number;
  entranceAnimation: string;
  exitAnimation: string;
  closeOnOutsideClick: boolean;
  blocks: PopupBlock[];
}

/** ---------- Animations ---------- */
export type AnimationPreset =
  | 'none'
  | 'pulse'
  | 'softPulse'
  | 'glowPulse'
  | 'bounce'
  | 'softBounce'
  | 'float'
  | 'hover'
  | 'swing'
  | 'shake'
  | 'wiggle'
  | 'rotate'
  | 'slowRotate'
  | 'flip'
  | 'scaleIn'
  | 'fadeIn'
  | 'slideIn'
  | 'popIn'
  | 'elasticEntrance'
  | 'heartbeat'
  | 'breathing'
  | 'blink'
  | 'shimmer'
  | 'ripple'
  | 'radarPulse'
  | 'expandingRing'
  | 'attentionBounce'
  | 'pathReveal'
  | 'randomGentle';

export interface Animation {
  id: ID;
  name: string;
  preset: AnimationPreset;
  duration: number; // ms
  delay: number; // ms
  easing: string;
  iterationCount: number | 'infinite';
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  intensity: number; // 0-2 scale
  transformOrigin: string;
  trigger:
    | 'onLoad'
    | 'inViewport'
    | 'onHover'
    | 'onClick'
    | 'onSelected'
    | 'onPopupOpen'
    | 'onFilter'
    | 'onSearch'
    | 'delayed'
    | 'onceSession';
  randomVariation: {
    enabled: boolean;
    delayMs?: number;
    durationPercent?: number;
    intensityPercent?: number;
    phasePercent?: number;
    direction?: boolean;
    rotationDeg?: number;
    scalePercent?: number;
  };
}

/** ---------- Interactions ---------- */
export type InteractionTrigger =
  | 'click'
  | 'dblclick'
  | 'hoverEnter'
  | 'hoverLeave'
  | 'focus'
  | 'markerSelected'
  | 'popupOpened'
  | 'popupClosed'
  | 'zoomChanged'
  | 'enterViewport'
  | 'leaveViewport'
  | 'filterActivated';

export type InteractionActionType =
  | 'openPopup'
  | 'closePopup'
  | 'selectMarker'
  | 'zoomToMarker'
  | 'panToMarker'
  | 'bounceMarker'
  | 'startAnimation'
  | 'stopAnimation'
  | 'changeMarkerAppearance'
  | 'openUrl'
  | 'openUrlNewTab'
  | 'scrollToElement'
  | 'openSidebarTab'
  | 'showGallery'
  | 'copyAddress'
  | 'callPhone'
  | 'sendEmail'
  | 'openDirections'
  | 'showRelated'
  | 'hideRelated'
  | 'toggleCategory'
  | 'playSound'
  | 'customEvent';

export interface InteractionCondition {
  kind: 'isMobile' | 'categoryActive' | 'zoomGreater' | 'zoomLess' | 'markerSelected' | 'popupClosed';
  value?: any;
}

export interface InteractionAction {
  id: ID;
  type: InteractionActionType;
  params?: Record<string, any>;
  conditions?: InteractionCondition[];
}

export interface Interaction {
  id: ID;
  name: string;
  trigger: InteractionTrigger;
  actions: InteractionAction[];
  enabled: boolean;
}

/** ---------- Routes / Lines ---------- */
export interface RouteLine {
  id: ID;
  name: string;
  kind: 'straight' | 'polyline' | 'driving' | 'walking' | 'bicycling' | 'transit';
  points: LatLng[];
  color: string;
  opacity: number;
  weight: number;
  pattern: 'solid' | 'dashed' | 'dotted' | 'segmented' | 'animated' | 'glow';
  showArrows: boolean;
  label?: string;
  zIndex: number;
  visible: boolean;
}

/** ---------- Shapes / Regions ---------- */
export interface ShapeRegion {
  id: ID;
  name: string;
  kind: 'polygon' | 'circle' | 'rectangle' | 'geojson';
  paths?: LatLng[];
  center?: LatLng;
  radius?: number; // meters (circle)
  bounds?: { ne: LatLng; sw: LatLng }; // rectangle
  geojson?: any;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWeight: number;
  hoverFillColor?: string;
  label?: string;
  popupTemplateId?: ID | null;
  zIndex: number;
  visible: boolean;
}

/** ---------- Decorative Overlays ---------- */
export interface DecorativeOverlay {
  id: ID;
  name: string;
  kind: 'html' | 'image' | 'svg' | 'text' | 'badge' | 'logo' | 'legend';
  content: string;
  assetId?: ID;
  bindMode: 'coord' | 'corner' | 'marker';
  position?: LatLng;
  corner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  markerId?: ID;
  width?: number;
  height?: number;
  minZoom?: number;
  maxZoom?: number;
  visibleOn: { desktop: boolean; tablet: boolean; mobile: boolean };
  visible: boolean;
}

/** ---------- Layers ---------- */
export interface Layer {
  id: ID;
  name: string;
  kind: 'markers' | 'markerGroup' | 'routes' | 'shapes' | 'overlays' | 'labels' | 'custom';
  visible: boolean;
  locked: boolean;
  opacity: number;
  minZoom?: number;
  maxZoom?: number;
  visibleOn: { desktop: boolean; tablet: boolean; mobile: boolean };
  categoryId?: ID | null;
  childIds: ID[];
}

/** ---------- Assets ---------- */
export interface Asset {
  id: ID;
  name: string;
  type: 'svg' | 'png' | 'jpg' | 'webp' | 'gif' | 'video' | 'audio' | 'json' | 'geojson' | 'csv';
  dataUrl: string; // stored as data URL for local persistence
  size: number;
  width?: number;
  height?: number;
  tags: string[];
  folder?: string;
  createdAt: number;
}

/** ---------- Map Settings ---------- */
export interface MapSettings {
  center: LatLng;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  bounds?: { ne: LatLng; sw: LatLng } | null;
  mapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  colorScheme: 'LIGHT' | 'DARK' | 'FOLLOW_SYSTEM';
  mapId?: string;
  styleJson?: string;
  controls: {
    zoom: boolean;
    fullscreen: boolean;
    streetView: boolean;
    mapType: boolean;
    scaleControl: boolean;
    rotateControl: boolean;
  };
  gestures: {
    gestureHandling: 'auto' | 'greedy' | 'cooperative' | 'none';
    scrollwheel: boolean;
    draggable: boolean;
    disableDoubleClickZoom: boolean;
    keyboardShortcuts: boolean;
  };
  tilt?: number;
  heading?: number;
  responsive: {
    tablet?: { center?: LatLng; zoom?: number };
    mobile?: { center?: LatLng; zoom?: number };
  };
}

/** ---------- Sidebar ---------- */
export interface SidebarSettings {
  enabled: boolean;
  position: 'left' | 'right' | 'overlay' | 'bottomDrawerMobile';
  variant: 'list' | 'cards' | 'compact' | 'imageCards';
  showSearch: boolean;
  showFilters: boolean;
  showSort: boolean;
  showCount: boolean;
  showFeatured: boolean;
  showDistance: boolean;
  collapsible: boolean;
  widthDesktop: number;
  emptyStateText: string;
  loadingStateText: string;
}

/** ---------- Search ---------- */
export interface SearchSettings {
  enabled: boolean;
  fields: Array<'name' | 'address' | 'description' | 'tags' | 'categories' | 'customFields'>;
  autocomplete: boolean;
  centerOnResult: boolean;
  openPopupOnResult: boolean;
  showInSidebar: boolean;
  placeholder: string;
}

/** ---------- Legend ---------- */
export interface LegendSettings {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  title?: string;
  items: Array<{ label: string; color: string; icon?: string }>;
}

/** ---------- Global Styles ---------- */
export interface GlobalStyles {
  fontFamily: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  borderRadius: number;
  customFontUrl?: string;
  customCss?: string;
}

/** ---------- Filters ---------- */
export interface FilterSettings {
  enabled: boolean;
  variant: 'checkbox' | 'dropdown' | 'pills' | 'toggle';
  logic: 'AND' | 'OR';
  showCounts: boolean;
  showClearAll: boolean;
  showSelectAll: boolean;
  animateMarkers: boolean;
  syncUrl: boolean;
}

/** ---------- Localization ---------- */
export interface Localization {
  defaultLocale: string;
  strings: Record<string, Record<string, string>>; // locale -> key -> value
}

/** ---------- Analytics ---------- */
export interface AnalyticsSettings {
  enabled: boolean;
  provider: 'none' | 'ga4' | 'custom';
  gaMeasurementId?: string;
  events: {
    markerClick: boolean;
    popupOpen: boolean;
    filterUse: boolean;
    directionsClick: boolean;
  };
}

/** ---------- Clustering ---------- */
export interface ClusteringSettings {
  enabled: boolean;
  minPoints: number;
  maxZoom: number;
  gridSize: number;
  color: string;
  textColor: string;
  useCategoryColor: boolean;
}

/** ---------- Custom Code ---------- */
export interface CustomCode {
  css?: string;
  jsHooks?: string;
}

/** ---------- Project ---------- */
export interface Project {
  id: ID;
  name: string;
  description?: string;
  thumbnail?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  version: number;

  mapSettings: MapSettings;
  categories: Category[];
  locations: Location[];
  markerTemplates: MarkerTemplate[];
  popupTemplates: PopupTemplate[];
  animations: Animation[];
  interactions: Interaction[];
  routes: RouteLine[];
  shapes: ShapeRegion[];
  overlays: DecorativeOverlay[];
  layers: Layer[];
  sidebar: SidebarSettings;
  search: SearchSettings;
  legend: LegendSettings;
  filters: FilterSettings;
  clustering: ClusteringSettings;
  globalStyles: GlobalStyles;
  localization: Localization;
  analytics: AnalyticsSettings;
  customCode: CustomCode;
  assets: Asset[]; // kept for reference; live assets stored separately (see Asset Library)
}

/** ---------- API Configuration (never exported to client bundle) ---------- */
export interface ApiConfig {
  editorApiKey: string;
  editorMapId: string;
  exportApiKey: string;
  exportMapId: string;
  savedAt: number;
}

/** ---------- Selection ---------- */
export type SelectionKind = 'location' | 'markerTemplate' | 'popupTemplate' | 'route' | 'shape' | 'overlay' | 'category' | 'layer' | null;

export interface Selection {
  kind: SelectionKind;
  id: ID | null;
}

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';
