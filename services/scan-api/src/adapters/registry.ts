/**
 * OWNER: services/scan-api/adapters — adapter registry
 * Swap/add adapters here; routes stay thin.
 */
import type { DetectedKind } from "@take/scan-client";
import type { ScanAdapter } from "./adapter.types";

const adapters: ScanAdapter[] = [];

export function registerAdapter(adapter: ScanAdapter): void {
  const existing = adapters.findIndex((a) => a.id === adapter.id);
  if (existing >= 0) adapters.splice(existing, 1, adapter);
  else adapters.push(adapter);
}

export function getAdapterForKind(kind: DetectedKind): ScanAdapter | undefined {
  return adapters.find((a) => a.kinds.includes(kind));
}

export function listAdapters(): ScanAdapter[] {
  return [...adapters];
}
