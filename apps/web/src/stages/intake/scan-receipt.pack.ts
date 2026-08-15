/** OWNER: stages/intake — pack tabs + palette strip for scan receipt */
import type { AppCapture, CapturedPalette, ScanPack, ScanResult } from "@take/scan-client";
import { escapeHtml } from "../../shared/escape";

export type ReceiptTab = "merged" | "primary" | "source-0" | "source-1";

export function captureForTab(pack: ScanPack | null, result: ScanResult, tab: ReceiptTab): AppCapture | null {
  if (!pack) return result.capture || null;
  if (tab === "merged") return pack.merged;
  if (tab === "primary") return pack.primary;
  if (tab === "source-0") return pack.sources[0] || null;
  if (tab === "source-1") return pack.sources[1] || null;
  return pack.merged;
}

export function renderPackTabs(pack: ScanPack | null, active: ReceiptTab): string {
  if (!pack?.sources.length) return "";
  const tabs: { id: ReceiptTab; label: string }[] = [
    { id: "merged", label: "Merged" },
    { id: "primary", label: "Primary" },
  ];
  pack.sources.forEach((s, i) => {
    const role = String(s.extensions?.sourceRole || `source ${i + 1}`);
    tabs.push({ id: `source-${i}` as ReceiptTab, label: role });
  });
  return `<div class="receipt-tabs" role="tablist">
    ${tabs
      .map(
        (t) =>
          `<button type="button" class="receipt-tab ${t.id === active ? "is-active" : ""}" data-receipt-tab="${t.id}" role="tab" aria-selected="${t.id === active}">${escapeHtml(t.label)}</button>`
      )
      .join("")}
  </div>`;
}

export function renderPaletteStrip(palette: CapturedPalette | null): string {
  if (!palette?.swatches?.length) {
    const warn =
      palette?.warnings?.length
        ? `<ul class="receipt-warnings">${palette.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>`
        : "";
    return `<h4 class="mono receipt-section">PALETTE</h4>
      <p class="hint tight">No palette extracted yet.</p>${warn}`;
  }
  return `<h4 class="mono receipt-section">PALETTE <span class="truth-badge prov-captured">CAPTURED</span></h4>
    <div class="receipt-palette">
      ${palette.swatches
        .map(
          (s) =>
            `<button type="button" class="receipt-swatch" style="background:${escapeHtml(s.hex)}" title="${escapeHtml(s.hex)} · ${escapeHtml(s.role || "")}" data-scan-swatch="${escapeHtml(s.hex)}" aria-label="${escapeHtml(s.hex)}"></button>`
        )
        .join("")}
    </div>
    <p class="hint tight">From icon/screens via scan-api. Lock in Style inspector applies canvas accent only.</p>`;
}
