/** OWNER: stages/export — clip one store PNG from a strip world canvas */
import {
  typeBandRect,
  toWorldInstance,
  worldSize,
  resolveMetrics,
  type TemplateRecord,
} from "@take/template-engine";
import type { StoryFrame } from "@take/core";
import { currentSet, state } from "../../app/app-state";
import { goalCta } from "../../modes/wizard/copy-builder";
import { loadImg, wrapText } from "./canvas-text";
import { scanIconUrl, shotUrlAt } from "./selected-shots";

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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function paintBackground(
  ctx: CanvasRenderingContext2D,
  recipe: TemplateRecord,
  worldW: number,
  worldH: number
) {
  const bg = recipe.background;
  if (bg.kind === "gradient" && bg.colorB) {
    const g = ctx.createLinearGradient(0, 0, worldW, worldH);
    g.addColorStop(0, bg.colorA);
    g.addColorStop(1, bg.colorB);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = bg.colorA || "#0c0d10";
  }
  ctx.fillRect(0, 0, worldW, worldH);
}

async function paintDevice(
  ctx: CanvasRenderingContext2D,
  sliceW: number,
  sliceH: number,
  inst: TemplateRecord["devices"][number],
  deviceId?: string
) {
  const world = toWorldInstance(inst, sliceW, sliceH);
  const imgUrl = shotUrlAt(inst.shotIndex);
  const img = imgUrl ? await loadImg(imgUrl) : null;
  const inset = resolveMetrics(
    deviceId || state.deviceId,
    state.platform,
    state.orientation
  ).inset;
  ctx.save();
  ctx.translate(world.x, world.y);
  ctx.rotate((world.rotationDeg * Math.PI) / 180);
  const x = -world.w / 2;
  const y = -world.h / 2;
  ctx.fillStyle = "#14151a";
  roundRect(ctx, x, y, world.w, world.h, world.w * 0.12);
  ctx.fill();
  const sx = x + world.w * inset.x;
  const sy = y + world.h * inset.y;
  const sw = world.w * inset.w;
  const sh = world.h * inset.h;
  ctx.save();
  roundRect(ctx, sx, sy, sw, sh, world.w * 0.08);
  ctx.clip();
  ctx.fillStyle = "#0c0d10";
  ctx.fillRect(sx, sy, sw, sh);
  if (img) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.max(sw / iw, sh / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, sx + (sw - dw) / 2, sy + (sh - dh) / 2, dw, dh);
  }
  ctx.restore();
  ctx.restore();
}

function paintType(
  ctx: CanvasRenderingContext2D,
  recipe: TemplateRecord,
  sliceW: number,
  sliceH: number,
  frame: StoryFrame,
  accent: string
) {
  const band = typeBandRect(recipe.typeFamily, sliceW, sliceH, recipe.typeScale);
  const padX = Math.round(sliceW * 0.07);
  const maxTextW = sliceW - padX * 2;
  const scale = sliceW / 1290;
  ctx.fillStyle = "#f3f1ec";
  ctx.font = `600 ${Math.round(28 * scale)}px ui-monospace, monospace`;
  ctx.fillText(frame.kicker.slice(0, 48), padX, band.y + Math.round(band.h * 0.28));
  ctx.font = `700 ${Math.round(56 * scale)}px system-ui, sans-serif`;
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
  ctx.font = `700 ${Math.round(28 * scale)}px system-ui, sans-serif`;
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

  const { w: worldW, h: worldH } = worldSize(recipe.frameCount, sliceW, sliceH);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, sliceW, sliceH);
  ctx.clip();
  if (recipe.composition === "strip") {
    ctx.translate(-sliceIndex * sliceW, 0);
    paintBackground(ctx, recipe, worldW, worldH);
  } else {
    paintBackground(ctx, recipe, sliceW, sliceH);
    ctx.translate(-sliceIndex * sliceW, 0);
  }
  const ordered = [...recipe.devices].sort((a, b) => a.z - b.z);
  const deviceId = opts?.deviceId || recipe.deviceId || state.deviceId;
  for (const inst of ordered) {
    await paintDevice(ctx, sliceW, sliceH, inst, deviceId);
  }
  ctx.restore();

  if (!opts?.skipType) {
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
      paintType(ctx, recipe, sliceW, sliceH, frame, accent);
    }
  }
  return true;
}
