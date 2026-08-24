/** OWNER: packages/template-engine — save snapshot keeps yaw + extra face */
import { recipeFromSaved } from "../apply/from-saved";
import { listSystemRecipes } from "../seeds/load-recipes";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const yaw = listSystemRecipes().find((r) => r.id === "layout-yaw-bleed-5");
assert(!!yaw, "yaw-bleed seed");
const yawSnap = recipeFromSaved({
  id: "user-yaw",
  name: "Saved yaw",
  frames: 5,
  layout: JSON.parse(JSON.stringify(yaw)),
});
assert(
  yawSnap.devices.some((d) => d.rotateYDeg === 28 && d.depth === 0.05),
  "rotateYDeg survives save snapshot"
);

const marks = listSystemRecipes().find((r) => r.id === "layout-type-marks-5");
assert(!!marks, "type-marks seed");
const markSnap = recipeFromSaved({
  id: "user-marks",
  name: "Saved marks",
  frames: 5,
  layout: JSON.parse(JSON.stringify(marks)),
});
assert(
  markSnap.extras?.some((e) => e.face === "script" || (e.text || "").includes("**")),
  "extra face / marks survive save snapshot"
);

console.log("persist-layout.test ok");
