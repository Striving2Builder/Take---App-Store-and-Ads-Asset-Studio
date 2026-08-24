/** OWNER: packages/template-engine — apply + hydrate */
import { applyTemplate } from "./apply-template";
import { recipeFromSaved } from "./from-saved";
import { STRIP_BLEED_HOOK } from "../seeds/strip-bleed-hook";
import type { InferenceBrief } from "@take/core";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const brief: InferenceBrief = {
  name: "Harbor",
  category: "Health",
  audience: "runners",
  where: "phone",
  when: "morning",
  how: "tap",
  features: ["Sleep"],
  positioning: "Calm nights",
  narrative: "",
  value: "Rest",
  differentiators: [],
  style: "premium",
  platform: "ios",
  locale: "en-US",
  goal: "install",
  host: "example.com",
  mode: "template",
  donot: "",
  tone: "",
  ux: "",
  refs: "",
};

const strip = recipeFromSaved({
  id: "seed-strip-bleed-hook",
  name: "x",
  frames: 99,
});
assert(strip.id === STRIP_BLEED_HOOK.id, "hydrate hits seed");
assert(strip.composition === "strip", "seed composition");
assert(strip.frameCount === 5, "seed owns count, not library 99");

const isolated = recipeFromSaved({
  id: "sys-ios-story",
  name: "iOS Story Spine",
  frames: 8,
  deviceId: "apple.iphone-16-pro-max",
  defaultOrientation: "portrait",
  tags: ["ios"],
});
assert(isolated.composition === "isolated", "unknown id is isolated");
assert(isolated.frameCount === 8, "isolated count from library");
assert(isolated.devices.length === 0, "no fake devices on unknown cards");

const sample = recipeFromSaved({
  id: "sys-ios-isolated-5",
  name: "x",
  frames: 99,
});
assert(sample.devices.length === 5, "system sample hydrates devices");
assert(sample.frameCount === 5, "sample owns count");

const applied = applyTemplate({ recipe: strip, brief, shotCount: 3 });
assert(applied.frames.length === 5, "recipe frame count");
assert(applied.shotByFrame[0] === 0 && applied.shotByFrame[2] === 2, "ordered shots");
assert(applied.shotByFrame[3] === undefined, "no modulo pad");
assert(applied.frames[0].headline === "Harbor", "HOOK uses name");
assert(applied.frames[3].headline === "Rest", "PROOF uses value — not a recycled HOOK");

console.log("apply-template.test ok");
