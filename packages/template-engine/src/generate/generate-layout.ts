/** OWNER: packages/template-engine — K-resample orchestrator
 * New layout stays Z-only devices. Yaw, type marks, and proof extras are authored
 * Library cards / inspector — generateLayout does not invent ratings or 3D.
 */
import type { TemplateRecord } from "../template.types";
import { validateLayout } from "../constraints/validate-layout";
import { loadGrammar, GRAMMAR_VERSION } from "../grammar/load-grammar";
import { newSeed, rngFromSeed } from "../rng/seed";
import { scoreLayout } from "../score/score-layout";
import { isolatedCenterFallback } from "./fallback";
import { resolveMetrics } from "./metrics";
import { placeIsolated } from "./place-isolated";
import { placeStrip } from "./place-strip";
import { planSet } from "./set-plan";
import type { GenerateInput } from "./types";

const K_DEFAULT = 12;

function candidate(
  seed: string,
  draw: number,
  input: GenerateInput
): { recipe: TemplateRecord; sliceW: number; sliceH: number } {
  const grammar = input.grammar || loadGrammar();
  const rng = rngFromSeed(`${seed}::${draw}`);
  const metrics =
    input.metrics ||
    resolveMetrics(input.deviceId, input.platform || "ios", input.orientation || "portrait");
  const plan = planSet(rng, grammar, input.shotCount, input.palette, input.composition);
  const devices =
    plan.composition === "strip"
      ? placeStrip(rng, grammar, plan.n, plan.bleedBudget, metrics)
      : placeIsolated(rng, grammar, plan.n, metrics);
  const recipe: TemplateRecord = {
    id: `gen-${seed}`,
    name: input.name || `Generated · ${plan.composition}`,
    tags: ["generated", plan.composition],
    version: 1,
    composition: plan.composition,
    deviceId: input.deviceId,
    defaultOrientation: input.orientation,
    frameCount: plan.n,
    typeFamily: plan.typeFamily,
    typeScale: plan.typeScale,
    background: plan.background,
    devices,
    palette: input.palette,
    lockBrand: input.lockBrand,
    provenance: {
      source: "generated",
      seed,
      grammarVersion: grammar.tokens.grammarVersion || GRAMMAR_VERSION,
    },
  };
  return { recipe, sliceW: metrics.sliceW, sliceH: metrics.sliceH };
}

export function generateLayout(input: GenerateInput): TemplateRecord {
  const seed = input.seed || newSeed();
  const k = input.k ?? K_DEFAULT;
  const grammar = input.grammar || loadGrammar();
  const metrics =
    input.metrics ||
    resolveMetrics(input.deviceId, input.platform || "ios", input.orientation || "portrait");
  const planRng = rngFromSeed(`${seed}::plan`);
  const plan = planSet(planRng, grammar, input.shotCount, input.palette, input.composition);
  // Decide composition ONCE per call, honoring the grammar's declared mix
  // (e.g. 58% strip / 42% isolated) — then only search jitter within that
  // one composition. Letting each of the K candidates re-roll its own
  // composition independently (the old behavior) turns "best of K" into an
  // unfair cross-composition contest: scoreLayout awards +14 for bleed
  // usage, which only strip candidates can ever earn, so a strip candidate
  // beats an isolated one on score almost every time regardless of jitter
  // luck. With K=12 draws, that meant isolated won only ~1.7% of calls in
  // practice — not its declared 42% — collapsing "5 generated layouts" into
  // near-identical strip variants differing mainly by background color.
  const forcedComposition = plan.composition;
  const candidateInput: GenerateInput = { ...input, composition: forcedComposition };

  let best: { recipe: TemplateRecord; score: number } | null = null;
  for (let draw = 0; draw < k; draw++) {
    const { recipe, sliceW, sliceH } = candidate(seed, draw, candidateInput);
    const check = validateLayout(recipe, sliceW, sliceH, metrics);
    if (!check.ok) continue;
    const score = scoreLayout(recipe, sliceW, sliceH);
    if (!best || score > best.score) best = { recipe, score };
  }
  if (best) return best.recipe;

  const fallbackPlan = { ...plan, composition: "isolated" as const, bleedBudget: 0 as const };
  return isolatedCenterFallback(fallbackPlan, metrics, seed, {
    deviceId: input.deviceId,
    orientation: input.orientation,
    palette: input.palette,
    name: input.name,
    lockBrand: input.lockBrand,
  });
}
