/** OWNER: services/device-sync/node — allowlisted https JSON fetch (no HTML scrape) */
import { assertAllowedSyncUrlResolved } from "./resolve-host";

export async function fetchAllowlistedJson(url: string): Promise<unknown> {
  if (process.env.DEVICE_SYNC_FETCH !== "1") {
    throw new Error("DEVICE_SYNC_FETCH is not 1 — default path is offline");
  }
  const u = await assertAllowedSyncUrlResolved(url);
  const res = await fetch(u.toString(), {
    redirect: "error",
    headers: {
      Accept: "application/json, application/sparql-results+json, text/plain",
      "User-Agent": "TAKE-device-sync/0.1 (local maintainer; not a crawler)",
    },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("json") && !ct.includes("text/plain")) {
    throw new Error(`Refused non-JSON Device Sync fetch (${ct || "unknown type"})`);
  }
  return res.json();
}

export function fetchSourceUrls(): string[] {
  return (process.env.DEVICE_SYNC_SOURCES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
