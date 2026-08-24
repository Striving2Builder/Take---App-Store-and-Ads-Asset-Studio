/** OWNER: ad-grammar/wireframe-seeds — Mobile Banner (320×50 · 300×50 · 320×100) */
import type { AdWireframe } from "../ad-zone.types";
import {
  logoHeadCta,
  ribbonEdge,
  twoLineStackFlank,
  symmetricFlank,
  badgeHeadCta,
  minimalCtaOnly,
  tickerBar,
  splitHalves,
} from "../zone-patterns";

export function listMobileBannerWireframes(): AdWireframe[] {
  const family = "mobile-banner" as const;
  return [
    { id: "mobile-banner-logo-head-cta", name: "Logo · Head · CTA", family, zones: logoHeadCta(0.1), source: "generated" },
    { id: "mobile-banner-cta-only-ribbon", name: "CTA-only ribbon", family, zones: ribbonEdge("right", 0.32, { logo: true }), source: "generated" },
    { id: "mobile-banner-text-only-cta", name: "Text-only + CTA", family, zones: twoLineStackFlank(), source: "generated" },
    { id: "mobile-banner-symmetric-flank-cta", name: "Symmetric flank CTA", family, zones: symmetricFlank(), source: "generated" },
    { id: "mobile-banner-full-width-cta-bar", name: "Full-width CTA bar", family, zones: ribbonEdge("bottom", 0.62, { logo: true, headlineInRibbon: true }), source: "generated" },
    { id: "mobile-banner-badge-cta", name: "Badge + CTA", family, zones: badgeHeadCta(), source: "generated" },
    { id: "mobile-banner-minimal-image-cta", name: "Minimal image + CTA", family, zones: minimalCtaOnly(), source: "generated" },
    { id: "mobile-banner-ticker-fixed-cta", name: "Ticker + fixed CTA", family, zones: tickerBar(), source: "generated" },
    { id: "mobile-banner-split-block-image", name: "Split block / image", family, zones: splitHalves("right", 0.38), source: "generated" },
    { id: "mobile-banner-logo-center-dual-cta", name: "Logo-center, dual CTA", family, zones: symmetricFlank(), source: "generated" },
  ];
}
