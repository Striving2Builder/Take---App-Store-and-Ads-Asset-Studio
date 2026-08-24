/** OWNER: packages/template-engine — shape path counts */
import { blobPoints, dotCenters, scribblePoints, starPoints, wavePoints } from "./shape-path";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(blobPoints(100, 80).length === 8, "blob 8");
assert(starPoints(100, 100).length === 16, "star 8 spikes");
assert(wavePoints(120, 40).length === 17, "wave inclusive");
assert(scribblePoints(100, 40).length === 12, "scribble");
assert(dotCenters(100, 60).length === 12, "4x3 dots");

console.log("shape-path.test ok");
