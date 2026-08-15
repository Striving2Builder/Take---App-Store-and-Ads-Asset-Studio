/** OWNER: packages/core — story sequence roles */
export const FRAME_ROLES = [
  "HOOK",
  "PROBLEM",
  "SHIFT",
  "PROOF",
  "FEATURE",
  "RITUAL",
  "SOCIAL",
  "DETAIL",
  "OUTCOME",
  "TRUST",
  "CTA",
  "CLOSE",
] as const;

export type FrameRole = (typeof FRAME_ROLES)[number];
