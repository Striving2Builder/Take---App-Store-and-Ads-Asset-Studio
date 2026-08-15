/** OWNER: app — wire modules and DOM events */
import { pushHistory } from "@take/storage";
import { state } from "./app-state";
import { onStageEnter, showStage } from "./stage-machine";
import { bindNavJumps } from "../shell/nav";
import { toast } from "../shell/toast";
import { $, $$ } from "../shared/dom";
import { bindMissingWatchers, updateMissing } from "../stages/intake/intake.missing";
import { bindUploads } from "../stages/intake/intake.uploads";
import { bindScanReceiptTabs } from "../stages/intake/scan-receipt";
import { mountLocaleSwitcher } from "../stages/intake/scan-locale";
import { mountScanSources } from "../stages/intake/scan-sources";
import { bindUserProvenance } from "../stages/intake/user-provenance";
import { bindIntakeActions } from "../stages/intake/intake.actions";
import { hydrateScanSession } from "../stages/intake/scan-pipeline";
import { renderReview } from "../stages/review/review.render";
import {
  addFrame,
  regenFrame,
  removeFrame,
  renderEditor,
  syncFrameFromDom,
} from "../editor/canvas/edit-canvas";
import { bindMetaFields } from "../editor/inspectors/copy-inspector";
import { bindStyleInspector } from "../editor/inspectors/style-inspector";
import { bindLayerToggles } from "../editor/layers/layer-toggles";
import { mountDevicePicker } from "../editor/device/device-picker";
import {
  exportLibrary,
  renderValidation,
  runExport,
  saveCurrentProject,
} from "../stages/export/export.controller";
import { handleLibraryAction, renderLibrary } from "../stages/library/library.render";
import { bindTemplateModal, openSaveTemplateModal } from "../library-ui/template-save";
import { mountTruthLayer, mountTruthBadges } from "../shell/truth-layer";
import { registerModes } from "../modes/register-modes";
import { generateSets } from "../modes/wizard/sets-builder";

function bindGlobalClicks() {
  document.addEventListener("click", (e) => {
    const t = e.target as Element;

    const modePick = t.closest("[data-mode-pick]") as HTMLElement | null;
    if (modePick) {
      const m = modePick.dataset.modePick || "wizard";
      const radio = $(`input[name="mode"][value="${m}"]`) as HTMLInputElement | null;
      if (radio) radio.checked = true;
      state.mode = m;
      showStage("intake");
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
      renderEditor();
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
      $$(".filter").forEach((el) => el.classList.toggle("on", el === filter));
      renderLibrary();
      return;
    }

    const tplAction = t.closest(".tpl-actions [data-action]") as HTMLElement | null;
    if (tplAction) {
      const card =
        (tplAction.closest("[data-tpl]") as HTMLElement | null) ||
        (tplAction.closest("[data-project]") as HTMLElement | null);
      const id = card?.dataset.tpl || card?.dataset.project;
      if (id) void handleLibraryAction(id, tplAction.dataset.action || "");
    }
  });
}

function bindEditorActions() {
  $("#btn-to-edit")?.addEventListener("click", () => {
    renderEditor();
    showStage("edit");
  });
  $("#btn-regen-all")?.addEventListener("click", async () => {
    if (!state.inference) return;
    toast("Refreshing all structural variants…");
    state.sets = generateSets(state.inference, state.qty, state.deviceId, {
      seedPalette: state.scanPalette?.swatches.map((s) => s.hex),
    });
    state.selectedSet = 0;
    renderReview();
    pushHistory("regen.all", "sets");
  });
  $("#btn-regen-frame")?.addEventListener("click", regenFrame);
  $("#btn-remove-frame")?.addEventListener("click", removeFrame);
  $("#btn-add-frame")?.addEventListener("click", addFrame);
  $("#btn-add-copy")?.addEventListener("click", () =>
    toast("Copy block added to layers (editable on canvas)")
  );
  $("#btn-add-visual")?.addEventListener("click", () =>
    toast("Visual element slot added — drop an asset anytime")
  );
  $("#btn-refresh-variant")?.addEventListener("click", () => {
    const set = state.sets[state.selectedSet];
    if (!set || !state.inference) return;
    const next = generateSets(state.inference, 1, state.deviceId, {
      seedPalette: state.scanPalette?.swatches.map((s) => s.hex),
    })[0];
    set.frames = next.frames;
    set.palette = next.palette;
    set.blurb = "Refreshed structural variant — same brief, new composition.";
    state.activeFrame = 0;
    renderEditor();
    toast("Structural variant refreshed");
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

export function startApp() {
  registerModes();
  bindNavJumps();
  bindGlobalClicks();
  bindMissingWatchers();
  bindUploads();
  bindUserProvenance();
  bindIntakeActions();
  bindEditorActions();
  bindExportActions();
  bindMetaFields();
  bindStyleInspector();
  bindScanReceiptTabs();
  bindLayerToggles();
  bindTemplateModal();
  mountDevicePicker();
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
    if (name === "export") {
      if (state.mode === "slideshow") {
        const box = $$<HTMLInputElement>("#export-presets input").find(
          (el) => el.value === "slideshow"
        );
        if (box) box.checked = true;
      }
      renderValidation();
    }
    if (name === "review" || name === "edit") mountTruthBadges();
  });

  document.documentElement.style.setProperty("--signal", "#ff4d1a");
  document.documentElement.style.setProperty("--project-accent", "#ff4d1a");
}
