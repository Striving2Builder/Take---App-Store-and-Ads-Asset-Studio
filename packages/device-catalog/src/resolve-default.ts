/** OWNER: packages/device-catalog — platform → default device */
import { listDevicesByPlatform } from "./catalog";
import type { DeviceProfile } from "./device.types";

export function resolveDefaultDevice(platform: string): DeviceProfile | undefined {
  const list = listDevicesByPlatform(platform === "android" ? "android" : "ios");
  return list.find((d) => d.formFactor === "phone") ?? list[0];
}
