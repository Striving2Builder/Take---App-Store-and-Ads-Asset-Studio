/** OWNER: packages/template-engine — layout reading from a screenshot, on synthetic images */
import { analyseScreenshot } from "./analyse";
import { recipeFromAnalysis } from "./to-recipe";
import { mergeVision, panelsNeedingHelp, parseVision } from "./vision";
import { validateLayout } from "../constraints/validate-layout";
import { resolveMetrics } from "../generate/metrics";
import type { Pixels } from "./pixels";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

type Rgb = [number, number, number];
type Phone = { cx: number; cy: number; w: number; rotDeg: number };
const PW = 200;
const H = 430;
const GAP = 8;

/** A strip of flat-colour panels on a white gap, each optionally holding one rotated phone. */
function strip(panels: { bg: Rgb; phone?: Phone; noise?: boolean }[]): Pixels {
  const W = panels.length * PW + (panels.length - 1) * GAP;
  const data = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = 255;
  }
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  panels.forEach((p, k) => {
    const x0 = k * (PW + GAP);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < PW; x++) {
        const o = (y * W + x0 + x) * 4;
        const n = p.noise ? (rnd() - 0.5) * 160 : 0;
        data[o] = Math.max(0, Math.min(255, p.bg[0] + n));
        data[o + 1] = Math.max(0, Math.min(255, p.bg[1] + n));
        data[o + 2] = Math.max(0, Math.min(255, p.bg[2] + n));
      }
    }
    if (!p.phone) return;
    const wd = p.phone.w * PW;
    const ht = wd * 2.1641;
    const r = (p.phone.rotDeg * Math.PI) / 180;
    const cx = x0 + p.phone.cx * PW;
    const cy = p.phone.cy * H;
    for (let y = 0; y < H; y++) {
      for (let x = x0; x < x0 + PW; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const u = dx * Math.cos(r) + dy * Math.sin(r);
        const v = -dx * Math.sin(r) + dy * Math.cos(r);
        if (Math.abs(u) <= wd / 2 && Math.abs(v) <= ht / 2) {
          const o = (y * W + x) * 4;
          const edge = Math.abs(u) > wd / 2 - 5 || Math.abs(v) > ht / 2 - 5;
          const c = edge ? 20 : 235;
          data[o] = c;
          data[o + 1] = c;
          data[o + 2] = c;
        }
      }
    }
  });
  return { width: W, height: H, data };
}

const upright: Phone = { cx: 0.5, cy: 0.55, w: 0.6, rotDeg: 0 };
const blue: Rgb = [230, 236, 250];

// Three panels: flat colour + upright phone, + tilted phone, + upright phone.
const a = analyseScreenshot(
  strip([
    { bg: blue, phone: upright },
    { bg: blue, phone: { ...upright, rotDeg: 20 } },
    { bg: blue, phone: upright },
  ])
);
assert(a.panels.length === 3, `3 panels found, got ${a.panels.length}`);
assert(a.splitMethod === "gutters", "split from the gaps, not guessed");
assert(
  a.panels.every((p) => p.bg.kind === "solid" && p.bg.status === "measured"),
  "flat background measured: " + JSON.stringify(a.panels.map((p) => [p.bg, p.unresolved]))
);
assert(a.panels.every((p) => p.devices.length === 1), "one phone in each panel");
const tilted = a.panels[1].devices[0];
assert(Math.abs(tilted.rotationDeg - 20) < 4, `tilt read as ~20°, got ${tilted.rotationDeg}`);
assert(Math.abs(a.panels[0].devices[0].w - 0.6) < 0.08, `width read as ~60%, got ${a.panels[0].devices[0].w}`);
assert(Math.abs(a.panels[0].devices[0].rotationDeg) < 3, "upright phone reads as upright");

// The recipe keeps geometry only, one shared background, and is a legal layout.
const built = recipeFromAnalysis(a, { id: "user-derived-test", name: "Test" });
assert(built.recipe.frameCount === 3 && built.recipe.devices.length === 3, "recipe has the phones that were read");
assert(built.recipe.composition === "isolated" && built.recipe.background.kind === "solid", "shared solid background");
assert(!built.empty, "not empty");
assert(built.recipe.extras?.length === 0, "no source text, logos or imagery carried over");
const m = resolveMetrics("apple.iphone-16-pro-max", "ios", "portrait");
const legal = validateLayout(built.recipe, m.sliceW, m.sliceH, { inset: m.inset });
assert(legal.ok, `derived recipe is a legal layout: ${legal.errors.join("; ")}`);

// Different panel colours become a per-panel colour band on a strip.
const multi = analyseScreenshot(
  strip([
    { bg: [240, 140, 160], phone: upright },
    { bg: [40, 180, 150], phone: upright },
    { bg: [150, 130, 220], phone: upright },
  ])
);
const mb = recipeFromAnalysis(multi, { id: "user-derived-multi", name: "Multi" });
assert(
  mb.recipe.composition === "strip" && mb.recipe.background.kind === "image",
  "per-panel colours use a colour band"
);

// A photo-like (noisy) background is reported as unreadable, never guessed at.
const noisy = analyseScreenshot(
  strip([
    { bg: [120, 120, 120], phone: upright, noise: true },
    { bg: [120, 120, 120], phone: upright, noise: true },
  ]),
  { panelCount: 2 }
);
assert(
  noisy.panels.every((p) => p.bg.kind === "unreadable" && p.bg.status === "unreadable"),
  "noisy background unreadable"
);
assert(noisy.panels.every((p) => p.devices.length === 0), "no phones claimed on an unreadable background");
assert(noisy.panels.every((p) => p.unresolved.length > 0), "the unreadable panels say why");
assert(panelsNeedingHelp(noisy).length === 2, "both panels are offered to the vision model");

// Vision answers are checked strictly and merged only where the local read gave up.
assert(!parseVision("not json").ok, "junk rejected");
assert(
  !parseVision(
    JSON.stringify({ panels: [{ background: { kind: "solid", colorA: "red" }, textBand: "top", devices: [] }] })
  ).ok,
  "bad colour rejected"
);
const good = parseVision(
  JSON.stringify({
    panels: [0, 1].map(() => ({
      background: { kind: "solid", colorA: "#778899" },
      textBand: "top",
      devices: [{ cx: 0.5, cy: 0.55, width: 0.6, rotationDeg: 10, spansNext: false }],
    })),
  })
);
assert(good.ok, "valid answer accepted");
if (good.ok) {
  const merged = mergeVision(noisy, good.read);
  assert(!merged.error, "merged");
  assert(
    merged.analysis.panels.every((p) => p.devices[0]?.status === "vision" && p.bg.status === "vision"),
    "vision values are labelled as vision"
  );
  assert(mergeVision(a, good.read).error !== undefined, "a panel-count mismatch is refused, not forced");
}

console.log("derive.test ok");
