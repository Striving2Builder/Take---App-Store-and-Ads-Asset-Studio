/** OWNER: editor/inspectors — extra slots + panorama picker + type band */
import {
  addExtraSlot,
  EXTRA_SHAPES,
  EXTRA_WIDGETS,
  extrasInSlice,
  setSliceTypeBand,
  slicesTouched,
  typeBandForSlice,
  type ExtraKind,
  type ExtraShape,
  type ExtraSlot,
  type ExtraWidget,
  type TypeBandKind,
} from "@take/template-engine";
import { resolveExportSize } from "@take/device-catalog";
import { currentSet, state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { selectedScreenshots, shotUrlAt } from "../../stages/export/selected-shots";
import { stripRecipeOfSet } from "../../stages/export/paint-strip-slice";
import { toast } from "../../shell/toast";
import { applyPanoramaToSet, attachRecipeToSet, ensureSetRecipe } from "../layout/attach-recipe";
import {
  selectedLayoutDeviceId,
  selectedLayoutExtraId,
  selectLayoutDevice,
  selectLayoutExtra,
} from "../layout/layout-drag";
import { applySliceRule } from "./slice-rules";
import { selectNewestCopy } from "./copy-marks";
import { selectNewestWidget } from "./widget-fields";

export function focusLayersPanel() {
  document.querySelector<HTMLElement>('.meta-link[data-panel="layers"]')?.click();
}

type AssetOpt = { url: string; label: string };

function panoramaAssets(): AssetOpt[] {
  const shots = selectedScreenshots()
    .filter((a) => a.url && !a.url.startsWith("blob:"))
    .map((a, i) => ({ url: a.url, label: `Scan shot ${i + 1}` }));
  const ups = state.uploads
    .filter((u) => u.url && !u.url.startsWith("blob:"))
    .map((u) => ({ url: u.url, label: u.name || "Upload" }));
  return [...shots, ...ups];
}

export function renderPanoramaPicker() {
  const sel = $("#panorama-asset") as HTMLSelectElement | null;
  if (!sel) return;
  const assets = panoramaAssets();
  const current = stripRecipeOfSet()?.background.kind === "image" ? stripRecipeOfSet()?.background.imageUrl || "" : "";
  const selected = assets.findIndex((a) => a.url === current);
  sel.innerHTML =
    `<option value="">— pick an image —</option>` +
    assets.map((a, i) => `<option value="${i}">${escapeHtml(a.label)}</option>`).join("");
  if (selected >= 0) sel.value = String(selected);
}

export function renderTypeBandRow() {
  const host = $("#type-band-row");
  if (!host) return;
  const recipe = stripRecipeOfSet();
  const current: TypeBandKind = recipe ? typeBandForSlice(recipe, state.activeFrame) : "top";
  host.querySelectorAll<HTMLElement>("[data-type-band]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.typeBand === current);
  });
}

const DEVICE_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="2" width="10" height="20" rx="2.5"/></svg>';
const TEXT_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="9" y1="20" x2="15" y2="20"/></svg>';
const SHAPE_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg>';
const PROOF_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"/></svg>';

function extraDescriptor(extra: ExtraSlot): { name: string; type: string; icon: string; color: string } {
  if (extra.widget) {
    const label = extra.widget.charAt(0).toUpperCase() + extra.widget.slice(1);
    return { name: label, type: "Proof", icon: PROOF_ICON, color: "var(--good)" };
  }
  if (extra.shape) {
    const label = extra.shape.charAt(0).toUpperCase() + extra.shape.slice(1);
    return { name: label, type: "Shape", icon: SHAPE_ICON, color: "var(--cyan)" };
  }
  return { name: "Text", type: "Text", icon: TEXT_ICON, color: "var(--warn)" };
}

/** Real "Elements on this frame" list — every row is a live device/extra on
 *  the active slice, not a static mockup of one. Reuses the same selection
 *  API the canvas drag/toolbar already use, so clicking a row and clicking
 *  the element on canvas are the same selection state, not two systems. */
export function renderElementsList() {
  const host = $("#elements-list");
  if (!host) return;
  const recipe = stripRecipeOfSet();
  if (!recipe) {
    host.innerHTML = "";
    return;
  }
  const slice = state.activeFrame;
  const { w, h } = resolveExportSize(state.deviceId, state.platform, state.orientation).size;
  const devices = recipe.devices.filter((d) => slicesTouched(d, recipe.frameCount, w, h).includes(slice));
  const extras = extrasInSlice(recipe, slice);

  const selDevice = selectedLayoutDeviceId();
  const selExtra = selectedLayoutExtraId();

  const rows = [
    ...devices.map(
      (d) => `<button type="button" class="element-row${d.id === selDevice ? " is-selected" : ""}" data-el-device="${d.id}">
        <span class="element-icon" style="background:var(--signal);">${DEVICE_ICON}</span>
        <span class="element-name">Screenshot</span>
        <span class="element-type">Device</span>
      </button>`
    ),
    ...extras.map((e) => {
      const d = extraDescriptor(e);
      return `<button type="button" class="element-row${e.id === selExtra ? " is-selected" : ""}" data-el-extra="${e.id}">
        <span class="element-icon" style="background:${d.color};">${d.icon}</span>
        <span class="element-name">${escapeHtml(d.name)}</span>
        <span class="element-type">${d.type}</span>
      </button>`;
    }),
  ];

  host.innerHTML = rows.length
    ? rows.join("")
    : `<p class="hint tight">No elements on this frame yet — add one below.</p>`;
}

