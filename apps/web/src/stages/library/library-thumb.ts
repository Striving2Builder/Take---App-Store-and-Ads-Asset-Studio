/** OWNER: stages/library — paint card thumbs from recipe slice 0 */
import { recipeFromSaved } from "@take/template-engine";
import { resolveExportSize } from "@take/device-catalog";
import type { SavedTemplate } from "@take/storage";
import type { StoryFrame } from "@take/core";
import { paintStripSlice } from "../export/paint-strip-slice";

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
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  await Promise.all(
    canvases.map(async (canvas) => {
      const id = canvas.dataset.thumb;
      const tpl = cards.find((t) => t.id === id);
      if (!tpl) return;
      const recipe = recipeFromSaved({ ...tpl, layout: tpl.layout });
      if (!recipe.devices.length) return;
      const size = resolveExportSize(
        recipe.deviceId || "apple.iphone-16-pro-max",
        tpl.platform || "ios",
        recipe.defaultOrientation || "portrait"
      );
      // .tpl-card sits in an auto-fill grid (minmax(220px, 1fr)) so its actual
      // width varies with viewport/row-fill; raster at that real width x dpr
      // instead of a fixed literal, or CSS width:100% upscales a small bitmap.
      const cssW = canvas.clientWidth || 180;
      const w = Math.round(cssW * dpr);
      const h = Math.max(1, Math.round((w * size.size.h) / size.size.w));
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
