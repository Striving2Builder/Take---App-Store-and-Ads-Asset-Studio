/** OWNER: packages/template-engine — public API */
export type {
  TemplateRecord,
  CompositionKind,
  DeviceInstance,
  DevicePlacement,
  BackgroundLayer,
  LayoutProvenance,
  TypeFamily,
  TypeScale,
} from "./template.types";
export type { GenerateInput, DeviceMetrics } from "./generate/types";
export type { Grammar, GrammarTokens, GrammarProductions } from "./grammar/tokens";
export { refreshVariantId, refreshCopy } from "./variant";
export { batchFromTemplate } from "./batch";
export { applyTemplate } from "./apply/apply-template";
export type { ApplyTemplateInput, ApplyTemplateResult } from "./apply/apply-template";
export { mapShotsToFrames } from "./apply/map-shots";
export { recipeFromSaved } from "./apply/from-saved";
export type { RecipeSource } from "./apply/from-saved";
export { listSeedRecipes, STRIP_BLEED_HOOK } from "./seeds/strip-bleed-hook";
export {
  sliceRect,
  worldSize,
  intersectArea,
  deviceAabb,
  screenAabb,
  type Rect,
} from "./constraints/aabb";
export { toWorldInstance } from "./constraints/world";
export { visibleFrac, slicesTouched, bleedLegal, MIN_VISIBLE_FRAC } from "./constraints/bleed";
export { hitDevice, pointHitsDevice } from "./constraints/hit-device";
export { moveDevice, resizeDevice, rotateDevice, type ResizeCorner } from "./constraints/transform-device";
export { typeBandRect } from "./constraints/type-band";
export { validateLayout } from "./constraints/validate-layout";
export type { ValidateLayoutResult } from "./constraints/validate-layout";
export { scoreLayout } from "./score/score-layout";
export { generateLayout } from "./generate/generate-layout";
export { loadGrammar, GRAMMAR_VERSION } from "./grammar/load-grammar";
export { clampFrameCount } from "./generate/set-plan";
export { resolveMetrics } from "./generate/metrics";
