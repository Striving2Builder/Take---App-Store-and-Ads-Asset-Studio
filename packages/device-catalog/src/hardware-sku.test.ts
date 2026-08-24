/** OWNER: packages/device-catalog — SKU hardware cues differ where real devices do */
import { getDevice, listDevices, resetCatalogFromDisk } from "./catalog";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

resetCatalogFromDisk();

{
  const a = getDevice("apple.iphone-14-pro");
  const b = getDevice("apple.iphone-16-pro-max");
  assert(!!a && !!b, "iphones load");
  assert(a!.hardware?.dynamicIsland, "14 Pro island");
  assert(b!.hardware?.dynamicIsland, "16 Pro Max island");
  const mute = a!.hardware?.buttons?.some((x) => x.kind === "mute");
  const action14 = a!.hardware?.buttons?.some((x) => x.kind === "action");
  assert(mute && !action14, "14 Pro has mute, not Action");
  assert(
    b!.hardware?.buttons?.some((x) => x.kind === "camera-control"),
    "16 Pro Max has Camera Control"
  );
  assert(
    b!.hardware?.buttons?.some((x) => x.kind === "action"),
    "16 Pro Max has Action"
  );
  assert(
    a!.shellAssetFront?.includes("iphone-island-14"),
    "14 Pro uses mute-switch front SVG"
  );
}

{
  const p7 = getDevice("google.pixel-7");
  const p9 = getDevice("google.pixel-9");
  assert(!!p7?.hardware?.frontCamera && !!p9?.hardware?.frontCamera, "pixel punch");
  const bar = p7!.hardware!.rearCameras![0];
  const island = p9!.hardware!.rearCameras![0];
  assert(bar.w > island.w * 1.5, "Pixel 7 rear is a wide bar vs Pixel 9 island");
}

{
  const ios = listDevices({ platform: "ios" }).filter((d) => d.formFactor === "phone");
  assert(
    ios.every((d) => d.hardware?.dynamicIsland),
    "every catalog iPhone has an island hotspot"
  );
  const and = listDevices({ platform: "android" }).filter((d) => d.formFactor === "phone");
  assert(
    and.every((d) => d.hardware?.frontCamera),
    "every catalog Android phone has a punch hotspot"
  );
}

console.log("hardware-sku.test ok");
