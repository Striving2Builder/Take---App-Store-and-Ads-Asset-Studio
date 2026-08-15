/** OWNER: packages/device-catalog — device profile types (NOT style/palette) */
export type DevicePlatform = "ios" | "android" | "other";
export type FormFactor = "phone" | "tablet";

export type DeviceProfile = {
  id: string;
  name: string;
  platform: DevicePlatform;
  formFactor: FormFactor;
  viewportPx: { w: number; h: number };
  exportPx: { w: number; h: number };
  safeArea?: { top: number; bottom: number; left: number; right: number };
  shellAsset?: string;
  storeTargets: string[];
  source: string;
  updatedAt: string;
  version: string;
};
