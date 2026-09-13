/** OWNER: shared — force best-quality resampling on every compositing 2D context.
 *  Browsers don't guarantee imageSmoothingQuality defaults to "high", so a
 *  downscaled cover-crop (e.g. a large scanned screenshot fit into a smaller
 *  device screen box) can render softer than necessary without this. */
export function applyHighQualitySmoothing(ctx: CanvasRenderingContext2D): void {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}
