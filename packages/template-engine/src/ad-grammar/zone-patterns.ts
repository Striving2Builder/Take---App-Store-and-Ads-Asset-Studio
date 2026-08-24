/** OWNER: packages/template-engine/ad-grammar — reusable zone-pattern generators
 *  Each function returns fractional zones (0..1 of the unit's own W×H). One pattern is
 *  reused across families with family-appropriate parameters — same "grammar generates many
 *  concrete instances" idea as the phone placement tokens, adapted to ad-native composition. */
import type { AdZone, AdZoneKind } from "./ad-zone.types";

function Z(kind: AdZoneKind, x: number, y: number, w: number, h: number): AdZone {
  return { kind, x, y, w, h };
}

const bg = (): AdZone => Z("image", 0, 0, 1, 1);

export function ribbonEdge(
  edge: "bottom" | "right",
  ribbonFrac: number,
  opts: { logo?: boolean; headlineInRibbon?: boolean } = {}
): AdZone[] {
  const r = ribbonFrac;
  const zones: AdZone[] = [bg()];
  if (edge === "bottom") {
    zones.push(Z("cta", 0, 1 - r, 1, r));
    if (opts.logo) zones.push(Z("logo", 0.015, 1 - r + r * 0.18, 0.11, r * 0.64));
    if (opts.headlineInRibbon) zones.push(Z("headline", 0.14, 1 - r + r * 0.18, 0.58, r * 0.64));
  } else {
    zones.push(Z("cta", 1 - r, 0, r, 1));
    if (opts.logo) zones.push(Z("logo", 0.02, 0.34, 0.1, 0.32));
  }
  return zones;
}

export function logoHeadCta(padY = 0.15): AdZone[] {
  return [
    bg(),
    Z("logo", 0.015, padY, 0.115, 1 - 2 * padY),
    Z("headline", 0.15, padY + 0.06, 0.58, 1 - 2 * padY - 0.12),
    Z("cta", 0.76, padY, 0.225, 1 - 2 * padY),
  ];
}

export function stackTopDown(): AdZone[] {
  return [
    bg(),
    Z("logo", 0.06, 0.05, 0.28, 0.09),
    Z("headline", 0.08, 0.58, 0.84, 0.14),
    Z("body", 0.08, 0.735, 0.84, 0.09),
    Z("cta", 0.14, 0.855, 0.72, 0.1),
  ];
}

export function imageBottomRightCta(): AdZone[] {
  return [
    bg(),
    Z("logo", 0.05, 0.05, 0.22, 0.11),
    Z("headline", 0.06, 0.2, 0.6, 0.16),
    Z("cta", 0.58, 0.78, 0.37, 0.15),
  ];
}

export function splitHalves(side: "left" | "right" = "right", frac = 0.46): AdZone[] {
  const textX = side === "right" ? 0 : 1 - frac;
  const imgX = side === "right" ? frac : 0;
  return [
    Z("image", imgX, 0, 1 - frac, 1),
    Z("logo", textX + 0.08, 0.08, frac - 0.16, 0.1),
    Z("headline", textX + 0.08, 0.28, frac - 0.16, 0.22),
    Z("body", textX + 0.08, 0.53, frac - 0.16, 0.14),
    Z("cta", textX + 0.08, 0.74, frac - 0.3, 0.13),
  ];
}

export function framedCard(cardY = 0.6, cardH = 0.34): AdZone[] {
  return [
    bg(),
    Z("panel", 0.06, cardY, 0.88, cardH),
    Z("logo", 0.11, cardY + cardH * 0.16, 0.16, cardH * 0.34),
    Z("headline", 0.32, cardY + cardH * 0.12, 0.4, cardH * 0.4),
    Z("cta", 0.74, cardY + cardH * 0.28, 0.2, cardH * 0.42),
  ];
}

