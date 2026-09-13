/** OWNER: stages/library — filter match tests */
import { libraryFilterMatch, isDraftTemplate } from "./library-filter";
import type { SavedTemplate } from "@take/storage";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const mobile: SavedTemplate = {
  id: "layout-stagger-crop-5",
  name: "Layout · stagger crop",
  tags: ["mobile", "layout"],
  platform: "mobile",
  kind: "system",
  style: "premium",
  frames: 5,
  updated: "2026-08-15",
};

const playStore: SavedTemplate = {
  id: "sys-play-isolated-8",
  name: "Play isolated 8",
  tags: ["android", "screenshots"],
  platform: "android",
  kind: "system",
  style: "premium",
  frames: 8,
  updated: "2026-08-15",
};

const iosStore: SavedTemplate = {
  id: "sys-ios-isolated-5",
  name: "iOS isolated 5",
  tags: ["ios", "screenshots"],
  platform: "ios",
  kind: "system",
  style: "premium",
  frames: 5,
  updated: "2026-08-15",
};

assert(libraryFilterMatch(mobile, "all"), "mobile in all");
assert(libraryFilterMatch(mobile, "mobile"), "mobile in mobile");
assert(libraryFilterMatch(mobile, "ios"), "mobile in ios filter");
assert(libraryFilterMatch(mobile, "android"), "mobile in android filter");
assert(!libraryFilterMatch(mobile, "mine"), "mobile not mine");

assert(libraryFilterMatch(playStore, "android"), "play in android");
assert(!libraryFilterMatch(playStore, "ios"), "play not in ios");
assert(!libraryFilterMatch(playStore, "mobile"), "play store not mobile pack");

assert(libraryFilterMatch(iosStore, "ios"), "ios store in ios");
assert(!libraryFilterMatch(iosStore, "android"), "ios store not android");

const draft: SavedTemplate = {
  ...iosStore,
  id: "seed-strip-bleed-hook",
  tags: ["strip", "bleed", "ios", "needs-polish"],
};
assert(isDraftTemplate(draft), "needs-polish tag marks a template as draft");
assert(!isDraftTemplate(iosStore), "no needs-polish tag is not a draft");
assert(!isDraftTemplate(mobile), "unrelated tags are not a draft");

console.log("library-filter.test ok");
