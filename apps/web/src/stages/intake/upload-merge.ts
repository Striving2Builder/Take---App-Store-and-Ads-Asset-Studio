/** OWNER: stages/intake — merge user uploads into capture / result */
import type { AppCapture, CapturedAsset, ScanResult } from "@take/scan-client";
import { emptyCapture } from "@take/scan-client";
import type { UploadItem } from "../../app/app-state";

function kindFromName(name: string): CapturedAsset["kind"] {
  const n = name.toLowerCase();
  if (n.includes("icon")) return "icon";
  if (n.includes("feature") || n.includes("graphic")) return "feature";
  return "screenshot";
}

/** Video uploads are Ads-mode creative source, not a store screenshot/icon/feature asset. */
export function uploadsToAssets(uploads: UploadItem[]): CapturedAsset[] {
  return uploads
    .filter((u) => u.kind !== "video")
    .map((u, i) => ({
      id: `upload-${i}-${u.name}`,
      kind: kindFromName(u.name),
      url: u.url,
      provenance: "user" as const,
    }));
}

/** Merge user uploads into capture: fill missing screens; user icon wins. */
export function mergeUploadsIntoResult(
  result: ScanResult,
  uploads: UploadItem[]
): ScanResult {
  if (!uploads.length) return result;

  const userAssets = uploadsToAssets(uploads);
  let capture: AppCapture =
    result.capture ||
    emptyCapture({
      inputUrl: "",
      adapter: "uploads",
      warnings: ["Upload-only capture"],
    });

  const userIcon = userAssets.find((a) => a.kind === "icon");
  let assets = [...capture.assets];
  if (userIcon) {
    assets = assets.filter((a) => a.kind !== "icon");
    assets.unshift(userIcon);
  }
  for (const a of userAssets) {
    if (a === userIcon) continue;
    if (assets.some((x) => x.url === a.url)) continue;
    assets.push(a);
  }
  assets = assets.slice(0, 16);

  // "Upload analysis not implemented" hasn't been emitted by this app since
  // before this filter was written — no current code path produces it. Kept
  // as migration hygiene: a project saved by an older build can still carry
  // that string in its stored warnings, and it shouldn't resurface here.
  capture = {
    ...capture,
    adapter: capture.adapter === "none" ? "uploads" : capture.adapter,
    ok: Boolean(capture.ok || assets.length),
    assets,
    warnings: [
      ...capture.warnings.filter((w) => !w.includes("Upload analysis not implemented")),
      `Merged ${userAssets.length} user upload(s) into asset bin.`,
    ],
  };

  const warnings = [
    ...result.warnings.filter((w) => !w.includes("Upload analysis not implemented")),
    `Uploads merged: ${userAssets.length}`,
  ];

  return {
    ...result,
    capture,
    warnings,
    source: result.source === "live" ? "live" : assets.length ? "live" : result.source,
  };
}
