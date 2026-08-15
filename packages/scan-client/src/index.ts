/** OWNER: packages/scan-client — public API */
export type { ScanResult } from "./scan.types";
export type {
  AppCapture,
  AppCaptureFields,
  CapturedAsset,
  CaptureField,
  DetectedKind,
  FieldProvenance,
} from "./capture.schema";
export {
  capturedField,
  emptyField,
  fieldValue,
  inferredField,
  mergeCapture,
  missingField,
} from "./capture.schema";
export { emptyCapture } from "./empty-capture";
export {
  detectUrlKind,
  extractAppleAppId,
  extractPlayPackageId,
  normalizeUrl,
} from "./url-detect";
export { LOCALE_PRESETS, findLocalePreset, type LocalePreset } from "./locale.presets";
export type { CapturedPalette, PaletteSwatch } from "./palette.types";
export type { ScanPack, ScanSourceInput, ScanSourceRole } from "./scan-pack.schema";
export { buildScanPack, mergeSecondaryIntoPrimary } from "./merge-pack";
export { scanApp, scanPack, fetchPalette, type ScanClientOptions } from "./client";
export { fallbackInfer } from "./fallback-infer";
export { briefFromCapture, scanResultFromCapture } from "./from-capture";
export {
  narrativeFromDescription,
  featuresFromDescription,
} from "./narrative-from-description";
