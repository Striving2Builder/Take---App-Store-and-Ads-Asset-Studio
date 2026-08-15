/**
 * OWNER: packages/scan-client — pack merge rules (locked)
 * 1. Primary Captured > secondary Captured
 * 2. Secondary fills Missing only
 * 3. Competitor = reference only — fields AND assets stay out of brand merge
 * 4. User provenance never clobbered (handled by mergeCapture if re-scan)
 */
import type { AppCapture, AppCaptureFields, CaptureField } from "./capture.schema";
import type { ScanPack } from "./scan-pack.schema";

function isFilled(f: CaptureField<unknown>) {
  return f.provenance === "captured" && f.value != null && f.value !== "";
}

function isMissing(f: CaptureField<unknown>) {
  return f.provenance === "missing" || f.value == null || f.value === "";
}

function mergeFields(primary: AppCaptureFields, secondary: AppCaptureFields): AppCaptureFields {
  const out = { ...primary };
  (Object.keys(out) as (keyof AppCaptureFields)[]).forEach((key) => {
    if (isMissing(out[key]) && isFilled(secondary[key])) {
      // @ts-expect-error field union
      out[key] = secondary[key];
    }
  });
  return out;
}

/** Merge secondary into primary for brand fields/assets (non-competitor). */
export function mergeSecondaryIntoPrimary(
  primary: AppCapture,
  secondary: AppCapture
): AppCapture {
  const role = secondary.extensions?.sourceRole || "marketing";

  // Competitor = compare lane only — never fill brand fields or asset bin
  if (role === "competitor") {
    return {
      ...primary,
      warnings: [
        ...primary.warnings,
        ...secondary.warnings.map((w) => `[${role}] ${w}`),
        "Competitor source used for compare only — fields and assets not merged into brand.",
      ],
      errors: [...primary.errors, ...secondary.errors.map((e) => `[${role}] ${e}`)],
      extensions: {
        ...primary.extensions,
        packId: primary.extensions?.packId,
        sourceRole: "primary",
      },
    };
  }

  const merged: AppCapture = {
    ...primary,
    fields: mergeFields(primary.fields, secondary.fields),
    warnings: [
      ...primary.warnings,
      ...secondary.warnings.map((w) => `[${role}] ${w}`),
    ],
    errors: [...primary.errors, ...secondary.errors.map((e) => `[${role}] ${e}`)],
    extensions: {
      ...primary.extensions,
      packId: primary.extensions?.packId,
      sourceRole: "primary",
    },
  };

  const hasIcon = primary.assets.some((a) => a.kind === "icon");
  const shots = primary.assets.filter((a) => a.kind === "screenshot");
  const extras = secondary.assets.filter((a) => {
    if (a.kind === "icon" && hasIcon) return false;
    if (a.kind === "screenshot" && shots.length >= 8) return false;
    return true;
  });
  merged.assets = [
    ...primary.assets,
    ...extras.map((a, i) => ({ ...a, id: `${role}-${a.id || i}` })),
  ];

  merged.ok = Boolean(merged.fields.name.value) || primary.ok || secondary.ok;
  return merged;
}

export function buildScanPack(input: {
  primary: AppCapture;
  sources: AppCapture[];
  locale: string;
}): ScanPack {
  const packId = `pack-${Date.now()}`;
  let merged: AppCapture = {
    ...input.primary,
    extensions: {
      ...input.primary.extensions,
      packId,
      sourceRole: "primary",
    },
  };

  for (const src of input.sources) {
    merged = mergeSecondaryIntoPrimary(merged, src);
  }

  return {
    schemaVersion: 1,
    packId,
    locale: input.locale,
    primary: input.primary,
    sources: input.sources,
    merged,
    warnings: [
      ...merged.warnings,
      input.sources.length
        ? `Merged ${input.sources.length} secondary source(s) with primary-wins rules.`
        : "Single-source pack (primary only).",
    ],
  };
}
