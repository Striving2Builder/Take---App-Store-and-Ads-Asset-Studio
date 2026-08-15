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
};
