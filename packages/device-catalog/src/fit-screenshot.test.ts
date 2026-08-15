/** OWNER: packages/device-catalog — fit-screenshot unit tests */
import { fitScreenshot, fullCanvasInset } from "./fit-screenshot";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function almost(a: number, b: number, eps = 0.5) {
  return Math.abs(a - b) < eps;
}

// cover: taller dest than src aspect → crop sides
{
  const inset = fullCanvasInset(100, 200);
  const r = fitScreenshot({ srcW: 100, srcH: 100, inset, mode: "cover" });
  assert(almost(r.dw, 100) && almost(r.dh, 200), "cover dest fills inset");
  assert(almost(r.sw, 50) && almost(r.sh, 100), `cover crops width, got ${r.sw}×${r.sh}`);
  assert(almost(r.sx, 25), `cover centers crop sx, got ${r.sx}`);
}

// contain: letterbox
{
  const inset = fullCanvasInset(100, 200);
  const r = fitScreenshot({ srcW: 100, srcH: 100, inset, mode: "contain" });
  assert(almost(r.dw, 100) && almost(r.dh, 100), `contain letterbox size, got ${r.dw}×${r.dh}`);
  assert(almost(r.dx, 0) && almost(r.dy, 50), `contain centered, got ${r.dx},${r.dy}`);
  assert(almost(r.sw, 100) && almost(r.sh, 100), "contain uses full source");
}

// safe-area biases focus
{
  const inset = fullCanvasInset(100, 200);
  const r = fitScreenshot({
    srcW: 200,
    srcH: 100,
    inset,
    mode: "safe-area",
    safeArea: { top: 20, bottom: 20, left: 0, right: 0 },
  });
  assert(almost(r.dw, 100) && almost(r.dh, 200), "safe-area fills inset");
  assert(r.sh > 0 && r.sw > 0, "safe-area has crop");
}

// cross-aspect portrait into wider inset (android-ish → different phone)
{
  const inset = { x: 10, y: 20, w: 80, h: 160 };
  const r = fitScreenshot({ srcW: 1080, srcH: 1920, inset, mode: "cover" });
  assert(almost(r.dx, 10) && almost(r.dy, 20), "cover dest at inset origin");
  assert(almost(r.dw, 80) && almost(r.dh, 160), "cover dest size = inset");
}

console.log("fit-screenshot.test.ts: PASS");
