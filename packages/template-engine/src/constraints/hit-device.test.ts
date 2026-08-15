/** OWNER: packages/template-engine — hit-test + transform */
import type { DeviceInstance } from "../template.types";
import { hitDevice } from "./hit-device";
import { moveDevice, resizeDevice, rotateDevice } from "./transform-device";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const sliceW = 1000;
const sliceH = 2000;

const center: DeviceInstance = {
  id: "a",
  x: 0.5,
  y: 0.5,
  w: 0.4,
  h: 0.8,
  rotationDeg: 0,
  z: 1,
  shotIndex: 0,
  placement: "center",
};

{
  const hit = hitDevice([center], 0, 0.5, 0.5, sliceW, sliceH);
  assert(hit?.id === "a", "center of slice hits device");
  const miss = hitDevice([center], 0, 0.05, 0.05, sliceW, sliceH);
  assert(!miss, "corner of slice misses device");
}

{
  const moved = moveDevice(center, 0.2, -0.1);
  assert(moved.x === 0.7 && moved.y === 0.4, "move adds slice units");
  assert(moved.authored === true, "move marks authored");
}

{
  const rot = rotateDevice(center, 12);
  assert(rot.rotationDeg === 12, "rotate adds degrees");
}

{
  const bigger = resizeDevice(center, "se", 0.1, 0.1, sliceW, sliceH);
  assert(bigger.w > center.w, "se resize grows width");
  assert(bigger.authored === true, "resize marks authored");
  const nw = center.x - center.w / 2;
  assert(Math.abs(bigger.x - bigger.w / 2 - nw) < 1e-6, "se keeps northwest x");
}

{
  const top: DeviceInstance = { ...center, id: "top", z: 5, w: 0.2, h: 0.4 };
  const hit = hitDevice([center, top], 0, 0.5, 0.5, sliceW, sliceH);
  assert(hit?.id === "top", "higher z wins");
}

console.log("hit-device.test ok");
