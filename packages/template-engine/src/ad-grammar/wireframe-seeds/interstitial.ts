/** OWNER: ad-grammar/wireframe-seeds — Mobile Interstitial / Square (320×480 · 250×250) */
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

export function listInterstitialWireframes(): AdWireframe[] {
  const family = "interstitial" as const;
  return [
    { id: "interstitial-hero-landing-stack", name: "Hero landing stack", family, zones: heroLandingStack(), source: "generated" },
    { id: "interstitial-top-down-stack", name: "Top-down stack", family, zones: stackTopDown(), source: "generated" },
    { id: "interstitial-framed-card-lower-half", name: "Framed card, lower half", family, zones: framedCard(0.5, 0.42), source: "generated" },
    { id: "interstitial-bottom-third-panel", name: "Bottom-third panel", family, zones: bottomThirdPanel(), source: "generated" },
    { id: "interstitial-end-card-lockup", name: "End-card lockup", family, zones: endCardCenter(), source: "generated" },
    { id: "interstitial-split-top-bottom", name: "Split top/bottom", family, zones: splitHalves("right", 0.5), source: "generated" },
    { id: "interstitial-badge-head-cta", name: "Badge + head + CTA", family, zones: badgeHeadCta(), source: "generated" },
    { id: "interstitial-bottom-cta-ribbon", name: "Bottom CTA ribbon", family, zones: ribbonEdge("bottom", 0.2, { logo: true }), source: "generated" },
    { id: "interstitial-diagonal-feel-split", name: "Diagonal-feel split", family, zones: diagonalSplit(), source: "generated" },
    { id: "interstitial-two-line-stack-cta", name: "Two-line stack + CTA", family, zones: twoLineStackFlank(), source: "generated" },
  ];
}
