/** OWNER: modes/replicator — maps uploads into frame sequence */
import type { CreationMode } from "@take/modes-sdk";
import { scanApp } from "@take/scan-client";
import { generateSets } from "../wizard/sets-builder";

export const replicatorMode: CreationMode = {
  id: "replicator",
  label: "Replicator",
  capabilities: {
    needsUrl: false,
    needsUploads: true,
    supportsStorySequence: true,
    supportsVideo: false,
    supportsTrace: true,
  },
  validateIntake(input) {
    const missing: string[] = [];
    if (input.uploads === 0) missing.push("Upload wireframe / screenshot refs required");
    return missing;
  },
  async run(input, ctx) {
    const brief = ctx.priorBrief
      ? { ...ctx.priorBrief, mode: "replicator" as const }
      : (await scanApp(input)).brief;
    const uploadCount = Math.max(1, input.uploads);
    const sets = generateSets({ ...brief, mode: "replicator" }, 1, undefined, {
      seedPalette: ctx.seedPalette,
    });
    const set = sets[0];
    set.name = "Replicator trace";
    set.styleLabel = "Replicator · from uploads";
    set.blurb = `Mapped ${uploadCount} upload(s) into a frame rail — structure from refs, copy from scan/brief.`;
    const n = Math.min(12, Math.max(3, uploadCount));
    if (set.frames.length > n) set.frames = set.frames.slice(0, n);
    while (set.frames.length < n) {
      const i = set.frames.length;
      set.frames.push({
        ...set.frames[0],
        id: `rep-${Date.now()}-${i}`,
        index: i,
        role: "PROOF",
        kicker: `${String(i + 1).padStart(2, "0")} · REF`,
        headline: `Beat from upload ${i + 1}`,
        caption: brief.value,
      });
    }
    set.frames.forEach((f, i) => {
      f.index = i;
      f.kicker = `${String(i + 1).padStart(2, "0")} · TRACE`;
    });
    return { inference: { ...brief, mode: "replicator" }, sets };
  },
};
