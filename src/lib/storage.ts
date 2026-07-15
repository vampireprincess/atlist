// Storage abstraction layer
// Primary: IndexedDB (projects, assets, large data)
// Fallback / small data: LocalStorage (API config, preferences, current project)

import type { ApiConfig, Asset, Project } from '@/types';
import * as idb from './storage/indexedDB';

const PROJECT_INDEX_KEY = 'atlist.projects.index.v1';
const PROJECT_PREFIX = 'atlist.project.v1.';
const ASSET_PREFIX = 'atlist.assets.v1.';
const API_KEY = 'atlist.api.v1';
const CURRENT_PROJECT_KEY = 'atlist.currentProject.v1';

// Check if IndexedDB should be used
let useIndexedDB = true; // Will be set during bootstrap

export async function initStorage(): Promise<void> {
  const available = await idb.isIndexedDBAvailable();
  useIndexedDB = available;
  
  if (available) {
    // Try to migrate from LocalStorage
    const result = await idb.migrateFromLocalStorage();
    if (result.errors.length > 0) {
      console.warn('[Storage] Migration had errors:', result.errors);
    }
  }
}

export interface ProjectIndexEntry {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  tags: string[];
  updatedAt: number;
  createdAt: number;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  // May throw QuotaExceededError — callers handle it.
  localStorage.setItem(key, JSON.stringify(value));
}

/** ---------- API config ---------- */
export function loadApiConfig(): ApiConfig | null {
  return readJson<ApiConfig | null>(API_KEY, null);
}

export function saveApiConfig(cfg: ApiConfig): void {
  writeJson(API_KEY, cfg);
}

export function clearApiConfig(): void {
  localStorage.removeItem(API_KEY);
}

/** ---------- Projects ---------- */
export async function loadProjectIndex(): Promise<ProjectIndexEntry[]> {
  if (useIndexedDB) {
    try {
      const projects = await idb.getAllProjects();
      return projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        thumbnail: p.thumbnail,
        tags: p.tags || [],
        updatedAt: p.updatedAt,
        createdAt: p.createdAt,
      }));
    } catch {
      return readJson<ProjectIndexEntry[]>(PROJECT_INDEX_KEY, []);
    }
  }
  return readJson<ProjectIndexEntry[]>(PROJECT_INDEX_KEY, []);
}

function writeProjectIndex(index: ProjectIndexEntry[]): void {
  writeJson(PROJECT_INDEX_KEY, index);
}

export async function saveProject(project: Project): Promise<void> {
  if (useIndexedDB) {
    try {
      await idb.saveProjectToIDB(project);
      const index = await idb.loadProjectIndexFromIDB();
      const entry: ProjectIndexEntry = {
        id: project.id,
        name: project.name,
        description: project.description,
        thumbnail: project.thumbnail,
        tags: project.tags || [],
        updatedAt: project.updatedAt,
        createdAt: project.createdAt,
      };
      const existing = index.findIndex((p) => p.id === project.id);
      if (existing >= 0) index[existing] = entry;
      else index.push(entry);
      await idb.saveProjectIndex(index);
      return;
    } catch (e) {
      console.warn('[Storage] IndexedDB save failed, falling back to LocalStorage', e);
    }
  }
  
  // Fallback
  writeJson(PROJECT_PREFIX + project.id, project);
  const index = readJson<ProjectIndexEntry[]>(PROJECT_INDEX_KEY, []);
  const entry: ProjectIndexEntry = {
    id: project.id,
    name: project.name,
    description: project.description,
    thumbnail: project.thumbnail,
    tags: project.tags || [],
    updatedAt: project.updatedAt,
    createdAt: project.createdAt,
  };
  const existing = index.findIndex((p) => p.id === project.id);
  if (existing >= 0) index[existing] = entry;
  else index.push(entry);
  writeJson(PROJECT_INDEX_KEY, index);
}

export function loadProject(id: string): Project | null {
  return readJson<Project | null>(PROJECT_PREFIX + id, null);
}

export function deleteProject(id: string): void {
  localStorage.removeItem(PROJECT_PREFIX + id);
  localStorage.removeItem(ASSET_PREFIX + id);
  const index = loadProjectIndex().filter((p) => p.id !== id);
  writeProjectIndex(index);
  if (loadCurrentProjectId() === id) {
    clearCurrentProjectId();
  }
}

export function loadCurrentProjectId(): string | null {
  try {
    return localStorage.getItem(CURRENT_PROJECT_KEY);
  } catch {
    return null;
  }
}

export function saveCurrentProjectId(id: string): void {
  try {
    localStorage.setItem(CURRENT_PROJECT_KEY, id);
  } catch {}
}

export function clearCurrentProjectId(): void {
  try {
    localStorage.removeItem(CURRENT_PROJECT_KEY);
  } catch {}
}

/** ---------- Assets (kept separate to avoid bloating project JSON) ---------- */
export function loadAssets(projectId: string): Asset[] {
  return readJson<Asset[]>(ASSET_PREFIX + projectId, []);
}

export function saveAssets(projectId: string, assets: Asset[]): void {
  writeJson(ASSET_PREFIX + projectId, assets);
}

/** ---------- Storage stats ---------- */
export function getStorageUsageBytes(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key) ?? '';
    total += key.length + value.length;
  }
  return total * 2; // rough UTF-16 estimate
}
