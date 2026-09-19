/** OWNER: packages/template-engine — load system recipes from catalogs (explicit Vite imports) */
import type { TemplateRecord } from "../template.types";

import seed_strip_bleed_hook from "../../../../catalogs/templates/2026.08/recipes/seed-strip-bleed-hook.json";
import sys_ios_isolated_5 from "../../../../catalogs/templates/2026.08/recipes/sys-ios-isolated-5.json";
import sys_ios_isolated_10 from "../../../../catalogs/templates/2026.08/recipes/sys-ios-isolated-10.json";
import sys_play_isolated_8 from "../../../../catalogs/templates/2026.08/recipes/sys-play-isolated-8.json";
import sys_ios_strip_8 from "../../../../catalogs/templates/2026.08/recipes/sys-ios-strip-8.json";
import layout_stagger_crop_5 from "../../../../catalogs/templates/2026.08/recipes/layout-stagger-crop-5.json";
import layout_low_crop_5 from "../../../../catalogs/templates/2026.08/recipes/layout-low-crop-5.json";
import layout_two_up_mid_5 from "../../../../catalogs/templates/2026.08/recipes/layout-two-up-mid-5.json";
import layout_overlap_pair_5 from "../../../../catalogs/templates/2026.08/recipes/layout-overlap-pair-5.json";
import layout_blob_across_5 from "../../../../catalogs/templates/2026.08/recipes/layout-blob-across-5.json";
import layout_fan_3_5 from "../../../../catalogs/templates/2026.08/recipes/layout-fan-3-5.json";
import layout_proof_mid_5 from "../../../../catalogs/templates/2026.08/recipes/layout-proof-mid-5.json";
import layout_yaw_bleed_5 from "../../../../catalogs/templates/2026.08/recipes/layout-yaw-bleed-5.json";
import layout_type_marks_5 from "../../../../catalogs/templates/2026.08/recipes/layout-type-marks-5.json";
import layout_tilt_crop_5 from "../../../../catalogs/templates/2026.08/recipes/layout-tilt-crop-5.json";
import layout_proof_pills_5 from "../../../../catalogs/templates/2026.08/recipes/layout-proof-pills-5.json";
import layout_photo_span_5 from "../../../../catalogs/templates/2026.08/recipes/layout-photo-span-5.json";
import layout_yaw_extra_5 from "../../../../catalogs/templates/2026.08/recipes/layout-yaw-extra-5.json";
import layout_overlay_photo_5 from "../../../../catalogs/templates/2026.08/recipes/layout-overlay-photo-5.json";
import layout_chef_span_5 from "../../../../catalogs/templates/2026.08/recipes/layout-chef-span-5.json";
import layout_bleed_illust_5 from "../../../../catalogs/templates/2026.08/recipes/layout-bleed-illust-5.json";
import layout_yaw_stack_5 from "../../../../catalogs/templates/2026.08/recipes/layout-yaw-stack-5.json";
import layout_pano_yaw_5 from "../../../../catalogs/templates/2026.08/recipes/layout-pano-yaw-5.json";
import layout_proof_float_5 from "../../../../catalogs/templates/2026.08/recipes/layout-proof-float-5.json";
import layout_two_up_badge_5 from "../../../../catalogs/templates/2026.08/recipes/layout-two-up-badge-5.json";
import layout_trust_award_5 from "../../../../catalogs/templates/2026.08/recipes/layout-trust-award-5.json";
import layout_press_row_5 from "../../../../catalogs/templates/2026.08/recipes/layout-press-row-5.json";
import layout_fullbleed_raw_5 from "../../../../catalogs/templates/2026.08/recipes/layout-fullbleed-raw-5.json";
import layout_fullbleed_hook_5 from "../../../../catalogs/templates/2026.08/recipes/layout-fullbleed-hook-5.json";
import layout_hero_solid_5 from "../../../../catalogs/templates/2026.08/recipes/layout-hero-solid-5.json";
import layout_hero_award_badge_5 from "../../../../catalogs/templates/2026.08/recipes/layout-hero-award-badge-5.json";
import layout_dynamic_tilt_5 from "../../../../catalogs/templates/2026.08/recipes/layout-dynamic-tilt-5.json";
import layout_feature_ribbons_5 from "../../../../catalogs/templates/2026.08/recipes/layout-feature-ribbons-5.json";
import layout_peek_stack_5 from "../../../../catalogs/templates/2026.08/recipes/layout-peek-stack-5.json";
import layout_photo_claim_5 from "../../../../catalogs/templates/2026.08/recipes/layout-photo-claim-5.json";

const RAW: TemplateRecord[] = [
  seed_strip_bleed_hook,
  sys_ios_isolated_5,
  sys_ios_isolated_10,
  sys_play_isolated_8,
  sys_ios_strip_8,
  layout_stagger_crop_5,
  layout_low_crop_5,
  layout_two_up_mid_5,
  layout_overlap_pair_5,
  layout_blob_across_5,
  layout_fan_3_5,
  layout_proof_mid_5,
  layout_yaw_bleed_5,
  layout_type_marks_5,
  layout_tilt_crop_5,
  layout_proof_pills_5,
  layout_photo_span_5,
  layout_yaw_extra_5,
  layout_overlay_photo_5,
  layout_chef_span_5,
  layout_bleed_illust_5,
  layout_yaw_stack_5,
  layout_pano_yaw_5,
  layout_proof_float_5,
  layout_two_up_badge_5,
  layout_trust_award_5,
  layout_press_row_5,
  layout_fullbleed_raw_5,
  layout_fullbleed_hook_5,
  layout_hero_solid_5,
  layout_hero_award_badge_5,
  layout_dynamic_tilt_5,
  layout_feature_ribbons_5,
  layout_peek_stack_5,
  layout_photo_claim_5,
] as TemplateRecord[];

export const STRIP_BLEED_HOOK: TemplateRecord = RAW[0];

function cloneRecipe(r: TemplateRecord): TemplateRecord {
  return {
    ...r,
    devices: r.devices.map((d) => ({ ...d })),
    extras: r.extras?.map((e) => ({ ...e, pills: e.pills ? [...e.pills] : undefined })),
    background: { ...r.background },
    typeBand: r.typeBand ? [...r.typeBand] : undefined,
    palette: r.palette ? [...r.palette] : undefined,
    tags: [...(r.tags || [])],
  };
}

/** System store canvases + dual-store mobile geometry pack (one card each; shell via Edit toggle). */
export function listSystemRecipes(): TemplateRecord[] {
  return RAW.map(cloneRecipe);
}

/** Alias used by hydrate / bleed tests — same list as Library system cards. */
export function listSeedRecipes(): TemplateRecord[] {
  return listSystemRecipes();
}
