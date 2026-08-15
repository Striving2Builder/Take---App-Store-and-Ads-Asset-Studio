/** OWNER: app/app-state — in-memory session state */
import type { InferenceBrief, ProjectSet } from "@take/core";
import type { CapturedPalette, ScanPack, ScanResult } from "@take/scan-client";

export type UploadItem = { name: string; url: string };

export type AppState = {
  stage: string;
  mode: string;
  platform: string;
  qty: number;
  uploads: UploadItem[];
  inference: InferenceBrief | null;
  sets: ProjectSet[];
  selectedSet: number;
  activeFrame: number;
  filter: string;
  deviceId: string;
  /** Last Real App Scan result (live or fallback) */
  lastScan: ScanResult | null;
  /** Multi-URL pack when secondary sources were scanned */
  lastPack: ScanPack | null;
  /** Palette extracted from icon/screens after scan */
  scanPalette: CapturedPalette | null;
  scanLocked: boolean;
  /** Screenshot asset ids selected for canvas/export (empty = all) */
  selectedShotIds: string[];
  /** IndexedDB project id when updating an existing save */
  currentProjectId: string | null;
};

export const state: AppState = {
  stage: "landing",
  mode: "wizard",
  platform: "ios",
  qty: 3,
  uploads: [],
  inference: null,
  sets: [],
  selectedSet: 0,
  activeFrame: 0,
  filter: "all",
  deviceId: "apple.iphone-16-pro",
  lastScan: null,
  lastPack: null,
  scanPalette: null,
  scanLocked: false,
  selectedShotIds: [],
  currentProjectId: null,
};

export function currentSet() {
  return state.sets[state.selectedSet];
}

export function currentFrame() {
  return currentSet()?.frames[state.activeFrame];
}
