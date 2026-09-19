/** OWNER: modes/wizard — multi-set generator */
import { clip, type InferenceBrief, type ProjectSet } from "@take/core";
import { getTemplates, isLayoutRecipe, type SavedTemplate } from "@take/storage";
import {
  bindRecipeShell,
  ensureIsolatedRecipe,
  hasRealLayout,
  recipeFromSaved,
  type StoreShell,
  type TemplateRecord,
} from "@take/template-engine";
import { isDraftTemplate } from "../../stages/library/library-filter";
import { DEFAULT_SEED, generatePalette, rotateHue } from "../../shared/palette-gen";
import { buildCopy } from "./copy-builder";
import { buildFrames } from "./frames-builder";

function isMobileTagged(tags: string[] | undefined, platform?: string): boolean {
  return (tags || []).includes("mobile") || platform === "mobile";
}

/** Finished (non-draft) catalog layouts for a store shell, shuffled once per
 *  generate call so a batch of concepts lands on different compositions
 *  instead of every wizard set falling back to one bare centered device per
 *  screen with no composition at all (see ensureIsolatedRecipe). */
function shuffledRecipePool(shell: StoreShell): SavedTemplate[] {
  const pool = getTemplates().filter(
    (t) =>
      isLayoutRecipe(t) &&
      !isDraftTemplate(t) &&
      (t.platform === shell || isMobileTagged(t.tags, t.platform))
  );
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/** Hydrate + shell-bind a catalog card. Frame count follows the recipe —
 *  forcing a 5-frame composition to a fixed 8-frame count would just pad the
 *  extra slots with the same bare fallback we're trying to get away from. */
function buildRecipe(chosen: SavedTemplate, shell: StoreShell, deviceId?: string): TemplateRecord | null {
  let recipe = recipeFromSaved({ ...chosen, layout: chosen.layout });
  if (!hasRealLayout(recipe)) return null;
  if (isMobileTagged(recipe.tags, chosen.platform)) {
    recipe = bindRecipeShell(recipe, shell);
  }
  return ensureIsolatedRecipe({ existing: recipe, frameCount: recipe.frameCount, deviceId });
}

const CONCEPT_NAMES: [string, string][] = [
  ["Signal Cut", "Editorial · Direct"],
  ["Morning Edge", "Warm · Ritual"],
  ["Hard Proof", "Bold · Evidence"],
  ["Quiet Lead", "Minimal · Soft"],
  ["Velocity", "Playful · Motion"],
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
  const fallbackFrameCount = inf.platform === "android" ? 7 : 8;
  const shell: StoreShell = inf.platform === "android" ? "android" : "ios";
  const pool = shuffledRecipePool(shell);
  // Ground every concept's palette in the user's real captured brand color
  // when one exists; each concept beyond the first explores a different,
  // still-related hue (real rotation, not a hardcoded per-index color) so
  // the concept cards stay visually distinct.
  const baseSeed = (options.seedPalette || []).find(Boolean) || DEFAULT_SEED;
  const hueStep = 360 / Math.max(1, qty);
  return Array.from({ length: qty }, (_, i) => {
    const [name, styleLabel] = CONCEPT_NAMES[i % CONCEPT_NAMES.length];
    const seed = i === 0 ? baseSeed : rotateHue(baseSeed, hueStep * i);
    const palette = generatePalette(seed);
    const toneLabel = inf.tone ? ` · ${clip(inf.tone, 24)}` : "";
    const recipe = pool.length ? buildRecipe(pool[i % pool.length], shell, deviceId) : null;
    const frameCount = recipe?.frameCount || fallbackFrameCount;
    const set: ProjectSet = {
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
    if (recipe) {
      set.composition = recipe.composition;
      set.layout = { composition: recipe.composition, recipe };
    }
    return set;
  });
}
