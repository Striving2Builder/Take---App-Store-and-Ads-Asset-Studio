/** OWNER: packages/template-engine — ordered shot map (no modulo) */
import { mapShotsToFrames } from "./map-shots";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

{
  const mapped = mapShotsToFrames(["a", "b"], 4);
  assert(mapped.length === 4, "pads to frame count");
  assert(mapped[0] === "a" && mapped[1] === "b", "ordered 1:1");
  assert(mapped[2] === undefined && mapped[3] === undefined, "extra frames honest empty");
}

{
  const mapped = mapShotsToFrames(["a", "b", "c", "d", "e"], 3);
  assert(mapped.length === 3, "does not cycle extras onto the spine");
  assert(mapped[0] === "a" && mapped[2] === "c", "prefix only");
}

console.log("map-shots.test ok");
