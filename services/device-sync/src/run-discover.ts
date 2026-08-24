/** OWNER: services/device-sync — normalize adapter rows vs catalog (no network) */
import type { DeviceProfile } from "@take/device-catalog";
import type { NormalizedCandidate, RawDiscovery } from "./discover.types";
import { normalizeDiscovery } from "./normalize-discovery";

export type DiscoverRunResult = {
  candidates: NormalizedCandidate[];
  warnings: string[];
};

export function normalizeDiscoveries(
  rows: RawDiscovery[],
  current: DeviceProfile[]
): DiscoverRunResult {
  const candidates: NormalizedCandidate[] = [];
  const warnings: string[] = [];
  const extras: DeviceProfile[] = [];
  for (const row of rows) {
    const result = normalizeDiscovery(row, current, extras);
    if (!result.ok) {
      warnings.push(result.error);
      continue;
    }
    candidates.push(result.candidate);
    const p = result.candidate.proposed;
    if (p.shellPx && p.exportPx) extras.push(p as DeviceProfile);
  }
  return { candidates, warnings };
}
