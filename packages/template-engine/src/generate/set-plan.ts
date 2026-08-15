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
  const colorA = palette?.[1] || palette?.[0] || "#1a1030";
  const colorB = palette?.[0] || "#e07a3a";
  const background: BackgroundLayer =
    rng() > 0.35
      ? { kind: "gradient", colorA, colorB }
      : { kind: "solid", colorA };
  return { n, composition, typeFamily, typeScale, bleedBudget, background };
}
