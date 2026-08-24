/** OWNER: packages/template-engine — empty-with-extras, cap 3, landscape-in-portrait */
import { addExtraSlot } from "../extras/add-extra";
import { ensureIsolatedRecipe } from "../ensure-isolated";
import { resolveMetrics } from "../generate/metrics";
import { MAX_DEVICES_PER_SLICE } from "./limits";
import { validateLayout } from "./validate-layout";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const metrics = resolveMetrics("apple.iphone-16-pro-max", "ios", "portrait");

{
  const base = ensureIsolatedRecipe({ frameCount: 2, deviceId: "apple.iphone-16-pro-max" });
  const withExtra = addExtraSlot(base, "visual", 1, { id: "ex-1", widget: "rating" });
  assert(withExtra.ok, "extra on slice 1");
  if (!withExtra.ok) throw new Error("unreachable");
  const proof = {
    ...withExtra.recipe,
    devices: withExtra.recipe.devices.filter((d) => Math.floor(d.x) !== 1),
  };
  const ok = validateLayout(proof, metrics.sliceW, metrics.sliceH, metrics);
  assert(ok.ok, `proof-only legal: ${ok.errors.join("; ")}`);
  const empty = { ...base, devices: base.devices.filter((d) => Math.floor(d.x) !== 1), extras: [] };
  const bad = validateLayout(empty, metrics.sliceW, metrics.sliceH, metrics);
  assert(!bad.ok && bad.errors.some((e) => e.includes("empty")), "empty PNG still illegal");
}

{
  const recipe = ensureIsolatedRecipe({ frameCount: 1, deviceId: "apple.iphone-16-pro-max" });
  const d0 = recipe.devices[0];
  recipe.devices = [
    { ...d0, id: "a", x: 0.32, w: 0.4, h: 0.4 * metrics.shellAspect, authored: true, z: 1 },
    { ...d0, id: "b", x: 0.5, w: 0.42, h: 0.42 * metrics.shellAspect, authored: true, z: 3 },
    { ...d0, id: "c", x: 0.68, w: 0.4, h: 0.4 * metrics.shellAspect, authored: true, z: 2 },
  ];
  const trio = validateLayout(recipe, metrics.sliceW, metrics.sliceH, metrics);
  assert(trio.ok, `fan 3 legal: ${trio.errors.join("; ")}`);
  recipe.devices.push({ ...d0, id: "d", x: 0.5, y: 0.7, authored: true, z: 4 });
  const four = validateLayout(recipe, metrics.sliceW, metrics.sliceH, metrics);
  assert(!four.ok && four.errors.some((e) => e.includes("4 devices")), "4 phones illegal");
  assert(MAX_DEVICES_PER_SLICE === 3, "cap is 3");
}

{
  const recipe = ensureIsolatedRecipe({ frameCount: 1, deviceId: "apple.iphone-16-pro-max" });
  const w = 0.72;
  recipe.devices[0] = {
    ...recipe.devices[0],
    w,
    h: w / metrics.shellAspect,
    orientation: "landscape",
    authored: true,
    y: 0.55,
  };
  const land = validateLayout(recipe, metrics.sliceW, metrics.sliceH, metrics);
  assert(land.ok, `landscape-in-portrait legal: ${land.errors.join("; ")}`);
}

console.log("validate-layout.test ok");
