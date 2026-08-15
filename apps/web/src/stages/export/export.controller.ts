/** OWNER: stages/export — PNG frame render + ZIP export + project save + motion */
import { screenshotCountOk } from "@take/core";
import { getTemplates, pushHistory, saveProject } from "@take/storage";
import { currentSet, state } from "../../app/app-state";
import { $, $$ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { downloadText, downloadZip } from "../../shared/download";
import { toast } from "../../shell/toast";
import { EXPORT_H, EXPORT_W, renderFramePng } from "./frame-render";
import { downloadSlideshowVideo } from "./slideshow-video";

export function renderValidation() {
  const set = currentSet();
  const inf = state.inference;
  const list = $("#validation-list");
  if (!list) return;
  if (!set || !inf) {
    list.innerHTML = `<li class="warn">No set selected</li>`;
    return;
  }

  const count = screenshotCountOk(inf.platform, set.frames.length);
  const c = set.copy;
  const hasShots = Boolean(
    state.lastScan?.capture?.assets?.some((a) => a.kind === "screenshot")
  );
  const wantsMotion =
    state.mode === "slideshow" ||
    $$<HTMLInputElement>("#export-presets input:checked").some((el) => el.value === "slideshow");
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
        ? `Scan assets available · PNG export ${EXPORT_W}×${EXPORT_H}`
        : `PNG export ${EXPORT_W}×${EXPORT_H} (composition render; add scan shots for photo bg)`,
    },
    {
      ok: true,
      text: wantsMotion
        ? "Motion export: MediaRecorder WebM/MP4 (~15s) when Slideshow preset or mode is on"
        : `Locale pack ${inf.locale} · local-first storage`,
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

  const selected = $$<HTMLInputElement>("#export-presets input:checked").map((el) => el.value);
  const wantMotion = selected.includes("slideshow") || state.mode === "slideshow";

  toast("Rendering PNG frames…");
  try {
    const files: { name: string; data: Uint8Array | string }[] = [];
    for (let i = 0; i < set.frames.length; i++) {
      files.push(await renderFramePng(i));
    }
    const stamp = new Date().toISOString().slice(0, 10);
    const slug = (inf.name || "app").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    files.push({
      name: "metadata/manifest.json",
      data: JSON.stringify(
        {
          app: inf.name,
          set: set.name,
          deviceId: state.deviceId,
          locale: inf.locale,
          presets: selected,
          frameCount: set.frames.length,
          size: { w: EXPORT_W, h: EXPORT_H },
          stamped: stamp,
          motion: wantMotion,
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
    pushHistory("export.zip", `${set.frames.length} png`);
    toast(`Exported ${set.frames.length} PNG frames + manifest`);

    if (wantMotion) {
      toast("Recording slideshow video…");
      const name = await downloadSlideshowVideo((msg) => toast(msg));
      pushHistory("export.video", name);
      toast(`Downloaded motion file ${name}`);
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
    await saveProject({
      id,
      name: inf.name || "Untitled project",
      updatedAt: new Date().toISOString(),
      payload: {
        inference: inf,
        sets: state.sets,
        deviceId: state.deviceId,
        platform: state.platform,
        mode: state.mode,
        selectedSet: state.selectedSet,
        activeFrame: state.activeFrame,
        lastScan: state.lastScan,
        lastPack: state.lastPack,
        scanPalette: state.scanPalette,
        selectedShotIds: state.selectedShotIds,
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
