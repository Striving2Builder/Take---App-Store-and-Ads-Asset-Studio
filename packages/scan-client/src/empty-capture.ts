/** OWNER: packages/scan-client — empty capture factory */
import type { AppCapture, DetectedKind } from "./capture.schema";
import { missingField } from "./capture.schema";

export function emptyCapture(partial: {
  inputUrl?: string;
  detectedKind?: DetectedKind;
  adapter?: string;
  errors?: string[];
  warnings?: string[];
}): AppCapture {
  return {
    schemaVersion: 1,
    scannedAt: new Date().toISOString(),
    inputUrl: partial.inputUrl || "",
    detectedKind: partial.detectedKind || "unknown",
    adapter: partial.adapter || "none",
    ok: false,
    fields: {
      name: missingField(),
      subtitle: missingField(),
      description: missingField(),
      category: missingField(),
      developer: missingField(),
      locale: missingField(),
      bundleId: missingField(),
      rating: missingField(),
      ratingCount: missingField(),
      storeUrl: missingField(),
    },
    assets: [],
    warnings: partial.warnings || [],
    errors: partial.errors || [],
  };
}
