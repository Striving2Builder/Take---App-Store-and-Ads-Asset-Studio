/** OWNER: ad-grammar/wireframe-seeds — Video · Vertical (9:16 — Stories/Reels/Shorts/TikTok) */
import type { AdWireframe } from "../ad-zone.types";
import {
  videoSafeZone,
  endCardCenter,
  heroLandingStack,
  ribbonEdge,
  framedCard,
  bottomThirdPanel,
  badgeHeadCta,
  twoLineStackFlank,
  stackTopDown,
  minimalCtaOnly,
} from "../zone-patterns";

export function listVideoVerticalWireframes(): AdWireframe[] {
  const family = "video-vertical" as const;
  return [
    { id: "video-vertical-safe-zone-stack", name: "Safe-zone stack", family, zones: videoSafeZone(), source: "generated" },
    { id: "video-vertical-end-card-lockup", name: "End-card lockup", family, zones: endCardCenter(), source: "generated" },
    { id: "video-vertical-hero-landing-stack", name: "Hero landing stack", family, zones: heroLandingStack(), source: "generated" },
    { id: "video-vertical-bottom-cta-reserve-no-head", name: "Bottom CTA reserve, no head", family, zones: ribbonEdge("bottom", 0.24, { logo: true }), source: "generated" },
    { id: "video-vertical-framed-card-lower-third", name: "Framed card, lower third", family, zones: framedCard(0.7, 0.24), source: "generated" },
    { id: "video-vertical-bottom-third-panel", name: "Bottom-third panel", family, zones: bottomThirdPanel(), source: "generated" },
    { id: "video-vertical-badge-head-cta", name: "Badge + head + CTA", family, zones: badgeHeadCta(), source: "generated" },
    { id: "video-vertical-two-line-stack-cta", name: "Two-line stack + CTA", family, zones: twoLineStackFlank(), source: "generated" },
    { id: "video-vertical-top-down-stack", name: "Top-down stack", family, zones: stackTopDown(), source: "generated" },
    { id: "video-vertical-minimal-corner-cta", name: "Minimal corner + CTA", family, zones: minimalCtaOnly(), source: "generated" },
  ];
}
