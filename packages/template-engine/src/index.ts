/** OWNER: packages/template-engine — public API */
export type {
  TemplateRecord,
  CompositionKind,
  DeviceInstance,
  DevicePlacement,
  BackgroundLayer,
  ExtraSlot,
  ExtraKind,
  ExtraShape,
  ExtraWidget,
  ExtraFace,
  ImageFit,
  LayoutProvenance,
  TypeFamily,
  TypeScale,
  TypeBandKind,
} from "./template.types";
export { EXTRA_SHAPES, EXTRA_WIDGETS, EXTRA_FACES, hasRealLayout } from "./template.types";
export type { GenerateInput, DeviceMetrics } from "./generate/types";
export type { Grammar, GrammarTokens, GrammarProductions } from "./grammar/tokens";
export { refreshVariantId, refreshCopy } from "./variant";
export { applyTemplate } from "./apply/apply-template";
export type { ApplyTemplateInput, ApplyTemplateResult } from "./apply/apply-template";
export { mapShotsToFrames } from "./apply/map-shots";
export { recipeFromSaved } from "./apply/from-saved";
export type { RecipeSource } from "./apply/from-saved";
export { listSeedRecipes, listSystemRecipes, STRIP_BLEED_HOOK } from "./seeds/load-recipes";
export {
  applyShellBind,
  bindRecipeShell,
  defaultShellDeviceId,
  forAndroid,
  listAndroidLayoutPorts,
  shellAspect,
  storeShellFromPlatform,
  IOS,
  IOS_ASPECT,
  PLAY,
  PLAY_ASPECT,
  type StoreShell,
} from "./seeds/layout-android-port";
export {
  sliceRect,
  worldSize,
  backgroundDestSize,
  intersectArea,
  deviceAabb,
  screenAabb,
  type Rect,
} from "./constraints/aabb";
export {
  ensureIsolatedRecipe,
  applyStripPanorama,
  extrasInSlice,
  MAX_EXTRAS_PER_SLICE,
} from "./ensure-isolated";
export { MAX_DEVICES_PER_SLICE } from "./constraints/limits";
export { addExtraSlot } from "./extras/add-extra";
export { parseCopyMarks, stripCopyMarks } from "./extras/copy-marks";
export type { CopyMark, CopyRun } from "./extras/copy-marks";
export {
  widgetCopy,
  SAMPLE_SCORE_TEXT,
  SAMPLE_STORE_LABEL,
  SAMPLE_QUOTE,
  SAMPLE_ATTRIBUTION,
  SAMPLE_PILLS,
} from "./extras/widget-copy";
export { hitExtra } from "./extras/hit-extra";
export { moveExtra, resizeExtra, rotateExtra } from "./extras/transform-extra";
export { toWorldInstance } from "./constraints/world";
export { visibleFrac, slicesTouched, bleedLegal, MIN_VISIBLE_FRAC } from "./constraints/bleed";
export { hitDevice, pointHitsDevice } from "./constraints/hit-device";
export { moveDevice, resizeDevice, rotateDevice, type ResizeCorner } from "./constraints/transform-device";
export { typeBandRect, typeBandForSlice, setSliceTypeBand } from "./constraints/type-band";
export { blobPoints, wavePoints, starPoints, scribblePoints, dotCenters, pointsForShape } from "./extras/shape-path";
export { validateLayout } from "./constraints/validate-layout";
export type { ValidateLayoutResult } from "./constraints/validate-layout";
export {
  applyPlacementPreset,
  deviceOnSlice,
  PLACEMENT_PRESETS,
  MAX_BLEEDS,
  type PlacementPresetId,
  type ApplyPlacementResult,
} from "./presets/apply-placement";
export {
  addDeviceOnSlice,
  removeLocalDevicesOnSlice,
  stampFan3OnSlice,
  setInstanceOrientation,
  type SliceDeviceResult,
} from "./presets/slice-devices";
export {
  hasPerspective,
  instanceAabb,
  instanceScreenAabb,
  projectDeviceBox,
  pointInQuad,
  warpStrips,
  lerpPt,
  DEFAULT_DEPTH,
} from "./project/perspective";
export type { Quad, Pt2, ProjectedBox, ProjectedFace } from "./project/perspective";
export { scoreLayout } from "./score/score-layout";
export { generateLayout } from "./generate/generate-layout";
export { loadGrammar, GRAMMAR_VERSION } from "./grammar/load-grammar";
export { clampFrameCount } from "./generate/set-plan";
export { resolveMetrics } from "./generate/metrics";

// Ad grammar (Phase 7 — Ads mode) — structure-only wireframes, not phone placements
export type { AdZoneKind, AdZone, AdWireframe, AdUnitFamily } from "./ad-grammar/ad-zone.types";
export {
  listAdWireframes,
  getAdWireframe,
  wireframesForFamily,
} from "./ad-grammar/list-ad-wireframes";
