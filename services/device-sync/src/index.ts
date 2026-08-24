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
export { approveEvidencedPack } from "./approve-pack";
export type { ApprovePackResult } from "./approve-pack";
export {
  diffCatalog,
  deprecateCandidates,
  classifyChange,
  proposalsFromNormalized,
  type ProposalKind,
} from "./diff-catalog";
export { normalizeDiscovery } from "./normalize-discovery";
export { normalizeDiscoveries } from "./run-discover";
export { parseSnapshotFile } from "./adapters/snapshots";
export { bundledSnapshotRows, proposeBundledSnapshots } from "./bundled-snapshots";
export type { BundledSnapshotResult } from "./bundled-snapshots";
export { parseWikidataBindings, slugModelName, wikidataSparqlUrl } from "./adapters/wikidata-parse";
export { lookupStoreSizeClass } from "./store-size-classes";
export type { RawDiscovery, NormalizedCandidate, NormalizeResult, DiscoverPlatform } from "./discover.types";
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
