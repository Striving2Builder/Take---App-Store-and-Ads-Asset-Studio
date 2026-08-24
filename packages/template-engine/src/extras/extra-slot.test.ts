/** OWNER: packages/template-engine — ExtraSlot add / hit / move */
import { addExtraSlot } from "./add-extra";
import { hitExtra } from "./hit-extra";
import { moveExtra } from "./transform-extra";
import { ensureIsolatedRecipe, MAX_EXTRAS_PER_SLICE } from "../ensure-isolated";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const sliceW = 1000;
const sliceH = 2000;
const base = ensureIsolatedRecipe({ frameCount: 2 });

{
  const added = addExtraSlot(base, "copy", 0, { id: "ex-c", text: "Hello" });
  assert(added.ok, "copy extra added");
  if (!added.ok) throw new Error("unreachable");
  assert(added.recipe.extras?.length === 1, "one extra");
  assert(added.recipe.extras?.[0].kind === "copy", "kind copy");
  assert(added.recipe.extras?.[0].text === "Hello", "text stored");
  assert(added.recipe.extras?.[0].sliceIndex === 0, "home slice");
}

{
  const vis = addExtraSlot(base, "visual", 1, { id: "ex-v", fill: "#ff4d1a" });
  assert(vis.ok && vis.recipe.extras?.[0].kind === "visual", "visual extra");
}

{
  const shaped = addExtraSlot(base, "visual", 0, { id: "ex-blob", shape: "blob" });
  assert(shaped.ok && shaped.recipe.extras?.[0].shape === "blob", "shape stored");
}

{
  const faced = addExtraSlot(base, "copy", 0, { id: "ex-face", text: "Hello **there**", face: "script" });
  assert(faced.ok && faced.recipe.extras?.[0].face === "script", "face stored");
  assert(faced.ok && faced.recipe.extras?.[0].text?.includes("**there**"), "markers stored raw");
}

{
  const rated = addExtraSlot(base, "visual", 0, { id: "ex-rate", widget: "rating" });
  assert(rated.ok && rated.recipe.extras?.[0].widget === "rating", "widget stored");
  assert(rated.ok && rated.recipe.extras?.[0].score == null, "rating default has no fake score");
  assert(rated.ok && rated.recipe.extras?.[0].storeLabel === "Sample rating", "sample label");
}

{
  let recipe = base;
  for (let i = 0; i < MAX_EXTRAS_PER_SLICE; i++) {
    const r = addExtraSlot(recipe, "copy", 0, { id: `cap-${i}` });
    assert(r.ok, `extra ${i} fits`);
    if (r.ok) recipe = r.recipe;
  }
  const overflow = addExtraSlot(recipe, "copy", 0, { id: "cap-x" });
  assert(!overflow.ok, "cap 6 per slice");
}

{
  const added = addExtraSlot(base, "copy", 0, {
    id: "hit-me",
    x: 0.5,
    y: 0.2,
    w: 0.4,
    h: 0.1,
  });
  if (!added.ok) throw new Error("add failed");
  const slot = added.recipe.extras![0];
  const hit = hitExtra(added.recipe.extras!, 0, 0.5, 0.2, sliceW, sliceH);
  assert(hit?.id === "hit-me", "center of extra hits");
  const miss = hitExtra(added.recipe.extras!, 0, 0.05, 0.9, sliceW, sliceH);
  assert(!miss, "far corner misses extra");
  const moved = moveExtra(slot, 0.2, -0.05);
  assert(Math.abs(moved.x - 0.7) < 1e-9 && Math.abs(moved.y - 0.15) < 1e-9, "move adds slice units");
  assert(moved.authored === true, "move marks authored");
  assert(moved.text === slot.text, "move keeps copy text");
}

console.log("extra-slot.test ok");
