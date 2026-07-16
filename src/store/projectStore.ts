// Central editor state.
// Split into slices: project data (undoable), assets (non-undoable), selection & UI, API config.

import { create } from 'zustand';
import type {
  ApiConfig,
  Asset,
  Category,
  DecorativeOverlay,
  DeviceMode,
  ID,
  Location,
  MarkerTemplate,
  PopupTemplate,
  Project,
  RouteLine,
  Selection,
  ShapeRegion,
} from '@/types';
import {
  createHistory,
  pushHistory,
  redo as historyRedo,
  undo as historyUndo,
  type HistoryState,
} from './history';
import {
  clearApiConfig,
  clearCurrentProjectId,
  deleteProject as storageDeleteProject,
  loadApiConfig,
  loadAssets,
  loadCurrentProjectId,
  loadProject,
  loadProjectIndex,
  saveApiConfig,
  saveAssets,
  saveCurrentProjectId,
  saveProject,
  type ProjectIndexEntry,
} from '@/lib/storage';
import { createEmptyProject } from '@/lib/defaults';
import { uid } from '@/lib/id';

const AUTOSAVE_INTERVAL_MS = 15_000;

type PanelKey =
  | 'projects'
  | 'mapSettings'
  | 'locations'
  | 'markers'
  | 'popups'
  | 'categories'
  | 'routes'
  | 'shapes'
  | 'layers'
  | 'animations'
  | 'interactions'
  | 'sidebar'
  | 'legend'
  | 'search'
  | 'responsive'
  | 'globalStyles'
  | 'assets'
  | 'importPanel'
  | 'exportPanel'
  | 'overview';

interface State {
  project: Project | null;
  projectIndex: ProjectIndexEntry[];
  assets: Asset[];
  apiConfig: ApiConfig | null;
  history: HistoryState;
  selection: Selection;
  activePanel: PanelKey;
  deviceMode: DeviceMode;
  testMode: boolean;
  lastSavedAt: number | null;
  dirty: boolean;
  addLocationMode: boolean;
  loading: boolean;
  errorMessage: string | null;
}

interface Actions {
  // Bootstrap
  bootstrap(): void;
  refreshIndex(): void;

  // API config
  setApiConfig(cfg: ApiConfig): void;
  clearApi(): void;

  // Project lifecycle
  newProject(name?: string): Project;
  openProject(id: string): void;
  closeProject(): void;
  duplicateProject(id: string): void;
  renameProject(id: string, name: string): void;
  deleteProjectById(id: string): void;
  saveNow(): void;

  // Undo/redo
  mutate(label: string, mutator: (p: Project) => void): void;
  undo(): void;
  redo(): void;

  // Selection & UI
  select(kind: Selection['kind'], id: ID | null): void;
  clearSelection(): void;
  setPanel(panel: PanelKey): void;
  setDeviceMode(mode: DeviceMode): void;
  setTestMode(v: boolean): void;
  setAddLocationMode(v: boolean): void;
  setError(msg: string | null): void;

  // Assets
  addAsset(asset: Asset): void;
  updateAsset(id: ID, patch: Partial<Asset>): void;
  removeAsset(id: ID): void;

  // Convenience for common operations
  addLocationAt(pos: google.maps.LatLngLiteral): Location;
  updateLocation(id: ID, patch: Partial<Location>): void;
  removeLocation(id: ID): void;

  addCategory(name: string, color: string): Category;
  updateCategory(id: ID, patch: Partial<Category>): void;
  removeCategory(id: ID): void;

  addMarkerTemplate(name?: string): MarkerTemplate;
  updateMarkerTemplate(id: ID, patch: Partial<MarkerTemplate>): void;
  removeMarkerTemplate(id: ID): void;

  addPopupTemplate(name?: string): PopupTemplate;
  updatePopupTemplate(id: ID, patch: Partial<PopupTemplate>): void;
  removePopupTemplate(id: ID): void;

  addRoute(route: RouteLine): void;
  updateRoute(id: ID, patch: Partial<RouteLine>): void;
  removeRoute(id: ID): void;

