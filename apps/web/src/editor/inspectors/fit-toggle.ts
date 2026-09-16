/** OWNER: editor/inspectors — real screenshot fit (Cover/Contain) on the
 *  selected device, replacing the dead Phase-0 Fit control. That one only
 *  ever touched #phone-mock's CSS object-fit; this one sets a real field
 *  on the DeviceInstance that paint-devices.ts's screenBitmap() reads, so
 *  it affects the live preview and the exported PNG identically. */
import { $, $$ } from "../../shared/dom";
import { stripRecipeOfSet } from "../../stages/export/paint-strip-slice";
import { attachRecipeToSet, ensureSetRecipe } from "../layout/attach-recipe";
import { rebuildHandles, selectedLayoutDeviceId } from "../layout/layout-drag";
import { scheduleLayoutPaint } from "../layout/layout-live-paint";

function selectedDevice() {
  const recipe = stripRecipeOfSet();
  const id = selectedLayoutDeviceId();
  if (!recipe || !id) return null;
  return recipe.devices.find((d) => d.id === id) || null;
}

export function renderFitRow() {
  const row = $("#device-fit-row") as HTMLElement | null;
  if (!row) return;
  const inst = selectedDevice();
  row.hidden = !inst;
  if (!inst) return;
  const fit = inst.fit || "cover";
  // Syncs the sidebar row AND the canvas floating toolbar's matching
  // buttons (layout-drag.ts's contextToolbarHtml) — one active state,
  // two places it's shown.
  $$<HTMLElement>("[data-device-fit]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.deviceFit === fit);
  });
}

export function bindFitRow() {
  // Delegated from document, not just #device-fit-row, so the floating
  // toolbar's identical buttons (rendered inside #layout-handles) trigger
  // the same real patch instead of needing a second implementation.
  document.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest("[data-device-fit]") as HTMLElement | null;
    const fit = btn?.dataset.deviceFit;
    if (fit !== "cover" && fit !== "contain") return;
    const recipe = ensureSetRecipe();
    const id = selectedLayoutDeviceId();
    if (!recipe || !id) return;
    const i = recipe.devices.findIndex((d) => d.id === id);
    if (i < 0) return;
    recipe.devices[i] = { ...recipe.devices[i], fit, authored: true };
    attachRecipeToSet(recipe);
    renderFitRow();
    rebuildHandles();
    scheduleLayoutPaint();
  });
}
