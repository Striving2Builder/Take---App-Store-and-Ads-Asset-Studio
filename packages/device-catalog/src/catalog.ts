/** OWNER: packages/device-catalog — query API */
import type { DeviceProfile, ListDevicesOpts } from "./device.types";
import { filterByCatalogWindow, statusMatches } from "./filter-age";
import { loadCatalogDevices } from "./load-catalog";

let cache: DeviceProfile[] = loadCatalogDevices();

export function listDevices(opts?: ListDevicesOpts): DeviceProfile[] {
  const asOf = opts?.asOf ?? new Date();
  let list = filterByCatalogWindow(cache, asOf, {
    includeOutOfWindow: opts?.includeDeprecated,
  });
  if (opts?.platform && opts.platform !== "both") {
    list = list.filter((d) => d.platform === opts.platform);
  }
  if (opts?.status) {
    list = list.filter((d) => statusMatches(d, opts.status));
  }
  if (!opts?.includeDeprecated) {
    list = list.filter((d) => d.status !== "deprecated");
  }
  if (opts?.includeFoldable === false) {
    list = list.filter((d) => d.formFactor !== "foldable");
  }
  return [...list];
}

/** Always resolves known IDs — even deprecated / out of window (projects may reference them). */
export function getDevice(id: string): DeviceProfile | undefined {
  return cache.find((d) => d.id === id);
}

export function listDevicesByPlatform(platform: string): DeviceProfile[] {
  return listDevices({ platform });
}

/** Replace catalog after Device Sync pull (Phase 5). */
export function replaceCatalog(devices: DeviceProfile[]): void {
  cache = [...devices];
}

/** Test / boot helper */
export function resetCatalogFromDisk(): void {
  cache = loadCatalogDevices();
}
