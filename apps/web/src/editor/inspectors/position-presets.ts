/** OWNER: editor/inspectors — position preset grid (stamps recipe devices) */
import {
  applyPlacementPreset,
  deviceOnSlice,
  PLACEMENT_PRESETS,
  resolveMetrics,
  type PlacementPresetId,
} from "@take/template-engine";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { toast } from "../../shell/toast";
import { renderEditor } from "../canvas/edit-canvas";
import { attachRecipeToSet, ensureSetRecipe } from "../layout/attach-recipe";
import { selectLayoutDevice, selectedLayoutDeviceId } from "../layout/layout-drag";
import { renderTiltSliders } from "./tilt-sliders";

const CUT: PlacementPresetId[] = ["bleed-next", "bleed-prev"];

const PHONE_CLASS: Record<PlacementPresetId, string> = {
  center: "pos-phone-center",
  inset: "pos-phone-inset",
  low: "pos-phone-low",
  "crop-top": "pos-phone-crop-top",
  "crop-bottom": "pos-phone-crop-bot",
  "tilt-left": "pos-phone-tilt-l",
  "tilt-right": "pos-phone-tilt-r",
  "yaw-left": "pos-phone-yaw-l",
  "yaw-right": "pos-phone-yaw-r",
  pitch: "pos-phone-pitch",
  "bleed-next": "pos-phone-bleed-n",
  "bleed-prev": "pos-phone-bleed-p",
};

export function applyPositionPreset(preset: PlacementPresetId): void {
  const recipe = ensureSetRecipe();
  if (!recipe) {
    toast("Generate a set first");
    return;
  }
  const metrics = resolveMetrics(state.deviceId, state.platform, state.orientation);
  const selected = selectedLayoutDeviceId();
  const fallback = deviceOnSlice(recipe, state.activeFrame, metrics);
  const instanceId = selected || fallback?.id;
  if (!instanceId) {
    toast("No device on this slice");
    return;
  }
  const result = applyPlacementPreset({
    recipe,
    instanceId,
    preset,
    sliceIndex: state.activeFrame,
    metrics,
  });
  if (!result.ok) {
    toast(result.error);
    return;
  }
  attachRecipeToSet(result.recipe);
  selectLayoutDevice(instanceId);
  if (CUT.includes(preset)) state.editView = "set";
  renderEditor();
  renderTiltSliders();
  toast(
    CUT.includes(preset)
      ? "Bleed across the cut — one phone, two PNGs"
      : "Device position applied"
  );
}

function mountPresetGrid() {
  const grid = $("#pos-preset-grid") as HTMLElement | null;
  if (!grid || grid.dataset.mounted === "1") return;
  grid.innerHTML = PLACEMENT_PRESETS.map((p) => {
    const cut = p.kind === "cut" ? " pos-preset-cut" : "";
    return `<button type="button" class="pos-preset${cut}" data-pos-preset="${escapeHtml(p.id)}" title="${escapeHtml(p.label)}">
      <span class="pos-phone ${PHONE_CLASS[p.id]}"></span>${escapeHtml(p.label)}
    </button>`;
  }).join("");
  grid.dataset.mounted = "1";
}

export function bindPositionPresets(): void {
  mountPresetGrid();
  $("#pos-preset-grid")?.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest("[data-pos-preset]") as HTMLElement | null;
    const id = btn?.dataset.posPreset as PlacementPresetId | undefined;
    if (!id) return;
    applyPositionPreset(id);
  });
}
