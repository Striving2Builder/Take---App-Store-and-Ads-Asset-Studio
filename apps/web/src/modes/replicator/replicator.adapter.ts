/** OWNER: modes/replicator — competitor-aware structure (uploads optional) */
import type { CreationMode } from "@take/modes-sdk";
import { scanApp } from "@take/scan-client";
import { buildReplicatorSets } from "./replicator-builder";
import { replicatorInspectorPlugin, replicatorReviewPlugin } from "./replicator.plugin";

export const replicatorMode: CreationMode = {
  id: "replicator",
  label: "Replicator",
  capabilities: {
    needsUrl: false,
    needsUploads: false,
    supportsStorySequence: true,
    supportsVideo: false,
    supportsTrace: true,
  },
  validateIntake() {
    return [];
  },
  async run(input, ctx) {
    const brief = ctx.priorBrief
      ? { ...ctx.priorBrief, mode: "replicator" as const }
      : (await scanApp(input)).brief;
    const sets = buildReplicatorSets(brief, {
      pack: ctx.lastPack,
      uploadCount: input.uploads,
      seedPalette: ctx.seedPalette,
      deviceId: ctx.deviceId,
    });
    return { inference: { ...brief, mode: "replicator" }, sets };
  },
  getEditorPlugins: () => [replicatorReviewPlugin, replicatorInspectorPlugin],
  getExportHints: () => ({}),
};
