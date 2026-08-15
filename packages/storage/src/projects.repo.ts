/** OWNER: packages/storage — projects in IndexedDB (migrates localStorage v1) */
import { STORAGE_KEYS } from "./keys";
import { loadJSON } from "./local-json";

export type ProjectRecord = {
  id: string;
  name: string;
  updatedAt: string;
  payload: {
    inference: unknown;
    sets: unknown;
    deviceId: string;
    platform: string;
    mode: string;
    selectedSet: number;
    activeFrame: number;
    lastScan: unknown;
    lastPack: unknown;
    scanPalette: unknown;
    selectedShotIds?: string[];
  };
};

const DB_NAME = "take-db";
const DB_VERSION = 1;
const STORE = "projects";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error || new Error("idb open failed"));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

let migratePromise: Promise<void> | null = null;

async function idbGetAll(): Promise<ProjectRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      db.close();
      resolve((req.result as ProjectRecord[]) || []);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

async function idbPut(project: ProjectRecord): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(project);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

function migrateFromLocalStorage(): Promise<void> {
  if (!migratePromise) {
    migratePromise = (async () => {
      const legacy = loadJSON<ProjectRecord[]>(STORAGE_KEYS.projects, []);
      if (!legacy.length) return;
      const existing = await idbGetAll();
      const ids = new Set(existing.map((p) => p.id));
      for (const p of legacy) {
        if (!ids.has(p.id)) await idbPut(p);
      }
      try {
        localStorage.removeItem(STORAGE_KEYS.projects);
      } catch {
        /* ignore */
      }
    })().catch((err) => {
      migratePromise = null;
      throw err;
    });
  }
  return migratePromise;
}

export async function listProjects(): Promise<ProjectRecord[]> {
  await migrateFromLocalStorage();
  const rows = await idbGetAll();
  rows.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return rows.slice(0, 40);
}

export async function getProject(id: string): Promise<ProjectRecord | null> {
  await migrateFromLocalStorage();
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => {
      db.close();
      resolve((req.result as ProjectRecord) || null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function saveProject(project: ProjectRecord): Promise<void> {
  await migrateFromLocalStorage();
  await idbPut(project);
}

export async function deleteProject(id: string): Promise<void> {
  await migrateFromLocalStorage();
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