  addShape(shape: ShapeRegion): void;
  updateShape(id: ID, patch: Partial<ShapeRegion>): void;
  removeShape(id: ID): void;

  addOverlay(overlay: DecorativeOverlay): void;
  updateOverlay(id: ID, patch: Partial<DecorativeOverlay>): void;
  removeOverlay(id: ID): void;
}

export type ProjectStore = State & Actions;

function snapshot(project: Project): Project {
  // Structured clone keeps things simple; project data is JSON-safe.
  return JSON.parse(JSON.stringify(project));
}

function syncAssetsWindow(assets: Asset[]): void {
  const map: Record<string, string> = {};
  for (const a of assets) map[a.id] = a.dataUrl;
  (window as any).__atlist_assets = map;
}

let autosaveTimer: number | null = null;

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,
  projectIndex: [],
  assets: [],
  apiConfig: null,
  history: createHistory(),
  selection: { kind: null, id: null },
  activePanel: 'projects',
  deviceMode: 'desktop',
  testMode: false,
  lastSavedAt: null,
  dirty: false,
  addLocationMode: false,
  loading: false,
  errorMessage: null,

  async bootstrap() {
    const apiConfig = loadApiConfig();
    
    let projectIndex: any[] = [];
    try {
      // loadProjectIndex may return Promise (IndexedDB) or array (LocalStorage)
      const result = loadProjectIndex();
      const index = result instanceof Promise ? await result : result;
      projectIndex = (index || []).sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      projectIndex = [];
    }

    set({ apiConfig, projectIndex });

    const currentId = loadCurrentProjectId();
    if (currentId) {
      const project = loadProject(currentId);
      if (project) {
        const assets = loadAssets(project.id);
        syncAssetsWindow(assets);
        set({
          project,
          assets,
          history: createHistory(),
          selection: { kind: null, id: null },
          activePanel: 'locations',
        });
      }
    }
    if (autosaveTimer !== null) window.clearInterval(autosaveTimer);
    autosaveTimer = window.setInterval(() => {
      const { dirty } = get();
      if (dirty) get().saveNow();
    }, AUTOSAVE_INTERVAL_MS);
  },

  refreshIndex() {
    set({ projectIndex: loadProjectIndex().sort((a, b) => b.updatedAt - a.updatedAt) });
  },

  setApiConfig(cfg) {
    saveApiConfig(cfg);
    set({ apiConfig: cfg });
  },

  clearApi() {
    clearApiConfig();
    set({ apiConfig: null });
  },

  newProject(name = 'Untitled project') {
    const project = createEmptyProject(name);
    saveProject(project);
    saveCurrentProjectId(project.id);
    set({
      project,
      assets: [],
      history: createHistory(),
      selection: { kind: null, id: null },
      activePanel: 'locations',
      lastSavedAt: Date.now(),
      dirty: false,
    });
    get().refreshIndex();
    return project;
  },

  openProject(id) {
    const project = loadProject(id);
    if (!project) {
      set({ errorMessage: 'Project not found.' });
      return;
    }
    saveCurrentProjectId(id);
    const assets = loadAssets(id);
    syncAssetsWindow(assets);
    set({
      project,
      assets,
      history: createHistory(),
      selection: { kind: null, id: null },
      activePanel: 'locations',
      lastSavedAt: Date.now(),
      dirty: false,
    });
  },

  closeProject() {
    clearCurrentProjectId();
    set({
      project: null,
      assets: [],
      history: createHistory(),
      selection: { kind: null, id: null },
      activePanel: 'projects',
    });
  },

  duplicateProject(id) {
    const source = loadProject(id);
    if (!source) return;
    const copy: Project = { ...snapshot(source), id: uid('prj'), name: source.name + ' copy', createdAt: Date.now(), updatedAt: Date.now() };
    saveProject(copy);
    // Duplicate assets as well
    const sourceAssets = loadAssets(id);
    saveAssets(copy.id, sourceAssets);
    get().refreshIndex();
  },

  renameProject(id, name) {
    const proj = loadProject(id);
    if (!proj) return;
    proj.name = name;
    proj.updatedAt = Date.now();
    saveProject(proj);
    if (get().project?.id === id) {
      set({ project: { ...get().project!, name } });
    }
    get().refreshIndex();
  },

  deleteProjectById(id) {
    storageDeleteProject(id);
    if (get().project?.id === id) get().closeProject();
    get().refreshIndex();
  },

  saveNow() {
    const { project, assets } = get();
    if (!project) return;
    const updated = { ...project, updatedAt: Date.now() };
    saveProject(updated);
    saveAssets(project.id, assets);
    set({ project: updated, lastSavedAt: updated.updatedAt, dirty: false });
    get().refreshIndex();
  },

  mutate(label, mutator) {
    const { project, history } = get();
    if (!project) return;
    const before = snapshot(project);
    const next = snapshot(project);
    mutator(next);
    next.updatedAt = Date.now();
    const nextHistory = pushHistory(history, { label, project: before, at: Date.now() });
    set({ project: next, history: nextHistory, dirty: true });
  },

  undo() {
    const { project, history } = get();
    if (!project) return;
    const current = { label: 'current', project: snapshot(project), at: Date.now() };
    const { state, entry } = historyUndo(history, current);
    if (!entry) return;
    set({ project: entry.project, history: state, dirty: true });
  },

  redo() {
    const { project, history } = get();
    if (!project) return;
    const current = { label: 'current', project: snapshot(project), at: Date.now() };
    const { state, entry } = historyRedo(history, current);
    if (!entry) return;
    set({ project: entry.project, history: state, dirty: true });
  },

  select(kind, id) {
    set({ selection: { kind, id } });
  },

  clearSelection() {
    set({ selection: { kind: null, id: null } });
  },

  setPanel(activePanel) {
    set({ activePanel });
  },

  setDeviceMode(deviceMode) {
    set({ deviceMode });
  },

  setTestMode(testMode) {
    set({ testMode });
  },

  setAddLocationMode(addLocationMode) {
    set({ addLocationMode });
  },

  setError(errorMessage) {
    set({ errorMessage });
  },

  addAsset(asset) {
    const assets = [...get().assets, asset];
    set({ assets, dirty: true });
    syncAssetsWindow(assets);
    const { project } = get();
    if (project) saveAssets(project.id, assets);
  },

  updateAsset(id, patch) {
    const assets = get().assets.map((a) => (a.id === id ? { ...a, ...patch } : a));
    set({ assets, dirty: true });
    syncAssetsWindow(assets);
    const { project } = get();
    if (project) saveAssets(project.id, assets);
  },

  removeAsset(id) {
    const assets = get().assets.filter((a) => a.id !== id);
    set({ assets, dirty: true });
    syncAssetsWindow(assets);
    const { project } = get();
    if (project) saveAssets(project.id, assets);
  },

  addLocationAt(pos) {
    const store = get();
    const project = store.project;
    if (!project) throw new Error('No project open');
    const location: Location = {
      id: uid('loc'),
      name: 'New location',
      position: { lat: pos.lat, lng: pos.lng },
      categoryIds: project.categories[0] ? [project.categories[0].id] : [],
      tags: [],
      featured: false,
      markerTemplateId: project.markerTemplates[0]?.id ?? null,
      popupTemplateId: project.popupTemplates[0]?.id ?? null,
      images: [],
      buttons: [],
      customFields: {},
      visible: true,
    };
    store.mutate('Add location', (p) => {
      p.locations.push(location);
    });
    store.select('location', location.id);
    return location;
  },

  updateLocation(id, patch) {
    get().mutate('Update location', (p) => {
      const idx = p.locations.findIndex((l) => l.id === id);
      if (idx >= 0) p.locations[idx] = { ...p.locations[idx], ...patch };
    });
  },

  removeLocation(id) {
    get().mutate('Delete location', (p) => {
      p.locations = p.locations.filter((l) => l.id !== id);
    });
    if (get().selection.id === id) get().clearSelection();
  },

  addCategory(name, color) {
    const cat: Category = { id: uid('cat'), name, color, visible: true, parentId: null, markerTemplateId: null };
    get().mutate('Add category', (p) => {
      p.categories.push(cat);
    });
    return cat;
  },

  updateCategory(id, patch) {
    get().mutate('Update category', (p) => {
      const idx = p.categories.findIndex((c) => c.id === id);
      if (idx >= 0) p.categories[idx] = { ...p.categories[idx], ...patch };
    });
  },

  removeCategory(id) {
    get().mutate('Delete category', (p) => {
      p.categories = p.categories.filter((c) => c.id !== id);
      p.locations = p.locations.map((l) => ({ ...l, categoryIds: l.categoryIds.filter((c) => c !== id) }));
    });
  },

  addMarkerTemplate(name) {
    const t: MarkerTemplate = { ...(get().project!.markerTemplates[0] ?? {} as any) } as MarkerTemplate;
    // Copy from default marker template
    const src = get().project!.markerTemplates[0];
    const copy: MarkerTemplate = { ...JSON.parse(JSON.stringify(src)), id: uid('mkr'), name: name ?? 'New marker' };
    void t;
    get().mutate('Add marker template', (p) => {
      p.markerTemplates.push(copy);
    });
    return copy;
  },

  updateMarkerTemplate(id, patch) {
    get().mutate('Update marker template', (p) => {
      const idx = p.markerTemplates.findIndex((m) => m.id === id);
      if (idx >= 0) p.markerTemplates[idx] = { ...p.markerTemplates[idx], ...patch };
    });
  },

  removeMarkerTemplate(id) {
    get().mutate('Delete marker template', (p) => {
      p.markerTemplates = p.markerTemplates.filter((m) => m.id !== id);
      p.locations = p.locations.map((l) => (l.markerTemplateId === id ? { ...l, markerTemplateId: null } : l));
    });
  },

  addPopupTemplate(name) {
    const src = get().project!.popupTemplates[0];
    const copy: PopupTemplate = { ...JSON.parse(JSON.stringify(src)), id: uid('pop'), name: name ?? 'New popup' };
    get().mutate('Add popup template', (p) => {
      p.popupTemplates.push(copy);
    });
    return copy;
  },

  updatePopupTemplate(id, patch) {
    get().mutate('Update popup template', (p) => {
      const idx = p.popupTemplates.findIndex((t) => t.id === id);
      if (idx >= 0) p.popupTemplates[idx] = { ...p.popupTemplates[idx], ...patch };
    });
  },

  removePopupTemplate(id) {
    get().mutate('Delete popup template', (p) => {
      p.popupTemplates = p.popupTemplates.filter((t) => t.id !== id);
    });
  },

  addRoute(route) {
    get().mutate('Add route', (p) => {
      p.routes.push(route);
    });
  },
  updateRoute(id, patch) {
    get().mutate('Update route', (p) => {
      const idx = p.routes.findIndex((r) => r.id === id);
      if (idx >= 0) p.routes[idx] = { ...p.routes[idx], ...patch };
    });
  },
  removeRoute(id) {
    get().mutate('Delete route', (p) => {
      p.routes = p.routes.filter((r) => r.id !== id);
    });
  },

  addShape(shape) {
    get().mutate('Add shape', (p) => {
      p.shapes.push(shape);
    });
  },
  updateShape(id, patch) {
    get().mutate('Update shape', (p) => {
      const idx = p.shapes.findIndex((s) => s.id === id);
      if (idx >= 0) p.shapes[idx] = { ...p.shapes[idx], ...patch };
    });
  },
  removeShape(id) {
    get().mutate('Delete shape', (p) => {
      p.shapes = p.shapes.filter((s) => s.id !== id);
    });
  },

  addOverlay(o) {
    get().mutate('Add overlay', (p) => {
      p.overlays.push(o);
    });
  },
  updateOverlay(id, patch) {
    get().mutate('Update overlay', (p) => {
      const idx = p.overlays.findIndex((o) => o.id === id);
      if (idx >= 0) p.overlays[idx] = { ...p.overlays[idx], ...patch };
    });
  },
  removeOverlay(id) {
    get().mutate('Delete overlay', (p) => {
      p.overlays = p.overlays.filter((o) => o.id !== id);
    });
  },
}));
