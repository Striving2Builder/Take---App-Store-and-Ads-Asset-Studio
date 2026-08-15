/** OWNER: packages/device-catalog — device profile types (NOT style/palette) */
export type DevicePlatform = "ios" | "android" | "other";
export type FormFactor = "phone" | "tablet" | "foldable";
export type DeviceStatus = "current" | "supported" | "deprecated";
export type ShellKind = "frame" | "asset";
/** Geometric fit only — not OS UI conversion */
export type DeviceFitMode = "cover" | "contain" | "safe-area";
export type DeviceOrientation = "portrait" | "landscape";
export type ShellView = "front" | "back";

export type PxSize = { w: number; h: number };
export type ScreenInset = { x: number; y: number; w: number; h: number };
export type SafeArea = { top: number; bottom: number; left: number; right: number };

export type HardwareHotspots = {
  /** Front camera / punch-hole in shellPx */
  frontCamera?: ScreenInset;
  /** Dynamic Island / pill in shellPx */
  dynamicIsland?: ScreenInset;
  /** Side buttons (y/h in shellPx; side of device) */
  buttons?: { side: "left" | "right"; y: number; h: number }[];
  /** Rear camera module rects in shellPx (back view) */
  rearCameras?: ScreenInset[];
};

/**
 * Device hardware / export profile.
 * `screenInset` is in `shellPx` coordinates.
 * Store PNG uses exportPx as the screen slot — bezels are editor preview only.
 */
export type DeviceProfile = {
  id: string;
  name: string;
  platform: DevicePlatform;
  formFactor: FormFactor;
  viewportPx: PxSize;
  exportPx: PxSize;
  /** Optional explicit landscape store size; else swap exportPx */
  exportPxLandscape?: PxSize;
  shellPx: PxSize;
  /** Landscape shell coordinate space (matches landscape SVG viewBox) */
  shellPxLandscape?: PxSize;
  screenInset: ScreenInset;
  /** Landscape screen rect inside shellPxLandscape */
  screenInsetLandscape?: ScreenInset;
  safeArea?: SafeArea;
  hardware?: HardwareHotspots;
  status: DeviceStatus;
  releasedAt: string;
  shellKind: ShellKind;
  /** @deprecated prefer shellAssetFront */
  shellAsset?: string;
  shellFamily?: string;
  shellAssetFront?: string;
  shellAssetBack?: string;
  shellAssetFrontLandscape?: string;
  shellAssetBackLandscape?: string;
  storeSizeClass?: string;
  /** Short note: which ASC / Play slot this exportPx feeds */
  storeSizeNote?: string;
  storeTargets: string[];
  source: string;
  updatedAt: string;
  version: string;
};

export type ListDevicesOpts = {
  platform?: string;
  status?: DeviceStatus | DeviceStatus[];
  includeDeprecated?: boolean;
  asOf?: Date | string;
  /** When false, hide foldable stubs from default picker (default true for enrich) */
  includeFoldable?: boolean;
};
