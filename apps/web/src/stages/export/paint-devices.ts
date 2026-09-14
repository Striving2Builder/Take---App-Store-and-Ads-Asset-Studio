/** OWNER: stages/export — geometric device shells (2D + projected 2.5D) */
import { getDevice, MAX_SCREENSHOT_UPSCALE } from "@take/device-catalog";
import {
  hasPerspective,
  projectDeviceBox,
  resolveMetrics,
  toWorldInstance,
  warpStrips,
  type DeviceInstance,
} from "@take/template-engine";
import { state } from "../../app/app-state";
import { loadImg } from "./canvas-text";
import { shotUrlAt } from "./selected-shots";
import { roundRect } from "./canvas-round-rect";
import { paintShellChromeLocal, paintShellChromeProjected } from "./paint-shell-chrome";
import { applyHighQualitySmoothing } from "../../shared/canvas-quality";

function fillQuad(
  ctx: CanvasRenderingContext2D,
  pts: Array<{ x: number; y: number }>,
  fill: string
) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function coverShot(
  off: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sw: number,
  sh: number
) {
  off.fillStyle = "#0c0d10";
  off.fillRect(0, 0, sw, sh);
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (iw < 1 || ih < 1) return;
  // Cover the screen box, but never stretch a low-res source past the point of
  // visible blur — pad with the shell color instead of smearing pixels that
  // don't exist. Well-matched screenshots (the common case) render pixel-sharp.
  const scale = Math.min(Math.max(sw / iw, sh / ih), MAX_SCREENSHOT_UPSCALE);
  const dw = iw * scale;
  const dh = ih * scale;
  off.drawImage(img, (sw - dw) / 2, (sh - dh) / 2, dw, dh);
}

/** Whole screenshot visible, letterboxed on whichever axis has slack — the
 *  opposite trade-off from cover (nothing cropped, but bars can show if the
 *  screenshot's aspect doesn't match the device screen's). */
function containShot(
  off: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sw: number,
  sh: number
) {
  off.fillStyle = "#0c0d10";
  off.fillRect(0, 0, sw, sh);
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (iw < 1 || ih < 1) return;
  const scale = Math.min(Math.min(sw / iw, sh / ih), MAX_SCREENSHOT_UPSCALE);
  const dw = iw * scale;
  const dh = ih * scale;
  off.drawImage(img, (sw - dw) / 2, (sh - dh) / 2, dw, dh);
}

async function screenBitmap(
  img: HTMLImageElement | null,
  sw: number,
  sh: number,
  fit: "cover" | "contain" = "cover"
): Promise<HTMLCanvasElement | null> {
  const w = Math.max(8, Math.round(sw));
  const h = Math.max(8, Math.round(sh));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  applyHighQualitySmoothing(ctx);
  if (img) (fit === "contain" ? containShot : coverShot)(ctx, img, w, h);
  else {
    ctx.fillStyle = "#0c0d10";
    ctx.fillRect(0, 0, w, h);
  }
  return canvas;
}

function cornerRadius(family: string | undefined, localW: number): number {
  if (family === "ipad") return localW * 0.06;
  if (family?.includes("flip")) return localW * 0.14;
  if (family?.includes("pixel")) return localW * 0.1;
  if (family?.includes("galaxy")) return localW * 0.11;
  return localW * 0.12;
}

