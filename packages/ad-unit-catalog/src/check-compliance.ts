/** OWNER: packages/ad-unit-catalog — does an uploaded clip fit this unit's real platform limits */
import type { AdUnit } from "./ad-unit.types";

export type ComplianceCheck = {
  ok: boolean;
  /** Hard failures — the platform will likely reject the file. */
  errors: string[];
  /** Under the cap, but outside the engagement sweet spot. */
  warnings: string[];
};

export function fmtSeconds(ms: number): string {
  if (ms >= 60_000) {
    const m = ms / 60_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}min`;
  }
  const s = ms / 1000;
  return Number.isInteger(s) ? `${s}s` : `${s.toFixed(1)}s`;
}

/** Compact spec line for UI captions — "TikTok · 9–15s rec (max 10min) · ≤500MB". */
export function fmtUnitSpec(unit: {
  platform: string;
  minDurationMs?: number;
  maxDurationMs?: number;
  recommendedDurationMs?: { min: number; max: number };
  maxFileSizeBytes?: number;
}): string {
  const parts = [unit.platform];
  if (unit.recommendedDurationMs) {
    parts.push(`${fmtSeconds(unit.recommendedDurationMs.min)}–${fmtSeconds(unit.recommendedDurationMs.max)} rec`);
  }
  if (unit.maxDurationMs) {
    parts.push(`max ${fmtSeconds(unit.maxDurationMs)}`);
  } else if (unit.recommendedDurationMs) {
    parts.push("no hard cap");
  }
  if (unit.maxFileSizeBytes) {
    parts.push(`≤${fmtBytes(unit.maxFileSizeBytes)}`);
  }
  return parts.join(" · ");
}

export function fmtBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(bytes % 1_000_000_000 === 0 ? 0 : 1)}GB`;
  return `${Math.round(bytes / 1_000_000)}MB`;
}

/** Real duration/file-size check against this unit's platform limits — not a generic guess. */
export function checkVideoCompliance(
  unit: AdUnit,
  clip: { durationMs?: number; bytes?: number }
): ComplianceCheck {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (clip.durationMs != null) {
    if (unit.minDurationMs != null && clip.durationMs < unit.minDurationMs) {
      errors.push(`Clip is ${fmtSeconds(clip.durationMs)} — ${unit.platform} requires at least ${fmtSeconds(unit.minDurationMs)}`);
    }
    if (unit.maxDurationMs != null && clip.durationMs > unit.maxDurationMs) {
      errors.push(`Clip is ${fmtSeconds(clip.durationMs)} — over ${unit.platform}'s ${fmtSeconds(unit.maxDurationMs)} cap, will be trimmed`);
    }
    if (
      unit.recommendedDurationMs &&
      !errors.length &&
      (clip.durationMs < unit.recommendedDurationMs.min || clip.durationMs > unit.recommendedDurationMs.max)
    ) {
      warnings.push(
        `Clip is ${fmtSeconds(clip.durationMs)} — outside ${unit.platform}'s ${fmtSeconds(unit.recommendedDurationMs.min)}–${fmtSeconds(unit.recommendedDurationMs.max)} sweet spot`
      );
    }
  }

  if (clip.bytes != null && unit.maxFileSizeBytes != null && clip.bytes > unit.maxFileSizeBytes) {
    errors.push(`File is ${fmtBytes(clip.bytes)} — over ${unit.platform}'s ${fmtBytes(unit.maxFileSizeBytes)} cap`);
  }

  return { ok: errors.length === 0, errors, warnings };
}
