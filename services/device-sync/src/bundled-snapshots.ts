/** OWNER: services/device-sync — browser-safe cited snapshot pack (not a live crawl) */
import raw from "./sources/snapshots/2025-flagships.json";
import type { DeviceProfile } from "@take/device-catalog";
import { parseSnapshotFile } from "./adapters/snapshots";
import { runDeviceSync, type RunDeviceSyncResult } from "./job";
import { normalizeDiscoveries } from "./run-discover";

export function bundledSnapshotRows() {
  return parseSnapshotFile(raw);
}

export type BundledSnapshotResult = RunDeviceSyncResult & { warnings: string[] };

/** Same job as `npm run sync:devices` default — local fixture, no fetch. */
export function proposeBundledSnapshots(current: DeviceProfile[]): BundledSnapshotResult {
  const run = normalizeDiscoveries(bundledSnapshotRows(), current);
  const job = runDeviceSync({ current, normalized: run.candidates });
  return { ...job, warnings: run.warnings };
}