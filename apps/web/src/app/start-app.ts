/** OWNER: app — wire modules and DOM events */
import { pushHistory } from "@take/storage";
import { state } from "./app-state";
import { onStageEnter, showStage } from "./stage-machine";
import { bindNavJumps } from "../shell/nav";
import { toast } from "../shell/toast";
import { $, $$ } from "../shared/dom";
import { bindMissingWatchers, updateMissing } from "../stages/intake/intake.missing";
import { bindUploads, handleFiles } from "../stages/intake/intake.uploads";
import { bindScanReceiptTabs } from "../stages/intake/scan-receipt";
import { mountLocaleSwitcher } from "../stages/intake/scan-locale";
import { mountScanSources } from "../stages/intake/scan-sources";
import { bindUserProvenance } from "../stages/intake/user-provenance";
import { bindIntakeActions } from "../stages/intake/intake.actions";
import { hydrateScanSession } from "../stages/intake/scan-pipeline";
import { renderReview } from "../stages/review/review.render";
import {
  addFrame,
  handleRedo,
  handleUndo,
  regenFrame,
  removeFrame,
  renderEditor,
  syncFrameFromDom,
} from "../editor/canvas/edit-canvas";
import { isTypingTarget } from "../shared/typing-target";
import { bindMetaFields } from "../editor/inspectors/copy-inspector";
import { bindStyleInspector } from "../editor/inspectors/style-inspector";
import { bindPaletteWheel } from "../editor/inspectors/palette-wheel";
import { bindLayoutDrag, onLayoutSelection } from "../editor/layout/layout-drag";
import { ensureSetRecipe } from "../editor/layout/attach-recipe";
import { addCopyOrVisual, applyPanoramaFromPicker, bindChromeExtras, bindElementsList, renderElementsList } from "../editor/inspectors/layers-inspector";
import { bindCopyMarks, renderCopyMarksRow } from "../editor/inspectors/copy-marks";
import { bindWidgetFields, renderWidgetFields } from "../editor/inspectors/widget-fields";
import { bindTiltSliders, renderTiltSliders } from "../editor/inspectors/tilt-sliders";
import { bindFitRow, renderFitRow } from "../editor/inspectors/fit-toggle";
import { bindPositionPresets } from "../editor/inspectors/position-presets";
import { mountDevicePicker, syncDevicePickerValue } from "../editor/device/device-picker";
import { mountOrientationControl, syncOrientationUi } from "../editor/device/orientation-control";
import { mountShellViewControl } from "../editor/device/shell-view-control";
import {
  mountStoreTargetControl,
  syncStoreTargetUi,
} from "../editor/device/store-target-control";
import { openDevicePreview } from "../editor/device/preview-devices";
import { mountCatalogWizard } from "../stages/catalog/catalog-wizard";
import { mountExportPresets } from "../stages/export/mount-presets";
import {
  exportLibrary,
  renderValidation,
  runExport,
  saveCurrentProject,
} from "../stages/export/export.controller";
import { handleLibraryAction, renderLibrary } from "../stages/library/library.render";
import { bindLibraryPreview } from "../stages/library/library-preview";
import { bindTemplateModal, openSaveTemplateModal } from "../library-ui/template-save";
import { mountTruthLayer, mountTruthBadges } from "../shell/truth-layer";
import { registerModes } from "../modes/register-modes";
import { applyModeRunResult, runActiveMode } from "../modes/run-active-mode";
import { mountModePlugins, syncModePluginHighlights } from "../modes/mode-plugins";
import { applyExportHints } from "../modes/apply-export-hints";
import { bindTemplateArm, syncTemplateArm } from "../modes/template/template-arm";
import { syncAdsIntakeUi } from "../stages/intake/intake-ad-units";

