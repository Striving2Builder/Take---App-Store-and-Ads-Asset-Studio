/** OWNER: editor/canvas — layout-stage must not raster below its real on-screen size */
import { resolveStageRasterWidth } from "./edit-canvas";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// Standard 100%-scale display: CSS width alone is enough, no upscale needed.
assert(
  resolveStageRasterWidth(260, 1) === 260,
  "dpr 1 rasters at the box's CSS width"
);

// This is the bug: a fixed 264px raster ignored devicePixelRatio, so any
// scaled/HiDPI display (125%/150%/200% Windows scaling, Retina, ...) forced
// the browser to upscale the bitmap to fill the real physical pixel grid.
assert(
  resolveStageRasterWidth(260, 2) === 520,
  "dpr 2 doubles the raster width so HiDPI displays stay crisp"
);
assert(
  resolveStageRasterWidth(260, 1.5) === 390,
  "fractional dpr (e.g. 150% Windows scaling) scales the raster proportionally"
);

// Cap runaway dpr (e.g. some mobile browsers report 3+) — export-quality raster
// isn't needed for a small editor preview, just enough to avoid visible blur.
assert(
  resolveStageRasterWidth(260, 4) === 520,
  "dpr is capped at 2x to avoid oversized rasters"
);

// Before layout, clientWidth reads 0 — fall back to the known CSS width (264)
// rather than rastering a 0x0 (or NaN-sized) canvas.
assert(
  resolveStageRasterWidth(0, 2) === 528,
  "falls back to the 264px CSS width when the box hasn't been laid out yet"
);

console.log("edit-canvas.test ok");
