/** OWNER: app/app-state — in-memory session state */
import type { InferenceBrief, ProjectSet } from "@take/core";
import type { CapturedPalette, ScanPack, ScanResult } from "@take/scan-client";
import type { DeviceFitMode, DeviceOrientation, ShellView } from "@take/device-catalog";

export type UploadItem = {
  name: string;
  url: string;
  kind: "image" | "video";
  /** Video only — read from the file itself, not invented */
  durationMs?: number;
  width?: number;
  height?: number;
  bytes?: number;
  /** Video only — first-frame thumbnail for previews */
  posterUrl?: string;
};

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
  /** Library: hide recipes tagged "needs-polish" (unfinished seed examples) */
  hideDrafts: boolean;
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
  /** Library recipe armed — Wizard Generate applies this look */
  templateId: string;
  /** null = use stored/defaultOn until the user changes Export checkboxes */
  exportPresetIds: string[] | null;
  /** Slice = one PNG; Set = store carousel */
  editView: "slice" | "set";
  /** Ads mode: selected @take/ad-unit-catalog ids — one StoryFrame per id on Generate */
  adUnitIds: string[];
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
  hideDrafts: true,
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
  editView: "slice",
  adUnitIds: ["iab.mpu-300x250", "iab.leaderboard-728x90", "iab.social-feed-4x5"],
};

export function currentSet() {
  return state.sets[state.selectedSet];
}

export function currentFrame() {
  return currentSet()?.frames[state.activeFrame];
}
