/** OWNER: packages/template-engine — sample vs authored widget copy */
import { widgetCopy, SAMPLE_ATTRIBUTION, SAMPLE_QUOTE, SAMPLE_SCORE_TEXT, SAMPLE_STORE_LABEL } from "./widget-copy";
import type { ExtraSlot } from "../template.types";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const base: ExtraSlot = {
  id: "w",
  kind: "visual",
  sliceIndex: 0,
  x: 0.5,
  y: 0.5,
  w: 0.7,
  h: 0.16,
  rotationDeg: 0,
  z: 22,
};

{
  const copy = widgetCopy({ ...base, widget: "rating" });
  assert(copy.scoreText === SAMPLE_SCORE_TEXT, "empty score is an em dash");
  assert(copy.storeLabel === SAMPLE_STORE_LABEL, "default label is sample");
  assert(copy.isSample, "rating without score is sample");
}

{
  const copy = widgetCopy({ ...base, widget: "rating", score: 4.9, storeLabel: "Rating on App Store" });
  assert(copy.scoreText === "4.9", "authored score paints");
  assert(copy.storeLabel === "Rating on App Store", "authored label paints");
  assert(!copy.isSample, "score means user-authored");
}

{
  const copy = widgetCopy({ ...base, kind: "copy", widget: "review" });
  assert(copy.quote === SAMPLE_QUOTE, "empty review is a prompt");
  assert(copy.attribution === SAMPLE_ATTRIBUTION, "empty name is Sample");
  assert(copy.isSample, "empty review is sample");
}

{
  const copy = widgetCopy({
    ...base,
    kind: "copy",
    widget: "review",
    quote: "We use it every morning.",
    attribution: "Jordan",
  });
  assert(copy.quote.includes("morning"), "authored quote");
  assert(copy.attribution === "Jordan", "authored name");
  assert(!copy.isSample, "authored review is not sample");
}

{
  const copy = widgetCopy({ ...base, kind: "copy", widget: "pills", pills: ["Cook", "Plan", "Share"] });
  assert(copy.pills.join(",") === "Cook,Plan,Share", "no real features — falls back to authored pills");
  assert(copy.isSample, "authored-only pills (no real brief data) are still marked sample");
}

{
  const copy = widgetCopy(
    { ...base, kind: "copy", widget: "pills", pills: ["Cook", "Plan", "Share"] },
    ["Offline sync", "Dark mode"]
  );
  assert(copy.pills.join(",") === "Offline sync,Dark mode", "real brief features win over a template's own pills");
  assert(!copy.isSample, "real feature-derived pills are not sample");
}

{
  const copy = widgetCopy({ ...base, kind: "copy", widget: "pills" });
  assert(copy.isSample, "no pills and no real features — sample");
}

console.log("widget-copy.test ok");
