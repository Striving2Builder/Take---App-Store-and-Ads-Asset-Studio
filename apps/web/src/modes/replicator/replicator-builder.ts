/** OWNER: modes/replicator — structure set from competitor beats / upload refs */
import type { InferenceBrief, ProjectSet } from "@take/core";
import { generateSets } from "../wizard/sets-builder";
import { kickerFor } from "../wizard/frames-builder";
import {
  competitorBeatsFromPack,
  replicatorFrameCount,
  type CompetitorBeat,
} from "./competitor-beats";
import type { ModePackSlice } from "@take/modes-sdk";

export const TRACE_ROLES = ["HOOK", "PROBLEM", "SHIFT", "PROOF", "FEATURE", "CTA"];

export function buildReplicatorSets(
  brief: InferenceBrief,
  opts: {
    pack?: ModePackSlice | null;
    uploadCount: number;
    seedPalette?: string[];
    deviceId?: string;
  }
): ProjectSet[] {
  const beats = competitorBeatsFromPack(opts.pack);
  const n = replicatorFrameCount(beats, opts.uploadCount);
  const sets = generateSets({ ...brief, mode: "replicator" }, 1, opts.deviceId, {
    seedPalette: opts.seedPalette,
  });
  const set = sets[0];
  set.name = "Replicator trace";
  set.styleLabel = beats.length
    ? "Replicator · competitor structure"
    : "Replicator · from uploads";
  const names = beats.map((b) => b.label).join(", ");
  const shotN = beats.reduce((x, b) => x + b.screenshotCount, 0);
  set.blurb = beats.length
    ? `Structure from ${names}${shotN ? ` · ${shotN} listing shots` : ""} — copy and pixels from your scan, not theirs.`
    : `Mapped ${Math.max(1, opts.uploadCount)} upload ref(s) into a frame rail.`;

  if (set.frames.length > n) set.frames = set.frames.slice(0, n);
  while (set.frames.length < n) {
    const i = set.frames.length;
    set.frames.push({
      ...set.frames[0],
      id: `rep-${Date.now()}-${i}`,
      index: i,
      role: TRACE_ROLES[i % TRACE_ROLES.length],
      kicker: "",
      headline: beatHeadline(brief, beats, i),
      caption: brief.value,
    });
  }
  set.frames.forEach((f, i) => {
    f.index = i;
    f.role = TRACE_ROLES[i % TRACE_ROLES.length];
    f.kicker = kickerFor(f.role, brief);
    if (beats.length) f.headline = beatHeadline(brief, beats, i);
  });
  return sets;
}

function beatHeadline(brief: InferenceBrief, beats: CompetitorBeat[], i: number): string {
  const b = beats[i % Math.max(1, beats.length)];
  if (!b) return `Beat ${i + 1}`;
  return i === 0 ? `${brief.name} vs ${b.label}` : `Beat ${i + 1} · ${b.label}`;
}
