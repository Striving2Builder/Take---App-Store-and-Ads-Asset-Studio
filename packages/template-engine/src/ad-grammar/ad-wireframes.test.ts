/** OWNER: ad-grammar — wireframe pack smoke test (tsx runnable) */
import { listAdWireframes, getAdWireframe, wireframesForFamily } from "./list-ad-wireframes";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const all = listAdWireframes();
assert(all.length === 100, `expected 100 wireframes, got ${all.length}`);

const ids = new Set(all.map((w) => w.id));
assert(ids.size === all.length, "duplicate wireframe ids");

const families = new Set(all.map((w) => w.family));
assert(families.size === 10, `expected 10 families, got ${families.size}`);
assert(families.has("pinterest"), "pinterest family missing from wireframe pack");

for (const fam of families) {
  const list = wireframesForFamily(fam);
  assert(list.length === 10, `family ${fam} expected 10 wireframes, got ${list.length}`);
}

for (const w of all) {
  assert(w.zones.length > 0, `${w.id} has no zones`);
  assert(w.zones.some((z) => z.kind === "cta"), `${w.id} has no CTA zone — every ad needs one`);
  for (const z of w.zones) {
    assert(z.x >= 0 && z.x <= 1 && z.y >= 0 && z.y <= 1, `${w.id} zone ${z.kind} out of 0..1 bounds (x/y)`);
    assert(z.w > 0 && z.h > 0, `${w.id} zone ${z.kind} has non-positive size`);
    assert(z.x + z.w <= 1.001, `${w.id} zone ${z.kind} overflows right edge`);
    assert(z.y + z.h <= 1.001, `${w.id} zone ${z.kind} overflows bottom edge`);
  }
}

const one = getAdWireframe("mpu-image-bottom-right-cta");
assert(!!one, "known wireframe id should resolve");
assert(one!.family === "mpu", "wireframe family mismatch");

console.log("ad-grammar: wireframes PASS (100 across 10 families)");
