/**
 * OWNER: packages/scan-client — multi-URL ScanPack schema
 * Growth: sourceRole allows brand-kit / figma later without breaking UI.
 */
import type { AppCapture } from "./capture.schema";

export type ScanSourceRole = "primary" | "marketing" | "competitor" | string;

export type ScanSourceInput = {
  url: string;
  role: ScanSourceRole;
};

export type ScanPack = {
  schemaVersion: 1;
  packId: string;
  locale: string;
  primary: AppCapture;
  sources: AppCapture[];
  /** Primary-wins merge for Generate */
  merged: AppCapture;
  warnings: string[];
};
