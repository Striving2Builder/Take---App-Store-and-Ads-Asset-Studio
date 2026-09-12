/** OWNER: modes/ads — build native ad creative set from uploads + selected ad units */
import { clip } from "@take/core";
import type { AdCopy, InferenceBrief, ProjectSet, StoryFrame } from "@take/core";
import { getAdUnit } from "@take/ad-unit-catalog";
import { wireframesForFamily } from "@take/template-engine";
import { goalCta, leadWithName } from "../wizard/copy-builder";

const PALETTE = ["#ff4d1a", "#0c0d10", "#f3f1ec", "#3de0ff", "#1e2129"];
const DEFAULT_AD_UNIT_ID = "iab.mpu-300x250";

export function buildAdCopy(brief: InferenceBrief): AdCopy {
  const valueLine = brief.value || brief.positioning || `${brief.name} for ${brief.category}`.trim();
  return {
    headline: clip(brief.name ? leadWithName(brief.name, valueLine, ": ") : valueLine, 60),
    description: clip(brief.narrative || brief.value || brief.positioning || "", 160),
    cta: goalCta(brief.goal),
    clickThroughUrl: "",
    advertiserName: brief.name || "",
    legalLine: "",
    regulatedCategory: "none",
    jurisdiction: "us",
  };
}

function buildFrame(adUnitId: string, i: number, copy: AdCopy): StoryFrame {
  const unit = getAdUnit(adUnitId);
  const wireframe = unit ? wireframesForFamily(unit.family)[0] : undefined;
  return {
    id: `ad-${Date.now()}-${i}`,
    index: i,
    role: "ad",
    kicker: unit?.label || adUnitId,
    headline: copy.headline,
    caption: copy.description,
    cta: copy.cta,
    adUnitId,
    wireframeId: wireframe?.id,
  };
}

export function buildAdSets(
  brief: InferenceBrief,
  selectedAdUnitIds: string[],
  opts: { seedPalette?: string[] } = {}
): ProjectSet[] {
  const ids = selectedAdUnitIds.length ? selectedAdUnitIds : [DEFAULT_AD_UNIT_ID];
  const rawSeed = (opts.seedPalette || []).filter(Boolean);
  const palette =
    rawSeed.length > 0 ? [...rawSeed, ...PALETTE.filter((c) => !rawSeed.includes(c))].slice(0, 5) : PALETTE;
  const copy = buildAdCopy(brief);
  const frames = ids.map((id, i) => buildFrame(id, i, copy));

  return [
    {
      id: `adset-${Date.now()}`,
      name: "Ad set",
      styleLabel: "Ads · native IAB composition",
      style: brief.style,
      blurb: `${ids.length} ad unit${ids.length === 1 ? "" : "s"} — headline, CTA, and logo composed per size, not a resized screenshot.`,
      frames,
      copy: {
        iosTitle: clip(copy.headline, 30),
        iosSubtitle: clip(copy.description, 30),
        iosPromo: clip(copy.description, 170),
        iosKeywords: "",
        playTitle: clip(copy.headline, 30),
        playShort: clip(copy.description, 80),
        playFull: copy.description,
        cta: copy.cta,
      },
      palette,
      adCopy: copy,
    },
  ];
}

export { DEFAULT_AD_UNIT_ID };
