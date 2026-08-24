/** OWNER: editor/inspectors — phones on this PNG (add/remove/fan/orient/mini) */
import {
  addDeviceOnSlice,
  addExtraSlot,
  deviceOnSlice,
  removeLocalDevicesOnSlice,
  resolveMetrics,
  setInstanceOrientation,
  stampFan3OnSlice,
} from "@take/template-engine";
import { state } from "../../app/app-state";
import { selectedLayoutDeviceId } from "../layout/layout-drag";
import { attachRecipeToSet, ensureSetRecipe } from "../layout/attach-recipe";

export function applySliceRule(rule: string): string | null {
  const recipe = ensureSetRecipe();
  if (!recipe) return "No set to edit";
  const metrics = resolveMetrics(state.deviceId, state.platform, state.orientation);
  const slice = state.activeFrame;
  if (rule === "add") {
    const result = addDeviceOnSlice({ recipe, sliceIndex: slice, metrics });
    if (!result.ok) return result.error;
    attachRecipeToSet(result.recipe);
    return null;
  }
  if (rule === "remove") {
    const result = removeLocalDevicesOnSlice({
      recipe,
      sliceIndex: slice,
      metrics,
      instanceId: selectedLayoutDeviceId() || undefined,
    });
    if (!result.ok) return result.error;
    attachRecipeToSet(result.recipe);
    return null;
  }
  if (rule === "fan-3") {
    const result = stampFan3OnSlice({ recipe, sliceIndex: slice, metrics });
    if (!result.ok) return result.error;
    attachRecipeToSet(result.recipe);
    return null;
  }
  if (rule === "landscape" || rule === "portrait") {
    const instId = selectedLayoutDeviceId() || deviceOnSlice(recipe, slice, metrics)?.id;
    if (!instId) return "No phone on this PNG";
    const result = setInstanceOrientation({
      recipe,
      instanceId: instId,
      orientation: rule,
      metrics,
    });
    if (!result.ok) return result.error;
    attachRecipeToSet(result.recipe);
    return null;
  }
  if (rule === "mini") {
    const result = addExtraSlot(recipe, "visual", slice, {
      shotIndex: slice,
      w: 0.28,
      h: 0.36,
      x: slice + 0.78,
      y: 0.62,
      z: 8,
      fill: "#14151a",
    });
    if (!result.ok) return result.error;
    attachRecipeToSet(result.recipe);
    return null;
  }
  return "Unknown slice rule";
}
