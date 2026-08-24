/** OWNER: packages/ad-unit-catalog — catalog integrity guard */
import type { AdUnit } from "./ad-unit.types";

export function assertValidAdUnit(u: AdUnit): void {
  if (!u.id) throw new Error("AdUnit missing id");
  if (!u.platform) throw new Error(`AdUnit ${u.id} missing platform`);
  if (!u.exportPx?.w || !u.exportPx?.h) {
    throw new Error(`AdUnit ${u.id} missing exportPx`);
  }
  if (u.kind === "video" && !u.maxDurationMs && !u.recommendedDurationMs) {
    // Some platforms (YouTube skippable in-stream) genuinely have no hard cap — but every
    // video unit needs at least one duration signal so compliance checks have something to say.
    throw new Error(`AdUnit ${u.id} is kind video but has no maxDurationMs or recommendedDurationMs`);
  }
  if (
    u.recommendedDurationMs &&
    u.maxDurationMs &&
    u.recommendedDurationMs.max > u.maxDurationMs
  ) {
    throw new Error(`AdUnit ${u.id} recommendedDurationMs.max exceeds maxDurationMs`);
  }
}
