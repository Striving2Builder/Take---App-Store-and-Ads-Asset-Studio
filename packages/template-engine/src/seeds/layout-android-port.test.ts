/** OWNER: packages/template-engine — bind layout geometry to store shell */
import {
  applyShellBind,
  bindRecipeShell,
  forAndroid,
  IOS,
  IOS_ASPECT,
  PLAY,
  PLAY_ASPECT,
  storeShellFromPlatform,
} from "./layout-android-port";
import type { TemplateRecord } from "../template.types";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const mobile: TemplateRecord = {
  id: "layout-stagger-crop-5",
  name: "Layout · stagger crop",
  tags: ["mobile", "layout", "screenshots"],
  version: 1,
  composition: "isolated",
  deviceId: IOS,
  defaultOrientation: "portrait",
  frameCount: 5,
  typeFamily: "top",
  typeScale: "m",
  background: { kind: "solid", colorA: "#111" },
  devices: [
    {
      id: "a",
      x: 0.5,
      y: 0.5,
      w: 0.5,
      h: 0.5 * IOS_ASPECT,
      rotationDeg: 0,
      z: 1,
      shotIndex: 0,
      placement: "center",
    },
    {
      id: "b",
      x: 1.5,
      y: 0.5,
      w: 0.4,
      h: 0.4 / IOS_ASPECT,
      rotationDeg: 0,
      z: 1,
      shotIndex: 1,
      placement: "center",
      orientation: "landscape",
    },
  ],
  extras: [],
};

const play = bindRecipeShell(mobile, "android");
assert(play.id === mobile.id, "bind keeps id");
assert(play.name === mobile.name, "bind keeps name");
assert(play.deviceId === PLAY, "Pixel 9");
assert(Math.abs(play.devices[0].h - play.devices[0].w * PLAY_ASPECT) < 1e-9, "portrait Pixel");
assert(Math.abs(play.devices[1].h - play.devices[1].w / PLAY_ASPECT) < 1e-9, "landscape Pixel");

const back = bindRecipeShell(play, "ios");
assert(back.deviceId === IOS, "back to iPhone");
assert(Math.abs(back.devices[0].h - back.devices[0].w * IOS_ASPECT) < 1e-9, "portrait iPhone");

const mut = structuredClone(mobile);
applyShellBind(mut, "android");
assert(mut.deviceId === PLAY && mut.id === mobile.id, "in-place bind");

const legacy = forAndroid(mobile);
assert(legacy.id === "layout-stagger-crop-play-5", "legacy twin id still works");

assert(storeShellFromPlatform("android") === "android", "brief android");
assert(storeShellFromPlatform("ios") === "ios", "brief ios");
assert(storeShellFromPlatform("both", "google.pixel-9") === "android", "both + pixel");
assert(storeShellFromPlatform("both", "apple.iphone-16-pro-max") === "ios", "both + iphone");

console.log("layout-android-port.test ok");
