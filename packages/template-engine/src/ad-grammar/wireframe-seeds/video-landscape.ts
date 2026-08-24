/** OWNER: ad-grammar/wireframe-seeds — Video · Landscape (16:9, in-stream/CTV) */
import type { AdWireframe } from "../ad-zone.types";
import {
  videoSafeZone,
  endCardCenter,
  framedCard,
  bottomThirdPanel,
  splitHalves,
  ribbonEdge,
  badgeHeadCta,
  diagonalSplit,
  minimalCtaOnly,
  heroLandingStack,
} from "../zone-patterns";

export function listVideoLandscapeWireframes(): AdWireframe[] {
  const family = "video-landscape" as const;
  return [
    { id: "video-landscape-corner-logo-lower-third", name: "Corner logo, lower-third", family, zones: videoSafeZone(), source: "generated" },
    { id: "video-landscape-end-card-lockup", name: "End-card lockup", family, zones: endCardCenter(), source: "generated" },
    { id: "video-landscape-framed-card-overlay", name: "Framed card overlay", family, zones: framedCard(0.66, 0.28), source: "generated" },
    { id: "video-landscape-bottom-third-panel", name: "Bottom-third panel", family, zones: bottomThirdPanel(), source: "generated" },
    { id: "video-landscape-split-block-image", name: "Split block / image", family, zones: splitHalves("left", 0.36), source: "generated" },
    { id: "video-landscape-bottom-cta-ribbon", name: "Bottom CTA ribbon", family, zones: ribbonEdge("bottom", 0.16, { logo: true, headlineInRibbon: true }), source: "generated" },
    { id: "video-landscape-badge-head-cta", name: "Badge + head + CTA", family, zones: badgeHeadCta(), source: "generated" },
    { id: "video-landscape-diagonal-feel-split", name: "Diagonal-feel split", family, zones: diagonalSplit(), source: "generated" },
    { id: "video-landscape-minimal-corner-cta", name: "Minimal corner + CTA", family, zones: minimalCtaOnly(), source: "generated" },
    { id: "video-landscape-hero-landing-stack", name: "Hero landing stack", family, zones: heroLandingStack(), source: "generated" },
  ];
}
