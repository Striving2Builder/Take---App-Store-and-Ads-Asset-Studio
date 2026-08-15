/** OWNER: modes/slideshow — dwell defaults */
import { DEFAULT_DWELLS_MS, frameDwellMs } from "./slideshow-builder";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const sum = DEFAULT_DWELLS_MS.reduce((a, b) => a + b, 0);
assert(sum === 15000, `default dwells sum to 15s, got ${sum}`);
assert(frameDwellMs(2400, 6) === 2400, "explicit dwell");
assert(frameDwellMs(undefined, 5) === 3000, "equal split fallback");
assert(frameDwellMs(100, 6) >= 800, "too-short dwell falls back");

console.log("slideshow-builder.test ok");
