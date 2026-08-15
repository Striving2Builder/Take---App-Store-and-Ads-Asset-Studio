/**
 * OWNER: services/scan-api/adapters — ScanAdapter contract (extensible registry)
 * Future adapters (ASO, Figma, APK) implement this without changing the orchestrator.
 */
import type { AppCapture, DetectedKind } from "@take/scan-client";

export type ScanAdapterInput = {
  url: string;
  /** BCP-47-ish locale e.g. en-US */
  locale: string;
  /** Derived language code e.g. en */
  language: string;
  /** Derived storefront / country e.g. us */
  country: string;
};

export interface ScanAdapter {
  id: string;
  /** Which URL kinds this adapter handles */
  kinds: DetectedKind[];
  scan(input: ScanAdapterInput): Promise<AppCapture>;
}
