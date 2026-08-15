/**
 * OWNER: packages/scan-client — Capture schema v1 + provenance rules
 *
 * RULES (locked):
 * 1. Captured = value taken from a live adapter (store API / page meta). Never invent.
 * 2. Inferred = heuristic/model fill for gaps only — must stay labeled.
 * 3. User = explicitly edited by human after receipt.
 * 4. Missing = null / empty; do not fake confidence.
 * 5. Re-scan must not overwrite provenance === "user".
 * 6. UI must never show Inferred as if it were Captured.
 */

export type FieldProvenance = "captured" | "inferred" | "user" | "missing";

export type DetectedKind = "ios" | "android" | "web" | "unknown";

export type CapturedAsset = {
  id: string;
  kind: "icon" | "screenshot" | "feature" | "og_image";
  url: string;
  width?: number;
  height?: number;
  /** captured from store/site, or user upload */
  provenance?: "captured" | "user";
};

export type CaptureField<T = string> = {
  value: T | null;
  provenance: FieldProvenance;
  /** Adapter id e.g. apple-lookup, og-meta */
  source?: string;
  confidence?: number;
};

export type AppCaptureFields = {
  name: CaptureField;
  subtitle: CaptureField;
  description: CaptureField;
  category: CaptureField;
  developer: CaptureField;
  locale: CaptureField;
  bundleId: CaptureField;
  rating: CaptureField<number | null>;
  ratingCount: CaptureField<number | null>;
  storeUrl: CaptureField;
};

export type AppCapture = {
  schemaVersion: 1;
  scannedAt: string;
  inputUrl: string;
  detectedKind: DetectedKind;
  adapter: string;
  ok: boolean;
  fields: AppCaptureFields;
  assets: CapturedAsset[];
  warnings: string[];
  errors: string[];
  /** Additive growth bag — optional Phase 2+ fields */
  extensions?: {
    palette?: import("./palette.types").CapturedPalette;
    packId?: string;
    sourceRole?: "primary" | "marketing" | "competitor" | string;
    storefront?: string;
    language?: string;
  };
};

export function emptyField<T = string>(value: T | null = null): CaptureField<T> {
  return {
    value,
    provenance: value == null || value === "" ? "missing" : "captured",
  };
}

export function capturedField<T>(
  value: T | null,
  source: string,
  confidence = 1
): CaptureField<T> {
  if (value == null || value === ("" as unknown as T)) {
    return { value: null, provenance: "missing", source };
  }
  return { value, provenance: "captured", source, confidence };
}

export function inferredField<T>(value: T, source = "fallback-infer"): CaptureField<T> {
  return { value, provenance: "inferred", source, confidence: 0.4 };
}

export function missingField<T = string>(): CaptureField<T> {
  return { value: null, provenance: "missing" };
}

/** Merge re-scan into previous without clobbering user edits */
export function mergeCapture(prev: AppCapture | null, next: AppCapture): AppCapture {
  if (!prev) return next;
  const fields = { ...next.fields };
  (Object.keys(fields) as (keyof AppCaptureFields)[]).forEach((key) => {
    const p = prev.fields[key];
    if (p?.provenance === "user") {
      // keep user value
      // @ts-expect-error union assign
      fields[key] = p;
    }
  });
  return { ...next, fields };
}

export function fieldValue(f: CaptureField<unknown>): string {
  if (f.value == null) return "";
  return String(f.value);
}