export function bindElementsList() {
  $("#elements-list")?.addEventListener("click", (e) => {
    const t = e.target as Element;
    const deviceBtn = t.closest("[data-el-device]") as HTMLElement | null;
    if (deviceBtn?.dataset.elDevice) {
      selectLayoutDevice(deviceBtn.dataset.elDevice);
      renderElementsList();
      return;
    }
    const extraBtn = t.closest("[data-el-extra]") as HTMLElement | null;
    if (extraBtn?.dataset.elExtra) {
      selectLayoutExtra(extraBtn.dataset.elExtra);
      renderElementsList();
    }
  });
}

export function addCopyOrVisual(kind: ExtraKind): string | null {
  const recipe = ensureSetRecipe();
  if (!recipe) return "No set to edit";
  const visualUrl =
    kind === "visual"
      ? shotUrlAt(state.activeFrame) || state.uploads.find((u) => u.kind === "image")?.url
      : undefined;
  const result = addExtraSlot(recipe, kind, state.activeFrame, {
    imageUrl: visualUrl && !visualUrl.startsWith("blob:") ? visualUrl : undefined,
    fill: currentSet()?.palette?.[0] || "#f3f1ec",
  });
  if (!result.ok) return result.error;
  attachRecipeToSet(result.recipe);
  if (kind === "copy") selectNewestCopy(result.recipe.extras);
  return null;
}

export function addShapeOnSlice(shape: ExtraShape): string | null {
  const recipe = ensureSetRecipe();
  if (!recipe) return "No set to edit";
  const result = addExtraSlot(recipe, "visual", state.activeFrame, {
    shape,
    fill: "rgba(243,241,236,0.38)",
  });
  if (!result.ok) return result.error;
  attachRecipeToSet(result.recipe);
  return null;
}

export function addWidgetOnSlice(widget: ExtraWidget): string | null {
  const recipe = ensureSetRecipe();
  if (!recipe) return "No set to edit";
  const kind = widget === "review" || widget === "pills" ? "copy" : "visual";
  const result = addExtraSlot(recipe, kind, state.activeFrame, {
    widget,
    fill: currentSet()?.palette?.[0] || "#f3f1ec",
  });
  if (!result.ok) return result.error;
  attachRecipeToSet(result.recipe);
  selectNewestWidget(result.recipe.extras);
  return null;
}

export function applyTypeBandOnSlice(kind: TypeBandKind): string | null {
  const recipe = ensureSetRecipe();
  if (!recipe) return "No set to edit";
  attachRecipeToSet(setSliceTypeBand(recipe, state.activeFrame, kind));
  return null;
}

export function applyPanoramaFromPicker(): string | null {
  const sel = $("#panorama-asset") as HTMLSelectElement | null;
  const assets = panoramaAssets();
  const picked = sel?.value !== "" && sel ? assets[Number(sel.value)] : assets[0];
  const url = picked?.url || "";
  if (!url) return "Upload or scan a screenshot first";
  if (!applyPanoramaToSet(url)) return "Need a refresh-safe image (not blob:)";
  return null;
}

export function parseExtraShape(raw: string | undefined): ExtraShape | null {
  return EXTRA_SHAPES.includes(raw as ExtraShape) ? (raw as ExtraShape) : null;
}

export function parseExtraWidget(raw: string | undefined): ExtraWidget | null {
  return EXTRA_WIDGETS.includes(raw as ExtraWidget) ? (raw as ExtraWidget) : null;
}

export function parseTypeBand(raw: string | undefined): TypeBandKind | null {
  if (raw === "top" || raw === "bottom" || raw === "split" || raw === "none") return raw;
  return null;
}

export function bindChromeExtras(onApplied: () => void) {
  $("#edit-inspector")?.addEventListener("click", (e) => {
    const t = e.target as Element;
    const shapeBtn = t.closest("[data-extra-shape]") as HTMLElement | null;
    const shape = parseExtraShape(shapeBtn?.dataset.extraShape);
    if (shape) {
      const err = addShapeOnSlice(shape);
      toast(err || `${shape} on this slice — drag on the canvas`);
      if (!err) onApplied();
      return;
    }
    const widgetBtn = t.closest("[data-extra-widget]") as HTMLElement | null;
    const widget = parseExtraWidget(widgetBtn?.dataset.extraWidget);
    if (widget) {
      const err = addWidgetOnSlice(widget);
      toast(err || `${widget} element on this slice — drag on the canvas`);
      if (!err) onApplied();
      return;
    }
    const bandBtn = t.closest("[data-type-band]") as HTMLElement | null;
    const band = parseTypeBand(bandBtn?.dataset.typeBand);
    if (band) {
      const err = applyTypeBandOnSlice(band);
      toast(err || `Type on this PNG · ${band}`);
      if (!err) onApplied();
      return;
    }
    const sliceBtn = t.closest("[data-slice-rule]") as HTMLElement | null;
    const rule = sliceBtn?.dataset.sliceRule;
    if (rule) {
      const err = applySliceRule(rule);
      toast(err || (rule === "mini" ? "Mini screen element added — not a full device" : "Slice devices updated"));
      if (!err) onApplied();
    }
  });
}
