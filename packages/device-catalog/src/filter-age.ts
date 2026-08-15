/** OWNER: packages/device-catalog — 3y / 5y age helpers (NOT Style) */
import type { DeviceProfile, DeviceStatus } from "./device.types";

/** Catalog retention window (years) */
export const CATALOG_CUTOFF_YEARS = 5;
/** Picker "Current" group window (years) */
export const PICKER_CURRENT_YEARS = 3;

export function yearsAgo(years: number, asOf: Date = new Date()): Date {
  const d = new Date(asOf);
  d.setFullYear(d.getFullYear() - years);
  return d;
}

export function isWithinYears(
  releasedAt: string,
  years: number,
  asOf: Date | string = new Date()
): boolean {
  const asOfDate = typeof asOf === "string" ? new Date(asOf) : asOf;
  const released = new Date(releasedAt);
  if (Number.isNaN(released.getTime()) || Number.isNaN(asOfDate.getTime())) return false;
  return released >= yearsAgo(years, asOfDate);
}

/** Derive display status from releasedAt + catalog status (deprecated wins). */
export function resolvePickerGroup(
  device: DeviceProfile,
  asOf: Date | string = new Date()
): "current" | "older" | "deprecated" {
  if (device.status === "deprecated") return "deprecated";
  if (isWithinYears(device.releasedAt, PICKER_CURRENT_YEARS, asOf)) return "current";
  if (isWithinYears(device.releasedAt, CATALOG_CUTOFF_YEARS, asOf)) return "older";
  return "deprecated";
}

export function filterByCatalogWindow(
  devices: DeviceProfile[],
  asOf: Date | string = new Date(),
  opts?: { includeOutOfWindow?: boolean }
): DeviceProfile[] {
  if (opts?.includeOutOfWindow) return [...devices];
  return devices.filter(
    (d) =>
      d.status === "deprecated" ||
      isWithinYears(d.releasedAt, CATALOG_CUTOFF_YEARS, asOf)
  );
}

export function statusMatches(
  device: DeviceProfile,
  status?: DeviceStatus | DeviceStatus[]
): boolean {
  if (!status) return true;
  const list = Array.isArray(status) ? status : [status];
  return list.includes(device.status);
}
