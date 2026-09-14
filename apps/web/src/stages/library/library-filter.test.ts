/** OWNER: stages/library — filter match tests */
import {
  libraryFilterMatch,
  libraryCompositionMatch,
  libraryFrameCountMatch,
  isDraftTemplate,
} from "./library-filter";
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
  composition: "isolated",
  updated: "2026-08-15",
};

const stripStore: SavedTemplate = {
  id: "sys-ios-strip-8",
  name: "Strip · eight-up",
  tags: ["strip", "ios", "screenshots"],
  platform: "ios",
  kind: "system",
  style: "premium",
  frames: 8,
  composition: "strip",
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

assert(libraryCompositionMatch(iosStore, "all"), "all composition matches everything");
assert(libraryCompositionMatch(iosStore, "isolated"), "isolated matches isolated card");
assert(!libraryCompositionMatch(iosStore, "strip"), "isolated card doesn't match strip filter");
assert(libraryCompositionMatch(stripStore, "strip"), "strip matches strip card");
assert(!libraryCompositionMatch(stripStore, "isolated"), "strip card doesn't match isolated filter");

assert(libraryFrameCountMatch(iosStore, "all"), "all frame count matches everything");
assert(libraryFrameCountMatch(iosStore, "5"), "5-frame card matches 5 filter");
assert(!libraryFrameCountMatch(iosStore, "8"), "5-frame card doesn't match 8 filter");
assert(libraryFrameCountMatch(stripStore, "8"), "8-frame card matches 8 filter");

console.log("library-filter.test ok");
