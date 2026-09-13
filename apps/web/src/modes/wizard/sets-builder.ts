/** OWNER: modes/wizard — multi-set generator */
import { clip, type InferenceBrief, type ProjectSet } from "@take/core";
import { getTemplates, isLayoutRecipe, type SavedTemplate } from "@take/storage";
import {
  bindRecipeShell,
  ensureIsolatedRecipe,
  recipeFromSaved,
  type StoreShell,
  type TemplateRecord,
} from "@take/template-engine";
import { isDraftTemplate } from "../../stages/library/library-filter";
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
  if (!recipe.devices.length) return null;
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
  const fallbackFrameCount = inf.platform === "android" ? 7 : 8;
  const shell: StoreShell = inf.platform === "android" ? "android" : "ios";
  const pool = shuffledRecipePool(shell);
  const rawSeed = (options.seedPalette || []).filter(Boolean);
  const seed =
    rawSeed.length > 0
      ? [...rawSeed, ...PALETTES[0].filter((c) => !rawSeed.includes(c))].slice(0, 5)
      : null;
  return Array.from({ length: qty }, (_, i) => {
    const [name, styleLabel] = CONCEPT_NAMES[i % CONCEPT_NAMES.length];
    const palette = i === 0 && seed ? seed : PALETTES[i % PALETTES.length];
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
