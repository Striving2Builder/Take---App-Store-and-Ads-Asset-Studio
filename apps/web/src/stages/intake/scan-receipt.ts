/** OWNER: stages/intake — Scan receipt (Captured vs Inferred + assets + pack/palette) */
import type {
  ScanResult,
  AppCapture,
  FieldProvenance,
  ScanPack,
  CapturedPalette,
} from "@take/scan-client";
import { clip } from "@take/core";
import { clearScanSession } from "@take/storage";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import {
  captureForTab,
  renderPackTabs,
  renderPaletteStrip,
  type ReceiptTab,
} from "./scan-receipt.pack";
import { refreshScanPaletteSlot } from "../../editor/inspectors/style-inspector";
import { persistScanSession } from "./persist-scan-session";

const PROV_CLASS: Record<FieldProvenance, string> = {
  captured: "prov-captured",
  inferred: "prov-inferred",
  user: "prov-user",
  missing: "prov-missing",
};

let activeTab: ReceiptTab = "merged";
let lastResult: ScanResult | null = null;

function provLabel(p: FieldProvenance) {
  return p.toUpperCase();
}

function renderFieldRow(label: string, value: string, provenance: FieldProvenance) {
  const display = value?.trim() ? value : "—";
  return `<div class="receipt-row">
    <div class="receipt-label mono">${escapeHtml(label)}</div>
    <div class="receipt-value">${escapeHtml(display)}</div>
    <span class="truth-badge ${PROV_CLASS[provenance]}">${provLabel(provenance)}</span>
  </div>`;
}

function rowsFromCapture(capture: AppCapture) {
  const f = capture.fields;
  return [
    renderFieldRow("Name", String(f.name.value ?? ""), f.name.provenance),
    renderFieldRow("Subtitle / short", String(f.subtitle.value ?? ""), f.subtitle.provenance),
    renderFieldRow(
      "Description",
      f.description.value ? clip(String(f.description.value), 280) : "",
      f.description.provenance
    ),
    renderFieldRow("Category", String(f.category.value ?? ""), f.category.provenance),
    renderFieldRow("Developer", String(f.developer.value ?? ""), f.developer.provenance),
    renderFieldRow("Locale", String(f.locale.value ?? ""), f.locale.provenance),
    renderFieldRow("Bundle / package", String(f.bundleId.value ?? ""), f.bundleId.provenance),
    renderFieldRow(
      "Rating",
      f.rating.value != null ? String(f.rating.value) : "",
      f.rating.provenance
    ),
  ].join("");
}

function rowsFromLoose(result: ScanResult) {
  const keys = Array.from(
    new Set([...Object.keys(result.captured), ...Object.keys(result.inferred)])
  );
  return keys
    .map((k) => {
      const fromCap = k in result.captured;
      const raw = fromCap ? result.captured[k] : result.inferred[k];
      const value = Array.isArray(raw) ? raw.join(", ") : String(raw ?? "");
      return renderFieldRow(k, clip(value, 280), fromCap ? "captured" : "inferred");
    })
    .join("");
}

function assetsHtml(capture: AppCapture | null) {
  const assets = capture?.assets || [];
  if (!assets.length) return `<p class="hint tight">No remote assets captured.</p>`;
  return `<div class="receipt-assets">${assets
    .slice(0, 12)
    .map((a) => {
      const selected =
        a.kind !== "screenshot" ||
        !state.selectedShotIds.length ||
        state.selectedShotIds.includes(a.id);
      const canToggle = a.kind === "screenshot";
      const pressed = selected ? "true" : "false";
      return `<figure class="receipt-asset ${canToggle ? "is-toggle" : ""} ${selected ? "is-selected" : "is-dim"}" data-asset-id="${escapeHtml(a.id)}" data-asset-kind="${escapeHtml(a.kind)}" ${canToggle ? `role="button" tabindex="0" aria-pressed="${pressed}"` : ""} title="${canToggle ? "Toggle include in canvas/export" : escapeHtml(a.kind)}">
          <img src="${escapeHtml(a.url)}" alt="${escapeHtml(a.kind)}" loading="lazy" referrerpolicy="no-referrer" />
          <figcaption class="mono">${escapeHtml(a.kind)}${canToggle ? (selected ? " · on" : " · off") : ""}</figcaption>
        </figure>`;
    })
    .join("")}</div>
    <p class="hint tight">Click screenshots to choose which ones feed the canvas / export (default: all).</p>`;
}

