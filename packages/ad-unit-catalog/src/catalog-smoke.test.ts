/** OWNER: packages/ad-unit-catalog — smoke test (tsx runnable) */
import { listAdUnits, getAdUnit, listAdUnitFamilies } from "./catalog";
import { resolveAdExportSize } from "./resolve-export-size";
import { checkVideoCompliance, fmtBytes } from "./check-compliance";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const all = listAdUnits();
assert(all.length === 24, `expected 24 ad units, got ${all.length}`);

const families = listAdUnitFamilies();
assert(families.length === 10, `expected 10 families, got ${families.length}`);
assert(families.includes("pinterest"), "pinterest family missing");

for (const u of all) {
  assert(u.exportPx.w > 0 && u.exportPx.h > 0, `${u.id} has non-positive exportPx`);
  assert(!!u.platform, `${u.id} missing platform`);
  if (u.kind === "video") {
    assert(u.maxDurationMs != null || u.recommendedDurationMs != null, `${u.id} is video with no duration signal`);
  }
}

const mpu = getAdUnit("iab.mpu-300x250");
assert(mpu?.exportPx.w === 300 && mpu.exportPx.h === 250, "MPU size mismatch");
assert(mpu?.platform === "Generic / IAB", "MPU platform mismatch");

const known = resolveAdExportSize("iab.leaderboard-728x90");
assert(!known.fellBack, "known id should not fall back");
assert(known.size.w === 728 && known.size.h === 90, "leaderboard size mismatch");

const unknown = resolveAdExportSize("nonexistent");
assert(unknown.fellBack, "unknown id should fall back");
assert(!!unknown.warning, "fallback should carry a warning");

const displayOnly = listAdUnits({ kind: "display" });
assert(displayOnly.length === 12, `expected 12 display units, got ${displayOnly.length}`);
const videoOnly = listAdUnits({ kind: "video" });
assert(videoOnly.length === 9, `expected 9 video units, got ${videoOnly.length}`);
const socialOnly = listAdUnits({ kind: "social" });
assert(socialOnly.length === 3, `expected 3 social units, got ${socialOnly.length}`);

// Named platform units are real and distinct from the generic IAB fallback
const tiktokInfeed = getAdUnit("tiktok.infeed-9x16");
assert(tiktokInfeed?.platform === "TikTok", "TikTok In-Feed platform mismatch");
assert(tiktokInfeed?.recommendedDurationMs?.min === 9000 && tiktokInfeed?.recommendedDurationMs?.max === 15000, "TikTok In-Feed sweet spot mismatch");
assert(tiktokInfeed?.maxFileSizeBytes === 500_000_000, "TikTok In-Feed file cap mismatch");

const ytInstream = getAdUnit("youtube.instream-16x9");
assert(ytInstream?.maxDurationMs == null, "YouTube skippable in-stream should have no hard max");
assert(!!ytInstream?.recommendedDurationMs, "YouTube skippable in-stream should still carry a sweet spot");

const pinterest = getAdUnit("pinterest.standard-2x3");
assert(pinterest?.exportPx.w === 1080 && pinterest?.exportPx.h === 1620, "Pinterest 2:3 size mismatch");

// Compliance checker — real duration/file-size math, not decorative
const okClip = checkVideoCompliance(tiktokInfeed!, { durationMs: 12000, bytes: 40_000_000 });
assert(okClip.ok && okClip.warnings.length === 0, "12s TikTok clip should be fully compliant");

const longClip = checkVideoCompliance(tiktokInfeed!, { durationMs: 45000, bytes: 40_000_000 });
assert(longClip.ok && longClip.warnings.length === 1, "45s TikTok clip should warn (outside sweet spot) but not error (under 10min cap)");

const oversizeClip = checkVideoCompliance(tiktokInfeed!, { durationMs: 12000, bytes: 600_000_000 });
assert(!oversizeClip.ok && oversizeClip.errors.length === 1, "600MB clip should error against TikTok's 500MB cap");

assert(fmtBytes(500_000_000) === "500MB", `fmtBytes 500MB got ${fmtBytes(500_000_000)}`);
assert(fmtBytes(4_000_000_000) === "4GB", `fmtBytes 4GB got ${fmtBytes(4_000_000_000)}`);

console.log("ad-unit-catalog: catalog-smoke PASS");
