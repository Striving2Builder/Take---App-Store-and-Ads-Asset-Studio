/** OWNER: services/device-sync/node — write DeviceProfile JSON + regen load-catalog.ts */
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import type { DeviceProfile } from "@take/device-catalog";
import { generateBarrelSource } from "../write-barrel";

function repoRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "../../../../");
}

export function catalogDevicesRoot(root = repoRoot()): string {
  return join(root, "catalogs", "devices");
}

export function yearFolder(releasedAt: string): string {
  const y = new Date(releasedAt).getUTCFullYear();
  return String(Number.isFinite(y) ? y : new Date().getUTCFullYear());
}

export function deviceRelPath(d: DeviceProfile): string {
  return `${yearFolder(d.releasedAt)}/${d.platform}/${d.id}.json`;
}

export function listCatalogRels(devicesRoot: string): string[] {
  const out: string[] = [];
  function walk(dir: string) {
    let entries: ReturnType<typeof readdirSync>;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".json") && e.name !== "manifest.json") {
        out.push(relative(devicesRoot, p).replace(/\\/g, "/"));
      }
    }
  }
  walk(devicesRoot);
  return out.sort((a, b) => a.localeCompare(b));
}

export function writeDeviceJson(devicesRoot: string, device: DeviceProfile): string {
  const rel = deviceRelPath(device);
  const full = join(devicesRoot, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, `${JSON.stringify(device, null, 2)}\n`, "utf8");
  return rel;
}

export function writeLoadCatalogBarrel(repo = repoRoot()): string {
  const rels = listCatalogRels(catalogDevicesRoot(repo));
  const src = generateBarrelSource(rels);
  const dest = join(repo, "packages", "device-catalog", "src", "load-catalog.ts");
  writeFileSync(dest, src, "utf8");
  return dest;
}
