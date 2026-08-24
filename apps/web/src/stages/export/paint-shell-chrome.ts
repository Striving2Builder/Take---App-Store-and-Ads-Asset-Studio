/** OWNER: stages/export — island / punch / buttons / home indicator on geometric shells */
import type { DeviceProfile, HardwareButton, PxSize, ScreenInset } from "@take/device-catalog";
import { lerpPt, type Quad } from "@take/template-engine";
import { roundRect } from "./canvas-round-rect";
import { shellRectToLocal, shellUv, type LocalRect } from "./shell-chrome-map";

function fillLocalRound(
  ctx: CanvasRenderingContext2D,
  r: LocalRect,
  fill: string,
  rad: number
) {
  ctx.fillStyle = fill;
  roundRect(ctx, r.x, r.y, r.w, r.h, rad);
  ctx.fill();
}

function paintIslandLocal(ctx: CanvasRenderingContext2D, r: LocalRect) {
  const rad = Math.min(r.h / 2, r.w / 2);
  fillLocalRound(ctx, r, "#050506", rad);
  const cy = r.y + r.h / 2;
  const lensX = r.x + r.w * 0.78;
  ctx.fillStyle = "#1a2030";
  ctx.beginPath();
  ctx.arc(lensX, cy, Math.max(1.5, r.h * 0.16), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0e1218";
  ctx.beginPath();
  ctx.arc(lensX + r.h * 0.28, cy, Math.max(1.2, r.h * 0.12), 0, Math.PI * 2);
  ctx.fill();
}

function paintPunchLocal(ctx: CanvasRenderingContext2D, r: LocalRect) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const outer = Math.max(r.w, r.h) / 2;
  ctx.fillStyle = "#050506";
  ctx.beginPath();
  ctx.arc(cx, cy, outer, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2a3038";
  ctx.lineWidth = Math.max(1, outer * 0.12);
  ctx.stroke();
  ctx.fillStyle = "#1a2430";
  ctx.beginPath();
  ctx.arc(cx, cy, outer * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function buttonFill(kind: HardwareButton["kind"]): string {
  if (kind === "camera-control") return "#6a7080";
  if (kind === "action") return "#4a4e58";
  if (kind === "mute") return "#3a3e48";
  return "#5a5e68";
}

function paintButtonsLocal(
  ctx: CanvasRenderingContext2D,
  buttons: HardwareButton[],
  shell: PxSize,
  localW: number,
  localH: number,
  originX: number,
  originY: number
) {
  const thickness = Math.max(2, localW * 0.018);
  for (const b of buttons) {
    const y = originY + (b.y / Math.max(1, shell.h)) * localH;
    const h = (b.h / Math.max(1, shell.h)) * localH;
    const x = b.side === "left" ? originX - thickness * 0.35 : originX + localW - thickness * 0.65;
    ctx.fillStyle = buttonFill(b.kind);
    roundRect(ctx, x, y, thickness, h, thickness * 0.35);
    ctx.fill();
  }
}

function homeIndicatorRect(
  device: DeviceProfile,
  shell: PxSize,
  inset: { x: number; y: number; w: number; h: number },
  localW: number,
  localH: number,
  originX: number,
  originY: number
): LocalRect | null {
  if (device.platform !== "ios" || device.formFactor === "tablet") return null;
  if (device.hardware?.homeIndicator) {
    return shellRectToLocal(device.hardware.homeIndicator, shell, localW, localH, originX, originY);
  }
  const barW = localW * inset.w * 0.36;
  const barH = Math.max(3, localH * 0.006);
  const sx = originX + localW * inset.x;
  const sy = originY + localH * inset.y;
  const sw = localW * inset.w;
  const sh = localH * inset.h;
  return {
    x: sx + (sw - barW) / 2,
    y: sy + sh - barH - sh * 0.028,
    w: barW,
    h: barH,
  };
}

/** Paint chrome in local device space (origin top-left of shell, after translate/rotate). */
export function paintShellChromeLocal(
  ctx: CanvasRenderingContext2D,
  device: DeviceProfile,
  shell: PxSize,
  localW: number,
  localH: number,
  originX: number,
  originY: number,
  inset: { x: number; y: number; w: number; h: number }
) {
  const hw = device.hardware;
  if (hw?.dynamicIsland) {
    paintIslandLocal(
      ctx,
      shellRectToLocal(hw.dynamicIsland, shell, localW, localH, originX, originY)
    );
  } else if (hw?.frontCamera) {
    paintPunchLocal(ctx, shellRectToLocal(hw.frontCamera, shell, localW, localH, originX, originY));
  }
  if (hw?.buttons?.length) {
    paintButtonsLocal(ctx, hw.buttons, shell, localW, localH, originX, originY);
  }
  const home = homeIndicatorRect(device, shell, inset, localW, localH, originX, originY);
  if (home) fillLocalRound(ctx, home, "rgba(243,241,236,0.55)", home.h / 2);
}

function mapUv(front: Quad, u: number, v: number) {
  const top = lerpPt(front[0], front[1], u);
  const bot = lerpPt(front[3], front[2], u);
  return lerpPt(top, bot, v);
}

function rectToQuad(front: Quad, rect: ScreenInset, shell: PxSize): Quad {
  const a = shellUv(rect.x, rect.y, shell);
  const b = shellUv(rect.x + rect.w, rect.y, shell);
  const c = shellUv(rect.x + rect.w, rect.y + rect.h, shell);
  const d = shellUv(rect.x, rect.y + rect.h, shell);
  return [mapUv(front, a.u, a.v), mapUv(front, b.u, b.v), mapUv(front, c.u, c.v), mapUv(front, d.u, d.v)];
}

function fillPts(
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

/** Projected front: map shellPx chrome onto the front face quad. */
export function paintShellChromeProjected(
  ctx: CanvasRenderingContext2D,
  device: DeviceProfile,
  shell: PxSize,
  front: Quad
) {
  const hw = device.hardware;
  if (hw?.dynamicIsland) {
    fillPts(ctx, rectToQuad(front, hw.dynamicIsland, shell), "#050506");
  } else if (hw?.frontCamera) {
    const q = rectToQuad(front, hw.frontCamera, shell);
    const cx = (q[0].x + q[1].x + q[2].x + q[3].x) / 4;
    const cy = (q[0].y + q[1].y + q[2].y + q[3].y) / 4;
    const r =
      Math.hypot(q[1].x - q[0].x, q[1].y - q[0].y) / 2 ||
      Math.hypot(q[3].x - q[0].x, q[3].y - q[0].y) / 2;
    ctx.fillStyle = "#050506";
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2, r), 0, Math.PI * 2);
    ctx.fill();
  }
  if (device.platform === "ios" && device.formFactor !== "tablet") {
    const hi =
      hw?.homeIndicator ||
      ({
        x: shell.w * 0.32,
        y: shell.h * 0.94,
        w: shell.w * 0.36,
        h: shell.h * 0.008,
      } satisfies ScreenInset);
    fillPts(ctx, rectToQuad(front, hi, shell), "rgba(243,241,236,0.5)");
  }
}
