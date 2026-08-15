/** OWNER: services/device-sync — generate load-catalog.ts source (Vite explicit imports) */
export function identFromRel(rel: string): string {
  const base = rel.replace(/\\/g, "/").split("/").pop() || rel;
  const id = base.replace(/\.json$/i, "");
  const ident = id.replace(/[^a-zA-Z0-9]/g, "_");
  return /^[A-Za-z]/.test(ident) ? ident : `d_${ident}`;
}

/** `rel` is path under catalogs/devices, e.g. 2024/ios/apple.iphone-16-pro-max.json */
export function generateBarrelSource(rels: string[]): string {
  const files = [...new Set(rels.map((r) => r.replace(/\\/g, "/")))]
    .filter((r) => r.endsWith(".json") && !r.endsWith("manifest.json"))
    .sort((a, b) => a.localeCompare(b));
  const imports = files
    .map((rel) => `import ${identFromRel(rel)} from "../../../catalogs/devices/${rel}";`)
    .join("\n");
  const names = files.map((rel) => identFromRel(rel)).join(",\n  ");
  return `/** OWNER: packages/device-catalog — load JSON SSOT from catalogs/devices */
import type { DeviceProfile } from "./device.types";
import { assertValidDevice } from "./validate-device";

${imports}

const RAW: DeviceProfile[] = [
  ${names}
] as DeviceProfile[];

/** Validated catalog pack (bundled via explicit imports for Vite). */
export function loadCatalogDevices(): DeviceProfile[] {
  for (const d of RAW) assertValidDevice(d);
  return RAW.map((d) => ({ ...d }));
}
`;
}
