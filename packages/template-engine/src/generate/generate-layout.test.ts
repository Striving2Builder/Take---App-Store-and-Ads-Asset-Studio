/** OWNER: packages/template-engine — generateLayout tests */
import { generateLayout } from "./generate-layout";
import { loadGrammar } from "../grammar/load-grammar";
import { validateLayout } from "../constraints/validate-layout";
import { resolveMetrics } from "./metrics";
import type { Grammar } from "../grammar/tokens";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function cloneGrammar(): Grammar {
  return JSON.parse(JSON.stringify(loadGrammar())) as Grammar;
}

const deviceId = "apple.iphone-16-pro-max";
const metrics = resolveMetrics(deviceId, "ios", "portrait");

{
    const a = generateLayout({ deviceId, shotCount: 5, seed: "lock-alpha", metrics });
  const b = generateLayout({ deviceId, shotCount: 5, seed: "lock-alpha", metrics });
  assert(JSON.stringify(a.devices) === JSON.stringify(b.devices), "same seed → same devices");
  assert(a.provenance?.seed === "lock-alpha", "seed stored");
  assert(a.provenance?.grammarVersion === "2026.08", "grammarVersion stored");
  assert(a.id === b.id, "same id");
}

{
  const locked = generateLayout({
    deviceId,
    shotCount: 5,
    seed: "brand-lock",
    metrics,
    lockBrand: true,
    palette: ["#111111", "#222222"],
  });
  assert(locked.lockBrand === true, "lockBrand stamped on recipe");
  assert(locked.palette?.[0] === "#111111", "locked palette kept");
}

{
  const c = generateLayout({ deviceId, shotCount: 5, seed: "lock-beta", metrics });
  const a = generateLayout({ deviceId, shotCount: 5, seed: "lock-alpha", metrics });
  assert(JSON.stringify(a.devices) !== JSON.stringify(c.devices), "different seeds differ");
}

{
  const grammar = cloneGrammar();
  grammar.productions.bleedBudget = { "0": 0, "1": 1, "2": 0 };
  const recipe = generateLayout({
    deviceId,
    shotCount: 5,
    seed: "bleed-force",
    composition: "strip",
    grammar,
    metrics,
  });
  const check = validateLayout(recipe, metrics.sliceW, metrics.sliceH);
  assert(check.ok, `forced strip must be legal: ${check.errors.join("; ")}`);
  if (!recipe.provenance?.fallback) {
    const bleeder = recipe.devices.find((d) => d.placement === "bleed-next" || d.placement === "bleed-prev");
    assert(!!bleeder, "strip with bleedBudget 1 places a bleeder");
  }
}

{
  const grammar = cloneGrammar();
  grammar.productions.composition = { isolated: 1, strip: 0 };
  grammar.productions.typeFamily = { top: 1, bottom: 0, split: 0 };
  const band = { x: [0.45, 0.55] as [number, number], y: [0.02, 0.08] as [number, number], w: [0.72, 0.8] as [number, number], rot: [0, 0] as [number, number] };
  grammar.tokens.placements.center = band;
  grammar.tokens.placements.left = band;
  grammar.tokens.placements.right = band;
  const recipe = generateLayout({
    deviceId,
    shotCount: 5,
    seed: "force-fail",
    composition: "isolated",
    grammar,
    k: 4,
    metrics,
  });
  assert(recipe.provenance?.fallback === true, "all-K fail → fallback");
  assert(recipe.composition === "isolated", "fallback is isolated");
  assert(recipe.devices.every((d) => d.placement === "center"), "fallback centers");
  const check = validateLayout(recipe, metrics.sliceW, metrics.sliceH);
  assert(check.ok, `fallback must be legal: ${check.errors.join("; ")}`);
}

{
  const recipe = generateLayout({ deviceId, shotCount: 8, seed: "n-eight", metrics });
  assert(recipe.frameCount === 8, "shot count 8 → 8 frames");
  const padded = generateLayout({ deviceId, shotCount: 2, seed: "n-pad", metrics });
  assert(padded.frameCount === 5, "short shot list pads to 5");
}

console.log("generate-layout.test ok");
