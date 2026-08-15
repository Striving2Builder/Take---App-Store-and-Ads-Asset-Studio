/** OWNER: services/device-sync — barrel generator smoke */
import { generateBarrelSource, identFromRel } from "./write-barrel";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(identFromRel("2024/ios/apple.iphone-16-pro.json") === "apple_iphone_16_pro", "ident");
const src = generateBarrelSource([
  "2024/ios/apple.iphone-16-pro.json",
  "catalogs/ignored/manifest.json",
]);
assert(src.includes('import apple_iphone_16_pro from "../../../catalogs/devices/2024/ios/apple.iphone-16-pro.json";'), "import path");
assert(src.includes("loadCatalogDevices"), "exports loader");
assert(!src.includes("manifest.json"), "skips manifest");

console.log("device-sync.write-barrel.test ok");
