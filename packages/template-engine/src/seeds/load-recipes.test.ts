/** OWNER: packages/template-engine — hydrate + validate sample recipes */
import { recipeFromSaved } from "../apply/from-saved";
import { validateLayout } from "../constraints/validate-layout";
import { resolveMetrics } from "../generate/metrics";
import { hasRealLayout } from "../template.types";
import { bindRecipeShell } from "./layout-android-port";
import { listSystemRecipes, STRIP_BLEED_HOOK } from "./load-recipes";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const recipes = listSystemRecipes();
assert(recipes.length === 51, "sample five + 20 mobile layouts + 10 competitor-research layouts + 16 reference-screenshot layouts");
assert(
  recipes.every((r) => hasRealLayout(r) && r.frameCount >= 1),
  "every system recipe has real content — a device, or a real extra (device-free compositions are intentional now)"
);

const ids = recipes.map((r) => r.id);
assert(ids.includes("seed-strip-bleed-hook"), "bleed hook");
assert(ids.includes("sys-ios-isolated-5"), "ios 5");
assert(ids.includes("layout-stagger-crop-5"), "stagger crop");
assert(!ids.includes("layout-stagger-crop-play-5"), "no Play twin of stagger");
assert(ids.includes("layout-two-up-mid-5"), "two-up");
assert(ids.includes("layout-blob-across-5"), "blob across");
assert(ids.includes("layout-fan-3-5"), "fan 3");
assert(ids.includes("layout-proof-mid-5"), "proof mid");
assert(ids.includes("layout-yaw-bleed-5"), "yaw bleed");
assert(ids.includes("layout-type-marks-5"), "type marks");
assert(ids.includes("layout-tilt-crop-5"), "tilt crop");
assert(ids.includes("layout-proof-pills-5"), "proof pills");
assert(ids.includes("layout-photo-span-5"), "photo span");
assert(ids.includes("layout-yaw-stack-5"), "yaw stack");
assert(!ids.includes("layout-mini-scatter-5"), "mini scatter removed");
assert(ids.includes("layout-proof-float-5"), "proof float");

const layouts = recipes.filter((r) => r.id.startsWith("layout-"));
assert(layouts.length === 46, `46 mobile layouts, got ${layouts.length}`);
assert(
  layouts.every((r) => (r.tags || []).includes("mobile") && !(r.tags || []).includes("ios")),
  "geometry pack tagged mobile, not ios-only"
);
assert(
  !recipes.some((r) => r.id.includes("-play-5")),
  "no *-play-5 twin cards in Library list"
);

const photo = recipes.find((r) => r.id === "layout-photo-span-5")!;
assert(
  photo.extras?.some((e) => e.kind === "visual" && !e.imageUrl && !e.shape && !e.widget),
  "photo span is an empty plate, not stock art"
);
const overlay = recipes.find((r) => r.id === "layout-overlay-photo-5")!;
assert(
  overlay.extras?.some((e) => e.kind === "visual" && !e.imageUrl && !e.widget),
  "overlay photo is an empty plate"
);

for (const recipe of recipes) {
  for (const extra of recipe.extras || []) {
    if (extra.widget === "rating") {
      assert(extra.score == null, `${recipe.id} rating has no fabricated score`);
      assert(
        !/app store/i.test(extra.storeLabel || ""),
        `${recipe.id} rating is not labeled as a live store stat`
      );
    }
    if (extra.widget === "review") {
      assert(
        extra.attribution !== "Alex" && extra.attribution !== "Sam",
        `${recipe.id} review is not a fake person`
      );
    }
  }
}
assert(!ids.includes("sys-ios-story"), "title SEED gone");

const play = recipes.find((r) => r.id === "sys-play-isolated-8")!;
assert(play.frameCount === 8 && play.devices.length === 8, "Play 8 slots");
assert(play.deviceId === "google.pixel-9", "Play binds Pixel 9");

const ios10 = recipes.find((r) => r.id === "sys-ios-isolated-10")!;
assert(ios10.frameCount === 10 && ios10.devices.length === 10, "iOS 10 slots");
assert(ios10.deviceId === "apple.iphone-16-pro-max", "iOS binds Pro Max");

assert(STRIP_BLEED_HOOK.composition === "strip", "bleed is strip");
assert(STRIP_BLEED_HOOK.frameCount === 5, "bleed owns 5");

for (const recipe of recipes) {
  const hydrated = recipeFromSaved({ id: recipe.id, name: "x", frames: 99 });
  assert(hydrated.id === recipe.id, `hydrate ${recipe.id}`);
  assert(hydrated.frameCount === recipe.frameCount, `count owned by ${recipe.id}`);
  assert(hasRealLayout(hydrated), `real content on ${recipe.id}`);
  const platform = (recipe.tags || []).includes("android") ? "android" : "ios";
  const m = resolveMetrics(
    recipe.deviceId || "apple.iphone-16-pro-max",
    platform,
    "portrait"
  );
  const result = validateLayout(recipe, m.sliceW, m.sliceH, { inset: m.inset });
  assert(result.ok, `${recipe.id} illegal: ${result.errors.join("; ")}`);
}

const stagger = recipes.find((r) => r.id === "layout-stagger-crop-5")!;
const playBound = bindRecipeShell(stagger, "android");
{
  const m = resolveMetrics(playBound.deviceId!, "android", "portrait");
  const result = validateLayout(playBound, m.sliceW, m.sliceH, { inset: m.inset });
  assert(result.ok, `stagger play bind illegal: ${result.errors.join("; ")}`);
}

const unknown = recipeFromSaved({
  id: "sys-ios-story",
  name: "gone",
  frames: 8,
});
assert(unknown.devices.length === 0, "unknown id is empty isolated, not a fake look");
assert(unknown.frameCount === 8, "unknown keeps asked count");

console.log("load-recipes.test ok");
