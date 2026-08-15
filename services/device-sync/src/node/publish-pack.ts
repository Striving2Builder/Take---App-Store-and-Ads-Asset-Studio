/** OWNER: services/device-sync/node — CLI disk publisher (approved pack only) */
import { readFileSync } from "node:fs";
import { devicesForApprovedPack } from "../publish-check";
import type { CatalogPack } from "../types";
import { catalogDevicesRoot, writeDeviceJson, writeLoadCatalogBarrel } from "./disk-write";

export async function publishPackToDisk(
  pack: CatalogPack,
  opts?: { repoRoot?: string }
): Promise<{ ok: boolean; message: string; wrote: string[] }> {
  const check = devicesForApprovedPack(pack);
  if (!check.ok) return { ok: false, message: check.message, wrote: [] };
  const devicesRoot = catalogDevicesRoot(opts?.repoRoot);
  const wrote: string[] = [];
  for (const d of check.devices) {
    wrote.push(writeDeviceJson(devicesRoot, d));
  }
  writeLoadCatalogBarrel(opts?.repoRoot);
  return {
    ok: true,
    message: `Wrote ${wrote.length} device JSON file(s) and regenerated load-catalog.ts`,
    wrote,
  };
}

export function readPackFile(path: string): CatalogPack {
  return JSON.parse(readFileSync(path, "utf8")) as CatalogPack;
}
