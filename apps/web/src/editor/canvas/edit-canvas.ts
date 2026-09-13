/** OWNER: editor/canvas — contenteditable sync + frame render + scan assets */
import { FRAME_ROLES } from "@take/core";
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
import { toast } from "../../shell/toast";
import { applyDeviceFrame } from "../device/apply-device-frame";
import { cssObjectFitForMode } from "../device/shell-composite";
import { scanIconUrl, shotUrlAt } from "../../stages/export/selected-shots";
import { paintStripSlice, stripRecipeOfSet } from "../../stages/export/paint-strip-slice";
import { refreshStripPreview } from "../strip/strip-preview";
import { refreshSetView } from "../strip/set-view";
import { syncLayoutDrag } from "../layout/layout-drag";
import { ensureSetRecipe } from "../layout/attach-recipe";
import { renderPanoramaPicker, renderTypeBandRow } from "../inspectors/layers-inspector";
import { renderCopyMarksRow } from "../inspectors/copy-marks";
import { renderWidgetFields } from "../inspectors/widget-fields";
import { renderTiltSliders } from "../inspectors/tilt-sliders";
import { resolveExportSize } from "@take/device-catalog";
import { renderAdsThumbGrid } from "../../modes/ads/ads.plugin";
import { rasterSizeFor } from "../../shared/hidpi-raster";
import { inkForBackground } from "../../shared/contrast-ink";

export function syncFrameFromDom() {
  const frame = currentFrame();
  if (!frame) return;
  frame.kicker = ($("#shot-kicker")?.textContent || "").trim();
  frame.headline = ($("#shot-headline")?.textContent || "").trim();
  frame.caption = ($("#shot-caption")?.textContent || "").trim();
}

function applyCanvasAssets(frameIndex: number) {
  const screen = $("#phone-screen") as HTMLElement | null;
  const content = $("#shot-content") as HTMLElement | null;
  if (!screen || !content) return;

  const layoutOn = !!stripRecipeOfSet();
  const shot = layoutOn ? null : shotUrlAt(frameIndex);
  const icon = layoutOn ? null : scanIconUrl();
  const fit = cssObjectFitForMode(state.fitMode);

  let shotEl = screen.querySelector(".scan-shot-fill") as HTMLImageElement | null;
  if (shot) {
    if (!shotEl) {
      shotEl = document.createElement("img");
      shotEl.className = "scan-shot-fill";
      shotEl.alt = "";
      shotEl.referrerPolicy = "no-referrer";
      screen.insertBefore(shotEl, content);
    }
    shotEl.src = shot;
    shotEl.style.objectFit = fit;
    shotEl.hidden = false;
    screen.dataset.hasScanShot = "1";
    content.classList.add("has-scan-shot");
  } else {
    if (shotEl) shotEl.hidden = true;
    delete screen.dataset.hasScanShot;
    content.classList.remove("has-scan-shot");
  }

  // Clear legacy background-image approach
  screen.style.backgroundImage = "";
  screen.style.backgroundSize = "";
  screen.style.backgroundPosition = "";

  let badge = content.querySelector(".scan-icon-badge") as HTMLImageElement | null;
  if (icon) {
    if (!badge) {
      badge = document.createElement("img");
      badge.className = "scan-icon-badge";
      badge.alt = "App icon";
      badge.referrerPolicy = "no-referrer";
      content.prepend(badge);
    }
    badge.src = icon;
    badge.hidden = false;
  } else if (badge) {
    badge.hidden = true;
  }
}

export function renderEditor() {
  const set = currentSet();
  if (!set) return;

  applyDeviceFrame();

  const list = $("#frame-list");
  if (list) {
    list.innerHTML = set.frames
      .map(
        (f, i) => `<li>
        <button type="button" class="${i === state.activeFrame ? "is-active" : ""}" data-frame="${i}">
          <span>${String(i + 1).padStart(2, "0")} ${escapeHtml(f.role)}</span>
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
        ? `AD SET · ${set.frames.filter((f) => f.adUnitId).length} unit${set.frames.length === 1 ? "" : "s"}`
        : state.editView === "set"
          ? `SET · ${set.frames.length} frames · store carousel`
          : `FRAME ${String(frame.index + 1).padStart(2, "0")} · ${frame.role}`;
  }
  const k = $("#shot-kicker");
  const h = $("#shot-headline");
  const c = $("#shot-caption");
  if (k) k.textContent = frame.kicker;
  if (h) h.textContent = frame.headline;
  if (c) c.textContent = frame.caption;

  applyCanvasAssets(state.activeFrame);
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
  renderCopyMarksRow();
  renderWidgetFields();
  renderTiltSliders();
}

async function syncLayoutStage() {
  const phone = $("#phone-mock") as HTMLElement | null;
  const stage = $("#layout-stage") as HTMLElement | null;
  const adsStage = $("#ads-edit-stage") as HTMLElement | null;
  const canvas = $("#layout-slice-canvas") as HTMLCanvasElement | null;
  const screen = $("#phone-screen") as HTMLElement | null;
  const content = $("#shot-content") as HTMLElement | null;
  const recipe = stripRecipeOfSet();
  if (!phone || !stage || !canvas || !screen || !content) return;

  document.body.classList.toggle("is-ads-edit", state.mode === "ads");

  if (state.mode === "ads") {
    phone.hidden = true;
    stage.hidden = true;
    if (adsStage) {
      adsStage.hidden = false;
      renderAdsThumbGrid(adsStage);
    }
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

  if (state.editView === "set") {
    phone.hidden = true;
    stage.hidden = true;
    syncLayoutDrag();
    return;
  }

  if (recipe) {
    phone.hidden = true;
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
  } else {
    phone.hidden = false;
    stage.hidden = true;
    content.style.removeProperty("--slice-ink");
    content.style.removeProperty("--slice-ink-dim");
    content.style.removeProperty("--slice-ink-accent");
    screen.appendChild(content);
    syncLayoutDrag();
  }
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
  if (stripRecipeOfSet()) ensureSetRecipe();
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
  if (stripRecipeOfSet()) ensureSetRecipe();
  renderEditor();
  toast("Frame removed");
}

export function regenFrame() {
  const frame = currentFrame();
  if (!frame) return;
  const alts = [
    "A sharper cut",
    "One honest beat",
    "Less chrome. More signal.",
    "Proof over polish",
    "Open. Act. Leave.",
  ];
  frame.headline = alts[Math.floor(Math.random() * alts.length)];
  frame.caption = state.inference?.value || frame.caption;
  renderEditor();
  toast("Frame regenerated");
}
