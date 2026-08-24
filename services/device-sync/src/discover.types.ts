/** OWNER: services/device-sync — discovery records (not App Scan; not HTML) */
import type { DeviceEvidence, ProposalConfidence, ProposedDevice } from "./types";
import type { FormFactor } from "@take/device-catalog";

export type DiscoverPlatform = "ios" | "android";

/**
 * Adapter output — identity + citations. Store class and inheritFrom are optional.
 * Incomplete rows stay partial; ReviewGate cannot approve until materialize passes.
 */
export type RawDiscovery = {
  id: string;
  name: string;
  platform: DiscoverPlatform;
  formFactor: FormFactor;
  releasedAt: string;
  /** Cited ASC / Play class — exportPx comes from the TAKE table, not a guessed panel. */
  storeSizeClass?: string;
  /** Catalog id to clone shell/hardware from. Required to copy chrome; never invent SKU diffs. */
  inheritFrom?: string;
  evidenceUrl: string;
  evidenceNote?: string;
  adapter: string;
};

export type NormalizedCandidate = {
  proposed: ProposedDevice;
  confidence: ProposalConfidence;
  evidence: DeviceEvidence[];
  inferredFrom?: string;
};

export type NormalizeResult =
  | { ok: true; candidate: NormalizedCandidate }
  | { ok: false; error: string };
