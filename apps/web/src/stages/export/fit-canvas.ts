/** OWNER: stages/export — scale a painted frame onto a target canvas */
import { fitRect, type ExportFit } from "@take/export-presets";
import { applyHighQualitySmoothing } from "../../shared/canvas-quality";

export function fitCanvas(
  src: HTMLCanvasElement,
  dest: HTMLCanvasElement,
  fit: ExportFit,
  padColor: string
): void {
  const ctx = dest.getContext("2d");
  if (!ctx) return;
  applyHighQualitySmoothing(ctx);
  ctx.fillStyle = padColor || "#0c0d10";
  ctx.fillRect(0, 0, dest.width, dest.height);
  const place = fitRect(src.width, src.height, dest.width, dest.height, fit);
  ctx.drawImage(src, place.sx, place.sy, place.sw, place.sh, place.dx, place.dy, place.dw, place.dh);
}

export async function canvasPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png")
  );
  return new Uint8Array(await blob.arrayBuffer());
}
