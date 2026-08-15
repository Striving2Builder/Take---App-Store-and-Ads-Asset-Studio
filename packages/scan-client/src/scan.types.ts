/** OWNER: packages/scan-client — Captured vs Inferred result envelope */
import type { InferenceBrief } from "@take/core";
import type { AppCapture } from "./capture.schema";

export type ScanResult = {
  brief: InferenceBrief;
  captured: Record<string, string | string[]>;
  inferred: Record<string, string | string[]>;
  source: "live" | "fallback";
  warnings: string[];
  /** Present when a structured capture ran (live or partial) */
  capture?: AppCapture;
};
