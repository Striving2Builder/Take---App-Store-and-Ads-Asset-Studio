/** OWNER: packages/template-engine/ad-grammar — aggregate all ad wireframes */
import type { AdWireframe, AdUnitFamily } from "./ad-zone.types";
import { listLeaderboardWireframes } from "./wireframe-seeds/leaderboard";
import { listBillboardWireframes } from "./wireframe-seeds/billboard";
import { listMpuWireframes } from "./wireframe-seeds/mpu";
import { listSkyscraperWireframes } from "./wireframe-seeds/skyscraper";
import { listMobileBannerWireframes } from "./wireframe-seeds/mobile-banner";
import { listInterstitialWireframes } from "./wireframe-seeds/interstitial";
import { listVideoLandscapeWireframes } from "./wireframe-seeds/video-landscape";
import { listVideoVerticalWireframes } from "./wireframe-seeds/video-vertical";
import { listSocialFeedWireframes } from "./wireframe-seeds/social-feed";
import { listPinterestWireframes } from "./wireframe-seeds/pinterest";

/** Geometry-only wireframes. No competitor screenshots, logos, or copied ad creative —
 *  same rule as the phone screenshot layout-refs pack. */
export function listAdWireframes(): AdWireframe[] {
  return [
    ...listLeaderboardWireframes(),
    ...listBillboardWireframes(),
    ...listMpuWireframes(),
    ...listSkyscraperWireframes(),
    ...listMobileBannerWireframes(),
    ...listInterstitialWireframes(),
    ...listVideoLandscapeWireframes(),
    ...listVideoVerticalWireframes(),
    ...listSocialFeedWireframes(),
    ...listPinterestWireframes(),
  ];
}

export function getAdWireframe(id: string): AdWireframe | undefined {
  return listAdWireframes().find((w) => w.id === id);
}

export function wireframesForFamily(family: AdUnitFamily): AdWireframe[] {
  return listAdWireframes().filter((w) => w.family === family);
}
