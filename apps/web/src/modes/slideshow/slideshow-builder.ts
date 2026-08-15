/** OWNER: modes/slideshow — ordered beats + default dwells (~15s) */
import type { InferenceBrief, ProjectSet } from "@take/core";
import { generateSets } from "../wizard/sets-builder";

export const SLIDE_ROLES = ["HOOK", "VALUE", "PROOF", "FEATURE", "SOCIAL", "CTA"] as const;

/** Default holds — sum 15000ms to match MediaRecorder target. */
export const DEFAULT_DWELLS_MS = [2500, 2200, 2500, 2200, 2000, 3600];

export function buildSlideshowSets(
  brief: InferenceBrief,
  opts?: { seedPalette?: string[]; deviceId?: string }
): ProjectSet[] {
  const sets = generateSets({ ...brief, mode: "slideshow" }, 1, opts?.deviceId, {
    seedPalette: opts?.seedPalette,
  });
  const set = sets[0];
  set.name = "Slideshow sequence";
  set.styleLabel = "Slideshow · ordered beats";
  set.blurb = "Storyboard with editable dwells. PNG stills + MediaRecorder motion.";
  set.frames = set.frames.slice(0, SLIDE_ROLES.length).map((f, i) => ({
    ...f,
    role: SLIDE_ROLES[i] || f.role,
    index: i,
    kicker: `${String(i + 1).padStart(2, "0")} · ${SLIDE_ROLES[i] || f.role}`,
    dwellMs: DEFAULT_DWELLS_MS[i] || 2000,
  }));
  return sets;
}

export function frameDwellMs(dwellMs: number | undefined, frameCount: number, fallbackTotal = 15000): number {
  if (dwellMs && dwellMs >= 400) return dwellMs;
  return Math.max(800, Math.floor(fallbackTotal / Math.max(1, frameCount)));
}
