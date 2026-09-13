/**
 * OWNER: shared — single source of truth for sizing a preview <canvas>'s
 * raster (intrinsic pixel) size against its actual on-screen CSS size.
 *
 * A canvas painted at a fixed pixel width but displayed at a larger CSS size
 * (via 100%/auto-fill grid stretch, or simply because devicePixelRatio > 1 —
 * 125%/150%/200% Windows scaling, Retina displays, ...) gets upscaled by the
 * browser and reads as blurry. Every preview canvas in this app should raster
 * at its real on-screen width x devicePixelRatio instead of a fixed literal.
 */
export function rasterSizeFor(cssWidth: number, dpr: number, fallback: number): number {
  const width = cssWidth > 0 ? cssWidth : fallback;
  const ratio = dpr > 0 ? dpr : 1;
  // Cap at 2x — plenty sharp for a preview/thumbnail, without ballooning
  // raster cost on 3x+ mobile devicePixelRatios.
  return Math.round(width * Math.min(ratio, 2));
}