function bindGlobalClicks() {
  document.addEventListener("click", (e) => {
    const t = e.target as Element;

    const modePick = t.closest("[data-mode-pick]") as HTMLElement | null;
    if (modePick) {
      const m = modePick.dataset.modePick || "wizard";
      if (m === "template") {
        showStage("library");
        void renderLibrary();
        toast("Library — pick a look");
        return;
      }
      const radio = $(`input[name="mode"][value="${m}"]`) as HTMLInputElement | null;
      if (radio) radio.checked = true;
      state.mode = m;
      showStage("intake");
      syncTemplateArm();
      syncAdsIntakeUi();
      updateMissing();
      toast(`${modePick.querySelector("h2")?.textContent || m} mode armed`);
      return;
    }

    const setCard = t.closest("#set-rail [data-set]") as HTMLElement | null;
    if (setCard) {
      state.selectedSet = Number(setCard.dataset.set);
      renderReview();
      return;
    }

    const frameBtn = t.closest("[data-frame]") as HTMLElement | null;
    if (frameBtn) {
      syncFrameFromDom();
      state.activeFrame = Number(frameBtn.dataset.frame);
      if (frameBtn.closest("#set-stage")) state.editView = "slice";
      renderEditor();
      syncModePluginHighlights();
      return;
    }

    const metaLink = t.closest(".meta-link") as HTMLElement | null;
    if (metaLink) {
      $$(".meta-link").forEach((el) => el.classList.toggle("is-active", el === metaLink));
      $$<HTMLElement>("[data-panel-view]").forEach((panel) => {
        const on = panel.dataset.panelView === metaLink.dataset.panel;
        panel.hidden = !on;
        panel.classList.toggle("is-active", on);
      });
      return;
    }

    const filter = t.closest("[data-filter]") as HTMLElement | null;
    if (filter) {
      state.filter = filter.dataset.filter || "all";
      $$("[data-filter]").forEach((el) => el.classList.toggle("on", el === filter));
      renderLibrary();
      return;
    }

    const compositionFilter = t.closest("[data-composition]") as HTMLElement | null;
    if (compositionFilter) {
      state.compositionFilter = compositionFilter.dataset.composition || "all";
      $$("[data-composition]").forEach((el) => el.classList.toggle("on", el === compositionFilter));
      renderLibrary();
      return;
    }

    const frameCountFilter = t.closest("[data-frame-count]") as HTMLElement | null;
    if (frameCountFilter) {
      state.frameCountFilter = frameCountFilter.dataset.frameCount || "all";
      $$("[data-frame-count]").forEach((el) => el.classList.toggle("on", el === frameCountFilter));
      renderLibrary();
      return;
    }

    const tplAction = t.closest("[data-action]") as HTMLElement | null;
    if (tplAction) {
      if (tplAction.dataset.action === "upload-more") {
        $<HTMLElement>("#library-upload-shots")?.click();
        return;
      }
      const card =
        (tplAction.closest("[data-tpl]") as HTMLElement | null) ||
        (tplAction.closest("[data-project]") as HTMLElement | null);
      const id = card?.dataset.tpl || card?.dataset.project;
      if (id) {
        void handleLibraryAction(id, tplAction.dataset.action || "");
        return;
      }
    }
  });
}

function bindEditorActions() {
  $("#btn-to-edit")?.addEventListener("click", () => {
    // Show before painting — renderEditor() measures on-screen canvas sizes
    // to raster sharply; while the stage is still hidden, that reads 0.
    showStage("edit");
    renderEditor();
    mountModePlugins();
  });
  $("#btn-regen-all")?.addEventListener("click", async () => {
    if (!state.inference) return;
    toast("Refreshing…");
    try {
      const result = await runActiveMode();
      applyModeRunResult(result);
      syncDevicePickerValue();
      syncOrientationUi();
      renderReview();
      pushHistory("regen.all", "sets");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Regenerate failed");
    }
  });
  $("#btn-regen-frame")?.addEventListener("click", regenFrame);
  $("#btn-remove-frame")?.addEventListener("click", removeFrame);
  $("#btn-add-frame")?.addEventListener("click", addFrame);
  $("#btn-undo")?.addEventListener("click", handleUndo);
  $("#btn-redo")?.addEventListener("click", handleRedo);
  document.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey) || isTypingTarget(e.target)) return;
    if (e.key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    } else if (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey)) {
      e.preventDefault();
      handleRedo();
    }
  });
  $("#btn-add-copy")?.addEventListener("click", () => {
    const err = addCopyOrVisual("copy");
    toast(err || "Copy block on this slice — drag on the canvas");
    if (!err) {
      state.editView = "slice";
      renderEditor();
    }
  });
  $("#btn-add-visual")?.addEventListener("click", () => {
    const err = addCopyOrVisual("visual");
    toast(err || "Visual slot on this slice — drag on the canvas");
    if (!err) {
      state.editView = "slice";
      renderEditor();
    }
  });
  $("#btn-strip-panorama")?.addEventListener("click", () => {
    const err = applyPanoramaFromPicker();
    toast(err || "Strip panorama — N clips from one world image");
    if (!err) renderEditor();
  });
  $("#edit-view-control")?.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest("[data-edit-view]") as HTMLElement | null;
    if (!btn?.dataset.editView) return;
    state.editView = btn.dataset.editView === "set" ? "set" : "slice";
    if (state.editView === "set") ensureSetRecipe();
    renderEditor();
  });
  $("#btn-refresh-variant")?.addEventListener("click", async () => {
    const set = state.sets[state.selectedSet];
    if (!set || !state.inference) return;
    toast("Refreshing variant…");
    try {
      const result = await runActiveMode();
      const next = result.sets[state.selectedSet] || result.sets[0];
      if (!next) return;
      set.frames = next.frames;
      set.palette = next.palette;
      set.blurb = next.blurb;
      set.styleLabel = next.styleLabel;
      set.name = next.name;
      set.composition = next.composition;
      set.layout = next.layout;
      state.activeFrame = 0;
      renderEditor();
      mountModePlugins();
      toast("Structural variant refreshed");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Refresh failed");
    }
  });
  ["#shot-kicker", "#shot-headline", "#shot-caption"].forEach((sel) => {
    $(sel)?.addEventListener("blur", syncFrameFromDom);
  });
  $("#btn-to-export")?.addEventListener("click", () => {
    syncFrameFromDom();
    showStage("export");
  });
  $("#btn-save-template")?.addEventListener("click", openSaveTemplateModal);
  $("#btn-save-project")?.addEventListener("click", () => {
    void saveCurrentProject();
  });
}

