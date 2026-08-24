/** OWNER: packages/template-engine — slice add/remove/fan/orient */
import { ensureIsolatedRecipe } from "../ensure-isolated";
import { addExtraSlot } from "../extras/add-extra";
import { resolveMetrics } from "../generate/metrics";
import {
  addDeviceOnSlice,
  removeLocalDevicesOnSlice,
  setInstanceOrientation,
  stampFan3OnSlice,
} from "./slice-devices";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const metrics = resolveMetrics("apple.iphone-16-pro-max", "ios", "portrait");
const base = ensureIsolatedRecipe({ frameCount: 3, deviceId: "apple.iphone-16-pro-max" });

{
  const fan = stampFan3OnSlice({ recipe: base, sliceIndex: 1, metrics });
  assert(fan.ok, fan.ok ? "" : fan.error);
  if (!fan.ok) throw new Error("unreachable");
  const on1 = fan.recipe.devices.filter((d) => Math.abs(Math.floor(d.x) - 1) < 1 && d.x >= 1 && d.x < 2);
  assert(on1.length === 3, `fan places 3, got ${on1.length}`);
}

{
  const added = addDeviceOnSlice({ recipe: base, sliceIndex: 0, metrics });
  assert(added.ok, added.ok ? "" : added.error);
  if (!added.ok) throw new Error("unreachable");
  assert(added.recipe.devices.length === 4, "second phone on slice 0");
}

{
  const blocked = removeLocalDevicesOnSlice({ recipe: base, sliceIndex: 0, metrics });
  assert(!blocked.ok, "cannot leave a PNG empty without extras");
  const withEx = addExtraSlot(base, "copy", 0, { id: "need-ex", widget: "pills" });
  assert(withEx.ok, "pills extra");
  if (!withEx.ok) throw new Error("unreachable");
  const removed = removeLocalDevicesOnSlice({ recipe: withEx.recipe, sliceIndex: 0, metrics });
  assert(removed.ok, removed.ok ? "" : removed.error);
  if (!removed.ok) throw new Error("unreachable");
  assert(!removed.recipe.devices.some((d) => Math.floor(d.x) === 0), "slice 0 has no phone");
}

{
  const inst = base.devices[2];
  const land = setInstanceOrientation({
    recipe: base,
    instanceId: inst.id,
    orientation: "landscape",
    metrics,
  });
  assert(land.ok, land.ok ? "" : land.error);
  if (!land.ok) throw new Error("unreachable");
  const d = land.recipe.devices.find((x) => x.id === inst.id)!;
  assert(d.orientation === "landscape", "orientation stamped");
  assert(d.h < d.w, "landscape box is wider than tall");
}

console.log("slice-devices.test ok");
