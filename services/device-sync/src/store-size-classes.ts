/** OWNER: services/device-sync — cited ASC / Play store slots (not device-panel guesses) */
import type { DevicePlatform, PxSize } from "@take/device-catalog";

export type StoreSizeClass = {
  id: string;
  exportPx: PxSize;
  platform: DevicePlatform;
  storeTargets: string[];
  storeSizeNote: string;
  /** https citation for the table row */
  sourceUrl: string;
};

const ASC =
  "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/";
const PLAY = "https://developer.android.com/distribute/googleplay/guide";

/** Canonical TAKE exportPx per store class. Accepted alternates are not listed — use the catalog default. */
export const STORE_SIZE_CLASSES: Record<string, StoreSizeClass> = {
  "iphone-6.3": {
    id: "iphone-6.3",
    exportPx: { w: 1206, h: 2622 },
    platform: "ios",
    storeTargets: ["ios-screens"],
    storeSizeNote: "App Store Connect 6.3-inch class native 1206×2622",
    sourceUrl: ASC,
  },
  "iphone-6.7": {
    id: "iphone-6.7",
    exportPx: { w: 1290, h: 2796 },
    platform: "ios",
    storeTargets: ["ios-screens"],
    storeSizeNote: "App Store Connect 6.7-inch class 1290×2796",
    sourceUrl: ASC,
  },
  "iphone-6.9": {
    id: "iphone-6.9",
    exportPx: { w: 1320, h: 2868 },
    platform: "ios",
    storeTargets: ["ios-screens"],
    storeSizeNote: "App Store Connect 6.9-inch class native 1320×2868",
    sourceUrl: ASC,
  },
  "play-phone": {
    id: "play-phone",
    exportPx: { w: 1080, h: 2424 },
    platform: "android",
    storeTargets: ["play-screens"],
    storeSizeNote: "Google Play phone screenshots (1080×2424 native, catalog Pixel class)",
    sourceUrl: PLAY,
  },
  "play-phone-fhd": {
    id: "play-phone-fhd",
    exportPx: { w: 1080, h: 2340 },
    platform: "android",
    storeTargets: ["play-screens"],
    storeSizeNote: "Play phone FHD+ 1080×2340 (catalog Galaxy S24 class)",
    sourceUrl: PLAY,
  },
};

export function lookupStoreSizeClass(id: string): StoreSizeClass | undefined {
  return STORE_SIZE_CLASSES[id];
}

export function landscapeSwap(px: PxSize): PxSize {
  return { w: px.h, h: px.w };
}
