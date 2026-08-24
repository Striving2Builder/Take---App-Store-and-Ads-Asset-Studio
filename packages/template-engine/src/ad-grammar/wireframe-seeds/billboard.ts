/** OWNER: ad-grammar/wireframe-seeds — Billboard (970×250), desktop web */
import type { AdWireframe } from "../ad-zone.types";
import {
  heroLandingStack,
  framedCard,
  splitHalves,
  bottomThirdPanel,
  sequentialStrip,
  badgeHeadCta,
  diagonalSplit,
  symmetricFlank,
  endCardCenter,
  ribbonEdge,
} from "../zone-patterns";

export function listBillboardWireframes(): AdWireframe[] {
  const family = "billboard" as const;
  return [
    { id: "billboard-logo-head-body-cta", name: "Logo · Head · Body · CTA", family, zones: heroLandingStack(), source: "generated" },
    { id: "billboard-framed-card-on-image", name: "Framed card on image", family, zones: framedCard(0.16, 0.68), source: "generated" },
    { id: "billboard-split-block-image", name: "Split block / image", family, zones: splitHalves("left", 0.42), source: "generated" },
    { id: "billboard-bottom-third-panel", name: "Bottom-third panel", family, zones: bottomThirdPanel(), source: "generated" },
    { id: "billboard-two-benefit-sequence", name: "Two-benefit sequence", family, zones: sequentialStrip(), source: "generated" },
    { id: "billboard-badge-head-cta", name: "Badge + head + CTA", family, zones: badgeHeadCta(), source: "generated" },
    { id: "billboard-diagonal-feel-split", name: "Diagonal-feel split", family, zones: diagonalSplit(), source: "generated" },
    { id: "billboard-symmetric-flank-cta", name: "Symmetric flank CTA", family, zones: symmetricFlank(), source: "generated" },
    { id: "billboard-end-card-lockup-wide", name: "End-card lockup, wide", family, zones: endCardCenter(), source: "generated" },
    { id: "billboard-bottom-cta-ribbon", name: "Bottom CTA ribbon", family, zones: ribbonEdge("bottom", 0.26, { logo: true, headlineInRibbon: true }), source: "generated" },
  ];
}
