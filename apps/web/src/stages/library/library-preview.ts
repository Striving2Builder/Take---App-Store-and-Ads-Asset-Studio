/** OWNER: stages/library — browse all slices of a recipe before Use */
import { getTemplates } from "@take/storage";
import { getDevice, resolveExportSize } from "@take/device-catalog";
import { recipeFromSaved, type TemplateRecord } from "@take/template-engine";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { toast } from "../../shell/toast";
import { paintStripSlice } from "../export/paint-strip-slice";
import { dummyFrames } from "./library-thumb";
import { useLibraryRecipe } from "./library-use";

function dialogEl(): HTMLDialogElement | null {
  return $("#library-preview") as HTMLDialogElement | null;
}

export async function openLibraryPreview(id: string): Promise<void> {
  const dlg = dialogEl();
  const rail = $("#library-preview-rail") as HTMLElement | null;
  const title = $("#library-preview-title");
  const meta = $("#library-preview-meta");
  if (!dlg || !rail || !title || !meta) return;

  const tpl = getTemplates().find((t) => t.id === id);
  if (!tpl) {
    toast("Recipe not found");
    return;
  }
  const recipe = recipeFromSaved({ ...tpl, layout: tpl.layout });
  if (!recipe.devices.length) {
    toast("That card has no layout to preview");
    return;
  }

  dlg.dataset.tpl = id;
  title.textContent = tpl.name;
  const device = recipe.deviceId ? getDevice(recipe.deviceId) : undefined;
  const size = resolveExportSize(
    recipe.deviceId || "apple.iphone-16-pro-max",
    tpl.platform || "ios",
    recipe.defaultOrientation || "portrait"
  );
  meta.textContent = `${device?.name || recipe.deviceId || "device"} · ${size.size.w}×${size.size.h} · ${recipe.frameCount} frames · ${recipe.composition}`;

  // CSS fixes the displayed width at 160px (library.css); raster at 160px x
  // devicePixelRatio so the bitmap isn't upscaled on scaled/HiDPI displays.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(160 * dpr);
  const h = Math.max(1, Math.round((w * size.size.h) / size.size.w));
  const frames = dummyFrames(recipe.frameCount);
  rail.innerHTML = Array.from({ length: recipe.frameCount }, (_, i) => {
    return `<figure class="library-preview-slice">
      <canvas width="${w}" height="${h}" data-preview-slice="${i}"></canvas>
      <figcaption class="mono">${String(i + 1).padStart(2, "0")}</figcaption>
    </figure>`;
  }).join("");

  dlg.showModal();
  await paintPreviewRail(rail, recipe, frames, w, h);
}

async function paintPreviewRail(
  rail: HTMLElement,
  recipe: TemplateRecord,
  frames: ReturnType<typeof dummyFrames>,
  w: number,
  h: number
): Promise<void> {
  const canvases = [...rail.querySelectorAll<HTMLCanvasElement>("canvas[data-preview-slice]")];
  await Promise.all(
    canvases.map(async (canvas) => {
      const i = Number(canvas.dataset.previewSlice);
      if (!Number.isFinite(i)) return;
      await paintStripSlice(canvas, i, {
        recipe,
        frames,
        skipType: true,
        w,
        h,
        deviceId: recipe.deviceId,
        palette: recipe.palette,
      });
    })
  );
}

export function bindLibraryPreview(): void {
  $("#library-preview-close")?.addEventListener("click", () => dialogEl()?.close());
  $("#library-preview-use")?.addEventListener("click", () => {
    const id = dialogEl()?.dataset.tpl;
    dialogEl()?.close();
    if (id) useLibraryRecipe(id);
  });
  dialogEl()?.addEventListener("click", (e) => {
    if (e.target === dialogEl()) dialogEl()?.close();
  });
}
