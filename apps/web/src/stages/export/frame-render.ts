/** OWNER: stages/export — shared PNG frame canvas render */
import { resolveExportSize } from "@take/device-catalog";
import { currentSet, state } from "../../app/app-state";
import { goalCta } from "../../modes/wizard/copy-builder";
import { drawFittedImage, planScreenFill } from "../../editor/device/shell-composite";
import { loadImg, wrapText } from "./canvas-text";
import { scanIconUrl, shotUrlAt } from "./selected-shots";
import { paintStripSlice, stripRecipeOfSet } from "./paint-strip-slice";
import { applyHighQualitySmoothing } from "../../shared/canvas-quality";
import { ensureFontsLoaded, fontStack } from "../../shared/typography";

/** Current catalog export size for the selected device + orientation. */
export function currentExportSize(): { w: number; h: number } {
  return resolveExportSize(state.deviceId, state.platform, state.orientation).size;
}

/** Paint one marketing frame onto a canvas (mutates / returns same canvas). */
export async function paintExportFrame(
  canvas: HTMLCanvasElement,
  frameIndex: number
): Promise<boolean> {
  const set = currentSet();
  const frame = set?.frames[frameIndex];
  if (!set || !frame) return false;

  const { w: EXPORT_W, h: EXPORT_H } = currentExportSize();
  canvas.width = EXPORT_W;
  canvas.height = EXPORT_H;

  if (stripRecipeOfSet()) {
    return paintStripSlice(canvas, frameIndex, { w: EXPORT_W, h: EXPORT_H });
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  applyHighQualitySmoothing(ctx);

  // Only override the app's own historical per-role defaults (headline/CTA
  // system-ui, caption Georgia serif) once a set actually has a real
  // typography pick — an untouched set must render pixel-identically to
  // before this feature existed.
  const typography = set.typography;
  if (typography) await ensureFontsLoaded([typography.display, typography.body]);
  const displayFace = typography ? fontStack(typography.display) : "system-ui, sans-serif";
  const bodyFace = typography ? fontStack(typography.body) : "Georgia, serif";

  const accent = set.palette[0] || "#ff4d1a";
  const bg = set.palette[1] || "#0c0d10";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);

  const shotUrl = shotUrlAt(frameIndex);
  if (shotUrl) {
    const img = await loadImg(shotUrl);
    if (img) {
      const plan = planScreenFill(img.naturalWidth || img.width, img.naturalHeight || img.height);
      drawFittedImage(ctx, img, plan);
      ctx.fillStyle = "rgba(12,13,16,0.55)";
      ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);
    }
  }

  const iconUrl = scanIconUrl();
  if (iconUrl) {
    const img = await loadImg(iconUrl);
    if (img) {
      const iconSize = Math.round(EXPORT_W * 0.124);
      const pad = Math.round(EXPORT_W * 0.074);
      ctx.drawImage(img, pad, Math.round(EXPORT_H * 0.057), iconSize, iconSize);
    }
  }

  const padX = Math.round(EXPORT_W * 0.074);
  const maxTextW = EXPORT_W - padX * 2;
  const scale = EXPORT_W / 1290;

  ctx.fillStyle = "#3de0ff";
  ctx.font = `600 ${Math.round(36 * scale)}px ui-monospace, monospace`;
  ctx.fillText(frame.kicker.slice(0, 48), padX, Math.round(400 * (EXPORT_H / 2796)));

  ctx.fillStyle = "#f3f1ec";
  ctx.font = `700 ${Math.round(72 * scale)}px ${displayFace}`;
  wrapText(
    ctx,
    frame.headline,
    padX,
    Math.round(500 * (EXPORT_H / 2796)),
    maxTextW,
    Math.round(84 * scale)
  );

  ctx.fillStyle = "#c8c4bb";
  ctx.font = `400 ${Math.round(40 * scale)}px ${bodyFace}`;
  wrapText(
    ctx,
    frame.caption,
    padX,
    Math.round(900 * (EXPORT_H / 2796)),
    maxTextW,
    Math.round(52 * scale)
  );

  const cta = (frame.cta || goalCta(state.inference?.goal || "install")).slice(0, 28);
  const ctaY = EXPORT_H - Math.round(280 * (EXPORT_H / 2796));
  const ctaH = Math.round(96 * scale);
  const ctaW = Math.round(420 * scale);
  ctx.fillStyle = accent;
  ctx.fillRect(padX, ctaY, ctaW, ctaH);
  ctx.fillStyle = "#0c0d10";
  ctx.font = `700 ${Math.round(36 * scale)}px ${bodyFace}`;
  ctx.fillText(cta, padX + Math.round(24 * scale), ctaY + Math.round(62 * scale));

  return true;
}
