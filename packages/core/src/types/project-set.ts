/** OWNER: packages/core — generated concept set */
import type { StoryFrame } from "./frame";
import type { StoreCopy } from "./store-copy";

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
};
