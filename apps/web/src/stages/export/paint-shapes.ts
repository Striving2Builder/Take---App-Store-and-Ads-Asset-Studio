/** OWNER: stages/export — procedural ExtraSlot shapes */
import { dotCenters, pointsForShape, type ExtraShape } from "@take/template-engine";

function closePath(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

export function paintShape(
  ctx: CanvasRenderingContext2D,
  shape: ExtraShape,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string
) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = fill;
  if (shape === "dots") {
    for (const d of dotCenters(w, h)) {
      ctx.beginPath();
      ctx.arc(x + d.x, y + d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  if (shape === "wave" || shape === "scribble") {
    const pts = pointsForShape(shape, w, h);
    ctx.lineWidth = Math.max(3, h * 0.08);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x + pts[0].x, y + pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(x + pts[i].x, y + pts[i].y);
    ctx.stroke();
    return;
  }
  const pts = pointsForShape(shape, w, h).map((p) => ({ x: x + p.x, y: y + p.y }));
  closePath(ctx, pts);
  ctx.fill();
}
