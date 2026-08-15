/** OWNER: packages/export-presets — fit-rect + plan-export tests */
import { fitRect } from "./fit-rect";
import { planExportFiles, planMatchesTargets, sizedPresetsHaveTargets } from "./plan-export";
import { allPresets, motionStretchTarget } from "./index";
import { defaultPresetIds, resolvePresetIds } from "./resolve-ids";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

{
  const cover = fitRect(100, 200, 50, 50, "cover");
  assert(cover.sx === 0 && cover.sw === 100, "cover crops height not width");
  assert(cover.sh === 100 && cover.sy === 50, "cover centers the crop");
  assert(cover.dx === 0 && cover.dw === 50 && cover.dh === 50, "cover fills dest");

  const contain = fitRect(100, 200, 50, 50, "contain");
  assert(contain.sx === 0 && contain.sy === 0 && contain.sw === 100 && contain.sh === 200, "contain uses full src");
  assert(contain.dw === 25 && contain.dh === 50, "contain letterboxes width");
  assert(contain.dx === 13 && contain.dy === 0, "contain centers letterbox");

  const wide = fitRect(200, 100, 50, 50, "contain");
  assert(wide.dw === 50 && wide.dh === 25 && wide.dy === 13, "wide contain letterboxes height");
}

{
  const rows = sizedPresetsHaveTargets();
  assert(rows.every((r) => r.ok), `every sized preset has numeric targets: ${JSON.stringify(rows.filter((r) => !r.ok))}`);
  const ig = allPresets().find((p) => p.id === "ig");
  assert(ig?.targets.some((t) => t.w === 1080 && t.h === 1350), "IG feed 1080×1350");
  assert(ig?.targets.some((t) => t.w === 1080 && t.h === 1920 && t.fit === "cover"), "IG story cover");
}

{
  const plan = planExportFiles({
    selectedIds: ["ios-screens", "play-screens", "ig", "iab", "ios-feature", "layered"],
    frameCount: 2,
    slug: "demo",
    store: { w: 1320, h: 2868, platform: "ios" },
    iosStore: { w: 1320, h: 2868 },
    playStore: { w: 1080, h: 2424 },
  });
  assert(plan.skippedFake.includes("layered"), "layered skipped");
  assert(!plan.motion, "slideshow not selected");
  assert(plan.files.some((f) => f.path === "screens/demo-01.png" && f.fit === "native" && f.w === 1320), "store SSOT");
  assert(plan.files.some((f) => f.path.startsWith("screens-play/") && f.w === 1080 && f.fit === "contain"), "F29 dual play folder");
  assert(plan.files.some((f) => f.path.includes("social/ig-feed/") && f.w === 1080 && f.h === 1350), "IG feed PNG");
  assert(plan.files.some((f) => f.path.includes("social/ig-story/") && f.fit === "cover"), "IG story cover");
  assert(plan.files.filter((f) => f.presetId === "ig").length === 4, "IG two targets × two frames");
  assert(plan.files.filter((f) => f.presetId === "iab").length === 3, "IAB three slots × frame 0");
  assert(plan.files.some((f) => f.path.includes("feature/ios-1024/") && f.w === 1024), "feature graphic");
}

{
  const none = planExportFiles({
    selectedIds: ["ig"],
    frameCount: 1,
    slug: "solo",
    store: { w: 1320, h: 2868, platform: "ios" },
    iosStore: { w: 1320, h: 2868 },
    playStore: { w: 1080, h: 2424 },
  });
  assert(!none.files.some((f) => f.path.startsWith("screens/")), "unchecked store emits nothing");
}

{
  const playOnly = planExportFiles({
    selectedIds: ["play-screens"],
    frameCount: 1,
    slug: "p",
    store: { w: 1320, h: 2868, platform: "ios" },
    iosStore: { w: 1320, h: 2868 },
    playStore: { w: 1080, h: 2424 },
  });
  assert(playOnly.files.some((f) => f.path.startsWith("screens/")), "play-only on iPhone still writes screens/");
  assert(playOnly.files.some((f) => f.path.startsWith("screens-play/")), "play-only on iPhone writes screens-play/");
}

{
  const yt = planExportFiles({
    selectedIds: ["yt", "pin"],
    frameCount: 3,
    slug: "mix",
    store: { w: 1320, h: 2868, platform: "ios" },
    iosStore: { w: 1320, h: 2868 },
    playStore: { w: 1080, h: 2424 },
  });
  assert(yt.files.filter((f) => f.presetId === "yt").length === 1, "yt emit:hero → frame 0 only");
  assert(yt.files.filter((f) => f.presetId === "pin").length === 3, "pin emit:per-frame → all frames");
  const drift = planMatchesTargets(yt);
  assert(drift.length === 0, `plan matches targets: ${drift.join("; ")}`);
}

{
  const stretch = motionStretchTarget("tiktok");
  assert(stretch?.w === 1080 && stretch.h === 1920 && stretch.fit === "cover", "tiktok stretch target");
  const known = allPresets().map((p) => p.id);
  const defaults = defaultPresetIds(allPresets());
  assert(defaults.includes("ios-screens") && defaults.includes("play-screens"), "defaultOn store presets");
  assert(
    resolvePresetIds({ session: ["ig"], stored: defaults, knownIds: known, defaults }).join() === "ig",
    "session wins"
  );
  assert(
    resolvePresetIds({ session: null, stored: ["iab"], knownIds: known, defaults }).join() === "iab",
    "stored wins over defaults"
  );
  assert(
    resolvePresetIds({ session: null, stored: [], knownIds: known, defaults }).length === 0,
    "empty stored is all-unchecked"
  );
  assert(
    resolvePresetIds({ session: ["nope"], stored: null, knownIds: known, defaults }).length === 0,
    "unknown ids dropped"
  );
}

console.log("export-presets.plan.test ok");
