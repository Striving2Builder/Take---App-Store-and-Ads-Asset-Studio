/** OWNER: services/device-sync — evidence URLs required (scrapers lie) */
import type { DeviceProposal } from "./types";

/** Citations must be https — fetch path is https-only; http is not evidence. */
export function hasEvidence(p: Pick<DeviceProposal, "evidence">): boolean {
  return (p.evidence || []).some((e) => typeof e.url === "string" && /^https:\/\//i.test(e.url.trim()));
}

export function evidenceError(p: Pick<DeviceProposal, "id" | "evidence">): string | null {
  if (hasEvidence(p)) return null;
  return `${p.id}: https:// evidence URL required`;
}
