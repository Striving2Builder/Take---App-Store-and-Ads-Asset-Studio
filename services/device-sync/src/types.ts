/** OWNER: services/device-sync — proposal / review types */
import type { DeviceProfile } from "@take/device-catalog";

export type ProposalConfidence = "high" | "medium" | "low";
export type ReviewStatus = "pending" | "approved" | "rejected";

export type DeviceEvidence = {
  url: string;
  note?: string;
  fetchedAt?: string;
};

/** Partial profile from research — must materialize + validate before apply/publish. */
export type ProposedDevice = Partial<DeviceProfile> & { id: string; name: string };

/**
 * Researched proposal — never auto-published without human gate.
 * App Scan URLs do not belong here.
 */
export type DeviceProposal = {
  id: string;
  proposed: ProposedDevice;
  evidence: DeviceEvidence[];
  confidence: ProposalConfidence;
  reviewStatus: ReviewStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewerNote?: string;
};

export type CatalogPack = {
  version: string;
  updatedAt: string;
  devices: DeviceProfile[];
  proposals?: DeviceProposal[];
};
