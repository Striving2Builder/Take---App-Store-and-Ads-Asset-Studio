/** OWNER: packages/storage — scan session snapshot (localStorage) */
import type { CapturedPalette, ScanPack, ScanResult } from "@take/scan-client";
import { STORAGE_KEYS } from "./keys";
import { loadJSON, saveJSON } from "./local-json";

export type ScanSourceSnapshot = {
  id: string;
  role: "marketing" | "competitor";
  url: string;
};

export type AdvancedSnapshot = {
  audience?: string;
  positioning?: string;
  narrative?: string;
  where?: string;
  when?: string;
  ux?: string;
  tone?: string;
  refs?: string;
  donot?: string;
};

export type ScanSessionSnapshot = {
  version: 1;
  savedAt: string;
  lastScan: ScanResult | null;
  lastPack: ScanPack | null;
  scanPalette: CapturedPalette | null;
  sources: ScanSourceSnapshot[];
  appUrl: string;
  locale: string;
  intakeName: string;
  intakeCategory: string;
  /** Screenshot ids selected for canvas/export */
  selectedShotIds?: string[];
  /** Advanced guidance fields */
  advanced?: AdvancedSnapshot;
};

export function loadScanSession(): ScanSessionSnapshot | null {
  const raw = loadJSON<ScanSessionSnapshot | null>(STORAGE_KEYS.scanSession, null);
  if (!raw || raw.version !== 1) return null;
  return raw;
}

export function saveScanSession(session: Omit<ScanSessionSnapshot, "version" | "savedAt">): void {
  const payload: ScanSessionSnapshot = {
    version: 1,
    savedAt: new Date().toISOString(),
    ...session,
  };
  saveJSON(STORAGE_KEYS.scanSession, payload);
}

export function clearScanSession(): void {
  localStorage.removeItem(STORAGE_KEYS.scanSession);
}