function bindExportActions() {
  $("#btn-export")?.addEventListener("click", () => {
    void runExport();
  });
  $("#btn-export-library")?.addEventListener("click", exportLibrary);
}

function bindLibraryUploads() {
  $("#library-upload-shots")?.addEventListener("change", async (e) => {
    await handleFiles((e.target as HTMLInputElement).files);
    const count = $("#library-upload-count");
    if (count) count.textContent = `${state.uploads.length} added`;
    const { renderLibrary } = await import("../stages/library/library.render");
    await renderLibrary();
  });
}

function bindLibraryDraftToggle() {
  const toggle = $("#filter-hide-drafts") as HTMLInputElement | null;
  toggle?.addEventListener("change", () => {
    state.hideDrafts = toggle.checked;
    renderLibrary();
  });
}

export function startApp() {
  registerModes();
  bindNavJumps();
  bindGlobalClicks();
  bindMissingWatchers();
  bindUploads();
  bindLibraryUploads();
  bindLibraryDraftToggle();
  bindUserProvenance();
  bindIntakeActions();
  bindEditorActions();
  bindExportActions();
  bindMetaFields();
  bindStyleInspector();
  bindPaletteWheel();
  bindScanReceiptTabs();
  bindLayoutDrag();
  onLayoutSelection(() => {
    renderCopyMarksRow();
    renderWidgetFields();
    renderTiltSliders();
    renderFitRow();
    renderElementsList();
  });
  bindCopyMarks();
  bindWidgetFields();
  bindTiltSliders();
  bindFitRow();
  bindPositionPresets();
  bindElementsList();
  bindChromeExtras(() => {
    state.editView = "slice";
    renderEditor();
  });
  bindTemplateModal();
  bindLibraryPreview();
  bindTemplateArm();
  mountDevicePicker({
    onChange: () => {
      renderEditor();
      void renderValidation();
    },
  });
  const onDeviceUi = () => {
    renderEditor();
    void renderValidation();
  };
  mountStoreTargetControl({ onChange: onDeviceUi });
  mountOrientationControl({ onChange: onDeviceUi });
  mountShellViewControl({ onChange: onDeviceUi });
  mountCatalogWizard();
  mountExportPresets({ onChange: () => void renderValidation() });
  $("#btn-device-preview")?.addEventListener("click", () => openDevicePreview());
  $("#btn-device-preview-nav")?.addEventListener("click", () => openDevicePreview());
  $("#btn-device-preview-lib")?.addEventListener("click", () => openDevicePreview());
  $("#btn-device-preview-cat")?.addEventListener("click", () => openDevicePreview());
  mountLocaleSwitcher();
  mountScanSources();
  hydrateScanSession();
  updateMissing();
  mountTruthLayer();

  onStageEnter((name) => {
    if (name === "library") {
      void renderLibrary();
      mountTruthBadges();
    }
    if (name === "catalog") mountTruthBadges();
    if (name === "export") {
      applyExportHints();
      void renderValidation();
    }
    if (name === "edit") {
      syncDevicePickerValue();
      syncOrientationUi();
      syncStoreTargetUi();
      mountModePlugins();
      const modeLink = $("#mode-panel-link") as HTMLElement | null;
      if (modeLink && !modeLink.hidden && state.mode !== "wizard") {
        modeLink.click();
      }
      mountTruthBadges();
    }
    if (name === "review") {
      mountModePlugins();
      mountTruthBadges();
    }
  });

  // Seed --project-accent (read by CSS before any real project/palette is
  // loaded) from the actual current --signal token, not a hardcoded hex —
  // a literal here silently wins over tokens.css forever via inline-style
  // specificity, which is exactly how this line kept forcing the old
  // orange onto every boot even after tokens.css moved on. --signal itself
  // is never touched from JS; it's tokens.css's value alone.
  const bootAccent = getComputedStyle(document.documentElement).getPropertyValue("--signal").trim();
  if (bootAccent) document.documentElement.style.setProperty("--project-accent", bootAccent);
}
