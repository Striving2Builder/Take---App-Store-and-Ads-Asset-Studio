/** OWNER: editor/canvas — contenteditable sync + frame render + scan assets */
import { FRAME_ROLES } from "@take/core";

// Display-only: FRAME_ROLES stays SCREAMING_CASE for internal matching, but
// the mockup's UI chrome never renders labels in all caps (that mono/uppercase
// skin was the "engineering tool" look flagged for removal).
function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
import { currentFrame, currentSet, state } from "../../app/app-state";
import { $, $$ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { renderMetaFields } from "../inspectors/copy-inspector";
import {
  applyProjectAccent,
  renderPalette,
  refreshScanPaletteSlot,
} from "../inspectors/style-inspector";
import { goalCta } from "../../modes/wizard/copy-builder";
import { pickHeadline } from "../../modes/wizard/frames-builder";
import { toast } from "../../shell/toast";
import { applyDeviceFrame } from "../device/apply-device-frame";
import { paintStripSlice, stripRecipeOfSet } from "../../stages/export/paint-strip-slice";
import { refreshStripPreview } from "../strip/strip-preview";
import { refreshSetView } from "../strip/set-view";
import { syncLayoutDrag } from "../layout/layout-drag";
import { ensureSetRecipe } from "../layout/attach-recipe";
import { renderElementsList, renderPanoramaPicker, renderTypeBandRow } from "../inspectors/layers-inspector";
import { renderCopyMarksRow } from "../inspectors/copy-marks";
import { renderWidgetFields } from "../inspectors/widget-fields";
import { renderTiltSliders } from "../inspectors/tilt-sliders";
import { renderFitRow } from "../inspectors/fit-toggle";
import { resolveExportSize } from "@take/device-catalog";
import { renderAdsFocusedPreview, renderAdsUnitRail } from "../../modes/ads/ads.plugin";
import { rasterSizeFor } from "../../shared/hidpi-raster";
import { inkForBackground } from "../../shared/contrast-ink";
import {
  applyRestoredSet,
  beginRestore,
  commitHistory,
  endRestore,
  redo,
  syncHistoryButtons,
  undo,
} from "../history/edit-history";

export function syncFrameFromDom() {
  const frame = currentFrame();
  if (!frame) return;
  frame.kicker = ($("#shot-kicker")?.textContent || "").trim();
  frame.headline = ($("#shot-headline")?.textContent || "").trim();
  frame.caption = ($("#shot-caption")?.textContent || "").trim();
}

export function renderEditor() {
  const set = currentSet();
  if (!set) return;
  // Guarantee a recipe before anything renders: the canvas-painted path
  // (paintStripSlice via #layout-stage) is now the only rendering model —
  // #phone-mock's raw-screenshot DOM path is retired, not just unused.
  if (state.mode !== "ads") ensureSetRecipe();

  applyDeviceFrame();

  const list = $("#frame-list");
  if (list) {
    list.innerHTML = set.frames
      .map(
        (f, i) => `<li>
        <button type="button" class="${i === state.activeFrame ? "is-active" : ""}" data-frame="${i}">
          <span class="frame-num mono">${String(i + 1).padStart(2, "0")}</span>
          <span class="frame-role">${escapeHtml(roleLabel(f.role))}</span>
        </button>
      </li>`
      )
      .join("");
  }

  const frame = currentFrame();
  if (!frame) return;
  const label = $("#canvas-label");
  if (label) {
    label.textContent =
      state.mode === "ads"
        ? `Ad set · ${set.frames.filter((f) => f.adUnitId).length} unit${set.frames.length === 1 ? "" : "s"}`
        : state.editView === "set"
          ? `Set · ${set.frames.length} frames · store carousel`
          : `Frame ${String(frame.index + 1).padStart(2, "0")} · ${roleLabel(frame.role)}`;
  }
  const k = $("#shot-kicker");
  const h = $("#shot-headline");
  const c = $("#shot-caption");
  if (k) k.textContent = frame.kicker;
  if (h) h.textContent = frame.headline;
  if (c) c.textContent = frame.caption;

  applyProjectAccent(set.palette[0]);
  renderMetaFields(set.copy);
  renderPalette(set.palette);
  refreshScanPaletteSlot();
  const styleSel = $("#edit-style") as HTMLSelectElement | null;
  if (styleSel) styleSel.value = set.style;
  const locale = $("#export-locale");
  if (locale) locale.textContent = state.inference?.locale || "en-US";
  void syncLayoutStage();
  void refreshStripPreview();
  void refreshSetView();
  renderPanoramaPicker();
  renderTypeBandRow();
  renderElementsList();
  renderCopyMarksRow();
  renderWidgetFields();
  renderTiltSliders();
  renderFitRow();
  commitHistory();
  syncHistoryButtons();
}

/** #layout-stage (canvas-painted, export-accurate) is the only rendering
 *  model now. #phone-mock stays in the DOM only until the shell rebuild
 *  physically removes it; this function never shows it. */
async function syncLayoutStage() {
  const phone = $("#phone-mock") as HTMLElement | null;
  const stage = $("#layout-stage") as HTMLElement | null;
  const adsStage = $("#ads-edit-stage") as HTMLElement | null;
  const canvas = $("#layout-slice-canvas") as HTMLCanvasElement | null;
  const content = $("#shot-content") as HTMLElement | null;
  const recipe = stripRecipeOfSet();
  if (!phone || !stage || !canvas || !content) return;
  phone.hidden = true;

  document.body.classList.toggle("is-ads-edit", state.mode === "ads");

  if (state.mode === "ads") {
    stage.hidden = true;
    if (adsStage) {
      adsStage.hidden = false;
      void renderAdsFocusedPreview(adsStage);
    }
    renderAdsUnitRail();
    const activePanel = document.querySelector(".meta-link.is-active") as HTMLElement | null;
    if (activePanel?.dataset.panel === "copy" || activePanel?.dataset.panel === "layers") {
      $$(".meta-link").forEach((el) => el.classList.toggle("is-active", el.getAttribute("data-panel") === "mode"));
      $$<HTMLElement>("[data-panel-view]").forEach((panel) => {
        const on = panel.dataset.panelView === "mode";
        panel.hidden = !on;
        panel.classList.toggle("is-active", on);
      });
    }
    return;
  }
  if (adsStage) adsStage.hidden = true;
  const railEl = $("#ads-unit-rail") as HTMLElement | null;
  if (railEl) railEl.hidden = true;

  if (state.editView === "set") {
    stage.hidden = true;
    syncLayoutDrag();
    return;
  }

  // renderEditor() calls ensureSetRecipe() before this runs, so a non-ads
  // set always has one here — no fallback branch needed.
  if (!recipe) return;
  stage.hidden = false;
  stage.appendChild(content);
  const ink = inkForBackground(recipe.background.colorA, recipe.background.colorB);
  content.style.setProperty("--slice-ink", ink.text);
  content.style.setProperty("--slice-ink-dim", ink.dim);
  content.style.setProperty("--slice-ink-accent", ink.accent);
  const { w, h } = resolveExportSize(state.deviceId, state.platform, state.orientation).size;
  const cw = rasterSizeFor(stage.clientWidth, window.devicePixelRatio || 1, 264);
  await paintStripSlice(canvas, state.activeFrame, {
    w: cw,
    h: Math.round(cw * (h / w)),
    skipType: true,
    recipe,
    frames: currentSet()?.frames,
    palette: currentSet()?.palette,
  });
  syncLayoutDrag();
}

export function addFrame() {
  const set = currentSet();
  if (!set) return;
  if (set.frames.length >= 12) {
    toast("Max 12 frames in a sequence");
    return;
  }
  const i = set.frames.length;
  const role = FRAME_ROLES[i] || "EXTRA";
  set.frames.push({
    id: `f-new-${Date.now()}`,
    index: i,
    role,
    kicker: `${String(i + 1).padStart(2, "0")} · ${role}`,
    headline: "New beat",
    caption: "Edit this frame",
    cta: goalCta(state.inference?.goal || "install"),
    dwellMs: state.mode === "slideshow" ? 2000 : undefined,
  });
  state.activeFrame = i;
  renderEditor();
  toast("Frame added");
}

export function removeFrame() {
  const set = currentSet();
  if (!set || set.frames.length <= 1) {
    toast("Keep at least one frame");
    return;
  }
  set.frames.splice(state.activeFrame, 1);
  set.frames.forEach((f, i) => {
    f.index = i;
    f.kicker = `${String(i + 1).padStart(2, "0")} · ${f.role}`;
  });
  state.activeFrame = Math.min(state.activeFrame, set.frames.length - 1);
  renderEditor();
  toast("Frame removed");
}

export function regenFrame() {
  const frame = currentFrame();
  const inf = state.inference;
  if (!frame) return;
  if (!inf) {
    toast("Scan or fill Advanced first — regenerate needs a brief to draw from");
    return;
  }
  const [headline, caption] = pickHeadline(inf, frame.headline);
  frame.headline = headline;
  frame.caption = caption;
  renderEditor();
  toast("Frame regenerated");
}

function afterHistoryJump(restored: ReturnType<typeof undo>, label: string) {
  if (!restored) {
    toast(`Nothing to ${label.toLowerCase()}`);
    return;
  }
  applyRestoredSet(restored);
  state.activeFrame = Math.min(state.activeFrame, restored.frames.length - 1);
  beginRestore();
  renderEditor();
  endRestore();
  toast(label);
}

export function handleUndo() {
  afterHistoryJump(undo(), "Undone");
}

export function handleRedo() {
  afterHistoryJump(redo(), "Redone");
}