function paintReceipt() {
  const root = $("#scan-receipt") as HTMLElement | null;
  const result = lastResult;
  if (!root || !result) return;

  const pack = state.lastPack;
  const capture = captureForTab(pack, result, activeTab);
  const live = result.source === "live" && Boolean(result.capture?.ok);
  const statusClass = live ? "receipt-live" : result.capture ? "receipt-partial" : "receipt-fallback";
  const statusText = live
    ? pack?.sources.length
      ? "LIVE PACK"
      : "LIVE CAPTURE"
    : result.capture
      ? "PARTIAL / FAILED CAPTURE"
      : "FALLBACK ONLY (no live capture)";

  const adapter = capture?.adapter || result.capture?.adapter || "fallback-infer";
  const kind = capture?.detectedKind || result.capture?.detectedKind || "unknown";
  const when = capture?.scannedAt || result.capture?.scannedAt || new Date().toISOString();
  const fieldHtml = capture ? rowsFromCapture(capture) : rowsFromLoose(result);
  const uniqueWarnings = Array.from(
    new Set(
      pack
        ? [...pack.warnings, ...(state.scanPalette?.warnings || [])]
        : [...result.warnings, ...(state.scanPalette?.warnings || [])]
    )
  );
  const warnHtml = uniqueWarnings.length
    ? `<ul class="receipt-warnings">${uniqueWarnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>`
    : "";

  root.innerHTML = `
    <header class="receipt-head">
      <div>
        <p class="mono receipt-kicker">SCAN RECEIPT</p>
        <h3 class="receipt-title">Captured vs Inferred</h3>
      </div>
      <span class="receipt-status ${statusClass}">${statusText}</span>
    </header>
    <p class="mono receipt-meta">${escapeHtml(kind)} · ${escapeHtml(adapter)} · ${escapeHtml(when)}${
      pack ? ` · pack ${escapeHtml(pack.packId)}` : ""
    }</p>
    ${renderPackTabs(pack, activeTab)}
    <div class="receipt-fields">${fieldHtml}</div>
    <h4 class="mono receipt-section">ASSET BIN</h4>
    ${assetsHtml(capture)}
    ${renderPaletteStrip(state.scanPalette)}
    ${warnHtml}
    <p class="hint tight">Narrative gaps stay <strong>Inferred</strong> until you fill Advanced guidance. Generate uses merged Captured facts first.</p>
  `;
}

export function renderScanReceipt(
  result: ScanResult,
  options?: {
    pack?: ScanPack | null;
    palette?: CapturedPalette | null;
    selectedShotIds?: string[];
    preserveSelection?: boolean;
  }
) {
  const root = $("#scan-receipt") as HTMLElement | null;
  if (!root) return;

  root.hidden = false;
  lastResult = result;
  activeTab = "merged";
  state.lastScan = result;
  state.lastPack = options?.pack ?? null;
  if (options?.palette !== undefined) state.scanPalette = options.palette;
  const shots = result.capture?.assets?.filter((a) => a.kind === "screenshot") || [];
  const shotIds = shots.map((s) => s.id);
  if (options?.preserveSelection && state.selectedShotIds.length) {
    const keep = state.selectedShotIds.filter((id) => shotIds.includes(id));
    state.selectedShotIds = keep.length ? keep : shotIds;
  } else if (options?.selectedShotIds?.length) {
    const keep = options.selectedShotIds.filter((id) => shotIds.includes(id));
    state.selectedShotIds = keep.length ? keep : shotIds;
  } else {
    state.selectedShotIds = shotIds;
  }
  state.inference = result.brief;
  const live = result.source === "live" && Boolean(result.capture?.ok);
  state.scanLocked = live || Boolean(result.capture);

  paintReceipt();
  refreshScanPaletteSlot();

  const nameInput = $("#f-name") as HTMLInputElement | null;
  const catInput = $("#f-category") as HTMLInputElement | null;
  const name = result.capture?.fields.name.value;
  const cat = result.capture?.fields.category.value;
  if (nameInput && !nameInput.value && name) nameInput.value = String(name);
  if (catInput && !catInput.value && cat) catInput.value = String(cat);
}

function toggleShotSelection(id: string) {
  const allShots =
    state.lastScan?.capture?.assets?.filter((a) => a.kind === "screenshot").map((a) => a.id) ||
    [];
  if (!state.selectedShotIds.length) state.selectedShotIds = [...allShots];
  if (state.selectedShotIds.includes(id)) {
    if (state.selectedShotIds.length <= 1) return;
    state.selectedShotIds = state.selectedShotIds.filter((x) => x !== id);
  } else {
    state.selectedShotIds = [...state.selectedShotIds, id];
  }
  paintReceipt();
  persistScanSession();
}

export function bindScanReceiptTabs() {
  document.addEventListener("click", (e) => {
    const tab = (e.target as Element)?.closest?.("[data-receipt-tab]") as HTMLElement | null;
    if (tab && lastResult) {
      activeTab = (tab.dataset.receiptTab as ReceiptTab) || "merged";
      paintReceipt();
      return;
    }
    const asset = (e.target as Element)?.closest?.("[data-asset-id]") as HTMLElement | null;
    if (!asset || asset.dataset.assetKind !== "screenshot") return;
    const id = asset.dataset.assetId || "";
    if (!id) return;
    toggleShotSelection(id);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const asset = (e.target as Element)?.closest?.("[data-asset-id]") as HTMLElement | null;
    if (!asset || asset.dataset.assetKind !== "screenshot") return;
    e.preventDefault();
    const id = asset.dataset.assetId || "";
    if (id) toggleShotSelection(id);
  });
}

export function clearScanReceipt() {
  const root = $("#scan-receipt") as HTMLElement | null;
  if (root) {
    root.hidden = true;
    root.innerHTML = "";
  }
  lastResult = null;
  state.lastScan = null;
  state.lastPack = null;
  state.scanPalette = null;
  state.scanLocked = false;
  state.selectedShotIds = [];
  refreshScanPaletteSlot();
  clearScanSession();
}
