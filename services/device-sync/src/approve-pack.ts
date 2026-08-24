/** OWNER: services/device-sync — mark evidenced, valid pending rows approved (no disk write) */
import { hasEvidence } from "./evidence";
import { materializeDevice } from "./materialize";
import type { CatalogPack, DeviceProposal } from "./types";

export type ApprovePackResult = {
  pack: CatalogPack;
  approved: number;
  skipped: number;
};

/**
 * Human review helper for CLI / tests. Does not publish.
 * Skips rejected, unevidenced, and rows that fail materialize.
 */
export function approveEvidencedPack(pack: CatalogPack, note?: string): ApprovePackResult {
  const now = new Date().toISOString();
  let approved = 0;
  let skipped = 0;
  const byId = new Map((pack.devices || []).map((d) => [d.id, d]));
  const proposals: DeviceProposal[] = (pack.proposals || []).map((p) => {
    if (p.reviewStatus === "approved") return p;
    if (p.reviewStatus === "rejected" || !hasEvidence(p)) {
      skipped += 1;
      return p;
    }
    const mat = materializeDevice(p.proposed, byId.get(p.proposed.id));
    if (!mat.ok) {
      skipped += 1;
      return p;
    }
    approved += 1;
    return {
      ...p,
      reviewStatus: "approved",
      reviewedAt: now,
      reviewerNote: note || p.reviewerNote,
    };
  });
  return {
    pack: { ...pack, proposals, updatedAt: now },
    approved,
    skipped,
  };
}
