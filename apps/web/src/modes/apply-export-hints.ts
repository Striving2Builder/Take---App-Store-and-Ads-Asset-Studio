/** OWNER: modes — apply getExportHints to export preset checkboxes */
import { getMode } from "@take/modes-sdk";
import { state } from "../app/app-state";
import { $$ } from "../shared/dom";
import { captureExportPresetIds } from "../stages/export/mount-presets";

export function applyExportHints(): void {
  const hints = getMode(state.mode)?.getExportHints?.() ?? {};
  const boxes = $$<HTMLInputElement>("#export-presets input");
  if (hints.preferMotion || hints.defaultPresets?.includes("slideshow")) {
    const box = boxes.find((el) => el.value === "slideshow");
    if (box) box.checked = true;
  }
  for (const id of hints.defaultPresets || []) {
    const box = boxes.find((el) => el.value === id);
    if (box) box.checked = true;
  }
  if (boxes.length) captureExportPresetIds();
}
