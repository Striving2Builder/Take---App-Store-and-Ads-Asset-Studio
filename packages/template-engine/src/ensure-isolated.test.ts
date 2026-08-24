/** OWNER: packages/template-engine — isolated recipe + panorama dest size */
import { backgroundDestSize, worldSize } from "./constraints/aabb";
import { applyStripPanorama, ensureIsolatedRecipe } from "./ensure-isolated";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

{
  const recipe = ensureIsolatedRecipe({ frameCount: 3, palette: ["#ff4d1a", "#111318"] });
  assert(recipe.composition === "isolated", "new recipe is isolated");
  assert(recipe.frameCount === 3, "uses actual frame count, not generator clamp");
  assert(recipe.devices.length === 3, "one centered device per frame");
  assert(recipe.devices[0].x === 0.5 && recipe.devices[1].x === 1.5, "devices sit on slice centers");
  assert(recipe.devices[2].shotIndex === 2, "shotIndex matches frame");
  assert(recipe.background.kind === "solid" && recipe.background.colorA === "#111318", "palette pad color");
}

{
  const first = ensureIsolatedRecipe({ frameCount: 2, deviceId: "apple.iphone-16-pro-max" });
  first.devices[0].authored = true;
  first.devices[0].x = 0.4;
  const grown = ensureIsolatedRecipe({ existing: first, frameCount: 4 });
  assert(grown.devices.find((d) => d.id === first.devices[0].id)?.x === 0.4, "keeps authored device");
  assert(grown.frameCount === 4 && grown.devices.length === 4, "pads missing slices");
}

{
  const recipe = ensureIsolatedRecipe({ frameCount: 2, deviceId: "apple.iphone-16-pro-max" });
  recipe.devices = recipe.devices.filter((d) => Math.floor(d.x) !== 1);
  recipe.extras = [
    {
      id: "hold-1",
      kind: "copy",
      sliceIndex: 1,
      x: 1.5,
      y: 0.4,
      w: 0.6,
      h: 0.2,
      rotationDeg: 0,
      z: 20,
      widget: "review",
      authored: true,
    },
  ];
  const kept = ensureIsolatedRecipe({ existing: recipe, frameCount: 2 });
  assert(!kept.devices.some((d) => Math.floor(d.x) === 1), "does not refill a proof-only slice");
  assert(kept.extras?.length === 1, "keeps extras");
}

{
  const recipe = ensureIsolatedRecipe({ frameCount: 5 });
  const pano = applyStripPanorama(recipe, "data:image/png;base64,AAA", "cover");
  assert(pano.composition === "strip", "panorama switches to strip");
  assert(pano.background.kind === "image", "background is image");
  assert(pano.background.imageUrl === "data:image/png;base64,AAA", "stores data-URL");
  assert(pano.background.fit === "cover", "cover fit");
}

{
  const sliceW = 1000;
  const sliceH = 2000;
  const n = 5;
  const world = worldSize(n, sliceW, sliceH);
  assert(world.w === n * sliceW && world.h === sliceH, "world width is n·W");
  const strip = backgroundDestSize("strip", n, sliceW, sliceH);
  assert(strip.w === n * sliceW, "strip panorama dest is the joined world");
  const iso = backgroundDestSize("isolated", n, sliceW, sliceH);
  assert(iso.w === sliceW && iso.h === sliceH, "isolated + image dest is one slice (no fake join)");
}

console.log("ensure-isolated.test ok");
