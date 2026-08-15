/** OWNER: services/device-sync — public API (browser-safe; no fs) */
export type {
  CatalogPack,
  DeviceEvidence,
  DeviceProposal,
  ProposalConfidence,
  ProposedDevice,
  ReviewStatus,
} from "./types";
export { hasEvidence, evidenceError } from "./evidence";
export { parseProposalInput } from "./parse-pack";
export type { ParsePackResult } from "./parse-pack";
export { createMemoryReviewGate, createStubReviewGate, type ReviewGate } from "./review-gate";
export { materializeDevice } from "./materialize";
export { diffCatalog, deprecateCandidates, classifyChange, type ProposalKind } from "./diff-catalog";
export {
  assertAllowedSyncUrl,
  assertNoPrivateRecords,
  isAllowedSyncHost,
  isPrivateHostname,
  isPrivateIp,
} from "./allowlist";
export { devicesForApprovedPack, approvedProposals } from "./publish-check";
export { runDeviceSync } from "./job";
export type { FetchedSyncSource, RunDeviceSyncInput, RunDeviceSyncResult } from "./job";
export { generateBarrelSource, identFromRel } from "./write-barrel";
export { createNoopCatalogPublisher, type CatalogPublisher } from "./publishers/catalog-publisher";
