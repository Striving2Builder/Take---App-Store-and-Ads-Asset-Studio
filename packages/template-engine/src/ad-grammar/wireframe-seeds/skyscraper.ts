/** OWNER: ad-grammar/wireframe-seeds — Skyscraper / Half Page (160×600 · 300×600) */
import type { AdWireframe } from "../ad-zone.types";
import {
  stackTopDown,
  heroLandingStack,
  framedCard,
  twoLineStackFlank,
  endCardCenter,
  ribbonEdge,
  badgeHeadCta,
  bottomThirdPanel,
  splitHalves,
  minimalCtaOnly,
} from "../zone-patterns";

export function listSkyscraperWireframes(): AdWireframe[] {
  const family = "skyscraper" as const;
  return [
    { id: "skyscraper-logo-image-cta-stack", name: "Logo · image · CTA stack", family, zones: stackTopDown(), source: "generated" },
    { id: "skyscraper-hero-landing-stack", name: "Hero landing stack", family, zones: heroLandingStack(), source: "generated" },
    { id: "skyscraper-framed-card-lower-third", name: "Framed card, lower third", family, zones: framedCard(0.62, 0.32), source: "generated" },
    { id: "skyscraper-two-line-stack-cta", name: "Two-line stack + CTA", family, zones: twoLineStackFlank(), source: "generated" },
    { id: "skyscraper-end-card-lockup", name: "End-card lockup", family, zones: endCardCenter(), source: "generated" },
    { id: "skyscraper-bottom-cta-ribbon", name: "Bottom CTA ribbon", family, zones: ribbonEdge("bottom", 0.22, { logo: true }), source: "generated" },
    { id: "skyscraper-badge-head-cta", name: "Badge + head + CTA", family, zones: badgeHeadCta(), source: "generated" },
    { id: "skyscraper-bottom-third-panel", name: "Bottom-third panel", family, zones: bottomThirdPanel(), source: "generated" },
    { id: "skyscraper-split-top-bottom-halves", name: "Split top/bottom halves", family, zones: splitHalves("right", 0.5), source: "generated" },
    { id: "skyscraper-minimal-image-cta", name: "Minimal image + CTA", family, zones: minimalCtaOnly(), source: "generated" },
  ];
}
