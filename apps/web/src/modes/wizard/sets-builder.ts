/** OWNER: modes/wizard — multi-set generator */
import { clip, type InferenceBrief, type ProjectSet } from "@take/core";
import { buildCopy } from "./copy-builder";
import { buildFrames } from "./frames-builder";

const CONCEPT_NAMES: [string, string][] = [
  ["Signal Cut", "Editorial · Direct"],
  ["Morning Edge", "Warm · Ritual"],
  ["Hard Proof", "Bold · Evidence"],
  ["Quiet Lead", "Minimal · Soft"],
  ["Velocity", "Playful · Motion"],
];

const PALETTES = [
  ["#ff4d1a", "#0c0d10", "#f3f1ec", "#3de0ff", "#1e2129"],
  ["#6dffb0", "#0a1210", "#e8fff4", "#ffc857", "#14201c"],
  ["#3de0ff", "#0b1018", "#eef6ff", "#ff4d1a", "#151c28"],
  ["#f3f1ec", "#111111", "#ff4d1a", "#888888", "#222222"],
  ["#ffc857", "#14110c", "#fff8e8", "#ff4d1a", "#2a2418"],
];

export type GenerateSetsOptions = {
  /** Prefer captured scan colors for set 0 when present */
  seedPalette?: string[];
};

function guidanceBlurb(inf: InferenceBrief, i: number): string {
  const base = [
    "Hook → proof → close as a linked sequence.",
    "Warm ritual narrative across the rail.",
    "Evidence-led frames with bold type hierarchy.",
    "Sparse layouts. Maximum breathing room.",
    "Kinetic crop and playful pacing.",
  ][i % 5];
  const bits: string[] = [base];
  if (inf.tone) bits.push(`Tone: ${clip(inf.tone, 60)}`);
  if (inf.ux) bits.push(`UX: ${clip(inf.ux, 60)}`);
  if (inf.refs) bits.push(`Structure refs: ${clip(inf.refs, 72)}`);
  if (inf.donot) bits.push(`Do not: ${clip(inf.donot, 60)}`);
  return bits.join(" · ");
}

export function generateSets(
  inf: InferenceBrief,
  qty: number,
  deviceId?: string,
  options: GenerateSetsOptions = {}
): ProjectSet[] {
  const frameCount = inf.platform === "both" ? 8 : inf.platform === "android" ? 7 : 8;
  const rawSeed = (options.seedPalette || []).filter(Boolean);
  const seed =
    rawSeed.length > 0
      ? [...rawSeed, ...PALETTES[0].filter((c) => !rawSeed.includes(c))].slice(0, 5)
      : null;
  return Array.from({ length: qty }, (_, i) => {
    const [name, styleLabel] = CONCEPT_NAMES[i % CONCEPT_NAMES.length];
    const palette = i === 0 && seed ? seed : PALETTES[i % PALETTES.length];
    const toneLabel = inf.tone ? ` · ${clip(inf.tone, 24)}` : "";
    return {
      id: `set-${Date.now()}-${i}`,
      name,
      styleLabel: `${styleLabel}${toneLabel}`,
      style: inf.style,
      blurb: guidanceBlurb(inf, i),
      frames: buildFrames(inf, i, frameCount),
      copy: buildCopy(inf, i),
      palette,
      deviceId,
    };
  });
}