export function diagonalSplit(): AdZone[] {
  return [
    bg(),
    Z("headline", 0.08, 0.62, 0.6, 0.14),
    Z("cta", 0.08, 0.8, 0.34, 0.12),
    Z("logo", 0.08, 0.08, 0.24, 0.1),
  ];
}

export function sequentialStrip(): AdZone[] {
  return [
    bg(),
    Z("logo", 0.02, 0.22, 0.06, 0.56),
    Z("body", 0.09, 0.28, 0.22, 0.44),
    Z("logo", 0.33, 0.22, 0.06, 0.56),
    Z("body", 0.4, 0.28, 0.22, 0.44),
    Z("cta", 0.68, 0.16, 0.3, 0.68),
  ];
}

export function endCardCenter(): AdZone[] {
  return [
    bg(),
    Z("logo", 0.38, 0.14, 0.24, 0.16),
    Z("headline", 0.14, 0.42, 0.72, 0.16),
    Z("cta", 0.3, 0.66, 0.4, 0.16),
    Z("legal", 0.2, 0.87, 0.6, 0.06),
  ];
}

export function videoSafeZone(): AdZone[] {
  return [
    bg(),
    Z("logo", 0.05, 0.045, 0.2, 0.08),
    Z("headline", 0.1, 0.2, 0.8, 0.1),
    Z("cta", 0.24, 0.78, 0.52, 0.11),
    Z("legal", 0.28, 0.92, 0.44, 0.045),
  ];
}

export function feedSafeZone(padY = 0.15): AdZone[] {
  return [
    Z("image", 0, padY, 1, 1 - 2 * padY),
    Z("logo", 0.08, padY + 0.06, 0.18, 0.1),
    Z("headline", 0.08, 1 - padY - 0.22, 0.84, 0.13),
    Z("cta", 0.32, 1 - padY + 0.03, 0.36, 0.09),
  ];
}

export function twoLineStackFlank(): AdZone[] {
  return [
    bg(),
    Z("logo", 0.01, 0.16, 0.1, 0.68),
    Z("headline", 0.13, 0.1, 0.55, 0.38),
    Z("body", 0.13, 0.54, 0.55, 0.34),
    Z("cta", 0.74, 0.16, 0.24, 0.68),
  ];
}

export function symmetricFlank(): AdZone[] {
  return [
    bg(),
    Z("cta", 0.015, 0.2, 0.19, 0.6),
    Z("logo", 0.4, 0.15, 0.2, 0.7),
    Z("cta", 0.795, 0.2, 0.19, 0.6),
  ];
}

export function badgeHeadCta(): AdZone[] {
  return [
    bg(),
    Z("badge", 0.03, 0.16, 0.22, 0.24),
    Z("headline", 0.28, 0.24, 0.42, 0.24),
    Z("cta", 0.75, 0.2, 0.22, 0.6),
  ];
}

export function minimalCtaOnly(): AdZone[] {
  return [bg(), Z("cta", 0.62, 0.14, 0.36, 0.72), Z("logo", 0.03, 0.14, 0.24, 0.72)];
}

export function heroLandingStack(): AdZone[] {
  return [
    bg(),
    Z("logo", 0.08, 0.06, 0.3, 0.06),
    Z("headline", 0.08, 0.5, 0.84, 0.13),
    Z("body", 0.08, 0.65, 0.84, 0.09),
    Z("cta", 0.14, 0.78, 0.72, 0.1),
    Z("legal", 0.2, 0.91, 0.6, 0.05),
  ];
}

export function bottomThirdPanel(): AdZone[] {
  return [
    bg(),
    Z("panel", 0, 0.66, 1, 0.34),
    Z("logo", 0.06, 0.72, 0.24, 0.1),
    Z("headline", 0.06, 0.83, 0.64, 0.1),
    Z("cta", 0.74, 0.72, 0.2, 0.21),
  ];
}

export function tickerBar(): AdZone[] {
  return [bg(), Z("headline", 0.04, 0.2, 0.66, 0.6), Z("cta", 0.75, 0.14, 0.22, 0.72)];
}
