/** OWNER: packages/ad-unit-catalog — query API */
import type { AdUnit, AdUnitFamily, ListAdUnitsOpts } from "./ad-unit.types";
import { loadCatalogAdUnits } from "./load-catalog";

let cache: AdUnit[] = loadCatalogAdUnits();

export function listAdUnits(opts?: ListAdUnitsOpts): AdUnit[] {
  let list = [...cache];
  if (opts?.family) list = list.filter((u) => u.family === opts.family);
  if (opts?.kind) list = list.filter((u) => u.kind === opts.kind);
  if (!opts?.includeLegacy) list = list.filter((u) => u.status !== "legacy");
  return list;
}

export function getAdUnit(id: string): AdUnit | undefined {
  return cache.find((u) => u.id === id);
}

export function listAdUnitFamilies(): AdUnitFamily[] {
  const seen = new Set<AdUnitFamily>();
  for (const u of cache) seen.add(u.family);
  return [...seen];
}

/** Test / boot helper */
export function resetAdUnitCatalogFromDisk(): void {
  cache = loadCatalogAdUnits();
}
