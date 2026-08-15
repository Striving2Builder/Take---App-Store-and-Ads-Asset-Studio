/** OWNER: app/app-state — in-memory session state */
import type { InferenceBrief, ProjectSet } from "@take/core";
import type { CapturedPalette, ScanPack, ScanResult } from "@take/scan-client";
import type { DeviceFitMode, DeviceOrientation, ShellView } from "@take/device-catalog";

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
  fitMode: DeviceFitMode;
  orientation: DeviceOrientation;
  shellView: ShellView;
  lastScan: ScanResult | null;
  lastPack: ScanPack | null;
  scanPalette: CapturedPalette | null;
  scanLocked: boolean;
  selectedShotIds: string[];
  currentProjectId: string | null;
  /** Library recipe armed for Template mode */
  templateId: string;
  /** null = use stored/defaultOn until the user changes Export checkboxes */
  exportPresetIds: string[] | null;
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
  deviceId: "apple.iphone-16-pro-max",
  fitMode: "cover",
  orientation: "portrait",
  shellView: "front",
  lastScan: null,
  lastPack: null,
  scanPalette: null,
  scanLocked: false,
  selectedShotIds: [],
  currentProjectId: null,
  templateId: "",
  exportPresetIds: null,
};

export function currentSet() {
  return state.sets[state.selectedSet];
}

export function currentFrame() {
  return currentSet()?.frames[state.activeFrame];
}
