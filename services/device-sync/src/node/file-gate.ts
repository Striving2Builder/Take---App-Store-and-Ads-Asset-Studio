/** OWNER: services/device-sync/node — persist ReviewGate as JSON (gitignored) */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createMemoryReviewGate, type ReviewGate } from "../review-gate";
import type { DeviceProposal } from "../types";

export function loadQueue(filePath: string): DeviceProposal[] {
  try {
    const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
    return Array.isArray(raw) ? (raw as DeviceProposal[]) : [];
  } catch {
    return [];
  }
}

export function createFileReviewGate(filePath: string): ReviewGate {
  return createMemoryReviewGate(loadQueue(filePath), (all) => {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(all, null, 2), "utf8");
  });
}
