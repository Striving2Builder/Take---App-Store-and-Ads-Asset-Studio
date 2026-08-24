/** OWNER: ad-grammar/wireframe-seeds — Pinterest Standard Pin (2:3, 1080×1620)
 *  Same aspect ratio as the Mobile Interstitial family (320:480 = 2:3), so the same
 *  safe-zone logic legitimately applies — reused deliberately, not duplicated blindly. */
import type { AdWireframe } from "../ad-zone.types";
import {
  heroLandingStack,
  stackTopDown,
  framedCard,
  bottomThirdPanel,
  endCardCenter,
  splitHalves,
  badgeHeadCta,
  ribbonEdge,
  diagonalSplit,
  twoLineStackFlank,
} from "../zone-patterns";

export function listPinterestWireframes(): AdWireframe[] {
  const family = "pinterest" as const;
  return [
    { id: "pinterest-hero-landing-stack", name: "Hero landing stack", family, zones: heroLandingStack(), source: "generated" },
    { id: "pinterest-top-down-stack", name: "Top-down stack", family, zones: stackTopDown(), source: "generated" },
    { id: "pinterest-framed-card-lower-half", name: "Framed card, lower half", family, zones: framedCard(0.5, 0.42), source: "generated" },
    { id: "pinterest-bottom-third-panel", name: "Bottom-third panel", family, zones: bottomThirdPanel(), source: "generated" },
    { id: "pinterest-end-card-lockup", name: "End-card lockup", family, zones: endCardCenter(), source: "generated" },
    { id: "pinterest-split-top-bottom", name: "Split top/bottom", family, zones: splitHalves("right", 0.5), source: "generated" },
    { id: "pinterest-badge-head-cta", name: "Badge + head + CTA", family, zones: badgeHeadCta(), source: "generated" },
    { id: "pinterest-bottom-cta-ribbon", name: "Bottom CTA ribbon", family, zones: ribbonEdge("bottom", 0.2, { logo: true }), source: "generated" },
    { id: "pinterest-diagonal-feel-split", name: "Diagonal-feel split", family, zones: diagonalSplit(), source: "generated" },
    { id: "pinterest-two-line-stack-cta", name: "Two-line stack + CTA", family, zones: twoLineStackFlank(), source: "generated" },
  ];
}
