/** OWNER: ad-grammar/wireframe-seeds — Medium Rectangle / MPU (300×250 · 336×280) */
import type { AdWireframe } from "../ad-zone.types";
import {
  imageBottomRightCta,
  stackTopDown,
  framedCard,
  splitHalves,
  diagonalSplit,
  badgeHeadCta,
  bottomThirdPanel,
  heroLandingStack,
  endCardCenter,
  minimalCtaOnly,
} from "../zone-patterns";

export function listMpuWireframes(): AdWireframe[] {
  const family = "mpu" as const;
  return [
    { id: "mpu-image-bottom-right-cta", name: "Image + bottom-right CTA", family, zones: imageBottomRightCta(), source: "generated" },
    { id: "mpu-top-down-stack", name: "Top-down stack", family, zones: stackTopDown(), source: "generated" },
    { id: "mpu-framed-card-on-image", name: "Framed card on image", family, zones: framedCard(0.58, 0.36), source: "generated" },
    { id: "mpu-split-block-image", name: "Split block / image", family, zones: splitHalves("right", 0.5), source: "generated" },
    { id: "mpu-diagonal-feel-split", name: "Diagonal-feel split", family, zones: diagonalSplit(), source: "generated" },
    { id: "mpu-badge-head-cta", name: "Badge + head + CTA", family, zones: badgeHeadCta(), source: "generated" },
    { id: "mpu-bottom-third-panel", name: "Bottom-third panel", family, zones: bottomThirdPanel(), source: "generated" },
    { id: "mpu-hero-landing-stack", name: "Hero landing stack", family, zones: heroLandingStack(), source: "generated" },
    { id: "mpu-end-card-lockup", name: "End-card lockup", family, zones: endCardCenter(), source: "generated" },
    { id: "mpu-minimal-image-cta", name: "Minimal image + CTA", family, zones: minimalCtaOnly(), source: "generated" },
  ];
}
