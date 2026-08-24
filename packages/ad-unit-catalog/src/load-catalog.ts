/** OWNER: packages/ad-unit-catalog — load JSON SSOT from catalogs/ad-units */
import type { AdUnit } from "./ad-unit.types";
import { assertValidAdUnit } from "./validate-ad-unit";

import leaderboard_728x90 from "../../../catalogs/ad-units/leaderboard/iab.leaderboard-728x90.json";
import leaderboard_970x90 from "../../../catalogs/ad-units/leaderboard/iab.leaderboard-970x90.json";
import billboard_970x250 from "../../../catalogs/ad-units/billboard/iab.billboard-970x250.json";
import mpu_300x250 from "../../../catalogs/ad-units/mpu/iab.mpu-300x250.json";
import mpu_336x280 from "../../../catalogs/ad-units/mpu/iab.mpu-336x280.json";
import skyscraper_160x600 from "../../../catalogs/ad-units/skyscraper/iab.skyscraper-160x600.json";
import halfpage_300x600 from "../../../catalogs/ad-units/skyscraper/iab.halfpage-300x600.json";
import mobile_banner_320x50 from "../../../catalogs/ad-units/mobile-banner/iab.mobile-banner-320x50.json";
import mobile_banner_300x50 from "../../../catalogs/ad-units/mobile-banner/iab.mobile-banner-300x50.json";
import mobile_banner_320x100 from "../../../catalogs/ad-units/mobile-banner/iab.mobile-banner-320x100.json";
import interstitial_320x480 from "../../../catalogs/ad-units/interstitial/iab.interstitial-320x480.json";
import square_250x250 from "../../../catalogs/ad-units/interstitial/iab.square-250x250.json";

import video_landscape_16x9 from "../../../catalogs/ad-units/video-landscape/iab.video-landscape-16x9.json";
import youtube_instream_16x9 from "../../../catalogs/ad-units/video-landscape/youtube.instream-16x9.json";
import youtube_bumper_16x9 from "../../../catalogs/ad-units/video-landscape/youtube.bumper-16x9.json";

import video_vertical_9x16 from "../../../catalogs/ad-units/video-vertical/iab.video-vertical-9x16.json";
import tiktok_infeed_9x16 from "../../../catalogs/ad-units/video-vertical/tiktok.infeed-9x16.json";
import tiktok_topview_9x16 from "../../../catalogs/ad-units/video-vertical/tiktok.topview-9x16.json";
import meta_reels_9x16 from "../../../catalogs/ad-units/video-vertical/meta.reels-9x16.json";
import meta_stories_9x16 from "../../../catalogs/ad-units/video-vertical/meta.stories-9x16.json";
import youtube_shorts_9x16 from "../../../catalogs/ad-units/video-vertical/youtube.shorts-9x16.json";

import social_feed_4x5 from "../../../catalogs/ad-units/social-feed/iab.social-feed-4x5.json";
import social_feed_1x1 from "../../../catalogs/ad-units/social-feed/iab.social-feed-1x1.json";

import pinterest_standard_2x3 from "../../../catalogs/ad-units/pinterest/pinterest.standard-2x3.json";

const RAW: AdUnit[] = [
  leaderboard_728x90,
  leaderboard_970x90,
  billboard_970x250,
  mpu_300x250,
  mpu_336x280,
  skyscraper_160x600,
  halfpage_300x600,
  mobile_banner_320x50,
  mobile_banner_300x50,
  mobile_banner_320x100,
  interstitial_320x480,
  square_250x250,
  video_landscape_16x9,
  youtube_instream_16x9,
  youtube_bumper_16x9,
  video_vertical_9x16,
  tiktok_infeed_9x16,
  tiktok_topview_9x16,
  meta_reels_9x16,
  meta_stories_9x16,
  youtube_shorts_9x16,
  social_feed_4x5,
  social_feed_1x1,
  pinterest_standard_2x3,
] as AdUnit[];

/** Validated catalog pack (bundled via explicit imports for Vite). */
export function loadCatalogAdUnits(): AdUnit[] {
  for (const u of RAW) assertValidAdUnit(u);
  return RAW.map((u) => ({ ...u }));
}
