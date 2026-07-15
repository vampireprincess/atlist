// IndexedDB storage service - primary storage for projects, assets, and large data
// LocalStorage is kept only for small UI preferences and current project ID

const DB_NAME = 'atlist-db';
const DB_VERSION = 2;

const STORES = {
  projects: 'projects',
  assets: 'assets',
  projectIndex: 'projectIndex',
  preferences: 'preferences',
} as const;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Projects store
      if (!db.objectStoreNames.contains(STORES.projects)) {
        const projectsStore = db.createObjectStore(STORES.projects, { keyPath: 'id' });
        projectsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Assets store (per project)
      if (!db.objectStoreNames.contains(STORES.assets)) {
        const assetsStore = db.createObjectStore(STORES.assets, { keyPath: 'id' });
        assetsStore.createIndex('projectId', 'projectId', { unique: false });
      }

      // Project index
      if (!db.objectStoreNames.contains(STORES.projectIndex)) {
        db.createObjectStore(STORES.projectIndex, { keyPath: 'id' });
      }

      // Preferences (small data)
      if (!db.objectStoreNames.contains(STORES.preferences)) {
        db.createObjectStore(STORES.preferences, { keyPath: 'key' });
      }
    };
  });
}

// Generic helpers
async function get<T>(storeName: string, key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function put(storeName: string, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function remove(storeName: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ==================== PROJECTS ====================
export interface ProjectRecord {
  id: string;
  name: string;
  data: any;
  updatedAt: number;
  createdAt: number;
}

export async function saveProjectToIDB(project: any): Promise<void> {
  const record: ProjectRecord = {
    id: project.id,
    name: project.name,
    data: project,
    updatedAt: project.updatedAt,
    createdAt: project.createdAt,
  };
  await put(STORES.projects, record);
}

export async function loadProjectFromIDB(id: string): Promise<any | null> {
  const record = await get<ProjectRecord>(STORES.projects, id);
  return record?.data ?? null;
}

export async function deleteProjectFromIDB(id: string): Promise<void> {
  await remove(STORES.projects, id);
  // Also delete associated assets
  await deleteAllAssetsForProject(id);
}

export async function getAllProjects(): Promise<any[]> {
  const records = await getAll<ProjectRecord>(STORES.projects);
  return records.map(r => r.data).sort((a, b) => b.updatedAt - a.updatedAt);
}

// ==================== ASSETS ====================
export interface AssetRecord {
  id: string;
  projectId: string;
  name: string;
  type: string;
  dataUrl: string;
  size: number;
  createdAt: number;
}

export async function saveAssetsToIDB(projectId: string, assets: any[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORES.assets, 'readwrite');
  const store = tx.objectStore(STORES.assets);

  // Delete old assets for this project
  const index = store.index('projectId');
  const oldAssets = await new Promise<any[]>((resolve) => {
    const req = index.getAll(projectId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve([]);
  });

  for (const asset of oldAssets) {
    store.delete(asset.id);
  }

  // Add new assets
  for (const asset of assets) {
    const record: AssetRecord = {
      id: asset.id,
      projectId,
      name: asset.name,
      type: asset.type,
      dataUrl: asset.dataUrl,
      size: asset.size,
      createdAt: asset.createdAt || Date.now(),
    };
    store.put(record);
  }
}

export async function loadAssetsFromIDB(projectId: string): Promise<any[]> {
  const db = await openDB();
  const tx = db.transaction(STORES.assets, 'readonly');
  const store = tx.objectStore(STORES.assets);
  const index = store.index('projectId');

  return new Promise((resolve) => {
    const req = index.getAll(projectId);
    req.onsuccess = () => {
      const records: AssetRecord[] = req.result;
      resolve(records.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        dataUrl: r.dataUrl,
        size: r.size,
        createdAt: r.createdAt,
      })));
    };
    req.onerror = () => resolve([]);
  });
}

export async function deleteAllAssetsForProject(projectId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORES.assets, 'readwrite');
  const store = tx.objectStore(STORES.assets);
  const index = store.index('projectId');

  const assets = await new Promise<any[]>((resolve) => {
    const req = index.getAllKeys(projectId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve([]);
  });

  for (const key of assets) {
    store.delete(key);
  }
}

// ==================== PROJECT INDEX ====================
export async function saveProjectIndex(index: any[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORES.projectIndex, 'readwrite');
  const store = tx.objectStore(STORES.projectIndex);

  // Clear and rebuild
  store.clear();
  for (const entry of index) {
    store.put(entry);
  }
}

export async function loadProjectIndexFromIDB(): Promise<any[]> {
  return getAll(STORES.projectIndex);
}

// ==================== PREFERENCES (LocalStorage fallback) ====================
export function savePreference(key: string, value: any): void {
  try {
    localStorage.setItem(`atlist.pref.${key}`, JSON.stringify(value));
  } catch {}
}

export function loadPreference<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(`atlist.pref.${key}`);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

// ==================== MIGRATION ====================
export async function migrateFromLocalStorage(): Promise<{ migrated: number; errors: string[] }> {
  const errors: string[] = [];
  let migrated = 0;

  try {
    // Migrate projects
    const oldIndex = JSON.parse(localStorage.getItem('atlist.projects.index.v1') || '[]');
    
    for (const entry of oldIndex) {
      try {
        const oldProject = localStorage.getItem(`atlist.project.v1.${entry.id}`);
        if (oldProject) {
          const project = JSON.parse(oldProject);
          await saveProjectToIDB(project);
          migrated++;
        }
      } catch (e) {
        errors.push(`Failed to migrate project ${entry.id}: ${e}`);
      }
    }

    // Migrate assets
    for (const entry of oldIndex) {
      try {
        const oldAssets = localStorage.getItem(`atlist.assets.v1.${entry.id}`);
        if (oldAssets) {
          const assets = JSON.parse(oldAssets);
          await saveAssetsToIDB(entry.id, assets);
        }
      } catch (e) {
        errors.push(`Failed to migrate assets for ${entry.id}: ${e}`);
      }
    }

    // Save new index
    await saveProjectIndex(oldIndex);

    console.log(`[IndexedDB] Migration completed: ${migrated} projects`);
  } catch (e) {
    errors.push(`Migration failed: ${e}`);
  }

  return { migrated, errors };
}

export async function isIndexedDBAvailable(): Promise<boolean> {
  try {
    await openDB();
    return true;
  } catch {
    return false;
  }
}