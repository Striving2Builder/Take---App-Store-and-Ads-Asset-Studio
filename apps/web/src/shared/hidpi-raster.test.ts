/** OWNER: shared — every preview canvas in the app rasters through this function */
import { rasterSizeFor } from "./hidpi-raster";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// Standard 100%-scale display: CSS width alone is enough, no upscale needed.
assert(rasterSizeFor(260, 1, 264) === 260, "dpr 1 rasters at the box's CSS width");

// This is the bug this function exists to prevent: a fixed raster that
// ignored devicePixelRatio, so any scaled/HiDPI display (125%/150%/200%
// Windows scaling, Retina, ...) forced the browser to upscale the bitmap to
// fill the real physical pixel grid.
assert(rasterSizeFor(260, 2, 264) === 520, "dpr 2 doubles the raster width so HiDPI displays stay crisp");
assert(rasterSizeFor(260, 1.5, 264) === 390, "fractional dpr (e.g. 150% Windows scaling) scales proportionally");

// Cap runaway dpr (e.g. some mobile browsers report 3+) — export-quality
// raster isn't needed for a small editor/thumbnail preview, just enough to
// avoid visible blur.
assert(rasterSizeFor(260, 4, 264) === 520, "dpr is capped at 2x to avoid oversized rasters");

// Before layout, clientWidth reads 0 — fall back to the caller's known CSS
// width rather than rastering a 0x0 (or NaN-sized) canvas. Each call site
// passes its own fallback (264 for #layout-stage, 180 for library cards, ...).
assert(rasterSizeFor(0, 2, 264) === 528, "falls back to the caller's CSS width when not yet laid out");
assert(rasterSizeFor(0, 1, 180) === 180, "fallback is per-caller, not hardcoded");

console.log("hidpi-raster.test ok");
