/** OWNER: ad-grammar/wireframe-seeds — Leaderboard (728×90 · 970×90), desktop web */
import type { AdWireframe } from "../ad-zone.types";
import {
  logoHeadCta,
  ribbonEdge,
  sequentialStrip,
  splitHalves,
  tickerBar,
  badgeHeadCta,
  twoLineStackFlank,
  symmetricFlank,
  minimalCtaOnly,
} from "../zone-patterns";

export function listLeaderboardWireframes(): AdWireframe[] {
  const family = "leaderboard" as const;
  return [
    { id: "leaderboard-logo-head-cta", name: "Logo · Head · CTA", family, zones: logoHeadCta(0.14), source: "generated" },
    { id: "leaderboard-full-image-end-cta", name: "Full image, end CTA", family, zones: ribbonEdge("right", 0.24, { logo: true }), source: "generated" },
    { id: "leaderboard-two-benefit-sequence", name: "Two-benefit sequence", family, zones: sequentialStrip(), source: "generated" },
    { id: "leaderboard-bottom-cta-ribbon", name: "Bottom CTA ribbon", family, zones: ribbonEdge("bottom", 0.42, { logo: true, headlineInRibbon: true }), source: "generated" },
    { id: "leaderboard-split-block-image", name: "Split block / image", family, zones: splitHalves("right", 0.42), source: "generated" },
    { id: "leaderboard-ticker-fixed-cta", name: "Ticker + fixed CTA", family, zones: tickerBar(), source: "generated" },
    { id: "leaderboard-badge-head-cta", name: "Badge + head + CTA", family, zones: badgeHeadCta(), source: "generated" },
    { id: "leaderboard-stacked-two-line-cta", name: "Stacked two-line + CTA", family, zones: twoLineStackFlank(), source: "generated" },
    { id: "leaderboard-symmetric-flank-cta", name: "Symmetric flank CTA", family, zones: symmetricFlank(), source: "generated" },
    { id: "leaderboard-minimal-image-cta", name: "Minimal image + CTA", family, zones: minimalCtaOnly(), source: "generated" },
  ];
}
