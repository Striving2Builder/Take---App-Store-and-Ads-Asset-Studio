/** OWNER: stages/export — build + download native ad-unit ZIP (Ads mode only)
 *  Separate from the store/social/IAB-letterbox pipeline in export-zip.ts — ad units are
 *  natively composed per unit, not a resize of one shared "source" frame. */
import { getAdUnit, checkVideoCompliance } from "@take/ad-unit-catalog";
import { checkLegalCompliance } from "@take/ad-compliance";
import { getAdWireframe } from "@take/template-engine";
import { pushHistory } from "@take/storage";
import { currentSet, state } from "../../app/app-state";
import { toast } from "../../shell/toast";
import { downloadZip } from "../../shared/download";
import { loadImg } from "./canvas-text";
import { canvasPngBytes } from "./fit-canvas";
import { paintAdFrame } from "./paint-ad-frame";
import { recordAdVideo } from "./ad-video-export";

export async function runAdExport(): Promise<void> {
  const set = currentSet();
  if (!set?.adCopy) {
    toast("Generate an ad set before export");
    return;
  }
  if (!set.adCopy.clickThroughUrl.trim()) {
    toast("Add a click-through URL first — an ad with no landing URL isn't a real ad");
    return;
  }

  const imgUpload = state.uploads.find((u) => u.kind === "image");
  const videoUpload = state.uploads.find((u) => u.kind === "video");
  const image = imgUpload ? await loadImg(imgUpload.url) : null;

  const files: { name: string; data: Uint8Array | string }[] = [];
  const manifestUnits: {
    adUnitId: string;
    wireframeId: string;
    kind: string;
    platform: string;
    path: string;
    note?: string;
    compliance?: { ok: boolean; errors: string[]; warnings: string[] };
  }[] = [];
  let n = 0;

  function complianceFor(unit: ReturnType<typeof getAdUnit>) {
    if (!unit) return undefined;
    const hasSpec = unit.maxDurationMs != null || unit.recommendedDurationMs != null || unit.maxFileSizeBytes != null;
    if (!hasSpec) return undefined;
    return checkVideoCompliance(unit, { durationMs: videoUpload?.durationMs, bytes: videoUpload?.bytes });
  }

  for (const frame of set.frames) {
    if (!frame.adUnitId || !frame.wireframeId) continue;
    const unit = getAdUnit(frame.adUnitId);
    const wireframe = getAdWireframe(frame.wireframeId);
    if (!unit || !wireframe) continue;

    if (unit.kind === "video") {
      if (videoUpload) {
        try {
          toast(`Recording ${unit.label}…`);
          const result = await recordAdVideo(
            videoUpload.url,
            unit,
            wireframe,
            set.adCopy,
            null,
            set.palette,
            (msg) => toast(msg)
          );
          const path = `ads/${unit.family}/${unit.id}.${result.ext}`;
          files.push({ name: path, data: new Uint8Array(await result.blob.arrayBuffer()) });
          manifestUnits.push({
            adUnitId: unit.id,
            wireframeId: wireframe.id,
            kind: "video",
            platform: unit.platform,
            path,
            compliance: complianceFor(unit),
          });
          n++;
          continue;
        } catch (err) {
          toast(
            `${unit.label} video export failed (${err instanceof Error ? err.message : "unknown error"}) — falling back to a static frame`
          );
        }
      }
      // No video uploaded, or recording failed — honest static fallback, clearly labeled.
      const canvas = document.createElement("canvas");
      paintAdFrame(canvas, { size: unit.exportPx, wireframe, copy: set.adCopy, image, logo: null, palette: set.palette });
      const path = `ads/${unit.family}/${unit.id}-static-fallback.png`;
      files.push({ name: path, data: await canvasPngBytes(canvas) });
      manifestUnits.push({
        adUnitId: unit.id,
        wireframeId: wireframe.id,
        kind: "video",
        platform: unit.platform,
        path,
        note: videoUpload ? "video recording failed" : "no video uploaded — static frame only",
        compliance: complianceFor(unit),
      });
      n++;
      continue;
    }

    const canvas = document.createElement("canvas");
    paintAdFrame(canvas, { size: unit.exportPx, wireframe, copy: set.adCopy, image, logo: null, palette: set.palette });
    const path = `ads/${unit.family}/${unit.id}.png`;
    files.push({ name: path, data: await canvasPngBytes(canvas) });
    manifestUnits.push({
      adUnitId: unit.id,
      wireframeId: wireframe.id,
      kind: unit.kind,
      platform: unit.platform,
      path,
      compliance: complianceFor(unit),
    });
    n++;
  }

  if (!n) {
    toast("No ad units selected — pick sizes in the Ads inspector");
    return;
  }

  const legalCompliance =
    set.adCopy.regulatedCategory !== "none"
      ? checkLegalCompliance(set.adCopy.regulatedCategory, set.adCopy.jurisdiction, set.adCopy)
      : null;
  if (legalCompliance?.prohibitions.length) {
    toast(`${legalCompliance.prohibitions.length} legality notice(s) for this category/jurisdiction — see metadata/ad-copy.json`);
  } else if (legalCompliance?.missing.length) {
    toast(`${legalCompliance.missing.length} disclosure requirement(s) may be missing — see metadata/ad-copy.json`);
  }

  files.push({
    name: "metadata/ad-copy.json",
    data: JSON.stringify({ adCopy: set.adCopy, units: manifestUnits, legalCompliance }, null, 2),
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const slug = (set.adCopy.advertiserName || "ads").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  await downloadZip(`${slug}-ads-${stamp}.zip`, files);
  pushHistory("export.ads", `${n} file${n === 1 ? "" : "s"}`);
  toast(`Exported ${n} ad creative${n === 1 ? "" : "s"}`);
}
