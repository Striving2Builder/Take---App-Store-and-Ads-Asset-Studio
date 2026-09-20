/** OWNER: packages/template-engine — result types for reading a layout from a screenshot.
 *
 *  Every reading carries a status so the UI can say what it measured, what it
 *  only estimated, and what it could not read at all — never a silent guess. */

/** measured = read straight from pixels; estimated = inferred from what was
 *  visible (a stated assumption); unreadable = not read, nothing is claimed;
 *  vision = supplied by a vision model, not measured. */
export type ReadStatus = "measured" | "estimated" | "unreadable" | "vision";

export type Finding = {
  /** e.g. "Panels", "Panel 2 · background" */
  scope: string;
  status: ReadStatus;
  detail: string;
};

export type BackgroundRead = {
  kind: "solid" | "gradient" | "unreadable";
  /** Best colour even when unreadable (mean of what was sampled) — palette use only. */
  colorA: string;
  colorB?: string;
  status: ReadStatus;
  note?: string;
};

export type DeviceRead = {
  /** Centre and width as fractions of the panel (may fall outside 0-1 when cropped). */
  cx: number;
  cy: number;
  w: number;
  /** Clockwise degrees from upright. */
  rotationDeg: number;
  clipped: boolean;
  /** This device crosses into the next panel. */
  spansNext: boolean;
  status: ReadStatus;
  note?: string;
};

export type PanelRead = {
  index: number;
  /** Pixel range in the analysed (downscaled) image. */
  x0: number;
  x1: number;
  bg: BackgroundRead;
  devices: DeviceRead[];
  /** Shapes that were found but could not be separated or identified as one phone. */
  unresolved: string[];
  textBand: "top" | "bottom" | "split" | "none" | "unknown";
  cropped: boolean;
};

export type SplitMethod = "gutters" | "aspect" | "manual" | "single";

export type Analysis = {
  source: { width: number; height: number };
  analysed: { width: number; height: number };
  splitMethod: SplitMethod;
  panels: PanelRead[];
  findings: Finding[];
};

export const PHONE_ASPECT = 2.1641;
