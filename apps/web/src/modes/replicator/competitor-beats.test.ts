/** OWNER: modes/replicator — competitor beat mapping tests */
import { competitorBeatsFromPack, replicatorFrameCount } from "./competitor-beats";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const pack = {
  sources: [
    {
      inputUrl: "https://example.com/comp",
      ok: true,
      fields: { name: { value: "Rival App" } },
      extensions: { sourceRole: "competitor" as const },
      assets: [
        { kind: "screenshot" },
        { kind: "screenshot" },
        { kind: "screenshot" },
        { kind: "icon" },
      ],
    },
    {
      inputUrl: "https://example.com/mkt",
      ok: true,
      fields: { name: { value: "Blog" } },
      extensions: { sourceRole: "marketing" as const },
      assets: [{ kind: "screenshot" }, { kind: "screenshot" }],
    },
  ],
};

const beats = competitorBeatsFromPack(pack);
assert(beats.length === 1, "only competitor sources");
assert(beats[0].label === "Rival App", "competitor name");
assert(beats[0].screenshotCount === 3, "screenshot count ignores icon");
assert(replicatorFrameCount(beats, 0) === 3, "frame count from competitor shots");
assert(replicatorFrameCount([], 8) === 8, "uploads fallback");
assert(replicatorFrameCount([], 0) === 6, "default 6");
assert(replicatorFrameCount([], 20) === 12, "cap 12");

const skipped = competitorBeatsFromPack({
  sources: [{ ok: false, extensions: { sourceRole: "competitor" }, assets: [{ kind: "screenshot" }] }],
});
assert(skipped.length === 0, "failed competitor omitted");

console.log("replicator competitor-beats.test ok");