function paintFlat(
  ctx: CanvasRenderingContext2D,
  world: DeviceInstance,
  inset: { x: number; y: number; w: number; h: number },
  shot: HTMLCanvasElement | null,
  deviceId: string,
  orientation: "portrait" | "landscape"
) {
  const device = getDevice(deviceId);
  const shell =
    orientation === "landscape"
      ? device?.shellPxLandscape ||
        (device?.shellPx ? { w: device.shellPx.h, h: device.shellPx.w } : undefined)
      : device?.shellPx;
  ctx.save();
  ctx.translate(world.x, world.y);
  ctx.rotate((world.rotationDeg * Math.PI) / 180);
  const x = -world.w / 2;
  const y = -world.h / 2;
  ctx.fillStyle = "#14151a";
  roundRect(ctx, x, y, world.w, world.h, cornerRadius(device?.shellFamily, world.w));
  ctx.fill();
  const sx = x + world.w * inset.x;
  const sy = y + world.h * inset.y;
  const sw = world.w * inset.w;
  const sh = world.h * inset.h;
  ctx.save();
  roundRect(ctx, sx, sy, sw, sh, world.w * 0.08);
  ctx.clip();
  if (shot) ctx.drawImage(shot, sx, sy, sw, sh);
  else {
    ctx.fillStyle = "#0c0d10";
    ctx.fillRect(sx, sy, sw, sh);
  }
  ctx.restore();
  if (device && shell) {
    paintShellChromeLocal(ctx, device, shell, world.w, world.h, x, y, inset);
  }
  ctx.restore();
}

function warpScreen(
  ctx: CanvasRenderingContext2D,
  quad: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }, { x: number; y: number }],
  shot: HTMLCanvasElement
) {
  const strips = warpStrips(quad, 18);
  const srcW = shot.width;
  const srcH = shot.height;
  for (const s of strips) {
    const a = s.tr.x - s.tl.x;
    const b = s.tr.y - s.tl.y;
    const c = s.bl.x - s.tl.x;
    const d = s.bl.y - s.tl.y;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(s.tl.x, s.tl.y);
    ctx.lineTo(s.tr.x, s.tr.y);
    ctx.lineTo(s.br.x, s.br.y);
    ctx.lineTo(s.bl.x, s.bl.y);
    ctx.closePath();
    ctx.clip();
    ctx.transform(a, b, c, d, s.tl.x, s.tl.y);
    const sx = s.t0 * srcW;
    const sw = Math.max(1, (s.t1 - s.t0) * srcW);
    ctx.drawImage(shot, sx, 0, sw, srcH, 0, 0, 1, 1);
    ctx.restore();
  }
}

function paintProjected(
  ctx: CanvasRenderingContext2D,
  inst: DeviceInstance,
  sliceW: number,
  sliceH: number,
  inset: { x: number; y: number; w: number; h: number },
  shot: HTMLCanvasElement | null,
  deviceId: string,
  orientation: "portrait" | "landscape"
) {
  const device = getDevice(deviceId);
  const shell =
    orientation === "landscape"
      ? device?.shellPxLandscape ||
        (device?.shellPx ? { w: device.shellPx.h, h: device.shellPx.w } : undefined)
      : device?.shellPx;
  const box = projectDeviceBox(inst, sliceW, sliceH, inset);
  for (const face of box.faces) {
    if (!face.visible) continue;
    if (face.kind === "back") fillQuad(ctx, face.pts, "#0a0b0e");
    else if (face.kind === "side") fillQuad(ctx, face.pts, "#1c1e26");
    else fillQuad(ctx, face.pts, "#14151a");
  }
  if (shot) warpScreen(ctx, box.screen, shot);
  else fillQuad(ctx, box.screen, "#0c0d10");
  if (device && shell) paintShellChromeProjected(ctx, device, shell, box.front);
}

export async function paintDevice(
  ctx: CanvasRenderingContext2D,
  sliceW: number,
  sliceH: number,
  inst: DeviceInstance,
  deviceId?: string,
  recipeDefault?: "portrait" | "landscape"
) {
  const id = deviceId || state.deviceId;
  const world = toWorldInstance(inst, sliceW, sliceH);
  const imgUrl = shotUrlAt(inst.shotIndex);
  const img = imgUrl ? await loadImg(imgUrl) : null;
  const instOrient = inst.orientation || recipeDefault || state.orientation;
  const inset = resolveMetrics(id, state.platform, instOrient).inset;
  const sw = world.w * inset.w;
  const sh = world.h * inset.h;
  const shot = await screenBitmap(img, sw, sh, inst.fit || "cover");
  if (hasPerspective(inst)) {
    paintProjected(ctx, inst, sliceW, sliceH, inset, shot, id, instOrient);
    return;
  }
  paintFlat(ctx, world, inset, shot, id, instOrient);
}
