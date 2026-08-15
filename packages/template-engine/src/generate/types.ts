/** OWNER: packages/template-engine — generateLayout input */
import type { CompositionKind } from "../template.types";
import type { Grammar } from "../grammar/tokens";

export type DeviceMetrics = {
  sliceW: number;
  sliceH: number;
  /** Shell height / width — device h in slice-widths = w * shellAspect */
  shellAspect: number;
  /** Catalog screenInset as fractions of shell (0–1) */
  inset: { x: number; y: number; w: number; h: number };
};

export type GenerateInput = {
  deviceId: string;
  orientation?: "portrait" | "landscape";
  platform?: string;
  shotCount: number;
  seed?: string;
  palette?: string[];
  name?: string;
  lockBrand?: boolean;
  composition?: CompositionKind;
  metrics?: DeviceMetrics;
  /** Test hook — inject grammar (e.g. illegal tokens) */
  grammar?: Grammar;
  k?: number;
};
