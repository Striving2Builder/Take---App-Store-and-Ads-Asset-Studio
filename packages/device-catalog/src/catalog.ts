/** OWNER: packages/device-catalog — query API */
import type { DeviceProfile } from "./device.types";
import seed from "./seed-devices";

let cache: DeviceProfile[] = [...seed];

export function listDevices(): DeviceProfile[] {
  return [...cache];
}

export function getDevice(id: string): DeviceProfile | undefined {
  return cache.find((d) => d.id === id);
}

export function listDevicesByPlatform(platform: string): DeviceProfile[] {
  if (platform === "both") return listDevices();
  return cache.filter((d) => d.platform === platform);
}

/** Replace catalog after Device Sync pull */
export function replaceCatalog(devices: DeviceProfile[]): void {
  cache = [...devices];
}
