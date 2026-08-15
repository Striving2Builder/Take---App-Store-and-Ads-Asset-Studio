/** OWNER: packages/device-catalog — seed devices (data will move to catalogs/) */
import type { DeviceProfile } from "./device.types";

const seed: DeviceProfile[] = [
  {
    id: "apple.iphone-16-pro",
    name: "iPhone 16 Pro",
    platform: "ios",
    formFactor: "phone",
    viewportPx: { w: 402, h: 874 },
    exportPx: { w: 1290, h: 2796 },
    safeArea: { top: 59, bottom: 34, left: 0, right: 0 },
    shellAsset: "shells/iphone-16-pro.svg",
    storeTargets: ["ios-screens"],
    source: "seed",
    updatedAt: "2026-08-10",
    version: "2026.08",
  },
  {
    id: "apple.ipad-pro-13",
    name: "iPad Pro 13",
    platform: "ios",
    formFactor: "tablet",
    viewportPx: { w: 1032, h: 1376 },
    exportPx: { w: 2064, h: 2752 },
    shellAsset: "shells/ipad-pro-13.svg",
    storeTargets: ["ios-screens"],
    source: "seed",
    updatedAt: "2026-08-10",
    version: "2026.08",
  },
  {
    id: "google.pixel-9",
    name: "Pixel 9",
    platform: "android",
    formFactor: "phone",
    viewportPx: { w: 412, h: 915 },
    exportPx: { w: 1080, h: 2424 },
    shellAsset: "shells/pixel-9.svg",
    storeTargets: ["play-screens"],
    source: "seed",
    updatedAt: "2026-08-10",
    version: "2026.08",
  },
];

export default seed;
