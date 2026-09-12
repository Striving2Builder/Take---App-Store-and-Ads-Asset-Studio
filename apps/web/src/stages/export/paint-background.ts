/** OWNER: stages/export — solid / gradient / image world or per-slice fill */
import { fitRect } from "@take/export-presets";
import { MAX_SCREENSHOT_UPSCALE } from "@take/device-catalog";
import type { TemplateRecord } from "@take/template-engine";
import { loadImg } from "./canvas-text";

export async function paintBackground(
  ctx: CanvasRenderingContext2D,
  recipe: TemplateRecord,
  destW: number,
  destH: number
) {
  const bg = recipe.background;
  if (bg.kind === "gradient" && bg.colorB) {
    const g = ctx.createLinearGradient(0, 0, destW, destH);
    g.addColorStop(0, bg.colorA);
    g.addColorStop(1, bg.colorB);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = bg.colorA || "#0c0d10";
  }
  ctx.fillRect(0, 0, destW, destH);

  if (bg.kind !== "image" || !bg.imageUrl || bg.imageUrl.startsWith("blob:")) return;
  const img = await loadImg(bg.imageUrl);
  if (!img) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const fit = bg.fit === "contain" ? "contain" : "cover";
  const r = fitRect(iw, ih, destW, destH, fit, MAX_SCREENSHOT_UPSCALE);
  ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, r.dx, r.dy, r.dw, r.dh);
}
