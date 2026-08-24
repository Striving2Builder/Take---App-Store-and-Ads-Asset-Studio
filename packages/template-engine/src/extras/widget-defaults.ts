/** OWNER: packages/template-engine — default fields for proof widgets / shapes */
import type { ExtraShape, ExtraSlot, ExtraWidget } from "../template.types";
import { SAMPLE_ATTRIBUTION, SAMPLE_PILLS, SAMPLE_QUOTE, SAMPLE_STORE_LABEL } from "./widget-copy";

export function widgetDefaults(widget: ExtraWidget): Partial<ExtraSlot> {
  if (widget === "rating") {
    return {
      storeLabel: SAMPLE_STORE_LABEL,
      stars: 5,
      w: 0.72,
      h: 0.18,
      y: 0.86,
      z: 22,
    };
  }
  if (widget === "review") {
    return {
      quote: SAMPLE_QUOTE,
      attribution: SAMPLE_ATTRIBUTION,
      stars: 5,
      text: SAMPLE_QUOTE,
      w: 0.78,
      h: 0.24,
      y: 0.42,
      z: 22,
    };
  }
  return {
    pills: [...SAMPLE_PILLS],
    text: SAMPLE_PILLS.join(", "),
    w: 0.82,
    h: 0.12,
    y: 0.2,
    z: 22,
  };
}

export function shapeDefaults(shape: ExtraShape): Partial<ExtraSlot> {
  return {
    shape,
    w: 0.58,
    h: 0.22,
    y: 0.16,
    z: 0,
    fill: "rgba(243,241,236,0.38)",
  };
}
