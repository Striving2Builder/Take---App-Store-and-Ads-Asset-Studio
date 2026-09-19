/** OWNER: packages/template-engine — step 1 set plan */
import type { BackgroundLayer, CompositionKind, TypeFamily, TypeScale } from "../template.types";
import type { Grammar } from "../grammar/tokens";
import { lerp, pickWeighted } from "../rng/seed";

export type SetPlan = {
  n: number;
  composition: CompositionKind;
  typeFamily: TypeFamily;
  typeScale: TypeScale;
  bleedBudget: 0 | 1 | 2;
  background: BackgroundLayer;
};

export function clampFrameCount(shotCount: number): number {
  const n = shotCount > 0 ? shotCount : 5;
  return Math.min(10, Math.max(5, n));
}

export function planSet(
  rng: () => number,
  grammar: Grammar,
  shotCount: number,
  palette: string[] | undefined,
  forced?: CompositionKind
): SetPlan {
  const n = clampFrameCount(shotCount);
  const composition = (forced ||
    pickWeighted(rng, grammar.productions.composition)) as CompositionKind;
  const typeFamily = pickWeighted(rng, grammar.productions.typeFamily) as TypeFamily;
  const typeScale = pickWeighted(rng, grammar.productions.typeScale) as TypeScale;
  const bleedBudget = (
    composition === "strip" ? Number(pickWeighted(rng, grammar.productions.bleedBudget)) : 0
  ) as 0 | 1 | 2;
  // colorA stays the dark "ink" stop (matches the app's standing dark-canvas
  // convention elsewhere), but colorB used to be pinned to palette[0] on
  // every single draw — meaning every generated layout for a given scan
  // shared the exact same 2 hex values. `palette` arrives in two different
  // real shapes depending on caller: Wizard passes generatePalette()'s
  // 5-slot harmony array ([accent, ink, paper, secondaryAccent,
  // tertiaryAccent]); Template/Library mode passes the raw, dominance-sorted
  // scan-extracted icon swatches (arbitrary length, no semantic slots) — so
  // picking fixed indices (e.g. [0], [3], [4]) silently collapses to one
  // option again for the second shape. Instead, treat every defined swatch
  // that isn't the exact one used for colorA as a valid colorB candidate —
  // correct for either shape, and for whatever real color data actually
  // exists (never invents a color that wasn't captured/generated).
  const colorA = palette?.[1] || palette?.[0] || "#1a1030";
  const otherSwatches = (palette || []).filter((c): c is string => !!c && c !== colorA);
  const colorB = otherSwatches.length
    ? otherSwatches[Math.floor(rng() * otherSwatches.length)]
    : "#e07a3a";
  const background: BackgroundLayer =
    rng() > 0.35
      ? { kind: "gradient", colorA, colorB }
      : { kind: "solid", colorA };
  return { n, composition, typeFamily, typeScale, bleedBudget, background };
}
