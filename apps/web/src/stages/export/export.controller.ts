/** OWNER: stages/export — validation + ZIP export + project save + motion */
import { getMode } from "@take/modes-sdk";
import { screenshotCountOk } from "@take/core";
import { getDevice, screenshotUpscaleFactor, MAX_SCREENSHOT_UPSCALE } from "@take/device-catalog";
import { motionStretchTarget } from "@take/export-presets";
import { getTemplates, pushHistory, saveProject } from "@take/storage";
import { currentSet, state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { downloadText, downloadZip } from "../../shared/download";
import { toast } from "../../shell/toast";
import { currentExportSize } from "./frame-render";
import { stripRecipeOfSet } from "./paint-strip-slice";
import { downloadSlideshowVideo } from "./slideshow-video";
import { applyDeviceFrame } from "../../editor/device/apply-device-frame";
import { selectedPresetIds } from "./mount-presets";
import { persistExportPresetIds } from "./persist-presets";
import { buildExportFiles, currentExportPlan } from "./export-zip";
import { runAdExport } from "./ad-export";
import { getAdUnit, checkVideoCompliance } from "@take/ad-unit-catalog";
import { checkLegalCompliance } from "@take/ad-compliance";
import { loadImg } from "./canvas-text";
import { selectedScreenshots } from "./selected-shots";

function countPlatform(infPlatform: string): string {
  const fromDevice = getDevice(state.deviceId)?.platform;
  if (fromDevice === "android" || fromDevice === "ios") return fromDevice;
  if (state.platform === "android" || state.platform === "ios") return state.platform;
  return infPlatform;
}

function renderAdValidation(): void {
  const set = currentSet();
  const list = $("#validation-list");
  if (!list) return;
  if (!set?.adCopy) {
    list.innerHTML = `<li class="warn">No ad set selected</li>`;
    return;
  }
  const c = set.adCopy;
  const unitCount = set.frames.filter((f) => f.adUnitId).length;
  const checks = [
    { ok: unitCount > 0, text: `${unitCount} ad unit${unitCount === 1 ? "" : "s"} selected` },
    { ok: c.headline.length > 0 && c.headline.length <= 60, text: `Headline ${c.headline.length}/60` },
    { ok: c.cta.length > 0 && c.cta.length <= 24, text: `CTA ${c.cta.length}/24` },
    { ok: !!c.clickThroughUrl.trim(), text: c.clickThroughUrl.trim() ? `Click-through set` : "Click-through URL missing — export blocks" },
    { ok: true, text: "Native composition per unit — not a resized screenshot" },
    ...videoComplianceChecks(set),
    ...legalComplianceChecks(set),
  ];
  list.innerHTML = checks
    .map((x) => `<li class="${x.ok ? "ok" : "warn"}">${escapeHtml(x.text)}</li>`)
    .join("");
}

/** Same posture as videoComplianceChecks — real checklist, not a hard export block. Legal
 *  requirements are inherently fuzzier than a duration/file-size number, so this always warns
 *  rather than errors even when a requirement is missing. */
function legalComplianceChecks(set: NonNullable<ReturnType<typeof currentSet>>): { ok: boolean; text: string }[] {
  const category = set.adCopy?.regulatedCategory;
  const jurisdiction = set.adCopy?.jurisdiction;
  if (!category || category === "none" || !jurisdiction) return [];
  const result = checkLegalCompliance(category, jurisdiction, set.adCopy!);
  const out: { ok: boolean; text: string }[] = [];
  for (const r of result.prohibitions) out.push({ ok: false, text: `${category}/${jurisdiction}: verify legality — ${r.label}` });
  for (const r of result.missing) out.push({ ok: false, text: `${category}/${jurisdiction}: missing — ${r.label} (checklist, not legal advice)` });
  for (const r of result.advisories) out.push({ ok: true, text: `${category}/${jurisdiction}: verify — ${r.label}` });
  if (result.missing.length === 0 && result.satisfied.length > 0) {
    out.push({ ok: true, text: `${category}/${jurisdiction}: copy covers the ${result.satisfied.length} checkable disclosure${result.satisfied.length === 1 ? "" : "s"}` });
  }
  return out;
}

/** Flags real per-platform duration/file-size mismatches against the uploaded clip — not
 *  decorative, this is the same check ad-export.ts's recording will hit. */
function videoComplianceChecks(set: NonNullable<ReturnType<typeof currentSet>>): { ok: boolean; text: string }[] {
  const videoUpload = state.uploads.find((u) => u.kind === "video");
  const out: { ok: boolean; text: string }[] = [];
  for (const frame of set.frames) {
    if (!frame.adUnitId) continue;
    const unit = getAdUnit(frame.adUnitId);
    if (!unit) continue;
    const hasSpec = unit.maxDurationMs != null || unit.recommendedDurationMs != null || unit.maxFileSizeBytes != null;
    if (!hasSpec) continue;
    if (!videoUpload) {
      if (unit.kind === "video") {
        out.push({ ok: false, text: `${unit.label}: no video uploaded — will export a static fallback frame` });
      }
      continue;
    }
    const result = checkVideoCompliance(unit, { durationMs: videoUpload.durationMs, bytes: videoUpload.bytes });
    for (const e of result.errors) out.push({ ok: false, text: `${unit.label}: ${e}` });
    for (const w of result.warnings) out.push({ ok: true, text: `${unit.label}: ${w}` });
    if (result.ok && !result.warnings.length) {
      out.push({ ok: true, text: `${unit.label}: clip fits ${unit.platform}'s spec` });
    }
  }
  return out;
}

/** Warn (never block — a real screenshot can't be un-lowres'd) when a selected
 *  screenshot is below the resolution the target device needs. The render
 *  pipeline already pads instead of stretching past MAX_SCREENSHOT_UPSCALE
 *  (see paint-devices.ts), so this is purely a heads-up, not a blocker. */
async function lowResScreenshotCheck(): Promise<{ ok: boolean; text: string } | null> {
  const shots = selectedScreenshots();
  if (!shots.length) return null;
  let lowRes = 0;
  for (const shot of shots) {
    const img = await loadImg(shot.url);
    const w = img?.naturalWidth || img?.width || 0;
    const h = img?.naturalHeight || img?.height || 0;
    if (!w || !h) continue;
    if (screenshotUpscaleFactor(state.deviceId, state.platform, w, h) > MAX_SCREENSHOT_UPSCALE) {
      lowRes += 1;
    }
  }
  const deviceName = getDevice(state.deviceId)?.name || "the target device";
  const total = shots.length;
  if (lowRes === 0) {
    return { ok: true, text: `All ${total} screenshot${total === 1 ? "" : "s"} meet ${deviceName}'s resolution` };
  }
  return {
    ok: false,
    text: `${lowRes} of ${total} screenshot${total === 1 ? "" : "s"} lower-res than ${deviceName} needs — padded, not stretched blurry`,
  };
}

export async function renderValidation() {
  if (state.mode === "ads") {
    renderAdValidation();
    return;
  }
  const set = currentSet();
  const inf = state.inference;
  const list = $("#validation-list");
  if (!list) return;
  if (!set || !inf) {
    list.innerHTML = `<li class="warn">No set selected</li>`;
    return;
  }

  applyDeviceFrame();
  const lowResCheckPromise = lowResScreenshotCheck();
  const selected = selectedPresetIds();
  const plan = currentExportPlan(selected, set.frames.length);
  const { w: EXPORT_W, h: EXPORT_H } = currentExportSize();
  const count = screenshotCountOk(countPlatform(inf.platform), set.frames.length);
  const c = set.copy;
  const hasShots = Boolean(
    state.lastScan?.capture?.assets?.some((a) => a.kind === "screenshot")
  );
  const hints = getMode(state.mode)?.getExportHints?.() ?? {};
  const wantsMotion =
    hints.preferMotion ||
    state.mode === "slideshow" ||
    selected.includes("slideshow");
  const extra = plan.files.filter((f) => f.fit !== "native").length;
  const fakeNote = plan.skippedFake.length
    ? ` · skipped FAKE ${plan.skippedFake.join(", ")}`
    : "";
  const dwellNote = wantsMotion
    ? `${
        currentSet()?.frames.some((f) => f.dwellMs)
          ? "Motion: MediaRecorder at catalog size (per-frame dwells)"
          : "Motion export: MediaRecorder WebM/MP4 at catalog size"
      }${selected.includes("tiktok") ? " + TikTok 1080×1920 stretch" : ""}`
    : `Locale pack ${inf.locale} · local-first storage`;
  const checks = [
    {
      ok: count.ok,
      text: count.ok
        ? `Screenshot count ${count.count} within store guidance (${count.frameMin}–${count.frameMax})`
        : `Screenshot count ${count.count} outside typical store guidance (${count.frameMin}–${count.frameMax})`,
    },
    { ok: c.iosTitle.length <= 30, text: `iOS title ${c.iosTitle.length}/30` },
    { ok: c.iosSubtitle.length <= 30, text: `iOS subtitle ${c.iosSubtitle.length}/30` },
    { ok: c.playShort.length <= 80, text: `Play short ${c.playShort.length}/80` },
    {
      ok: true,
      text: hasShots
        ? `Scan assets · ZIP ${plan.files.length} PNG (${extra} extra sizes) · store ${EXPORT_W}×${EXPORT_H}${fakeNote}`
        : `ZIP ${plan.files.length} PNG (${extra} extra sizes) · store ${EXPORT_W}×${EXPORT_H}${fakeNote}`,
    },
    {
      ok: true,
      text: dwellNote,
    },
  ];
  const recipe = stripRecipeOfSet();
  if (recipe?.background.kind === "image" && recipe.composition === "strip") {
    checks.push({
      ok: true,
      text: `Strip panorama · ${recipe.frameCount} clips from one world image`,
    });
  }
  const lowResCheck = await lowResCheckPromise;
  if (lowResCheck) checks.push(lowResCheck);

  list.innerHTML = checks
    .map((x) => `<li class="${x.ok ? "ok" : "warn"}">${escapeHtml(x.text)}</li>`)
    .join("");
}

export async function runExport() {
  if (state.mode === "ads") {
    await runAdExport();
    void saveCurrentProject();
    return;
  }

  const set = currentSet();
  const inf = state.inference;
  if (!set || !inf) {
    toast("Generate a set before export");
    return;
  }

  const selected = selectedPresetIds();
  const hints = getMode(state.mode)?.getExportHints?.() ?? {};
  const wantMotion =
    selected.includes("slideshow") ||
    state.mode === "slideshow" ||
    Boolean(hints.preferMotion);

  toast("Rendering PNG frames…");
  try {
    const { files, plan, store } = await buildExportFiles(selected);
    const stamp = new Date().toISOString().slice(0, 10);
    const slug = (inf.name || "app").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    files.push({
      name: "metadata/manifest.json",
      data: JSON.stringify(
        {
          app: inf.name,
          set: set.name,
          deviceId: state.deviceId,
          fitMode: state.fitMode,
          orientation: state.orientation,
          shellView: state.shellView,
          locale: inf.locale,
          presets: selected,
          frameCount: set.frames.length,
          size: store,
          files: plan.files.map((f) => ({
            path: f.path,
            w: f.w,
            h: f.h,
            preset: f.presetId,
            fit: f.fit,
          })),
          skippedFake: plan.skippedFake,
          stamped: stamp,
          motion: wantMotion,
          motionStretch: wantMotion && selected.includes("tiktok") ? "tiktok-9x16" : null,
        },
        null,
        2
      ),
    });
    files.push({
      name: "metadata/store-copy.txt",
      data: [
        `iOS title: ${set.copy.iosTitle}`,
        `iOS subtitle: ${set.copy.iosSubtitle}`,
        `Play short: ${set.copy.playShort}`,
        `Play full: ${set.copy.playFull}`,
      ].join("\n"),
    });

    await downloadZip(`${slug}-take-${stamp}.zip`, files);
    pushHistory("export.zip", `${plan.files.length} png`);
    toast(`Exported ${plan.files.length} PNG files + manifest`);

    if (wantMotion) {
      toast("Recording slideshow video…");
      const name = await downloadSlideshowVideo((msg) => toast(msg));
      pushHistory("export.video", name);
      toast(`Downloaded motion file ${name}`);
      const stretch = selected.includes("tiktok") ? motionStretchTarget("tiktok") : null;
      if (stretch) {
        toast("Recording TikTok-sized video…");
        const stretchName = await downloadSlideshowVideo((msg) => toast(msg), {
          dest: stretch,
          tag: "tiktok",
        });
        pushHistory("export.video.tiktok", stretchName);
        toast(`Downloaded ${stretchName}`);
      }
    }

    void saveCurrentProject();
  } catch (err) {
    toast(err instanceof Error ? err.message : "Export failed");
  }
}

export async function saveCurrentProject() {
  const inf = state.inference;
  if (!inf || !state.sets.length) {
    toast("Nothing to save — generate first");
    return;
  }
  try {
    const id = state.currentProjectId || `proj-${Date.now()}`;
    state.currentProjectId = id;
    persistExportPresetIds(selectedPresetIds());
    await saveProject({
      id,
      name: inf.name || "Untitled project",
      updatedAt: new Date().toISOString(),
      payload: {
        inference: inf,
        sets: state.sets,
        deviceId: state.deviceId,
        fitMode: state.fitMode,
        orientation: state.orientation,
        shellView: state.shellView,
        platform: state.platform,
        mode: state.mode,
        selectedSet: state.selectedSet,
        activeFrame: state.activeFrame,
        lastScan: state.lastScan,
        lastPack: state.lastPack,
        scanPalette: state.scanPalette,
        selectedShotIds: state.selectedShotIds,
        templateId: state.templateId || undefined,
        exportPresetIds: selectedPresetIds(),
      },
    });
    pushHistory("project.save", id);
    toast("Project saved (IndexedDB)");
  } catch (err) {
    toast(err instanceof Error ? err.message : "Project save failed");
  }
}

export function exportLibrary() {
  const data = JSON.stringify(getTemplates(), null, 2);
  downloadText(`take-templates-${Date.now()}.json`, data);
  toast("Template library exported");
}

/** Optional standalone motion download (used by tests / future UI). */
export async function runMotionExportOnly() {
  try {
    const name = await downloadSlideshowVideo((msg) => toast(msg));
    toast(`Downloaded ${name}`);
  } catch (err) {
    toast(err instanceof Error ? err.message : "Motion export failed");
  }
}
