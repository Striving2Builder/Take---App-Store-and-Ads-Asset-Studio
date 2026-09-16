/** OWNER: stages/export — clip one store PNG from a strip world canvas */
import {
  typeBandForSlice,
  typeBandRect,
  worldSize,
  backgroundDestSize,
  type TemplateRecord,
} from "@take/template-engine";
import type { StoryFrame } from "@take/core";
import { currentSet, state } from "../../app/app-state";
import { goalCta } from "../../modes/wizard/copy-builder";
import { loadImg, wrapText } from "./canvas-text";
import { inkForBackground, type Ink } from "../../shared/contrast-ink";
import { scanIconUrl } from "./selected-shots";
import { paintBackground } from "./paint-background";
import { paintDevice } from "./paint-devices";
import { paintExtras } from "./paint-extras";
import { applyHighQualitySmoothing } from "../../shared/canvas-quality";
import { ensureFontsLoaded, fontStack } from "../../shared/typography";

export type PaintSliceOpts = {
  w?: number;
  h?: number;
  recipe?: TemplateRecord;
  frames?: StoryFrame[];
  palette?: string[];
  skipType?: boolean;
  deviceId?: string;
};

function asRecipe(raw: unknown): TemplateRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as TemplateRecord;
  if (r.composition !== "strip" && r.composition !== "isolated") return null;
  if (!Array.isArray(r.devices) || !r.devices.length || !r.frameCount) return null;
  return r;
}

export function stripRecipeOfSet(): TemplateRecord | null {
  const set = currentSet();
  if (!set) return null;
  return asRecipe(set.layout?.recipe);
}

function paintType(
  ctx: CanvasRenderingContext2D,
  recipe: TemplateRecord,
  sliceIndex: number,
  sliceW: number,
  sliceH: number,
  frame: StoryFrame,
  accent: string,
  ink: Ink,
  typography?: { display: string; body: string }
) {
  const family = typeBandForSlice(recipe, sliceIndex);
  if (family === "none") return;
  const band = typeBandRect(family, sliceW, sliceH, recipe.typeScale);
  if (band.w <= 0 || band.h <= 0) return;
  // Only override the app's own historical defaults once a set actually
  // has a real typography pick — an untouched set renders pixel-identically
  // to before this feature existed.
  const displayFace = typography ? fontStack(typography.display) : "system-ui, sans-serif";
  const bodyFace = typography ? fontStack(typography.body) : "system-ui, sans-serif";
  const padX = Math.round(sliceW * 0.07);
  const maxTextW = sliceW - padX * 2;
  const scale = sliceW / 1290;
  ctx.fillStyle = ink.text;
  ctx.font = `600 ${Math.round(28 * scale)}px ui-monospace, monospace`;
  ctx.fillText(frame.kicker.slice(0, 48), padX, band.y + Math.round(band.h * 0.28));
  ctx.font = `700 ${Math.round(56 * scale)}px ${displayFace}`;
  wrapText(
    ctx,
    frame.headline,
    padX,
    band.y + Math.round(band.h * 0.52),
    maxTextW,
    Math.round(64 * scale)
  );
  const cta = (frame.cta || goalCta(state.inference?.goal || "install")).slice(0, 28);
  const ctaY = sliceH - Math.round(sliceH * 0.09);
  ctx.fillStyle = accent;
  ctx.fillRect(padX, ctaY, Math.round(360 * scale), Math.round(72 * scale));
  ctx.fillStyle = "#0c0d10";
  ctx.font = `700 ${Math.round(28 * scale)}px ${bodyFace}`;
  ctx.fillText(cta, padX + Math.round(18 * scale), ctaY + Math.round(46 * scale));
}

/** Paint store PNG i = clip of world [i·W, (i+1)·W] × H. Shared with strip preview. */
export async function paintStripSlice(
  canvas: HTMLCanvasElement,
  sliceIndex: number,
  opts?: PaintSliceOpts
): Promise<boolean> {
  const set = currentSet();
  const recipe = opts?.recipe || stripRecipeOfSet();
  const frames = opts?.frames || set?.frames;
  if (!recipe || !frames || sliceIndex < 0 || sliceIndex >= recipe.frameCount) return false;

  const sliceW = opts?.w || canvas.width;
  const sliceH = opts?.h || canvas.height;
  canvas.width = sliceW;
  canvas.height = sliceH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  applyHighQualitySmoothing(ctx);

  const { w: worldW, h: worldH } = worldSize(recipe.frameCount, sliceW, sliceH);
  const bgDest = backgroundDestSize(recipe.composition, recipe.frameCount, sliceW, sliceH);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, sliceW, sliceH);
  ctx.clip();
  if (recipe.composition === "strip") {
    ctx.translate(-sliceIndex * sliceW, 0);
    await paintBackground(ctx, recipe, worldW, worldH);
  } else {
    await paintBackground(ctx, recipe, bgDest.w, bgDest.h);
    ctx.translate(-sliceIndex * sliceW, 0);
  }
  const ordered = [...recipe.devices].sort((a, b) => a.z - b.z);
  const deviceId = opts?.deviceId || state.deviceId || recipe.deviceId;
  for (const inst of ordered) {
    await paintDevice(ctx, sliceW, sliceH, inst, deviceId, recipe.defaultOrientation);
  }
  const ink = inkForBackground(recipe.background.colorA, recipe.background.colorB);
  await paintExtras(ctx, recipe.extras, sliceW, sliceH, ink);
  ctx.restore();

  if (!opts?.skipType && typeBandForSlice(recipe, sliceIndex) !== "none") {
    const iconUrl = scanIconUrl();
    if (iconUrl) {
      const img = await loadImg(iconUrl);
      if (img) {
        const iconSize = Math.round(sliceW * 0.1);
        ctx.drawImage(img, Math.round(sliceW * 0.07), Math.round(sliceH * 0.035), iconSize, iconSize);
      }
    }
    const frame = frames[sliceIndex];
    if (frame) {
      const accent = (opts?.palette || set?.palette)?.[0] || "#ff4d1a";
      const typography = set?.typography;
      if (typography) await ensureFontsLoaded([typography.display, typography.body]);
      paintType(ctx, recipe, sliceIndex, sliceW, sliceH, frame, accent, ink, typography);
    }
  }
  return true;
}
