/** OWNER: packages/core — intake form domain */
import type { ConversionGoal, CreationModeId, Platform, VisualStyle } from "./platform";

export type IntakeInput = {
  url: string;
  platform: Platform;
  mode: CreationModeId;
  qty: number;
  name: string;
  category: string;
  audience: string;
  locale: string;
  competitors: string;
  goal: ConversionGoal;
  style: VisualStyle;
  positioning: string;
  narrative: string;
  /** Context: where the product is used */
  where: string;
  /** Timing: when people open it */
  when: string;
  ux: string;
  tone: string;
  refs: string;
  donot: string;
  uploads: number;
};
