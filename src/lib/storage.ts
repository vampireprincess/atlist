// LocalStorage-backed persistence for projects, assets, and API config.
// Kept intentionally simple; can be replaced with IndexedDB later.

import type { ApiConfig, Asset, Project } from '@/types';

const PROJECT_INDEX_KEY = 'atlist.projects.index.v1';
const PROJECT_PREFIX = 'atlist.project.v1.';
const ASSET_PREFIX = 'atlist.assets.v1.'; // per-project asset store
const API_KEY = 'atlist.api.v1';
const CURRENT_PROJECT_KEY = 'atlist.currentProject.v1';

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
export function loadProjectIndex(): ProjectIndexEntry[] {
  return readJson<ProjectIndexEntry[]>(PROJECT_INDEX_KEY, []);
}

function writeProjectIndex(index: ProjectIndexEntry[]): void {
  writeJson(PROJECT_INDEX_KEY, index);
}

export function saveProject(project: Project): void {
  writeJson(PROJECT_PREFIX + project.id, project);
  const index = loadProjectIndex();
  const entry: ProjectIndexEntry = {
    id: project.id,
    name: project.name,
    description: project.description,
    thumbnail: project.thumbnail,
    tags: project.tags,
    updatedAt: project.updatedAt,
    createdAt: project.createdAt,
  };
  const existing = index.findIndex((p) => p.id === project.id);
  if (existing >= 0) index[existing] = entry;
  else index.push(entry);
  writeProjectIndex(index);
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
