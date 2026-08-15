/** OWNER: stages/export — validation + ZIP export + project save + motion */
import { getMode } from "@take/modes-sdk";
import { screenshotCountOk } from "@take/core";
import { motionStretchTarget } from "@take/export-presets";
import { getTemplates, pushHistory, saveProject } from "@take/storage";
import { currentSet, state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { downloadText, downloadZip } from "../../shared/download";
import { toast } from "../../shell/toast";
import { currentExportSize } from "./frame-render";
import { downloadSlideshowVideo } from "./slideshow-video";
import { applyDeviceFrame } from "../../editor/device/apply-device-frame";
import { selectedPresetIds } from "./mount-presets";
import { persistExportPresetIds } from "./persist-presets";
import { buildExportFiles, currentExportPlan } from "./export-zip";

export function renderValidation() {
  const set = currentSet();
  const inf = state.inference;
  const list = $("#validation-list");
  if (!list) return;
  if (!set || !inf) {
    list.innerHTML = `<li class="warn">No set selected</li>`;
    return;
  }

  applyDeviceFrame();
  const selected = selectedPresetIds();
  const plan = currentExportPlan(selected, set.frames.length);
  const { w: EXPORT_W, h: EXPORT_H } = currentExportSize();
  const count = screenshotCountOk(inf.platform, set.frames.length);
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

  list.innerHTML = checks
    .map((x) => `<li class="${x.ok ? "ok" : "warn"}">${escapeHtml(x.text)}</li>`)
    .join("");
}

export async function runExport() {
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
