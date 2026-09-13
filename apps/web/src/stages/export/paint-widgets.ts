/** OWNER: stages/export — rating / review / pills ExtraSlot widgets */
import { widgetCopy, type ExtraSlot } from "@take/template-engine";
import type { Ink } from "../../shared/contrast-ink";
import { wrapText } from "./canvas-text";
import { roundRect } from "./canvas-round-rect";

function paintStars(ctx: CanvasRenderingContext2D, cx: number, y: number, count: number, size: number) {
  const n = Math.max(1, Math.min(5, Math.round(count)));
  ctx.fillStyle = "#e8c36a";
  ctx.font = `700 ${Math.round(size)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("★★★★★".slice(0, n), cx, y);
  ctx.textAlign = "left";
}

function paintWreath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  ctx.strokeStyle = fill;
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.72, Math.PI * 1.28);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI * 0.28, Math.PI * 0.28);
  ctx.stroke();
}

export function paintSampleMarker(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(26,26,26,0.55)";
  ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.012);
  ctx.setLineDash([Math.max(4, w * 0.03), Math.max(4, w * 0.02)]);
  roundRect(ctx, x, y, w, h, Math.min(16, h * 0.12));
  ctx.stroke();
  ctx.restore();
}

/** Sample content (unfilled rating/review/tags) is dimmed + dashed so it
 *  reads as "fill this in" — never mistaken for real, shippable copy. */
export function paintWidget(
  ctx: CanvasRenderingContext2D,
  slot: ExtraSlot,
  x: number,
  y: number,
  w: number,
  h: number,
  sceneInk: Ink
) {
  const fill = slot.fill || "#f3f1ec";
  const ink = "#1a1a1a";
  const copy = widgetCopy(slot);
  ctx.save();
  if (copy.isSample) ctx.globalAlpha = 0.45;
  if (slot.widget === "rating") {
    // Drawn straight onto the scene background (no card behind it) —
    // needs the scene's own contrast ink, not a fixed pale default.
    const sceneFill = slot.fill || sceneInk.text;
    paintWreath(ctx, x + w / 2, y + h * 0.42, Math.min(w, h) * 0.42, sceneFill);
    ctx.fillStyle = sceneFill;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${Math.max(14, Math.round(h * 0.28))}px system-ui, sans-serif`;
    ctx.fillText(copy.scoreText, x + w / 2, y + h * 0.36);
    ctx.font = `600 ${Math.max(9, Math.round(h * 0.14))}px system-ui, sans-serif`;
    ctx.fillText(copy.storeLabel, x + w / 2, y + h * 0.72);
    ctx.textAlign = "left";
    paintStars(ctx, x + w / 2, y + h * 0.54, copy.stars, h * 0.16);
  } else if (slot.widget === "review") {
    ctx.fillStyle = fill;
    roundRect(ctx, x, y, w, h, Math.min(16, h * 0.12));
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.font = `600 ${Math.max(11, Math.round(h * 0.18))}px system-ui, sans-serif`;
    ctx.textBaseline = "top";
    wrapText(ctx, copy.quote, x + w * 0.08, y + h * 0.14, w * 0.84, Math.max(14, h * 0.22));
    paintStars(ctx, x + w * 0.28, y + h * 0.78, copy.stars, h * 0.14);
    ctx.fillStyle = ink;
    ctx.font = `600 ${Math.max(10, Math.round(h * 0.12))}px system-ui, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(`— ${copy.attribution}`, x + w * 0.48, y + h * 0.78);
  } else {
    const labels = copy.pills;
    let px = x;
    let py = y;
    const gap = Math.max(6, w * 0.02);
    const ph = Math.max(22, h * 0.7);
    ctx.font = `700 ${Math.max(10, Math.round(ph * 0.42))}px system-ui, sans-serif`;
    ctx.textBaseline = "middle";
    for (const label of labels) {
      const tw = ctx.measureText(label).width + ph * 0.9;
      if (px + tw > x + w && px > x) {
        px = x;
        py += ph + gap;
      }
      ctx.fillStyle = fill;
      roundRect(ctx, px, py, tw, ph, ph / 2);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.fillText(label, px + ph * 0.4, py + ph / 2);
      px += tw + gap;
    }
  }
  ctx.restore();
  if (copy.isSample) paintSampleMarker(ctx, x, y, w, h);
}
