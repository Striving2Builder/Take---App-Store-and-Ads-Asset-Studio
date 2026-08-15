/** OWNER: packages/device-catalog — validate DeviceProfile records */
import type { DeviceProfile } from "./device.types";

export type ValidateDeviceResult = { ok: true } | { ok: false; errors: string[] };

export function validateDevice(d: DeviceProfile): ValidateDeviceResult {
  const errors: string[] = [];
  if (!d.id?.trim()) errors.push("id required");
  if (!d.name?.trim()) errors.push("name required");
  if (!["ios", "android", "other"].includes(d.platform)) errors.push("platform invalid");
  if (!["phone", "tablet", "foldable"].includes(d.formFactor)) errors.push("formFactor invalid");
  if (!["current", "supported", "deprecated"].includes(d.status)) errors.push("status invalid");
  if (!["frame", "asset"].includes(d.shellKind)) errors.push("shellKind invalid");
  if (!d.releasedAt || Number.isNaN(Date.parse(d.releasedAt))) errors.push("releasedAt invalid");
  if (!d.exportPx?.w || !d.exportPx?.h || d.exportPx.w <= 0 || d.exportPx.h <= 0) {
    errors.push("exportPx must be positive");
  }
  if (!d.shellPx?.w || !d.shellPx?.h || d.shellPx.w <= 0 || d.shellPx.h <= 0) {
    errors.push("shellPx must be positive");
  }
  if (!d.viewportPx?.w || !d.viewportPx?.h || d.viewportPx.w <= 0 || d.viewportPx.h <= 0) {
    errors.push("viewportPx must be positive");
  }
  const inset = d.screenInset;
  if (!inset) {
    errors.push("screenInset required");
  } else {
    if (inset.w <= 0 || inset.h <= 0) errors.push("screenInset size must be positive");
    if (inset.x < 0 || inset.y < 0) errors.push("screenInset origin must be >= 0");
    if (d.shellPx && (inset.x + inset.w > d.shellPx.w || inset.y + inset.h > d.shellPx.h)) {
      errors.push("screenInset must fit inside shellPx");
    }
  }
  if (d.exportPxLandscape) {
    if (d.exportPxLandscape.w <= 0 || d.exportPxLandscape.h <= 0) {
      errors.push("exportPxLandscape must be positive");
    }
  }
  if (!Array.isArray(d.storeTargets)) errors.push("storeTargets required");
  if (!d.source?.trim()) errors.push("source required");
  if (!d.version?.trim()) errors.push("version required");
  return errors.length ? { ok: false, errors } : { ok: true };
}

export function assertValidDevice(d: DeviceProfile): void {
  const r = validateDevice(d);
  if (!r.ok) throw new Error(`Invalid device ${d.id}: ${r.errors.join("; ")}`);
}
