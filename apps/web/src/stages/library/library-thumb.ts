/** OWNER: stages/library — paint card thumbs from recipe slice 0 */
import { hasRealLayout, recipeFromSaved } from "@take/template-engine";
import type { SavedTemplate } from "@take/storage";
import type { StoryFrame } from "@take/core";
import { paintStripSlice } from "../export/paint-strip-slice";
import { rasterSizeFor } from "../../shared/hidpi-raster";

export function dummyFrames(n: number): StoryFrame[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `thumb-${i}`,
    index: i,
    role: "HOOK",
    kicker: "",
    headline: "",
    caption: "",
    cta: "",
  }));
}

export async function paintLibraryThumbs(root: HTMLElement, cards: SavedTemplate[]): Promise<void> {
  const canvases = [...root.querySelectorAll<HTMLCanvasElement>("canvas[data-thumb]")];
  const dpr = window.devicePixelRatio || 1;
  await Promise.all(
    canvases.map(async (canvas) => {
      const id = canvas.dataset.thumb;
      const tpl = cards.find((t) => t.id === id);
      if (!tpl) return;
      const recipe = recipeFromSaved({ ...tpl, layout: tpl.layout });
      if (!hasRealLayout(recipe)) return;
      // Each card shows 3 of these side by side in a grid cell shaped nothing
      // like the device's own aspect ratio (.tpl-preview is a fixed 4/5 box
      // split into 3 columns) — object-fit:contain doesn't actually constrain
      // <canvas> content in every engine, so a raster derived from the
      // device's aspect ratio gets stretched to fill the real (taller) cell
      // and blurs. Raster at the cell's own measured width AND height instead
      // of deriving one from the other — paintStripSlice fits the recipe to
      // whatever box it's given.
      const w = rasterSizeFor(canvas.clientWidth, dpr, 180);
      const h = rasterSizeFor(canvas.clientHeight, dpr, 390);
      await paintStripSlice(canvas, Number(canvas.dataset.thumbSlice || 0), {
        recipe,
        frames: dummyFrames(recipe.frameCount),
        skipType: true,
        w,
        h,
        deviceId: recipe.deviceId,
        palette: recipe.palette,
      });
    })
  );
}
