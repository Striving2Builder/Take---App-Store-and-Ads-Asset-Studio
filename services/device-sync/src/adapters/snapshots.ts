/** OWNER: services/device-sync — cited snapshot adapter (offline; not a live crawl) */
import type { FormFactor } from "@take/device-catalog";
import type { DiscoverPlatform, RawDiscovery } from "../discover.types";

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function asFormFactor(v: unknown): FormFactor | null {
  return v === "phone" || v === "tablet" || v === "foldable" ? v : null;
}

function asPlatform(v: unknown): DiscoverPlatform | null {
  return v === "ios" || v === "android" ? v : null;
}

/** Parse a snapshot JSON object `{ devices: [...] }` or a raw array. */
export function parseSnapshotFile(raw: unknown): RawDiscovery[] {
  const list = Array.isArray(raw) ? raw : isObj(raw) && Array.isArray(raw.devices) ? raw.devices : null;
  if (!list) return [];
  const out: RawDiscovery[] = [];
  for (const row of list) {
    if (!isObj(row)) continue;
    const platform = asPlatform(row.platform);
    const formFactor = asFormFactor(row.formFactor);
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const releasedAt = typeof row.releasedAt === "string" ? row.releasedAt : "";
    const evidenceUrl = typeof row.evidenceUrl === "string" ? row.evidenceUrl : "";
    if (!id || !name || !platform || !formFactor || !releasedAt || !evidenceUrl) continue;
    out.push({
      id,
      name,
      platform,
      formFactor,
      releasedAt,
      storeSizeClass: typeof row.storeSizeClass === "string" ? row.storeSizeClass : undefined,
      inheritFrom: typeof row.inheritFrom === "string" ? row.inheritFrom : undefined,
      evidenceUrl,
      evidenceNote: typeof row.evidenceNote === "string" ? row.evidenceNote : undefined,
      adapter: "snapshots",
    });
  }
  return out;
}
