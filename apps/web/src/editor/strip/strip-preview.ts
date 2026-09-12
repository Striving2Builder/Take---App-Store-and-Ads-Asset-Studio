/** OWNER: editor/strip — joined rail preview (no gap); shares paintStripSlice */
import { resolveExportSize } from "@take/device-catalog";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { paintStripSlice, stripRecipeOfSet } from "../../stages/export/paint-strip-slice";

const PREVIEW_W = 72;

export async function refreshStripPreview() {
  const host = $("#strip-preview") as HTMLElement | null;
  const rail = $("#strip-preview-rail") as HTMLElement | null;
  if (!host || !rail) return;

  const recipe = stripRecipeOfSet();
  const on = !!recipe;
  host.hidden = !on;
  if (!on || !recipe) {
    rail.innerHTML = "";
    return;
  }
  host.classList.toggle("is-isolated", recipe.composition === "isolated");
  const label = host.querySelector(".strip-preview-label");
  if (label) {
    label.textContent =
      recipe.composition === "strip"
        ? "STRIP PREVIEW · joined world · no gap — this is the export"
        : "LAYOUT PREVIEW · one device per PNG — this is the export";
  }

  const { w, h } = resolveExportSize(state.deviceId, state.platform, state.orientation).size;
  // CSS fixes the displayed width at PREVIEW_W regardless of raster size (see
  // strip-preview.css); raster at PREVIEW_W x devicePixelRatio so the bitmap
  // isn't upscaled on scaled/HiDPI displays.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rasterW = Math.round(PREVIEW_W * dpr);
  const previewH = Math.round(rasterW * (h / w));
  const n = recipe.frameCount;
  rail.innerHTML = "";
  const canvases: HTMLCanvasElement[] = [];
  for (let i = 0; i < n; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `strip-slice${i === state.activeFrame ? " is-active" : ""}`;
    btn.dataset.frame = String(i);
    btn.setAttribute("aria-label", `Slice ${i + 1}`);
    const canvas = document.createElement("canvas");
    canvas.width = rasterW;
    canvas.height = previewH;
    btn.appendChild(canvas);
    rail.appendChild(btn);
    canvases.push(canvas);
  }

  for (let i = 0; i < n; i++) {
    await paintStripSlice(canvases[i], i, { w: rasterW, h: previewH });
  }
}
