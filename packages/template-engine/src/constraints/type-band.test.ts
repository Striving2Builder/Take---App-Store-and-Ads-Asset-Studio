/** OWNER: packages/template-engine — per-slice type band */
import { setSliceTypeBand, typeBandForSlice, typeBandRect } from "./type-band";
import { ensureIsolatedRecipe } from "../ensure-isolated";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

{
  const recipe = ensureIsolatedRecipe({ frameCount: 5 });
  assert(typeBandForSlice(recipe, 0) === "top", "fallback typeFamily");
  const next = setSliceTypeBand(recipe, 2, "none");
  assert(next.typeBand?.length === 5, "band length matches frames");
  assert(typeBandForSlice(next, 2) === "none", "slice 2 none");
  assert(typeBandForSlice(next, 0) === "top", "other slices keep family");
}

{
  const none = typeBandRect("none", 1000, 2000, "m");
  assert(none.w === 0 && none.h === 0, "none has no rect");
  const bottom = typeBandRect("bottom", 1000, 2000, "m");
  assert(bottom.y > 1000, "bottom sits low");
}

console.log("type-band.test ok");
