/**
 * OWNER: packages/scan-client — merge-pack unit checks (run: npx tsx packages/scan-client/src/merge-pack.test.ts)
 */
import {
  buildScanPack,
  emptyCapture,
  capturedField,
  missingField,
} from "./index";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const primary = emptyCapture({ inputUrl: "https://apps.apple.com/x", adapter: "apple" });
primary.ok = true;
primary.fields.name = missingField();

const competitor = emptyCapture({ inputUrl: "https://play.google.com/x", adapter: "play" });
competitor.ok = true;
competitor.extensions = { sourceRole: "competitor" };
competitor.fields.name = capturedField("COMPETITOR", "play");
competitor.assets = [
  { id: "1", kind: "icon", url: "https://example.com/i.png", provenance: "captured" },
];

const packComp = buildScanPack({ primary, sources: [competitor], locale: "en-US" });
assert(packComp.merged.fields.name.value == null, "competitor must not fill brand name");
assert(packComp.merged.assets.length === 0, "competitor assets must stay out");

const mkt = emptyCapture({ inputUrl: "https://example.com", adapter: "og" });
mkt.ok = true;
mkt.extensions = { sourceRole: "marketing" };
mkt.fields.name = capturedField("From Site", "og");
mkt.assets = [
  { id: "m1", kind: "icon", url: "https://example.com/icon.png", provenance: "captured" },
];

const packMkt = buildScanPack({ primary, sources: [mkt], locale: "en-US" });
assert(packMkt.merged.fields.name.value === "From Site", "marketing fills missing name");
assert(packMkt.merged.assets.some((a) => a.kind === "icon"), "marketing icon fills");

console.log("merge-pack.test.ts OK");
