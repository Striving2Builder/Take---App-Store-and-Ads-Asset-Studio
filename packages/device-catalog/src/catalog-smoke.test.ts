/** OWNER: packages/device-catalog — validate + resolve + catalog smoke */
import { getDevice, listDevices, resetCatalogFromDisk } from "./catalog";
import { resolveDefaultDevice } from "./resolve-default";
import { resolveExportSize } from "./resolve-export-size";
import { resolvePickerGroup, PICKER_CURRENT_YEARS } from "./filter-age";
import { validateDevice } from "./validate-device";
import { loadCatalogDevices } from "./load-catalog";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

resetCatalogFromDisk();
const all = loadCatalogDevices();
assert(all.length >= 19, `expected >=19 devices, got ${all.length}`);

for (const d of all) {
  const r = validateDevice(d);
  assert(r.ok, `invalid ${d.id}: ${!r.ok ? r.errors.join(", ") : ""}`);
}

const pro = getDevice("apple.iphone-16-pro");
assert(!!pro, "iphone-16-pro exists");
assert(pro!.exportPx.w === 1206 && pro!.exportPx.h === 2622, "F28: Pro is 1206×2622");

const max = getDevice("apple.iphone-16-pro-max");
assert(!!max && max.exportPx.w === 1320 && max.exportPx.h === 2868, "Pro Max 1320×2868");

const iosDef = resolveDefaultDevice("ios");
assert(iosDef?.id === "apple.iphone-16-pro-max", `ios default is Pro Max, got ${iosDef?.id}`);

const andDef = resolveDefaultDevice("android");
assert(andDef?.id === "google.pixel-9", `android default Pixel 9, got ${andDef?.id}`);

const i17 = getDevice("apple.iphone-17-pro");
assert(!!i17, "iphone-17-pro published");
assert((i17!.source || "").includes("inferredFrom"), "17 Pro chrome labeled inherited");
assert(!!getDevice("apple.iphone-16"), "iphone-16 published");
assert(!!getDevice("google.pixel-10"), "pixel-10 published");
assert(!!getDevice("samsung.galaxy-s25"), "galaxy-s25 published");

const size = resolveExportSize("google.pixel-9");
assert(size.size.w === 1080 && size.size.h === 2424 && !size.fellBack, "pixel export size");

const fb = resolveExportSize("does.not.exist", "ios");
assert(fb.fellBack && fb.deviceId === "apple.iphone-16-pro-max", "unknown id falls back");

const asOf = new Date("2026-08-14");
const current = listDevices({ asOf }).filter((d) => resolvePickerGroup(d, asOf) === "current");
const older = listDevices({ asOf }).filter((d) => resolvePickerGroup(d, asOf) === "older");
assert(current.length > 0, "has current devices");
assert(older.some((d) => d.id === "apple.iphone-14-pro"), "14 Pro in older group");
assert(current.every((d) => resolvePickerGroup(d, asOf) === "current"), "current group check");
assert(PICKER_CURRENT_YEARS === 3, "picker current = 3y");

// Never delete: getDevice still finds supported older IDs
assert(!!getDevice("apple.iphone-14-pro"), "older id still resolvable");

console.log("catalog-smoke.test.ts: PASS");
