/** OWNER: packages/ad-unit-catalog — single place for ad-unit export WxH */
import { getAdUnit } from "./catalog";
import type { PxSize } from "./ad-unit.types";

export type ResolveAdExportSizeResult = {
  size: PxSize;
  adUnitId: string;
  fellBack: boolean;
  warning?: string;
};

const EMERGENCY_FALLBACK_ID = "iab.mpu-300x250";

/** Resolve ad export size from catalog. Never invents pixels — falls back to MPU if unknown. */
export function resolveAdExportSize(adUnitId: string | undefined | null): ResolveAdExportSizeResult {
  const found = adUnitId ? getAdUnit(adUnitId) : undefined;
  if (found) {
    return { size: { ...found.exportPx }, adUnitId: found.id, fellBack: false };
  }
  const fallback = getAdUnit(EMERGENCY_FALLBACK_ID);
  if (fallback) {
    return {
      size: { ...fallback.exportPx },
      adUnitId: fallback.id,
      fellBack: true,
      warning: adUnitId
        ? `Unknown adUnitId "${adUnitId}" — using ${fallback.label}`
        : `No adUnitId — using ${fallback.label}`,
    };
  }
  return {
    size: { w: 300, h: 250 },
    adUnitId: EMERGENCY_FALLBACK_ID,
    fellBack: true,
    warning: "Ad unit catalog empty — using 300×250 emergency fallback",
  };
}
