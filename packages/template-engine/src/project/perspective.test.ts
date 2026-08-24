/** OWNER: packages/template-engine — 2.5D box project */
import type { DeviceInstance } from "../template.types";
import { deviceAabb } from "../constraints/aabb";
import { pointHitsDevice } from "../constraints/hit-device";
import { validateLayout } from "../constraints/validate-layout";
import { toWorldInstance } from "../constraints/world";
import { resolveMetrics } from "../generate/metrics";
import { listLayoutRefRecipes } from "../seeds/layout-refs";
import { hasPerspective, instanceAabb, projectDeviceBox, warpStrips } from "./perspective";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const sliceW = 1290;
const sliceH = 2796;

const flat: DeviceInstance = {
  id: "flat",
  x: 0.5,
  y: 0.5,
  w: 0.5,
  h: 1.0,
  rotationDeg: 0,
  z: 1,
  shotIndex: 0,
  placement: "center",
};

{
  assert(!hasPerspective(flat), "zero yaw is 2D");
  const world = toWorldInstance(flat, sliceW, sliceH);
  const a = instanceAabb(flat, sliceW, sliceH);
  const b = deviceAabb(world.x, world.y, world.w, world.h, 0);
  assert(Math.abs(a.x - b.x) < 1 && Math.abs(a.w - b.w) < 1, "identity AABB matches 2D");
  assert(Math.abs(a.y - b.y) < 1 && Math.abs(a.h - b.h) < 1, "identity AABB height");
}

{
  const yaw: DeviceInstance = { ...flat, rotateYDeg: 28, depth: 0.05 };
  assert(hasPerspective(yaw), "28° yaw is perspective");
  const box = projectDeviceBox(yaw, sliceW, sliceH);
  const frontXs = box.front.map((p) => p.x);
  const frontW = Math.max(...frontXs) - Math.min(...frontXs);
  assert(box.aabb.w > frontW + 6, `sides add thickness (${box.aabb.w} vs front ${frontW})`);
  const world = toWorldInstance(yaw, sliceW, sliceH);
  assert(pointHitsDevice(yaw, world.x, world.y, sliceW, sliceH), "center still hits yawed phone");
  assert(!pointHitsDevice(yaw, 4, 4, sliceW, sliceH), "far corner misses");
  assert(box.faces.some((f) => f.kind === "front" && f.visible), "front visible at 28°");
  assert(box.faces.some((f) => f.kind === "side" && f.visible), "at least one side visible at 28°");
  assert(box.faces.some((f) => f.kind === "side" && !f.visible), "hidden side is culled");
  assert(warpStrips(box.screen, 18).length === 18, "18 warp strips");
}

{
  const box = projectDeviceBox(flat, sliceW, sliceH);
  assert(box.faces.find((f) => f.kind === "front")?.visible, "identity front visible");
  assert(!box.faces.find((f) => f.kind === "back")?.visible, "identity back culled");
  assert(
    box.faces.filter((f) => f.kind === "side").every((f) => !f.visible),
    "identity sides edge-on"
  );
}

{
  const recipe = listLayoutRefRecipes().find((r) => r.id === "layout-yaw-bleed-5");
  assert(!!recipe, "yaw-bleed recipe exists");
  if (recipe) {
    const bleed = recipe.devices.find((d) => d.id === "yaw-bleed")!;
    assert(bleed.rotateYDeg === 28 && bleed.depth === 0.05, "gold yaw fields");
    assert(recipe.composition === "strip", "gold is strip");
    const m = resolveMetrics("apple.iphone-16-pro-max", "ios", "portrait");
    const check = validateLayout(recipe, m.sliceW, m.sliceH, { inset: m.inset });
    assert(check.ok, `yaw-bleed illegal: ${check.errors.join("; ")}`);
  }
}

console.log("perspective.test ok");
