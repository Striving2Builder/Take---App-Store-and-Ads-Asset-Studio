/** OWNER: packages/core — generated concept set */
import type { StoryFrame } from "./frame";
import type { StoreCopy } from "./store-copy";
import type { AdCopy } from "./ad-copy";

export type ProjectSet = {
  id: string;
  name: string;
  styleLabel: string;
  style: string;
  blurb: string;
  frames: StoryFrame[];
  copy: StoreCopy;
  palette: string[];
  deviceId?: string;
  /** isolated = one canvas per PNG; strip = shared world clipped per slice */
  composition?: "isolated" | "strip";
  /** Layout recipe snapshot for strip/isolated paint (TemplateRecord JSON) */
  layout?: {
    composition: "isolated" | "strip";
    recipe: unknown;
  };
  /** Ads mode: one message across N ad units (see StoryFrame.adUnitId) — not App Store/Play metadata */
  adCopy?: AdCopy;
  /** Display/body font pairing — applied to headline+kicker (display) and
   *  caption+CTA (body) in both the live DOM preview and the PNG export
   *  canvas. Absent means the app's own default stack (Manrope/system-ui). */
  typography?: { display: string; body: string };
  /** Canvas-render mode: true = every device in this set's layout recipe
   *  gets a real yaw/depth (paintProjected's perspective path); false/absent
   *  = flat (paintFlat), the app's original behavior. */
  render3d?: boolean;
};
