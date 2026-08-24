/** OWNER: ad-grammar/wireframe-seeds — Social Feed (4:5 preferred · 1:1) */
import type { AdWireframe } from "../ad-zone.types";
import {
  feedSafeZone,
  framedCard,
  heroLandingStack,
  endCardCenter,
  bottomThirdPanel,
  splitHalves,
  badgeHeadCta,
  diagonalSplit,
  stackTopDown,
  minimalCtaOnly,
} from "../zone-patterns";

export function listSocialFeedWireframes(): AdWireframe[] {
  const family = "social-feed" as const;
  return [
    { id: "social-feed-safe-zone-stack", name: "Safe-zone stack", family, zones: feedSafeZone(0.15), source: "generated" },
    { id: "social-feed-framed-card-centered", name: "Framed card, centered", family, zones: framedCard(0.6, 0.3), source: "generated" },
    { id: "social-feed-hero-landing-stack", name: "Hero landing stack", family, zones: heroLandingStack(), source: "generated" },
    { id: "social-feed-end-card-lockup", name: "End-card lockup", family, zones: endCardCenter(), source: "generated" },
    { id: "social-feed-bottom-third-panel", name: "Bottom-third panel", family, zones: bottomThirdPanel(), source: "generated" },
    { id: "social-feed-split-block-image", name: "Split block / image", family, zones: splitHalves("right", 0.46), source: "generated" },
    { id: "social-feed-badge-head-cta", name: "Badge + head + CTA", family, zones: badgeHeadCta(), source: "generated" },
    { id: "social-feed-diagonal-feel-split", name: "Diagonal-feel split", family, zones: diagonalSplit(), source: "generated" },
    { id: "social-feed-top-down-stack", name: "Top-down stack", family, zones: stackTopDown(), source: "generated" },
    { id: "social-feed-minimal-image-cta", name: "Minimal image + CTA", family, zones: minimalCtaOnly(), source: "generated" },
  ];
}
