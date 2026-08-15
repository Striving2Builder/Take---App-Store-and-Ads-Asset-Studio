/** OWNER: stages/intake — scan finalize, hydrate, pack/primary runners */
import { fetchPalette, mergeCapture, scanApp, scanPack } from "@take/scan-client";
import type { AppCapture, CapturedPalette, ScanPack, ScanResult } from "@take/scan-client";
import { loadScanSession } from "@take/storage";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { collectIntake } from "./intake.form";
import { preparePaletteUrls } from "./palette-client";
import { renderScanReceipt } from "./scan-receipt";
import { getScanSources, setScanSources } from "./scan-sources";
import { mergeUploadsIntoResult } from "./upload-merge";

function stripDeadBlobAssets(result: ScanResult): ScanResult {
  if (!result.capture) return result;
  const assets = result.capture.assets.filter((a) => !a.url.startsWith("blob:"));
  if (assets.length === result.capture.assets.length) return result;
  return {
    ...result,
    capture: {
      ...result.capture,
      assets,
      warnings: [
        ...result.capture.warnings,
        "Dropped expired blob: upload URLs — re-upload images if needed.",
      ],
    },
    warnings: [...result.warnings, "Some upload assets expired after refresh"],
  };
}

export function hydrateScanSession() {
  const snap = loadScanSession();
  if (!snap?.lastScan) return;
  if (snap.sources?.length) setScanSources(snap.sources);
  if (snap.appUrl) {
    const urlInput = $("#app-url") as HTMLInputElement | null;
    if (urlInput && !urlInput.value) urlInput.value = snap.appUrl;
  }
  if (snap.intakeName) {
    const n = $("#f-name") as HTMLInputElement | null;
    if (n && !n.value) n.value = snap.intakeName;
  }
  if (snap.intakeCategory) {
    const c = $("#f-category") as HTMLInputElement | null;
    if (c && !c.value) c.value = snap.intakeCategory;
  }
  const adv = snap.advanced;
  if (adv) {
    const fill = (sel: string, val?: string) => {
      if (!val) return;
      const el = $(sel) as HTMLInputElement | HTMLTextAreaElement | null;
      if (el && !el.value) el.value = val;
    };
    fill("#f-audience", adv.audience);
    fill("#f-positioning", adv.positioning);
    fill("#f-narrative", adv.narrative);
    fill("#f-where", adv.where);
    fill("#f-when", adv.when);
    fill("#f-ux", adv.ux);
    fill("#f-tone", adv.tone);
    fill("#f-refs", adv.refs);
    fill("#f-donot", adv.donot);
  }
  if (snap.locale) {
    const sel = $("#scan-locale") as HTMLSelectElement | null;
    if (sel) {
      sel.value = snap.locale;
      try {
        localStorage.setItem("take.scan.locale", snap.locale);
      } catch {
        /* ignore */
      }
    }
  }
  const restored = stripDeadBlobAssets(snap.lastScan);
  renderScanReceipt(restored, {
    pack: snap.lastPack,
    palette: snap.scanPalette,
    selectedShotIds: snap.selectedShotIds,
  });
  const hint = $("#scan-hint");
  if (hint) {
    hint.textContent = `Restored scan session from ${snap.savedAt} · refresh-safe`;
  }
}

function attachPalette(
  result: ScanResult,
  pack: ScanPack | null,
  palette: CapturedPalette | null
) {
  if (!palette || !result.capture) return;
  result.capture = {
    ...result.capture,
    extensions: {
      ...result.capture.extensions,
      palette,
    },
  };
  if (pack) {
    pack.merged = {
      ...pack.merged,
      extensions: {
        ...pack.merged.extensions,
        palette,
      },
    };
  }
}

async function maybeExtractPalette(result: ScanResult): Promise<CapturedPalette | null> {
  const assets = result.capture?.assets || [];
  const urls = [
    ...assets.filter((a) => a.kind === "icon").map((a) => a.url),
    ...assets.filter((a) => a.kind === "screenshot").map((a) => a.url),
  ]
    .filter(Boolean)
    .slice(0, 3);
  if (!urls.length) return null;
  try {
    const prepared = await preparePaletteUrls(urls);
    return await fetchPalette(prepared, { baseUrl: "/api" });
  } catch (err) {
    return {
      swatches: [],
      provenance: "captured",
      source: "palette-extract",
      extractedAt: new Date().toISOString(),
      warnings: [
        `Palette extract failed: ${err instanceof Error ? err.message : "error"}`,
      ],
    };
  }
}

export async function finalizeScan(
  resultIn: ScanResult,
  pack: ScanPack | null,
  prevCapture: AppCapture | null
): Promise<{
  result: ScanResult;
  pack: ScanPack | null;
  palette: CapturedPalette | null;
}> {
  let result = mergeUploadsIntoResult(resultIn, state.uploads);
  if (result.capture) {
    result = {
      ...result,
      capture: mergeCapture(prevCapture, result.capture),
    };
  }
  if (pack && result.capture) {
    pack.merged = result.capture;
  }
  const palette = await maybeExtractPalette(result);
  attachPalette(result, pack, palette);
  if (result.capture?.detectedKind === "android" && !result.capture.ok) {
    result = {
      ...result,
      warnings: [
        ...result.warnings,
        "Play listing incomplete — upload screenshots/icon or add a marketing URL.",
      ],
    };
  }
  return { result, pack, palette };
}

export async function runIntakeScan(d: ReturnType<typeof collectIntake>): Promise<{
  result: ScanResult;
  pack: ScanPack | null;
}> {
  const extras = getScanSources().filter((s) => s.url);
  if (extras.length && !d.url) {
    throw new Error("Primary App URL required when extra sources are set");
  }
  if (d.url && extras.length) {
    const out = await scanPack(
      {
        primaryUrl: d.url,
        sources: extras.map((s) => ({ url: s.url, role: s.role })),
        locale: d.locale,
        intake: d,
      },
      { baseUrl: "/api" }
    );
    return { result: out.result, pack: out.pack };
  }
  const result = await scanApp(d, { baseUrl: "/api" });
  return { result, pack: null };
}
