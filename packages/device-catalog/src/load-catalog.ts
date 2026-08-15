/** OWNER: packages/device-catalog — load JSON SSOT from catalogs/devices */
import type { DeviceProfile } from "./device.types";
import { assertValidDevice } from "./validate-device";

import google_pixel_7 from "../../../catalogs/devices/2022/android/google.pixel-7.json";
import apple_iphone_14_pro from "../../../catalogs/devices/2022/ios/apple.iphone-14-pro.json";
import samsung_galaxy_s23 from "../../../catalogs/devices/2023/android/samsung.galaxy-s23.json";
import apple_iphone_15_plus from "../../../catalogs/devices/2023/ios/apple.iphone-15-plus.json";
import apple_iphone_15_pro from "../../../catalogs/devices/2023/ios/apple.iphone-15-pro.json";
import google_pixel_9 from "../../../catalogs/devices/2024/android/google.pixel-9.json";
import samsung_galaxy_s24 from "../../../catalogs/devices/2024/android/samsung.galaxy-s24.json";
import samsung_galaxy_z_flip6 from "../../../catalogs/devices/2024/android/samsung.galaxy-z-flip6.json";
import samsung_galaxy_z_fold6 from "../../../catalogs/devices/2024/android/samsung.galaxy-z-fold6.json";
import apple_ipad_pro_13 from "../../../catalogs/devices/2024/ios/apple.ipad-pro-13.json";
import apple_iphone_16_pro_max from "../../../catalogs/devices/2024/ios/apple.iphone-16-pro-max.json";
import apple_iphone_16_pro from "../../../catalogs/devices/2024/ios/apple.iphone-16-pro.json";

const RAW: DeviceProfile[] = [
  google_pixel_7,
  apple_iphone_14_pro,
  samsung_galaxy_s23,
  apple_iphone_15_plus,
  apple_iphone_15_pro,
  google_pixel_9,
  samsung_galaxy_s24,
  samsung_galaxy_z_flip6,
  samsung_galaxy_z_fold6,
  apple_ipad_pro_13,
  apple_iphone_16_pro_max,
  apple_iphone_16_pro
] as DeviceProfile[];

/** Validated catalog pack (bundled via explicit imports for Vite). */
export function loadCatalogDevices(): DeviceProfile[] {
  for (const d of RAW) assertValidDevice(d);
  return RAW.map((d) => ({ ...d }));
}
