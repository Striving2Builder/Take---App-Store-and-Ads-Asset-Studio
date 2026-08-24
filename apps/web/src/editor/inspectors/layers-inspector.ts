/** OWNER: editor/inspectors — extra slots + panorama picker + type band */
import {
  addExtraSlot,
  EXTRA_SHAPES,
  EXTRA_WIDGETS,
  setSliceTypeBand,
  typeBandForSlice,
  type ExtraKind,
  type ExtraShape,
  type ExtraWidget,
  type TypeBandKind,
} from "@take/template-engine";
import { currentSet, state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { selectedScreenshots, shotUrlAt } from "../../stages/export/selected-shots";
import { stripRecipeOfSet } from "../../stages/export/paint-strip-slice";
import { toast } from "../../shell/toast";
import { applyPanoramaToSet, attachRecipeToSet, ensureSetRecipe } from "../layout/attach-recipe";
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
      toast(err || `${widget} widget on this slice — drag on the canvas`);
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
      toast(err || (rule === "mini" ? "Mini screen extra — not a full phone" : "Slice phones updated"));
      if (!err) onApplied();
    }
  });
}
