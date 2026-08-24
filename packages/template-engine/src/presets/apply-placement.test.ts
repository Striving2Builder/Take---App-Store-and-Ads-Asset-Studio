/** OWNER: packages/template-engine — position preset stamps */
import { ensureIsolatedRecipe } from "../ensure-isolated";
import { slicesTouched } from "../constraints/bleed";
import { resolveMetrics } from "../generate/metrics";
import { STRIP_BLEED_HOOK } from "../seeds/load-recipes";
import { listLayoutRefRecipes } from "../seeds/layout-refs";
import { applyPlacementPreset } from "./apply-placement";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const metrics = resolveMetrics("apple.iphone-16-pro-max", "ios", "portrait");

{
  const isolated = ensureIsolatedRecipe({
    frameCount: 5,
    deviceId: "apple.iphone-16-pro-max",
  });
  const first = isolated.devices[0];
  const bled = applyPlacementPreset({
    recipe: isolated,
    instanceId: first.id,
    preset: "bleed-next",
    sliceIndex: 0,
    metrics,
  });
  assert(bled.ok, bled.ok ? "" : bled.error);
  if (bled.ok) {
    assert(bled.recipe.composition === "strip", "bleed flips isolated → strip");
    const inst = bled.recipe.devices.find((d) => d.id === first.id)!;
    assert(inst.placement === "bleed-next", "placement");
    assert(Math.abs(inst.x - 1) < 0.02, `center on cut, got ${inst.x}`);
    const touched = slicesTouched(inst, 5, metrics.sliceW, metrics.sliceH);
    assert(touched.includes(0) && touched.includes(1), `crosses cut, got ${touched.join(",")}`);
  }

  const last = applyPlacementPreset({
    recipe: isolated,
    instanceId: first.id,
    preset: "bleed-next",
    sliceIndex: 4,
    metrics,
  });
  assert(!last.ok, "last slice cannot bleed-next");

  const prev0 = applyPlacementPreset({
    recipe: isolated,
    instanceId: first.id,
    preset: "bleed-prev",
    sliceIndex: 0,
    metrics,
  });
  assert(!prev0.ok, "first slice cannot bleed-prev");
}

{
  const isolated = ensureIsolatedRecipe({
    frameCount: 5,
    deviceId: "apple.iphone-16-pro-max",
  });
  const id = isolated.devices[1].id;
  const bled = applyPlacementPreset({
    recipe: isolated,
    instanceId: id,
    preset: "bleed-prev",
    sliceIndex: 1,
    metrics,
  });
  assert(bled.ok, bled.ok ? "" : bled.error);
  if (bled.ok) {
    const inst = bled.recipe.devices.find((d) => d.id === id)!;
    assert(inst.placement === "bleed-prev", "bleed-prev placement");
    const touched = slicesTouched(inst, 5, metrics.sliceW, metrics.sliceH);
    assert(touched.includes(0) && touched.includes(1), "bleed-prev crosses cut 1");
  }
}

{
  const centered = applyPlacementPreset({
    recipe: STRIP_BLEED_HOOK,
    instanceId: "bleed-0",
    preset: "center",
    sliceIndex: 0,
    metrics,
  });
  assert(centered.ok, centered.ok ? "" : centered.error);
  if (centered.ok) {
    const inst = centered.recipe.devices.find((d) => d.id === "bleed-0")!;
    assert(inst.placement === "center", "center leaves the cut");
    const touched = slicesTouched(inst, 5, metrics.sliceW, metrics.sliceH);
    assert(touched.length === 1 && touched[0] === 0, "center stays in slice 0");
  }
}

{
  const isolated = ensureIsolatedRecipe({
    frameCount: 5,
    deviceId: "apple.iphone-16-pro-max",
  });
  const tilt = applyPlacementPreset({
    recipe: isolated,
    instanceId: isolated.devices[0].id,
    preset: "tilt-left",
    sliceIndex: 0,
    metrics,
  });
  assert(tilt.ok, tilt.ok ? "" : tilt.error);
  if (tilt.ok) {
    assert(tilt.recipe.devices[0].rotationDeg === -12, "tilt left");
    assert(tilt.recipe.composition === "isolated", "in-slice keeps isolated");
  }
}

{
  const isolated = ensureIsolatedRecipe({
    frameCount: 5,
    deviceId: "apple.iphone-16-pro-max",
  });
  const yaw = applyPlacementPreset({
    recipe: isolated,
    instanceId: isolated.devices[0].id,
    preset: "yaw-right",
    sliceIndex: 0,
    metrics,
  });
  assert(yaw.ok, yaw.ok ? "" : yaw.error);
  if (yaw.ok) {
    const inst = yaw.recipe.devices[0];
    assert(inst.rotateYDeg === 28, "yaw right");
    assert(inst.depth === 0.045, "yaw sets depth");
  }
  const centered = applyPlacementPreset({
    recipe: yaw.ok ? yaw.recipe : isolated,
    instanceId: isolated.devices[0].id,
    preset: "center",
    sliceIndex: 0,
    metrics,
  });
  assert(centered.ok, centered.ok ? "" : centered.error);
  if (centered.ok) {
    const inst = centered.recipe.devices[0];
    assert(!inst.rotateYDeg, "center clears yaw");
  }
}

{
  const isolated = ensureIsolatedRecipe({
    frameCount: 5,
    deviceId: "apple.iphone-16-pro-max",
  });
  isolated.devices[0] = {
    ...isolated.devices[0],
    orientation: "landscape",
    w: 0.58,
    h: 0.58 / metrics.shellAspect,
  };
  const bled = applyPlacementPreset({
    recipe: isolated,
    instanceId: isolated.devices[0].id,
    preset: "bleed-next",
    sliceIndex: 0,
    metrics,
  });
  assert(bled.ok, bled.ok ? "" : bled.error);
  if (bled.ok) {
    const inst = bled.recipe.devices.find((d) => d.id === isolated.devices[0].id)!;
    const expectH = inst.w / metrics.shellAspect;
    assert(Math.abs(inst.h - expectH) < 0.02, `landscape bleed h ${inst.h} vs ${expectH}`);
    assert(inst.h < inst.w, "landscape bleed stays wide");
  }
}

{
  const stack = listLayoutRefRecipes().find((r) => r.id === "layout-yaw-stack-5");
  assert(!!stack, "yaw-stack seed");
  const fourth = applyPlacementPreset({
    recipe: stack!,
    instanceId: "ys0",
    preset: "bleed-next",
    sliceIndex: 0,
    metrics,
  });
  assert(!fourth.ok, "fourth bleed blocked on yaw-stack");
}

console.log("apply-placement.test ok");
