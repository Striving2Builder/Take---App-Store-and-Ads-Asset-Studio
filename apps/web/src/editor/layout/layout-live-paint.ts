/** OWNER: editor/layout — debounce slice + strip preview after recipe patch */
import { resolveExportSize } from "@take/device-catalog";
import { currentSet, state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { paintStripSlice, stripRecipeOfSet } from "../../stages/export/paint-strip-slice";
import { refreshStripPreview } from "../strip/strip-preview";

let timer: ReturnType<typeof setTimeout> | undefined;

export async function paintLayoutSliceNow(): Promise<void> {
  const canvas = $("#layout-slice-canvas") as HTMLCanvasElement | null;
  const recipe = stripRecipeOfSet();
  const set = currentSet();
  if (!canvas || !recipe || !set) return;
  const { w, h } = resolveExportSize(state.deviceId, state.platform, state.orientation).size;
  const cw = canvas.width || 264;
  await paintStripSlice(canvas, state.activeFrame, {
    w: cw,
    h: Math.round(cw * (h / w)),
    skipType: true,
    recipe,
    frames: set.frames,
    palette: set.palette,
  });
  void refreshStripPreview();
}

export function scheduleLayoutPaint(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = undefined;
    void paintLayoutSliceNow();
  }, 80);
}
