/** OWNER: packages/template-engine — bleed + AABB tests (no DOM) */
import { STRIP_BLEED_HOOK } from "../seeds/strip-bleed-hook";
import { bleedLegal, visibleFrac, slicesTouched } from "./bleed";
import { intersectArea, sliceRect } from "./aabb";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

{
  const a = { x: 0, y: 0, w: 10, h: 10 };
  const b = { x: 5, y: 0, w: 10, h: 10 };
  assert(intersectArea(a, b) === 50, "intersect overlap");
  const s = sliceRect(2, 100, 50);
  assert(s.x === 200 && s.w === 100 && s.h === 50, "slice origin");
}

const W = 1320;
const H = 2868;
const n = STRIP_BLEED_HOOK.frameCount;
const bleeder = STRIP_BLEED_HOOK.devices.find((d) => d.placement === "bleed-next");
assert(!!bleeder, "seed has bleed-next");
if (bleeder) {
  const touched = slicesTouched(bleeder, n, W, H);
  assert(touched.includes(0) && touched.includes(1), `bleed touches 0 and 1, got ${touched.join(",")}`);
  const f0 = visibleFrac(bleeder, 0, W, H);
  const f1 = visibleFrac(bleeder, 1, W, H);
  assert(f0 >= 0.28, `slice 0 visibleFrac ${f0}`);
  assert(f1 >= 0.28, `slice 1 visibleFrac ${f1}`);
  assert(bleedLegal(bleeder, n, W, H), "bleed-next is legal");
}

const local = STRIP_BLEED_HOOK.devices.find((d) => d.id === "local-1");
assert(!!local, "local device in slice 1");
if (local) {
  const touched = slicesTouched(local, n, W, H);
  assert(touched.length === 1 && touched[0] === 1, `local stays in slice 1, got ${touched.join(",")}`);
  assert(bleedLegal(local, n, W, H), "centered local is legal");
}

console.log("bleed.test ok");
